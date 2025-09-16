# Global Escape Key Functionality

## Overview
The Electron app now includes global keyboard monitoring that allows you to stop auto-clicking and cursor movement by pressing the Escape key, even when the Electron app is not in focus.

## How It Works

### 1. Global Shortcut Registration
- Uses Electron's built-in `globalShortcut` module
- Registers the Escape key as a system-wide global shortcut
- Works regardless of which application currently has focus

### 2. Implementation Details
- **Main Process**: Registers the global shortcut and handles the escape key press
- **Renderer Process**: Receives notifications when escape is pressed globally
- **Auto-cleanup**: Automatically unregisters shortcuts when the app quits

### 3. User Experience
- Press Escape anywhere on your system to stop auto-clicking
- Visual feedback in the app when escape is pressed globally
- Updated UI text indicates the global functionality

## Code Changes

### Main Process (`main.js`)
```javascript
// Import globalShortcut module
const { app, BrowserWindow, ipcMain, nativeImage, shell, globalShortcut } = require("electron");

// Register global escape shortcut
function registerGlobalEscapeShortcut() {
  const ret = globalShortcut.register('Escape', () => {
    console.log('Global Escape key pressed: Stopping auto-clicking');
    stopAutoClicking();
    
    // Notify renderer
    if (mainWindow) {
      mainWindow.webContents.send("global-escape-pressed", {
        timestamp: new Date().toISOString(),
        message: "Auto-clicking stopped via global Escape key"
      });
    }
  });
}

// Cleanup on app quit
app.on("before-quit", () => {
  globalShortcut.unregisterAll();
});
```

### Renderer Process (`renderer.js`)
```javascript
// Listen for global escape notifications
ipcRenderer.on('global-escape-pressed', (event, data) => {
  console.log('Global Escape key pressed:', data);
  showTemporaryMessage('Auto-clicking stopped via Escape key', 'info');
});
```

## Testing

### Manual Test
1. Start the Electron app
2. Trigger auto-clicking (by sending a whisper)
3. Switch to another application (browser, game, etc.)
4. Press Escape key
5. Auto-clicking should stop immediately

### Automated Test
Run the test script to verify global shortcut registration:
```bash
cd electron-app
node test-global-escape.js
```

## Platform Considerations

### Windows
- Works out of the box
- No additional permissions required

### macOS
- May require accessibility permissions on macOS 10.14+
- User may need to grant permission in System Preferences > Security & Privacy > Privacy > Accessibility

### Linux
- Should work on most distributions
- May require specific desktop environment support

## Benefits

1. **Always Available**: Works even when the app is minimized or not focused
2. **No Dependencies**: Uses built-in Electron functionality
3. **Clean Implementation**: Minimal code changes required
4. **User-Friendly**: Intuitive escape key behavior
5. **Safe Cleanup**: Automatically unregisters shortcuts on app quit

## Troubleshooting

### Global Shortcut Not Working
1. Check console logs for registration success/failure
2. On macOS, verify accessibility permissions
3. Ensure no other applications are using the same shortcut
4. Try restarting the application

### Permission Issues (macOS)
1. Go to System Preferences > Security & Privacy > Privacy > Accessibility
2. Add your Electron app to the list of allowed applications
3. Restart the application

## Future Enhancements

- Add configurable global shortcuts
- Support for multiple global shortcuts
- Visual indicator when global shortcuts are active
- Option to disable global shortcuts

