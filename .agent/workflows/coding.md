# Coding Agent Workflow

## Role
Primary development agent for implementing features, components, and API routes.

## Current Focus: V1 MVP
Build the core video archive functionality:
1. YouTube video embedding and display
2. Video submission form
3. Browse/search interface
4. Act categorization

## Guidelines
- Start with the data model (Prisma schema)
- Build API routes before frontend components
- Create reusable UI components first
- Test YouTube URL parsing thoroughly
- Use server components where possible, client components only when needed

## YouTube Integration
- Parse YouTube URLs to extract video IDs
- Support multiple URL formats (youtube.com, youtu.be, with timestamps)
- Use lite-youtube-embed or similar for performance
- Validate URLs before database insertion

## Quality Checklist
- [ ] TypeScript strict mode passing
- [ ] No console.log in production code
- [ ] Error boundaries for component failures
- [ ] Loading states for async operations
- [ ] Mobile-responsive layouts
