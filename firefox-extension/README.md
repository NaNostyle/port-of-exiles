# Path of Exile Trade Data Capture - Firefox Extension

This is the Firefox version of the Path of Exile Trade Data Capture extension. It captures JSON responses from the Path of Exile trade API and sends them to the Electron app via WebSocket.

## Features

- **Trade Data Capture**: Automatically captures trade API responses from pathofexile.com
- **Cookie Management**: Extracts and sends POESESSID cookies to the Electron app
- **WebSocket Communication**: Sends captured data to the Electron app running on localhost:8080
- **Popup Interface**: Easy-to-use popup with status, data count, and cookie management
- **Debug Tools**: Comprehensive cookie debugging and testing tools

## Installation

### Method 1: Temporary Installation (Recommended for Development)

1. **Open Firefox**
2. **Navigate to `about:debugging`**
3. **Click "This Firefox"**
4. **Click "Load Temporary Add-on"**
5. **Select the `manifest.json` file** from this directory
6. **The extension will be loaded temporarily** (until Firefox is restarted)

### Method 2: Developer Mode Installation

1. **Open Firefox**
2. **Navigate to `about:addons`**
3. **Click the gear icon** and select "Install Add-on From File"
4. **Select the `manifest.json` file** from this directory
5. **Click "Add"** to install the extension

## Usage

1. **Start the Electron app** (make sure it's running on localhost:8080)
2. **Navigate to pathofexile.com** in Firefox
3. **Click the extension icon** in the toolbar to open the popup
4. **The extension will automatically capture trade data** when you use the trade site
5. **Use the popup buttons** to:
   - View captured data
   - Check and send cookies to the Electron app
   - Test cookie permissions
   - Debug cookie issues
   - Clear captured data

## Files Structure

- `manifest.json` - Extension manifest (Firefox v2 format)
- `background.js` - Background script (adapted for Firefox APIs)
- `content.js` - Content script for injecting into POE pages
- `injected.js` - Script injected into page context to capture fetch requests
- `popup.html` - Extension popup interface
- `popup.js` - Popup script (adapted for Firefox APIs)
- `popup.css` - Popup styling
- `sidebar.html` - Sidebar interface
- `sidebar.js` - Sidebar script
- `sidebar.css` - Sidebar styling
- `content.css` - Content script styling
- `debug-cookies-comprehensive.js` - Cookie debugging utilities
- `test-cookie-fixes.js` - Cookie testing utilities

## Key Differences from Chrome Version

1. **Manifest Version**: Uses manifest v2 instead of v3
2. **Background Script**: Uses persistent background script instead of service worker
3. **API Namespace**: Uses `browser.*` instead of `chrome.*` APIs
4. **Browser Action**: Uses `browser_action` instead of `action`
5. **Permissions**: Host permissions are included in the main permissions array

## Troubleshooting

### Extension Not Loading
- Make sure you're using the correct `manifest.json` file
- Check Firefox console for any error messages
- Ensure all required files are present in the extension directory

### WebSocket Connection Issues
- Verify the Electron app is running on localhost:8080
- Check if the WebSocket server is started in the Electron app
- Look for connection errors in the browser console

### Cookie Issues
- Use the "Debug Cookies" button in the popup to diagnose cookie problems
- Check if you're logged into pathofexile.com
- Verify cookie permissions in Firefox settings

### Data Not Capturing
- Ensure you're on a pathofexile.com page
- Check the extension popup for status information
- Look for JavaScript errors in the browser console

## Development

To modify the extension:

1. **Edit the source files** in this directory
2. **Reload the extension** in Firefox (about:debugging → Reload)
3. **Test your changes** on pathofexile.com
4. **Check the console** for any errors or debug messages

## Support

For issues or questions:
1. Check the browser console for error messages
2. Use the debug tools in the extension popup
3. Verify the Electron app is running and accessible
4. Check the extension permissions in Firefox settings

