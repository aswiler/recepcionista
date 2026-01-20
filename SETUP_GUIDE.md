# Setup Guide - Recepcionista.com v2

## Step 1: Get Missing API Keys

### ElevenLabs (Text-to-Speech) - REQUIRED
1. Go to [elevenlabs.io](https://elevenlabs.io)
2. Sign up (free account)
3. Go to **Profile → API Keys**
4. Click **Create Key**
5. Copy the key

**Free tier:** 10,000 characters/month (enough for testing)

---

### Deepgram (Speech-to-Text) - REQUIRED
1. Go to [deepgram.com](https://deepgram.com)
2. Sign up (free $200 credit)
3. Go to **API Keys** in dashboard
4. Click **Create Key**
5. Copy the key

**Free tier:** $200 credit (plenty for development)

---

## Step 2: Copy Your Existing Keys

You already have these in `backend/.env`. Copy them:

```bash
# From backend/.env, copy these:
OPENAI_API_KEY="sk-proj-..."
PINECONE_API_KEY="pcsk_..."
FIRECRAWL_API_KEY="fc-..."
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
```

---

## Step 3: Create Environment Files

```bash
cd /Users/andrew/Downloads/Recepcionista.com/v2

# Web app environment
cp apps/web/.env.example apps/web/.env.local

# Voice service environment
cp apps/voice/.env.example apps/voice/.env
```

---

## Step 4: Fill In Your Keys

### Edit `apps/web/.env.local`:

```bash
# Copy from backend/.env
OPENAI_API_KEY="sk-proj-nv9tRfVtyfG2cG90ibh0kko8IJMVHQyqvbLVZTxairpbXJB1fvji_B00tnf6JnhiHF63VqP5V_T3BlbkFJCPYTo06nWxE"
PINECONE_API_KEY="pcsk_2LzBAK_JLqNtGbdfQCMiHViQi5gQtFJLAsKVdTTwPBvxwEGu3ydbsgYCVeJ39MMjpmgk5a"
FIRECRAWL_API_KEY="fc-a257237d9c224686afbb8ad2fb2f9bf9"
TWILIO_ACCOUNT_SID="AC69c471a11880810e58eeb086ba4e9dfb"
TWILIO_AUTH_TOKEN="2d3f1d35d234cfa556e0ea23a737f3a2"

# Add your new keys
ELEVENLABS_API_KEY="your-elevenlabs-key-here"
DEEPGRAM_API_KEY="your-deepgram-key-here"

# Database (set up Neon or use local)
DATABASE_URL="postgresql://..."

# NextAuth secret (generate one)
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

### Edit `apps/voice/.env`:

```bash
# Copy from web app
OPENAI_API_KEY="sk-proj-..."
PINECONE_API_KEY="pcsk_..."
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."

# Add your new keys
DEEPGRAM_API_KEY="your-deepgram-key-here"
ELEVENLABS_API_KEY="your-elevenlabs-key-here"

# Server config
PORT=3001
BASE_URL="http://localhost:3001"
```

---

## Step 5: Install Dependencies

```bash
cd /Users/andrew/Downloads/Recepcionista.com/v2

# Install pnpm if needed
npm install -g pnpm

# Install all dependencies
pnpm install
```

---

## Step 6: Set Up Database

### Option A: Neon (Recommended - Free, Serverless)

1. Go to [neon.tech](https://neon.tech)
2. Sign up (free tier)
3. Create a new project
4. Copy the connection string
5. Add to `apps/web/.env.local`:
   ```
   DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/recepcionista"
   ```

### Option B: Local PostgreSQL

```bash
# Install PostgreSQL (if not installed)
brew install postgresql@14

# Start PostgreSQL
brew services start postgresql@14

# Create database
createdb recepcionista

# Connection string
DATABASE_URL="postgresql://localhost:5432/recepcionista"
```

---

## Step 7: Run Database Migrations

```bash
cd apps/web

# Push schema to database
pnpm db:push
```

---

## Step 8: Start Development Servers

```bash
# From v2 root directory
pnpm dev

# This starts:
# - Web app on http://localhost:3000
# - Voice service on http://localhost:3001
```

---

## Step 9: Test the Setup

1. **Open** http://localhost:3000
2. **Go to** `/onboarding`
3. **Enter** a website URL (or skip)
4. **Click** "Start Interview"

---

## Troubleshooting

### "Module not found"
```bash
# Reinstall dependencies
rm -rf node_modules apps/*/node_modules
pnpm install
```

### "API key invalid"
- Double-check you copied the full key
- Make sure no extra spaces
- Verify key is active in provider dashboard

### "Database connection failed"
- Check DATABASE_URL is correct
- Verify PostgreSQL is running (if local)
- Check Neon project is active (if using Neon)

### "Port already in use"
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Or change port in .env
PORT=3001
```

---

## Next Steps

Once everything is running:

1. ✅ Test website scraping
2. ✅ Test voice interview (you'll need a Twilio number)
3. ✅ Test WhatsApp integration
4. ✅ Deploy to production

---

## Quick Reference

| File | Purpose |
|------|---------|
| `apps/web/.env.local` | Web app environment (Next.js) |
| `apps/voice/.env` | Voice service environment |
| `apps/web/app/onboarding/` | Onboarding UI pages |
| `apps/voice/src/agents/` | Interview agent logic |

---

**Ready to start? Get those API keys and let's go! 🚀**
