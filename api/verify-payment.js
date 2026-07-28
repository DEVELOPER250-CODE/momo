// api/verify-payment.js
// POST — Verifies payment status with RwandaPay

export default async function handler(req, res) {
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
        const { reference } = req.body;

        if (!reference) {
            return res.status(400).json({ error: 'Reference is required' });
        }

        const rwandaPayResponse = await fetch('https://api.rwandapay.rw/v1/payments/verify/' + reference, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + process.env.RWANDAPAY_API_KEY,
                'X-Secret-Key': process.env.RWANDAPAY_SECRET
            }
        });

        const data = await rwandaPayResponse.json();

        if (data.status === 'success' && data.data) {
            return res.status(200).json({
                verified: data.data.status === 'completed',
                status: data.data.status,
                amount: data.data.amount,
                phone: data.data.phone_number
            });
        } else {
            return res.status(200).json({
                verified: false,
                status: 'pending'
            });
        }

    } catch (error) {
        console.error('Verify payment error:', error);
        return res.status(500).json({ error: 'Verification failed' });
    }
}
