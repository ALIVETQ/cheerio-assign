import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './workflows/index'  // register all workflows before app renders
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
