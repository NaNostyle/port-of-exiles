# SSL/TLS Troubleshooting Guide

## Problem: SSL Handshake Failure

You're encountering this error:
```
Error: write EPROTO 21082816:error:10000410:SSL routines:OPENSSL_internal:SSLV3_ALERT_HANDSHAKE_FAILURE
```

This is a common issue with SSL/TLS connections to Cloudflare Workers.

## Solutions

### Solution 1: Use Local Development Server (Recommended)

1. **Start the local development server:**
   ```bash
   cd whisper-backend
   wrangler dev --port 8787
   ```

2. **Update config.js to use local server:**
   ```javascript
   backend: {
     url: 'http://localhost:8787', // Use local development server
   }
   ```

3. **Test the connection:**
   ```bash
   cd electron-app
   node test-backend.js
   ```

### Solution 2: Fix SSL/TLS Issues

If you prefer to use the deployed worker:

1. **Check Node.js version:**
   ```bash
   node --version
   ```
   - Use Node.js 18+ for better SSL support

2. **Update dependencies:**
   ```bash
   npm update
   ```

3. **Try with different SSL settings:**
   ```javascript
   // In auth-service.js, add SSL options
   const https = require('https');
   const agent = new https.Agent({
     rejectUnauthorized: false, // Only for testing!
     secureProtocol: 'TLSv1_2_method'
   });
   ```

### Solution 3: Network/Firewall Issues

1. **Check if Cloudflare is accessible:**
   ```bash
   ping whisper-backend.larrieu-arnaud.workers.dev
   ```

2. **Test with curl:**
   ```bash
   curl -v https://whisper-backend.larrieu-arnaud.workers.dev/
   ```

3. **Check Windows Firewall:**
   - Allow Node.js through Windows Firewall
   - Check if corporate firewall is blocking the connection

### Solution 4: Alternative Backend URLs

Try these alternative URLs in config.js:

```javascript
// Option 1: Direct Cloudflare URL
url: 'https://whisper-backend.larrieu-arnaud.workers.dev'

// Option 2: With different protocol
url: 'https://whisper-backend.larrieu-arnaud.workers.dev/'

// Option 3: Local development
url: 'http://localhost:8787'
```

## Testing Steps

1. **Test backend connectivity:**
   ```bash
   node test-backend.js
   ```

2. **Test OAuth flow:**
   - Start the Electron app
   - Click "Sign in with Google"
   - Check console for errors

3. **Check logs:**
   - Look at the terminal where you started the backend
   - Check the Electron app console (F12)

## Common Issues

### Issue 1: Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::8787
```
**Solution:** Use a different port:
```bash
wrangler dev --port 8788
```

### Issue 2: CORS Errors
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```
**Solution:** The backend already has CORS headers configured.

### Issue 3: Google OAuth Redirect URI
```
Missing required parameter: redirect_uri
```
**Solution:** Follow the instructions in `GOOGLE_OAUTH_SETUP.md`

## Recommended Development Workflow

1. **Use local development server** for testing
2. **Deploy to production** only when everything works locally
3. **Test OAuth flow** with local server first
4. **Switch to production URL** when ready

## Quick Fix Commands

```bash
# Start local backend
cd whisper-backend
wrangler dev --port 8787

# In another terminal, test backend
cd electron-app
node test-backend.js

# Start Electron app
npm start
```

## Still Having Issues?

1. Check the console logs for detailed error messages
2. Verify all configuration values are correct
3. Test each component individually
4. Use the local development server for initial testing
