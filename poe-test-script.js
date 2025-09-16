// POE Extension Test Script
// Copy and paste this into the browser console on pathofexile.com

console.log('🔧 POE Extension Test Script Starting...');

// Check if extension is loaded
function checkExtension() {
    console.log('Checking if extension is loaded...');
    
    if (window.fetch.toString().includes('POE Trade Data Capture')) {
        console.log('✅ Extension injected script detected!');
        return true;
    } else {
        console.log('❌ Extension injected script not found');
        return false;
    }
}

// Test fetch call
function testFetch() {
    console.log('🧪 Testing fetch call to POE API...');
    
    const testUrl = 'https://www.pathofexile.com/api/trade2/fetch/test123';
    const testData = {
        result: [
            {
                id: 'test-item-1',
                item: { name: 'Test Item', type: 'Test Type' },
                listing: { price: { amount: 10, currency: 'chaos' } }
            }
        ]
    };
    
    // Override fetch to return mock data
    const originalFetch = window.fetch;
    window.fetch = function(url) {
        if (url.includes('pathofexile.com/api/trade2/fetch')) {
            console.log('🔍 Intercepted fetch call:', url);
            return Promise.resolve(new Response(JSON.stringify(testData), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }));
        }
        return originalFetch.apply(this, arguments);
    };
    
    fetch(testUrl)
        .then(response => response.json())
        .then(data => {
            console.log('✅ Fetch response received:', data);
        })
        .catch(error => {
            console.log('❌ Fetch error:', error.message);
        })
        .finally(() => {
            window.fetch = originalFetch;
        });
}

// Test XHR call
function testXHR() {
    console.log('🧪 Testing XHR call to POE API...');
    
    const xhr = new XMLHttpRequest();
    const testUrl = 'https://www.pathofexile.com/api/trade2/fetch/xhr-test';
    const testData = {
        result: [
            {
                id: 'xhr-test-item-1',
                item: { name: 'XHR Test Item', type: 'XHR Test Type' },
                listing: { price: { amount: 5, currency: 'exalted' } }
            }
        ]
    };
    
    xhr.open('GET', testUrl);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                console.log('✅ XHR response received:', xhr.responseText);
            } else {
                console.log('❌ XHR failed with status:', xhr.status);
            }
        }
    };
    
    // Mock the response
    setTimeout(() => {
        xhr.status = 200;
        xhr.responseText = JSON.stringify(testData);
        xhr.onreadystatechange();
    }, 100);
    
    xhr.send();
}

// Listen for extension events
window.addEventListener('poeTradeData', (event) => {
    console.log('🎉 Extension captured data:', event.detail);
});

// Run tests
console.log('🚀 Running extension tests...');
checkExtension();
testFetch();
testXHR();

console.log('✅ Test script completed. Check the console for results.');
console.log('💡 If you see "Extension captured data" messages, the extension is working!');
