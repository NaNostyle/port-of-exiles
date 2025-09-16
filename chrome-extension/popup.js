// Popup script for Chrome extension
document.addEventListener('DOMContentLoaded', function() {
  const connectButton = document.getElementById('connectButton');
  
  // Check for POESESSID cookie and update UI
  function checkConnectionStatus() {
    if (chrome.cookies) {
      chrome.cookies.getAll({}, function(cookies) {
        if (chrome.runtime.lastError) {
          console.error('Cookie API error:', chrome.runtime.lastError);
          updateConnectionStatus(false);
          return;
        }
        
        // Look for POESESSID cookie
        const poeSessId = cookies.find(cookie => cookie.name === 'POESESSID');
        
        if (poeSessId) {
          updateConnectionStatus(true);
        } else {
          updateConnectionStatus(false);
        }
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
    if (chrome.cookies) {
      chrome.cookies.getAll({}, function(cookies) {
        if (chrome.runtime.lastError) {
          console.error('Cookie API error:', chrome.runtime.lastError);
          return;
        }
        
        // Look for POESESSID cookie
        const poeSessId = cookies.find(cookie => cookie.name === 'POESESSID');
        
        if (poeSessId) {
          // Send message to background script to send cookies to Electron app
          chrome.runtime.sendMessage({ type: 'SEND_COOKIES' }, function(response) {
            if (chrome.runtime.lastError) {
              console.error('Error sending message to background:', chrome.runtime.lastError);
            } else {
              console.log('Cookies sent to Electron app');
              // Update UI to show success
              updateConnectionStatus(true);
            }
          });
        } else {
          // No POESESSID found, show error state
          updateConnectionStatus(false);
        }
      });
    }
  });
  
  // Auto-check connection status when popup opens
  checkConnectionStatus();
});