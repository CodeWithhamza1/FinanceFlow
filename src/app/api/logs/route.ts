import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, unauthorizedResponse } from '@/lib/middleware';
import { logActivity, LogActions } from '@/lib/logger';

// POST - Create a log entry (for client-side logging)
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const { action, description, metadata } = await request.json();

    if (!action || !description) {
      return NextResponse.json(
        { error: 'Action and description are required' },
        { status: 400 }
      );
    }

    await logActivity(auth.userId, {
      action,
      description,
      metadata,
    }, request);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Create log error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Fetch user's activity logs with pagination
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const action = searchParams.get('action');

    const offset = (page - 1) * limit;

    // Build query conditions
    let conditions = ['user_id = ?'];
    const params: any[] = [auth.userId];

    if (dateFrom) {
      conditions.push('DATE(created_at) >= ?');
      params.push(dateFrom);
    }

    if (dateTo) {
      conditions.push('DATE(created_at) <= ?');
      params.push(dateTo);
    }

    if (action) {
      conditions.push('action = ?');
      params.push(action);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM activity_logs ${whereClause}`,
      params
    ) as any[];

    const total = countResult[0]?.total || 0;

    // Auto-cleanup old logs (runs periodically to avoid loading database)
    // In production, set up a cron job to call /api/logs/cleanup daily
    try {
      // Run cleanup check occasionally (about 1% of requests)
      // This ensures cleanup happens regularly without impacting every request
      const shouldCleanup = Math.random() < 0.01; // 1% chance per request
      if (shouldCleanup) {
        const cleanupResult = await query(
          'DELETE FROM activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)'
        ) as any;
        if (cleanupResult.affectedRows > 0) {
          console.log(`Auto-cleanup: Deleted ${cleanupResult.affectedRows} old log entries`);
        }
      }
    } catch (cleanupError) {
      // Don't fail the request if cleanup fails
      console.error('Auto cleanup failed:', cleanupError);
    }

    // Get logs
    const logs = await query(
      `SELECT id, action, entity_type, entity_id, description, metadata, ip_address, user_agent, created_at 
       FROM activity_logs 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    ) as any[];

    return NextResponse.json({
      logs: logs.map(log => ({
        id: log.id.toString(),
        action: log.action,
        entityType: log.entity_type,
        entityId: log.entity_id,
        description: log.description,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        createdAt: new Date(log.created_at).toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error('Get logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
