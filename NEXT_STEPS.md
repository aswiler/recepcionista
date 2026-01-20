# Next Steps - Getting Started

## ✅ Step 1: Install pnpm (if not installed)

```bash
npm install -g pnpm
```

Verify it worked:
```bash
pnpm --version
```

---

## ✅ Step 2: Install Dependencies

```bash
cd /Users/andrew/Downloads/Recepcionista.com/v2
pnpm install
```

This will install all packages for both `web` and `voice` apps.

**Note:** This might take 2-3 minutes the first time.

---

## ✅ Step 3: Set Up Database

You have two options:

### Option A: Neon (Recommended - Free, Serverless)

1. Go to [neon.tech](https://neon.tech)
2. Sign up (free tier)
3. Create a new project
4. Copy the connection string (looks like: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname`)
5. Update `apps/web/.env.local`:
   ```
   DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname"
   ```

### Option B: Local PostgreSQL

```bash
# Install PostgreSQL (if not installed)
brew install postgresql@14

# Start PostgreSQL
brew services start postgresql@14

# Create database
createdb recepcionista

# Update .env.local
DATABASE_URL="postgresql://localhost:5432/recepcionista"
```

---

## ✅ Step 4: Push Database Schema

```bash
cd /Users/andrew/Downloads/Recepcionista.com/v2
pnpm db:push
```

This creates all the database tables.

---

## ✅ Step 5: Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Copy the output and paste it into `apps/web/.env.local`:
```
NEXTAUTH_SECRET="paste-generated-secret-here"
```

---

## ✅ Step 6: Start Development Servers

```bash
cd /Users/andrew/Downloads/Recepcionista.com/v2
pnpm dev
```

This starts:
- **Web app** on http://localhost:3000
- **Voice service** on http://localhost:3001

---

## ✅ Step 7: Test It!

1. Open http://localhost:3000
2. You should see the landing page
3. Navigate to `/onboarding` to see the onboarding flow

---

## Troubleshooting

### "pnpm: command not found"
```bash
npm install -g pnpm
```

### "Module not found" errors
```bash
# Clean install
rm -rf node_modules apps/*/node_modules
pnpm install
```

### "Database connection failed"
- Check your `DATABASE_URL` in `.env.local`
- Make sure PostgreSQL is running (if local)
- Verify Neon project is active (if using Neon)

### "Port 3000 already in use"
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Or change port in .env.local
PORT=3001
```

---

## What's Next?

Once everything is running:

1. ✅ Test website scraping
2. ✅ Test voice interview (need Twilio number configured)
3. ✅ Test WhatsApp integration
4. ✅ Deploy to production

---

**Ready? Start with Step 1! 🚀**
