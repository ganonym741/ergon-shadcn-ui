import * as React from 'react'
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js/max'
import { Combobox } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { useUIConfig } from '@/components/ui/config-provider'
import { useControllableState } from '@/components/ui/util'
import { cn } from '@/lib/utils'

export type PhoneCountry = CountryCode
export interface PhoneInputChange {
  input: string
  value: string
  e164?: string
  country?: PhoneCountry
  extension?: string
  possible: boolean
  valid: boolean
}
export interface PhoneInputProps extends Omit<
  React.ComponentProps<'div'>,
  'onChange' | 'defaultValue'
> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  onPhoneChange?: (result: PhoneInputChange) => void
  country?: PhoneCountry
  defaultCountry?: PhoneCountry
  onCountryChange?: (country: PhoneCountry) => void
  countries?: PhoneCountry[]
  label?: string
  countryLabel?: string
  placeholder?: string
  name?: string
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  international?: boolean
  validation?: 'possible' | 'strict'
  validateOn?: 'blur' | 'change'
  showValidation?: boolean
}
/** Parses phone input against maintained international numbering metadata without throwing for incomplete input. */
export function parsePhoneInput(input: string, country: PhoneCountry): PhoneInputChange {
  const parsed = parsePhoneNumberFromString(input, country)
  return {
    input,
    value: parsed ? `${parsed.number}${parsed.ext ? ` ext. ${parsed.ext}` : ''}` : input,
    e164: parsed?.number,
    country: parsed?.country,
    extension: parsed?.ext,
    possible: parsed?.isPossible() ?? false,
    valid: parsed?.isValid() ?? false,
  }
}
function displayNumber(value: string, country: PhoneCountry, international: boolean) {
  const number = parsePhoneNumberFromString(value, country)
  return number
    ? international || (!!number.country && number.country !== country)
      ? number.formatInternational()
      : number.formatNational()
    : value
}
/** Offers searchable, localized countries and dialing codes without bundling flag image assets. */
export function PhoneCountrySelect({
  value,
  onValueChange,
  countries,
  disabled,
  label = 'Country',
  locale = 'en',
}: {
  value: PhoneCountry
  onValueChange: (value: PhoneCountry) => void
  countries?: PhoneCountry[]
  disabled?: boolean
  label?: string
  locale?: string
}) {
  const options = React.useMemo(() => {
    const supported = new Set(getCountries()),
      names = new Intl.DisplayNames([locale], { type: 'region' })
    return [...new Set(countries ?? getCountries())]
      .filter((country) => supported.has(country))
      .map((country) => ({
        value: country,
        label: `${names.of(country) ?? country} (+${getCountryCallingCode(country)})`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, locale))
  }, [countries, locale])
  return (
    <Combobox
      label={label}
      options={options}
      value={[value]}
      onValueChange={(values) => {
        if (values[0]) onValueChange(values[0] as PhoneCountry)
      }}
      disabled={disabled}
      className="w-full min-w-0"
    />
  )
}
/** Edits national or international phone numbers while preserving the caret during typing and emitting parsed validity details. */
export function PhoneInput({
  value,
  defaultValue = '',
  onValueChange,
  onPhoneChange,
  country,
  defaultCountry = 'US',
  onCountryChange,
  countries,
  label = 'Phone number',
  countryLabel = 'Country',
  placeholder = 'Enter a phone number',
  name,
  disabled,
  readOnly,
  required,
  international = false,
  validation = 'strict',
  validateOn = 'blur',
  showValidation = true,
  className,
  ...props
}: PhoneInputProps) {
  const { locale } = useUIConfig(),
    id = React.useId()
  const allowed = React.useMemo(
    () =>
      countries === undefined ? undefined : countries.filter((c) => getCountries().includes(c)),
    [countries],
  )
  const [selectedCountry, setCountry] = useControllableState({
    value: country,
    defaultValue: (() => {
      const parsed = parsePhoneNumberFromString(value ?? defaultValue, defaultCountry)?.country
      return parsed && (allowed === undefined || allowed.includes(parsed))
        ? parsed
        : allowed === undefined || allowed.includes(defaultCountry)
          ? defaultCountry
          : (allowed[0] ?? defaultCountry)
    })(),
    onChange: onCountryChange,
  })
  const [stored, setStored] = useControllableState({ value, defaultValue, onChange: onValueChange })
  const [input, setInput] = React.useState(() =>
      displayNumber(stored, selectedCountry, international),
    ),
    [focused, setFocused] = React.useState(false),
    [touched, setTouched] = React.useState(false)
  const lastEmitted = React.useRef<string | null>(null)
  React.useLayoutEffect(() => {
    if (!focused || stored !== lastEmitted.current)
      setInput(displayNumber(stored, selectedCountry, international))
  }, [stored, selectedCountry, international, focused, input])
  const parsed = parsePhoneInput(input, selectedCountry)
  const unsupported =
    allowed !== undefined && (!parsed.country || !allowed.includes(parsed.country))
  const valid = validation === 'strict' ? parsed.valid : parsed.possible
  const invalid = (touched || validateOn === 'change') && !!input.trim() && (!valid || unsupported)
  const field = React.useRef<HTMLInputElement>(null)
  React.useLayoutEffect(() => {
    field.current?.setCustomValidity(
      input.trim() && (!valid || unsupported)
        ? unsupported
          ? 'Choose a number from an allowed country.'
          : 'Enter a valid phone number.'
        : '',
    )
  }, [input, valid, unsupported])
  const publish = (raw: string, nextCountry = selectedCountry) => {
    const next = parsePhoneInput(raw, nextCountry)
    lastEmitted.current = next.value
    setStored(next.value)
    onPhoneChange?.({
      ...next,
      valid:
        next.valid && (allowed === undefined || (!!next.country && allowed.includes(next.country))),
    })
    if (
      next.country &&
      next.country !== selectedCountry &&
      (allowed === undefined || allowed.includes(next.country))
    )
      setCountry(next.country)
  }
  return (
    <div {...props} data-slot="phone-input" className={cn('w-full min-w-0 space-y-2', className)}>
      <div className="grid min-w-0 gap-2 @container/phone sm:grid-cols-[minmax(9rem,0.8fr)_minmax(0,1fr)]">
        <PhoneCountrySelect
          value={selectedCountry}
          countries={allowed}
          onValueChange={(next) => {
            const current = parsePhoneNumberFromString(input, selectedCountry),
              raw = current
                ? `${current.nationalNumber}${current.ext ? ` ext. ${current.ext}` : ''}`
                : input
            setCountry(next)
            setInput(raw)
            setTouched(false)
            publish(raw, next)
          }}
          disabled={disabled || readOnly}
          label={countryLabel}
          locale={locale}
        />
        <Input
          ref={field}
          id={id}
          type="tel"
          dir="ltr"
          autoComplete="tel"
          inputMode="tel"
          value={input}
          aria-label={label}
          aria-invalid={invalid || undefined}
          aria-describedby={showValidation ? `${id}-status` : undefined}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          onInvalid={() => setTouched(true)}
          onFocus={() => setFocused(true)}
          onChange={(event) => {
            setInput(event.target.value)
            publish(event.target.value)
          }}
          onBlur={() => {
            setFocused(false)
            setTouched(true)
            setInput(displayNumber(input, selectedCountry, international))
          }}
        />
      </div>
      {showValidation && (
        <p
          id={`${id}-status`}
          role="status"
          className={cn('text-xs', invalid ? 'text-destructive' : 'text-muted-foreground')}
        >
          {invalid ? (
            unsupported ? (
              'Choose a number from an allowed country.'
            ) : (
              'Enter a valid phone number.'
            )
          ) : parsed.possible ? (
            <bdi dir="ltr">{`${parsed.e164}${parsed.extension ? ` · ext. ${parsed.extension}` : ''}`}</bdi>
          ) : (
            `Include country code +${getCountryCallingCode(selectedCountry)} when entering an international number.`
          )}
        </p>
      )}
      {name && (
        <input
          type="hidden"
          name={name}
          value={parsePhoneInput(stored, selectedCountry).value}
          disabled={disabled}
        />
      )}
    </div>
  )
}
