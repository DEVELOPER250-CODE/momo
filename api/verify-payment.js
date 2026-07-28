import { readFile } from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { reference } = req.body;
        if (!reference) return res.status(400).json({ error: 'Reference required' });

        // Check webhook storage
        try {
            const data = await readFile(path.join('/tmp/momo-payments', reference + '.json'), 'utf-8');
            const payment = JSON.parse(data);
            if (payment.status === 'completed') {
                return res.status(200).json({ verified: true, status: 'completed', amount: payment.amount });
            }
        } catch (e) {}

        // Fallback: check RwandaPay directly
        try {
            const rpRes = await fetch('https://api.rwandapay.rw/v1/payments/' + reference, {
                headers: { 'Authorization': 'Bearer ' + process.env.RWANDAPAY_SECRET_KEY }
            });
            const rpData = await rpRes.json();
            const s = (rpData.data?.status || rpData.status || '').toLowerCase();
            if (s === 'completed' || s === 'successful') {
                return res.status(200).json({ verified: true, status: 'completed' });
            }
            if (s === 'failed') {
                return res.status(200).json({ verified: false, status: 'failed' });
            }
        } catch (e) {}

        return res.status(200).json({ verified: false, status: 'pending' });

    } catch (error) {
        console.error('Verify error:', error.message);
        return res.status(500).json({ error: 'Verification failed' });
    }
}
