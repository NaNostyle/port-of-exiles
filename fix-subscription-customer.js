const axios = require('axios');
const https = require('https');

const BACKEND_URL = 'https://whisper-backend.larrieu-arnaud.workers.dev';

// Create axios instance with SSL configuration
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
    secureProtocol: 'TLSv1_2_method'
  }),
  timeout: 10000
});

async function fixCustomerSubscription(customerEmail) {
  console.log(`🔧 Fixing subscription for customer: ${customerEmail}`);
  console.log('=' .repeat(60));

  try {
    // Step 1: Get customer's Google ID from their email
    console.log('\n1️⃣ Getting customer information...');
    
    // Since we can't directly query by email, we need the customer to provide their Google ID
    // or we need to check the Stripe dashboard for their subscription status
    
    console.log('📝 To fix this customer\'s subscription:');
    console.log('');
    console.log('Option 1 - Manual Fix (Recommended):');
    console.log('1. Have the customer log into the app');
    console.log('2. Open browser developer tools (F12)');
    console.log('3. Go to Console tab and run:');
    console.log('   window.electronAPI.getCurrentUser()');
    console.log('4. Note their Google ID from the response');
    console.log('5. Run this command:');
    console.log(`   curl "${BACKEND_URL}/subscribe?user=GOOGLE_ID_HERE"`);
    console.log('');
    console.log('Option 2 - Check Stripe Dashboard:');
    console.log('1. Go to your Stripe dashboard');
    console.log('2. Search for the customer by email');
    console.log('3. Check if they have an active subscription');
    console.log('4. If yes, the webhook might not have processed correctly');
    console.log('5. Manually trigger the webhook or use Option 1');
    console.log('');
    console.log('Option 3 - Use the debug script:');
    console.log('1. Have customer provide their JWT token (from browser dev tools)');
    console.log('2. Run: node debug-subscription-issue.js --token JWT_TOKEN');
    console.log('3. If subscription is missing, run: node debug-subscription-issue.js --fix JWT_TOKEN');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function checkSubscriptionStatus(googleId) {
  console.log(`🔍 Checking subscription status for Google ID: ${googleId}`);
  
  try {
    const response = await axiosInstance.get(`${BACKEND_URL}/subscription-status?user=${googleId}`);
    const data = response.data;
    
    console.log('📊 Subscription Status:');
    console.log(`   User: ${data.user}`);
    console.log(`   Is Subscribed: ${data.isSubscribed ? '✅ Yes' : '❌ No'}`);
    console.log(`   Token Count: ${data.tokenCount}`);
    console.log(`   Daily Count: ${data.dailyCount}/${data.dailyLimit}`);
    console.log(`   Can Make Whisper: ${data.canMakeWhisper ? '✅ Yes' : '❌ No'}`);
    
    if (data.subscriptionExpiresDate) {
      console.log(`   Subscription Expires: ${data.subscriptionExpiresDate}`);
    } else {
      console.log('   Subscription Expires: Never (no subscription)');
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Error checking subscription:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return null;
  }
}

async function quickFix(googleId, days = 30) {
  console.log(`🚀 Quick fix: Setting subscription for Google ID: ${googleId}`);
  
  try {
    // First check current status
    console.log('\n📋 Current status:');
    await checkSubscriptionStatus(googleId);
    
    // Set subscription
    console.log(`\n🔧 Setting ${days}-day subscription...`);
    const response = await axiosInstance.get(`${BACKEND_URL}/subscribe?user=${googleId}`);
    console.log('✅ Subscription set successfully!');
    console.log('Response:', response.data);
    
    // Verify the fix
    console.log('\n✅ Verification:');
    await checkSubscriptionStatus(googleId);
    
  } catch (error) {
    console.error('❌ Error setting subscription:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Export functions
module.exports = { fixCustomerSubscription, quickFix, checkSubscriptionStatus };

// If run directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node fix-subscription-customer.js <customer-email>');
    console.log('  node fix-subscription-customer.js --check <google-id>');
    console.log('  node fix-subscription-customer.js --quick <google-id> [days]');
    console.log('');
    console.log('Examples:');
    console.log('  node fix-subscription-customer.js customer@example.com');
    console.log('  node fix-subscription-customer.js --check 1234567890abcdef');
    console.log('  node fix-subscription-customer.js --quick 1234567890abcdef 30');
  } else if (args[0] === '--check' && args[1]) {
    checkSubscriptionStatus(args[1]);
  } else if (args[0] === '--quick' && args[1]) {
    const days = parseInt(args[2]) || 30;
    quickFix(args[1], days);
  } else {
    fixCustomerSubscription(args[0]);
  }
}
