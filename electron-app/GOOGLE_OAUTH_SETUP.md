# Google OAuth Setup Instructions

## Fix the "Missing required parameter: redirect_uri" Error

The error you're seeing is because your Google OAuth application doesn't have the correct redirect URI configured.

### Steps to Fix:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project: `poe2trade-472115`

2. **Navigate to OAuth Configuration**
   - Go to "APIs & Services" → "Credentials"
   - Find your OAuth 2.0 Client ID: `23507546838-3ielp0tjfvjsphuharrnq724hfco0b1j.apps.googleusercontent.com`
   - Click on it to edit

3. **Add the Correct Redirect URI**
   - In the "Authorized redirect URIs" section, add:
     ```
     http://localhost:3000/oauth/callback
     ```
   - Make sure to keep the existing `http://localhost` entry as well
   - Click "Save"

4. **Alternative: Use a Different Port**
   - If port 3000 is already in use, you can change it in the code
   - Update `oauth-server.js` line 3: `constructor(port = 3001)`
   - Update `auth-service.js` line 35: `redirect_uri: 'http://localhost:3001/oauth/callback'`
   - Add the new URI to Google OAuth: `http://localhost:3001/oauth/callback`

### Current Configuration:
- **Client ID**: `23507546838-3ielp0tjfvjsphuharrnq724hfco0b1j.apps.googleusercontent.com`
- **Client Secret**: `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`
- **Required Redirect URI**: `http://localhost:3000/oauth/callback`

### How the OAuth Flow Works Now:

1. User clicks "Sign in with Google"
2. App starts a local HTTP server on port 3000
3. Opens Google OAuth URL in browser
4. User completes login on Google
5. Google redirects to `http://localhost:3000/oauth/callback` with the authorization code
6. Local server captures the code and sends it to the app
7. App exchanges the code for user information
8. User is logged in successfully

### Testing:

After updating the redirect URI in Google Cloud Console:

1. Restart the Electron app
2. Click "Sign in with Google"
3. Complete the login in your browser
4. The app should automatically detect the login and show the dashboard

### Troubleshooting:

- **Port already in use**: Change the port in the code and update Google OAuth
- **Still getting redirect_uri error**: Make sure you saved the changes in Google Cloud Console
- **Server not starting**: Check if another application is using port 3000
- **Login not working**: Check the console logs for detailed error messages
