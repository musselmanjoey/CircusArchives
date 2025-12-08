import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const action = process.argv[2];

  if (action === 'reset') {
    const result = await prisma.uploadQueue.updateMany({
      where: { status: 'FAILED' },
      data: { status: 'PENDING', errorMessage: null }
    });
    console.log(`Reset ${result.count} items to PENDING`);
  } else {
    const items = await prisma.uploadQueue.findMany();
    console.log(JSON.stringify(items, null, 2));
  }
}

main()
  .finally(() => prisma.$disconnect());
