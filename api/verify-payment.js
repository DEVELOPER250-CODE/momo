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

        try {
            const filePath = path.join('/tmp/momo-payments', reference + '.json');
            const data = await readFile(filePath, 'utf-8');
            const payment = JSON.parse(data);
            if (payment.status === 'completed') {
                return res.status(200).json({ verified: true, status: 'completed', amount: payment.amount });
            }
        } catch (e) {}

        return res.status(200).json({ verified: false, status: 'pending' });

    } catch (error) {
        return res.status(500).json({ error: 'Verification failed' });
    }
}
