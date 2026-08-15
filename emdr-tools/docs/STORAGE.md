# Pathfinder EMDR — Storage Architecture (developer)

**Product:** Pathfinder EMDR  
**Organisation:** Pathfinder Therapy  
**Audited against:** `emdr-tools` Worker + Durable Objects (no D1/KV bindings)

## Cloudflare bindings (`wrangler.toml`)

| Binding | Resource | Class |
|---------|----------|-------|
| `ASSETS` | Static assets | SPA |
| `ROOM` | Durable Object | `EmdrRoom` |
| `ACCOUNTS` | Durable Object | `AccountDirectory` |
| `APP_NAME` | env var | product display name |
| `OPENAI_API_KEY` | Secret | Clinical Intelligence |
| `OPENAI_CLINICAL_MODEL` | Secret/var | Clinical Intelligence model |

**Not used:** D1, KV, R2.

Accounts DO namespace: `env.ACCOUNTS.idFromName("global")` (single SQLite-backed directory).

---

## Storage map

| Data | Where | Identifier | Tenant scope |
|------|-------|------------|--------------|
| Account / therapist profile | DO `AccountDirectory` SQLite table `therapists` | `therapists.id` | N/A (is the tenant) |
| Auth sessions | table `auth_sessions` | `token` → `therapist_id` | Yes |
| **Client records** | table `clients` (`record_json` = full `ClientRecord`) | `clients.id` + `therapist_id` | **Yes — every query uses both** |
| Approved clinical findings (themes, memories, triggers, NC/PC, active target, resources, cognitions, adaptive info, future templates, prong assignments, sessionChanges) | Inside `clients.record_json` | — | Yes |
| **AIP formulation** | Not a separate store — derived in UI from approved `ClientRecord` via `buildAipFormulation()`; prong overrides persist on `record_json.prongAssignments` | — | Yes |
| **Raw transcripts** | table `raw_transcripts` | `id`, `client_id`, `therapist_id` | Yes |
| **AI analyses** | table `clinical_ai_analyses` (`structured_result_json` immutable; `reviewed_result_json` therapist review) | `id`, `therapist_id` | Yes |
| Apply / review audit | table `clinical_ai_audit` (`payload_json` — decisions, **not full transcripts**) | `therapist_id` | Yes |
| Server clinical sessions API | table `clinical_sessions` | `therapist_id` | Yes (list/insert); UI currently unused |
| **Processing notes** | `ClientRecord.processingNotes` in `clients.record_json` | — | Yes |
| Remote BLS room state | DO `EmdrRoom` table `room` (`state_json`) | room id | **Not** therapist-scoped (secret-gated WebSocket). No clinical content by design. |

---

## Browser storage (allowed vs not)

### Allowed (non-clinical / cosmetic)

| Key | API | Purpose |
|-----|-----|---------|
| `pf-emdr-auth-token` | localStorage | Auth bearer only |
| `pathfinder.emdr.scriptSize` | localStorage | UI preference |
| `pf-emdr-therapist-default-bls-v1` | localStorage | BLS device defaults |
| `pf-emdr-custom-presets-v1` | localStorage | BLS presets |
| `pathfinder.emdr.libraryScroll` | sessionStorage | Scroll position |
| `pf-emdr-help-favourites-v1` | localStorage | Library favourites |
| `pf-ci-linked-client` | localStorage | Client **id** pointer for CI panel (not clinical payload) |
| `pf-ci-parent-analysis` | localStorage | Analysis **id** pointer |
| `pf-emdr-retention-transcript` | localStorage | UI preference for transcript retention policy |
| `pf-emdr-retention-analysis` | localStorage | UI preference for AI analysis retention |

**Note:** Retention preferences are stored as UI prefs today; server-side enforcement of “delete after approved analysis” is not yet wired. Client clinical records remain in `AccountDirectory` regardless of these prefs.

### Device-local practice drafts (not the Clients clinical record of truth)

These hold **practice console / companion drafts** on-device. They are **not** the authenticated client clinical database. Clients / CI / AIP formulation always load from `ACCOUNTS`.

| Key | API | Contents |
|-----|-----|----------|
| `pathfinder.emdr.standardSession.v1` | localStorage | Guided Standard EMDR console draft (target fields, history notes, timeline) |
| `pf-emdr-companion-v1` | sessionStorage | Classic Session Companion draft |
| `pathfinder.emdr.pain.workspace.v1` | sessionStorage | Pain protocol workspace draft |
| `pf-emdr-help-notes-v1` | localStorage | Optional free-text help notes |

**Policy:** Durable client clinical information (names, transcripts, targets, NC/PC, formulations, AI analysis, processing notes) must live only in authenticated server-side `AccountDirectory` storage. Practice drafts may remain device-local until the therapist applies findings to a client record. Do not treat browser drafts as the source of truth for Clients.

**IndexedDB:** none.

---

## Security controls (application)

- Bearer auth required for all client / CI / account APIs
- Every client load: `WHERE id = ? AND therapist_id = ?`
- No unauthenticated client endpoints
- Do not log raw transcripts or OpenAI payloads
- Do not put clinical payloads in URLs
- Platform: Cloudflare encryption at rest + TLS in transit; secrets in Cloudflare Secrets
- No claimed compliance certifications unless separately verified

---

## Data retention (Settings)

Therapist preferences for transcript / analysis retention are stored on the account record (`therapists` preferences JSON / account settings fields) and enforced at apply/delete flows — never by deleting other tenants’ data.
