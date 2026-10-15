/**
 * Phase 6 unit tests
 *
 * 1. clearDemoState removes all three localStorage keys
 * 2. No-contacts precondition returns a WorkflowOffer card (not null / plain text)
 * 3. /dev/engine route is gated behind import.meta.env.DEV in AppRoutes
 */

import { describe, it, expect, afterEach } from 'vitest';
import { clearDemoState } from './demoReset';
import { offerForMissingPrerequisite } from '../workflows/preconditionHelpers';

// ─── 1: clearDemoState ────────────────────────────────────────────────────────

describe('clearDemoState', () => {
  afterEach(() => localStorage.clear());

  it('removes rio:engine', () => {
    localStorage.setItem('rio:engine', 'engine-data');
    clearDemoState();
    expect(localStorage.getItem('rio:engine')).toBeNull();
  });

  it('removes rio:tickets', () => {
    localStorage.setItem('rio:tickets', 'ticket-data');
    clearDemoState();
    expect(localStorage.getItem('rio:tickets')).toBeNull();
  });

  it('removes rio:messages', () => {
    localStorage.setItem('rio:messages', 'messages-data');
    clearDemoState();
    expect(localStorage.getItem('rio:messages')).toBeNull();
  });

  it('leaves unrelated keys untouched', () => {
    localStorage.setItem('other:key', 'other-value');
    clearDemoState();
    expect(localStorage.getItem('other:key')).toBe('other-value');
  });
});

// ─── 2: no-contacts → offer card ─────────────────────────────────────────────

describe('offerForMissingPrerequisite – has_contacts', () => {
  it('returns a WorkflowOffer for wf-add-contacts', () => {
    const offer = offerForMissingPrerequisite('has_contacts');
    expect(offer).not.toBeNull();
    expect(offer?.workflowId).toBe('wf-add-contacts');
    expect(typeof offer?.estimatedMinutes).toBe('number');
    expect(offer?.source).toBe('gemini');
  });

  it('offer title mentions contacts', () => {
    const offer = offerForMissingPrerequisite('has_contacts');
    expect(offer?.title).toMatch(/contact/i);
  });

  it('returns offer for whatsapp_connected', () => {
    expect(offerForMissingPrerequisite('whatsapp_connected')?.workflowId).toBe('wf-connect-whatsapp');
  });

  it('returns offer for has_approved_template', () => {
    expect(offerForMissingPrerequisite('has_approved_template')?.workflowId).toBe('wf-create-template');
  });

  it('returns null for unknown key', () => {
    expect(offerForMissingPrerequisite('unknown_key')).toBeNull();
  });
});

// ─── 3: /dev/engine production guard ─────────────────────────────────────────

describe('/dev/engine production guard (source-level)', () => {
  it('AppRoutes.tsx wraps DevEnginePage import in import.meta.env.DEV guard', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const src = readFileSync(resolve(process.cwd(), 'src/AppRoutes.tsx'), 'utf-8');
    expect(src).toContain('import.meta.env.DEV');
    // When not DEV, the lazy import is replaced with null
    expect(src).toContain(': null');
    // The route itself is also conditional
    expect(src).toContain('/dev/engine');
  });
});
