import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

/**
 * Report a post (dead link, inappropriate content, etc.)
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: postId } = params;
    const { type, description } = await request.json();

    // Validate report type
    const validTypes = ['dead_link', 'inappropriate', 'spam', 'copyright', 'other'];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid report type' },
        { status: 400 }
      );
    }

    // Get user (optional - can report anonymously)
    const user = await getCurrentUser();

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, title: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user already reported this post (prevent spam)
    if (user) {
      const existingReport = await prisma.report.findFirst({
        where: {
          postId,
          userId: user.id,
          status: 'pending',
        },
      });

      if (existingReport) {
        return NextResponse.json(
          { error: 'You have already reported this post' },
          { status: 400 }
        );
      }
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        postId,
        userId: user?.id,
        type,
        description: description || null,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully',
      report: {
        id: report.id,
        type: report.type,
        createdAt: report.createdAt,
      },
    });
  } catch (error) {
    console.error('Report submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    );
  }
}
