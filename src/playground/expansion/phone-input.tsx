import * as React from 'react'
import { getCountries } from 'libphonenumber-js/max'
import { PhoneInput, parsePhoneInput, type PhoneCountry } from '@/components/ui/phone-input'
import { Button } from '@/components/ui/button'
import type { PreviewProps } from '../preview'
import { report } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config,
    country = getCountries().includes(v.country as PhoneCountry)
      ? (v.country as PhoneCountry)
      : 'US',
    [result, setResult] = React.useState(() => parsePhoneInput(String(v.value), country))
  return (
    <form
      className="w-full max-w-xl space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        report(props, 'form-submit', Object.fromEntries(new FormData(event.currentTarget)))
      }}
    >
      <PhoneInput
        defaultValue={String(v.value)}
        defaultCountry={country}
        name="phone"
        countries={v.restricted ? ['US', 'GB', 'ID'] : undefined}
        validation={v.validation as 'strict' | 'possible'}
        validateOn={v.validateOn as 'blur' | 'change'}
        international={!!v.international}
        showValidation={!!v.showValidation}
        disabled={!!v.disabled}
        readOnly={!!v.readOnly}
        onPhoneChange={(next) => {
          setResult(next)
          report(props, 'phone-change', next)
        }}
        onCountryChange={(next) => report(props, 'country-change', next)}
      />
      <p className="text-xs text-muted-foreground">
        Formatting is applied on blur to preserve the caret while typing. Strict validation uses
        maintained national numbering patterns.
      </p>
      <pre dir="ltr" className="overflow-auto rounded-lg bg-muted/40 p-3 text-left text-[11px]">
        {JSON.stringify(result, null, 2)}
      </pre>
      <Button type="submit" size="sm" variant="outline" disabled={!!v.disabled}>
        Inspect form value
      </Button>
    </form>
  )
}
