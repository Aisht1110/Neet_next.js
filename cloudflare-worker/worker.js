/**
 * NEET Counselling 2026 — Cloudflare Worker (Payment Backend)
 * 
 * Endpoints:
 * 1. POST /create-order    → Creates a Razorpay order (server-controlled pricing & coupons)
 * 2. POST /verify-payment  → Verifies payment with Razorpay & activates Pro tier in Firestore
 * 3. POST /webhook         → Asynchronous webhook listener for payment.captured events
 * 4. POST /validate-coupon → Real-time coupon code verification for frontend
 * 5. GET  /plans           → Returns available pass tiers and pricing
 * 6. GET  /health          → Healthcheck endpoint
 * 
 * Environment Secrets (set via `wrangler secret put`):
 *   RAZORPAY_KEY_ID                – Razorpay Key ID (rzp_test_... or rzp_live_...)
 *   RAZORPAY_KEY_SECRET            – Razorpay Key Secret
 *   RAZORPAY_WEBHOOK_SECRET        – Razorpay Webhook Secret
 *   FIREBASE_PROJECT_ID            – Firebase project ID (neet-coounselling-web)
 *   FIREBASE_SERVICE_ACCOUNT_EMAIL – Firebase Service Account email
 *   FIREBASE_SERVICE_ACCOUNT_KEY   – Base64-encoded Service Account Private Key (PEM)
 */

// ─── Plan definitions (Single Source of Truth for Pricing) ───
const PLANS = {
  basic: {
    key: 'basic',
    name: 'Basic Pass 2026',
    amount: 14900, // ₹149 in paise
    description: 'NEET AIQ Predictor — 700+ Medical Colleges & Wishlist',
    tier: 'pro_plus',
    features: ['AIQ 15% Cutoff Data', 'Full Predictor — 700+ Medical Colleges', 'Wishlist & Sync']
  },
  season: {
    key: 'season',
    name: 'Season Pass 2026',
    amount: 29900, // ₹299 in paise
    description: 'NEET Season Pass — AIQ + State Quota + Smart Choice Fill & Bond Info',
    tier: 'pro_vip',
    features: ['AIQ (15%) + State Quota (85%) Data', 'Smart Choice Fill Algorithm', 'Bond & Fee Structure Info', 'Valid for all counselling rounds']
  },
  upgrade: {
    key: 'upgrade',
    name: 'Upgrade to Season Pass',
    amount: 15000, // ₹150 in paise
    description: 'Upgrade from Basic to Season Pass (Unlock State Quota & Smart Choice Fill)',
    tier: 'pro_vip',
    features: ['State Quota (85%) Data', 'Smart Choice Fill Algorithm', 'Bond & Fee Structure Info']
  }
};

// ─── Server-side Coupon Catalog ───
const COUPONS = {
  'NEETPRO': { discountPaise: 5000, minAmountPaise: 14900, desc: '₹50 Pro Pass Launch Discount' },
  'NEETPASS': { discountPaise: 5000, minAmountPaise: 14900, desc: '₹50 Pass Discount' },
  'NEET50': { discountPaise: 5000, minAmountPaise: 14900, desc: '₹50 Flat Discount' },
  'NEET2026': { discountPaise: 5000, minAmountPaise: 14900, desc: '₹50 Flat Discount for NEET 2026 Aspirants' },
  'EARLYBIRD': { discountPaise: 5000, minAmountPaise: 14900, desc: '₹50 Early Bird Launch Offer' },
  'MEDICO50': { discountPaise: 5000, minAmountPaise: 14900, desc: '₹50 Off for Future Medicos' },
  'DOCTOR100': { discountPaise: 10000, minAmountPaise: 29900, desc: '₹100 Off on Season Pass 2026' }
};

// ─── CORS Origins ───
const ALLOWED_ORIGINS = [
  // Production web app
  'https://neet.counsellor4u.in',
  'https://www.neet.counsellor4u.in',
  'https://counsellor4u.in',
  'https://www.counsellor4u.in',
  // Legacy / alternate domains
  'https://neet-coounselling-web.web.app',
  'https://neet-coounselling-web.firebaseapp.com',
  'https://neetcounselling.in',
  'https://www.neetcounselling.in',
  'https://neetcounsellor.online',
  'https://www.neetcounsellor.online',
  'https://neetcounselling.online',
  'https://www.neetcounselling.online',
  // Local development
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:8080'
];

function getCorsHeaders(request) {
  const origin = request?.headers?.get('Origin') || '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin) ||
                    origin.endsWith('.web.app') ||
                    origin.endsWith('.firebaseapp.com') ||
                    origin.endsWith('.vercel.app') ||
                    origin.endsWith('.counsellor4u.in') ||
                    origin === 'https://counsellor4u.in' ||
                    origin.includes('neetcounsellor.online') ||
                    origin.includes('neetcounselling.online') ||
                    origin.startsWith('http://localhost:') ||
                    origin.startsWith('http://127.0.0.1:');

  const allowedOrigin = isAllowed ? origin : (origin || '*');
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(data, status = 200, request = null) {
  const corsHeaders = getCorsHeaders(request);
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

function errorResponse(message, status = 400, request = null) {
  return jsonResponse({ error: true, message }, status, request);
}

// ─── Main Worker Router ───
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: getCorsHeaders(request) });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, ''); // Strip trailing slash

    try {
      if (path === '/checkout') {
        return await handleCheckoutPage(request, env);
      }

      if (path === '/check-status' || path === '/api/check-status') {
        return await handleCheckStatus(request, env);
      }

      if (path === '/create-order' || path === '/api/create-order') {
        if (request.method !== 'POST') return errorResponse('Method not allowed', 405, request);
        return await handleCreateOrder(request, env);
      }

      if (path === '/verify-payment' || path === '/api/verify-payment') {
        if (request.method !== 'POST') return errorResponse('Method not allowed', 405, request);
        return await handleVerifyPayment(request, env);
      }

      if (path === '/webhook' || path === '/api/webhook' || path === '/api/razorpay-webhook') {
        if (request.method !== 'POST') return errorResponse('Method not allowed', 405, request);
        return await handleWebhook(request, env);
      }

      if (path === '/validate-coupon' || path === '/api/validate-coupon') {
        if (request.method !== 'POST') return errorResponse('Method not allowed', 405, request);
        return await handleValidateCoupon(request, env);
      }

      if (path === '/plans' || path === '/api/plans') {
        return jsonResponse({ plans: PLANS, coupons: Object.keys(COUPONS) }, 200, request);
      }

      if (path === '/health' || path === '/api/health') {
        return jsonResponse({
          status: 'ok',
          service: 'neet-payment-worker',
          project: env.FIREBASE_PROJECT_ID || 'neet-coounselling-web',
          timestamp: new Date().toISOString()
        }, 200, request);
      }

      return errorResponse('Endpoint not found', 404, request);
    } catch (err) {
      console.error('Worker router error:', err);
      return errorResponse(`Internal server error: ${err.message || err}`, 500, request);
    }
  }
};

// ═══════════════════════════════════════════════════════
// 1. CREATE ORDER — Invoked before opening Razorpay Modal
// ═══════════════════════════════════════════════════════
async function handleCreateOrder(request, env) {
  const body = await request.json().catch(() => null);
  if (!body) return errorResponse('Invalid JSON payload', 400, request);

  const userId = body.userId || body.userUid || body.uid;
  const { planKey, email, couponCode } = body;
  if (!planKey || !userId) return errorResponse('Missing planKey or userId', 400, request);

  const plan = PLANS[planKey];
  if (!plan) return errorResponse(`Invalid planKey: '${planKey}'. Expected 'basic', 'season', or 'upgrade'`, 400, request);

  // Require a valid Firebase ID token and ensure it matches the claimed userId.
  // This cryptographically binds the request to the signed-in user.
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse('Authentication required.', 401, request);
  }
  const verifiedUid = await verifyFirebaseToken(authHeader.slice(7), env);
  if (!verifiedUid) {
    return errorResponse('Invalid or expired authentication token.', 401, request);
  }
  if (verifiedUid !== userId) {
    return errorResponse('Token does not match the requested user.', 403, request);
  }

  // Calculate pricing with coupon discount
  let finalAmount = plan.amount;
  let appliedCoupon = null;
  let discountAmount = 0;

  if (couponCode && typeof couponCode === 'string') {
    const normalizedCode = couponCode.trim().toUpperCase();
    const coupon = COUPONS[normalizedCode];
    if (coupon && finalAmount >= coupon.minAmountPaise) {
      discountAmount = coupon.discountPaise;
      finalAmount = Math.max(100, finalAmount - discountAmount); // Minimum ₹1 (100 paise)
      appliedCoupon = normalizedCode;
    }
  }

  // Handle Upgrade Plan Validation: the ₹150 upgrade is ONLY valid for a user
  // who already owns the Basic Pass (pro_plus). Fail closed — if we cannot
  // positively confirm their current entitlement, reject the upgrade.
  if (planKey === 'upgrade') {
    const entitlement = await getServerEntitlement(userId, env);
    if (!entitlement.ok) {
      return errorResponse('Could not verify your current pass. Please try again in a moment.', 503, request);
    }
    if (entitlement.tier === 'pro_vip') {
      return errorResponse('You already have Season Pass (PRO VIP) Full Access!', 400, request);
    }
    if (!entitlement.isPremium || entitlement.tier !== 'pro_plus') {
      return errorResponse('The ₹150 upgrade is only available to Basic Pass holders. Please purchase the Season Pass instead.', 400, request);
    }
  }

  // Create Order in Razorpay API
  const orderPayload = {
    amount: finalAmount,
    currency: 'INR',
    payment_capture: 1, // Auto-capture payment upon authorization
    receipt: `neet_${userId.slice(-6)}_${Date.now().toString().slice(-6)}`,
    notes: {
      userId,
      email: email || '',
      planKey,
      tier: plan.tier,
      originalAmount: plan.amount,
      discountAmount: discountAmount,
      appliedCoupon: appliedCoupon || 'NONE'
    }
  };

  const rzpKeyId = env.RAZORPAY_KEY_ID || '';
  const rzpSecret = env.RAZORPAY_KEY_SECRET || '';

  let order = null;
  if (rzpSecret) {
    try {
      const rzpAuth = btoa(`${rzpKeyId}:${rzpSecret}`);
      const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${rzpAuth}`
        },
        body: JSON.stringify(orderPayload)
      });

      if (orderRes.ok) {
        order = await orderRes.json();
      } else {
        const errText = await orderRes.text();
        console.warn('Razorpay order creation returned non-ok:', errText);
      }
    } catch (apiErr) {
      console.warn('Razorpay order creation network err:', apiErr.message);
    }
  }

  // Log pending payment intent to Firestore asynchronously if order created
  if (order?.id) {
    try {
      const accessToken = await getFirebaseAccessToken(env);
      const pendingPaymentUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/pending_payments/${order.id}`;
      const pendingData = {
        fields: {
          orderId: { stringValue: order.id },
          userId: { stringValue: userId },
          email: { stringValue: email || '' },
          planKey: { stringValue: planKey },
          tier: { stringValue: plan.tier },
          amountPaise: { integerValue: String(finalAmount) },
          status: { stringValue: 'created' },
          appliedCoupon: { stringValue: appliedCoupon || 'NONE' },
          createdAt: { timestampValue: new Date().toISOString() }
        }
      };
      await fetch(pendingPaymentUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(pendingData)
      });
    } catch (e) {
      console.warn('Could not write pending payment to Firestore:', e.message);
    }
  }

  return jsonResponse({
    orderId: order?.id || null,
    amount: order?.amount || finalAmount,
    currency: order?.currency || 'INR',
    keyId: rzpKeyId,
    planKey,
    planName: plan.name,
    tier: plan.tier,
    appliedCoupon,
    discountAmount,
    fallback: !order?.id
  }, 200, request);
}

// ═══════════════════════════════════════════════════════
// 2. VERIFY PAYMENT — Called by Frontend on Razorpay Success
// ═══════════════════════════════════════════════════════
async function handleVerifyPayment(request, env) {
  const body = await request.json().catch(() => null);
  if (!body) return errorResponse('Invalid JSON payload', 400, request);

  const userId = body.userId || body.userUid || body.uid;
  const {
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature,
    planKey
  } = body;

  if (!razorpayPaymentId || !userId) {
    return errorResponse('Missing razorpayPaymentId or userId', 400, request);
  }

  // Require a valid Firebase ID token that matches the claimed userId. This
  // ensures a payment can only be redeemed into its owner's account.
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse('Authentication required.', 401, request);
  }
  const verifiedUid = await verifyFirebaseToken(authHeader.slice(7), env);
  if (!verifiedUid) {
    return errorResponse('Invalid or expired authentication token.', 401, request);
  }
  if (verifiedUid !== userId) {
    return errorResponse('Token does not match the requested user.', 403, request);
  }

  const rzpKeyId = env.RAZORPAY_KEY_ID || '';
  const rzpSecret = env.RAZORPAY_KEY_SECRET || '';

  // Fail closed if the gateway secret is not configured. Without it we cannot
  // verify anything, so we must never grant an entitlement.
  if (!rzpSecret) {
    console.error('RAZORPAY_KEY_SECRET is not configured — refusing to verify payment.');
    return errorResponse('Payment verification is temporarily unavailable. Please contact support.', 503, request);
  }

  // Enforce HMAC signature verification. Fail closed: an invalid/missing
  // signature must NEVER result in an upgrade.
  if (razorpayOrderId && razorpaySignature) {
    const dataToSign = `${razorpayOrderId}|${razorpayPaymentId}`;
    const isValidSignature = await verifyRazorpaySignature(dataToSign, razorpaySignature, rzpSecret);
    if (!isValidSignature) {
      console.warn('Signature verification FAILED for:', razorpayPaymentId);
      return errorResponse('Payment signature verification failed. Please contact support with your payment ID.', 400, request);
    }
  } else {
    // Secret is configured, so a signature is mandatory — reject unsigned requests.
    return errorResponse('Missing payment signature. Cannot verify this payment.', 400, request);
  }

  // Fetch the authoritative payment + order from Razorpay. The tier and amount
  // MUST come from Razorpay's records (notes set at order creation), never from
  // the client payload, otherwise a user could pay for Basic and claim VIP.
  let payment = null;
  try {
    const rzpAuth = btoa(`${rzpKeyId}:${rzpSecret}`);
    const paymentRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpayPaymentId}`, {
      headers: { 'Authorization': `Basic ${rzpAuth}` }
    });

    if (!paymentRes.ok) {
      return errorResponse('Could not retrieve payment from Razorpay.', 400, request);
    }

    payment = await paymentRes.json();

    // If status is authorized, auto-capture it before granting access.
    if (payment.status === 'authorized') {
      const capRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpayPaymentId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${rzpAuth}`
        },
        body: JSON.stringify({ amount: payment.amount, currency: payment.currency || 'INR' })
      });
      if (capRes.ok) {
        payment = await capRes.json();
      }
    }
  } catch (e) {
    console.error('Razorpay payment fetch error:', e.message);
    return errorResponse('Could not verify payment with Razorpay.', 500, request);
  }

  // Only captured/paid payments may unlock entitlement.
  if (payment.status !== 'captured' && payment.status !== 'paid') {
    return errorResponse(`Payment is not captured (status: ${payment.status}).`, 400, request);
  }

  // Derive the plan + tier from the server-recorded order/payment notes.
  const notesPlanKey = payment.notes?.planKey || payment.notes?.plan || '';
  const resolvedPlanKey = PLANS[notesPlanKey] ? notesPlanKey : (planKey || body.plan || 'season');
  const plan = PLANS[resolvedPlanKey] || PLANS['season'];
  const tier = plan.tier || 'pro_vip';

  // The captured amount must match at least the plan's server-side minimum
  // (covers the coupon-discounted price but blocks underpayment attacks).
  if (typeof payment.amount === 'number' && payment.amount < plan.amount - 10000) {
    console.error('Amount mismatch:', payment.amount, 'for plan', resolvedPlanKey);
    return errorResponse('Paid amount does not match the selected plan. Please contact support.', 400, request);
  }

  // Defense in depth: an 'upgrade' order is only valid for a Basic Pass holder.
  // Prevents a crafted ₹150 upgrade order from granting VIP to a free user.
  if (resolvedPlanKey === 'upgrade') {
    const entitlement = await getServerEntitlement(userId, env);
    if (!entitlement.ok || !entitlement.isPremium || entitlement.tier !== 'pro_plus') {
      return errorResponse('Upgrade not permitted: no active Basic Pass found for this account.', 403, request);
    }
  }

  // Activate Pro Tier in Firestore
  try {
    const accessToken = await getFirebaseAccessToken(env);

    // NEET Counselling Validity: 1 Year (covers all rounds 1, 2, 3, stray, mop-up)
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);

    const updateFields = {
      fields: {
        isPremium: { booleanValue: true },
        tierType: { stringValue: tier }, // 'pro_vip' or 'pro_plus'
        premiumTier: { stringValue: tier },
        premiumPlan: { stringValue: resolvedPlanKey },
        paymentStatus: { stringValue: 'completed' },
        paymentId: { stringValue: payment.id },
        orderId: { stringValue: razorpayOrderId || payment.order_id || '' },
        amountPaise: { integerValue: String(payment.amount) },
        premiumActivatedAt: { timestampValue: new Date().toISOString() },
        premiumExpiry: { timestampValue: expiry.toISOString() }
      }
    };

    const updateMask = Object.keys(updateFields.fields)
      .map(f => `updateMask.fieldPaths=${f}`)
      .join('&');

    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}?${updateMask}`;

    const fsRes = await fetch(firestoreUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(updateFields)
    });

    if (!fsRes.ok) {
      const errText = await fsRes.text();
      console.error('Firestore user update failed:', errText);
      return errorResponse('Failed to activate Pro tier in Firestore', 500, request);
    }

    // Write audit record to /payments/{paymentId}
    const paymentAudit = {
      fields: {
        userId: { stringValue: userId },
        email: { stringValue: payment.email || '' },
        contact: { stringValue: payment.contact || '' },
        planKey: { stringValue: resolvedPlanKey },
        tier: { stringValue: tier },
        razorpayPaymentId: { stringValue: payment.id },
        razorpayOrderId: { stringValue: razorpayOrderId || payment.order_id || '' },
        amount: { integerValue: String(payment.amount) },
        currency: { stringValue: payment.currency || 'INR' },
        status: { stringValue: 'captured' },
        method: { stringValue: payment.method || 'unknown' },
        verifiedVia: { stringValue: 'direct_verify' },
        createdAt: { timestampValue: new Date().toISOString() }
      }
    };

    const auditUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/payments/${payment.id}`;
    await fetch(auditUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(paymentAudit)
    });

    console.log(`✅ [Payment Verified]: User ${userId} upgraded to ${tier} (${resolvedPlanKey})`);

    return jsonResponse({
      success: true,
      verified: true,
      userId,
      tier,
      planKey: resolvedPlanKey,
      paymentId: payment.id,
      amount: payment.amount
    }, 200, request);

  } catch (err) {
    console.error('Verify-payment Firestore error:', err);
    return errorResponse(`Failed to activate subscription: ${err.message}`, 500, request);
  }
}

// ═══════════════════════════════════════════════════════
// 3. WEBHOOK — Called by Razorpay for Asynchronous Events
// ═══════════════════════════════════════════════════════
async function handleWebhook(request, env) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature');

  if (!signature) {
    return errorResponse('Missing x-razorpay-signature header', 400, request);
  }

  // Webhook cryptographic verification
  const isValid = await verifyRazorpaySignature(rawBody, signature, env.RAZORPAY_WEBHOOK_SECRET);
  if (!isValid) {
    console.error('Webhook signature mismatch');
    return errorResponse('Invalid webhook signature', 400, request);
  }

  const event = JSON.parse(rawBody);

  // We handle payment.captured and order.paid
  if (event.event !== 'payment.captured' && event.event !== 'order.paid') {
    return jsonResponse({ status: 'ignored', event: event.event }, 200, request);
  }

  const payment = event.payload?.payment?.entity;
  if (!payment) {
    return errorResponse('No payment entity in webhook payload', 400, request);
  }

  const userId = payment.notes?.userId || payment.notes?.userUid || payment.notes?.uid;
  const planKey = payment.notes?.planKey || 'season';
  const tier = payment.notes?.tier || PLANS[planKey]?.tier || 'pro_vip';

  if (!userId) {
    console.warn('Webhook received payment with no userId in notes:', payment.id);
    return jsonResponse({ status: 'no_user_id_in_notes', paymentId: payment.id }, 200, request);
  }

  try {
    const accessToken = await getFirebaseAccessToken(env);

    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);

    const firestoreData = {
      fields: {
        isPremium: { booleanValue: true },
        tierType: { stringValue: tier },
        premiumTier: { stringValue: tier },
        premiumPlan: { stringValue: planKey },
        paymentStatus: { stringValue: 'completed' },
        paymentId: { stringValue: payment.id },
        amountPaise: { integerValue: String(payment.amount) },
        premiumActivatedAt: { timestampValue: new Date().toISOString() },
        premiumExpiry: { timestampValue: expiry.toISOString() }
      }
    };

    const updateMask = Object.keys(firestoreData.fields)
      .map(f => `updateMask.fieldPaths=${f}`)
      .join('&');

    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}?${updateMask}`;

    await fetch(firestoreUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(firestoreData)
    });

    // Write audit record
    const paymentAudit = {
      fields: {
        userId: { stringValue: userId },
        email: { stringValue: payment.email || '' },
        contact: { stringValue: payment.contact || '' },
        planKey: { stringValue: planKey },
        tier: { stringValue: tier },
        razorpayPaymentId: { stringValue: payment.id },
        razorpayOrderId: { stringValue: payment.order_id || '' },
        amount: { integerValue: String(payment.amount) },
        currency: { stringValue: payment.currency || 'INR' },
        status: { stringValue: 'captured' },
        method: { stringValue: payment.method || 'unknown' },
        verifiedVia: { stringValue: 'webhook' },
        createdAt: { timestampValue: new Date().toISOString() }
      }
    };

    const auditUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/payments/${payment.id}`;
    await fetch(auditUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(paymentAudit)
    });

    console.log(`✅ [Webhook Fulfilled]: User ${userId} updated to ${tier}`);
    return jsonResponse({ status: 'ok', userId, tier, paymentId: payment.id }, 200, request);

  } catch (err) {
    console.error('Webhook handling error:', err);
    return errorResponse(`Webhook failure: ${err.message}`, 500, request);
  }
}

// ═══════════════════════════════════════════════════════
// 4. VALIDATE COUPON — Instant Feedback for Coupon Inputs
// ═══════════════════════════════════════════════════════
async function handleValidateCoupon(request, env) {
  const body = await request.json().catch(() => null);
  if (!body || !body.code) return errorResponse('Missing coupon code', 400, request);

  const code = body.code.trim().toUpperCase();
  const planKey = body.planKey || 'season';
  const plan = PLANS[planKey] || PLANS['season'];
  const coupon = COUPONS[code];

  if (!coupon) {
    return jsonResponse({ valid: false, message: 'Invalid or expired coupon code' }, 200, request);
  }

  if (plan.amount < coupon.minAmountPaise) {
    return jsonResponse({
      valid: false,
      message: `Coupon '${code}' requires a minimum pass value of ₹${coupon.minAmountPaise / 100}`
    }, 200, request);
  }

  const finalAmountPaise = Math.max(100, plan.amount - coupon.discountPaise);

  return jsonResponse({
    valid: true,
    code,
    description: coupon.desc,
    discountPaise: coupon.discountPaise,
    discountRupees: coupon.discountPaise / 100,
    originalAmountPaise: plan.amount,
    finalAmountPaise: finalAmountPaise,
    finalAmountRupees: finalAmountPaise / 100
  }, 200, request);
}

// ═══════════════════════════════════════════════════════
// FIREBASE: Read a user's authoritative entitlement from Firestore
// Returns { ok, isPremium, tier }. `ok === false` means the lookup failed
// (callers must fail closed and NOT grant anything).
// ═══════════════════════════════════════════════════════
async function getServerEntitlement(userId, env) {
  try {
    const accessToken = await getFirebaseAccessToken(env);
    const userDocUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}`;
    const res = await fetch(userDocUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      return { ok: false, isPremium: false, tier: 'free' };
    }
    const userDoc = await res.json();
    const fields = userDoc.fields || {};
    const isPremium = fields.isPremium?.booleanValue === true;
    const tier = fields.tierType?.stringValue || fields.premiumTier?.stringValue || 'free';
    return { ok: true, isPremium, tier };
  } catch (e) {
    console.warn('Entitlement lookup failed:', e.message);
    return { ok: false, isPremium: false, tier: 'free' };
  }
}

// ═══════════════════════════════════════════════════════
// CRYPTO: Native HMAC-SHA256 Signature Verification
// ═══════════════════════════════════════════════════════
async function verifyRazorpaySignature(payload, signature, secret) {
  if (!secret || !signature) return false;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (expectedSignature.length !== signature.length) return false;
    let mismatch = 0;
    for (let i = 0; i < expectedSignature.length; i++) {
      mismatch |= expectedSignature.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return mismatch === 0;
  } catch (e) {
    console.error('Signature verification error:', e);
    return false;
  }
}

// ═══════════════════════════════════════════════════════
// FIREBASE: Service Account OAuth2 JWT Signer for Firestore
// ═══════════════════════════════════════════════════════
let cachedAccessToken = null;
let tokenExpiry = 0;

async function getFirebaseAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && now < tokenExpiry - 60) {
    return cachedAccessToken;
  }

  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: env.FIREBASE_SERVICE_ACCOUNT_EMAIL,
    sub: env.FIREBASE_SERVICE_ACCOUNT_EMAIL,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/datastore'
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedClaims = base64urlEncode(JSON.stringify(claims));
  const unsignedJwt = `${encodedHeader}.${encodedClaims}`;

  const pemKey = atob(env.FIREBASE_SERVICE_ACCOUNT_KEY);
  const binaryKey = pemToBinary(pemKey);

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedJwt)
  );

  const signature = base64urlEncode(signatureBuffer);
  const jwt = `${unsignedJwt}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Google OAuth Token exchange failed: ${errText}`);
  }

  const { access_token, expires_in } = await tokenRes.json();
  cachedAccessToken = access_token;
  tokenExpiry = now + (expires_in || 3600);
  return access_token;
}

// ─── Firebase ID Token Verification (cryptographic, RS256) ───
let cachedGoogleCerts = null;
let googleCertsExpiry = 0;

async function getGooglePublicCerts() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedGoogleCerts && now < googleCertsExpiry - 60) {
    return cachedGoogleCerts;
  }
  const res = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
  if (!res.ok) throw new Error('Failed to fetch Google public certs');
  const certs = await res.json();

  // Cache-Control max-age usually ~1 hour; fall back to 1 hour.
  let maxAge = 3600;
  const cc = res.headers.get('cache-control') || '';
  const m = cc.match(/max-age=(\d+)/);
  if (m) maxAge = parseInt(m[1], 10);
  cachedGoogleCerts = certs;
  googleCertsExpiry = now + maxAge;
  return certs;
}

function pemToArrayBuffer(pem) {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function base64urlToBytes(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
  const binary = atob(b64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function verifyFirebaseToken(idToken, env) {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const header = JSON.parse(new TextDecoder().decode(base64urlToBytes(encodedHeader)));
    const payload = JSON.parse(new TextDecoder().decode(base64urlToBytes(encodedPayload)));

    if (header.alg !== 'RS256' || !header.kid) return null;

    // Fetch Google's signing cert for this kid and verify the signature.
    const certs = await getGooglePublicCerts();
    const pem = certs[header.kid];
    if (!pem) return null;

    const cryptoKey = await crypto.subtle.importKey(
      'spki',
      pemToArrayBuffer(pem),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signature = base64urlToBytes(encodedSignature);
    const signedData = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
    const isValid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, signature, signedData);
    if (!isValid) return null;

    // Claim validation.
    const now = Date.now() / 1000;
    if (!payload.exp || payload.exp < now) return null;
    if (payload.iss !== `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`) return null;
    if (payload.aud !== env.FIREBASE_PROJECT_ID) return null;
    if (!payload.sub) return null;

    return payload.sub;
  } catch (e) {
    console.warn('Firebase ID token verification error:', e.message);
    return null;
  }
}

function base64urlEncode(input) {
  const data = typeof input === 'string'
    ? new TextEncoder().encode(input)
    : new Uint8Array(input);
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToBinary(pem) {
  const lines = pem.split('\n').filter(l => !l.startsWith('-----'));
  const base64 = lines.join('');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ═══════════════════════════════════════════════════════
// 5. HOSTED CHECKOUT PAGE — Native Mobile App & Web Checkout
// ═══════════════════════════════════════════════════════
async function handleCheckoutPage(request, env) {
  const url = new URL(request.url);
  const planKey = url.searchParams.get('planKey') || 'season';
  const userId = url.searchParams.get('userId') || url.searchParams.get('uid') || 'guest';
  const email = url.searchParams.get('email') || '';
  const coupon = url.searchParams.get('coupon') || '';
  const orderIdParam = url.searchParams.get('orderId') || '';
  const redirectUrl = url.searchParams.get('redirectUrl') || 'neetcounsellor://payment-callback';

  const plan = PLANS[planKey] || PLANS['season'];
  const rzpKeyId = env.RAZORPAY_KEY_ID || '';

  // Calculate pricing with coupon discount
  let finalAmount = plan.amount;
  let appliedCoupon = null;
  let discountAmount = 0;
  if (coupon && typeof coupon === 'string') {
    const normalizedCode = coupon.trim().toUpperCase();
    const c = COUPONS[normalizedCode];
    if (c && finalAmount >= c.minAmountPaise) {
      discountAmount = c.discountPaise;
      finalAmount = Math.max(100, finalAmount - discountAmount);
      appliedCoupon = normalizedCode;
    }
  }

  const priceRupees = Math.round(finalAmount / 100);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Complete Payment — NEET Counselling 2026</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #070913;
      color: #FFFFFF;
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.25rem;
      background-image: 
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(245, 158, 11, 0.15), transparent),
        radial-gradient(ellipse 60% 40% at 50% 120%, rgba(37, 99, 235, 0.12), transparent);
    }
    .card {
      background: rgba(16, 20, 36, 0.95);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: 24px;
      padding: 2rem 1.75rem;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(245, 158, 11, 0.1);
      backdrop-filter: blur(20px);
      position: relative;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.9rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 700;
      background: rgba(245, 158, 11, 0.15);
      color: #F59E0B;
      border: 1px solid rgba(245, 158, 11, 0.3);
      margin-bottom: 1.25rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 1.75rem;
      font-weight: 800;
      color: #FFFFFF;
      margin-bottom: 0.5rem;
    }
    p.sub {
      color: #94A3B8;
      font-size: 0.9rem;
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }
    .pricing-box {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 1.2rem;
      margin-bottom: 1.5rem;
      text-align: left;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
      color: #94A3B8;
    }
    .row.total {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      color: #FFFFFF;
      font-weight: 700;
      font-size: 1.15rem;
    }
    .row.total .price {
      color: #F59E0B;
      font-family: 'Outfit', sans-serif;
      font-size: 1.5rem;
      font-weight: 900;
    }
    .btn {
      width: 100%;
      padding: 1rem 1.5rem;
      border-radius: 14px;
      border: none;
      font-family: 'Outfit', sans-serif;
      font-size: 1.05rem;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
      text-decoration: none;
    }
    .btn-pay {
      background: linear-gradient(135deg, #F59E0B, #D97706);
      color: #070913;
      box-shadow: 0 10px 25px rgba(245, 158, 11, 0.35);
      margin-bottom: 0.75rem;
    }
    .btn-pay:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 14px 30px rgba(245, 158, 11, 0.45);
    }
    .btn-cancel {
      background: transparent;
      color: #64748B;
      font-size: 0.88rem;
      padding: 0.6rem;
    }
    .spinner {
      width: 20px;
      height: 20px;
      border: 3px solid rgba(0,0,0,0.2);
      border-top-color: #000;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .status-msg {
      margin-top: 1rem;
      font-size: 0.85rem;
      color: #94A3B8;
    }
    .trust-footer {
      margin-top: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.25rem;
      color: #64748B;
      font-size: 0.78rem;
    }
    .trust-item {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">🔒 Verified Instant Activation</div>
    <h1>${plan.name}</h1>
    <p class="sub">${plan.description}</p>

    <div class="pricing-box">
      <div class="row">
        <span>Plan Access</span>
        <strong style="color: #FFF;">All Counselling Rounds (1 Year)</strong>
      </div>
      ${discountAmount > 0 ? `
      <div class="row" style="color: #10B981;">
        <span>Coupon (${appliedCoupon})</span>
        <strong>-₹${Math.round(discountAmount / 100)}</strong>
      </div>
      ` : ''}
      <div class="row total">
        <span>Total Payable</span>
        <span class="price">₹${priceRupees}</span>
      </div>
    </div>

    <button id="payBtn" class="btn btn-pay" onclick="launchCheckout()">
      <span id="btnText">Proceed to Pay ₹${priceRupees}</span>
    </button>

    <button id="cancelBtn" class="btn btn-cancel" onclick="handleCancel()">
      Cancel &amp; Return to App
    </button>

    <div id="statusMsg" class="status-msg">
      Initializing Razorpay secure payment gateway…
    </div>

    <div class="trust-footer">
      <div class="trust-item">🛡️ 256-Bit SSL</div>
      <div class="trust-item">⚡ Instant Unlock</div>
      <div class="trust-item">💳 UPI / Cards / NetBanking</div>
    </div>
  </div>

  <script>
    const CONFIG = {
      keyId: "${rzpKeyId}",
      amountPaise: ${finalAmount},
      orderId: "${orderIdParam}",
      planKey: "${planKey}",
      planName: "${plan.name}",
      tier: "${plan.tier}",
      userId: "${userId}",
      email: "${email}",
      redirectUrl: "${redirectUrl}",
      coupon: "${appliedCoupon || ''}"
    };

    let rzpInstance = null;

    function setStatus(text, color) {
      const el = document.getElementById('statusMsg');
      if (el) {
        el.innerText = text;
        if (color) el.style.color = color;
      }
    }

    function returnToApp(paymentId, orderId) {
      setStatus('Payment Successful! Returning to NeetCounsellor app…', '#10B981');
      const btn = document.getElementById('payBtn');
      if (btn) {
        btn.innerHTML = '✓ Payment Successful';
        btn.style.background = '#10B981';
      }

      const pId = paymentId || ('rzp_paid_' + Date.now());
      const oId = orderId || CONFIG.orderId || '';
      
      let target = CONFIG.redirectUrl;
      const sep = target.includes('?') ? '&' : '?';
      target = target + sep + 'payment_id=' + encodeURIComponent(pId) +
               '&razorpay_payment_id=' + encodeURIComponent(pId) +
               (oId ? '&order_id=' + encodeURIComponent(oId) : '') +
               '&planKey=' + encodeURIComponent(CONFIG.planKey) +
               '&status=success';

      setTimeout(function() {
        window.location.href = target;
      }, 600);
    }

    function handleCancel() {
      let target = CONFIG.redirectUrl;
      const sep = target.includes('?') ? '&' : '?';
      target = target + sep + 'status=cancelled';
      window.location.href = target;
    }

    function launchCheckout() {
      if (!window.Razorpay) {
        setStatus('Razorpay SDK loading… Please wait 2 seconds.', '#F59E0B');
        setTimeout(launchCheckout, 1000);
        return;
      }

      const btn = document.getElementById('payBtn');
      const btnText = document.getElementById('btnText');
      if (btnText) btnText.innerHTML = '<span class="spinner"></span> Opening Payment Window…';
      if (btn) btn.disabled = true;

      const options = {
        key: CONFIG.keyId,
        amount: CONFIG.amountPaise,
        currency: 'INR',
        name: 'NeetCounsellor 2026',
        description: CONFIG.planName,
        order_id: CONFIG.orderId || undefined,
        prefill: {
          email: CONFIG.email || '',
        },
        notes: {
          userId: CONFIG.userId,
          planKey: CONFIG.planKey,
          tier: CONFIG.tier,
          coupon: CONFIG.coupon,
          platform: 'mobile_hosted'
        },
        theme: {
          color: CONFIG.planKey === 'season' ? '#F59E0B' : '#2563EB',
          backdrop_color: 'rgba(7, 9, 19, 0.95)'
        },
        modal: {
          ondismiss: function() {
            if (btn) btn.disabled = false;
            if (btnText) btnText.innerText = 'Retry Payment (₹' + Math.round(CONFIG.amountPaise / 100) + ')';
            setStatus('Payment window was closed. You can tap Retry anytime.', '#94A3B8');
          }
        },
        handler: function(response) {
          const pid = response.razorpay_payment_id;
          const oid = response.razorpay_order_id || CONFIG.orderId;
          const sig = response.razorpay_signature;

          setStatus('Verifying payment and unlocking Pro tier…', '#F59E0B');

          // Asynchronously notify worker
          fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpayPaymentId: pid,
              razorpayOrderId: oid,
              razorpaySignature: sig,
              userId: CONFIG.userId,
              planKey: CONFIG.planKey
            })
          }).catch(function(e) {
            console.warn('Verify fetch warn:', e);
          }).finally(function() {
            returnToApp(pid, oid);
          });
        }
      };

      try {
        rzpInstance = new window.Razorpay(options);
        rzpInstance.on('payment.failed', function(resp) {
          if (btn) btn.disabled = false;
          if (btnText) btnText.innerText = 'Retry Payment';
          setStatus(resp?.error?.description || 'Payment was unsuccessful.', '#EF4444');
        });
        rzpInstance.open();
        setStatus('Secure Razorpay window opened.', '#10B981');
      } catch (err) {
        if (btn) btn.disabled = false;
        if (btnText) btnText.innerText = 'Retry Payment';
        setStatus(err?.message || 'Error opening Razorpay modal.', '#EF4444');
      }
    }

    // Auto-launch Razorpay after 400ms
    window.addEventListener('load', function() {
      setTimeout(launchCheckout, 400);
    });
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      ...getCorsHeaders(request)
    }
  });
}

// ═══════════════════════════════════════════════════════
// 6. ORDER STATUS CHECK — Used by Native App
// ═══════════════════════════════════════════════════════
async function handleCheckStatus(request, env) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get('orderId');
  if (!orderId) {
    return errorResponse('Missing orderId query parameter', 400, request);
  }

  const rzpKeyId = env.RAZORPAY_KEY_ID || '';
  const rzpSecret = env.RAZORPAY_KEY_SECRET || '';

  // 1. Check in Razorpay API if secret is configured
  if (rzpSecret) {
    try {
      const rzpAuth = btoa(`${rzpKeyId}:${rzpSecret}`);
      const res = await fetch(`https://api.razorpay.com/v1/orders/${orderId}/payments`, {
        headers: { 'Authorization': `Basic ${rzpAuth}` }
      });
      if (res.ok) {
        const data = await res.json();
        const payments = data.items || [];
        const captured = payments.find(p => p.status === 'captured' || p.status === 'authorized');
        if (captured) {
          return jsonResponse({
            paid: true,
            paymentId: captured.id,
            status: captured.status,
            amount: captured.amount,
            method: captured.method
          }, 200, request);
        }
      }
    } catch (e) {
      console.warn('Razorpay check-status error:', e.message);
    }
  }

  // 2. Check in Firestore pending_payments
  try {
    const accessToken = await getFirebaseAccessToken(env);
    const pendingUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/pending_payments/${orderId}`;
    const pRes = await fetch(pendingUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (pRes.ok) {
      const pData = await pRes.json();
      const status = pData.fields?.status?.stringValue;
      const paymentId = pData.fields?.paymentId?.stringValue;
      if (status === 'completed' || status === 'captured') {
        return jsonResponse({ paid: true, paymentId: paymentId || orderId, status }, 200, request);
      }
    }
  } catch (e) {
    console.warn('Firestore check-status error:', e.message);
  }

  return jsonResponse({ paid: false, status: 'pending' }, 200, request);
}
