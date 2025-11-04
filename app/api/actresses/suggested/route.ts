import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Get suggested actresses/models
 * Algorithm: Random selection from all actresses
 */
export async function GET() {
  try {
    // Get all actresses
    const actresses = await prisma.actress.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        bio: true,
      },
      take: 50, // Get 50 actresses
    });

    // Shuffle to randomize
    const shuffled = actresses.sort(() => Math.random() - 0.5);

    // Return 12 random actresses
    const suggested = shuffled.slice(0, 12);

    return NextResponse.json({ actresses: suggested });
  } catch (error) {
    console.error('Error fetching suggested actresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggested actresses' },
      { status: 500 }
    );
  }
}
