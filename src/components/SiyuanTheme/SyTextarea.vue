<template>
  <textarea
    class="b3-text-field fn__block"
    :value="modelValue"
    :disabled="disabled"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  ></textarea>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  disabled?: boolean
}>()
defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>
