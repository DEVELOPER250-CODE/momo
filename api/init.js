// api/init.js
// Calls RwandaPay /checkout/initialize and returns the payment URL

export default async function handler(req, res) {
    // CORS headers already set by vercel.json, but we keep them here for safety
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { amount, phone, name, email } = req.body;

        // Basic validation
        if (!amount || !phone || !name) {
            return res.status(422).json({ error: 'Amount, phone, and name are required' });
        }

        // Generate unique tx_ref
        const txRef = 'MOMOv2_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);

        // Your site's callback URL (where RwandaPay redirects after payment)
        const baseUrl = req.headers.origin || 'https://momorw.vercel.app';
        const redirectUrl = baseUrl + '/?status=successful&reference=' + txRef + '&amount=' + amount;

        // RwandaPay production base URL from docs
        const rwandaPayApi = 'https://pay.rwandapay.rw/api/v1/checkout/initialize';

        const response = await fetch(rwandaPayApi, {
            method: 'POST',
            headers: {
                'X-Public-Key': process.env.RWANDAPAY_PUBLIC_KEY,
                'X-Secret-Key': process.env.RWANDAPAY_SECRET_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amount,
                tx_ref: txRef,
                currency: 'RWF',
                customer: {
                    name: name,
                    email: email || phone + '@momo.rw',
                    phone: phone   // format: 0788123456 (RwandaPay expects local format)
                },
                redirect_url: redirectUrl,
                description: 'MoMo Payment Tester v2.0 – Inkunga'
            })
        });

        const data = await response.json();

        if (data.success) {
            return res.status(200).json({
                success: true,
                payment_url: data.data.payment_url,
                reference: txRef
            });
        } else {
            return res.status(400).json({
                success: false,
                error: data.message || 'Checkout initialization failed'
            });
        }

    } catch (error) {
        return res.status(500).json({ error: 'Server error: ' + error.message });
    }
}
