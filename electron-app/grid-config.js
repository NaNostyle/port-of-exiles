// Grid Configuration for Auto-Clicking
// Adjust these values based on your game window and screen resolution

module.exports = {
  // Top-left corner of the grid (based on your Python code)
  topLeftX: 415,
  topLeftY: 369,
  
  // Size of each square in pixels
  squareWidth: 70,
  squareHeight: 70,
  
  // Grid size (11 columns, 10 rows for POE)
  cols: 11,
  rows: 10,
  
  // Click settings
  clickInterval: 200, // Milliseconds between clicks (200ms = 5 clicks per second)
  
  // Calculate pixel coordinates from grid position (based on your Python code)
  calculatePixelCoordinates: function(gridX, gridY) {
    // Validate grid position
    if (gridX < 0 || gridX >= this.cols || gridY < 0 || gridY >= this.rows) {
      console.error(`❌ Invalid grid position: (${gridX}, ${gridY})`);
      return null;
    }
    
    // Calculate center of the square at grid position (x, y)
    const centerX = this.topLeftX + this.squareWidth * gridX + this.squareWidth / 2;
    const centerY = this.topLeftY + this.squareHeight * gridY + this.squareHeight / 2;
    
    return { x: centerX, y: centerY };
  }
};

// Example usage:
// const config = require('./grid-config');
// const coords = config.calculatePixelCoordinates(2, 0); // x2, y0
// console.log(`Grid (2,0) → Pixel (${coords.x}, ${coords.y})`);
