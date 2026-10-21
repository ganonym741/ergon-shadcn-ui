import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Combobox, type SelectOption } from '@/components/ui/combobox'
import { Rate } from '@/components/ui/rate'
import { Slider } from '@/components/ui/slider'
import { RadioButtons } from '@/components/ui/radio'
import { CheckboxGroup } from '@/components/ui/checkbox'
import { DateRangePicker, DateTimeRangePicker } from '@/components/ui/date-picker'
import { TreeSelect } from '@/components/ui/tree-select'
import { Upload, type UploadFile } from '@/components/ui/upload'
import { useUIConfig } from '@/components/ui/config-provider'
import type { TreeNode } from '@/components/ui/tree'
export type FieldValueType =
  | 'text'
  | 'textarea'
  | 'password'
  | 'number'
  | 'money'
  | 'percent'
  | 'date'
  | 'datetime'
  | 'time'
  | 'select'
  | 'switch'
  | 'checkbox'
  | 'rate'
  | 'color'
  | 'date-range'
  | 'datetime-range'
  | 'upload'
  | 'slider'
  | 'radio'
  | 'checkbox-group'
  | 'tree-select'
export interface FieldPlusProps {
  type?: FieldValueType
  value?: unknown
  onValueChange?: (value: any) => void
  mode?: 'read' | 'edit'
  options?: SelectOption[]
  placeholder?: string
  disabled?: boolean
  id?: string
  currency?: string
  locale?: string
  invalid?: boolean
  treeNodes?: TreeNode[]
}
export function FieldPlus({
  type = 'text',
  value,
  onValueChange,
  mode = 'read',
  options = [],
  placeholder,
  disabled,
  id,
  currency = 'USD',
  locale,
  invalid,
  treeNodes = [],
}: FieldPlusProps) {
  const config = useUIConfig(),
    resolvedLocale = locale ?? config.locale
  if (mode === 'read') {
    if (value === undefined || value === null || value === '')
      return <span className="text-muted-foreground">—</span>
    if (type === 'money')
      return (
        <span className="tabular-nums">
          {new Intl.NumberFormat(resolvedLocale, { style: 'currency', currency }).format(
            Number(value),
          )}
        </span>
      )
    if (type === 'percent') return <span>{String(value)}%</span>
    if (type === 'switch' || type === 'checkbox') return <span>{value ? 'Yes' : 'No'}</span>
    if (type === 'select')
      return <span>{options.find((o) => o.value === value)?.label ?? String(value)}</span>
    if (type === 'password') return <span>••••••••</span>
    if (type === 'rate') return <Rate value={Number(value)} disabled />
    if (type === 'color')
      return (
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-full" style={{ background: String(value) }} />
          {String(value)}
        </span>
      )
    if (type === 'upload')
      return (
        <span>
          {Array.isArray(value)
            ? value.map((entry: any) => entry.file?.name ?? entry.name ?? 'File').join(', ')
            : 'No files'}
        </span>
      )
    if (type === 'date-range' || type === 'datetime-range') {
      const range = value as { from?: Date; to?: Date }
      return (
        <span>
          {range.from ? new Intl.DateTimeFormat(resolvedLocale).format(new Date(range.from)) : '—'}{' '}
          – {range.to ? new Intl.DateTimeFormat(resolvedLocale).format(new Date(range.to)) : '—'}
        </span>
      )
    }
    return (
      <span>
        {Array.isArray(value)
          ? value
              .map((item) => options.find((option) => option.value === item)?.label ?? item)
              .join(', ')
          : String(value)}
      </span>
    )
  }
  if (type === 'slider')
    return (
      <Slider
        aria-label={placeholder ?? 'Value'}
        value={[Number(value) || 0]}
        onValueChange={(next) => onValueChange?.(next[0])}
        disabled={disabled}
        tooltip
      />
    )
  if (type === 'radio')
    return (
      <RadioButtons
        options={options}
        value={String(value ?? '')}
        onValueChange={onValueChange}
        disabled={disabled}
      />
    )
  if (type === 'checkbox-group')
    return (
      <CheckboxGroup
        options={options}
        value={Array.isArray(value) ? value : []}
        onValueChange={onValueChange}
        disabled={disabled}
      />
    )
  if (type === 'tree-select')
    return (
      <TreeSelect
        nodes={treeNodes}
        value={Array.isArray(value) ? value : []}
        onValueChange={onValueChange}
        disabled={disabled}
      />
    )
  if (type === 'date-range' || type === 'datetime-range') {
    const Picker = type === 'date-range' ? DateRangePicker : DateTimeRangePicker
    return (
      <Picker
        value={
          typeof value === 'object' && value
            ? (value as { from: Date | undefined; to?: Date })
            : undefined
        }
        onValueChange={onValueChange}
        disabled={disabled}
      />
    )
  }
  if (type === 'upload')
    return (
      <Upload
        fileList={Array.isArray(value) ? value : []}
        onFileListChange={onValueChange}
        disabled={disabled}
      />
    )
  if (type === 'textarea')
    return (
      <Textarea
        id={id}
        aria-label={id ? undefined : (placeholder ?? 'Field value')}
        aria-invalid={invalid}
        value={String(value ?? '')}
        onChange={(e) => onValueChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    )
  if (type === 'switch')
    return (
      <Switch
        id={id}
        checked={!!value}
        onCheckedChange={onValueChange}
        disabled={disabled}
        aria-invalid={invalid}
      />
    )
  if (type === 'checkbox')
    return (
      <Checkbox
        id={id}
        checked={!!value}
        onCheckedChange={onValueChange}
        disabled={disabled}
        aria-invalid={invalid}
      />
    )
  if (type === 'select')
    return (
      <Combobox
        id={id}
        value={value ? [String(value)] : []}
        onValueChange={(v) => onValueChange?.(v[0] ?? '')}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
      />
    )
  if (type === 'rate')
    return <Rate value={Number(value) || 0} onValueChange={onValueChange} disabled={disabled} />
  return (
    <Input
      id={id}
      aria-label={id ? undefined : (placeholder ?? 'Field value')}
      aria-invalid={invalid}
      type={
        type === 'datetime'
          ? 'datetime-local'
          : ['money', 'percent', 'number'].includes(type)
            ? 'number'
            : type
      }
      value={String(value ?? '')}
      onChange={(e) =>
        onValueChange?.(
          ['money', 'percent', 'number'].includes(type)
            ? e.target.value === ''
              ? ''
              : e.target.valueAsNumber
            : e.target.value,
        )
      }
      placeholder={placeholder}
      disabled={disabled}
    />
  )
}
