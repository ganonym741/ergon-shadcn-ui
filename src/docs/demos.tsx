import * as React from 'react'
import {
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Bell,
  ChevronDown,
  Copy,
  Download,
  Home,
  LayoutDashboard,
  Layers,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Users,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import type { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress, ProgressCircle, ProgressSteps } from '@/components/ui/progress'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Typography } from '@/components/ui/typography'
import { FloatButton } from '@/components/ui/float-button'
import { Flex } from '@/components/ui/flex'
import { Grid } from '@/components/ui/grid'
import {
  Layout,
  LayoutHeader,
  LayoutSider,
  LayoutContent,
  LayoutFooter,
} from '@/components/ui/layout'
import { Masonry } from '@/components/ui/masonry'
import { Space } from '@/components/ui/space'
import { Anchor } from '@/components/ui/anchor'
import { Menu } from '@/components/ui/menu'
import { Steps } from '@/components/ui/steps'
import { AutoComplete } from '@/components/ui/auto-complete'
import { Cascader } from '@/components/ui/cascader'
import { ColorPicker, GradientPicker } from '@/components/ui/color-picker'
import {
  DatePicker,
  DateRangePicker,
  DateTimePicker,
  MultiDatePicker,
  MonthPicker,
  WeekPicker,
  YearPicker,
  QuarterPicker,
} from '@/components/ui/date-picker'
import { InputNumber } from '@/components/ui/input-number'
import { Mentions } from '@/components/ui/mentions'
import { Rate } from '@/components/ui/rate'
import { Combobox } from '@/components/ui/combobox'
import { TimePicker } from '@/components/ui/time-picker'
import { Transfer } from '@/components/ui/transfer'
import { TreeSelect } from '@/components/ui/tree-select'
import { Upload } from '@/components/ui/upload'
import { Descriptions } from '@/components/ui/descriptions'
import { Empty } from '@/components/ui/empty'
import { Image, ImageGallery } from '@/components/ui/image'
import { EventCalendar } from '@/components/ui/event-calendar'
import { List } from '@/components/ui/list'
import { QRCode } from '@/components/ui/qr-code'
import { Segmented } from '@/components/ui/segmented'
import { Statistic } from '@/components/ui/statistic'
import { DataTable } from '@/components/ui/data-table'
import { Tag } from '@/components/ui/tag'
import { Timeline } from '@/components/ui/timeline'
import { Tour } from '@/components/ui/tour'
import { Tree } from '@/components/ui/tree'
import { Alert } from '@/components/ui/alert'
import { Popconfirm } from '@/components/ui/popconfirm'
import { Result } from '@/components/ui/result'
import { Spin } from '@/components/ui/spin'
import { Watermark } from '@/components/ui/watermark'
import { Affix } from '@/components/ui/affix'
import { BorderBeam } from '@/components/ui/border-beam'
import { ConfigProvider } from '@/components/ui/config-provider'
import { useControllableState, useMediaQuery } from '@/components/ui/util'
import { LayoutPlus } from '@/components/ui/layout-plus'
import { FormPlus, FormPlusList, type FormPlusField } from '@/components/ui/form-plus'
import { TablePlus, type TablePlusParams } from '@/components/ui/table-plus'
import { DescriptionsPlus } from '@/components/ui/descriptions-plus'
import { ListPlus } from '@/components/ui/list-plus'
import { EditableTablePlus } from '@/components/ui/editable-table-plus'
import { CardPlus } from '@/components/ui/card-plus'
import { FieldPlus } from '@/components/ui/field-plus'
import { SkeletonPlus } from '@/components/ui/skeleton-plus'
import { CheckCardPlus } from '@/components/ui/check-card-plus'
import { makeProjects, projectColumns, treeData, frameworkOptions, type Project } from './demo-data'

const Stack = ({ children }: { children: React.ReactNode }) => (
  <div className="demo-stack">{children}</div>
)
const Hint = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>
)
const onDemoClick = () =>
  toast.success('You’re all set.', { description: 'This is a live component preview.' })
function TableDemo({ enhanced, editable }: { enhanced?: boolean; editable?: boolean }) {
  const [data, setData] = React.useState(() => makeProjects(editable ? 4 : 64))
  const [virtual, setVirtual] = React.useState(false)
  const [remote, setRemote] = React.useState(false)
  const [compact, setCompact] = React.useState(false)
  const request = React.useCallback(async (params: TablePlusParams, signal: AbortSignal) => {
    await new Promise<void>((resolve, reject) => {
      const id = setTimeout(resolve, 350)
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(id)
          reject(new DOMException('Aborted', 'AbortError'))
        },
        { once: true },
      )
    })
    let rows = makeProjects(1000).filter((row) =>
      Object.values(row).some((v) =>
        String(v).toLowerCase().includes(params.keyword.toLowerCase()),
      ),
    )
    for (const filter of params.filters)
      rows = rows.filter((row) =>
        String(row[filter.id as keyof Project])
          .toLowerCase()
          .includes(String(filter.value).toLowerCase()),
      )
    if (params.sorting.length)
      rows.sort((a, b) => {
        for (const sort of params.sorting) {
          const x = a[sort.id as keyof Project],
            y = b[sort.id as keyof Project]
          const result =
            typeof x === 'number' && typeof y === 'number'
              ? x - y
              : String(x).localeCompare(String(y))
          if (result) return sort.desc ? -result : result
        }
        return 0
      })
    return {
      data: rows.slice((params.page - 1) * params.pageSize, params.page * params.pageSize),
      total: rows.length,
    }
  }, [])
  const columns = React.useMemo(
    () =>
      projectColumns.map((c) =>
        'accessorKey' in c && c.accessorKey === 'status'
          ? {
              ...c,
              cell: ({ getValue }: any) => (
                <Tag
                  color={
                    getValue() === 'Completed'
                      ? 'green'
                      : getValue() === 'Planning'
                        ? 'purple'
                        : 'coral'
                  }
                >
                  {getValue()}
                </Tag>
              ),
            }
          : c,
      ),
    [],
  )
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-5 text-xs">
        <label className="flex items-center gap-2">
          <Switch
            checked={virtual}
            onCheckedChange={(v) => {
              setVirtual(v)
              setRemote(false)
              setData(makeProjects(v ? 100000 : 64))
            }}
          />
          100,000 rows · virtual scroll
        </label>
        <label className="flex items-center gap-2">
          <Switch checked={compact} onCheckedChange={setCompact} />
          Compact density
        </label>
        {enhanced && (
          <label className="flex items-center gap-2">
            <Switch
              checked={remote}
              onCheckedChange={(v) => {
                setRemote(v)
                setVirtual(false)
              }}
            />
            Simulated server request
          </label>
        )}
      </div>
      {editable ? (
        <EditableTablePlus
          value={data}
          onValueChange={setData}
          columns={columns}
          getRowId={(r) => r.id}
          reorderable={!virtual}
          virtual={virtual}
          pagination={!virtual}
          density={compact ? 'compact' : 'comfortable'}
          summary={(rows) => (
            <span className="text-xs text-muted-foreground">
              Total budget:{' '}
              <strong className="ml-1 text-foreground">
                ${rows.reduce((total, r) => total + r.budget, 0).toLocaleString()}
              </strong>
            </span>
          )}
          createRecord={() => ({
            id: crypto.randomUUID().slice(0, 8),
            name: 'New project',
            owner: 'You',
            status: 'Planning',
            budget: 0,
            created: '2026-10-31',
          })}
        />
      ) : enhanced ? (
        <TablePlus
          key={remote ? 'remote' : virtual ? 'virtual' : 'local'}
          title="Projects"
          description="An illustrative project workspace."
          data={data}
          request={remote ? request : undefined}
          columns={columns}
          getRowId={(r) => r.id}
          virtual={virtual}
          pagination={!virtual}
          density={compact ? 'compact' : 'comfortable'}
          onDataChange={remote ? undefined : setData}
          reorderable={!remote && !virtual}
          storageKey="ergon-demo-table-plus-view"
          onCreate={
            remote
              ? undefined
              : () => {
                  setData((d) => [
                    {
                      id: `PRJ-${Date.now()}`,
                      name: 'Untitled project',
                      owner: 'You',
                      status: 'Planning',
                      budget: 0,
                      created: '2026-10-31',
                    },
                    ...d,
                  ])
                  toast.success('Project added')
                }
          }
        />
      ) : (
        <DataTable
          key={virtual ? 'virtual' : 'local'}
          data={data}
          columns={columns}
          getRowId={(r) => r.id}
          onDataChange={setData}
          reorderable={!virtual}
          storageKey="ergon-demo-table-view"
          virtual={virtual}
          pagination={!virtual}
          density={compact ? 'compact' : 'comfortable'}
        />
      )}
      <Hint>
        Shift-click headers for multiple sort criteria. Use Columns to filter, group, reorder, or
        pin. Drag header edges to resize. All records in this preview are sample data.
      </Hint>
    </div>
  )
}
const formFields: FormPlusField[] = [
  {
    name: 'name',
    label: 'Project name',
    required: true,
    placeholder: 'Your next big idea',
    colSpan: 2,
    rules: { minLength: { value: 3, message: 'Use at least 3 characters' } },
  },
  {
    name: 'email',
    label: 'Contact email',
    required: true,
    placeholder: 'you@company.com',
    rules: {
      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
    },
  },
  {
    name: 'framework',
    label: 'Framework',
    type: 'select',
    options: frameworkOptions,
    required: true,
  },
  {
    name: 'budget',
    label: 'Monthly budget',
    type: 'money',
    rules: { min: { value: 0, message: 'Budget cannot be negative' } },
  },
  { name: 'notifications', label: 'Email updates', type: 'switch' },
  {
    name: 'description',
    label: 'A little more context',
    type: 'textarea',
    placeholder: 'What are you building?',
    colSpan: 2,
  },
]
function FormDemo({ enhanced = false }: { enhanced?: boolean }) {
  const [mode, setMode] = React.useState('standard')
  const [open, setOpen] = React.useState(false)
  const submit = async (values: Record<string, any>) => {
    await new Promise((r) => setTimeout(r, 400))
    toast.success('Project saved', { description: values.name })
    setOpen(false)
  }
  const form = (
    <FormPlus
      fields={formFields.map((f, i) => ({ ...f, step: i < 3 ? 0 : 1 }))}
      defaultValues={{
        name: '',
        email: '',
        framework: 'react',
        budget: 2500,
        notifications: true,
        description: '',
        members: [],
      }}
      columns={2}
      onSubmit={submit}
      steps={mode === 'steps' ? ['Project details', 'Preferences'] : undefined}
    >
      {enhanced && (
        <FormPlusList
          name="members"
          label="Team members"
          fields={[{ name: 'email', placeholder: 'Member email' }]}
          defaultItem={{ email: '' }}
        />
      )}
    </FormPlus>
  )
  return (
    <Stack>
      {enhanced && (
        <Segmented
          label="Form mode"
          value={mode}
          onValueChange={setMode}
          options={['standard', 'steps', 'modal', 'drawer'].map((value) => ({
            value,
            label: value[0].toUpperCase() + value.slice(1),
          }))}
        />
      )}
      <Card>
        <CardHeader>
          <CardTitle>Create a project</CardTitle>
          <CardDescription>Make room for your next great idea.</CardDescription>
        </CardHeader>
        <CardContent>
          {['modal', 'drawer'].includes(mode) ? (
            <>
              <Button onClick={() => setOpen(true)}>
                Create a project
                <ArrowRight />
              </Button>
              {mode === 'modal' ? (
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Create a project</DialogTitle>
                      <DialogDescription>A few details to get started.</DialogDescription>
                    </DialogHeader>
                    {form}
                  </DialogContent>
                </Dialog>
              ) : (
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetContent className="overflow-auto p-6 sm:max-w-xl">
                    <SheetHeader className="p-0 pb-5">
                      <SheetTitle>Create a project</SheetTitle>
                      <SheetDescription>A few details to get started.</SheetDescription>
                    </SheetHeader>
                    {form}
                  </SheetContent>
                </Sheet>
              )}
            </>
          ) : (
            form
          )}
        </CardContent>
      </Card>
    </Stack>
  )
}
function PaginationDemo() {
  const [page, setPage] = React.useState(2)
  return (
    <Stack>
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        {[1, 2, 3, 4, 5].map((n) => (
          <Button
            key={n}
            variant={page === n ? 'default' : 'outline'}
            size="icon-sm"
            aria-label={`Page ${n}`}
            aria-current={page === n ? 'page' : undefined}
            onClick={() => setPage(n)}
          >
            {n}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          disabled={page === 5}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
      <Hint>
        Showing page {page} of 5. Pagination primitives support links and custom navigation.
      </Hint>
    </Stack>
  )
}
function LayoutDemo() {
  const [value, setValue] = React.useState('overview')
  return (
    <LayoutPlus
      logo={
        <>
          <span className="mr-2 text-primary">◒</span>Acme workspace
        </>
      }
      items={[
        { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} /> },
        { key: 'projects', label: 'Projects', icon: <Layers size={15} /> },
        { key: 'team', label: 'Team', icon: <Users size={15} /> },
        { key: 'settings', label: 'Settings', icon: <Settings size={15} /> },
      ]}
      value={value}
      onNavigate={setValue}
      title={value[0].toUpperCase() + value.slice(1)}
      breadcrumb={['Workspace', value]}
      actions={
        <Avatar className="size-7">
          <AvatarFallback className="text-[10px]">SK</AvatarFallback>
        </Avatar>
      }
      footer="Acme Inc. · Free plan"
    >
      {value === 'overview' ? (
        <Grid minWidth={140}>
          <CardPlus title="Revenue">
            <Statistic title="This month" value={24680} prefix="$" trend={12.8} />
          </CardPlus>
          <CardPlus title="Customers">
            <Statistic title="Active accounts" value={1280} trend={8.2} />
          </CardPlus>
        </Grid>
      ) : value === 'projects' ? (
        <List
          items={makeProjects(3)}
          getKey={(r) => r.id}
          renderItem={(r) => <span className="text-sm">{r.name}</span>}
        />
      ) : value === 'team' ? (
        <div className="flex gap-3">
          {['Sarah Kim', 'Alex Morgan', 'Nina Patel'].map((n) => (
            <div key={n} className="rounded-lg border p-4 text-sm">
              {n}
            </div>
          ))}
        </div>
      ) : (
        <label className="flex items-center gap-3 text-sm">
          <Switch defaultChecked />
          Workspace notifications
        </label>
      )}
    </LayoutPlus>
  )
}
function UtilDemo() {
  const [value, setValue] = useControllableState({ defaultValue: 0 })
  const wide = useMediaQuery('(min-width:768px)')
  return (
    <Stack>
      <Alert title="Small utilities, shared conventions">
        Controlled state, media queries, debouncing, and clipboard helpers.
      </Alert>
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => setValue((v) => v + 1)}>
          Increment: {value}
        </Button>
        <Tag color={wide ? 'green' : 'coral'}>
          {wide ? 'Desktop breakpoint' : 'Mobile breakpoint'}
        </Tag>
      </div>
    </Stack>
  )
}
export function ComponentDemo({ id }: { id: string }) {
  const [large, setLarge] = React.useState(false)
  const [checked, setChecked] = React.useState(true)
  const [value, setValue] = React.useState('overview')
  const [text, setText] = React.useState('')
  const [date, setDate] = React.useState<Date | undefined>(new Date(2026, 9, 24))
  const [range, setRange] = React.useState<DateRange | undefined>()
  const [number, setNumber] = React.useState(24)
  const [keys, setKeys] = React.useState<string[]>([])
  const [tour, setTour] = React.useState(false)
  const [progress, setProgress] = React.useState(64)
  const [color, setColor] = React.useState('#e66043')
  const [record, setRecord] = React.useState<Record<string, unknown>>({
    name: 'Sarah Kim',
    email: 'sarah@example.com',
    role: 'designer',
    active: true,
    budget: 24680,
  })
  const [tags, setTags] = React.useState(['Design', 'Engineering', 'Product'])
  switch (id) {
    case 'button':
      return (
        <Stack>
          <Space>
            <Button onClick={onDemoClick}>
              Get started
              <ArrowRight />
            </Button>
            <Button variant="outline" onClick={onDemoClick}>
              Secondary action
            </Button>
            <Button variant="secondary" onClick={onDemoClick}>
              Subtle
            </Button>
            <Button variant="ghost" onClick={onDemoClick}>
              Ghost
            </Button>
          </Space>
          <Space>
            <Button size="sm" onClick={onDemoClick}>
              Small
            </Button>
            <Button size="default" onClick={onDemoClick}>
              Default
            </Button>
            <Button size="lg" onClick={onDemoClick}>
              Large
            </Button>
            <Button size="icon" aria-label="Add item" onClick={onDemoClick}>
              <Plus />
            </Button>
            <Button variant="destructive" onClick={onDemoClick}>
              Destructive
            </Button>
            <Button disabled>Disabled</Button>
          </Space>
          <Hint>Compose with icons, links, loading states, and your own variants.</Hint>
        </Stack>
      )
    case 'float-button':
      return (
        <div className="relative h-64 w-full max-w-md rounded-lg border bg-muted/40">
          <p className="p-5 text-sm text-muted-foreground">Useful actions, always within reach.</p>
          <FloatButton
            className="absolute right-6 bottom-6"
            aria-label="Create project"
            onClick={onDemoClick}
          >
            <Plus size={20} />
          </FloatButton>
          <FloatButton
            className="absolute right-6 bottom-22 size-10"
            aria-label="Scroll to top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <ArrowUp size={17} />
          </FloatButton>
        </div>
      )
    case 'icon':
      return (
        <Stack>
          <div className="grid grid-cols-6 gap-7">
            {[
              Layers,
              Search,
              Star,
              Bell,
              Plus,
              Mail,
              Settings,
              Users,
              Home,
              ShieldCheck,
              Download,
              Sparkles,
            ].map((I, i) => (
              <I
                key={i}
                size={24}
                strokeWidth={1.5}
                className={i % 3 === 0 ? 'text-primary' : 'text-muted-foreground'}
              />
            ))}
          </div>
          <Hint>
            Lucide icons. Set size, color, strokeWidth, and accessible labels through standard
            props.
          </Hint>
        </Stack>
      )
    case 'typography':
      return (
        <Stack>
          <Typography as="h1">Make it meaningful.</Typography>
          <Typography as="h3">Good type makes all the difference.</Typography>
          <Typography muted>
            Clear hierarchy, considered spacing, and a little character. Typography gives your
            interface a voice.
          </Typography>
          <Typography copyable>Copy this little piece of inspiration.</Typography>
          <Typography as="blockquote">The details are the design.</Typography>
          <Typography as="code">const possibilities = Infinity</Typography>
        </Stack>
      )
    case 'divider':
      return (
        <Stack>
          <Typography as="h3">A little space goes a long way.</Typography>
          <Separator />
          <Typography muted>Separate ideas. Bring clarity.</Typography>
          <div className="flex h-5 items-center gap-4 text-sm">
            Design
            <Separator orientation="vertical" />
            Build
            <Separator orientation="vertical" />
            Ship
          </div>
        </Stack>
      )
    case 'flex':
    case 'grid':
    case 'space': {
      const content = [1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex h-18 min-w-18 flex-1 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-sm text-primary"
        >
          {i}
        </div>
      ))
      return (
        <Stack>
          {id === 'grid' ? (
            <Grid minWidth={110}>{content}</Grid>
          ) : id === 'space' ? (
            <Space gap={16}>{content}</Space>
          ) : (
            <Flex gap={16} wrap>
              {content}
            </Flex>
          )}
          <Hint>
            Responsive spacing and alignment through typed props. Resize the window to explore.
          </Hint>
        </Stack>
      )
    }
    case 'layout':
      return (
        <Layout className="w-full overflow-hidden rounded-xl border">
          <LayoutHeader>Acme workspace</LayoutHeader>
          <div className="flex min-h-48">
            <LayoutSider className="w-36">
              <Menu
                value="home"
                items={[
                  { key: 'home', label: 'Home', icon: <Home size={14} /> },
                  { key: 'projects', label: 'Projects', icon: <Layers size={14} /> },
                ]}
                onValueChange={() => toast.info('Navigation selected')}
              />
            </LayoutSider>
            <LayoutContent>
              <h3 className="font-medium">A thoughtful foundation.</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Compose headers, sidebars, content, and footers.
              </p>
            </LayoutContent>
          </div>
          <LayoutFooter>Built with ErgonUI</LayoutFooter>
        </Layout>
      )
    case 'masonry':
      return (
        <Masonry className="w-full" minWidth={140}>
          {[90, 140, 110, 170, 120, 100].map((h, i) => (
            <div
              key={i}
              className="mb-4 flex items-center justify-center rounded-lg bg-primary/10 text-sm text-primary"
              style={{ height: h }}
            >
              Idea {i + 1}
            </div>
          ))}
        </Masonry>
      )
    case 'splitter':
      return (
        <ResizablePanelGroup orientation="horizontal" className="min-h-64 rounded-lg border">
          <ResizablePanel defaultSize="35%" minSize="20%">
            <div className="flex h-64 items-center justify-center bg-muted/40 text-sm">
              Your workspace
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel minSize="20%">
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              Drag the handle. Make room.
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )
    case 'anchor':
      return (
        <Stack>
          <div className="flex gap-6">
            <Anchor
              className="min-w-36"
              items={[
                { href: '#anchor-intro', title: 'Introduction' },
                { href: '#anchor-details', title: 'The details' },
                { href: '#anchor-next', title: 'What’s next' },
              ]}
            />
            <div className="h-48 flex-1 overflow-auto rounded-lg border p-5">
              <section id="anchor-intro" className="pb-20">
                <h3>Introduction</h3>
                <Hint>A clear path through your content.</Hint>
              </section>
              <section id="anchor-details" className="pb-20">
                <h3>The details</h3>
                <Hint>Anchors connect headings and navigation.</Hint>
              </section>
              <section id="anchor-next">
                <h3>What’s next</h3>
                <Hint>Keep exploring.</Hint>
              </section>
            </div>
          </div>
        </Stack>
      )
    case 'breadcrumb':
      return (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#/components">
                <Home size={14} />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#/components?category=Data%20display">
                Components
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Your workspace</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
    case 'dropdown':
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Open menu
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Your workspace</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDemoClick}>
              <Layers />
              Projects<DropdownMenuShortcut>⌘ P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDemoClick}>
              <Users />
              Team members
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Invite people</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={onDemoClick}>By email</DropdownMenuItem>
                <DropdownMenuItem onClick={onDemoClick}>Copy invite link</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => toast.info('This is a preview. No workspace was deleted.')}
            >
              <Trash2 />
              Delete workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    case 'menu':
      return (
        <div className="w-64 rounded-xl border p-3">
          <Menu
            items={[
              { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
              { key: 'projects', label: 'Projects', icon: <Layers size={16} /> },
              {
                key: 'team',
                label: 'Team',
                icon: <Users size={16} />,
                children: [
                  { key: 'members', label: 'Members' },
                  { key: 'invitations', label: 'Invitations' },
                ],
              },
              { key: 'settings', label: 'Settings', icon: <Settings size={16} /> },
            ]}
            value={value}
            onValueChange={setValue}
          />
        </div>
      )
    case 'pagination':
      return <PaginationDemo />
    case 'steps':
      return (
        <Stack>
          <Steps
            items={[
              { title: 'Project details', description: 'Start with the essentials' },
              { title: 'Your team', description: 'Better together' },
              { title: 'Ready to go', description: 'Bring it to life' },
            ]}
            current={number % 3}
            onChange={setNumber}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setNumber((n) => (n + 2) % 3)}>
              Back
            </Button>
            <Button onClick={() => setNumber((n) => (n + 1) % 3)}>
              Continue
              <ArrowRight />
            </Button>
          </div>
        </Stack>
      )
    case 'tabs':
      return (
        <Stack>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Everything in one place.</CardTitle>
                  <CardDescription>Your projects, people, and possibilities.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" onClick={onDemoClick}>
                    Explore workspace
                    <ArrowUpRight />
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="analytics">
              <Card className="mt-4">
                <CardContent className="pt-6">
                  <Statistic title="Total revenue" value={24680} prefix="$" trend={12.8} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="reports">
              <Empty
                className="mt-4"
                title="Your first report is waiting"
                description="Create a report to see the bigger picture."
              >
                <Button size="sm" onClick={onDemoClick}>
                  Create report
                </Button>
              </Empty>
            </TabsContent>
          </Tabs>
        </Stack>
      )
    case 'auto-complete':
      return (
        <Stack>
          <Label htmlFor="autocomplete-demo">Your favorite framework</Label>
          <AutoComplete
            id="autocomplete-demo"
            options={['React', 'Next.js', 'Remix', 'Astro', 'Vue', 'Svelte']}
            placeholder="Start typing…"
            value={text}
            onValueChange={setText}
          />
          <Hint>Native suggestions allow free-form input. Try “React”.</Hint>
        </Stack>
      )
    case 'cascader':
      return (
        <Stack>
          <Cascader
            options={[
              {
                value: 'asia',
                label: 'Asia',
                children: [
                  {
                    value: 'indonesia',
                    label: 'Indonesia',
                    children: [
                      { value: 'jakarta', label: 'Jakarta' },
                      { value: 'bali', label: 'Bali' },
                    ],
                  },
                  {
                    value: 'japan',
                    label: 'Japan',
                    children: [
                      { value: 'tokyo', label: 'Tokyo' },
                      { value: 'kyoto', label: 'Kyoto' },
                    ],
                  },
                ],
              },
              {
                value: 'europe',
                label: 'Europe',
                children: [
                  {
                    value: 'france',
                    label: 'France',
                    children: [{ value: 'paris', label: 'Paris' }],
                  },
                ],
              },
            ]}
          />
          <Hint>Explore regions, countries, and cities in a single composed picker.</Hint>
        </Stack>
      )
    case 'checkbox':
      return (
        <Stack>
          <label className="flex items-center gap-3 text-sm">
            <Checkbox checked={checked} onCheckedChange={(c) => setChecked(!!c)} />
            Design with intention
          </label>
          <label className="flex items-center gap-3 text-sm">
            <Checkbox defaultChecked="indeterminate" />
            Partially selected
          </label>
          <label className="flex items-center gap-3 text-sm text-muted-foreground">
            <Checkbox disabled />A disabled option
          </label>
        </Stack>
      )
    case 'color-picker':
      return (
        <Stack>
          <ColorPicker value={color} onValueChange={setColor} allowAlpha />
          <div className="rounded-lg border p-5 text-sm" style={{ borderColor: color, color }}>
            Your color. Your character.
          </div>
          <Label className="mt-3">Or a little gradient</Label>
          <GradientPicker />
        </Stack>
      )
    case 'date-picker':
      return (
        <Stack>
          <Label>Pick a moment</Label>
          <DatePicker value={date} onValueChange={setDate} />
          <Label className="mt-3">Or a little more time</Label>
          <DateRangePicker value={range} onValueChange={setRange} />
          <Label className="mt-3">More ways to make time</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            <MultiDatePicker />
            <DateTimePicker />
            <MonthPicker />
            <WeekPicker />
            <YearPicker />
            <QuarterPicker />
          </div>
        </Stack>
      )
    case 'form':
      return <FormDemo />
    case 'input':
      return (
        <Stack>
          <Label htmlFor="idea-input">Your next big idea</Label>
          <Input
            id="idea-input"
            placeholder="Make something meaningful…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="relative">
            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              aria-label="Search preview"
              placeholder="Search your workspace…"
            />
          </div>
          <Input type="password" aria-label="Password preview" placeholder="A little secret" />
          <Textarea aria-label="Description preview" placeholder="Tell us a little more…" />
          <Input disabled placeholder="Taking a little break" />
        </Stack>
      )
    case 'input-number':
      return (
        <Stack>
          <InputNumber value={number} onValueChange={setNumber} min={0} max={100} />
          <InputNumber defaultValue={1.5} step={0.1} min={0} max={10} label="Precision value" />
          <Hint>Bounded values, decimal steps, keyboard input, and controlled state.</Hint>
        </Stack>
      )
    case 'mentions':
      return (
        <Stack>
          <Mentions
            options={[
              { value: 'sarah', label: 'Sarah Kim' },
              { value: 'alex', label: 'Alex Morgan' },
              { value: 'maya', label: 'Maya Chen' },
            ]}
          />
          <Hint>Type @ to find a teammate. Use arrow keys and Enter to select.</Hint>
        </Stack>
      )
    case 'radio':
      return (
        <Stack>
          <RadioGroup defaultValue="team" aria-label="Choose a plan">
            {[
              ['starter', 'Starter', 'A space to start creating'],
              ['team', 'Team', 'Better things happen together'],
              ['enterprise', 'Enterprise', 'Room for your biggest ambitions'],
            ].map(([v, title, desc]) => (
              <label key={v} className="flex items-center gap-3 rounded-lg border p-4">
                <RadioGroupItem value={v} />
                <span>
                  <span className="block text-sm font-medium">{title}</span>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </Stack>
      )
    case 'rate':
      return (
        <Stack>
          <Rate defaultValue={4} onValueChange={(n) => setNumber(n)} allowHalf />
          <Hint>
            {number === 24 ? 'How was your experience?' : `Thanks for sharing ${number} stars.`}
          </Hint>
          <Rate value={3} disabled />
        </Stack>
      )
    case 'select':
      return (
        <Stack>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch checked={large} onCheckedChange={setLarge} />
            10,000 virtualized options
          </label>
          <Label>Single selection</Label>
          <Combobox
            options={
              large
                ? Array.from({ length: 10000 }, (_, i) => ({
                    value: `option-${i}`,
                    label: `Option ${i + 1}`,
                  }))
                : frameworkOptions
            }
            label="Choose a framework"
          />
          <Label className="mt-3">A few favorites</Label>
          <Combobox multiple options={frameworkOptions} value={keys} onValueChange={setKeys} />
          <Hint>
            Searchable options, multi-selection, disabled choices, and cancellable async loading.
          </Hint>
        </Stack>
      )
    case 'slider':
      return (
        <Stack>
          <div className="flex justify-between text-sm">
            <Label>Find your balance</Label>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Slider
            value={[progress]}
            onValueChange={(v) => setProgress(v[0])}
            max={100}
            step={1}
            aria-label="Balance"
          />
          <Label className="mt-5">A range of possibilities</Label>
          <Slider defaultValue={[25, 75]} max={100} step={5} aria-label="Range" />
        </Stack>
      )
    case 'switch':
      return (
        <Stack>
          <label className="flex items-center justify-between gap-8 rounded-lg border p-5">
            <span>
              <span className="block text-sm font-medium">Keep me in the loop</span>
              <span className="text-xs text-muted-foreground">
                A little update when something good happens.
              </span>
            </span>
            <Switch checked={checked} onCheckedChange={setChecked} />
          </label>
          <label className="flex items-center gap-3 text-sm text-muted-foreground">
            <Switch disabled />
            Unavailable right now
          </label>
        </Stack>
      )
    case 'time-picker':
      return (
        <Stack>
          <Label>The right moment</Label>
          <TimePicker value={text} onValueChange={setText} />
          <Label className="mt-3">Down to the second</Label>
          <TimePicker seconds />
        </Stack>
      )
    case 'transfer':
      return (
        <Stack>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch checked={large} onCheckedChange={setLarge} />
            2,000 virtualized items
          </label>
          <Transfer
            items={
              large
                ? Array.from({ length: 2000 }, (_, i) => ({
                    key: `item-${i}`,
                    label: `Item ${i + 1}`,
                  }))
                : ['Design', 'Engineering', 'Product', 'Marketing', 'Operations', 'Finance'].map(
                    (t) => ({ key: t, label: t }),
                  )
            }
            defaultValue={['Design', 'Product']}
          />
        </Stack>
      )
    case 'tree-select':
      return (
        <Stack>
          <TreeSelect nodes={treeData} />
          <TreeSelect nodes={treeData} multiple placeholder="Choose a few files" />
        </Stack>
      )
    case 'upload':
      return (
        <Stack>
          <Upload accept=".png,.jpg,.jpeg,.svg,.pdf" maxCount={5} />
          <Hint>
            Local file selection is demonstrated here. Supply customRequest to connect your upload
            endpoint.
          </Hint>
        </Stack>
      )
    case 'avatar':
      return (
        <Stack>
          <Space gap={16}>
            <Avatar className="size-14">
              <AvatarFallback className="bg-orange-100 text-orange-700">SK</AvatarFallback>
            </Avatar>
            <Avatar className="size-11">
              <AvatarFallback className="bg-emerald-100 text-emerald-700">AM</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback className="bg-violet-100 text-violet-700">MC</AvatarFallback>
            </Avatar>
            <Avatar className="size-7">
              <AvatarFallback className="text-[10px]">JD</AvatarFallback>
            </Avatar>
          </Space>
          <div className="flex -space-x-2">
            {['SK', 'AM', 'MC', '+4'].map((t) => (
              <Avatar key={t} className="border-3 border-background">
                <AvatarFallback className="bg-secondary text-xs">{t}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </Stack>
      )
    case 'badge':
      return (
        <Stack>
          <Space>
            <Badge>New release</Badge>
            <Badge variant="secondary">In progress</Badge>
            <Badge variant="outline">Open source</Badge>
            <Badge variant="destructive">Needs attention</Badge>
          </Space>
          <Space gap={22}>
            <div className="relative rounded-xl border p-3">
              <Bell size={22} />
              <span className="absolute -top-2 -right-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-white">
                3
              </span>
            </div>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              All systems operational
            </span>
          </Space>
        </Stack>
      )
    case 'calendar':
      return (
        <Stack>
          <EventCalendar
            value={date}
            onValueChange={setDate}
            events={[
              {
                id: 'design',
                date: new Date(2026, 9, 24),
                title: 'Design review',
                color: '#e66043',
              },
              {
                id: 'standup',
                date: new Date(2026, 9, 24),
                title: 'Team catch-up',
                color: '#4f8a6c',
              },
              { id: 'launch', date: new Date(2026, 9, 28), title: 'Launch day', color: '#6976c5' },
            ]}
          />
          <Hint>{date ? `Your moment: ${date.toLocaleDateString()}` : 'Choose a date.'}</Hint>
        </Stack>
      )
    case 'card':
      return (
        <Card className="w-full max-w-sm">
          <CardHeader>
            <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Layers size={21} />
            </div>
            <CardTitle>A space for your next idea.</CardTitle>
            <CardDescription>
              Give your projects a thoughtful home. Compose content, actions, and a little
              personality.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Space>
              <Tag color="green">Ready to build</Tag>
              <Tag>Open source</Tag>
            </Space>
          </CardContent>
          <CardFooter className="justify-between">
            <span className="text-xs text-muted-foreground">The possibilities are yours.</span>
            <Button size="sm" onClick={onDemoClick}>
              Explore
              <ArrowRight />
            </Button>
          </CardFooter>
        </Card>
      )
    case 'carousel':
      return (
        <Carousel className="w-full max-w-xs">
          <CarouselContent>
            {[1, 2, 3, 4].map((n) => (
              <CarouselItem key={n}>
                <div className="flex aspect-[4/3] items-center justify-center rounded-xl border bg-primary/5 text-6xl font-semibold tracking-tighter text-primary/60">
                  0{n}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      )
    case 'collapse':
      return (
        <Stack>
          <Accordion type="single" collapsible defaultValue="what">
            <AccordionItem value="what">
              <AccordionTrigger>What makes ErgonUI different?</AccordionTrigger>
              <AccordionContent>
                A richer set of components built on shadcn/ui source and community work. You own the
                source, the design decisions, and every little detail.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="customize">
              <AccordionTrigger>Can I make it my own?</AccordionTrigger>
              <AccordionContent>
                Absolutely. Use design tokens, component variants, Tailwind classes, or edit the
                source directly.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="install">
              <AccordionTrigger>How do I get started?</AccordionTrigger>
              <AccordionContent>
                Install through the shadcn registry, import your component, and start building.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Stack>
      )
    case 'descriptions':
      return (
        <Stack>
          <Descriptions
            title="Project details"
            items={[
              { key: 'name', label: 'Project', children: 'Ergon workspace' },
              { key: 'status', label: 'Status', children: <Tag color="green">Active</Tag> },
              { key: 'owner', label: 'Owner', children: 'Sarah Kim' },
              { key: 'created', label: 'Created', children: 'October 24, 2026' },
              {
                key: 'summary',
                label: 'A little context',
                children: 'A thoughtful foundation for your next big idea.',
                span: 2,
              },
            ]}
          />
        </Stack>
      )
    case 'empty':
      return (
        <Empty
          title="Room for something great"
          description="Your first project is just one click away."
        >
          <Button onClick={onDemoClick}>
            <Plus />
            Create a project
          </Button>
        </Empty>
      )
    case 'image':
      return (
        <Stack>
          <Image
            src="/landscape.svg"
            alt="An illustrated landscape in warm earthy colors"
            className="max-h-60 w-full"
          />
          <Hint>
            Click the image to open a preview. Zoom controls and keyboard dismissal are included.
          </Hint>
          <ImageGallery
            images={[
              { src: '/landscape.svg', alt: 'Quiet green hills' },
              { src: '/landscape-blue.svg', alt: 'A blue mountain morning' },
              { src: '/landscape-desert.svg', alt: 'Sunlight over the dunes' },
            ]}
          />
        </Stack>
      )
    case 'list':
      return (
        <Stack>
          <List
            items={makeProjects(3)}
            getKey={(r) => r.id}
            renderItem={(r) => (
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Layers size={17} />
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {r.owner} · Updated today
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${r.name}`}>
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={onDemoClick}>Open project</DropdownMenuItem>
                    <DropdownMenuItem onClick={onDemoClick}>Share project</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          />
        </Stack>
      )
    case 'popover':
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              A little more context
              <Plus />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <h3 className="text-sm font-semibold">Your workspace, your way.</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Keep helpful settings close to the action.
            </p>
            <label className="mt-4 flex items-center justify-between text-xs">
              Email notifications
              <Switch defaultChecked />
            </label>
          </PopoverContent>
        </Popover>
      )
    case 'qr-code':
      return (
        <Stack>
          <div className="mx-auto">
            <QRCode value={text || 'https://ui.shadcn.com'} downloadable />
          </div>
          <Input
            aria-label="QR code value"
            placeholder="https://your-next-idea.com"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Hint>Your code updates as you type. Scan to open the destination.</Hint>
        </Stack>
      )
    case 'segmented':
      return (
        <Stack>
          <Segmented
            value={value}
            onValueChange={setValue}
            options={[
              { value: 'overview', label: 'Overview' },
              { value: 'activity', label: 'Activity' },
              { value: 'insights', label: 'Insights' },
            ]}
          />
          <div className="rounded-lg border p-6">
            <h3 className="text-sm font-medium">
              {value === 'overview'
                ? 'The bigger picture.'
                : value === 'activity'
                  ? 'Good things are happening.'
                  : 'A little clarity goes a long way.'}
            </h3>
          </div>
        </Stack>
      )
    case 'statistic':
      return (
        <Grid minWidth={180}>
          <div className="rounded-xl border p-6">
            <Statistic title="Total revenue" value={24680} precision={2} prefix="$" trend={12.8} />
          </div>
          <div className="rounded-xl border p-6">
            <Statistic title="Active customers" value={1280} trend={8.2} />
          </div>
          <div className="rounded-xl border p-6">
            <Statistic title="Conversion rate" value={4.82} precision={2} suffix="%" trend={-0.4} />
          </div>
        </Grid>
      )
    case 'table':
      return <TableDemo />
    case 'tag':
      return (
        <Stack>
          <Space>
            {tags.map((t, i) => (
              <Tag
                key={t}
                color={(['coral', 'green', 'purple'] as const)[i % 3]}
                onClose={() => setTags((prev) => prev.filter((v) => v !== t))}
              >
                {t}
              </Tag>
            ))}
            <Button
              size="xs"
              variant="outline"
              onClick={() => setTags((t) => [...t, `Label ${t.length + 1}`])}
            >
              <Plus />
              Add label
            </Button>
          </Space>
          <Space>
            <Tag color="blue" selected={checked} onSelectedChange={setChecked}>
              A selectable tag
            </Tag>
            <Tag color="amber">A little attention</Tag>
          </Space>
        </Stack>
      )
    case 'timeline':
      return (
        <Stack>
          <Timeline
            items={[
              {
                key: 'created',
                title: 'Your idea found a home',
                description: 'Project created by Sarah Kim.',
                time: '9:00 AM',
                status: 'complete',
              },
              {
                key: 'design',
                title: 'Design approved',
                description: 'A little polish. A lot of possibility.',
                time: '10:24 AM',
                status: 'complete',
              },
              {
                key: 'build',
                title: 'Ready to build',
                description: 'The next chapter is yours.',
                time: 'Now',
                status: 'active',
              },
              { key: 'launch', title: 'Something great is coming', status: 'pending' },
            ]}
          />
        </Stack>
      )
    case 'tooltip':
      return (
        <Space gap={20}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Copy link">
                <Copy />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy this little piece of the web</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover or focus here</Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              A helpful detail, right where you need it.
            </TooltipContent>
          </Tooltip>
        </Space>
      )
    case 'tour':
      return (
        <Stack>
          <Card id="tour-card">
            <CardHeader>
              <CardTitle>Welcome to your workspace.</CardTitle>
              <CardDescription>A friendly introduction to your next great idea.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button id="tour-start" onClick={() => setTour(true)}>
                Show me around
                <ArrowRight />
              </Button>
            </CardFooter>
          </Card>
          <Tour
            open={tour}
            onOpenChange={setTour}
            steps={[
              {
                title: 'Make yourself at home',
                description: 'Your projects live in one thoughtful space.',
                target: '#tour-card',
              },
              {
                title: 'Create something great',
                description: 'Start a project and invite your team.',
                target: '#tour-start',
              },
              {
                title: 'You’re ready to go',
                description: 'Explore the components and make them your own.',
              },
            ]}
          />
        </Stack>
      )
    case 'tree':
      return (
        <Stack>
          <Tree
            nodes={treeData}
            checkable
            value={keys}
            onValueChange={setKeys}
            defaultExpandedKeys={['workspace', 'design', 'engineering']}
          />
          <Hint>
            {keys.length} files selected. Arrow keys navigate; Space selects. Virtualization and
            async child loaders are available as props.
          </Hint>
        </Stack>
      )
    case 'alert':
      return (
        <Stack>
          <Alert variant="success" title="Looking good!" closable>
            Your changes have been saved. On to the next big thing.
          </Alert>
          <Alert variant="info" title="A little heads-up">
            Your workspace is ready for a few more teammates.
          </Alert>
          <Alert variant="warning" title="Worth a second look" closable>
            You’re getting close to your storage limit.
          </Alert>
          <Alert variant="error" title="Let’s give that another try">
            Something interrupted the connection.
          </Alert>
        </Stack>
      )
    case 'drawer':
      return (
        <Space>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                Open side drawer
                <ArrowRight />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Room for a little more.</SheetTitle>
                <SheetDescription>
                  Explore the details without leaving your workspace.
                </SheetDescription>
              </SheetHeader>
              <div className="p-4">
                <FormPlus
                  fields={formFields.slice(0, 2)}
                  onSubmit={async () => {
                    toast.success('Saved')
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="secondary">Open bottom drawer</Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-sm">
                <DrawerHeader>
                  <DrawerTitle>A fresh perspective.</DrawerTitle>
                  <DrawerDescription>Swipe down or press Escape to close.</DrawerDescription>
                </DrawerHeader>
                <div className="p-6">
                  <Statistic title="A month of possibility" value={24680} prefix="$" trend={12.8} />
                </div>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button>Looking good</Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        </Space>
      )
    case 'message':
      return (
        <Space>
          <Button
            variant="outline"
            onClick={() => toast.success('Looking good! Your changes are saved.')}
          >
            Success
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.error('Couldn’t connect. Give it another try.')}
          >
            Error
          </Button>
          <Button variant="outline" onClick={() => toast.info('Your workspace has a new update.')}>
            Information
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast.promise(new Promise((r) => setTimeout(r, 1500)), {
                loading: 'Making things happen…',
                success: 'Ready when you are.',
                error: 'Try again.',
              })
            }
          >
            Async message
          </Button>
        </Space>
      )
    case 'notification':
      return (
        <Stack>
          <Button
            onClick={() =>
              toast('A little something new', {
                description: 'Sarah invited you to the Design workspace.',
                action: { label: 'View invite', onClick: () => toast.success('Invite opened') },
                duration: 7000,
              })
            }
          >
            <Bell />
            Show notification
          </Button>
          <Hint>Rich descriptions, actions, timed dismissal, and promise-based feedback.</Hint>
        </Stack>
      )
    case 'modal':
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              Make a little space
              <ArrowUpRight />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>A moment of focus.</DialogTitle>
              <DialogDescription>
                Give your next project a name. You can change it whenever inspiration strikes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-3">
              <Label htmlFor="modal-name">Project name</Label>
              <Input
                id="modal-name"
                placeholder="Your next great idea"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={() => toast.success(text ? `${text} created` : 'Project created')}>
                  Create project
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )
    case 'popconfirm':
      return (
        <Popconfirm
          title="Ready to let this go?"
          description="This demonstration won’t delete any real data."
          destructive
          onConfirm={() => toast.success('Demo action confirmed')}
        >
          <Button variant="destructive">
            <Trash2 />
            Delete project
          </Button>
        </Popconfirm>
      )
    case 'progress':
      return (
        <Stack>
          <div className="flex justify-between text-sm">
            <span>Good things take a little time.</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} aria-label="Project progress" />
          <ProgressSteps value={progress} />
          <div className="flex justify-center gap-8 py-4">
            <ProgressCircle value={progress} />
            <ProgressCircle value={100} status="success" />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setProgress((p) => Math.max(0, p - 10))}
            >
              − 10%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setProgress((p) => Math.min(100, p + 10))}
            >
              + 10%
            </Button>
          </div>
        </Stack>
      )
    case 'result':
      return (
        <Result
          title="Something great just happened."
          description="Your project is ready. Invite your team, explore your workspace, and see where the next idea takes you."
        >
          <Button onClick={onDemoClick}>
            Open workspace
            <ArrowRight />
          </Button>
          <Button variant="outline" onClick={onDemoClick}>
            Create another
          </Button>
        </Result>
      )
    case 'skeleton':
      return (
        <Stack>
          <div className="flex items-center gap-4">
            <Skeleton className="size-12 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </Stack>
      )
    case 'spin':
      return (
        <Stack>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={checked} onCheckedChange={setChecked} />
            Loading state
          </label>
          <Spin spinning={checked}>
            <div className="rounded-xl border p-8">
              <h3 className="text-sm font-medium">Good things are coming.</h3>
              <p className="mt-2 text-sm text-muted-foreground">Your content is on its way.</p>
            </div>
          </Spin>
        </Stack>
      )
    case 'watermark':
      return (
        <Watermark text="ERGON WORKSPACE" className="w-full rounded-xl border">
          <div className="p-10">
            <Typography as="h3">A subtle signature.</Typography>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Give shared documents a little identity. A repeating watermark sits above your content
              without getting in the way of your interactions.
            </p>
            <Button className="mt-6" variant="outline" onClick={onDemoClick}>
              Still interactive
            </Button>
          </div>
        </Watermark>
      )
    case 'affix':
      return (
        <div className="h-64 w-full max-w-lg overflow-auto rounded-xl border">
          <div className="relative p-4">
            <Affix offsetTop={0}>
              <div className="rounded-lg border bg-background p-3 text-sm shadow-sm">
                ↥ Always in the right place.
              </div>
            </Affix>
            {Array.from({ length: 12 }, (_, i) => (
              <p className="mt-5 text-sm text-muted-foreground" key={i}>
                Scroll a little. Your important actions stay close.
              </p>
            ))}
          </div>
        </div>
      )
    case 'border-beam':
      return (
        <BorderBeam className="w-full max-w-sm">
          <div className="py-6 text-center">
            <Sparkles className="mx-auto mb-4 text-primary" />
            <h3 className="font-semibold">A little extra attention.</h3>
            <p className="mt-2 text-sm text-muted-foreground">For things worth noticing.</p>
          </div>
        </BorderBeam>
      )
    case 'app':
    case 'config-provider':
      return (
        <Stack>
          <Space>
            <ColorPicker value={color} onValueChange={setColor} />
            <Switch checked={checked} onCheckedChange={setChecked} aria-label="Compact density" />
            <span className="text-xs text-muted-foreground">Compact density</span>
          </Space>
          <ConfigProvider
            accent={color}
            density={checked ? 'compact' : 'comfortable'}
            className="space-y-4 rounded-lg border p-5"
          >
            <Button onClick={onDemoClick}>
              Your brand, everywhere
              <ArrowRight />
            </Button>
            <Input aria-label="Themed input" placeholder="One coherent design language" />
            <Checkbox aria-label="Themed checkbox" defaultChecked />
          </ConfigProvider>
          <Hint>
            AppProvider combines configuration, theme, tooltips, and notifications. ConfigProvider
            offers scoped tokens, locale, direction, and density.
          </Hint>
        </Stack>
      )
    case 'util':
      return <UtilDemo />
    case 'layout-plus':
      return <LayoutDemo />
    case 'form-plus':
      return <FormDemo enhanced />
    case 'table-plus':
      return <TableDemo enhanced />
    case 'descriptions-plus':
      return (
        <Stack>
          <DescriptionsPlus
            title="Team member"
            record={record}
            onSave={setRecord}
            fields={[
              { key: 'name', label: 'Full name' },
              { key: 'email', label: 'Email address' },
              {
                key: 'role',
                label: 'Role',
                type: 'select',
                options: [
                  { value: 'designer', label: 'Designer' },
                  { value: 'engineer', label: 'Engineer' },
                ],
              },
              { key: 'active', label: 'Active member', type: 'switch' },
            ]}
          />
        </Stack>
      )
    case 'list-plus':
      return (
        <ListPlus
          items={makeProjects(18)}
          getKey={(r) => r.id}
          getSearchText={(r) => r.name + ' ' + r.owner}
          onSelectionChange={() => {}}
          renderItem={(r) => (
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-primary/10 p-2 text-primary">
                <Layers size={18} />
              </span>
              <div className="flex-1">
                <h4 className="text-sm font-medium">{r.name}</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.owner} · {r.created}
                </p>
              </div>
              <Tag color={r.status === 'Completed' ? 'green' : 'coral'}>{r.status}</Tag>
            </div>
          )}
        />
      )
    case 'editable-table-plus':
      return <TableDemo editable />
    case 'card-plus':
      return (
        <Grid minWidth={230}>
          <CardPlus
            title="Your business, at a glance"
            description="An illustrative dashboard card."
            collapsible
            footer="Updated just now"
            extra={<Tag color="green">Live</Tag>}
          >
            <Statistic
              title="Monthly revenue"
              value={24680}
              precision={2}
              prefix="$"
              trend={12.8}
            />
          </CardPlus>
          <CardPlus title="A little more detail" collapsible footer="Click the chevron to collapse">
            <Timeline
              items={[
                { key: '1', title: 'Project created', status: 'complete' },
                { key: '2', title: 'Design in progress', status: 'active' },
              ]}
            />
          </CardPlus>
        </Grid>
      )
    case 'field-plus':
      return (
        <Stack>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <Label className="mb-3 block">Read mode</Label>
              <FieldPlus type="money" value={number * 100} />
            </div>
            <div>
              <Label className="mb-3 block">Edit mode</Label>
              <FieldPlus
                type="money"
                value={number * 100}
                onValueChange={(v) => setNumber(Number(v) / 100)}
                mode="edit"
              />
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-5">
            <FieldPlus type="select" value="react" options={frameworkOptions} />
            <FieldPlus
              type="select"
              value={text || 'react'}
              onValueChange={setText}
              mode="edit"
              options={frameworkOptions}
            />
          </div>
          <Hint>
            One typed field abstraction for text, money, percentages, dates, selection, switches,
            and more.
          </Hint>
        </Stack>
      )
    case 'skeleton-plus':
      return (
        <Stack>
          <Segmented
            options={['dashboard', 'list', 'form'].map((v) => ({
              value: v,
              label: v[0].toUpperCase() + v.slice(1),
            }))}
            value={value === 'overview' ? 'dashboard' : value}
            onValueChange={setValue}
          />
          <SkeletonPlus
            type={(value === 'overview' ? 'dashboard' : value) as 'dashboard' | 'list' | 'form'}
          />
        </Stack>
      )
    case 'check-card-plus':
      return (
        <Grid minWidth={200}>
          <CheckCardPlus
            title="Starter"
            description="A thoughtful foundation for your next idea."
            icon={<Layers size={21} />}
            checked={!checked}
            onCheckedChange={() => setChecked(false)}
          />
          <CheckCardPlus
            title="Team"
            description="Make room for a few more possibilities."
            icon={<Zap size={21} />}
            checked={checked}
            onCheckedChange={() => setChecked(true)}
          />
        </Grid>
      )
    default:
      return (
        <Empty
          title="Component not found"
          description="Choose another component from the catalog."
        />
      )
  }
}
