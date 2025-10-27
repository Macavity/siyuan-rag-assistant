import { forwardProxy, pushErrMsg } from '@/api'

export interface OllamaModel {
  name: string
  size?: number
  modified_at?: string
}

export interface OllamaModelResponse {
  models: OllamaModel[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface OllamaChatRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  stream?: boolean
}

export interface OllamaChatResponse {
  message: {
    role: string
    content: string
  }
  done: boolean
}

/**
 * Fetch available models from an Ollama instance
 * @param baseUrl The base URL of the Ollama server (e.g., http://localhost:11434)
 * @returns Array of available models
 */
export async function fetchOllamaModels(baseUrl: string): Promise<OllamaModel[]> {
  if (!baseUrl || baseUrl.trim() === '') {
    return []
  }

  try {
    const url = `${baseUrl}/api/tags`
    const response = await forwardProxy(url, 'GET', {}, [], 5000)

    if (!response || !response.body) {
      throw new Error('No response body received')
    }

    const data: OllamaModelResponse = JSON.parse(response.body)
    
    if (!data.models || !Array.isArray(data.models)) {
      throw new Error('Invalid response format')
    }

    return data.models
  } catch (error) {
    console.error('Failed to fetch models from Ollama:', error)
    pushErrMsg('Failed to fetch models from Ollama. Please check the URL and ensure Ollama is running.')
    return []
  }
}

/**
 * Send a chat message to an Ollama instance
 * @param baseUrl The base URL of the Ollama server
 * @param model The model name to use
 * @param messages The chat history
 * @param temperature The temperature parameter (0.0 to 1.0)
 * @returns The assistant's response
 */
export async function sendChatMessage(
  baseUrl: string,
  model: string,
  messages: ChatMessage[],
  temperature: number = 0.1
): Promise<string> {
  if (!baseUrl || baseUrl.trim() === '') {
    throw new Error('Ollama URL is required')
  }

  if (!model) {
    throw new Error('Model is required')
  }

  try {
    const url = `${baseUrl}/api/chat`
    const payload: OllamaChatRequest = {
      model,
      messages,
      temperature,
      stream: false
    }

    const response = await forwardProxy(url, 'POST', payload, [], 60000, 'application/json')

    if (!response || !response.body) {
      throw new Error('No response body received')
    }

    const data: OllamaChatResponse = JSON.parse(response.body)

    if (!data.message || !data.message.content) {
      throw new Error('Invalid response format')
    }

    return data.message.content
  } catch (error) {
    console.error('Failed to send chat message to Ollama:', error)
    throw error
  }
}

