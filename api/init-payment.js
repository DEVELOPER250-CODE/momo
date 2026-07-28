export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { amount, phone, name, weeks } = req.body;

        if (!amount || !phone || !name) {
            return res.status(400).json({ error: 'Amount, phone, and name required' });
        }

        const txRef = 'MOMOV2_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
        const webhookUrl = 'https://momorw.vercel.app/api/webhook';
        const returnUrl = (req.headers.origin || 'https://momorw.vercel.app') + '/?status=successful&reference=' + txRef + '&amount=' + amount;

        const body = JSON.stringify({
            amount: amount,
            phone_number: phone,
            currency: 'RWF',
            tx_ref: txRef,
            customer_name: name,
            description: 'MoMo Tester v2.0',
            payment_method: 'momo',
            webhook_url: webhookUrl,
            return_url: returnUrl
        });

        const response = await fetch('https://api.rwandapay.rw/v1/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.RWANDAPAY_SECRET_KEY
            },
            body: body
        });

        const text = await response.text();
        console.log('RwandaPay response:', response.status, text.substring(0, 500));

        let data;
        try { data = JSON.parse(text); } catch (e) {
            return res.status(502).json({ error: 'Invalid response from RwandaPay' });
        }

        if (data.status === 'success' || data.success) {
            return res.status(200).json({
                success: true,
                payment_url: data.data?.payment_url || data.payment_url || null,
                reference: txRef
            });
        }

        return res.status(400).json({ error: data.message || 'Payment failed' });

    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({ error: 'Server error' });
    }
}
