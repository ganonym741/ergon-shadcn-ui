import * as React from 'react'
import { Check } from 'lucide-react'
import { RadioGroup } from 'radix-ui'
import { packageManagerLabels, type DocsPackageManager } from './installation'
import { packageManagerIcons } from './package-manager-icons'

const managerColors: Record<DocsPackageManager, string> = {
  npm: '[--manager-color:#b91c1c] dark:[--manager-color:#fca5a5]',
  bun: '[--manager-color:#92400e] dark:[--manager-color:#fcd9b8]',
  deno: '[--manager-color:#047857] dark:[--manager-color:#6ee7b7]',
  pnpm: '[--manager-color:#9a5a00] dark:[--manager-color:#fbbf24]',
  yarn: '[--manager-color:#0369a1] dark:[--manager-color:#7dd3fc]',
}

export function PackageManagerSelect({
  value,
  onChange,
}: {
  value: DocsPackageManager
  onChange: (manager: DocsPackageManager) => void
}) {
  const id = React.useId()
  return (
    <div className="my-5 space-y-2.5 text-xs">
      <div id={id} className="font-medium text-muted-foreground">
        Package manager
      </div>
      <RadioGroup.Root
        aria-labelledby={id}
        value={value}
        onValueChange={(manager) => onChange(manager as DocsPackageManager)}
        className="flex w-fit max-w-full flex-wrap gap-1.5 rounded-xl border bg-muted/25 p-1.5"
      >
        {(Object.keys(packageManagerLabels) as DocsPackageManager[]).map((manager) => (
          <RadioGroup.Item
            key={manager}
            value={manager}
            className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[color-mix(in_oklab,var(--manager-color)_18%,transparent)] bg-[color-mix(in_oklab,var(--manager-color)_6%,var(--background))] px-3 font-medium text-[var(--manager-color)] outline-none transition-[background-color,color,box-shadow] hover:bg-[color-mix(in_oklab,var(--manager-color)_13%,var(--background))] focus-visible:ring-2 focus-visible:ring-[var(--manager-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=checked]:border-[var(--manager-color)] data-[state=checked]:bg-[var(--manager-color)] data-[state=checked]:text-white data-[state=checked]:shadow-sm dark:data-[state=checked]:text-slate-950 ${managerColors[manager]}`}
          >
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-4 shrink-0"
            >
              <path d={packageManagerIcons[manager]} />
            </svg>
            {packageManagerLabels[manager]}
            <span aria-hidden="true" className="inline-flex size-3.5 items-center justify-center">
              {value === manager && <Check className="size-3.5" strokeWidth={2.5} />}
            </span>
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
      {value === 'deno' && (
        <span className="text-muted-foreground">
          Set up dx once with <code>deno x --install-alias</code>, or use <code>deno x</code>.
        </span>
      )}
    </div>
  )
}
