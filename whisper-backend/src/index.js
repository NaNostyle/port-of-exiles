export default {
	async fetch(request, env) {
	  const url = new URL(request.url);
	  const pathname = url.pathname;
	  const method = request.method;

	  // CORS headers for all responses
	  const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	  };

	  // Handle preflight requests
	  if (method === 'OPTIONS') {
		return new Response(null, { status: 200, headers: corsHeaders });
	  }

	  const kv = env.WHISPER_KV;
	  const SECRET = env.JWT_SECRET || "supersecretkey"; // Use environment variable
	  const FREE_DAILY_QUOTA = 30;
	  const STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;
	  
	  // Initialize Stripe (moved to top level to avoid dynamic require)
	  const stripe = require('stripe')(env.STRIPE_SECRET_KEY);
	  
	  // Debug: Log available environment variables
	  console.log('Available env vars:', Object.keys(env));
	  console.log('STRIPE_SECRET_KEY exists:', !!env.STRIPE_SECRET_KEY);
	  console.log('STRIPE_SECRET_KEY length:', env.STRIPE_SECRET_KEY ? env.STRIPE_SECRET_KEY.length : 'undefined');
  
	  const b64url = str =>
		btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  
	  async function signJWT(payload) {
		const header = { alg: "HS256", typ: "JWT" };
		const encHeader = b64url(JSON.stringify(header));
		const encPayload = b64url(JSON.stringify(payload));
		const data = `${encHeader}.${encPayload}`;
  
		const key = await crypto.subtle.importKey(
		  "raw",
		  new TextEncoder().encode(SECRET),
		  { name: "HMAC", hash: "SHA-256" },
		  false,
		  ["sign"]
		);
  
		const sigBuffer = await crypto.subtle.sign(
		  "HMAC",
		  key,
		  new TextEncoder().encode(data)
		);
		const sigArray = Array.from(new Uint8Array(sigBuffer));
		const sig = b64url(String.fromCharCode(...sigArray));
  
		return `${data}.${sig}`;
	  }
  
	  async function verifyJWT(token) {
		try {
		  const [header, payload, sig] = token.split('.');
		  const data = `${header}.${payload}`;
		  
		  const key = await crypto.subtle.importKey(
			"raw",
			new TextEncoder().encode(SECRET),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"]
		  );
  
		  const sigBuffer = await crypto.subtle.sign(
			"HMAC",
			key,
			new TextEncoder().encode(data)
		  );
		  const sigArray = Array.from(new Uint8Array(sigBuffer));
		  const calcSig = b64url(String.fromCharCode(...sigArray));
		  if (calcSig !== sig) return null;
  
		  const decodedPayload = JSON.parse(
			atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
		  );
		  return decodedPayload;
		} catch {
		  return null;
		}
	  }
  
	  // Helper: get user's daily free count
	  async function getDailyCount(userId) {
		const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
		const key = `user:${userId}:freeCount:${today}`;
		const count = parseInt((await kv.get(key)) || "0");
		return { count, key };
	  }
  
	  // Helper: increment daily count
	  async function incrementDailyCount(userId) {
		const { count, key } = await getDailyCount(userId);
		await kv.put(key, (count + 1).toString());
		return count + 1;
	  }
  
	  // Helper: get token count
	  async function getTokenCount(userId) {
		const key = `user:${userId}:tokens`;
		return parseInt((await kv.get(key)) || "0");
	  }
  
	  // Helper: decrement token count
	  async function useToken(userId) {
		const key = `user:${userId}:tokens`;
		const count = await getTokenCount(userId);
		if (count <= 0) return false;
		await kv.put(key, (count - 1).toString());
		return true;
	  }
  
	  // Helper: check subscription
	  async function hasSubscription(userId) {
		const key = `user:${userId}:subscription`; // store expiry timestamp
		const expiry = parseInt((await kv.get(key)) || "0");
		const isActive = Date.now() < expiry;
		
		// Log subscription check for debugging
		if (!isActive && expiry > 0) {
		  console.log(`Subscription expired for user ${userId}. Expired: ${new Date(expiry).toISOString()}`);
		}
		
		return isActive;
	  }

	  // Helper: get user profile
	  async function getUserProfile(userId) {
		const key = `user:${userId}:profile`;
		const profile = await kv.get(key);
		return profile ? JSON.parse(profile) : null;
	  }

	  // Helper: save user profile
	  async function saveUserProfile(userId, profile) {
		const key = `user:${userId}:profile`;
		await kv.put(key, JSON.stringify(profile));
	  }

	  // Helper: authenticate user from JWT token
	  async function authenticateUser(request) {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
		  return null;
		}
		
		const token = authHeader.substring(7);
		const payload = await verifyJWT(token);
		return payload;
	  }

	  // Helper: create Stripe checkout session
	  async function createStripeCheckoutSession(priceId, userId, successUrl, cancelUrl) {
		// Determine token count based on price ID
		let tokensToAdd = 10; // Default
		if (priceId === 'price_1S7HrFGq9vbVKPQi3kJKHG6T') {
			tokensToAdd = 30; // 30 tokens - €2.99
		} else if (priceId === 'price_1S7HrgGq9vbVKPQiLntrsDPb') {
			tokensToAdd = 50; // 50 tokens - €3.99
		}
		
		const params = new URLSearchParams({
			'payment_method_types[]': 'card',
			'line_items[0][price]': priceId,
			'line_items[0][quantity]': '1',
			'mode': 'payment',
			'success_url': successUrl,
			'cancel_url': cancelUrl,
			'metadata[userId]': userId,
			'metadata[tokens]': tokensToAdd.toString(),
			'payment_intent_data[metadata][userId]': userId,
			'payment_intent_data[metadata][tokens]': tokensToAdd.toString(),
		});
		
		console.log('Creating Stripe checkout session with params:', params.toString());
		
		const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
		  method: 'POST',
		  headers: {
			'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
			'Content-Type': 'application/x-www-form-urlencoded',
		  },
		  body: params,
		});
		
		const result = await response.json();
		console.log('Stripe API response status:', response.status);
		console.log('Stripe API response:', JSON.stringify(result, null, 2));
		
		return result;
	  }

	  // Helper: create Stripe subscription
	  async function createStripeSubscription(priceId, userId, successUrl, cancelUrl) {
		const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
		  method: 'POST',
		  headers: {
			'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
			'Content-Type': 'application/x-www-form-urlencoded',
		  },
		  body: new URLSearchParams({
			'payment_method_types[]': 'card',
			'line_items[0][price]': priceId,
			'line_items[0][quantity]': '1',
			'mode': 'subscription',
			'success_url': successUrl,
			'cancel_url': cancelUrl,
			'metadata[userId]': userId,
		  }),
		});
		
		return await response.json();
	  }
  
	  // --- Endpoints ---

	  // User authentication endpoint
	  if (pathname === "/auth/login" && method === "POST") {
		try {
		  const body = await request.json();
		  const { email, name, googleId, profilePicture } = body;
		  
		  if (!email || !googleId) {
			return new Response(JSON.stringify({ error: "Missing required fields" }), {
			  status: 400,
			  headers: { ...corsHeaders, "Content-Type": "application/json" }
			});
		  }
		  
		  // Create or update user profile
		  const userId = googleId;
		  const userProfile = {
			email,
			name: name || email,
			googleId,
			profilePicture,
			createdAt: Date.now(),
			lastLogin: Date.now()
		  };
		  
		  await saveUserProfile(userId, userProfile);
		  
		  // Generate JWT token
		  const payload = { 
			userId, 
			email, 
			ts: Date.now(), 
			expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
		  };
		  const jwt = await signJWT(payload);
		  
		  return new Response(JSON.stringify({ 
			token: jwt, 
			user: userProfile 
		  }), {
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		  });
		} catch (error) {
		  return new Response(JSON.stringify({ error: "Login failed" }), {
			status: 500,
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		  });
		}
	  }

	  // Get user profile endpoint
	  if (pathname === "/user/profile" && method === "GET") {
		const auth = await authenticateUser(request);
		if (!auth) {
		  return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		  });
		}
		
		const profile = await getUserProfile(auth.userId);
		const tokenCount = await getTokenCount(auth.userId);
		const { count: dailyCount } = await getDailyCount(auth.userId);
		const isSubscribed = await hasSubscription(auth.userId);
		
		return new Response(JSON.stringify({
		  profile,
		  tokenCount,
		  dailyCount,
		  dailyLimit: FREE_DAILY_QUOTA,
		  isSubscribed
		}), {
		  headers: { ...corsHeaders, "Content-Type": "application/json" }
		});
	  }

	  // Generate whisper token endpoint
	  if (pathname === "/generate" && method === "POST") {
		const auth = await authenticateUser(request);
		if (!auth) {
		  return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		  });
		}
		
		const userId = auth.userId;
		const isSubscribed = await hasSubscription(userId);
		const { count: dailyCount } = await getDailyCount(userId);
		const tokenCount = await getTokenCount(userId);
		
		// Log subscription status for debugging
		console.log(`Whisper request for user ${userId}: subscribed=${isSubscribed}, dailyCount=${dailyCount}, tokenCount=${tokenCount}`);
		
		// Check if user can make a whisper request
		if (!isSubscribed && dailyCount >= FREE_DAILY_QUOTA && tokenCount <= 0) {
		  console.log(`User ${userId} blocked: not subscribed, daily limit reached (${dailyCount}/${FREE_DAILY_QUOTA}), no tokens (${tokenCount})`);
		  return new Response(JSON.stringify({ 
			error: "No tokens available. Please purchase tokens or wait for daily reset." 
		  }), {
			status: 403,
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		  });
		}
		
		// Consume token or increment daily count
		if (isSubscribed) {
		  // Unlimited for subscribers
		} else if (tokenCount > 0) {
		  await useToken(userId);
		} else {
		  await incrementDailyCount(userId);
		}
		
		// Generate JWT for whisper request
		const payload = { 
		  userId, 
		  ts: Date.now(), 
		  expires: Date.now() + 60_000 // 1 minute
		};
		const jwt = await signJWT(payload);
		
		return new Response(JSON.stringify({ token: jwt }), {
		  headers: { ...corsHeaders, "Content-Type": "application/json" }
		});
	  }
	  
  
	  // Validate token endpoint
	  if (pathname === "/validate" && method === "POST") {
		try {
		  const body = await request.json();
		  const { token } = body;
		  
		  if (!token) {
			return new Response(JSON.stringify({ error: "Missing token" }), {
			  status: 400,
			  headers: { ...corsHeaders, "Content-Type": "application/json" }
			});
		  }

		  const payload = await verifyJWT(token);
		  if (!payload) {
			return new Response(JSON.stringify({ error: "Invalid token" }), {
			  status: 400,
			  headers: { ...corsHeaders, "Content-Type": "application/json" }
			});
		  }

		  return new Response(JSON.stringify({ 
			valid: true, 
			userId: payload.userId,
			email: payload.email 
		  }), {
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		  });
		} catch (error) {
		  return new Response(JSON.stringify({ error: "Validation failed" }), {
			status: 500,
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		  });
		}
	  }

	  // Create Stripe checkout session for token purchase
	  if (pathname === "/payment/create-checkout" && method === "POST") {
		const auth = await authenticateUser(request);
		if (!auth) {
		  return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		  });
		}
		
		try {
		  const body = await request.json();
		  const { priceId, type } = body; // type: 'tokens' or 'subscription'
		  
		  if (!priceId || !type) {
			return new Response(JSON.stringify({ error: "Missing required fields" }), {
			  status: 400,
			  headers: { ...corsHeaders, "Content-Type": "application/json" }
			});
		  }
		  
		  const successUrl = `${env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
		  const cancelUrl = `${env.FRONTEND_URL}/payment/cancel`;
		  
		  let session;
		  if (type === 'subscription') {
			session = await createStripeSubscription(priceId, auth.userId, successUrl, cancelUrl);
		  } else {
			session = await createStripeCheckoutSession(priceId, auth.userId, successUrl, cancelUrl);
		  }
		  
		  console.log('Stripe session response:', JSON.stringify(session, null, 2));
		  
		  return new Response(JSON.stringify({ 
			checkoutUrl: session.url,
			sessionId: session.id 
		  }), {
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		  });
		} catch (error) {
		  return new Response(JSON.stringify({ error: "Payment session creation failed" }), {
			status: 500,
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		  });
		}
	  }

	  // Stripe webhook handler
	  if (pathname === "/stripe/webhook" && method === "POST") {
		try {
		  const signature = request.headers.get('stripe-signature');
		  const body = await request.text();
		  
		  console.log('Webhook received:', {
			pathname: pathname,
			method: method,
			hasSignature: !!signature,
			bodyLength: body.length,
			webhookSecret: STRIPE_WEBHOOK_SECRET ? 'SET' : 'NOT_SET'
		  });
		  
		  // Verify webhook signature (use async version for Cloudflare Workers)
		  const event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET);
		  
		  console.log('Event verified:', {
			type: event.type,
			id: event.id
		  });
		  
		  if (event.type === 'checkout.session.completed') {
			const session = event.data.object;
			const userId = session.metadata.userId;
			
			console.log('Processing checkout.session.completed:', {
			  sessionId: session.id,
			  userId: userId,
			  mode: session.mode,
			  metadata: session.metadata
			});
			
			// Handle token purchase
			if (session.mode === 'payment') {
			  const tokensToAdd = parseInt(session.metadata.tokens) || 10; // Default 10 tokens
			  const key = `user:${userId}:tokens`;
			  const currentTokens = parseInt((await kv.get(key)) || "0");
			  const newTokenCount = currentTokens + tokensToAdd;
			  
			  console.log('Adding tokens:', {
			    userId: userId,
			    tokensToAdd: tokensToAdd,
			    currentTokens: currentTokens,
			    newTokenCount: newTokenCount,
			    key: key
			  });
			  
			  await kv.put(key, newTokenCount.toString());
			  console.log('Tokens added successfully');
			}
			
			// Handle subscription
			if (session.mode === 'subscription') {
			  const durationMs = 30 * 24 * 60 * 60 * 1000; // 30 days
			  const expiry = Date.now() + durationMs;
			  const key = `user:${userId}:subscription`;
			  await kv.put(key, expiry.toString());
			}
		  } else if (event.type === 'payment_intent.succeeded') {
			const paymentIntent = event.data.object;
			const userId = paymentIntent.metadata.userId;
			const tokensToAdd = parseInt(paymentIntent.metadata.tokens) || 10;
			
			console.log('Processing payment_intent.succeeded:', {
			  paymentIntentId: paymentIntent.id,
			  userId: userId,
			  tokensToAdd: tokensToAdd,
			  amount: paymentIntent.amount,
			  metadata: paymentIntent.metadata
			});
			
			// Handle token purchase
			if (userId && tokensToAdd > 0) {
			  const key = `user:${userId}:tokens`;
			  const currentTokens = parseInt((await kv.get(key)) || "0");
			  const newTokenCount = currentTokens + tokensToAdd;
			  
			  console.log('Adding tokens from payment_intent:', {
			    userId: userId,
			    tokensToAdd: tokensToAdd,
			    currentTokens: currentTokens,
			    newTokenCount: newTokenCount,
			    key: key
			  });
			  
			  await kv.put(key, newTokenCount.toString());
			  console.log('Tokens added successfully from payment_intent');
			} else {
			  console.log('No userId or tokens found in payment_intent metadata');
			}
		  } else if (event.type === 'payment_intent.created') {
			const paymentIntent = event.data.object;
			console.log('Processing payment_intent.created:', {
			  paymentIntentId: paymentIntent.id,
			  status: paymentIntent.status,
			  amount: paymentIntent.amount,
			  metadata: paymentIntent.metadata
			});
			
			// payment_intent.created doesn't have metadata yet, so we just log it
			console.log('Payment intent created - waiting for completion');
		  }
		  
		  return new Response(JSON.stringify({ received: true }), {
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		  });
		} catch (error) {
		  console.error('Webhook processing error:', error);
		  return new Response(JSON.stringify({ 
			error: "Webhook processing failed", 
			details: error.message,
			stack: error.stack 
		  }), {
			status: 400,
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		  });
		}
	  }

	  // Legacy endpoints for backward compatibility
	  if (pathname === "/purchase" && method === "GET") {
		const user = url.searchParams.get("user");
		const amount = parseInt(url.searchParams.get("amount")) || 0;
		
		if (!user || amount <= 0) {
		  return new Response(JSON.stringify({ error: "Missing user or amount" }), {
			status: 400,
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		  });
		}

		const key = `user:${user}:tokens`;
		const old = parseInt((await kv.get(key)) || "0");
		await kv.put(key, (old + amount).toString());

		return new Response(JSON.stringify({ user, tokens: old + amount }), {
		  headers: { ...corsHeaders, "Content-Type": "application/json" }
		});
	  }

	  if (pathname === "/subscribe" && method === "GET") {
		const user = url.searchParams.get("user");
  
		if (!user) {
		  return new Response(JSON.stringify({ error: "Missing user" }), {
			status: 400,
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		  });
		}
  
		const durationMs = 30 * 24 * 60 * 60 * 1000; // 30 days
		const expiry = Date.now() + durationMs;
		const key = `user:${user}:subscription`;
		await kv.put(key, expiry.toString());

		return new Response(JSON.stringify({ 
		  user, 
		  subscriptionExpires: expiry,
		  subscriptionExpiresDate: new Date(expiry).toISOString(),
		  message: "Subscription set successfully"
		}), {
		  headers: { ...corsHeaders, "Content-Type": "application/json" }
		});
	  }

	  // Check subscription status endpoint
	  if (pathname === "/subscription-status" && method === "GET") {
		const user = url.searchParams.get("user");
  
		if (!user) {
		  return new Response(JSON.stringify({ error: "Missing user" }), {
			status: 400,
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		  });
		}
  
		const key = `user:${user}:subscription`;
		const expiry = parseInt((await kv.get(key)) || "0");
		const isActive = Date.now() < expiry;
		const tokenCount = await getTokenCount(user);
		const { count: dailyCount } = await getDailyCount(user);

		return new Response(JSON.stringify({ 
		  user,
		  isSubscribed: isActive,
		  subscriptionExpires: expiry,
		  subscriptionExpiresDate: expiry > 0 ? new Date(expiry).toISOString() : null,
		  tokenCount,
		  dailyCount,
		  dailyLimit: FREE_DAILY_QUOTA,
		  canMakeWhisper: isActive || dailyCount < FREE_DAILY_QUOTA || tokenCount > 0
		}), {
		  headers: { ...corsHeaders, "Content-Type": "application/json" }
		});
	  }

	  // Debug endpoint to manually add tokens
	  if (pathname === "/debug/add-tokens" && method === "GET") {
		const user = url.searchParams.get("user");
		const tokens = parseInt(url.searchParams.get("tokens")) || 10;
  
		if (!user) {
		  return new Response(JSON.stringify({ error: "Missing user" }), {
			status: 400,
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		  });
		}
  
		const key = `user:${user}:tokens`;
		const currentTokens = await getTokenCount(user);
		const newTokenCount = currentTokens + tokens;
		
		await kv.put(key, newTokenCount.toString());
		
		console.log(`Debug: Added ${tokens} tokens to user ${user}. New total: ${newTokenCount}`);

		return new Response(JSON.stringify({ 
		  user,
		  tokensAdded: tokens,
		  previousTokens: currentTokens,
		  newTokenCount: newTokenCount,
		  message: `Added ${tokens} tokens successfully`
		}), {
		  headers: { ...corsHeaders, "Content-Type": "application/json" }
		});
	  }
  
	  return new Response("Not found", { status: 404 });
	},
  };
  