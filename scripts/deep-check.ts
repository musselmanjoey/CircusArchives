import { PrismaClient } from '@prisma/client';

// Override DATABASE_URL directly for Railway prod
const PROD_URL = 'postgresql://postgres:***REDACTED***@shinkansen.proxy.rlwy.net:16369/railway';

const prisma = new PrismaClient({
  datasources: {
    db: { url: PROD_URL },
  },
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('Using hardcoded PROD_URL');

  // Raw SQL query to bypass any ORM caching
  const videos = await prisma.$queryRaw`SELECT youtube_id, title FROM videos ORDER BY created_at DESC`;

  console.log('\nRaw SQL results:');
  console.log(videos);

  await prisma.$disconnect();
}

main();
