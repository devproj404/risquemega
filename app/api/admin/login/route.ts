import { NextResponse } from 'next/server';
import { loginAdmin } from '@/lib/admin-auth';
import { z } from 'zod';

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { emailOrUsername, password } = validation.data;

    const result = await loginAdmin(emailOrUsername, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Login failed' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: 'Login successful',
      admin: result.admin,
    });
  } catch (error) {
    console.error('Admin login API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
