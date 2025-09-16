# Testing the POE Extension

## Quick Test Instructions

### Method 1: Console Test Script (Recommended)

1. **Start the Electron app**:
   ```bash
   cd electron-app
   npm start
   ```

2. **Install the Chrome extension**:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `chrome-extension` folder

3. **Test on Path of Exile**:
   - Navigate to `https://www.pathofexile.com/trade`
   - Open Developer Tools (F12)
   - Go to the Console tab
   - Copy and paste the contents of `poe-test-script.js` into the console
   - Press Enter

4. **Check results**:
   - Look for messages like "🎉 Extension captured data:"
   - Check the Electron app for received data

### Method 2: Manual Testing

1. **Start the Electron app** (as above)
2. **Install the Chrome extension** (as above)
3. **Navigate to Path of Exile trade site**:
   - Go to `https://www.pathofexile.com/trade`
   - Open Developer Tools (F12)
   - Go to the Console tab
4. **Perform a trade search**:
   - Search for any item
   - Watch the console for debug messages
   - Look for:
     - `🔍 Intercepted POE trade API call:`
     - `✅ Captured trade data:`
     - `📨 Content script received trade data:`

### Method 3: Debug Page (On POE Site)

1. **Navigate to Path of Exile**:
   - Go to `https://www.pathofexile.com/trade`
2. **Open the debug page**:
   - Copy the contents of `debug-extension.html`
   - Paste into a new tab with `data:text/html,` prefix
   - Or save as HTML and open on the POE domain
3. **Run the tests** using the debug page buttons

## What to Look For

### ✅ Success Indicators:
- Console shows "Extension injected script detected!"
- Console shows "Intercepted POE trade API call:"
- Console shows "Extension captured data:"
- Electron app shows "Connected" status
- Electron app displays captured data

### ❌ Failure Indicators:
- Console shows "Extension injected script not found"
- No interception messages in console
- Electron app shows "Disconnected" status
- No data appears in Electron app

## Troubleshooting

### Extension Not Loading:
1. Check `chrome://extensions/` - extension should be enabled
2. Reload the extension
3. Refresh the POE page
4. Check for error messages in extension details

### No Data Captured:
1. Make sure you're on `pathofexile.com` domain
2. Check console for debug messages
3. Try performing an actual trade search
4. Check if the Electron app is running

### Electron App Not Receiving Data:
1. Make sure Electron app is running (`npm start`)
2. Check WebSocket connection status in Electron app
3. Look for connection errors in Electron app console

## Debug Messages Reference

- `🔍 Intercepted POE trade API call:` - Request was caught
- `✅ Captured trade data:` - Data was successfully captured
- `📨 Content script received trade data:` - Data reached content script
- `📬 Background received message:` - Data reached background script
- `🚀 Attempting to send data to Electron app...` - Trying to send to Electron
- `✅ Connected to Electron app` - Successfully connected to Electron
- `📤 Data sent to Electron app:` - Data was sent to Electron
