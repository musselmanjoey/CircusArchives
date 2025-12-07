import { PrismaClient } from '@prisma/client';

// Use PROD_DATABASE_URL env var for Railway prod
// Run with: PROD_DATABASE_URL="postgresql://..." npx tsx scripts/set-uploader.ts
const PROD_URL = process.env.PROD_DATABASE_URL;

if (!PROD_URL) {
  console.error('Error: PROD_DATABASE_URL environment variable is required');
  console.error('Usage: PROD_DATABASE_URL="postgresql://..." npx tsx scripts/set-uploader.ts');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: { url: PROD_URL },
  },
});

async function main() {
  // Find Joey Musselman
  const joey = await prisma.user.findFirst({
    where: {
      firstName: 'Joey',
      lastName: 'Musselman',
    },
  });

  if (!joey) {
    console.log('User Joey Musselman not found!');
    const users = await prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true },
    });
    console.log('Available users:', users);
    await prisma.$disconnect();
    return;
  }

  console.log(`Found user: ${joey.firstName} ${joey.lastName} (${joey.id})`);

  // Update all videos to have Joey as uploader
  const result = await prisma.video.updateMany({
    data: {
      uploaderId: joey.id,
    },
  });

  console.log(`Updated ${result.count} videos`);

  await prisma.$disconnect();
}

main();
