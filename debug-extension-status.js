// Debug script to check extension status
// Run this on pathofexile.com/trade

console.log('🔍 Debugging extension status...');

// Check if extension is loaded
function checkExtensionStatus() {
    console.log('=== EXTENSION STATUS CHECK ===');
    
    // Check if injected script is present
    const fetchString = window.fetch.toString();
    if (fetchString.includes('POE Trade Data Capture')) {
        console.log('✅ Extension injected script is loaded');
    } else {
        console.log('❌ Extension injected script NOT found');
        console.log('Current fetch function:', fetchString.substring(0, 200) + '...');
    }
    
    // Check if content script is present
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        console.log('✅ Chrome extension API available');
    } else {
        console.log('❌ Chrome extension API not available');
    }
    
    // Check XHR override
    const xhrOpenString = XMLHttpRequest.prototype.open.toString();
    if (xhrOpenString.includes('_url')) {
        console.log('✅ XHR override detected');
    } else {
        console.log('❌ XHR override NOT found');
        console.log('Current XHR open function:', xhrOpenString.substring(0, 200) + '...');
    }
    
    console.log('=== END STATUS CHECK ===');
}

// Test XHR interception manually
function testXHRInterception() {
    console.log('🧪 Testing XHR interception...');
    
    const xhr = new XMLHttpRequest();
    const testUrl = 'https://www.pathofexile.com/api/trade2/fetch/test123';
    
    xhr.open('GET', testUrl);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            console.log('XHR test completed with status:', xhr.status);
        }
    };
    
    // Mock response
    setTimeout(() => {
        xhr.status = 200;
        xhr.responseText = '{"test": "data"}';
        xhr.onreadystatechange();
    }, 100);
    
    xhr.send();
}

// Monitor all XHR requests
function monitorXHRRequests() {
    console.log('👀 Monitoring all XHR requests...');
    
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
        this._method = method;
        this._url = url;
        console.log('🔍 XHR OPEN:', method, url);
        return originalXHROpen.apply(this, [method, url, ...args]);
    };
    
    XMLHttpRequest.prototype.send = function(...args) {
        if (this._url && (this._url.includes('pathofexile.com/api/trade2/fetch') || this._url.includes('/api/trade2/fetch'))) {
            console.log('🎯 POE API XHR DETECTED:', this._url);
        }
        return originalXHRSend.apply(this, args);
    };
}

// Run all checks
checkExtensionStatus();
testXHRInterception();
monitorXHRRequests();

console.log('✅ Debug script loaded. Perform a trade search to see XHR monitoring results.');
