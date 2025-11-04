import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, unauthorizedResponse } from '@/lib/middleware';

// GET - Get user profile
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const users = await query(
      'SELECT id, email, display_name, photo_url, currency FROM users WHERE id = ?',
      [auth.userId]
    ) as any[];

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[0];
    return NextResponse.json({
      id: user.id.toString(),
      email: user.email,
      displayName: user.display_name,
      photoURL: user.photo_url,
      currency: user.currency,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const { displayName, currency, photoURL } = await request.json();

    const updateFields: string[] = [];
    const params: any[] = [];

    if (displayName !== undefined) {
      updateFields.push('display_name = ?');
      params.push(displayName);
    }

    if (currency !== undefined) {
      updateFields.push('currency = ?');
      params.push(currency);
    }

    if (photoURL !== undefined) {
      updateFields.push('photo_url = ?');
      params.push(photoURL);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    params.push(auth.userId);
    await query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    const users = await query(
      'SELECT id, email, display_name, photo_url, currency FROM users WHERE id = ?',
      [auth.userId]
    ) as any[];

    const user = users[0];
    return NextResponse.json({
      id: user.id.toString(),
      email: user.email,
      displayName: user.display_name,
      photoURL: user.photo_url,
      currency: user.currency,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

