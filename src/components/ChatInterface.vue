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
        <div class="message-content">
          {{ message.content }}
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="input-area">
      <!-- Document context indicator -->
      <div v-if="hasDocumentContext" class="context-indicator">
        <div class="context-icon">📄</div>
        <div class="context-text">
          <span 
            v-if="documentContext.documentId || documentContext.blockId"
            class="block-ref" 
            :data-type="'block-ref'" 
            :data-id="documentContext.documentId || documentContext.blockId"
            :data-subtype="'d'"
            @click="openDocument"
          >
            {{ documentName ? documentName : 'Current Document' }}
          </span>
          <span v-else>{{ documentName ? documentName : 'Current Document' }}</span>
        </div>
      </div>
      
      <label class="input-label">Ask a question</label>
      <SyTextarea 
        v-model="currentInput"
        class="input-textarea"
        :disabled="!isConfigured"
        @keydown.ctrl.enter="sendMessage"
      />
      <SyButton 
        class="send-button"
        @click="sendMessage"
        :disabled="!isConfigured"
      >
        Send
      </SyButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue'
import SyTextarea from './SiyuanTheme/SyTextarea.vue'
import SyButton from './SiyuanTheme/SyButton.vue'
import { sendChatMessage } from '@/services/ollama'
import { pushErrMsg } from '@/api'
import { usePlugin } from '@/main'
import RAGAssistantPlugin from '@/index'
import { getCurrentDocumentContent, subscribeToDocumentContext } from '@/utils/document-context'

const plugin = usePlugin() as unknown as RAGAssistantPlugin

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const messages = ref<Message[]>([])
const currentInput = ref('')
const historyContainer = ref<HTMLDivElement>()
const isConfigured = ref(false)
const hasDocumentContext = ref(false)
const documentName = ref<string>('')
const documentContext = ref<any>({})

// Subscribe to document context changes
const unsubscribe = subscribeToDocumentContext((context) => {
    console.log('Document context updated:', context)
  documentContext.value = context
  hasDocumentContext.value = !!(context.documentId || context.blockId)
  if (hasDocumentContext.value) {
    documentName.value = context.documentName || 'Current Document'
  } else {
    documentName.value = ''
  }
})

onBeforeUnmount(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

// Open document when block reference is clicked
const openDocument = (event: MouseEvent) => {
  event.preventDefault()
  const target = event.currentTarget as HTMLElement
  const docId = target.getAttribute('data-id')
  
  if (docId) {
    // Navigate to the block using SiYuan's block URL
    window.location.href = `siyuan://blocks/${docId}`
  }
}

// Check if settings are configured
onMounted(async () => {
  await checkConfiguration()
})

const checkConfiguration = async () => {
  try {
    const settings = await plugin.getSettings()
    isConfigured.value = !!(settings.ollamaUrl && settings.selectedModel)
  } catch (error) {
    console.error('Error checking configuration:', error)
    isConfigured.value = false
  }
}

const sendMessage = async () => {
  if (!currentInput.value.trim()) {
    return
  }

  const userMessage = currentInput.value.trim()
  currentInput.value = ''

  // Get document context if available
  let documentContent: string | null = null
  if (hasDocumentContext.value) {
    try {
      documentContent = await getCurrentDocumentContent()
    } catch (error) {
      console.error('Error getting document context:', error)
    }
  }

  // Build the user message with context
  let contextualMessage = userMessage
  if (documentContent) {
    contextualMessage = `Context from the current document:\n\n${documentContent}\n\n---\n\nUser question: ${userMessage}`
  }

  // Add user message to history (show the original question, not the context)
  messages.value.push({
    role: 'user',
    content: userMessage
  })

  // Scroll to bottom after DOM update
  await nextTick()
  scrollToBottom()

  try {
    // Load settings
    const settings = await plugin.getSettings()

    if (!settings.ollamaUrl || !settings.selectedModel) {
      isConfigured.value = false
      return
    }

    // Update configuration status
    isConfigured.value = true

    // Send message to Ollama with context
    const messagesToSend = [...messages.value]
    // Replace the last user message with the contextual version
    if (documentContent) {
      messagesToSend[messagesToSend.length - 1] = {
        role: 'user',
        content: contextualMessage
      }
    }

    const response = await sendChatMessage(
      settings.ollamaUrl,
      settings.selectedModel,
      messagesToSend,
      settings.temperature
    )

    // Add assistant response to history
    messages.value.push({
      role: 'assistant',
      content: response
    })

    // Scroll to bottom after DOM update
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('Error sending message:', error)
    pushErrMsg('Failed to send message. Please check your Ollama configuration.')
    // Re-check configuration on error
    await checkConfiguration()
  }
}

const scrollToBottom = () => {
  if (historyContainer.value) {
    historyContainer.value.scrollTop = historyContainer.value.scrollHeight
  }
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
  border-bottom: 1px solid var(--b3-border-color);
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
    }
  }
}

.input-area {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.context-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--b3-theme-background-light);
  border: 1px solid var(--b3-border-color);
  border-radius: var(--b3-border-radius);
  font-size: 12px;
  color: var(--b3-theme-on-surface-light);
}

.context-icon {
  flex-shrink: 0;
}

.context-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.block-ref {
  color: var(--b3-theme-primary);
  cursor: pointer;
  text-decoration: underline;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 0.8;
  }
}

.input-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--b3-theme-on-surface);
}

.input-textarea {
  width: 100%;
  min-height: 80px;
  resize: vertical;
}

.send-button {
  align-self: flex-end;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
</style>

