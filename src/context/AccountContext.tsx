import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { defaultMockAccount, type MockAccount } from '../data/mockAccount';

interface AccountContextValue {
  account: MockAccount;
  setAccount: (partial: Partial<MockAccount>) => void;
  resetAccount: () => void;
}

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccountState] = useState<MockAccount>(() => structuredClone(defaultMockAccount));

  const setAccount = useCallback((partial: Partial<MockAccount>) => {
    setAccountState((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetAccount = useCallback(() => {
    setAccountState(structuredClone(defaultMockAccount));
  }, []);

  return (
    <AccountContext value={{ account, setAccount, resetAccount }}>
      {children}
    </AccountContext>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be inside AccountProvider');
  return ctx;
}
