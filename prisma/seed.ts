import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed act categories
  const acts = [
    { name: 'Juggling', description: 'Ball, club, ring, and object manipulation' },
    { name: 'Aerial Silks', description: 'Fabric-based aerial acrobatics' },
    { name: 'Trapeze', description: 'Static and flying trapeze performances' },
    { name: 'Acrobatics', description: 'Tumbling, partner acro, and ground-based skills' },
    { name: 'Clowning', description: 'Physical comedy and character work' },
    { name: 'Unicycle', description: 'Unicycle riding and tricks' },
    { name: 'Tightwire', description: 'Wire walking and balance acts' },
    { name: 'Contortion', description: 'Flexibility and body bending' },
    { name: 'Fire', description: 'Fire manipulation and performance' },
    { name: 'Group Acts', description: 'Ensemble and group performances' },
  ];

  console.log('Seeding act categories...');

  for (const act of acts) {
    await prisma.act.upsert({
      where: { name: act.name },
      update: {},
      create: act,
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
