import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateToken } from '@/lib/auth';
import { defaultCategories, initialBudgets } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const { email, displayName, photoURL, providerId } = await request.json();

    if (!email || !providerId) {
      return NextResponse.json(
        { error: 'Email and provider ID are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    let users = await query(
      'SELECT id, email, display_name, photo_url, currency FROM users WHERE email = ? AND provider = ? AND provider_id = ?',
      [email, 'google', providerId]
    ) as any[];

    let userId: number;
    let isNewUser = false;

    if (users.length === 0) {
      // Check if email exists with different provider
      const existingUsers = await query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      ) as any[];

      if (existingUsers.length > 0) {
        return NextResponse.json(
          { error: 'Email already registered with different authentication method' },
          { status: 409 }
        );
      }

      // Create new user
      const result = await query(
        'INSERT INTO users (email, display_name, photo_url, provider, provider_id, currency) VALUES (?, ?, ?, ?, ?, ?)',
        [email, displayName || null, photoURL || null, 'google', providerId, 'USD']
      ) as any;

      userId = result.insertId;
      isNewUser = true;

      // Create default categories
      for (const category of defaultCategories) {
        await query(
          'INSERT INTO categories (user_id, name, icon) VALUES (?, ?, ?)',
          [userId, category.name, category.icon]
        );
      }

      // Create initial budgets
      for (const budget of initialBudgets) {
        await query(
          'INSERT INTO budgets (user_id, category, amount) VALUES (?, ?, ?)',
          [userId, budget.category, budget.amount]
        );
      }
    } else {
      userId = users[0].id;
    }

    // Generate token
    const token = generateToken({
      userId,
      email,
    });

    const user = isNewUser
      ? { id: userId, email, displayName: displayName || null, photoURL: photoURL || null, currency: 'USD' }
      : users[0];

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        photoURL: user.photo_url,
        currency: user.currency,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

