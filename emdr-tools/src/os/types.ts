/**
 * Pathfinder OS — shared domain types for the continuous client journey.
 * Clinical Session ≠ Appointment. Payment must not mutate clinical formulation.
 */

/** Therapist / client / admin — enforced server-side on every API. */
export type OsRole = 'client' | 'therapist' | 'admin';

export type RecordKind = 'prospect' | 'client';

export type LocationType = 'in-person' | 'online' | 'either';

export type AppointmentStatus =
  | 'booked'
  | 'payment-pending'
  | 'paid'
  | 'cancelled'
  | 'refunded'
  | 'no-show'
  | 'completed';

export type PaymentStatus =
  | 'not-required'
  | 'pending'
  | 'paid'
  | 'refunded'
  | 'failed';

export type IntakeLifecycleStatus =
  | 'not-requested'
  | 'requested'
  | 'opened'
  | 'partially-completed'
  | 'submitted'
  | 'reviewed';

export type BookingSource =
  | 'pathfinder-native'
  | 'calendly'
  | 'manual'
  | 'admin'
  | 'portal';

export interface ServiceDefinition {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  currency: 'EUR' | 'GBP' | 'USD';
  locationOptions: LocationType[];
  /** Therapist ids allowed; empty = all practice therapists */
  therapistIds: string[];
  paymentRequired: boolean;
  intakeRequired: boolean;
  remoteSessionCapable: boolean;
  active: boolean;
}

export interface Appointment {
  id: string;
  clientId: string;
  therapistId: string;
  serviceId: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  locationType: LocationType;
  location?: string;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  intakeStatus: IntakeLifecycleStatus;
  remoteSessionId?: string;
  /** Linked when therapist starts clinical work — not created at booking */
  clinicalSessionId?: string;
  bookingSource: BookingSource;
  /** Opaque portal access — never expose internal ids in public UI copy */
  accessToken?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  notes?: string;
  matchReviewRequired?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConsentRecord {
  id: string;
  clientId: string;
  version: string;
  policyVersion: string;
  formId: string;
  timestamp: string;
  channel: 'booking' | 'intake' | 'portal' | 'clinical';
}

export interface PortalIntakeSubmission {
  intakeId: string;
  clientId: string;
  appointmentId?: string;
  submittedAt: string;
  version: string;
  rawText: string;
  fields?: Record<string, string>;
}

/** Safe match outcome — never auto-merge when uncertain. */
export type ClientMatchResult =
  | { kind: 'none' }
  | { kind: 'exact'; clientId: string; confidence: 'high' }
  | { kind: 'uncertain'; candidateIds: string[]; reason: string };

export type OsEventType =
  | 'booking.confirmed'
  | 'intake.requested'
  | 'intake.reminder'
  | 'intake.submitted'
  | 'appointment.reminder'
  | 'payment.confirmed'
  | 'appointment.rescheduled'
  | 'appointment.cancelled'
  | 'remote_session.link'
  | 'invoice.requested';

export interface OsDomainEvent {
  id: string;
  type: OsEventType;
  at: string;
  payload: Record<string, unknown>;
}
