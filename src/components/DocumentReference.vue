<template>
  <button
    class="b3-button b3-button--outline fn__flex-center document-reference-button"
    :data-type="'block-ref'"
    :data-id="id"
    :data-subtype="'d'"
    :disabled="disabled"
    @click="handleClick"
  >
    <SyIcon name="iconFile" size="14" />
    <span class="document-title">{{ title ?? 'Current Document' }}</span>
  </button>
</template>

<script setup lang="ts">
import SyIcon from './SiyuanTheme/SyIcon.vue'

defineProps<{
  id: string
  title?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const handleClick = (event: MouseEvent) => {
  emit('click', event)
}
</script>

<style lang="scss" scoped>
.document-reference-button {
  margin: 0.2em;
  justify-content: flex-start;
  background: transparent !important;
  border: none !important;
  font-size: 13px;
}

.document-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
</style>

