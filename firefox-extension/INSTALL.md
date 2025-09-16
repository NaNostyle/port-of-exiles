# Firefox Extension Installation Guide

## Quick Installation (Temporary)

1. **Open Firefox**
2. **Type `about:debugging` in the address bar**
3. **Click "This Firefox"** in the left sidebar
4. **Click "Load Temporary Add-on"**
5. **Navigate to the `firefox-extension` folder**
6. **Select `manifest.json`**
7. **Click "Open"**

The extension will be loaded temporarily and will work until you restart Firefox.

## Permanent Installation (Developer Mode)

1. **Open Firefox**
2. **Type `about:addons` in the address bar**
3. **Click the gear icon** (⚙️) in the top right
4. **Select "Install Add-on From File..."**
5. **Navigate to the `firefox-extension` folder**
6. **Select `manifest.json`**
7. **Click "Add"**

## Verification

After installation:

1. **Look for the extension icon** in the Firefox toolbar
2. **Click the icon** to open the popup
3. **You should see the extension interface** with status and buttons
4. **Navigate to pathofexile.com** to test functionality

## Troubleshooting Installation

### "This add-on could not be installed because it appears to be corrupt"
- Make sure you selected the `manifest.json` file, not the folder
- Verify all files are present in the extension directory
- Check that the manifest.json is valid JSON

### Extension loads but doesn't work
- Check the browser console (F12 → Console) for errors
- Verify the Electron app is running on localhost:8080
- Make sure you're on a pathofexile.com page

### Permission issues
- The extension requests permissions for pathofexile.com domains
- These are automatically granted during installation
- You can check permissions in about:addons → Extension → Permissions

## Uninstalling

### Temporary Installation
- Simply restart Firefox, or
- Go to about:debugging → This Firefox → Remove the extension

### Permanent Installation
- Go to about:addons
- Find the extension in the list
- Click the "Remove" button

## Development Mode

For development and testing:

1. **Use temporary installation** (recommended)
2. **Make changes to the source files**
3. **Go to about:debugging → This Firefox**
4. **Click "Reload"** next to the extension
5. **Test your changes**

This allows you to quickly iterate and test modifications without reinstalling the extension.

