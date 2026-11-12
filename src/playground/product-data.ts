/** Original, simulated documentation data. Distributed components never import this module. */
export const productIds = [
  'workflow-editor',
  'pdf-viewer',
  'signature-pad',
  'notification-inbox',
  'presence',
  'upload-plus',
  'conversation',
  'chat-message',
  'prompt-composer',
  'streaming-markdown',
  'conversation-history',
  'model-selector',
  'citations',
  'tool-call',
  'agent-run-trace',
  'approval-request',
  'artifact-panel',
  'context-usage',
  'generation-settings',
  'model-comparison',
  'voice-conversation',
] as const
export const workflowData = {
  nodes: [
    {
      id: 'request',
      label: 'New request',
      description: 'Capture a customer question',
      type: 'Trigger',
      x: 32,
      y: 100,
      inputs: [],
      outputs: [{ id: 'next', label: 'Continue' }],
    },
    {
      id: 'review',
      label: 'Review context',
      description: 'Find a useful next step',
      type: 'Decision',
      x: 340,
      y: 100,
      inputs: [{ id: 'in', label: 'Request' }],
      outputs: [
        { id: 'yes', label: 'Ready' },
        { id: 'no', label: 'Needs details' },
      ],
    },
    {
      id: 'publish',
      label: 'Send response',
      description: 'Deliver the reviewed answer',
      type: 'Action',
      x: 650,
      y: 100,
      inputs: [{ id: 'in', label: 'Approved' }],
      outputs: [],
    },
  ],
  edges: [
    {
      id: 'request-review',
      source: 'request',
      sourcePort: 'next',
      target: 'review',
      targetPort: 'in',
    },
    {
      id: 'review-publish',
      source: 'review',
      sourcePort: 'yes',
      target: 'publish',
      targetPort: 'in',
      label: 'Approved',
    },
  ],
}
export const signatureData = [
  {
    id: 'sample-ink',
    color: '#5579bd',
    width: 2.7,
    points: [
      { x: 0.12, y: 0.67 },
      { x: 0.17, y: 0.43 },
      { x: 0.2, y: 0.28 },
      { x: 0.22, y: 0.39 },
      { x: 0.19, y: 0.68 },
      { x: 0.25, y: 0.55 },
      { x: 0.3, y: 0.58 },
      { x: 0.34, y: 0.44 },
      { x: 0.32, y: 0.64 },
      { x: 0.38, y: 0.58 },
      { x: 0.43, y: 0.6 },
      { x: 0.48, y: 0.47 },
      { x: 0.49, y: 0.6 },
      { x: 0.56, y: 0.58 },
      { x: 0.61, y: 0.37 },
      { x: 0.58, y: 0.65 },
      { x: 0.66, y: 0.57 },
      { x: 0.74, y: 0.6 },
      { x: 0.8, y: 0.52 },
    ],
  },
]
export const inboxData = [
  {
    id: 'review',
    title: 'A design is ready for review',
    description: 'The team has shared a calmer workspace layout.',
    createdAt: '2026-11-04T08:30:00+07:00',
    category: 'Design',
    read: false,
    action: { id: 'review', label: 'Review design' },
  },
  {
    id: 'comment',
    title: 'Maya mentioned you',
    description: '“The small details make this feel easier to use.”',
    createdAt: '2026-11-04T07:45:00+07:00',
    category: 'Team',
    read: false,
  },
  {
    id: 'release',
    title: 'Your workspace is up to date',
    description: 'All changes have been saved in this local demo.',
    createdAt: '2026-11-03T16:00:00+07:00',
    category: 'Updates',
    read: true,
  },
]
export const presenceData = [
  { id: 'you', name: 'You', color: '#5579bd', status: 'online' as const },
  {
    id: 'maya',
    name: 'Maya',
    color: '#9864af',
    status: 'online' as const,
    typing: true,
    cursor: { x: 0.35, y: 0.4 },
  },
  {
    id: 'rio',
    name: 'Rio',
    color: '#36836a',
    status: 'away' as const,
    cursor: { x: 0.72, y: 0.65 },
  },
  { id: 'asha', name: 'Asha', color: '#c38a28', status: 'online' as const },
  { id: 'leo', name: 'Leo', color: '#bb5c6b', status: 'offline' as const },
]
export const modelData = [
  {
    id: 'balanced',
    name: 'Balanced',
    provider: 'Demo models',
    description: 'An everyday assistant for thoughtful answers.',
    capabilities: ['vision', 'tools', 'structured-output'],
    contextWindow: 128000,
    maxOutputTokens: 16000,
    parameters: {
      temperature: { min: 0, max: 2, step: 0.1 },
      topP: true,
      seed: true,
      stop: true,
      responseFormats: ['text', 'json'],
    },
  },
  {
    id: 'reasoning',
    name: 'Reasoning',
    provider: 'Demo models',
    description: 'More time for complex questions.',
    capabilities: ['reasoning', 'tools'],
    contextWindow: 200000,
    maxOutputTokens: 32000,
    parameters: { responseFormats: ['text'] },
  },
  {
    id: 'small',
    name: 'Swift',
    provider: 'Local examples',
    description: 'Short responses, with a lighter footprint.',
    capabilities: ['tools'],
    contextWindow: 32000,
    maxOutputTokens: 4000,
    parameters: {
      temperature: { min: 0, max: 1, step: 0.1 },
      topP: true,
      responseFormats: ['text'],
    },
  },
  {
    id: 'audio',
    name: 'Voice',
    provider: 'Local examples',
    description: 'An unavailable model to demonstrate disabled selection.',
    available: false,
    capabilities: ['audio'],
    contextWindow: 32000,
    maxOutputTokens: 4000,
  },
]
export const messageData = [
  {
    id: 'question',
    role: 'user' as const,
    content: 'How could we make this workspace feel calmer?',
    author: 'You',
  },
  {
    id: 'answer',
    role: 'assistant' as const,
    content:
      'Start with a clear visual hierarchy. Give the primary action room to breathe, group related controls, and keep helpful details close to the task.\n\nSmall, consistent choices reduce the effort of finding the next step.',
    author: 'Ergon assistant',
    status: 'complete' as const,
  },
]
export const markdownData =
  '# A little more room to think\n\nDesign a workspace around **the next useful action**, with details close at hand.\n\n> Good tools make complex work feel approachable.\n\n## A practical checklist\n\n- [x] Clear visual hierarchy\n- [x] Keyboard access\n- [ ] A thoughtful empty state\n\n| Focus | Approach |\n| :--- | :--- |\n| Clarity | Familiar patterns |\n| Feedback | Small, timely signals |\n\n```tsx\n<Button onClick={save}>Save changes</Button>\n```\n\n[Explore ErgonUI](https://ergonui.netlify.app/)\n\nRaw HTML stays inert: <b>this is text</b>.\n'
export const historyData = [
  {
    id: 'workspace',
    title: 'A calmer workspace',
    description: 'Design principles and everyday details',
    updatedAt: '2026-11-04T09:00:00+07:00',
    group: 'November 4, 2026',
    pinned: true,
  },
  {
    id: 'tokens',
    title: 'Refining the color palette',
    updatedAt: '2026-11-04T08:00:00+07:00',
    group: 'November 4, 2026',
  },
  {
    id: 'release',
    title: 'A release checklist',
    updatedAt: '2026-11-03T16:00:00+07:00',
    group: 'November 3, 2026',
  },
  {
    id: 'archived',
    title: 'An earlier exploration',
    updatedAt: '2026-11-01T12:00:00+07:00',
    archived: true,
    group: 'Earlier',
  },
]
export const citationData = [
  {
    id: 'ergon',
    title: 'ErgonUI documentation',
    url: 'https://ergonui.netlify.app/',
    description: 'Component APIs, examples and source you can make your own.',
    quote: 'Clear interfaces begin with composable parts.',
  },
  {
    id: 'guide',
    title: 'Workspace design notes',
    document: 'Original demo notes',
    page: 3,
    description: 'A fictional document citation with no remote file attached.',
    quote: 'Keep related decisions together and give each one enough space.',
  },
]
export const toolData = {
  id: 'find-records',
  name: 'search_workspace',
  description: 'Find relevant design notes',
  status: 'success' as const,
  input: { query: 'workspace clarity', limit: 3 },
  output: {
    matches: [
      { id: 'note-1', title: 'Visual hierarchy' },
      { id: 'note-2', title: 'Keyboard access' },
    ],
    total: 2,
  },
  durationMs: 384,
}
export const traceData = [
  {
    id: 'agent',
    title: 'Workspace assistant',
    kind: 'agent' as const,
    status: 'success' as const,
    summary: 'Published activity summary for this simulated run.',
    durationMs: 1280,
    children: [
      {
        id: 'lookup',
        title: 'Find related notes',
        kind: 'retrieval' as const,
        status: 'success' as const,
        toolCall: toolData,
        children: [],
      },
      {
        id: 'draft',
        title: 'Draft a useful response',
        kind: 'model' as const,
        status: 'success' as const,
        summary: 'Combined two workspace notes into a short recommendation.',
        durationMs: 620,
      },
      {
        id: 'review',
        title: 'Human review checkpoint',
        kind: 'checkpoint' as const,
        status: 'pending' as const,
        summary: 'Waiting for an application-provided approval decision.',
      },
    ],
  },
]
export const approvalData = {
  id: 'share-summary',
  revision: '1',
  title: 'Share this workspace summary?',
  description: 'Review the recipients and message before this simulated action can proceed.',
  toolName: 'send_summary',
  status: 'pending' as const,
  arguments: {
    recipient: 'team@example.test',
    subject: 'A calmer workspace',
    message: 'The design notes are ready for review.',
  },
}
export const artifactData = {
  id: 'workspace-note',
  title: 'Workspace principles',
  kind: 'markdown' as const,
  filename: 'workspace.md',
  versions: [
    {
      id: 'draft',
      label: 'Draft',
      content:
        '# A calmer workspace\n\nKeep the primary action visible.\n\n- Group related controls\n- Reduce visual noise\n',
    },
    {
      id: 'reviewed',
      label: 'Reviewed',
      content:
        '# A calmer workspace\n\nKeep the next useful action visible.\n\n- Group related controls\n- Give important details room to breathe\n- Make every action reachable by keyboard\n',
    },
  ],
}
