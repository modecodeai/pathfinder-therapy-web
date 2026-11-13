import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { matchExistingClient } from '../src/os/matching';
import { listActiveServices, getService } from '../src/os/serviceCatalog';
import { isIntakeAwaitingReview, createOsEvent } from '../src/os/providers';

const root = resolve(import.meta.dirname, '..');
function readSrc(rel: string) {
  return readFileSync(resolve(root, rel), 'utf8');
}

describe('Pathfinder OS architecture', () => {
  it('documents OS principle and Calendly migration stages', () => {
    const doc = readSrc('docs/PATHFINDER_OS.md');
    expect(doc).toContain('PATHFINDER OS PRINCIPLE');
    expect(doc).toContain('Stage 1');
    expect(doc).toContain('Stage 2');
    expect(doc).toContain('Stage 3');
    expect(doc).toContain('Appointment');
    expect(doc).toContain('Clinical Session');
    expect(doc).toContain('BillingProvider');
    expect(doc).toContain('InvoiceProvider');
  });

  it('service catalogue is data-driven with required fields', () => {
    const services = listActiveServices();
    expect(services.length).toBeGreaterThanOrEqual(4);
    for (const s of services) {
      expect(s.durationMinutes).toBeGreaterThan(0);
      expect(s.locationOptions.length).toBeGreaterThan(0);
      expect(typeof s.paymentRequired).toBe('boolean');
      expect(typeof s.intakeRequired).toBe('boolean');
    }
    expect(getService('svc_initial_consultation')?.intakeRequired).toBe(true);
  });

  it('safe client matching links exact email and flags uncertain collisions', () => {
    const clients = [
      { id: 'c1', email: 'lisa@example.com', phone: '+351911111111' },
      { id: 'c2', email: 'other@example.com', phone: '+351922222222' },
    ];
    expect(matchExistingClient(clients, { email: 'lisa@example.com' })).toEqual({
      kind: 'exact',
      clientId: 'c1',
      confidence: 'high',
    });
    expect(matchExistingClient(clients, { email: 'new@example.com' }).kind).toBe('none');
    const clash = matchExistingClient(
      [
        { id: 'a', email: 'same@example.com', phone: '111' },
        { id: 'b', email: 'same@example.com', phone: '222' },
      ],
      { email: 'same@example.com' },
    );
    expect(clash.kind).toBe('uncertain');
  });

  it('intake submitted awaits therapist review — not auto clinical write', () => {
    expect(isIntakeAwaitingReview('submitted')).toBe(true);
    expect(isIntakeAwaitingReview('reviewed')).toBe(false);
    const book = readSrc('src/os/pages/BookAppointmentPage.tsx');
    expect(book).toContain('Complete Intake');
    const worker = readSrc('worker/accountDirectory.ts');
    expect(worker).toContain('intake.submitted');
    expect(worker).toContain('Do NOT run AI');
  });

  it('registers public portal and booking routes', () => {
    const app = readSrc('src/app/App.tsx');
    expect(app).toContain('path="/book"');
    expect(app).toContain('path="/book/confirmed"');
    expect(app).toContain('path="/portal/intake"');
    expect(app).toContain('path="/public"');
    expect(app).toContain('path="/services"');
  });

  it('dashboard centres TODAY and surfaces intake awaiting review', () => {
    const dash = readSrc('src/routes/DashboardPage.tsx');
    expect(dash).toContain('Today');
    expect(dash).toContain('New Appointment');
    expect(dash).toContain('Intake awaiting review');
    expect(dash).toContain('Review Intake');
  });

  it('creates domain events for messaging abstraction', () => {
    const evt = createOsEvent('booking.confirmed', { appointmentId: 'ap_1' });
    expect(evt.type).toBe('booking.confirmed');
    expect(evt.id).toMatch(/^evt_/);
  });

  it('wires /api/os booking endpoints in worker', () => {
    const index = readSrc('worker/index.ts');
    expect(index).toContain('/api/os');
    expect(index).toContain('handleOsRoutes');
    const dir = readSrc('worker/accountDirectory.ts');
    expect(dir).toContain('CREATE TABLE IF NOT EXISTS appointments');
    expect(dir).toContain('createOsBooking');
  });
});
