import type { Appointment, ServiceDefinition } from './types';

async function parseJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

function authHeaders(): HeadersInit {
  const t = localStorage.getItem('pf-emdr-auth-token');
  return t
    ? { Authorization: `Bearer ${t}`, 'content-type': 'application/json' }
    : { 'content-type': 'application/json' };
}

export async function fetchOsServices(): Promise<ServiceDefinition[]> {
  const res = await fetch('/api/os/services');
  const data = await parseJson<{ services: ServiceDefinition[] }>(res);
  return data.services ?? [];
}

export async function fetchOsTherapists(): Promise<
  Array<{ id: string; displayName: string; profession?: string | null }>
> {
  const res = await fetch('/api/os/therapists');
  const data = await parseJson<{
    therapists: Array<{ id: string; displayName: string; profession?: string | null }>;
  }>(res);
  return data.therapists ?? [];
}

export type BookingResult = {
  ok: boolean;
  error?: string;
  accessToken?: string;
  intakeRequired?: boolean;
  matchReviewRequired?: boolean;
  appointment?: {
    id: string;
    serviceId: string;
    serviceName: string;
    startsAt: string;
    endsAt: string;
    timezone: string;
    locationType: string;
    location?: string;
    status: string;
    paymentStatus: string;
    intakeStatus: string;
    contactName: string;
  };
};

export async function createOsBooking(body: {
  serviceId: string;
  therapistId?: string;
  startsAt: string;
  locationType: string;
  timezone?: string;
  name: string;
  email: string;
  phone?: string;
  consentVersion: string;
  policyVersion: string;
  bookingSource?: string;
}): Promise<BookingResult> {
  const res = await fetch('/api/os/booking', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseJson(res);
}

export async function listOsAppointments(): Promise<Appointment[]> {
  const res = await fetch('/api/os/appointments', { headers: authHeaders() });
  if (!res.ok) throw new Error(res.status === 401 ? 'Sign in required' : 'Could not load appointments');
  const data = await parseJson<{ appointments: Appointment[] }>(res);
  return data.appointments ?? [];
}

export async function fetchPortalAppointment(token: string) {
  const res = await fetch(`/api/os/appointments/by-token/${encodeURIComponent(token)}`);
  return parseJson<{
    appointment?: {
      id: string;
      serviceName?: string;
      startsAt: string;
      endsAt: string;
      timezone: string;
      locationType: string;
      intakeStatus: string;
      contactName: string;
    };
    error?: string;
  }>(res);
}

export async function submitPortalIntake(
  token: string,
  body: {
    rawText: string;
    fields?: Record<string, string>;
    version?: string;
    consentVersion: string;
    policyVersion: string;
  },
) {
  const res = await fetch(`/api/os/appointments/by-token/${encodeURIComponent(token)}/intake`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseJson<{ ok?: boolean; intakeId?: string; intakeStatus?: string; message?: string; error?: string }>(
    res,
  );
}

export async function patchAppointmentIntakeStatus(
  appointmentId: string,
  intakeStatus: string,
): Promise<{ ok?: boolean; error?: string }> {
  const res = await fetch(`/api/os/appointments/${encodeURIComponent(appointmentId)}/intake-status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ intakeStatus }),
  });
  return parseJson(res);
}
