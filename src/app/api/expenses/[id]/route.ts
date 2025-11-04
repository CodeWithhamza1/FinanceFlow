import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, unauthorizedResponse } from '@/lib/middleware';

// PUT - Update expense
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const { description, amount, category, date } = await request.json();
    // Next.js 15: params is always a Promise
    const { id } = await params;
    const expenseId = parseInt(id);

    // Validate required fields
    if (!description || amount === undefined || !category || !date) {
      return NextResponse.json(
        { error: 'Description, amount, category, and date are required' },
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

    // Handle date conversion
    let dateToStore: Date;
    if (date instanceof Date) {
      dateToStore = date;
    } else if (typeof date === 'string') {
      dateToStore = new Date(date);
    } else {
      dateToStore = new Date(date);
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
      date: new Date(updated[0].date),
      createdAt: updated[0].createdAt ? new Date(updated[0].createdAt) : null,
    });
  } catch (error) {
    console.error('Update expense error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    // Next.js 15: params is always a Promise
    const { id } = await params;
    
    // Validate ID
    if (!id) {
      return NextResponse.json(
        { error: 'Expense ID is required' },
        { status: 400 }
      );
    }

    const expenseId = parseInt(id);
    
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

