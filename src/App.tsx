import { BrowserRouter } from 'react-router-dom';
import { AccountProvider } from './context/AccountContext';
import { RioProvider } from './context/RioContext';
import AppRoutes from './AppRoutes';
import RioWidget from './components/rio/RioWidget';

function App() {
  return (
    <AccountProvider>
      <BrowserRouter>
        <RioProvider>
          <AppRoutes />
          <RioWidget />
        </RioProvider>
      </BrowserRouter>
    </AccountProvider>
  );
}

export default App;
