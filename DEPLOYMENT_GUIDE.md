# 🚀 Deployment Guide - Recepcionista.com

## Recommended Architecture

### **Best Option: Hybrid Approach**

```
┌─────────────────┐
│   Web App       │ → Vercel (Next.js)
│   (apps/web)    │   Free tier: $0/month
└─────────────────┘

┌─────────────────┐
│   Voice Service │ → Railway or Render
│   (apps/voice)   │   ~$5-20/month
└─────────────────┘

┌─────────────────┐
│   Database      │ → Neon (already using)
│   PostgreSQL    │   Free tier: $0/month
└─────────────────┘
```

---

## Platform Comparison

### 🏆 **Winner: Vercel (Web) + Railway (Voice)**

| Platform | Free Credits | Best For | Monthly Cost (after free) |
|----------|-------------|----------|--------------------------|
| **Vercel** | ✅ $0 forever (hobby) | Next.js web app | $0-20 |
| **Railway** | ✅ $5/month free | Voice service (WebSockets) | $5-20 |
| **Render** | ✅ $0 free tier | Voice service (alternative) | $7-25 |
| **AWS** | ✅ $300 credits (12 months) | Enterprise scale | $50-200+ |
| **Azure** | ✅ $200 credits (30 days) | Microsoft stack | $50-150+ |
| **Google Cloud** | ✅ $300 credits (90 days) | Big data/AI | $50-200+ |

---

## Detailed Breakdown

### 1. **Vercel** (Recommended for Web App) ⭐

**Why:**
- ✅ Made by Next.js creators - perfect integration
- ✅ **Free forever** for hobby projects
- ✅ Zero-config deployment
- ✅ Automatic HTTPS, CDN, edge functions
- ✅ Built-in analytics
- ✅ Preview deployments for every PR

**Free Tier Includes:**
- 100GB bandwidth/month
- Unlimited requests
- Automatic deployments
- Preview URLs
- Edge Functions

**Pricing:**
- **Hobby:** $0/month (perfect for MVP)
- **Pro:** $20/month (when you scale)

**Setup:**
```bash
# Just connect your GitHub repo
npm i -g vercel
vercel
```

**Best for:** Your `apps/web` Next.js application

---

### 2. **Railway** (Recommended for Voice Service) ⭐

**Why:**
- ✅ **$5/month free credit** (enough for MVP)
- ✅ Excellent WebSocket support
- ✅ Simple deployment (GitHub auto-deploy)
- ✅ Built-in PostgreSQL option
- ✅ Great for real-time services

**Free Tier:**
- $5/month credit
- 500 hours compute time
- 5GB storage

**Pricing:**
- **Starter:** $5/month (after free credit)
- Scales automatically

**Best for:** Your `apps/voice` WebSocket service

**Alternative:** Render.com ($7/month, similar features)

---

### 3. **AWS** (If You Need Enterprise Scale)

**Why:**
- ✅ **$300 free credits** for 12 months (startups)
- ✅ Most scalable
- ✅ Best for high traffic

**Free Tier (Always Free):**
- EC2 t2.micro (750 hours/month)
- RDS (20GB, 750 hours)
- Lambda (1M requests/month)

**Startup Credits:**
- Apply for AWS Activate: **$300-10,000 credits**
- Perfect for startups

**Pricing:**
- **After credits:** $50-200+/month
- More complex setup

**Best for:** When you need enterprise scale

**Setup Complexity:** ⚠️ High (need to configure VPC, load balancers, etc.)

---

### 4. **Azure** (If You Use Microsoft Stack)

**Why:**
- ✅ **$200 free credits** (30 days)
- ✅ Good for Microsoft integrations
- ✅ Startup program: **$120,000 credits**

**Free Tier:**
- App Service (limited)
- Functions (1M requests/month)

**Pricing:**
- **After credits:** $50-150+/month

**Best for:** If you're heavily Microsoft-integrated

---

### 5. **Google Cloud** (If You Need AI/ML)

**Why:**
- ✅ **$300 free credits** (90 days)
- ✅ Best for AI/ML workloads
- ✅ Startup program: **$100,000 credits**

**Free Tier:**
- Cloud Run (2M requests/month)
- Cloud Functions (2M invocations/month)

**Pricing:**
- **After credits:** $50-200+/month

**Best for:** Heavy AI/ML usage

---

## 🎯 **Recommended Setup for Recepcionista.com**

### Phase 1: MVP (Free/Cheap)

```
Web App (apps/web)     → Vercel Hobby        $0/month
Voice Service          → Railway Starter      $5/month
Database              → Neon Free            $0/month
─────────────────────────────────────────────────────
Total: $5/month
```

### Phase 2: Growth (After MVP)

```
Web App (apps/web)     → Vercel Pro          $20/month
Voice Service          → Railway Pro          $20/month
Database              → Neon Pro             $19/month
─────────────────────────────────────────────────────
Total: $59/month
```

### Phase 3: Scale (100+ customers)

```
Web App (apps/web)     → Vercel Enterprise   $100/month
Voice Service          → AWS ECS/Fargate     $100/month
Database              → Neon Scale           $50/month
─────────────────────────────────────────────────────
Total: $250/month
```

---

## 🚀 Quick Start: Deploy to Vercel (Web App)

### Step 1: Prepare for Deployment

Create `vercel.json` in `apps/web`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXTAUTH_URL": "@nextauth-url",
    "NEXTAUTH_SECRET": "@nextauth-secret"
  }
}
```

### Step 2: Deploy

```bash
cd apps/web
npm i -g vercel
vercel login
vercel --prod
```

### Step 3: Add Environment Variables

In Vercel dashboard → Settings → Environment Variables:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `OPENAI_API_KEY`
- `NANGO_SECRET_KEY`
- etc.

---

## 🎤 Quick Start: Deploy Voice Service to Railway

### Step 1: Create `railway.json`

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd apps/voice && bun dist/index.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Step 2: Deploy

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select your repo
4. Add environment variables
5. Deploy!

---

## 💰 Startup Credits Programs

### AWS Activate
- **Credits:** $300-10,000
- **Duration:** 12 months
- **Requirements:** Startup (YC, Techstars, etc.)
- **Apply:** [aws.amazon.com/activate](https://aws.amazon.com/activate)

### Azure for Startups
- **Credits:** $120,000
- **Duration:** 2 years
- **Requirements:** Partner program
- **Apply:** [azure.microsoft.com/startups](https://azure.microsoft.com/startups)

### Google Cloud for Startups
- **Credits:** $100,000
- **Duration:** 1 year
- **Requirements:** Accelerator/VC-backed
- **Apply:** [cloud.google.com/startup](https://cloud.google.com/startup)

---

## 📊 Cost Comparison (First Year)

| Setup | Month 1-3 | Month 4-12 | Year 1 Total |
|-------|-----------|------------|--------------|
| **Vercel + Railway** | $5 | $5 | **$60** |
| **AWS (with credits)** | $0 | $50 | **$450** |
| **Azure (with credits)** | $0 | $50 | **$450** |
| **GCP (with credits)** | $0 | $50 | **$450** |

**Winner:** Vercel + Railway = **$60/year** 🏆

---

## ✅ Final Recommendation

### **For Recepcionista.com:**

1. **Web App → Vercel** (Free tier is perfect)
   - Best Next.js support
   - Zero config
   - Free forever for MVP

2. **Voice Service → Railway** ($5/month)
   - Great WebSocket support
   - Simple deployment
   - Affordable

3. **Database → Neon** (Already using)
   - Free tier works great
   - Serverless PostgreSQL

**Total MVP Cost: $5/month** 💰

**When to upgrade:**
- Vercel Pro ($20/month) when you hit 100GB bandwidth
- Railway Pro ($20/month) when you need more resources
- Consider AWS if you get startup credits

---

## 🎯 Action Items

1. ✅ Deploy web app to Vercel (15 minutes)
2. ✅ Deploy voice service to Railway (15 minutes)
3. ✅ Apply for AWS Activate credits (optional, for future)
4. ✅ Set up monitoring (Vercel Analytics + Railway logs)

**Ready to deploy?** I can help you set up the deployment configs! 🚀
