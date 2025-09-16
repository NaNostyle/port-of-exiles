// Monitor real POE API calls
// Run this on pathofexile.com/trade

console.log('🔍 Monitoring real POE API calls...');

// Override console.log to capture all messages
const originalLog = console.log;
console.log = function(...args) {
    originalLog.apply(console, args);
    
    // Check if this is a real API call
    const message = args.join(' ');
    if (message.includes('Intercepted POE trade API XHR call:') && !message.includes('test123') && !message.includes('xhr-test')) {
        console.info('🎯 REAL API CALL INTERCEPTED:', message);
    }
    if (message.includes('Captured trade data via XHR:') && !message.includes('test123') && !message.includes('xhr-test')) {
        console.info('🎉 REAL DATA CAPTURED:', message);
    }
    if (message.includes('XHR Response Status:') && !message.includes('test123') && !message.includes('xhr-test')) {
        console.info('📊 REAL API RESPONSE:', message);
    }
};

// Listen for the custom event
window.addEventListener('poeTradeData', (event) => {
    if (!event.detail.url.includes('test123') && !event.detail.url.includes('xhr-test')) {
        console.log('🎉 REAL TRADE DATA EVENT:', event.detail);
    }
});

console.log('✅ Real API monitoring active. Perform a trade search to see real API calls!');
