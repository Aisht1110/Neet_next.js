'use client';

export interface PlanDetails {
  key: 'basic' | 'season' | 'upgrade';
  name: string;
  price: number;
  amountPaise: number;
  tier: 'pro_plus' | 'pro_vip';
  tierLabel: string;
  badgeColor: string;
  desc: string;
}

export const PLANS: Record<string, PlanDetails> = {
  basic: {
    key: 'basic',
    name: 'Basic Counselling Pass',
    price: 149,
    amountPaise: 14900,
    tier: 'pro_plus',
    tierLabel: '⚡ PRO Plus Member',
    badgeColor: '#38bdf8',
    desc: 'Unlimited AI Predictions, 750+ Colleges, All Filters, Rural Bonds, Fees, Stipends & Support. (Wishlist & Choice Filling locked).',
  },
  season: {
    key: 'season',
    name: 'Season Counselling Pass',
    price: 299,
    amountPaise: 29900,
    tier: 'pro_vip',
    tierLabel: '👑 PRO VIP Member',
    badgeColor: '#fbbf24',
    desc: 'Everything in Basic + Personal Wishlist + Smart Choice Filling Sequencer + AI Auto-Sort by Cutoff + MCC Print Export + VIP Badge.',
  },
  upgrade: {
    key: 'upgrade',
    name: 'Upgrade to Season Pass',
    price: 150,
    amountPaise: 15000,
    tier: 'pro_vip',
    tierLabel: '👑 PRO VIP Member',
    badgeColor: '#fbbf24',
    desc: 'Upgrade from Basic Pass to Season Pass to unlock Wishlist, Smart Choice Sequencer and AI Auto-Sort.',
  },
};

const WORKER_BASE_URL = process.env.NEXT_PUBLIC_PAYMENT_WORKER_URL || "https://neet-payment-worker.upmatripathi500.workers.dev";
const FALLBACK_RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY || "";

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

interface RazorpayErrorResponse {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
  };
}

interface OrderDataResponse {
  keyId?: string;
  amount?: number;
  orderId?: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (resp: RazorpayErrorResponse) => void) => void;
}

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

interface RazorpayWindow extends Window {
  Razorpay?: RazorpayConstructor;
}

export function loadRazorpaySDK(): Promise<RazorpayConstructor | null> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve(null);
    const win = window as unknown as RazorpayWindow;
    if (win.Razorpay) {
      resolve(win.Razorpay);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(win.Razorpay || null);
    script.onerror = () => reject(new Error('Failed to load Razorpay Checkout SDK. Please check your internet connection.'));
    document.head.appendChild(script);
  });
}

export interface CouponResult {
  valid: boolean;
  code?: string;
  discountRupees?: number;
  finalAmountRupees?: number;
  finalAmountPaise?: number;
  message?: string;
}

export async function validateCoupon(code: string, planKey: 'basic' | 'season' = 'season'): Promise<CouponResult> {
  if (!code || !code.trim()) {
    return { valid: false, message: 'Please enter a coupon code' };
  }

  const clean = code.trim().toUpperCase();

  // 1. Try first-party Next.js API route proxy first
  try {
    const res = await fetch('/api/validate-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: clean, planKey }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // try direct worker
  }

  // 2. Direct Cloudflare Worker fallback
  try {
    const res = await fetch(`${WORKER_BASE_URL}/api/validate-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: clean, planKey }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Worker coupon validation fallback to local rules:', err);
  }

  // 3. Local fallback coupon rules
  const localCoupons: Record<string, number> = {
    'NEETPRO': 50,
    'NEETPASS': 50,
    'NEET2026': 50,
    'EARLYBIRD': 50,
    'MEDICO50': 50,
    'DOCTOR100': 100,
    'NEET50': 50,
  };

  if (localCoupons[clean]) {
    const discount = localCoupons[clean];
    const plan = PLANS[planKey] || PLANS.season;
    return {
      valid: true,
      code: clean,
      discountRupees: discount,
      finalAmountRupees: Math.max(1, plan.price - discount),
      finalAmountPaise: Math.max(100, plan.amountPaise - (discount * 100)),
      message: `₹${discount} Discount Applied!`,
    };
  }

  return { valid: false, message: 'Invalid or expired coupon code' };
}

export interface CheckoutOptions {
  planKey: 'basic' | 'season' | 'upgrade';
  couponCode?: string;
  user: { uid: string; email: string | null; displayName: string | null } | null;
  onSuccess: (paymentId: string, planKey: 'basic' | 'season' | 'upgrade') => void;
  onDismiss?: () => void;
  onError?: (err: Error) => void;
}

export async function initiateCheckout({
  planKey,
  couponCode = '',
  user,
  onSuccess,
  onDismiss,
  onError,
}: CheckoutOptions) {
  if (!user || !user.uid) {
    if (typeof window !== 'undefined') {
      window.location.href = `/account?plan=${planKey}`;
    }
    return;
  }

  const plan = PLANS[planKey] || PLANS.season;

  try {
    const Razorpay = await loadRazorpaySDK();
    if (!Razorpay) throw new Error('Razorpay Checkout SDK could not be initialized');

    // Create order via first-party API route or direct Cloudflare Worker
    let orderData: OrderDataResponse | null = null;
    
    // Attempt 1: Next.js API route proxy
    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planKey,
          userId: user.uid,
          email: user.email || '',
          couponCode: couponCode || '',
        }),
      });
      if (res.ok) orderData = (await res.json()) as OrderDataResponse;
    } catch (e) {
      // try direct worker
    }

    // Attempt 2: Direct Cloudflare Worker
    if (!orderData?.orderId) {
      try {
        const res = await fetch(`${WORKER_BASE_URL}/api/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planKey,
            userId: user.uid,
            email: user.email || '',
            couponCode: couponCode || '',
          }),
        });
        if (res.ok) orderData = (await res.json()) as OrderDataResponse;
      } catch (e) {
        console.warn('Worker direct create-order fallback to client mode:', e);
      }
    }

    let finalAmountPaise = plan.amountPaise;
    if (couponCode) {
      const couponCheck = await validateCoupon(couponCode, planKey === 'upgrade' ? 'season' : planKey);
      if (couponCheck.valid && couponCheck.finalAmountPaise) {
        finalAmountPaise = couponCheck.finalAmountPaise;
      }
    }

    const rzpOptions = {
      key: orderData?.keyId || FALLBACK_RAZORPAY_KEY,
      amount: orderData?.amount || finalAmountPaise,
      currency: 'INR',
      name: 'NEET Counselling',
      description: plan.name,
      image: 'https://neetcounselling.in/favicon.ico',
      order_id: orderData?.orderId || undefined,
      prefill: {
        name: user.displayName || user.email?.split('@')[0] || '',
        email: user.email || '',
      },
      notes: {
        userId: user.uid,
        planKey: planKey,
        tier: plan.tier,
        couponCode: couponCode || 'NONE',
      },
      theme: {
        color: plan.tier === 'pro_vip' ? '#f59e0b' : '#00e5aa',
        backdrop_color: 'rgba(7, 7, 16, 0.95)',
      },
      modal: {
        ondismiss: function () {
          if (onDismiss) onDismiss();
        },
      },
      handler: async function (response: RazorpaySuccessResponse) {
        const paymentId = response.razorpay_payment_id || `rzp_mock_${Date.now()}`;

        // Verify with Worker (via API route or direct Worker)
        try {
          const verifyPayload = {
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
            userId: user.uid,
            planKey,
          };

          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(verifyPayload),
          });

          if (!verifyRes.ok) {
            // direct worker fallback
            await fetch(`${WORKER_BASE_URL}/api/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(verifyPayload),
            });
          }
        } catch (e) {
          console.warn('Worker verification ping note:', e);
        }

        // Instant tier activation in global window.Auth if available
        if (typeof window !== 'undefined' && (window as any).Auth) {
          const winAuth = (window as any).Auth;
          if (typeof winAuth.activateVerifiedTier === 'function') {
            await winAuth.activateVerifiedTier(plan.tier, paymentId);
          }
        }

        onSuccess(paymentId, planKey);
      },
    };

    const rzp = new Razorpay(rzpOptions as Record<string, unknown>);
    rzp.on('payment.failed', function (errResp: RazorpayErrorResponse) {
      console.error('Payment error:', errResp);
      if (onError) onError(new Error(errResp?.error?.description || 'Payment could not be completed'));
    });
    rzp.open();
  } catch (err: unknown) {
    console.error('Checkout error:', err);
    if (onError) onError(err instanceof Error ? err : new Error(String(err)));
  }
}
