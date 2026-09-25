import { NextRequest, NextResponse } from 'next/server';

const WORKER_URL = process.env.PAYMENT_WORKER_URL || process.env.NEXT_PUBLIC_PAYMENT_WORKER_URL || 'https://neet-payment-worker.upmatripathi500.workers.dev';

const PLANS_DATA: Record<string, { price: number; amountPaise: number }> = {
  basic: { price: 149, amountPaise: 14900 },
  season: { price: 299, amountPaise: 29900 },
  upgrade: { price: 150, amountPaise: 15000 },
};

const LOCAL_COUPONS: Record<string, number> = {
  NEETPRO: 50,
  NEETPASS: 50,
  NEET2026: 50,
  EARLYBIRD: 50,
  MEDICO50: 50,
  DOCTOR100: 100,
  NEET50: 50,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, planKey = 'season' } = body;

    if (!code || !code.trim()) {
      return NextResponse.json({ valid: false, message: 'Please enter a coupon code' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    // 1. Try forwarding to Cloudflare Worker
    try {
      const workerEndpoint = `${WORKER_URL.replace(/\/+$/, '')}/api/validate-coupon`;
      const response = await fetch(workerEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode, planKey }),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      console.warn('Worker coupon validation fallback to server-side rules:', e);
    }

    // 2. Fallback to server-side coupon catalogue
    if (LOCAL_COUPONS[cleanCode]) {
      const discount = LOCAL_COUPONS[cleanCode];
      const plan = PLANS_DATA[planKey] || PLANS_DATA.season;
      return NextResponse.json({
        valid: true,
        code: cleanCode,
        discountRupees: discount,
        discountPaise: discount * 100,
        finalAmountRupees: Math.max(1, plan.price - discount),
        finalAmountPaise: Math.max(100, plan.amountPaise - discount * 100),
        message: `₹${discount} Discount Applied!`,
      });
    }

    return NextResponse.json({ valid: false, message: 'Invalid or expired coupon code' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ valid: false, message: error.message || 'Coupon check error' }, { status: 500 });
  }
}
