import { expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DocumentPage } from '@/docs/document-page'

it('switches all installation commands to the selected package runner without redundant overrides', async () => {
  const user = userEvent.setup()
  const { container } = render(<DocumentPage page="installation" />)
  for (const [label, runner, task] of [
    ['npm', 'npx @ergonui/cli', 'npm run build'],
    ['Bun', 'bunx @ergonui/cli', 'bun run build'],
    ['Deno', 'dx @ergonui/cli', 'deno task build'],
    ['pnpm', 'pnpm dlx @ergonui/cli', 'pnpm run build'],
    ['Yarn', 'yarn dlx @ergonui/cli', 'yarn run build'],
  ]) {
    const choice = screen.getByRole('radio', { name: label })
    await user.click(choice)
    expect(choice).toBeChecked()
    const snippets = [...container.querySelectorAll('pre code')]
      .map((node) => node.textContent)
      .join('\n')
    expect(snippets).toContain(`${runner} create my-app --components line-chart,pie-chart`)
    expect(snippets).toContain(`${runner} init`)
    expect(snippets).toContain(`${runner} add button table-plus`)
    expect(snippets).toContain(task)
    expect(snippets).not.toContain('--package-manager')
    if (label === 'Deno') expect(container).toHaveTextContent('deno x --install-alias=dx')
  }
})

it('supports arrow-key selection, wrapping, and keeps one package manager selected', async () => {
  const user = userEvent.setup()
  const { container } = render(<DocumentPage page="installation" />)
  const npm = screen.getByRole('radio', { name: 'npm' })
  await user.click(npm)
  await user.keyboard('{ArrowRight>}')
  await waitFor(() => expect(screen.getByRole('radio', { name: 'Bun' })).toBeChecked())
  await user.keyboard('{/ArrowRight}')
  expect(screen.getByRole('radio', { name: 'Bun' })).toHaveFocus()
  expect(container.querySelector('pre code')).toHaveTextContent('bunx @ergonui/cli create')
  await user.keyboard('{End}')
  await waitFor(() => expect(screen.getByRole('radio', { name: 'Yarn' })).toHaveFocus())
  await user.keyboard(' ')
  await waitFor(() => expect(screen.getByRole('radio', { name: 'Yarn' })).toBeChecked())
  await user.keyboard('{ArrowRight>}')
  await waitFor(() => expect(npm).toBeChecked())
  await user.keyboard('{/ArrowRight}')
  expect(npm).toHaveFocus()
  await user.click(npm)
  expect(screen.getAllByRole('radio', { checked: true })).toHaveLength(1)
})
