# Port of Exiles - Setup Instructions

## Prerequisites

1. **Google Cloud Console Setup**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google+ API
   - Go to "Credentials" and create OAuth 2.0 Client ID
   - Set authorized redirect URIs to include your app's redirect URL
   - Copy the Client ID and Client Secret

2. **Stripe Account Setup**
   - Create a [Stripe account](https://stripe.com/)
   - Get your API keys from the dashboard
   - Create products and prices for:
     - 10 Tokens (€2.99)
     - 50 Tokens (€9.99)
     - Monthly Subscription (€5.00)
   - Set up webhook endpoint pointing to your Cloudflare Worker

3. **Cloudflare Worker Setup**
   - Deploy the worker code from `whisper-backend/src/index.js`
   - Set up environment variables:
     - `JWT_SECRET`: A secure random string
     - `STRIPE_SECRET_KEY`: Your Stripe secret key
     - `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret
     - `FRONTEND_URL`: Your app's URL (e.g., `http://localhost:3000`)

## Configuration Steps

### 1. Update Configuration File

Edit `config.js` and replace the placeholder values:

```javascript
module.exports = {
  google: {
    clientId: 'YOUR_GOOGLE_CLIENT_ID',
    clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET',
  },
  backend: {
    url: 'https://your-worker.your-subdomain.workers.dev',
  },
  stripe: {
    publishableKey: 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY',
    secretKey: 'sk_test_YOUR_STRIPE_SECRET_KEY',
    webhookSecret: 'whsec_YOUR_STRIPE_WEBHOOK_SECRET',
    prices: {
      tokens10: 'price_YOUR_10_TOKENS_PRICE_ID',
      tokens50: 'price_YOUR_50_TOKENS_PRICE_ID',
      monthlySubscription: 'price_YOUR_MONTHLY_SUBSCRIPTION_PRICE_ID',
    }
  }
};
```

### 2. Install Dependencies

```bash
cd electron-app
npm install
```

### 3. Set Up Cloudflare Worker Environment Variables

```bash
cd whisper-backend
npx wrangler secret put JWT_SECRET
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

### 4. Deploy Cloudflare Worker

```bash
cd whisper-backend
npm run deploy
```

### 5. Run the Application

```bash
cd electron-app
npm start
```

## Features

### Authentication
- Google OAuth2 login
- JWT token-based authentication
- Persistent login sessions

### Token System
- 30 free tokens per day
- Purchase additional tokens (10 for €2.99, 50 for €9.99)
- Monthly subscription for unlimited access (€5.00)

### Dashboard
- User profile display
- Token balance and usage statistics
- Subscription status
- Purchase options

### Whisper Integration
- Automatic token consumption (1 token per whisper)
- Rate limiting and error handling
- Real-time status updates

## API Endpoints

### Authentication
- `POST /auth/login` - User login with Google OAuth
- `GET /user/profile` - Get user profile and stats
- `POST /validate` - Validate JWT token

### Whisper Generation
- `POST /generate` - Generate whisper token (consumes 1 token)

### Payments
- `POST /payment/create-checkout` - Create Stripe checkout session
- `POST /stripe/webhook` - Handle Stripe webhooks

## Security Notes

1. **JWT Secret**: Use a strong, random secret for JWT signing
2. **HTTPS**: Always use HTTPS in production
3. **Environment Variables**: Never commit secrets to version control
4. **Webhook Verification**: Always verify Stripe webhook signatures
5. **Rate Limiting**: Implement rate limiting for API endpoints

## Troubleshooting

### Common Issues

1. **Google OAuth Error**: Check client ID and redirect URIs
2. **Stripe Payment Failed**: Verify API keys and webhook configuration
3. **Worker Deployment Failed**: Check environment variables and KV namespace
4. **Authentication Issues**: Verify JWT secret and token expiration

### Debug Mode

Enable debug mode by setting `NODE_ENV=development`:

```bash
NODE_ENV=development npm start
```

This will open DevTools automatically for debugging.

## Support

For issues and questions:
1. Check the console logs for error messages
2. Verify all configuration values are correct
3. Test each component individually (auth, payments, worker)
4. Check network connectivity and firewall settings
