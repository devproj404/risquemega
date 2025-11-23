const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPayments() {
  console.log('\n=== CHECKING VIP PAYMENTS ===\n');

  // Check all VIP payments
  const vipPayments = await prisma.payment.findMany({
    where: {
      OR: [
        { description: { contains: 'VIP' } },
        { metadata: { path: ['paymentType'], equals: 'VIP_UPGRADE' } }
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
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

  console.log(`Found ${vipPayments.length} VIP payment(s):\n`);

  vipPayments.forEach((payment, index) => {
    console.log(`${index + 1}. Payment ID: ${payment.id}`);
    console.log(`   User: ${payment.user.username} (${payment.user.email})`);
    console.log(`   Amount: $${payment.amount} ${payment.currency}`);
    console.log(`   Status: ${payment.status}`);
    console.log(`   Created: ${payment.createdAt}`);
    console.log(`   User VIP Status: ${payment.user.isVip ? 'YES ✓' : 'NO ✗'}`);
    console.log(`   Transaction ID: ${payment.transactionId || 'N/A'}`);

    if (payment.metadata) {
      const meta = payment.metadata;
      console.log(`   Webhook Status: ${meta.webhookStatus || 'Not received'}`);
      console.log(`   Pay Currency: ${meta.payCurrency || 'N/A'}`);
      console.log(`   Network: ${meta.network || 'N/A'}`);
      if (meta.webhookReceivedAt) {
        console.log(`   Webhook Received: ${meta.webhookReceivedAt}`);
      }
    }
    console.log('');
  });

  // Check VIP users
  const vipUsers = await prisma.user.findMany({
    where: { isVip: true },
    select: {
      id: true,
      username: true,
      email: true,
      isVip: true,
      vipUntil: true,
      createdAt: true,
    }
  });

  console.log(`\n=== VIP USERS (${vipUsers.length} total) ===\n`);
  vipUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.username} (${user.email})`);
    console.log(`   VIP Until: ${user.vipUntil || 'Lifetime'}`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkPayments().catch(console.error);
