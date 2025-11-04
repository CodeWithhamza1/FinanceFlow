import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, unauthorizedResponse } from '@/lib/middleware';

// GET - Fetch user's categories
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const categories = await query(
      'SELECT id, name, icon FROM categories WHERE user_id = ? ORDER BY name',
      [auth.userId]
    ) as any[];

    return NextResponse.json(
      categories.map(cat => ({
        id: cat.id.toString(),
        name: cat.name,
        icon: cat.icon,
      }))
    );
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const { name, icon } = await request.json();

    if (!name || !icon) {
      return NextResponse.json(
        { error: 'Name and icon are required' },
        { status: 400 }
      );
    }

    const result = await query(
      'INSERT INTO categories (user_id, name, icon) VALUES (?, ?, ?)',
      [auth.userId, name, icon]
    ) as any;

    return NextResponse.json(
      {
        id: result.insertId.toString(),
        name,
        icon,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 409 }
      );
    }
    console.error('Create category error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

