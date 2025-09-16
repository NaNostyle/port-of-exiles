// Comprehensive cookie debugging script
// Run this in the Chrome extension background context

console.log('🔍 Starting comprehensive cookie debugging...');

// Function to check all possible cookie scenarios
function debugAllCookies() {
  console.log('🍪 === COMPREHENSIVE COOKIE DEBUG ===');
  
  if (!chrome.cookies) {
    console.error('❌ Cookie API not available');
    return;
  }
  
  // 1. Check all cookies with no filter
  console.log('🍪 1. Checking ALL cookies (no filter)...');
  chrome.cookies.getAll({}, (cookies) => {
    if (chrome.runtime.lastError) {
      console.error('❌ Error getting all cookies:', chrome.runtime.lastError);
    } else {
      console.log(`🍪 Found ${cookies.length} total cookies:`);
      cookies.forEach((cookie, index) => {
        console.log(`🍪 Cookie ${index + 1}:`, {
          name: cookie.name,
          domain: cookie.domain,
          value: cookie.value.substring(0, 30) + '...',
          httpOnly: cookie.httpOnly,
          secure: cookie.secure,
          session: cookie.session,
          storeId: cookie.storeId
        });
      });
    }
  });
  
  // 2. Check cookies for specific domains
  const domains = [
    'pathofexile.com',
    '.pathofexile.com', 
    'www.pathofexile.com',
    '.www.pathofexile.com'
  ];
  
  domains.forEach((domain, index) => {
    console.log(`🍪 ${index + 2}. Checking domain: ${domain}`);
    chrome.cookies.getAll({domain: domain}, (cookies) => {
      if (chrome.runtime.lastError) {
        console.error(`❌ Error getting cookies for ${domain}:`, chrome.runtime.lastError);
      } else {
        console.log(`🍪 Domain ${domain}: ${cookies.length} cookies`);
        cookies.forEach(cookie => {
          console.log(`🍪   - ${cookie.name}: ${cookie.value.substring(0, 30)}... (httpOnly: ${cookie.httpOnly})`);
        });
      }
    });
  });
  
  // 3. Try to get cf_clearance specifically
  console.log('🍪 6. Trying to get cf_clearance specifically...');
  chrome.cookies.get({
    url: 'https://www.pathofexile.com',
    name: 'cf_clearance'
  }, (cookie) => {
    if (chrome.runtime.lastError) {
      console.error('❌ Error getting cf_clearance:', chrome.runtime.lastError);
    } else if (cookie) {
      console.log('✅ Found cf_clearance:', {
        name: cookie.name,
        value: cookie.value.substring(0, 30) + '...',
        domain: cookie.domain,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure
      });
    } else {
      console.log('❌ cf_clearance not found via specific get');
    }
  });
  
  // 4. Try to get POESESSID specifically
  console.log('🍪 7. Trying to get POESESSID specifically...');
  chrome.cookies.get({
    url: 'https://www.pathofexile.com',
    name: 'POESESSID'
  }, (cookie) => {
    if (chrome.runtime.lastError) {
      console.error('❌ Error getting POESESSID:', chrome.runtime.lastError);
    } else if (cookie) {
      console.log('✅ Found POESESSID:', {
        name: cookie.name,
        value: cookie.value.substring(0, 30) + '...',
        domain: cookie.domain,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure
      });
    } else {
      console.log('❌ POESESSID not found via specific get');
    }
  });
  
  // 5. Check different cookie stores
  console.log('🍪 8. Checking different cookie stores...');
  chrome.cookies.getAll({storeId: '0'}, (cookies) => {
    console.log(`🍪 Store 0 (default): ${cookies.length} cookies`);
    cookies.forEach(cookie => {
      if (cookie.name === 'cf_clearance' || cookie.name === 'POESESSID') {
        console.log(`🍪   - Found ${cookie.name} in store 0`);
      }
    });
  });
  
  chrome.cookies.getAll({storeId: '1'}, (cookies) => {
    console.log(`🍪 Store 1 (incognito): ${cookies.length} cookies`);
    cookies.forEach(cookie => {
      if (cookie.name === 'cf_clearance' || cookie.name === 'POESESSID') {
        console.log(`🍪   - Found ${cookie.name} in store 1`);
      }
    });
  });
  
  // 6. Check if we can access cookies from active tab
  console.log('🍪 9. Checking cookies from active tab...');
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs.length > 0) {
      const tab = tabs[0];
      console.log(`🍪 Active tab: ${tab.url}`);
      
      if (tab.url.includes('pathofexile.com')) {
        chrome.cookies.getAll({url: tab.url}, (cookies) => {
          console.log(`🍪 Active tab cookies: ${cookies.length} cookies`);
          cookies.forEach(cookie => {
            console.log(`🍪   - ${cookie.name}: ${cookie.value.substring(0, 30)}... (httpOnly: ${cookie.httpOnly})`);
          });
        });
      }
    }
  });
}

// Run the debug function
debugAllCookies();

console.log('🔍 Comprehensive cookie debugging completed. Check console for results.');
