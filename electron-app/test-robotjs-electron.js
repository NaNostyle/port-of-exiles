// Test script for robotjs within Electron context
// This should be run from within the Electron app, not standalone Node.js

const robot = require("robotjs");

// Grid configuration based on your Python code
const GRID_CONFIG = {
  // Top-left corner of the grid
  topLeftX: 415,
  topLeftY: 300,
  
  // Size of each square in pixels
  squareWidth: 70,
  squareHeight: 70,
  
  // Grid size
  cols: 12,
  rows: 12
};

function clickOnGrid(x, y) {
  // Click in the center of the square at grid position (x, y)
  if (0 <= x && x < GRID_CONFIG.cols && 0 <= y && y < GRID_CONFIG.rows) {
    const centerX = GRID_CONFIG.topLeftX + GRID_CONFIG.squareWidth * x + GRID_CONFIG.squareWidth / 2;
    const centerY = GRID_CONFIG.topLeftY + GRID_CONFIG.squareHeight * y + GRID_CONFIG.squareHeight / 2;
    
    console.log(`Clicking at grid position (${x}, ${y}) -> pixel (${centerX}, ${centerY})`);
    
    try {
      robot.moveMouse(centerX, centerY);
      robot.mouseClick();
      console.log(`✅ Successfully clicked at (${centerX}, ${centerY})`);
      return true;
    } catch (error) {
      console.error(`❌ Error clicking at (${centerX}, ${centerY}):`, error.message);
      return false;
    }
  } else {
    console.error(`❌ Invalid grid position: (${x}, ${y})`);
    return false;
  }
}

// Export for use in Electron main process
module.exports = {
  clickOnGrid,
  GRID_CONFIG
};

// If running directly in Electron context, test it
if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
  console.log("🤖 Testing robotjs within Electron...");
  console.log(`📐 Grid configuration: ${GRID_CONFIG.cols}x${GRID_CONFIG.rows}`);
  console.log(`📍 Top-left corner: (${GRID_CONFIG.topLeftX}, ${GRID_CONFIG.topLeftY})`);
  
  // Test clicking on grid position (2, 2)
  setTimeout(() => {
    const success = clickOnGrid(2, 2);
    if (success) {
      console.log("🎉 robotjs is working within Electron!");
    }
  }, 2000);
}
