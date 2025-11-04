import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, unauthorizedResponse } from '@/lib/middleware';
import { deleteOldLogs } from '@/lib/logger';

// POST - Cleanup old logs (can be called by admin or scheduled task)
// Also runs automatically when logs API is accessed (checks once per hour)
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const deletedCount = await deleteOldLogs();

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} log entries older than 30 days`,
    });
  } catch (error) {
    console.error('Cleanup logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Check and cleanup old logs (can be called periodically)
export async function GET(request: NextRequest) {
  try {
    // Run cleanup automatically (no auth required for this endpoint if called by cron)
    // But we'll still check auth for security
    const auth = await authenticateRequest(request);
    
    const deletedCount = await deleteOldLogs();

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} log entries older than 30 days`,
    });
  } catch (error) {
    console.error('Auto cleanup logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

