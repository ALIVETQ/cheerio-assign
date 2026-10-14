import type { MockAccount } from '../data/mockAccount';

export interface PreconditionResult {
  ok: boolean;
  failedKey?: string;
}

/**
 * Checks whether all listed precondition keys are satisfied for the given account.
 * Exported for testing. Also used by App.tsx via alias.
 */
export function checkPreconditionsForTest(
  preconditions: string[],
  account: MockAccount
): PreconditionResult {
  for (const key of preconditions) {
    if (key === 'whatsapp_connected') {
      const wa = account.channels.find((c) => c.name === 'WhatsApp');
      if (!wa?.connected) return { ok: false, failedKey: 'whatsapp_connected' };
    }
    if (key === 'has_contacts') {
      if (account.contacts.length === 0) return { ok: false, failedKey: 'has_contacts' };
    }
    if (key === 'has_approved_template') {
      const hasApproved = account.templates.some((t) => t.status === 'APPROVED');
      if (!hasApproved) return { ok: false, failedKey: 'has_approved_template' };
    }
  }
  return { ok: true };
}

// Re-export as the main function used in App.tsx
export { checkPreconditionsForTest as checkPreconditions };
