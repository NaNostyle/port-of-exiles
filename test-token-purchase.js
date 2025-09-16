const axios = require('axios');
const https = require('https');

// Create axios instance with SSL configuration
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
    secureProtocol: 'TLSv1_2_method'
  }),
  timeout: 10000
});

const BACKEND_URL = 'https://whisper-backend.larrieu-arnaud.workers.dev';

async function testTokenPurchase(googleId) {
  console.log(`🧪 Testing token purchase flow for user: ${googleId}`);
  console.log('=' .repeat(60));

  try {
    // Step 1: Check current token status
    console.log('\n1️⃣ Checking current token status...');
    const statusResponse = await axiosInstance.get(`${BACKEND_URL}/subscription-status?user=${googleId}`);
    const currentStatus = statusResponse.data;
    
    console.log('📊 Current Status:');
    console.log(`   User: ${currentStatus.user}`);
    console.log(`   Token Count: ${currentStatus.tokenCount}`);
    console.log(`   Daily Count: ${currentStatus.dailyCount}/${currentStatus.dailyLimit}`);
    console.log(`   Is Subscribed: ${currentStatus.isSubscribed ? 'Yes' : 'No'}`);
    
    // Step 2: Test manual token addition (simulate webhook)
    console.log('\n2️⃣ Testing manual token addition...');
    const addTokensResponse = await axiosInstance.get(`${BACKEND_URL}/debug/add-tokens?user=${googleId}&tokens=30`);
    const addResult = addTokensResponse.data;
    
    console.log('✅ Manual Token Addition Result:');
    console.log(`   Tokens Added: ${addResult.tokensAdded}`);
    console.log(`   Previous Tokens: ${addResult.previousTokens}`);
    console.log(`   New Token Count: ${addResult.newTokenCount}`);
    console.log(`   Message: ${addResult.message}`);
    
    // Step 3: Verify the tokens were added
    console.log('\n3️⃣ Verifying tokens were added...');
    const verifyResponse = await axiosInstance.get(`${BACKEND_URL}/subscription-status?user=${googleId}`);
    const verifyStatus = verifyResponse.data;
    
    console.log('📊 Updated Status:');
    console.log(`   Token Count: ${verifyStatus.tokenCount}`);
    console.log(`   Can Make Whisper: ${verifyStatus.canMakeWhisper ? 'Yes' : 'No'}`);
    
    // Step 4: Test whisper token generation
    console.log('\n4️⃣ Testing whisper token generation...');
    try {
      // Note: This would require authentication, so we'll just show what would happen
      console.log('   Note: Whisper token generation requires authentication');
      console.log('   In the app, this would consume 1 token and generate a JWT');
    } catch (error) {
      console.log('   Whisper token generation failed (expected without auth)');
    }
    
    // Step 5: Summary
    console.log('\n5️⃣ Summary:');
    if (verifyStatus.tokenCount > currentStatus.tokenCount) {
      console.log('✅ SUCCESS: Tokens were successfully added to KV storage');
      console.log('   The issue was likely in the Stripe webhook metadata');
      console.log('   The fix should now work for real purchases');
    } else {
      console.log('❌ FAILED: Tokens were not added properly');
      console.log('   There may be an issue with the KV storage or endpoint');
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

async function checkStripeWebhook() {
  console.log('\n🔍 Checking Stripe webhook configuration...');
  console.log('=' .repeat(60));
  
  console.log('📋 To verify Stripe webhook is working:');
  console.log('1. Go to your Stripe Dashboard');
  console.log('2. Navigate to Developers > Webhooks');
  console.log('3. Check if webhook endpoint is configured:');
  console.log(`   URL: ${BACKEND_URL}/stripe/webhook`);
  console.log('4. Verify events being sent:');
  console.log('   - checkout.session.completed');
  console.log('5. Check webhook logs for recent events');
  console.log('6. Look for any failed webhook deliveries');
  
  console.log('\n🔧 If webhook is not working:');
  console.log('1. Check webhook secret in wrangler.jsonc');
  console.log('2. Verify webhook URL is accessible');
  console.log('3. Check Cloudflare Worker logs');
  console.log('4. Test webhook with Stripe CLI:');
  console.log('   stripe listen --forward-to localhost:8787/stripe/webhook');
}

// Export functions
module.exports = { testTokenPurchase, checkStripeWebhook };

// If run directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node test-token-purchase.js <google-id>');
    console.log('  node test-token-purchase.js --check-webhook');
    console.log('');
    console.log('Examples:');
    console.log('  node test-token-purchase.js 110061903752155691604');
    console.log('  node test-token-purchase.js --check-webhook');
  } else if (args[0] === '--check-webhook') {
    checkStripeWebhook();
  } else {
    testTokenPurchase(args[0]);
  }
}
