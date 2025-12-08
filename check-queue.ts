import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const items = await prisma.uploadQueue.findMany();
  console.log(JSON.stringify(items, null, 2));
}

main()
  .finally(() => prisma.$disconnect());
