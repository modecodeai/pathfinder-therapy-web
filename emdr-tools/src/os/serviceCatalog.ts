import type { ServiceDefinition } from './types';

/**
 * Service catalogue — single source of truth for booking UI.
 * Do not hard-code service rules inside presentational components.
 */
export const SERVICE_CATALOG: ServiceDefinition[] = [
  {
    id: 'svc_psychotherapy_50',
    name: 'Psychotherapy — 50 min',
    description: 'In-person psychotherapy session.',
    durationMinutes: 50,
    priceCents: 9000,
    currency: 'EUR',
    locationOptions: ['in-person', 'either'],
    therapistIds: [],
    paymentRequired: true,
    intakeRequired: true,
    remoteSessionCapable: false,
    active: true,
  },
  {
    id: 'svc_online_psychotherapy_50',
    name: 'Online Psychotherapy — 50 min',
    description: 'Secure online psychotherapy.',
    durationMinutes: 50,
    priceCents: 9000,
    currency: 'EUR',
    locationOptions: ['online'],
    therapistIds: [],
    paymentRequired: true,
    intakeRequired: true,
    remoteSessionCapable: true,
    active: true,
  },
  {
    id: 'svc_emdr_60',
    name: 'EMDR — 60 min',
    description: 'EMDR session when clinically indicated.',
    durationMinutes: 60,
    priceCents: 11000,
    currency: 'EUR',
    locationOptions: ['in-person', 'online', 'either'],
    therapistIds: [],
    paymentRequired: true,
    intakeRequired: true,
    remoteSessionCapable: true,
    active: true,
  },
  {
    id: 'svc_emdr_pain_60',
    name: 'EMDR Pain — 60 min',
    description: 'EMDR pain-informed session.',
    durationMinutes: 60,
    priceCents: 11000,
    currency: 'EUR',
    locationOptions: ['in-person', 'online', 'either'],
    therapistIds: [],
    paymentRequired: true,
    intakeRequired: true,
    remoteSessionCapable: true,
    active: true,
  },
  {
    id: 'svc_initial_consultation',
    name: 'Initial Consultation',
    description: 'First meeting to explore fit and next steps.',
    durationMinutes: 30,
    priceCents: 0,
    currency: 'EUR',
    locationOptions: ['online', 'in-person', 'either'],
    therapistIds: [],
    paymentRequired: false,
    intakeRequired: true,
    remoteSessionCapable: true,
    active: true,
  },
];

export function listActiveServices(): ServiceDefinition[] {
  return SERVICE_CATALOG.filter((s) => s.active);
}

export function getService(id: string): ServiceDefinition | undefined {
  return SERVICE_CATALOG.find((s) => s.id === id);
}

export function formatServicePrice(s: ServiceDefinition): string {
  if (!s.paymentRequired || s.priceCents <= 0) return 'No payment required at booking';
  const amount = (s.priceCents / 100).toFixed(0);
  return `${s.currency === 'EUR' ? '€' : s.currency}${amount}`;
}
