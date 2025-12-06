/**
 * Script to clean up test users from the database.
 * Run with: npx ts-node scripts/cleanup-test-users.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test user patterns - names that are clearly from tests
const TEST_USER_PATTERNS = [
  // Exact matches from test files
  { firstName: 'Test', lastName: 'User' },
  { firstName: 'Session', lastName: 'Test' },
  { firstName: 'Refresh', lastName: 'Test' },
  { firstName: 'SignOut', lastName: 'Test' },
  { firstName: 'Redirect', lastName: 'Test' },
  { firstName: 'Delete', lastName: 'Tester' },
  { firstName: 'Other', lastName: 'User' },
  { firstName: 'Owner', lastName: 'Deleter' },
  { firstName: 'Commenter', lastName: 'Test' },
  { firstName: 'Editor', lastName: 'Test' },
  { firstName: 'User1', lastName: 'Test' },
  { firstName: 'User2', lastName: 'Test' },
  { firstName: 'Deleter', lastName: 'Test' },
  { firstName: 'Owner', lastName: 'Comment' },
  { firstName: 'Attacker', lastName: 'Test' },
  { firstName: 'Poster', lastName: 'Comment' },
  { firstName: 'EditUI', lastName: 'Test' },
  { firstName: 'DeleteUI', lastName: 'Test' },
  { firstName: 'Author', lastName: 'Comment' },
  { firstName: 'Viewer', lastName: 'Test' },
  { firstName: 'CancelEdit', lastName: 'Test' },
  { firstName: 'Display', lastName: 'Name' },
  { firstName: 'Update', lastName: 'Test' },
  { firstName: 'Submit', lastName: 'Tester' },
  { firstName: 'SearchTest', lastName: 'User' },
  { firstName: 'Existing', lastName: 'UserTest' },
  { firstName: 'Owner', lastName: 'User' },
  { firstName: 'EditAccess', lastName: 'Owner' },
  { firstName: 'EditOwner', lastName: 'One' },
  { firstName: 'EditOther', lastName: 'Two' },
  { firstName: 'GuestTest', lastName: 'Owner' },
  { firstName: 'Prefill', lastName: 'Test' },
  { firstName: 'SaveTest', lastName: 'User' },
  { firstName: 'CancelTest', lastName: 'User' },
  { firstName: 'ButtonOwner', lastName: 'Test' },
  { firstName: 'ButtonOwner', lastName: 'One' },
  { firstName: 'ButtonOther', lastName: 'Two' },
  { firstName: 'GuestButton', lastName: 'Test' },
  { firstName: 'DeleteBtn', lastName: 'Test' },
  { firstName: 'DeleteCancel', lastName: 'Test' },
  { firstName: 'Video', lastName: 'Submitter' },
  { firstName: 'Performer', lastName: 'Voter' },
  { firstName: 'Voter', lastName: 'One' },
  { firstName: 'PerformerVoter', lastName: 'Test' },
  { firstName: 'VoterModal', lastName: 'TestUser' },
  { firstName: 'PerformerBadge', lastName: 'Test' },
  { firstName: 'RankingsPerf', lastName: 'Test' },
];

// Patterns for dynamically named test users (with timestamps or test-like names)
const DYNAMIC_TEST_PATTERNS = [
  /^SwitchVote\d*$/,
  /^DiffActs\d*$/,
  /^MyVotes\d*$/,
  /^NoVotes\d*$/,
  /^RemoveVoteAPI\d*$/,
  /^Toggle\d*$/,
  /^SwitchUI\d*$/,
  /^RemoveVote\d*$/,
  /^Backdrop\d*$/,
  /^VoteCount\d*$/,
  /^Sorter\d*$/,
  /^TruncPerf\d*$/,
  /^BrandNew\d*$/,
  /^E2EPerformer\d*$/,
  /^E2E/,
  /^ClearTest$/,
  /^Callback$/,
  /^FilterUI\d*$/,
  /^FilterAPI$/,
  /^Filter$/,
  /^Edit$/,
  /^EditTest$/,
  /^Nav$/,
  /^NewPerf\d*$/,
  /^Performer$/,
  /^Removable\d*$/,
  /^Selectable\d*$/,
  /^ResponseTest$/,
  /^Return$/,
  /^Smoke$/,
];

async function main() {
  console.log('Starting test user cleanup...\n');

  // Find and delete exact match test users
  for (const pattern of TEST_USER_PATTERNS) {
    const users = await prisma.user.findMany({
      where: {
        firstName: pattern.firstName,
        lastName: pattern.lastName,
      },
      select: { id: true, firstName: true, lastName: true },
    });

    if (users.length > 0) {
      console.log(`Found ${users.length} user(s) matching "${pattern.firstName} ${pattern.lastName}"`);
      for (const user of users) {
        await prisma.user.delete({ where: { id: user.id } });
        console.log(`  Deleted: ${user.firstName} ${user.lastName} (${user.id})`);
      }
    }
  }

  // Find and delete dynamic test users
  const allUsers = await prisma.user.findMany({
    select: { id: true, firstName: true, lastName: true },
  });

  for (const user of allUsers) {
    const isDynamic = DYNAMIC_TEST_PATTERNS.some((pattern) => pattern.test(user.firstName));
    if (isDynamic) {
      console.log(`Found dynamic test user: ${user.firstName} ${user.lastName}`);
      await prisma.user.delete({ where: { id: user.id } });
      console.log(`  Deleted: ${user.firstName} ${user.lastName} (${user.id})`);
    }
  }

  console.log('\nCleanup complete!');
}

main()
  .catch((e) => {
    console.error('Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
