import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../context/RioContext';
import WorkflowOfferCard from './WorkflowOfferCard';
import ProgressCard from './ProgressCard';
import FallbackBadge from './FallbackBadge';

interface MessageListProps {
  messages: ChatMessage[];
  isTyping?: boolean;
  onStartOffer: (messageId: string) => void;
  onDismissOffer: (messageId: string) => void;
  onRephrase?: () => void;
  onNoMatchHuman?: () => void;
  isHandoffSharing?: boolean;
}

export default function MessageList({
  messages,
  isTyping,
  onStartOffer,
  onDismissOffer,
  onRephrase,
  onNoMatchHuman,
  isHandoffSharing,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isTyping]);

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

        if (msg.handoff) {
          return (
            <div key={msg.id} className="rio-bubble rio-bubble--rio" data-testid="handoff-confirmation">
              <span>{msg.text ?? "I've shared everything with our team. A support agent will pick this up from here."}</span>
              {msg.source === 'fallback' && <FallbackBadge cause={msg.fallbackCause} />}
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

        return (
          <div
            key={msg.id}
            className="rio-bubble rio-bubble--rio"
            data-testid={msg.noMatch ? 'rio-no-match' : 'rio-bubble'}
          >
            <span>{msg.text}</span>
            {msg.source === 'fallback' && (
              <FallbackBadge cause={msg.fallbackCause} />
            )}
            {msg.noMatch && (
              <div className="rio-no-match-actions">
                <button
                  type="button"
                  className="rio-rephrase-btn"
                  data-testid="rio-rephrase-btn"
                  onClick={onRephrase}
                >
                  Rephrase
                </button>
                <button
                  type="button"
                  className="rio-rephrase-btn"
                  data-testid="rio-no-match-human-btn"
                  onClick={onNoMatchHuman}
                >
                  Talk to a human
                </button>
              </div>
            )}
          </div>
        );
      })}
      {(isTyping || isHandoffSharing) && (
        <div className="rio-bubble rio-bubble--rio" data-testid={isHandoffSharing ? 'rio-handoff-sharing' : 'rio-typing'}>
          <span className="rio-typing-dots">
            {isHandoffSharing ? 'Sharing with our team...' : 'Rio is typing…'}
          </span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
