# Voice Service Deployment Guide

This guide covers deploying the premium voice pipeline to production.

## Prerequisites

1. **Twilio Account** with:
   - Phone number(s) provisioned
   - Account SID and Auth Token

2. **API Keys** for:
   - Deepgram (STT)
   - OpenAI (LLM)
   - ElevenLabs (TTS)
   - Pinecone (RAG)

3. **Railway or Render account** (or other hosting)

---

## Option 1: Deploy to Railway

### Step 1: Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project in the voice directory
cd apps/voice
railway init
```

### Step 2: Configure Environment Variables

In Railway dashboard, add these variables:

```
NODE_ENV=production
PORT=3001
BASE_URL=https://your-app.railway.app

TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxx
DEEPGRAM_API_KEY=xxxxxxxxxx
OPENAI_API_KEY=sk-proj-xxxxxxxxxx
ELEVENLABS_API_KEY=sk_xxxxxxxxxx
PINECONE_API_KEY=pcsk_xxxxxxxxxx
WEB_APP_URL=https://your-web-app.vercel.app
```

### Step 3: Deploy

```bash
railway up
```

### Step 4: Get Your URL

```bash
railway domain
```

---

## Option 2: Deploy to Render

### Step 1: Connect Repository

1. Go to https://dashboard.render.com
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Set root directory to `apps/voice`

### Step 2: Configure Build

- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Health Check Path:** `/health`

### Step 3: Add Environment Variables

Add all variables from `.env.example`

### Step 4: Deploy

Click "Create Web Service"

---

## Option 3: Deploy with Docker

### Step 1: Build Image

```bash
cd apps/voice
docker build -t recepcionista-voice .
```

### Step 2: Run Container

```bash
docker run -d \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e BASE_URL=https://your-domain.com \
  -e TWILIO_ACCOUNT_SID=ACxxxxxxxx \
  -e TWILIO_AUTH_TOKEN=xxxxxxxx \
  -e DEEPGRAM_API_KEY=xxxxxxxx \
  -e OPENAI_API_KEY=sk-proj-xxxxxxxx \
  -e ELEVENLABS_API_KEY=sk_xxxxxxxx \
  -e PINECONE_API_KEY=pcsk_xxxxxxxx \
  -e WEB_APP_URL=https://your-web-app.com \
  recepcionista-voice
```

---

## Configure Twilio Phone Numbers

After deploying, configure your Twilio phone numbers to use the voice service.

### Step 1: Get Your Webhook URL

Your webhook URL will be:
```
https://your-voice-service.com/webhook/twilio/voice
```

### Step 2: Configure in Twilio Console

1. Go to https://console.twilio.com/phone-numbers
2. Click on your phone number
3. Under "Voice Configuration":
   - **Configure with:** Webhook
   - **A call comes in:** `https://your-voice-service.com/webhook/twilio/voice`
   - **HTTP Method:** POST
   - **Call status changes:** `https://your-voice-service.com/webhook/twilio/status` (optional)

### Step 3: Test the Configuration

Call your Twilio number! You should hear the AI receptionist answer.

---

## Twilio Configuration via API

You can also configure phone numbers programmatically:

```javascript
const twilio = require('twilio');
const client = twilio(accountSid, authToken);

// Update phone number webhook
await client.incomingPhoneNumbers('PNxxxxxxxxxx').update({
  voiceUrl: 'https://your-voice-service.com/webhook/twilio/voice',
  voiceMethod: 'POST',
  statusCallback: 'https://your-voice-service.com/webhook/twilio/status',
  statusCallbackMethod: 'POST',
});
```

---

## Verify Deployment

### Health Check

```bash
curl https://your-voice-service.com/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "voice",
  "version": "2.0.0",
  "pipeline": "premium"
}
```

### Test Call

1. Call your Twilio phone number
2. You should hear: "¡Hola! Gracias por llamar a [Business Name]..."
3. Try asking questions or booking appointments

---

## Monitoring

### Logs

- **Railway:** `railway logs`
- **Render:** Dashboard → Service → Logs
- **Docker:** `docker logs <container_id>`

### Active Calls

The service logs active call count when connections close:
```
📊 Active calls: 2
```

### Latency Tracking

The service logs LLM latency for each request:
```
🧠 OpenAI gpt-4o latency: 523ms
```

---

## Troubleshooting

### "No audio" on calls

1. Check ElevenLabs API key is valid
2. Verify WebSocket connection is established (check logs)
3. Ensure BASE_URL is correct (must match Twilio webhook URL)

### "AI not responding"

1. Check OpenAI API key
2. Verify Pinecone connection for RAG context
3. Check for errors in logs

### "Calendar not working"

1. Ensure WEB_APP_URL is set correctly
2. Verify the business has a calendar connection in Nango
3. Check calendar API endpoints are accessible

### WebSocket connection issues

1. Ensure your hosting supports WebSockets
2. Check that BASE_URL uses the correct protocol (wss:// for https://)
3. Railway/Render both support WebSockets by default

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
│  /webhook/twilio/voice                                      │
│       │                                                     │
│       ▼ (TwiML: connect to stream)                         │
│                                                             │
│  WebSocket /stream/{callSid}                                │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            WowVoicePipeline                          │   │
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

## Cost Estimates

Per minute of voice conversation:

| Service     | Cost/min | Notes                    |
|-------------|----------|--------------------------|
| Twilio      | ~$0.02   | Inbound + media streams  |
| Deepgram    | ~$0.01   | Nova-2 STT               |
| OpenAI      | ~$0.02   | GPT-4o (varies by usage) |
| ElevenLabs  | ~$0.02   | Multilingual v2          |
| **Total**   | ~$0.07   | Per minute               |

For 1,000 calls averaging 3 minutes: ~$210/month
