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
        const returnUrl = (req.headers.origin || 'https://momorw.vercel.app') + '/?status=successful&reference=' + txRef + '&amount=' + amount;
        const webhookUrl = 'https://momorw.vercel.app/api/webhook';

        const checkoutUrl = 'https://rwandapay.rw/payment?' + new URLSearchParams({
            amount: amount.toString(),
            phone: phone,
            name: name,
            ref: txRef,
            currency: 'RWF',
            description: 'MoMo Tester v2.0 - ' + (weeks || 0) + ' weeks free',
            return_url: returnUrl,
            webhook: webhookUrl,
            public_key: process.env.RWANDAPAY_PUBLIC_KEY || ''
        }).toString();

        return res.status(200).json({
            success: true,
            payment_url: checkoutUrl,
            reference: txRef
        });

    } catch (error) {
        return res.status(500).json({ error: 'Server error' });
    }
}
