import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, unauthorizedResponse } from '@/lib/middleware';

// GET - Fetch user's income entries
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM format

    let sql = 'SELECT id, amount, description, date FROM income WHERE user_id = ?';
    const params: any[] = [auth.userId];

    if (month) {
      sql += ' AND DATE_FORMAT(date, "%Y-%m") = ?';
      params.push(month);
    }

    sql += ' ORDER BY date DESC';

    const income = await query(sql, params) as any[];

    // Calculate total monthly income
    const totalIncomeResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE user_id = ? ${month ? 'AND DATE_FORMAT(date, "%Y-%m") = ?' : ''}`,
      month ? [auth.userId, month] : [auth.userId]
    ) as any[];

    return NextResponse.json({
      entries: income.map(entry => ({
        id: entry.id.toString(),
        amount: parseFloat(entry.amount),
        description: entry.description,
        date: new Date(entry.date),
      })),
      total: parseFloat(totalIncomeResult[0]?.total || 0),
    });
  } catch (error) {
    console.error('Get income error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create income entry
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const { amount, description, date } = await request.json();

    if (!amount || !date) {
      return NextResponse.json(
        { error: 'Amount and date are required' },
        { status: 400 }
      );
    }

    const result = await query(
      'INSERT INTO income (user_id, amount, description, date) VALUES (?, ?, ?, ?)',
      [auth.userId, amount, description || null, new Date(date)]
    ) as any;

    const inserted = await query(
      'SELECT id, amount, description, date FROM income WHERE id = ?',
      [result.insertId]
    ) as any[];

    return NextResponse.json(
      {
        id: inserted[0].id.toString(),
        amount: parseFloat(inserted[0].amount),
        description: inserted[0].description,
        date: new Date(inserted[0].date),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create income error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

