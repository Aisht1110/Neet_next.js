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
 * token (best-effort) so the Worker can optionally verify the caller owns the
 * uid. Never blocks checkout: it times out after 2s and proceeds without a token
 * if one cannot be obtained quickly.
 */
async function workerHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const token = await Promise.race([
      getFirebaseIdToken(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
    ]);
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch {
    // Proceed without a token.
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
    const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(win.Razorpay || null));
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay Checkout SDK. Please check your internet connection.')));
      setTimeout(() => {
        if (win.Razorpay) resolve(win.Razorpay);
      }, 500);
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

export async function restorePassViaWorker(
  paymentId: string,
  user: { uid: string; email?: string | null }
): Promise<{ success: boolean; message: string; tier?: 'pro_vip' | 'pro_plus'; planKey?: 'basic' | 'season' }> {
  try {
    const res = await fetch(`${WORKER_BASE_URL}/api/restore-pass`, {
      method: 'POST',
      headers: await workerHeaders(),
      body: JSON.stringify({
        paymentId: paymentId.trim(),
        userId: user.uid,
        email: user.email || ''
      })
    });

    const data = await res.json().catch(() => null);
    if (res.ok && data?.success) {
      const passName = data.tier === 'pro_plus' ? 'Basic Counselling Pass (⚡ PRO Plus)' : 'Season Counselling Pass (👑 PRO VIP)';
      return {
        success: true,
        message: `${passName} successfully verified and activated!`,
        tier: data.tier,
        planKey: data.planKey
      };
    }
    return {
      success: false,
      message: data?.message || 'Could not restore pass. Please check your Payment ID from your email or SMS.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Could not reach restore server. Please check your internet connection.'
    };
  }
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
    let orderError = '';
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
      if (res.ok) {
        orderData = (await res.json()) as OrderDataResponse;
      } else {
        const errBody = await res.json().catch(() => null) as { message?: string } | null;
        orderError = errBody?.message || `Server error (${res.status})`;
      }
    } catch (e) {
      orderError = 'Could not reach the payment server. Please check your connection.';
      console.warn('Worker create-order failed:', e);
    }

    if (!orderData?.orderId || !orderData?.keyId) {
      throw new Error(orderError || 'Unable to start secure checkout. Please try again in a moment.');
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
          // Save payment ID to localStorage immediately before network verification
          // so the user can use "Restore Pass" if the connection drops mid-verification.
          if (typeof window !== 'undefined') {
            try {
              const existingHistory = JSON.parse(localStorage.getItem('neet_payment_history') || '[]');
              existingHistory.unshift({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                planKey,
                timestamp: new Date().toISOString(),
              });
              localStorage.setItem('neet_payment_history', JSON.stringify(existingHistory.slice(0, 10)));
              localStorage.setItem('neet_last_payment_id', response.razorpay_payment_id);
            } catch (_) { /* localStorage may be blocked in private mode */ }
          }

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

          // Read body first so we can surface the server's error message
          let verifyData: { verified?: boolean; tier?: 'pro_plus' | 'pro_vip'; planKey?: 'basic' | 'season'; message?: string } | null = null;
          try {
            verifyData = await verifyRes.json();
          } catch (_) { /* non-JSON fallback */ }

          if (!verifyRes.ok) {
            // Surface the server error message if available
            const serverMsg = verifyData?.message;
            const payId = response.razorpay_payment_id;
            throw new Error(
              serverMsg
                ? `Payment verification failed: ${serverMsg} (Payment ID: ${payId})`
                : `Payment verification failed (HTTP ${verifyRes.status}). If money was debited, contact support with Payment ID: ${payId}`
            );
          }

          if (!verifyData?.verified || !verifyData.tier) {
            throw new Error(`Pass activation failed — server did not confirm the tier. Contact support with Payment ID: ${response.razorpay_payment_id}`);
          }

          const verified = verifyData as { verified: boolean; tier: 'pro_plus' | 'pro_vip'; planKey?: 'basic' | 'season' };

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
