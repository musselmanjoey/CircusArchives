# Circus Video Archive

A community-driven platform for preserving and celebrating circus performance history.

## Mission

Following the tornado that damaged the circus tent and caused a multi-year disruption, significant institutional knowledge was lost. This platform aims to recapture that knowledge and give it back to the performer community as a lasting gift.

## Features (V1 MVP)

- YouTube video embedding and display
- Video submission with metadata (title, year, description)
- Act categorization (dynamic categories)
- Browse and search interface

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL + Prisma
- **Styling:** Tailwind CSS
- **Testing:** Jest + React Testing Library + Cucumber

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npx prisma migrate dev

# Seed the database (optional)
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/          # Next.js App Router pages
├── components/   # React components
├── lib/          # Utility functions
└── types/        # TypeScript types

prisma/           # Database schema and migrations
docs/             # Documentation
tests/            # Test files
.agent/           # Antigravity agent configuration
```

## Version Roadmap

- **V1:** Core Video Archive (MVP) - Current
- **V2:** Authentication & Alumni Verification
- **V3:** Voting System
- **V4:** Community Features (Comments, Tags)

## Development

This project uses Google Antigravity IDE with multi-agent workflows. See `.agent/` for agent configurations.

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - Technical decisions
- [API](docs/API.md) - Endpoint documentation
- [Business Proposal](docs/business/PROPOSAL.md) - Project proposal

## License

Private - Circus Community Use Only
