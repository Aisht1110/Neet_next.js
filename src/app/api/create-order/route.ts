import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    worker: 'https://neet-payment-worker.upmatripathi500.workers.dev',
  });
}
