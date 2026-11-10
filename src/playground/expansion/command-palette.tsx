import * as React from 'react'
import { Home, Settings, Palette, Plus, Folder, FileText } from 'lucide-react'
import { CommandPalette, type PaletteAction } from '@/components/ui/command-palette'
import type { PreviewProps } from '../preview'
import { report, simulate } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config,
    actions = React.useMemo<PaletteAction[]>(
      () => [
        {
          id: 'home',
          label: 'Go to overview',
          group: 'Navigation',
          icon: <Home />,
          keywords: ['dashboard'],
          onSelect: () => report(props, 'navigate', 'overview'),
        },
        {
          id: 'projects',
          label: 'Projects',
          group: 'Navigation',
          icon: <Folder />,
          ...(v.nested
            ? {
                children: [
                  {
                    id: 'design',
                    label: 'Design system',
                    icon: <Palette />,
                    onSelect: () => report(props, 'navigate', 'design-system'),
                  },
                  {
                    id: 'docs',
                    label: 'Documentation',
                    icon: <FileText />,
                    onSelect: () => report(props, 'navigate', 'documentation'),
                  },
                ],
              }
            : { onSelect: () => report(props, 'navigate', 'projects') }),
        },
        {
          id: 'create',
          label: 'Create project',
          description: 'An asynchronous sample action',
          group: 'Actions',
          shortcut: '⌘ N',
          icon: <Plus />,
          keepOpen: !!v.keepOpen,
          onSelect: async ({ signal }) => {
            await simulate(signal, !!v.failure)
            report(props, 'project-created', { simulated: true })
          },
        },
        {
          id: 'theme',
          label: 'Change appearance',
          group: 'Settings',
          icon: <Palette />,
          disabled: !!v.disabledAction,
          onSelect: () => report(props, 'appearance', 'theme-settings'),
        },
        {
          id: 'settings',
          label: 'Open settings',
          group: 'Settings',
          icon: <Settings />,
          onSelect: () => report(props, 'navigate', 'settings'),
        },
      ],
      [v.nested, v.keepOpen, v.failure, v.disabledAction, props.onEvent],
    ),
    load = React.useCallback(
      async (query: string, { signal, path }: { signal: AbortSignal; path: string[] }) => {
        await simulate(signal, !!v.failure)
        let list = actions
        for (const id of path) list = list.find((action) => action.id === id)?.children ?? []
        return list.filter((action) =>
          `${action.label} ${action.description ?? ''}`.toLowerCase().includes(query.toLowerCase()),
        )
      },
      [actions, v.failure],
    )
  return (
    <div className="flex w-full flex-col items-center gap-4 rounded-xl border border-dashed bg-muted/20 p-10">
      <p className="text-xs text-muted-foreground">
        Open the palette to try nested navigation, async actions, search and focus restoration.
        Navigation and requests are simulated.
      </p>
      <CommandPalette
        actions={actions}
        title={String(v.title)}
        placeholder={String(v.placeholder)}
        enableInInputs={!!v.enableInInputs}
        loadActions={v.async ? load : undefined}
        onAction={(action) => report(props, 'command', action.id)}
        onOpenChange={(open) => report(props, 'palette-open', open)}
      />
    </div>
  )
}
