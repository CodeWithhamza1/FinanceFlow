import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, unauthorizedResponse } from '@/lib/middleware';

// GET - Fetch user's saved AI recommendations
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const recommendations = await query(
      'SELECT id, title, recommendation, income, savings_goal, expenses_summary, created_at FROM ai_recommendations WHERE user_id = ? ORDER BY created_at DESC',
      [auth.userId]
    ) as any[];

    return NextResponse.json({
      recommendations: recommendations.map(rec => ({
        id: rec.id.toString(),
        title: rec.title,
        recommendation: rec.recommendation,
        income: parseFloat(rec.income || 0),
        savingsGoal: parseFloat(rec.savings_goal || 0),
        expensesSummary: rec.expenses_summary ? JSON.parse(rec.expenses_summary) : {},
        createdAt: new Date(rec.created_at),
      })),
    });
  } catch (error) {
    console.error('Get AI recommendations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Save a new AI recommendation
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const { title, recommendation, income, savingsGoal, expensesSummary } = await request.json();

    if (!recommendation) {
      return NextResponse.json(
        { error: 'Recommendation is required' },
        { status: 400 }
      );
    }

    const result = await query(
      'INSERT INTO ai_recommendations (user_id, title, recommendation, income, savings_goal, expenses_summary) VALUES (?, ?, ?, ?, ?, ?)',
      [
        auth.userId,
        title || null,
        recommendation,
        income || null,
        savingsGoal || null,
        expensesSummary ? JSON.stringify(expensesSummary) : null,
      ]
    ) as any;

    const inserted = await query(
      'SELECT id, title, recommendation, income, savings_goal, expenses_summary, created_at FROM ai_recommendations WHERE id = ?',
      [result.insertId]
    ) as any[];

    return NextResponse.json(
      {
        id: inserted[0].id.toString(),
        title: inserted[0].title,
        recommendation: inserted[0].recommendation,
        income: parseFloat(inserted[0].income || 0),
        savingsGoal: parseFloat(inserted[0].savings_goal || 0),
        expensesSummary: inserted[0].expenses_summary ? JSON.parse(inserted[0].expenses_summary) : {},
        createdAt: new Date(inserted[0].created_at),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Save AI recommendation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

