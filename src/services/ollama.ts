import { forwardProxy } from "@/api"
import { LOG_PREFIX } from "@/constants"

export interface OllamaModel {
  name: string
  size?: number
  modified_at?: string
}

export interface OllamaModelResponse {
  models: OllamaModel[]
}

export interface ChatMessage {
  role: "user" | "assistant" | "system"
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

export interface OllamaErrorResponse {
  code: number
  msg: string
  data: null
}

export class OllamaConnectionError extends Error {
  constructor(message: string, public readonly url: string) {
    super(message)
    this.name = "OllamaConnectionError"
  }
}

/**
 * Fetch available models from an Ollama instance
 * @param baseUrl The base URL of the Ollama server (e.g., http://localhost:11434)
 * @returns Array of available models
 */
export async function fetchOllamaModels(baseUrl: string): Promise<OllamaModel[]> {
  console.log(LOG_PREFIX, "Fetching models from Ollama:", baseUrl)
  if (!baseUrl || baseUrl.trim() === "") {
    return []
  }

  try {
    const url = `${baseUrl}/api/tags`
    const response = await forwardProxy(url, "GET", {}, [], 5000)

    // If no response or no body, it's likely a connection error
    if (!response || !response.body) {
      throw new OllamaConnectionError(
        "Connection refused: No response from Ollama server",
        baseUrl,
      )
    }

    // Parse the response body
    let parsedData: unknown
    try {
      parsedData = JSON.parse(response.body)
    } catch (parseError) {
      // If we can't parse JSON, but got a response, might still be an error
      // Check if response status indicates an error
      if (response.status && response.status >= 400) {
        throw new OllamaConnectionError(
          `Connection failed with status ${response.status} ${parseError instanceof Error ? parseError.message : ""}`,
          baseUrl,
        )
      }
      throw new Error("Invalid JSON response")
    }

    console.log(LOG_PREFIX, "Parsed data:", parsedData)

    // Check if the response is an error response from SiYuan's forwardProxy
    if (
      parsedData &&
      typeof parsedData === "object" &&
      "code" in parsedData &&
      (parsedData as OllamaErrorResponse).code === -1
    ) {
      const errorData = parsedData as OllamaErrorResponse
      throw new OllamaConnectionError(errorData.msg || "Connection refused", baseUrl)
    }

    // Parse as the expected response format
    const data = parsedData as OllamaModelResponse

    if (!data.models || !Array.isArray(data.models)) {
      throw new Error("Invalid response format")
    }

    return data.models
  } catch (error) {
    // Re-throw connection errors so they can be handled in the UI
    if (error instanceof OllamaConnectionError) {
      // Don't log connection errors here - they're handled and logged in checkConnection
      throw error
    }
    
    // Log other errors for debugging
    console.error(LOG_PREFIX, "Failed to fetch models from Ollama:", error)
    // SiYuan already shows an error for forwardProxy failures, so we don't need to push another one
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
  temperature: number = 0.1,
): Promise<string> {
  if (!baseUrl || baseUrl.trim() === "") {
    throw new Error("Ollama URL is required")
  }

  if (!model) {
    throw new Error("Model is required")
  }

  try {
    const url = `${baseUrl}/api/chat`
    const payload: OllamaChatRequest = {
      model,
      messages,
      temperature,
      stream: false,
    }

    if (import.meta.env.MODE === "development") {
      console.log(LOG_PREFIX, "Sending chat message to Ollama:", messages)
    }

    const response = await forwardProxy(url, "POST", payload, [], 60000, "application/json")

    // If no response or no body, it's likely a connection error
    if (!response || !response.body) {
      throw new OllamaConnectionError(
        "Connection refused: No response from Ollama server",
        baseUrl,
      )
    }

    // Parse the response body
    let parsedData: unknown
    try {
      parsedData = JSON.parse(response.body)
    } catch (parseError) {
      // If we can't parse JSON, but got a response, might still be an error
      // Check if response status indicates an error
      if (response.status && response.status >= 400) {
        throw new OllamaConnectionError(
          `Connection failed with status ${response.status} ${parseError instanceof Error ? parseError.message : ""}`,
          baseUrl,
        )
      }
      throw new Error("Invalid JSON response")
    }

    // Check if the response is an error response from SiYuan's forwardProxy
    if (
      parsedData &&
      typeof parsedData === "object" &&
      "code" in parsedData &&
      (parsedData as OllamaErrorResponse).code === -1
    ) {
      const errorData = parsedData as OllamaErrorResponse
      throw new OllamaConnectionError(errorData.msg || "Connection refused", baseUrl)
    }

    // Parse as the expected response format
    const data = parsedData as OllamaChatResponse

    if (!data.message || !data.message.content) {
      throw new Error("Invalid response format")
    }

    return data.message.content
  } catch (error) {
    console.error(LOG_PREFIX, "Failed to send chat message to Ollama:", error)
    throw error
  }
}
