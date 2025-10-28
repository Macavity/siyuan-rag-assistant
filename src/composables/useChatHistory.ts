/**
 * Composable for managing chat history per document
 * Handles loading, saving, and switching between document chat histories
 */

import { ref, Ref } from 'vue'
import { CHAT_HISTORY_STORAGE, type ChatHistory } from '@/types/settings'
import {Message} from "@/types/message.ts";

export function useChatHistory(plugin: any) {
  const messages: Ref<Message[]> = ref([])
  let currentDocumentId: Ref<string | null> = ref(null)

  /**
   * Load chat history for a specific document
   */
  const loadChatHistory = async (documentId: string) => {
    try {
      const chatHistory = await plugin.loadData(CHAT_HISTORY_STORAGE) as ChatHistory | null
      if (chatHistory && chatHistory[documentId]) {
        messages.value = chatHistory[documentId]
        console.log('Loaded chat history for document:', documentId)
      } else {
        messages.value = []
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
      messages.value = []
    }
  }

  /**
   * Save chat history for a specific document
   */
  const saveChatHistory = async (documentId: string) => {
    try {
      const chatHistory = await plugin.loadData(CHAT_HISTORY_STORAGE) as ChatHistory | null
      const updatedHistory = chatHistory || {}
      updatedHistory[documentId] = messages.value
      await plugin.saveData(CHAT_HISTORY_STORAGE, updatedHistory)
      console.log('Saved chat history for document:', documentId)
    } catch (error) {
      console.error('Error saving chat history:', error)
    }
  }

  /**
   * Switch to a different document's chat history
   */
  const switchToDocument = async (newDocumentId: string | null) => {
    // Save current document's history if it exists
    if (currentDocumentId.value) {
      await saveChatHistory(currentDocumentId.value)
    }

    // Load new document's history
    if (newDocumentId) {
      await loadChatHistory(newDocumentId)
    } else {
      messages.value = []
    }

    currentDocumentId.value = newDocumentId
  }

  /**
   * Add a message to the current chat history
   */
  const addMessageToHistory = (message: Message) => {
    messages.value.push(message)
  }

  /**
   * Clear current chat history
   */
  const clearHistory = () => {
    messages.value = []
  }

  return {
    messages,
    currentDocumentId,
    loadChatHistory,
    saveChatHistory,
    switchToDocument,
    addMessageToHistory,
    clearHistory
  }
}
