// Test script to verify backend connectivity
const axios = require('axios');
const https = require('https');
const config = require('./config');

// Create axios instance with SSL configuration
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false, // Only for testing - allows self-signed certificates
    secureProtocol: 'TLSv1_2_method'
  }),
  timeout: 10000
});

async function testBackend() {
  console.log('🔍 Testing backend connectivity...\n');
  
  const backendUrl = config.backend.url;
  console.log(`Backend URL: ${backendUrl}`);
  
  try {
    // Test 1: Basic connectivity
    console.log('\n1. Testing basic connectivity...');
    try {
      const response = await axiosInstance.get(`${backendUrl}/test`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'POE-Trade-Test/1.0'
        }
      });
      console.log(`✅ Backend is reachable (Status: ${response.status})`);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Backend is reachable (404 - endpoint not found, but server responding)');
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.log(`❌ Backend connectivity failed: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.log('   → Make sure the backend server is running');
      console.log('   → Check if the port is correct');
    } else if (error.code === 'ENOTFOUND') {
      console.log('   → Check the backend URL in config.js');
    }
    return false;
  }
  
  try {
    // Test 2: Authentication endpoint
    console.log('\n2. Testing authentication endpoint...');
    const testUser = {
      email: 'test@example.com',
      googleId: 'test123',
      name: 'Test User'
    };
    
    const response = await axiosInstance.post(`${backendUrl}/auth/login`, testUser, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.token) {
      console.log('✅ Authentication endpoint working');
      console.log(`   Token received: ${response.data.token.substring(0, 20)}...`);
      
      // Test 3: User profile endpoint
      console.log('\n3. Testing user profile endpoint...');
      const profileResponse = await axiosInstance.get(`${backendUrl}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${response.data.token}`
        },
        timeout: 5000
      });
      
      if (profileResponse.data.profile) {
        console.log('✅ User profile endpoint working');
        console.log(`   User: ${profileResponse.data.profile.name}`);
        console.log(`   Tokens: ${profileResponse.data.tokenCount}`);
        console.log(`   Daily usage: ${profileResponse.data.dailyCount}/${profileResponse.data.dailyLimit}`);
      }
    }
  } catch (error) {
    console.log(`❌ Authentication test failed: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
  
  console.log('\n🎉 Backend is working correctly!');
  return true;
}

// Run the test
testBackend().then(success => {
  if (success) {
    console.log('\n✅ All tests passed - backend is ready');
  } else {
    console.log('\n❌ Some tests failed - check the issues above');
  }
}).catch(error => {
  console.error('\n💥 Test script error:', error.message);
});
