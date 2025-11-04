import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const actress = await prisma.actress.findUnique({
      where: { slug },
    });

    if (!actress) {
      return NextResponse.json(
        { error: 'Actress not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ actress });
  } catch (error) {
    console.error('Error fetching actress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch actress' },
      { status: 500 }
    );
  }
}
