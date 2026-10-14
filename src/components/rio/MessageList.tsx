import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../context/RioContext';
import WorkflowOfferCard from './WorkflowOfferCard';
import ProgressCard from './ProgressCard';
import FallbackBadge from './FallbackBadge';

interface MessageListProps {
  messages: ChatMessage[];
  onStartOffer: (messageId: string) => void;
  onDismissOffer: (messageId: string) => void;
}

export default function MessageList({ messages, onStartOffer, onDismissOffer }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="rio-message-list" data-testid="message-list" role="log" aria-live="polite">
      {messages.map((msg) => {
        if (msg.role === 'user') {
          return (
            <div key={msg.id} className="rio-bubble rio-bubble--user" data-testid="user-bubble">
              <span>{msg.text}</span>
            </div>
          );
        }

        // Rio message — may contain text, offer card, or progress card
        if (msg.offer) {
          return (
            <div key={msg.id} className="rio-bubble rio-bubble--rio">
              <WorkflowOfferCard
                title={msg.offer.title}
                reason={msg.offer.reason}
                estimatedMinutes={msg.offer.estimatedMinutes}
                source={msg.offer.source}
                fallbackCause={msg.offer.fallbackCause}
                dismissed={!!msg.dismissed}
                onStart={() => onStartOffer(msg.id)}
                onNotNow={() => onDismissOffer(msg.id)}
              />
            </div>
          );
        }

        if (msg.progress) {
          return (
            <div key={msg.id} className="rio-bubble rio-bubble--rio">
              <ProgressCard
                stepIndex={msg.progress.stepIndex}
                totalSteps={msg.progress.totalSteps}
                workflowTitle={msg.progress.workflowTitle}
              />
            </div>
          );
        }

        // Plain text bubble (greeting, no-match, handoff confirmation, etc.)
        return (
          <div key={msg.id} className="rio-bubble rio-bubble--rio" data-testid="rio-bubble">
            <span>{msg.text}</span>
            {msg.source === 'fallback' && (
              <FallbackBadge cause={msg.fallbackCause} />
            )}
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
