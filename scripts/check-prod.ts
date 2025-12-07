import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.video.count();
  console.log(`Total videos: ${count}`);

  const videos = await prisma.video.findMany({
    select: { title: true, youtubeId: true },
    orderBy: { createdAt: 'desc' },
    take: 15,
  });

  console.log('\nRecent videos:');
  videos.forEach((v) => console.log(`- ${v.youtubeId}: ${v.title}`));

  await prisma.$disconnect();
}

main();
