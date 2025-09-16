// Chrome Extension Popup Script
// Handles UI interactions and communication with background script

class PopupManager {
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

        // Auto modes
        document.getElementById(`${tabId}-auto-fetch`).addEventListener('change', (e) => {
            this.updateAutoFetch(tabId, e.target.checked);
        });

        document.getElementById(`${tabId}-auto-whisper`).addEventListener('change', (e) => {
            this.updateAutoWhisper(tabId, e.target.checked);
        });

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
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            const { type, tabId, ...data } = message;

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
                    this.updateStats(tabId, data.stats);
                    break;
                case 'ws-error':
                    this.addLogEntry(tabId, 'error', data.error);
                    break;
                case 'auto-fetch-updated':
                    this.updateAutoFetchUI(tabId, data.enabled);
                    break;
                case 'auto-whisper-updated':
                    this.updateAutoWhisperUI(tabId, data.enabled);
                    break;
                case 'trade-fetched':
                    this.addLogEntry(tabId, 'success', `Trade fetched: ${data.tradeId}`);
                    this.updateStats(tabId, data.stats);
                    break;
                case 'fetch-error':
                    this.addLogEntry(tabId, 'error', `Fetch error for ${data.tradeId}: ${data.error}`);
                    break;
                case 'whisper-sent':
                    this.addLogEntry(tabId, 'success', `Whisper sent: ${data.token}`);
                    this.updateStats(tabId, data.stats);
                    break;
                case 'whisper-error':
                    this.addLogEntry(tabId, 'error', `Whisper error for ${data.token}: ${data.error}`);
                    break;
            }
        });
    }

    initializeTabs() {
        // Initialize tab 1
        this.tabs.set('tab1', {
            name: 'Tab 1',
            connected: false,
            autoFetch: false,
            autoWhisper: false,
            stats: { messagesSent: 0, tradesFetched: 0, whispersSent: 0 }
        });

        // Initialize other tabs (2-3)
        for (let i = 2; i <= 3; i++) {
            const tabId = `tab${i}`;
            this.tabs.set(tabId, {
                name: `Tab ${i}`,
                connected: false,
                autoFetch: false,
                autoWhisper: false,
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
            const result = await chrome.storage.local.get(['globalSettings']);
            if (result.globalSettings) {
                const settings = result.globalSettings;
                document.getElementById('global-poe-sessid').value = settings.poeSessId || '';
                document.getElementById('global-cf-clearance').value = settings.cfClearance || '';
                document.getElementById('global-user-agent').value = settings.userAgent || '';
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

    async connectTab(tabId) {
        try {
            const wsUrl = document.getElementById(`${tabId}-ws-url`).value.trim();
            if (!wsUrl) {
                this.addLogEntry(tabId, 'error', 'Please enter a WebSocket URL');
                return;
            }

            chrome.runtime.sendMessage({
                type: 'ws-connect',
                tabId: tabId,
                wsUrl: wsUrl
            });

            this.addLogEntry(tabId, 'info', `Connecting to ${wsUrl}...`);
        } catch (error) {
            this.addLogEntry(tabId, 'error', `Connect error: ${error.message}`);
        }
    }

    async disconnectTab(tabId) {
        try {
            chrome.runtime.sendMessage({
                type: 'ws-disconnect',
                tabId: tabId
            });

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
            chrome.runtime.sendMessage({
                type: 'ws-send',
                tabId: tabId,
                message: message
            });

            messageInput.value = '';
        } catch (error) {
            this.addLogEntry(tabId, 'error', `Send error: ${error.message}`);
        }
    }

    async updateAutoFetch(tabId, enabled) {
        try {
            const tab = this.tabs.get(tabId);
            if (tab) {
                tab.autoFetch = enabled;
                this.updateTabStatusBubble(tabId);
            }

            chrome.runtime.sendMessage({
                type: 'ws-set-auto-fetch',
                tabId: tabId,
                enabled: enabled
            });

            this.addLogEntry(tabId, 'info', `Auto-fetch: ${enabled ? 'enabled' : 'disabled'}`);
        } catch (error) {
            this.addLogEntry(tabId, 'error', `Failed to update auto-fetch: ${error.message}`);
        }
    }

    async updateAutoWhisper(tabId, enabled) {
        try {
            const tab = this.tabs.get(tabId);
            if (tab) {
                tab.autoWhisper = enabled;
                this.updateTabStatusBubble(tabId);
            }

            chrome.runtime.sendMessage({
                type: 'ws-set-auto-whisper',
                tabId: tabId,
                enabled: enabled
            });

            this.addLogEntry(tabId, 'info', `Auto-whisper: ${enabled ? 'enabled' : 'disabled'}`);
        } catch (error) {
            this.addLogEntry(tabId, 'error', `Failed to update auto-whisper: ${error.message}`);
        }
    }

    updateAutoFetchUI(tabId, enabled) {
        const checkbox = document.getElementById(`${tabId}-auto-fetch`);
        if (checkbox) {
            checkbox.checked = enabled;
        }
    }

    updateAutoWhisperUI(tabId, enabled) {
        const checkbox = document.getElementById(`${tabId}-auto-whisper`);
        if (checkbox) {
            checkbox.checked = enabled;
        }
    }

    async fetchTrade(tabId) {
        const tradeIdInput = document.getElementById(`${tabId}-trade-id-input`);
        const tradeId = tradeIdInput.value.trim();
        if (!tradeId) {
            this.addLogEntry(tabId, 'error', 'Please enter a trade ID');
            return;
        }

        try {
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

// Initialize the popup manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
});
