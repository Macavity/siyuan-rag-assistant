/**
 * Composable for managing chat message sending and API calls
 * Handles message sending, configuration checking, and error handling
 */

import { ref, Ref, nextTick } from 'vue'
import { sendChatMessage } from '@/services/ollama'
import { pushErrMsg } from '@/api'
import type RAGAssistantPlugin from '@/index'
import {Message} from "@/types/message.ts";
import {buildAssistantMessage, buildUserMessage} from "@/utils/message-factory.ts";

export function useChatMessages(plugin: RAGAssistantPlugin) {
  const isConfigured: Ref<boolean> = ref(false)
  const isLoading: Ref<boolean> = ref(false)
  const historyContainer: Ref<HTMLDivElement | undefined> = ref()

  /**
   * Check if plugin is configured with Ollama settings
   */
  const checkConfiguration = async () => {
    try {
      const settings = await plugin.getSettings()
      isConfigured.value = !!(settings.ollamaUrl && settings.selectedModel)
    } catch (error) {
      console.error('Error checking configuration:', error)
      isConfigured.value = false
    }
  }

  /**
   * Send a chat message with optional context
   */
  const sendMessage = async (
    userMessage: string,
    contextualMessage: string,
    systemMessage: Message | null,
    messages: Ref<Message[]>
  ) => {
    isLoading.value = true
    try {
      // Load settings
      const settings = await plugin.getSettings()

      if (!settings.ollamaUrl || !settings.selectedModel) {
        isConfigured.value = false
        return
      }

      // Update configuration status
      isConfigured.value = true

      // Send message to Ollama with context
      const messagesToSend: Message[] = [...messages.value]

      // Replace the last user message with the contextual version
      if (contextualMessage !== userMessage) {
        messagesToSend[messagesToSend.length - 1] = buildUserMessage(userMessage);

        // Add system message at the start if this is a new conversation with context
        const hasSystemMessage = messagesToSend.some(msg => msg.role === 'system')
        if (!hasSystemMessage && systemMessage) {
          messagesToSend.unshift(systemMessage)
        }
      }

      const response = await sendChatMessage(
        settings.ollamaUrl,
        settings.selectedModel,
        messagesToSend,
        settings.temperature
      )

      // Add assistant response to history
      messages.value.push(buildAssistantMessage(response))

      // Scroll to bottom after DOM update
      await nextTick()
      scrollToBottom()

      return response
    } catch (error) {
      console.error('Error sending message:', error)
      pushErrMsg('Failed to send message. Please check your Ollama configuration.')
      await checkConfiguration()
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Scroll chat history to bottom
   */
  const scrollToBottom = () => {
    if (historyContainer.value) {
      historyContainer.value.scrollTop = historyContainer.value.scrollHeight
    }
  }

  return {
    isConfigured,
    isLoading,
    historyContainer,
    checkConfiguration,
    sendMessage,
    scrollToBottom
  }
}
