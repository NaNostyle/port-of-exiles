# Auto-Click Functionality Documentation

## Overview
The Electron app now includes automatic clicking functionality that will click on stash items after successful whispers. The system calculates pixel coordinates from grid positions and continuously clicks until the next whisper arrives.

## How It Works

### 1. Grid to Pixel Coordinate Conversion
- **Grid System**: 12x11 perfect squares (based on your Python code)
- **Top-left Corner**: (415, 369) pixels
- **Square Size**: 70x70 pixels each
- **Formula**: `centerX = topLeftX + (squareWidth * gridX) + (squareWidth / 2)`

### 2. Data Flow
```
Trade Data → Extract Stash Position → Calculate Pixel Coordinates → Start Auto-Clicking
```

### 3. Auto-Clicking Process
1. **Successful Whisper** → Extract stash coordinates from trade data
2. **Calculate Pixel Position** → Convert grid coordinates to screen pixels
3. **Start Clicking** → Click every 100ms at the calculated position
4. **Continue Until** → New trade data arrives (stops current clicking)

## Configuration

### Grid Settings (main.js)
```javascript
const GRID_CONFIG = {
  // Top-left corner of the grid
  topLeftX: 415,
  topLeftY: 369,
  
  // Size of each square in pixels
  squareWidth: 70,
  squareHeight: 70,
  
  // Grid size
  cols: 12,
  rows: 11
};
```

### Adjusting for Your Setup
1. **Grid Position**: Update `topLeftX` and `topLeftY` to match your stash grid position
2. **Square Size**: Adjust `squareWidth` and `squareHeight` if your squares are not 70x70 pixels
3. **Click Speed**: Modify the interval in `startAutoClicking` function (currently 200ms)

## Example Calculations

### Grid Position (2, 0) - Third column, First row
```
Center X = 415 + (70 * 2) + (70 / 2) = 415 + 140 + 35 = 590
Center Y = 369 + (70 * 0) + (70 / 2) = 369 + 0 + 35 = 404
Result: (590, 404)
```

### Grid Position (5, 3) - Sixth column, Fourth row
```
Center X = 415 + (70 * 5) + (70 / 2) = 415 + 350 + 35 = 800
Center Y = 369 + (70 * 3) + (70 / 2) = 369 + 210 + 35 = 614
Result: (800, 614)
```

## Features

### ✅ **Automatic Position Extraction**
- Extracts stash coordinates from trade data
- Uses `result.listing.stash.x` and `result.listing.stash.y`

### ✅ **Smart Clicking**
- Starts clicking immediately after successful whisper
- Clicks every 100ms for rapid item selection
- Stops automatically when new trade data arrives

### ✅ **Visual Feedback**
- Real-time status display in Electron app
- Shows current grid position and pixel coordinates
- Active/inactive indicators with animations

### ✅ **Error Handling**
- Graceful handling of missing stash data
- Console logging for debugging
- Continues operation even if clicking fails

## UI Display

### Auto-Click Status Section
- **Active State**: Green pulsing indicator with position details
- **Inactive State**: Gray indicator showing "Waiting for successful whisper"
- **Position Info**: Shows both grid coordinates and pixel coordinates

## Console Output Examples

### Starting Auto-Click
```
📦 Extracted stash position: x=2, y=0
🎯 Grid position (2, 0) → Pixel coordinates (590, 404)
🖱️ Starting auto-click on grid position (2, 0) at pixel (590, 404)
```

### Stopping Auto-Click
```
🔄 New trade data received, stopping current auto-click session
⏹️ Stopped auto-clicking
```

### Error Handling
```
❌ Could not extract stash position for auto-clicking
❌ Error clicking: [error message]
```

## Dependencies Added

- **Built-in Node.js modules**: Uses `child_process` and PowerShell for mouse control
- **No external dependencies**: Uses Windows PowerShell for cross-platform compatibility

## Installation

1. **Install dependencies**:
   ```bash
   cd electron-app
   npm install
   ```

2. **Configure grid settings** (if needed):
   - Edit `grid-config.js` to match your screen resolution and game window position

3. **Start the app**:
   ```bash
   npm start
   ```

## Troubleshooting

### Clicking Not Working
1. **Check coordinates**: Verify the calculated pixel coordinates are correct
2. **Game window**: Ensure the game window is in the expected position
3. **Permissions**: On macOS, you may need to grant accessibility permissions

### Wrong Click Position
1. **Adjust topLeftX/topLeftY**: Modify the coordinates in `main.js` GRID_CONFIG
2. **Check square size**: Verify the squareWidth and squareHeight are correct
3. **Grid position**: Ensure the grid position extraction is working correctly

### Clicking Too Fast/Slow
1. **Adjust interval**: Modify the interval in `startAutoClicking` function (currently 200ms)
2. **PowerShell performance**: PowerShell commands have some overhead, so 200ms is optimal
3. **Game performance**: Consider the game's ability to handle rapid clicks

## Safety Features

- **Rate limiting**: Built-in delays to prevent system overload
- **Automatic stopping**: Stops when new trade data arrives
- **Error recovery**: Continues operation even if individual clicks fail
- **Visual feedback**: Clear indication of clicking status

## Customization

### Changing Click Speed
```javascript
// In main.js, modify the interval
clickInterval = setInterval(() => {
  if (isClicking) {
    clickOnItem(coordinates);
  }
}, 50); // 50ms = 20 clicks per second (faster)
```

### Adding Click Patterns
```javascript
// Example: Double-click pattern
function clickOnItem(coordinates) {
  robot.moveMouse(coordinates.x, coordinates.y);
  robot.mouseClick();
  setTimeout(() => robot.mouseClick(), 50); // Second click after 50ms
}
```

The auto-clicking system is designed to be robust and customizable while maintaining safety and performance.
