import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders without crashing and shows the Phase 0 placeholder', () => {
    render(<App />);
    expect(screen.getByText('Rio prototype: Phase 0')).toBeInTheDocument();
  });
});
