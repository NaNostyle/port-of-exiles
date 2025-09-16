// Comprehensive debugging for real POE API calls
// Run this on pathofexile.com/trade

console.log('🔍 Comprehensive real API debugging...');

// Store original functions
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

// Override XHR to monitor everything
XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._method = method;
    this._url = url;
    console.log('🔍 XHR OPEN:', method, url);
    return originalXHROpen.apply(this, [method, url, ...args]);
};

XMLHttpRequest.prototype.send = function(...args) {
    if (this._url && (this._url.includes('pathofexile.com/api/trade2/fetch') || this._url.includes('/api/trade2/fetch'))) {
        console.log('🎯 POE API XHR DETECTED:', this._url);
        
        // Store original onreadystatechange
        const originalOnReadyStateChange = this.onreadystatechange;
        
        // Override onreadystatechange
        this.onreadystatechange = function() {
            console.log('📊 XHR State Change:', this.readyState, 'Status:', this.status, 'URL:', this._url);
            
            if (this.readyState === 4) {
                if (this.status === 200) {
                    console.log('✅ XHR Success - Response length:', this.responseText.length);
                    console.log('📄 Response preview:', this.responseText.substring(0, 300) + '...');
                    
                    try {
                        const data = JSON.parse(this.responseText);
                        console.log('🎉 Parsed JSON data:', data);
                        
                        // Dispatch custom event
                        window.dispatchEvent(new CustomEvent('poeTradeData', {
                            detail: {
                                url: this._url,
                                data: data,
                                timestamp: new Date().toISOString()
                            }
                        }));
                        console.log('📤 Custom event dispatched');
                    } catch (error) {
                        console.log('❌ JSON parse error:', error);
                    }
                } else {
                    console.log('❌ XHR failed with status:', this.status);
                }
            }
            
            // Call original handler
            if (originalOnReadyStateChange) {
                originalOnReadyStateChange.apply(this, arguments);
            }
        };
    }
    
    return originalXHRSend.apply(this, args);
};

// Listen for custom events
window.addEventListener('poeTradeData', (event) => {
    console.log('🎉 CUSTOM EVENT RECEIVED:', event.detail);
});

console.log('✅ Real API debugging active. Perform a trade search!');
