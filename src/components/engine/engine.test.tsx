/**
 * Unit tests for workflow engine spotlight and tooltip behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Spotlight from './Spotlight';
import StepTooltip from './StepTooltip';
import { useRef } from 'react';

describe('Spotlight and Tooltip', () => {
  beforeEach(() => {
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 400 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 600 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('tooltip clamps to viewport in small screen', () => {
    const mockCutout = {
      top: 500, // near bottom
      left: 350, // near right edge
      width: 100,
      height: 40,
    };

    const { container } = render(
      <StepTooltip
        title="Test Step"
        instruction="Do something"
        stepIndex={0}
        totalSteps={3}
        missingTarget={false}
        prefillApplied={false}
        cutout={mockCutout}
        onSkip={vi.fn()}
        onStuck={vi.fn()}
      />
    );

    const tooltip = container.querySelector('.step-tooltip') as HTMLElement;
    expect(tooltip).toBeTruthy();

    // Extract position from style
    const style = tooltip.style;
    const left = parseInt(style.left);

    // Should be clamped with 12px margin: max left = 400 - 320 - 12 = 68
    expect(left).toBeLessThanOrEqual(68);
    expect(left).toBeGreaterThanOrEqual(12);
  });

  it('missing target clears overlay after 3 seconds', async () => {
    vi.useFakeTimers();

    const TestWrapper = () => {
      const targetRef = useRef<HTMLElement | null>(null);
      return (
        <Spotlight
          targetRef={targetRef}
          title="Test"
          instruction="Test instruction"
          stepIndex={0}
          totalSteps={1}
          missingTarget={true}
          prefillApplied={false}
          onNext={vi.fn()}
          onBack={vi.fn()}
          onSkip={vi.fn()}
          onStuck={vi.fn()}
          onStop={vi.fn()}
        />
      );
    };

    render(<TestWrapper />);

    // Overlay should be present initially
    expect(document.querySelector('.spotlight-overlay')).toBeTruthy();

    // Fast-forward 3 seconds
    await vi.advanceTimersByTimeAsync(3100);

    // Overlay should be removed
    expect(document.querySelector('.spotlight-overlay')).toBeNull();

    vi.useRealTimers();
  });
});
