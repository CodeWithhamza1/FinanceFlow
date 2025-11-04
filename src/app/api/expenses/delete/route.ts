import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, unauthorizedResponse } from '@/lib/middleware';

// POST route for deleting expenses (alternative to DELETE on dynamic routes)
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
        { error: 'Expense ID is required' },
        { status: 400 }
      );
    }

    const expenseId = parseInt(id.toString());
    
    // Check if ID is valid
    if (isNaN(expenseId)) {
      return NextResponse.json(
        { error: 'Invalid expense ID' },
        { status: 400 }
      );
    }

    // Verify expense belongs to user
    const existing = await query(
      'SELECT id FROM expenses WHERE id = ? AND user_id = ?',
      [expenseId, auth.userId]
    ) as any[];

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    await query(
      'DELETE FROM expenses WHERE id = ? AND user_id = ?',
      [expenseId, auth.userId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete expense error:', error);
    const errorMessage = error?.message || 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

