export interface Coverage {
  implemented: string[]
  notes: string[]
}
export const coverage: Record<string, Coverage> = {
  kanban: {
    implemented: [
      'Controlled column/card state, pointer/touch/keyboard sorting, card and column reorder callbacks',
      'Work-in-progress limits, disabled/read-only items and explicit keyboard move forms',
      'Named board/column/card/action parts and custom card rendering',
    ],
    notes: [
      'Application code owns persistence. Card IDs are unique across the board; column IDs are unique within it.',
    ],
  },
  'calendar-plus': {
    implemented: [
      'Month/week/day/agenda views, overlapping events, navigation and date-range selection',
      'Pointer move/resize, keyboard event editing, create/delete actions and typed callbacks',
      'Controlled events/view/date, custom event rendering and scoped theme tokens',
    ],
    notes: [
      'Uses matching FullCalendar 6.1.22 free plugins. No premium resource scheduler is bundled. All-day event end dates are exclusive in the API; the editor shows an inclusive last day. Persistence belongs to application callbacks.',
    ],
  },
  'gantt-chart': {
    implemented: [
      'Date-only tasks, groups, milestones, progress and finish-to-start dependency arrows',
      'Dependency/parent cycle validation, conflict reporting, group collapse and controlled task editing',
      'Modular custom ECharts series, lazy Canvas/zoom, readable task table and keyboard controls',
    ],
    notes: [
      'Dates are UTC YYYY-MM-DD keys and task end dates are inclusive. Group ranges are application-supplied. Conflicts are reported without automatic rescheduling. Dependency arrows connect visible tasks. Up to 2,000 tasks and 10,000 dependency edges are accepted.',
    ],
  },
  'filter-builder': {
    implemented: [
      'Serializable typed AND/OR/NOT trees, nested groups and rule reorder/remove/reset controls',
      'Text, number, date, boolean and select editors with supported operator validation',
      'Pure bounded query validator/evaluator and application-defined value editors',
    ],
    notes: [
      'The AST is not SQL or backend query text. Translate it in application code; the example filters local sample records.',
    ],
  },
  'file-browser': {
    implemented: [
      'Folder breadcrumbs, grid/list views, search, sorting, pagination and multi/range selection',
      'Injected create/rename/move/delete/upload/download operations with cancellation, pending and error states',
      'Stable ID/parent validation, descendant-safe moves, details dialogs and custom previews',
    ],
    notes: [
      'Entries and persistence are application-owned. The playground uses explicitly simulated in-memory operations. No production storage provider or local filesystem access is assumed.',
    ],
  },
  'image-cropper': {
    implemented: [
      'Pointer/touch/keyboard crop, zoom/rotation, aspect presets and circular crops',
      'Bounded canvas Blob export as PNG/JPEG/WebP, local preview/download and imperative export handle',
      'Custom async onImageUpload callback with AbortSignal, loading/error states and object URL cleanup',
    ],
    notes: [
      'Remote images must permit cross-origin canvas access. Upload callbacks return a browser-displayable URL. The playground upload callback is simulated; output is limited to 16 million pixels.',
    ],
  },
  'command-palette': {
    implemented: [
      'Grouped searchable commands, nested navigation, shortcuts and disabled actions',
      'Abortable async search/actions, retry and pending/error feedback',
      'Composable trigger/content/item parts, keyboard navigation and focus restoration',
    ],
    notes: [
      'Default Ctrl/Command+K shortcut ignores editable fields unless enableInInputs is set. Navigation and persistence are supplied through action callbacks.',
    ],
  },
  'tags-input': {
    implemented: [
      'Controlled tags, bulk paste/separators, suggestions, duplicate/maximum rules and custom validation',
      'Abortable async suggestions, IME-safe creation and form values',
      'Keyboard chip navigation/removal/reordering and named tag parts',
    ],
    notes: [
      'Suggestions are local or injected callbacks. Search and validation failures are announced.',
    ],
  },
  'phone-input': {
    implemented: [
      'Searchable localized countries and calling codes, country restrictions and national/international display',
      'Maintained international parsing, E.164 output, extension metadata and possible/strict validation',
      'Controlled values/countries, caret-preserving editing, blur formatting and hidden form value',
    ],
    notes: [
      'Uses libphonenumber-js/max metadata. Number validation does not verify ownership or whether a number is reachable. Form values are parsed numbers when available; inspect validity before submission.',
    ],
  },
  'json-viewer': {
    implemented: [
      'Expandable keyboard tree, search, copy path/value, pagination and controlled expansion',
      'Cycles, BigInt, Map/Set, Date and getter-safe inspection',
      'Bounded nodes/depth/string display and custom value rendering',
    ],
    notes: [
      'Copy uses an extended, bounded JSON representation: cycles/getters and unsupported values receive explicit placeholders. This is an inspector, not a lossless arbitrary JavaScript serializer.',
    ],
  },
  'code-block': {
    implemented: [
      'Grammar-specific lazy Shiki highlighting with dual themes and plain-text fallback',
      'Line numbering, emphasized lines, wrapping, copy and local download',
      'Composable header/content and bounded highlighting work',
    ],
    notes: [
      'Includes text, JavaScript/JSX, TypeScript/TSX, JSON, CSS, HTML, Markdown, Bash, YAML, SQL and Python. Source is rendered as escaped React text. Large content skips highlighting.',
    ],
  },
  'diff-viewer': {
    implemented: [
      'Bounded asynchronous line diff with stale-result suppression and configurable whitespace handling',
      'Split/inline layouts, aligned line numbers, word emphasis and expandable unchanged context',
      'Change counts, copy actions and composable toolbar/content',
    ],
    notes: [
      'Input/line/edit/time limits are explicit. Work-limit failures show a message rather than an inaccurate diff. A running jsdiff calculation is time-bounded; obsolete results are discarded.',
    ],
  },
  'organization-chart': {
    implemented: [
      'Validated flat hierarchies, vertical/horizontal connectors and custom person cards',
      'Controlled collapse/selection, keyboard tree navigation and disabled nodes',
      'Background pointer/touch pan plus keyboard/button zoom, fit and expand/collapse controls',
    ],
    notes: [
      'Hierarchy size and depth are bounded; this component does not virtualize nodes or edit reporting relationships.',
    ],
  },
  'media-player': {
    implemented: [
      'Native audio/video with custom composable controls and optional native-control fallback',
      'Playback, bounded seeking, buffering, volume/mute/rate, captions and error handling',
      'Controlled audio settings, imperative media handle and supported fullscreen/picture-in-picture actions',
    ],
    notes: [
      'Formats/codecs, autoplay, fullscreen, PiP and remote track support depend on the browser. No adaptive-streaming engine or media hosting service is included.',
    ],
  },
  'map-chart': {
    implemented: [
      'Application-supplied GeoJSON and region values with stable IDs',
      'Pan/zoom with viewport retention, pointer/keyboard region selection, callbacks and value colors',
      'SVG/Canvas, accessible data table, loading/error states and export',
    ],
    notes: [
      'GeoJSON is supplied by the application and registered with its stable mapName. Map assets are not installed with this component. Playground values are local samples; world boundaries are Natural Earth public-domain data.',
    ],
  },
  'boxplot-chart': {
    implemented: [
      'Five-number summaries, optional outliers and raw-observation statistics helper',
      'Horizontal/vertical layout, zoom, tooltip and readable statistics table',
      'Configurable composition, theme, renderer, palette and native options',
    ],
    notes: [
      'calculateBoxplotStatistics uses interpolated quartiles and a configurable IQR whisker multiplier; supplied observations are not mutated.',
    ],
  },
  'calendar-heatmap-chart': {
    implemented: [
      'Daily values across a year, month, date or explicit date range',
      'Horizontal/vertical calendar, localized day/month labels and first weekday',
      'Color scale, readable data table and scrollable minimum cell size',
    ],
    notes: [
      'Dates use YYYY-MM-DD calendar keys. Supply one aggregated value per date; ranges filter the displayed data.',
    ],
  },
  'combo-chart': {
    implemented: [
      'Mixed bar, line and area series with stable IDs',
      'Named multiple value axes, per-series axis mapping, units and stacking groups',
      'Legend, data zoom, labels, data table and native option overrides',
    ],
    notes: [],
  },
  'sankey-chart': {
    implemented: [
      'Weighted node/link flows with stable IDs and labels',
      'Horizontal/vertical orientation, node alignment, spacing, dragging and adjacency emphasis',
      'Cycle and link validation, accessible edge table and native overrides',
    ],
    notes: ['Sankey flows must form a directed acyclic graph with finite, nonnegative weights.'],
  },
  'candlestick-chart': {
    implemented: [
      'Typed OHLC observations with linked price/volume panels',
      'Configurable moving averages, bullish/bearish colors and linked data zoom',
      'Pointer brush and keyboard range controls, selection callbacks and readable OHLC table',
    ],
    notes: [
      'Examples use simulated market observations. Canvas, zoom and brush modules load on demand.',
    ],
  },
  chart: {
    implemented: [
      'Composable ECharts canvas, header, legend and data-table parts with typed options and imperative handle',
      'SVG/Canvas renderers, automatic resize/disposal, light/dark themes and custom palettes',
      'Typed click, legend and zoom events; native option overrides and extension module registration',
      'Loading, empty and error states; image export; reduced-motion-aware default animations',
    ],
    notes: [
      'The base includes SVG and accessibility support; chart entries register their own series and required components. Pass modules or use registerChartModules for custom series/features. Canvas and data zoom load on demand. The React wrapper renders in the browser.',
    ],
  },
  'line-chart': {
    implemented: [
      'Multiple line series with smooth or straight interpolation, missing values and stable IDs',
      'Stacking, horizontal orientation, labels, tooltips, grid and data zoom',
      'Keyboard-operable legend, readable data table and shared Chart configuration',
    ],
    notes: [],
  },
  'area-chart': {
    implemented: [
      'Filled line series with smooth curves and configurable stacking',
      'Horizontal orientation, labels, tooltips and data zoom',
      'Keyboard-operable legend, readable data table and native ECharts overrides',
    ],
    notes: [],
  },
  'bar-chart': {
    implemented: [
      'Grouped/stacked bars and horizontal orientation',
      'Labels, tooltips, grid, zoom and per-series colors',
      'Keyboard-operable legend, readable data table and native ECharts overrides',
    ],
    notes: [],
  },
  'pie-chart': {
    implemented: [
      'Pie, donut and rose layouts with per-slice colors',
      'Slice labels, hover tooltips and keyboard-operable legend',
      'Readable data table and shared Chart configuration',
    ],
    notes: [],
  },
  'scatter-chart': {
    implemented: [
      'Multiple scatter series with named points and variable bubble sizes',
      'Tooltips, grid and data zoom',
      'Keyboard-operable legend and readable data table',
    ],
    notes: [],
  },
  'radar-chart': {
    implemented: [
      'Named indicators and comparison series with custom axis limits',
      'Polygon/circular grids and optional filled areas',
      'Tooltips, keyboard-operable legend and readable data table',
    ],
    notes: [],
  },
  'heatmap-chart': {
    implemented: [
      'Categorical matrix with stable point IDs and configurable value range',
      'Interactive visual-map range, cell labels and tooltips',
      'Readable data table and native ECharts overrides',
    ],
    notes: [],
  },
  'gauge-chart': {
    implemented: [
      'Gauge value, range, unit and label with optional pointer',
      'Animated progress arc, loading/error states and image export',
      'Readable data table and native ECharts overrides',
    ],
    notes: [],
  },
  'rich-text-editor': {
    implemented: [
      'Composable, typed Tiptap editor with controlled HTML and HTML/JSON/text change callbacks',
      'Headings, marks, lists, links, alignment, color, fonts, tables, undo and redo',
      'Images inserted at the selection by file picker, paste, drop or URL; alt text, title, width and alignment',
      'Application-supplied uploads with progress, cancellation, validation and position tracking during edits',
      'Read-only/disabled states and custom toolbar/content/status composition',
    ],
    notes: [
      'Storage and authentication belong to the onImageUpload callback. The local playground creates temporary object URLs; the custom endpoint receives multipart file and returns { url } or { src }. Sanitize saved HTML on your server according to your application’s policy.',
    ],
  },
  button: {
    implemented: [
      'Variants, sizes, icons, loading, disabled, links via asChild',
      'Soft, success, warning, dashed and destructive treatments',
    ],
    notes: [],
  },
  'float-button': {
    implemented: [
      'Floating actions',
      'Back-to-top',
      'Custom placement and grouping by composition',
      'Automatic scroll visibility threshold',
      'Expandable action groups',
    ],
    notes: [],
  },
  icon: {
    implemented: [
      'Lucide icon surface',
      'Size, stroke, color, and accessible labels',
      'Custom icon sprite registry',
    ],
    notes: [],
  },
  typography: {
    implemented: [
      'Heading, paragraph, code, and quote hierarchy',
      'Copyable and editable text',
      'Multi-line ellipsis',
      'Expandable ellipsis and tooltips',
      'Advanced edit triggers',
    ],
    notes: [],
  },
  divider: {
    implemented: [
      'Horizontal and vertical separators',
      'Decorative and semantic modes',
      'Inline title composition preset',
    ],
    notes: [],
  },
  flex: {
    implemented: [
      'Axis, alignment, distribution, gap and wrapping',
      'Native style and class overrides',
      'Named responsive prop presets',
    ],
    notes: [],
  },
  grid: {
    implemented: [
      'Responsive auto-fit grid',
      'Minimum column width and gap',
      '24-column span/offset/order API',
    ],
    notes: [],
  },
  layout: {
    implemented: [
      'Header, sider, content and footer',
      'Composable nested layout',
      'Core sider collapse/breakpoint API (use Layout+ for responsive navigation)',
    ],
    notes: [],
  },
  'layout-plus': {
    implemented: [
      'Responsive application shell with collapse and nested navigation',
      'Route adapter, permission predicate, breadcrumbs, actions and footer',
      'Workspace tabs and scoped appearance settings',
    ],
    notes: ['Routing and permissions are supplied through explicit adapters and predicates.'],
  },
  masonry: {
    implemented: [
      'CSS masonry columns',
      'Configurable column width and spacing',
      'Measured row-order masonry',
      'Virtual masonry',
    ],
    notes: [],
  },
  space: {
    implemented: [
      'Wrapping and directional spacing',
      'Alignment and gap controls',
      'Compact joined-control spacing preset',
    ],
    notes: [],
  },
  splitter: {
    implemented: [
      'Resizable horizontal/vertical panels',
      'Minimum/maximum constraints',
      'Keyboard separators and handles',
      'Persisted panel layout recipe',
    ],
    notes: [],
  },
  anchor: {
    implemented: [
      'Nested anchor links',
      'Offset-aware section scrolling',
      'Window and nested scroll containers',
      'Scrollspy active tracking',
      'Horizontal anchor preset',
    ],
    notes: [],
  },
  breadcrumb: {
    implemented: [
      'Composable links, separators and current page',
      'Ellipsis and custom separators',
      'Route-derived item helper',
    ],
    notes: [],
  },
  dropdown: {
    implemented: [
      'Accessible menus, nested submenus, groups',
      'Checkbox and radio items',
      'Shortcuts, placement and keyboard navigation',
      'Context-menu trigger recipe',
    ],
    notes: [],
  },
  menu: {
    implemented: [
      'Nested navigation, icons and disabled items',
      'Controlled selected destination',
      'Horizontal and collapsed menu modes',
      'Keyboard arrow roving',
    ],
    notes: [],
  },
  pagination: {
    implemented: [
      'Composable page links, previous/next, ellipsis',
      'Active state and accessible navigation',
      'Quick-jump/page-size convenience wrapper',
    ],
    notes: [],
  },
  steps: {
    implemented: [
      'Controlled step navigation',
      'Horizontal/vertical',
      'Responsive layout based on available component width',
      'Descriptions and disabled steps',
      'Error/wait/status variants',
      'Custom step icons',
    ],
    notes: [],
  },
  tabs: {
    implemented: [
      'Controlled/uncontrolled tabs',
      'Keyboard navigation',
      'Independent parts and orientations',
      'Overflow tab navigation',
      'Closable/reorderable tabs',
    ],
    notes: [],
  },
  'auto-complete': {
    implemented: [
      'Editable free text with accessible suggestion popover',
      'Cancellable asynchronous sources and custom option rendering',
      'Keyboard navigation and automatic virtual rendering for large sources',
    ],
    notes: [],
  },
  cascader: {
    implemented: [
      'Hierarchical columns and controlled paths',
      'Search over loaded paths',
      'Async children with cancellation',
      'Change-on-select',
      'Search across unloaded remote branches',
      'Multi-path checkbox selection',
    ],
    notes: [],
  },
  checkbox: {
    implemented: [
      'Controlled/uncontrolled checks',
      'Indeterminate and disabled states',
      'Native form support',
      'Convenience data-driven group wrapper',
    ],
    notes: [],
  },
  'check-card-plus': {
    implemented: [
      'Controlled checkbox-card selection',
      'Icons, descriptions and disabled state',
      'Group-level min/max and single-selection helpers',
    ],
    notes: [],
  },
  'color-picker': {
    implemented: [
      'Native solid color selection',
      'Hex/RGB display and hex editing',
      'Opacity and preset swatches',
      'Two-stop gradient composition',
      'HSB/HSL editing',
      'Arbitrary gradient stops',
    ],
    notes: [],
  },
  'date-picker': {
    implemented: [
      'Single, multiple, range, month, year, week and quarter selection',
      'Local and zoned date-time inputs and date-time range popover',
      'IANA time-zone adapter with daylight-saving validation; locale-aware calendars and formatting',
    ],
    notes: [
      'Repeated daylight-saving wall times resolve to the earlier instant. Nonexistent wall times are rejected.',
    ],
  },
  form: {
    implemented: [
      'Accessible compound form parts and React Hook Form integration',
      'Typed schema composition and asynchronous validation',
      'Conditional fields, dependent remote options, repeatable arrays and scroll to invalid fields',
    ],
    notes: [],
  },
  'form-plus': {
    implemented: [
      'Typed fields, conditional visibility, validation and repeatable lists',
      'Asynchronous dependent options with cancellation and invalidation',
      'Steps, modal, drawer, query, compact filter and login compositions',
    ],
    notes: [],
  },
  'field-plus': {
    implemented: [
      'Read and edit modes with localized money and percent values',
      'Text, textarea, password, number, date, date-time, time, select, switch, checkbox, rate and color',
      'Date/date-time ranges, upload, slider, radio, checkbox groups and tree selection',
    ],
    notes: [],
  },
  input: {
    implemented: [
      'Text, search and password input composition',
      'Textarea',
      'Native props, validation and disabled states',
      'OTP group',
      'Password visibility toggle',
      'Clear/count convenience controls',
    ],
    notes: [],
  },
  'input-number': {
    implemented: [
      'Controlled/uncontrolled numbers',
      'Decimal stepping',
      'Min/max clamping',
      'Accessible increment/decrement',
      'Localized formatting/parsing',
      'High-precision decimal string mode',
    ],
    notes: [],
  },
  mentions: {
    implemented: [
      'Caret-aware @ suggestions',
      'Keyboard navigation',
      'Multiple mention insertion',
      'Controlled text',
      'Configurable triggers',
      'Async mention sources',
    ],
    notes: [],
  },
  radio: {
    implemented: [
      'Controlled/uncontrolled radio groups',
      'Keyboard roving',
      'Disabled states and native form behavior',
      'Button-style group convenience preset',
    ],
    notes: [],
  },
  rate: {
    implemented: [
      'Controlled/uncontrolled star rating',
      'Half-star pointer and keyboard steps',
      'Hover feedback and clear behavior',
      'Custom character/icon rendering',
    ],
    notes: [],
  },
  select: {
    implemented: [
      'Standard Radix Select parts',
      'Searchable single/multiple Combobox',
      'Async loading with cancellation',
      'Automatic virtual options above 100 items',
      'Keyboard navigation',
      'Free-form tag creation',
      'Custom option/label rendering',
    ],
    notes: [],
  },
  slider: {
    implemented: [
      'Single and multi-thumb range',
      'Steps, bounds and orientation',
      'Keyboard and controlled state',
      'Tooltip value bubbles',
      'Labeled marks convenience API',
    ],
    notes: [],
  },
  switch: {
    implemented: [
      'Controlled/uncontrolled toggle',
      'Keyboard and native form support',
      'Disabled state',
      'Inline checked/unchecked label preset',
    ],
    notes: [],
  },
  'time-picker': {
    implemented: [
      'Native time input',
      'Optional seconds, constraints and disabled state',
      'Custom scroll-panel time picker',
      'Time ranges and 12-hour presets',
    ],
    notes: [],
  },
  transfer: {
    implemented: [
      'Searchable dual lists',
      'Selection and select-all',
      'Virtual items above 100 rows',
      'Optional pagination and custom item rendering',
      'Custom filter function',
      'Drag-transfer interaction',
    ],
    notes: [],
  },
  'tree-select': {
    implemented: [
      'Single/multiple tree selection',
      'Search with ancestor preservation',
      'Clear action and controlled keys',
      'Async/virtual tree-select plumbing',
      'Tag overflow summary',
    ],
    notes: [],
  },
  upload: {
    implemented: [
      'Dropzone and native file chooser',
      'Type, size and count validation',
      'Cancellable custom requests',
      'Progress, retry and image thumbnails',
      'Directory input',
      'Image crop integration',
      'Controlled upload-file list',
      'Paste upload',
    ],
    notes: [
      'ImageCropUpload composes crop-before-upload. File requests and persistence are supplied by your application.',
    ],
  },
  avatar: {
    implemented: [
      'Image loading and fallback',
      'Custom sizes and group composition',
      'Overflow-count group helper',
      'Automatic text scaling',
    ],
    notes: [],
  },
  badge: {
    implemented: [
      'Status/treatment variants',
      'Count overflow and dot badges',
      'Processing status indicator',
      'Ribbon composition preset',
    ],
    notes: [],
  },
  calendar: {
    implemented: [
      'Single/range/multiple selection through Day Picker',
      'Month/year navigation and locale props',
      'EventCalendar dots and agenda',
      'Full-size month/year event grid',
    ],
    notes: [],
  },
  card: {
    implemented: [
      'Header, description, content and footer',
      'Slots and style overrides',
      'Metadata/cover/grid convenience presets',
    ],
    notes: [],
  },
  'card-plus': {
    implemented: [
      'Header, description, extra and footer',
      'Collapsible content',
      'Grid/split layouts by composition',
      'Tabbed/checked card group convenience API',
    ],
    notes: [],
  },
  carousel: {
    implemented: [
      'Swipe and keyboard navigation',
      'Loop/axis options',
      'Previous/next composition and API access',
      'Autoplay and dot pagination preset',
    ],
    notes: [],
  },
  collapse: {
    implemented: [
      'Single/multiple accordions',
      'Controlled expansion',
      'Keyboard navigation and independent parts',
      'Borderless/ghost variant presets',
    ],
    notes: [],
  },
  descriptions: {
    implemented: [
      'Responsive key/value composition',
      'Column count and spanning items',
      'Bordered layout',
      'Horizontal label/content grid preset',
    ],
    notes: [],
  },
  'descriptions-plus': {
    implemented: [
      'Schema-driven formatting',
      'Record editing with async save',
      'Failure state and cancellation',
      'Remote request helper',
      'Per-field save and validation',
    ],
    notes: [],
  },
  empty: {
    implemented: [
      'Custom icon, title, description and action content',
      'Bundled illustration variations',
    ],
    notes: [],
  },
  image: {
    implemented: [
      'Image preview and zoom',
      'Gallery keyboard navigation',
      'Gallery rotation and index',
      'Custom thumbnails',
      'Preview error/loading and image download controls',
    ],
    notes: [],
  },
  list: {
    implemented: [
      'Typed collections with stable item keys and custom rendering',
      'List and responsive grid layouts with empty states',
      'Measured virtualization and incremental loading',
    ],
    notes: [],
  },
  'list-plus': {
    implemented: [
      'Typed searchable list/grid with selection and pagination',
      'Cancellable remote requests, loading, errors and retry',
      'Measured virtual rendering and incremental local/remote loading',
    ],
    notes: ['Connect the cancellable request callback to your own service.'],
  },
  popover: {
    implemented: [
      'Controlled overlays, placement and alignment',
      'Keyboard dismissal',
      'Accessible focus and anchor composition',
    ],
    notes: [],
  },
  'qr-code': {
    implemented: [
      'SVG rendering and error-correction levels',
      'Custom colors and size',
      'Loading/expired/scanned status',
      'Refresh and SVG download',
      'PNG export',
      'Center icon overlay preset',
    ],
    notes: [],
  },
  segmented: {
    implemented: [
      'Controlled/uncontrolled selection',
      'Disabled items',
      'Roving keyboard selection and custom labels',
      'Vertical layout preset',
    ],
    notes: [],
  },
  statistic: {
    implemented: [
      'Locale-aware numeric formatting',
      'Prefixes, suffixes, precision and trend',
      'Countdown/timer and count-up animation',
    ],
    notes: [],
  },
  table: {
    implemented: [
      'Search, per-column filters, multi-sort, pagination and stable-key selection',
      'Grouped headers, grouping, nested records, expansion and summaries',
      'Pinned, resizable, reorderable columns; drag and keyboard row reordering',
      'Inline edits and validation, CSV export and persisted column views',
      'Native merged row/column spans and two-axis virtualization',
      'Playground presets for editable children/grandchildren, custom row details and nested child tables',
    ],
    notes: [
      'Use stable row IDs for persistent selection, reorder and edits.',
      'Cell merging uses native table layout; virtualization mounts visible rows and columns.',
      'Add child is a custom playground action that updates consumer-owned data; use getSubRows, rowExpansion and onCellEdit in your application.',
    ],
  },
  'table-plus': {
    implemented: [
      'Cancellable server requests, debounced search, server pagination, sorting and filters',
      'Schema query forms, local or server-backed named views and column preferences',
      'Selection across server pages, cached selected records and asynchronous batch actions',
      'Nested child rows, custom expansion content, nested child tables and child editing playground presets',
    ],
    notes: [
      'Connect request, saved-view and batch callbacks to your own service. Use stable IDs across pages.',
    ],
  },
  'editable-table-plus': {
    implemented: [
      'Controlled record insertion, deletion and inline editing',
      'Per-row save/cancel, batch field editing and complete transaction cancellation',
      'Asynchronous commits, row validation and optimistic rollback on failure',
    ],
    notes: [
      'Use stable IDs for transactions. onCommit receives the next record set, mutations and an AbortSignal.',
    ],
  },
  tag: {
    implemented: [
      'Color treatments',
      'Close action',
      'Controlled selectable tags',
      'Icon-only convenience preset',
    ],
    notes: [],
  },
  timeline: {
    implemented: [
      'Statuses, custom icons, timestamps and reverse order',
      'Alternating/horizontal layout presets',
    ],
    notes: [],
  },
  tooltip: {
    implemented: [
      'Accessible hover/focus content',
      'Delayed triggers and placement',
      'Controlled/uncontrolled state',
    ],
    notes: [],
  },
  tour: {
    implemented: [
      'Step navigation and skip/finish',
      'Target-anchored popovers',
      'Target spotlight with scroll/resize updates',
      'Centered fallback and keyboard dismissal',
      'Animated target transitions',
      'Cross-route walkthroughs',
    ],
    notes: ['beforeEnter can await navigation or target preparation before each step.'],
  },
  tree: {
    implemented: [
      'Controlled checking and expansion',
      'Descendant propagation and mixed parents',
      'Keyboard traversal',
      'Virtual rows and async children',
      'Cycle/disabled drop guards with external mutation callback',
      'Drag placement/reordering UI',
    ],
    notes: [],
  },
  alert: {
    implemented: [
      'Info, success, warning and error treatments',
      'Optional dismissal',
      'Accessible status/alert roles',
      'Banner/rolling alert presets',
    ],
    notes: [],
  },
  drawer: {
    implemented: [
      'Radix side sheet and swipeable Vaul bottom drawer',
      'Placement, focus, keyboard dismissal',
      'Compound parts and controlled state',
      'Nested/push drawer recipes',
    ],
    notes: [],
  },
  message: {
    implemented: [
      'Success/error/info/warning toasts',
      'Promise states, duration and dismissal',
      'Standalone provider',
      'Scoped instance/context helpers',
    ],
    notes: [],
  },
  modal: {
    implemented: [
      'Accessible dialog compound parts',
      'Controlled/uncontrolled open state',
      'Focus trapping and keyboard dismissal',
      'Draggable/resizable modal recipe',
      'Static confirm helper',
    ],
    notes: [],
  },
  notification: {
    implemented: [
      'Rich toasts, descriptions and actions',
      'Duration, close, placement and promise support',
      'Notification stacking configuration gallery',
    ],
    notes: [],
  },
  popconfirm: {
    implemented: [
      'Accessible confirmation dialog',
      'Custom labels through lower-level parts',
      'Destructive treatment',
      'Anchored popover confirmation preset',
    ],
    notes: [],
  },
  progress: {
    implemented: [
      'Progress bar with statuses',
      'SVG circle and discrete step variants',
      'Controlled values',
      'Dashboard arc variant',
      'Multiple success segments',
    ],
    notes: [],
  },
  result: {
    implemented: [
      'Success/error/info/warning outcomes',
      'Title, description and action content',
      'HTTP error-code illustrations',
    ],
    notes: [],
  },
  skeleton: {
    implemented: [
      'Composable block/text/avatar placeholders',
      'Shape/size overrides',
      'Preset skeleton buttons, inputs and images',
      'Default wave animation with optional pulse and animation toggle',
    ],
    notes: [],
  },
  'skeleton-plus': {
    implemented: [
      'Dashboard, list and form presets',
      'Configurable row count',
      'Chart/table-specific loading layouts',
      'Default wave or optional pulse across every placeholder, with animation toggle and reduced-motion support',
    ],
    notes: [],
  },
  spin: {
    implemented: [
      'Standalone loading status',
      'Content overlay with aria-busy',
      'Delayed/minimum-duration spinner helper',
    ],
    notes: [],
  },
  watermark: {
    implemented: [
      'Encoded SVG repeating text',
      'Noninteractive overlay',
      'Safe text escaping',
      'Image watermark',
      'Mutation-resistant rendering',
    ],
    notes: [],
  },
  affix: {
    implemented: [
      'Native sticky positioning',
      'Configurable top offset',
      'Target-container callbacks',
      'Bottom affix helper',
    ],
    notes: [],
  },
  app: {
    implemented: [
      'Theme, configuration, tooltip and toast providers',
      'Composable provider API',
      'Scoped overlay instances',
    ],
    notes: [],
  },
  'border-beam': {
    implemented: [
      'Animated conic border',
      'Custom content and classes',
      'Reduced-motion support',
      'Configurable travel duration and beam stops',
    ],
    notes: [],
  },
  'config-provider': {
    implemented: [
      'Scoped accent/radius/density',
      'LTR/RTL with Radix direction context',
      'Locale context for consumer formatters',
      'Automatic locale adapter across all composite inputs',
      'Scoped portal token propagation',
    ],
    notes: [],
  },
  util: {
    implemented: [
      'Controlled/uncontrolled state hook',
      'Media queries and debouncing',
      'Clipboard helper',
      'Breakpoint map convenience hook',
    ],
    notes: [],
  },
}
