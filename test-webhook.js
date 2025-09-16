const axios = require('axios');

// Test webhook processing by simulating a Stripe checkout.session.completed event
async function testWebhook() {
    console.log('🧪 Testing Stripe webhook processing...');
    
    // Simulate a Stripe webhook payload for payment_intent.succeeded
    const webhookPayload = {
        id: 'evt_test_webhook',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
            object: {
                id: 'pi_test_123456789',
                object: 'payment_intent',
                amount: 299,
                currency: 'eur',
                status: 'succeeded',
                metadata: {
                    userId: '110061903752155691604',
                    tokens: '30'
                }
            }
        }
    };
    
    try {
        console.log('📤 Sending test webhook payload...');
        console.log('Payload:', JSON.stringify(webhookPayload, null, 2));
        
        // Send to webhook endpoint
        const response = await axios.post(
            'https://whisper-backend.larrieu-arnaud.workers.dev/stripe/webhook',
            webhookPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'stripe-signature': 'test_signature' // This will fail signature verification, but we can see the processing
                }
            }
        );
        
        console.log('✅ Webhook response:', response.status, response.data);
        
    } catch (error) {
        console.log('❌ Webhook error:', error.response?.status, error.response?.data);
        console.log('This is expected - signature verification will fail, but we can see if the webhook processes the event');
    }
    
    // Check current token status
    try {
        console.log('\n📊 Checking current token status...');
        const statusResponse = await axios.get(
            'https://whisper-backend.larrieu-arnaud.workers.dev/subscription-status?user=110061903752155691604'
        );
        
        console.log('Current status:', statusResponse.data);
        
    } catch (error) {
        console.log('❌ Status check error:', error.response?.status, error.response?.data);
    }
}

testWebhook().catch(console.error);
