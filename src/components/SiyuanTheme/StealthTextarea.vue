<template>
  <textarea
    class="stealth-textarea"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    @keydown="(e) => $emit('keydown', e)"
  ></textarea>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  placeholder?: string
  disabled?: boolean
}>()

defineEmits<{
  (e: "update:modelValue", value: string): void
  (e: "keydown", event: KeyboardEvent): void
}>()
</script>

<style lang="scss" scoped>
.stealth-textarea {
  width: 100%;
  min-height: 60px;
  max-height: 150px;
  resize: vertical;
  font-size: 14px;
  border: none !important;
  background: transparent;
  color: var(--b3-theme-on-surface);
  outline: none;
  resize: none;

  &:focus {
    border: none !important;
    outline: none !important;
    box-shadow: none;
  }

  &::placeholder {
    color: var(--b3-theme-on-surface-light);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
