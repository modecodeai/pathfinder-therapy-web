import type { ClientMatchResult } from './types';

export interface MatchableClient {
  id: string;
  email?: string;
  phone?: string;
  displayName?: string;
}

function normaliseEmail(email?: string): string {
  return (email ?? '').trim().toLowerCase();
}

function normalisePhone(phone?: string): string {
  return (phone ?? '').replace(/\D/g, '');
}

/**
 * Safe matching — never auto-create duplicates when an exact high-confidence
 * match exists; flag uncertain collisions for clinician/admin review.
 */
export function matchExistingClient(
  candidates: MatchableClient[],
  input: { email?: string; phone?: string },
): ClientMatchResult {
  const email = normaliseEmail(input.email);
  const phone = normalisePhone(input.phone);

  const emailHits = email
    ? candidates.filter((c) => normaliseEmail(c.email) === email)
    : [];
  const phoneHits =
    phone.length >= 8
      ? candidates.filter((c) => {
          const p = normalisePhone(c.phone);
          return p.length >= 8 && (p === phone || p.endsWith(phone) || phone.endsWith(p));
        })
      : [];

  if (emailHits.length === 1 && (phoneHits.length === 0 || phoneHits[0]?.id === emailHits[0]!.id)) {
    return { kind: 'exact', clientId: emailHits[0]!.id, confidence: 'high' };
  }

  if (emailHits.length === 0 && phoneHits.length === 1) {
    return { kind: 'exact', clientId: phoneHits[0]!.id, confidence: 'high' };
  }

  const uncertainIds = [
    ...new Set([...emailHits.map((c) => c.id), ...phoneHits.map((c) => c.id)]),
  ];

  if (uncertainIds.length > 1) {
    return {
      kind: 'uncertain',
      candidateIds: uncertainIds,
      reason: 'Multiple records share this email or phone — clinician review required',
    };
  }

  if (emailHits.length === 1 && phoneHits.length === 1 && emailHits[0]!.id !== phoneHits[0]!.id) {
    return {
      kind: 'uncertain',
      candidateIds: [emailHits[0]!.id, phoneHits[0]!.id],
      reason: 'Email and phone point to different records',
    };
  }

  return { kind: 'none' };
}
