# Environment Variables Setup

## Create These Files Manually

### 1. Create `apps/web/.env.local`

Open your terminal and run:

```bash
cd /Users/andrew/Downloads/Recepcionista.com/v2/apps/web
nano .env.local
```

Then paste this content:

```bash
# =============================================================================
# DATABASE
# =============================================================================
DATABASE_URL="postgresql://user:password@localhost:5432/recepcionista"

# =============================================================================
# NEXT.AUTH (Authentication)
# =============================================================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-this-to-a-random-secret-at-least-32-characters-long"

# Google OAuth (optional - get from console.cloud.google.com)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Microsoft OAuth (optional - get from portal.azure.com)
MICROSOFT_CLIENT_ID=""
MICROSOFT_CLIENT_SECRET=""

# =============================================================================
# OPENAI (for embeddings and data extraction)
# =============================================================================
OPENAI_API_KEY="PASTE_YOUR_OPENAI_KEY_HERE"

# =============================================================================
# PINECONE (Vector Database)
# =============================================================================
PINECONE_API_KEY="PASTE_YOUR_PINECONE_KEY_HERE"

# =============================================================================
# FIRECRAWL (Website Scraping)
# =============================================================================
FIRECRAWL_API_KEY="PASTE_YOUR_FIRECRAWL_KEY_HERE"

# =============================================================================
# TWILIO (Telephony)
# =============================================================================
TWILIO_ACCOUNT_SID="PASTE_YOUR_TWILIO_SID_HERE"
TWILIO_AUTH_TOKEN="PASTE_YOUR_TWILIO_TOKEN_HERE"
TWILIO_PHONE_NUMBER="PASTE_YOUR_TWILIO_NUMBER_HERE"

# =============================================================================
# DEEPGRAM (Speech-to-Text)
# =============================================================================
DEEPGRAM_API_KEY="PASTE_YOUR_DEEPGRAM_KEY_HERE"

# =============================================================================
# ELEVENLABS (Text-to-Speech - THE WOW FACTOR)
# =============================================================================
ELEVENLABS_API_KEY="PASTE_YOUR_ELEVENLABS_KEY_HERE"

# =============================================================================
# NANGO (Integration Platform - Calendar, CRM, etc.)
# Get your secret key from: https://app.nango.dev → Settings → Environment
# =============================================================================
NANGO_SECRET_KEY="PASTE_YOUR_NANGO_SECRET_KEY_HERE"

# =============================================================================
# WHATSAPP BUSINESS API (Meta Cloud API)
# Get from: https://business.facebook.com/settings/whatsapp-business-accounts
# =============================================================================
WHATSAPP_VERIFY_TOKEN="any-random-string-you-choose"
WHATSAPP_ACCESS_TOKEN="PASTE_YOUR_WHATSAPP_ACCESS_TOKEN_HERE"

# =============================================================================
# BASE URL (for webhooks)
# =============================================================================
BASE_URL="http://localhost:3000"
```

Save with: `Ctrl+O`, `Enter`, `Ctrl+X`

---

### 2. Create `apps/voice/.env`

```bash
cd /Users/andrew/Downloads/Recepcionista.com/v2/apps/voice
nano .env
```

Then paste this content:

```bash
# =============================================================================
# SERVER CONFIG
# =============================================================================
PORT=3001
BASE_URL="http://localhost:3001"
VOICE_SERVICE_WS_URL="ws://localhost:3001"

# =============================================================================
# TWILIO (Telephony)
# =============================================================================
TWILIO_ACCOUNT_SID="PASTE_YOUR_TWILIO_SID_HERE"
TWILIO_AUTH_TOKEN="PASTE_YOUR_TWILIO_TOKEN_HERE"

# =============================================================================
# DEEPGRAM (Speech-to-Text)
# =============================================================================
DEEPGRAM_API_KEY="PASTE_YOUR_DEEPGRAM_KEY_HERE"

# =============================================================================
# OPENAI (for RAG embeddings)
# =============================================================================
OPENAI_API_KEY="PASTE_YOUR_OPENAI_KEY_HERE"

# =============================================================================
# ELEVENLABS (Text-to-Speech - THE WOW FACTOR)
# =============================================================================
ELEVENLABS_API_KEY="PASTE_YOUR_ELEVENLABS_KEY_HERE"

# =============================================================================
# PINECONE (Vector Database for RAG)
# =============================================================================
PINECONE_API_KEY="PASTE_YOUR_PINECONE_KEY_HERE"

# =============================================================================
# DATABASE (Optional)
# =============================================================================
DATABASE_URL="postgresql://user:password@localhost:5432/recepcionista"
```

Save with: `Ctrl+O`, `Enter`, `Ctrl+X`

---

## Quick Copy-Paste Commands

Or use these commands to create the files:

```bash
# Navigate to v2
cd /Users/andrew/Downloads/Recepcionista.com/v2

# Create web .env.local
cat > apps/web/.env.local << 'ENVFILE'
DATABASE_URL="postgresql://user:password@localhost:5432/recepcionista"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-this-to-a-random-secret-at-least-32-characters-long"
OPENAI_API_KEY=""
PINECONE_API_KEY=""
FIRECRAWL_API_KEY=""
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""
DEEPGRAM_API_KEY=""
ELEVENLABS_API_KEY=""
BASE_URL="http://localhost:3000"
ENVFILE

# Create voice .env
cat > apps/voice/.env << 'ENVFILE'
PORT=3001
BASE_URL="http://localhost:3001"
VOICE_SERVICE_WS_URL="ws://localhost:3001"
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
DEEPGRAM_API_KEY=""
OPENAI_API_KEY=""
ELEVENLABS_API_KEY=""
PINECONE_API_KEY=""
DATABASE_URL="postgresql://user:password@localhost:5432/recepcionista"
ENVFILE
```

---

## Where to Get Your Keys

### From your existing `backend/.env`:
- `OPENAI_API_KEY`
- `PINECONE_API_KEY`
- `FIRECRAWL_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`

### New keys you need:
- **DEEPGRAM_API_KEY**: https://console.deepgram.com/ → API Keys
- **ELEVENLABS_API_KEY**: https://elevenlabs.io → Profile → API Keys

---

## After Creating Files

1. Open `apps/web/.env.local` in your editor
2. Fill in all the keys (copy from `backend/.env` for existing ones)
3. Open `apps/voice/.env` in your editor
4. Fill in the same keys

Then you're ready to go! 🚀
