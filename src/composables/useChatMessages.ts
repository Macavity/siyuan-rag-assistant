/**
 * Composable for managing chat message sending and API calls
 * Handles message sending, configuration checking, and error handling
 */

import type RAGAssistantPlugin from "@/index"
import { ref, type Ref } from "vue"
import { pushErrMsg } from "@/api"
import { sendChatMessage } from "@/services/ollama"
import { type Message } from "@/types/message.ts"
import { buildUserMessage } from "@/utils/message-factory.ts"

export function useChatMessages(plugin: RAGAssistantPlugin) {
  const isConfigured: Ref<boolean> = ref(false)
  const isLoading: Ref<boolean> = ref(false)

  /**
   * Check if plugin is configured with Ollama settings
   */
  const checkConfiguration = async () => {
    try {
      const settings = await plugin.getSettings()
      isConfigured.value = !!(settings.ollamaUrl && settings.selectedModel)
    } catch (error) {
      console.error("Error checking configuration:", error)
      isConfigured.value = false
    }
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
      // Load settings
      const settings = await plugin.getSettings()

      if (!settings.ollamaUrl || !settings.selectedModel) {
        isConfigured.value = false
        throw new Error("Ollama URL or model not configured")
      }

      // Update configuration status
      isConfigured.value = true

      // Send message to Ollama with context
      const messagesToSend: Message[] = [...messages.value]

      // Replace the last user message with the contextual version if it differs
      if (contextualMessage !== userMessage) {
        messagesToSend[messagesToSend.length - 1] = buildUserMessage(contextualMessage)

        // Add system message at the start if this is a new conversation with context
        const hasSystemMessage = messagesToSend.some((msg) => msg.role === "system")
        if (!hasSystemMessage && systemMessage) {
          messagesToSend.unshift(systemMessage)
        }
      }

      const response = await sendChatMessage(
        settings.ollamaUrl,
        settings.selectedModel,
        messagesToSend,
        settings.temperature,
      )

      return response
    } catch (error) {
      console.error("Error sending message:", error)
      pushErrMsg("Failed to send message. Please check your Ollama configuration.")
      await checkConfiguration()
      throw error
    } finally {
      isLoading.value = false
    }
  }

  return {
    isConfigured,
    isLoading,
    checkConfiguration,
    sendMessage,
  }
}
