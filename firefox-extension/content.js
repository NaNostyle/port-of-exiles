// Content script to inject into Path of Exile pages
console.log('🚀 POE Trade Data Capture content script loaded on:', window.location.href);

// Inject script to capture fetch requests
const script = document.createElement('script');
script.src = browser.runtime.getURL('injected.js');
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
  browser.runtime.sendMessage({
    type: 'CAPTURED_DATA',
    url: event.detail.url,
    data: event.detail.data
  }).then(response => {
    console.log('✅ Data sent to background successfully');
  }).catch(error => {
    console.error('❌ Error sending to background:', error);
  });
});

// Listen for messages from popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_STATUS') {
    sendResponse({ 
      status: 'active',
      url: window.location.href,
      isPoeSite: window.location.hostname.includes('pathofexile.com')
    });
  }
});

