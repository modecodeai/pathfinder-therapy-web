# Google Ads copy guidelines — Pathfinder Therapy (.com)

Use this document when writing or editing Search campaigns in Google Ads for **pathfindertherapy.com**. Copy must match the live website and fee structure. Misleading claims hurt ad quality, waste spend, and erode trust.

**Google Ads account:** `AW-10976126920`  
**Site tag:** Already installed via build (`scripts/site-google-ads.mjs`) — do **not** paste the gtag snippet again in Google Ads.

**Ads not converting?** See [`docs/google-ads-optimization.md`](google-ads-optimization.md) — negative keywords, English-only targeting, landing URLs, conversion setup.

---

## Fee structure (source of truth)

| Item | Price | Notes |
|------|-------|-------|
| **Initial Zoom consultation** | Free / no charge | 15–30 min conversation to see if therapy is a fit — booked at `/book/` |
| **Individual therapy session** | **From €75** | 50 minutes — see `/fees/` |
| **Couples therapy session** | Discussed on enquiry | See `/fees/` |
| **Ongoing sessions** | From €75 | Fees confirmed before work begins |

The **initial consultation call is free**. **Therapy sessions are not free.**

---

## Approved wording

Use these phrases in headlines and descriptions:

- **Book a free initial Zoom call**
- **Free initial consultation call**
- **Arrange an initial consultation**
- **English-speaking therapist in Lisbon**
- **Trauma-informed psychotherapy · Lisbon & online**
- **Sessions from €75**
- **In person in Lisbon or securely online**
- **EATA registered · confidential**
- **Non-urgent enquiries only**

---

## Do not use (prohibited / misleading)

| Avoid | Why | Use instead |
|-------|-----|-------------|
| **First session free** | Therapy sessions cost from €75 | **Free initial Zoom call** |
| **Free therapy** | Misleading — only the intro call is free | **Free initial consultation call** |
| **Free counselling sessions** | Same | **Sessions from €75** |
| **Book a free session** | Ambiguous — sounds like free therapy | **Book a free initial Zoom call** |
| **100% free** | Overstates what is free | **Free initial consultation · sessions from €75** |
| **Cheap / cheapest therapist** | Unprofessional; may violate healthcare ad policies | **Sessions from €75** |
| **Cure / guaranteed results** | Not clinically accurate | **Trauma-informed support** |
| **Emergency / crisis service** | Site explicitly says non-urgent only | **Non-urgent enquiries · see crisis support page** |
| **Psychiatrist / medical doctor** | Brent is a psychotherapist, not a psychiatrist | **Therapist / psychotherapist** |

If Google auto-suggests copy containing “First Session Free”, **reject or edit it** before publishing.

---

## Responsive Search Ad templates

### Campaign: Trauma-Informed Therapy (Lisbon)

**Final URL (default):** `https://www.pathfindertherapy.com/psychotherapy-lisbon/`  
**Path:** `Lisbon` / `Therapy`

**Headlines (pick 8–15, max 30 chars each where possible):**

```
English Therapist Lisbon
Trauma Therapy Lisbon
Book Free Initial Zoom Call
Psychotherapy Lisbon
EMDR Therapist Lisbon
Sessions From €75
Lisbon Clinic & Online
Trauma-Informed Therapy
Arrange Initial Consultation
English-Speaking Therapist
Confidential · EATA Registered
Adults & Couples Welcome
Feeling Overwhelmed?
Regain Stability & Clarity
```

**Descriptions (pick 3–4, max 90 chars):**

```
Confidential psychotherapy for stress, trauma & life transitions. English-speaking.
Book a free initial Zoom call. Sessions from €75 · Lisbon clinic or secure online.
Trauma-informed therapy with Brent Kelly in Lisbon. EATA registered. Enquire today.
Non-urgent enquiries only. Free initial consultation call · ongoing sessions from €75.
```

### Ad group: EMDR / trauma (optional)

**Final URL:** `https://www.pathfindertherapy.com/trauma-therapy-lisbon/`  
**Path:** `Trauma` / `Lisbon`

### Ad group: English-speaking / expats (optional)

**Final URL:** `https://www.pathfindertherapy.com/english-speaking-therapist-lisbon/`

---

## Landing pages by intent

| User intent | Final URL | Notes |
|-------------|-----------|-------|
| Brand / general | `https://www.pathfindertherapy.com/` | Homepage |
| Lisbon psychotherapy | `https://www.pathfindertherapy.com/psychotherapy-lisbon/` | Best for local keywords |
| Trauma | `https://www.pathfindertherapy.com/trauma-therapy-lisbon/` | |
| EMDR | `https://www.pathfindertherapy.com/emdr-therapy-lisbon/` | |
| English-speaking / expats | `https://www.pathfindertherapy.com/english-speaking-therapist-lisbon/` | |
| Enquiry form funnel | `https://www.pathfindertherapy.com/start/` | noindex — use only if testing form-led campaigns |
| Direct booking | `https://www.pathfindertherapy.com/book/` | Calendly — good for high-intent “book” queries |

Prefer **indexable geo landing pages** for location + service keywords. Use `/start/` only for dedicated form campaigns (page is `noindex`).

---

## Conversions (must match site)

Configure in Google Ads → **Goals → Conversions**. The site fires tags automatically; do not duplicate the global snippet.

| Conversion | Trigger URL | GitHub secret (label) |
|------------|-------------|------------------------|
| Lead form submitted | `/thank-you/` | `PATHFINDER_GOOGLE_ADS_LEAD_LABEL` |
| Zoom consultation booked | `/book-confirmed/` | `PATHFINDER_GOOGLE_ADS_BOOKING_LABEL` |
| Phone call (optional) | Click-to-call | `phone` (default in build) |

**Page-load conversions:** Create URL-based conversions in Google Ads for `/thank-you/` and `/book-confirmed/` and click **Confirm** when asked about the tag (site already has it).

**Do not create** broken combined conversions like `thank-you/book-confirmed`.

---

## Google Business Profile alignment

Keep ads and GBP consistent with the website. **Full copy-paste GBP description and services:** [`docs/google-business-profile.md`](google-business-profile.md)

| Field | Correct value |
|-------|---------------|
| Business name | **Pathfinder Therapy** (prefer over “Pathfinder Psychotherapy” if that is the trading name) |
| Address | R. Rodrigues Sampaio 76 1º Andar, 1150-281 Lisboa |
| Phone | +351 914 775 365 |
| Website | `https://www.pathfindertherapy.com/psychotherapy-lisbon/` |
| Booking link | `https://www.pathfindertherapy.com/book/` |
| Category | Psychotherapist |

---

## Pre-publish checklist

Before saving any ad or asset:

- [ ] No “first session free” or “free therapy session” language
- [ ] “Free” only refers to the **initial Zoom consultation call**
- [ ] “From €75” included where space allows (or visible on landing page above the fold)
- [ ] Final URL matches ad intent (geo page for local keywords)
- [ ] Display path readable (`Lisbon`, `Therapy`, etc.)
- [ ] “Non-urgent” implied or stated for healthcare appropriateness
- [ ] No crisis/emergency claims

---

## Fixing live ads (action required)

If an active ad shows **“First Session Free”** or **“Book a free consultation… First Session Free”**:

1. Google Ads → **Campaigns → Trauma-Informed Therapy → Ads & assets**
2. Edit the responsive search ad
3. Remove or replace headlines/descriptions that mention free sessions
4. Use approved copy from the templates above
5. Save and allow 24–48h for policy/review refresh

---

## Related repo files

| File | Purpose |
|------|---------|
| `scripts/site-google-ads.mjs` | gtag, conversion helpers, build logging |
| `scripts/site-cookie-consent.mjs` | Consent Mode v2 (required before ads fire in EU) |
| `.github/workflows/deploy-production.yml` | Conversion label secrets at deploy |
| `wrangler.toml` | Documents conversion label env vars |
