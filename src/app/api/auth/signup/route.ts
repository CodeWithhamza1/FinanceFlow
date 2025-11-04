import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';
import { defaultCategories, initialBudgets } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUsers = await query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as any[];

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = await query(
      'INSERT INTO users (email, password_hash, display_name, currency) VALUES (?, ?, ?, ?)',
      [email, passwordHash, displayName || null, 'USD']
    ) as any;

    const userId = result.insertId;

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

    // Generate token
    const token = generateToken({
      userId,
      email,
    });

    return NextResponse.json({
      token,
      user: {
        id: userId,
        email,
        displayName: displayName || null,
        photoURL: null,
        currency: 'USD',
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

