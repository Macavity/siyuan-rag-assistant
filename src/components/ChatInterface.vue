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
    <div class="chat-history" ref="historyContainer">
      <div 
        v-for="(message, index) in messages" 
        :key="index" 
        :class="['message', message.role]"
      >
        <div class="message-content" v-html="formatMessage(message.content)"></div>
      </div>
      
      <!-- Loading indicator -->
      <div v-if="isLoading" class="message assistant">
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

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
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import InputArea from './InputArea.vue'
import { usePlugin } from '@/main'
import RAGAssistantPlugin from '@/index'
import { useChatHistory } from '@/composables/useChatHistory'
import { useDocumentContext } from '@/composables/useDocumentContext'
import { useChatMessages } from '@/composables/useChatMessages'

const plugin = usePlugin() as unknown as RAGAssistantPlugin

// Initialize composables
const { messages, switchToDocument, addMessage, saveChatHistory, clearHistory } = useChatHistory(plugin)
const { hasDocumentContext, documentName, documentContext, buildContextualMessage, initDocumentContext } = useDocumentContext()
const { isConfigured, isLoading, historyContainer, checkConfiguration, sendMessage, scrollToBottom } = useChatMessages(plugin)

const currentInput = ref('')

// Format message content - convert newlines to HTML breaks
const formatMessage = (content: string) => {
  if (!content) return ''
  return content.replace(/\n/g, '<br>')
}

// Handle document context changes
const unsubscribe = initDocumentContext(async (context) => {
  const newDocumentId = context.documentId || context.blockId
  
  // Switch to the new document's chat history
  await switchToDocument(newDocumentId)
  
  // Save chat history after messages change
  if (newDocumentId) {
    await saveChatHistory(newDocumentId)
  }
})

onBeforeUnmount(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

// Initialize on mount
onMounted(async () => {
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
  const docId = documentContext.value.documentId || documentContext.value.blockId
  if (docId) {
    // Navigate to the block using SiYuan's block URL
    window.location.href = `siyuan://blocks/${docId}`
  }
}

// Handle clear history button click
const handleClearHistory = async () => {
  const currentDocId = documentContext.value.documentId || documentContext.value.blockId
  if (currentDocId) {
    clearHistory()
    await saveChatHistory(currentDocId)
  }
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

    // Build contextual message
    const { contextualMessage, systemMessage } = await buildContextualMessage(userMessage, settings)

    // Add user message to history
    addMessage({ role: 'user', content: userMessage })

    // Scroll to bottom
    await nextTick()
    scrollToBottom()

    try {
      // Send message via composable
      await sendMessage(userMessage, contextualMessage, systemMessage, messages)
      
      // Save chat history after receiving response
      const currentDocId = documentContext.value.documentId || documentContext.value.blockId
      if (currentDocId) {
        await saveChatHistory(currentDocId)
      }
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

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: var(--b3-theme-surface);
}

.message {
  display: flex;
  flex-direction: column;
  
  &.user {
    align-items: flex-end;
    
    .message-content {
      background-color: var(--b3-theme-primary);
      color: var(--b3-theme-on-primary);
      border-radius: var(--b3-border-radius);
      padding: 8px 12px;
      max-width: 80%;
      word-wrap: break-word;
      user-select: text;
    }
  }
  
  &.assistant {
    align-items: flex-start;
    
    .message-content {
      background-color: var(--b3-theme-surface-lighter);
      color: var(--b3-theme-on-surface);
      border-radius: var(--b3-border-radius);
      padding: 8px 12px;
      max-width: 80%;
      word-wrap: break-word;
      user-select: text;
    }
  }
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

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 0;
  
  span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--b3-theme-primary);
    animation: typing 1.4s infinite;
    
    &:nth-child(1) {
      animation-delay: 0s;
    }
    
    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}
</style>

