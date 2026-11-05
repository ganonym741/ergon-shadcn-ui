import type { HighlighterCore, ThemedTokenWithVariants } from 'shiki/core'

export const codeLanguages = [
  'text',
  'javascript',
  'jsx',
  'typescript',
  'tsx',
  'json',
  'css',
  'html',
  'markdown',
  'bash',
  'yaml',
  'sql',
  'python',
] as const
export type CodeLanguage = (typeof codeLanguages)[number]
const loaders = {
  javascript: () => import('shiki/langs/javascript.mjs'),
  jsx: () => import('shiki/langs/jsx.mjs'),
  typescript: () => import('shiki/langs/typescript.mjs'),
  tsx: () => import('shiki/langs/tsx.mjs'),
  json: () => import('shiki/langs/json.mjs'),
  css: () => import('shiki/langs/css.mjs'),
  html: () => import('shiki/langs/html.mjs'),
  markdown: () => import('shiki/langs/markdown.mjs'),
  bash: () => import('shiki/langs/bash.mjs'),
  yaml: () => import('shiki/langs/yaml.mjs'),
  sql: () => import('shiki/langs/sql.mjs'),
  python: () => import('shiki/langs/python.mjs'),
}
let highlighter: Promise<HighlighterCore> | undefined
const loading = new Map<string, Promise<void>>()
/** Loads the JavaScript regex engine, two themes, and only the requested grammar on demand. */
export async function highlightCode(
  code: string,
  language: CodeLanguage,
): Promise<ThemedTokenWithVariants[][]> {
  if (language === 'text')
    return code
      .split('\n')
      .map((content) => [{ content, offset: 0, variants: { light: {}, dark: {} } }])
  if (!codeLanguages.includes(language)) throw new Error(`Unsupported language: ${language}`)
  highlighter ??= Promise.all([
    import('shiki/core'),
    import('shiki/engine/javascript'),
    import('shiki/themes/github-light.mjs'),
    import('shiki/themes/github-dark.mjs'),
  ])
    .then(([core, engine, light, dark]) =>
      core.createHighlighterCore({
        themes: [light.default, dark.default],
        langs: [],
        engine: engine.createJavaScriptRegexEngine({ forgiving: true }),
      }),
    )
    .catch((error) => {
      highlighter = undefined
      throw error
    })
  const instance = await highlighter
  if (!loading.has(language))
    loading.set(
      language,
      loaders[language]()
        .then((grammar) => instance.loadLanguage(grammar.default))
        .catch((error) => {
          loading.delete(language)
          throw error
        }),
    )
  await loading.get(language)
  return instance.codeToTokensWithThemes(code, {
    lang: language,
    themes: { light: 'github-light', dark: 'github-dark' },
  })
}
