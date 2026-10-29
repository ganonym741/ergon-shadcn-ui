export const examples: Record<string, string> = {
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
  button: `import { Button } from "@/components/ui/button"\n\n<Button onClick={save}>Save changes</Button>\n<Button variant="outline">Cancel</Button>`,
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
  form: `import { useForm } from "react-hook-form"\nimport { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"\nimport { Input } from "@/components/ui/input"\n\nconst form = useForm({ defaultValues: { name: "" } })\n\n<Form {...form}><form onSubmit={form.handleSubmit(save)}>\n  <FormField control={form.control} name="name" rules={{ required: "Add a name" }} render={({ field }) => (\n    <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>\n  )} />\n  <button type="submit">Save</button>\n</form></Form>`,
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
  message: `import { message, MessageProvider } from "@/components/ui/message"\n\n<MessageProvider /> // Mount once in your application.\nmessage.success("Your changes are saved.")\nmessage.promise(saveProject(), { loading: "Saving…", success: "Saved!", error: "Please try again." })`,
  modal: `import { Modal, ModalTrigger, ModalContent, ModalHeader, ModalTitle, ModalDescription } from "@/components/ui/modal"\nimport { Button } from "@/components/ui/button"\n\n<Modal><ModalTrigger asChild><Button>Open modal</Button></ModalTrigger><ModalContent><ModalHeader><ModalTitle>A moment of focus</ModalTitle><ModalDescription>Give your next idea some space.</ModalDescription></ModalHeader>{content}</ModalContent></Modal>`,
  notification: `import { notification, NotificationProvider } from "@/components/ui/notification"\n\n<NotificationProvider /> // Mount once.\nnotification("A little something new", { description: "Sarah invited you to a workspace.", action: { label: "View invite", onClick: viewInvite } })`,
  popconfirm: `import { Popconfirm } from "@/components/ui/popconfirm"\nimport { Button } from "@/components/ui/button"\n\n<Popconfirm title="Delete this project?" description="This action cannot be undone." onConfirm={remove} destructive><Button variant="destructive">Delete</Button></Popconfirm>`,
  progress: `import { Progress } from "@/components/ui/progress"\n\n<Progress value={64} aria-label="Project completion" />`,
  result: `import { Result } from "@/components/ui/result"\nimport { Button } from "@/components/ui/button"\n\n<Result status="success" title="You’re all set" description="Your project is ready."><Button onClick={openWorkspace}>Open workspace</Button></Result>`,
  skeleton: `import { Skeleton } from "@/components/ui/skeleton"\n\n<div className="flex gap-4"><Skeleton className="size-12 rounded-full" /><div className="flex-1 space-y-3"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-3 w-2/3" /></div></div>`,
  spin: `import { Spin } from "@/components/ui/spin"\n\n<Spin spinning={loading} label="Loading your workspace">{content}</Spin>`,
  watermark: `import { Watermark } from "@/components/ui/watermark"\n\n<Watermark text="ACME WORKSPACE">{content}</Watermark>`,
  affix: `import { Affix } from "@/components/ui/affix"\n\n<Affix offsetTop={20}>{actions}</Affix>`,
  app: `import { AppProvider } from "@/components/ui/app"\n\n<AppProvider density="comfortable" direction="ltr" locale="en-US">{children}</AppProvider>`,
  'border-beam': `import { BorderBeam } from "@/components/ui/border-beam"\n\n<BorderBeam className="max-w-sm"><h3>Something worth noticing.</h3></BorderBeam>`,
  'config-provider': `import { ConfigProvider } from "@/components/ui/config-provider"\n\n<ConfigProvider accent="#e66043" radius={10} density="compact" direction="ltr" locale="en-US">{children}</ConfigProvider>`,
  util: `import { useControllableState, useMediaQuery, useDebouncedValue, copyToClipboard } from "@/components/ui/util"\n\nconst [value, setValue] = useControllableState({ value: props.value, defaultValue: "", onChange: props.onChange })\nconst desktop = useMediaQuery("(min-width: 768px)")\nconst query = useDebouncedValue(search, 300)\nawait copyToClipboard("Something worth sharing")`,
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
