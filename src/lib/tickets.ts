import type { HandoffSummary, TicketReason, TranscriptLine, HandoffWorkflowSnap } from './handoffSummary';

export const TICKETS_KEY = 'rio:tickets';
export const HANDOFF_CHANNEL = 'rio-handoff';

export const DEMO_CUSTOMER = {
  name: 'Demo User',
  business: 'Demo Store',
  plan: 'Growth',
} as const;

export interface HandoffTicket {
  id: string;
  createdAt: string;
  status: 'open' | 'resolved';
  reason: TicketReason;
  customer: { name: string; business: string; plan: string };
  summary: {
    problem: string;
    stepsTried: string[];
    blocker: string | null;
    suggestedNextAction: string;
  };
  workflow: HandoffWorkflowSnap | null;
  transcript: TranscriptLine[];
  source: 'gemini' | 'fallback';
}

export type TicketEvent =
  | { type: 'upsert'; ticket: HandoffTicket }
  | { type: 'replace'; tickets: HandoffTicket[] };

function loadRaw(): HandoffTicket[] {
  try {
    const raw = localStorage.getItem(TICKETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HandoffTicket[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRaw(tickets: HandoffTicket[]) {
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
}

function channel(): BroadcastChannel | null {
  try {
    if (typeof BroadcastChannel === 'undefined') return null;
    return new BroadcastChannel(HANDOFF_CHANNEL);
  } catch {
    return null;
  }
}

export function listTickets(): HandoffTicket[] {
  return loadRaw().slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getTicket(id: string): HandoffTicket | undefined {
  return loadRaw().find((t) => t.id === id);
}

export function saveTicket(ticket: HandoffTicket): HandoffTicket {
  const all = loadRaw().filter((t) => t.id !== ticket.id);
  all.unshift(ticket);
  saveRaw(all);
  channel()?.postMessage({ type: 'upsert', ticket } satisfies TicketEvent);
  return ticket;
}

export function createTicket(partial: {
  reason: TicketReason;
  summary: HandoffSummary;
  workflow: HandoffWorkflowSnap | null;
  transcript: TranscriptLine[];
}): HandoffTicket {
  const { source, ...summaryFields } = partial.summary;
  const ticket: HandoffTicket = {
    id: `tkt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    status: 'open',
    reason: partial.reason,
    customer: { ...DEMO_CUSTOMER },
    summary: summaryFields,
    workflow: partial.workflow,
    transcript: partial.transcript,
    source,
  };
  return saveTicket(ticket);
}

export function markTicketResolved(id: string): HandoffTicket | undefined {
  const t = getTicket(id);
  if (!t) return undefined;
  const updated = { ...t, status: 'resolved' as const };
  saveTicket(updated);
  return updated;
}

export function subscribeTickets(cb: () => void): () => void {
  const ch = channel();
  if (!ch) return () => {};
  const onMsg = () => cb();
  ch.addEventListener('message', onMsg);
  return () => {
    ch.removeEventListener('message', onMsg);
    ch.close();
  };
}

export function clearTicketsForTests() {
  try { localStorage.removeItem(TICKETS_KEY); } catch { /* ignore */ }
}
