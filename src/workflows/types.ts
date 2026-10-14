// ─── Workflow JSON schema types (section 6.1) ────────────────────────────────

export type CompleteOnType =
  | 'click'
  | 'inputFilled'
  | 'selectChanged'
  | 'checkboxChecked'
  | 'routeChanged'
  | 'manualConfirm';

export type StepMode = 'guide' | 'assist';

export interface CompleteOn {
  type: CompleteOnType;
  target?: string;   // CSS selector; omit for routeChanged / manualConfirm
  route?: string;    // for routeChanged: the path to match
}

export interface PrefillSpec {
  target: string;   // CSS selector of the field to pre-fill
  value: string;
}

export interface WorkflowStep {
  id: string;
  title: string;
  instruction: string;
  target: string;          // CSS selector for the spotlight
  route?: string;          // navigate here before showing this step
  completeOn: CompleteOn;
  mode: StepMode;
  prefill?: PrefillSpec;
}

export interface Workflow {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  examplePhrases?: string[];
  level: number;
  estimatedMinutes: number;
  preconditions?: string[];
  steps: WorkflowStep[];
}

// ─── Engine state ────────────────────────────────────────────────────────────

export type EngineStatus = 'idle' | 'running' | 'completed' | 'stuck';

export interface EngineState {
  workflowId: string | null;
  stepIndex: number;
  status: EngineStatus;
}

export const INITIAL_ENGINE_STATE: EngineState = {
  workflowId: null,
  stepIndex: 0,
  status: 'idle',
};
