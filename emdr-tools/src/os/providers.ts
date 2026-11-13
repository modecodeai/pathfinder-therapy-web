import type { IntakeLifecycleStatus, OsDomainEvent, OsEventType } from './types';

/**
 * Provider abstractions — Stage 1 stubs.
 * Do not hard-code Stripe / InvoiceXpress / Calendly into clinical modules.
 */

export interface BillingChargeInput {
  appointmentId: string;
  amountCents: number;
  currency: string;
  customerEmail: string;
}

export interface BillingProvider {
  readonly id: string;
  createCheckoutSession(input: BillingChargeInput): Promise<{ checkoutUrl?: string; pending: boolean }>;
}

export interface InvoiceDraft {
  appointmentId: string;
  clientId: string;
  amountCents: number;
  currency: string;
  description: string;
}

export interface InvoiceProvider {
  readonly id: string;
  createInvoice(draft: InvoiceDraft): Promise<{ externalId?: string; pending: boolean }>;
}

export interface CalendarSlot {
  startsAt: string;
  endsAt: string;
  therapistId: string;
}

export interface CalendarProvider {
  readonly id: string;
  listAvailability(therapistId: string, fromIso: string, toIso: string): Promise<CalendarSlot[]>;
}

export interface MessagingProvider {
  readonly id: string;
  send(event: OsDomainEvent): Promise<void>;
}

export class StubBillingProvider implements BillingProvider {
  readonly id = 'stub-billing';
  async createCheckoutSession(): Promise<{ pending: boolean }> {
    return { pending: true };
  }
}

export class StubInvoiceProvider implements InvoiceProvider {
  readonly id = 'stub-invoice';
  async createInvoice(): Promise<{ pending: boolean }> {
    return { pending: true };
  }
}

/** Stage 1–2: availability still owned by Calendly until native scheduling ships. */
export class CalendlyBridgeCalendarProvider implements CalendarProvider {
  readonly id = 'calendly-bridge';
  async listAvailability(): Promise<CalendarSlot[]> {
    return [];
  }
}

export class StubMessagingProvider implements MessagingProvider {
  readonly id = 'stub-messaging';
  readonly sent: OsDomainEvent[] = [];
  async send(event: OsDomainEvent): Promise<void> {
    this.sent.push(event);
  }
}

export function createOsEvent(type: OsEventType, payload: Record<string, unknown>): OsDomainEvent {
  return {
    id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    at: new Date().toISOString(),
    payload,
  };
}

export const INTAKE_STATUS_LABELS: Record<IntakeLifecycleStatus, string> = {
  'not-requested': 'Not requested',
  requested: 'Requested',
  opened: 'Opened',
  'partially-completed': 'Partially completed',
  submitted: 'Submitted',
  reviewed: 'Reviewed',
};

export function isIntakeAwaitingReview(status: IntakeLifecycleStatus): boolean {
  return status === 'submitted';
}
