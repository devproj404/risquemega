import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get suggested posts based on engagement (views + likes)
    // Mix of hot and recent content
    const posts = await prisma.post.findMany({
      where: {
        published: true,
      },
      include: {
        _count: {
          select: {
            likes: true,
            saves: true,
          },
        },
      },
      orderBy: [
        { views: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 50, // Get more posts to randomize from
    });

    // Score posts based on engagement
    const scoredPosts = posts.map((post) => {
      const viewScore = post.views * 1;
      const likeScore = post._count.likes * 10;
      const saveScore = post._count.saves * 5;
      const recencyScore = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24); // days old
      const recencyBonus = Math.max(0, 30 - recencyScore) * 2; // Boost recent posts

      return {
        post,
        score: viewScore + likeScore + saveScore + recencyBonus,
      };
    });

    // Sort by score and add some randomness
    const topPosts = scoredPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, 30) // Take top 30
      .sort(() => Math.random() - 0.5) // Shuffle
      .slice(0, 18) // Take 18 random from top 30
      .map((item) => item.post);

    return NextResponse.json({ posts: topPosts });
  } catch (error) {
    console.error('Error fetching suggested posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggested posts' },
      { status: 500 }
    );
  }
}
