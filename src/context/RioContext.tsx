import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import '../workflows/index';
import { getWorkflow } from '../workflows/loader';
import { WORKFLOW_LIBRARY } from '../../api/_lib/workflows';
import { fallbackMatch } from '../lib/fallbackMatcher';
import {
  routeMessage,
  classifyClientRouteError,
  summarizeHandoff,
  type RouteResponse,
} from '../lib/api';
import { buildTemplateSummary, resolveHandoffReason, type TicketReason } from '../lib/handoffSummary';
import { createTicket } from '../lib/tickets';
import type { HandoffWorkflowSnap } from '../lib/handoffSummary';

export const THROTTLE_INTERVAL_MS = 2000;
export const THROTTLE_SESSION_MAX = 20;

export type MessageRole = 'user' | 'rio';

export interface WorkflowOffer {
  workflowId: string;
  title: string;
  reason: string;
  estimatedMinutes: number;
  source: 'gemini' | 'fallback';
  fallbackCause?: string | null;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text?: string;
  offer?: WorkflowOffer;
  dismissed?: boolean;
  progress?: { stepIndex: number; totalSteps: number; workflowTitle: string };
  handoff?: boolean;
  noMatch?: boolean;
  source?: 'gemini' | 'fallback';
  fallbackCause?: string | null;
}

interface RioContextValue {
  isOpen: boolean;
  isCompact: boolean;
  workflowStepLabel: string | null;
  messages: ChatMessage[];
  isTyping: boolean;
  isHandoffSharing: boolean;
  focusNonce: number;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  collapseToCompact: () => void;
  expandFromCompact: () => void;
  sendMessage: (text: string) => void;
  dismissOffer: (messageId: string) => void;
  acceptOffer: (messageId: string) => void;
  requestInputFocus: () => void;
  requestHandoff: (trigger: 'footer' | 'no_match') => void;
  pushRioMessage: (msg: Omit<ChatMessage, 'id'>) => void;
  upsertProgressCard: (progress: NonNullable<ChatMessage['progress']>) => void;
  setWorkflowStepLabel: (label: string | null) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export interface EngineHandoffBridge {
  pauseIfRunning: () => void;
  snapshot: () => HandoffWorkflowSnap | null;
}

interface RioProviderProps {
  children: ReactNode;
  onStartWorkflow?: (
    offer: WorkflowOffer,
    onPrereqFailed: (msg: { text?: string; offer?: WorkflowOffer }) => void
  ) => void;
  engineHandoff?: EngineHandoffBridge;
}

const RioContext = createContext<RioContextValue | null>(null);

let _idCounter = 0;
function nextId() {
  return `msg-${++_idCounter}-${Date.now()}`;
}

const GREETING: ChatMessage = {
  id: 'rio-greeting',
  role: 'rio',
  text: "Hi, I'm Rio 👋 I'm here to guide you through Cheerio AI. What are you trying to do today? Describe your problem in your own words.",
};

function metaFor(workflowId: string) {
  const wf = getWorkflow(workflowId);
  if (wf) return { title: wf.title, estimatedMinutes: wf.estimatedMinutes };
  const lib = WORKFLOW_LIBRARY.find((w) => w.id === workflowId);
  return {
    title: lib?.title ?? workflowId,
    estimatedMinutes: lib?.estimatedMinutes ?? 3,
  };
}

function buildReply(result: RouteResponse): Omit<ChatMessage, 'id'> {
  const showOffer =
    Boolean(result.workflowId) && result.confidence >= 0.6 && result.workflowId !== null;

  if (showOffer && result.workflowId) {
    const meta = metaFor(result.workflowId);
    return {
      role: 'rio',
      offer: {
        workflowId: result.workflowId,
        title: meta.title,
        reason: result.reason,
        estimatedMinutes: meta.estimatedMinutes,
        source: result.source,
        fallbackCause: result.fallbackCause,
      },
      source: result.source,
      fallbackCause: result.fallbackCause,
    };
  }

  return {
    role: 'rio',
    text: "I couldn't find a guide for that. Try rephrasing, or talk to a human and we'll sort it out.",
    noMatch: true,
    source: result.source,
    fallbackCause: result.fallbackCause,
  };
}

export function RioProvider({ children, onStartWorkflow, engineHandoff }: RioProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [workflowStepLabel, setWorkflowStepLabel] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [isTyping, setIsTyping] = useState(false);
  const [isHandoffSharing, setIsHandoffSharing] = useState(false);
  const [focusNonce, setFocusNonce] = useState(0);
  const pendingRef = useRef(false);
  const lastSentRef = useRef(0);
  const sessionCountRef = useRef(0);
  const lastNoMatchSourceRef = useRef<'gemini' | 'fallback' | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const handoffPendingRef = useRef(false);

  const openPanel = useCallback(() => { setIsOpen(true); setIsCompact(false); }, []);
  const closePanel = useCallback(() => setIsOpen(false), []);
  const togglePanel = useCallback(() => setIsOpen((v) => !v), []);
  const collapseToCompact = useCallback(() => { setIsCompact(true); setIsOpen(false); }, []);
  const expandFromCompact = useCallback(() => { setIsCompact(false); setIsOpen(true); }, []);
  const requestInputFocus = useCallback(() => setFocusNonce((n) => n + 1), []);

  const pushRioMessage = useCallback((msg: Omit<ChatMessage, 'id'>) => {
    setMessages((prev) => [...prev, { ...msg, id: nextId() }]);
  }, []);

  const upsertProgressCard = useCallback((progress: NonNullable<ChatMessage['progress']>) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.progress);
      if (idx === -1) return [...prev, { id: nextId(), role: 'rio', progress }];
      const next = [...prev];
      next[idx] = { ...next[idx], progress };
      return next;
    });
  }, []);

  const sendMessage = useCallback((text: string) => {
    const now = Date.now();
    if (sessionCountRef.current >= THROTTLE_SESSION_MAX) {
      pushRioMessage({
        role: 'rio',
        text: "You've reached the message limit for this session. Try again later, or talk to a human.",
      });
      return;
    }
    if (now - lastSentRef.current < THROTTLE_INTERVAL_MS && lastSentRef.current !== 0) {
      pushRioMessage({
        role: 'rio',
        text: 'Please wait a moment before sending another message.',
      });
      return;
    }
    if (pendingRef.current) return;

    lastSentRef.current = now;
    sessionCountRef.current += 1;

    setMessages((prev) => [...prev, { id: nextId(), role: 'user', text }]);
    pendingRef.current = true;
    setIsTyping(true);

    void (async () => {
      let result: RouteResponse;
      try {
        result = await routeMessage(text);
      } catch (err) {
        const cause = classifyClientRouteError(err);
        const fb = fallbackMatch(text);
        result = {
          workflowId: fb?.workflowId ?? null,
          confidence: fb?.confidence ?? 0,
          reason: fb?.reason ?? "I couldn't find a workflow that matches your question.",
          source: 'fallback',
          fallbackCause: cause,
        };
      }

      if (result.source === 'fallback') {
        console.warn('[Rio fallback]', result.fallbackCause);
      }

      const reply = buildReply(result);
      if (reply.noMatch) lastNoMatchSourceRef.current = result.source;
      setMessages((prev) => [...prev, { ...reply, id: nextId() }]);
      setIsTyping(false);
      pendingRef.current = false;
    })();
  }, [pushRioMessage]);

  const dismissOffer = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, dismissed: true } : m))
    );
  }, []);

  const requestHandoff = useCallback((trigger: 'footer' | 'no_match') => {
    if (handoffPendingRef.current) return;
    handoffPendingRef.current = true;
    const reason: TicketReason = resolveHandoffReason(trigger, lastNoMatchSourceRef.current);
    engineHandoff?.pauseIfRunning();
    openPanel();
    setIsCompact(false);
    setIsHandoffSharing(true);

    const transcript = messagesRef.current.map((m) => ({
      role: m.role,
      text: m.text ?? m.offer?.title,
      ts: new Date().toISOString(),
    }));
    const workflow = engineHandoff?.snapshot() ?? null;

    void (async () => {
      let summary = buildTemplateSummary({ transcript, workflow, reason });
      try {
        summary = await summarizeHandoff({ transcript, workflow, customer: { name: 'Demo User', business: 'Demo Store', plan: 'Growth' }, reason });
      } catch {
        summary = buildTemplateSummary({ transcript, workflow, reason });
      }
      createTicket({ reason, summary, workflow, transcript });
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'rio',
          handoff: true,
          text: "I've shared everything with our team. A support agent will pick this up from here.",
          source: summary.source,
          fallbackCause: summary.source === 'fallback' ? 'error' : null,
        },
      ]);
      setIsHandoffSharing(false);
      handoffPendingRef.current = false;
    })();
  }, [engineHandoff, openPanel]);

  const acceptOffer = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, dismissed: true } : m))
    );
    setMessages((prev) => {
      const msg = prev.find((m) => m.id === messageId);
      if (msg?.offer && onStartWorkflow) {
        setTimeout(() => {
          onStartWorkflow(msg.offer!, (prereqMsg) => {
            if (prereqMsg.text) {
              setMessages((prev2) => [...prev2, { id: nextId(), role: 'rio', text: prereqMsg.text }]);
            } else if (prereqMsg.offer) {
              setMessages((prev2) => [...prev2, { id: nextId(), role: 'rio', offer: prereqMsg.offer }]);
            }
          });
        }, 0);
      }
      return prev;
    });
  }, [onStartWorkflow]);

  // Expose setMessages for reset functionality
  useEffect(() => {
    (window as any).__clearProgressCards = () => {
      setMessages((prev) => prev.filter((m) => !m.progress));
    };
    return () => delete (window as any).__clearProgressCards;
  }, [setMessages]);

  return (
    <RioContext.Provider
      value={{
        isOpen,
        isCompact,
        workflowStepLabel,
        messages,
        isTyping,
        isHandoffSharing,
        focusNonce,
        openPanel,
        closePanel,
        togglePanel,
        collapseToCompact,
        expandFromCompact,
        sendMessage,
        dismissOffer,
        acceptOffer,
        requestInputFocus,
        requestHandoff,
        pushRioMessage,
        upsertProgressCard,
        setWorkflowStepLabel,
        setMessages,
      }}
    >
      {children}
    </RioContext.Provider>
  );
}

export function useRio() {
  const ctx = useContext(RioContext);
  if (!ctx) throw new Error('useRio must be inside RioProvider');
  return ctx;
}
