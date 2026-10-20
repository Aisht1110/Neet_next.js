var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
var PLANS = {
  basic: {
    key: "basic",
    name: "Basic Pass 2026",
    amount: 14900,
    // ₹149 in paise
    description: "NEET AIQ Predictor \u2014 700+ Medical Colleges & Wishlist",
    tier: "pro_plus",
    features: ["AIQ 15% Cutoff Data", "Full Predictor \u2014 700+ Medical Colleges", "Wishlist & Sync"]
  },
  season: {
    key: "season",
    name: "Season Pass 2026",
    amount: 29900,
    // ₹299 in paise
    description: "NEET Season Pass \u2014 AIQ + State Quota + Smart Choice Fill & Bond Info",
    tier: "pro_vip",
    features: ["AIQ (15%) + State Quota (85%) Data", "Smart Choice Fill Algorithm", "Bond & Fee Structure Info", "Valid for all counselling rounds"]
  },
  upgrade: {
    key: "upgrade",
    name: "Upgrade to Season Pass",
    amount: 15e3,
    // ₹150 in paise
    description: "Upgrade from Basic to Season Pass (Unlock State Quota & Smart Choice Fill)",
    tier: "pro_vip",
    features: ["State Quota (85%) Data", "Smart Choice Fill Algorithm", "Bond & Fee Structure Info"]
  }
};
var COUPONS = {
  "NEET2026": { discountPaise: 5e3, minAmountPaise: 14900, desc: "\u20B950 Flat Discount for NEET 2026 Aspirants" },
  "EARLYBIRD": { discountPaise: 5e3, minAmountPaise: 14900, desc: "\u20B950 Early Bird Launch Offer" },
  "MEDICO50": { discountPaise: 5e3, minAmountPaise: 14900, desc: "\u20B950 Off for Future Medicos" },
  "DOCTOR100": { discountPaise: 1e4, minAmountPaise: 29900, desc: "\u20B9100 Off on Season Pass 2026" }
};
var ALLOWED_ORIGINS = [
  "https://neet-coounselling-web.web.app",
  "https://neet-coounselling-web.firebaseapp.com",
  "https://neetcounselling.in",
  "https://www.neetcounselling.in",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  "http://localhost:3000",
  "http://localhost:8080"
];
function getCorsHeaders(request) {
  const origin = request?.headers?.get("Origin") || "";
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".web.app") || origin.endsWith(".firebaseapp.com") || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:");
  const allowedOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0] || "*";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400"
  };
}
__name(getCorsHeaders, "getCorsHeaders");
function jsonResponse(data, status = 200, request = null) {
  const corsHeaders = getCorsHeaders(request);
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}
__name(jsonResponse, "jsonResponse");
function errorResponse(message, status = 400, request = null) {
  return jsonResponse({ error: true, message }, status, request);
}
__name(errorResponse, "errorResponse");
var worker_default = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: getCorsHeaders(request) });
    }
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "");
    try {
      if (path === "/create-order" || path === "/api/create-order") {
        if (request.method !== "POST")
          return errorResponse("Method not allowed", 405, request);
        return await handleCreateOrder(request, env);
      }
      if (path === "/verify-payment" || path === "/api/verify-payment") {
        if (request.method !== "POST")
          return errorResponse("Method not allowed", 405, request);
        return await handleVerifyPayment(request, env);
      }
      if (path === "/webhook" || path === "/api/webhook" || path === "/api/razorpay-webhook") {
        if (request.method !== "POST")
          return errorResponse("Method not allowed", 405, request);
        return await handleWebhook(request, env);
      }
      if (path === "/validate-coupon" || path === "/api/validate-coupon") {
        if (request.method !== "POST")
          return errorResponse("Method not allowed", 405, request);
        return await handleValidateCoupon(request, env);
      }
      if (path === "/plans" || path === "/api/plans") {
        return jsonResponse({ plans: PLANS, coupons: Object.keys(COUPONS) }, 200, request);
      }
      if (path === "/health" || path === "/api/health") {
        return jsonResponse({
          status: "ok",
          service: "neet-payment-worker",
          project: env.FIREBASE_PROJECT_ID || "neet-coounselling-web",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }, 200, request);
      }
      return errorResponse("Endpoint not found", 404, request);
    } catch (err) {
      console.error("Worker router error:", err);
      return errorResponse(`Internal server error: ${err.message || err}`, 500, request);
    }
  }
};
async function handleCreateOrder(request, env) {
  const body = await request.json().catch(() => null);
  if (!body)
    return errorResponse("Invalid JSON payload", 400, request);
  const { planKey, userId, email, couponCode } = body;
  if (!planKey || !userId)
    return errorResponse("Missing planKey or userId", 400, request);
  const plan = PLANS[planKey];
  if (!plan)
    return errorResponse(`Invalid planKey: '${planKey}'. Expected 'basic', 'season', or 'upgrade'`, 400, request);
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const idToken = authHeader.slice(7);
    const verifiedUid = await verifyFirebaseToken(idToken, env);
    if (!verifiedUid || verifiedUid !== userId) {
      return errorResponse("Token verification failed or UID mismatch", 401, request);
    }
  }
  let finalAmount = plan.amount;
  let appliedCoupon = null;
  let discountAmount = 0;
  if (couponCode && typeof couponCode === "string") {
    const normalizedCode = couponCode.trim().toUpperCase();
    const coupon = COUPONS[normalizedCode];
    if (coupon && finalAmount >= coupon.minAmountPaise) {
      discountAmount = coupon.discountPaise;
      finalAmount = Math.max(100, finalAmount - discountAmount);
      appliedCoupon = normalizedCode;
    }
  }
  if (planKey === "upgrade") {
    try {
      const accessToken = await getFirebaseAccessToken(env);
      const userDocUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}`;
      const userDocRes = await fetch(userDocUrl, {
        headers: { "Authorization": `Bearer ${accessToken}` }
      });
      if (userDocRes.ok) {
        const userDoc = await userDocRes.json();
        const fields = userDoc.fields || {};
        const isPremium = fields.isPremium?.booleanValue === true;
        const currentTier = fields.tierType?.stringValue || fields.premiumTier?.stringValue || "";
        if (currentTier === "pro_vip") {
          return errorResponse("You already have Season Pass (PRO VIP) Full Access!", 400, request);
        }
      }
    } catch (e) {
      console.warn("Upgrade validation check skipped:", e.message);
    }
  }
  const orderPayload = {
    amount: finalAmount,
    currency: "INR",
    payment_capture: 1,
    // Auto-capture payment upon authorization
    receipt: `neet_${userId.slice(-6)}_${Date.now().toString().slice(-6)}`,
    notes: {
      userId,
      email: email || "",
      planKey,
      tier: plan.tier,
      originalAmount: plan.amount,
      discountAmount,
      appliedCoupon: appliedCoupon || "NONE"
    }
  };
  const rzpAuth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
  const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${rzpAuth}`
    },
    body: JSON.stringify(orderPayload)
  });
  if (!orderRes.ok) {
    const errText = await orderRes.text();
    console.error("Razorpay order creation failed:", errText);
    return errorResponse(`Razorpay order creation failed: ${errText}`, 500, request);
  }
  const order = await orderRes.json();
  try {
    const accessToken = await getFirebaseAccessToken(env);
    const pendingPaymentUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/pending_payments/${order.id}`;
    const pendingData = {
      fields: {
        orderId: { stringValue: order.id },
        userId: { stringValue: userId },
        email: { stringValue: email || "" },
        planKey: { stringValue: planKey },
        tier: { stringValue: plan.tier },
        amountPaise: { integerValue: String(finalAmount) },
        status: { stringValue: "created" },
        appliedCoupon: { stringValue: appliedCoupon || "NONE" },
        createdAt: { timestampValue: (/* @__PURE__ */ new Date()).toISOString() }
      }
    };
    await fetch(pendingPaymentUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify(pendingData)
    });
  } catch (e) {
    console.warn("Could not write pending payment to Firestore:", e.message);
  }
  return jsonResponse({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: env.RAZORPAY_KEY_ID,
    planKey,
    planName: plan.name,
    tier: plan.tier,
    appliedCoupon,
    discountAmount
  }, 200, request);
}
__name(handleCreateOrder, "handleCreateOrder");
async function handleVerifyPayment(request, env) {
  const body = await request.json().catch(() => null);
  if (!body)
    return errorResponse("Invalid JSON payload", 400, request);
  const {
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature,
    userId,
    planKey
  } = body;
  if (!razorpayPaymentId || !userId) {
    return errorResponse("Missing razorpayPaymentId or userId", 400, request);
  }
  if (razorpayOrderId && razorpaySignature && env.RAZORPAY_KEY_SECRET) {
    const dataToSign = `${razorpayOrderId}|${razorpayPaymentId}`;
    const isValidSignature = await verifyRazorpaySignature(dataToSign, razorpaySignature, env.RAZORPAY_KEY_SECRET);
    if (!isValidSignature) {
      console.error("Signature mismatch for direct verification");
      return errorResponse("Cryptographic signature verification failed", 400, request);
    }
  }
  const rzpAuth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
  const paymentRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpayPaymentId}`, {
    headers: { "Authorization": `Basic ${rzpAuth}` }
  });
  if (!paymentRes.ok) {
    const err = await paymentRes.text();
    console.error("Razorpay payment fetch error:", err);
    return errorResponse("Could not verify payment with Razorpay", 500, request);
  }
  const payment = await paymentRes.json();
  if (payment.status === "authorized") {
    const capRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpayPaymentId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${rzpAuth}`
      },
      body: JSON.stringify({ amount: payment.amount, currency: payment.currency || "INR" })
    });
    if (!capRes.ok) {
      return errorResponse("Failed to capture authorized payment", 500, request);
    }
  } else if (payment.status !== "captured") {
    return errorResponse(`Payment is not in captured state (Current: ${payment.status})`, 400, request);
  }
  const resolvedPlanKey = planKey || payment.notes?.planKey || "season";
  const plan = PLANS[resolvedPlanKey] || PLANS["season"];
  const tier = payment.notes?.tier || plan.tier || "pro_vip";
  try {
    const accessToken = await getFirebaseAccessToken(env);
    const expiry = /* @__PURE__ */ new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    const updateFields = {
      fields: {
        isPremium: { booleanValue: true },
        tierType: { stringValue: tier },
        // 'pro_vip' or 'pro_plus'
        premiumTier: { stringValue: tier },
        premiumPlan: { stringValue: resolvedPlanKey },
        paymentStatus: { stringValue: "completed" },
        paymentId: { stringValue: payment.id },
        orderId: { stringValue: razorpayOrderId || payment.order_id || "" },
        amountPaise: { integerValue: String(payment.amount) },
        premiumActivatedAt: { timestampValue: (/* @__PURE__ */ new Date()).toISOString() },
        premiumExpiry: { timestampValue: expiry.toISOString() }
      }
    };
    const updateMask = Object.keys(updateFields.fields).map((f) => `updateMask.fieldPaths=${f}`).join("&");
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}?${updateMask}`;
    const fsRes = await fetch(firestoreUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify(updateFields)
    });
    if (!fsRes.ok) {
      const errText = await fsRes.text();
      console.error("Firestore user update failed:", errText);
      return errorResponse("Failed to activate Pro tier in Firestore", 500, request);
    }
    const paymentAudit = {
      fields: {
        userId: { stringValue: userId },
        email: { stringValue: payment.email || "" },
        contact: { stringValue: payment.contact || "" },
        planKey: { stringValue: resolvedPlanKey },
        tier: { stringValue: tier },
        razorpayPaymentId: { stringValue: payment.id },
        razorpayOrderId: { stringValue: razorpayOrderId || payment.order_id || "" },
        amount: { integerValue: String(payment.amount) },
        currency: { stringValue: payment.currency || "INR" },
        status: { stringValue: "captured" },
        method: { stringValue: payment.method || "unknown" },
        verifiedVia: { stringValue: "direct_verify" },
        createdAt: { timestampValue: (/* @__PURE__ */ new Date()).toISOString() }
      }
    };
    const auditUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/payments/${payment.id}`;
    await fetch(auditUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify(paymentAudit)
    });
    console.log(`\u2705 [Payment Verified]: User ${userId} upgraded to ${tier} (${resolvedPlanKey})`);
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
    console.error("Verify-payment Firestore error:", err);
    return errorResponse(`Failed to activate subscription: ${err.message}`, 500, request);
  }
}
__name(handleVerifyPayment, "handleVerifyPayment");
async function handleWebhook(request, env) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) {
    return errorResponse("Missing x-razorpay-signature header", 400, request);
  }
  const isValid = await verifyRazorpaySignature(rawBody, signature, env.RAZORPAY_WEBHOOK_SECRET);
  if (!isValid) {
    console.error("Webhook signature mismatch");
    return errorResponse("Invalid webhook signature", 400, request);
  }
  const event = JSON.parse(rawBody);
  if (event.event !== "payment.captured" && event.event !== "order.paid") {
    return jsonResponse({ status: "ignored", event: event.event }, 200, request);
  }
  const payment = event.payload?.payment?.entity;
  if (!payment) {
    return errorResponse("No payment entity in webhook payload", 400, request);
  }
  const userId = payment.notes?.userId;
  const planKey = payment.notes?.planKey || "season";
  const tier = payment.notes?.tier || PLANS[planKey]?.tier || "pro_vip";
  if (!userId) {
    console.warn("Webhook received payment with no userId in notes:", payment.id);
    return jsonResponse({ status: "no_user_id_in_notes", paymentId: payment.id }, 200, request);
  }
  try {
    const accessToken = await getFirebaseAccessToken(env);
    const expiry = /* @__PURE__ */ new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    const firestoreData = {
      fields: {
        isPremium: { booleanValue: true },
        tierType: { stringValue: tier },
        premiumTier: { stringValue: tier },
        premiumPlan: { stringValue: planKey },
        paymentStatus: { stringValue: "completed" },
        paymentId: { stringValue: payment.id },
        amountPaise: { integerValue: String(payment.amount) },
        premiumActivatedAt: { timestampValue: (/* @__PURE__ */ new Date()).toISOString() },
        premiumExpiry: { timestampValue: expiry.toISOString() }
      }
    };
    const updateMask = Object.keys(firestoreData.fields).map((f) => `updateMask.fieldPaths=${f}`).join("&");
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}?${updateMask}`;
    await fetch(firestoreUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify(firestoreData)
    });
    const paymentAudit = {
      fields: {
        userId: { stringValue: userId },
        email: { stringValue: payment.email || "" },
        contact: { stringValue: payment.contact || "" },
        planKey: { stringValue: planKey },
        tier: { stringValue: tier },
        razorpayPaymentId: { stringValue: payment.id },
        razorpayOrderId: { stringValue: payment.order_id || "" },
        amount: { integerValue: String(payment.amount) },
        currency: { stringValue: payment.currency || "INR" },
        status: { stringValue: "captured" },
        method: { stringValue: payment.method || "unknown" },
        verifiedVia: { stringValue: "webhook" },
        createdAt: { timestampValue: (/* @__PURE__ */ new Date()).toISOString() }
      }
    };
    const auditUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/payments/${payment.id}`;
    await fetch(auditUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify(paymentAudit)
    });
    console.log(`\u2705 [Webhook Fulfilled]: User ${userId} updated to ${tier}`);
    return jsonResponse({ status: "ok", userId, tier, paymentId: payment.id }, 200, request);
  } catch (err) {
    console.error("Webhook handling error:", err);
    return errorResponse(`Webhook failure: ${err.message}`, 500, request);
  }
}
__name(handleWebhook, "handleWebhook");
async function handleValidateCoupon(request, env) {
  const body = await request.json().catch(() => null);
  if (!body || !body.code)
    return errorResponse("Missing coupon code", 400, request);
  const code = body.code.trim().toUpperCase();
  const planKey = body.planKey || "season";
  const plan = PLANS[planKey] || PLANS["season"];
  const coupon = COUPONS[code];
  if (!coupon) {
    return jsonResponse({ valid: false, message: "Invalid or expired coupon code" }, 200, request);
  }
  if (plan.amount < coupon.minAmountPaise) {
    return jsonResponse({
      valid: false,
      message: `Coupon '${code}' requires a minimum pass value of \u20B9${coupon.minAmountPaise / 100}`
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
    finalAmountPaise,
    finalAmountRupees: finalAmountPaise / 100
  }, 200, request);
}
__name(handleValidateCoupon, "handleValidateCoupon");
async function verifyRazorpaySignature(payload, signature, secret) {
  if (!secret || !signature)
    return false;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
    if (expectedSignature.length !== signature.length)
      return false;
    let mismatch = 0;
    for (let i = 0; i < expectedSignature.length; i++) {
      mismatch |= expectedSignature.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return mismatch === 0;
  } catch (e) {
    console.error("Signature verification error:", e);
    return false;
  }
}
__name(verifyRazorpaySignature, "verifyRazorpaySignature");
var cachedAccessToken = null;
var tokenExpiry = 0;
async function getFirebaseAccessToken(env) {
  const now = Math.floor(Date.now() / 1e3);
  if (cachedAccessToken && now < tokenExpiry - 60) {
    return cachedAccessToken;
  }
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: env.FIREBASE_SERVICE_ACCOUNT_EMAIL,
    sub: env.FIREBASE_SERVICE_ACCOUNT_EMAIL,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/datastore"
  };
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedClaims = base64urlEncode(JSON.stringify(claims));
  const unsignedJwt = `${encodedHeader}.${encodedClaims}`;
  const pemKey = atob(env.FIREBASE_SERVICE_ACCOUNT_KEY);
  const binaryKey = pemToBinary(pemKey);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedJwt)
  );
  const signature = base64urlEncode(signatureBuffer);
  const jwt = `${unsignedJwt}.${signature}`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
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
__name(getFirebaseAccessToken, "getFirebaseAccessToken");
async function verifyFirebaseToken(idToken, env) {
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3)
      return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    const now = Date.now() / 1e3;
    if (payload.exp && payload.exp < now)
      return null;
    if (payload.aud !== env.FIREBASE_PROJECT_ID && payload.iss !== `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`) {
      return null;
    }
    return payload.sub || payload.user_id;
  } catch (e) {
    return null;
  }
}
__name(verifyFirebaseToken, "verifyFirebaseToken");
function base64urlEncode(input) {
  const data = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(base64urlEncode, "base64urlEncode");
function pemToBinary(pem) {
  const lines = pem.split("\n").filter((l) => !l.startsWith("-----"));
  const base64 = lines.join("");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
__name(pemToBinary, "pemToBinary");
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
