import { useState, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRio } from '../../context/RioContext';
import MessageList from './MessageList';

const MAX_INPUT_LENGTH = 500;

export default function RioWidget() {
  const { isOpen, messages, togglePanel, closePanel, sendMessage, dismissOffer, acceptOffer } =
    useRio();

  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_INPUT_LENGTH) {
      setInputError(`Message is too long (max ${MAX_INPUT_LENGTH} characters).`);
      return;
    }
    setInputError('');
    sendMessage(trimmed);
    setInputValue('');
  }, [inputValue, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (val.length > MAX_INPUT_LENGTH) {
      setInputError(`Message is too long (max ${MAX_INPUT_LENGTH} characters).`);
    } else {
      setInputError('');
    }
  }, []);

  const handleHumanHandoff = useCallback(() => {
    // Stubbed here; wired in Phase 5
    alert('Handoff to human — coming in Phase 5!');
  }, []);

  return (
    <>
      {/* ── Floating button ── */}
      <button
        className="rio-fab"
        onClick={togglePanel}
        aria-label={isOpen ? 'Close Rio support' : 'Open Rio support'}
        data-testid="rio-fab"
        data-tour="rio-fab"
      >
        {isOpen ? (
          <span className="rio-fab-icon">✕</span>
        ) : (
          <span className="rio-fab-icon" aria-hidden>🎧</span>
        )}
      </button>

      {/* ── Slide-in panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            className="rio-panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            aria-label="Rio support panel"
            data-testid="rio-panel"
          >
            {/* Header */}
            <header className="rio-panel-header">
              <div className="rio-panel-header-left">
                <span className="rio-panel-avatar">🎧</span>
                <div>
                  <span className="rio-panel-name">Rio</span>
                  <span className="rio-panel-proto-badge">Prototype</span>
                </div>
              </div>
              <button
                className="rio-panel-close"
                onClick={closePanel}
                aria-label="Close Rio panel"
                data-testid="rio-close-btn"
              >
                ✕
              </button>
            </header>

            {/* Message list */}
            <div className="rio-panel-body">
              <MessageList
                messages={messages}
                onStartOffer={acceptOffer}
                onDismissOffer={dismissOffer}
              />
            </div>

            {/* Input area */}
            <footer className="rio-panel-footer">
              {inputError && (
                <p className="rio-input-error" role="alert" data-testid="input-error">
                  {inputError}
                </p>
              )}
              <div className="rio-input-row">
                <input
                  ref={inputRef}
                  className="rio-input"
                  type="text"
                  placeholder="Describe your problem…"
                  value={inputValue}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  maxLength={MAX_INPUT_LENGTH + 50} /* allow typing a bit over so error shows */
                  aria-label="Type your message"
                  data-testid="rio-input"
                />
                <button
                  className="rio-send-btn"
                  onClick={handleSend}
                  disabled={!inputValue.trim() || inputValue.trim().length > MAX_INPUT_LENGTH}
                  aria-label="Send message"
                  data-testid="rio-send-btn"
                >
                  ➤
                </button>
              </div>
              <button
                className="rio-human-btn"
                onClick={handleHumanHandoff}
                data-testid="rio-human-btn"
              >
                💬 Talk to a human
              </button>
            </footer>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
