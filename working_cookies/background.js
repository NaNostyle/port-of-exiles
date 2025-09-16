// Chrome Extension Background Script
// Handles WebSocket connections and API requests

class WSCatChrome {
    constructor(tabId) {
        this.tabId = tabId;
        this.ws = null;
        this.connected = false;
        this.autoFetch = true; // Enabled by default (like wscat.js with --auto-fetch)
        this.autoWhisper = true; // Enabled by default (like wscat.js with --auto-whisper)
        this.processedTradeIds = new Set();
        this.processedTokens = new Set();
        this.lastWhisperTime = 0;
        this.cookies = '';
        this.stats = {
            messagesSent: 0,
            tradesFetched: 0,
            whispersSent: 0
        };
    }

    async connect(wsUrl, headers) {
        return new Promise((resolve, reject) => {
            console.log(`[Tab ${this.tabId}] Connecting to ${wsUrl}...`);
            
            try {
                // Use the same approach as wscat.js - create WebSocket with headers
                // Note: Browser WebSocket API doesn't support headers directly, but we'll try
                this.ws = new WebSocket(wsUrl);

                this.ws.onopen = () => {
                    console.log(`[Tab ${this.tabId}] Connected!`);
                    this.connected = true;
                    this.cookies = headers.Cookie || '';
                    this.sendMessage('ws-connected', { tabId: this.tabId });
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    try {
                        const jsonData = JSON.parse(event.data);
                        console.log(`[Tab ${this.tabId}] Received:`, jsonData);
                        
                        this.sendMessage('ws-message', { 
                            tabId: this.tabId, 
                            data: jsonData 
                        });
                        
                        if (this.autoFetch) {
                            this.processWebSocketMessage(jsonData);
                        }
                    } catch (e) {
                        console.log(`[Tab ${this.tabId}] Received (text):`, event.data);
                        this.sendMessage('ws-message', { 
                            tabId: this.tabId, 
                            data: event.data 
                        });
                    }
                };

                this.ws.onerror = (error) => {
                    console.error(`[Tab ${this.tabId}] WebSocket Error:`, error);
                    this.connected = false;
                    this.sendMessage('ws-error', { 
                        tabId: this.tabId, 
                        error: error.message || 'WebSocket error' 
                    });
                    reject(error);
                };

                this.ws.onclose = (event) => {
                    console.log(`[Tab ${this.tabId}] Disconnected (code: ${event.code})`);
                    this.connected = false;
                    this.sendMessage('ws-disconnected', { 
                        tabId: this.tabId, 
                        code: event.code 
                    });
                };

                // Connection timeout
                setTimeout(() => {
                    if (!this.connected) {
                        reject(new Error('Connection timeout'));
                    }
                }, 10000);

            } catch (error) {
                console.error(`[Tab ${this.tabId}] WebSocket construction error:`, error);
                this.sendMessage('ws-error', { 
                    tabId: this.tabId, 
                    error: `WebSocket construction failed: ${error.message}` 
                });
                reject(error);
            }
        });
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
        this.sendMessage('ws-disconnected', { 
            tabId: this.tabId, 
            code: 1000 
        });
    }

    sendMessage(type, data) {
        chrome.runtime.sendMessage({
            type: type,
            ...data
        });
    }

    sendWebSocketMessage(message) {
        if (this.connected && this.ws) {
            try {
                this.ws.send(message);
                this.stats.messagesSent++;
                this.sendMessage('ws-sent', { 
                    tabId: this.tabId, 
                    message: message,
                    stats: this.stats
                });
                console.log(`[Tab ${this.tabId}] Sent:`, message);
            } catch (error) {
                console.error(`[Tab ${this.tabId}] Failed to send message:`, error.message);
                this.sendMessage('ws-error', { 
                    tabId: this.tabId, 
                    error: `Failed to send message: ${error.message}` 
                });
            }
        } else {
            this.sendMessage('ws-error', { 
                tabId: this.tabId, 
                error: 'Not connected' 
            });
        }
    }

    setAutoFetch(enabled) {
        this.autoFetch = enabled;
        this.sendMessage('auto-fetch-updated', { 
            tabId: this.tabId, 
            enabled: enabled 
        });
    }

    setAutoWhisper(enabled) {
        this.autoWhisper = enabled;
        this.sendMessage('auto-whisper-updated', { 
            tabId: this.tabId, 
            enabled: enabled 
        });
    }

    processWebSocketMessage(jsonData) {
        if (jsonData && typeof jsonData === 'object') {
            this.extractTradeIds(jsonData, '', this.cookies);
        }
    }

    extractTradeIds(obj, path = '', cookies = '') {
        if (typeof obj === 'string' && this.isTradeId(obj)) {
            if (!this.processedTradeIds.has(obj)) {
                this.processedTradeIds.add(obj);
                console.log(`[Tab ${this.tabId}] New trade ID found: ${obj}`);
                this.fetchTradeDetails(obj, cookies);
            }
        } else if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                this.extractTradeIds(item, `${path}[${index}]`, cookies);
            });
        } else if (obj && typeof obj === 'object') {
            Object.keys(obj).forEach(key => {
                this.extractTradeIds(obj[key], path ? `${path}.${key}` : key, cookies);
            });
        }
    }

    isTradeId(str) {
        return /^[a-f0-9]{64}$/i.test(str);
    }

    async fetchTradeDetails(tradeId, cookies) {
        try {
            const queryId = 'M7EwoaMtJ'; // Default query ID
            const fetchUrl = `https://www.pathofexile.com/api/trade2/fetch/${tradeId}?query=${queryId}&realm=poe2`;
            
            console.log(`[Tab ${this.tabId}] Fetching trade: ${tradeId}`);
            console.log(`[Tab ${this.tabId}] URL: ${fetchUrl}`);
            
            const response = await this.makeFetchRequest(fetchUrl, cookies);
            
            if (response) {
                this.stats.tradesFetched++;
                console.log(`[Tab ${this.tabId}] ✅ Trade details received:`);
                console.log(`[Tab ${this.tabId}] =`.repeat(80));
                console.log(`[Tab ${this.tabId}]`, JSON.stringify(response, null, 2));
                console.log(`[Tab ${this.tabId}] =`.repeat(80));
                console.log(`[Tab ${this.tabId}] 📊 Trade ID: ${tradeId}`);
                console.log(`[Tab ${this.tabId}] ⏰ Fetched at: ${new Date().toISOString()}`);
                console.log(`[Tab ${this.tabId}] =`.repeat(80));
                
                this.sendMessage('trade-fetched', { 
                    tabId: this.tabId, 
                    tradeId: tradeId,
                    response: response,
                    stats: this.stats
                });
                
                return response; // Return the response for auto-whisper processing
            } else {
                console.log(`[Tab ${this.tabId}] ⚠️  No response data received`);
                this.sendMessage('fetch-error', { 
                    tabId: this.tabId, 
                    tradeId: tradeId,
                    error: 'No response data received'
                });
                return null; // Return null when no response
            }
        } catch (error) {
            console.error(`[Tab ${this.tabId}] ❌ Failed to fetch trade details for ${tradeId}:`);
            console.error(`[Tab ${this.tabId}]    Error: ${error.message}`);
            console.error(`[Tab ${this.tabId}]    URL: https://www.pathofexile.com/api/trade2/fetch/${tradeId}?query=M7EwoaMtJ&realm=poe2`);
            this.sendMessage('fetch-error', { 
                tabId: this.tabId, 
                tradeId: tradeId,
                error: error.message 
            });
            throw error; // Re-throw the error so handleFetchTrade can catch it
        }
    }

    makeFetchRequest(url, cookies) {
        return new Promise((resolve, reject) => {
            console.log(`[Tab ${this.tabId}] makeFetchRequest called with cookies:`, {
                cookies: cookies || 'EMPTY',
                cookiesType: typeof cookies,
                cookiesLength: cookies ? cookies.length : 0
            });
            
            if (!cookies || cookies === 'undefined' || cookies.trim() === '') {
                console.log(`[Tab ${this.tabId}] ❌ Cookie validation failed:`, {
                    falsy: !cookies,
                    isUndefinedString: cookies === 'undefined',
                    isEmptyString: cookies === '',
                    isWhitespaceOnly: cookies && cookies.trim() === ''
                });
                reject(new Error('No valid cookies provided for fetch request'));
                return;
            }

            // Check global rate limiting for fetch requests (2 seconds between any fetches)
            const now = Date.now();
            if (globalLastFetchTime && (now - globalLastFetchTime) < 2000) {
                const remainingTime = Math.ceil((2000 - (now - globalLastFetchTime)) / 1000);
                console.log(`[Tab ${this.tabId}] ⏰ Fetch rate limited: Must wait ${remainingTime} more seconds before making another fetch request`);
                reject(new Error(`Fetch rate limited: Must wait ${remainingTime} more seconds`));
                return;
            }

            // Update global fetch rate limiting
            globalLastFetchTime = now;
            console.log(`[Tab ${this.tabId}] ✅ Fetch rate limiting passed - making request`);

            console.log(`[Tab ${this.tabId}] Making fetch request to: ${url}`);
            console.log(`[Tab ${this.tabId}] Request headers:`, {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:142.0) Gecko/20100101 Firefox/142.0',
                'Cookie': cookies ? cookies.substring(0, 50) + '...' : 'EMPTY'
            });
            
            fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:142.0) Gecko/20100101 Firefox/142.0',
                    'Accept': '*/*',
                    'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin',
                    'Cookie': cookies
                }
            })
            .then(response => {
                console.log(`[Tab ${this.tabId}] Fetch response status: ${response.status} ${response.statusText}`);
                if (!response.ok) {
                    if (response.status === 429) {
                        console.log(`[Tab ${this.tabId}] ⚠️ Rate limited by server (HTTP 429) - this is expected when fetching too quickly`);
                        throw new Error(`Rate limited by server: HTTP 429 - Too Many Requests`);
                    }
                    console.log(`[Tab ${this.tabId}] ❌ HTTP error: ${response.status} ${response.statusText}`);
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                console.log(`[Tab ${this.tabId}] ✅ Fetch response OK, parsing JSON...`);
                return response.json();
            })
            .then(data => {
                console.log(`[Tab ${this.tabId}] ✅ JSON parsed successfully, data type:`, typeof data);
                resolve(data);
            })
            .catch(error => {
                console.log(`[Tab ${this.tabId}] ❌ Fetch error:`, error.message);
                reject(error);
            });
        });
    }

    // Duplicate method removed - using the one below

    async sendWhisper(token, cookies) {
        try {
            console.log(`[Tab ${this.tabId}] 🚀 sendWhisper method called!`);
            console.log(`[Tab ${this.tabId}] 🔗 Token: ${token.substring(0, 50)}...`);
            console.log(`[Tab ${this.tabId}] 🍪 Cookies: ${cookies ? 'provided' : 'missing'}`);
            
            const now = Date.now();
            
            // Use global rate limiting instead of per-instance
            if (globalLastWhisperTime && (now - globalLastWhisperTime) < 10000) {
                const remainingTime = Math.ceil((10000 - (now - globalLastWhisperTime)) / 1000);
                console.log(`[Tab ${this.tabId}] ⏰ Global rate limited: Must wait ${remainingTime} more seconds before sending another whisper`);
                this.sendMessage('whisper-error', { 
                    tabId: this.tabId, 
                    token: token.substring(0, 50) + '...',
                    error: `Rate limited: Must wait ${remainingTime} more seconds`
                });
                return;
            }

            // Update global rate limiting
            globalLastWhisperTime = now;
            console.log(`[Tab ${this.tabId}] ✅ Global rate limiting passed - sending whisper`);

            console.log(`[Tab ${this.tabId}] 💬 Sending whisper to hideout token...`);
            console.log(`[Tab ${this.tabId}] 🔗 Token: ${token.substring(0, 50)}...`);
            
            const response = await this.makeWhisperRequest(token, cookies);
            
            if (response) {
                this.stats.whispersSent++;
                console.log(`[Tab ${this.tabId}] ✅ Whisper sent successfully:`);
                console.log(`[Tab ${this.tabId}] =`.repeat(80));
                console.log(`[Tab ${this.tabId}]`, JSON.stringify(response, null, 2));
                console.log(`[Tab ${this.tabId}] =`.repeat(80));
                console.log(`[Tab ${this.tabId}] 💬 Token: ${token.substring(0, 50)}...`);
                console.log(`[Tab ${this.tabId}] ⏰ Sent at: ${new Date().toISOString()}`);
                console.log(`[Tab ${this.tabId}] =`.repeat(80));
                
                this.sendMessage('whisper-sent', { 
                    tabId: this.tabId, 
                    token: token.substring(0, 50) + '...',
                    response: response,
                    stats: this.stats
                });
                
                // Play audio notification
                this.playAudioNotification();
            } else {
                console.log(`[Tab ${this.tabId}] ⚠️  No response data received from whisper`);
                this.sendMessage('whisper-error', { 
                    tabId: this.tabId, 
                    token: token.substring(0, 50) + '...',
                    error: 'No response data received from whisper'
                });
            }
        } catch (error) {
            console.error(`[Tab ${this.tabId}] ❌ Failed to send whisper for token ${token.substring(0, 50)}...:`);
            console.error(`[Tab ${this.tabId}]    Error: ${error.message}`);
            this.sendMessage('whisper-error', { 
                tabId: this.tabId, 
                token: token.substring(0, 50) + '...',
                error: error.message 
            });
        }
    }

    makeWhisperRequest(token, cookies) {
        return new Promise((resolve, reject) => {
            console.log(`[Tab ${this.tabId}] 🌐 makeWhisperRequest called`);
            console.log(`[Tab ${this.tabId}] 🔗 Token: ${token.substring(0, 50)}...`);
            console.log(`[Tab ${this.tabId}] 🍪 Cookies: ${cookies ? 'provided' : 'missing'}`);
            
            if (!cookies || cookies === 'undefined') {
                console.log(`[Tab ${this.tabId}] ❌ No valid cookies provided for whisper request`);
                reject(new Error('No valid cookies provided for whisper request'));
                return;
            }

            const postData = JSON.stringify({
                "token": token,
                "continue": true
            });

            console.log(`[Tab ${this.tabId}] 📤 Making HTTP POST request to whisper endpoint...`);
            console.log(`[Tab ${this.tabId}] 📦 Post data:`, postData);

            fetch('https://www.pathofexile.com/api/trade2/whisper', {
                method: 'POST',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:142.0) Gecko/20100101 Firefox/142.0',
                    'Accept': '*/*',
                    'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin',
                    'Priority': 'u=0',
                    'Cookie': cookies,
                    'Content-Length': postData.length.toString()
                },
                body: postData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => resolve(data))
            .catch(error => reject(error));
        });
    }

    playAudioNotification() {
        // Create audio element and play notification
        const audio = new Audio(chrome.runtime.getURL('tp-successfull.mp3'));
        audio.volume = 0.5;
        audio.play().catch(error => {
            console.log(`[Tab ${this.tabId}] Audio play failed:`, error.message);
        });
    }

    getStats() {
        return this.stats;
    }

    extractHideoutTokensFromFetchResponse(response) {
        // Extract hideout tokens from fetch response data (like wscat.js)
        console.log('\n🔍 [Background] Processing fetch response for hideout tokens...');
        console.log(`[Background] Response type:`, typeof response);
        console.log(`[Background] Response keys:`, response ? Object.keys(response) : 'null');
        console.log(`[Background] Full response:`, JSON.stringify(response, null, 2));
        
        if (response && typeof response === 'object') {
            this.extractHideoutTokens(response);
        } else {
            console.log('⚠️  [Background] Response is not an object, skipping token extraction');
        }
    }

    extractHideoutTokens(obj, path = '') {
        // Recursively search for hideout tokens in the object (like wscat.js)
        if (typeof obj === 'string') {
            console.log(`🔍 [Background] Checking string at path "${path}": ${obj.substring(0, 100)}...`);
            if (this.isHideoutToken(obj)) {
                if (!this.processedTokens.has(obj)) {
                    this.processedTokens.add(obj);
                    console.log(`\n💬 [Background] New hideout token found at path "${path}": ${obj.substring(0, 50)}...`);
                    // Get cookies for the whisper request
                    const cookies = buildCookieString();
                    console.log(`[Background] About to call sendWhisper with token: ${obj.substring(0, 50)}...`);
                    this.sendWhisper(obj, cookies);
                } else {
                    console.log(`💬 [Background] Token already processed: ${obj.substring(0, 50)}...`);
                }
            } else {
                console.log(`🔍 [Background] String at path "${path}" is not a hideout token`);
            }
        } else if (Array.isArray(obj)) {
            console.log(`🔍 [Background] Checking array at path "${path}" with ${obj.length} items`);
            obj.forEach((item, index) => {
                this.extractHideoutTokens(item, `${path}[${index}]`);
            });
        } else if (obj && typeof obj === 'object') {
            console.log(`🔍 [Background] Checking object at path "${path}" with keys:`, Object.keys(obj));
            Object.keys(obj).forEach(key => {
                this.extractHideoutTokens(obj[key], path ? `${path}.${key}` : key);
            });
        } else {
            console.log(`🔍 [Background] Skipping non-object at path "${path}":`, typeof obj);
        }
    }

    isHideoutToken(str) {
        // Check if string looks like a JWT token (starts with eyJ and contains dots) - like wscat.js
        return /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(str);
    }
}

// Global state management
const wsConnections = new Map();
let globalSettings = {
    poeSessId: '',
    cfClearance: '',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:142.0) Gecko/20100101 Firefox/142.0'
};

// Global rate limiting for whispers (10 seconds between any whispers)
let globalLastWhisperTime = 0;

// Global rate limiting for fetch requests (2 seconds between any fetches)
let globalLastFetchTime = 0;

// Fetch queue to handle multiple requests gracefully
let fetchQueue = [];
let isProcessingFetchQueue = false;

// Keep service worker alive
let keepAliveInterval;

// Load settings from storage
chrome.storage.local.get(['poeSessId', 'cfClearance'], (result) => {
    globalSettings.poeSessId = result.poeSessId || '';
    globalSettings.cfClearance = result.cfClearance || '';
    console.log('[Background] Loaded global settings:', globalSettings);
});

// Keep service worker alive by sending periodic messages
function keepAlive() {
    chrome.runtime.sendMessage({ type: 'keep-alive' }, () => {
        // Ignore errors - this is just to keep the service worker alive
    });
}

// Start keep-alive mechanism
keepAliveInterval = setInterval(keepAlive, 20000); // Every 20 seconds

// Clean up on shutdown
chrome.runtime.onSuspend.addListener(() => {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
    }
});

// Message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { type, tabId, ...data } = message;

    switch (type) {
        case 'ws-connect':
            handleConnect(tabId, data);
            break;
        case 'ws-disconnect':
            handleDisconnect(tabId);
            break;
        case 'ws-send':
            handleSendMessage(tabId, data);
            break;
        // Auto-fetch and auto-whisper are now enabled by default (no toggle needed)
        case 'ws-fetch-trade':
            // Return true to keep the message port open for async response
            handleFetchTrade(tabId, data).then(response => {
                sendResponse(response);
            }).catch(error => {
                sendResponse({ error: error.message });
            });
            return true; // Keep the message port open
        case 'ws-send-whisper':
            // Return true to keep the message port open for async response
            handleSendWhisper(tabId, data).then(response => {
                sendResponse(response);
            }).catch(error => {
                sendResponse({ error: error.message });
            });
            return true; // Keep the message port open
        case 'update-global-settings':
            handleUpdateGlobalSettings(data);
            break;
        case 'get-global-settings':
            sendResponse(globalSettings);
            break;
        case 'get-stats':
            const connection = wsConnections.get(tabId);
            sendResponse(connection ? connection.getStats() : { messagesSent: 0, tradesFetched: 0, whispersSent: 0 });
            break;
        case 'test-connection':
            console.log(`[Background] Test connection received from content script`);
            sendResponse({ status: 'ok', message: 'Background script is running' });
            break;
        case 'keep-alive':
            // Just acknowledge to keep the service worker alive
            sendResponse({ status: 'alive' });
            break;
        case 'fetch-cookies':
            console.log('[Background] Received fetch-cookies message');
            // Return true to keep the message port open for async response
            handleFetchCookies().then(result => {
                console.log('[Background] Sending cookie response:', { success: true, cookies: result });
                sendResponse({ success: true, cookies: result });
            }).catch(error => {
                console.log('[Background] Sending cookie error response:', { success: false, error: error.message });
                sendResponse({ success: false, error: error.message });
            });
            return true; // Keep the message port open
        case 'get-current-url':
            console.log('[Background] Received get-current-url message');
            // Return true to keep the message port open for async response
            handleGetCurrentUrl().then(result => {
                console.log('[Background] Sending URL response:', result);
                sendResponse(result);
            }).catch(error => {
                console.log('[Background] Sending URL error response:', { success: false, error: error.message });
                sendResponse({ success: false, error: error.message });
            });
            return true; // Keep the message port open
    }
});

async function handleConnect(tabId, data) {
    try {
        const { wsUrl } = data;
        console.log(`[Background] Connecting tab ${tabId} to:`, wsUrl);
        
        // Set cookies for the domain before connecting
        await setCookiesForDomain();
        
        const cookies = buildCookieString();
        console.log(`[Background] Using cookies:`, cookies);
        
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:142.0) Gecko/20100101 Firefox/142.0',
            'Origin': 'https://www.pathofexile.com',
            'Cookie': cookies
        };

        const connection = new WSCatChrome(tabId);
        wsConnections.set(tabId, connection);
        
        await connection.connect(wsUrl, headers);
    } catch (error) {
        console.error(`[Background] Connection error for tab ${tabId}:`, error);
        chrome.runtime.sendMessage({
            type: 'ws-error',
            tabId: tabId,
            error: error.message
        });
    }
}

function handleDisconnect(tabId) {
    const connection = wsConnections.get(tabId);
    if (connection) {
        connection.disconnect();
        wsConnections.delete(tabId);
    }
}

function handleSendMessage(tabId, data) {
    const connection = wsConnections.get(tabId);
    if (connection) {
        connection.sendWebSocketMessage(data.message);
    }
}

// Auto-fetch and auto-whisper are now enabled by default (no toggle needed)

async function handleFetchTrade(tabId, data) {
    console.log(`[Background] Received fetch trade request for tab ${tabId}:`, data);
    
    // Add to fetch queue to handle rate limiting gracefully
    return new Promise((resolve, reject) => {
        fetchQueue.push({
            tabId,
            data,
            resolve,
            reject,
            timestamp: Date.now()
        });
        
        console.log(`[Background] Added fetch request to queue. Queue length: ${fetchQueue.length}`);
        processFetchQueue();
    });
}

async function processFetchQueue() {
    if (isProcessingFetchQueue || fetchQueue.length === 0) {
        return;
    }
    
    isProcessingFetchQueue = true;
    console.log(`[Background] Processing fetch queue. Items: ${fetchQueue.length}`);
    
    while (fetchQueue.length > 0) {
        const { tabId, data, resolve, reject } = fetchQueue.shift();
        
        try {
            console.log(`[Background] Processing fetch for tab ${tabId}, tradeId: ${data.tradeId}`);
            
            const cookies = buildCookieString();
            console.log(`[Background] Using cookies:`, cookies);
            console.log(`[Background] Cookie string length:`, cookies ? cookies.length : 0);
            console.log(`[Background] Cookie string preview:`, cookies ? cookies.substring(0, 50) + '...' : 'EMPTY');
            
            // Create a temporary connection object just for HTTP requests
            const tempConnection = new WSCatChrome(tabId);
            console.log(`[Background] About to call fetchTradeDetails with tradeId: ${data.tradeId}`);
            const response = await tempConnection.fetchTradeDetails(data.tradeId, cookies);
            
            // If this was an auto-fetch, process the response for auto-whisper (like wscat.js)
            console.log(`[Background] Checking if auto-fetch processing is needed...`);
            console.log(`[Background] data.isAutoFetch:`, data.isAutoFetch);
            console.log(`[Background] response exists:`, !!response);
            console.log(`[Background] response type:`, typeof response);
            
            if (data.isAutoFetch && response) {
                console.log(`[Background] ✅ Auto-fetch completed, processing for auto-whisper (enabled by default)`);
                
                if (typeof response === 'object') {
                    console.log(`[Background] ✅ Auto-whisper is enabled by default, extracting hideout tokens from response`);
                    tempConnection.extractHideoutTokensFromFetchResponse(response);
                } else {
                    console.log(`[Background] ❌ Response is not an object, skipping token extraction`);
                }
            } else {
                console.log(`[Background] ❌ Skipping auto-whisper processing - isAutoFetch: ${data.isAutoFetch}, response exists: ${!!response}`);
            }
            
            resolve({ success: true, response: response });
            
        } catch (error) {
            console.error(`[Background] Error handling fetch trade for tab ${tabId}:`, error);
            reject(error);
        }
        
        // Wait 2 seconds between requests to respect rate limits
        if (fetchQueue.length > 0) {
            console.log(`[Background] Waiting 2 seconds before processing next fetch request...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    isProcessingFetchQueue = false;
    console.log(`[Background] Fetch queue processing completed`);
}

async function handleSendWhisper(tabId, data) {
    console.log(`[Background] Received send whisper request for tab ${tabId}:`, data);
    
    try {
        const cookies = buildCookieString();
        console.log(`[Background] Using cookies for whisper:`, cookies);
        
        // Create a temporary connection object just for HTTP requests
        const tempConnection = new WSCatChrome(tabId);
        const response = await tempConnection.sendWhisper(data.token, cookies);
        return { success: true, response: response };
    } catch (error) {
        console.error(`[Background] Error handling send whisper for tab ${tabId}:`, error);
        throw error;
    }
}

function handleUpdateGlobalSettings(data) {
    console.log('[Background] Updating global settings with:', {
        poeSessId: data.poeSessId ? `${data.poeSessId.substring(0, 10)}...` : 'missing',
        cfClearance: data.cfClearance ? `${data.cfClearance.substring(0, 10)}...` : 'missing',
        userAgent: data.userAgent ? `${data.userAgent.substring(0, 20)}...` : 'missing'
    });
    globalSettings = { ...globalSettings, ...data };
    chrome.storage.local.set({ globalSettings });
    console.log('[Background] Global settings updated successfully');
}

async function handleFetchCookies() {
    try {
        console.log('[Background] Fetching cookies from browser...');
        
        // Try to get the current active tab first
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];
        console.log('[Background] Current tab:', currentTab?.url);
        
        // Get cookies for pathofexile.com domain (try multiple variations)
        const cookiePromises = [
            chrome.cookies.getAll({ domain: '.pathofexile.com' }),
            chrome.cookies.getAll({ domain: 'pathofexile.com' }),
            chrome.cookies.getAll({ domain: 'www.pathofexile.com' }),
            chrome.cookies.getAll({ url: 'https://www.pathofexile.com' }),
            chrome.cookies.getAll({ url: 'https://pathofexile.com' })
        ];
        
        const cookieResults = await Promise.allSettled(cookiePromises);
        console.log('[Background] Cookie results for each domain:', cookieResults.map((result, i) => {
            const domain = ['.pathofexile.com', 'pathofexile.com', 'www.pathofexile.com', 'https://www.pathofexile.com', 'https://pathofexile.com'][i];
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
        const allCookies = cookieResults
            .filter(result => result.status === 'fulfilled')
            .flatMap(result => result.value);
        const cookies = allCookies.filter((cookie, index, self) => 
            index === self.findIndex(c => c.name === cookie.name && c.domain === cookie.domain)
        );
        
        console.log('[Background] Found cookies:', cookies.map(c => c.name));
        console.log('[Background] All cookies details:', cookies.map(c => ({ name: c.name, domain: c.domain, value: c.value.substring(0, 10) + '...' })));
        
        // Find POESESSID and cf_clearance cookies
        const poeSessIdCookie = cookies.find(c => c.name === 'POESESSID');
        const cfClearanceCookie = cookies.find(c => c.name === 'cf_clearance');
        
        console.log('[Background] POESESSID cookie found:', !!poeSessIdCookie);
        console.log('[Background] cf_clearance cookie found:', !!cfClearanceCookie);
        
        const result = {
            poeSessId: poeSessIdCookie ? poeSessIdCookie.value : '',
            cfClearance: cfClearanceCookie ? cfClearanceCookie.value : '',
            found: {
                poeSessId: !!poeSessIdCookie,
                cfClearance: !!cfClearanceCookie
            }
        };
        
        console.log('[Background] Cookie fetch result:', {
            poeSessIdFound: result.found.poeSessId,
            cfClearanceFound: result.found.cfClearance,
            poeSessIdLength: result.poeSessId.length,
            cfClearanceLength: result.cfClearance.length,
            poeSessIdValue: result.poeSessId ? result.poeSessId.substring(0, 10) + '...' : 'empty',
            cfClearanceValue: result.cfClearance ? result.cfClearance.substring(0, 10) + '...' : 'empty'
        });
        
        // If no cookies found via cookies API, try fallback method
        if (cookies.length === 0) {
            console.log('[Background] No cookies found via cookies API, trying fallback method...');
            // Try to get cookies from content script
            try {
                const tabs = await chrome.tabs.query({ url: 'https://www.pathofexile.com/*' });
                console.log('[Background] Found tabs:', tabs.map(t => ({ id: t.id, url: t.url })));
                if (tabs.length > 0) {
                    const response = await chrome.tabs.sendMessage(tabs[0].id, { type: 'get-cookies' });
                    console.log('[Background] Content script response:', response);
                    if (response && response.cookies) {
                        console.log('[Background] Got cookies from content script:', response.cookies);
                        return response.cookies;
                    }
                }
            } catch (error) {
                console.log('[Background] Fallback method failed:', error);
            }
        }
        
        return result;
    } catch (error) {
        console.error('[Background] Error fetching cookies:', error);
        throw error;
    }
}

async function handleGetCurrentUrl() {
    try {
        console.log('[Background] Getting current URL from content script...');
        
        // Get the current active tab
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];
        
        if (!currentTab) {
            throw new Error('No active tab found');
        }
        
        console.log('[Background] Current tab:', currentTab.url);
        
        // Try to get URL from content script first
        try {
            const response = await chrome.tabs.sendMessage(currentTab.id, { type: 'get-current-url' });
            if (response && response.success && response.url) {
                console.log('[Background] Got URL from content script:', response.url);
                return { success: true, url: response.url };
            }
        } catch (error) {
            console.log('[Background] Content script method failed, using tab URL:', error.message);
        }
        
        // Fallback to tab URL
        if (currentTab.url) {
            console.log('[Background] Using tab URL as fallback:', currentTab.url);
            return { success: true, url: currentTab.url };
        }
        
        throw new Error('Could not get current URL');
    } catch (error) {
        console.error('[Background] Error getting current URL:', error);
        throw error;
    }
}

function buildCookieString() {
    const cookies = [];
    if (globalSettings.poeSessId) {
        cookies.push(`POESESSID=${globalSettings.poeSessId}`);
    }
    if (globalSettings.cfClearance) {
        cookies.push(`cf_clearance=${globalSettings.cfClearance}`);
    }
    const cookieString = cookies.join('; ');
    console.log('[Background] buildCookieString result:', {
        poeSessId: globalSettings.poeSessId ? `${globalSettings.poeSessId.substring(0, 10)}...` : 'missing',
        cfClearance: globalSettings.cfClearance ? `${globalSettings.cfClearance.substring(0, 10)}...` : 'missing',
        cookieString: cookieString || 'EMPTY'
    });
    return cookieString;
}

async function setCookiesForDomain() {
    const domain = '.pathofexile.com';
    
    try {
        // Set POESESSID cookie
        if (globalSettings.poeSessId) {
            await chrome.cookies.set({
                url: 'https://www.pathofexile.com',
                name: 'POESESSID',
                value: globalSettings.poeSessId,
                domain: domain,
                path: '/',
                secure: true,
                httpOnly: false,
                sameSite: 'lax'
            });
            console.log('[Background] Set POESESSID cookie');
        }
        
        // Set cf_clearance cookie
        if (globalSettings.cfClearance) {
            await chrome.cookies.set({
                url: 'https://www.pathofexile.com',
                name: 'cf_clearance',
                value: globalSettings.cfClearance,
                domain: domain,
                path: '/',
                secure: true,
                httpOnly: false,
                sameSite: 'lax'
            });
            console.log('[Background] Set cf_clearance cookie');
        }
    } catch (error) {
        console.error('[Background] Failed to set cookies:', error);
    }
}

// Load saved settings on startup
chrome.storage.local.get(['globalSettings'], (result) => {
    if (result.globalSettings) {
        globalSettings = { ...globalSettings, ...result.globalSettings };
    }
});

// Save settings when they change
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.globalSettings) {
        globalSettings = { ...globalSettings, ...changes.globalSettings.newValue };
    }
});
