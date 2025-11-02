<template>
  <div :class="warningClass">
    <div class="warning-content">
      <div class="warning-icon">⚠️</div>
      <div class="warning-text">
        <div class="warning-title">{{ title }}</div>
        <div class="warning-message">{{ message }}</div>
      </div>
    </div>
    <SyButton v-if="actionButton" @click="handleActionClick" :disabled="actionButton.disabled">
      {{ actionButton.text }}
    </SyButton>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import SyButton from "./SiyuanTheme/SyButton.vue"

type WarningVariant = "error" | "info"

type ActionButton = {
  text: string
  onClick: () => void
  disabled?: boolean
}

type Props = {
  title: string
  message: string
  variant?: WarningVariant
  actionButton?: ActionButton
}

const props = withDefaults(defineProps<Props>(), {
  variant: "info",
})

const warningClass = computed(() => ({
  warning: true,
  "warning--error": props.variant === "error",
  "warning--info": props.variant === "info",
}))

const handleActionClick = (): void => {
  props.actionButton?.onClick()
}
</script>

<style lang="scss" scoped>
.warning {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  background-color: var(--b3-theme-background-light);
  border-bottom: 1px solid var(--b3-border-color);
  color: var(--b3-theme-on-surface);
}

.warning--error {
  border-left: 3px solid var(--b3-theme-error);
}

.warning--info {
  border-left: 3px solid var(--b3-border-color);
}

.warning-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.warning-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.warning-text {
  flex: 1;
}

.warning-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.warning--error .warning-title {
  color: var(--b3-theme-error);
}

.warning-message {
  font-size: 14px;
  color: var(--b3-theme-on-surface-light);
  line-height: 1.4;
}

.warning--error .warning-message {
  font-size: 13px;
}
</style>
