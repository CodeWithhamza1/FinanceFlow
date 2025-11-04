import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, unauthorizedResponse } from '@/lib/middleware';
import { logActivity, LogActions } from '@/lib/logger';

// GET - Fetch user's budgets
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const budgets = await query(
      'SELECT category, amount FROM budgets WHERE user_id = ?',
      [auth.userId]
    ) as any[];

    return NextResponse.json(
      budgets.map(budget => ({
        category: budget.category,
        amount: parseFloat(budget.amount),
      }))
    );
  } catch (error) {
    console.error('Get budgets error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Set/Update budgets (upsert)
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const { budgets } = await request.json();

    if (!Array.isArray(budgets)) {
      return NextResponse.json(
        { error: 'Budgets must be an array' },
        { status: 400 }
      );
    }

    // Get old budgets for logging
    const oldBudgets = await query(
      'SELECT category, amount FROM budgets WHERE user_id = ?',
      [auth.userId]
    ) as any[];

    // Delete existing budgets
    await query('DELETE FROM budgets WHERE user_id = ?', [auth.userId]);

    // Insert new budgets
    for (const budget of budgets) {
      await query(
        'INSERT INTO budgets (user_id, category, amount) VALUES (?, ?, ?)',
        [auth.userId, budget.category, budget.amount]
      );
    }

    // Log budget update
    await logActivity(auth.userId, {
      action: LogActions.BUDGET_SET,
      entityType: 'budgets',
      description: `Updated budgets: ${budgets.length} categories set`,
      metadata: {
        oldBudgets: oldBudgets.map(b => ({ category: b.category, amount: parseFloat(b.amount) })),
        newBudgets: budgets,
        count: budgets.length,
      },
    }, request);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Set budgets error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

