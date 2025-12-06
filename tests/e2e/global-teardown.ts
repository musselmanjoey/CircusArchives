/**
 * Global teardown for Playwright tests.
 * Cleans up test users created during test runs.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test user patterns - names that are clearly from tests
const TEST_USER_PATTERNS = [
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
  { firstName: 'Sorter', lastName: 'Test' },
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

async function globalTeardown() {
  console.log('\n🧹 Running global test cleanup...');

  let deletedCount = 0;

  try {
    // Delete exact match test users
    for (const pattern of TEST_USER_PATTERNS) {
      const result = await prisma.user.deleteMany({
        where: {
          firstName: pattern.firstName,
          lastName: pattern.lastName,
        },
      });
      deletedCount += result.count;
    }

    // Find and delete dynamic test users
    const allUsers = await prisma.user.findMany({
      select: { id: true, firstName: true },
    });

    for (const user of allUsers) {
      const isDynamic = DYNAMIC_TEST_PATTERNS.some((pattern) => pattern.test(user.firstName));
      if (isDynamic) {
        await prisma.user.delete({ where: { id: user.id } });
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`✅ Cleaned up ${deletedCount} test user(s)`);
    } else {
      console.log('✅ No test users to clean up');
    }
  } catch (error) {
    console.error('⚠️ Error during test cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

export default globalTeardown;
