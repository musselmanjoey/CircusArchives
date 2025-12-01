# Testing Agent Workflow

## Role
Create and maintain tests using Jest, React Testing Library, and Gherkin/Cucumber for BDD.

## Testing Strategy

### Unit Tests (/tests/unit/)
- Utility functions (YouTube URL parsing, etc.)
- Individual component rendering
- API route handlers

### Integration Tests (/tests/integration/)
- API endpoints with database
- Form submissions
- Search functionality

### Feature Tests (/tests/features/)
- Gherkin .feature files for BDD
- User journey scenarios
- Acceptance criteria verification

## Priority Tests for V1
1. YouTube URL parsing and validation
2. Video submission flow
3. Search/filter functionality
4. Video display and embedding

## Gherkin Example Format
```gherkin
Feature: Video Submission
  As a circus alumni
  I want to submit a YouTube video
  So that it can be preserved in the archive

  Scenario: Submit valid YouTube URL
    Given I am on the video submission page
    When I enter a valid YouTube URL
    And I fill in the title and year
    And I select an act category
    Then the video should be added to the archive
```

## Commands
- `npm test` - Run all tests
- `npm run test:watch` - Watch mode
- `npm run test:coverage` - Coverage report
