const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPayment() {
  const paymentId = 'f336b3a3-e368-4da8-83b4-0fdd29b2780d';

  console.log('\n=== CHECKING PAYMENT ===\n');
  console.log('Payment ID:', paymentId);

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          isVip: true,
          vipUntil: true,
        }
      }
    }
  });

  if (!payment) {
    console.log('❌ Payment not found');
    await prisma.$disconnect();
    return;
  }

  console.log('\n--- PAYMENT INFO ---');
  console.log('Status:', payment.status);
  console.log('Amount:', payment.amount, payment.currency);
  console.log('Created:', payment.createdAt);
  console.log('Transaction ID:', payment.transactionId || 'N/A');

  console.log('\n--- USER INFO ---');
  console.log('Username:', payment.user.username);
  console.log('Email:', payment.user.email);
  console.log('Is VIP:', payment.user.isVip ? 'YES ✓' : 'NO ✗');
  console.log('VIP Until:', payment.user.vipUntil || 'Lifetime/None');

  console.log('\n--- METADATA ---');
  if (payment.metadata) {
    console.log(JSON.stringify(payment.metadata, null, 2));
  } else {
    console.log('No metadata');
  }

  await prisma.$disconnect();
}

checkPayment().catch(console.error);
