import * as React from 'react'
import * as UI from '@/components/library'
import { toast } from 'sonner'
import { makeProjects, frameworkOptions, treeData, type Project } from '@/docs/demo-data'
import type { PreviewProps } from './preview'
const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new DOMException('Cancelled', 'AbortError'))
      },
      { once: true },
    )
  })
export function FormPreview({ id, config: v, onEvent }: PreviewProps) {
  const emit = (type: string, value: unknown) => onEvent({ type, value, time: Date.now() }),
    [result, setResult] = React.useState<unknown>()
  const fields: UI.FormPlusField[] = [
    {
      name: 'name',
      label: 'Project name',
      required: v.required !== false,
      rules: {
        validate: async (value) => {
          await wait(100)
          return value !== 'taken' || 'That project name is already in use'
        },
      },
    },
    {
      name: 'email',
      label: 'Contact email',
      required: v.required !== false,
      rules: {
        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
      },
    },
    { name: 'framework', label: 'Framework', type: 'select', options: frameworkOptions },
    ...(v.dependencies
      ? [
          {
            name: 'template',
            label: 'Project template',
            type: 'select' as const,
            dependencies: ['framework'],
            loadOptions: async (values: Record<string, any>, signal: AbortSignal) => {
              await wait(300, signal)
              emit('options-request', { framework: values.framework })
              return [
                { value: `${values.framework}-dashboard`, label: `${values.framework} dashboard` },
                { value: `${values.framework}-commerce`, label: `${values.framework} commerce` },
              ]
            },
          },
        ]
      : []),
    { name: 'budget', label: 'Budget', type: 'money' },
    { name: 'updates', label: 'Updates', type: 'switch' },
  ]
  const save = async (values: Record<string, any>) => {
    emit('submit', values)
    await wait(300)
    if (v.failure) throw new Error('The demonstration save was rejected. Your input is preserved.')
    setResult(values)
    emit('saved', values)
  }
  const props = {
    fields,
    defaultValues: {
      name: '',
      email: '',
      framework: 'react',
      template: '',
      budget: 2500,
      updates: true,
      members: [],
    },
    columns: Number(v.columns) as 1 | 2 | 3,
    onSubmit: save,
    submitLabel: String(v.submitLabel),
    disabled: Boolean(v.disabled),
    scrollToError: v.scrollToError !== false,
  }
  const mode = String(v.mode),
    children = v.dynamic ? (
      <UI.FormPlusList
        name="members"
        label="Team members"
        fields={[{ name: 'email', placeholder: 'Member email' }]}
        defaultItem={{ email: '' }}
      />
    ) : undefined
  return (
    <div className="mx-auto w-full max-w-xl space-y-5">
      {mode === 'login' ? (
        <UI.LoginForm onSubmit={save} submitLabel="Sign in" disabled={Boolean(v.disabled)} />
      ) : mode === 'modal' ? (
        <UI.ModalForm
          {...props}
          title="Create a project"
          trigger={<UI.Button>Open form</UI.Button>}
        >
          {children}
        </UI.ModalForm>
      ) : mode === 'drawer' ? (
        <UI.DrawerForm
          {...props}
          title="Create a project"
          trigger={<UI.Button>Open form</UI.Button>}
        >
          {children}
        </UI.DrawerForm>
      ) : mode === 'query' ? (
        <UI.QueryFilter {...props}>{children}</UI.QueryFilter>
      ) : mode === 'light' ? (
        <UI.LightFilter {...props}>{children}</UI.LightFilter>
      ) : (
        <UI.FormPlus
          {...props}
          steps={mode === 'steps' ? ['Details', 'Preferences'] : undefined}
          fields={fields.map((field, index) => ({ ...field, step: index < 3 ? 0 : 1 }))}
        >
          {children}
        </UI.FormPlus>
      )}
      {result !== undefined && (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs"
        >
          Saved successfully.
          <pre className="mt-2 overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
export function ListPreview({ id, config: v, onEvent }: PreviewProps) {
  const count = Number(v.count),
    records = React.useMemo(() => makeProjects(count), [count]),
    [shown, setShown] = React.useState(20),
    [loading, setLoading] = React.useState(false)
  const remote = React.useCallback(
    async (
      { page, pageSize, query }: { page: number; pageSize: number; query: string },
      signal: AbortSignal,
    ) => {
      await wait(250, signal)
      const filtered = records.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase()),
      )
      onEvent({ type: 'request', value: { page, pageSize, query }, time: Date.now() })
      return {
        items: filtered.slice((page - 1) * pageSize, page * pageSize),
        total: filtered.length,
      }
    },
    [records, onEvent],
  )
  const renderItem = (item: Project) => (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{item.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">{item.owner}</p>
      </div>
      {v.actions && (
        <UI.Button
          size="sm"
          variant="outline"
          onClick={() => onEvent({ type: 'open', value: item.id, time: Date.now() })}
        >
          Open
        </UI.Button>
      )}
    </div>
  )
  return (
    <div className="w-full">
      {id === 'list-plus' ? (
        <UI.ListPlus
          items={records}
          grid={Boolean(v.grid)}
          virtual={Boolean(v.virtual)}
          infinite={Boolean(v.infinite)}
          request={v.remote ? remote : undefined}
          getKey={(item) => item.id}
          getSearchText={(item) => item.name}
          renderItem={renderItem}
          pageSize={Number(v.pageSize)}
          onSelectionChange={
            v.selection
              ? (keys) => onEvent({ type: 'selection', value: keys, time: Date.now() })
              : undefined
          }
        />
      ) : (
        <UI.List
          items={v.infinite ? records.slice(0, shown) : records}
          grid={Boolean(v.grid)}
          virtual={Boolean(v.virtual)}
          getKey={(item) => item.id}
          renderItem={renderItem}
          loading={loading}
          hasMore={Boolean(v.infinite) && shown < count}
          onLoadMore={async () => {
            setLoading(true)
            await wait(250)
            setShown((current) => current + 20)
            setLoading(false)
            onEvent({ type: 'load-more', value: shown + 20, time: Date.now() })
          }}
        />
      )}
    </div>
  )
}
export function FeedbackPreview({ id, config: v, onEvent }: PreviewProps) {
  const [scoped, holder] = UI.useMessage({
      duration: Number(v.duration) || 3500,
      visibleToasts: Number(v.visible) || 3,
      expand: Boolean(v.expand),
    }),
    [confirm, confirmation] = UI.useConfirm(),
    push = React.useRef<HTMLDivElement>(null)
  const emit = (type: string, value: unknown) => onEvent({ type, value, time: Date.now() }),
    message = v.scoped ? scoped : toast
  return (
    <div ref={push} className="flex flex-wrap items-center gap-3 p-4 transition-transform">
      {holder}
      {confirmation}
      {id === 'app' ? (
        <>
          <UI.Button
            onClick={() => {
              message.success(String(v.label))
              emit('message', v.label)
            }}
          >
            Show {v.scoped ? 'scoped' : 'global'} feedback
          </UI.Button>
          <UI.Button
            variant="outline"
            onClick={async () =>
              emit(
                'confirm',
                await confirm({
                  title: 'Save this workspace?',
                  description: 'This confirmation is scoped to its provider.',
                }),
              )
            }
          >
            Confirm with context
          </UI.Button>
          <UI.Tooltip>
            <UI.TooltipTrigger asChild>
              <UI.Button variant="ghost">Focus for a hint</UI.Button>
            </UI.TooltipTrigger>
            <UI.TooltipContent>Providers work together.</UI.TooltipContent>
          </UI.Tooltip>
        </>
      ) : id === 'message' ? (
        <UI.Button
          onClick={() => {
            const type = String(v.status)
            if (type === 'promise')
              message.promise(wait(900), {
                loading: 'Saving…',
                success: String(v.content),
                error: 'Please try again',
              })
            else
              message[type as 'success' | 'error' | 'info' | 'warning'](String(v.content), {
                duration: Number(v.duration),
              })
            emit('message', type)
          }}
        >
          Show message
        </UI.Button>
      ) : id === 'notification' ? (
        <UI.Button
          onClick={() => {
            scoped.info(String(v.title), {
              description: String(v.description),
              position: v.position as any,
              action: v.action
                ? { label: 'Review', onClick: () => emit('action', 'notification') }
                : undefined,
            })
            emit('notification', v.position)
          }}
        >
          Show notification
        </UI.Button>
      ) : id === 'modal' ? (
        v.staticConfirm ? (
          <UI.Button
            onClick={async () =>
              emit(
                'confirm',
                await confirm({ title: String(v.title), description: String(v.description) }),
              )
            }
          >
            Open confirmation
          </UI.Button>
        ) : (
          <UI.Dialog>
            <UI.DialogTrigger asChild>
              <UI.Button>Open dialog</UI.Button>
            </UI.DialogTrigger>
            <UI.DialogContent draggable={Boolean(v.draggable)} resizable={Boolean(v.resizable)}>
              <UI.DialogHeader className={v.draggable ? 'cursor-move' : ''}>
                <UI.DialogTitle>{String(v.title)}</UI.DialogTitle>
                <UI.DialogDescription>{String(v.description)}</UI.DialogDescription>
              </UI.DialogHeader>
              <UI.Input aria-label="Project name" placeholder="Your next idea" />
              {v.nested && (
                <UI.Dialog>
                  <UI.DialogTrigger asChild>
                    <UI.Button variant="outline">Open nested dialog</UI.Button>
                  </UI.DialogTrigger>
                  <UI.DialogContent>
                    <UI.DialogTitle>More detail</UI.DialogTitle>
                    <UI.DialogDescription>
                      A second dialog with independent focus.
                    </UI.DialogDescription>
                    <UI.DialogClose asChild>
                      <UI.Button>Done</UI.Button>
                    </UI.DialogClose>
                  </UI.DialogContent>
                </UI.Dialog>
              )}
              <UI.DialogFooter>
                <UI.DialogClose asChild>
                  <UI.Button onClick={() => emit('confirm', 'saved')}>Save changes</UI.Button>
                </UI.DialogClose>
              </UI.DialogFooter>
            </UI.DialogContent>
          </UI.Dialog>
        )
      ) : (
        <UI.Sheet>
          <UI.SheetTrigger asChild>
            <UI.Button>Open drawer</UI.Button>
          </UI.SheetTrigger>
          <UI.SheetContent side={v.side as any} pushTarget={v.push ? push : undefined}>
            <UI.SheetHeader>
              <UI.SheetTitle>{String(v.title)}</UI.SheetTitle>
              <UI.SheetDescription>{String(v.description)}</UI.SheetDescription>
            </UI.SheetHeader>
            <div className="p-5">
              {v.nested && (
                <UI.Sheet>
                  <UI.SheetTrigger asChild>
                    <UI.Button variant="outline">Open nested drawer</UI.Button>
                  </UI.SheetTrigger>
                  <UI.SheetContent pushTarget={push}>
                    <UI.SheetHeader>
                      <UI.SheetTitle>More details</UI.SheetTitle>
                      <UI.SheetDescription>
                        Each layer has independent focus management.
                      </UI.SheetDescription>
                    </UI.SheetHeader>
                  </UI.SheetContent>
                </UI.Sheet>
              )}
            </div>
          </UI.SheetContent>
        </UI.Sheet>
      )}
    </div>
  )
}
export function TreePreview({ id, config: v, onEvent }: PreviewProps) {
  const [nodes, setNodes] = React.useState<UI.TreeNode[]>(() =>
      Number(v.count)
        ? [
            {
              key: 'root',
              label: 'Large collection',
              children: Array.from({ length: Number(v.count) }, (_, index) => ({
                key: String(index),
                label: `Document ${index + 1}`,
                isLeaf: true,
              })),
            },
          ]
        : [
            ...treeData,
            ...(v.async ? [{ key: 'remote', label: 'Remote folder', isLeaf: false }] : []),
          ],
    ),
    [keys, setKeys] = React.useState<string[]>([])
  const load = React.useCallback(
    async (key: string) => {
      await wait(300)
      const inject = (items: UI.TreeNode[]): UI.TreeNode[] =>
        items.map((node) =>
          node.key === key
            ? {
                ...node,
                children: [
                  { key: key + '-one', label: 'Loaded document', isLeaf: true },
                  { key: key + '-two', label: 'Another document', isLeaf: true },
                ],
              }
            : node.children
              ? { ...node, children: inject(node.children) }
              : node,
        )
      setNodes((previous) => inject(previous))
      onEvent({ type: 'load-children', value: key, time: Date.now() })
    },
    [onEvent],
  )
  const change = (value: string[]) => {
    setKeys(value)
    onEvent({ type: 'selection', value, time: Date.now() })
  }
  return id === 'tree-select' ? (
    <UI.TreeSelect
      nodes={nodes}
      value={keys}
      onValueChange={change}
      multiple={Boolean(v.multiple)}
      searchable={Boolean(v.searchable)}
      virtual={Boolean(v.virtual)}
      maxTags={Number(v.maxTags)}
      disabled={Boolean(v.disabled)}
      loadChildren={v.async ? load : undefined}
    />
  ) : (
    <div className="w-full">
      <UI.Tree
        nodes={nodes}
        defaultExpandedKeys={Number(v.count) ? ['root'] : ['workspace', 'design']}
        value={keys}
        onValueChange={change}
        checkable={Boolean(v.checkable)}
        virtual={Boolean(v.virtual)}
        loadChildren={v.async ? load : undefined}
        onSelect={(key) => onEvent({ type: 'select', value: key, time: Date.now() })}
        onNodesChange={v.draggable ? setNodes : undefined}
        onNodeDrop={
          v.draggable
            ? (source, target, position) =>
                onEvent({ type: 'drop', value: { source, target, position }, time: Date.now() })
            : undefined
        }
      />
    </div>
  )
}
