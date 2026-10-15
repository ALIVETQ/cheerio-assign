import { useCallback, useEffect, useState } from 'react';
import FallbackBadge from '../components/rio/FallbackBadge';
import {
  getTicket,
  listTickets,
  markTicketResolved,
  subscribeTickets,
  type HandoffTicket,
} from '../lib/tickets';

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function progressLabel(t: HandoffTicket): string | null {
  if (!t.workflow || !t.workflow.totalSteps) return null;
  return `${t.workflow.stepIndex + 1} of ${t.workflow.totalSteps}`;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<HandoffTicket[]>(() => listTickets());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setTickets(listTickets());
  }, []);

  useEffect(() => subscribeTickets(refresh), [refresh]);

  const selected = selectedId ? getTicket(selectedId) ?? tickets.find((t) => t.id === selectedId) : null;

  function handleResolve(id: string) {
    markTicketResolved(id);
    refresh();
  }

  return (
    <div className="support-page" data-testid="support-page">
      <header className="support-header">
        <h1>Support View</h1>
        <span className="prototype-badge">Prototype</span>
      </header>
      <div className="support-body">
        <aside className="support-list" data-testid="support-list">
          {tickets.length === 0 ? (
            <p className="support-empty" data-testid="support-empty">No handoffs yet</p>
          ) : (
            tickets.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`support-row${selectedId === t.id ? ' is-selected' : ''}`}
                data-testid="ticket-row"
                onClick={() => setSelectedId(t.id)}
              >
                <div className="support-row-top">
                  <span data-testid="ticket-status">{t.status}</span>
                  <span data-testid="ticket-reason">{t.reason}</span>
                </div>
                <div className="support-row-meta">
                  <span data-testid="ticket-time">{formatTime(t.createdAt)}</span>
                  <span data-testid="source-badge" className="support-source-wrap">
                    {t.source === 'fallback' ? <FallbackBadge cause="error" /> : 'gemini'}
                  </span>
                </div>
              </button>
            ))
          )}
        </aside>
        <section className="support-detail" data-testid="support-detail">
          {!selected ? (
            <p className="support-empty">Select a ticket</p>
          ) : (
            <TicketDetail ticket={selected} onResolve={handleResolve} />
          )}
        </section>
      </div>
    </div>
  );
}

function TicketDetail({
  ticket,
  onResolve,
}: {
  ticket: HandoffTicket;
  onResolve: (id: string) => void;
}) {
  const progress = progressLabel(ticket);
  return (
    <div data-testid="ticket-detail">
      <div className="support-detail-head">
        <h2>{ticket.customer.name}</h2>
        <span data-testid="source-badge" className="support-source-wrap">
          {ticket.source === 'fallback' ? <FallbackBadge cause="error" /> : 'gemini'}
        </span>
      </div>
      <p data-testid="ticket-customer">{ticket.customer.name} · {ticket.customer.business}</p>
      <p data-testid="ticket-plan">Plan: {ticket.customer.plan}</p>
      <p data-testid="ticket-reason-detail">Reason: {ticket.reason}</p>
      <p data-testid="ticket-status-detail">Status: {ticket.status}</p>
      {progress && <p data-testid="ticket-progress">Workflow progress: {progress}</p>}

      <h3>Summary</h3>
      <p data-testid="ticket-problem">{ticket.summary.problem}</p>
      <ul data-testid="ticket-steps">
        {ticket.summary.stepsTried.map((s) => <li key={s}>{s}</li>)}
      </ul>
      <p data-testid="ticket-blocker">{ticket.summary.blocker ?? '—'}</p>
      <p data-testid="ticket-next">{ticket.summary.suggestedNextAction}</p>

      <h3>Transcript</h3>
      <ol data-testid="ticket-transcript">
        {ticket.transcript.map((line, i) => (
          <li key={`${line.role}-${i}`}>{line.role}: {line.text}</li>
        ))}
      </ol>

      {ticket.status !== 'resolved' && (
        <button
          type="button"
          className="support-resolve-btn"
          data-testid="mark-resolved-btn"
          onClick={() => onResolve(ticket.id)}
        >
          Mark resolved
        </button>
      )}
    </div>
  );
}
