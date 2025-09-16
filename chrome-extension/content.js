// Content script to inject into Path of Exile pages
console.log('🚀 POE Trade Data Capture content script loaded on:', window.location.href);

// Inject script to capture fetch requests
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.onload = function() {
  console.log('✅ Injected script loaded successfully');
  this.remove();
};
script.onerror = function() {
  console.error('❌ Failed to load injected script');
};
(document.head || document.documentElement).appendChild(script);
console.log('📤 Attempting to inject script:', script.src);

// Listen for messages from injected script
window.addEventListener('poeTradeData', (event) => {
  console.log('📨 Content script received trade data:', event.detail);
  
  // Send to background script
  chrome.runtime.sendMessage({
    type: 'CAPTURED_DATA',
    url: event.detail.url,
    data: event.detail.data
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('❌ Error sending to background:', chrome.runtime.lastError);
    } else {
      console.log('✅ Data sent to background successfully');
    }
  });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_STATUS') {
    sendResponse({ 
      status: 'active',
      url: window.location.href,
      isPoeSite: window.location.hostname.includes('pathofexile.com')
    });
  }
});