import { NextResponse } from 'next/server';

const PLANS = {
  basic: {
    key: 'basic',
    name: 'Basic Pass 2026',
    price: 149,
    amountPaise: 14900,
    tier: 'pro_plus',
    tierLabel: '⚡ PRO Plus Member',
    badgeColor: '#38bdf8',
    features: ['Unlimited AI Predictions', '750+ Medical Colleges', 'Rural Bonds, Fees & Stipends', 'Support Desk Access'],
  },
  season: {
    key: 'season',
    name: 'Season Pass 2026',
    price: 299,
    amountPaise: 29900,
    tier: 'pro_vip',
    tierLabel: '👑 PRO VIP Member',
    badgeColor: '#fbbf24',
    features: ['Everything in Basic', 'Personal Wishlist', 'Smart Choice Filling Sequencer', 'AI Cutoff Auto-Sort', 'MCC Choice Export', 'VIP Glowing Badge'],
  },
  upgrade: {
    key: 'upgrade',
    name: 'Upgrade to Season Pass',
    price: 150,
    amountPaise: 15000,
    tier: 'pro_vip',
    tierLabel: '👑 PRO VIP Member',
    badgeColor: '#fbbf24',
    features: ['Unlock Wishlist', 'Smart Choice Filling Sequencer', 'AI Cutoff Auto-Sort', 'VIP Glowing Badge'],
  },
};

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    plans: PLANS,
    currency: 'INR',
    workerConnected: true,
  });
}
