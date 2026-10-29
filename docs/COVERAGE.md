# ErgonUI capabilities

Each component provides editable source, typed APIs, and an interactive playground. This document is generated from src/coverage.ts.

## Data entry

| Component | Capabilities | Verification / integration notes |
| --- | --- | --- |
| Rich Text Editor | Composable, typed Tiptap editor with controlled HTML and HTML/JSON/text change callbacks; Headings, marks, lists, links, alignment, color, fonts, tables, undo and redo; Images inserted at the selection by file picker, paste, drop or URL; alt text, title, width and alignment; Application-supplied uploads with progress, cancellation, validation and position tracking during edits; Read-only/disabled states and custom toolbar/content/status composition | Storage and authentication belong to the onImageUpload callback. The local playground creates temporary object URLs; the custom endpoint receives multipart file and returns { url } or { src }. Sanitize saved HTML on your server according to your application’s policy. |
| Auto Complete | Editable free text with accessible suggestion popover; Cancellable asynchronous sources and custom option rendering; Keyboard navigation and automatic virtual rendering for large sources | Playground and source available. |
| Cascader | Hierarchical columns and controlled paths; Search over loaded paths; Async children with cancellation; Change-on-select; Search across unloaded remote branches; Multi-path checkbox selection | Playground and source available. |
| Checkbox | Controlled/uncontrolled checks; Indeterminate and disabled states; Native form support; Convenience data-driven group wrapper | Playground and source available. |
| Check Card+ | Controlled checkbox-card selection; Icons, descriptions and disabled state; Group-level min/max and single-selection helpers | Playground and source available. |
| Color Picker | Native solid color selection; Hex/RGB display and hex editing; Opacity and preset swatches; Two-stop gradient composition; HSB/HSL editing; Arbitrary gradient stops | Playground and source available. |
| Date Picker | Single, multiple, range, month, year, week and quarter selection; Local and zoned date-time inputs and date-time range popover; IANA time-zone adapter with daylight-saving validation; locale-aware calendars and formatting | Repeated daylight-saving wall times resolve to the earlier instant. Nonexistent wall times are rejected. |
| Form | Accessible compound form parts and React Hook Form integration; Typed schema composition and asynchronous validation; Conditional fields, dependent remote options, repeatable arrays and scroll to invalid fields | Playground and source available. |
| Form+ | Typed fields, conditional visibility, validation and repeatable lists; Asynchronous dependent options with cancellation and invalidation; Steps, modal, drawer, query, compact filter and login compositions | Playground and source available. |
| Field+ | Read and edit modes with localized money and percent values; Text, textarea, password, number, date, date-time, time, select, switch, checkbox, rate and color; Date/date-time ranges, upload, slider, radio, checkbox groups and tree selection | Playground and source available. |
| Input | Text, search and password input composition; Textarea; Native props, validation and disabled states; OTP group; Password visibility toggle; Clear/count convenience controls | Playground and source available. |
| Input Number | Controlled/uncontrolled numbers; Decimal stepping; Min/max clamping; Accessible increment/decrement; Localized formatting/parsing; High-precision decimal string mode | Playground and source available. |
| Mentions | Caret-aware @ suggestions; Keyboard navigation; Multiple mention insertion; Controlled text; Configurable triggers; Async mention sources | Playground and source available. |
| Radio | Controlled/uncontrolled radio groups; Keyboard roving; Disabled states and native form behavior; Button-style group convenience preset | Playground and source available. |
| Rate | Controlled/uncontrolled star rating; Half-star pointer and keyboard steps; Hover feedback and clear behavior; Custom character/icon rendering | Playground and source available. |
| Select | Standard Radix Select parts; Searchable single/multiple Combobox; Async loading with cancellation; Automatic virtual options above 100 items; Keyboard navigation; Free-form tag creation; Custom option/label rendering | Playground and source available. |
| Slider | Single and multi-thumb range; Steps, bounds and orientation; Keyboard and controlled state; Tooltip value bubbles; Labeled marks convenience API | Playground and source available. |
| Switch | Controlled/uncontrolled toggle; Keyboard and native form support; Disabled state; Inline checked/unchecked label preset | Playground and source available. |
| Time Picker | Native time input; Optional seconds, constraints and disabled state; Custom scroll-panel time picker; Time ranges and 12-hour presets | Playground and source available. |
| Transfer | Searchable dual lists; Selection and select-all; Virtual items above 100 rows; Optional pagination and custom item rendering; Custom filter function; Drag-transfer interaction | Playground and source available. |
| Tree Select | Single/multiple tree selection; Search with ancestor preservation; Clear action and controlled keys; Async/virtual tree-select plumbing; Tag overflow summary | Playground and source available. |
| Upload | Dropzone and native file chooser; Type, size and count validation; Cancellable custom requests; Progress, retry and image thumbnails; Directory input; Image crop integration; Controlled upload-file list; Paste upload | ImageCropUpload composes crop-before-upload. File requests and persistence are supplied by your application. |

## General

| Component | Capabilities | Verification / integration notes |
| --- | --- | --- |
| Button | Variants, sizes, icons, loading, disabled, links via asChild; Soft, success, warning, dashed and destructive treatments | Playground and source available. |
| Float Button | Floating actions; Back-to-top; Custom placement and grouping by composition; Automatic scroll visibility threshold; Expandable action groups | Playground and source available. |
| Icon | Lucide icon surface; Size, stroke, color, and accessible labels; Custom icon sprite registry | Playground and source available. |
| Typography | Heading, paragraph, code, and quote hierarchy; Copyable and editable text; Multi-line ellipsis; Expandable ellipsis and tooltips; Advanced edit triggers | Playground and source available. |

## Layout

| Component | Capabilities | Verification / integration notes |
| --- | --- | --- |
| Divider | Horizontal and vertical separators; Decorative and semantic modes; Inline title composition preset | Playground and source available. |
| Flex | Axis, alignment, distribution, gap and wrapping; Native style and class overrides; Named responsive prop presets | Playground and source available. |
| Grid | Responsive auto-fit grid; Minimum column width and gap; 24-column span/offset/order API | Playground and source available. |
| Layout | Header, sider, content and footer; Composable nested layout; Core sider collapse/breakpoint API (use Layout+ for responsive navigation) | Playground and source available. |
| Layout+ | Responsive application shell with collapse and nested navigation; Route adapter, permission predicate, breadcrumbs, actions and footer; Workspace tabs and scoped appearance settings | Routing and permissions are supplied through explicit adapters and predicates. |
| Masonry | CSS masonry columns; Configurable column width and spacing; Measured row-order masonry; Virtual masonry | Playground and source available. |
| Space | Wrapping and directional spacing; Alignment and gap controls; Compact joined-control spacing preset | Playground and source available. |
| Splitter | Resizable horizontal/vertical panels; Minimum/maximum constraints; Keyboard separators and handles; Persisted panel layout recipe | Playground and source available. |

## Navigation

| Component | Capabilities | Verification / integration notes |
| --- | --- | --- |
| Anchor | Nested anchor links; Native section scrolling; Scrollspy active tracking; Horizontal anchor preset | Playground and source available. |
| Breadcrumb | Composable links, separators and current page; Ellipsis and custom separators; Route-derived item helper | Playground and source available. |
| Dropdown | Accessible menus, nested submenus, groups; Checkbox and radio items; Shortcuts, placement and keyboard navigation; Context-menu trigger recipe | Playground and source available. |
| Menu | Nested navigation, icons and disabled items; Controlled selected destination; Horizontal and collapsed menu modes; Keyboard arrow roving | Playground and source available. |
| Pagination | Composable page links, previous/next, ellipsis; Active state and accessible navigation; Quick-jump/page-size convenience wrapper | Playground and source available. |
| Steps | Controlled step navigation; Horizontal/vertical; Descriptions and disabled steps; Error/wait/status variants; Custom step icons | Playground and source available. |
| Tabs | Controlled/uncontrolled tabs; Keyboard navigation; Independent parts and orientations; Overflow tab navigation; Closable/reorderable tabs | Playground and source available. |

## Data display

| Component | Capabilities | Verification / integration notes |
| --- | --- | --- |
| Avatar | Image loading and fallback; Custom sizes and group composition; Overflow-count group helper; Automatic text scaling | Playground and source available. |
| Badge | Status/treatment variants; Count overflow and dot badges; Processing status indicator; Ribbon composition preset | Playground and source available. |
| Calendar | Single/range/multiple selection through Day Picker; Month/year navigation and locale props; EventCalendar dots and agenda; Full-size month/year event grid | Playground and source available. |
| Card | Header, description, content and footer; Slots and style overrides; Metadata/cover/grid convenience presets | Playground and source available. |
| Card+ | Header, description, extra and footer; Collapsible content; Grid/split layouts by composition; Tabbed/checked card group convenience API | Playground and source available. |
| Carousel | Swipe and keyboard navigation; Loop/axis options; Previous/next composition and API access; Autoplay and dot pagination preset | Playground and source available. |
| Collapse | Single/multiple accordions; Controlled expansion; Keyboard navigation and independent parts; Borderless/ghost variant presets | Playground and source available. |
| Descriptions | Responsive key/value composition; Column count and spanning items; Bordered layout; Horizontal label/content grid preset | Playground and source available. |
| Descriptions+ | Schema-driven formatting; Record editing with async save; Failure state and cancellation; Remote request helper; Per-field save and validation | Playground and source available. |
| Empty | Custom icon, title, description and action content; Bundled illustration variations | Playground and source available. |
| Image | Image preview and zoom; Gallery keyboard navigation; Gallery rotation and index; Custom thumbnails; Preview error/loading and image download controls | Playground and source available. |
| List | Typed collections with stable item keys and custom rendering; List and responsive grid layouts with empty states; Measured virtualization and incremental loading | Playground and source available. |
| List+ | Typed searchable list/grid with selection and pagination; Cancellable remote requests, loading, errors and retry; Measured virtual rendering and incremental local/remote loading | Connect the cancellable request callback to your own service. |
| Popover | Controlled overlays, placement and alignment; Keyboard dismissal; Accessible focus and anchor composition | Playground and source available. |
| QR Code | SVG rendering and error-correction levels; Custom colors and size; Loading/expired/scanned status; Refresh and SVG download; PNG export; Center icon overlay preset | Playground and source available. |
| Segmented | Controlled/uncontrolled selection; Disabled items; Roving keyboard selection and custom labels; Vertical layout preset | Playground and source available. |
| Statistic | Locale-aware numeric formatting; Prefixes, suffixes, precision and trend; Countdown/timer and count-up animation | Playground and source available. |
| Table | Search, per-column filters, multi-sort, pagination and stable-key selection; Grouped headers, grouping, nested records, expansion and summaries; Pinned, resizable, reorderable columns; drag and keyboard row reordering; Inline edits and validation, CSV export and persisted column views; Native merged row/column spans and two-axis virtualization; Playground presets for editable children/grandchildren, custom row details and nested child tables | Use stable row IDs for persistent selection, reorder and edits.; Cell merging uses native table layout; virtualization mounts visible rows and columns.; Add child is a custom playground action that updates consumer-owned data; use getSubRows, rowExpansion and onCellEdit in your application. |
| Table+ | Cancellable server requests, debounced search, server pagination, sorting and filters; Schema query forms, local or server-backed named views and column preferences; Selection across server pages, cached selected records and asynchronous batch actions; Nested child rows, custom expansion content, nested child tables and child editing playground presets | Connect request, saved-view and batch callbacks to your own service. Use stable IDs across pages. |
| Editable Table+ | Controlled record insertion, deletion and inline editing; Per-row save/cancel, batch field editing and complete transaction cancellation; Asynchronous commits, row validation and optimistic rollback on failure | Use stable IDs for transactions. onCommit receives the next record set, mutations and an AbortSignal. |
| Tag | Color treatments; Close action; Controlled selectable tags; Icon-only convenience preset | Playground and source available. |
| Timeline | Statuses, custom icons, timestamps and reverse order; Alternating/horizontal layout presets | Playground and source available. |
| Tooltip | Accessible hover/focus content; Delayed triggers and placement; Controlled/uncontrolled state | Playground and source available. |
| Tour | Step navigation and skip/finish; Target-anchored popovers; Target spotlight with scroll/resize updates; Centered fallback and keyboard dismissal; Animated target transitions; Cross-route walkthroughs | beforeEnter can await navigation or target preparation before each step. |
| Tree | Controlled checking and expansion; Descendant propagation and mixed parents; Keyboard traversal; Virtual rows and async children; Cycle/disabled drop guards with external mutation callback; Drag placement/reordering UI | Playground and source available. |

## Feedback

| Component | Capabilities | Verification / integration notes |
| --- | --- | --- |
| Alert | Info, success, warning and error treatments; Optional dismissal; Accessible status/alert roles; Banner/rolling alert presets | Playground and source available. |
| Drawer | Radix side sheet and swipeable Vaul bottom drawer; Placement, focus, keyboard dismissal; Compound parts and controlled state; Nested/push drawer recipes | Playground and source available. |
| Message | Success/error/info/warning toasts; Promise states, duration and dismissal; Standalone provider; Scoped instance/context helpers | Playground and source available. |
| Modal | Accessible dialog compound parts; Controlled/uncontrolled open state; Focus trapping and keyboard dismissal; Draggable/resizable modal recipe; Static confirm helper | Playground and source available. |
| Notification | Rich toasts, descriptions and actions; Duration, close, placement and promise support; Notification stacking configuration gallery | Playground and source available. |
| Popconfirm | Accessible confirmation dialog; Custom labels through lower-level parts; Destructive treatment; Anchored popover confirmation preset | Playground and source available. |
| Progress | Progress bar with statuses; SVG circle and discrete step variants; Controlled values; Dashboard arc variant; Multiple success segments | Playground and source available. |
| Result | Success/error/info/warning outcomes; Title, description and action content; HTTP error-code illustrations | Playground and source available. |
| Skeleton | Composable block/text/avatar placeholders; Shape/size overrides; Preset skeleton buttons, inputs and images | Playground and source available. |
| Skeleton+ | Dashboard, list and form presets; Configurable row count; Chart/table-specific loading layouts | Playground and source available. |
| Spin | Standalone loading status; Content overlay with aria-busy; Delayed/minimum-duration spinner helper | Playground and source available. |
| Watermark | Encoded SVG repeating text; Noninteractive overlay; Safe text escaping; Image watermark; Mutation-resistant rendering | Playground and source available. |

## Other

| Component | Capabilities | Verification / integration notes |
| --- | --- | --- |
| Affix | Native sticky positioning; Configurable top offset; Target-container callbacks; Bottom affix helper | Playground and source available. |
| App | Theme, configuration, tooltip and toast providers; Composable provider API; Scoped overlay instances | Playground and source available. |
| Border Beam | Animated conic border; Custom content and classes; Reduced-motion support; Configurable travel duration and beam stops | Playground and source available. |
| Config Provider | Scoped accent/radius/density; LTR/RTL with Radix direction context; Locale context for consumer formatters; Automatic locale adapter across all composite inputs; Scoped portal token propagation | Playground and source available. |
| Util | Controlled/uncontrolled state hook; Media queries and debouncing; Clipboard helper; Breakpoint map convenience hook | Playground and source available. |
