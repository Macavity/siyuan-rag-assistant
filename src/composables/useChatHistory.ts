/**
 * Composable for managing chat history per document
 * Handles loading, saving, and switching between document chat histories
 * Uses per-file storage: chat-history/${documentId}
 */

import { ref, Ref } from 'vue'
import { CHAT_HISTORY_PREFIX } from '@/constants'
import {Message} from "@/types/message.ts";

export function useChatHistory(plugin: any) {
  const messages: Ref<Message[]> = ref([])
  let currentDocumentId: Ref<string | null> = ref(null)
  let isSaving = false
  let saveTimeout: ReturnType<typeof setTimeout> | null = null

  /**
   * Get storage name for a specific document
   */
  const getStorageName = (documentId: string): string => {
    return `${CHAT_HISTORY_PREFIX}_${documentId}`
  }

  /**
   * Load chat history for a specific document
   */
  const loadChatHistory = async (documentId: string) => {
    try {
      const storageName = getStorageName(documentId)
      const result = await plugin.loadData(storageName)
      
      // Check if the response is an error object (has code property)
      if (result && typeof result === 'object' && 'code' in result) {
        // File doesn't exist or other error - treat as empty history
        messages.value = []
        return
      }
      
      // Check if result is a valid array
      if (result && Array.isArray(result)) {
        messages.value = result
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
    if (!documentId || isSaving) {
      return
    }

    try {
      isSaving = true
      const storageName = getStorageName(documentId)
      await plugin.saveData(storageName, messages.value)
      console.log('Saved chat history for document:', documentId)
    } catch (error) {
      console.error('Error saving chat history:', error)
    } finally {
      isSaving = false
    }
  }

  /**
   * Debounced save function to avoid too many writes
   */
  const debouncedSave = (documentId: string | null) => {
    if (!documentId) {
      return
    }

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    // Schedule save after a short delay
    saveTimeout = setTimeout(async () => {
      await saveChatHistory(documentId)
      saveTimeout = null
    }, 300)
  }

  /**
   * Switch to a different document's chat history
   * Note: Flushes any pending saves for current document, but doesn't trigger new saves
   * Saves only happen automatically when messages are modified
   */
  const switchToDocument = async (newDocumentId: string | null) => {
    // Cancel any pending debounced saves for the current document
    if (saveTimeout) {
      clearTimeout(saveTimeout)
      saveTimeout = null
    }

    // Wait for any in-flight save to complete before switching
    while (isSaving) {
      await new Promise(resolve => setTimeout(resolve, 10))
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
   * Add a message to the current chat history and auto-save
   */
  const addMessageToHistory = (message: Message) => {
    messages.value.push(message)
    // Trigger debounced save
    debouncedSave(currentDocumentId.value)
  }

  /**
   * Clear current chat history and auto-save
   */
  const clearHistory = () => {
    messages.value = []
    // Trigger debounced save
    debouncedSave(currentDocumentId.value)
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
