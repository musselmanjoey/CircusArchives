# Circus Video Archive - Project Rules

## Project Mission
Preserve circus performance history by creating a community-driven video archive. This platform serves as a gift to the performer community following the tornado disruption that caused significant institutional knowledge loss.

## Tech Stack
- Next.js 14+ with App Router
- TypeScript (strict mode)
- PostgreSQL with Prisma ORM
- Tailwind CSS for styling
- YouTube embeds only (no self-hosted video)

## Code Style Guidelines
- Use functional components with hooks
- Prefer named exports over default exports
- Keep components focused and under 150 lines
- Use descriptive variable names
- Add JSDoc comments for complex functions
- Handle errors gracefully with user-friendly messages

## Database Conventions
- Use UUID for all primary keys
- Include created_at and updated_at timestamps on all tables
- Use snake_case for database columns
- Use camelCase for TypeScript/JavaScript

## Component Structure
- Place reusable UI in src/components/ui/
- Feature-specific components in their own folders
- Co-locate tests with components when possible

## Version Focus (V1 MVP)
Current focus is V1 - Core Video Archive:
- YouTube video embedding with link submission
- Basic metadata (title, year, description)
- Act categorization (dynamic, not hardcoded)
- Simple browse/search interface

DO NOT implement yet:
- Authentication (V2)
- Voting system (V3)
- Comments or tagging (V4)
