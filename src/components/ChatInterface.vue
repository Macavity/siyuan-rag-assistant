<template>
  <div class="chat-interface">
    <WarningBanner
      v-if="connectionError"
      variant="error"
      title="Ollama Not Responding"
      :message="connectionError"
      :action-button="{
        text: 'Refresh',
        onClick: handleRefreshConnection,
        disabled: isLoading,
      }"
    />

    <WarningBanner
      v-else-if="!isConfigured"
      variant="info"
      title="Configuration Required"
      message="Please configure Ollama URL and model in settings."
    />

    <!-- Chat History Area -->
    <ChatHistory
      ref="chatHistoryRef"
      :messages="messages"
      :is-loading="isLoading"
      @rewrite="handleRewrite"
    />

    <!-- Input Area -->
    <InputArea
      v-model="currentInput"
      :has-document-context="hasDocumentContext"
      :document-context="documentContext"
      :document-name="documentName"
      :is-configured="isConfigured"
      :is-loading="isLoading"
      @send="handleSendMessage"
      @document-click="handleDocumentClick"
      @clear-history="handleClearHistory"
    />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useChatHistory } from "@/composables/useChatHistory"
import { useChatMessages } from "@/composables/useChatMessages"
import { useDocumentContext } from "@/composables/useDocumentContext"
import RAGAssistantPlugin from "@/index"
import { usePlugin } from "@/main"
import {
  buildAssistantMessage,
  buildContextFreeSystemMessage,
  buildContextualSystemMessage,
  buildUserMessage,
} from "@/utils/message-factory.ts"
import ChatHistory from "./ChatHistory.vue"
import InputArea from "./InputArea.vue"
import WarningBanner from "./WarningBanner.vue"
import { LOG_PREFIX } from "@/constants"

const plugin = usePlugin() as unknown as RAGAssistantPlugin

// Initialize composables
const { messages, switchToDocument, addMessageToHistory, clearHistory, removeMessagesFromIndex } =
  useChatHistory(plugin)
const {
  hasDocumentContext,
  documentName,
  documentContext,
  buildContextualMessage,
  initDocumentContext,
} = useDocumentContext()
const {
  isConfigured,
  isLoading,
  connectionError,
  checkConfiguration,
  checkConnection,
  sendMessage,
  clearConnectionError,
} = useChatMessages(plugin)

const currentInput = ref("")
const chatHistoryRef = ref<InstanceType<typeof ChatHistory> | null>(null)

// Scroll to bottom using ChatHistory component's method
const scrollToBottom = (): void => {
  chatHistoryRef.value?.scrollToBottom()
}

// Track the last document ID to prevent unnecessary switches
let lastDocumentId: string | null = null

// Handle document context changes
const unsubscribe = initDocumentContext(async (context) => {
  const newDocumentId = context.documentId

  // Only switch if the document actually changed
  if (newDocumentId !== lastDocumentId) {
    // Switch to the new document's chat history
    // switchToDocument already handles saving the previous document and loading the new one
    await switchToDocument(newDocumentId)
    lastDocumentId = newDocumentId
  }
})

onBeforeUnmount(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

// Track if we've completed initial mount to prevent watcher from firing on mount
const isMounted = ref(false)

// Initialize on mount
onMounted(async () => {
  // Initialize with current document context if available
  const currentDocId = documentContext.value.documentId
  if (currentDocId && !lastDocumentId) {
    lastDocumentId = currentDocId
    await switchToDocument(currentDocId)
  }

  await checkConfiguration()
  // Check connection proactively when panel opens (even if not fully configured)
  // This allows showing connection errors before user configures model
  await checkConnection()
  
  // Mark as mounted after initial checks are complete
  isMounted.value = true
  
  console.debug(LOG_PREFIX, "ChatInterface mounted - connectionError:", connectionError.value)
  scrollToBottom()
})

// Watch for configuration changes and re-check connection
watch(isConfigured, async (newValue) => {
  // Only react to changes after initial mount
  if (!isMounted.value) {
    return
  }
  
  if (newValue) {
    // Only check connection if configured
    await checkConnection()
  } else {
    // Clear connection error if not configured
    clearConnectionError()
  }
})

// Watch for loading state changes and scroll to show indicator
watch(isLoading, async (newValue) => {
  if (newValue) {
    // Loading started, scroll to show the loading indicator
    await nextTick()
    scrollToBottom()
  }
})

// Handle document button click
const handleDocumentClick = (): void => {
  const docId = documentContext.value.documentId
  if (docId) {
    window.location.href = `siyuan://blocks/${docId}`
  }
}

// Handle clear history button click
const handleClearHistory = (): void => {
  clearHistory()
}

// Handle refresh connection button click
const handleRefreshConnection = async (): Promise<void> => {
  clearConnectionError()
  await checkConfiguration()
  await checkConnection()
}

type ContextualMessages = {
  contextualMessage: string
  systemMessage: ReturnType<typeof buildContextFreeSystemMessage> | ReturnType<typeof buildContextualSystemMessage>
}

/**
 * Build contextual message and system message based on settings
 */
const buildContextualMessages = async (
  userMessage: string,
  settings: Awaited<ReturnType<typeof plugin.getSettings>>,
): Promise<ContextualMessages> => {
  if (settings?.contextFree) {
    return {
      contextualMessage: userMessage,
      systemMessage: buildContextFreeSystemMessage(),
    }
  }

  return {
    contextualMessage: await buildContextualMessage(userMessage, settings),
    systemMessage: buildContextualSystemMessage(),
  }
}

/**
 * Send message and handle response
 */
const sendMessageAndHandleResponse = async (
  userMessage: string,
  contextualMessage: string,
  systemMessage: ContextualMessages["systemMessage"],
): Promise<void> => {
  const response = await sendMessage(userMessage, contextualMessage, systemMessage, messages)
  addMessageToHistory(buildAssistantMessage(response))

  await nextTick()
  scrollToBottom()
}

// Handle rewrite button click - removes assistant message and re-sends the request
const handleRewrite = async (assistantIndex: number): Promise<void> => {
  const lastUserIndex = assistantIndex - 1

  if (lastUserIndex < 0 || messages.value[lastUserIndex]?.role !== "user") {
    console.error(LOG_PREFIX, "Cannot rewrite: no user message found before assistant message")
    return
  }

  const userMessage = messages.value[lastUserIndex].content
  removeMessagesFromIndex(assistantIndex)

  await nextTick()
  scrollToBottom()

  const settings = await plugin.getSettings()
  const { contextualMessage, systemMessage } = await buildContextualMessages(userMessage, settings)

  await sendMessageAndHandleResponse(userMessage, contextualMessage, systemMessage)
}

// Handle sending messages
const handleSendMessage = async (event?: MouseEvent | KeyboardEvent): Promise<void> => {
  event?.preventDefault()

  const trimmedInput = currentInput.value.trim()
  if (!trimmedInput || !isConfigured.value) {
    return
  }

  const userMessage = trimmedInput
  currentInput.value = ""

  addMessageToHistory(buildUserMessage(userMessage))
  await nextTick()
  scrollToBottom()

  const settings = await plugin.getSettings()
  const { contextualMessage, systemMessage } = await buildContextualMessages(userMessage, settings)

  await sendMessageAndHandleResponse(userMessage, contextualMessage, systemMessage)
}
</script>

<style lang="scss" scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}
</style>
