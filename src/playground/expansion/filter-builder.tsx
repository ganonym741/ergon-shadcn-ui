import * as React from 'react'
import {
  FilterBuilder,
  matchesFilter,
  validateFilterQuery,
  type FilterField,
  type FilterGroup,
} from '@/components/ui/filter-builder'
import { Input } from '@/components/ui/input'
import { parseData } from '../schema'
import type { PreviewProps } from '../preview'
import { filterFields, filterQuery, filterRecords } from '../expansion-data'
import { report } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config,
    fields = parseData(v, 'fields', filterFields) as FilterField[],
    [query, setQuery] = React.useState(parseData(v, 'data', filterQuery) as FilterGroup),
    error = validateFilterQuery(query, fields),
    matches = error ? [] : filterRecords.filter((record) => matchesFilter(record, query, fields))
  return (
    <div className="w-full space-y-4">
      <FilterBuilder
        fields={fields}
        value={query}
        onValueChange={(next) => {
          setQuery(next)
          report(props, 'query-change', next)
        }}
        maxDepth={Number(v.maxDepth)}
        maxRules={Number(v.maxRules)}
        disabled={!!v.disabled}
        renderValue={
          v.customEditor
            ? (field, rule, change) =>
                field.id === 'revenue' ? (
                  <Input
                    aria-label="Revenue amount"
                    type="number"
                    leading="$"
                    value={typeof rule.value === 'number' ? rule.value : ''}
                    onValueChange={(value) => change(value === '' ? '' : Number(value))}
                  />
                ) : undefined
            : undefined
        }
      />
      <div className="rounded-lg border bg-muted/20 p-4">
        <p className="mb-2 text-xs font-medium">
          {error
            ? 'Complete the filter values to see matches.'
            : `${matches.length} matching sample records`}
        </p>
        {matches.map((record) => (
          <p key={record.id} className="py-1 text-xs text-muted-foreground">
            {record.name} · ${record.revenue} · {record.status}
          </p>
        ))}
      </div>
      <details className="rounded-lg border p-3 text-xs">
        <summary className="cursor-pointer font-medium">Serialized query</summary>
        <pre dir="ltr" className="mt-3 max-h-56 overflow-auto text-left text-[11px]">
          {JSON.stringify(query, null, 2)}
        </pre>
      </details>
    </div>
  )
}
