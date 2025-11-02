/**
 * Composable for managing chat message sending and API calls
 * Handles message sending, configuration checking, and error handling
 */

import type RAGAssistantPlugin from "@/index"
import { ref, type Ref } from "vue"
import { LOG_PREFIX } from "@/constants"
import {
  fetchOllamaModels,
  OllamaConnectionError,
  sendChatMessage,
} from "@/services/ollama"
import { type Message } from "@/types/message.ts"
import { buildUserMessage } from "@/utils/message-factory.ts"

const formatConnectionErrorMessage = (url: string): string =>
  `Ollama does not respond on ${url}. Please ensure Ollama is running and the URL is correct.`

export function useChatMessages(plugin: RAGAssistantPlugin) {
  const isConfigured = ref<boolean>(false)
  const isLoading = ref<boolean>(false)
  const connectionError = ref<string | null>(null)

  /**
   * Check if plugin is configured with Ollama settings
   */
  const checkConfiguration = async (): Promise<void> => {
    try {
      const settings = await plugin.getSettings()
      isConfigured.value = !!(settings.ollamaUrl && settings.selectedModel)
    } catch (error) {
      console.error(LOG_PREFIX, "Error checking configuration:", error)
      isConfigured.value = false
    }
  }

  /**
   * Check connection to Ollama server proactively
   * This should be called when the panel opens or configuration changes
   */
  const checkConnection = async (): Promise<void> => {
    try {
      const settings = await plugin.getSettings()
      if (!settings.ollamaUrl?.trim()) {
        connectionError.value = null
        return
      }

      await fetchOllamaModels(settings.ollamaUrl)
      connectionError.value = null
      console.debug(LOG_PREFIX, "Connection check successful")
    } catch (error) {
      if (error instanceof OllamaConnectionError) {
        connectionError.value = formatConnectionErrorMessage(error.url)
        console.debug(LOG_PREFIX, "Connection check failed:", error.message)
      } else {
        connectionError.value = null
        console.debug(LOG_PREFIX, "Non-connection error during check:", error)
      }
    }
  }

  /**
   * Prepare messages for sending with context
   */
  const prepareMessagesWithContext = (
    messages: Message[],
    contextualMessage: string,
    userMessage: string,
    systemMessage: Message | null,
  ): Message[] => {
    const messagesToSend = [...messages]

    if (contextualMessage !== userMessage) {
      messagesToSend[messagesToSend.length - 1] = buildUserMessage(contextualMessage)

      const hasSystemMessage = messagesToSend.some((msg) => msg.role === "system")
      if (!hasSystemMessage && systemMessage) {
        messagesToSend.unshift(systemMessage)
      }
    }

    return messagesToSend
  }

  /**
   * Send a chat message with optional context
   * Returns the assistant's response text
   */
  const sendMessage = async (
    userMessage: string,
    contextualMessage: string,
    systemMessage: Message | null,
    messages: Ref<Message[]>,
  ): Promise<string> => {
    isLoading.value = true
    try {
      const settings = await plugin.getSettings()

      if (!settings.ollamaUrl || !settings.selectedModel) {
        isConfigured.value = false
        throw new Error("Ollama URL or model not configured")
      }

      isConfigured.value = true

      const messagesToSend = prepareMessagesWithContext(
        messages.value,
        contextualMessage,
        userMessage,
        systemMessage,
      )

      const response = await sendChatMessage(
        settings.ollamaUrl,
        settings.selectedModel,
        messagesToSend,
        settings.temperature,
      )

      connectionError.value = null
      return response
    } catch (error) {
      console.error(LOG_PREFIX, "Error sending message:", error)

      if (error instanceof OllamaConnectionError) {
        connectionError.value = formatConnectionErrorMessage(error.url)
      }

      await checkConfiguration()
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Clear connection error (useful for refresh action)
   */
  const clearConnectionError = (): void => {
    connectionError.value = null
  }

  return {
    isConfigured,
    isLoading,
    connectionError,
    checkConfiguration,
    checkConnection,
    sendMessage,
    clearConnectionError,
  }
}
