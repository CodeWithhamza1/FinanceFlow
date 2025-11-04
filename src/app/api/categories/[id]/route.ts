import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, unauthorizedResponse } from '@/lib/middleware';

// PUT - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const { name, icon } = await request.json();
    // Next.js 15: params is always a Promise
    const { id } = await params;
    const categoryId = parseInt(id);

    // Verify category belongs to user
    const existing = await query(
      'SELECT id FROM categories WHERE id = ? AND user_id = ?',
      [categoryId, auth.userId]
    ) as any[];

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    await query(
      'UPDATE categories SET name = ?, icon = ? WHERE id = ? AND user_id = ?',
      [name, icon, categoryId, auth.userId]
    );

    return NextResponse.json({ id: categoryId.toString(), name, icon });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 409 }
      );
    }
    console.error('Update category error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete category
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
    const categoryId = parseInt(id);

    // Verify category belongs to user
    const existing = await query(
      'SELECT id FROM categories WHERE id = ? AND user_id = ?',
      [categoryId, auth.userId]
    ) as any[];

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    await query(
      'DELETE FROM categories WHERE id = ? AND user_id = ?',
      [categoryId, auth.userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

