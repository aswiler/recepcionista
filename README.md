# Recepcionista.com - AI Receptionist Platform

Modern AI receptionist platform built with Next.js, TypeScript, and the best voice AI stack.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env.local
# Add your API keys to apps/web/.env.local

# Push database schema
npm run db:push

# Start development servers
npm run dev
```

Visit `http://localhost:3000` to see the app.

## 📁 Project Structure

```
Recepcionista-v2/
├── apps/
│   ├── web/          # Next.js web application
│   └── voice/        # Voice service (Bun + Hono)
├── packages/
│   └── shared/       # Shared utilities
└── package.json      # Root workspace config
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Voice AI**: Deepgram (STT), ElevenLabs (TTS), OpenAI (GPT-4o)
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Telephony**: Twilio
- **Vector DB**: Pinecone

## 📝 Environment Variables

See `ENV_TEMPLATE.md` for all required API keys.

## 🎯 Features

- ✅ Browser-based voice interview onboarding
- ✅ Website scraping for business info
- ✅ AI-powered phone answering
- ✅ WhatsApp integration
- ✅ Calendar scheduling
- ✅ Beautiful, modern UI

## 📚 Documentation

### Product & Strategy
- `Documents/EXECUTIVE_SUMMARY.md` - Mission, market, revenue model
- `Documents/PRODUCT_ROADMAP.md` - Phased feature roadmap
- `Documents/USER_STORIES.md` - Prioritized user stories
- `Documents/COMPETITIVE_ANALYSIS.md` - Competitor breakdown

### Technical
- `NEXT_STEPS.md` - Detailed setup guide
- `WOW_STACK.md` - Tech stack rationale
- `ENV_TEMPLATE.md` - Environment variables template
- `DEPLOYMENT_GUIDE.md` - Production deployment guide

## 🎨 Development

```bash
# Web app only
cd apps/web && npm run dev

# Voice service only
cd apps/voice && npm run dev

# Both (from root)
npm run dev
```

## 📄 License

Private - All rights reserved
