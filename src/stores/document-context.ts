/**
 * Pinia Store for Document Context
 * Manages the currently active document state with reactive updates
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface DocumentContext {
  documentId: string | null
  blockId: string | null
  documentName: string | null
  lastUpdateTime: number
}

export const useDocumentContextStore = defineStore('documentContext', () => {
  // State
  const documentContext = ref<DocumentContext>({
    documentId: null,
    blockId: null,
    documentName: null,
    lastUpdateTime: 0
  })

  // Getters
  const hasDocumentContext = computed(() => {
    return !!(documentContext.value.documentId || documentContext.value.blockId)
  })

  const documentName = computed(() => {
    return documentContext.value.documentName || ''
  })

  // Actions
  function updateDocumentContext(documentId?: string, blockId?: string, documentName?: string) {
    documentContext.value = {
      documentId: documentId || null,
      blockId: blockId || null,
      documentName: documentName || null,
      lastUpdateTime: Date.now()
    }
  }

  function getDocumentContext() {
    return { ...documentContext.value }
  }

  return {
    // State
    documentContext,
    
    // Getters
    hasDocumentContext,
    documentName,
    
    // Actions
    updateDocumentContext,
    getDocumentContext
  }
})

