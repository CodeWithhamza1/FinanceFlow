import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, unauthorizedResponse } from '@/lib/middleware';
import { logActivity, LogActions } from '@/lib/logger';

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

    // Verify category belongs to user and get old values
    const existing = await query(
      'SELECT id, name, icon FROM categories WHERE id = ? AND user_id = ?',
      [categoryId, auth.userId]
    ) as any[];

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const oldCategory = existing[0];

    await query(
      'UPDATE categories SET name = ?, icon = ? WHERE id = ? AND user_id = ?',
      [name, icon, categoryId, auth.userId]
    );

    // Log category update
    await logActivity(auth.userId, {
      action: LogActions.CATEGORY_UPDATE,
      entityType: 'category',
      entityId: categoryId.toString(),
      description: `Updated category: ${name} (${icon})`,
      metadata: {
        old: {
          name: oldCategory.name,
          icon: oldCategory.icon,
        },
        new: {
          name,
          icon,
        },
      },
    }, request);

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

    // Verify category belongs to user and get details
    const existing = await query(
      'SELECT id, name, icon FROM categories WHERE id = ? AND user_id = ?',
      [categoryId, auth.userId]
    ) as any[];

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const category = existing[0];

    await query(
      'DELETE FROM categories WHERE id = ? AND user_id = ?',
      [categoryId, auth.userId]
    );

    // Log category deletion
    await logActivity(auth.userId, {
      action: LogActions.CATEGORY_DELETE,
      entityType: 'category',
      entityId: categoryId.toString(),
      description: `Deleted category: ${category.name} (${category.icon})`,
      metadata: {
        name: category.name,
        icon: category.icon,
      },
    }, request);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

