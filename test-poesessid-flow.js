// Test script to verify POESESSID flow
const WebSocket = require('ws');

console.log('🧪 Testing POESESSID flow...');

// Test 1: Check if WebSocket server is running
function testWebSocketConnection() {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket('ws://localhost:8080');
        
        ws.on('open', () => {
            console.log('✅ WebSocket server is running on port 8080');
            ws.close();
            resolve(true);
        });
        
        ws.on('error', (error) => {
            console.log('❌ WebSocket server is not running:', error.message);
            reject(error);
        });
        
        setTimeout(() => {
            ws.close();
            reject(new Error('Connection timeout'));
        }, 5000);
    });
}

// Test 2: Send mock POESESSID to Electron app
function testPOESESSIDSending() {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket('ws://localhost:8080');
        
        ws.on('open', () => {
            console.log('✅ Connected to WebSocket server');
            
            // Send mock cookies with POESESSID
            const mockCookies = {
                POESESSID: {
                    value: 'test-poesessid-value-12345',
                    domain: '.pathofexile.com',
                    path: '/',
                    secure: true,
                    httpOnly: true,
                    expirationDate: Date.now() + 86400000 // 24 hours
                }
            };
            
            const message = {
                type: 'COOKIES',
                cookies: mockCookies,
                timestamp: new Date().toISOString()
            };
            
            console.log('📤 Sending mock POESESSID to Electron app...');
            ws.send(JSON.stringify(message));
            
            setTimeout(() => {
                ws.close();
                resolve(true);
            }, 1000);
        });
        
        ws.on('error', (error) => {
            console.log('❌ Error connecting to WebSocket:', error.message);
            reject(error);
        });
        
        setTimeout(() => {
            ws.close();
            reject(new Error('Connection timeout'));
        }, 5000);
    });
}

// Test 3: Send mock trade data to trigger teleport
function testTradeDataSending() {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket('ws://localhost:8080');
        
        ws.on('open', () => {
            console.log('✅ Connected to WebSocket server for trade data test');
            
            // Send mock trade data
            const mockTradeData = {
                url: 'https://www.pathofexile.com/trade/search/test',
                data: {
                    result: [{
                        listing: {
                            hideout_token: 'test-hideout-token',
                            account: {
                                name: 'TestAccount'
                            }
                        }
                    }]
                },
                timestamp: new Date().toISOString()
            };
            
            const message = {
                type: 'TRADE_DATA',
                url: mockTradeData.url,
                data: mockTradeData.data,
                timestamp: mockTradeData.timestamp
            };
            
            console.log('📤 Sending mock trade data to Electron app...');
            ws.send(JSON.stringify(message));
            
            setTimeout(() => {
                ws.close();
                resolve(true);
            }, 1000);
        });
        
        ws.on('error', (error) => {
            console.log('❌ Error connecting to WebSocket:', error.message);
            reject(error);
        });
        
        setTimeout(() => {
            ws.close();
            reject(new Error('Connection timeout'));
        }, 5000);
    });
}

// Run all tests
async function runTests() {
    try {
        console.log('\n🔍 Test 1: Checking WebSocket server...');
        await testWebSocketConnection();
        
        console.log('\n🔍 Test 2: Testing POESESSID sending...');
        await testPOESESSIDSending();
        
        console.log('\n🔍 Test 3: Testing trade data sending...');
        await testTradeDataSending();
        
        console.log('\n✅ All tests completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Check Electron app console for POESESSID reception logs');
        console.log('2. Check if step 2 completes in the login page');
        console.log('3. Check if teleport functionality is triggered');
        
    } catch (error) {
        console.log('\n❌ Test failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure Electron app is running');
        console.log('2. Check if WebSocket server is started on port 8080');
        console.log('3. Check Electron app console for errors');
    }
}

// Run the tests
runTests();
