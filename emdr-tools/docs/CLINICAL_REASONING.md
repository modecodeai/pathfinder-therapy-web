# Pathfinder Clinical Reasoning Principle

Pathfinder seeks to understand the client before applying a modality.

The **Clinical Reasoning Engine** stores modality-independent clinical evidence and working hypotheses.

Therapeutic approaches such as **EMDR** and **Transactional Analysis** provide distinct lenses through which that evidence can be considered.

No clinical lens is treated as objective truth.

The therapist remains responsible for formulation, integration and treatment decisions.

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

## Safety model (unchanged)

Transcript → structured findings → evidence → confidence → Approve/Edit/Reject → therapist-approved record.

AI never diagnoses, never decides treatment, never replaces the therapist.
