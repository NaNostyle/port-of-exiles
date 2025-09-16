const { app, BrowserWindow, ipcMain, nativeImage, shell, globalShortcut } = require("electron");
const path = require("path");
const WebSocket = require("ws");
const axios = require("axios");
const robot = require("robotjs");
const AuthService = require("./auth-service");

let mainWindow;
let overlayWindow;
let wsServer;
let poeSessionId = null;
let lastTeleportTime = 0;
const TELEPORT_RATE_LIMIT = 10000; // 10 seconds in milliseconds
let isTeleportPending = false; // Prevent multiple simultaneous teleport requests
let lastProcessedTradeId = null; // Prevent duplicate processing
let authService = new AuthService();

// Auto-buy configuration
let isAutobuying = false;
let autobuyInterval = null;
let currentItemPosition = null;
let isAutobuyPaused = false; // Flag to pause auto-buying during critical operations

// Grid configuration based on your Python code
const GRID_CONFIG = {
  // Top-left corner of the grid
  topLeftX: 415,
  topLeftY: 300,
  
  // Size of each square in pixels
  squareWidth: 70,
  squareHeight: 70,
  
  // Grid size
  cols: 12,
  rows: 12
};

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, "assets", "icon.png"),
    title: "Port of Exiles"
  });

  // Load the index.html file
  mainWindow.loadFile("index.html");
  
  // Open DevTools in development
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }
}

function createOverlayWindow() {
  if (overlayWindow) {
    overlayWindow.focus();
    return;
  }

  overlayWindow = new BrowserWindow({
    width: 240,
    height: 320,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: "Port of Exiles Overlay"
  });

  overlayWindow.loadFile("overlay.html");
  
  // Handle overlay window close
  overlayWindow.on('closed', () => {
    console.log('Overlay window closed');
    overlayWindow = null;
    
    // Notify renderer that overlay was closed
    if (mainWindow) {
      mainWindow.webContents.send('overlay-closed');
    }
  });
  
  // Make window draggable
  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
}

function startWebSocketServer() {
  wsServer = new WebSocket.Server({ port: 8080 });
  
  wsServer.on("connection", (ws) => {
    console.log("Chrome extension connected");
    
    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data);
        console.log("Received data from Chrome extension:", message);
        
        if (message.type === "TRADE_DATA") {
          handleTradeData(message);
        } else if (message.type === "COOKIES") {
          handleCookies(message.cookies);
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    });
    
    ws.on("close", () => {
      console.log("Chrome extension disconnected");
    });
  });
  
  console.log("WebSocket server started on port 8080");
}

function handleCookies(cookies) {
  console.log("🍪 Received cookies from extension:", cookies);
  
  // Find POESESSID cookie - cookies is an object, not an array
  if (cookies.POESESSID && cookies.POESESSID.value) {
    poeSessionId = cookies.POESESSID.value;
    console.log("✅ POESESSID found and stored:", poeSessionId.substring(0, 20) + "...");
    console.log("🔗 POESESSID domain:", cookies.POESESSID.domain);
    console.log("🔒 POESESSID secure:", cookies.POESESSID.secure);
    
    // Send to renderer
    if (mainWindow) {
      mainWindow.webContents.send("cookies-updated", cookies);
      console.log("📤 Sent cookies to renderer process");
    } else {
      console.log("⚠️ Main window not available to send cookies");
    }
  } else {
    console.log("❌ POESESSID not found in cookies");
    console.log("🔍 Available cookie keys:", Object.keys(cookies));
  }
}

function handleTradeData(tradeData) {
  console.log("📊 New trade data received from extension");
  console.log("🔗 Trade URL:", tradeData.url);
  console.log("📦 Trade data keys:", Object.keys(tradeData.data || {}));
  
  // Send to renderer
  if (mainWindow) {
    mainWindow.webContents.send("trade-data", tradeData);
    console.log("📤 Sent trade data to renderer");
  }
  
  // Handle teleport request
  console.log("🚀 Processing teleport request...");
  handleTeleportRequest(tradeData);
}

async function handleTeleportRequest(tradeData) {
  // Check if teleport feature is enabled
  const teleportEnabled = await checkTeleportEnabled();
  if (!teleportEnabled) {
    console.log("Teleport feature is disabled, skipping teleport request");
    return;
  }
  
  // Create a unique ID for this trade data to prevent duplicates
  const tradeId = tradeData.url + (tradeData.data?.result?.[0]?.listing?.hideout_token || '');
  
  // Check if this is a duplicate request
  if (lastProcessedTradeId === tradeId) {
    console.log("Duplicate trade data detected, skipping...");
    return;
  }
  
  // Check if a teleport request is already pending
  if (isTeleportPending) {
    console.log("Teleport request already pending, skipping...");
    return;
  }
  
  // Check rate limiting
  const now = Date.now();
  const timeSinceLastTeleport = now - lastTeleportTime;
  
  if (timeSinceLastTeleport < TELEPORT_RATE_LIMIT) {
    const waitTime = TELEPORT_RATE_LIMIT - timeSinceLastTeleport;
    console.log(`Teleport rate limited. Waiting ${Math.round(waitTime / 1000)} seconds...`);
    return;
  }
  
  // Process the teleport request immediately
  processTeleportRequest(tradeData);
}

async function processTeleportRequest(tradeData) {
  // Set the request lock
  isTeleportPending = true;
  
  // Check prerequisites
  if (!poeSessionId) {
    console.log("❌ No POESESSID available for teleport request");
    console.log("🔍 Current poeSessionId:", poeSessionId);
    isTeleportPending = false;
    return;
  }
  
  console.log("✅ POESESSID available for teleport request:", poeSessionId.substring(0, 20) + "...");

  if (!authService.isAuthenticated()) {
    console.log("User not authenticated, cannot send teleport");
    isTeleportPending = false;
    return;
  }

  try {
    // Generate teleport token from backend
    console.log("🔄 Calling authService.generateTeleportToken()...");
    const teleportToken = await authService.generateTeleportToken();
    console.log("✅ Generated teleport token:", teleportToken ? teleportToken.substring(0, 20) + "..." : "null");
    
    if (!teleportToken) {
      console.log("❌ Failed to generate teleport token - no tokens available");
      isTeleportPending = false;
      return;
    }
  } catch (error) {
    console.log("Failed to generate teleport token:", error.message);
    isTeleportPending = false;
    return;
  }
  
  // Extract data from trade result
  const tradeResult = tradeData.data.result[0];
  if (!tradeResult || !tradeResult.listing) {
    console.log("Invalid trade data structure");
    isTeleportPending = false;
    return;
  }
  
  // Debug: Log trade result data
  console.log("Trade result data:", {
    itemName: tradeResult.item?.name || tradeResult.item?.typeLine,
    accountName: tradeResult.listing?.account?.name,
    hideoutToken: tradeResult.listing?.hideout_token
  });
  
  const hideoutToken = tradeResult.listing.hideout_token;
  const query = extractQueryFromUrl(tradeData.url);
  
  if (!hideoutToken || !query) {
    console.log("Missing hideout_token or query");
    isTeleportPending = false;
    return;
  }
  
  // Make teleport request
  const teleportUrl = "https://www.pathofexile.com/api/trade2/whisper";
  const requestBody = {
    continue: true,
    token: hideoutToken
  };
  
  const headers = {
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-GB;q=0.6",
    "Content-Type": "application/json",
    "Cookie": `POESESSID=${poeSessionId}`,
    "Origin": "https://www.pathofexile.com",
    "Priority": "u=1, i",
    "Referer": `https://www.pathofexile.com/trade2/search/poe2/Rise%20of%20the%20Abyssal/${query}`,
    "Sec-Ch-Ua": '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
    "Sec-Ch-Ua-Arch": '"x86"',
    "Sec-Ch-Ua-Bitness": '"64"',
    "Sec-Ch-Ua-Full-Version": '"140.0.7339.133"',
    "Sec-Ch-Ua-Full-Version-List": '"Chromium";v="140.0.7339.133", "Not=A?Brand";v="24.0.0.0", "Google Chrome";v="140.0.7339.133"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Model": '""',
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Ch-Ua-Platform-Version": '"10.0.0"',
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    "X-Requested-With": "XMLHttpRequest"
  };
  
  console.log("Sending teleport request...");
  
  // Update the last processed trade ID
  const tradeId = tradeData.url + (tradeData.data?.result?.[0]?.listing?.hideout_token || '');
  lastProcessedTradeId = tradeId;
  
  axios.post(teleportUrl, requestBody, { headers })
    .then(response => {
      console.log("Teleport request successful:", response.status);
      lastTeleportTime = Date.now();
      isTeleportPending = false;
      
      // Stop autobuying on successful teleport
      console.log("🛑 Stopping autobuying due to successful teleport");
      stopAutobuying();
      
      // Send teleport result to renderer
      if (mainWindow) {
        mainWindow.webContents.send("teleport-result", {
          success: true,
          status: response.status,
          timestamp: new Date().toISOString(),
          itemName: tradeResult.item?.name || tradeResult.item?.typeLine || 'Unknown Item',
          accountName: tradeResult.listing?.account?.name || 'Unknown Account'
        });
        
      // Refresh user profile to update token count after successful teleport
      console.log("Refreshing profile after successful teleport...");
      // Wait a bit to ensure backend has processed the token decrease
      setTimeout(() => {
        mainWindow.webContents.send("refresh-profile-after-teleport");
      }, 1000);
      }
      
      // Start auto-buying after 4 seconds (only if enabled)
      setTimeout(async () => {
        const stashPosition = extractStashPosition(tradeResult);
        if (stashPosition) {
          try {
            // Check if autobuy is enabled by sending message to renderer
            const autobuyEnabled = await checkAutobuyEnabled();
            if (autobuyEnabled) {
              // Send warning to renderer before starting autobuy
              if (mainWindow) {
                mainWindow.webContents.send("autobuy-starting-warning", {
                  message: "Auto-buy starting in 3 seconds! Make sure Path of Exile is your active window!",
                  countdown: 3
                });
              }
              
              // Start autobuy after warning
              setTimeout(() => {
                startAutobuying(stashPosition.x, stashPosition.y);
              }, 3000);
            }
          } catch (error) {
            console.error("Error checking autobuy status:", error);
          }
        }
      }, 4000);
    })
    .catch(error => {
      console.error("Teleport request failed:", error.response?.status, error.message);
      isTeleportPending = false;
      
      // Send teleport result to renderer
      if (mainWindow) {
        mainWindow.webContents.send("teleport-result", {
          success: false,
          error: error.message,
          status: error.response?.status,
          timestamp: new Date().toISOString(),
          itemName: tradeResult?.item?.name || tradeResult?.item?.typeLine || 'Unknown Item',
          accountName: tradeResult?.listing?.account?.name || 'Unknown Account'
        });
      }
    });
}

function extractQueryFromUrl(url) {
  const match = url.match(/query=([^&]+)/);
  return match ? match[1] : null;
}

function getTeleportStatus() {
  return {
    isProcessing: isTeleportPending,
    lastTeleportTime: lastTeleportTime,
    timeSinceLastTeleport: Date.now() - lastTeleportTime,
    canSendTeleport: (Date.now() - lastTeleportTime) >= TELEPORT_RATE_LIMIT
  };
}

function extractStashPosition(tradeResult) {
  if (tradeResult.listing && tradeResult.listing.stash) {
    return {
      x: tradeResult.listing.stash.x,
      y: tradeResult.listing.stash.y
    };
  }
  return null;
}

function calculatePixelCoordinates(gridX, gridY) {
  if (gridX < 0 || gridX >= GRID_CONFIG.cols || gridY < 0 || gridY >= GRID_CONFIG.rows) {
    console.error(`Invalid grid position: (${gridX}, ${gridY})`);
    return null;
  }
  
  const centerX = GRID_CONFIG.topLeftX + GRID_CONFIG.squareWidth * gridX + GRID_CONFIG.squareWidth / 2;
  const centerY = GRID_CONFIG.topLeftY + GRID_CONFIG.squareHeight * gridY + GRID_CONFIG.squareHeight / 2;
  
  return { x: centerX, y: centerY };
}

function startAutobuying(gridX, gridY) {
  if (isAutobuying) {
    console.log("Already auto-buying, stopping previous session");
    stopAutobuying();
  }
  
  const coordinates = calculatePixelCoordinates(gridX, gridY);
  if (!coordinates) {
    console.error("Invalid coordinates for auto-buying");
    return;
  }
  
  console.log(`Starting auto-buying at grid position (${gridX}, ${gridY}) -> pixel (${coordinates.x}, ${coordinates.y})`);
  
  isAutobuying = true;
  currentItemPosition = { x: gridX, y: gridY };
  
  // Send status to renderer
  if (mainWindow) {
    mainWindow.webContents.send("autobuy-status", {
      active: true,
      position: { x: gridX, y: gridY },
      coordinates: coordinates
    });
  }
  
  // Send to overlay
  sendToOverlay({
    type: "autobuy-status",
    enabled: true,
    active: true,
    message: "Auto-buying started"
  });
  
  // Start clicking every 200ms
  autobuyInterval = setInterval(() => {
    clickOnItem(coordinates);
  }, 200);
}

function stopAutobuying() {
  if (autobuyInterval) {
    clearInterval(autobuyInterval);
    autobuyInterval = null;
  }
  
  if (isAutobuying) {
    console.log("Stopped auto-buying");
    isAutobuying = false;
    currentItemPosition = null;
    
    // Send status to renderer
    if (mainWindow) {
      mainWindow.webContents.send("autobuy-status", {
        active: false,
        position: null,
        coordinates: null
      });
    }
    
    // Send to overlay
    sendToOverlay({
      type: "autobuy-status",
      enabled: true, // Feature is still enabled, just not active
      active: false,
      message: "Auto-buying stopped"
    });
  }
}

function disableAutobuyFeature() {
  console.log("Disabling autobuy feature completely");
  
  // Stop any active clicking
  if (autobuyInterval) {
    clearInterval(autobuyInterval);
    autobuyInterval = null;
  }
  
  if (isAutobuying) {
    console.log("Stopped auto-buying due to feature disable");
    isAutobuying = false;
    currentItemPosition = null;
    
    // Send status to renderer
    if (mainWindow) {
      mainWindow.webContents.send("autobuy-status", {
        active: false,
        position: null,
        coordinates: null
      });
    }
    
    // Send to overlay
    sendToOverlay({
      type: "autobuy-status",
      enabled: false, // Feature is now disabled
      active: false,
      message: "Auto-buy feature disabled"
    });
  }
}

function clickOnItem(coordinates) {
  // Don't click if auto-buying is paused
  if (isAutobuyPaused) {
    console.log("Auto-buying paused, skipping click");
    return;
  }
  
  try {
    // Move mouse to position and click
    robot.moveMouse(coordinates.x, coordinates.y);
    robot.mouseClick();
    console.log(`Clicked at (${coordinates.x}, ${coordinates.y})`);
  } catch (error) {
    console.error("Error clicking:", error.message);
  }
}

// IPC handlers
ipcMain.handle("get-cookies", () => {
  return poeSessionId ? [{ name: "POESESSID", value: poeSessionId }] : [];
});

ipcMain.handle("get-trade-data", () => {
  return null; // No persistent trade data storage
});

ipcMain.handle("get-teleport-history", () => {
  return []; // No persistent teleport history
});

ipcMain.handle("get-autobuy-status", () => {
  return {
    active: isAutobuying,
    position: currentItemPosition,
    coordinates: currentItemPosition ? calculatePixelCoordinates(currentItemPosition.x, currentItemPosition.y) : null,
    paused: isAutobuyPaused
  };
});

// Pause auto-buying during critical operations
ipcMain.handle("pause-autobuying", () => {
  isAutobuyPaused = true;
  console.log("Auto-buying paused for critical operation");
  return { success: true };
});

// Resume auto-buying after critical operations
ipcMain.handle("resume-autobuying", () => {
  isAutobuyPaused = false;
  console.log("Auto-buying resumed after critical operation");
  return { success: true };
});

ipcMain.handle("test-robotjs", async () => {
  try {
    // Test robotjs by clicking at grid position (2, 2)
    const testCoordinates = calculatePixelCoordinates(2, 2);
    if (testCoordinates) {
      robot.moveMouse(testCoordinates.x, testCoordinates.y);
      robot.mouseClick();
      console.log(`RobotJS test: Clicked at grid (2, 2) -> pixel (${testCoordinates.x}, ${testCoordinates.y})`);
      return { success: true, coordinates: testCoordinates };
    } else {
      return { success: false, error: "Invalid coordinates" };
    }
  } catch (error) {
    console.error("RobotJS test failed:", error);
    return { success: false, error: error.message };
  }
});

// Authentication IPC handlers
ipcMain.handle("auth-check-existing", async () => {
  try {
    return await authService.checkExistingAuth();
  } catch (error) {
    console.error("Auth check error:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("auth-start-oauth-flow", async () => {
  try {
    authService.initializeGoogleAuth();
    const result = await authService.startOAuthFlow();
    return { authUrl: result.authUrl };
  } catch (error) {
    console.error("OAuth flow start error:", error);
    return { error: error.message };
  }
});

ipcMain.handle("auth-wait-for-callback", async () => {
  try {
    const result = await authService.waitForOAuthCallback();
    if (result.success) {
      const loginResult = await authService.handleGoogleCallback(result.code);
      return loginResult;
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("OAuth callback error:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("auth-handle-callback", async (event, code) => {
  try {
    return await authService.handleGoogleCallback(code);
  } catch (error) {
    console.error("Auth callback error:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("auth-get-profile", async () => {
  try {
    return await authService.getUserProfile();
  } catch (error) {
    console.error("Get profile error:", error);
    return { error: error.message };
  }
});

ipcMain.handle("auth-refresh-profile", async () => {
  try {
    return await authService.refreshUserProfile();
  } catch (error) {
    console.error("Refresh profile error:", error);
    return { error: error.message };
  }
});

ipcMain.handle("auth-generate-teleport-token", async () => {
  try {
    return await authService.generateTeleportToken();
  } catch (error) {
    console.error("Generate teleport token error:", error);
    return { error: error.message };
  }
});

ipcMain.handle("auth-create-checkout", async (event, data) => {
  try {
    const { priceId, type } = data;
    console.log("Creating checkout session with:", { priceId, type });
    const result = await authService.createCheckoutSession(priceId, type);
    console.log("Checkout session created:", result);
    return result;
  } catch (error) {
    console.error("Create checkout error:", error);
    return { error: error.message };
  }
});

ipcMain.handle("auth-logout", () => {
  authService.logout();
  return { success: true };
});

ipcMain.handle("auth-is-authenticated", () => {
  return authService.isAuthenticated();
});

ipcMain.handle("auth-get-current-user", () => {
  return authService.getCurrentUser();
});

ipcMain.handle("get-teleport-status", () => {
  return getTeleportStatus();
});

// Function to check if autobuy is enabled (used by main process)
function checkAutobuyEnabled() {
  return new Promise((resolve) => {
    if (mainWindow) {
      mainWindow.webContents.send("get-autobuy-enabled-request");
      
      // Listen for the response
      const handleResponse = (event, enabled) => {
        ipcMain.removeListener("autobuy-enabled-response", handleResponse);
        resolve(enabled);
      };
      
      ipcMain.on("autobuy-enabled-response", handleResponse);
      
      // Timeout after 1 second
      setTimeout(() => {
        ipcMain.removeListener("autobuy-enabled-response", handleResponse);
        resolve(false); // Default to false if no response
      }, 1000);
    } else {
      resolve(false);
    }
  });
}

// Function to check if teleport is enabled (used by main process)
function checkTeleportEnabled() {
  return new Promise((resolve) => {
    if (mainWindow) {
      mainWindow.webContents.send("get-teleport-enabled-request");
      
      // Listen for the response
      const handleResponse = (event, enabled) => {
        ipcMain.removeListener("teleport-enabled-response", handleResponse);
        resolve(enabled);
      };
      
      ipcMain.on("teleport-enabled-response", handleResponse);
      
      // Timeout after 1 second
      setTimeout(() => {
        ipcMain.removeListener("teleport-enabled-response", handleResponse);
        resolve(true); // Default to true if no response
      }, 1000);
    } else {
      resolve(true);
    }
  });
}

// Handle get autobuy enabled status request
ipcMain.handle("get-autobuy-enabled", () => {
  return checkAutobuyEnabled();
});

// Handle get teleport enabled status request
ipcMain.handle("get-teleport-enabled", () => {
  return checkTeleportEnabled();
});

// Handle overlay window requests
ipcMain.handle("show-overlay", () => {
  createOverlayWindow();
});

ipcMain.handle("hide-overlay", () => {
  if (overlayWindow) {
    overlayWindow.close();
  }
});

ipcMain.handle("toggle-overlay", () => {
  if (overlayWindow) {
    overlayWindow.close();
  } else {
    createOverlayWindow();
  }
});

// Function to send data to overlay window
function sendToOverlay(data) {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send("overlay-update", data);
  }
}

// Handle overlay update requests from renderer
ipcMain.on('overlay-update', (event, data) => {
  sendToOverlay(data);
});

// Handle overlay toggle requests
ipcMain.on('overlay-toggle-teleport', (event) => {
  console.log('Overlay requested teleport toggle');
  // Always bring main window to focus for teleport toggle
  if (mainWindow) {
    mainWindow.focus();
    mainWindow.show();
    mainWindow.webContents.send('overlay-toggle-teleport-request');
  }
});

ipcMain.on('overlay-toggle-autobuy', async (event) => {
  console.log('Overlay requested autobuy toggle');
  
  if (mainWindow) {
    // Check current autobuy status before deciding whether to focus
    try {
      const isAutobuyEnabled = await checkAutobuyEnabled();
      console.log('Current autobuy status:', isAutobuyEnabled);
      
      // Always bring focus when toggling autobuy (user requested this)
      console.log('Bringing main window to focus for autobuy toggle');
      mainWindow.focus();
      mainWindow.show();
      
      // Send the toggle request
      mainWindow.webContents.send('overlay-toggle-autobuy-request');
    } catch (error) {
      console.error('Error checking autobuy status:', error);
      // Fallback: always focus if we can't check status
      mainWindow.focus();
      mainWindow.show();
      mainWindow.webContents.send('overlay-toggle-autobuy-request');
    }
  }
});

// Handle overlay status request
ipcMain.on('request-overlay-status', (event) => {
  console.log('Overlay requested initial status');
  
  if (mainWindow) {
    // Request current status from renderer
    mainWindow.webContents.send('get-overlay-status-request');
  }
});

// Handle stop auto-buying request
ipcMain.handle("stop-autobuying", () => {
  console.log("Received stop auto-buying request from renderer");
  stopAutobuying();
  return { success: true };
});

ipcMain.handle("disable-autobuy-feature", () => {
  console.log("Received disable autobuy feature request from renderer");
  disableAutobuyFeature();
  return { success: true };
});

// Handle external URLs (for OAuth redirects)
ipcMain.handle("open-external-url", (event, url) => {
  console.log("Opening external URL:", url);
  shell.openExternal(url);
});

// Global keyboard shortcut functions
function registerGlobalF2Shortcut() {
  try {
    // Register the F2 key as a global shortcut
    const ret = globalShortcut.register('F2', async () => {
      console.log('Global F2 key pressed: Toggling teleport feature');
      
      try {
        // Check current teleport status
        const isTeleportEnabled = await checkTeleportEnabled();
        console.log('Current teleport status:', isTeleportEnabled);
        
        if (isTeleportEnabled) {
          // Currently enabled, disable it
          console.log('Disabling teleport feature via F2');
          
          // Send notification to renderer to disable teleport
          if (mainWindow) {
            mainWindow.webContents.send("global-f2-pressed", {
              timestamp: new Date().toISOString(),
              message: "Teleport feature disabled via F2"
            });
            // Send direct disable request
            mainWindow.webContents.send('f2-disable-teleport');
          }
          
          // Send to overlay
          sendToOverlay({
            type: "teleport-status",
            enabled: false,
            message: "Teleport feature disabled via F2"
          });
          
          // Also send autobuy status update to overlay (will be disabled by renderer)
          sendToOverlay({
            type: "autobuy-status",
            enabled: false,
            active: false,
            message: "Auto-buy disabled (teleport required)"
          });
        } else {
          // Currently disabled, enable it
          console.log('Enabling teleport feature via F2');
          
          // Focus main window first
          if (mainWindow) {
            mainWindow.focus();
            mainWindow.show();
            
            // Send notification to renderer to enable teleport
            mainWindow.webContents.send("global-f2-pressed", {
              timestamp: new Date().toISOString(),
              message: "Teleport feature enabled via F2"
            });
            // Send direct enable request
            mainWindow.webContents.send('f2-enable-teleport');
          }
          
          // Send to overlay
          sendToOverlay({
            type: "teleport-status",
            enabled: true,
            message: "Teleport feature enabled via F2"
          });
        }
      } catch (error) {
        console.error('Error toggling teleport via F2:', error);
      }
    });
    
    if (ret) {
      console.log('Global F2 shortcut registered successfully');
    } else {
      console.log('Failed to register global F2 shortcut');
    }
  } catch (error) {
    console.error('Error registering global F2 shortcut:', error);
  }
}

function registerGlobalF1Shortcut() {
  try {
    // Register the F1 key as a global shortcut
    const ret = globalShortcut.register('F1', async () => {
      console.log('Global F1 key pressed: Toggling auto-buy feature');
      
      try {
        // Check current autobuy status
        const isAutobuyEnabled = await checkAutobuyEnabled();
        console.log('Current autobuy status:', isAutobuyEnabled);
        
        if (isAutobuyEnabled) {
          // Currently enabled, disable it
          console.log('Disabling autobuy feature via F1');
          
          // Send notification to renderer to disable autobuy
          if (mainWindow) {
            mainWindow.webContents.send("global-f1-pressed", {
              timestamp: new Date().toISOString(),
              message: "Auto-buy feature disabled via F1"
            });
            // Send direct disable request (no modal needed)
            mainWindow.webContents.send('f1-disable-autobuy');
          }
          
          // Send to overlay
          sendToOverlay({
            type: "autobuy-status",
            enabled: false,
            active: false,
            message: "Auto-buy feature disabled via F1"
          });
        } else {
          // Currently disabled, enable it
          console.log('Enabling autobuy feature via F1');
          
          // Focus main window first to show modal
          if (mainWindow) {
            mainWindow.focus();
            mainWindow.show();
            
            // Send notification to renderer to enable autobuy
            mainWindow.webContents.send("global-f1-pressed", {
              timestamp: new Date().toISOString(),
              message: "Auto-buy feature enabled via F1"
            });
            // Send direct enable request (will show modal)
            mainWindow.webContents.send('f1-enable-autobuy');
          }
          
          // Send to overlay
          sendToOverlay({
            type: "autobuy-status",
            enabled: true,
            active: false,
            message: "Auto-buy feature enabled via F1"
          });
        }
      } catch (error) {
        console.error('Error toggling autobuy via F1:', error);
      }
    });

    if (ret) {
      console.log('Global F1 shortcut registered successfully');
    } else {
      console.log('Failed to register global F1 shortcut');
    }

    // Check if the shortcut is registered
    console.log('Global F1 shortcut is registered:', globalShortcut.isRegistered('F1'));
  } catch (error) {
    console.error('Error registering global F1 shortcut:', error);
  }
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  startWebSocketServer();
  
  // Register global F1 key shortcut to toggle auto-buying
  registerGlobalF1Shortcut();
  
  // Register global F2 key shortcut to toggle teleport
  registerGlobalF2Shortcut();
  
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (wsServer) {
    wsServer.close();
  }
  // Stop OAuth server on app quit
  if (authService && authService.oauthServer) {
    authService.oauthServer.stop();
  }
  // Unregister global shortcuts
  globalShortcut.unregisterAll();
});
