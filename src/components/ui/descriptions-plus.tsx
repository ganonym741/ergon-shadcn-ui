import * as React from 'react'
import { Pencil } from 'lucide-react'
import { Descriptions } from '@/components/ui/descriptions'
import { FieldPlus, type FieldPlusProps } from '@/components/ui/field-plus'
import { Button } from '@/components/ui/button'
export interface DescriptionField extends Omit<FieldPlusProps, 'value' | 'mode' | 'onValueChange'> {
  key: string
  label: string
  validate?: (
    value: unknown,
    record: Record<string, unknown>,
  ) => string | undefined | Promise<string | undefined>
}
export interface DescriptionsPlusProps {
  title?: string
  record?: Record<string, unknown>
  fields: DescriptionField[]
  onSave?: (value: Record<string, unknown>, signal?: AbortSignal) => void | Promise<void>
  onFieldSave?: (
    key: string,
    value: unknown,
    record: Record<string, unknown>,
    signal: AbortSignal,
  ) => void | Promise<void>
  request?: (signal: AbortSignal) => Promise<Record<string, unknown>>
  columns?: number
}
export function DescriptionsPlus({
  title = 'Record details',
  record: provided,
  fields,
  onSave,
  onFieldSave,
  request,
  columns = 2,
}: DescriptionsPlusProps) {
  const [remote, setRemote] = React.useState<Record<string, unknown>>({}),
    [draft, setDraft] = React.useState<Record<string, unknown>>({}),
    [editing, setEditing] = React.useState(false),
    [fieldKey, setFieldKey] = React.useState<string>(),
    [pending, setPending] = React.useState(false),
    [error, setError] = React.useState(''),
    [revision, reload] = React.useReducer((n) => n + 1, 0)
  const record = provided ?? remote,
    id = React.useId(),
    operation = React.useRef<AbortController | null>(null)
  React.useEffect(() => () => operation.current?.abort(), [])
  React.useEffect(() => {
    if (!request) return
    const controller = new AbortController()
    setPending(true)
    setError('')
    request(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setRemote(value)
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(String(error))
      })
      .finally(() => {
        if (!controller.signal.aborted) setPending(false)
      })
    return () => controller.abort()
  }, [request, revision])
  const save = async () => {
    operation.current?.abort()
    const controller = new AbortController()
    operation.current = controller
    setPending(true)
    setError('')
    try {
      for (const field of fields.filter((f) => !fieldKey || f.key === fieldKey)) {
        const error = await field.validate?.(draft[field.key], draft)
        if (error) throw new Error(error)
      }
      if (fieldKey && onFieldSave)
        await onFieldSave(fieldKey, draft[fieldKey], draft, controller.signal)
      else await onSave?.(draft, controller.signal)
      if (!controller.signal.aborted) {
        setRemote(draft)
        setEditing(false)
        setFieldKey(undefined)
      }
    } catch (error) {
      if (!controller.signal.aborted) setError(String(error))
    } finally {
      if (!controller.signal.aborted) setPending(false)
    }
  }
  return (
    <section className="space-y-4" aria-busy={pending}>
      <header className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>
        {onSave && !onFieldSave && !editing && (
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => {
              setDraft(record)
              setEditing(true)
            }}
          >
            <Pencil />
            Edit
          </Button>
        )}
      </header>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
          {request && !editing && (
            <Button size="sm" variant="ghost" onClick={reload}>
              Retry
            </Button>
          )}
        </p>
      )}
      <Descriptions
        columns={columns}
        items={fields.map(({ key, label, validate, ...field }) => ({
          key,
          label,
          children: (
            <div className="space-y-2">
              <FieldPlus
                {...field}
                id={`${id}-${key}`}
                value={editing && (!fieldKey || fieldKey === key) ? draft[key] : record[key]}
                mode={editing && (!fieldKey || fieldKey === key) ? 'edit' : 'read'}
                disabled={pending || field.disabled}
                onValueChange={(value) => setDraft((previous) => ({ ...previous, [key]: value }))}
              />
              {onFieldSave && !editing && (
                <Button
                  size="xs"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => {
                    setDraft(record)
                    setFieldKey(key)
                    setEditing(true)
                  }}
                >
                  Edit {label}
                </Button>
              )}
            </div>
          ),
        }))}
      />
      {editing && (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => {
              setEditing(false)
              setFieldKey(undefined)
              setError('')
            }}
          >
            Cancel
          </Button>
          <Button loading={pending} onClick={() => void save()}>
            {fieldKey ? 'Save field' : 'Save changes'}
          </Button>
        </div>
      )}
    </section>
  )
}
