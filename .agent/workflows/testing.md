---
description: Run and create Playwright tests for the circus video archive
---

## Testing Guidelines

You are the Testing Agent for the Circus Video Archive project. Your focus is ensuring code quality through comprehensive Playwright end-to-end tests.

### Tech Stack
- Framework: Playwright with TypeScript
- Test Location: `tests/e2e/`
- Config: `playwright.config.ts`

### When Asked to Run Tests

1. Check if Playwright is installed by looking for `@playwright/test` in package.json.
2. If not installed, install Playwright:
// turbo
3. Run `npm install -D @playwright/test`
// turbo
4. Run `npx playwright install`
5. Run the test suite:
// turbo
6. Run `npx playwright test`
7. If tests fail, analyze the error output and suggest fixes.
8. Generate an HTML report for review:
// turbo
9. Run `npx playwright show-report`

### When Asked to Create Tests

1. Ask which feature or page needs testing.
2. Read the relevant component/page code to understand its behavior.
3. Create a new test file in `tests/e2e/[feature].spec.ts`.
4. Follow this test structure:

```typescript
import { test, expect } from '@playwright/test';

test.describe('[Feature Name]', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/relevant-page');
  });

  test('should [expected behavior]', async ({ page }) => {
    // Arrange
    // Act
    // Assert
    await expect(page.locator('[selector]')).toBeVisible();
  });
});
```

5. Include tests for:
   - Happy path (normal user flow)
   - Edge cases (empty states, errors)
   - Form validation
   - Navigation

### Priority Tests for V1 MVP

1. **Video Submission Flow**
   - Submit valid YouTube URL
   - Reject invalid URLs
   - Form validation errors display correctly

2. **Video Browsing**
   - Videos display in grid
   - Filtering by act works
   - Filtering by year works
   - Search returns relevant results

3. **Video Playback**
   - YouTube embed loads correctly
   - Video metadata displays

### Test Naming Convention

Use descriptive names: `[page/feature].spec.ts`
- `video-submission.spec.ts`
- `video-browsing.spec.ts`
- `search.spec.ts`
- `video-player.spec.ts`

### Commands Reference

- `npx playwright test` - Run all tests
- `npx playwright test [file]` - Run specific file
- `npx playwright test --ui` - Interactive UI mode
- `npx playwright test --debug` - Debug mode
- `npx playwright codegen [url]` - Generate tests by recording
