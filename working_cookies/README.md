# POE2 Trade WebSocket Client - Chrome Extension

A Chrome extension that provides WebSocket trading functionality directly on Path of Exile 2 trade pages. The extension appears as a sidebar drawer on the right side of the screen when you click the lightning bolt icon.

## Features

- **Sidebar Interface**: Appears as a drawer on the right side of POE2 trade pages
- **Multi-tab Interface**: 3 tabs for managing multiple WebSocket connections
- **Auto-fetch Trade Details**: Automatically fetch trade information when new trade IDs are received
- **Auto-send Whispers**: Automatically send whispers to hideout tokens from fetched trades
- **Status Bubbles**: Visual indicators showing connection and auto-mode status
- **Audio Notifications**: Play sound when whispers are successfully sent
- **Global Settings**: Shared cookie configuration across all tabs
- **Real-time Logs**: Live logging of all WebSocket activity
- **Statistics Tracking**: Track messages sent, trades fetched, and whispers sent
- **Floating Toggle**: Lightning bolt icon that appears on POE2 trade pages

## Installation

### Method 1: Load as Unpacked Extension (Development)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the `chrome-extension` folder from this project
5. The extension should now appear in your extensions list

### Method 2: Pack Extension (Distribution)

1. In Chrome extensions page, click "Pack extension"
2. Select the `chrome-extension` folder as the extension root directory
3. Leave the private key field empty for first-time packing
4. Click "Pack Extension" to create a `.crx` file

## Usage

### Getting Started

1. Navigate to any Path of Exile 2 trade page (e.g., `https://www.pathofexile.com/trade2/search/poe2`)
2. Look for the lightning bolt (⚡) icon on the right side of the screen
3. Click the icon to open the sidebar drawer

### Initial Setup

1. In the sidebar, go to the "Settings" tab
2. Enter your authentication cookies:
   - **POESESSID**: Your Path of Exile session ID
   - **CF Clearance**: Your Cloudflare clearance token
   - **User Agent**: Your browser's user agent (optional)
3. Click "Apply Settings"

### Using WebSocket Tabs

1. Switch to any tab (Tab 1-3)
2. Enter a WebSocket URL (e.g., `wss://www.pathofexile.com/api/trade2/live/poe2/...`)
3. Click "Connect" to establish the WebSocket connection
4. Enable auto-modes as needed:
   - **Auto-fetch trade details**: Automatically fetch trade information
   - **Auto-send whispers**: Automatically send whispers to tokens

### Status Indicators

- 🔴 **Red**: Not connected or missing auto-modes
- 🟠 **Orange**: Connected but only partial auto-modes enabled
- 🟢 **Green**: Connected with both auto-modes enabled (pulsing animation)
- ⚪ **Gray**: Connected but no auto-modes enabled

### Manual Actions

- **Send Message**: Send custom WebSocket messages
- **Fetch Trade**: Manually fetch trade details by ID
- **Send Whisper**: Manually send a whisper using a token

## File Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── content.js            # Content script for sidebar injection
├── content.css           # Sidebar positioning and toggle styles
├── sidebar.html          # Sidebar interface HTML
├── sidebar.css           # Sidebar styling
├── sidebar.js            # Sidebar UI logic and event handling
├── background.js         # WebSocket connections and API requests
├── tp-successfull.mp3    # Audio notification file
└── README.md            # This file
```

## Permissions

The extension requires the following permissions:

- **storage**: Save global settings
- **activeTab**: Access current tab information
- **webRequest**: Monitor network requests
- **webRequestBlocking**: Intercept requests (if needed)
- **Host permissions**: Access to pathofexile.com domains

## Security Notes

- The extension stores your authentication cookies locally in Chrome's storage
- Cookies are only sent to pathofexile.com domains
- No data is transmitted to external servers
- All WebSocket connections are direct to Path of Exile servers

## Troubleshooting

### Connection Issues

- Verify your cookies are correct and not expired
- Check that the WebSocket URL is valid
- Ensure you have a stable internet connection

### Audio Notifications Not Working

- Check Chrome's audio permissions for the extension
- Verify the audio file is accessible
- Use the "Test Audio" button in settings

### Auto-modes Not Working

- Ensure you're connected to the WebSocket
- Check that both auto-fetch and auto-whisper are enabled
- Verify your cookies have the necessary permissions

## Development

To modify the extension:

1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## Differences from Electron App

- **Limited to 3 tabs** (vs 10 in Electron app)
- **Sidebar interface** (vs full window)
- **Chrome storage** (vs local file storage)
- **Chrome permissions** (vs system-level access)
- **Only works on POE2 trade pages** (vs standalone app)

## Support

For issues or questions, refer to the main project documentation or create an issue in the project repository.
