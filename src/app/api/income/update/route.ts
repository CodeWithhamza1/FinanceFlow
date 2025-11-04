import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, unauthorizedResponse } from '@/lib/middleware';
import { logActivity, LogActions } from '@/lib/logger';

// POST route for updating income (alternative to PUT on dynamic routes)
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const { id, amount, description, date } = await request.json();

    // Validate required fields
    if (!id || !amount || !date) {
      return NextResponse.json(
        { error: 'ID, amount, and date are required' },
        { status: 400 }
      );
    }

    const incomeId = parseInt(id.toString());

    // Verify income belongs to user and get old values
    const existing = await query(
      'SELECT id, amount, description, date FROM income WHERE id = ? AND user_id = ?',
      [incomeId, auth.userId]
    ) as any[];

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Income entry not found' },
        { status: 404 }
      );
    }

    const oldIncome = existing[0];

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
      'UPDATE income SET amount = ?, description = ?, date = ? WHERE id = ? AND user_id = ?',
      [amount, description || null, dateToStore, incomeId, auth.userId]
    );

    // Log income update
    await logActivity(auth.userId, {
      action: LogActions.INCOME_UPDATE,
      entityType: 'income',
      entityId: incomeId.toString(),
      description: `Updated income entry: $${amount.toFixed(2)}${description ? ` - ${description}` : ''}`,
      metadata: {
        old: {
          amount: parseFloat(oldIncome.amount),
          description: oldIncome.description,
        },
        new: {
          amount,
          description: description || null,
          date,
        },
      },
    }, request);

    const updated = await query(
      'SELECT id, amount, description, date FROM income WHERE id = ?',
      [incomeId]
    ) as any[];

    return NextResponse.json({
      id: updated[0].id.toString(),
      amount: parseFloat(updated[0].amount),
      description: updated[0].description,
      date: new Date(updated[0].date),
    });
  } catch (error: any) {
    console.error('Update income error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

