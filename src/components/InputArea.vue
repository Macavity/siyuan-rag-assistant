<template>
  <!-- Input Area -->
  <div class="input-area-wrapper">
    <!-- Document button at top -->
    <div class="input-area-header">
      <DocumentReference 
        v-if="hasDocumentContext && (documentContext.documentId || documentContext.blockId)"
        :id="documentContext.documentId || documentContext.blockId"
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
    
    <!-- Send button at bottom -->
    <div class="input-area-footer">
      <SyButton 
        class="send-button ariaLabel"
        :aria-label="`Send ⏎`"
        @click="handleSend"
        :disabled="!isConfigured || isLoading"
      >
        <SyIcon name="iconSend" size="14" />
      </SyButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import StealthTextarea from './SiyuanTheme/StealthTextarea.vue'
import SyButton from './SiyuanTheme/SyButton.vue'
import SyIcon from './SiyuanTheme/SyIcon.vue'
import DocumentReference from './SiyuanTheme/DocumentReference.vue'

defineProps<{
  modelValue: string
  hasDocumentContext: boolean
  documentContext: any
  documentName: string
  isConfigured: boolean
  isLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'send'): void
  (e: 'document-click'): void
}>()

// Handle document button click
const handleDocumentClick = () => {
  emit('document-click')
}

// Handle keydown for Enter key
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

// Handle send button click
const handleSend = () => {
  emit('send')
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
  justify-content: flex-end;
}

.send-button {
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

</style>

