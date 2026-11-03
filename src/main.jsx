import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import PWAUpdatePrompt from './components/pwa/PWAUpdatePrompt'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App />
        <PWAUpdatePrompt />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
