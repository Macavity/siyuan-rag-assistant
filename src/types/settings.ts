/**
 * Settings interface for the RAG Assistant plugin
 */
export interface RAGAssistantSettings {
  ollamaUrl: string
  selectedModel: string
  temperature: number
  contextFree: boolean
  includeSubDocuments: boolean
}

/**
 * Default settings for the RAG Assistant
 */
export const DEFAULT_SETTINGS: RAGAssistantSettings = {
  ollamaUrl: 'http://localhost:11434',
  selectedModel: '',
  temperature: 0.1,
  contextFree: false,
  includeSubDocuments: false,
}

export const STORAGE_NAME = 'plugin-settings'
export const CHAT_HISTORY_STORAGE = 'chat-history'

export interface ChatHistory {
  [documentId: string]: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

