/**
 * Document Content Helpers
 * Pure utility functions for fetching document content from SiYuan API
 * These are thin wrappers around API calls with no business logic
 */

import { exportMdContent, getBlockByID, listDocsByPath } from "@/api"
import { LOG_PREFIX } from "@/constants.ts"

/**
 * Get document markdown content by document ID
 */
export async function getDocumentMarkdown(documentId: string): Promise<string | null> {
  try {
    const result = await exportMdContent(documentId)
    return result?.content || null
  } catch (error) {
    console.error(LOG_PREFIX, "getDocumentMarkdown", "Error getting document markdown:", error)
    return null
  }
}

/**
 * Get block data by ID
 */
export async function getBlockData(blockId: string) {
  try {
    return await getBlockByID(blockId)
  } catch (error) {
    console.error(LOG_PREFIX, "getBlockData", "Error getting block data:", error)
    return null
  }
}

/**
 * List documents in a directory
 */
export async function listDirectoryDocuments(notebookId: string, path: string) {
  try {
    return await listDocsByPath(notebookId, path)
  } catch (error) {
    console.error(LOG_PREFIX, "listDirectoryDocuments", "Error listing directory documents:", error)
    return null
  }
}
