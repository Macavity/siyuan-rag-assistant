/**
 * Composable for managing document context integration with chat
 * Handles document switching, context retrieval, and UI state
 */

import { ref, Ref } from 'vue'
import { subscribeToDocumentContext, getCurrentDocumentContent } from '@/utils/document-context'

export function useDocumentContext() {
  const hasDocumentContext: Ref<boolean> = ref(false)
  const documentName: Ref<string> = ref('')
  const documentContext: Ref<any> = ref({})

  /**
   * Build contextual message with document content
   */
  const buildContextualMessage = async (userMessage: string) => {
    let documentContent: string | null = null
    
    if (hasDocumentContext.value) {
      try {
        documentContent = await getCurrentDocumentContent()
      } catch (error) {
        console.error('Error getting document context:', error)
      }
    }

    let contextualMessage = userMessage
    let systemMessage: { role: 'system', content: string } | null = null

    if (documentContent) {
      // Set a system message to establish the behavior
      systemMessage = {
        role: 'system',
        content: `You are an AI assistant helping with a specific document written in Markdown format. Always answer questions based on the provided document context. If information is not in the context, clearly state that. Be concise and accurate.

IMPORTANT MARKDOWN SYNTAX TO RECOGNIZE:
- Tasks/Checkboxes: Look for "- [ ]" (open task) and "- [x]" (completed task)
- Headers: "#" for h1, "##" for h2, "###" for h3, etc.
- Lists: "-" for unordered lists, numbers for ordered lists
- Links: "[text](url)" or block references like "#TagName"
- Bold text: **text**
- Italic text: *text* or _text_
- Code: \`code\` for inline code, triple backticks for code blocks

When counting tasks, specifically look for lines starting with "- [ ]" to count open tasks, and "- [x]" for completed tasks.`
      }

      contextualMessage = `Document Context (Markdown format):
"""      
${documentContent}
"""
---

User Question: ${userMessage}

Please provide your answer based on the document context above. Pay attention to markdown syntax like tasks (- [ ] for open, - [x] for completed), headers (#), lists, links, and formatting.`
    }

    return { contextualMessage, systemMessage }
  }

  /**
   * Open document when block reference is clicked
   */
  const openDocument = (event: MouseEvent) => {
    event.preventDefault()
    const target = event.currentTarget as HTMLElement
    const docId = target.getAttribute('data-id')

    if (docId) {
      // Navigate to the block using SiYuan's block URL
      window.location.href = `siyuan://blocks/${docId}`
    }
  }

  /**
   * Initialize document context subscription
   */
  const initDocumentContext = (onContextChange: (context: any) => void) => {
    return subscribeToDocumentContext((context) => {
      console.log('Document context updated:', context)

      hasDocumentContext.value = !!(context.documentId || context.blockId)
      if (hasDocumentContext.value) {
        documentName.value = context.documentName || 'Current Document'
      } else {
        documentName.value = ''
      }

      documentContext.value = context

      // Call the provided callback
      onContextChange(context)
    })
  }

  return {
    hasDocumentContext,
    documentName,
    documentContext,
    buildContextualMessage,
    openDocument,
    initDocumentContext
  }
}
