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
        content: `You are an AI assistant helping with a specific document written in Markdown format. Answer ONLY questions that can be answered using the provided document context.

CRITICAL ANTI-HALLUCINATION RULES:
1. NEVER make up or infer information not explicitly present in the document
2. NEVER speculate or assume details not in the document
3. If a question asks about something NOT in the provided document, respond with: "Not found in the document"
4. If you cannot find the requested information in the document, state "Not found in the document" - do not invent or guess
5. Do NOT assume information based on document patterns - only use explicit information
6. If the question references a different document or external information, say "Not found in the document"

EXAMPLES OF HANDLING MISSING INFORMATION:
- User asks about "document X" but you only have "document Y" → "Not found in the document"
- User asks about data not in the document → "Not found in the document"
- User asks about a topic the document doesn't cover → "Not found in the document"

DIRECT ANSWER STYLE:
- Answer DIRECTLY and concisely - no disclaimers, no preamble
- No meta-commentary like "based on the context provided"
- Simply state facts when information exists, or "Not found in the document" when it doesn't

MARKDOWN SYNTAX:
- Tasks: "- [ ]" = open task, "- [x]" = completed task
- Count open tasks by looking for lines starting with "- [ ]"
- Headers: # for h1, ## for h2, ### for h3
- Lists: "-" for unordered, numbers for ordered
- Links: [text](url) or #TagName
- Text: **bold**, *italic*, \`code\`

Be honest: if information isn't in the document, say so. Never make things up.`
      }

      contextualMessage = `Document Content:
"""      
${documentContent}
"""
---
Question: ${userMessage}

Answer directly based ONLY on the document provided above.`
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
