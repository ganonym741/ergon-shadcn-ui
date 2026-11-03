import { FormPreview, ListPreview, FeedbackPreview, TreePreview } from './flows'
import * as React from 'react'
import {
  Sparkles,
  Heart,
  Settings,
  Users,
  Bell,
  Star,
  Search,
  Folder,
  Plus,
  ArrowRight,
  Mail,
  Layers,
} from 'lucide-react'

import * as UI from '@/components/library'
import { useDebouncedValue, useBreakpoints } from '@/components/ui/util'
import { type Config, parseData } from './schema'
import { AdvancedDataPreview } from './table-preview'
import { treeData, frameworkOptions } from '@/docs/demo-data'
const RichTextPreview = React.lazy(() => import('./rich-text-preview'))
const ChartPreview = React.lazy(() => import('./chart-preview'))
export interface PlaygroundEvent {
  type: string
  value: unknown
  time: number
}
export interface PreviewProps {
  id: string
  config: Config
  onEvent: (event: PlaygroundEvent) => void
}
const sampleItems = [
  { key: 'overview', label: 'Overview', icon: <Layers size={15} /> },
  { key: 'projects', label: 'Projects', icon: <Folder size={15} /> },
  { key: 'settings', label: 'Settings', icon: <Settings size={15} /> },
  {
    key: 'team',
    label: 'Team',
    icon: <Users size={15} />,
    children: [
      { key: 'members', label: 'Members' },
      { key: 'invitations', label: 'Invitations' },
    ],
  },
]
const wait = (milliseconds: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(resolve, milliseconds)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout)
        reject(new DOMException('Cancelled', 'AbortError'))
      },
      { once: true },
    )
  })
export function PlaygroundPreview({ id, config: v, onEvent }: PreviewProps) {
  const s = (key: string) => String(v[key] ?? ''),
    n = (key: string) => Number(v[key] ?? 0),
    b = (key: string) => Boolean(v[key]),
    emit = (type: string, value: unknown) => onEvent({ type, value, time: Date.now() })
  const [state, setState] = React.useState<Record<string, any>>({
    text: s('value') || s('content'),
    checked: id === 'spin' ? b('loading') : (v.checked ?? true),
    value: s('path') || s('selected') || s('value') || 'overview',
    number: Number(v.value ?? 24),
    keys: id === 'check-card-plus' ? ['Starter', 'Team', 'Business'].slice(0, n('min')) : [],
    date: new Date(s('value') || s('date') || '2026-10-24'),
    range: undefined,
    multi: [],
    step: n('current'),
    page: n('page') || 1,
    pageSize: n('pageSize') || 10,
    open: false,
    progress: n('value') || 64,
    tags: ['Design', 'Engineering', 'Product'],
    tabs: Array.from({ length: n('count') || 4 }, (_, index) => ({
      value: String(index),
      label: `View ${index + 1}`,
      content: <p className="p-5 text-sm text-muted-foreground">Workspace view {index + 1}</p>,
      closable: b('closable'),
    })),
    record: { name: 'Sarah Kim', email: 'sarah@example.com', role: 'designer', active: true },
    nodes: treeData,
    deadline: Date.now() + (n('seconds') || 120) * 1000,
    gradient: {
      from: '#e66043',
      to: '#6976c5',
      angle: 120,
      stops: Array.from({ length: n('stops') || 3 }, (_, i) => ({
        color: ['#e66043', '#6976c5', '#4f8a6c'][i % 3],
        position: (i * 100) / Math.max(1, (n('stops') || 3) - 1),
      })),
    },
  })
  const set = (key: string, value: any) => {
    setState((previous) => ({
      ...previous,
      [key]: typeof value === 'function' ? value(previous[key]) : value,
    }))
    emit(key, typeof value === 'function' ? 'updated' : value)
  }
  const scroll = React.useRef<HTMLDivElement>(null),
    scrollTarget = React.useCallback(() => scroll.current, []),
    debounced = useDebouncedValue(state.text, v.debounce === undefined ? 300 : n('debounce')),
    points = useBreakpoints(),
    prefix = React.useId().replaceAll(':', '')
  const options = parseData(v, 'options', frameworkOptions),
    disabled = b('disabled'),
    count = Math.max(0, n('count'))
  const stack = (children: React.ReactNode) => (
    <div className="mx-auto w-full max-w-xl space-y-5">{children}</div>
  )
  const boxes = Array.from({ length: count || 4 }, (_, index) => (
    <div
      key={index}
      className="flex min-h-16 min-w-14 flex-1 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 p-4 text-sm text-primary"
    >
      {index + 1}
    </div>
  ))
  const save = async (values: Record<string, any>) => {
    emit('submit', values)
    await wait(350)
    if (b('failure')) throw new Error('The demonstration save was rejected.')
    emit('saved', values)
  }
  switch (id) {
    case 'chart':
    case 'line-chart':
    case 'area-chart':
    case 'bar-chart':
    case 'pie-chart':
    case 'scatter-chart':
    case 'radar-chart':
    case 'heatmap-chart':
    case 'gauge-chart':
      return (
        <React.Suspense fallback={<p className="text-sm text-muted-foreground">Loading charts…</p>}>
          <ChartPreview id={id} config={v} onEvent={onEvent} />
        </React.Suspense>
      )
    case 'rich-text-editor':
      return (
        <React.Suspense fallback={<p className="text-sm text-muted-foreground">Loading editor…</p>}>
          <RichTextPreview id={id} config={v} onEvent={onEvent} />
        </React.Suspense>
      )
    case 'button':
      return (
        <UI.Button
          variant={s('variant') as any}
          size={s('size') as any}
          disabled={disabled}
          loading={b('loading')}
          onClick={() => emit('click', { label: s('label') })}
        >
          {b('icon') && <Plus />}
          {s('size') !== 'icon' && s('label')}
        </UI.Button>
      )
    case 'float-button':
      return (
        <div
          ref={scroll}
          className="relative h-72 w-full overflow-auto rounded-xl border bg-muted/20"
        >
          <div className="p-5" style={{ height: 700 }}>
            Scroll this workspace.
            <UI.FloatButtonGroup
              expandable={b('expandable')}
              className="sticky right-auto bottom-4 ml-auto mr-4 mt-8 w-fit"
            >
              <UI.FloatButton
                disabled={disabled}
                aria-label={s('label')}
                onClick={() => emit('action', 'create')}
              >
                <Plus />
              </UI.FloatButton>
              <UI.FloatButton aria-label="Messages" onClick={() => emit('action', 'messages')}>
                <Mail />
              </UI.FloatButton>
            </UI.FloatButtonGroup>
            {b('backTop') && (
              <UI.BackTop
                target={scrollTarget}
                threshold={n('threshold')}
                className="sticky bottom-4 left-4"
              />
            )}
          </div>
        </div>
      )
    case 'icon': {
      const icons = { Sparkles, Heart, Settings, Users, Bell, Star, Search, Folder }
      return (
        <div className="flex gap-6">
          {b('sprite') ? (
            <>
              <svg className="hidden">
                <symbol id={`${prefix}-star`} viewBox="0 0 24 24">
                  <path d="m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1z" />
                </symbol>
              </svg>
              <UI.SpriteIcon
                spriteUrl=""
                name={`${prefix}-star`}
                size={n('size')}
                style={{ color: s('color') }}
              />
            </>
          ) : (
            <UI.Icon
              icon={icons[s('icon') as keyof typeof icons]}
              size={n('size')}
              strokeWidth={n('stroke')}
              color={s('color')}
            />
          )}
        </div>
      )
    }
    case 'typography':
      return stack(
        <UI.Typography
          as={s('as') as any}
          muted={b('muted')}
          copyable={b('copyable')}
          editable={b('editable')}
          editTrigger={s('editTrigger') as any}
          ellipsis={n('ellipsis') || undefined}
          expandable={b('expandable')}
          onTextChange={(value) => set('text', value)}
        >
          {state.text}
        </UI.Typography>,
      )
    case 'divider':
      return (
        <div className={b('vertical') ? 'flex h-32 items-center gap-4' : 'w-full space-y-5'}>
          <span className="text-sm text-muted-foreground">First idea</span>
          <UI.Divider
            orientation={b('vertical') ? 'vertical' : 'horizontal'}
            align={s('align') as any}
            dashed={b('dashed')}
          >
            {s('content')}
          </UI.Divider>
          <span className="text-sm text-muted-foreground">Next idea</span>
        </div>
      )
    case 'flex':
      return (
        <UI.Flex
          className="w-full min-h-40 rounded-lg border p-4"
          gap={b('responsive') ? { xs: 8, md: n('gap'), xl: 32 } : n('gap')}
          direction={b('responsive') ? { xs: 'column', md: 'row' } : undefined}
          vertical={b('vertical')}
          align={s('align')}
          justify={s('justify')}
          wrap={b('wrap')}
        >
          {boxes}
        </UI.Flex>
      )
    case 'grid':
      return s('mode') === 'columns' ? (
        <UI.Row gutter={n('gap')} className="w-full">
          {boxes.map((child, index) => (
            <UI.Col
              key={index}
              span={b('responsive') ? { xs: 24, sm: 12, lg: n('span') } : n('span')}
              offset={index === 0 ? n('offset') : 0}
            >
              {child}
            </UI.Col>
          ))}
        </UI.Row>
      ) : (
        <UI.Grid className="w-full" gap={n('gap')} minWidth={n('minWidth')}>
          {boxes}
        </UI.Grid>
      )
    case 'layout':
      return (
        <UI.Layout className="min-h-80 w-full overflow-hidden rounded-xl border">
          <UI.LayoutHeader>{s('title')}</UI.LayoutHeader>
          <div className="flex flex-1">
            <UI.LayoutSider
              width={n('width')}
              collapsible={b('collapsible')}
              defaultCollapsed={b('collapsed')}
            >
              <UI.Menu
                items={sampleItems.slice(0, 3)}
                value={state.value}
                onValueChange={(value) => set('value', value)}
              />
            </UI.LayoutSider>
            <UI.LayoutContent>
              <h3 className="font-medium">{state.value}</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                A flexible space for your application.
              </p>
            </UI.LayoutContent>
          </div>
          {b('footer') && <UI.LayoutFooter>ErgonUI workspace</UI.LayoutFooter>}
        </UI.Layout>
      )
    case 'layout-plus':
      return (
        <UI.LayoutPlus
          className="w-full"
          logo="Workspace"
          title={s('title')}
          items={sampleItems}
          allow={(item) => !b('permissions') || item.key !== 'settings'}
          value={state.value}
          defaultCollapsed={b('collapsed')}
          settings={b('settings')}
          onNavigate={(value) => set('value', value)}
          breadcrumb={['Workspace', state.value]}
          footer="Your workspace"
          tabs={b('tabs') ? state.tabs : undefined}
          onTabsChange={(value) => set('tabs', value)}
          activeTab={state.tab ?? '0'}
          onTabChange={(value) => set('tab', value)}
        >
          <UI.Statistic title="Monthly revenue" value={24680} prefix="$" trend={12.8} />
        </UI.LayoutPlus>
      )
    case 'masonry':
      return (
        <UI.Masonry
          className="w-full"
          minWidth={n('minWidth')}
          gap={n('gap')}
          virtual={b('virtual')}
          measured={b('measured')}
          height={n('height')}
        >
          {Array.from({ length: count }, (_, index) => (
            <div
              key={index}
              className="flex items-center justify-center rounded-lg border bg-primary/10 text-primary"
              style={{ height: 70 + (index % 5) * 37 }}
            >
              Item {index + 1}
            </div>
          ))}
        </UI.Masonry>
      )
    case 'space':
      return b('compact') ? (
        <UI.Compact vertical={b('vertical')}>
          {boxes.map((_, index) => (
            <UI.Button key={index} variant="outline" onClick={() => emit('click', index)}>
              Action {index + 1}
            </UI.Button>
          ))}
        </UI.Compact>
      ) : (
        <UI.Space vertical={b('vertical')} gap={n('gap')}>
          {boxes.map((_, index) => (
            <UI.Button key={index} variant="outline" onClick={() => emit('click', index)}>
              Action {index + 1}
            </UI.Button>
          ))}
        </UI.Space>
      )
    case 'splitter':
      return (
        <UI.Splitter
          className="h-72 w-full rounded-lg border"
          orientation={b('vertical') ? 'vertical' : 'horizontal'}
          disabled={disabled}
          storageKey={b('persist') ? 'ergonui-playground-splitter' : undefined}
          onLayoutChanged={(layout) => emit('layout', layout)}
        >
          <UI.SplitterPanel id="first" defaultSize={`${n('first')}%`} minSize="10%">
            <div
              tabIndex={0}
              aria-label="Navigation panel"
              className="grid h-full min-h-20 place-items-center bg-muted/30"
            >
              Navigation
            </div>
          </UI.SplitterPanel>
          <UI.SplitterHandle withHandle={b('handle')} />
          <UI.SplitterPanel id="second" minSize="10%">
            <div
              tabIndex={0}
              aria-label="Content panel"
              className="grid h-full min-h-20 place-items-center"
            >
              Your content
            </div>
          </UI.SplitterPanel>
        </UI.Splitter>
      )
    case 'anchor': {
      const sections = parseData<string[]>(v, 'sections', [
        'Introduction',
        'The details',
        'Next steps',
      ])
      return (
        <div className={b('horizontal') ? 'w-full space-y-4' : 'flex w-full gap-5'}>
          <UI.Anchor
            getContainer={scrollTarget}
            horizontal={b('horizontal')}
            offset={n('offset')}
            onActiveChange={(href) => emit('active', href)}
            items={sections.map((title, index) => ({ title, href: `#${prefix}-section-${index}` }))}
          />
          <div
            tabIndex={0}
            aria-label="Anchor sections"
            ref={scroll}
            className="h-64 flex-1 overflow-auto rounded-lg border p-5"
          >
            {sections.map((title, index) => (
              <section
                key={index}
                id={`${prefix}-section-${index}`}
                className="min-h-52 scroll-mt-20"
              >
                <h3 className="font-medium">{title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  This section demonstrates in-page navigation and active tracking.
                </p>
              </section>
            ))}
          </div>
        </div>
      )
    }
    case 'breadcrumb':
      return b('automatic') ? (
        <UI.RouteBreadcrumb
          pathname={s('path')}
          separator={s('separator')}
          onNavigate={(href) => emit('navigate', href)}
        />
      ) : (
        <UI.Breadcrumb>
          <UI.BreadcrumbList>
            {s('path')
              .split('/')
              .filter(Boolean)
              .map((part, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <UI.BreadcrumbSeparator>{s('separator')}</UI.BreadcrumbSeparator>}
                  <UI.BreadcrumbItem>
                    <UI.BreadcrumbPage>{part}</UI.BreadcrumbPage>
                  </UI.BreadcrumbItem>
                </React.Fragment>
              ))}
          </UI.BreadcrumbList>
        </UI.Breadcrumb>
      )
    case 'dropdown':
      return b('context') ? (
        <UI.ContextMenu>
          <UI.ContextMenuTrigger
            disabled={disabled}
            className="grid h-32 w-full max-w-md place-items-center rounded-xl border border-dashed text-sm text-muted-foreground"
          >
            Right-click for {s('label')}
          </UI.ContextMenuTrigger>
          <UI.ContextMenuContent>
            <UI.ContextMenuItem onSelect={() => emit('action', 'edit')}>
              Edit project
            </UI.ContextMenuItem>
            <UI.ContextMenuItem onSelect={() => emit('action', 'share')}>Share</UI.ContextMenuItem>
            {b('nested') && (
              <UI.ContextMenuSub>
                <UI.ContextMenuSubTrigger className="rounded px-3 py-2 text-xs">
                  Invite people →
                </UI.ContextMenuSubTrigger>
                <UI.ContextMenuSubContent>
                  <UI.ContextMenuItem onSelect={() => emit('action', 'email')}>
                    By email
                  </UI.ContextMenuItem>
                </UI.ContextMenuSubContent>
              </UI.ContextMenuSub>
            )}
          </UI.ContextMenuContent>
        </UI.ContextMenu>
      ) : (
        <UI.DropdownMenu>
          <UI.DropdownMenuTrigger asChild>
            <UI.Button disabled={disabled} variant="outline">
              {s('label')}
            </UI.Button>
          </UI.DropdownMenuTrigger>
          <UI.DropdownMenuContent side={s('side') as any}>
            <UI.DropdownMenuLabel>Workspace</UI.DropdownMenuLabel>
            <UI.DropdownMenuItem onSelect={() => emit('action', 'edit')}>
              Edit project
            </UI.DropdownMenuItem>
            <UI.DropdownMenuItem onSelect={() => emit('action', 'share')}>
              Share
            </UI.DropdownMenuItem>
            {b('nested') && (
              <UI.DropdownMenuSub>
                <UI.DropdownMenuSubTrigger>Invite people</UI.DropdownMenuSubTrigger>
                <UI.DropdownMenuSubContent>
                  <UI.DropdownMenuItem onSelect={() => emit('action', 'email')}>
                    By email
                  </UI.DropdownMenuItem>
                </UI.DropdownMenuSubContent>
              </UI.DropdownMenuSub>
            )}
          </UI.DropdownMenuContent>
        </UI.DropdownMenu>
      )
    case 'menu':
      return (
        <UI.Menu
          className={s('mode') === 'horizontal' ? 'w-full' : b('collapsed') ? 'w-14' : 'w-56'}
          mode={s('mode') as any}
          collapsed={b('collapsed')}
          items={sampleItems.map((item) => ({
            ...item,
            disabled,
            children: b('nested') ? item.children : undefined,
          }))}
          value={state.value}
          onValueChange={(value) => set('value', value)}
        />
      )
    case 'pagination':
      return (
        <UI.PaginationControl
          total={n('total')}
          pageSize={state.pageSize}
          page={state.page}
          onChange={(value) => set('page', value)}
          onPageSizeChange={b('sizes') ? (value) => set('pageSize', value) : undefined}
        />
      )
    case 'steps':
      return (
        <UI.Steps
          className="w-full"
          current={state.step}
          onChange={(value) => set('step', value)}
          vertical={b('vertical')}
          status={s('status') as any}
          items={['Details', 'Team', 'Review', 'Launch'].map((title, index) => ({
            title,
            description: b('description') ? `Step ${index + 1} of your project` : undefined,
            icon: b('icons') ? <Sparkles size={15} /> : undefined,
          }))}
        />
      )
    case 'tabs':
      return (
        <div className="w-full">
          <UI.WorkspaceTabs
            orientation={s('orientation') as any}
            items={state.tabs}
            value={state.value === 'overview' ? '0' : state.value}
            onValueChange={(value) => set('value', value)}
            onItemsChange={(value) => set('tabs', value)}
            reorderable={b('reorderable')}
          />
        </div>
      )
    case 'auto-complete':
      return stack(
        <UI.AutoComplete
          searchable={b('searchable')}
          options={Array.from({ length: count }, (_, index) => `Framework ${index + 1}`)}
          value={state.text}
          onValueChange={(value) => set('text', value)}
          placeholder={s('placeholder')}
          disabled={disabled}
          loadOptions={
            b('async')
              ? async (query, signal) => {
                  await wait(250, signal)
                  return frameworkOptions
                    .map((option) => option.label)
                    .filter((label) => label.toLowerCase().includes(query.toLowerCase()))
                }
              : undefined
          }
        />,
      )
    case 'cascader':
      return (
        <UI.Cascader
          multiple={b('multiple')}
          values={state.multi}
          onValuesChange={(value) => set('multi', value)}
          disabled={disabled}
          searchable={b('searchable')}
          changeOnSelect={b('changeOnSelect')}
          options={[
            {
              value: 'asia',
              label: 'Asia',
              isLeaf: false,
              children: b('async')
                ? undefined
                : [
                    {
                      value: 'id',
                      label: 'Indonesia',
                      children: [
                        { value: 'jkt', label: 'Jakarta' },
                        { value: 'bali', label: 'Bali' },
                      ],
                    },
                    { value: 'jp', label: 'Japan', children: [{ value: 'tokyo', label: 'Tokyo' }] },
                  ],
            },
            {
              value: 'eu',
              label: 'Europe',
              children: [
                { value: 'fr', label: 'France', children: [{ value: 'paris', label: 'Paris' }] },
              ],
            },
          ]}
          onValueChange={(value) => emit('path', value)}
          loadChildren={
            b('async')
              ? async (path, signal) => {
                  await wait(250, signal)
                  return [
                    {
                      value: 'id',
                      label: 'Indonesia',
                      children: [
                        { value: 'jkt', label: 'Jakarta' },
                        { value: 'bali', label: 'Bali' },
                      ],
                    },
                  ]
                }
              : undefined
          }
        />
      )
    case 'checkbox':
      return b('group') ? (
        <UI.CheckboxGroup
          options={options}
          value={state.keys}
          onValueChange={(value) => set('keys', value)}
          disabled={disabled}
        />
      ) : (
        <label className="flex items-center gap-3 text-sm">
          <UI.Checkbox
            disabled={disabled}
            checked={b('indeterminate') ? 'indeterminate' : state.checked}
            onCheckedChange={(value) => set('checked', !!value)}
          />
          {s('label')}
        </label>
      )
    case 'check-card-plus':
      return (
        <UI.CheckCardGroup
          value={state.keys}
          onValueChange={(value) => set('keys', value)}
          multiple={b('multiple')}
          min={n('min')}
          max={n('max')}
          disabled={disabled}
          options={['Starter', 'Team', 'Business', 'Enterprise'].map((name, index) => ({
            value: name,
            title: index === 0 ? s('title') : name,
            description: s('description'),
            icon: <Layers size={20} />,
          }))}
        />
      )
    case 'color-picker':
      return stack(
        b('gradient') ? (
          <UI.GradientPicker
            value={state.gradient}
            disabled={disabled}
            onValueChange={(value) => set('gradient', value)}
          />
        ) : (
          <UI.ColorPicker
            value={state.text}
            onValueChange={(value) => set('text', value)}
            allowAlpha={b('allowAlpha')}
            disabled={disabled}
            format={s('format') as any}
          />
        ),
      )
    case 'date-picker': {
      const mode = s('mode')
      return stack(
        <UI.ConfigProvider locale={s('locale')}>
          {mode === 'range' ? (
            <UI.DateRangePicker
              value={state.range}
              onValueChange={(value) => set('range', value)}
              disabled={disabled}
            />
          ) : mode === 'multiple' ? (
            <UI.MultiDatePicker
              value={state.multi}
              onValueChange={(value) => set('multi', value)}
              disabled={disabled}
            />
          ) : mode === 'month' ? (
            <UI.MonthPicker onValueChange={(value) => emit('month', value)} disabled={disabled} />
          ) : mode === 'year' ? (
            <UI.YearPicker onValueChange={(value) => emit('year', value)} disabled={disabled} />
          ) : mode === 'week' ? (
            <UI.WeekPicker onValueChange={(value) => emit('week', value)} disabled={disabled} />
          ) : mode === 'quarter' ? (
            <UI.QuarterPicker
              onValueChange={(value) => emit('quarter', value)}
              disabled={disabled}
            />
          ) : mode === 'datetime-range' ? (
            <UI.DateTimeRangePicker
              timeZone={s('timeZone')}
              value={state.range}
              onValueChange={(value) => set('range', value)}
              disabled={disabled}
            />
          ) : mode === 'datetime' ? (
            <UI.DateTimePicker
              timeZone={s('timeZone')}
              value={state.date}
              onValueChange={(value) => set('date', value)}
              disabled={disabled}
            />
          ) : (
            <UI.DatePicker
              locale={s('locale')}
              timeZone={s('timeZone')}
              value={state.date}
              onValueChange={(value) => set('date', value)}
              disabled={disabled}
            />
          )}
          <p className="mt-3 text-[10px] text-muted-foreground">
            {s('locale')} · {s('timeZone')}
          </p>
        </UI.ConfigProvider>,
      )
    }
    case 'form':
    case 'form-plus':
      return <FormPreview {...{ id, config: v, onEvent }} />
    case 'field-plus':
      return stack(
        <UI.FieldPlus
          mode={s('mode') as any}
          type={s('type') as any}
          value={state.text}
          onValueChange={(value) => set('text', value)}
          options={frameworkOptions}
          currency={s('currency')}
          treeNodes={treeData}
          disabled={disabled}
        />,
      )
    case 'input':
      return stack(
        s('type') === 'otp' ? (
          <UI.OTPInput
            value={state.text}
            onValueChange={(value) => set('text', value)}
            disabled={disabled}
          />
        ) : (
          <UI.Input
            type={s('type')}
            value={state.text}
            onValueChange={(value) => set('text', value)}
            allowClear={b('allowClear')}
            showCount={b('showCount')}
            maxLength={n('maxLength')}
            passwordToggle={s('type') === 'password'}
            leading={b('leading') ? <Search size={15} /> : undefined}
            placeholder={s('placeholder')}
            disabled={disabled}
          />
        ),
      )
    case 'input-number':
      return s('mode') === 'decimal' ? (
        <UI.DecimalInputNumber
          value={state.text}
          onValueChange={(value) => set('text', value)}
          step={s('step')}
          min={s('min')}
          max={s('max')}
          locale={s('locale')}
          disabled={disabled}
        />
      ) : (
        <UI.InputNumber
          value={state.number}
          onValueChange={(value) => set('number', value)}
          step={Number(s('step'))}
          min={Number(s('min'))}
          max={Number(s('max'))}
          disabled={disabled}
        />
      )
    case 'mentions':
      return stack(
        <UI.Mentions
          value={state.text}
          onValueChange={(value) => set('text', value)}
          options={options}
          disabled={disabled}
          trigger={s('trigger')}
          loadOptions={
            b('async')
              ? async (query, signal) => {
                  await wait(250, signal)
                  return options.filter((option: any) =>
                    option.label.toLowerCase().includes(query.toLowerCase()),
                  )
                }
              : undefined
          }
        />,
      )
    case 'radio':
      return s('style') === 'buttons' ? (
        <UI.RadioButtons
          options={options}
          value={state.value}
          onValueChange={(value) => set('value', value)}
          disabled={disabled}
        />
      ) : (
        <UI.Radio
          value={state.value}
          onValueChange={(value) => set('value', value)}
          disabled={disabled}
        >
          {options.map((option: any) => (
            <label key={option.value} className="flex items-center gap-2 text-sm">
              <UI.RadioItem value={option.value} />
              {option.label}
            </label>
          ))}
        </UI.Radio>
      )
    case 'rate':
      return (
        <UI.Rate
          value={state.number}
          onValueChange={(value) => set('number', value)}
          count={count}
          allowHalf={b('allowHalf')}
          allowClear={b('allowClear')}
          disabled={disabled}
          character={
            s('character') === 'heart'
              ? '♥'
              : s('character') === 'number'
                ? (index) => index + 1
                : undefined
          }
        />
      )
    case 'select':
      return stack(
        <UI.Combobox
          creatable={b('creatable')}
          renderOption={(option) => <span>{option.label}</span>}
          multiple={b('multiple')}
          disabled={disabled}
          value={state.keys}
          onValueChange={(value) => set('keys', value)}
          options={Array.from({ length: count }, (_, index) => ({
            value: String(index),
            label: `Option ${index + 1}`,
            description: b('descriptions') ? `A useful choice, number ${index + 1}` : undefined,
          }))}
          loadOptions={
            b('async')
              ? async (query, signal) => {
                  await wait(300, signal)
                  return frameworkOptions.filter((option) =>
                    option.label.toLowerCase().includes(query.toLowerCase()),
                  )
                }
              : undefined
          }
        />,
      )
    case 'slider':
      return (
        <div className={b('vertical') ? 'mx-auto h-64' : 'w-full max-w-xl py-8'}>
          <UI.Slider
            value={b('range') ? (state.slider ?? [state.number, 80]) : [state.number]}
            onValueChange={(value) => (b('range') ? set('slider', value) : set('number', value[0]))}
            step={n('step')}
            orientation={b('vertical') ? 'vertical' : 'horizontal'}
            disabled={disabled}
            tooltip={b('tooltip')}
            marks={
              b('marks') ? { 0: 'Start', 25: '25%', 50: '50%', 75: '75%', 100: 'Done' } : undefined
            }
            aria-label="Preview slider"
          />
        </div>
      )
    case 'switch':
      return (
        <UI.Switch
          checked={state.checked}
          onCheckedChange={(value) => set('checked', value)}
          disabled={disabled}
          checkedLabel={s('checkedLabel')}
          uncheckedLabel={s('uncheckedLabel')}
          size={s('size') as any}
          aria-label="Preview switch"
        />
      )
    case 'time-picker':
      return b('range') ? (
        <UI.TimeRangePicker
          value={state.timeRange ?? [s('value'), '18:00:00']}
          onValueChange={(value) => set('timeRange', value)}
          seconds={b('seconds')}
          use12Hours={b('use12Hours')}
          minuteStep={n('step')}
          min={s('min')}
          max={s('max')}
          disabled={disabled}
          panel
        />
      ) : (
        <UI.TimePicker
          value={state.text}
          onValueChange={(value) => set('text', value)}
          seconds={b('seconds')}
          use12Hours={b('use12Hours')}
          minuteStep={n('step')}
          min={s('min')}
          max={s('max')}
          disabled={disabled}
          panel
        />
      )
    case 'transfer':
      return (
        <UI.Transfer
          items={Array.from({ length: count }, (_, index) => ({
            key: String(index),
            label: 'Item ' + (index + 1),
          }))}
          value={state.keys}
          onValueChange={(value) => set('keys', value)}
          pageSize={b('pagination') ? n('pageSize') : undefined}
          disabled={disabled}
          draggable={b('draggable')}
          filterOption={
            b('customFilter')
              ? (query, item) => item.label.toLowerCase().startsWith(query.toLowerCase())
              : undefined
          }
        />
      )
    case 'tree-select':
      return <TreePreview {...{ id, config: v, onEvent }} />
    case 'upload': {
      const Upload = b('crop') ? UI.ImageCropUpload : UI.Upload
      return stack(
        <Upload
          accept={s('accept')}
          maxCount={n('maxCount')}
          maxSize={n('maxSize') * 1024 * 1024}
          showThumbnails={b('thumbnails')}
          disabled={disabled}
          paste={b('paste')}
          fileList={state.files ?? []}
          onFileListChange={(files) => set('files', files)}
          onFilesChange={(files) =>
            emit(
              'files',
              files.map((file) => ({ name: file.name, size: file.size })),
            )
          }
          customRequest={
            b('request')
              ? async (file, signal, onProgress) => {
                  for (let value = 10; value <= 100; value += 15) {
                    await wait(100, signal)
                    onProgress(value)
                  }
                  if (b('failure')) throw new Error('Demonstration request rejected')
                  emit('uploaded', file.name)
                }
              : undefined
          }
        />,
      )
    }
    case 'avatar': {
      const avatars = Array.from({ length: b('group') ? count : 1 }, (_, index) => (
        <UI.Avatar key={index} style={{ width: n('size'), height: n('size') }}>
          {b('image') && <UI.AvatarImage src="/landscape.svg" alt="Landscape" />}
          <UI.AvatarFallback>{index === 0 ? s('initials') : 'U' + (index + 1)}</UI.AvatarFallback>
        </UI.Avatar>
      ))
      return b('group') ? <UI.AvatarGroup max={n('max')}>{avatars}</UI.AvatarGroup> : avatars[0]
    }
    case 'badge':
      return s('mode') === 'ribbon' ? (
        <UI.Ribbon text={s('label')}>
          <UI.Card className="w-64">
            <UI.CardContent className="p-8 text-sm">A workspace worth sharing.</UI.CardContent>
          </UI.Card>
        </UI.Ribbon>
      ) : s('mode') === 'status' ? (
        <UI.StatusBadge status={s('status') as any}>{s('label')}</UI.StatusBadge>
      ) : (
        <UI.CountBadge
          count={count}
          max={n('max')}
          dot={s('mode') === 'dot'}
          showZero={b('showZero')}
        >
          <UI.Button variant="outline">
            <Bell />
            {s('label')}
          </UI.Button>
        </UI.CountBadge>
      )
    case 'calendar':
      return (
        <UI.EventCalendar
          mode={s('mode') as any}
          value={state.date}
          onValueChange={(value) => set('date', value)}
          events={
            b('events')
              ? [
                  { id: 'review', date: new Date('2026-10-24T12:00:00'), title: 'Design review' },
                  { id: 'launch', date: new Date('2026-10-28T12:00:00'), title: 'Launch day' },
                ]
              : []
          }
        />
      )
    case 'card':
      return (
        <UI.Card className="w-full max-w-sm overflow-hidden">
          {b('cover') && (
            <img src="/landscape.svg" alt="Quiet hills" className="h-32 w-full object-cover" />
          )}
          <UI.CardHeader>
            <UI.CardTitle>{s('title')}</UI.CardTitle>
            <UI.CardDescription>{s('description')}</UI.CardDescription>
          </UI.CardHeader>
          <UI.CardContent>
            {b('loading') ? (
              <UI.Skeleton className="h-20 w-full" />
            ) : b('grid') ? (
              <UI.Grid minWidth={60}>{boxes.slice(0, 3)}</UI.Grid>
            ) : b('meta') ? (
              <UI.Descriptions
                columns={2}
                items={[
                  { key: 'owner', label: 'Owner', children: 'Sarah Kim' },
                  {
                    key: 'status',
                    label: 'Status',
                    children: <UI.Tag color="green">Active</UI.Tag>,
                  },
                ]}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                A flexible space for meaningful content.
              </p>
            )}
          </UI.CardContent>
          {b('actions') && (
            <UI.CardFooter>
              <UI.Button onClick={() => emit('action', 'open')}>
                Open workspace
                <ArrowRight />
              </UI.Button>
            </UI.CardFooter>
          )}
        </UI.Card>
      )
    case 'card-plus':
      return (
        <UI.CardPlus
          className="w-full max-w-xl"
          title={s('title')}
          description={s('description')}
          collapsible={b('collapsible')}
          defaultCollapsed={b('collapsed')}
          checked={state.checked}
          onCheckedChange={b('checkable') ? (value) => set('checked', value) : undefined}
          loading={b('loading')}
          tabs={
            b('tabs')
              ? state.tabs
                  .slice(0, 3)
                  .map((tab: any) => ({ key: tab.value, label: tab.label, children: tab.content }))
              : undefined
          }
        >
          <UI.Statistic title="Revenue" value={24680} prefix="$" trend={12.8} />
        </UI.CardPlus>
      )
    case 'carousel':
      return (
        <div className="mx-auto w-full max-w-xs">
          <UI.Carousel
            autoplay={b('autoplay')}
            interval={n('interval')}
            dots={b('dots')}
            orientation={b('vertical') ? 'vertical' : 'horizontal'}
            opts={{ loop: b('loop') }}
          >
            <UI.CarouselContent className={b('vertical') ? 'h-56' : ''}>
              {Array.from({ length: count }, (_, index) => (
                <UI.CarouselItem key={index}>
                  <div className="grid h-48 place-items-center rounded-xl bg-primary/10 text-5xl font-semibold text-primary">
                    {index + 1}
                  </div>
                </UI.CarouselItem>
              ))}
            </UI.CarouselContent>
            <UI.CarouselPrevious />
            <UI.CarouselNext />
          </UI.Carousel>
        </div>
      )
    case 'collapse':
      return stack(
        <UI.Collapse
          variant={s('variant') as any}
          type={b('multiple') ? 'multiple' : 'single'}
          collapsible
        >
          {Array.from({ length: count }, (_, index) => (
            <UI.CollapseItem
              key={index}
              value={String(index)}
              disabled={disabled && index === count - 1}
            >
              <UI.CollapseTrigger>Question {index + 1}</UI.CollapseTrigger>
              <UI.CollapseContent>
                Explore the details, at your own pace. This panel can contain any React content.
              </UI.CollapseContent>
            </UI.CollapseItem>
          ))}
        </UI.Collapse>,
      )
    case 'descriptions':
      return stack(
        <UI.Descriptions
          layout={s('layout') as any}
          title={s('title')}
          columns={n('columns')}
          bordered={b('bordered')}
          items={[
            { key: 'name', label: 'Name', children: 'Sarah Kim' },
            { key: 'team', label: 'Team', children: 'Design' },
            { key: 'email', label: 'Email', children: 'sarah@example.com' },
            { key: 'status', label: 'Status', children: <UI.Tag color="green">Active</UI.Tag> },
          ]}
        />,
      )
    case 'descriptions-plus':
      return stack(
        <UI.DescriptionsPlus
          title={s('title')}
          record={b('remote') ? undefined : state.record}
          request={
            b('remote')
              ? async (signal) => {
                  await wait(300, signal)
                  emit('request', 'record')
                  return state.record
                }
              : undefined
          }
          columns={n('columns')}
          fields={[
            {
              key: 'name',
              label: 'Name',
              validate: b('validate')
                ? (value) =>
                    String(value).length < 3 ? 'Use at least three characters' : undefined
                : undefined,
            },
            { key: 'email', label: 'Email' },
            { key: 'role', label: 'Role' },
            { key: 'active', label: 'Active', type: 'switch' },
          ]}
          onSave={async (record) => {
            await save(record)
            set('record', record)
          }}
          onFieldSave={
            b('perField')
              ? async (key, value, record, signal) => {
                  await wait(300, signal)
                  if (b('failure')) throw new Error('The demonstration save was rejected')
                  set('record', record)
                  emit('field-save', { key, value })
                }
              : undefined
          }
        />,
      )
    case 'empty':
      return (
        <UI.Empty
          title={s('title')}
          description={s('description')}
          icon={
            s('illustration') === 'search' ? (
              <Search />
            ) : s('illustration') === 'folder' ? (
              <Folder />
            ) : undefined
          }
        >
          {b('action') && (
            <UI.Button onClick={() => emit('action', 'create')}>
              <Plus />
              Create something
            </UI.Button>
          )}
        </UI.Empty>
      )
    case 'image':
      return stack(
        b('gallery') ? (
          <UI.ImageGallery
            preview={b('preview')}
            downloadable={b('download')}
            images={[
              {
                src: b('error') ? '/unavailable-preview-image.jpg' : '/landscape.svg',
                alt: 'Quiet green hills',
              },
              { src: '/landscape-blue.svg', alt: 'A blue mountain morning' },
              { src: '/landscape-desert.svg', alt: 'Sunlight over the dunes' },
            ]}
          />
        ) : (
          <UI.Image
            src={b('error') ? '/unavailable-preview-image.jpg' : '/landscape.svg'}
            alt="An illustrated landscape"
            preview={b('preview')}
            downloadable={b('download')}
          />
        ),
      )
    case 'list':
      return <ListPreview {...{ id, config: v, onEvent }} />
    case 'list-plus':
      return <ListPreview {...{ id, config: v, onEvent }} />
    case 'popover':
      return (
        <UI.Popover modal={b('modal')}>
          <UI.PopoverTrigger asChild>
            <UI.Button variant="outline">Open details</UI.Button>
          </UI.PopoverTrigger>
          <UI.PopoverContent side={s('side') as any}>
            <h3 className="font-medium">{s('title')}</h3>
            <p className="my-3 text-sm text-muted-foreground">{s('description')}</p>
            {b('nested') && (
              <UI.Dialog>
                <UI.DialogTrigger asChild>
                  <UI.Button size="sm">Open nested dialog</UI.Button>
                </UI.DialogTrigger>
                <UI.DialogContent>
                  <UI.DialogTitle>One more detail</UI.DialogTitle>
                  <UI.DialogDescription>
                    Focus and keyboard dismissal remain available.
                  </UI.DialogDescription>
                </UI.DialogContent>
              </UI.Dialog>
            )}
          </UI.PopoverContent>
        </UI.Popover>
      )
    case 'qr-code':
      return (
        <UI.QRCode
          value={s('value')}
          size={n('size')}
          level={s('level') as any}
          status={s('status') as any}
          downloadable
          downloadFormat={s('format') as any}
          icon={
            b('icon')
              ? 'data:image/svg+xml,' +
                encodeURIComponent(
                  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" rx="6" fill="#e66043"/><path d="M10 8h13v4h-9v3h7v4h-7v3h9v4H10z" fill="white"/></svg>',
                )
              : undefined
          }
          onRefresh={() => emit('refresh', 'requested')}
        />
      )
    case 'segmented':
      return (
        <UI.Segmented
          vertical={b('vertical')}
          disabled={disabled}
          options={options}
          value={state.value}
          onValueChange={(value) => set('value', value)}
        />
      )
    case 'statistic':
      return b('countdown') ? (
        <UI.Countdown
          target={state.deadline}
          title={s('title')}
          onFinish={() => emit('finish', 'countdown')}
        />
      ) : (
        <UI.Statistic
          title={s('title')}
          value={n('value')}
          prefix={s('prefix')}
          suffix={s('suffix')}
          precision={n('precision')}
          trend={n('trend')}
          animated={b('animated')}
        />
      )
    case 'table':
    case 'table-plus':
    case 'editable-table-plus':
      return <AdvancedDataPreview {...{ id, config: v, onEvent }} />
    case 'tag':
      return (
        <div className="flex gap-3">
          <UI.Tag
            color={s('color') as any}
            selected={state.checked}
            onSelectedChange={b('selectable') ? (value) => set('checked', value) : undefined}
            onClose={b('closable') ? () => emit('close', s('label')) : undefined}
          >
            {b('iconOnly') ? <Star size={13} /> : s('label')}
          </UI.Tag>
        </div>
      )
    case 'timeline':
      return stack(
        <UI.Timeline
          layout={s('layout') as any}
          reverse={b('reverse')}
          items={Array.from({ length: count }, (_, index) => ({
            key: String(index),
            title: `Milestone ${index + 1}`,
            description: 'A meaningful step forward.',
            time: b('timestamps') ? `${9 + index}:00` : undefined,
            status: index < count - 1 ? 'complete' : 'active',
          }))}
        />,
      )
    case 'tooltip':
      return (
        <UI.TooltipProvider delayDuration={n('delay')}>
          <UI.Tooltip>
            <UI.TooltipTrigger touch={b('touch')} asChild>
              <UI.Button variant="outline">Hover or focus here</UI.Button>
            </UI.TooltipTrigger>
            <UI.TooltipContent side={s('side') as any}>{s('content')}</UI.TooltipContent>
          </UI.Tooltip>
        </UI.TooltipProvider>
      )
    case 'tour':
      return stack(
        <>
          <UI.Card id={`${prefix}-tour-card-${state.tourPage ?? 'overview'}`}>
            <UI.CardHeader>
              <UI.CardTitle>A guided workspace · {state.tourPage ?? 'overview'}</UI.CardTitle>
              <UI.CardDescription>Discover the next useful detail.</UI.CardDescription>
            </UI.CardHeader>
            <UI.CardFooter>
              <UI.Button id={`${prefix}-tour-start`} onClick={() => set('open', true)}>
                Show me around
              </UI.Button>
            </UI.CardFooter>
          </UI.Card>
          <UI.Tour
            open={state.open}
            onOpenChange={(value) => set('open', value)}
            onFinish={() => emit('finish', 'tour')}
            steps={Array.from({ length: n('steps') }, (_, index) => ({
              title: `Step ${index + 1}`,
              description: 'This is a useful part of your workspace.',
              beforeEnter: b('crossRoute')
                ? async (signal: AbortSignal) => {
                    await wait(120, signal)
                    const page = index % 2 ? 'details' : 'overview'
                    setState((previous) => ({ ...previous, tourPage: page }))
                    emit('navigate', { path: '/workspace/' + page })
                  }
                : undefined,
              target: b('targets')
                ? b('crossRoute')
                  ? `#${prefix}-tour-card-${index % 2 ? 'details' : 'overview'}`
                  : `#${prefix}-${index % 2 ? 'tour-start' : 'tour-card-' + (state.tourPage ?? 'overview')}`
                : undefined,
              placement: s('placement') as any,
            }))}
          />
        </>,
      )
    case 'tree':
      return <TreePreview {...{ id, config: v, onEvent }} />
    case 'alert':
      return stack(
        <UI.Alert
          banner={b('banner')}
          messages={
            b('rolling')
              ? [
                  s('description'),
                  'Your workspace stays up to date.',
                  'Everything you need, within reach.',
                ]
              : undefined
          }
          title={s('title')}
          variant={s('variant') as any}
          closable={b('closable')}
        >
          {s('description')}
        </UI.Alert>,
      )
    case 'drawer':
      return <FeedbackPreview {...{ id, config: v, onEvent }} />
    case 'message':
      return <FeedbackPreview {...{ id, config: v, onEvent }} />
    case 'modal':
      return <FeedbackPreview {...{ id, config: v, onEvent }} />
    case 'notification':
      return <FeedbackPreview {...{ id, config: v, onEvent }} />
    case 'popconfirm':
      return (
        <UI.Popconfirm
          title={s('title')}
          description={s('description')}
          destructive={b('destructive')}
          side={s('side') as any}
          onConfirm={async () => {
            if (b('async')) await wait(900)
            emit('confirm', 'accepted')
          }}
        >
          <UI.Button variant={b('destructive') ? 'destructive' : 'outline'}>
            Confirm action
          </UI.Button>
        </UI.Popconfirm>
      )
    case 'progress':
      return stack(
        <>
          {s('type') === 'circle' || s('type') === 'dashboard' ? (
            <UI.ProgressCircle
              value={n('value')}
              dashboard={s('type') === 'dashboard'}
              successPercent={n('success')}
              status={
                s('status') === 'success' ? 'success' : s('status') === 'error' ? 'error' : 'normal'
              }
            />
          ) : s('type') === 'steps' ? (
            <UI.ProgressSteps value={n('value')} steps={n('steps')} />
          ) : (
            <UI.Progress
              value={n('value')}
              successPercent={n('success')}
              status={s('status') as any}
            />
          )}
        </>,
      )
    case 'result':
      return (
        <UI.Result title={s('title')} description={s('description')} status={s('status') as any}>
          {b('action') && (
            <UI.Button onClick={() => emit('action', 'continue')}>Continue</UI.Button>
          )}
        </UI.Result>
      )
    case 'skeleton':
      return stack(
        <UI.Skeleton
          className={s('type') === 'card' ? 'w-full' : ''}
          type={s('type') as any}
          rows={n('rows')}
          animated={b('animated')}
          animation={s('animation') as 'wave' | 'pulse'}
        />,
      )
    case 'skeleton-plus':
      return stack(
        <UI.SkeletonPlus
          type={s('type') as any}
          rows={n('rows')}
          animated={b('animated')}
          animation={s('animation') as 'wave' | 'pulse'}
        />,
      )
    case 'spin':
      return stack(
        <>
          <UI.Button
            variant="outline"
            aria-pressed={state.checked}
            onClick={() => set('checked', !state.checked)}
          >
            Toggle loading
          </UI.Button>
          <UI.Spin
            delay={n('delay')}
            minimumDuration={n('minimum')}
            spinning={state.checked}
            label={s('label')}
          >
            <UI.Card>
              <UI.CardContent className="p-8">
                Your content remains in place while loading.
              </UI.CardContent>
            </UI.Card>
          </UI.Spin>
        </>,
      )
    case 'watermark':
      return (
        <UI.Watermark
          opacity={n('opacity') / 100}
          protect={b('protect')}
          image={b('image') ? '/favicon.svg' : undefined}
          text={s('text')}
          className="w-full rounded-xl border"
        >
          <div className="p-10">
            <h3 className="font-medium">A private workspace.</h3>
            <p className="mt-4 text-sm text-muted-foreground">
              A repeating signature sits above content without blocking interactions.
            </p>
            <UI.Button
              variant="outline"
              className="mt-5"
              onClick={() => emit('click', 'watermarked content')}
            >
              Still interactive
            </UI.Button>
          </div>
        </UI.Watermark>
      )
    case 'affix':
      return (
        <div
          ref={scroll}
          tabIndex={0}
          aria-label="Affix scroll container"
          className="h-72 w-full overflow-auto rounded-xl border p-4"
        >
          {b('bottom') && (
            <div className="h-96 p-3 text-xs text-muted-foreground">
              Scroll to see the bottom action.
            </div>
          )}
          <UI.Affix
            target={b('target') ? scrollTarget : undefined}
            offsetTop={n('offset')}
            offsetBottom={b('bottom') ? n('offset') : undefined}
            onAffixChange={(value) => emit('affixed', value)}
          >
            <div className="rounded-lg border bg-background p-3 text-sm shadow-sm">
              Important actions stay within reach.
            </div>
          </UI.Affix>
          {Array.from({ length: 12 }, (_, index) => (
            <p className="mt-8 text-sm text-muted-foreground" key={index}>
              Workspace section {index + 1}
            </p>
          ))}
        </div>
      )
    case 'app':
      return <FeedbackPreview {...{ id, config: v, onEvent }} />
    case 'border-beam':
      return (
        <UI.BorderBeam
          duration={n('duration')}
          beamColor={s('beamColor')}
          borderWidth={n('width')}
          className="w-full max-w-sm"
        >
          <h3 className="font-semibold">{s('title')}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{s('description')}</p>
        </UI.BorderBeam>
      )
    case 'config-provider':
      return stack(
        <UI.ConfigProvider
          accent={s('accent')}
          radius={n('radius')}
          locale={s('locale')}
          className="space-y-4 rounded-xl border p-6"
        >
          <UI.Button onClick={() => emit('click', 'themed')}>Your design language</UI.Button>
          <UI.Statistic title="Localized number" value={123456.78} precision={2} />
          <UI.DatePicker value={state.date} onValueChange={(value) => set('date', value)} />
          {b('portal') && (
            <UI.Popover>
              <UI.PopoverTrigger asChild>
                <UI.Button variant="outline">Scoped overlay</UI.Button>
              </UI.PopoverTrigger>
              <UI.PopoverContent>
                <UI.Button>Matching accent</UI.Button>
              </UI.PopoverContent>
            </UI.Popover>
          )}
        </UI.ConfigProvider>,
      )
    case 'util':
      return stack(
        <>
          <UI.Input
            value={state.text}
            onValueChange={(value) => set('text', value)}
            placeholder="Type to debounce…"
          />
          <div className="rounded-lg border p-4 text-xs">
            <p>
              Debounced value: <code>{debounced || '—'}</code>
            </p>
            {b('breakpoints') && (
              <pre className="mt-3 overflow-auto">{JSON.stringify(points, null, 2)}</pre>
            )}
          </div>
        </>,
      )
    default:
      throw new Error(`No playground preview for ${id}`)
  }
}
