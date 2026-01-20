# Product Roadmap - Recepcionista.com

## Current State Assessment

### What's Built (January 2026)

| Feature | Status | Quality |
|---------|--------|---------|
| Web scraping onboarding | ✅ Done | Good - 3 fallback layers |
| Voice interview (browser) | ✅ Done | Good - ElevenLabs TTS |
| Dashboard (basic) | ✅ Done | Good - KPIs, calls, appointments |
| Calendar integration | ✅ Done | Good - Nango (Google/Outlook) |
| WhatsApp webhook | ⚠️ Partial | Structure only, no AI |
| Voice AI pipeline | ⚠️ Partial | Basic orchestration |
| Authentication | ✅ Done | Google/Microsoft OAuth |
| Database schema | ✅ Done | Drizzle + Neon |

### What's Missing (Gap Analysis)

| Feature | Priority | Complexity | Business Impact |
|---------|----------|------------|-----------------|
| WhatsApp conversational AI | P0 | Medium | Critical for LatAm |
| Human handoff system | P0 | High | Parity with Smith.ai |
| Stripe billing | P1 | Medium | Revenue enablement |
| Call recording storage | P1 | Medium | Quality assurance |
| Production deployment | P1 | Low | Go live |
| CRM integrations | P2 | Medium | Enterprise sales |
| Portuguese support | P2 | Low | Brazil expansion |
| Custom voice training | P3 | High | Premium tier |

---

## Phased Roadmap

```
2026                                           2027
Q1          Q2          Q3          Q4         Q1-Q2
|-----------|-----------|-----------|----------|-----------|
  Phase 1      Phase 2      Phase 2     Phase 3    Phase 3
  MVP          Growth       Growth      Expand     Expand
  Launch       Features     Scale       Mexico     Brazil
```

---

## Phase 1: MVP Launch (Q1 2026)

**Goal:** First 100 paying customers in Spain

**Timeline:** 6-8 weeks

### P0 Features (Must Have)

#### 1.1 WhatsApp Conversational AI
**Why:** 92% of LatAm consumers message via WhatsApp. Key differentiator.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  WhatsApp API   │────▶│  AI Brain       │────▶│  Response       │
│  (Meta Cloud)   │     │  (Same as Voice)│     │  + Actions      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Tasks:**
- [ ] Connect Meta WhatsApp Business API
- [ ] Route messages to existing AI brain
- [ ] Handle appointment booking via chat
- [ ] Send confirmations/reminders
- [ ] Store conversation history

**Effort:** 2 weeks

#### 1.2 Human Handoff System
**Why:** Smith.ai's key feature. Handles edge cases AI can't.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  AI Detects     │────▶│  Handoff UI     │────▶│  Human Agent    │
│  Complexity     │     │  (Dashboard)    │     │  Takes Over     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Tasks:**
- [ ] AI confidence scoring (when to escalate)
- [ ] Real-time notification to owner (WhatsApp/SMS)
- [ ] Handoff dashboard with full context
- [ ] Call transfer or callback system
- [ ] Conversation summary for human

**Effort:** 3 weeks

#### 1.3 Stripe Billing Integration
**Why:** Can't get paid without it.

**Tasks:**
- [ ] Stripe Checkout integration
- [ ] Subscription management (3 tiers)
- [ ] Usage-based billing for WhatsApp
- [ ] Customer portal (manage subscription)
- [ ] Invoices and receipts

**Effort:** 1 week

#### 1.4 Production Deployment
**Why:** Can't sell a localhost demo.

**Tasks:**
- [ ] Deploy web app to Vercel
- [ ] Deploy voice service to Railway
- [ ] Set up domain (recepcionista.com)
- [ ] SSL certificates (automatic)
- [ ] Environment variables in production

**Effort:** 1 day

### Phase 1 Success Criteria
- [ ] 10 beta customers (free)
- [ ] 100 paying customers ($4,900+ MRR)
- [ ] <5% churn in first month
- [ ] WhatsApp + Voice working in production

---

## Phase 2: Growth Features (Q2-Q3 2026)

**Goal:** Scale to 1,000 customers, $50K MRR

**Timeline:** 4-5 months

### P1 Features

#### 2.1 Call Recording & Transcripts
**Why:** Quality assurance, training, compliance.

**Tasks:**
- [ ] Record all calls (Twilio recording)
- [ ] Store in S3/Cloudflare R2
- [ ] Transcribe with Deepgram
- [ ] Display in dashboard
- [ ] Search/filter transcripts
- [ ] Export functionality

**Effort:** 2 weeks

#### 2.2 Advanced Analytics Dashboard
**Why:** Business owners need insights to see value.

**Metrics to track:**
- Calls handled vs missed
- Peak call times
- Average call duration
- Appointment conversion rate
- Customer satisfaction (post-call survey)
- AI vs human handoff ratio

**Tasks:**
- [ ] Time-series charts (calls over time)
- [ ] Conversion funnel visualization
- [ ] Peak hours heatmap
- [ ] Weekly email reports
- [ ] Export to CSV/PDF

**Effort:** 2 weeks

#### 2.3 CRM Integrations
**Why:** Enterprise customers expect CRM sync.

**Integrations (via Nango):**
- [ ] HubSpot
- [ ] Pipedrive
- [ ] Salesforce (enterprise)
- [ ] Zoho CRM

**Tasks:**
- [ ] Create/update contacts from calls
- [ ] Log call activities
- [ ] Sync appointment data
- [ ] Lead scoring integration

**Effort:** 3 weeks

#### 2.4 Multi-Location Support
**Why:** Growing businesses have multiple locations.

**Tasks:**
- [ ] Location-based routing
- [ ] Per-location settings
- [ ] Per-location analytics
- [ ] Unified billing

**Effort:** 2 weeks

### Phase 2 Success Criteria
- [ ] 1,000 paying customers
- [ ] $50K MRR
- [ ] 3+ CRM integrations live
- [ ] <5% monthly churn

---

## Phase 3: Expansion (Q4 2026 - 2027)

**Goal:** Mexico & Brazil, 10,000 customers

**Timeline:** 6-9 months

### P2 Features

#### 3.1 Portuguese Language Support
**Why:** Brazil = 200M+ people, massive WhatsApp usage.

**Tasks:**
- [ ] Portuguese AI prompts
- [ ] Portuguese voice (ElevenLabs)
- [ ] Brazil-specific templates
- [ ] Local payment methods (PIX)

**Effort:** 3 weeks

#### 3.2 Custom Voice Training
**Why:** Premium tier ($499+), differentiation.

**Tasks:**
- [ ] Voice cloning workflow
- [ ] Custom persona training
- [ ] Industry-specific knowledge
- [ ] Quality assurance process

**Effort:** 4 weeks

#### 3.3 Enterprise Features
**Why:** Larger deals, lower churn.

**Tasks:**
- [ ] SSO (SAML/OAuth)
- [ ] Audit logs
- [ ] Role-based access control
- [ ] SLA guarantees
- [ ] Dedicated support

**Effort:** 4 weeks

#### 3.4 Mexico Localization
**Why:** Largest Spanish-speaking market.

**Tasks:**
- [ ] Mexican Spanish variants
- [ ] Local phone numbers (Twilio)
- [ ] CFDI invoicing (Mexico tax)
- [ ] Local payment methods

**Effort:** 2 weeks

### Phase 3 Success Criteria
- [ ] 10,000 paying customers
- [ ] $500K MRR
- [ ] 3 countries (Spain, Mexico, Brazil)
- [ ] Enterprise tier with 5+ customers

---

## Technical Debt & Infrastructure

### Q1 2026 (During Phase 1)
- [ ] Add proper error handling throughout
- [ ] Implement rate limiting
- [ ] Add request logging/monitoring
- [ ] Set up Sentry for error tracking

### Q2 2026 (During Phase 2)
- [ ] Database indexing optimization
- [ ] Caching layer (Redis)
- [ ] CDN for static assets
- [ ] Load testing

### Q3-Q4 2026 (During Phase 3)
- [ ] Multi-region deployment
- [ ] Database read replicas
- [ ] Auto-scaling configuration
- [ ] Disaster recovery plan

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| WhatsApp API approval delay | Medium | High | Start process early, have SMS fallback |
| Competitor enters Spain | Low | High | Move fast, build brand loyalty |
| AI hallucination issues | Medium | Medium | Strict prompts, human handoff |
| Twilio costs spike | Low | Medium | Negotiate volume pricing |
| Stripe payment failures | Low | Medium | Multiple payment methods |

---

## Team Scaling Plan

| Phase | Team Size | Roles |
|-------|-----------|-------|
| Phase 1 | 1-2 | Founder + AI tools |
| Phase 2 | 3-4 | + 1 engineer, 1 customer success |
| Phase 3 | 6-8 | + 2 engineers, 1 sales, 1 ops |

---

## Budget Projections

### Phase 1 Costs (Monthly)
| Item | Cost |
|------|------|
| Vercel | $0-20 |
| Railway | $5-20 |
| Neon DB | $0-19 |
| Twilio | $50-200 |
| OpenAI | $50-200 |
| ElevenLabs | $22-99 |
| **Total** | **$130-560** |

### Phase 2 Costs (Monthly)
| Item | Cost |
|------|------|
| Infrastructure | $200-500 |
| APIs (scaled) | $500-1,500 |
| Tools/SaaS | $200-500 |
| **Total** | **$900-2,500** |

---

## Key Milestones

| Date | Milestone | Success Metric |
|------|-----------|----------------|
| Feb 2026 | MVP Launch | 10 beta users |
| Mar 2026 | First Revenue | 50 paying customers |
| Apr 2026 | Product-Market Fit | 100 customers, <5% churn |
| Jun 2026 | Growth Mode | 500 customers |
| Sep 2026 | Series Ready | 1,000 customers, $50K MRR |
| Dec 2026 | Mexico Launch | First Mexican customers |
| Mar 2027 | Brazil Launch | Portuguese live |
| Jun 2027 | Scale | 10,000 customers |

---

*Last Updated: January 2026*
*Next Review: Monthly*
