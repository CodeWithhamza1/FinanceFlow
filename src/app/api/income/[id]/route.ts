import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, unauthorizedResponse } from '@/lib/middleware';

// PUT - Update income entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const { amount, description, date } = await request.json();
    // Next.js 15: params is always a Promise
    const { id } = await params;
    const incomeId = parseInt(id);

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
      'UPDATE income SET amount = ?, description = ?, date = ? WHERE id = ? AND user_id = ?',
      [amount, description || null, new Date(date), incomeId, auth.userId]
    );

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
  } catch (error) {
    console.error('Update income error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete income entry
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
    const incomeId = parseInt(id);

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
  } catch (error) {
    console.error('Delete income error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

