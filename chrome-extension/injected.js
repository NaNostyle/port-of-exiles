// Injected script to capture fetch requests
(function() {
  console.log('🎯 POE Trade Data Capture injected script loaded on:', window.location.href);
  
  // Store original fetch function
  const originalFetch = window.fetch;
  
  // Override fetch to intercept requests
  window.fetch = function(...args) {
    const url = args[0];
    
    // Check if this is a Path of Exile trade API call
    if (typeof url === 'string' && url.includes('pathofexile.com/api/trade2/fetch')) {
      console.log('🔍 Intercepted POE trade API call:', url);
      
      // Call original fetch
      return originalFetch.apply(this, args)
        .then(response => {
          // Clone the response to read it without consuming the original
          const clonedResponse = response.clone();
          
          // Try to parse as JSON
          clonedResponse.json()
            .then(data => {
              console.log('✅ Captured trade data:', data);
              
              // Dispatch custom event with the data
              window.dispatchEvent(new CustomEvent('poeTradeData', {
                detail: {
                  url: url,
                  data: data,
                  timestamp: new Date().toISOString()
                }
              }));
            })
            .catch(error => {
              console.log('❌ Could not parse response as JSON:', error);
            });
          
          // Return the original response
          return response;
        })
        .catch(error => {
          console.log('Fetch error:', error);
          throw error;
        });
    }
    
    // For non-POE API calls, just use original fetch
    return originalFetch.apply(this, args);
  };
  
  // Also intercept XMLHttpRequest for older implementations
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._url = url;
    return originalXHROpen.apply(this, [method, url, ...args]);
  };
  
  XMLHttpRequest.prototype.send = function(...args) {
    if (this._url && (this._url.includes('pathofexile.com/api/trade2/fetch') || this._url.includes('/api/trade2/fetch'))) {
      console.log('🔍 Intercepted POE trade API XHR call:', this._url);
      
      const originalOnReadyStateChange = this.onreadystatechange;
      const self = this;
      
      // Set up our handler immediately
      this.onreadystatechange = function() {
        console.log('📊 XHR State Change:', this.readyState, 'Status:', this.status, 'URL:', this._url);
        
        if (this.readyState === 4) {
          console.log('📊 XHR Response Status:', this.status, 'for URL:', this._url);
          if (this.status === 200) {
            try {
              console.log('📄 Raw response text:', this.responseText.substring(0, 200) + '...');
              const data = JSON.parse(this.responseText);
              console.log('✅ Captured trade data via XHR:', data);
              
              // Dispatch custom event with the data
              window.dispatchEvent(new CustomEvent('poeTradeData', {
                detail: {
                  url: this._url,
                  data: data,
                  timestamp: new Date().toISOString()
                }
              }));
            } catch (error) {
              console.log('❌ Could not parse XHR response as JSON:', error);
              console.log('Raw response:', this.responseText);
            }
          } else {
            console.log('❌ XHR request failed with status:', this.status);
          }
        }
        
        // Always call the original handler
        if (originalOnReadyStateChange) {
          originalOnReadyStateChange.apply(this, arguments);
        }
      };
      
      // Also set up a backup timer to check the response
      const checkResponse = () => {
        if (self.readyState === 4) {
          console.log('⏰ Timer check - XHR completed:', self.status, 'URL:', self._url);
          if (self.status === 200) {
            try {
              console.log('⏰ Timer check - Raw response text:', self.responseText.substring(0, 200) + '...');
              const data = JSON.parse(self.responseText);
              console.log('⏰ Timer check - Captured trade data via XHR:', data);
              
              // Dispatch custom event with the data
              window.dispatchEvent(new CustomEvent('poeTradeData', {
                detail: {
                  url: self._url,
                  data: data,
                  timestamp: new Date().toISOString()
                }
              }));
            } catch (error) {
              console.log('⏰ Timer check - Could not parse XHR response as JSON:', error);
            }
          }
        } else {
          // Check again in 100ms
          setTimeout(checkResponse, 100);
        }
      };
      
      // Start the backup timer
      setTimeout(checkResponse, 100);
      
      if (!originalOnReadyStateChange) {
        console.log('📝 No original onreadystatechange handler, using our handler + timer');
      } else {
        console.log('📝 Original onreadystatechange handler found, wrapping it + timer');
      }
    }
    
    return originalXHRSend.apply(this, args);
  };
})();
