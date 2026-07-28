// api/verify-payment.js
// Frontend polls this to check if webhook confirmed the payment

import { readFile } from 'fs/promises';
import path from 'path';

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

        console.log('🔍 Checking payment status for:', reference);

        // Method 1: Check /tmp for webhook confirmation (fastest)
        try {
            const filePath = path.join('/tmp/momo-payments', reference + '.json');
            const fileData = await readFile(filePath, 'utf-8');
            const paymentData = JSON.parse(fileData);

            if (paymentData.status === 'completed') {
                console.log('✅ Found in webhook storage:', reference);
                return res.status(200).json({
                    verified: true,
                    status: 'completed',
                    amount: paymentData.amount,
                    phone: paymentData.phone,
                    transaction_id: paymentData.transactionId
                });
            }
        } catch (e) {
            // File not found — payment hasn't been confirmed by webhook yet
        }

        // Method 2: Query RwandaPay API directly (backup)
        try {
            const rpResponse = await fetch('https://api.rwandapay.rw/v1/payments/' + reference, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + process.env.RWANDAPAY_API_KEY,
                    'X-Secret-Key': process.env.RWANDAPAY_SECRET
                }
            });

            const rpData = await rpResponse.json();
            console.log('RwandaPay API response:', JSON.stringify(rpData));

            const rpStatus = (rpData.data?.status || rpData.status || '').toLowerCase();

            if (rpStatus === 'completed' || rpStatus === 'successful') {
                console.log('✅ Confirmed via RwandaPay API:', reference);
                
                // Also save to /tmp
                const tmpDir = '/tmp/momo-payments';
                const { mkdir, writeFile } = await import('fs/promises');
                try { await mkdir(tmpDir, { recursive: true }); } catch(e) {}
                await writeFile(
                    path.join(tmpDir, reference + '.json'),
                    JSON.stringify({
                        status: 'completed',
                        amount: rpData.data?.amount || rpData.amount,
                        confirmedAt: new Date().toISOString(),
                        txRef: reference,
                        source: 'api-check'
                    })
                );

                return res.status(200).json({
                    verified: true,
                    status: 'completed',
                    amount: rpData.data?.amount || rpData.amount
                });
            }

            if (rpStatus === 'failed' || rpStatus === 'cancelled') {
                console.log('❌ Payment failed:', reference);
                return res.status(200).json({
                    verified: false,
                    status: 'failed'
                });
            }
        } catch (e) {
            console.log('RwandaPay API check failed:', e.message);
        }

        // Still pending
        console.log('⏳ Payment still pending:', reference);
        return res.status(200).json({
            verified: false,
            status: 'pending'
        });

    } catch (error) {
        console.error('❌ Verify error:', error.message);
        return res.status(500).json({ error: 'Verification failed' });
    }
}
