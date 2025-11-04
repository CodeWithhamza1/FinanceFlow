import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, unauthorizedResponse } from '@/lib/middleware';

// Simple POST route for updating expenses (alternative to PUT)
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const { id, description, amount, category, date } = await request.json();

    // Validate required fields
    if (!id || !description || amount === undefined || !category || !date) {
      return NextResponse.json(
        { error: 'ID, description, amount, category, and date are required' },
        { status: 400 }
      );
    }

    const expenseId = parseInt(id.toString());

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

    // Handle date conversion
    let dateToStore: Date;
    if (typeof date === 'string') {
      dateToStore = new Date(date);
    } else if (date instanceof Date) {
      dateToStore = date;
    } else {
      dateToStore = new Date();
    }

    await query(
      'UPDATE expenses SET description = ?, amount = ?, category = ?, date = ? WHERE id = ? AND user_id = ?',
      [description, amount, category, dateToStore, expenseId, auth.userId]
    );

    const updated = await query(
      'SELECT id, user_id as userId, description, amount, category, date, created_at as createdAt FROM expenses WHERE id = ?',
      [expenseId]
    ) as any[];

    return NextResponse.json({
      id: updated[0].id.toString(),
      userId: updated[0].userId.toString(),
      description: updated[0].description,
      amount: parseFloat(updated[0].amount),
      category: updated[0].category,
      date: (new Date(updated[0].date)).toISOString(),
      createdAt: updated[0].createdAt ? (new Date(updated[0].createdAt)).toISOString() : null,
    });
  } catch (error) {
    console.error('Update expense error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

