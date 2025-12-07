/**
 * Prod Video Import Script
 *
 * Usage:
 *   PROD_DATABASE_URL="postgresql://..." npx tsx scripts/prod-import.ts
 *
 * Or on Windows:
 *   set PROD_DATABASE_URL=postgresql://... && npx tsx scripts/prod-import.ts
 */

import { PrismaClient, ShowType } from '@prisma/client';

// Use PROD_DATABASE_URL env var for Railway prod
const PROD_URL = process.env.PROD_DATABASE_URL;

if (!PROD_URL) {
  console.error('Error: PROD_DATABASE_URL environment variable is required');
  console.error('Usage: PROD_DATABASE_URL="postgresql://..." npx tsx scripts/prod-import.ts');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: { url: PROD_URL },
  },
});

// Video manifest - edit this for each import run
interface VideoManifest {
  youtubeId: string;
  title: string;
  year: number | null;
  showType: ShowType | null;
  acts: string[];
}

const VIDEOS_TO_IMPORT: VideoManifest[] = [
  { youtubeId: 'SD9nudcqimo', title: 'Juggling 2016', year: 2016, showType: 'HOME', acts: ['Juggling'] },
  { youtubeId: 'eaKqUDLdSzs', title: 'Double/Triple Trapeze', year: null, showType: null, acts: ['Double Trapeze', 'Triple Trapeze'] },
  { youtubeId: 'Tw3AQ46_UEs', title: 'Russian Bar Callaway 2017', year: 2017, showType: 'CALLAWAY', acts: ['Russian Bar'] },
  { youtubeId: 'w3UPRTzXt2k', title: 'Juggling Callaway 2017', year: 2017, showType: 'CALLAWAY', acts: ['Juggling'] },
  { youtubeId: 'rJ7oYgkBLIo', title: 'Quartet Callaway 2017', year: 2017, showType: 'CALLAWAY', acts: ['Quartet Adagio'] },
  { youtubeId: 'zUBt_0ANtWc', title: 'Juggling 2017', year: 2017, showType: 'HOME', acts: ['Juggling'] },
  { youtubeId: '_-f7tSjyEIc', title: 'Quartet 2017', year: 2017, showType: 'HOME', acts: ['Quartet Adagio'] },
  { youtubeId: 'V13_TJWA6BY', title: 'Russian Bar 2018', year: 2018, showType: 'HOME', acts: ['Russian Bar'] },
  { youtubeId: '7LTr5PSvvCY', title: 'Quartet 2018', year: 2018, showType: 'HOME', acts: ['Quartet Adagio'] },
  { youtubeId: 'NHGNAHjAtv8', title: 'Teeterboard 2018', year: 2018, showType: 'HOME', acts: ['Teeterboard'] },
];

const CLEAR_EXISTING = true; // Set to true to wipe existing videos first

async function main() {
  console.log('Connecting to database...');

  // Show current state
  const currentCount = await prisma.video.count();
  console.log(`Current video count: ${currentCount}`);

  if (CLEAR_EXISTING) {
    console.log('\n--- Clearing existing data ---');

    // Delete in order respecting foreign keys
    const votes = await prisma.vote.deleteMany({});
    console.log(`Deleted ${votes.count} votes`);

    const comments = await prisma.comment.deleteMany({});
    console.log(`Deleted ${comments.count} comments`);

    const performers = await prisma.videoPerformer.deleteMany({});
    console.log(`Deleted ${performers.count} video-performer links`);

    const videoActs = await prisma.videoAct.deleteMany({});
    console.log(`Deleted ${videoActs.count} video-act links`);

    const videos = await prisma.video.deleteMany({});
    console.log(`Deleted ${videos.count} videos`);
  }

  console.log('\n--- Creating/finding acts ---');

  // Collect all unique act names
  const allActNames = new Set<string>();
  for (const video of VIDEOS_TO_IMPORT) {
    for (const actName of video.acts) {
      allActNames.add(actName);
    }
  }

  // Create or find all acts
  const actMap = new Map<string, string>(); // name -> id
  for (const actName of allActNames) {
    let act = await prisma.act.findUnique({
      where: { name: actName },
    });

    if (!act) {
      act = await prisma.act.create({
        data: { name: actName },
      });
      console.log(`Created act: ${actName}`);
    } else {
      console.log(`Found existing act: ${actName}`);
    }

    actMap.set(actName, act.id);
  }

  console.log('\n--- Importing videos ---');

  let created = 0;
  let skipped = 0;

  for (const manifest of VIDEOS_TO_IMPORT) {
    // Check for duplicate
    const existing = await prisma.video.findFirst({
      where: { youtubeId: manifest.youtubeId },
    });

    if (existing) {
      console.log(`SKIP: ${manifest.title} (already exists)`);
      skipped++;
      continue;
    }

    // Handle null year/showType - use defaults
    const year = manifest.year ?? 2000;
    const showType = manifest.showType ?? 'HOME';
    const youtubeUrl = `https://www.youtube.com/watch?v=${manifest.youtubeId}`;

    // Get act IDs
    const actIds = manifest.acts
      .map((name) => actMap.get(name))
      .filter((id): id is string => id !== undefined);

    // Create video with act associations
    await prisma.video.create({
      data: {
        youtubeUrl,
        youtubeId: manifest.youtubeId,
        title: manifest.title,
        year,
        showType,
        acts: {
          create: actIds.map((actId) => ({ actId })),
        },
      },
    });

    console.log(`CREATED: ${manifest.title}`);
    created++;
  }

  console.log('\n--- Summary ---');
  console.log(`Videos created: ${created}`);
  console.log(`Videos skipped: ${skipped}`);

  const finalCount = await prisma.video.count();
  console.log(`Final video count: ${finalCount}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error:', e);
  prisma.$disconnect();
  process.exit(1);
});
