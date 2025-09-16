// Configuration file for Port of Exiles
// Copy this file to config.js and update these values with your actual API keys and URLs

module.exports = {
  // Google OAuth Configuration
  // Get these from: https://console.cloud.google.com/
  google: {
    clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET',
  },

  // Backend API Configuration
  backend: {
    url: 'https://your-backend-url.workers.dev', // Your Cloudflare Worker URL
    // url: 'http://127.0.0.1:8787', // Use local development server for testing
    // url: 'http://localhost:3001', // Mock backend for testing
  },

  // Stripe Configuration
  // Get these from: https://dashboard.stripe.com/
  stripe: {
    publishableKey: 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY',
    secretKey: 'sk_test_YOUR_STRIPE_SECRET_KEY',
    webhookSecret: 'whsec_YOUR_STRIPE_WEBHOOK_SECRET',
    
    // Stripe Price IDs (create these in your Stripe dashboard)
    prices: {
      tokens30: 'price_YOUR_30_TOKENS_PRICE_ID', // 30 tokens - €2.99
      tokens50: 'price_YOUR_50_TOKENS_PRICE_ID', // 50 tokens - €3.99
      monthlySubscription: 'price_YOUR_MONTHLY_SUBSCRIPTION_PRICE_ID', // Monthly subscription - €10/month
    }
  },

  // App Configuration
  app: {
    name: 'Port of Exiles',
    version: '1.0.0',
    freeDailyTokens: 30,
    subscriptionPrice: 10.00, // EUR per month
    tokenPrices: {
      tokens30: 2.99, // EUR
      tokens50: 3.99, // EUR
    }
  }
};

