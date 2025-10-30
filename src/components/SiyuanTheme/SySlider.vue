<template>
  <div class="rag-assistant-slider-container">
    <input
      class="rag-assistant-slider"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      @input="$emit('update:modelValue', parseFloat(($event.target as HTMLInputElement).value))"
      v-bind="$attrs"
    />
    <span class="rag-assistant-slider-value">{{ displayValue }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"

const props = defineProps<{
  modelValue: number
  min?: number
  max?: number
  step?: number
}>()

defineEmits(["update:modelValue"])

const displayValue = computed(() => {
  return props.modelValue.toFixed(2)
})
</script>

<style scoped>
.rag-assistant-slider-container {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.rag-assistant-slider {
  flex: 1;
}

.rag-assistant-slider-value {
  min-width: 40px;
  text-align: right;
  font-size: 12px;
  color: var(--b3-theme-on-surface);
}
</style>
