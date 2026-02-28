import { NextRequest, NextResponse } from 'next/server';
import { ingestAllSources } from '@/lib/rss/fetcher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Check authorization
  const cronSecret = request.headers.get('x-vercel-cron-secret');
  const authHeader = request.headers.get('authorization');

  const expectedSecret = process.env.CRON_SECRET;

  if (cronSecret !== expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await ingestAllSources();

    return NextResponse.json(result, {
      status: result.success ? 200 : 207, // 207 = Multi-Status
    });
  } catch (error) {
    console.error('Ingestion failed:', error);

    return NextResponse.json(
      {
        error: 'Ingestion failed',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// Allow GET for testing
export async function GET(request: NextRequest) {
  return POST(request);
}
