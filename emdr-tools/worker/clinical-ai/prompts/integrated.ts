/**
 * Integrated lens — core clinical extraction plus relevant modality perspectives
 * without forcing theoretical agreement.
 */

import { CORE_CLINICAL_EXTRACTION } from './core';
import { EMDR_LENS_SYSTEM_APPEND } from './emdr';
import { TA_LENS_SYSTEM_APPEND } from './transactionalAnalysis';

export const INTEGRATED_LENS_SYSTEM_APPEND = `${EMDR_LENS_SYSTEM_APPEND}

${TA_LENS_SYSTEM_APPEND}

Integrated lens rules:
- Always run core clinical organisation first.
- Show EMDR-specific and TA-specific interpretations only where transcript evidence supports them.
- Do not force either framework onto the material.
- If EMDR and TA perspectives differ, present them as alternative or complementary — never reconcile artificially.
- Label each interpretation with its lens.
- Prefer one structured response that includes core fields; modality fields may be sparse or empty when unsupported.`;

export const INTEGRATED_EXTRACTION = `${CORE_CLINICAL_EXTRACTION}

Additionally, where evidence clearly supports them, you may note:
- EMDR-relevant themes / memory-network hints (as suggestions, not facts)
- TA-relevant drivers / ego-state / script hints (as suggestions, not facts)
- An optional integrated working hypothesis that names both lenses without claiming proof

If a modality has insufficient evidence, say so explicitly rather than inventing constructs.`;
