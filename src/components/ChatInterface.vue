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
import { ref, onMounted, nextTick } from 'vue'
import SyTextarea from './SiyuanTheme/SyTextarea.vue'
import SyButton from './SiyuanTheme/SyButton.vue'
import { sendChatMessage } from '@/services/ollama'
import { pushErrMsg } from '@/api'
import { usePlugin } from '@/main'
import RAGAssistantPlugin from '@/index'

const plugin = usePlugin() as unknown as RAGAssistantPlugin

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const messages = ref<Message[]>([])
const currentInput = ref('')
const historyContainer = ref<HTMLDivElement>()
const isConfigured = ref(false)

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

  // Add user message to history
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

    // Send message to Ollama
    const response = await sendChatMessage(
      settings.ollamaUrl,
      settings.selectedModel,
      messages.value,
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

