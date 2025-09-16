const { exec } = require("child_process");
const path = require("path");
const os = require("os");

/**
 * PyAutoGUI-based cross-platform mouse clicking
 * Uses Python script for reliable clicking across all platforms
 */
function clickOnItem(coordinates) {
  return new Promise((resolve, reject) => {
    try {
      const platform = os.platform();
      
      // Use python3 on Unix systems, py on Windows
      const pythonCmd = platform === "win32" ? "py" : "python3";
      
      const command = `${pythonCmd} -c "import pyautogui; pyautogui.FAILSAFE = False; pyautogui.click(${coordinates.x}, ${coordinates.y}); print('Click successful at (${coordinates.x}, ${coordinates.y})')"`;
      
      console.log(`🖱️ Clicking with PyAutoGUI on ${platform} at coordinates (${coordinates.x}, ${coordinates.y})`);

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Error clicking on ${platform}:`, error.message);
          
          // Provide helpful error messages
          if (error.message.includes("python") || error.message.includes("python3") || error.message.includes("py")) {
            console.error("💡 Python not found. Please install Python and PyAutoGUI:");
            console.error("   1. Install Python from https://python.org");
            console.error("   2. Install PyAutoGUI: pip install pyautogui");
          }
          
          reject(error);
        } else {
          console.log(`✅ Click successful on ${platform}`);
          if (stdout) console.log(stdout.trim());
          resolve();
        }
      });

    } catch (error) {
      console.error("❌ Error in clickOnItem:", error.message);
      reject(error);
    }
  });
}

/**
 * Check if Python and PyAutoGUI are available
 */
function checkPyAutoGUIRequirements() {
  return new Promise((resolve, reject) => {
    const platform = os.platform();
    const pythonCmd = platform === "win32" ? "py" : "python3";
    
    // Check if Python is available
    exec(`${pythonCmd} --version`, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Python not found. Please install Python first.`);
        console.error(`💡 Download from: https://python.org`);
        reject(new Error("Python not found"));
        return;
      }
      
      console.log(`✅ Python found: ${stdout.trim()}`);
      
      // Check if PyAutoGUI is installed
      exec(`${pythonCmd} -c "import pyautogui; print('PyAutoGUI version:', pyautogui.__version__)"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ PyAutoGUI not found. Please install it:`);
          console.error(`💡 Run: ${pythonCmd} -m pip install pyautogui`);
          reject(new Error("PyAutoGUI not found"));
          return;
        }
        
        console.log(`✅ PyAutoGUI found: ${stdout.trim()}`);
        resolve(true);
      });
    });
  });
}

module.exports = {
  clickOnItem,
  checkPyAutoGUIRequirements
};
