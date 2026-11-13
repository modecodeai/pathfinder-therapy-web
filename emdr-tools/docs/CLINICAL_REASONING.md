# Pathfinder Clinical Reasoning Principle

Pathfinder seeks to understand the client before applying a modality.

The **Clinical Reasoning Engine** stores modality-independent clinical evidence and working hypotheses.

Therapeutic approaches such as **EMDR** and **Transactional Analysis** provide distinct lenses through which that evidence can be considered.

No clinical lens is treated as objective truth.

The therapist remains responsible for formulation, integration and treatment decisions.

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
