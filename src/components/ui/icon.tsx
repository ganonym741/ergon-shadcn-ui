import type { LucideIcon, LucideProps } from 'lucide-react'
export function Icon({ icon: Component, size = 18, ...props }: LucideProps & { icon: LucideIcon }) {
  return <Component size={size} aria-hidden={!props['aria-label']} {...props} />
}
export function SpriteIcon({
  name,
  spriteUrl = '/icons.svg',
  size = 18,
  ...props
}: React.SVGProps<SVGSVGElement> & { name: string; spriteUrl?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      aria-hidden={!props['aria-label']}
      {...props}
    >
      <use href={`${spriteUrl}#${name}`} />
    </svg>
  )
}
