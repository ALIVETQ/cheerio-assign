import type { MockAccount } from '../data/mockAccount';
import type { WorkflowOffer } from '../context/RioContext';

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

export { checkPreconditionsForTest as checkPreconditions };

/** Friendly prerequisite guide offers — no jargon in user-facing copy. */
export function offerForMissingPrerequisite(failedKey: string): WorkflowOffer | null {
  if (failedKey === 'whatsapp_connected') {
    return {
      workflowId: 'wf-connect-whatsapp',
      title: 'Connect your WhatsApp number',
      reason: 'Before sending a campaign, you need to connect a WhatsApp number. I can walk you through it.',
      estimatedMinutes: 3,
      source: 'gemini',
      fallbackCause: null,
    };
  }
  if (failedKey === 'has_approved_template') {
    return {
      workflowId: 'wf-create-template',
      title: 'Create a message template',
      reason: 'You need at least one approved WhatsApp template before sending a campaign. I can help you create one.',
      estimatedMinutes: 3,
      source: 'gemini',
      fallbackCause: null,
    };
  }
  if (failedKey === 'has_contacts') {
    return {
      workflowId: 'wf-add-contacts',
      title: 'Add contacts from a CSV file',
      reason: "You don't have any contacts yet. I can walk you through uploading a CSV list.",
      estimatedMinutes: 2,
      source: 'gemini',
      fallbackCause: null,
    };
  }
  return null;
}
