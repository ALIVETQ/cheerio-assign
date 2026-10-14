import { createContext, useContext, type ReactNode } from 'react';
import { useWorkflowEngine, type EngineActions, type UseWorkflowEngineResult } from '../components/engine/useWorkflowEngine';
import type { Workflow } from '../workflows/types';
import { getWorkflow } from '../workflows/loader';

// ─── Context ──────────────────────────────────────────────────────────────────

type EngineContextValue = UseWorkflowEngineResult;

const EngineContext = createContext<EngineContextValue | null>(null);

export function EngineProvider({ children }: { children: ReactNode }) {
  const engine = useWorkflowEngine(getWorkflow);
  return <EngineContext value={engine}>{children}</EngineContext>;
}

export function useEngine(): EngineContextValue {
  const ctx = useContext(EngineContext);
  if (!ctx) throw new Error('useEngine must be inside EngineProvider');
  return ctx;
}

export type { EngineActions, Workflow };
