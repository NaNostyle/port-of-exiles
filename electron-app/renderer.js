const { ipcRenderer } = require('electron');

// Global variables
let tradeData = [];
let cookies = {};
let autoScroll = true;
let wsConnection = null;
let teleportHistory = [];
let currentUser = null;
let userProfile = null;

// Electron API setup
window.electronAPI = {
    testRobotJS: () => ipcRenderer.invoke('test-robotjs'),
    testGridPosition: (gridX, gridY) => ipcRenderer.invoke('test-grid-position', gridX, gridY),
    getScreenInfo: () => ipcRenderer.invoke('get-screen-info'),
    checkExistingAuth: () => ipcRenderer.invoke('auth-check-existing'),
    startOAuthFlow: () => ipcRenderer.invoke('auth-start-oauth-flow'),
    waitForOAuthCallback: () => ipcRenderer.invoke('auth-wait-for-callback'),
    handleAuthCallback: (code) => ipcRenderer.invoke('auth-handle-callback', code),
    getUserProfile: () => ipcRenderer.invoke('auth-get-profile'),
    refreshUserProfile: () => ipcRenderer.invoke('auth-refresh-profile'),
    generateTeleportToken: () => ipcRenderer.invoke('auth-generate-teleport-token'),
    createCheckoutSession: (data) => ipcRenderer.invoke('auth-create-checkout', data),
    logout: () => ipcRenderer.invoke('auth-logout'),
    isAuthenticated: () => ipcRenderer.invoke('auth-is-authenticated'),
    getCurrentUser: () => ipcRenderer.invoke('auth-get-current-user'),
    openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
    stopAutobuying: () => ipcRenderer.invoke('stop-autobuying'),
    disableAutobuyFeature: () => ipcRenderer.invoke('disable-autobuy-feature'),
    pauseAutobuying: () => ipcRenderer.invoke('pause-autobuying'),
    resumeAutobuying: () => ipcRenderer.invoke('resume-autobuying'),
    showOverlay: () => ipcRenderer.invoke('show-overlay'),
    hideOverlay: () => ipcRenderer.invoke('hide-overlay'),
    toggleOverlay: () => ipcRenderer.invoke('toggle-overlay')
};

// DOM elements
const dataList = document.getElementById('dataList');
const totalItems = document.getElementById('totalItems');
const lastUpdate = document.getElementById('lastUpdate');
const connectionStatus = document.getElementById('connectionStatus');
const statusIndicator = document.getElementById('statusIndicator');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    console.log('POE Trade Data Viewer initialized');
    
    // Initialize authentication
    initializeAuth();
    
    // Initialize connection status as disconnected
    updateConnectionStatus(false);
    
    // Set up keyboard event listeners
    setupKeyboardListeners();
    
    // Try to connect to WebSocket server
    connectToWebSocket();
    
    // Listen for trade data from main process
    ipcRenderer.on('trade-data', (event, data) => {
        console.log('Received trade data:', data);
        addTradeData(data);
    });
    
    // Listen for cookies data from main process
    ipcRenderer.on('cookies-data', (event, data) => {
        console.log('Received cookies data:', data);
        updateCookies(data.cookies);
    });
    
    // Listen for teleport results from main process
    ipcRenderer.on('teleport-result', (event, data) => {
        console.log('Received teleport result:', data);
        addTeleportResult(data);
    });
    
    // Listen for autobuy status updates from main process
    ipcRenderer.on('autobuy-status', (event, data) => {
        console.log('Received autobuy status:', data);
        updateAutobuyStatus(data);
    });
    
    // Listen for cookies updates from main process
    ipcRenderer.on('cookies-updated', (event, cookiesData) => {
        console.log('Received cookies update:', cookiesData);
        updateCookiesDisplay(cookiesData);
        
        // Complete step 2 if POESESSID is received and we're on step 2
        if (cookiesData.POESESSID && currentStep === 2) {
            completeStep(2);
        }
    });
    
    // Listen for global F1 key press from main process
    ipcRenderer.on('global-f1-pressed', (event, data) => {
        console.log('Global F1 key pressed:', data);
        showTemporaryMessage(data.message || 'F1 key pressed', 'info');
    });
    
    ipcRenderer.on('global-f2-pressed', (event, data) => {
        console.log('Global F2 key pressed:', data);
        showTemporaryMessage(data.message || 'F2 key pressed', 'info');
    });
    
    // Handle overlay status request
    ipcRenderer.on('get-overlay-status-request', (event) => {
        console.log('Main process requested overlay status');
        if (overlayVisible) {
            sendStatusToOverlay();
        }
    });
    
    // Handle overlay closed notification
    ipcRenderer.on('overlay-closed', (event) => {
        console.log('Overlay was closed directly from its window');
        overlayVisible = false;
        
        // Update button text
        const overlayBtn = document.getElementById('overlayToggleBtn');
        if (overlayBtn) {
            overlayBtn.textContent = 'Show Overlay';
        }
    });
    
    // Listen for autobuy enabled status request from main process
    ipcRenderer.on('get-autobuy-enabled-request', (event) => {
        const enabled = isAutobuyEnabled();
        console.log('Main process requested autobuy status:', enabled);
        ipcRenderer.send('autobuy-enabled-response', enabled);
    });
    
    // Listen for profile refresh request after successful teleport
    ipcRenderer.on('refresh-profile-after-teleport', async (event) => {
        console.log('Refreshing profile after successful teleport...');
        try {
            await refreshUserProfile();
            console.log('Profile refreshed successfully after teleport');
            
            // Send updated status to overlay if visible
            if (overlayVisible) {
                sendStatusToOverlay();
            }
        } catch (error) {
            console.error('Failed to refresh profile after teleport:', error);
        }
    });
    
    // Listen for teleport enabled status request from main process
    ipcRenderer.on('get-teleport-enabled-request', (event) => {
        const enabled = isTeleportEnabled();
        console.log('Main process requested teleport status:', enabled);
        ipcRenderer.send('teleport-enabled-response', enabled);
    });
    
    // Listen for autobuy starting warning
    ipcRenderer.on('autobuy-starting-warning', (event, data) => {
        console.log('Autobuy starting warning:', data);
        showTemporaryMessage(data.message, 'error');
        
        // Show countdown if provided
        if (data.countdown) {
            let countdown = data.countdown;
            const countdownInterval = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    showTemporaryMessage(`Auto-buy starting in ${countdown} seconds...`, 'warning');
                } else {
                    clearInterval(countdownInterval);
                    showTemporaryMessage('Auto-buy started!', 'success');
                }
            }, 1000);
        }
    });
    
    // Listen for overlay toggle requests
    ipcRenderer.on('overlay-toggle-teleport-request', (event) => {
        console.log('Overlay requested teleport toggle');
        const teleportToggle = document.getElementById('teleportToggle');
        if (teleportToggle) {
            teleportToggle.checked = !teleportToggle.checked;
            // This will automatically disable autobuy if teleport is disabled
            handleTeleportToggle({ target: teleportToggle });
        }
    });
    
    ipcRenderer.on('overlay-toggle-autobuy-request', (event) => {
        console.log('Overlay requested autobuy toggle');
        const autobuyToggle = document.getElementById('autobuyToggle');
        if (autobuyToggle) {
            const wasEnabled = autobuyToggle.checked;
            autobuyToggle.checked = !autobuyToggle.checked;
            handleAutobuyToggle({ target: autobuyToggle });
            
            // If autobuy was just enabled, show overlay (it's already visible but ensure it's shown)
            if (!wasEnabled && autobuyToggle.checked && !overlayVisible) {
                showOverlay();
            }
        }
    });
    
    // F1 hotkey specific handlers
    ipcRenderer.on('f1-enable-autobuy', (event) => {
        console.log('F1 requested autobuy enable');
        const autobuyToggle = document.getElementById('autobuyToggle');
        if (autobuyToggle && !autobuyToggle.checked) {
            autobuyToggle.checked = true;
            handleAutobuyToggle({ target: autobuyToggle });
            
            // Automatically show overlay when autobuy is enabled via F1
            if (!overlayVisible) {
                showOverlay();
            }
        }
    });
    
    ipcRenderer.on('f1-disable-autobuy', (event) => {
        console.log('F1 requested autobuy disable');
        const autobuyToggle = document.getElementById('autobuyToggle');
        if (autobuyToggle && autobuyToggle.checked) {
            autobuyToggle.checked = false;
            // Use disableAutobuy directly to ensure clicking stops
            disableAutobuy();
        }
    });
    
    // F2 hotkey specific handlers for teleport
    ipcRenderer.on('f2-enable-teleport', (event) => {
        console.log('F2 requested teleport enable');
        const teleportToggle = document.getElementById('teleportToggle');
        if (teleportToggle && !teleportToggle.checked) {
            teleportToggle.checked = true;
            handleTeleportToggle({ target: teleportToggle });
            
            // Automatically show overlay when teleport is enabled via F2
            if (!overlayVisible) {
                showOverlay();
            }
        }
    });
    
    ipcRenderer.on('f2-disable-teleport', (event) => {
        console.log('F2 requested teleport disable');
        const teleportToggle = document.getElementById('teleportToggle');
        if (teleportToggle && teleportToggle.checked) {
            teleportToggle.checked = false;
            // This will automatically disable autobuy if it's enabled
            handleTeleportToggle({ target: teleportToggle });
        }
    });
    
    // Update stats periodically
    setInterval(updateStats, 1000);
    
    // Profile refresh is now only triggered manually or after purchases
    // Removed automatic refresh to reduce unnecessary API calls
    
    // Setup authentication event listeners
    setupAuthEventListeners();
    
    // Setup experimental features
    setupExperimentalFeatures();
});

// Authentication functions
async function initializeAuth() {
    // Check if setup was previously completed
    const setupCompleted = localStorage.getItem('setupCompleted') === 'true';
    
    if (setupCompleted) {
        // Check if user is still authenticated
        try {
            const authResult = await window.electronAPI.checkExistingAuth();
            if (authResult.success) {
                currentUser = authResult.user;
                await loadUserProfile();
                showDashboard();
                return;
            }
        } catch (error) {
            console.error('Auth check error:', error);
        }
    }
    
    // Show login page for mandatory setup
    showLogin();
    initializeVerificationSteps();
}

function setupAuthEventListeners() {
    // Google login button
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', handleGoogleLogin);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Experimental features setup
function setupExperimentalFeatures() {
    console.log('Setting up experimental features...');
    
    const autobuyToggle = document.getElementById('autobuyToggle');
    const teleportToggle = document.getElementById('teleportToggle');
    const confirmAutobuy = document.getElementById('confirmAutobuy');
    const cancelAutobuy = document.getElementById('cancelAutobuy');
    const confirmationModal = document.getElementById('confirmationModal');
    
    console.log('Found elements:', {
        autobuyToggle: !!autobuyToggle,
        teleportToggle: !!teleportToggle,
        confirmAutobuy: !!confirmAutobuy,
        cancelAutobuy: !!cancelAutobuy,
        confirmationModal: !!confirmationModal
    });
    
    if (autobuyToggle) {
        // Set initial toggle state (always disabled - no persistence)
        autobuyToggle.checked = isAutobuyEnabled();
        console.log('Initial autobuy toggle state:', autobuyToggle.checked);
        
        autobuyToggle.addEventListener('change', handleAutobuyToggle);
        console.log('Added autobuy toggle event listener');
    }
    
    if (teleportToggle) {
        // Set initial teleport toggle state (always disabled - no persistence)
        teleportToggle.checked = isTeleportEnabled();
        console.log('Initial teleport toggle state:', teleportToggle.checked);
        
        teleportToggle.addEventListener('change', handleTeleportToggle);
        console.log('Added teleport toggle event listener');
    }
    
    // Update status indicators on page load
    updateStatusIndicators();
    
    // Ensure autobuy is stopped on app startup (in case it was running)
    window.electronAPI.disableAutobuyFeature();
    
    // Send initial status to overlay if it's visible
    if (overlayVisible) {
        sendStatusToOverlay();
    }
    
    if (confirmAutobuy) {
        confirmAutobuy.addEventListener('click', handleConfirmAutobuy);
        console.log('Added confirm autobuy event listener');
    } else {
        console.error('confirmAutobuy button not found!');
    }
    
    if (cancelAutobuy) {
        cancelAutobuy.addEventListener('click', handleCancelAutobuy);
        console.log('Added cancel autobuy event listener');
    } else {
        console.error('cancelAutobuy button not found!');
    }
    
    // Close modal when clicking outside
    if (confirmationModal) {
        confirmationModal.addEventListener('click', (e) => {
            if (e.target === confirmationModal) {
                closeConfirmationModal();
            }
        });
        console.log('Added modal click outside event listener');
    } else {
        console.error('confirmationModal not found!');
    }
}

// Handle autobuy toggle change
function handleAutobuyToggle(event) {
    const isEnabled = event.target.checked;
    
    if (isEnabled) {
        // Check if teleports are disabled
        if (!isTeleportEnabled()) {
            console.log('Teleports are disabled, showing enhanced confirmation');
            // Show confirmation dialog with teleport auto-enable warning
            showConfirmationModal();
        } else {
            console.log('Teleports are enabled, showing standard confirmation');
            // Show confirmation dialog
            showConfirmationModal();
        }
    } else {
        // Disable autobuy immediately
        disableAutobuy();
    }
}

// Show confirmation modal
function showConfirmationModal() {
    const modal = document.getElementById('confirmationModal');
    if (modal) {
        modal.style.display = 'flex';
        console.log('Modal shown');
        
        // Add escape key listener for this modal
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeConfirmationModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }
}

// Close confirmation modal
function closeConfirmationModal() {
    console.log('closeConfirmationModal called');
    const modal = document.getElementById('confirmationModal');
    const toggle = document.getElementById('autobuyToggle');
    
    if (modal) {
        modal.style.display = 'none';
        console.log('Modal hidden');
    }
    
    // Reset toggle to unchecked
    if (toggle) {
        toggle.checked = false;
        console.log('Toggle reset to unchecked');
    }
}

// Handle confirm autobuy
function handleConfirmAutobuy() {
    console.log('handleConfirmAutobuy called');
    
    // Auto-enable teleports if disabled (required for autobuy)
    if (!isTeleportEnabled()) {
        console.log('Auto-enabling teleports for autobuy feature');
        enableTeleport();
        
        // Update teleport toggle state
        const teleportToggle = document.getElementById('teleportToggle');
        if (teleportToggle) {
            teleportToggle.checked = true;
        }
    }
    
    enableAutobuy();
    closeConfirmationModal();
    
    // Update toggle state to checked
    const autobuyToggle = document.getElementById('autobuyToggle');
    if (autobuyToggle) {
        autobuyToggle.checked = true;
    }
    
    // Update status indicators
    updateStatusIndicators();
    
    // Automatically show overlay when autobuy is enabled
    if (!overlayVisible) {
        showOverlay();
    }
    
    // Show enhanced warning message
    showTemporaryMessage('Auto-buy feature enabled! Make sure Path of Exile is your active window. Use with caution!', 'warning');
    
    // Additional warning after a short delay
    setTimeout(() => {
        showTemporaryMessage('⚠️ Remember: Switch to your Path of Exile game window now!', 'error');
    }, 2000);
    
    // Final warning after longer delay
    setTimeout(() => {
        showTemporaryMessage('🎮 Make sure Path of Exile is your active window before trading!', 'info');
    }, 5000);
}

// Handle cancel autobuy
function handleCancelAutobuy() {
    console.log('handleCancelAutobuy called');
    closeConfirmationModal();
    
    // Reset toggle state to unchecked
    const autobuyToggle = document.getElementById('autobuyToggle');
    if (autobuyToggle) {
        autobuyToggle.checked = false;
    }
    
    // Update status indicators
    updateStatusIndicators();
}

// Enable autobuy feature
function enableAutobuy() {
    // Set session state
    sessionAutobuyEnabled = true;
    console.log('Auto-buy feature enabled (session only)');
    
    // Update status indicators
    updateStatusIndicators();
    
    // Send status to overlay if visible
    if (overlayVisible) {
        sendStatusToOverlay();
    }
}

// Disable autobuy feature
function disableAutobuy() {
    // Set session state
    sessionAutobuyEnabled = false;
    console.log('Auto-buy feature disabled (session only)');
    
    // Stop any active autobuying session and disable the feature
    window.electronAPI.disableAutobuyFeature();
    
    // Update toggle state to unchecked
    const autobuyToggle = document.getElementById('autobuyToggle');
    if (autobuyToggle) {
        autobuyToggle.checked = false;
    }

    // Update status indicators
    updateStatusIndicators();
    
    // Send status to overlay if visible
    if (overlayVisible) {
        sendStatusToOverlay();
    }
}

// Session-based state management (no localStorage)
let sessionAutobuyEnabled = false;
let sessionTeleportEnabled = false;

// Check if autobuy is enabled (session only)
function isAutobuyEnabled() {
    return sessionAutobuyEnabled;
}

// Update toggle state to reflect current autobuy status
function updateAutobuyToggleState() {
    const autobuyToggle = document.getElementById('autobuyToggle');
    if (autobuyToggle) {
        const isEnabled = isAutobuyEnabled();
        autobuyToggle.checked = isEnabled;
        console.log('Updated autobuy toggle state to:', isEnabled);
    }
}

// Teleport functionality management
function isTeleportEnabled() {
    return sessionTeleportEnabled;
}

function enableTeleport() {
    // Set session state
    sessionTeleportEnabled = true;
    console.log('Teleport feature enabled (session only)');
}

function disableTeleport() {
    // Set session state
    sessionTeleportEnabled = false;
    console.log('Teleport feature disabled (session only)');
}

// Force enable teleport (for debugging) - session only
function forceEnableTeleport() {
    sessionTeleportEnabled = true;
    console.log('Teleport feature force enabled (session only)');
    updateStatusIndicators();
    
    // Update toggle state
    const teleportToggle = document.getElementById('teleportToggle');
    if (teleportToggle) {
        teleportToggle.checked = true;
    }
}

// Overlay functionality
let overlayVisible = false;

async function toggleOverlay() {
    try {
        await window.electronAPI.toggleOverlay();
        overlayVisible = !overlayVisible;
        
        const overlayBtn = document.getElementById('overlayToggleBtn');
        if (overlayBtn) {
            overlayBtn.textContent = overlayVisible ? 'Hide Overlay' : 'Show Overlay';
        }
        
        // Send fresh data when overlay becomes visible
        if (overlayVisible) {
            setTimeout(() => {
                sendStatusToOverlay();
            }, 100); // Small delay to ensure overlay is fully loaded
        }
        
        showTemporaryMessage(overlayVisible ? 'Overlay shown' : 'Overlay hidden', 'info');
    } catch (error) {
        console.error('Error toggling overlay:', error);
        showTemporaryMessage('Error toggling overlay', 'error');
    }
}

async function showOverlay() {
    try {
        await window.electronAPI.showOverlay();
        overlayVisible = true;
        
        const overlayBtn = document.getElementById('overlayToggleBtn');
        if (overlayBtn) {
            overlayBtn.textContent = 'Hide Overlay';
        }
        
        // Send current status to overlay (always send fresh data when showing)
        setTimeout(() => {
            sendStatusToOverlay();
        }, 100); // Small delay to ensure overlay is fully loaded
    } catch (error) {
        console.error('Error showing overlay:', error);
    }
}

async function hideOverlay() {
    try {
        await window.electronAPI.hideOverlay();
        overlayVisible = false;
        
        const overlayBtn = document.getElementById('overlayToggleBtn');
        if (overlayBtn) {
            overlayBtn.textContent = 'Show Overlay';
        }
    } catch (error) {
        console.error('Error hiding overlay:', error);
    }
}

// Send current status to overlay
function sendStatusToOverlay() {
    if (!overlayVisible) return;
    
    const teleportEnabled = isTeleportEnabled();
    const autobuyEnabled = isAutobuyEnabled();
    
    // Send teleport status
    ipcRenderer.send('overlay-update', {
        type: 'teleport-status',
        enabled: teleportEnabled
    });
    
    // Send autobuy status
    ipcRenderer.send('overlay-update', {
        type: 'autobuy-status',
        enabled: autobuyEnabled,
        active: false, // This will be updated by main process when autobuy starts
        message: 'Ready'
    });
    
    // Send profile data if available
    if (userProfile) {
        ipcRenderer.send('overlay-update', {
            type: 'profile-update',
            tokenCount: userProfile.tokenCount,
            dailyCount: userProfile.dailyCount,
            dailyLimit: userProfile.dailyLimit,
            isSubscribed: userProfile.isSubscribed
        });
    }
}

function handleTeleportToggle(event) {
    const isEnabled = event.target.checked;
    console.log('Teleport toggle changed to:', isEnabled);
    
    if (isEnabled) {
        enableTeleport();
        
        // Automatically show overlay when teleport is enabled
        if (!overlayVisible) {
            showOverlay();
        }
    } else {
        disableTeleport();
        
        // If autobuy is enabled, disable it since it depends on teleport
        if (isAutobuyEnabled()) {
            console.log('Disabling autobuy because teleport was disabled');
            disableAutobuy();
            showTemporaryMessage('Auto-buy disabled because teleport is required', 'warning');
        }
    }
    
    updateStatusIndicators();
    showTemporaryMessage(`Teleport feature ${isEnabled ? 'enabled' : 'disabled'}`, 'info');
    
    // Send status to overlay if visible
    if (overlayVisible) {
        sendStatusToOverlay();
    }
}

// Update status indicators
function updateStatusIndicators() {
    // Update autobuy status
    const autobuyStatusBadge = document.getElementById('autobuyStatusBadge');
    const autobuyStatusDot = document.getElementById('autobuyStatusDot');
    const autobuyStatusText = document.getElementById('autobuyStatusText');
    
    if (autobuyStatusBadge && autobuyStatusDot && autobuyStatusText) {
        const autobuyEnabled = isAutobuyEnabled();
        
        if (autobuyEnabled) {
            autobuyStatusBadge.className = 'status-badge enabled';
            autobuyStatusText.textContent = 'Enabled';
        } else {
            autobuyStatusBadge.className = 'status-badge disabled';
            autobuyStatusText.textContent = 'Disabled';
        }
    }
    
    // Update teleport status
    const teleportStatusBadge = document.getElementById('teleportStatusBadge');
    const teleportStatusDot = document.getElementById('teleportStatusDot');
    const teleportStatusText = document.getElementById('teleportStatusText');
    
    if (teleportStatusBadge && teleportStatusDot && teleportStatusText) {
        const teleportEnabled = isTeleportEnabled();
        console.log('Updating teleport status indicator:', teleportEnabled);
        
        if (teleportEnabled) {
            teleportStatusBadge.className = 'status-badge enabled';
            teleportStatusText.textContent = 'Enabled';
        } else {
            teleportStatusBadge.className = 'status-badge disabled';
            teleportStatusText.textContent = 'Disabled';
        }
    }
}

// Verification Steps Management
let currentStep = 1;
let setupCompleted = false;

function initializeVerificationSteps() {
    // Set up step 1 as active
    updateStepStatus(1, 'active');
    
    // Set up event listeners for verification steps
    setupVerificationEventListeners();
    
    // Start monitoring for extension connection and trade data
    startVerificationMonitoring();
}

function setupVerificationEventListeners() {
    // Proceed to dashboard button
    const proceedBtn = document.getElementById('proceedToDashboard');
    if (proceedBtn) {
        proceedBtn.addEventListener('click', () => {
            showDashboard();
        });
    }
    
    // Extension download links (placeholder - would need actual extension URLs)
    const chromeLink = document.getElementById('chromeExtensionLink');
    const firefoxLink = document.getElementById('firefoxExtensionLink');
    
    if (chromeLink) {
        chromeLink.addEventListener('click', (e) => {
            e.preventDefault();
            // In a real implementation, this would link to the Chrome Web Store
            alert('Chrome extension download would be implemented here');
        });
    }
    
    if (firefoxLink) {
        firefoxLink.addEventListener('click', (e) => {
            e.preventDefault();
            // In a real implementation, this would link to Firefox Add-ons
            alert('Firefox extension download would be implemented here');
        });
    }
}

function updateStepStatus(stepNumber, status) {
    const step = document.getElementById(`step${stepNumber}`);
    const stepStatus = document.getElementById(`step${stepNumber}Status`);
    const stepActions = document.getElementById(`step${stepNumber}Actions`);
    
    if (!step || !stepStatus) return;
    
    // Remove all status classes
    step.classList.remove('active', 'completed');
    
    if (status === 'active') {
        step.classList.add('active');
        stepStatus.querySelector('.checkmark').textContent = '⏳';
        if (stepActions) stepActions.style.display = 'block';
    } else if (status === 'completed') {
        step.classList.add('completed');
        stepStatus.querySelector('.checkmark').textContent = '✅';
        if (stepActions) stepActions.style.display = 'none';
    } else if (status === 'waiting') {
        stepStatus.querySelector('.checkmark').textContent = '⏳';
        if (stepActions) stepActions.style.display = 'none';
    }
}

function completeStep(stepNumber) {
    updateStepStatus(stepNumber, 'completed');
    
    // Move to next step
    if (stepNumber < 3) {
        currentStep = stepNumber + 1;
        updateStepStatus(currentStep, 'active');
    } else {
        // All steps completed
        showSetupComplete();
    }
}

function showSetupComplete() {
    const setupComplete = document.getElementById('setupComplete');
    if (setupComplete) {
        setupComplete.style.display = 'block';
    }
    setupCompleted = true;
    
    // Save setup completion status
    localStorage.setItem('setupCompleted', 'true');
}

function startVerificationMonitoring() {
    // Monitor for extension connection (WebSocket connection)
    setInterval(() => {
        if (currentStep >= 2 && !setupCompleted) {
            checkExtensionConnection();
        }
    }, 2000);
    
    // Monitor for trade data
    setInterval(() => {
        if (currentStep >= 3 && !setupCompleted) {
            checkTradeDataConnection();
        }
    }, 1000);
}

function checkExtensionConnection() {
    // Check if WebSocket is connected and we have received cookies
    const isConnected = wsConnection && wsConnection.readyState === WebSocket.OPEN;
    
    // This function will be called by the cookies-updated event handler
    // when POESESSID is actually received, so we don't need to do anything here
    // The step completion is handled in the cookies-updated event handler
}

function checkTradeDataConnection() {
    // Check if we've received trade data recently
    const hasRecentTradeData = tradeData.length > 0;
    
    if (hasRecentTradeData && currentStep === 3) {
        updateConnectionStatus(true);
        setTimeout(() => {
            completeStep(3);
        }, 2000); // Give user time to see the connection
    }
}

function updateConnectionStatus(connected) {
    const indicator = document.getElementById('connectionIndicator');
    const text = document.getElementById('connectionText');
    
    if (indicator && text) {
        if (connected) {
            indicator.textContent = '🟢';
            indicator.className = 'connection-indicator connected';
            text.textContent = 'Trade data received! Connection verified.';
        } else {
            indicator.textContent = '🔴';
            indicator.className = 'connection-indicator disconnected';
            text.textContent = 'Waiting for trade data...';
        }
    }
}

async function handleGoogleLogin() {
    try {
        // Start OAuth flow
        const result = await window.electronAPI.startOAuthFlow();
        if (result.authUrl) {
            // Open Google OAuth URL in external browser
            await window.electronAPI.openExternalUrl(result.authUrl);
            
            // Show loading message
            const loginBtn = document.getElementById('googleLoginBtn');
            if (loginBtn) {
                loginBtn.textContent = 'Waiting for login...';
                loginBtn.disabled = true;
            }
            
            // Wait for OAuth callback
            const loginResult = await window.electronAPI.waitForOAuthCallback();
            
            if (loginResult.success) {
                currentUser = loginResult.user;
                await loadUserProfile();
                // Complete step 1 and move to step 2
                completeStep(1);
            } else {
                alert('Login failed: ' + (loginResult.error || 'Unknown error'));
            }
            
            // Reset button
            if (loginBtn) {
                loginBtn.textContent = 'Sign in with Google';
                loginBtn.disabled = false;
            }
        }
    } catch (error) {
        console.error('Google login error:', error);
        alert('Login failed: ' + error.message);
        
        // Reset button
        const loginBtn = document.getElementById('googleLoginBtn');
        if (loginBtn) {
            loginBtn.textContent = 'Sign in with Google';
            loginBtn.disabled = false;
        }
    }
}

async function handleLogout() {
    try {
        await window.electronAPI.logout();
        currentUser = null;
        userProfile = null;
        
        // Reset setup status
        localStorage.removeItem('setupCompleted');
        setupCompleted = false;
        currentStep = 1;
        
        showLogin();
        initializeVerificationSteps();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

async function loadUserProfile() {
    try {
        const profile = await window.electronAPI.getUserProfile();
        userProfile = profile;
        updateDashboard(profile);
    } catch (error) {
        console.error('Failed to load user profile:', error);
    }
}

async function refreshUserProfile() {
    try {
        // Pause auto-buying during profile refresh to prevent interference with KV reads
        console.log('Pausing auto-buying for profile refresh...');
        await window.electronAPI.pauseAutobuying();
        
        console.log('Refreshing user profile...');
        const refreshBtn = document.getElementById('refreshProfileBtn');
        if (refreshBtn) {
            refreshBtn.textContent = 'Refreshing...';
            refreshBtn.disabled = true;
        }
        
        const profile = await window.electronAPI.refreshUserProfile();
        userProfile = profile;
        updateDashboard(profile);
        
        console.log('Profile refreshed successfully');
        if (refreshBtn) {
            refreshBtn.textContent = 'Refresh';
            refreshBtn.disabled = false;
        }
        
        // Send updated status to overlay if visible
        if (overlayVisible) {
            sendStatusToOverlay();
        }
        
        // Show success message briefly
        showTemporaryMessage('Profile updated successfully!', 'success');
    } catch (error) {
        console.error('Failed to refresh user profile:', error);
        const refreshBtn = document.getElementById('refreshProfileBtn');
        if (refreshBtn) {
            refreshBtn.textContent = 'Refresh';
            refreshBtn.disabled = false;
        }
        showTemporaryMessage('Failed to refresh profile: ' + error.message, 'error');
    } finally {
        // Resume auto-buying after profile refresh
        setTimeout(async () => {
            console.log('Resuming auto-buying after profile refresh...');
            await window.electronAPI.resumeAutobuying();
        }, 1000); // 1 second delay to ensure KV operations complete
    }
}

function showLogin() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('dashboardSection').style.display = 'none';
}

function showDashboard() {
    // Only show dashboard if setup is completed
    if (setupCompleted) {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'block';
    }
}

function showTemporaryMessage(message, type = 'info') {
    // Create or update temporary message element
    let messageEl = document.getElementById('tempMessage');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'tempMessage';
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            transition: opacity 0.3s ease;
            max-width: 300px;
        `;
        document.body.appendChild(messageEl);
    }
    
    // Set message and style based on type
    messageEl.textContent = message;
    messageEl.style.backgroundColor = type === 'success' ? '#27ae60' : 
                                     type === 'error' ? '#e74c3c' : '#3498db';
    
    // Show message
    messageEl.style.opacity = '1';
    
    // Hide after 3 seconds
    setTimeout(() => {
        messageEl.style.opacity = '0';
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 300);
    }, 3000);
}

function updateDashboard(profile) {
    if (!profile) return;
    
    // Update user info
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userAvatar = document.getElementById('userAvatar');
    
    if (userName) userName.textContent = profile.profile.name;
    if (userEmail) userEmail.textContent = profile.profile.email;
    if (userAvatar) userAvatar.src = profile.profile.profilePicture || 'https://via.placeholder.com/50';
    
    // Update stats
    const tokenBalance = document.getElementById('tokenBalance');
    const dailyUsage = document.getElementById('dailyUsage');
    const subscriptionStatus = document.getElementById('subscriptionStatus');
    
    if (tokenBalance) tokenBalance.textContent = profile.tokenCount || 0;
    if (dailyUsage) dailyUsage.textContent = `${profile.dailyCount || 0}/${profile.dailyLimit || 30}`;
    if (subscriptionStatus) {
        subscriptionStatus.textContent = profile.isSubscribed ? 'Premium' : 'Free';
        subscriptionStatus.style.color = profile.isSubscribed ? '#27ae60' : '#95a5a6';
    }
}

// Purchase functions
async function purchaseTokens(priceId) {
    try {
        // Pause auto-buying during purchase to prevent interference
        console.log('Pausing auto-buying for token purchase...');
        await window.electronAPI.pauseAutobuying();
        
        console.log('Creating checkout session for tokens with priceId:', priceId);
        const result = await window.electronAPI.createCheckoutSession({ priceId, type: 'tokens' });
        console.log('Checkout session result:', result);
        
        if (result.checkoutUrl) {
            console.log('Opening checkout URL:', result.checkoutUrl);
            await window.electronAPI.openExternalUrl(result.checkoutUrl);
            
            // Show message to user about refreshing after purchase
            setTimeout(() => {
                if (confirm('After completing your purchase, click "Refresh" to update your token balance.')) {
                    refreshUserProfile();
                }
            }, 2000);
        } else {
            console.error('No checkout URL received:', result);
            alert('No checkout URL received from server');
        }
    } catch (error) {
        console.error('Purchase error:', error);
        alert('Purchase failed: ' + error.message);
    } finally {
        // Resume auto-buying after purchase process (with a delay to ensure webhook processing)
        setTimeout(async () => {
            console.log('Resuming auto-buying after token purchase...');
            await window.electronAPI.resumeAutobuying();
        }, 5000); // 5 second delay to allow webhook processing
    }
}

async function purchaseSubscription(priceId) {
    try {
        // Pause auto-buying during purchase to prevent interference
        console.log('Pausing auto-buying for subscription purchase...');
        await window.electronAPI.pauseAutobuying();
        
        console.log('Creating checkout session for subscription with priceId:', priceId);
        const result = await window.electronAPI.createCheckoutSession({ priceId, type: 'subscription' });
        console.log('Checkout session result:', result);
        
        if (result.checkoutUrl) {
            console.log('Opening checkout URL:', result.checkoutUrl);
            await window.electronAPI.openExternalUrl(result.checkoutUrl);
            
            // Show message to user about refreshing after purchase
            setTimeout(() => {
                if (confirm('After completing your subscription, click "Refresh" to update your subscription status.')) {
                    refreshUserProfile();
                }
            }, 2000);
        } else {
            console.error('No checkout URL received:', result);
            alert('No checkout URL received from server');
        }
    } catch (error) {
        console.error('Subscription error:', error);
        alert('Subscription failed: ' + error.message);
    } finally {
        // Resume auto-buying after purchase process (with a delay to ensure webhook processing)
        setTimeout(async () => {
            console.log('Resuming auto-buying after subscription purchase...');
            await window.electronAPI.resumeAutobuying();
        }, 5000); // 5 second delay to allow webhook processing
    }
}

function connectToWebSocket() {
    try {
        wsConnection = new WebSocket('ws://localhost:8080');
        
        wsConnection.onopen = function() {
            console.log('Connected to WebSocket server');
            updateConnectionStatus(true);
        };
        
        wsConnection.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                console.log('Received data via WebSocket:', data);
                addTradeData(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
        
        wsConnection.onclose = function() {
            console.log('WebSocket connection closed');
            updateConnectionStatus(false);
            
            // Only try to reconnect if the app is still running
            if (wsConnection !== null) {
                setTimeout(connectToWebSocket, 3000);
            }
        };
        
        wsConnection.onerror = function(error) {
            console.error('WebSocket error:', error);
            updateConnectionStatus(false);
        };
    } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        updateConnectionStatus(false);
    }
}

function addTradeData(data) {
    // Add timestamp if not present
    if (!data.timestamp) {
        data.timestamp = new Date().toISOString();
    }
    
    // Add to beginning of array (newest first)
    tradeData.unshift(data);
    
    // Limit to 100 items to prevent memory issues
    if (tradeData.length > 100) {
        tradeData = tradeData.slice(0, 100);
    }
    
    // Update UI
    updateDataList();
    updateStats();
    
    // Auto-scroll to top if enabled
    if (autoScroll) {
        dataList.scrollTop = 0;
    }
}

function updateDataList() {
    if (tradeData.length === 0) {
        dataList.innerHTML = `
            <div class="empty-state">
                <h3>No Data Yet</h3>
                <p>Navigate to pathofexile.com and perform trade searches to see captured data here.</p>
                <p>Make sure the Chrome extension is installed and active.</p>
            </div>
        `;
        return;
    }
    
    dataList.innerHTML = tradeData.map((item, index) => `
        <div class="data-item">
            <div class="data-item-header">
                <div class="data-timestamp">${formatTimestamp(item.timestamp)}</div>
                <div class="data-url">${item.url || 'Unknown URL'}</div>
            </div>
            <div class="data-content">${JSON.stringify(item.data, null, 2)}</div>
        </div>
    `).join('');
}

function updateStats() {
    totalItems.textContent = tradeData.length;
    
    if (tradeData.length > 0) {
        const lastItem = tradeData[0];
        lastUpdate.textContent = formatTime(lastItem.timestamp);
    } else {
        lastUpdate.textContent = '--:--';
    }
}

function updateCookies(newCookies) {
    // Update cookies object
    Object.assign(cookies, newCookies);
    
    // Update UI to show cookies
    updateCookiesDisplay();
    
    console.log('🍪 Updated cookies:', cookies);
}

function updateCookiesDisplay(cookiesData = null) {
    // Update global cookies object if new data provided
    if (cookiesData) {
        cookies = cookiesData;
    }
    
    // Find or create cookies section
    let cookiesSection = document.getElementById('cookiesSection');
    if (!cookiesSection) {
        cookiesSection = document.createElement('div');
        cookiesSection.id = 'cookiesSection';
        cookiesSection.className = 'cookies-section';
        cookiesSection.innerHTML = `
            <h3>🍪 Cookies</h3>
            <div id="cookiesList" class="cookies-list"></div>
        `;
        
        // Insert after stats
        const stats = document.querySelector('.stats');
        stats.parentNode.insertBefore(cookiesSection, stats.nextSibling);
    }
    
    const cookiesList = document.getElementById('cookiesList');
    cookiesList.innerHTML = '';
    
    if (Object.keys(cookies).length === 0) {
        cookiesList.innerHTML = `
            <div class="empty-state">
                <p>No cookies received yet. Make sure the Chrome extension is connected and has captured cookies.</p>
            </div>
        `;
        return;
    }
    
    Object.keys(cookies).forEach(cookieName => {
        const cookie = cookies[cookieName];
        const cookieDiv = document.createElement('div');
        cookieDiv.className = 'cookie-item';
        cookieDiv.innerHTML = `
            <div class="cookie-name">${cookieName}</div>
            <div class="cookie-value">${cookie.value.substring(0, 50)}${cookie.value.length > 50 ? '...' : ''}</div>
            <div class="cookie-info">
                <small>Domain: ${cookie.domain} | Secure: ${cookie.secure} | HttpOnly: ${cookie.httpOnly}</small>
            </div>
        `;
        cookiesList.appendChild(cookieDiv);
    });
}

function addTeleportResult(result) {
    // Debug: Log the teleport result data
    console.log('Adding teleport result:', result);
    
    // Add to beginning of array (newest first)
    teleportHistory.unshift(result);
    
    // Limit to 50 items to prevent memory issues
    if (teleportHistory.length > 50) {
        teleportHistory = teleportHistory.slice(0, 50);
    }
    
    // Update UI
    updateTeleportDisplay();
}

function updateTeleportDisplay() {
    // Find or create teleport section
    let teleportSection = document.getElementById('teleportSection');
    if (!teleportSection) {
        teleportSection = document.createElement('div');
        teleportSection.id = 'teleportSection';
        teleportSection.className = 'teleport-section';
        teleportSection.innerHTML = `
            <h3>🚀 Teleport History</h3>
            <div id="teleportList" class="teleport-list"></div>
        `;
        
        // Insert after cookies section
        const cookiesSection = document.getElementById('cookiesSection');
        if (cookiesSection) {
            cookiesSection.parentNode.insertBefore(teleportSection, cookiesSection.nextSibling);
        } else {
            // If no cookies section, insert after stats
            const stats = document.querySelector('.stats');
            stats.parentNode.insertBefore(teleportSection, stats.nextSibling);
        }
    }
    
    const teleportList = document.getElementById('teleportList');
    
    if (teleportHistory.length === 0) {
        teleportList.innerHTML = `
            <div class="empty-state">
                <p>No teleports sent yet. Trade data will automatically trigger teleports.</p>
            </div>
        `;
        return;
    }
    
    teleportList.innerHTML = teleportHistory.map((result, index) => `
        <div class="teleport-item ${result.success ? 'success' : 'error'}">
            <div class="teleport-header">
                <div class="teleport-timestamp">${formatTimestamp(result.timestamp)}</div>
                <div class="teleport-status">${result.success ? '✅ Success' : '❌ Failed'}</div>
            </div>
            <div class="teleport-content">
                ${result.success ? 
                    `<div class="teleport-item-name">${result.itemName || 'Unknown Item'}</div>
                     <div class="teleport-account">From: ${result.accountName || 'Unknown Account'}</div>` :
                    `<div class="teleport-error">Error: ${result.error || 'Unknown error'}</div>`
                }
            </div>
        </div>
    `).join('');
}

function updateAutobuyStatus(status) {
    // Find or create autobuy status section
    let autobuyStatusSection = document.getElementById('autobuyStatusSection');
    if (!autobuyStatusSection) {
        autobuyStatusSection = document.createElement('div');
        autobuyStatusSection.id = 'autobuyStatusSection';
        autobuyStatusSection.className = 'autobuy-status-section';
        autobuyStatusSection.innerHTML = `
            <h3>🛒 Auto-Buy Status</h3>
            <div id="autobuyStatusContent" class="autobuy-status-content"></div>
        `;
        
        // Insert after teleport section
        const teleportSection = document.getElementById('teleportSection');
        if (teleportSection) {
            teleportSection.parentNode.insertBefore(autobuyStatusSection, teleportSection.nextSibling);
        } else {
            // If no teleport section, insert after cookies section
            const cookiesSection = document.getElementById('cookiesSection');
            if (cookiesSection) {
                cookiesSection.parentNode.insertBefore(autobuyStatusSection, cookiesSection.nextSibling);
            } else {
                // If no cookies section, insert after stats
                const stats = document.querySelector('.stats');
                stats.parentNode.insertBefore(autobuyStatusSection, stats.nextSibling);
            }
        }
    }
    
    const autobuyStatusContent = document.getElementById('autobuyStatusContent');
    
    if (status.active) {
        autobuyStatusContent.innerHTML = `
            <div class="autobuy-status-active">
                <div class="autobuy-status-indicator active"></div>
                <div class="autobuy-status-info">
                    <div class="autobuy-status-title">Auto-Buying Active</div>
                    <div class="autobuy-status-details">
                        Grid Position: (${status.position.x}, ${status.position.y})<br>
                        Pixel Coordinates: (${status.coordinates.x}, ${status.coordinates.y})<br>
                        <small style="color: #666;">Press <kbd>Esc</kbd> to stop auto-buying (works globally)</small>
                    </div>
                </div>
            </div>
        `;
    } else {
        autobuyStatusContent.innerHTML = `
            <div class="autobuy-status-inactive">
                <div class="autobuy-status-indicator inactive"></div>
                <div class="autobuy-status-info">
                    <div class="autobuy-status-title">Auto-Buying Inactive</div>
                    <div class="autobuy-status-details">Waiting for successful teleport...</div>
                </div>
            </div>
        `;
    }
    
    // Update toggle state to reflect current autobuy status
    updateAutobuyToggleState();
}

function updateConnectionStatus(connected) {
    if (connected) {
        statusIndicator.classList.add('connected');
        connectionStatus.textContent = 'Connected';
    } else {
        statusIndicator.classList.remove('connected');
        connectionStatus.textContent = 'Disconnected';
    }
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
}

function clearAllData() {
    if (confirm('Are you sure you want to clear all captured data?')) {
        tradeData = [];
        updateDataList();
        updateStats();
    }
}

function exportData() {
    if (tradeData.length === 0) {
        alert('No data to export');
        return;
    }
    
    const dataStr = JSON.stringify(tradeData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `poe-trade-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

function exportCookies() {
    if (Object.keys(cookies).length === 0) {
        alert('No cookies to export');
        return;
    }
    
    const cookiesStr = JSON.stringify(cookies, null, 2);
    const cookiesBlob = new Blob([cookiesStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(cookiesBlob);
    link.download = `poe-cookies-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

function toggleAutoScroll() {
    autoScroll = !autoScroll;
    const button = event.target;
    button.textContent = autoScroll ? 'Disable Auto-scroll' : 'Enable Auto-scroll';
    button.classList.toggle('btn-primary');
    button.classList.toggle('btn-secondary');
}

async function testRobotJS() {
    try {
        // Test robotjs by requesting a test click from the main process
        const result = await window.electronAPI.testRobotJS();
        
        if (result.success) {
            alert('✅ RobotJS test successful! The mouse should have clicked at grid position (2, 2).');
        } else {
            alert('❌ RobotJS test failed: ' + result.error);
        }
    } catch (error) {
        alert('❌ RobotJS test error: ' + error.message);
    }
}

async function testGridPositions() {
    try {
        // Test multiple grid positions to verify the improved coordinate system
        const testPositions = [
            { x: 0, y: 0, name: 'Top-left (0,0)' },
            { x: 11, y: 11, name: 'Bottom-right (11,11)' },
            { x: 5, y: 5, name: 'Center (5,5)' },
            { x: 2, y: 0, name: 'Test position (2,0)' }
        ];
        
        let results = [];
        
        for (const pos of testPositions) {
            // Test the improved coordinate system
            const result = await window.electronAPI.testGridPosition(pos.x, pos.y);
            
            results.push({
                position: `${pos.name}`,
                success: result.success,
                coordinates: result.coordinates ? `(${result.coordinates.x}, ${result.coordinates.y})` : 'N/A',
                error: result.error || null
            });
        }
        
        // Display results
        const resultText = results.map(r => 
            `${r.position}: ${r.success ? '✅' : '❌'} ${r.success ? r.coordinates : r.error}`
        ).join('\n');
        
        alert(`Improved Grid System Test Results:\n\n${resultText}\n\nCheck the console for detailed debug information.`);
        
    } catch (error) {
        alert('❌ Grid test error: ' + error.message);
    }
}

async function getScreenInfo() {
    try {
        const result = await window.electronAPI.getScreenInfo();
        
        if (result.success) {
            const info = result.screenInfo;
            const screenText = `
Improved Coordinate System Debug:

Electron Screen:
- Size: ${info.electron.width} x ${info.electron.height}
- Scale Factor: ${info.electron.scaleFactor}
- Work Area Size: ${info.electron.workAreaSize.width} x ${info.electron.workAreaSize.height}
- Bounds: ${info.electron.bounds.x}, ${info.electron.bounds.y}, ${info.electron.bounds.width}, ${info.electron.bounds.height}
- Work Area: ${info.electron.workArea.x}, ${info.electron.workArea.y}, ${info.electron.workArea.width}, ${info.electron.workArea.height}

RobotJS Screen:
- Size: ${info.robotjs.width} x ${info.robotjs.height}

Improved Grid Config:
- Reference Resolution: ${info.gridConfig.REF_WIDTH} x ${info.gridConfig.REF_HEIGHT}
- Reference (0,0) Position: (${info.gridConfig.REF_X0}, ${info.gridConfig.REF_Y0})
- Square Size: ${info.gridConfig.SQUARE_SIZE}px
- Grid Size: ${info.gridConfig.gridCols} x ${info.gridConfig.gridRows}

Scaling Factors:
- Scale X: ${info.scalingFactors.scaleX.toFixed(3)}
- Scale Y: ${info.scalingFactors.scaleY.toFixed(3)}

Check the console for detailed debug information.
            `;
            
            alert(screenText);
        } else {
            alert('❌ Failed to get screen info: ' + result.error);
        }
    } catch (error) {
        alert('❌ Screen info error: ' + error.message);
    }
}

// Set up keyboard event listeners
function setupKeyboardListeners() {
    document.addEventListener('keydown', function(event) {
        // Stop auto-buying when Esc key is pressed
        if (event.key === 'Escape' || event.keyCode === 27) {
            console.log('Esc key pressed - stopping auto-buying');
            stopAutobuying();
        }
    });
}

// Stop auto-buying function
async function stopAutobuying() {
    try {
        // Send message to main process to stop auto-buying
        await window.electronAPI.stopAutobuying();
        console.log('Auto-buying stopped via Esc key');
    } catch (error) {
        console.error('Error stopping auto-buying:', error);
    }
}

// Handle window resize
window.addEventListener('resize', function() {
    // Update layout if needed
});

// Handle visibility change (tab switching)
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Page is hidden, pause updates if needed
    } else {
        // Page is visible, resume updates
        updateStats();
    }
});

// Handle app shutdown
window.addEventListener('beforeunload', function() {
    if (wsConnection) {
        wsConnection.close();
        wsConnection = null;
    }
});
