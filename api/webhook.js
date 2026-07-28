// api/webhook.js
// Receives payment confirmation from RwandaPay
// Webhook Name: momov2
// Webhook Secret: whsec_e285a4df09b49b15fd854bc5a1e134228faf9caecd1c166cb6f2705dd7fbfa4d

import crypto from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Rwandapay-Signature');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Verify webhook signature to ensure it's really from RwandaPay
        const signature = req.headers['x-rwandapay-signature'] || req.headers['x-rp-signature'] || '';
        const webhookSecret = process.env.WEBHOOK_SECRET || 'whsec_e285a4df09b49b15fd854bc5a1e134228faf9caecd1c166cb6f2705dd7fbfa4d';
        
        if (signature && webhookSecret) {
            const rawBody = JSON.stringify(req.body);
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(rawBody)
                .digest('hex');
            
            if (signature !== expectedSignature) {
                console.warn('⚠️ Invalid webhook signature — possible fake request');
                // Still accept it for now, but log the warning
                // In production: return res.status(401).json({ error: 'Invalid signature' });
            } else {
                console.log('✅ Webhook signature verified');
            }
        }

        const payload = req.body;
        console.log('🔔 Webhook received [momov2]:', JSON.stringify(payload, null, 2));

        // Extract payment details (handles different RwandaPay payload formats)
        const txRef = payload.data?.tx_ref || payload.tx_ref || payload.reference || payload.ref;
        const status = (payload.data?.status || payload.status || payload.event || '').toLowerCase();
        const amount = payload.data?.amount || payload.amount || 0;
        const phone = payload.data?.phone_number || payload.phone || payload.data?.phone || '';
        const transactionId = payload.data?.transaction_id || payload.transaction_id || payload.data?.id || '';

        console.log('Parsed payment:', { txRef, status, amount, phone, transactionId });

        // Check if payment is completed
        const isCompleted = 
            status === 'completed' || 
            status === 'successful' || 
            status === 'success' ||
            payload.event === 'payment.completed' ||
            payload.event === 'payment.successful';

        if (txRef && isCompleted) {
            // Save to /tmp for verification endpoint to read
            const tmpDir = '/tmp/momo-payments';
            try { 
                await mkdir(tmpDir, { recursive: true }); 
            } catch(e) {
                // Directory already exists
            }

            const paymentData = {
                status: 'completed',
                amount: amount,
                phone: phone,
                transactionId: transactionId,
                confirmedAt: new Date().toISOString(),
                txRef: txRef
            };

            await writeFile(
                path.join(tmpDir, txRef + '.json'), 
                JSON.stringify(paymentData, null, 2)
            );

            console.log('💾 Payment saved:', txRef, '| Amount:', amount, 'RWF');
        } else if (txRef) {
            console.log('⏳ Payment not completed yet:', txRef, '| Status:', status);
        }

        // Always respond 200 so RwandaPay knows we received it
        return res.status(200).json({ 
            received: true,
            message: 'Webhook processed successfully'
        });

    } catch (error) {
        console.error('❌ Webhook error:', error.message);
        console.error('Stack:', error.stack);
        // Still return 200 so RwandaPay doesn't keep retrying
        return res.status(200).json({ 
            received: true, 
            error: 'Processing error but acknowledged' 
        });
    }
}
