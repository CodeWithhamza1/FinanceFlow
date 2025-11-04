import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, unauthorizedResponse } from '@/lib/middleware';

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

    // Verify recommendation belongs to user
    const existing = await query(
      'SELECT id FROM ai_recommendations WHERE id = ? AND user_id = ?',
      [recommendationId, auth.userId]
    ) as any[];

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Recommendation not found' },
        { status: 404 }
      );
    }

    await query(
      'DELETE FROM ai_recommendations WHERE id = ? AND user_id = ?',
      [recommendationId, auth.userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete AI recommendation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

