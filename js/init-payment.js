// api/init-payment.js
// POST — Initiates MoMo payment via RwandaPay

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { amount, phone, name, weeks, client_token } = req.body;

        // Validate
        if (!amount || !phone || !name) {
            return res.status(400).json({ error: 'Amount, phone, and name are required' });
        }

        const allowedAmounts = [3000, 5000, 7000, 10000, 20000];
        if (allowedAmounts.indexOf(amount) === -1) {
            return res.status(400).json({ error: 'Invalid contribution amount' });
        }

        // RwandaPay API call
        const txRef = 'MOMOV2_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);

        const rwandaPayResponse = await fetch('https://api.rwandapay.rw/v1/payments/initiate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.RWANDAPAY_API_KEY,
                'X-Secret-Key': process.env.RWANDAPAY_SECRET
            },
            body: JSON.stringify({
                amount: amount,
                phone_number: phone,
                currency: 'RWF',
                tx_ref: txRef,
                customer_name: name,
                description: 'MoMo Tester v2.0 - Inkunga (' + (weeks || 0) + ' weeks free)',
                payment_method: 'momo',
                return_url: req.headers.origin + '/?status=successful&reference=' + txRef + '&amount=' + amount,
                cancel_url: req.headers.origin + '/?status=failed'
            })
        });

        const data = await rwandaPayResponse.json();

        if (data.status === 'success' && data.data) {
            return res.status(200).json({
                success: true,
                payment_url: data.data.payment_url || null,
                reference: txRef,
                message: 'Payment initiated'
            });
        } else {
            return res.status(400).json({
                error: data.message || 'RwandaPay payment initiation failed'
            });
        }

    } catch (error) {
        console.error('Init payment error:', error);
        return res.status(500).json({ error: 'Server error. Please try again.' });
    }
}
