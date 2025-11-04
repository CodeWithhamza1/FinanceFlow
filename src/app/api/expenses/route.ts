import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, unauthorizedResponse } from '@/lib/middleware';

// GET - Fetch user's expenses
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');

    let sql = 'SELECT id, user_id as userId, description, amount, category, date, created_at as createdAt FROM expenses WHERE user_id = ? ORDER BY date DESC';
    const params: any[] = [auth.userId];

    if (limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit));
    }

    const expenses = await query(sql, params) as any[];

    return NextResponse.json(
      expenses.map(expense => {
        // Handle date conversion - MySQL returns dates in various formats
        let expenseDate: Date;
        if (expense.date instanceof Date) {
          expenseDate = expense.date;
        } else if (typeof expense.date === 'string') {
          expenseDate = new Date(expense.date);
        } else {
          expenseDate = new Date(expense.date);
        }

        return {
          id: expense.id.toString(),
          userId: expense.userId.toString(),
          description: expense.description,
          amount: parseFloat(expense.amount),
          category: expense.category,
          date: expenseDate.toISOString(), // Send as ISO string, will be parsed on client
          createdAt: expense.createdAt ? (new Date(expense.createdAt)).toISOString() : null,
        };
      })
    );
  } catch (error) {
    console.error('Get expenses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new expense
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const { description, amount, category, date } = await request.json();

    if (!description || amount === undefined || !category || !date) {
      return NextResponse.json(
        { error: 'Description, amount, category, and date are required' },
        { status: 400 }
      );
    }

    const result = await query(
      'INSERT INTO expenses (user_id, description, amount, category, date) VALUES (?, ?, ?, ?, ?)',
      [auth.userId, description, amount, category, new Date(date)]
    ) as any;

    const insertedExpense = await query(
      'SELECT id, user_id as userId, description, amount, category, date, created_at as createdAt FROM expenses WHERE id = ?',
      [result.insertId]
    ) as any[];

    return NextResponse.json(
      {
        id: insertedExpense[0].id.toString(),
        userId: insertedExpense[0].userId.toString(),
        description: insertedExpense[0].description,
        amount: parseFloat(insertedExpense[0].amount),
        category: insertedExpense[0].category,
        date: new Date(insertedExpense[0].date),
        createdAt: insertedExpense[0].createdAt ? new Date(insertedExpense[0].createdAt) : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create expense error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

