<template>
  <button
    class="block__icon fn__flex-center ariaLabel"
    :disabled="disabled"
    :aria-label="ariaLabel"
    @click="$emit('click', $event)"
  >
    <svg
      :style="{
        fontSize: size,
        width: size,
        height: size,
        color: disabled ? 'var(--b3-empty-color)' : undefined,
      }"
      class="enSyIcon"
    >
      <use :xlink:href="`#${iconName}`"></use>
    </svg>
  </button>
</template>

<script setup lang="ts">
defineProps({
  iconName: String,
  ariaLabel: String,
  size: {
    type: [Number, String],
    default: 14,
  },
  disabled: Boolean,
})
defineEmits<{
  (e: "click", event: MouseEvent): void
}>()
</script>

<style lang="scss" scoped>
.block__icon {
  opacity: 1;
}
</style>
