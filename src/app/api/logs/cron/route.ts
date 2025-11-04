import { NextRequest, NextResponse } from 'next/server';
import { deleteOldLogs } from '@/lib/logger';

/**
 * Cron endpoint for cleaning up old logs
 * This should be called daily by a cron job or scheduled task
 * Example cron job: 0 2 * * * curl https://yourapp.com/api/logs/cron
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Add a secret token check for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const deletedCount = await deleteOldLogs();

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} log entries older than 30 days`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron cleanup logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

