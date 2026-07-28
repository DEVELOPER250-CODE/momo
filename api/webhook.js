import crypto from 'crypto';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Rwandapay-Signature');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const signature = req.headers['x-rwandapay-signature'] || '';
        const secret = process.env.WEBHOOK_SECRET || '';

        if (signature && secret) {
            const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');
            if (signature !== expected) {
                console.warn('Invalid webhook signature');
            }
        }

        const { tx_ref, status, amount, phone_number, transaction_id } = 
            req.body.data || req.body;

        console.log('Webhook received:', { tx_ref, status, amount });

        if ((status === 'completed' || status === 'successful') && tx_ref) {
            try {
                const { writeFile, mkdir } = await import('fs/promises');
                const path = await import('path');
                const dir = '/tmp/momo-payments';
                await mkdir(dir, { recursive: true }).catch(() => {});
                await writeFile(
                    path.join(dir, tx_ref + '.json'),
                    JSON.stringify({ status: 'completed', amount, phone_number, transaction_id, at: new Date().toISOString() })
                );
                console.log('Payment saved:', tx_ref);
            } catch (e) {
                console.error('Save error:', e.message);
            }
        }

        return res.status(200).json({ received: true });

    } catch (error) {
        console.error('Webhook error:', error.message);
        return res.status(200).json({ received: true });
    }
}
