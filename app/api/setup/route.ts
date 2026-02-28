import { NextRequest, NextResponse } from 'next/server';
import { ingestAllSources } from '@/lib/rss/fetcher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

/**
 * One-time setup endpoint to populate the database
 * Remove this file after first use for security
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Starting initial ingestion...');

    const result = await ingestAllSources();

    console.log('✅ Initial ingestion complete!');

    return NextResponse.json({
      message: 'Initial ingestion complete! You can now delete this endpoint.',
      ...result,
    });
  } catch (error) {
    console.error('❌ Setup failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Setup failed',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
