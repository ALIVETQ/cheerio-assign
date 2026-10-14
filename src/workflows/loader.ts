import type { Workflow, WorkflowStep } from './types';

// ─── Validation ───────────────────────────────────────────────────────────────

const VALID_MODES = new Set(['guide', 'assist']);
const VALID_COMPLETE_ON = new Set([
  'click', 'inputFilled', 'selectChanged', 'checkboxChecked', 'routeChanged', 'manualConfirm',
]);

export class WorkflowValidationError extends Error {
  constructor(workflowId: string, message: string) {
    super(`[workflow:${workflowId}] ${message}`);
    this.name = 'WorkflowValidationError';
  }
}

function assertField(
  id: string,
  condition: boolean,
  msg: string
): asserts condition {
  if (!condition) throw new WorkflowValidationError(id, msg);
}

function validateStep(wfId: string, step: WorkflowStep, index: number) {
  const prefix = `step[${index}]`;
  assertField(wfId, typeof step.id === 'string' && step.id.trim() !== '', `${prefix}: id is required`);
  assertField(wfId, typeof step.title === 'string' && step.title.trim() !== '', `${prefix}: title is required`);
  assertField(wfId, typeof step.instruction === 'string' && step.instruction.trim() !== '', `${prefix}: instruction is required`);
  assertField(wfId, typeof step.target === 'string' && step.target.trim() !== '', `${prefix}: target is required`);
  assertField(wfId, VALID_MODES.has(step.mode), `${prefix}: mode must be 'guide' or 'assist', got '${step.mode}'`);
  assertField(wfId, step.completeOn !== null && typeof step.completeOn === 'object', `${prefix}: completeOn is required`);
  assertField(wfId, VALID_COMPLETE_ON.has(step.completeOn.type), `${prefix}: completeOn.type '${step.completeOn.type}' is not valid`);
}

/**
 * Validates a raw workflow object and returns it typed.
 * Throws WorkflowValidationError with a descriptive message on any failure.
 */
export function validateWorkflow(raw: unknown): Workflow {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = raw as any;
  const id = typeof w?.id === 'string' ? w.id : '(unknown)';

  assertField(id, typeof w.id === 'string' && w.id.trim() !== '', 'id is required');
  assertField(id, typeof w.title === 'string' && w.title.trim() !== '', 'title is required');
  assertField(id, typeof w.description === 'string', 'description is required');
  assertField(id, Array.isArray(w.keywords), 'keywords must be an array');
  assertField(id, typeof w.level === 'number', 'level must be a number');
  assertField(id, typeof w.estimatedMinutes === 'number', 'estimatedMinutes must be a number');
  assertField(id, Array.isArray(w.steps) && w.steps.length > 0, 'steps must be a non-empty array');

  // Validate each step
  (w.steps as WorkflowStep[]).forEach((step, i) => validateStep(id, step, i));

  // Unique step IDs
  const stepIds = (w.steps as WorkflowStep[]).map((s) => s.id);
  const unique = new Set(stepIds);
  assertField(id, unique.size === stepIds.length, `duplicate step IDs detected: ${stepIds.join(', ')}`);

  return w as Workflow;
}

// ─── Real workflow registry ───────────────────────────────────────────────────
// Populated in 3B when the JSON files are written.
// For 3A we export an empty map; the dev sample is loaded separately.

const _registry = new Map<string, Workflow>();

export function registerWorkflow(w: Workflow): void {
  _registry.set(w.id, w);
}

export function getWorkflow(id: string): Workflow | undefined {
  return _registry.get(id);
}

export function getAllWorkflows(): Workflow[] {
  return Array.from(_registry.values());
}

export function getWorkflowIds(): string[] {
  return Array.from(_registry.keys());
}
