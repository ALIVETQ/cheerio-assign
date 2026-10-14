import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AccountProvider } from './context/AccountContext';
import AppRoutes from './AppRoutes';

describe('App', () => {
  it('renders without crashing and shows the Dashboard title', () => {
    render(
      <AccountProvider>
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes />
        </MemoryRouter>
      </AccountProvider>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
