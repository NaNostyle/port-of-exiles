# Cookie Testing Instructions

## Issues Fixed

1. **Tab ID Error**: Fixed the "No tab with id: -1" error by properly handling tab queries
2. **Cookie API Context**: Fixed cookie access by running cookie operations in popup context where `chrome.cookies` API is available
3. **CSP Eval Error**: Removed `eval()` usage that was blocked by Content Security Policy
4. **Runtime GetURL**: Fixed `chrome.runtime.getURL()` usage in content script context

## How to Test the Fixes

### Method 1: Use Extension Popup Buttons (Recommended)

1. **Reload the extension** in Chrome:
   - Go to `chrome://extensions/`
   - Find "Path of Exile Trade Data Capture"
   - Click the reload button (🔄)

2. **Navigate to pathofexile.com** in your browser

3. **Open the extension popup** by clicking the extension icon

4. **Test cookie access**:
   - Click "Check Cookies" button
   - Click "Test Cookies" button  
   - Click "Debug Cookies" button

5. **Check the console** for detailed results:
   - Right-click on the popup → "Inspect" → Console tab
   - Look for cookie information and any errors

### Method 2: Manual Console Testing

1. **Open the extension popup**
2. **Right-click on the popup** → "Inspect" → Console tab
3. **Run the test script**:
   ```javascript
   // Copy and paste the contents of test-cookie-fixes.js
   // Or run individual commands:
   
   chrome.cookies.getAll({}, function(cookies) {
     console.log('Total cookies:', cookies.length);
     const cfClearance = cookies.find(c => c.name === 'cf_clearance');
     const poeSessId = cookies.find(c => c.name === 'POESESSID');
     console.log('cf_clearance found:', !!cfClearance);
     console.log('POESESSID found:', !!poeSessId);
   });
   ```

## Expected Results

✅ **Success indicators**:
- No "No tab with id: -1" errors
- No "Cookie API is not available" errors  
- No CSP eval errors
- Cookie information displayed in console
- Target cookies (cf_clearance, POESESSID) found and logged

❌ **If you still see errors**:
- Make sure you're testing in the popup context, not the page context
- Check that the extension has proper permissions in manifest.json
- Verify you're on a pathofexile.com page when testing

## What the Extension Does Now

1. **Captures trade data** from POE API calls (working ✅)
2. **Accesses cookies** properly in popup context (fixed ✅)
3. **Sends data to Electron app** via WebSocket (working ✅)
4. **Handles errors gracefully** with proper error messages (improved ✅)

The extension should now work without the tab ID and cookie access errors you were experiencing.
