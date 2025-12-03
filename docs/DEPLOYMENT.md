# Circus Video Archive - Deployment Plan

## Architecture Overview

Based on your MyWebsite project pattern and the requirements of this project:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   GitHub Repo   │────▶│  GitHub Actions │────▶│     Vercel      │
│   (Source)      │     │    (CI/CD)      │     │   (Frontend)    │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │    Railway      │
                        │  (PostgreSQL)   │
                        └─────────────────┘
```

**Why this architecture:**
- **Vercel** - Optimized for Next.js, auto-scaling, free tier sufficient
- **Railway** - Managed PostgreSQL with connection pooling, $5/month
- **GitHub Actions** - CI/CD pipeline for testing, migrations, deployment

---

## Platform Comparison & Recommendations

### Hosting: Vercel vs Railway (App)

| Factor | Vercel | Railway |
|--------|--------|---------|
| Next.js Support | Native, optimized | Good, container-based |
| Free Tier | Generous (100GB bandwidth) | $5 trial credit |
| Auto-deploy | Built-in GitHub integration | Built-in GitHub integration |
| Edge Functions | Yes | No |
| Serverless | Yes | Container-based |

**Recommendation:** Use **Vercel** for the Next.js app (same as MyWebsite)

### Database: Railway vs Vercel Postgres vs Supabase

| Factor | Railway | Vercel Postgres | Supabase |
|--------|---------|-----------------|----------|
| Pricing | $5/mo + usage | $20/mo minimum | Free tier available |
| Connection Pooling | PgBouncer built-in | Built-in | Built-in |
| Setup Complexity | Low | Very Low | Low |
| Prisma Support | Excellent | Excellent | Excellent |

**Recommendation:** Use **Railway PostgreSQL**
- Familiar from your other project
- $5/mo hobby plan includes database
- Built-in connection pooling (important for serverless)
- Easy migration path from local PostgreSQL

### Domain Registrar: GoDaddy Alternatives

| Registrar | .com Price | Renewal Price | Best For |
|-----------|------------|---------------|----------|
| **GoDaddy** | ~$12/yr first year | ~$22/yr | Already have account |
| **Cloudflare** | ~$10.44/yr | Same (at-cost) | Best long-term value |
| **Namecheap** | ~$10/yr | ~$15/yr | Good balance |
| **Porkbun** | ~$11/yr | Same | Budget-friendly |

**Recommendation:**
- **Keep GoDaddy** if you already have the domain there
- **Transfer to Cloudflare** for best long-term pricing (at-cost renewals)
- Cloudflare also provides free CDN, DDoS protection, and fastest DNS

---

## Deployment Steps

### Phase 1: Database Setup (Railway)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub

2. **Create PostgreSQL Database**
   ```
   Dashboard → New Project → Deploy PostgreSQL
   ```

3. **Get Connection String**
   ```
   Click PostgreSQL service → Variables tab → DATABASE_URL
   ```
   Format: `postgresql://user:pass@host:port/railway`

4. **Run Migrations**
   ```bash
   # Set production DATABASE_URL locally (temporarily)
   export DATABASE_URL="postgresql://..."
   npx prisma migrate deploy
   npx prisma db seed
   ```

### Phase 2: Vercel Setup

1. **Install Vercel CLI** (optional, can use dashboard)
   ```bash
   npm i -g vercel
   ```

2. **Connect GitHub Repository**
   - Go to [vercel.com](https://vercel.com)
   - Import Git Repository → Select CircusArchives

3. **Configure Build Settings**
   - Framework Preset: Next.js
   - Build Command: `prisma generate && next build`
   - Output Directory: `.next`

4. **Set Environment Variables**
   ```
   DATABASE_URL = [Railway PostgreSQL URL]
   NEXT_PUBLIC_APP_URL = https://your-domain.com
   ```

5. **Configure Prisma for Vercel**

   Update `package.json`:
   ```json
   {
     "scripts": {
       "postinstall": "prisma generate"
     }
   }
   ```

### Phase 3: Domain Configuration

**Option A: Keep on GoDaddy**
1. In Vercel: Settings → Domains → Add your domain
2. In GoDaddy: Add DNS records Vercel provides
   - A Record: `76.76.21.21`
   - CNAME: `cname.vercel-dns.com`

**Option B: Transfer to Cloudflare (Recommended)**
1. Create Cloudflare account
2. Add site → Enter domain
3. Update nameservers at GoDaddy to Cloudflare's
4. In Cloudflare: Add Vercel DNS records
5. Enable Cloudflare proxy for CDN + DDoS protection

### Phase 4: CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}

jobs:
  # ============================================
  # JOB 1: Lint and Type Check
  # ============================================
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Run ESLint
        run: npm run lint

      - name: Type Check
        run: npx tsc --noEmit

  # ============================================
  # JOB 2: Run Tests
  # ============================================
  test:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Build Application
        run: npm run build

      - name: Run Playwright Tests
        run: npx playwright test
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

      - name: Upload Test Results
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

  # ============================================
  # JOB 3: Database Migration (Production only)
  # ============================================
  migrate:
    name: Database Migration
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master'
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run Migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

  # ============================================
  # JOB 4: Deploy to Vercel (automatic via integration)
  # ============================================
  # Note: Vercel auto-deploys when connected to GitHub
  # This job just confirms successful pipeline completion
  deploy-check:
    name: Deployment Ready
    runs-on: ubuntu-latest
    needs: [lint, test, migrate]
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master'
    steps:
      - name: Deployment Status
        run: |
          echo "✅ All checks passed!"
          echo "✅ Database migrations applied"
          echo "✅ Vercel will auto-deploy from main branch"
```

### Phase 5: Environment Secrets Setup

**GitHub Repository Secrets** (Settings → Secrets → Actions):
```
DATABASE_URL        = Railway production connection string
TEST_DATABASE_URL   = Railway test/staging database (optional, can use same)
```

**Vercel Environment Variables**:
```
DATABASE_URL        = Railway production connection string
NEXT_PUBLIC_APP_URL = https://your-production-domain.com
```

---

## Configuration Files to Add/Update

### 1. Update `package.json`

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "postinstall": "prisma generate",
    "db:seed": "npx tsx prisma/seed.ts",
    "db:migrate": "prisma migrate deploy"
  }
}
```

### 2. Create `vercel.json` (optional, for custom settings)

```json
{
  "buildCommand": "prisma generate && next build",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "PRISMA_GENERATE_DATAPROXY": "true"
  }
}
```

### 3. Update `.env.example`

```env
# Database (Railway PostgreSQL)
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Future: Authentication (V2)
# NEXTAUTH_SECRET=""
# NEXTAUTH_URL=""
```

---

## Cost Breakdown

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Vercel | Hobby (Free) | $0 |
| Railway | Hobby | $5 |
| Cloudflare | Free | $0 |
| Domain (.com) | Annual | ~$10-12/year |
| GitHub Actions | Free tier | $0 |
| **Total** | | **~$5-6/month** |

---

## Deployment Checklist

### Pre-Deployment
- [ ] Create Railway account and PostgreSQL database
- [ ] Get Railway DATABASE_URL
- [ ] Create Vercel account
- [ ] Connect GitHub repo to Vercel
- [ ] Set environment variables in Vercel
- [ ] Add GitHub repository secrets

### First Deployment
- [ ] Run `prisma migrate deploy` against Railway DB
- [ ] Run `prisma db seed` to populate acts
- [ ] Trigger Vercel deployment
- [ ] Verify app loads at Vercel URL

### Domain Setup
- [ ] Add custom domain in Vercel
- [ ] Configure DNS (GoDaddy or Cloudflare)
- [ ] Verify SSL certificate provisioned
- [ ] Test https://your-domain.com

### CI/CD Verification
- [ ] Push to main branch
- [ ] Verify GitHub Actions pipeline runs
- [ ] Verify lint + type check passes
- [ ] Verify tests pass (or are skipped if no test DB)
- [ ] Verify migrations run
- [ ] Verify Vercel deploys new version

---

## Differences from MyWebsite Project

| Aspect | MyWebsite | Circus Archives |
|--------|-----------|-----------------|
| Database | None (in-memory) | PostgreSQL (Railway) |
| WebSocket | Yes (Railway server) | No |
| Architecture | Split (Vercel + Railway) | Single app (Vercel only) |
| CI/CD | Platform-native | GitHub Actions |
| Migrations | N/A | Prisma migrate deploy |

The main addition here is the **database layer** - Railway hosts PostgreSQL instead of a WebSocket server, and the CI/CD pipeline handles migrations.

---

## Troubleshooting

### Common Issues

**1. Prisma Client outdated after schema changes**
```bash
# Add to package.json scripts
"postinstall": "prisma generate"
```

**2. Connection pool exhausted**
- Railway includes PgBouncer by default
- Use `?pgbouncer=true` in connection string if issues persist

**3. Preview deployments affect production DB**
- Create separate test database in Railway
- Set `DATABASE_URL` per Vercel environment (Production vs Preview)

**4. Build fails on Vercel**
```bash
# Check Prisma generates correctly
npx prisma generate && npm run build
```

---

## Next Steps

1. **Immediate**: Set up Railway PostgreSQL
2. **Then**: Connect repo to Vercel
3. **Then**: Add GitHub Actions workflow
4. **Finally**: Configure custom domain

Ready to proceed with implementation?
