import { installationSnippets } from './installation'

export const examples: Record<string, string> = {
  kanban: `import { Kanban, type KanbanColumnData } from "@/components/ui/kanban"
import { useState } from "react"

function Tasks() {
  const [columns, setColumns] = useState<KanbanColumnData[]>([
    { id: "todo", title: "To do", cards: [{ id: "design", title: "Design review" }] },
    { id: "done", title: "Done", limit: 5, cards: [] },
  ])
  return <Kanban value={columns} onValueChange={setColumns} onCardMove={move => console.log(move)} />
}`,
  'calendar-plus': `import { CalendarPlus } from "@/components/ui/calendar-plus"

<CalendarPlus defaultDate="2026-11-03" defaultView="week" editable
  defaultEvents={[{ id: "review", title: "Design review", start: "2026-11-03T10:00:00", end: "2026-11-03T11:00:00" }]}
  onEventsChange={events => console.log(events)}
  onEventMove={(event, previous) => console.log(event, previous)} />
// Use events + onEventsChange for application-owned state. All-day end dates are exclusive.
// Inject persistence in your application; defaultEvents only changes local state.`,
  'gantt-chart': `import { GanttChart, type GanttTask } from "@/components/ui/gantt-chart"
import { useState } from "react"

function Schedule() {
  const [tasks, setTasks] = useState<GanttTask[]>([
    { id: "design", title: "Design", start: "2026-11-02", end: "2026-11-06", progress: 70 },
    { id: "ship", title: "Ship", type: "milestone", start: "2026-11-09", dependsOn: ["design"] },
  ])
  return <GanttChart label="Release schedule" data={tasks} editable onTasksChange={setTasks} zoom />
}
// End dates are inclusive. Dependencies are checked; tasks are not automatically rescheduled.`,
  'filter-builder': `import { FilterBuilder, matchesFilter, type FilterField, type FilterGroup } from "@/components/ui/filter-builder"
import { useState } from "react"

const fields: FilterField[] = [{ id: "revenue", label: "Revenue", type: "number" }]
function Filters() {
  const [query, setQuery] = useState<FilterGroup>({ id: "root", kind: "group", combinator: "and", children: [] })
  const matches = [{ revenue: 1200 }, { revenue: 0 }].filter(row => matchesFilter(row, query, fields))
  return <><FilterBuilder fields={fields} value={query} onValueChange={setQuery} /><output>{matches.length} matches</output></>
}`,
  'file-browser': `import { FileBrowser, type FileBrowserEntry } from "@/components/ui/file-browser"
import { useState } from "react"

function Files() {
  const [entries, setEntries] = useState<FileBrowserEntry[]>([{ id: "design", name: "Design", kind: "folder" }])
  return <FileBrowser entries={entries}
    onCreateFolder={(name, parentId) => setEntries(previous => [...previous, { id: crypto.randomUUID(), name, parentId, kind: "folder" }])}
    onRename={(entry, name) => setEntries(previous => previous.map(item => item.id === entry.id ? { ...item, name } : item))} />
}
// This example is in-memory. Inject your storage/API operations and honor context.signal.`,
  'image-cropper': `import { ImageCropper } from "@/components/ui/image-cropper"

<ImageCropper defaultImage="/photo.jpg"
  onExport={(blob, details) => console.log(blob, details.area)}
  onImageUpload={async (image, { signal }) => {
    const body = new FormData()
    body.append("image", image, "cropped.png")
    const response = await fetch("/api/images", { method: "POST", body, signal })
    if (!response.ok) throw new Error("Upload failed")
    const result = await response.json() as { url: string }
    return result.url
  }} />
// Implement /api/images in your application, or replace onImageUpload with your own uploader.
// A simple (image: Blob) => string | Promise<string> callback also works.`,
  'command-palette': `import { CommandPalette } from "@/components/ui/command-palette"

<CommandPalette actions={[
  { id: "overview", label: "Overview", group: "Navigation", onSelect: () => console.log("Navigate in your router") },
  { id: "settings", label: "Settings", children: [
    { id: "appearance", label: "Appearance", onSelect: () => console.log("Open appearance settings") },
  ] },
]} />
// Ctrl/Command+K opens the default dialog. Async callbacks receive an AbortSignal.`,
  'tags-input': `import { TagsInput } from "@/components/ui/tags-input"

<TagsInput label="Skills" name="skills" defaultValue={["React"]}
  suggestions={["React", "TypeScript", "Design"]} maxTags={8}
  validateTag={tag => tag.length < 2 ? "Use at least two characters." : undefined}
  onValueChange={tags => console.log(tags)} />`,
  'map-chart': `import { MapChart, type ChartMapSource } from "@/components/ui/map-chart"

// Load your own GeoJSON in application code, then pass the parsed source here.
// mapName identifies that map in ECharts; region names match GeoJSON properties.name.
<MapChart label="Revenue by region" mapName="my-regions" geoJSON={geoJSON as ChartMapSource} data={[{ id: "north", name: "North", value: 420 }]} roam selectedMode="multiple" onSelectionChange={setSelectedRegions} />`,
  'boxplot-chart': `import { BoxplotChart, calculateBoxplotStatistics } from "@/components/ui/boxplot-chart"

const data = [{ id: "api", label: "API", ...calculateBoxplotStatistics([12, 16, 18, 20, 24, 28, 120]) }]
<BoxplotChart label="Response time distribution" data={data} showOutliers zoom />
// Or supply summary: [lowerWhisker, q1, median, q3, upperWhisker] and outliers directly.`,
  'calendar-heatmap-chart': `import { CalendarHeatmapChart } from "@/components/ui/calendar-heatmap-chart"

<CalendarHeatmapChart label="Daily activity" range="2026" firstDay={1} data={[{ id: "jan-1", date: "2026-01-01", value: 24 }, { id: "jan-2", date: "2026-01-02", value: 42 }]} />
// range also accepts "2026-01" or ["2026-01-01", "2026-03-31"].`,
  'combo-chart': `import { ComboChart } from "@/components/ui/combo-chart"

<ComboChart label="Revenue and margin" data={[{ id: "jan", label: "Jan", revenue: 420, margin: 24 }, { id: "feb", label: "Feb", revenue: 580, margin: 31 }]} axes={[{ id: "revenue", label: "Revenue", unit: "$" }, { id: "margin", label: "Margin", unit: "%", position: "right" }]} series={[{ key: "revenue", type: "bar", axisId: "revenue" }, { key: "margin", type: "line", axisId: "margin", smooth: true }]} zoom />`,
  'sankey-chart': `import { SankeyChart } from "@/components/ui/sankey-chart"

<SankeyChart label="Visitor journey" nodes={[{ id: "visits", label: "Visits" }, { id: "signup", label: "Signups" }, { id: "exit", label: "Exited" }]} links={[{ id: "converted", source: "visits", target: "signup", value: 120 }, { id: "exited", source: "visits", target: "exit", value: 80 }]} draggable />`,
  'candlestick-chart': `import { CandlestickChart } from "@/components/ui/candlestick-chart"

<CandlestickChart label="Price and volume" data={marketRows} movingAverages={[5, 10, 20]} showVolume zoom brush onSelectionChange={({ rows }) => setSelectedRows(rows)} />
// Each row: { id, date, open, close, low, high, volume? }.
// Brush range enables pointer selection; From/To + Apply range also work by keyboard.
// Samples are simulated; provide your own application data source.`,
  chart: `import { Chart, ChartHeader, ChartTitle, ChartCanvas, ChartLegend, ChartDataTable, type ChartHandle } from "@/components/ui/chart"
import { useRef } from "react"
import { BarChart as BarSeries } from "echarts/charts"
import { GridComponent, TooltipComponent, LegendComponent } from "echarts/components"

const modules = [BarSeries, GridComponent, TooltipComponent, LegendComponent]

function RevenueChart() {
  const chart = useRef<ChartHandle>(null)
  return <Chart ref={chart} modules={modules} label="Revenue by month" option={{
    tooltip: { trigger: "axis" }, legend: { show: false, data: ["Revenue"] },
    xAxis: { type: "category", data: ["Jan", "Feb"] }, yAxis: { type: "value" },
    series: [{ name: "Revenue", type: "bar", data: [42, 58] }]
  }} events={{ click: event => console.log(event.name, event.value) }}>
    <ChartHeader><ChartTitle>Revenue</ChartTitle></ChartHeader>
    <ChartCanvas />
    <ChartLegend items={[{ name: "Revenue" }]} />
    <ChartDataTable columns={["Month", "Revenue"]} rows={[{ id: "jan", cells: ["Jan", 42] }, { id: "feb", cells: ["Feb", 58] }]} />
  </Chart>
}
// ChartHandle exposes getInstance(), resize(), dispatchAction() and getDataURL().
// Export SVG with renderer="svg", PNG with renderer="canvas".
// Chart includes the SVG renderer and accessibility support. Register only the series
// and features you need through modules (or registerChartModules).
// Canvas and features={{ dataZoom: true }} load their optional modules on demand.`,
  'line-chart': `import { LineChart } from "@/components/ui/line-chart"

<LineChart label="Monthly revenue" data={[{ id: "jan", label: "Jan", revenue: 42, target: 48 }, { id: "feb", label: "Feb", revenue: 58, target: 50 }]} series={[{ key: "revenue", label: "Revenue" }, { key: "target", label: "Target", color: "#5579bd" }]} smooth zoom />
// Shared props: height, renderer, theme, palette, animated, loading, empty, error,
// events, onReady, onError, ref and native option overrides.
// Replace children to compose ChartCanvas/ChartLegend/ChartDataTable yourself.`,
  'area-chart': `import { AreaChart } from "@/components/ui/area-chart"

<AreaChart label="Monthly signups" stacked data={[{ id: "jan", label: "Jan", organic: 40, paid: 20 }, { id: "feb", label: "Feb", organic: 60, paid: 30 }]} series={[{ key: "organic", label: "Organic" }, { key: "paid", label: "Paid" }]} />`,
  'bar-chart': `import { BarChart } from "@/components/ui/bar-chart"

<BarChart label="Team capacity" horizontal data={[{ id: "design", label: "Design", hours: 32 }, { id: "engineering", label: "Engineering", hours: 48 }]} series={[{ key: "hours", label: "Hours" }]} showLabels />`,
  'pie-chart': `import { PieChart } from "@/components/ui/pie-chart"

<PieChart label="Traffic sources" donut data={[{ id: "direct", name: "Direct", value: 420 }, { id: "search", name: "Search", value: 320 }]} />
// Set donut={false} for a pie, rose for variable-radius sectors.`,
  'scatter-chart': `import { ScatterChart } from "@/components/ui/scatter-chart"

<ScatterChart label="Effort and impact" zoom series={[{ id: "projects", name: "Projects", data: [{ id: "a", name: "Launch", x: 12, y: 48, size: 20 }, { id: "b", name: "Refresh", x: 30, y: 62, size: 12 }] }]} />`,
  'radar-chart': `import { RadarChart } from "@/components/ui/radar-chart"

<RadarChart label="Team capabilities" indicators={[{ name: "Design", max: 100 }, { name: "Speed", max: 100 }, { name: "Quality", max: 100 }]} series={[{ id: "current", name: "Current", values: [82, 76, 94] }]} filled />`,
  'heatmap-chart': `import { HeatmapChart } from "@/components/ui/heatmap-chart"

<HeatmapChart label="Weekly activity" xCategories={["Mon", "Tue"]} yCategories={["Morning", "Evening"]} data={[{ id: "mon-am", x: "Mon", y: "Morning", value: 24 }, { id: "tue-pm", x: "Tue", y: "Evening", value: 68 }]} />`,
  'gauge-chart': `import { GaugeChart } from "@/components/ui/gauge-chart"

<GaugeChart label="Quarterly target" name="Goal completed" value={72} min={0} max={100} unit="%" />`,
  'rich-text-editor': `import { RichTextEditor, RichTextEditorToolbar, RichTextEditorContent, RichTextEditorStatus, type RichTextImageUploader } from "@/components/ui/rich-text-editor"
import { useState } from "react"

// Choose your own API, storage provider, authentication and access policy.
const uploadImage: RichTextImageUploader = async (file, { signal }) => {
  const body = new FormData()
  body.append("file", file)
  const response = await fetch("/api/images", { method: "POST", body, signal })
  if (!response.ok) throw new Error("Image upload failed")
  const { url } = await response.json()
  return { src: url, alt: file.name }
}

function ArticleEditor() {
  const [html, setHTML] = useState("<p>Start your story here.</p>")
  return <RichTextEditor value={html} onValueChange={setHTML} onImageUpload={uploadImage}
    maxImageSize={10 * 1024 * 1024} label="Article content">
    <RichTextEditorToolbar />
    <RichTextEditorContent className="text-base" />
    <RichTextEditorStatus />
  </RichTextEditor>
}
// Upload returns a URL; the image is inserted at the mapped cursor position.
// onContentChange receives { html, json, text }. Use onReady/useRichTextEditor for custom controls.
// Paste/drop and file picker share the same callback; report progress with onProgress(percent).
// Store the returned HTML/JSON yourself. Sanitize HTML server-side before public rendering.`,
  button: installationSnippets.buttonApp,
  'float-button': `import { FloatButton, BackTop } from "@/components/ui/float-button"\nimport { Plus } from "lucide-react"\n\n<FloatButton aria-label="New project" onClick={createProject}><Plus /></FloatButton>\n<BackTop />`,
  icon: `import { Icon } from "@/components/ui/icon"\nimport { Sparkles } from "lucide-react"\n\n<Icon icon={Sparkles} size={24} strokeWidth={1.5} aria-label="Featured" />`,
  typography: `import { Typography } from "@/components/ui/typography"\n\n<Typography as="h1">Make it meaningful.</Typography>\n<Typography muted>A little context.</Typography>\n<Typography copyable>Something worth sharing.</Typography>`,
  divider: `import { Divider } from "@/components/ui/divider"\n\n<Divider />\n<Divider orientation="vertical" />`,
  flex: `import { Flex } from "@/components/ui/flex"\n\n<Flex gap={16} wrap justify="space-between"><div>One</div><div>Two</div></Flex>`,
  grid: `import { Grid } from "@/components/ui/grid"\n\n<Grid minWidth={240} gap={16}>{cards}</Grid>`,
  layout: `import { Layout, LayoutHeader, LayoutSider, LayoutContent, LayoutFooter } from "@/components/ui/layout"\n\n<Layout>\n  <LayoutHeader>Workspace</LayoutHeader>\n  <div className="flex"><LayoutSider>{navigation}</LayoutSider><LayoutContent>{children}</LayoutContent></div>\n  <LayoutFooter>Made with care</LayoutFooter>\n</Layout>`,
  masonry: `import { Masonry } from "@/components/ui/masonry"\n\n<Masonry minWidth={220} gap={16}>{items}</Masonry>`,
  space: `import { Space } from "@/components/ui/space"\n\n<Space gap={12}>{actions}</Space>`,
  splitter: `import { Splitter, SplitterPanel, SplitterHandle } from "@/components/ui/splitter"\n\n<Splitter orientation="horizontal">\n  <SplitterPanel defaultSize="35%" minSize="20%">Navigation</SplitterPanel>\n  <SplitterHandle withHandle />\n  <SplitterPanel>Content</SplitterPanel>\n</Splitter>`,
  anchor: `import { Anchor } from "@/components/ui/anchor"\n\n<Anchor items={[{ href: "#introduction", title: "Introduction" }, { href: "#details", title: "Details" }]} />`,
  breadcrumb: `import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"\n\n<Breadcrumb><BreadcrumbList>\n  <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>\n  <BreadcrumbSeparator />\n  <BreadcrumbItem><BreadcrumbPage>Projects</BreadcrumbPage></BreadcrumbItem>\n</BreadcrumbList></Breadcrumb>`,
  dropdown: `import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown"\nimport { Button } from "@/components/ui/button"\n\n<DropdownMenu>\n  <DropdownMenuTrigger asChild><Button variant="outline">Actions</Button></DropdownMenuTrigger>\n  <DropdownMenuContent><DropdownMenuItem onClick={edit}>Edit project</DropdownMenuItem></DropdownMenuContent>\n</DropdownMenu>`,
  menu: `import { Menu } from "@/components/ui/menu"\n\n<Menu value={page} onValueChange={setPage} items={[{ key: "home", label: "Home" }, { key: "team", label: "Team", children: [{ key: "members", label: "Members" }] }]} />`,
  pagination: `import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext } from "@/components/ui/pagination"\n\n<Pagination><PaginationContent>\n  <PaginationItem><PaginationLink href="?page=1" isActive>1</PaginationLink></PaginationItem>\n  <PaginationItem><PaginationNext href="?page=2" /></PaginationItem>\n</PaginationContent></Pagination>`,
  steps: `import { Steps } from "@/components/ui/steps"\n\n<Steps current={step} onChange={setStep} items={[{ title: "Details" }, { title: "Review" }, { title: "Done" }]} />`,
  tabs: `import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"\n\n<Tabs defaultValue="overview">\n  <TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger></TabsList>\n  <TabsContent value="overview">The bigger picture.</TabsContent>\n  <TabsContent value="activity">Recent activity.</TabsContent>\n</Tabs>`,
  'auto-complete': `import { AutoComplete } from "@/components/ui/auto-complete"\n\n<AutoComplete options={["React", "Next.js", "Astro"]} value={value} onValueChange={setValue} placeholder="Start typing…" />`,
  cascader: `import { Cascader } from "@/components/ui/cascader"\n\n<Cascader options={[{ value: "asia", label: "Asia", children: [{ value: "id", label: "Indonesia", children: [{ value: "jkt", label: "Jakarta" }] }] }]} value={path} onValueChange={setPath} />`,
  checkbox: `import { Checkbox } from "@/components/ui/checkbox"\n\n<label><Checkbox checked={checked} onCheckedChange={setChecked} />Design with intention</label>\n<Checkbox checked="indeterminate" aria-label="Some items selected" />`,
  'color-picker': `import { ColorPicker } from "@/components/ui/color-picker"\n\n<ColorPicker value={color} onValueChange={setColor} presets={["#e66043", "#3b82f6", "#10b981"]} />`,
  'date-picker': `import { DatePicker, DateRangePicker } from "@/components/ui/date-picker"\n\n<DatePicker value={date} onValueChange={setDate} />\n<DateRangePicker value={range} onValueChange={setRange} />`,
  form: `import { useForm } from 'react-hook-form'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ProjectForm() {
  const form = useForm({ defaultValues: { name: '' } })
  return (
    <Form {...form}>
      <form className="space-y-4 p-8" onSubmit={form.handleSubmit(values => console.log(values))}>
        <FormField control={form.control} name="name" rules={{ required: 'Add a name' }} render={({ field }) => (
          <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <Button type="submit">Save</Button>
      </form>
    </Form>
  )
}
// Replace the submit callback with your own persistence.`,
  input: `import { Input } from "@/components/ui/input"\nimport { Textarea } from "@/components/ui/textarea"\n\n<Input placeholder="Your next big idea" value={value} onChange={e => setValue(e.target.value)} />\n<Input type="password" aria-label="Password" />\n<Textarea aria-label="Description" placeholder="A little more context…" />`,
  'input-number': `import { InputNumber } from "@/components/ui/input-number"\n\n<InputNumber value={quantity} onValueChange={setQuantity} min={0} max={100} step={0.5} />`,
  mentions: `import { Mentions } from "@/components/ui/mentions"\n\n<Mentions options={[{ value: "sarah", label: "Sarah Kim" }, { value: "alex", label: "Alex Morgan" }]} value={message} onValueChange={setMessage} />`,
  radio: `import { Radio, RadioItem } from "@/components/ui/radio"\n\n<Radio defaultValue="team" aria-label="Choose plan">\n  <label><RadioItem value="starter" />Starter</label>\n  <label><RadioItem value="team" />Team</label>\n</Radio>`,
  rate: `import { Rate } from "@/components/ui/rate"\n\n<Rate value={rating} onValueChange={setRating} count={5} />`,
  select: `import { Combobox } from "@/components/ui/combobox"\n\n<Combobox multiple options={[{ value: "react", label: "React" }, { value: "vite", label: "Vite" }]} value={selected} onValueChange={setSelected} />\n// Optional: loadOptions={async (query, signal) => fetchOptions(query, signal)}`,
  slider: `import { Slider } from "@/components/ui/slider"\n\n<Slider value={range} onValueChange={setRange} min={0} max={100} step={5} aria-label="Price range" />`,
  switch: `import { Switch } from "@/components/ui/switch"\n\n<label><Switch checked={enabled} onCheckedChange={setEnabled} />Email updates</label>`,
  'time-picker': `import { TimePicker } from "@/components/ui/time-picker"\n\n<TimePicker value={time} onValueChange={setTime} seconds min="09:00" max="18:00" />`,
  transfer: `import { Transfer } from "@/components/ui/transfer"\n\n<Transfer items={teams.map(team => ({ key: team.id, label: team.name }))} value={selected} onValueChange={setSelected} titles={["Available", "Selected"]} />`,
  'tree-select': `import { TreeSelect } from "@/components/ui/tree-select"\n\n<TreeSelect nodes={nodes} multiple value={checkedKeys} onValueChange={setCheckedKeys} />`,
  upload: `import { Upload } from "@/components/ui/upload"\n\n<Upload accept=".png,.jpg,.pdf" maxCount={5} maxSize={10 * 1024 * 1024} onFilesChange={setFiles} customRequest={async (file, signal) => {\n  const body = new FormData(); body.append("file", file)\n  const response = await fetch("/api/upload", { method: "POST", body, signal })\n  if (!response.ok) throw new Error("Upload failed")\n}} />`,
  avatar: `import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"\n\n<Avatar><AvatarImage src={person.image} alt={person.name} /><AvatarFallback>SK</AvatarFallback></Avatar>`,
  badge: `import { Badge } from "@/components/ui/badge"\n\n<Badge>New release</Badge>\n<Badge variant="secondary">In progress</Badge>\n<Badge variant="outline">Open source</Badge>`,
  calendar: `import { Calendar } from "@/components/ui/calendar"\n\n<Calendar mode="single" selected={date} onSelect={setDate} captionLayout="dropdown" className="rounded-xl border" />`,
  card: `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"\n\n<Card><CardHeader><CardTitle>A space for your ideas</CardTitle><CardDescription>Make something meaningful.</CardDescription></CardHeader>\n  <CardContent>{content}</CardContent><CardFooter>{actions}</CardFooter>\n</Card>`,
  carousel: `import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel"\n\n<Carousel><CarouselContent>{slides.map(slide => <CarouselItem key={slide.id}>{slide.content}</CarouselItem>)}</CarouselContent><CarouselPrevious /><CarouselNext /></Carousel>`,
  collapse: `import { Collapse, CollapseItem, CollapseTrigger, CollapseContent } from "@/components/ui/collapse"\n\n<Collapse type="single" collapsible><CollapseItem value="details"><CollapseTrigger>A little more detail</CollapseTrigger><CollapseContent>{details}</CollapseContent></CollapseItem></Collapse>`,
  descriptions: `import { Descriptions } from "@/components/ui/descriptions"\n\n<Descriptions title="Project details" columns={2} items={[{ key: "name", label: "Project", children: project.name }, { key: "owner", label: "Owner", children: project.owner }]} />`,
  empty: `import { Empty } from "@/components/ui/empty"\nimport { Button } from "@/components/ui/button"\n\n<Empty title="Room for something great" description="Start your first project."><Button onClick={create}>Create project</Button></Empty>`,
  image: `import { Image } from "@/components/ui/image"\n\n<Image src="/landscape.svg" alt="An illustrated landscape" preview />`,
  list: `import { List } from "@/components/ui/list"\n\n<List items={projects} getKey={p => p.id} renderItem={p => <span>{p.name}</span>} grid />`,
  popover: `import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"\nimport { Button } from "@/components/ui/button"\n\n<Popover><PopoverTrigger asChild><Button variant="outline">Settings</Button></PopoverTrigger><PopoverContent>{settings}</PopoverContent></Popover>`,
  'qr-code': `import { QRCode } from "@/components/ui/qr-code"\n\n<QRCode value="https://ui.shadcn.com" size={160} level="H" />`,
  segmented: `import { Segmented } from "@/components/ui/segmented"\n\n<Segmented value={view} onValueChange={setView} options={[{ value: "list", label: "List" }, { value: "grid", label: "Grid" }]} />`,
  statistic: `import { Statistic } from "@/components/ui/statistic"\n\n<Statistic title="Total revenue" value={24680} precision={2} prefix="$" trend={12.8} />`,
  table: `import { Table, type ColumnDef } from "@/components/ui/table"\n\ntype Project = { id: string; name: string; budget: number }\nconst columns: ColumnDef<Project>[] = [\n  { accessorKey: "name", header: "Project", meta: { editable: true } },\n  { accessorKey: "budget", header: "Budget", meta: { editable: true, inputType: "number" } },\n]\n\n<Table data={projects} columns={columns} getRowId={row => row.id} onDataChange={setProjects} />\n// Large data: virtual pagination={false} height={500}\n// Server state: tableOptions={{ manualPagination: true, rowCount, state: { pagination }, onPaginationChange }}`,
  tag: `import { Tag } from "@/components/ui/tag"\n\n<Tag color="green" onClose={remove}>Ready to build</Tag>\n<Tag color="purple" selected={selected} onSelectedChange={setSelected}>Selectable</Tag>`,
  timeline: `import { Timeline } from "@/components/ui/timeline"\n\n<Timeline items={[{ key: "start", title: "Project created", time: "9:00 AM", status: "complete" }, { key: "now", title: "Ready to build", status: "active" }]} />`,
  tooltip: `import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"\nimport { Button } from "@/components/ui/button"\n\n<TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="outline">Hover or focus</Button></TooltipTrigger><TooltipContent>A helpful little detail.</TooltipContent></Tooltip></TooltipProvider>`,
  tour: `import { Tour } from "@/components/ui/tour"\n\n<Tour open={open} onOpenChange={setOpen} steps={[{ title: "Welcome", description: "Your projects live here.", target: "#workspace" }, { title: "Ready to go", description: "Make it your own." }]} onFinish={finishOnboarding} />`,
  tree: `import { Tree, type TreeNode } from "@/components/ui/tree"\n\nconst nodes: TreeNode[] = [{ key: "root", label: "Workspace", children: [{ key: "file", label: "notes.md", isLeaf: true }] }]\n<Tree nodes={nodes} checkable value={keys} onValueChange={setKeys} defaultExpandedKeys={["root"]} />\n// Large trees: virtual height={400}\n// Async children: loadChildren={async key => { /* load then update nodes */ }}`,
  alert: `import { Alert } from "@/components/ui/alert"\n\n<Alert variant="success" title="Looking good!" closable>Your changes have been saved.</Alert>`,
  drawer: `import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"\nimport { Button } from "@/components/ui/button"\n\n<Sheet><SheetTrigger asChild><Button>Open drawer</Button></SheetTrigger><SheetContent side="right"><SheetHeader><SheetTitle>Project details</SheetTitle><SheetDescription>A little more context.</SheetDescription></SheetHeader>{content}</SheetContent></Sheet>\n// Import Drawer from ui/drawer for a swipeable bottom drawer.`,
  message: `import { message, MessageProvider } from '@/components/ui/message'
import { Button } from '@/components/ui/button'

export default function MessageExample() {
  return <main className="p-8">
    <MessageProvider />
    <Button onClick={() => message.success('Your changes are saved.')}>Show message</Button>
  </main>
}
// Mount one global MessageProvider for the global message API.
// AppProvider includes a global toast host; omit MessageProvider when using it.
// Inside AppProvider, useApp().message targets that application's scoped host.
// useMessage() returns [api, holder]; render holder to use a separate local scope.`,
  modal: `import { Modal, ModalTrigger, ModalContent, ModalHeader, ModalTitle, ModalDescription } from "@/components/ui/modal"\nimport { Button } from "@/components/ui/button"\n\n<Modal><ModalTrigger asChild><Button>Open modal</Button></ModalTrigger><ModalContent><ModalHeader><ModalTitle>A moment of focus</ModalTitle><ModalDescription>Give your next idea some space.</ModalDescription></ModalHeader>{content}</ModalContent></Modal>`,
  notification: `import { notification, NotificationProvider } from '@/components/ui/notification'
import { Button } from '@/components/ui/button'

export default function NotificationExample() {
  return <main className="p-8">
    <NotificationProvider />
    <Button onClick={() => notification('A little something new', {
      description: 'Sarah invited you to a workspace.',
    })}>Show notification</Button>
  </main>
}
// Mount one global toast host; omit NotificationProvider when AppProvider already supplies it.`,
  popconfirm: `import { Popconfirm } from "@/components/ui/popconfirm"\nimport { Button } from "@/components/ui/button"\n\n<Popconfirm title="Delete this project?" description="This action cannot be undone." onConfirm={remove} destructive><Button variant="destructive">Delete</Button></Popconfirm>`,
  progress: `import { Progress } from "@/components/ui/progress"\n\n<Progress value={64} aria-label="Project completion" />`,
  result: `import { Result } from "@/components/ui/result"\nimport { Button } from "@/components/ui/button"\n\n<Result status="success" title="You’re all set" description="Your project is ready."><Button onClick={openWorkspace}>Open workspace</Button></Result>`,
  skeleton: `import { Skeleton } from "@/components/ui/skeleton"\n\n<div className="flex gap-4"><Skeleton className="size-12 rounded-full" /><div className="flex-1 space-y-3"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-3 w-2/3" /></div></div>`,
  spin: `import { Spin } from "@/components/ui/spin"\n\n<Spin spinning={loading} label="Loading your workspace">{content}</Spin>`,
  watermark: `import { Watermark } from "@/components/ui/watermark"\n\n<Watermark text="ACME WORKSPACE">{content}</Watermark>`,
  affix: `import { Affix } from "@/components/ui/affix"\n\n<Affix offsetTop={20}>{actions}</Affix>`,
  app: installationSnippets.providerApp,
  'border-beam': `import { BorderBeam } from "@/components/ui/border-beam"\n\n<BorderBeam className="max-w-sm"><h3>Something worth noticing.</h3></BorderBeam>`,
  'config-provider': installationSnippets.configApp,
  util: `import { useState } from 'react'
import { useControllableState, useMediaQuery, useDebouncedValue, copyToClipboard } from '@/components/ui/util'

export default function UtilityExample() {
  const [value, setValue] = useControllableState({ defaultValue: '' })
  const desktop = useMediaQuery('(min-width: 768px)')
  const query = useDebouncedValue(value, 300)
  const [status, setStatus] = useState('')
  return <main className="space-y-4 p-8">
    <input aria-label="Search" value={value} onChange={event => setValue(event.target.value)} />
    <p>{desktop ? 'Wide layout' : 'Narrow layout'} · Debounced search: {query}</p>
    <button onClick={async () => {
      try { await copyToClipboard(query); setStatus('Copied') }
      catch { setStatus('Unable to copy') }
    }}>Copy search</button>
    <p role="status">{status}</p>
  </main>
}`,
  'layout-plus': `import { LayoutPlus } from "@/components/ui/layout-plus"\n\n<LayoutPlus logo="Acme" title="Overview" value={page} onNavigate={setPage} breadcrumb={["Workspace", "Overview"]} items={[{ key: "home", label: "Home" }, { key: "projects", label: "Projects" }]}>{children}</LayoutPlus>`,
  'form-plus': `import { FormPlus, FormPlusList, type FormPlusField } from "@/components/ui/form-plus"\n\nconst fields: FormPlusField[] = [\n  { name: "name", label: "Project name", required: true },\n  { name: "budget", label: "Budget", type: "money", rules: { min: { value: 0, message: "Use a positive budget" } } },\n]\n<FormPlus fields={fields} defaultValues={{ name: "", budget: 0, members: [] }} columns={2} onSubmit={save}>\n  <FormPlusList name="members" label="Members" fields={[{ name: "email", placeholder: "Member email" }]} defaultItem={{ email: "" }} />\n</FormPlus>\n// Add steps={["Details", "Review"]} and field.step for a wizard.\n// Compose inside Modal or Sheet for modal and drawer forms.\n// Pass resolver={zodResolver(schema)} for Zod validation.`,
  'table-plus': `import { TablePlus } from "@/components/ui/table-plus"\n\n<TablePlus title="Projects" columns={columns} getRowId={row => row.id} onCreate={createProject} request={async (params, signal) => {\n  const query = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize), keyword: params.keyword })\n  const response = await fetch("/api/projects?" + query, { signal })\n  if (!response.ok) throw new Error("Unable to load projects")\n  return response.json() // { data: Project[], total: number }\n}} />\n// params.sorting and params.filters contain the controlled column state.\n// Send them to your backend to implement server-side sorting/filtering.`,
  'descriptions-plus': `import { DescriptionsPlus } from "@/components/ui/descriptions-plus"\n\n<DescriptionsPlus record={person} onSave={savePerson} fields={[{ key: "name", label: "Name" }, { key: "budget", label: "Budget", type: "money" }, { key: "active", label: "Active", type: "switch" }]} />`,
  'list-plus': `import { ListPlus } from "@/components/ui/list-plus"\n\n<ListPlus items={projects} getKey={p => p.id} getSearchText={p => p.name} renderItem={p => <span>{p.name}</span>} onSelectionChange={setSelected} pageSize={5} />`,
  'editable-table-plus': `import { EditableTablePlus } from "@/components/ui/editable-table-plus"\n\n<EditableTablePlus value={projects} onValueChange={setProjects} columns={columns} getRowId={row => row.id} createRecord={() => ({ id: crypto.randomUUID(), name: "New project", budget: 0 })} />\n// Set column.meta = { editable: true, inputType: "number", validate: value => Number(value) < 0 ? "Use a positive value" : undefined }`,
  'card-plus': `import { CardPlus } from "@/components/ui/card-plus"\nimport { Statistic } from "@/components/ui/statistic"\n\n<CardPlus title="Revenue" description="This month, at a glance." collapsible footer="Updated just now"><Statistic title="Total revenue" value={24680} prefix="$" trend={12.8} /></CardPlus>`,
  'field-plus': `import { FieldPlus } from "@/components/ui/field-plus"\n\n<FieldPlus type="money" value={budget} currency="USD" mode="read" />\n<FieldPlus type="money" value={budget} onValueChange={setBudget} mode="edit" />`,
  'skeleton-plus': `import { SkeletonPlus } from "@/components/ui/skeleton-plus"\n\n<SkeletonPlus type="dashboard" rows={4} />\n// Also available: type="list" or type="form"`,
  'check-card-plus': `import { CheckCardPlus } from "@/components/ui/check-card-plus"\n\n<CheckCardPlus title="Team" description="Better things happen together." checked={selected} onCheckedChange={setSelected} />`,
}

examples.table += `

// Nested rows use a stable ID for every child and an explicit recursive edit callback.
type ProjectNode = Project & { children?: ProjectNode[] }
function updateNode(rows: ProjectNode[], id: string, column: string, value: unknown): ProjectNode[] {
  return rows.map(row => ({ ...row, ...(row.id === id ? { [column]: value } : {}),
    ...(row.children ? { children: updateNode(row.children, id, column, value) } : {}) }))
}
<Table<ProjectNode> data={tree} columns={columns} getRowId={row => row.id}
  getSubRows={row => row.children}
  onCellEdit={(row, column, value) => setTree(previous => updateNode(previous, row.id, column, value))}
  tableOptions={{ paginateExpandedRows: false }} />

// Or render arbitrary content beneath each expanded row.
<Table data={projects} columns={columns} getRowId={row => row.id}
  rowExpansion={row => <section aria-label={"Details for " + row.id}>
    <h3>{row.name}</h3><p>Budget: {row.budget}</p>
    <button onClick={() => openProject(row.id)}>Open project</button>
  </section>} />
// rowExpansion can return a second Table. Expanded content uses standard table layout.
// A custom Add child button appends a uniquely identified child to your own tree state.
`
examples['table-plus'] += `

// Table+ also accepts Table's tree, expansion and cell-edit props.
// Use onCellEdit to update nested records in your application state or service.
type ProjectNode = { id: string; name: string; children?: ProjectNode[] }
<TablePlus<ProjectNode> data={tree} columns={columns} getRowId={row => row.id}
  getSubRows={row => row.children}
  onCellEdit={(row, column, value) => saveChild(row.id, column, value)}
  tableOptions={{ paginateExpandedRows: false }} />
// Alternative: rowExpansion={row => <Table data={row.children ?? []}
//   columns={columns} getRowId={child => child.id} />}
// Playground: Nested rows, Row details and Nested table presets.
`
examples.skeleton += `\n// Wave is the default; pulse remains available.\n<Skeleton animation="pulse" className="h-4 w-40" />\n// animated={false} renders a static placeholder.`
examples['skeleton-plus'] +=
  `\n// All layout placeholders use wave by default.\n<SkeletonPlus type="table" animation="wave" />\n// Use animation="pulse" for pulsing placeholders, or animated={false} to stop motion.`
