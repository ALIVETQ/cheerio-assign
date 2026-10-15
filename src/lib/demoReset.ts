import { TICKETS_KEY } from './tickets';

const ENGINE_KEY = 'rio:engine';
const MESSAGES_KEY = 'rio:messages';

export function clearDemoState() {
  try {
    localStorage.removeItem(ENGINE_KEY);
    localStorage.removeItem(TICKETS_KEY);
    localStorage.removeItem(MESSAGES_KEY);
  } catch {
    /* ignore */
  }
}

/** Clear all demo state and reload so in-memory React state also resets. */
export function resetDemo() {
  clearDemoState();
  window.location.href = '/';
}
