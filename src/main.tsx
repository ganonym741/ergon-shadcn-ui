import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { TooltipProvider } from './components/ui/tooltip'
import { Toaster } from './components/ui/sonner'
import App from './App'
import './index.css'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <App />
        <Toaster richColors closeButton position="bottom-right" />
      </TooltipProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
