<template>
  <!-- Input Area -->
  <div class="input-area-wrapper">
    <!-- Document button at top -->
    <div class="input-area-header">
      <DocumentReference
        v-if="hasDocumentContext && documentContext.documentId"
        :id="documentContext.documentId"
        :title="documentName"
        @click="handleDocumentClick"
      />
    </div>

    <!-- Input field with border -->
    <div class="input-field-container">
      <StealthTextarea
        :model-value="modelValue"
        placeholder="Your prompt here..."
        :disabled="!isConfigured || isLoading"
        @update:model-value="$emit('update:modelValue', $event)"
        @keydown="handleKeydown"
      />
    </div>

    <!-- Footer with clear and send buttons -->
    <div class="input-area-footer">
      <SyIconButton
        class="clear-button ariaLabel"
        iconName="iconTrashcan"
        ariaLabel="Clear chat history"
        :disabled="!isConfigured || isLoading"
        @click="handleClearHistory"
      />
      <SyIconButton
        class="send-button ariaLabel"
        iconName="iconSend"
        ariaLabel="Send"
        :disabled="!isConfigured || isLoading"
        @click="handleSend"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import DocumentReference from "./DocumentReference.vue"
import StealthTextarea from "./SiyuanTheme/StealthTextarea.vue"
import SyIconButton from "./SiyuanTheme/SyIconButton.vue"
import type { DocumentContext } from "@/stores/document-context.ts"

defineProps<{
  modelValue: string
  hasDocumentContext: boolean
  documentContext: DocumentContext
  documentName: string
  isConfigured: boolean
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
  (e: "send"): void
  (e: "document-click"): void
  (e: "clear-history"): void
}>()

// Handle document button click
const handleDocumentClick = () => {
  emit("document-click")
}

// Handle keydown for Enter key
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

// Handle send button click
const handleSend = () => {
  emit("send")
}

// Handle clear history button click
const handleClearHistory = () => {
  emit("clear-history")
}
</script>

<style lang="scss" scoped>
.input-area-wrapper {
  padding: 0.2em;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--b3-border-color);
  border-radius: var(--b3-border-radius);
}

.input-area-header {
  margin-bottom: 4px;
}

.input-field-container {
  flex: 1;
  display: flex;
  padding: 4px;
}

.input-area-footer {
  margin-top: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.send-button,
.clear-button {
  display: flex;
  align-items: center;
  justify-content: center;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
