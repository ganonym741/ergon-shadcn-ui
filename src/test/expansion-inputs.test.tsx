import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { TagsInput, TagsInputTag } from '@/components/ui/tags-input'
import { PhoneInput, parsePhoneInput } from '@/components/ui/phone-input'
import {
  FilterBuilder,
  matchesFilter,
  validateFilterQuery,
  type FilterField,
  type FilterGroup,
} from '@/components/ui/filter-builder'
import { ImageComparison } from '@/components/ui/image-comparison'

describe('tags input', () => {
  it('pastes validated unique tags and submits repeated form values', async () => {
    const user = userEvent.setup(),
      invalid = vi.fn()
    render(
      <form data-testid="form">
        <TagsInput
          name="tag"
          maxTags={3}
          defaultValue={['React']}
          validateTag={(tag) => (tag.length < 3 ? 'Too short' : undefined)}
          onInvalidTag={invalid}
        />
      </form>,
    )
    await user.click(screen.getByRole('combobox'))
    await user.paste('Design,React,x,TypeScript,Testing')
    expect(new FormData(screen.getByTestId('form') as HTMLFormElement).getAll('tag')).toEqual([
      'React',
      'Design',
      'TypeScript',
    ])
    expect(invalid).toHaveBeenCalledWith('React', expect.stringContaining('already'))
    expect(invalid).toHaveBeenCalledWith('x', 'Too short')
    expect(invalid).toHaveBeenCalledWith('Testing', expect.stringContaining('3'))
  })
  it('reorders and removes chips by keyboard', async () => {
    const user = userEvent.setup(),
      change = vi.fn()
    render(<TagsInput defaultValue={['Alpha', 'Bravo', 'Charlie']} onValueChange={change} />)
    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{Backspace}')
    expect(screen.getByRole('button', { name: 'Remove Charlie' })).toHaveFocus()
    await user.keyboard('{Alt>}{ArrowLeft}{/Alt}')
    expect(change).toHaveBeenLastCalledWith(['Alpha', 'Charlie', 'Bravo'])
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Remove Charlie' })).toHaveFocus(),
    )
    await user.keyboard('{Delete}')
    expect(change).toHaveBeenLastCalledWith(['Alpha', 'Bravo'])
  })
  it('does not create tags during IME composition', () => {
    const change = vi.fn()
    render(<TagsInput onValueChange={change} />)
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: '日本語' } })
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    expect(change).not.toHaveBeenCalled()
    fireEvent.keyDown(input, { key: 'Enter', isComposing: false })
    expect(change).toHaveBeenCalledWith(['日本語'])
  })
  it('dismisses suggestions and selects them without blur duplication', async () => {
    const user = userEvent.setup(),
      change = vi.fn()
    render(<TagsInput suggestions={['Design', 'Testing']} createOnBlur onValueChange={change} />)
    await user.type(screen.getByRole('combobox'), 'Des')
    await user.click(screen.getByRole('option', { name: 'Design' }))
    expect(change).toHaveBeenLastCalledWith(['Design'])
    expect(screen.getAllByRole('button', { name: 'Remove Design' })).toHaveLength(1)
    await user.type(screen.getByRole('combobox'), 'Tes')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
  it('aborts old async searches as soon as the query changes and ignores stale results', async () => {
    let finish: ((items: string[]) => void) | undefined
    let signal: AbortSignal | undefined
    const search = vi.fn((_query: string, s: AbortSignal) => {
      signal = s
      return new Promise<string[]>((resolve) => {
        finish = resolve
      })
    })
    render(<TagsInput onSearch={search} />)
    fireEvent.focus(screen.getByRole('combobox'))
    await waitFor(() => expect(search).toHaveBeenCalledTimes(1))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'new' } })
    expect(signal?.aborted).toBe(true)
    await act(async () => finish?.(['Old result']))
    expect(screen.queryByRole('option', { name: 'Old result' })).not.toBeInTheDocument()
  })
  it('keeps read-only tags unchanged and supports named custom tags', () => {
    render(
      <TagsInput
        defaultValue={['React']}
        readOnly
        renderTag={(_tag, index) => (
          <TagsInputTag index={index} className="custom-tag">
            React skill
          </TagsInputTag>
        )}
      />,
    )
    expect(screen.getByText('React skill')).toHaveClass('truncate')
    expect(screen.queryByRole('button', { name: 'Remove React' })).not.toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Backspace' })
    expect(screen.getByText('React skill')).toBeInTheDocument()
  })
})
describe('phone input', () => {
  it('participates in native form validity and announces invalid submissions', () => {
    render(
      <form data-testid="phone-form">
        <PhoneInput defaultValue="12" required />
      </form>,
    )
    const form = screen.getByTestId('phone-form') as HTMLFormElement
    act(() => expect(form.checkValidity()).toBe(false))
    expect(screen.getByRole('textbox', { name: 'Phone number' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })
  it('parses real international formats, extension metadata and invalid numbers', () => {
    expect(parsePhoneInput('+1 415 555 2671 ext. 12', 'US')).toMatchObject({
      e164: '+14155552671',
      country: 'US',
      extension: '12',
      valid: true,
    })
    expect(parsePhoneInput('0812 3456 7890', 'ID')).toMatchObject({
      e164: '+6281234567890',
      country: 'ID',
      valid: true,
    })
    expect(parsePhoneInput('12', 'US')).toMatchObject({ possible: false, valid: false })
  })
  it('infers the initial country from E.164 and keeps the form value canonical', () => {
    render(
      <form data-testid="form">
        <PhoneInput defaultValue="+6281234567890" name="phone" />
      </form>,
    )
    expect(screen.getByRole('combobox')).toHaveTextContent('Indonesia')
    expect(new FormData(screen.getByTestId('form') as HTMLFormElement).get('phone')).toBe(
      '+6281234567890',
    )
  })
  it('preserves raw editing then formats and validates on blur', async () => {
    const user = userEvent.setup(),
      change = vi.fn()
    render(<PhoneInput defaultCountry="US" onPhoneChange={change} />)
    const input = screen.getByRole('textbox', { name: 'Phone number' })
    await user.type(input, '4155552671')
    expect(input).toHaveValue('4155552671')
    expect(change).toHaveBeenLastCalledWith(
      expect.objectContaining({ e164: '+14155552671', valid: true }),
    )
    await user.tab()
    expect(input).toHaveValue('(415) 555-2671')
    await user.clear(input)
    await user.type(input, '12')
    await user.tab()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('valid phone number')
  })
  it('does not alter controlled values when a parent declines an update', () => {
    const change = vi.fn()
    render(<PhoneInput value="+14155552671" onValueChange={change} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Phone number' }), {
      target: { value: '2125550199' },
    })
    expect(change).toHaveBeenCalledWith('+12125550199')
    expect(screen.getByRole('textbox', { name: 'Phone number' })).toHaveValue('(415) 555-2671')
  })
})
const fields: FilterField[] = [
  { id: 'amount', label: 'Amount', type: 'number' },
  { id: 'active', label: 'Active', type: 'boolean' },
  { id: 'date', label: 'Date', type: 'date' },
  { id: 'name', label: 'Name', type: 'text' },
]
const query = (children: FilterGroup['children']): FilterGroup => ({
  id: 'root',
  kind: 'group',
  combinator: 'and',
  children,
})
describe('filter builder', () => {
  it('retains numeric zero and false and evaluates nested NOT/OR', () => {
    const filter = query([
      { id: 'a', kind: 'rule', field: 'amount', operator: 'eq', value: 0 },
      {
        id: 'g',
        kind: 'group',
        combinator: 'or',
        not: true,
        children: [{ id: 'b', kind: 'rule', field: 'active', operator: 'eq', value: true }],
      },
    ])
    expect(validateFilterQuery(filter, fields)).toBeUndefined()
    expect(matchesFilter({ amount: 0, active: false }, filter, fields)).toBe(true)
    expect(matchesFilter({ amount: 1, active: false }, filter, fields)).toBe(false)
  })
  it('rejects cycles, unsupported operators, impossible dates and reversed bounds', () => {
    const cycle = query([])
    cycle.children.push(cycle)
    expect(validateFilterQuery(cycle, fields)).toContain('cycles')
    expect(
      validateFilterQuery(
        query([{ id: 'a', kind: 'rule', field: 'amount', operator: 'contains', value: 1 }]),
        fields,
      ),
    ).toContain('operator')
    expect(
      validateFilterQuery(
        query([{ id: 'a', kind: 'rule', field: 'date', operator: 'eq', value: '2026-02-30' }]),
        fields,
      ),
    ).toContain('valid')
    expect(
      validateFilterQuery(
        query([{ id: 'a', kind: 'rule', field: 'amount', operator: 'between', value: [5, 1] }]),
        fields,
      ),
    ).toContain('ordered')
  })
  it('allows incomplete numeric values to be corrected without removing the editor', async () => {
    const user = userEvent.setup()
    render(
      <FilterBuilder
        fields={fields}
        defaultValue={query([
          { id: 'a', kind: 'rule', field: 'amount', operator: 'gte', value: 50 },
        ])}
      />,
    )
    await user.clear(screen.getByRole('spinbutton', { name: 'Amount value' }))
    expect(screen.getByRole('alert')).toHaveTextContent('finite numeric')
    expect(screen.getByRole('spinbutton', { name: 'Amount value' })).toBeInTheDocument()
    await user.type(screen.getByRole('spinbutton', { name: 'Amount value' }), '0')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('adds/removes nested groups and honors disabled state', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<FilterBuilder fields={fields} />)
    await user.click(screen.getByRole('button', { name: 'Add group' }))
    expect(screen.getByText('Nested group 1')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove condition 1' }))
    expect(screen.queryByText('Nested group 1')).not.toBeInTheDocument()
    rerender(<FilterBuilder fields={fields} disabled />)
    expect(screen.getByRole('button', { name: 'Add condition' })).toBeDisabled()
  })
  it('bounds empty groups and never submits a surrounding form from editor actions', async () => {
    const user = userEvent.setup(),
      submit = vi.fn()
    render(
      <form onSubmit={submit}>
        <FilterBuilder fields={fields} maxRules={1} />
      </form>,
    )
    await user.click(screen.getByRole('button', { name: 'Add group' }))
    await user.click(screen.getAllByRole('button', { name: 'Add group' })[0])
    expect(
      screen
        .getAllByRole('button', { name: 'Add group' })
        .every((button) => (button as HTMLButtonElement).disabled),
    ).toBe(true)
    expect(submit).not.toHaveBeenCalled()
  })
})
describe('image comparison', () => {
  const images = {
    before: { src: '/before.png', alt: 'Before image', label: 'Before' },
    after: { src: '/after.png', alt: 'After image', label: 'After' },
  }
  it('updates the clipping layer from the real slider', () => {
    const change = vi.fn()
    const { container } = render(<ImageComparison {...images} onValueChange={change} />)
    fireEvent.change(screen.getByRole('slider'), { target: { value: '25' } })
    expect(change).toHaveBeenCalledWith(25)
    expect(container.querySelector('[data-slot="comparison-before"]')).toHaveStyle({
      clipPath: 'inset(0 75% 0 0)',
    })
    expect(screen.getByAltText('Before image')).toBeInTheDocument()
  })
  it('handles vertical, disabled and nonfinite controlled values', () => {
    const { container, rerender } = render(
      <ImageComparison {...images} orientation="vertical" value={NaN} disabled />,
    )
    expect(screen.getByRole('slider')).toBeDisabled()
    expect(container.querySelector('[data-slot="comparison-before"]')).toHaveStyle({
      clipPath: 'inset(0 0 50% 0)',
    })
    rerender(<ImageComparison {...images} value={150} />)
    expect(screen.getByRole('slider')).toHaveValue('100')
  })
})
