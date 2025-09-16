// Mock backend server for testing when SSL issues occur
const http = require('http');
const url = require('url');

const PORT = 3001;

// Mock data
let users = new Map();
let tokens = new Map();

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  console.log(`${method} ${pathname}`);

  // Handle different endpoints
  if (pathname === '/auth/login' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const userData = JSON.parse(body);
        const userId = userData.googleId;
        
        // Store user
        users.set(userId, {
          ...userData,
          createdAt: Date.now(),
          lastLogin: Date.now()
        });
        
        // Initialize tokens if not exists
        if (!tokens.has(userId)) {
          tokens.set(userId, 30); // Start with 30 free tokens
        }
        
        // Generate mock JWT token
        const token = `mock_jwt_${userId}_${Date.now()}`;
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          token,
          user: users.get(userId)
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  }
  else if (pathname === '/user/profile' && method === 'GET') {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    
    const token = authHeader.substring(7);
    const userId = token.split('_')[2]; // Extract userId from mock token
    
    if (!users.has(userId)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'User not found' }));
      return;
    }
    
    const user = users.get(userId);
    const tokenCount = tokens.get(userId) || 0;
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      profile: user,
      tokenCount,
      dailyCount: 0,
      dailyLimit: 30,
      isSubscribed: false
    }));
  }
  else if (pathname === '/generate' && method === 'POST') {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    
    const token = authHeader.substring(7);
    const userId = token.split('_')[2];
    
    if (!users.has(userId)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'User not found' }));
      return;
    }
    
    const currentTokens = tokens.get(userId) || 0;
    if (currentTokens <= 0) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No tokens available' }));
      return;
    }
    
    // Consume one token
    tokens.set(userId, currentTokens - 1);
    
    // Generate whisper token
    const whisperToken = `whisper_${userId}_${Date.now()}`;
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ token: whisperToken }));
  }
  else if (pathname === '/payment/create-checkout' && method === 'POST') {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const { priceId, type } = JSON.parse(body);
        
        // Mock checkout URL
        const checkoutUrl = `https://checkout.stripe.com/mock/${priceId}`;
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          checkoutUrl,
          sessionId: `mock_session_${Date.now()}`
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  }
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Mock backend server running on http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log('  POST /auth/login - User authentication');
  console.log('  GET  /user/profile - Get user profile');
  console.log('  POST /generate - Generate whisper token');
  console.log('  POST /payment/create-checkout - Create checkout session');
  console.log('\n💡 This is a mock server for testing when SSL issues occur.');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down mock backend server...');
  server.close(() => {
    console.log('✅ Mock backend server stopped');
    process.exit(0);
  });
});
