import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, unauthorizedResponse } from '@/lib/middleware';

// DELETE - Delete a saved AI recommendation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const recommendationId = parseInt(id);

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

