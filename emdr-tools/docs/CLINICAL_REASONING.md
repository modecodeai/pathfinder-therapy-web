# Pathfinder Clinical Reasoning Principle

Pathfinder seeks to understand the client before applying a modality.

The **Clinical Reasoning Engine** stores modality-independent clinical evidence and working hypotheses.

Therapeutic approaches such as **EMDR** and **Transactional Analysis** provide distinct lenses through which that evidence can be considered.

No clinical lens is treated as objective truth.

The therapist remains responsible for formulation, integration and treatment decisions.

---

## PATHFINDER CLIENT-FIRST PRINCIPLE

Clinical work begins with the person, not the protocol.

A client may enter Pathfinder through an intake form, referral, transcript, therapist notes or direct clinical work.

Pathfinder first organises available information into a modality-neutral clinical understanding.

Only then does the therapist decide which therapeutic approach or clinical lens is most useful.

The client remains the centre of the platform.

Treatment modalities are tools used in service of that client.

**Product workflow**

1. Create or open a client  
2. Add available intake information  
3. Add existing transcript / notes / referral material  
4. Build an initial modality-neutral formulation  
5. Select the current treatment approach (default: Not yet decided — never EMDR)  
6. Prepare and conduct the session  

Dashboard primary action is **+ New Client**. Global EMDR start actions do not dominate the home workspace.

---

## PATHFINDER INITIAL CLINICAL INFORMATION PRINCIPLE

The intake is the first clinical evidence source in Pathfinder.

It is not merely an administrative form.

Pathfinder preserves the client's original account, organises that information into structured evidence, and supports the therapist in developing an initial modality-neutral understanding.

The client's words remain primary.

Clinical interpretation remains provisional.

The therapist remains the author of the formulation.

**Pipeline**

```
RAW INTAKE (immutable)
  → OpenAI Intake Reader (intake-reader-v2) — document extraction only
  → EXTRACTION REVIEW (therapist confirm / edit)
  → STRUCTURED INTAKE (pathfinder-intake-v1) — form selections preserved (null stays null)
  → SEMANTIC CORROBORATION — narrative evidence across the intake
  → CORE CLINICAL REASONING (observe → … → working hypothesis)
  → THERAPIST REVIEW (Approve / Edit / Reject)
  → INITIAL CLINICAL UNDERSTANDING
  → FIRST SESSION PREPARATION (core-first; no TA/EMDR leakage)
```

Document extraction (“what was selected on this field?”) and clinical reasoning (“what has the client explicitly told us overall?”) are separate. An unknown radio/checkbox does not erase explicit narrative elsewhere.

Three status languages must not be collapsed:

- **Form value** — Not established / Yes / No / text
- **Clinical evidence** — Explicitly reported / Inferred / Suggested
- **Clinical record** — Approved / Pending / Rejected

Nothing AI-derived enters the approved formulation until therapist review. “Therapist reviewed” requires an explicit clinician action after extraction is confirmed.

Intake records remain distinct from clinical session notes (linked by client ID only).

Form versioning: every submission stores `formVersion` (e.g. `pathfinder-intake-v1`).

---

## Pathfinder Integrative Reasoning Principle

The client comes before the model.

Pathfinder first seeks to understand the person's presenting difficulties, patterns, relationships, experiences, resources and goals without imposing a therapeutic framework.

Clinical modalities are then used as interpretive lenses.

The client's current treatment approach determines which lens receives priority.

Pathfinder may surface other potentially useful perspectives, but it must never automatically convert a client's formulation into another modality.

No model is treated as objective truth.

The therapist remains responsible for formulation, integration, treatment selection and clinical decision-making.

---

## Three-layer reasoning hierarchy

```
TRANSCRIPT
    ↓
CORE CLINICAL REASONING
    ↓
MODALITY-NEUTRAL FORMULATION
    ↓
CLINICAL LENS CONSIDERATION
    ↓
THERAPIST-SELECTED LENS
    ↓
LENS-SPECIFIC FORMULATION
```

Never reverse this order. Never begin with EMDR/TA/Gestalt unless the therapist selected that lens (or primary approach requires it).

Integrated mode = Core + Primary lens + optional complementary lens *considerations* — not every modality in Pathfinder.

---

## Architecture

```
CLIENT
  ↓
CLINICAL REASONING ENGINE
  ↓
CORE FORMULATION
  ↓
┌─────────────┬──────────────────────┐
│             │                      │
▼             ▼                      ▼
EMDR Lens   TA Lens            (future lenses)
```

- **One client** · **one longitudinal clinical record** · **multiple clinical lenses**
- Product name: **Pathfinder Clinical** (organisation: Pathfinder Therapy)
- Feature name: **Clinical Reasoning**
- Treatment modules retain their names (Standard EMDR, EMDR Pain, Transactional Analysis)
- Data: `coreFormulation` · `taFormulation` · `emdrFormulation` (marker; detailed EMDR fields on record) · `painFormulation`

## Safety model (unchanged)

Transcript → structured findings → evidence → confidence → Approve/Edit/Reject → therapist-approved record.

AI never diagnoses, never decides treatment, never replaces the therapist.
Lens considerations are labelled **Possible complementary clinical lens** — never “recommended treatment”.

---

## Transactional Analysis reasoning principle

Pathfinder should use Transactional Analysis to illuminate the client's experience, not replace the client's experience with Transactional Analysis terminology.

The client's words remain primary.

TA concepts are working maps.

The therapist decides whether those maps are clinically useful.

### Output priority

1. Client's lived pattern  
2. Protective function  
3. Evidence  
4. TA interpretation  
5. Alternative explanation  
6. Therapeutic movement / emerging permission  
7. Outstanding questions  

### Golden regression

A de-identified TA-first golden fixture lives under `tests/fixtures/ta-lisa-golden/` (test-only; not shipped to client assets). It asserts:

- core stays modality-neutral and grief-central;
- Be Perfect / Don't Feel remain hypotheses with evidence;
- contradictory evidence is retained;
- EMDR constructs do not appear automatically under TA primary.

A second de-identified fixture under `tests/fixtures/ta-kat-golden/` covers therapist-reasoning sequencing (observation → protective function → lens), session vs non-session segmentation, risk-language review flags, and contradiction preservation.

---

## Pathfinder Reasoning Principle

Clinical reasoning begins with understanding before intervention.

Pathfinder should first establish what the client is experiencing, what patterns repeat, what protective functions may be operating, and what remains uncertain.

Therapeutic models are applied only after this understanding has been established.

Theory should illuminate experience, not replace it.

Generic sequence: Observe → Regulate/Orient → Explore → Identify Pattern → Ask Protective Function → Formulate Meaning → Apply Clinical Lens → Identify Choice/Movement → Consider Intervention.

---

## Pathfinder Therapist Style Principle

Pathfinder may learn therapist preferences for sequencing, language and formulation only when explicitly configured.

Therapist style is a preference layer, not a source of clinical truth.

Client evidence always has priority.

No silent behavioural learning. Profiles must be viewable, editable, resettable, exportable and deletable when enabled.
