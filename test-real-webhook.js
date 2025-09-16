const axios = require('axios');

// Test webhook with the real payload from Stripe
async function testRealWebhook() {
    console.log('🧪 Testing with real Stripe webhook payload...');
    
    // Real payload from your Stripe webhook
    const realPayload = {
        "id": "evt_1S7ME5Gq9vbVKPQislWZDkS4",
        "object": "event",
        "api_version": "2023-10-16",
        "created": 1757880525,
        "data": {
            "object": {
                "id": "cs_test_a1MlZAnpvauj3GD5feM6wovSfXbgdTYC6HinrFKmec2hywzUCXPCEMG9pj",
                "object": "checkout.session",
                "metadata": {
                    "tokens": "10",
                    "userId": "110061903752155691604"
                },
                "mode": "payment",
                "payment_status": "paid",
                "status": "complete"
            }
        },
        "livemode": false,
        "pending_webhooks": 3,
        "request": {
            "id": null,
            "idempotency_key": null
        },
        "type": "checkout.session.completed"
    };
    
    try {
        console.log('📤 Sending real webhook payload...');
        
        // Send to webhook endpoint
        const response = await axios.post(
            'https://whisper-backend.larrieu-arnaud.workers.dev/stripe/webhook',
            realPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'stripe-signature': 'test_signature' // This will fail signature verification
                }
            }
        );
        
        console.log('✅ Webhook response:', response.status, response.data);
        
    } catch (error) {
        console.log('❌ Webhook error:', error.response?.status, error.response?.data);
        console.log('This will fail signature verification, but we can see the detailed error');
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

testRealWebhook().catch(console.error);
