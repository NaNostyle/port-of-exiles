const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const https = require('https');
const config = require('./config');
const OAuthServer = require('./oauth-server');

// Create axios instance with SSL configuration
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false, // Only for testing - allows self-signed certificates
    secureProtocol: 'TLSv1_2_method'
  }),
  timeout: 10000
});

class AuthService {
  constructor() {
    this.clientId = config.google.clientId;
    this.backendUrl = config.backend.url;
    this.currentUser = null;
    this.authToken = null;
    this.oauthServer = new OAuthServer(3000);
    
    // Set up payment callbacks
    this.oauthServer.setPaymentSuccessCallback((data) => {
      console.log('Payment successful:', data);
      // Refresh user profile to get updated token count
      this.refreshUserProfile();
    });
    
    this.oauthServer.setPaymentCancelCallback((data) => {
      console.log('Payment cancelled:', data);
    });
  }

  // Initialize Google OAuth client
  initializeGoogleAuth() {
    this.googleClient = new OAuth2Client(
      this.clientId,
      config.google.clientSecret,
      'http://localhost:3000/oauth/callback' // redirect_uri
    );
  }

  // Get Google OAuth URL for authentication
  getGoogleAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    return this.googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      redirect_uri: 'http://localhost:3000/oauth/callback'
    });
  }

  // Start OAuth flow with server
  async startOAuthFlow() {
    try {
      // Stop any existing server first to avoid port conflicts
      if (this.oauthServer && this.oauthServer.isRunning()) {
        console.log('Stopping existing OAuth server...');
        this.oauthServer.stop();
        // Give it a moment to close
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Start the OAuth server
      await this.oauthServer.start();
      
      // Get the OAuth URL
      const authUrl = this.getGoogleAuthUrl();
      
      return { authUrl, server: this.oauthServer };
    } catch (error) {
      console.error('Failed to start OAuth flow:', error);
      throw error;
    }
  }

  // Wait for OAuth callback
  async waitForOAuthCallback() {
    return await this.oauthServer.waitForCallback();
  }

  // Handle Google OAuth callback
  async handleGoogleCallback(code) {
    try {
      const { tokens } = await this.googleClient.getToken(code);
      this.googleClient.setCredentials(tokens);

      // Get user info from Google
      const ticket = await this.googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: this.clientId,
      });

      const payload = ticket.getPayload();
      const userInfo = {
        email: payload.email,
        name: payload.name,
        googleId: payload.sub,
        profilePicture: payload.picture
      };

      // Send user info to backend for authentication
      const response = await axiosInstance.post(`${this.backendUrl}/auth/login`, userInfo);
      
      if (response.data.token) {
        this.authToken = response.data.token;
        this.currentUser = response.data.user;
        
        // In Node.js environment, we don't have localStorage
        // Store in memory for this session
        // In a real app, you'd use a secure storage solution
        
        return { success: true, user: this.currentUser };
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Google authentication error:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if user is already authenticated
  async checkExistingAuth() {
    // In Node.js environment, we don't have localStorage
    // For now, we'll skip the stored authentication check
    // In a real app, you'd use a secure storage solution
    return { success: false, error: 'No stored authentication' };
  }

  // Get user profile from backend
  async getUserProfile() {
    if (!this.authToken) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await axiosInstance.get(`${this.backendUrl}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  // Refresh user profile and update current user data
  async refreshUserProfile() {
    try {
      const profile = await this.getUserProfile();
      this.currentUser = profile;
      console.log('User profile refreshed:', profile);
      return profile;
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
      throw error;
    }
  }

  // Generate teleport token
  async generateTeleportToken() {
    if (!this.authToken) {
      throw new Error('Not authenticated');
    }

    try {
      console.log('🔄 Generating teleport token from backend...');
      console.log('Backend URL:', this.backendUrl);
      console.log('Auth token:', this.authToken.substring(0, 20) + '...');
      
      const response = await axiosInstance.post(`${this.backendUrl}/generate`, {}, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      console.log('✅ Teleport token generated successfully');
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      return response.data.token;
    } catch (error) {
      console.error('❌ Failed to generate teleport token:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  }

  // Create Stripe checkout session
  async createCheckoutSession(priceId, type) {
    if (!this.authToken) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await axiosInstance.post(`${this.backendUrl}/payment/create-checkout`, {
        priceId,
        type
      }, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      throw error;
    }
  }

  // Logout user
  logout() {
    this.authToken = null;
    this.currentUser = null;
    // Stop the OAuth server to free up the port
    if (this.oauthServer) {
      this.oauthServer.stop();
    }
    // In Node.js environment, we don't have localStorage
    // Clear from memory
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.authToken && !!this.currentUser;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Get auth token
  getAuthToken() {
    return this.authToken;
  }
}

module.exports = AuthService;
