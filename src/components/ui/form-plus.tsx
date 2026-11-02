import * as React from 'react'
import {
  useForm,
  Controller,
  FormProvider,
  useFormContext,
  useFieldArray,
  type Resolver,
  type FieldValues,
  type FieldPath,
  type DefaultValues,
  type DeepPartial,
  type ControllerProps,
} from 'react-hook-form'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FieldPlus, type FieldValueType } from '@/components/ui/field-plus'
import type { SelectOption } from '@/components/ui/combobox'
import { Steps } from '@/components/ui/steps'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
export interface FormPlusField<T extends FieldValues = FieldValues> {
  name: FieldPath<T>
  label: string
  type?: FieldValueType
  placeholder?: string
  description?: string
  required?: boolean
  rules?: ControllerProps<T>['rules']
  options?: SelectOption[]
  colSpan?: number
  step?: number
  hidden?: (values: T) => boolean
  disabled?: boolean
  dependencies?: FieldPath<T>[]
  loadOptions?: (values: T, signal: AbortSignal) => Promise<SelectOption[]>
  render?: (props: {
    value: any
    onChange: (value: any) => void
    invalid: boolean
    id: string
  }) => React.ReactNode
}
export interface FormPlusProps<T extends FieldValues = FieldValues> {
  fields: FormPlusField<T>[]
  defaultValues?: DefaultValues<T>
  onSubmit: (values: T) => void | Promise<void>
  onValuesChange?: (values: DeepPartial<T>) => void
  resolver?: Resolver<T>
  submitLabel?: string
  columns?: 1 | 2 | 3
  className?: string
  children?: React.ReactNode
  steps?: string[]
  resettable?: boolean
  disabled?: boolean
  scrollToError?: boolean
}
export function FormPlus<T extends FieldValues = FieldValues>({
  fields,
  defaultValues,
  onSubmit,
  onValuesChange,
  resolver,
  submitLabel = 'Save changes',
  columns = 1,
  className,
  children,
  steps,
  resettable = true,
  disabled,
  scrollToError = true,
}: FormPlusProps<T>) {
  const form = useForm<T>({ defaultValues, resolver, mode: 'onBlur' })
  const [error, setError] = React.useState('')
  const [step, setStep] = React.useState(0)
  const id = React.useId()
  const values = form.watch()
  const [remoteOptions, setRemoteOptions] = React.useState<Record<string, SelectOption[]>>({}),
    [optionLoading, setOptionLoading] = React.useState<Record<string, boolean>>({}),
    [optionErrors, setOptionErrors] = React.useState<Record<string, string>>({}),
    root = React.useRef<HTMLFormElement>(null),
    dependencyValues = React.useRef<Record<string, string>>({}),
    latestFields = React.useRef(fields)
  latestFields.current = fields
  const dependencyKey = JSON.stringify(
    fields
      .filter((f) => f.loadOptions)
      .map((f) => (f.dependencies ?? []).map((name) => form.getValues(name))),
  )
  React.useEffect(() => {
    const controller = new AbortController()
    for (const field of latestFields.current) {
      if (!field.loadOptions) continue
      const dependency = JSON.stringify(
        (field.dependencies ?? []).map((name) => form.getValues(name)),
      )
      if (
        dependencyValues.current[field.name] !== undefined &&
        dependencyValues.current[field.name] !== dependency
      )
        form.setValue(field.name, undefined as any)
      dependencyValues.current[field.name] = dependency
      setOptionLoading((previous) => ({ ...previous, [field.name]: true }))
      field
        .loadOptions(form.getValues(), controller.signal)
        .then((options) => {
          if (!controller.signal.aborted) {
            setRemoteOptions((previous) => ({ ...previous, [field.name]: options }))
            setOptionErrors((previous) => ({ ...previous, [field.name]: '' }))
          }
        })
        .catch((error) => {
          if (!controller.signal.aborted)
            setOptionErrors((previous) => ({ ...previous, [field.name]: String(error) }))
        })
        .finally(() => {
          if (!controller.signal.aborted)
            setOptionLoading((previous) => ({ ...previous, [field.name]: false }))
        })
    }
    return () => controller.abort()
  }, [dependencyKey, form])
  React.useEffect(() => {
    if (!onValuesChange) return
    const subscription = form.watch((v) => onValuesChange(v))
    return () => subscription.unsubscribe()
  }, [form, onValuesChange])
  const currentFields = fields.filter(
    (f) => !f.hidden?.(values) && (!steps || (f.step ?? 0) === step),
  )
  const submit = form.handleSubmit(
    async (values) => {
      setError('')
      try {
        await onSubmit(values)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to save. Please try again.')
      }
    },
    (errors) => {
      if (!scrollToError) return
      const first = fields.find((field) =>
        Object.keys(errors).some((key) => field.name === key || field.name.startsWith(key + '.')),
      )
      if (first && steps) setStep(first.step ?? 0)
      requestAnimationFrame(() => {
        const element = root.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
        element?.scrollIntoView({ block: 'center', behavior: 'smooth' })
        element?.focus()
      })
    },
  )
  return (
    <FormProvider {...form}>
      <form ref={root} onSubmit={submit} className={cn('space-y-6', className)} noValidate>
        <fieldset disabled={disabled} className="space-y-6">
          {steps && <Steps items={steps.map((title) => ({ title }))} current={step} />}
          <div
            className={cn(
              'grid gap-5',
              columns === 2 && 'sm:grid-cols-2',
              columns === 3 && 'sm:grid-cols-3',
            )}
          >
            {currentFields.map((field) => (
              <Controller
                key={field.name}
                name={field.name}
                control={form.control}
                rules={{
                  ...(field.required ? { required: `${field.label} is required` } : {}),
                  ...field.rules,
                }}
                render={({ field: control, fieldState }) => (
                  <div
                    className={cn(
                      'space-y-2',
                      field.colSpan === 2 && 'sm:col-span-2',
                      field.colSpan === 3 && 'sm:col-span-3',
                    )}
                  >
                    <Label htmlFor={`${id}-${field.name}`} className="text-sm">
                      {field.label}
                      {field.required && <span className="text-destructive"> *</span>}
                    </Label>
                    {field.render ? (
                      field.render({
                        value: control.value,
                        onChange: control.onChange,
                        invalid: !!fieldState.error,
                        id: `${id}-${field.name}`,
                      })
                    ) : (
                      <div onBlur={control.onBlur}>
                        <FieldPlus
                          mode="edit"
                          id={`${id}-${field.name}`}
                          type={field.type}
                          value={control.value}
                          onValueChange={control.onChange}
                          options={remoteOptions[field.name] ?? field.options}
                          placeholder={field.placeholder}
                          disabled={
                            disabled ||
                            field.disabled ||
                            optionLoading[field.name] ||
                            form.formState.isSubmitting
                          }
                          invalid={!!fieldState.error}
                        />
                      </div>
                    )}
                    {optionLoading[field.name] && (
                      <p role="status" className="text-xs text-muted-foreground">
                        Loading options…
                      </p>
                    )}
                    {optionErrors[field.name] && (
                      <p role="alert" className="text-xs text-destructive">
                        {optionErrors[field.name]}
                      </p>
                    )}
                    {fieldState.error ? (
                      <p role="alert" className="text-xs text-destructive">
                        {fieldState.error.message}
                      </p>
                    ) : field.description ? (
                      <p className="text-xs text-muted-foreground">{field.description}</p>
                    ) : null}
                  </div>
                )}
              />
            ))}
          </div>
          {children}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 border-t pt-5">
            {steps && step > 0 && (
              <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            )}
            {resettable && (
              <Button
                type="button"
                variant="ghost"
                disabled={form.formState.isSubmitting}
                onClick={() => {
                  form.reset()
                  setStep(0)
                  setError('')
                }}
              >
                Reset
              </Button>
            )}
            {steps && step < steps.length - 1 ? (
              <Button
                type="button"
                onClick={async () => {
                  if (await form.trigger(currentFields.map((f) => f.name))) setStep((s) => s + 1)
                }}
              >
                Continue
              </Button>
            ) : (
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
                {submitLabel}
              </Button>
            )}
          </div>
        </fieldset>
      </form>
    </FormProvider>
  )
}
export function LoginForm<T extends FieldValues = FieldValues>({
  fields,
  ...props
}: Omit<FormPlusProps<T>, 'fields'> & { fields?: FormPlusField<T>[] }) {
  return (
    <div className="mx-auto w-full max-w-sm rounded-xl border bg-card p-6">
      <h3 className="mb-5 text-lg font-semibold">Welcome back</h3>
      <FormPlus
        {...props}
        resettable={false}
        fields={
          fields ?? [
            { name: 'username' as FieldPath<T>, label: 'Email or username', required: true },
            {
              name: 'password' as FieldPath<T>,
              label: 'Password',
              type: 'password',
              required: true,
            },
          ]
        }
      />
    </div>
  )
}
export function FormPlusList({
  name,
  label = 'Items',
  fields,
  defaultItem = {},
}: {
  name: string
  label?: string
  fields: { name: string; placeholder?: string }[]
  defaultItem?: Record<string, string>
}) {
  const { control, register } = useFormContext()
  const list = useFieldArray({ control, name })
  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 text-sm font-medium">{label}</legend>
      {list.fields.map((item, index) => (
        <div key={item.id} className="flex items-center gap-2">
          {fields.map((field) => (
            <Input
              key={field.name}
              aria-label={`${field.placeholder ?? field.name} ${index + 1}`}
              placeholder={field.placeholder}
              {...register(`${name}.${index}.${field.name}`)}
            />
          ))}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove item ${index + 1}`}
            onClick={() => list.remove(index)}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={() => list.append(defaultItem)}>
        <Plus />
        Add item
      </Button>
    </fieldset>
  )
}
export function StepsForm<T extends FieldValues = FieldValues>(
  props: FormPlusProps<T> & { steps: string[] },
) {
  return <FormPlus<T> {...props} />
}
export interface OverlayFormProps<T extends FieldValues = FieldValues> extends FormPlusProps<T> {
  title: string
  description?: string
  trigger: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}
export function ModalForm<T extends FieldValues = FieldValues>({
  title,
  description,
  trigger,
  open,
  onOpenChange,
  onSubmit,
  ...props
}: OverlayFormProps<T>) {
  const [local, setLocal] = React.useState(false)
  const change = (next: boolean) => {
    setLocal(next)
    onOpenChange?.(next)
  }
  return (
    <Dialog open={open ?? local} onOpenChange={change}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description ?? 'Add the details below.'}</DialogDescription>
        </DialogHeader>
        <FormPlus<T>
          {...props}
          onSubmit={async (values) => {
            await onSubmit(values)
            change(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
export function DrawerForm<T extends FieldValues = FieldValues>({
  title,
  description,
  trigger,
  open,
  onOpenChange,
  onSubmit,
  ...props
}: OverlayFormProps<T>) {
  const [local, setLocal] = React.useState(false)
  const change = (next: boolean) => {
    setLocal(next)
    onOpenChange?.(next)
  }
  return (
    <Sheet open={open ?? local} onOpenChange={change}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="overflow-auto p-6 sm:max-w-xl">
        <SheetHeader className="px-0">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description ?? 'Add the details below.'}</SheetDescription>
        </SheetHeader>
        <FormPlus<T>
          {...props}
          onSubmit={async (values) => {
            await onSubmit(values)
            change(false)
          }}
        />
      </SheetContent>
    </Sheet>
  )
}
export function QueryFilter<T extends FieldValues = FieldValues>({
  fields,
  visibleCount = 3,
  ...props
}: FormPlusProps<T> & { visibleCount?: number }) {
  const [expanded, setExpanded] = React.useState(false)
  return (
    <div className="space-y-2 rounded-xl border p-5">
      <FormPlus<T>
        {...props}
        fields={fields.map((f, i) => ({
          ...f,
          hidden: (values) => (!expanded && i >= visibleCount) || !!f.hidden?.(values),
        }))}
        columns={3}
        submitLabel="Search"
      />
      {fields.length > visibleCount && (
        <Button variant="ghost" size="sm" type="button" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Fewer filters' : 'More filters'}
        </Button>
      )}
    </div>
  )
}
export function LightFilter<T extends FieldValues = FieldValues>({
  triggerLabel = 'Filter records',
  onSubmit,
  ...props
}: FormPlusProps<T> & { triggerLabel?: string }) {
  const [open, setOpen] = React.useState(false),
    [count, setCount] = React.useState(0)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          {triggerLabel}
          {count > 0 && (
            <span className="rounded-full bg-primary/10 px-1.5 text-xs text-primary">{count}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <FormPlus<T>
          {...props}
          submitLabel="Apply filters"
          onSubmit={async (values) => {
            await onSubmit(values)
            setCount(
              Object.values(values).filter((v) => v !== undefined && v !== null && v !== '').length,
            )
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
