<template>
  <button
    class="b3-button b3-button--outline fn__flex-center"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot>Button</slot>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  disabled?: boolean
}>()
defineEmits<{
  (e: "click", event: MouseEvent): void
}>()
</script>
