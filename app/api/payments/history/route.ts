import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Get payment transaction history for current user
 */
export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get all payments for the current user
    const payments = await prisma.payment.findMany({
      where: {
        userId: currentUser.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        paymentMethod: true,
        description: true,
        transactionId: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Format metadata for frontend
    const formattedPayments = payments.map((payment) => {
      const metadata = payment.metadata as any;
      return {
        ...payment,
        paymentType: metadata?.paymentType || 'UNKNOWN',
        testMode: metadata?.testMode || false,
        trackId: metadata?.trackId || null,
        payLink: metadata?.payLink || null,
      };
    });

    return NextResponse.json({ payments: formattedPayments });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}
