import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    console.log('\n=== /api/user/me called ===');
    console.log('Headers:', {
      cookie: request.headers.get('cookie'),
      userAgent: request.headers.get('user-agent'),
    });

    const user = await getCurrentUser();

    if (!user) {
      console.log('❌ No user found - returning null');
      return NextResponse.json({ user: null });
    }

    console.log('✅ User found:', user.username, '- VIP:', user.isVip);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        website: user.website,
        isVerified: user.isVerified,
        isVip: user.isVip,
        vipUntil: user.vipUntil,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching current user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
