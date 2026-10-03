import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/site.css'
import App from './App.jsx'
import LoanCalculator from './LoanCalculator.jsx'

const container = document.getElementById('root')

if (container) {
  // Each generated page declares which calculator it should open on.
  const { view = 'investment', mode = 'sip', loan = 'home' } = container.dataset

  createRoot(container).render(
    <StrictMode>
      {view === 'loan' ? <LoanCalculator loanType={loan} /> : <App initialView={view} initialMode={mode} />}
    </StrictMode>,
  )
}
