// Test script to verify cookie permissions
console.log('🍪 Testing cookie permissions...');

// Test 1: Check if cookie API is available
if (chrome.cookies) {
  console.log('✅ Cookie API is available');
} else {
  console.error('❌ Cookie API is not available');
}

// Test 2: Try to get all cookies
chrome.cookies.getAll({}, (cookies) => {
  if (chrome.runtime.lastError) {
    console.error('❌ Cookie API error:', chrome.runtime.lastError);
  } else {
    console.log('✅ Cookie API working, found', cookies.length, 'cookies');
    
    // Show first few cookies for debugging
    cookies.slice(0, 5).forEach((cookie, index) => {
      console.log(`🍪 Cookie ${index + 1}:`, {
        name: cookie.name,
        domain: cookie.domain,
        value: cookie.value.substring(0, 20) + '...'
      });
    });
  }
});

// Test 3: Try to get cookies for specific domain
chrome.cookies.getAll({domain: 'pathofexile.com'}, (cookies) => {
  if (chrome.runtime.lastError) {
    console.error('❌ Domain-specific cookie error:', chrome.runtime.lastError);
  } else {
    console.log('✅ Domain-specific cookies working, found', cookies.length, 'cookies for pathofexile.com');
  }
});

// Test 4: Try to get cookies for www subdomain
chrome.cookies.getAll({domain: 'www.pathofexile.com'}, (cookies) => {
  if (chrome.runtime.lastError) {
    console.error('❌ www subdomain cookie error:', chrome.runtime.lastError);
  } else {
    console.log('✅ www subdomain cookies working, found', cookies.length, 'cookies for www.pathofexile.com');
  }
});
