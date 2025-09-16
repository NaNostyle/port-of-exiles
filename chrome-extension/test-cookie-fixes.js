// Test script to verify cookie fixes
// This script is designed to run in the popup context where chrome.cookies API is available
// To use: Open the extension popup and run this in the popup's console

console.log('🧪 Testing cookie access fixes in popup context...');

// Test 1: Check if cookies API is available
if (chrome && chrome.cookies) {
  console.log('✅ Chrome cookies API is available in popup context');
  
  // Test 2: Try to get all cookies
  chrome.cookies.getAll({}, function(cookies) {
    if (chrome.runtime.lastError) {
      console.error('❌ Error getting all cookies:', chrome.runtime.lastError);
    } else {
      console.log(`✅ Successfully retrieved ${cookies.length} cookies`);
      
      // Test 3: Look for target cookies
      const poeSessId = cookies.find(c => c.name === 'POESESSID');
      
      console.log('🍪 POESESSID found:', !!poeSessId);
      if (poeSessId) {
        console.log('🍪 POESESSID details:', {
          domain: poeSessId.domain,
          value: poeSessId.value.substring(0, 20) + '...',
          httpOnly: poeSessId.httpOnly,
          secure: poeSessId.secure
        });
      }
      
      // Test 4: Try domain-specific searches
      console.log('🔍 Testing domain-specific searches...');
      
      const domainTests = [
        { domain: '.pathofexile.com' },
        { domain: 'pathofexile.com' },
        { domain: 'www.pathofexile.com' },
        { url: 'https://www.pathofexile.com' },
        { url: 'https://pathofexile.com' }
      ];
      
      domainTests.forEach((test, index) => {
        chrome.cookies.getAll(test, function(domainCookies) {
          if (chrome.runtime.lastError) {
            console.error(`❌ Error with test ${index + 1}:`, chrome.runtime.lastError);
          } else {
            console.log(`✅ Test ${index + 1} (${JSON.stringify(test)}): Found ${domainCookies.length} cookies`);
            const targetInDomain = domainCookies.filter(c => c.name === 'POESESSID');
            if (targetInDomain.length > 0) {
              console.log(`🍪 Target cookies in domain:`, targetInDomain.map(c => c.name));
            }
          }
        });
      });
    }
  });
} else {
  console.error('❌ Chrome cookies API not available in popup context');
  console.log('💡 Make sure you are running this in the extension popup console, not the page console');
}

console.log('🧪 Cookie test completed. Check results above.');
