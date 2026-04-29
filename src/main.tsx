import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import LoginPage from './components/LoginPage.tsx'
import useAuthStore from './store/useAuthStore.ts'

const queryClient = new QueryClient()

function Root() {
  const token = useAuthStore((s) => s.token)
  return token ? <App /> : <LoginPage />
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')
createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Root />
    </QueryClientProvider>
  </StrictMode>,
)
