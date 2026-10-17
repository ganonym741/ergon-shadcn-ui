import { Flex } from '@/components/ui/flex'
export function Space(props: React.ComponentProps<typeof Flex>) {
  return <Flex wrap {...props} />
}
export function Compact({
  children,
  vertical,
  className,
}: {
  children: React.ReactNode
  vertical?: boolean
  className?: string
}) {
  return (
    <div
      className={`inline-flex ${vertical ? 'flex-col [&>*]:rounded-none [&>:first-child]:rounded-t-md [&>:last-child]:rounded-b-md [&>*+*]:-mt-px' : '[&>*]:rounded-none [&>:first-child]:rounded-l-md [&>:last-child]:rounded-r-md [&>*+*]:-ml-px'} [&>*:focus-within]:relative [&>*:focus-within]:z-10 ${className ?? ''}`}
    >
      {children}
    </div>
  )
}
