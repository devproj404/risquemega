import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create Super Admin
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const superAdmin = await prisma.admin.upsert({
    where: { email: 'admin@risquemega.com' },
    update: {},
    create: {
      username: 'superadmin',
      email: 'admin@risquemega.com',
      password: hashedPassword,
      name: 'Super Administrator',
      role: 'SUPER_ADMIN',
    },
  });

  console.log('✅ Super Admin created:', {
    username: superAdmin.username,
    email: superAdmin.email,
    role: superAdmin.role,
  });

  // Create Regular Admin
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.admin.upsert({
    where: { email: 'moderator@risquemega.com' },
    update: {},
    create: {
      username: 'moderator',
      email: 'moderator@risquemega.com',
      password: adminPassword,
      name: 'Content Moderator',
      role: 'MODERATOR',
    },
  });

  console.log('✅ Moderator created:', {
    username: admin.username,
    email: admin.email,
    role: admin.role,
  });

  // Create default categories
  const categories = [
    {
      name: 'STRAIGHT',
      slug: 'straight',
      description: 'Straight adult content',
      imageUrl: null,
    },
    {
      name: 'GAY',
      slug: 'gay',
      description: 'Gay adult content',
      imageUrl: null,
    },
    {
      name: 'TRANS',
      slug: 'trans',
      description: 'Trans adult content',
      imageUrl: null,
    },
    {
      name: 'HENTAI',
      slug: 'hentai',
      description: 'Hentai and anime content',
      imageUrl: null,
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  console.log('✅ Categories created:', categories.map(c => c.name).join(', '));

  console.log('🎉 Seed completed successfully!');
  console.log('\n📋 Admin Credentials:');
  console.log('Super Admin - Email: admin@risquemega.com | Password: admin123');
  console.log('Moderator - Email: moderator@risquemega.com | Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
