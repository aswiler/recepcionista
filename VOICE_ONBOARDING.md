# Voice-First Onboarding - The WOW Experience

## The Vision

Instead of boring forms, the user **talks** to their new AI receptionist. The AI interviews them, learns about their business, and becomes ready to serve customers.

**This is your differentiator.**

---

## The Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ONBOARDING FLOW                              │
└─────────────────────────────────────────────────────────────────┘

Step 1: Sign Up (Web)
         │
         ▼
┌─────────────────┐
│  Enter website  │  (Optional)
│     URL         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Background:    │
│  Scrape website │  → Extract initial data
│  with Firecrawl │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  "Your AI is    │
│   ready to      │
│   interview     │
│   you!"         │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VOICE INTERVIEW                               │
│                                                                  │
│  AI: "¡Hola! Soy tu nueva recepcionista AI. He visto que       │
│       tienes una clínica dental. Me encantaría conocer más      │
│       sobre tu negocio para poder atender mejor a tus           │
│       clientes. ¿Tienes unos minutos para contarme?"            │
│                                                                  │
│  User: "Sí, claro..."                                           │
│                                                                  │
│  AI: "¡Perfecto! Veo que ofrecéis limpieza dental y            │
│       ortodoncia. ¿Qué otros servicios tenéis?"                 │
│                                                                  │
│  User: "También hacemos implantes, blanqueamiento..."           │
│                                                                  │
│  AI: "Excelente. ¿Cuál es vuestro horario de atención?"         │
│                                                                  │
│  [... conversation continues ...]                                │
│                                                                  │
│  AI: "¡Genial! Ya tengo todo lo que necesito. Ahora puedo      │
│       atender a tus clientes. ¿Quieres hacer una llamada        │
│       de prueba para ver cómo funciono?"                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  All conversation│
│  is transcribed  │
│  and indexed to │
│  Pinecone       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Dashboard:     │
│  Review & edit  │
│  your profile   │
└─────────────────┘
```

---

## Interview Topics

The AI dynamically asks about:

### 1. Core Business Info
- Business name (confirm from scrape)
- Type of business
- Location/addresses
- Contact info

### 2. Services
- What services do you offer?
- Prices (if comfortable sharing)
- Duration of services
- Most popular services

### 3. Hours & Availability
- Operating hours
- Days closed
- Holiday schedule
- Walk-ins vs appointments only

### 4. Appointment Handling
- How do you want appointments booked?
- How far in advance?
- Cancellation policy
- Emergency appointments?

### 5. Common Questions (FAQs)
- What do customers ask most often?
- Any special promotions?
- Parking information?
- Payment methods?

### 6. Escalation
- When should I transfer to a human?
- Who should I transfer to?
- Emergency contact?
- VIP customers?

### 7. Personality
- Formal or casual tone?
- Any phrases to use/avoid?
- Languages needed?

---

## Technical Implementation

### Interview Agent

```typescript
// The interview agent is different from the customer-facing agent
// It's designed to EXTRACT information, not provide it

const INTERVIEW_SYSTEM_PROMPT = `
Eres un agente de onboarding amigable para Recepcionista.com.
Tu objetivo es ENTREVISTAR al dueño del negocio para aprender todo 
lo necesario para atender a sus clientes.

INFORMACIÓN YA CONOCIDA (del sitio web):
{scraped_data}

TEMAS A CUBRIR:
1. Confirmar información básica
2. Servicios y precios
3. Horarios
4. Cómo manejar citas
5. Preguntas frecuentes
6. Cuándo transferir a humano

INSTRUCCIONES:
- Sé conversacional y amigable, no como un formulario
- Haz UNA pregunta a la vez
- Confirma información que ya tienes del sitio web
- Si el usuario no sabe algo, está bien, sigue adelante
- Resume lo aprendido al final
- Mantén la conversación en 5-10 minutos

NUNCA:
- Hacer preguntas que ya respondió
- Ser robótico o formal en exceso
- Pedir información personal sensible
`;
```

### Data Extraction

After the interview, we use GPT-4o to extract structured data:

```typescript
// Extract structured data from conversation transcript
const extractedData = await extractBusinessProfile(transcript);

// Structure:
{
  businessName: "Clínica Dental Sonrisas",
  businessType: "dental",
  services: [
    { name: "Limpieza dental", price: "60€", duration: "30min" },
    { name: "Blanqueamiento", price: "200€", duration: "1h" },
  ],
  hours: [
    { day: "Lunes-Viernes", open: "09:00", close: "20:00" },
    { day: "Sábados", open: "10:00", close: "14:00" },
  ],
  faqs: [
    { q: "¿Aceptáis seguros?", a: "Sí, trabajamos con Sanitas, Adeslas..." },
  ],
  transferRules: {
    urgencies: "+34 612 345 678",
    complexQuestions: "Transferir a recepción",
  },
  personality: {
    tone: "profesional pero cercano",
    language: "español de España",
  }
}
```

### Indexing to Pinecone

Every piece of information goes into the knowledge base:

```typescript
// Index all learned information
await indexBusinessContent(businessId, [
  `Servicios: Limpieza dental (60€, 30min), Blanqueamiento (200€, 1h)...`,
  `Horario: Lunes a Viernes de 9 a 20, Sábados de 10 a 14`,
  `Seguros: Aceptamos Sanitas, Adeslas, Mapfre...`,
  // ... more
], 'voice_onboarding');
```

---

## The Experience

### Web UI During Interview

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   🎤 Entrevista en curso...                                     │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                          │   │
│   │         [Visualización de onda de audio]                │   │
│   │                                                          │   │
│   │              🔴 Grabando...                              │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   Tu AI está aprendiendo sobre tu negocio...                    │
│                                                                  │
│   ✓ Nombre del negocio                                          │
│   ✓ Servicios principales                                        │
│   ○ Horarios                                                     │
│   ○ Preguntas frecuentes                                         │
│   ○ Reglas de transferencia                                      │
│                                                                  │
│   [Terminar entrevista]                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Post-Interview Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   ✅ ¡Tu recepcionista está lista!                              │
│                                                                  │
│   Aprendí esto sobre tu negocio:                                │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ SERVICIOS                                    [Editar]    │   │
│   │ • Limpieza dental - 60€ (30min)                         │   │
│   │ • Blanqueamiento - 200€ (1h)                            │   │
│   │ • Ortodoncia - Consultar                                │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ HORARIOS                                     [Editar]    │   │
│   │ Lun-Vie: 9:00 - 20:00                                   │   │
│   │ Sábados: 10:00 - 14:00                                   │   │
│   │ Domingos: Cerrado                                        │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   [🎤 Añadir más información por voz]                           │
│                                                                  │
│   [📞 Hacer llamada de prueba]                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Why This is WOW

1. **No forms** - Users hate forms. Talking is natural.

2. **Immediate value** - AI is ready in 5 minutes, not hours.

3. **Personal connection** - User feels like they're training a real employee.

4. **Better data** - Conversations reveal more than form fields.

5. **Differentiator** - No competitor does this.

6. **Demo of quality** - User experiences the voice quality before paying.

---

## Implementation Priority

### Phase 1: MVP Interview
- [ ] Basic interview flow (5 key questions)
- [ ] Transcript → Pinecone indexing
- [ ] Simple dashboard showing learned info

### Phase 2: Smart Interview
- [ ] Dynamic questions based on scrape data
- [ ] Skip known information
- [ ] Better extraction with GPT-4o

### Phase 3: Polish
- [ ] Progress indicators
- [ ] Voice selection during interview
- [ ] "Add more info" voice feature
- [ ] Test call feature

---

## Files to Create

```
apps/
├── web/
│   ├── app/
│   │   ├── onboarding/
│   │   │   ├── page.tsx           # Start onboarding
│   │   │   ├── interview/
│   │   │   │   └── page.tsx       # Voice interview UI
│   │   │   └── complete/
│   │   │       └── page.tsx       # Review learned info
│   │   └── api/
│   │       └── onboarding/
│   │           ├── scrape/route.ts    # Scrape website
│   │           ├── start/route.ts     # Start interview call
│   │           └── complete/route.ts  # Extract & index
│   └── lib/
│       └── ai/
│           └── interview-agent.ts # Interview logic
│
└── voice/
    └── src/
        └── agents/
            └── interview-agent.ts # Voice interview agent
```
