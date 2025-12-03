import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed act categories - FSU Flying High Circus acts
  const acts = [
    { name: 'Flying Trapeze', description: 'Aerial trapeze with catches and releases' },
    { name: 'Juggling', description: 'Ball, club, ring, and object manipulation' },
    { name: 'Russian Bar', description: 'Acrobatic bar balancing with flyers' },
    { name: 'Teeterboard', description: 'Spring-loaded board for aerial launches' },
    { name: 'Quartet Adagio', description: 'Four-person partner balancing act' },
    { name: 'Skating', description: 'Roller skating performances' },
    { name: 'Bike for Five', description: 'Five-person bicycle act' },
    { name: 'Clowning', description: 'Physical comedy and character work' },
    { name: 'Jump Rope', description: 'Acrobatic jump rope routines' },
    { name: 'Hand Balancing', description: 'Hand stands and balance skills' },
    { name: 'Rolla', description: 'Rolla bolla balance board act' },
    { name: 'Slack Rope', description: 'Loose rope walking and tricks' },
    { name: 'Tight Wire', description: 'Wire walking and balance acts' },
    { name: 'Low Casting', description: 'Low aerial casting act' },
    { name: 'Triple Trapeze', description: 'Three-person trapeze act' },
    { name: 'Double Trapeze', description: 'Two-person trapeze act' },
    { name: 'Swinging Trapeze', description: 'Single swinging trapeze performance' },
    { name: 'Cloud Swing', description: 'Aerial swing apparatus' },
    { name: 'Chinese Pole', description: 'Vertical pole climbing and tricks' },
    { name: 'Web', description: 'Aerial rope climbing and spinning' },
    { name: 'Cradle', description: 'Aerial cradle catching act' },
    { name: 'Sky Pole', description: 'High aerial pole act' },
    { name: 'Unicycle', description: 'Unicycle riding and tricks' },
    { name: 'Trampoline', description: 'Trampoline acrobatics' },
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
