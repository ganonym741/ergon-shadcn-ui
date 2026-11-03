import * as React from 'react'
export type Theme = 'light' | 'dark' | 'system'
const ThemeContext = React.createContext<{
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: string) => void
}>({ theme: 'light', resolvedTheme: 'light', setTheme: () => {} })
/**
 * Resolves the selected or system appearance and supplies theme controls. Applies the appearance in memory even when persistence is blocked.
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
}: {
  children: React.ReactNode
  defaultTheme?: Theme
  attribute?: 'class'
  enableSystem?: boolean
}) {
  const [theme, setTheme] = React.useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('ergon-appearance')
      return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : defaultTheme
    } catch {
      return defaultTheme
    }
  })
  const [system, setSystem] = React.useState<'light' | 'dark'>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  )
  React.useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => setSystem(media.matches ? 'dark' : 'light')
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])
  const resolvedTheme = theme === 'system' ? system : theme
  React.useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
    document.documentElement.style.colorScheme = resolvedTheme
    try {
      localStorage.setItem('ergon-appearance', theme)
    } catch {
      // Restricted storage must not prevent in-memory theme changes or rendering.
    }
  }, [theme, resolvedTheme])
  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme: (next) => {
          if (next === 'light' || next === 'dark' || next === 'system') setTheme(next)
        },
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
export function useTheme() {
  return React.useContext(ThemeContext)
}
