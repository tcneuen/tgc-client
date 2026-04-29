import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import LoginPage from './components/LoginPage.tsx'
import useAuthStore from './store/useAuthStore.ts'

function Root() {
  const token = useAuthStore((s) => s.token)
  return token ? <App /> : <LoginPage />
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')
createRoot(rootEl).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
