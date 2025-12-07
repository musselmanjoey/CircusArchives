import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check for the old video ID
  const oldVideo = await prisma.video.findFirst({
    where: { youtubeId: 'a4bsT_Tr90w' },
  });

  console.log('Old video (a4bsT_Tr90w):', oldVideo ? 'STILL EXISTS!' : 'Not found (good)');

  // List all video IDs
  const allVideos = await prisma.video.findMany({
    select: { youtubeId: true, title: true },
  });

  console.log('\nAll videos in DB:');
  allVideos.forEach((v) => console.log(`  ${v.youtubeId}: ${v.title}`));

  await prisma.$disconnect();
}

main();
