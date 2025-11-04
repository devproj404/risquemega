import { NextResponse } from 'next/server';
import { logoutAdmin } from '@/lib/admin-auth';

export async function POST() {
  try {
    await logoutAdmin();

    return NextResponse.json({
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Admin logout API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
