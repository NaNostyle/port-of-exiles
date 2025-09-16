// Sidebar JavaScript - Handles UI interactions and communication with background script
class SidebarManager {
    constructor() {
        this.tabs = new Map();
        this.currentTab = 'settings';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.loadGlobalSettings();
        this.initializeTabs();
        this.setupMessageListener();
    }

    setupEventListeners() {
        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-button')) {
                const tabId = e.target.dataset.tab;
                this.switchTab(tabId);
            }
        });

        // Settings
        document.getElementById('apply-settings-btn').addEventListener('click', () => {
            this.applyGlobalSettings();
        });

        document.getElementById('auto-fill-cookies-btn').addEventListener('click', () => {
            this.autoFillCookies();
        });

        document.getElementById('clear-settings-btn').addEventListener('click', () => {
            this.clearGlobalSettings();
        });

        // Test audio
        document.getElementById('test-audio-btn').addEventListener('click', () => {
            this.testAudio();
        });

        // Tab specific listeners
        this.setupTabListeners('tab1');
        this.setupTabListeners('tab2');
        this.setupTabListeners('tab3');
    }

    setupTabListeners(tabId) {
        // Connect/Disconnect
        document.getElementById(`${tabId}-connect-btn`).addEventListener('click', () => {
            this.connectTab(tabId);
        });

        document.getElementById(`${tabId}-disconnect-btn`).addEventListener('click', () => {
            this.disconnectTab(tabId);
        });

        // WebSocket URL auto-fill
        document.getElementById(`${tabId}-ws-autofill-btn`).addEventListener('click', () => {
            this.autoFillWebSocketUrl(tabId);
        });

        // Auto modes are now always enabled (no toggle needed)

        // Manual actions
        document.getElementById(`${tabId}-send-btn`).addEventListener('click', () => {
            this.sendMessage(tabId);
        });

        document.getElementById(`${tabId}-fetch-trade-btn`).addEventListener('click', () => {
            this.fetchTrade(tabId);
        });

        document.getElementById(`${tabId}-send-whisper-btn`).addEventListener('click', () => {
            this.sendWhisper(tabId);
        });

        // Tab name editing
        document.getElementById(`${tabId}-name-input`).addEventListener('blur', (e) => {
            this.updateTabName(tabId, e.target.value);
        });

        // Clear logs
        document.getElementById(`${tabId}-clear-logs-btn`).addEventListener('click', () => {
            this.clearLogs(tabId);
        });

        // Enter key for message input
        document.getElementById(`${tabId}-message-input`).addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage(tabId);
            }
        });
    }

    setupMessageListener() {
        // Listen for messages from content script (parent window)
        window.addEventListener('message', (event) => {
            const { type, tabId, ...data } = event.data;

            switch (type) {
                case 'ws-connected':
                    this.handleConnectionStatus(tabId, true);
                    break;
                case 'ws-disconnected':
                    this.handleConnectionStatus(tabId, false);
                    break;
                case 'ws-message':
                    this.addLogEntry(tabId, 'info', `Received: ${JSON.stringify(data.data)}`);
                    break;
                case 'ws-sent':
                    this.addLogEntry(tabId, 'success', `Sent: ${data.message}`);
                    break;
                case 'ws-error':
                    this.addLogEntry(tabId, 'error', data.error);
                    break;
            }
        });

        // Still listen for background script messages for HTTP requests
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            const { type, tabId, ...data } = message;

            switch (type) {
                // Auto-fetch and auto-whisper are always enabled (no UI updates needed)
                case 'trade-fetched':
                    this.addLogEntry(tabId, 'success', `✅ Trade details received for: ${data.tradeId}`);
                    this.addLogEntry(tabId, 'info', `📊 Trade ID: ${data.tradeId}`);
                    this.addLogEntry(tabId, 'info', `⏰ Fetched at: ${new Date().toISOString()}`);
                    if (data.response) {
                        this.addLogEntry(tabId, 'info', `📦 Response: ${JSON.stringify(data.response, null, 2)}`);
                    }
                    this.updateStats(tabId, data.stats);
                    break;
                case 'fetch-error':
                    this.addLogEntry(tabId, 'error', `❌ Failed to fetch trade details for ${data.tradeId}: ${data.error}`);
                    break;
                case 'whisper-sent':
                    this.addLogEntry(tabId, 'success', `✅ Whisper sent successfully!`);
                    this.addLogEntry(tabId, 'info', `💬 Token: ${data.token}`);
                    this.addLogEntry(tabId, 'info', `⏰ Sent at: ${new Date().toISOString()}`);
                    if (data.response) {
                        this.addLogEntry(tabId, 'info', `📦 Response: ${JSON.stringify(data.response, null, 2)}`);
                    }
                    this.updateStats(tabId, data.stats);
                    break;
                case 'whisper-error':
                    this.addLogEntry(tabId, 'error', `❌ Failed to send whisper for ${data.token}: ${data.error}`);
                    break;
            }
        });
    }

    initializeTabs() {
        // Initialize tab 1
        this.tabs.set('tab1', {
            name: 'Tab 1',
            connected: false,
            autoFetch: true, // Always enabled by default
            autoWhisper: true, // Always enabled by default
            stats: { messagesSent: 0, tradesFetched: 0, whispersSent: 0 }
        });

        // Initialize other tabs (2-3)
        for (let i = 2; i <= 3; i++) {
            const tabId = `tab${i}`;
            this.tabs.set(tabId, {
                name: `Tab ${i}`,
                connected: false,
                autoFetch: true, // Always enabled by default
                autoWhisper: true, // Always enabled by default
                stats: { messagesSent: 0, tradesFetched: 0, whispersSent: 0 }
            });
        }

        // Update all status bubbles
        this.tabs.forEach((tab, tabId) => {
            this.updateTabStatusBubble(tabId);
        });
    }

    switchTab(tabId) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });

        // Show selected tab content
        const tabContent = document.getElementById(`${tabId}-content`);
        if (tabContent) {
            tabContent.classList.add('active');
        }

        // Add active class to selected tab button
        const tabButton = document.querySelector(`[data-tab="${tabId}"]`);
        if (tabButton) {
            tabButton.classList.add('active');
        }

        this.currentTab = tabId;
    }

    async loadGlobalSettings() {
        try {
            console.log('[Sidebar] Loading global settings from storage...');
            const result = await chrome.storage.local.get(['globalSettings']);
            if (result.globalSettings) {
                const settings = result.globalSettings;
                console.log('[Sidebar] Loaded settings:', {
                    poeSessId: settings.poeSessId ? `${settings.poeSessId.substring(0, 10)}...` : 'empty',
                    cfClearance: settings.cfClearance ? `${settings.cfClearance.substring(0, 10)}...` : 'empty'
                });
                document.getElementById('global-poe-sessid').value = settings.poeSessId || '';
                document.getElementById('global-cf-clearance').value = settings.cfClearance || '';
                document.getElementById('global-user-agent').value = settings.userAgent || '';
            } else {
                console.log('[Sidebar] No global settings found in storage');
            }
        } catch (error) {
            console.error('Failed to load global settings:', error);
        }
    }

    async applyGlobalSettings() {
        try {
            const settings = {
                poeSessId: document.getElementById('global-poe-sessid').value.trim(),
                cfClearance: document.getElementById('global-cf-clearance').value.trim(),
                userAgent: document.getElementById('global-user-agent').value.trim() || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:142.0) Gecko/20100101 Firefox/142.0'
            };

            await chrome.storage.local.set({ globalSettings: settings });
            
            // Send to background script
            chrome.runtime.sendMessage({
                type: 'update-global-settings',
                ...settings
            });

            this.addLogEntry('settings', 'success', 'Global settings applied successfully');
        } catch (error) {
            this.addLogEntry('settings', 'error', `Failed to apply settings: ${error.message}`);
        }
    }

    clearGlobalSettings() {
        document.getElementById('global-poe-sessid').value = '';
        document.getElementById('global-cf-clearance').value = '';
        document.getElementById('global-user-agent').value = '';
    }

    async autoFillCookies() {
        try {
            console.log('[Sidebar] autoFillCookies method called!');
            this.addLogEntry('settings', 'info', '🍪 Fetching cookies from browser...');
            
            // Disable button during fetch
            const button = document.getElementById('auto-fill-cookies-btn');
            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = '🔄 Fetching...';
            
            // Send message to background script to fetch cookies
            console.log('[Sidebar] Sending fetch-cookies message...');
            const response = await chrome.runtime.sendMessage({
                type: 'fetch-cookies'
            });
            
            console.log('[Sidebar] Received response:', response);
            
            if (response && response.success) {
                const { cookies } = response;
                
                // Update the input fields
                console.log('[Sidebar] Updating input fields with cookies:', cookies);
                
                if (cookies.found.poeSessId) {
                    const poeSessIdField = document.getElementById('global-poe-sessid');
                    console.log('[Sidebar] Setting POESESSID field value:', cookies.poeSessId.substring(0, 10) + '...');
                    poeSessIdField.value = cookies.poeSessId;
                    this.addLogEntry('settings', 'success', `✅ Found POESESSID (${cookies.poeSessId.length} chars)`);
                } else {
                    this.addLogEntry('settings', 'warning', '⚠️ POESESSID cookie not found');
                }
                
                if (cookies.found.cfClearance) {
                    const cfClearanceField = document.getElementById('global-cf-clearance');
                    console.log('[Sidebar] Setting cf_clearance field value:', cookies.cfClearance.substring(0, 10) + '...');
                    cfClearanceField.value = cookies.cfClearance;
                    this.addLogEntry('settings', 'success', `✅ Found cf_clearance (${cookies.cfClearance.length} chars)`);
                } else {
                    this.addLogEntry('settings', 'warning', '⚠️ cf_clearance cookie not found');
                }
                
                if (cookies.found.poeSessId && cookies.found.cfClearance) {
                    this.addLogEntry('settings', 'success', '🎉 Both cookies found! Auto-applying settings...');
                    
                    // Automatically apply the settings after auto-fill
                    await this.applyGlobalSettings();
                    this.addLogEntry('settings', 'success', '✅ Settings applied automatically!');
                } else if (cookies.found.poeSessId || cookies.found.cfClearance) {
                    this.addLogEntry('settings', 'warning', '⚠️ Only one cookie found. Make sure you are logged into pathofexile.com');
                    this.addLogEntry('settings', 'info', '💡 Click "Apply Settings" to save the found cookie.');
                } else {
                    this.addLogEntry('settings', 'error', '❌ No cookies found. Make sure you are logged into pathofexile.com');
                }
            } else {
                this.addLogEntry('settings', 'error', `❌ Failed to fetch cookies: ${response.error}`);
            }
        } catch (error) {
            this.addLogEntry('settings', 'error', `❌ Error fetching cookies: ${error.message}`);
        } finally {
            // Re-enable button
            const button = document.getElementById('auto-fill-cookies-btn');
            button.disabled = false;
            button.textContent = '🍪 Auto-Fill from Browser';
        }
    }

    async autoFillWebSocketUrl(tabId) {
        try {
            console.log(`[Sidebar] Auto-filling WebSocket URL for ${tabId}...`);
            this.addLogEntry(tabId, 'info', '🔗 Auto-filling WebSocket URL from current page...');
            
            // Get the current page URL from the content script
            const response = await chrome.runtime.sendMessage({
                type: 'get-current-url'
            });
            
            if (response && response.success && response.url) {
                const currentUrl = response.url;
                console.log(`[Sidebar] Current URL: ${currentUrl}`);
                
                // Extract the last 9 characters from the URL
                const last9Chars = currentUrl.slice(-9);
                console.log(`[Sidebar] Last 9 characters: ${last9Chars}`);
                
                // Build the complete WebSocket URL
                const baseUrl = 'wss://www.pathofexile.com/api/trade2/live/poe2/Rise%20of%20the%20Abyssal/';
                const completeUrl = baseUrl + last9Chars;
                
                console.log(`[Sidebar] Complete WebSocket URL: ${completeUrl}`);
                
                // Update the input field
                const wsUrlField = document.getElementById(`${tabId}-ws-url`);
                wsUrlField.value = completeUrl;
                
                this.addLogEntry(tabId, 'success', `✅ WebSocket URL auto-filled: ${completeUrl}`);
                this.addLogEntry(tabId, 'info', '💡 You can now click "Connect" to establish the WebSocket connection');
            } else {
                throw new Error('Failed to get current URL from content script');
            }
            
        } catch (error) {
            console.error(`[Sidebar] Error auto-filling WebSocket URL for ${tabId}:`, error);
            this.addLogEntry(tabId, 'error', `❌ Failed to auto-fill WebSocket URL: ${error.message}`);
        }
    }

    async connectTab(tabId) {
        try {
            let wsUrl = document.getElementById(`${tabId}-ws-url`).value.trim();
            if (!wsUrl) {
                this.addLogEntry(tabId, 'error', 'Please enter a WebSocket URL');
                return;
            }

            // Clean the URL - remove @ symbol if present and validate
            wsUrl = wsUrl.replace(/^@/, ''); // Remove leading @ symbol
            
            // Validate WebSocket URL format
            if (!wsUrl.startsWith('wss://') && !wsUrl.startsWith('ws://')) {
                this.addLogEntry(tabId, 'error', 'WebSocket URL must start with wss:// or ws://');
                return;
            }

            // Update the input field with cleaned URL
            document.getElementById(`${tabId}-ws-url`).value = wsUrl;

            // Send message to content script
            window.parent.postMessage({
                type: 'ws-connect',
                tabId: tabId,
                wsUrl: wsUrl
            }, '*');

            this.addLogEntry(tabId, 'info', `Connecting to ${wsUrl}...`);
        } catch (error) {
            this.addLogEntry(tabId, 'error', `Connect error: ${error.message}`);
        }
    }

    async disconnectTab(tabId) {
        try {
            // Send message to content script
            window.parent.postMessage({
                type: 'ws-disconnect',
                tabId: tabId
            }, '*');

            this.addLogEntry(tabId, 'info', 'Disconnecting...');
        } catch (error) {
            this.addLogEntry(tabId, 'error', `Disconnect error: ${error.message}`);
        }
    }

    handleConnectionStatus(tabId, connected) {
        const tab = this.tabs.get(tabId);
        if (tab) {
            tab.connected = connected;
            this.updateTabConnectionStatus(tabId);
        }
    }

    updateTabConnectionStatus(tabId) {
        const statusSpan = document.getElementById(`${tabId}-status`);
        const connectBtn = document.getElementById(`${tabId}-connect-btn`);
        const disconnectBtn = document.getElementById(`${tabId}-disconnect-btn`);
        const messageInput = document.getElementById(`${tabId}-message-input`);
        const sendBtn = document.getElementById(`${tabId}-send-btn`);
        const fetchBtn = document.getElementById(`${tabId}-fetch-trade-btn`);
        const whisperBtn = document.getElementById(`${tabId}-send-whisper-btn`);

        const connected = this.tabs.get(tabId).connected;

        if (statusSpan) {
            statusSpan.textContent = connected ? 'Connected' : 'Disconnected';
            statusSpan.className = `tab-status status-indicator ${connected ? 'connected' : 'disconnected'}`;
        }

        if (connectBtn) {
            connectBtn.disabled = connected;
            connectBtn.textContent = connected ? 'Connected' : 'Connect';
        }
        if (disconnectBtn) {
            disconnectBtn.disabled = !connected;
        }
        if (messageInput) {
            messageInput.disabled = !connected;
        }
        if (sendBtn) {
            sendBtn.disabled = !connected;
        }
        if (fetchBtn) {
            fetchBtn.disabled = !connected;
        }
        if (whisperBtn) {
            whisperBtn.disabled = !connected;
        }

        // Update the status bubble
        this.updateTabStatusBubble(tabId);
    }

    updateTabStatusBubble(tabId) {
        const button = document.querySelector(`[data-tab="${tabId}"]`);
        if (!button) return;

        const bubble = button.querySelector('.tab-status-bubble');
        if (!bubble) return;

        const tab = this.tabs.get(tabId);
        if (!tab) return;

        // Determine status based on connection and auto-modes
        let statusClass = 'red'; // Default: not ready
        
        if (tab.connected && tab.autoFetch && tab.autoWhisper) {
            statusClass = 'green'; // All conditions met
        } else if (tab.connected && (tab.autoFetch || tab.autoWhisper)) {
            statusClass = 'orange'; // Connected but not all auto-modes enabled
        } else if (tab.connected) {
            statusClass = 'gray'; // Connected but no auto-modes
        }

        // Remove all status classes
        bubble.classList.remove('green', 'red', 'orange', 'gray', 'pulse');
        
        // Add the appropriate status class
        bubble.classList.add(statusClass);
        
        // Add pulse animation for green status (fully active)
        if (statusClass === 'green') {
            bubble.classList.add('pulse');
        }
    }

    async sendMessage(tabId) {
        const messageInput = document.getElementById(`${tabId}-message-input`);
        const message = messageInput.value.trim();
        if (!message) return;

        try {
            // Send message to content script
            window.parent.postMessage({
                type: 'ws-send',
                tabId: tabId,
                message: message
            }, '*');

            messageInput.value = '';
        } catch (error) {
            this.addLogEntry(tabId, 'error', `Send error: ${error.message}`);
        }
    }

    // Auto-fetch and auto-whisper are now always enabled (no toggle needed)

    // Auto-fetch and auto-whisper UI updates no longer needed (always enabled)

    async fetchTrade(tabId) {
        const tradeIdInput = document.getElementById(`${tabId}-trade-id-input`);
        const tradeId = tradeIdInput.value.trim();
        if (!tradeId) {
            this.addLogEntry(tabId, 'error', 'Please enter a trade ID');
            return;
        }

        try {
            // Send to background script for HTTP request
            chrome.runtime.sendMessage({
                type: 'ws-fetch-trade',
                tabId: tabId,
                tradeId: tradeId
            });

            this.addLogEntry(tabId, 'info', `Fetching trade: ${tradeId}`);
            tradeIdInput.value = '';
        } catch (error) {
            this.addLogEntry(tabId, 'error', `Fetch error: ${error.message}`);
        }
    }

    async sendWhisper(tabId) {
        const whisperTokenInput = document.getElementById(`${tabId}-whisper-token-input`);
        const token = whisperTokenInput.value.trim();
        if (!token) {
            this.addLogEntry(tabId, 'error', 'Please enter a whisper token');
            return;
        }

        try {
            // Send to background script for HTTP request
            chrome.runtime.sendMessage({
                type: 'ws-send-whisper',
                tabId: tabId,
                token: token
            });

            this.addLogEntry(tabId, 'info', `Sending whisper: ${token.substring(0, 50)}...`);
            whisperTokenInput.value = '';
        } catch (error) {
            this.addLogEntry(tabId, 'error', `Whisper error: ${error.message}`);
        }
    }

    updateTabName(tabId, newName) {
        const tab = this.tabs.get(tabId);
        if (tab) {
            tab.name = newName;
            this.updateTabButton(tabId);
        }
    }

    updateTabButton(tabId) {
        const button = document.querySelector(`[data-tab="${tabId}"]`);
        if (button) {
            const bubble = button.querySelector('.tab-status-bubble');
            if (bubble) {
                button.innerHTML = bubble.outerHTML + ' ' + this.tabs.get(tabId).name;
            } else {
                button.textContent = this.tabs.get(tabId).name;
            }
        }
    }

    updateStats(tabId, stats) {
        const tab = this.tabs.get(tabId);
        if (tab) {
            tab.stats = stats;
        }

        // Update UI
        document.getElementById(`${tabId}-messages-sent`).textContent = stats.messagesSent;
        document.getElementById(`${tabId}-trades-fetched`).textContent = stats.tradesFetched;
        document.getElementById(`${tabId}-whispers-sent`).textContent = stats.whispersSent;
    }

    addLogEntry(tabId, type, message) {
        const logContainer = document.getElementById(`${tabId}-logs`);
        if (!logContainer) return;

        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `
            <span class="log-timestamp">[${timestamp}]</span>
            ${message}
        `;

        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;

        // Limit log entries to prevent memory issues
        const entries = logContainer.querySelectorAll('.log-entry');
        if (entries.length > 100) {
            entries[0].remove();
        }
    }

    clearLogs(tabId) {
        const logContainer = document.getElementById(`${tabId}-logs`);
        if (logContainer) {
            logContainer.innerHTML = '';
        }
    }

    testAudio() {
        // Create and play test audio
        const audio = new Audio(chrome.runtime.getURL('tp-successfull.mp3'));
        audio.volume = 0.5;
        audio.play().catch(error => {
            console.log('Audio play failed:', error.message);
            this.addLogEntry('settings', 'error', 'Audio test failed - check if audio file is accessible');
        });
    }
}

// Initialize the sidebar manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SidebarManager();
});
