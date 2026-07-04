# Google Ads optimization — ads not converting

Diagnosis for **Trauma-Informed Therapy** campaign (account `AW-10976126920`).  
£195 spend with clicks on **Portuguese, free, and irrelevant** queries is the main problem — not necessarily that the site is broken.

---

## What your search terms report shows

| Search term | Problem |
|-------------|---------|
| clínica para depressão **gratuita** | Portuguese · wants **free** public care |
| **psiquiatria** near me | Wants a **psychiatrist** (medical), not psychotherapist |
| **psicologa** | Portuguese · no “English” signal |
| mind project / fredy vinagre | Irrelevant brand/person searches |
| (implicit) | No English therapist intent |

**Brent offers:** private English-speaking psychotherapy from **€75** — not free Portuguese psychiatry or SNS/public clinics.

You are paying for clicks from people who will **never** book.

---

## Fix order (do today)

### 1. Add negative keywords (Campaign → Keywords → Negative keywords)

Paste as **Account-level** or **Campaign-level** negatives:

```
gratuita
gratuito
grátis
gratis
free
psicologa
psicologo
psicóloga
psicólogo
psiquiatra
psiquiatria
psiquiatria near me
clinica
clínica
depressão
depressao
sns
subsídio
subsidio
publico
público
hospital
urgente
emergencia
emergência
fredy vinagre
vinagre
mind project
psychiatrist
psychiatry
volunteer
internship
curso
formation
training course
cheap
barato
nhs
```

Review **Search terms** weekly and add new junk terms as negatives.

---

### 2. Restrict language to English

**Campaign → Settings → Languages**

- Set to **English** only (remove “All languages” / Portuguese).

This alone cuts most `psicologa` / `clínica gratuita` waste.

---

### 3. Tighten location (optional)

Current: **64 km** radius.

Try: **25–35 km** centred on the clinic, or **Lisboa** + nearby municipalities only — unless you actively want Alentejo/Porto drive-ins.

---

### 4. Turn off low-quality networks

**Campaign → Settings → Networks**

- [ ] **Google Search Partners** → Off (test 2 weeks)
- [ ] Ensure this is **Search only** — not Display

---

### 5. Replace broad keywords with English phrase/exact

**Pause** any **Broad match** keywords.

**Add** (Phrase match — use quotes in Google Ads):

```
"english therapist lisbon"
"english speaking therapist lisbon"
"psychotherapist lisbon"
"therapy in english lisbon"
"trauma therapy lisbon"
"emdr therapist lisbon"
"private therapist lisbon"
"couples therapy lisbon"
"expat therapist lisbon"
"english counselling lisbon"
```

**Exact match** (high intent, lower volume):

```
[english therapist lisbon]
[psychotherapist lisbon]
[trauma therapy lisbon]
[book therapist lisbon]
```

---

### 6. Change landing page URL

**Current:** `www.pathfindertherapy.com` (homepage)  
**Better:** `https://www.pathfindertherapy.com/psychotherapy-lisbon/`

For “book” intent tests: `https://www.pathfindertherapy.com/book/`

Edit each ad → **Final URL** → geo landing page. Aligns ad promise with page (English · Lisbon · €75).

---

### 7. Update ad copy (filter free-seekers)

Remove vague “Book a free consultation” without context.

**Use descriptions like:**

```
English-speaking therapist in Lisbon. Sessions from €75. Private psychotherapy.
Free initial Zoom call only — not free therapy. Book online or enquire today.
Trauma-informed · EMDR · adults & couples · Lisbon clinic or secure online.
```

Add headline: **`English Only · From €75`**

See [`google-ads-copy.md`](google-ads-copy.md).

---

### 8. Fix conversion tracking (critical)

Live site currently has **empty conversion labels**:

```javascript
var LEAD = ""
var BOOKING = ""
```

So **tag-based** conversions from the site code do **not** fire until GitHub secrets are set.

#### Option A — URL conversions in Google Ads (fastest)

1. **Goals → Conversions → New conversion action → Website**
2. Create two actions:

| Name | URL rule | Count |
|------|----------|-------|
| Lead form submitted | URL contains `/thank-you/` | One |
| Zoom call booked | URL contains `/book-confirmed/` | One |

3. When asked about the tag → **Confirm** (tag already on site)
4. Mark both as **Primary** conversion actions for this campaign

#### Option B — GitHub secrets (tag events)

In GitHub repo → **Settings → Secrets → Actions**:

| Secret | Value |
|--------|-------|
| `PATHFINDER_GOOGLE_ADS_LEAD_LABEL` | Label from Google Ads conversion for `/thank-you/` |
| `PATHFINDER_GOOGLE_ADS_BOOKING_LABEL` | Label from Google Ads conversion for `/book-confirmed/` |

Redeploy (push to `main`). Verify live page shows `var LEAD = "AW-10976126920/xxxxx"`.

#### Consent note (EU)

Conversions only fire fully after users click **Accept analytics** on the cookie banner. Some loss is normal in Portugal/EU. Do not remove consent mode.

---

### 9. Review call / directions extensions

Your ads show **Get directions** and **Call business**.

- Clicks may be curiosity (maps/calls) not bookings
- If phone calls are valuable, track them as a separate conversion
- If not, **pause** location/call extensions for 2 weeks and compare cost per **website** conversion

---

## Realistic expectations

| Metric | Rough private therapy benchmark |
|--------|----------------------------------|
| Search CTR | 3–8% (English niche) |
| Landing page → enquiry | 2–5% |
| Cost per lead | £30–£80 (varies) |
| Time to first conversion | 2–4 weeks after targeting fix |

With ~£195 spent mostly on **wrong traffic**, zero conversions is expected — not proof the offer fails.

---

## 2-week test plan

After changes above:

1. **Budget:** Keep ~£10/day — do not scale until conversions appear
2. **Monitor:** Search terms report every 3 days → add negatives
3. **Success:** 1–3 tracked conversions (form or Calendly) in 14 days
4. **If still zero clicks on good terms:** Improve ad rank (Quality Score) — geo landing page + English keywords + negative list
5. **If clicks but no conversions:** Test final URL `/book/` vs `/psychotherapy-lisbon/`

---

## Campaign settings checklist

- [ ] Language: **English only**
- [ ] Network: **Search only** (partners off)
- [ ] Negatives: pasted (Portuguese + free + psychiatry)
- [ ] Keywords: phrase/exact English only
- [ ] Final URL: `/psychotherapy-lisbon/` or `/book/`
- [ ] Conversions: `/thank-you/` + `/book-confirmed/` URL actions **Primary**
- [ ] Ad copy: “English · from €75” · no “free therapy”
- [ ] Search terms: reviewed weekly

---

## Related docs

- [`google-ads-copy.md`](google-ads-copy.md) — approved ad text
- [`google-business-profile.md`](google-business-profile.md) — GBP alignment
