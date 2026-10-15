export interface RouteResponse {
  workflowId: string | null;
  confidence: number;
  reason: string;
  source: 'gemini' | 'fallback';
  fallbackCause: string | null;
}

export const CLIENT_ROUTE_TIMEOUT_MS = 8000;

export class RouteRequestError extends Error {
  status: number | null;
  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = 'RouteRequestError';
    this.status = status;
  }
}

export async function routeMessage(
  message: string,
  context?: { route?: string; completedWorkflows?: string[] }
): Promise<RouteResponse> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CLIENT_ROUTE_TIMEOUT_MS);
  try {
    const res = await fetch('/api/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      throw new RouteRequestError(`HTTP ${res.status}`, res.status);
    }
    return (await res.json()) as RouteResponse;
  } catch (err) {
    if (err instanceof RouteRequestError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new RouteRequestError('timeout', null);
    }
    throw new RouteRequestError(err instanceof Error ? err.message : 'network', null);
  } finally {
    clearTimeout(timer);
  }
}

export function classifyClientRouteError(err: unknown): 'timeout' | 'rate_limit' | 'error' {
  if (err instanceof RouteRequestError) {
    if (err.message === 'timeout') return 'timeout';
    if (err.status === 429) return 'rate_limit';
  }
  if (err instanceof Error && err.name === 'AbortError') return 'timeout';
  return 'error';
}
