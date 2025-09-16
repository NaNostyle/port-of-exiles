# Troubleshooting Guide

## Common Issues and Solutions

### 1. Node.js Module Version Compatibility Error

**Error**: `The module was compiled against a different Node.js version using NODE_MODULE_VERSION 127`

**Solution**: 
1. **Clean install**:
   ```bash
   cd electron-app
   rmdir /s /q node_modules
   del package-lock.json
   npm install
   ```

2. **Use the install script**:
   ```bash
   install-dependencies.bat
   ```

3. **If nut-js still fails**, try these alternatives:

### 2. Alternative Auto-Click Solutions

#### Option A: Use Windows API (Windows only)
```javascript
// Add to package.json dependencies:
"ffi-napi": "^4.0.3",
"ref-napi": "^3.0.3"

// Then use Windows API calls for mouse control
```

#### Option B: Use AutoHotkey Integration
1. Install AutoHotkey
2. Create a script that accepts coordinates
3. Call the script from Electron

#### Option C: Use a Different Automation Library
```bash
npm uninstall nut-js
npm install @nut-tree/nut-js
# or
npm install playwright
# or
npm install puppeteer
```

### 3. Build Tools Issues (Windows)

**Error**: `gyp ERR! find VS` or similar build errors

**Solution**:
```bash
# Install Windows Build Tools
npm install --global windows-build-tools

# Or install Visual Studio Build Tools manually
# Download from: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
```

### 4. Permission Issues (macOS)

**Error**: Accessibility permissions required

**Solution**:
1. Go to System Preferences → Security & Privacy → Privacy
2. Select "Accessibility" from the left sidebar
3. Add your terminal app or Electron app to the list
4. Restart the application

### 5. Alternative Implementation Without Native Modules

If all native modules fail, you can implement a simpler approach:

```javascript
// In main.js, replace the nut-js import with:
const { exec } = require('child_process');

// Replace the clickOnItem function with:
function clickOnItem(coordinates) {
  // Use Windows PowerShell to click (Windows only)
  const command = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${coordinates.x}, ${coordinates.y}); [System.Windows.Forms.Cursor]::Click()"`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Error clicking:', error);
    }
  });
}
```

### 6. Testing Without Auto-Click

If auto-clicking continues to have issues, you can temporarily disable it:

```javascript
// In main.js, comment out the auto-clicking parts:
// startAutoClicking(stashPosition.gridX, stashPosition.gridY);

// And just log the coordinates:
console.log(`🎯 Would click at grid position (${stashPosition.gridX}, ${stashPosition.gridY})`);
```

### 7. Manual Coordinate Testing

To test if your coordinates are correct:

1. **Use an online coordinate finder**:
   - Open a browser and go to a coordinate finder website
   - Move your mouse to the stash position
   - Note the coordinates

2. **Compare with calculated coordinates**:
   - Check the console output for calculated coordinates
   - Verify they match your manual measurements

3. **Adjust the configuration**:
   - Modify `topLeftCenter` in the grid configuration
   - Adjust `squareSize` if needed

### 8. Performance Issues

If clicking is too fast/slow:

```javascript
// In main.js, adjust the interval:
clickInterval = setInterval(async () => {
  if (isClicking) {
    await clickOnItem(coordinates);
  }
}, 200); // 200ms = 5 clicks per second (slower)
```

### 9. Game Window Issues

If clicks are not hitting the right spot:

1. **Check game window position**:
   - Ensure the game window is in the expected position
   - Try running the game in windowed mode

2. **Adjust grid configuration**:
   - Update `topLeftCenter` coordinates
   - Recalculate `squareSize`

3. **Use relative coordinates**:
   - Calculate coordinates relative to the game window
   - Add game window offset to all coordinates

### 10. Getting Help

If you're still having issues:

1. **Check the console output** for error messages
2. **Try the alternative implementations** provided
3. **Test with a simple coordinate logger** first
4. **Consider using a different automation approach**

## Quick Fix Commands

```bash
# Clean install
cd electron-app
rmdir /s /q node_modules
del package-lock.json
npm install

# Install build tools (Windows)
npm install --global windows-build-tools

# Try alternative library
npm uninstall nut-js
npm install @nut-tree/nut-js

# Test without auto-click
# Comment out startAutoClicking() calls in main.js
```
