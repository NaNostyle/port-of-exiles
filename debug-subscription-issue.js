const axios = require('axios');
const https = require('https');

// Create axios instance with SSL configuration
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false, // Only for testing - allows self-signed certificates
    secureProtocol: 'TLSv1_2_method'
  }),
  timeout: 10000
});

const BACKEND_URL = 'https://whisper-backend.larrieu-arnaud.workers.dev';

async function debugSubscriptionIssue(userEmail) {
  console.log(`🔍 Debugging subscription issue for user: ${userEmail}`);
  console.log('=' .repeat(60));

  try {
    // Step 1: Check if user exists and get their profile
    console.log('\n1️⃣ Checking user profile...');
    
    // First, we need to authenticate as this user to get their profile
    // Since we don't have their JWT token, we'll need to simulate the login process
    console.log('⚠️  Note: To debug this properly, we need the user\'s JWT token or their Google ID');
    console.log('   You can get this from the browser\'s developer tools when they\'re logged in');
    
    // For now, let's create a test script that can be run with the user's token
    console.log('\n📝 To debug this issue, please:');
    console.log('   1. Have the customer log into the app');
    console.log('   2. Open browser developer tools (F12)');
    console.log('   3. Go to Application/Storage tab');
    console.log('   4. Look for the JWT token in localStorage or sessionStorage');
    console.log('   5. Run this script with their token');
    
    return;
    
  } catch (error) {
    console.error('❌ Error during debugging:', error.message);
  }
}

async function debugWithToken(jwtToken) {
  console.log('🔍 Debugging subscription with JWT token...');
  console.log('=' .repeat(60));

  try {
    // Step 1: Get user profile
    console.log('\n1️⃣ Getting user profile...');
    const profileResponse = await axiosInstance.get(`${BACKEND_URL}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });
    
    const profile = profileResponse.data;
    console.log('✅ Profile retrieved successfully');
    console.log('   User ID:', profile.profile?.googleId || 'Unknown');
    console.log('   Email:', profile.profile?.email || 'Unknown');
    console.log('   Name:', profile.profile?.name || 'Unknown');
    console.log('   Token Count:', profile.tokenCount);
    console.log('   Daily Count:', profile.dailyCount);
    console.log('   Daily Limit:', profile.dailyLimit);
    console.log('   Is Subscribed:', profile.isSubscribed);
    
    // Step 2: Test whisper token generation
    console.log('\n2️⃣ Testing whisper token generation...');
    try {
      const generateResponse = await axiosInstance.post(`${BACKEND_URL}/generate`, {}, {
        headers: {
          'Authorization': `Bearer ${jwtToken}`
        }
      });
      
      console.log('✅ Whisper token generated successfully');
      console.log('   Token:', generateResponse.data.token ? 'Generated' : 'Not generated');
      
      // Step 3: Check subscription status in detail
      console.log('\n3️⃣ Detailed subscription analysis...');
      if (profile.isSubscribed) {
        console.log('✅ User has active subscription');
        console.log('   They should have unlimited whispers');
        
        if (profile.dailyCount >= profile.dailyLimit) {
          console.log('⚠️  WARNING: User is hitting daily limits despite having subscription!');
          console.log('   This indicates a bug in the subscription logic');
        } else {
          console.log('✅ Daily count is within limits');
        }
      } else {
        console.log('❌ User does NOT have active subscription');
        console.log('   This explains why they\'re hitting limits');
        
        // Check if they should have a subscription
        console.log('\n🔍 Possible causes:');
        console.log('   1. Stripe webhook not processed correctly');
        console.log('   2. Subscription expired');
        console.log('   3. User ID mismatch between Stripe and our system');
        console.log('   4. Webhook signature verification failed');
      }
      
    } catch (generateError) {
      console.log('❌ Whisper token generation failed');
      console.log('   Error:', generateError.response?.data?.error || generateError.message);
      console.log('   Status:', generateError.response?.status);
      
      if (generateError.response?.status === 403) {
        console.log('   This confirms the user is hitting whisper limits');
      }
    }
    
    // Step 4: Recommendations
    console.log('\n4️⃣ Recommendations:');
    if (!profile.isSubscribed) {
      console.log('🔧 To fix this issue:');
      console.log('   1. Check Stripe dashboard for active subscriptions');
      console.log('   2. Verify webhook endpoint is working');
      console.log('   3. Check Cloudflare KV storage for subscription data');
      console.log('   4. Manually add subscription if needed');
    } else {
      console.log('✅ Subscription appears to be working correctly');
      console.log('   If user is still experiencing issues, check:');
      console.log('   1. Browser cache (have them clear it)');
      console.log('   2. Multiple browser sessions');
      console.log('   3. Network connectivity issues');
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Manual subscription fix function
async function manuallyFixSubscription(jwtToken, subscriptionExpiryDays = 30) {
  console.log('🔧 Manually fixing subscription...');
  console.log('=' .repeat(60));
  
  try {
    // Get user profile first
    const profileResponse = await axiosInstance.get(`${BACKEND_URL}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });
    
    const userId = profileResponse.data.profile.googleId;
    console.log('User ID:', userId);
    
    // Calculate expiry timestamp
    const expiryMs = Date.now() + (subscriptionExpiryDays * 24 * 60 * 60 * 1000);
    const expiryDate = new Date(expiryMs);
    
    console.log(`Setting subscription to expire on: ${expiryDate.toISOString()}`);
    
    // Note: This would require a backend endpoint to manually set subscription
    // For now, we'll just show what needs to be done
    console.log('\n📝 To manually fix the subscription:');
    console.log('   1. Access your Cloudflare KV storage');
    console.log(`   2. Set key: user:${userId}:subscription`);
    console.log(`   3. Set value: ${expiryMs}`);
    console.log('   4. Or create a backend endpoint to do this programmatically');
    
  } catch (error) {
    console.error('❌ Error fixing subscription:', error.message);
  }
}

// Export functions for use
module.exports = {
  debugSubscriptionIssue,
  debugWithToken,
  manuallyFixSubscription
};

// If run directly, show usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node debug-subscription-issue.js <user-email>');
    console.log('  node debug-subscription-issue.js --token <jwt-token>');
    console.log('  node debug-subscription-issue.js --fix <jwt-token> [days]');
    console.log('');
    console.log('Examples:');
    console.log('  node debug-subscription-issue.js customer@example.com');
    console.log('  node debug-subscription-issue.js --token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
    console.log('  node debug-subscription-issue.js --fix eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... 30');
  } else if (args[0] === '--token' && args[1]) {
    debugWithToken(args[1]);
  } else if (args[0] === '--fix' && args[1]) {
    const days = parseInt(args[2]) || 30;
    manuallyFixSubscription(args[1], days);
  } else {
    debugSubscriptionIssue(args[0]);
  }
}

