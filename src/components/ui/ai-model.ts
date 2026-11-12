export type ModelCapability = 'vision' | 'tools' | 'reasoning' | 'audio' | 'structured-output'
export interface ModelDescriptor {
  id: string
  name: string
  provider: string
  description?: string
  available?: boolean
  capabilities?: ModelCapability[]
  contextWindow?: number
  maxOutputTokens?: number
  parameters?: {
    temperature?: { min: number; max: number; step?: number }
    topP?: boolean
    seed?: boolean
    stop?: boolean
    responseFormats?: ('text' | 'json')[]
  }
}
export interface GenerationParameters {
  temperature?: number
  topP?: number
  maxOutputTokens?: number
  seed?: number
  responseFormat?: 'text' | 'json'
  systemPrompt?: string
  stop?: string[]
}
