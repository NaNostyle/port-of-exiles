// Test script for robotjs auto-clicking functionality
// Following the Python logic: 12x12 grid, top_left (415, 300)

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

// Test the robotjs functionality
console.log("🤖 Testing robotjs auto-click functionality...");
console.log(`📐 Grid configuration: ${GRID_CONFIG.cols}x${GRID_CONFIG.rows}`);
console.log(`📍 Top-left corner: (${GRID_CONFIG.topLeftX}, ${GRID_CONFIG.topLeftY})`);
console.log(`📦 Square size: ${GRID_CONFIG.squareWidth}x${GRID_CONFIG.squareHeight} pixels`);

// Test clicking on grid position (11, 10) as in your Python example
const testX = 11;
const testY = 10;

console.log(`\n🎯 Testing click on grid position (${testX}, ${testY})...`);
console.log("⏳ Starting click test in 3 seconds...");

setTimeout(() => {
  const success = clickOnGrid(testX, testY);
  
  if (success) {
    console.log("🎉 robotjs auto-click test completed successfully!");
    console.log("🖱️ The mouse should have moved to the calculated coordinates and clicked.");
    console.log("✅ If you saw the mouse move and click, robotjs auto-clicking is working!");
  } else {
    console.log("❌ robotjs auto-click test failed!");
  }
}, 3000);
