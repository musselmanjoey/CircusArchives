# Circus Video Archive - Deployment Guide

## Live Site

**Production URL:** https://flyinghighcircusarchives.com

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   GitHub Repo   │────▶│  GitHub Actions │────▶│     Vercel      │
│   (Source)      │     │    (CI/CD)      │     │   (Next.js)     │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │    Railway      │
                        │  (PostgreSQL)   │
                        └─────────────────┘
```

| Component | Service | Dashboard |
|-----------|---------|-----------|
| App Hosting | Vercel | https://vercel.com/dashboard |
| Database | Railway PostgreSQL | https://railway.app/dashboard |
| Domain | GoDaddy | https://dcc.godaddy.com |
| CI/CD | GitHub Actions | https://github.com/musselmanjoey/CircusArchives/actions |
| Source | GitHub | https://github.com/musselmanjoey/CircusArchives |

---

## Monthly Costs

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby (Free) | $0 |
| Railway | Hobby | $5/month |
| GoDaddy | Domain | ~$12-22/year |
| **Total** | | **~$5-6/month** |

---

## Environment Variables

### Vercel (Settings → Environment Variables)

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | Railway public connection string | Yes |
| `AUTH_SECRET` | NextAuth.js secret (generate with `openssl rand -base64 32`) | Yes |
| `AUTH_TRUST_HOST` | `true` | Yes (production) |
| `NEXT_PUBLIC_APP_URL` | `https://flyinghighcircusarchives.com` | Optional |

### GitHub Secrets (Settings → Secrets → Actions)

| Secret | Value |
|--------|-------|
| `DATABASE_URL` | Railway public connection string |

### Local Development

Use `.env` file (gitignored):
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/circus_archive"
AUTH_SECRET="your-dev-secret-here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Secret Storage

Production secrets are stored locally in `.env.production.local` (gitignored).
See that file for all credentials and where they're configured.

---

## DNS Configuration (GoDaddy)

**Domain:** flyinghighcircusarchives.com

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 600 |
| CNAME | www | cname.vercel-dns.com | 600 |

---

## Deployment Workflow

### Automatic (Recommended)

1. Push to `master` branch
2. GitHub Actions runs:
   - Lint & type check
   - Build verification
   - Database migrations
3. Vercel auto-deploys

### Manual Redeploy

If you need to redeploy without code changes (e.g., after changing env vars):

**Option A:** Vercel Dashboard → Deployments → Redeploy

**Option B:** Empty commit
```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push
```

---

## Database Operations

### Run Migrations (Production)

```bash
# Set the production DATABASE_URL
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### Seed Database (First-time only)

```bash
DATABASE_URL="postgresql://..." npx prisma db seed
```

### View Production Data

```bash
DATABASE_URL="postgresql://..." npx prisma studio
```

---

## Common Issues

### 1. "Failed to fetch acts" error

**Cause:** Wrong DATABASE_URL in Vercel (using internal Railway URL)

**Fix:** Use the public Railway URL (`*.proxy.rlwy.net`), not `*.railway.internal`

### 2. Prisma Client outdated

**Cause:** Vercel caching old Prisma client

**Fix:** Already handled - `postinstall` script runs `prisma generate`

### 3. Type errors on deploy

**Cause:** Prisma returns `null`, TypeScript expects `undefined`

**Fix:** Convert nulls: `description: video.description || undefined`

### 4. DNS not propagating

**Cause:** DNS cache

**Fix:** Wait 5-30 minutes, or try `nslookup flyinghighcircusarchives.com`

---

## Adding New Environment Variables

1. Add to Vercel (Settings → Environment Variables)
2. Add to GitHub Secrets if needed for CI/CD
3. Add to `.env.example` (template, no real values)
4. Add to `.env.production.local` (real values, gitignored)
5. Redeploy

---

## CI/CD Pipeline

Located at `.github/workflows/ci.yml`

| Job | Purpose | Runs On |
|-----|---------|---------|
| lint | ESLint + TypeScript | All pushes/PRs |
| build | Verify build succeeds | All pushes/PRs |
| test | E2E tests (optional) | If `RUN_E2E_TESTS=true` |
| migrate | Apply DB migrations | master branch only |
| deploy-ready | Confirm success | master branch only |

---

## Backup & Recovery

### Database Backup

Railway provides automatic backups on paid plans. For manual backup:

```bash
# Export database
DATABASE_URL="postgresql://..." pg_dump > backup.sql

# Restore database
DATABASE_URL="postgresql://..." psql < backup.sql
```

### Code Recovery

All code is in GitHub. To restore:

```bash
git clone https://github.com/musselmanjoey/CircusArchives.git
cd CircusArchives
npm install
```

---

## Future Improvements

- [ ] Transfer domain to Cloudflare (cheaper renewals, better DNS)
- [ ] Set up staging environment with separate database
- [ ] Add monitoring (Vercel Analytics, Sentry)
- [ ] Configure preview deployments with test database
