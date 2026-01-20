# User Stories - Recepcionista.com

## Personas

### Primary: Business Owner (Ana)
- **Who:** Owner of a dental clinic in Madrid
- **Age:** 35-55
- **Tech-savvy:** Medium (uses WhatsApp, basic apps)
- **Pain points:** Missing calls, expensive receptionist, after-hours inquiries
- **Goals:** Never miss a lead, reduce costs, look professional

### Secondary: Staff/Receptionist (María)
- **Who:** Current receptionist at the clinic
- **Age:** 25-45
- **Tech-savvy:** Medium
- **Pain points:** Overwhelmed during peak hours, repetitive questions
- **Goals:** Focus on in-person patients, let AI handle routine calls

### Tertiary: End Customer (Carlos)
- **Who:** Patient trying to book an appointment
- **Age:** 18-70
- **Tech-savvy:** Varies
- **Pain points:** Busy signals, hold times, limited hours
- **Goals:** Quick appointment booking, get answers fast

---

## Phase 1 User Stories (MVP)

### Epic 1: Onboarding & Setup

#### US-1.1: Website-Based Learning
**As a** business owner  
**I want to** enter my website URL and have the AI learn about my business  
**So that** I don't have to manually enter all my business information

**Acceptance Criteria:**
- [ ] Can input website URL without https://
- [ ] AI extracts: business name, services, hours, contact info
- [ ] AI generates FAQ from website content
- [ ] Process completes in <30 seconds
- [ ] Can review and edit extracted information

**Status:** ✅ DONE

---

#### US-1.2: Voice Interview Onboarding
**As a** business owner  
**I want to** have a voice conversation with the AI to customize it  
**So that** it understands my specific business nuances

**Acceptance Criteria:**
- [ ] Voice interview in browser (no phone call needed)
- [ ] AI asks relevant questions about business
- [ ] Conversation in native Spanish (Spain)
- [ ] Can skip if pressed for time
- [ ] Information saved to business profile

**Status:** ✅ DONE

---

#### US-1.3: Quick Setup Flow
**As a** business owner  
**I want to** set up my AI receptionist in under 10 minutes  
**So that** I can start using it without a long onboarding process

**Acceptance Criteria:**
- [ ] Total setup time <10 minutes
- [ ] No technical knowledge required
- [ ] Clear progress indicators
- [ ] Can test AI before going live

**Status:** ✅ DONE

---

### Epic 2: Voice AI Calls

#### US-2.1: Answer Incoming Calls
**As a** business owner  
**I want** the AI to answer calls when I can't  
**So that** I never miss a potential customer

**Acceptance Criteria:**
- [ ] AI answers within 3 rings
- [ ] Natural Spanish greeting
- [ ] Handles basic inquiries (hours, location, services)
- [ ] Takes messages if needed
- [ ] Transfers to human for complex issues

**Status:** ⚠️ PARTIAL (voice pipeline built, needs production deployment)

---

#### US-2.2: Book Appointments via Phone
**As a** customer (Carlos)  
**I want to** book an appointment by phone with the AI  
**So that** I don't have to wait for a human

**Acceptance Criteria:**
- [ ] AI checks real-time calendar availability
- [ ] Offers available time slots
- [ ] Collects customer name and contact
- [ ] Confirms booking verbally
- [ ] Sends confirmation via WhatsApp/SMS

**Status:** ⚠️ PARTIAL (calendar integration done, booking flow needs testing)

---

#### US-2.3: Human Handoff
**As a** business owner  
**I want** the AI to transfer complex calls to me  
**So that** important customers get human attention

**Acceptance Criteria:**
- [ ] AI detects when it can't help (confidence threshold)
- [ ] Notifies owner via WhatsApp/SMS immediately
- [ ] Provides full context to human
- [ ] Customer can request human at any time
- [ ] Seamless transfer experience

**Status:** ❌ NOT STARTED (Phase 1 priority)

**Priority:** P0

---

### Epic 3: WhatsApp Integration

#### US-3.1: WhatsApp Conversations
**As a** customer (Carlos)  
**I want to** message the business on WhatsApp and get instant responses  
**So that** I can communicate in my preferred channel

**Acceptance Criteria:**
- [ ] AI responds to WhatsApp messages 24/7
- [ ] Same knowledge base as voice AI
- [ ] Handles FAQs, hours, services
- [ ] Natural conversational Spanish
- [ ] Response time <30 seconds

**Status:** ❌ NOT STARTED (Phase 1 priority)

**Priority:** P0

---

#### US-3.2: Book Appointments via WhatsApp
**As a** customer (Carlos)  
**I want to** book appointments through WhatsApp chat  
**So that** I can schedule without making a call

**Acceptance Criteria:**
- [ ] AI offers available time slots in chat
- [ ] Shows calendar widget or list
- [ ] Confirms booking with details
- [ ] Sends reminder 24h before
- [ ] Allows rescheduling via chat

**Status:** ❌ NOT STARTED (Phase 1 priority)

**Priority:** P0

---

#### US-3.3: Appointment Reminders
**As a** business owner  
**I want** the AI to send appointment reminders via WhatsApp  
**So that** I reduce no-shows

**Acceptance Criteria:**
- [ ] Automatic reminder 24h before
- [ ] Customer can confirm/cancel/reschedule
- [ ] Track confirmation status
- [ ] Alert owner of cancellations

**Status:** ❌ NOT STARTED

**Priority:** P1

---

### Epic 4: Dashboard & Management

#### US-4.1: View Call History
**As a** business owner  
**I want to** see all calls the AI has handled  
**So that** I can review what's happening with my customers

**Acceptance Criteria:**
- [ ] List of all calls with date/time
- [ ] Call duration and outcome
- [ ] Caller information (if captured)
- [ ] Filter by date range
- [ ] Search by caller or topic

**Status:** ✅ DONE (basic version)

---

#### US-4.2: View Upcoming Appointments
**As a** business owner  
**I want to** see all appointments booked by the AI  
**So that** I can prepare for my schedule

**Acceptance Criteria:**
- [ ] Calendar view of appointments
- [ ] Details: customer name, contact, service
- [ ] Sync with Google/Outlook calendar
- [ ] Edit/cancel from dashboard

**Status:** ✅ DONE (basic version)

---

#### US-4.3: Dashboard KPIs
**As a** business owner  
**I want to** see key metrics at a glance  
**So that** I understand the value of my AI receptionist

**Acceptance Criteria:**
- [ ] Total calls handled
- [ ] Appointments booked
- [ ] Messages received
- [ ] Time saved estimate
- [ ] Comparison to previous period

**Status:** ✅ DONE (basic version)

---

### Epic 5: Billing & Subscription

#### US-5.1: Subscribe to Plan
**As a** business owner  
**I want to** choose and pay for a subscription plan  
**So that** I can use the service

**Acceptance Criteria:**
- [ ] See pricing tiers clearly
- [ ] Secure payment (Stripe)
- [ ] Immediate access after payment
- [ ] Receipt via email
- [ ] Can upgrade/downgrade anytime

**Status:** ❌ NOT STARTED (Phase 1 priority)

**Priority:** P1

---

#### US-5.2: Manage Subscription
**As a** business owner  
**I want to** manage my subscription and billing  
**So that** I have control over my account

**Acceptance Criteria:**
- [ ] View current plan
- [ ] See usage this month
- [ ] Update payment method
- [ ] Cancel subscription
- [ ] Download invoices

**Status:** ❌ NOT STARTED

**Priority:** P1

---

## Phase 2 User Stories (Growth)

### Epic 6: Call Recording & Transcripts

#### US-6.1: Record All Calls
**As a** business owner  
**I want** all calls to be recorded  
**So that** I can review them for quality

**Acceptance Criteria:**
- [ ] All calls automatically recorded
- [ ] Stored securely (encrypted)
- [ ] Playback in dashboard
- [ ] Download option
- [ ] Retention policy (configurable)

**Status:** ❌ NOT STARTED

**Priority:** P1

---

#### US-6.2: Call Transcripts
**As a** business owner  
**I want** transcripts of all calls  
**So that** I can quickly review without listening

**Acceptance Criteria:**
- [ ] Automatic transcription
- [ ] Searchable text
- [ ] Speaker identification
- [ ] Highlight key moments
- [ ] Export as PDF

**Status:** ❌ NOT STARTED

**Priority:** P1

---

### Epic 7: Advanced Analytics

#### US-7.1: Call Analytics
**As a** business owner  
**I want** detailed analytics on my calls  
**So that** I can optimize my business

**Acceptance Criteria:**
- [ ] Calls by hour/day/week
- [ ] Peak hours visualization
- [ ] Call duration trends
- [ ] Outcome breakdown (booked, inquiry, missed)
- [ ] Export data

**Status:** ⚠️ PARTIAL (basic charts exist)

**Priority:** P1

---

#### US-7.2: Weekly Reports
**As a** business owner  
**I want** weekly email reports  
**So that** I stay informed without logging in

**Acceptance Criteria:**
- [ ] Summary of week's activity
- [ ] Key metrics comparison
- [ ] Notable events highlighted
- [ ] Actionable insights
- [ ] One-click to dashboard

**Status:** ❌ NOT STARTED

**Priority:** P2

---

### Epic 8: CRM Integration

#### US-8.1: Sync Contacts to CRM
**As a** business owner  
**I want** caller information synced to my CRM  
**So that** I have a complete customer record

**Acceptance Criteria:**
- [ ] Connect HubSpot/Pipedrive
- [ ] Create new contacts from calls
- [ ] Update existing contacts
- [ ] Log call activities
- [ ] Sync appointment data

**Status:** ❌ NOT STARTED

**Priority:** P2

---

## Phase 3 User Stories (Expansion)

### Epic 9: Multi-Language

#### US-9.1: Portuguese Support
**As a** business owner in Brazil  
**I want** the AI to speak Portuguese  
**So that** I can serve my customers in their language

**Acceptance Criteria:**
- [ ] Brazilian Portuguese voice
- [ ] Portuguese prompts and responses
- [ ] Brazil-specific templates
- [ ] Cultural context understanding

**Status:** ❌ NOT STARTED

**Priority:** P2

---

### Epic 10: Enterprise Features

#### US-10.1: Multi-Location
**As a** business owner with multiple locations  
**I want** to manage all locations from one account  
**So that** I have a unified view

**Acceptance Criteria:**
- [ ] Add multiple locations
- [ ] Per-location phone numbers
- [ ] Per-location settings
- [ ] Unified billing
- [ ] Cross-location analytics

**Status:** ❌ NOT STARTED

**Priority:** P2

---

#### US-10.2: Custom Voice
**As a** business owner  
**I want** a custom AI voice for my brand  
**So that** my receptionist sounds unique

**Acceptance Criteria:**
- [ ] Voice cloning from sample
- [ ] Quality assurance review
- [ ] A/B test with default voice
- [ ] Premium tier only

**Status:** ❌ NOT STARTED

**Priority:** P3

---

## Story Map Overview

```
                    PHASE 1 (MVP)              PHASE 2 (GROWTH)           PHASE 3 (EXPANSION)
                    ─────────────              ────────────────           ──────────────────
Onboarding          ✅ Website scrape          
                    ✅ Voice interview         
                    ✅ Quick setup             

Voice AI            ⚠️ Answer calls           ❌ Call recording          ❌ Custom voice
                    ⚠️ Book appointments      ❌ Transcripts             
                    ❌ Human handoff           

WhatsApp            ❌ Conversations          ❌ Campaigns               
                    ❌ Book appointments      ❌ Broadcast               
                    ❌ Reminders              

Dashboard           ✅ Call history            ❌ Advanced analytics     ❌ Multi-location
                    ✅ Appointments            ❌ Weekly reports         ❌ White-label
                    ✅ Basic KPIs              

Billing             ❌ Subscribe               ❌ Usage billing          ❌ Enterprise
                    ❌ Manage                 ❌ Invoices               

Integrations        ✅ Calendar                ❌ CRM (HubSpot)          ❌ Custom APIs
                                              ❌ CRM (Pipedrive)        
```

---

## Prioritization Matrix

| User Story | Impact | Effort | Priority | Phase |
|------------|--------|--------|----------|-------|
| US-3.1 WhatsApp Conversations | High | Medium | P0 | 1 |
| US-2.3 Human Handoff | High | High | P0 | 1 |
| US-3.2 WhatsApp Booking | High | Medium | P0 | 1 |
| US-5.1 Subscribe | High | Medium | P1 | 1 |
| US-6.1 Call Recording | Medium | Medium | P1 | 2 |
| US-6.2 Transcripts | Medium | Medium | P1 | 2 |
| US-7.1 Advanced Analytics | Medium | Medium | P1 | 2 |
| US-8.1 CRM Sync | Medium | Medium | P2 | 2 |
| US-9.1 Portuguese | Medium | Low | P2 | 3 |
| US-10.2 Custom Voice | Low | High | P3 | 3 |

---

*Last Updated: January 2026*
