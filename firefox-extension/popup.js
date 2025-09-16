// Popup script for Firefox extension
document.addEventListener('DOMContentLoaded', function() {
  const connectButton = document.getElementById('connectButton');
  
  // Check for POESESSID cookie and update UI
  function checkConnectionStatus() {
    if (browser.cookies) {
      browser.cookies.getAll({}).then(cookies => {
        // Look for POESESSID cookie
        const poeSessId = cookies.find(cookie => cookie.name === 'POESESSID');
        
        if (poeSessId) {
          updateConnectionStatus(true);
        } else {
          updateConnectionStatus(false);
        }
      }).catch(error => {
        console.error('Cookie API error:', error);
        updateConnectionStatus(false);
      });
    } else {
      updateConnectionStatus(false);
    }
  }
  
  // Update connection status UI
  function updateConnectionStatus(connected) {
    const statusIcon = connectButton.querySelector('.status-icon');
    const statusText = connectButton.querySelector('.status-text');
    
    if (connected) {
      connectButton.className = 'connect-button connected';
      statusIcon.textContent = '✅';
      statusText.textContent = 'Connected to the app';
    } else {
      connectButton.className = 'connect-button disconnected';
      statusIcon.textContent = '❌';
      statusText.textContent = 'Connect to the app';
    }
  }
  
  // Connect button click handler
  connectButton.addEventListener('click', function() {
    // Send cookies to Electron app when POESESSID is found
    if (browser.cookies) {
      browser.cookies.getAll({}).then(cookies => {
        // Look for POESESSID cookie
        const poeSessId = cookies.find(cookie => cookie.name === 'POESESSID');
        
        if (poeSessId) {
          // Send message to background script to send cookies to Electron app
          browser.runtime.sendMessage({ type: 'SEND_COOKIES' }).then(response => {
            console.log('Cookies sent to Electron app');
            // Update UI to show success
            updateConnectionStatus(true);
          }).catch(error => {
            console.error('Error sending message to background:', error);
          });
        } else {
          // No POESESSID found, show error state
          updateConnectionStatus(false);
        }
      }).catch(error => {
        console.error('Cookie API error:', error);
      });
    }
  });
  
  // Auto-check connection status when popup opens
  checkConnectionStatus();
});