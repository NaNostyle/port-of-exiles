const { app, globalShortcut } = require('electron');

// Test script to verify global escape key registration
console.log('Testing global escape key registration...');

app.whenReady().then(() => {
  console.log('App is ready, registering global escape shortcut...');
  
  // Register the Escape key as a global shortcut
  const ret = globalShortcut.register('Escape', () => {
    console.log('✅ Global Escape key pressed successfully!');
    console.log('This proves the global shortcut is working.');
    
    // Exit the test after successful detection
    setTimeout(() => {
      app.quit();
    }, 1000);
  });

  if (ret) {
    console.log('✅ Global Escape shortcut registered successfully');
  } else {
    console.log('❌ Failed to register global Escape shortcut');
    app.quit();
  }

  // Check if the shortcut is registered
  const isRegistered = globalShortcut.isRegistered('Escape');
  console.log('Global Escape shortcut is registered:', isRegistered);
  
  if (isRegistered) {
    console.log('🎯 Test ready! Press Escape key anywhere on your system to test...');
    console.log('The test will automatically exit after detecting the key press.');
  } else {
    console.log('❌ Test failed - shortcut not registered');
    app.quit();
  }
});

app.on('before-quit', () => {
  console.log('Cleaning up global shortcuts...');
  globalShortcut.unregisterAll();
});

// Auto-exit after 30 seconds if no escape key is pressed
setTimeout(() => {
  console.log('⏰ Test timeout - no escape key detected within 30 seconds');
  app.quit();
}, 30000);

