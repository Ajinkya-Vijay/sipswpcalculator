import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/site.css'
import App from './App.jsx'

const container = document.getElementById('root')

if (container) {
  // Each generated page declares which calculator it should open on.
  const { view = 'investment', mode = 'sip' } = container.dataset

  createRoot(container).render(
    <StrictMode>
      <App initialView={view} initialMode={mode} />
    </StrictMode>,
  )
}
