import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, unauthorizedResponse } from '@/lib/middleware';

// POST route for deleting income (alternative to DELETE on dynamic routes)
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const { id } = await request.json();

    // Validate ID
    if (!id) {
      return NextResponse.json(
        { error: 'Income ID is required' },
        { status: 400 }
      );
    }

    const incomeId = parseInt(id.toString());
    
    // Check if ID is valid
    if (isNaN(incomeId)) {
      return NextResponse.json(
        { error: 'Invalid income ID' },
        { status: 400 }
      );
    }

    // Verify income belongs to user
    const existing = await query(
      'SELECT id FROM income WHERE id = ? AND user_id = ?',
      [incomeId, auth.userId]
    ) as any[];

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Income entry not found' },
        { status: 404 }
      );
    }

    await query(
      'DELETE FROM income WHERE id = ? AND user_id = ?',
      [incomeId, auth.userId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete income error:', error);
    const errorMessage = error?.message || 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

