import { query } from './db';
import { NextRequest } from 'next/server';
import { LogActions } from './log-actions';

// Re-export LogActions for convenience
export { LogActions };

export interface LogEntry {
  action: string;
  entityType?: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Extract request info for logging
 */
export function getRequestInfo(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null;
  const userAgent = request.headers.get('user-agent') || null;
  
  return {
    ip,
    headers: {
      'user-agent': userAgent,
    },
  };
}

/**
 * Logs an activity to the database
 */
export async function logActivity(
  userId: number,
  logEntry: LogEntry,
  request?: NextRequest | { ip?: string; headers?: { 'user-agent'?: string } }
): Promise<void> {
  try {
    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    if (request) {
      if ('headers' in request && request.headers) {
        // NextRequest object
        const info = getRequestInfo(request as NextRequest);
        ipAddress = info.ip || logEntry.ipAddress || null;
        userAgent = info.headers['user-agent'] || logEntry.userAgent || null;
      } else {
        // Plain object with ip/headers
        ipAddress = (request as any).ip || logEntry.ipAddress || null;
        userAgent = (request as any).headers?.['user-agent'] || logEntry.userAgent || null;
      }
    }

    await query(
      `INSERT INTO activity_logs 
       (user_id, action, entity_type, entity_id, description, metadata, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        logEntry.action,
        logEntry.entityType || null,
        logEntry.entityId || null,
        logEntry.description,
        logEntry.metadata ? JSON.stringify(logEntry.metadata) : null,
        ipAddress,
        userAgent,
      ]
    );
  } catch (error) {
    // Log errors but don't throw - logging should never break the application
    console.error('Failed to log activity:', error);
  }
}


/**
 * Delete logs older than 30 days
 */
export async function deleteOldLogs(): Promise<number> {
  try {
    const result = await query(
      'DELETE FROM activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)'
    ) as any;
    return result.affectedRows || 0;
  } catch (error) {
    console.error('Failed to delete old logs:', error);
    return 0;
  }
}

