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
  /** progress card payload */
  progress?: { stepIndex: number; totalSteps: number; workflowTitle: string };
  /** handoff confirmation (wired in Phase 5) */
  handoff?: boolean;
  source?: 'gemini' | 'fallback';
  fallbackCause?: string | null;
}

interface RioContextValue {
  isOpen: boolean;
  isCompact: boolean;
  /** Step label shown in the compact pill, e.g. "Step 3 of 10" */
  workflowStepLabel: string | null;
  messages: ChatMessage[];
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  collapseToCompact: () => void;
  expandFromCompact: () => void;
  sendMessage: (text: string) => void;
  dismissOffer: (messageId: string) => void;
  acceptOffer: (messageId: string) => void;
  pushRioMessage: (msg: Omit<ChatMessage, 'id'>) => void;
  setWorkflowStepLabel: (label: string | null) => void;
}

interface RioProviderProps {
  children: ReactNode;
  /** Called when the user clicks Start on an offer card. Phase 3 wires this to the engine. */
  onStartWorkflow?: (
    offer: WorkflowOffer,
    onPrereqFailed: (msg: { text?: string; offer?: WorkflowOffer }) => void
  ) => void;
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

export function RioProvider({ children, onStartWorkflow }: RioProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [workflowStepLabel, setWorkflowStepLabel] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const pendingRef = useRef(false);

  const openPanel = useCallback(() => { setIsOpen(true); setIsCompact(false); }, []);
  const closePanel = useCallback(() => setIsOpen(false), []);
  const togglePanel = useCallback(() => setIsOpen((v) => !v), []);
  const collapseToCompact = useCallback(() => { setIsCompact(true); setIsOpen(false); }, []);
  const expandFromCompact = useCallback(() => { setIsCompact(false); setIsOpen(true); }, []);

  const pushRioMessage = useCallback((msg: Omit<ChatMessage, 'id'>) => {
    setMessages((prev) => [...prev, { ...msg, id: nextId() }]);
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (pendingRef.current) return;
    const userMsg: ChatMessage = { id: nextId(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
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

  const acceptOffer = useCallback((messageId: string) => {
    // Mark as dismissed so the card collapses
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, dismissed: true } : m))
    );
    // Find the offer and delegate to the engine
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

  return (
    <RioContext
      value={{
        isOpen,
        isCompact,
        workflowStepLabel,
        messages,
        openPanel,
        closePanel,
        togglePanel,
        collapseToCompact,
        expandFromCompact,
        sendMessage,
        dismissOffer,
        acceptOffer,
        pushRioMessage,
        setWorkflowStepLabel,
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
