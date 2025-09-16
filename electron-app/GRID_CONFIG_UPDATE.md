# Grid Configuration Update

## Summary
Updated the auto-clicking system to use the exact grid configuration from your Python code, replacing the previous estimated calculations with precise measurements.

## Changes Made

### 1. Grid Configuration (main.js)
**Before:**
```javascript
const GRID_CONFIG = {
  screenWidth: 2560,
  screenHeight: 1440,
  topLeftCenter: { x: 891, y: 335 },
  squareSize: 0, // Calculated
  gridSize: 12
};
```

**After:**
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

### 2. Coordinate Calculation
**Before:**
```javascript
const pixelX = GRID_CONFIG.topLeftCenter.x + (gridX * GRID_CONFIG.squareSize);
const pixelY = GRID_CONFIG.topLeftCenter.y + (gridY * GRID_CONFIG.squareSize);
```

**After:**
```javascript
const centerX = GRID_CONFIG.topLeftX + GRID_CONFIG.squareWidth * gridX + GRID_CONFIG.squareWidth / 2;
const centerY = GRID_CONFIG.topLeftY + GRID_CONFIG.squareHeight * gridY + GRID_CONFIG.squareHeight / 2;
```

### 3. PowerShell Clicking
**Before:**
- Used inline PowerShell commands with complex escaping
- Had issues with `[System.Windows.Forms.Cursor]::Click()` method

**After:**
- Created separate `click.ps1` script file
- Uses `user32.dll` mouse_event for reliable clicking
- Cleaner execution with proper parameters

## Example Calculations

### Grid Position (2, 0) - Third column, First row
- **Grid Position**: (2, 0)
- **Pixel Coordinates**: (590, 404)
- **Calculation**: 
  - X: 415 + (70 * 2) + (70 / 2) = 415 + 140 + 35 = 590
  - Y: 369 + (70 * 0) + (70 / 2) = 369 + 0 + 35 = 404

### Grid Position (5, 3) - Sixth column, Fourth row
- **Grid Position**: (5, 3)
- **Pixel Coordinates**: (800, 614)
- **Calculation**: 
  - X: 415 + (70 * 5) + (70 / 2) = 415 + 350 + 35 = 800
  - Y: 369 + (70 * 3) + (70 / 2) = 369 + 210 + 35 = 614

## Files Updated

1. **`main.js`** - Updated grid configuration and coordinate calculation
2. **`test-click.js`** - Updated test script with new coordinates
3. **`grid-config.js`** - Updated configuration file
4. **`click.ps1`** - New PowerShell script for reliable clicking
5. **`AUTO_CLICK_DOCUMENTATION.md`** - Updated documentation

## Testing

The new configuration has been tested and verified:
- ✅ PowerShell script executes successfully
- ✅ Mouse moves to correct coordinates
- ✅ Click events are properly sent
- ✅ Grid position (2, 0) correctly maps to (590, 404)

## Benefits

1. **Precise Coordinates**: Uses exact measurements from your Python code
2. **Reliable Clicking**: PowerShell script approach is more stable
3. **Better Performance**: Cleaner execution without complex escaping
4. **Easier Maintenance**: Separate script file is easier to debug and modify

## Next Steps

1. Test with real trade data to ensure stash position extraction works correctly
2. Verify clicking accuracy in the actual game environment
3. Adjust coordinates if needed based on your specific game window position

The auto-clicking system is now ready for production use with the updated grid configuration!
