import * as React from 'react'
import { Plus, Trash2, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useControllableState } from '@/components/ui/util'

export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'contains'
  | 'startsWith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'between'
  | 'empty'
  | 'notEmpty'
export type FilterValue = string | number | boolean | null | (string | number)[]
export interface FilterField {
  id: string
  label: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'select'
  options?: { value: string; label: string }[]
  operators?: FilterOperator[]
  caseSensitive?: boolean
}
export interface FilterRule {
  id: string
  kind: 'rule'
  field: string
  operator: FilterOperator
  value: FilterValue
}
export interface FilterGroup {
  id: string
  kind: 'group'
  combinator: 'and' | 'or'
  not?: boolean
  children: FilterNode[]
}
export type FilterNode = FilterGroup | FilterRule
export interface FilterBuilderProps extends Omit<
  React.ComponentProps<'section'>,
  'onChange' | 'defaultValue'
> {
  fields: FilterField[]
  value?: FilterGroup
  defaultValue?: FilterGroup
  onValueChange?: (query: FilterGroup) => void
  disabled?: boolean
  maxDepth?: number
  maxRules?: number
  label?: string
  renderValue?: (
    field: FilterField,
    rule: FilterRule,
    onChange: (value: FilterValue) => void,
  ) => React.ReactNode
}
const operatorLabels: Record<FilterOperator, string> = {
  eq: 'is',
  neq: 'is not',
  contains: 'contains',
  startsWith: 'starts with',
  gt: 'greater than',
  gte: 'at least',
  lt: 'less than',
  lte: 'at most',
  in: 'is one of',
  between: 'between',
  empty: 'is empty',
  notEmpty: 'is not empty',
}
/** Returns the operators supported by a field's value type or explicit operator list. */
export function getFilterOperators(field: FilterField): FilterOperator[] {
  const defaults: FilterOperator[] =
    field.type === 'text'
      ? ['eq', 'neq', 'contains', 'startsWith', 'empty', 'notEmpty']
      : field.type === 'number' || field.type === 'date'
        ? ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'empty', 'notEmpty']
        : field.type === 'select'
          ? ['eq', 'neq', 'in', 'empty', 'notEmpty']
          : ['eq', 'neq']
  return field.operators
    ? field.operators.filter((operator) => defaults.includes(operator))
    : defaults
}
/** Validates unique tree IDs, known fields and operators, value types, and bounded nesting. */
export function validateFilterQuery(
  query: FilterGroup,
  fields: readonly FilterField[],
  maxDepth = 20,
  maxNodes = 500,
  validateValues = true,
): string | undefined {
  const ids = new Set<string>(),
    names = new Map(fields.map((field) => [field.id, field]))
  if (names.size !== fields.length) return 'Field IDs must be unique.'
  maxDepth = Number.isFinite(maxDepth) ? Math.max(1, Math.min(50, Math.floor(maxDepth))) : 20
  maxNodes = Number.isFinite(maxNodes) ? Math.max(1, Math.min(10000, Math.floor(maxNodes))) : 500
  for (const field of fields)
    if (
      !field.id ||
      !['text', 'number', 'date', 'boolean', 'select'].includes(field.type) ||
      !getFilterOperators(field).length
    )
      return 'Fields need unique nonempty IDs, known types, and at least one supported operator.'
  const pending: { node: FilterNode; depth: number }[] = [{ node: query, depth: 0 }]
  while (pending.length) {
    const { node, depth } = pending.pop()!
    if (!node || typeof node.id !== 'string' || !node.id || ids.has(node.id))
      return 'Filter IDs must be unique and the query must not contain cycles.'
    ids.add(node.id)
    if (ids.size > maxNodes) return `Use at most ${maxNodes} filter nodes.`
    if (depth > maxDepth) return `Use at most ${maxDepth} nested group levels.`
    if (node.kind === 'group') {
      if (!['and', 'or'].includes(node.combinator) || !Array.isArray(node.children))
        return 'Groups need an AND/OR condition and a children array.'
      for (const child of node.children) pending.push({ node: child, depth: depth + 1 })
    } else if (node.kind === 'rule') {
      const field = names.get(node.field)
      if (!field) return `Unknown filter field: ${node.field}.`
      if (!getFilterOperators(field).includes(node.operator))
        return `${field.label} does not support that operator.`
      if (!validateValues) continue
      if (['empty', 'notEmpty'].includes(node.operator)) continue
      const values = Array.isArray(node.value) ? node.value : [node.value]
      if (node.operator === 'between' && values.length !== 2)
        return `${field.label} needs two bounds.`
      if (node.operator === 'in' && !Array.isArray(node.value))
        return `${field.label} needs a list of values.`
      if (!['between', 'in'].includes(node.operator) && Array.isArray(node.value))
        return `${field.label} needs a single value.`
      if (
        field.type === 'number' &&
        values.some((value) => typeof value !== 'number' || !Number.isFinite(value))
      )
        return `${field.label} needs finite numeric values.`
      if (field.type === 'boolean' && typeof node.value !== 'boolean')
        return `${field.label} needs a boolean value.`
      if (
        field.type === 'date' &&
        values.some(
          (value) =>
            typeof value !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
            Number.isNaN(Date.parse(value)) ||
            new Date(value).toISOString().slice(0, 10) !== value,
        )
      )
        return `${field.label} needs valid YYYY-MM-DD dates.`
      if (node.operator === 'between' && values[0]! > values[1]!)
        return `${field.label} needs ordered lower and upper bounds.`
    } else return 'Each filter node must be a rule or group.'
  }
}
/** Evaluates a validated query against an application record without generating or executing code. */
export function matchesFilter(
  record: Record<string, unknown>,
  query: FilterGroup,
  fields: readonly FilterField[],
): boolean {
  if (validateFilterQuery(query, fields)) return false
  const schema = new Map(fields.map((field) => [field.id, field]))
  const evaluate = (node: FilterNode): boolean => {
    if (node.kind === 'group') {
      const result =
        !node.children.length ||
        (node.combinator === 'and' ? node.children.every(evaluate) : node.children.some(evaluate))
      return node.not ? !result : result
    }
    const field = schema.get(node.field)!,
      source = record[node.field],
      empty =
        source === null ||
        source === undefined ||
        source === '' ||
        (Array.isArray(source) && !source.length)
    if (node.operator === 'empty') return empty
    if (node.operator === 'notEmpty') return !empty
    if (empty) return false
    const normalized = (value: unknown): string | number | boolean =>
      field.type === 'number'
        ? Number(value)
        : field.type === 'boolean'
          ? value === true
          : field.caseSensitive
            ? String(value)
            : String(value).toLowerCase()
    const left = normalized(source),
      right = normalized(node.value)
    switch (node.operator) {
      case 'eq':
        return left === right
      case 'neq':
        return left !== right
      case 'contains':
        return String(left).includes(String(right))
      case 'startsWith':
        return String(left).startsWith(String(right))
      case 'gt':
        return left > right
      case 'gte':
        return left >= right
      case 'lt':
        return left < right
      case 'lte':
        return left <= right
      case 'in':
        return (node.value as (string | number)[]).some((value) => left === normalized(value))
      case 'between': {
        const bounds = node.value as (string | number)[]
        return left >= normalized(bounds[0]) && left <= normalized(bounds[1])
      }
      default:
        return false
    }
  }
  return evaluate(query)
}
function changeNode(
  node: FilterNode,
  id: string,
  change: (node: FilterNode) => FilterNode,
): FilterNode {
  if (node.id === id) return change(node)
  return node.kind === 'group'
    ? { ...node, children: node.children.map((child) => changeNode(child, id, change)) }
    : node
}
function startingValue(field: FilterField, operator: FilterOperator): FilterValue {
  if (operator === 'in') return []
  const initial =
    field.type === 'number'
      ? 0
      : field.type === 'boolean'
        ? false
        : field.type === 'select'
          ? (field.options?.[0]?.value ?? '')
          : ''
  return operator === 'between' ? [initial as string | number, initial as string | number] : initial
}
interface FilterContext {
  query: FilterGroup
  fields: FilterField[]
  disabled?: boolean
  maxDepth: number
  maxRules: number
  renderValue: FilterBuilderProps['renderValue']
  setQuery: (query: FilterGroup) => void
  reset: () => void
}
const Context = React.createContext<FilterContext | null>(null)
function useFilter() {
  const context = React.useContext(Context)
  if (!context) throw new Error('Filter parts must be inside FilterBuilder.')
  return context
}
/** Provides a typed, controlled filter tree with composable toolbar and editor parts. */
export function FilterBuilder({
  fields,
  value,
  defaultValue,
  onValueChange,
  disabled,
  maxDepth = 4,
  maxRules = 100,
  label = 'Filters',
  renderValue,
  children,
  className,
  ...props
}: FilterBuilderProps) {
  const rootId = React.useId(),
    initial = React.useRef<FilterGroup>(
      defaultValue ?? { id: rootId, kind: 'group', combinator: 'and', children: [] },
    )
  const [query, setQuery] = useControllableState({
    value,
    defaultValue: initial.current,
    onChange: onValueChange,
  })
  const depth = Number.isFinite(maxDepth) ? Math.min(20, Math.max(1, Math.floor(maxDepth))) : 4,
    limit = Number.isFinite(maxRules) ? Math.min(500, Math.max(1, Math.floor(maxRules))) : 100
  const error = validateFilterQuery(query, fields, depth, limit * 2 + 1, false)
  return (
    <Context.Provider
      value={{
        query,
        fields,
        disabled,
        maxDepth: depth,
        maxRules: limit,
        renderValue,
        setQuery,
        reset: () => setQuery({ id: rootId, kind: 'group', combinator: 'and', children: [] }),
      }}
    >
      <section
        {...props}
        data-slot="filter-builder"
        aria-label={label}
        className={cn('w-full min-w-0 space-y-3', className)}
      >
        {children ?? (
          <>
            <FilterBuilderToolbar />
            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive"
              >
                {error}
              </p>
            ) : (
              <FilterBuilderContent />
            )}
          </>
        )}
      </section>
    </Context.Provider>
  )
}
/** Displays filter summary and a reset action without coupling the query to a backend. */
export function FilterBuilderToolbar({ className, ...props }: React.ComponentProps<'div'>) {
  const context = useFilter()
  const count = (node: FilterNode): number =>
    node.kind === 'rule' ? 1 : node.children.reduce((total, item) => total + count(item), 0)
  return (
    <div {...props} className={cn('flex items-center justify-between gap-3', className)}>
      <div>
        <p className="text-sm font-medium">Match your records</p>
        <p className="text-xs text-muted-foreground">
          {validateFilterQuery(context.query, context.fields)
            ? 'Review the filter configuration'
            : `${count(context.query)} conditions`}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={context.disabled}
        onClick={context.reset}
      >
        <RotateCcw />
        Reset filters
      </Button>
    </div>
  )
}
/** Recursively edits group conditions and rule rows with explicit add, remove, and reorder actions. */
export function FilterBuilderContent() {
  const context = useFilter()
  const error = validateFilterQuery(
    context.query,
    context.fields,
    context.maxDepth,
    context.maxRules * 2 + 1,
    false,
  )
  if (error)
    return (
      <p role="alert" className="p-3 text-sm text-destructive">
        {error}
      </p>
    )
  return <FilterGroupEditor group={context.query} depth={0} />
}
function FilterGroupEditor({ group, depth }: { group: FilterGroup; depth: number }) {
  const c = useFilter(),
    baseId = React.useId()
  const update = (node: FilterNode) =>
    c.setQuery(changeNode(c.query, group.id, () => node) as FilterGroup)
  const add = (kind: 'rule' | 'group') => {
    const field = c.fields[0]
    if (c.disabled || (!field && kind === 'rule')) return
    const node: FilterNode =
      kind === 'group'
        ? { id: crypto.randomUUID(), kind, combinator: 'and', children: [] }
        : {
            id: crypto.randomUUID(),
            kind,
            field: field.id,
            operator: getFilterOperators(field)[0],
            value: startingValue(field, getFilterOperators(field)[0]),
          }
    update({ ...group, children: [...group.children, node] })
  }
  const ruleCount = (node: FilterNode): number =>
    node.kind === 'rule' ? 1 : node.children.reduce((count, child) => count + ruleCount(child), 0)
  const nodeCount = (node: FilterNode): number =>
    1 +
    (node.kind === 'group' ? node.children.reduce((sum, child) => sum + nodeCount(child), 0) : 0)
  return (
    <fieldset
      disabled={c.disabled}
      className={cn('min-w-0 rounded-xl border p-3', depth > 0 ? 'bg-muted/20' : 'bg-background')}
    >
      <legend className="px-1 text-xs font-medium">
        {depth === 0 ? 'Filter conditions' : `Nested group ${depth}`}
      </legend>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span>Match</span>
        <select
          aria-label={`Match conditions in group ${depth + 1}`}
          value={group.combinator}
          onChange={(event) => update({ ...group, combinator: event.target.value as 'and' | 'or' })}
          className="h-8 rounded border bg-background px-2"
        >
          <option value="and">All conditions (AND)</option>
          <option value="or">Any condition (OR)</option>
        </select>
        <label className="ms-auto flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={!!group.not}
            onChange={(event) => update({ ...group, not: event.target.checked })}
          />
          Invert match
        </label>
      </div>
      <div className="space-y-2">
        {group.children.map((child, index) => (
          <div key={child.id} className="min-w-0 space-y-1">
            <div className="flex min-w-0 items-start gap-1">
              <div className="min-w-0 flex-1">
                {child.kind === 'group' ? (
                  <FilterGroupEditor group={child} depth={depth + 1} />
                ) : (
                  <FilterBuilderRule
                    rule={child}
                    onValueChange={(next) =>
                      update({
                        ...group,
                        children: group.children.map((node) =>
                          node.id === child.id ? next : node,
                        ),
                      })
                    }
                  />
                )}
              </div>
              <div className="flex shrink-0 flex-col">
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  aria-label={`Remove condition ${index + 1}`}
                  onClick={() =>
                    update({
                      ...group,
                      children: group.children.filter((node) => node.id !== child.id),
                    })
                  }
                >
                  <Trash2 />
                </Button>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  aria-label={`Move condition ${index + 1} up`}
                  disabled={index === 0}
                  onClick={() => {
                    const next = [...group.children]
                    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
                    update({ ...group, children: next })
                  }}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  aria-label={`Move condition ${index + 1} down`}
                  disabled={index === group.children.length - 1}
                  onClick={() => {
                    const next = [...group.children]
                    ;[next[index + 1], next[index]] = [next[index], next[index + 1]]
                    update({ ...group, children: next })
                  }}
                >
                  <ArrowDown />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {!group.children.length && (
        <p
          id={`${baseId}-empty`}
          className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground"
        >
          No conditions yet. Add a condition to narrow the results.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={
            !c.fields.length ||
            ruleCount(c.query) >= c.maxRules ||
            nodeCount(c.query) >= c.maxRules * 2 + 1
          }
          onClick={() => add('rule')}
        >
          <Plus />
          Add condition
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={depth >= c.maxDepth - 1 || nodeCount(c.query) >= c.maxRules * 2 + 1}
          onClick={() => add('group')}
        >
          <Plus />
          Add group
        </Button>
      </div>
    </fieldset>
  )
}
/** Edits one typed rule, resetting incompatible values when the field or operator changes. */
export function FilterBuilderRule({
  rule,
  onValueChange,
}: {
  rule: FilterRule
  onValueChange: (rule: FilterRule) => void
}) {
  const context = useFilter(),
    field = context.fields.find((field) => field.id === rule.field)!,
    id = React.useId(),
    operators = getFilterOperators(field)
  const error = validateFilterQuery(
    { id: `validation-${rule.id}`, kind: 'group', combinator: 'and', children: [rule] },
    context.fields,
  )
  const setValue = (value: FilterValue) => onValueChange({ ...rule, value })
  const values = Array.isArray(rule.value) ? rule.value : []
  const inputClass = 'h-9 min-w-0 rounded-md border bg-background px-2 text-sm disabled:opacity-50'
  const editor = (value: FilterValue, onChange: (value: FilterValue) => void, suffix = 'value') =>
    field.type === 'boolean' ? (
      <select
        aria-label={`${field.label} ${suffix}`}
        value={String(value)}
        onChange={(event) => onChange(event.target.value === 'true')}
        className={inputClass}
      >
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    ) : field.type === 'select' ? (
      <select
        aria-label={`${field.label} ${suffix}`}
        className={inputClass}
        value={String(value ?? '')}
        onChange={(event) => onChange(event.target.value)}
      >
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ) : (
      <Input
        aria-label={`${field.label} ${suffix}`}
        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
        value={value === null ? '' : String(value)}
        onChange={(event) =>
          onChange(
            field.type === 'number'
              ? event.target.value === ''
                ? null
                : event.target.valueAsNumber
              : event.target.value,
          )
        }
        className="min-w-28 flex-1"
      />
    )
  return (
    <div
      className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg border bg-background p-2"
      role="group"
      aria-label={`${field.label} condition`}
      aria-invalid={!!error || undefined}
      aria-describedby={error ? `${id}-error` : undefined}
    >
      <select
        aria-label="Condition field"
        value={rule.field}
        className={cn(inputClass, 'max-w-44')}
        onChange={(event) => {
          const next = context.fields.find((field) => field.id === event.target.value)!
          const operator = getFilterOperators(next)[0]
          onValueChange({ ...rule, field: next.id, operator, value: startingValue(next, operator) })
        }}
      >
        {context.fields.map((field) => (
          <option key={field.id} value={field.id}>
            {field.label}
          </option>
        ))}
      </select>
      <select
        aria-label={`${field.label} operator`}
        value={rule.operator}
        className={inputClass}
        onChange={(event) => {
          const operator = event.target.value as FilterOperator
          onValueChange({ ...rule, operator, value: startingValue(field, operator) })
        }}
      >
        {operators.map((operator) => (
          <option key={operator} value={operator}>
            {operatorLabels[operator]}
          </option>
        ))}
      </select>
      {!['empty', 'notEmpty'].includes(rule.operator) &&
        (context.renderValue?.(field, rule, setValue) ??
          (rule.operator === 'between' ? (
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              {editor(
                values[0] ?? null,
                (value) => setValue([value as string | number, values[1] ?? '']),
                'lower bound',
              )}
              <span className="text-xs">and</span>
              {editor(
                values[1] ?? null,
                (value) => setValue([values[0] ?? '', value as string | number]),
                'upper bound',
              )}
            </div>
          ) : rule.operator === 'in' ? (
            <select
              id={id}
              multiple
              aria-label={`${field.label} values`}
              value={values.map(String)}
              className={cn(inputClass, 'h-20')}
              onChange={(event) =>
                setValue([...event.target.selectedOptions].map((option) => option.value))
              }
            >
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            editor(rule.value, setValue)
          )))}
      {error && (
        <p id={`${id}-error`} role="alert" className="w-full text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
