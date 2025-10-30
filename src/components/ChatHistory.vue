<template>
  <div ref="historyContainerRef" class="chat-history">
    <div v-for="(message, index) in messages" :key="index" class="message" :class="[message.role]">
      <div class="message-content-wrapper">
        <div class="message-content">
          <div v-html="formatMessage(message.content)"></div>
          <!-- Footer with buttons inside message bubble for assistant messages -->
          <div v-if="message.role === 'assistant'" class="message-footer">
            <div class="message-footer-left">
              <SyIconButton
                v-if="isLastMessage(index)"
                class="footer-button ariaLabel"
                iconName="iconRefresh"
                ariaLabel="Rewrite response"
                @click="$emit('rewrite', index)"
              />
            </div>
            <div class="message-footer-right">
              <SyIconButton
                class="footer-button ariaLabel"
                iconName="iconCopy"
                ariaLabel="Copy message"
                @click="copyToClipboard(message.content)"
              />
            </div>
          </div>
        </div>
      </div>
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
</template>

<script setup lang="ts">
import type { Message } from "@/types/message"
import { ref } from "vue"
import SyIconButton from "./SiyuanTheme/SyIconButton.vue"

const props = defineProps<{
  messages: Message[]
  isLoading: boolean
}>()

defineEmits<{
  (e: "rewrite", index: number): void
}>()

// Check if this is the last message in the array
const isLastMessage = (index: number) => {
  return index === props.messages.length - 1
}

const historyContainerRef = ref<HTMLElement | null>(null)

// Scroll chat history to bottom
const scrollToBottom = () => {
  if (historyContainerRef.value) {
    historyContainerRef.value.scrollTop = historyContainerRef.value.scrollHeight
  }
}

defineExpose<{
  scrollToBottom: () => void
}>({
  scrollToBottom,
})

// Format message content - convert newlines to HTML breaks
const formatMessage = (content: string) => {
  if (!content) return ""
  return content.replace(/\n/g, "<br>")
}

// Copy message content to clipboard
const copyToClipboard = async (content: string) => {
  try {
    const plainText = content.replace(/<br>/g, "\n").replace(/<[^>]*>/g, "")
    await navigator.clipboard.writeText(plainText)
    console.log("Message copied to clipboard")
  } catch (error) {
    console.error("Failed to copy message:", error)
    // Fallback for older browsers
    const textarea = document.createElement("textarea")
    const plainText = content.replace(/<br>/g, "\n").replace(/<[^>]*>/g, "")
    textarea.value = plainText
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand("copy")
      console.log("Message copied to clipboard (fallback)")
    } catch (err) {
      console.error("Failed to copy message (fallback):", err)
    }
    document.body.removeChild(textarea)
  }
}
</script>

<style lang="scss" scoped>
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

    .message-content-wrapper {
      position: relative;
      max-width: 80%;
    }

    .message-content {
      background-color: var(--b3-theme-primary);
      color: var(--b3-theme-on-primary);
      border-radius: var(--b3-border-radius);
      padding: 8px 12px;
      word-wrap: break-word;
      user-select: text;
    }
  }

  &.assistant {
    align-items: flex-start;

    .message-content-wrapper {
      position: relative;
      max-width: 80%;
    }

    .message-content {
      position: relative;
      background-color: var(--b3-theme-surface-lighter);
      color: var(--b3-theme-on-surface);
      border-radius: var(--b3-border-radius);
      padding: 8px 12px;
      word-wrap: break-word;
      user-select: text;
    }
  }
}

.message-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.2em;
  padding-top: 0.2em;
  border-top: 1px solid var(--b3-border-color);
}

.message-footer-left,
.message-footer-right {
  display: flex;
  gap: 4px;
}

.footer-button {
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
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
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}
</style>
