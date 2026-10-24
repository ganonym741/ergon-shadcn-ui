import * as React from 'react'
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'
import { Download, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
export function QRCode({
  value,
  size = 160,
  level = 'M',
  className,
  color = '#202124',
  background = '#ffffff',
  status = 'active',
  onRefresh,
  downloadable = false,
  downloadFormat = 'svg',
  icon,
}: {
  value: string
  size?: number
  level?: 'L' | 'M' | 'Q' | 'H'
  className?: string
  color?: string
  background?: string
  status?: 'active' | 'loading' | 'expired' | 'scanned'
  onRefresh?: () => void
  downloadable?: boolean
  downloadFormat?: 'svg' | 'png'
  icon?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const download = () => {
    if (downloadFormat === 'png') {
      const canvas = ref.current?.querySelector('canvas')
      if (canvas) {
        const link = document.createElement('a')
        link.href = canvas.toDataURL('image/png')
        link.download = 'qr-code.png'
        link.click()
      }
      return
    }
    const svg = ref.current?.querySelector('svg')
    if (!svg) return
    const url = URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }),
    )
    const a = document.createElement('a')
    a.href = url
    a.download = 'qr-code.svg'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <div className="inline-flex flex-col items-center gap-3">
      <div
        ref={ref}
        className={cn('relative inline-flex rounded-xl border p-4', className)}
        style={{ background }}
      >
        <QRCodeSVG
          title="QR code"
          value={value}
          size={size}
          level={level}
          bgColor={background}
          fgColor={color}
          marginSize={1}
          imageSettings={
            icon
              ? {
                  src: icon,
                  height: size * 0.18,
                  width: size * 0.18,
                  excavate: true,
                  crossOrigin: 'anonymous',
                }
              : undefined
          }
        />
        <QRCodeCanvas
          value={value}
          size={size * 2}
          level={level}
          bgColor={background}
          fgColor={color}
          marginSize={1}
          style={{ display: 'none' }}
          imageSettings={
            icon
              ? {
                  src: icon,
                  height: size * 0.36,
                  width: size * 0.36,
                  excavate: true,
                  crossOrigin: 'anonymous',
                }
              : undefined
          }
        />
        {status !== 'active' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-background/90 backdrop-blur-[2px]">
            <span className="text-sm font-medium">
              {status === 'expired'
                ? 'Code expired'
                : status === 'loading'
                  ? 'Preparing your code…'
                  : 'Successfully scanned'}
            </span>
            {status === 'expired' && onRefresh && (
              <Button size="sm" variant="outline" onClick={onRefresh}>
                <RefreshCw />
                Refresh
              </Button>
            )}
          </div>
        )}
      </div>
      {downloadable && (
        <Button size="sm" variant="outline" onClick={download}>
          <Download />
          Download {downloadFormat.toUpperCase()}
        </Button>
      )}
    </div>
  )
}
