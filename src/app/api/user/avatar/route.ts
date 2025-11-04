import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest, unauthorizedResponse } from '@/lib/middleware';
import { logActivity, LogActions } from '@/lib/logger';

// POST - Upload profile picture
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return unauthorizedResponse();
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Convert file to base64 for storage
    // Resize image if it's too large to keep base64 size manageable
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Check if file is too large (base64 is ~33% larger than original)
    // For a 5MB file, base64 would be ~6.7MB, which is manageable
    // But for better performance, we'll keep the original file size limit
    
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;
    
    // Log the size for debugging (remove in production)
    console.log(`Uploading image: ${file.size} bytes, base64 length: ${base64.length}`);

    // Update user's photo URL
    await query(
      'UPDATE users SET photo_url = ? WHERE id = ?',
      [dataUrl, auth.userId]
    );
    
    // Verify the data was saved correctly by checking length
    const verifyUsers = await query(
      'SELECT LENGTH(photo_url) as url_length, photo_url FROM users WHERE id = ?',
      [auth.userId]
    ) as any[];
    
    if (verifyUsers.length > 0) {
      const savedLength = verifyUsers[0].url_length || 0;
      const originalLength = dataUrl.length;
      if (savedLength < originalLength) {
        console.error(`Warning: Data may have been truncated! Original: ${originalLength}, Saved: ${savedLength}`);
      }
    }

    // Log avatar upload
    await logActivity(auth.userId, {
      action: LogActions.AVATAR_UPLOAD,
      entityType: 'user',
      entityId: auth.userId.toString(),
      description: `Uploaded profile picture (${(file.size / 1024).toFixed(2)} KB)`,
      metadata: {
        fileSize: file.size,
        fileType: file.type,
        fileName: file.name,
      },
    }, request);

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
    console.error('Upload avatar error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

