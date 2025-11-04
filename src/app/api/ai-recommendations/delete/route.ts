import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, unauthorizedResponse } from '@/lib/middleware';
import { logActivity, LogActions } from '@/lib/logger';

// POST - Delete an AI recommendation
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Recommendation ID is required' },
        { status: 400 }
      );
    }

    const recommendationId = parseInt(id);

    if (isNaN(recommendationId)) {
      return NextResponse.json(
        { error: 'Invalid recommendation ID' },
        { status: 400 }
      );
    }

    // Verify recommendation belongs to user and get details
    const existing = await query(
      'SELECT id, title FROM ai_recommendations WHERE id = ? AND user_id = ?',
      [recommendationId, auth.userId]
    ) as any[];

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Recommendation not found' },
        { status: 404 }
      );
    }

    const recommendation = existing[0];

    await query(
      'DELETE FROM ai_recommendations WHERE id = ? AND user_id = ?',
      [recommendationId, auth.userId]
    );

    // Log AI recommendation deletion
    await logActivity(auth.userId, {
      action: LogActions.AI_RECOMMENDATION_DELETE,
      entityType: 'ai_recommendation',
      entityId: recommendationId.toString(),
      description: `Deleted AI recommendation${recommendation.title ? `: ${recommendation.title}` : ''}`,
      metadata: {
        title: recommendation.title || null,
      },
    }, request);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete AI recommendation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

