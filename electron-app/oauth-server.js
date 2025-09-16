const http = require('http');
const url = require('url');

class OAuthServer {
  constructor(port = 3000) {
    this.port = port;
    this.server = null;
    this.callbackPromise = null;
    this.callbackResolve = null;
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        const parsedUrl = url.parse(req.url, true);
        
        if (parsedUrl.pathname === '/oauth/callback') {
          const code = parsedUrl.query.code;
          const error = parsedUrl.query.error;
          
          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body>
                  <h1>OAuth Error</h1>
                  <p>Error: ${error}</p>
                  <p>You can close this window.</p>
                </body>
              </html>
            `);
            
            if (this.callbackResolve) {
              this.callbackResolve({ success: false, error });
            }
          } else if (code) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body>
                  <h1>Login Successful!</h1>
                  <p>You can close this window and return to the application.</p>
                  <script>
                    // Try to close the window
                    setTimeout(() => {
                      window.close();
                    }, 2000);
                  </script>
                </body>
              </html>
            `);
            
            if (this.callbackResolve) {
              this.callbackResolve({ success: true, code });
            }
          } else {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body>
                  <h1>OAuth Error</h1>
                  <p>No authorization code received.</p>
                  <p>You can close this window.</p>
                </body>
              </html>
            `);
            
            if (this.callbackResolve) {
              this.callbackResolve({ success: false, error: 'No authorization code' });
            }
          }
        } else if (parsedUrl.pathname === '/payment/success') {
          // Handle Stripe payment success callback
          const sessionId = parsedUrl.query.session_id;
          
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body>
                <h1>Payment Successful! 🎉</h1>
                <p>Your tokens have been added to your account.</p>
                <p>You can close this window and return to the application.</p>
                <p>Your profile will be refreshed automatically.</p>
                <script>
                  // Try to close the window
                  setTimeout(() => {
                    window.close();
                  }, 3000);
                </script>
              </body>
            </html>
          `);
          
          // Emit payment success event
          if (this.paymentSuccessCallback) {
            this.paymentSuccessCallback({ success: true, sessionId });
          }
        } else if (parsedUrl.pathname === '/payment/cancel') {
          // Handle Stripe payment cancellation
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body>
                <h1>Payment Cancelled</h1>
                <p>Your payment was cancelled. No charges were made.</p>
                <p>You can close this window and return to the application.</p>
                <script>
                  // Try to close the window
                  setTimeout(() => {
                    window.close();
                  }, 2000);
                </script>
              </body>
            </html>
          `);
          
          // Emit payment cancel event
          if (this.paymentCancelCallback) {
            this.paymentCancelCallback({ cancelled: true });
          }
        } else {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body>
                <h1>Not Found</h1>
                <p>This is the OAuth callback server.</p>
              </body>
            </html>
          `);
        }
      });

      this.server.listen(this.port, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`OAuth server listening on port ${this.port}`);
          resolve();
        }
      });
    });
  }

  waitForCallback() {
    return new Promise((resolve) => {
      this.callbackResolve = resolve;
    });
  }

  setPaymentSuccessCallback(callback) {
    this.paymentSuccessCallback = callback;
  }

  setPaymentCancelCallback(callback) {
    this.paymentCancelCallback = callback;
  }

  stop() {
    if (this.server) {
      this.server.close((err) => {
        if (err) {
          console.error('Error closing OAuth server:', err);
        } else {
          console.log('OAuth server stopped successfully');
        }
      });
      this.server = null;
    }
  }

  isRunning() {
    return this.server && this.server.listening;
  }
}

module.exports = OAuthServer;
