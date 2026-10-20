'use client';

import { getFirebaseIdToken } from '@/lib/firebase/firebase';

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

const WORKER_BASE_URL = process.env.NEXT_PUBLIC_PAYMENT_WORKER_URL || 'https://neet-payment-worker.upmatripathi500.workers.dev';
const FALLBACK_RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY || '';

/**
 * Builds JSON request headers for the payment Worker, attaching the Firebase ID
 * token so the Worker can verify the caller owns the uid being upgraded.
 */
async function workerHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const token = await getFirebaseIdToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch {
    // Proceed without a token; the Worker will reject if it requires one.
  }
  return headers;
}

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

/**
 * Coupon validation is authoritative only on the payment Worker. The client
 * never decides discount amounts — it merely displays what the server returns.
 * If the Worker is unreachable we fail closed (invalid) so a client can never
 * fabricate a discount.
 */
export async function validateCoupon(code: string, planKey: 'basic' | 'season' = 'season'): Promise<CouponResult> {
  if (!code || !code.trim()) {
    return { valid: false, message: 'Please enter a coupon code' };
  }

  try {
    const res = await fetch(`${WORKER_BASE_URL}/api/validate-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim().toUpperCase(), planKey }),
    });
    if (res.ok) {
      return (await res.json()) as CouponResult;
    }
    return { valid: false, message: 'Coupon could not be verified. Please try again.' };
  } catch {
    return { valid: false, message: 'Coupon service unavailable. Please try again later.' };
  }
}

export interface CheckoutSuccessPayload {
  paymentId: string;
  planKey: 'basic' | 'season' | 'upgrade';
  tier: 'pro_plus' | 'pro_vip';
}

export interface CheckoutOptions {
  planKey: 'basic' | 'season' | 'upgrade';
  couponCode?: string;
  user: { uid: string; email: string | null; displayName: string | null } | null;
  onSuccess: (payload: CheckoutSuccessPayload) => void;
  onDismiss?: () => void;
  onError?: (err: Error) => void;
}

/**
 * Opens the Razorpay checkout and, on success, asks the payment Worker to
 * verify the payment server-side. Entitlement is granted ONLY from the
 * verification response — never from a client-side payment id or localStorage.
 */
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

    // Create order via the payment Worker (authoritative amount is computed there).
    let orderData: OrderDataResponse | null = null;
    try {
      const res = await fetch(`${WORKER_BASE_URL}/api/create-order`, {
        method: 'POST',
        headers: await workerHeaders(),
        body: JSON.stringify({
          planKey,
          userId: user.uid,
          email: user.email || '',
          couponCode: couponCode || '',
        }),
      });
      if (res.ok) orderData = (await res.json()) as OrderDataResponse;
    } catch (e) {
      console.warn('Worker create-order failed:', e);
    }

    if (!orderData?.orderId || !orderData?.keyId) {
      throw new Error('Unable to start secure checkout. Please try again in a moment.');
    }

    const rzpOptions = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: 'INR',
      name: 'NEET Counselling',
      description: plan.name,
      image: 'https://neet.counsellor4u.in/favicon.png',
      order_id: orderData.orderId,
      prefill: {
        name: user.displayName || user.email?.split('@')[0] || '',
        email: user.email || '',
      },
      notes: {
        userId: user.uid,
        planKey: planKey,
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
        try {
          // Verify server-side. The Worker checks the Razorpay signature and
          // writes the entitlement; the client only mirrors the verified result.
          const verifyRes = await fetch(`${WORKER_BASE_URL}/api/verify-payment`, {
            method: 'POST',
            headers: await workerHeaders(),
            body: JSON.stringify({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              userId: user.uid,
              planKey,
            }),
          });

          if (!verifyRes.ok) {
            throw new Error('Payment verification failed. If money was debited, contact support with your payment ID.');
          }

          const verified = (await verifyRes.json()) as {
            verified?: boolean;
            tier?: 'pro_plus' | 'pro_vip';
            planKey?: 'basic' | 'season';
          };

          if (!verified?.verified || !verified.tier) {
            throw new Error('Payment could not be verified. If money was debited, contact support with your payment ID.');
          }

          onSuccess({
            paymentId: response.razorpay_payment_id,
            planKey,
            tier: verified.tier,
          });
        } catch (verifyErr) {
          if (onError) {
            onError(verifyErr instanceof Error ? verifyErr : new Error(String(verifyErr)));
          }
        }
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
