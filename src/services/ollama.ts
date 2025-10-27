import { forwardProxy, pushMsg, pushErrMsg } from '@/api'

export interface OllamaModel {
  name: string
  size?: number
  modified_at?: string
}

export interface OllamaModelResponse {
  models: OllamaModel[]
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

