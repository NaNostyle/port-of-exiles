// Test script to check cookie access from different contexts
console.log('🍪 Testing cookie access from different contexts...');

// Test 1: Check if we can access cookies via chrome.cookies API
if (typeof chrome !== 'undefined' && chrome.cookies) {
  console.log('✅ Chrome cookies API available');
  
  // Test different domain patterns
  const domains = [
    'pathofexile.com',
    '.pathofexile.com', 
    'www.pathofexile.com',
    '.www.pathofexile.com'
  ];
  
  domains.forEach(domain => {
    chrome.cookies.getAll({domain: domain}, (cookies) => {
      if (chrome.runtime.lastError) {
        console.error(`❌ Error getting cookies for ${domain}:`, chrome.runtime.lastError);
      } else {
        console.log(`🍪 Cookies for ${domain}:`, cookies.length, 'cookies');
        cookies.forEach(cookie => {
          console.log(`  - ${cookie.name}: ${cookie.value.substring(0, 20)}...`);
        });
      }
    });
  });
  
  // Test getting all cookies
  chrome.cookies.getAll({}, (cookies) => {
    if (chrome.runtime.lastError) {
      console.error('❌ Error getting all cookies:', chrome.runtime.lastError);
    } else {
      console.log('🍪 All available cookies:', cookies.length, 'cookies');
      cookies.forEach(cookie => {
        console.log(`  - ${cookie.name} (${cookie.domain}): ${cookie.value.substring(0, 20)}...`);
        if (cookie.name === 'cf_clearance') {
          console.log('🎯 Found cf_clearance cookie!');
        }
      });
    }
  });
} else {
  console.log('❌ Chrome cookies API not available');
}

// Test 2: Check document.cookie
console.log('🍪 document.cookie:', document.cookie);

// Test 3: Check if we're in the right context
console.log('🍪 Current URL:', window.location.href);
console.log('🍪 Current domain:', window.location.hostname);
