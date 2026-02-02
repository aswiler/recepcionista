# Voice Service Deployment Guide (Telnyx)

This guide covers deploying the premium voice pipeline with Telnyx to production.

## Prerequisites

1. **Telnyx Account** with:
   - API Key (from portal.telnyx.com)
   - Programmable Voice application created
   - Phone number(s) purchased

2. **API Keys** for:
   - Deepgram (STT)
   - OpenAI (LLM)
   - ElevenLabs (TTS)
   - Pinecone (RAG)

3. **Railway account** (or other hosting)

---

## Telnyx Setup

### Step 1: Create a Telnyx Account

1. Go to https://telnyx.com and sign up
2. Add credit to your account ($5+ recommended for testing)

### Step 2: Get Your API Key

1. Go to https://portal.telnyx.com
2. Navigate to **Auth** → **API Keys**
3. Click **Create API Key**
4. Copy the key (starts with `KEY...`)

### Step 3: Create a Voice Application

1. In Telnyx portal, go to **Voice** → **Programmable Voice**
2. Click **Create Voice API Application**
3. Fill in:
   - **Application Name:** `Recepcionista`
   - **Webhook URL:** `https://your-voice-service.up.railway.app/webhook/telnyx`
   - **Webhook API Version:** `API v2`
4. Save and note the **Connection ID**

### Step 4: Purchase a Phone Number

1. Go to **Numbers** → **Search & Buy**
2. Search for numbers in Spain (ES) or your target country
3. Purchase a number
4. Link it to your Voice application (set Connection ID)

---

## Deploy to Railway

### Step 1: Create Railway Project

1. Go to https://railway.app/dashboard
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Set **Root Directory** to `apps/voice`

### Step 2: Configure Environment Variables

In Railway dashboard, go to **Variables** tab and add:

```
NODE_ENV=production
PORT=3001
TELNYX_API_KEY=KEYxxxxxxxxxxxxxxxxxx
DEEPGRAM_API_KEY=xxxxxxxxxx
OPENAI_API_KEY=sk-proj-xxxxxxxxxx
ELEVENLABS_API_KEY=sk_xxxxxxxxxx
PINECONE_API_KEY=pcsk_xxxxxxxxxx
WEB_APP_URL=https://your-web-app.vercel.app
DEFAULT_BUSINESS_NAME=Mi Negocio
```

### Step 3: Configure Build

In **Settings** tab:
- **Root Directory:** `apps/voice`
- **Custom Start Command:** `node dist/index.js`

### Step 4: Deploy & Get URL

1. Railway will auto-deploy
2. Go to **Settings** → **Networking** → **Generate Domain**
3. Copy your URL (e.g., `https://voice-xyz.up.railway.app`)

### Step 5: Add BASE_URL

Add to Railway variables:
```
BASE_URL=https://voice-xyz.up.railway.app
```

### Step 6: Update Telnyx Webhook

1. Go back to Telnyx portal → Voice → Your Application
2. Update **Webhook URL** to: `https://voice-xyz.up.railway.app/webhook/telnyx`
3. Save

---

## Test Your Setup

### Health Check

```bash
curl https://your-voice-service.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "voice",
  "version": "2.0.0",
  "provider": "telnyx",
  "pipeline": "premium"
}
```

### Test Call

1. Call your Telnyx phone number
2. You should hear: "¡Hola! Gracias por llamar a [Business Name]..."
3. Try asking questions or booking appointments

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Voice Service                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Incoming Call                                              │
│       │                                                     │
│       ▼                                                     │
│  Telnyx Webhook (call.initiated)                            │
│       │                                                     │
│       ▼                                                     │
│  Answer Call → Start Audio Streaming                        │
│       │                                                     │
│       ▼                                                     │
│  WebSocket /stream/{callControlId}                          │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            TelnyxVoicePipeline                       │   │
│  │                                                      │   │
│  │  Audio In ──► Deepgram STT ──► Transcript           │   │
│  │                                    │                 │   │
│  │                                    ▼                 │   │
│  │                    Pinecone RAG ──► Context          │   │
│  │                                    │                 │   │
│  │                                    ▼                 │   │
│  │                          OpenAI GPT-4o               │   │
│  │                          (+ Calendar Tools)          │   │
│  │                                    │                 │   │
│  │                                    ▼                 │   │
│  │  Audio Out ◄── ElevenLabs TTS ◄── Response          │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Telnyx Webhook Events

The service handles these Telnyx events:

| Event | Description |
|-------|-------------|
| `call.initiated` | Incoming call - answer and prepare |
| `call.answered` | Call connected - start audio streaming |
| `call.hangup` | Call ended - clean up |
| `streaming.started` | Audio stream active |
| `streaming.stopped` | Audio stream ended |

---

## Monitoring

### View Active Calls

```bash
curl https://your-voice-service.up.railway.app/api/calls
```

### Logs

- **Railway:** `railway logs` or Dashboard → Logs
- Watch for:
  - `📞 Telnyx event: call.initiated`
  - `✅ Call answered`
  - `🎙️ Audio streaming started`
  - `👤 Customer: [transcript]`
  - `🤖 AI: [response]`

---

## Troubleshooting

### "No audio" on calls

1. Check ElevenLabs API key is valid
2. Verify WebSocket connection established (check logs)
3. Ensure BASE_URL is correct and uses HTTPS

### "Webhook not receiving events"

1. Verify Telnyx webhook URL matches your Railway URL
2. Check webhook is set to **API v2**
3. Ensure phone number is linked to the correct connection

### "AI not responding"

1. Check OpenAI API key
2. Verify Pinecone connection for RAG context
3. Check logs for errors

---

## Cost Estimates

Per minute of voice conversation:

| Service     | Cost/min | Notes                    |
|-------------|----------|--------------------------|
| Telnyx      | ~$0.01   | Inbound + streaming      |
| Deepgram    | ~$0.01   | Nova-2 STT               |
| OpenAI      | ~$0.02   | GPT-4o (varies by usage) |
| ElevenLabs  | ~$0.02   | Multilingual v2          |
| **Total**   | ~$0.06   | Per minute               |

For 1,000 calls averaging 3 minutes: ~$180/month

---

## Client Onboarding (Call Forwarding)

Since clients typically have existing phone numbers:

1. You provision a Telnyx number for them
2. They set up **call forwarding** from their existing number:
   ```
   *21*+34XXXXXXXXX#   (forward all calls)
   *61*+34XXXXXXXXX#   (forward if no answer)
   ```
3. Calls flow: Customer → Client's number → Telnyx → AI

This way clients keep their existing numbers and can disable forwarding anytime.
