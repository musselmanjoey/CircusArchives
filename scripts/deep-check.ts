import { PrismaClient } from '@prisma/client';

// Use PROD_DATABASE_URL env var for Railway prod
// Run with: PROD_DATABASE_URL="postgresql://..." npx tsx scripts/deep-check.ts
const PROD_URL = process.env.PROD_DATABASE_URL;

if (!PROD_URL) {
  console.error('Error: PROD_DATABASE_URL environment variable is required');
  console.error('Usage: PROD_DATABASE_URL="postgresql://..." npx tsx scripts/deep-check.ts');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: { url: PROD_URL },
  },
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('Using PROD_DATABASE_URL from environment');

  // Raw SQL query to bypass any ORM caching
  const videos = await prisma.$queryRaw`SELECT youtube_id, title FROM videos ORDER BY created_at DESC`;

  console.log('\nRaw SQL results:');
  console.log(videos);

  await prisma.$disconnect();
}

main();
