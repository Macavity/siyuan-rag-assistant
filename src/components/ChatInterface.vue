<template>
  <div class="chat-interface">
    <!-- Settings Warning -->
    <div v-if="!isConfigured" class="settings-warning">
      <div class="warning-icon">⚠️</div>
      <div class="warning-content">
        <div class="warning-title">Configuration Required</div>
        <div class="warning-message">Please configure Ollama URL and model in settings.</div>
      </div>
    </div>

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
import {ref, onMounted, onBeforeUnmount, nextTick, watch} from 'vue'
import InputArea from './InputArea.vue'
import ChatHistory from './ChatHistory.vue'
import {usePlugin} from '@/main'
import RAGAssistantPlugin from '@/index'
import {useChatHistory} from '@/composables/useChatHistory'
import {useDocumentContext} from '@/composables/useDocumentContext'
import {useChatMessages} from '@/composables/useChatMessages'
import {
  buildContextFreeSystemMessage,
  buildContextualSystemMessage,
  buildUserMessage,
  buildAssistantMessage
} from "@/utils/message-factory.ts";

const plugin = usePlugin() as unknown as RAGAssistantPlugin

// Initialize composables
const {messages, switchToDocument, addMessageToHistory, clearHistory, removeMessagesFromIndex} = useChatHistory(plugin)
const {
  hasDocumentContext,
  documentName,
  documentContext,
  buildContextualMessage,
  initDocumentContext
} = useDocumentContext()
const {isConfigured, isLoading, checkConfiguration, sendMessage} = useChatMessages(plugin)

const currentInput = ref('')
const chatHistoryRef = ref<InstanceType<typeof ChatHistory> | null>(null)

// Scroll to bottom using ChatHistory component's method
const scrollToBottom = () => {
  chatHistoryRef.value?.scrollToBottom()
}

// Track the last document ID to prevent unnecessary switches
let lastDocumentId: string | null = null

// Handle document context changes
const unsubscribe = initDocumentContext(async (context) => {
  const newDocumentId = context.documentId || context.blockId

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

// Initialize on mount
onMounted(async () => {
  // Initialize with current document context if available
  const currentDocId = documentContext.value.documentId
  if (currentDocId && !lastDocumentId) {
    lastDocumentId = currentDocId
    await switchToDocument(currentDocId)
  }

  await checkConfiguration()
  scrollToBottom()
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
const handleDocumentClick = () => {
  const docId = documentContext.value.documentId
  if (docId) {
    // Navigate to the block using SiYuan's block URL
    window.location.href = `siyuan://blocks/${docId}`
  }
}

// Handle clear history button click
const handleClearHistory = () => {
  clearHistory()
  // History is automatically saved by clearHistory via debounced save
}

// Handle rewrite button click - removes assistant message and re-sends the request
const handleRewrite = async (assistantIndex: number) => {
  // Find the last user message before this assistant message
  const lastUserIndex = assistantIndex - 1
  
  if (lastUserIndex < 0 || messages.value[lastUserIndex].role !== 'user') {
    console.error('Cannot rewrite: no user message found before assistant message')
    return
  }

  // Get the user message content
  const userMessage = messages.value[lastUserIndex].content

  // Remove the assistant message (and any messages after it, if any)
  removeMessagesFromIndex(assistantIndex)

  // Scroll to bottom
  await nextTick()
  scrollToBottom()

  // Re-send the request
  try {
    // Get settings
    const settings = await plugin.getSettings()

    // If context-free mode, use general system message and user message as-is
    let contextualMessage = userMessage
    let systemMessage = buildContextFreeSystemMessage();

    // If context-aware mode, build contextual message with document content
    if (!settings?.contextFree) {
      systemMessage = buildContextualSystemMessage();
      contextualMessage = await buildContextualMessage(userMessage, settings);
    }

    // Send message via composable
    const response = await sendMessage(userMessage, contextualMessage, systemMessage, messages)
    
    // Add assistant response to history (auto-saves via debounced save)
    addMessageToHistory(buildAssistantMessage(response))
  } catch (error) {
    // Error already handled in composable
  }

  // Scroll again after response
  await nextTick()
  scrollToBottom()
}

// Handle sending messages
const handleSendMessage = async (event?: MouseEvent | KeyboardEvent) => {
  if (event) {
    event.preventDefault()
  }

  if (!currentInput.value.trim() || !isConfigured.value) {
    return
  }

  const userMessage = currentInput.value.trim()
  currentInput.value = ''

  // Get settings
  const settings = await plugin.getSettings()

  // If context-free mode, use general system message and user message as-is
  let contextualMessage = userMessage
  let systemMessage = buildContextFreeSystemMessage();

  // If context-aware mode, build contextual message with document content
  if (!settings?.contextFree) {
    systemMessage = buildContextualSystemMessage();
    contextualMessage = await buildContextualMessage(userMessage, settings);
  }

  // Add user message to history
  addMessageToHistory(buildUserMessage(userMessage))

  // Scroll to bottom
  await nextTick()
  scrollToBottom()

  try {
    // Send message via composable
    const response = await sendMessage(userMessage, contextualMessage, systemMessage, messages)

    // Add assistant response to history (auto-saves via debounced save)
    addMessageToHistory(buildAssistantMessage(response))
  } catch (error) {
    // Error already handled in composable
  }

  // Scroll again after response
  await nextTick()
  scrollToBottom()
}
</script>

<style lang="scss" scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.settings-warning {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background-color: var(--b3-theme-background-light);
  border-bottom: 1px solid var(--b3-border-color);
  color: var(--b3-theme-on-surface);
}

.warning-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.warning-content {
  flex: 1;
}

.warning-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.warning-message {
  font-size: 14px;
  color: var(--b3-theme-on-surface-light);
}
</style>

