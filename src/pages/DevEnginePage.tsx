/**
 * DEV-ONLY: /dev/engine
 * Only rendered in development builds (import.meta.env.DEV).
 * Allows starting any registered workflow by ID for manual testing.
 * Must NOT be included in production builds.
 */
import { useEngine } from '../context/EngineContext';
import { getAllWorkflows } from '../workflows/loader';
import { validateWorkflow } from '../workflows/loader';
import devSampleRaw from '../workflows/dev/wf-dev-sample.json';

// Load the dev sample (not in the real registry)
const DEV_SAMPLE = validateWorkflow(devSampleRaw);

export default function DevEnginePage() {
  const { state, workflow, actions } = useEngine();
  const registeredWorkflows = getAllWorkflows();
  const allWorkflows = [DEV_SAMPLE, ...registeredWorkflows];

  return (
    <div style={{ padding: '2rem', maxWidth: 600 }}>
      <h2 style={{ marginBottom: '0.5rem' }}>🛠 Dev Engine Harness</h2>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        Dev-only. Start any workflow by ID to test the engine manually.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
        {allWorkflows.map((wf) => (
          <button
            key={wf.id}
            data-testid={`dev-start-${wf.id}`}
            onClick={() => actions.start(wf)}
            style={{
              padding: '0.75rem 1rem',
              background: '#7C3AED',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            ▶ {wf.title}
            <span style={{ fontSize: '0.75rem', opacity: 0.75, display: 'block' }}>{wf.id}</span>
          </button>
        ))}
      </div>

      {state.status !== 'idle' && (
        <div style={{
          padding: '1rem',
          background: '#F3F4F6',
          borderRadius: 8,
          marginBottom: '1rem',
          fontSize: '0.875rem',
        }}>
          <strong>Engine state</strong>
          <pre style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
            {JSON.stringify({ ...state, workflowTitle: workflow?.title }, null, 2)}
          </pre>
        </div>
      )}

      {state.status !== 'idle' && (
        <button
          onClick={actions.reset}
          data-testid="dev-reset"
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #E5E7EB',
            background: 'white',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Reset engine
        </button>
      )}
    </div>
  );
}
