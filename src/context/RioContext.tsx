import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  /** offer was dismissed with "Not now" */
  dismissed?: boolean;
  /** progress card payload (wired in Phase 3) */
  progress?: { stepIndex: number; totalSteps: number; workflowTitle: string };
  /** handoff confirmation (wired in Phase 5) */
  handoff?: boolean;
  source?: 'gemini' | 'fallback';
  fallbackCause?: string | null;
}

interface RioContextValue {
  isOpen: boolean;
  messages: ChatMessage[];
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  sendMessage: (text: string) => void;
  dismissOffer: (messageId: string) => void;
  acceptOffer: (messageId: string) => void;
  /** Lets Phase 3+ push arbitrary Rio messages (progress, handoff, etc.) */
  pushRioMessage: (msg: Omit<ChatMessage, 'id'>) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const RioContext = createContext<RioContextValue | null>(null);

// ─── Scripted reply (replaced by real router in Phase 4) ─────────────────────

function buildScriptedOffer(): WorkflowOffer {
  return {
    workflowId: 'wf-first-campaign',
    title: 'Set up your first WhatsApp campaign',
    reason: 'This looks like you want to send a WhatsApp broadcast to your contacts.',
    estimatedMinutes: 4,
    source: 'gemini',
    fallbackCause: null,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

let _idCounter = 0;
function nextId() {
  return `msg-${++_idCounter}-${Date.now()}`;
}

const GREETING: ChatMessage = {
  id: 'rio-greeting',
  role: 'rio',
  text: "Hi, I'm Rio 👋 I'm here to guide you through Cheerio AI. What are you trying to do today? Describe your problem in your own words.",
};

export function RioProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  // Track whether we're waiting on a reply (Phase 4 will use this)
  const pendingRef = useRef(false);

  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);
  const togglePanel = useCallback(() => setIsOpen((v) => !v), []);

  const pushRioMessage = useCallback((msg: Omit<ChatMessage, 'id'>) => {
    setMessages((prev) => [...prev, { ...msg, id: nextId() }]);
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (pendingRef.current) return;

    // Add user bubble
    const userMsg: ChatMessage = { id: nextId(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);

    // Scripted reply: always produce an offer card (replaced in Phase 4)
    pendingRef.current = true;
    setTimeout(() => {
      const offer = buildScriptedOffer();
      const rioMsg: ChatMessage = {
        id: nextId(),
        role: 'rio',
        offer,
        source: offer.source,
        fallbackCause: offer.fallbackCause,
      };
      setMessages((prev) => [...prev, rioMsg]);
      pendingRef.current = false;
    }, 600);
  }, []);

  const dismissOffer = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, dismissed: true } : m))
    );
  }, []);

  const acceptOffer = useCallback((_messageId: string) => {
    // Wired to Workflow Engine in Phase 3.
    // For now just marks it accepted so the Start button doesn't stay active.
    setMessages((prev) =>
      prev.map((m) =>
        m.id === _messageId ? { ...m, dismissed: true } : m
      )
    );
  }, []);

  return (
    <RioContext
      value={{
        isOpen,
        messages,
        openPanel,
        closePanel,
        togglePanel,
        sendMessage,
        dismissOffer,
        acceptOffer,
        pushRioMessage,
      }}
    >
      {children}
    </RioContext>
  );
}

export function useRio() {
  const ctx = useContext(RioContext);
  if (!ctx) throw new Error('useRio must be inside RioProvider');
  return ctx;
}
