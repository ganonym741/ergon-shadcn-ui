'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Slider as SliderPrimitive } from 'radix-ui'

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  tooltip,
  marks,
  formatValue = String,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  tooltip?: boolean
  marks?: Record<number, React.ReactNode>
  formatValue?: (value: number) => string
}) {
  const [internalValues, setInternalValues] = React.useState(defaultValue ?? [min, max])
  const _values = React.useMemo(
    () => (Array.isArray(value) ? value : internalValues),
    [value, internalValues, min, max],
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={_values}
      min={min}
      max={max}
      className={cn(
        'relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
        className,
      )}
      {...props}
      onValueChange={(next) => {
        setInternalValues(next)
        props.onValueChange?.(next)
      }}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          'relative grow overflow-hidden rounded-full bg-muted data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5',
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            'absolute bg-primary data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full',
          )}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          aria-label={`${props['aria-label'] ?? 'Value'}${_values.length > 1 ? ' ' + (index + 1) : ''}`}
          key={index}
          className="block size-4 shrink-0 rounded-full border border-primary bg-white shadow-sm ring-ring/50 transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
        >
          {tooltip && (
            <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background">
              {formatValue(_values[index])}
            </span>
          )}
        </SliderPrimitive.Thumb>
      ))}
      {marks &&
        Object.entries(marks).map(([value, label]) => (
          <span
            key={value}
            className="pointer-events-none absolute text-[10px] text-muted-foreground"
            style={
              props.orientation === 'vertical'
                ? { bottom: `${((Number(value) - min) / (max - min)) * 100}%`, left: 20 }
                : {
                    left: `${((Number(value) - min) / (max - min)) * 100}%`,
                    top: 18,
                    transform: 'translateX(-50%)',
                  }
            }
          >
            {label}
          </span>
        ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
