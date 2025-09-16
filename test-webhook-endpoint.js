const axios = require('axios');

// Test the webhook endpoint directly
async function testWebhookEndpoint() {
    console.log('🧪 Testing webhook endpoint accessibility...');
    
    try {
        // Test 1: Simple POST request
        console.log('\n1️⃣ Testing simple POST request...');
        const response1 = await axios.post(
            'https://whisper-backend.larrieu-arnaud.workers.dev/stripe/webhook',
            { test: 'webhook' },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('✅ Response:', response1.status, response1.data);
        
    } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.data);
    }
    
    try {
        // Test 2: With fake Stripe signature
        console.log('\n2️⃣ Testing with fake Stripe signature...');
        const response2 = await axios.post(
            'https://whisper-backend.larrieu-arnaud.workers.dev/stripe/webhook',
            { test: 'webhook' },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'stripe-signature': 'fake_signature'
                }
            }
        );
        console.log('✅ Response:', response2.status, response2.data);
        
    } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.data);
    }
    
    try {
        // Test 3: Check if other endpoints work
        console.log('\n3️⃣ Testing other endpoints...');
        const response3 = await axios.get(
            'https://whisper-backend.larrieu-arnaud.workers.dev/subscription-status?user=110061903752155691604'
        );
        console.log('✅ Other endpoint works:', response3.status);
        
    } catch (error) {
        console.log('❌ Other endpoint error:', error.response?.status, error.response?.data);
    }
}

testWebhookEndpoint().catch(console.error);

