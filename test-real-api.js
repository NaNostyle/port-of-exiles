// Test script for real POE API calls
// Run this on pathofexile.com/trade after performing a search

console.log('🔍 Monitoring for real POE API calls...');

// Override console.log to capture all messages
const originalLog = console.log;
console.log = function(...args) {
    originalLog.apply(console, args);
    
    // Check if this is an interception message
    const message = args.join(' ');
    if (message.includes('Intercepted POE trade API')) {
        console.info('🎯 REAL API CALL DETECTED:', message);
    }
};

// Also listen for the custom event
window.addEventListener('poeTradeData', (event) => {
    console.log('🎉 REAL DATA CAPTURED:', event.detail);
});

console.log('✅ Monitoring active. Perform a trade search to see real API calls!');
