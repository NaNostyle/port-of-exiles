// Content Script - Injects sidebar into Path of Exile trade pages
class POE2TradeSidebar {
    constructor() {
        this.sidebar = null;
        this.isOpen = false;
        this.wsConnections = new Map(); // Store WebSocket connections in content script
        this.init();
        this.setupMessageListener();
        this.testBackgroundScript();
    }

    init() {
        // Wait for page to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createSidebar());
        } else {
            this.createSidebar();
        }
    }

    createSidebar() {
        // Create the sidebar container
        this.sidebar = document.createElement('div');
        this.sidebar.id = 'poe2-trade-sidebar';
        this.sidebar.innerHTML = `
            <div class="sidebar-header">
                <h3>⚡ POE2 Trade Client</h3>
                <button id="sidebar-toggle" class="toggle-btn">×</button>
            </div>
            <div class="sidebar-content">
                <iframe id="sidebar-iframe" src="${chrome.runtime.getURL('sidebar.html')}" frameborder="0"></iframe>
            </div>
        `;

        // Add to page
        document.body.appendChild(this.sidebar);

        // Create toggle button in the page
        this.createToggleButton();

        // Set up event listeners
        this.setupEventListeners();
    }

    createToggleButton() {
        // Create a floating toggle button
        const toggleButton = document.createElement('div');
        toggleButton.id = 'poe2-trade-toggle';
        toggleButton.innerHTML = '⚡';
        toggleButton.title = 'Open POE2 Trade Client';
        
        // Position it on the right side of the screen
        toggleButton.style.cssText = `
            position: fixed;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            font-weight: bold;
            cursor: pointer;
            z-index: 10000;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
            border: 2px solid rgba(255, 255, 255, 0.2);
        `;

        // Add hover effect
        toggleButton.addEventListener('mouseenter', () => {
            toggleButton.style.transform = 'translateY(-50%) scale(1.1)';
            toggleButton.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
        });

        toggleButton.addEventListener('mouseleave', () => {
            toggleButton.style.transform = 'translateY(-50%) scale(1)';
            toggleButton.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
        });

        // Add click handler
        toggleButton.addEventListener('click', () => {
            this.toggleSidebar();
        });

        document.body.appendChild(toggleButton);
    }

    setupEventListeners() {
        // Close sidebar when clicking the X button
        const closeBtn = this.sidebar.querySelector('#sidebar-toggle');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeSidebar();
            });
        }

        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.sidebar.contains(e.target) && !e.target.closest('#poe2-trade-toggle')) {
                this.closeSidebar();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeSidebar();
            }
        });

        // Listen for messages from the sidebar iframe
        window.addEventListener('message', (event) => {
            if (event.source === this.sidebar.querySelector('#sidebar-iframe').contentWindow) {
                this.handleSidebarMessage(event.data);
            }
        });
    }

    handleSidebarMessage(message) {
        const { type, tabId, ...data } = message;
        
        switch (type) {
            case 'ws-connect':
                this.connectWebSocket(tabId, data);
                break;
            case 'ws-disconnect':
                this.disconnectWebSocket(tabId);
                break;
            case 'ws-send':
                this.sendWebSocketMessage(tabId, data);
                break;
        }
    }

    async handleSidebarMessage(message) {
        const { type, tabId, ...data } = message;
        
        switch (type) {
            case 'ws-connect':
                await this.connectWebSocket(tabId, data);
                break;
            case 'ws-disconnect':
                this.disconnectWebSocket(tabId);
                break;
            case 'ws-send':
                this.sendWebSocketMessage(tabId, data);
                break;
        }
    }

    async connectWebSocket(tabId, data) {
        const { wsUrl } = data;
        
        try {
            console.log(`[Content] Connecting tab ${tabId} to:`, wsUrl);
            
            // Get user cookies from storage
            const cookies = await this.getUserCookies();
            console.log(`[Content] Using cookies:`, cookies);
            
            // Create WebSocket connection in content script context
            // This has access to the page's cookie context
            const ws = new WebSocket(wsUrl);
            this.wsConnections.set(tabId, ws);

            ws.onopen = () => {
                console.log(`[Content] Tab ${tabId} connected!`);
                this.sendMessageToSidebar('ws-connected', { tabId });
            };

            ws.onmessage = (event) => {
                try {
                    const jsonData = JSON.parse(event.data);
                    console.log(`[Content] Tab ${tabId} received:`, jsonData);
                    this.sendMessageToSidebar('ws-message', { tabId, data: jsonData });
                    
                    // Process message for auto-fetch (like wscat.js)
                    this.processWebSocketMessage(tabId, jsonData);
                } catch (e) {
                    console.log(`[Content] Tab ${tabId} received (text):`, event.data);
                    this.sendMessageToSidebar('ws-message', { tabId, data: event.data });
                }
            };

            ws.onerror = (error) => {
                console.error(`[Content] Tab ${tabId} WebSocket error:`, error);
                this.sendMessageToSidebar('ws-error', { tabId, error: error.message || 'WebSocket error' });
            };

            ws.onclose = (event) => {
                console.log(`[Content] Tab ${tabId} disconnected (code: ${event.code})`);
                this.wsConnections.delete(tabId);
                this.sendMessageToSidebar('ws-disconnected', { tabId, code: event.code });
            };

        } catch (error) {
            console.error(`[Content] Failed to create WebSocket for tab ${tabId}:`, error);
            this.sendMessageToSidebar('ws-error', { tabId, error: error.message });
        }
    }

    disconnectWebSocket(tabId) {
        const ws = this.wsConnections.get(tabId);
        if (ws) {
            ws.close();
            this.wsConnections.delete(tabId);
        }
    }

    sendWebSocketMessage(tabId, data) {
        const ws = this.wsConnections.get(tabId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(data.message);
                console.log(`[Content] Tab ${tabId} sent:`, data.message);
                this.sendMessageToSidebar('ws-sent', { tabId, message: data.message });
            } catch (error) {
                console.error(`[Content] Failed to send message for tab ${tabId}:`, error);
                this.sendMessageToSidebar('ws-error', { tabId, error: error.message });
            }
        } else {
            this.sendMessageToSidebar('ws-error', { tabId, error: 'Not connected' });
        }
    }

    async getUserCookies() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['globalSettings'], (result) => {
                if (result.globalSettings) {
                    const settings = result.globalSettings;
                    const cookies = [];
                    if (settings.poeSessId) {
                        cookies.push(`POESESSID=${settings.poeSessId}`);
                    }
                    if (settings.cfClearance) {
                        cookies.push(`cf_clearance=${settings.cfClearance}`);
                    }
                    resolve(cookies.join('; '));
                } else {
                    resolve('');
                }
            });
        });
    }

    // Auto-fetch and auto-whisper logic (like wscat.js) - always enabled
    async processWebSocketMessage(tabId, jsonData) {
        console.log(`[Content] Processing WebSocket message for auto-fetch (tab ${tabId}) - always enabled...`);
        
        if (jsonData && typeof jsonData === 'object') {
            this.extractTradeIds(tabId, jsonData);
        } else {
            console.log(`[Content] Message is not an object, skipping trade ID extraction`);
        }
    }

    extractTradeIds(tabId, obj, path = '') {
        // Recursively search for trade IDs in the object (like wscat.js)
        if (typeof obj === 'string' && this.isTradeId(obj)) {
            console.log(`[Content] 🔄 New trade ID found at path "${path}": ${obj}`);
            this.sendMessageToSidebar('ws-message', { 
                tabId, 
                data: `🔄 Auto-fetch: New trade ID found: ${obj}` 
            });
            this.fetchTradeDetails(tabId, obj);
        } else if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                this.extractTradeIds(tabId, item, `${path}[${index}]`);
            });
        } else if (obj && typeof obj === 'object') {
            Object.keys(obj).forEach(key => {
                this.extractTradeIds(tabId, obj[key], path ? `${path}.${key}` : key);
            });
        }
    }

    isTradeId(str) {
        // Check if string looks like a trade ID (64 character hex string) - like wscat.js
        return /^[a-f0-9]{64}$/i.test(str);
    }

    async fetchTradeDetails(tabId, tradeId) {
        try {
            console.log(`[Content] Auto-fetching trade details for: ${tradeId} (enabled by default)`);
            
            // Check if background script is available
            if (!chrome.runtime || !chrome.runtime.sendMessage) {
                console.error(`[Content] Chrome runtime not available`);
                return;
            }
            
            // Send to background script for HTTP request with timeout
            const messagePromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Message timeout - background script may not be responding'));
                }, 5000); // 5 second timeout
                
                chrome.runtime.sendMessage({
                    type: 'ws-fetch-trade',
                    tabId: tabId,
                    tradeId: tradeId,
                    isAutoFetch: true // Always true since auto-fetch is enabled by default
                }, (response) => {
                    clearTimeout(timeout);
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message || chrome.runtime.lastError));
                    } else {
                        resolve(response);
                    }
                });
            });
            
            try {
                const response = await messagePromise;
                if (response.success) {
                    console.log(`[Content] Fetch message sent successfully for trade ID: ${tradeId}`);
                } else {
                    console.error(`[Content] Fetch failed:`, response.error);
                }
            } catch (error) {
                console.error(`[Content] Error sending fetch message:`, error.message);
                // Try to wake up the background script
                this.wakeUpBackgroundScript();
            }

        } catch (error) {
            console.error(`[Content] Failed to auto-fetch trade details for ${tradeId}:`, error);
        }
    }

    // Auto-whisper is now handled entirely in the background script (like wscat.js)
    // Both auto-fetch and auto-whisper are enabled by default

    sendMessageToSidebar(type, data) {
        const iframe = this.sidebar.querySelector('#sidebar-iframe');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ type, ...data }, '*');
        }
    }

    setupMessageListener() {
        // Listen for messages from background script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            const { type, tabId, ...data } = message;

            switch (type) {
                case 'get-cookies':
                    console.log('[Content] Received get-cookies message');
                    this.getCookiesFromPage().then(cookies => {
                        sendResponse({ cookies });
                    }).catch(error => {
                        console.error('[Content] Error getting cookies:', error);
                        sendResponse({ error: error.message });
                    });
                    return true; // Keep message port open for async response
                case 'get-current-url':
                    console.log('[Content] Received get-current-url message');
                    try {
                        const currentUrl = window.location.href;
                        console.log('[Content] Current URL:', currentUrl);
                        sendResponse({ success: true, url: currentUrl });
                    } catch (error) {
                        console.error('[Content] Error getting current URL:', error);
                        sendResponse({ success: false, error: error.message });
                    }
                    return true; // Keep message port open for async response
                default:
                    break;
            }
        });
    }

    async getCookiesFromPage() {
        try {
            console.log('[Content] Getting cookies from page...');
            
            // Get cookies from document.cookie
            const cookieString = document.cookie;
            console.log('[Content] Raw cookie string:', cookieString);
            
            // Parse cookies
            const cookies = {};
            if (cookieString) {
                cookieString.split(';').forEach(cookie => {
                    const [name, value] = cookie.trim().split('=');
                    if (name && value) {
                        cookies[name] = value;
                    }
                });
            }
            
            console.log('[Content] Parsed cookies:', Object.keys(cookies));
            
            // Find POESESSID and cf_clearance
            const poeSessId = cookies['POESESSID'] || '';
            const cfClearance = cookies['cf_clearance'] || '';
            
            const result = {
                poeSessId,
                cfClearance,
                found: {
                    poeSessId: !!poeSessId,
                    cfClearance: !!cfClearance
                }
            };
            
            console.log('[Content] Cookie result:', {
                poeSessIdFound: result.found.poeSessId,
                cfClearanceFound: result.found.cfClearance,
                poeSessIdLength: result.poeSessId.length,
                cfClearanceLength: result.cfClearance.length
            });
            
            return result;
        } catch (error) {
            console.error('[Content] Error getting cookies from page:', error);
            throw error;
        }
    }

    testBackgroundScript() {
        // Test if background script is responding
        console.log(`[Content] Testing background script connection...`);
        chrome.runtime.sendMessage({ type: 'test-connection' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error(`[Content] Background script not responding:`, chrome.runtime.lastError.message || chrome.runtime.lastError);
            } else {
                console.log(`[Content] Background script is responding:`, response);
            }
        });
    }

    wakeUpBackgroundScript() {
        // Try to wake up the background script by sending a simple message
        console.log(`[Content] Attempting to wake up background script...`);
        chrome.runtime.sendMessage({ type: 'keep-alive' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error(`[Content] Failed to wake up background script:`, chrome.runtime.lastError.message || chrome.runtime.lastError);
            } else {
                console.log(`[Content] Background script woken up:`, response);
            }
        });
    }

    toggleSidebar() {
        if (this.isOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    openSidebar() {
        this.sidebar.classList.add('open');
        this.isOpen = true;
        
        // Update toggle button
        const toggleBtn = document.getElementById('poe2-trade-toggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = '×';
            toggleBtn.title = 'Close POE2 Trade Client';
        }

        // Prevent body scroll when sidebar is open
        document.body.style.overflow = 'hidden';
    }

    closeSidebar() {
        this.sidebar.classList.remove('open');
        this.isOpen = false;
        
        // Update toggle button
        const toggleBtn = document.getElementById('poe2-trade-toggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = '⚡';
            toggleBtn.title = 'Open POE2 Trade Client';
        }

        // Restore body scroll
        document.body.style.overflow = '';
    }
}

// Initialize the sidebar when the script loads
new POE2TradeSidebar();
