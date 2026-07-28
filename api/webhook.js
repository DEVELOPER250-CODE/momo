export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const body = req.body;
        console.log('Webhook received:', JSON.stringify(body));

        const txRef = body.data?.tx_ref || body.tx_ref || body.reference || body.ref || '';
        const status = (body.data?.status || body.status || body.event || '').toLowerCase();
        const amount = body.data?.amount || body.amount || 0;

        if (txRef && (status === 'completed' || status === 'successful' || status === 'success')) {
            const { writeFile, mkdir } = await import('fs/promises');
            const pathModule = await import('path');
            const dir = '/tmp/momo-payments';
            await mkdir(dir, { recursive: true }).catch(() => {});
            await writeFile(
                pathModule.join(dir, txRef + '.json'),
                JSON.stringify({ status: 'completed', amount: amount, confirmedAt: new Date().toISOString() })
            );
            console.log('Payment saved:', txRef, amount);
        }

        return res.status(200).json({ received: true });

    } catch (error) {
        return res.status(200).json({ received: true });
    }
}
