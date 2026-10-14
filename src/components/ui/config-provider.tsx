import { contrastForeground } from '@/lib/contrast'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Direction } from 'radix-ui'
export interface UIConfig {
  density: 'comfortable' | 'compact'
  direction: 'ltr' | 'rtl'
  locale: string
}
const ConfigContext = React.createContext<UIConfig>({
  density: 'comfortable',
  direction: 'ltr',
  locale: 'en-US',
})
const PortalContext = React.createContext<HTMLElement | null>(null)
export const usePortalContainer = () => React.useContext(PortalContext) ?? undefined
export const useUIConfig = () => React.useContext(ConfigContext)
export interface ConfigProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  density?: UIConfig['density']
  direction?: UIConfig['direction']
  locale?: string
  accent?: string
  radius?: number
}
export function ConfigProvider({
  density: providedDensity,
  direction: providedDirection,
  locale: providedLocale,
  accent,
  radius,
  children,
  style,
  className,
  ...props
}: ConfigProviderProps) {
  const parent = useUIConfig(),
    density = providedDensity ?? parent.density,
    direction = providedDirection ?? parent.direction,
    locale = providedLocale ?? parent.locale
  const [portal, setPortal] = React.useState<HTMLDivElement | null>(null)
  return (
    <ConfigContext.Provider value={{ density, direction, locale }}>
      <PortalContext.Provider value={portal}>
        <Direction.Provider dir={direction}>
          <div
            dir={direction}
            lang={locale}
            data-density={density}
            className={cn('ergon-root', className)}
            style={
              {
                ...(accent
                  ? {
                      '--primary': accent,
                      '--ring': accent,
                      '--primary-foreground': contrastForeground(accent),
                    }
                  : {}),
                ...(radius !== undefined ? { '--radius': `${radius}px` } : {}),
                ...style,
              } as React.CSSProperties
            }
            {...props}
          >
            {children}
            <div ref={setPortal} data-ergon-portals="" style={{ display: 'contents' }} />
          </div>
        </Direction.Provider>
      </PortalContext.Provider>
    </ConfigContext.Provider>
  )
}
