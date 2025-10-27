/**
 * Document Context Management
 * Tracks the currently open document in SiYuan and provides utilities to get document content
 */

import { exportMdContent, getBlockKramdown, getBlockByID, listDocsByPath } from '@/api'

interface DocumentContext {
  documentId: string | null
  blockId: string | null
  documentName: string | null
  lastUpdateTime: number
}

let documentContext: DocumentContext = {
  documentId: null,
  blockId: null,
  documentName: null,
  lastUpdateTime: 0
}

const subscribers: Array<(context: DocumentContext) => void> = []

/**
 * Update the current document context
 */
export function updateDocumentContext(documentId?: string, blockId?: string, documentName?: string) {
  documentContext = {
    documentId: documentId || null,
    blockId: blockId || null,
    documentName: documentName || null,
    lastUpdateTime: Date.now()
  }
  
  // Notify all subscribers
  subscribers.forEach(sub => sub(documentContext))
}

/**
 * Get the current document context
 */
export function getCurrentDocumentContext(): DocumentContext {
  return { ...documentContext }
}

/**
 * Subscribe to document context changes
 */
export function subscribeToDocumentContext(callback: (context: DocumentContext) => void) {
  subscribers.push(callback)
  
  // Return unsubscribe function
  return () => {
    const index = subscribers.indexOf(callback)
    if (index > -1) {
      subscribers.splice(index, 1)
    }
  }
}

/**
 * Get the content of the current document as markdown
 */
export async function getCurrentDocumentContent(): Promise<string | null> {
  const { documentId, blockId } = documentContext
  
  if (!documentId && !blockId) {
    return null
  }

  try {
    let actualDocumentId = documentId
    
    // If we have a document ID, use it directly
    if (documentId) {
      const result = await exportMdContent(documentId)
      return result?.content || null
    }
    
    // If we only have a block ID, try to resolve the root document ID from the block
    if (blockId && !documentId) {
      try {
        const block = await getBlockByID(blockId)
        actualDocumentId = block?.root_id || blockId
        
        // If we got a valid root_id, export the full document
        if (actualDocumentId && actualDocumentId !== blockId) {
          const result = await exportMdContent(actualDocumentId)
          return result?.content || null
        }
        
        // Otherwise, just get the kramdown for this specific block
        const result = await getBlockKramdown(blockId)
        return result?.kramdown || null
      } catch (blockError) {
        console.error('Error getting block info:', blockError)
        // Fall back to just getting the block kramdown
        const result = await getBlockKramdown(blockId)
        return result?.kramdown || null
      }
    }
  } catch (error) {
    console.error('Error getting document content:', error)
    return null
  }
  
  return null
}

/**
 * Get content of sub-documents under a path
 */
export async function getSubDocumentsContent(
  notebookId: string,
  path: string,
  includeSubDocuments: boolean
): Promise<string | null> {
  if (!includeSubDocuments) {
    return null
  }

  try {
    const result = await listDocsByPath(notebookId, path)
    
    if (!result?.files || result.files.length === 0) {
      return null
    }

    const subDocumentsContent: string[] = []

    // Fetch content for each sub-document
    for (const file of result.files) {
      try {
        const content = await getDocumentContentById(file.id)
        if (content) {
          // Use the file name as the header
          const fileName = file.alias || file.name || 'Untitled'
          subDocumentsContent.push(`## ${fileName}\n\n${content}`)
        }
      } catch (error) {
        console.error(`Error fetching content for ${file.name}:`, error)
      }
    }

    if (subDocumentsContent.length > 0) {
      return subDocumentsContent.join('\n\n---\n\n')
    }

    return null
  } catch (error) {
    console.error('Error getting sub-documents content:', error)
    return null
  }
}

/**
 * Get document content by ID
 */
export async function getDocumentContentById(documentId: string): Promise<string | null> {
  try {
    const result = await exportMdContent(documentId)
    return result?.content || null
  } catch (error) {
    console.error('Error getting document content by ID:', error)
    return null
  }
}
