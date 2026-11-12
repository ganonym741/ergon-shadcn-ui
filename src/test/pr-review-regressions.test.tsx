import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PhoneInput, parsePhoneInput } from '@/components/ui/phone-input'
import { TagsInput } from '@/components/ui/tags-input'
import { FilterBuilder, type FilterGroup } from '@/components/ui/filter-builder'
import { FileBrowser, type FileBrowserEntry } from '@/components/ui/file-browser'
import { DateRangePicker, DateTimeRangePicker } from '@/components/ui/date-picker'
import { Upload } from '@/components/ui/upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfigProvider } from '@/components/ui/config-provider'
import { playgrounds } from '@/playground/schema'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('PR review regressions', () => {
  it('preserves phone extensions in editing, formatting and submitted form data', async () => {
    const user = userEvent.setup(),
      change = vi.fn(),
      details = vi.fn()
    expect(parsePhoneInput('+1 415 555 2671 ext. 12', 'US')).toMatchObject({
      value: '+14155552671 ext. 12',
      e164: '+14155552671',
      extension: '12',
      valid: true,
    })
    const view = render(
      <form>
        <PhoneInput name="phone" onValueChange={change} onPhoneChange={details} />
      </form>,
    )
    const input = screen.getByRole('textbox', { name: 'Phone number' })
    await user.click(input)
    fireEvent.change(input, { target: { value: '+1 415 555 2671 ext. 12' } })
    await user.tab()
    expect(input).toHaveValue('(415) 555-2671 ext. 12')
    expect(change).toHaveBeenLastCalledWith('+14155552671 ext. 12')
    expect(details).toHaveBeenLastCalledWith(
      expect.objectContaining({ e164: '+14155552671', extension: '12' }),
    )
    expect(new FormData(view.container.querySelector('form')!).get('phone')).toBe(
      '+14155552671 ext. 12',
    )
    fireEvent.change(input, { target: { value: '+1 415 555 2671' } })
    expect(new FormData(view.container.querySelector('form')!).get('phone')).toBe('+14155552671')
  })

  it.each([
    ['foo', 3, 3, 'bar,baz', ['foobar', 'baz']],
    ['hello world', 6, 11, 'there,friend', ['hello there', 'friend']],
    ['tail', 0, 0, 'first,', ['first', 'tail']],
  ] as const)(
    'pastes tags into the current draft and selection (%s)',
    (draft, start, end, paste, expected) => {
      const change = vi.fn()
      render(<TagsInput onValueChange={change} />)
      const input = screen.getByRole('combobox') as HTMLInputElement
      fireEvent.change(input, { target: { value: draft } })
      input.setSelectionRange(start, end)
      fireEvent.paste(input, { clipboardData: { getData: () => paste } })
      expect(change).toHaveBeenLastCalledWith([...expected])
      expect(input).toHaveValue('')
    },
  )

  it('creates distinct filter rule and group IDs without crypto.randomUUID', async () => {
    vi.stubGlobal('crypto', { randomUUID: undefined })
    const user = userEvent.setup(),
      change = vi.fn()
    render(
      <FilterBuilder
        fields={[{ id: 'name', label: 'Name', type: 'text' }]}
        onValueChange={change}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Add condition' }))
    await user.click(screen.getByRole('button', { name: 'Add group' }))
    await user.click(screen.getAllByRole('button', { name: 'Add condition' })[0])
    const tree = change.mock.lastCall![0] as FilterGroup
    const ids = [
      tree.id,
      ...tree.children.map((n) => n.id),
      ...(tree.children[1] as FilterGroup).children.map((n) => n.id),
    ]
    expect(new Set(ids).size).toBe(ids.length)
    expect(tree.children.map((n) => n.kind)).toEqual(['rule', 'group'])
  })

  it('blocks stale folder uploads and creation, then restores root operations', async () => {
    const user = userEvent.setup(),
      upload = vi.fn(),
      create = vi.fn()
    const folder: FileBrowserEntry = { id: 'folder', name: 'Folder', kind: 'folder' }
    const props = { defaultFolderId: 'folder', onUpload: upload, onCreateFolder: create }
    const view = render(<FileBrowser {...props} entries={[folder]} />)
    const input = screen.getByLabelText('Upload files')
    await user.click(screen.getByRole('button', { name: 'New folder' }))
    view.rerender(<FileBrowser {...props} entries={[]} />)
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByRole('textbox', { name: 'Name' }), 'child')
    fireEvent.submit(dialog.querySelector('form')!)
    expect(create).not.toHaveBeenCalled()
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('button', { name: 'New folder' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled()
    expect(input).toBeDisabled()
    fireEvent.change(input, { target: { files: [new File(['x'], 'file.txt')] } })
    expect(upload).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Return to files' }))
    expect(screen.getByRole('button', { name: 'New folder' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Upload' })).toBeEnabled()
    fireEvent.change(input, { target: { files: [new File(['x'], 'file.txt')] } })
    expect(upload).toHaveBeenCalledWith(
      expect.any(Array),
      null,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  it('retains visible range text and upload instructions in accessible names', () => {
    render(
      <>
        <DateRangePicker
          label="Schedule"
          value={{ from: new Date(2034, 2, 14), to: new Date(2034, 2, 20) }}
        />
        <DateRangePicker placeholder="Pick travel dates" />
        <DateTimeRangePicker label="Release" />
        <Upload label="Documents" accept=".pdf" maxSize={2 * 1024 * 1024} />
      </>,
    )
    expect(
      screen.getByRole('button', { name: 'Schedule: Mar 14 – Mar 20, 2034' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pick travel dates' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Release: Choose date-time range' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Documents: Click to upload or drag and drop .pdf · up to 2 MB',
      }),
    ).toBeInTheDocument()
  })

  it('lets height utilities replace density defaults and resets nested comfortable density', () => {
    const view = render(
      <ConfigProvider density="compact">
        <Button className="h-12">Tall</Button>
        <Input aria-label="Short" className="h-7" />
        <ConfigProvider density="comfortable">
          <Button>Nested</Button>
        </ConfigProvider>
      </ConfigProvider>,
    )
    expect(screen.getByRole('button', { name: 'Tall' }).className).not.toContain(
      'ergon-control-height',
    )
    expect(screen.getByRole('textbox', { name: 'Short' }).className).not.toContain(
      'ergon-control-height',
    )
    const providers = view.container.querySelectorAll<HTMLElement>('[data-density]')
    expect(providers[0].style.getPropertyValue('--ergon-control-height')).toBe('30px')
    expect(providers[1].style.getPropertyValue('--ergon-control-height')).toBe('2.25rem')
  })

  it('keeps Showcase actions editable while preserving existing exclusions', () => {
    for (const spec of Object.values(playgrounds)) {
      const showcase = spec.presets.find((p) => p.name === 'Showcase')!
      for (const control of spec.controls.filter((c) => c.type === 'boolean')) {
        if (
          [
            'disabled',
            'loading',
            'empty',
            'error',
            'failure',
            'collapsed',
            'readOnly',
            'disabledAction',
            ...(spec.id === 'approval-request' ? ['expired', 'reject'] : []),
          ].includes(control.key) &&
          !(spec.id === 'spin' && control.key === 'loading')
        )
          expect(showcase.values[control.key], `${spec.id}.${control.key}`).toBe(false)
        else expect(showcase.values[control.key], `${spec.id}.${control.key}`).toBe(true)
      }
    }
  })
})
