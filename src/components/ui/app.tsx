import { ThemeProvider } from '@/components/ui/theme-provider'
import { ConfigProvider, type ConfigProviderProps } from '@/components/ui/config-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import * as React from 'react'
import { useMessage } from '@/components/ui/message'
import { useConfirm } from '@/components/ui/confirm'
const AppContext = React.createContext<{
  message: ReturnType<typeof useMessage>[0]
  confirm: ReturnType<typeof useConfirm>[0]
} | null>(null)
export function useApp() {
  const context = React.useContext(AppContext)
  if (!context) throw new Error('useApp requires AppProvider')
  return context
}
function AppServices({ children }: { children: React.ReactNode }) {
  const [message, holder] = useMessage(),
    [confirm, modal] = useConfirm()
  return (
    <AppContext.Provider value={{ message, confirm }}>
      {children}
      {holder}
      {modal}
    </AppContext.Provider>
  )
}
export function AppProvider({ children, ...props }: ConfigProviderProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ConfigProvider {...props}>
        <TooltipProvider>
          <AppServices>{children}</AppServices>
          <Toaster richColors closeButton />
        </TooltipProvider>
      </ConfigProvider>
    </ThemeProvider>
  )
}
