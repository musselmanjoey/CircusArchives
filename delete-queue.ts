import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.uploadQueue.deleteMany({});
  console.log('Deleted', result.count, 'queue items');
  await prisma.$disconnect();
}

main();
