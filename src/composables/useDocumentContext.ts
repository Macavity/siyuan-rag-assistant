import type { RAGAssistantSettings } from "@/types/settings"
/**
 * Composable for managing document context integration with chat
 * Handles document switching, context retrieval, and UI state
 */
import { computed, watch } from "vue"
import { LOG_PREFIX } from "@/constants"
import { type DocumentContext, useDocumentContextStore } from "@/stores/document-context"
import { getBlockData, getDocumentMarkdown, listDirectoryDocuments } from "@/utils/document-helpers"

export function useDocumentContext() {
  const store = useDocumentContextStore()

  const hasDocumentContext = computed(() => store.hasDocumentContext)
  const documentName = computed(() => store.documentName)
  const documentContext = computed(() => store.getDocumentContext())

  /**
   * Get the current document content with business logic to handle documentId vs blockId
   */
  const getCurrentDocumentContent = async (): Promise<string | null> => {
    const context = store.getDocumentContext()
    const { documentId } = context

    console.log(LOG_PREFIX, "getCurrentDocumentContent", "Starting with context:", { documentId })

    if (!documentId) {
      console.log(LOG_PREFIX, "getCurrentDocumentContent", "No documentId, returning null")
      return null
    }

    return await getDocumentMarkdown(documentId)
  }

  /**
   * Get sub-document content with business logic
   */
  const getSubDocumentsContent = async (
    notebookId: string,
    path: string,
    includeSubDocuments: boolean,
  ): Promise<string | null> => {
    if (!includeSubDocuments) {
      return null
    }

    try {
      const result = await listDirectoryDocuments(notebookId, path)

      if (!result?.files || result.files.length === 0) {
        return null
      }

      const subDocumentsContent: string[] = []

      // Fetch content for each sub-document
      for (const file of result.files) {
        try {
          const content = await getDocumentMarkdown(file.id)
          if (content) {
            const subDocumentHeadline = file.name
              ? `## Sub-Document ${file.name}:`
              : `## Sub-Document Content:`
            subDocumentsContent.push(`${subDocumentHeadline}\n${content}`)
          }
        } catch (error) {
          console.error(
            LOG_PREFIX,
            "getSubDocumentsContent",
            `Error fetching content for ${file.id}:`,
            error,
          )
        }
      }

      if (subDocumentsContent.length <= 0) {
        return null
      }

      return subDocumentsContent.join("\n\n---\n\n")
    } catch (error) {
      console.error(
        LOG_PREFIX,
        "getSubDocumentsContent",
        "Error getting sub-documents content:",
        error,
      )
      return null
    }
  }

  /**
   * Get document-related content (main document + sub-documents)
   */
  const getDocumentAndSubDocumentsContent = async (settings: RAGAssistantSettings) => {
    let documentContent: string | null = null
    let subDocumentsContent: string | null = null

    if (store.hasDocumentContext) {
      try {
        documentContent = await getCurrentDocumentContent()

        // Get sub-documents if the setting is enabled
        const context = store.getDocumentContext()
        const docId = context.documentId
        if (settings.includeSubDocuments && docId) {
          try {
            const block = await getBlockData(docId)
            if (block?.path && block?.box) {
              subDocumentsContent = await getSubDocumentsContent(block.box, block.path, true)
            }
          } catch (error) {
            console.error(
              LOG_PREFIX,
              "getDocumentAndSubDocumentsContent",
              "Error getting sub-documents:",
              error,
            )
          }
        }
      } catch (error) {
        console.error(
          LOG_PREFIX,
          "getDocumentAndSubDocumentsContent",
          "Error getting document context:",
          error,
        )
      }
    }

    return {
      documentContent,
      subDocumentsContent,
    }
  }

  /**
   * Build contextual message with document content
   */
  const buildContextualMessage = async (userMessage: string, settings: RAGAssistantSettings) => {
    const { documentContent, subDocumentsContent } =
      await getDocumentAndSubDocumentsContent(settings)

    if (!documentContent && !subDocumentsContent) {
      return userMessage
    }

    let fullContent = documentContent || ""

    // Append sub-documents if available
    if (subDocumentsContent) {
      fullContent += `\n\n# Sub Documents\n\n${subDocumentsContent}`
    }

    return `Document Content:
"""
${fullContent}
"""
---
Question: ${userMessage}

Answer directly based ONLY on the document provided above.`
  }

  /**
   * Open document when block reference is clicked
   */
  const openDocument = (event: MouseEvent) => {
    event.preventDefault()
    const target = event.currentTarget as HTMLElement
    const docId = target.getAttribute("data-id")

    if (docId) {
      // Navigate to the block using SiYuan's block URL
      window.location.href = `siyuan://blocks/${docId}`
    }
  }

  /**
   * Initialize document context subscription (now using Pinia reactivity)
   */
  const initDocumentContext = (onContextChange: (context: DocumentContext) => void) => {
    // Track the last context to prevent duplicate callbacks
    let lastContext = store.getDocumentContext()

    // Watch for changes in the document context store
    // Watch the documentContext ref directly for reactivity
    const stopWatcher = watch(
      () => store.documentContext,
      (newContext) => {
        // Only trigger if documentId actually changed
        const newDocId = newContext.documentId
        const lastDocId = lastContext.documentId

        if (newDocId !== lastDocId) {
          lastContext = { ...newContext }
          onContextChange(newContext)
        }
      },
      { deep: true },
    )

    // Return unsubscribe function
    return () => {
      stopWatcher()
    }
  }

  return {
    hasDocumentContext,
    documentName,
    documentContext,
    buildContextualMessage,
    openDocument,
    initDocumentContext,
  }
}
