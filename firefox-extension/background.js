// Background script for Firefox extension
console.log('POE Trade Data Capture extension loaded');

// Store captured data
let capturedData = [];

// Listen for messages from content script
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📬 Background received message:', request);
  
  if (request.type === 'CAPTURED_DATA') {
    // Store the captured data
    capturedData.push({
      timestamp: new Date().toISOString(),
      url: request.url,
      data: request.data,
      tabId: sender.tab.id
    });
    
    console.log('💾 Stored captured data:', request.data);
    console.log('📊 Total captured items:', capturedData.length);
    
    // Try to send to Electron app
    sendToElectronApp(request.data, request.url);
    
    sendResponse({ success: true });
  }
  
  if (request.type === 'GET_CAPTURED_DATA') {
    sendResponse({ data: capturedData });
  }
  
  if (request.type === 'CLEAR_DATA') {
    capturedData = [];
    sendResponse({ success: true });
  }
  
  if (request.type === 'CHECK_COOKIES') {
    checkCookies().then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      console.error('Error checking cookies:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message port open for async response
  }
  
  if (request.type === 'SEND_COOKIES') {
    checkCookies().then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      console.error('Error sending cookies:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message port open for async response
  }
  
  return true; // Keep message channel open for async response
});

// Function to send data to Electron app via WebSocket
function sendToElectronApp(data, url) {
  console.log('🚀 Attempting to send data to Electron app...');
  
  const ws = new WebSocket('ws://localhost:8080');
  
  ws.onopen = function() {
    console.log('✅ Connected to Electron app');
    
    const message = {
      type: 'TRADE_DATA',
      url: url,
      data: data,
      timestamp: new Date().toISOString()
    };
    
    ws.send(JSON.stringify(message));
    console.log('📤 Data sent to Electron app:', message);
    ws.close();
  };
  
  ws.onerror = function(error) {
    console.error('❌ Could not connect to Electron app:', error);
  };
}

// Function to send cookies to Electron app
function sendCookiesToElectronApp(cookies) {
  console.log('🍪 Sending cookies to Electron app...');
  
  const ws = new WebSocket('ws://localhost:8080');
  
  ws.onopen = function() {
    console.log('✅ Connected to Electron app for cookies');
    
    const message = {
      type: 'COOKIES',
      cookies: cookies,
      timestamp: new Date().toISOString()
    };
    
    ws.send(JSON.stringify(message));
    console.log('🍪 Cookies sent to Electron app:', message);
    ws.close();
  };
  
  ws.onerror = function(error) {
    console.error('❌ Could not send cookies to Electron app:', error);
  };
}

// Comprehensive cookie checking function (adapted for Firefox)
async function checkCookies() {
  try {
    console.log('🍪 Fetching cookies from browser...');
    
    // Try to get the current active tab first
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    console.log('🍪 Current tab:', currentTab?.url);
    
    // Get ALL cookies first to see what's available
    const allCookies = await browser.cookies.getAll({});
    console.log('🍪 Total cookies in browser:', allCookies.length);
    
    // Filter for POE-related cookies
    const poeCookies = allCookies.filter(cookie => 
      cookie.domain.includes('pathofexile.com') || 
      cookie.name === 'POESESSID'
    );
    
    console.log('🍪 POE-related cookies found:', poeCookies.map(c => ({
      name: c.name,
      domain: c.domain,
      value: c.value.substring(0, 10) + '...'
    })));
    
    // Get cookies for pathofexile.com domain (try multiple variations)
    const cookiePromises = [
      browser.cookies.getAll({ domain: '.pathofexile.com' }),
      browser.cookies.getAll({ domain: 'pathofexile.com' }),
      browser.cookies.getAll({ domain: 'www.pathofexile.com' }),
      browser.cookies.getAll({ url: 'https://www.pathofexile.com' }),
      browser.cookies.getAll({ url: 'https://pathofexile.com' }),
      // Try to get POESESSID from any domain
      browser.cookies.getAll({ name: 'POESESSID' })
    ];
    
    const cookieResults = await Promise.allSettled(cookiePromises);
    console.log('🍪 Cookie results for each domain:', cookieResults.map((result, i) => {
      const domain = ['.pathofexile.com', 'pathofexile.com', 'www.pathofexile.com', 'https://www.pathofexile.com', 'https://pathofexile.com', 'POESESSID (any domain)'][i];
      if (result.status === 'fulfilled') {
        return {
          domain,
          count: result.value.length,
          names: result.value.map(c => c.name),
          status: 'success'
        };
      } else {
        return {
          domain,
          error: result.reason.message,
          status: 'error'
        };
      }
    }));
    
    // Combine all cookies and remove duplicates
    const allDomainCookies = cookieResults
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => result.value);
    const cookies = allDomainCookies.filter((cookie, index, self) => 
      index === self.findIndex(c => c.name === cookie.name && c.domain === cookie.domain)
    );
    
    console.log('🍪 Found cookies:', cookies.map(c => c.name));
    console.log('🍪 All cookies details:', cookies.map(c => ({ name: c.name, domain: c.domain, value: c.value.substring(0, 10) + '...' })));
    
    // Find POESESSID cookie
    const poeSessIdCookie = cookies.find(c => c.name === 'POESESSID');
    
    // If not found in domain-specific search, try from all cookies
    const poeSessIdFromAll = allCookies.find(c => c.name === 'POESESSID');
    
    const finalPoeSessId = poeSessIdCookie || poeSessIdFromAll;
    
    console.log('🍪 POESESSID cookie found:', !!finalPoeSessId);
    
    if (finalPoeSessId) {
      console.log('🍪 POESESSID details:', {
        domain: finalPoeSessId.domain,
        value: finalPoeSessId.value.substring(0, 20) + '...',
        httpOnly: finalPoeSessId.httpOnly,
        secure: finalPoeSessId.secure
      });
    }
    
    const targetCookies = {};
    
    if (finalPoeSessId) {
      targetCookies.POESESSID = {
        value: finalPoeSessId.value,
        domain: finalPoeSessId.domain,
        path: finalPoeSessId.path,
        secure: finalPoeSessId.secure,
        httpOnly: finalPoeSessId.httpOnly,
        expirationDate: finalPoeSessId.expirationDate
      };
    }
    
    console.log('🍪 Cookie fetch result:', {
      poeSessIdFound: !!finalPoeSessId,
      poeSessIdLength: finalPoeSessId ? finalPoeSessId.value.length : 0,
      poeSessIdValue: finalPoeSessId ? finalPoeSessId.value.substring(0, 10) + '...' : 'empty'
    });
    
    if (Object.keys(targetCookies).length > 0) {
      console.log('🍪 Sending target cookies to Electron app:', targetCookies);
      sendCookiesToElectronApp(targetCookies);
    } else {
      console.log('🍪 No target cookies found');
      console.log('🍪 Available cookie names:', allCookies.map(c => c.name).slice(0, 20));
    }
    
  } catch (error) {
    console.error('🍪 Error fetching cookies:', error);
  }
}

// Extension installed
browser.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  // No automatic cookie checking - only when requested
});

