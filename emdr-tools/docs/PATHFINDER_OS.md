# Pathfinder OS — Client Journey Architecture v0.1

**Organisation:** Pathfinder Therapy  
**Clinical core:** Pathfinder Clinical (`emdr-tools`)  
**Principle:** The public website, booking, intake, payments and clinical workspace are stages in **one continuous client journey**.

---

## PATHFINDER OS PRINCIPLE

Information should be captured once, stored securely, and reused appropriately.

- The **client** experiences simplicity.
- The **therapist** experiences continuity.
- Pathfinder manages the complexity between them.

---

## Two product surfaces

| Surface | Audience | Routes (logical) | Permission |
|---------|----------|------------------|------------|
| **A. Client-facing Pathfinder** | Public + portal | `/`, `/services`, `/book`, `/portal/*` | Public / `role: client` |
| **B. Clinician-facing Pathfinder Clinical** | Therapists | `/` (app), `/clients`, `/practice`, `/knowledge`, `/settings` | `role: therapist` / `admin` |

They share backend identity and the same `ClientRecord` / appointment stores. Interfaces and permissions differ.

Existing clinician URLs remain during migration. Public marketing on `pathfindertherapy.com` may deep-link into Clinical `/book` and `/portal`.

---

## End-to-end journey

```
PUBLIC FRONT END
  → BOOKING
  → CLIENT / PROSPECT RECORD
  → INTAKE
  → PAYMENT
  → APPOINTMENT
  → PATHFINDER CLINICAL
```

**First implementable milestone (this sprint):**

```
Book Appointment
  → Create/link client (secure id — never email as PK)
  → Appointment stored
  → Intake requested / opened
  → Completed intake stored on same client
  → Therapist dashboard: Intake awaiting review
```

AI findings are **not** auto-written into the clinical record on intake submit. Flow remains:

```
Intake submitted → Core Clinical Reasoning (pending) → Therapist review → Approved formulation
```

Core only unless a primary approach was already explicitly chosen. No automatic EMDR interpretation.

---

## Data model (canonical)

See TypeScript: `src/os/types.ts`.

### ServiceDefinition

Duration, price, location options, therapist availability hooks, payment requirement, intake requirement, remote-session capability. **Configured in data** (`src/os/serviceCatalog.ts`) — not hard-coded inside UI widgets.

### Appointment

Scheduled encounter — **not** identical to a Clinical Session.

```
Appointment {
  id, clientId, therapistId, serviceId,
  startsAt, endsAt, timezone,
  locationType, location?,
  status, paymentStatus, intakeStatus,
  remoteSessionId?, clinicalSessionId?,
  bookingSource, accessToken?
}
```

### Clinical Session

Created when therapy begins (`[Start Session]` from an appointment). Prep → Practice → Transcript → Clinical Reasoning → Debrief.

One appointment may cancel / no-show / reschedule without a completed clinical session.

### Client / Prospect

Same `clients` table; `recordKind: 'prospect' | 'client'`. Contact fields (`email`, `phone`) are searchable for safe matching — **never** the primary key.

### Consent

Versioned: `{ version, policyVersion, timestamp, clientId, formId }` — not a forever boolean.

---

## Provider abstractions

Keep finance, calendar and messaging behind interfaces (`src/os/providers.ts`):

| Abstraction | Stage 1 | Future |
|-------------|---------|--------|
| `BillingProvider` | Stub / manual | Stripe, MB WAY |
| `InvoiceProvider` | Stub | InvoiceXpress / PT providers |
| `CalendarProvider` | Calendly embed + webhook bridge | Native availability + Google Calendar |
| `RemoteSessionProvider` | Existing room links | Zoom etc. |
| `MessagingProvider` | Stub hooks | Email, SMS, WhatsApp |

**Do not** hard-code InvoiceXpress or Stripe into clinical modules.

---

## Calendly migration (phased)

| Stage | Behaviour |
|-------|-----------|
| **1** | Pathfinder displays / embeds existing Calendly (`pathfindertherapy.com/book/`). Do not break live bookings. |
| **2** | Pathfinder receives booking events (webhook → `/api/os/booking/calendly`) and **owns** client + appointment records. |
| **3** | Pathfinder runs native availability and booking (`/book` wizard). Calendly optional fallback. |

Current Next.js Calendly webhook: `functions/api/calendly-webhook.js` (email notify). Stage 2 bridges into AccountDirectory appointments without removing Calendly.

---

## Intake integration plan

1. Existing Pathfinder intake clinical content stays — mapped to `ClientIntakeRecord` / structured fields (`src/clinical-intelligence/lib/intake.ts`).
2. Portal submit attaches `{ clientId, intakeId, submittedAt, version }` and preserves **raw** submission.
3. Status enum: `not-requested` → `requested` → `opened` → `partially-completed` → `submitted` → `reviewed`.
4. Therapist dashboard surfaces **Intake awaiting review**.
5. After therapist approval of core findings → First Session Preparation (pre-session information from client intake).

---

## Security boundary

- Roles enforced **server-side**: `client` | `therapist` | `admin`.
- Portal tokens grant intake/appointment access for that record only.
- Client portal users must never reach clinician routes by URL manipulation.
- Clinical formulation, therapist notes and AI reasoning are **not** exposed to clients by default.

---

## Route map (this sprint)

### Public (warm brand)

- `/public` — Pathfinder client-facing home shell  
- `/services` — service catalogue (from data)  
- `/therapists` — therapist directory shell  
- `/book` — booking wizard (Stage 3 shell; Stage 1 can still embed Calendly)  
- `/book/confirmed` — confirmation + Complete Intake CTA  

### Client portal

- `/portal` — overview  
- `/portal/appointments`  
- `/portal/intake` — complete intake for linked appointment  
- `/portal/payments` — shell  

### Clinician (existing + OS)

- `/` Dashboard — TODAY + New Client / New Appointment  
- `/clients`, `/practice`, `/knowledge`, `/settings`  

---

## Communication event hooks

`booking.confirmed` · `intake.reminder` · `appointment.reminder` · `payment.confirmed` · `appointment.rescheduled` · `appointment.cancelled` · `remote_session.link`  

Delivered via `MessagingProvider` (stub logs / future channels).

---

## What this sprint does **not** replace

Calendly · Stripe · InvoiceXpress · Google Calendar — until native equivalents are ready and tested.
