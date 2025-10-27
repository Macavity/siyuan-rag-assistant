<template>
  <div class="rag-assistant-settings-dialog">
    <div class="rag-assistant-dialog__header">
      <h2 class="rag-assistant-dialog__header-title">RAG Assistant Settings</h2>
      <button
        class="b3-button b3-button--small b3-button--text"
        @click="closeDialog"
      >
        <svg><use href="#iconClose"></use></svg>
      </button>
    </div>

    <div class="rag-assistant-dialog__body">
      <div class="rag-assistant-settings-content">
        <!-- Ollama URL Input -->
        <div class="rag-assistant-setting-item">
          <label class="rag-assistant-setting-label">Ollama URL:</label>
          <SyInput
            v-model="settings.ollamaUrl"
            placeholder="http://localhost:11434"
            @blur="fetchModels"
          />
        </div>

        <!-- Model Selection -->
        <div class="rag-assistant-setting-item">
          <label class="rag-assistant-setting-label">Model:</label>
          <SySelect
            v-model="settings.selectedModel"
            :options="modelOptions"
            :disabled="loadingModels"
          />
          <button
            class="b3-button b3-button--small b3-button--outline"
            @click="fetchModels"
            :disabled="loadingModels"
          >
            Refresh Models
          </button>
        </div>

        <!-- Temperature Slider -->
        <div class="rag-assistant-setting-item">
          <label class="rag-assistant-setting-label">Temperature: {{ settings.temperature }}</label>
          <SySlider
            v-model="settings.temperature"
            :min="0.1"
            :max="1.0"
            :step="0.1"
          />
        </div>

        <!-- Context Free Toggle -->
        <div class="rag-assistant-setting-item rag-assistant-setting-row">
          <label class="rag-assistant-setting-label">Context-Free Chats:</label>
          <SyCheckbox v-model="settings.contextFree" />
        </div>
      </div>
    </div>

    <div class="rag-assistant-dialog__footer">
      <button
        class="b3-button b3-button--cancel"
        @click="closeDialog"
      >
        Cancel
      </button>
      <button
        class="b3-button b3-button--text"
        @click="saveSettings"
      >
        Save
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import SyCheckbox from './SiyuanTheme/SyCheckbox.vue'
import SyInput from './SiyuanTheme/SyInput.vue'
import SySelect from './SiyuanTheme/SySelect.vue'
import SySlider from './SiyuanTheme/SySlider.vue'
import { fetchOllamaModels } from '@/services/ollama'
import { pushMsg } from '@/api'
import { type RAGAssistantSettings, DEFAULT_SETTINGS } from '@/types/settings'

const props = defineProps<{
  onClose: () => void
  onSave: (settings: RAGAssistantSettings) => void
  savedSettings?: RAGAssistantSettings
}>()

const loadingModels = ref(false)
const settings = ref<RAGAssistantSettings>({ ...DEFAULT_SETTINGS })
const modelOptions = ref<Array<{ value: string; text: string }>>([
  { value: '', text: 'Loading...' },
])

// Load settings from plugin storage
onMounted(async () => {
  try {
    const savedSettings = props.savedSettings
    if (savedSettings) {
      settings.value = { ...DEFAULT_SETTINGS, ...savedSettings }
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }

  // Fetch models if URL is available
  if (settings.value.ollamaUrl) {
    await fetchModels()
  }
})

// Watch for URL changes to auto-fetch models
watch(() => settings.value.ollamaUrl, async (newUrl) => {
  if (newUrl && newUrl.trim() !== '') {
    await fetchModels()
  }
})

async function fetchModels() {
  if (!settings.value.ollamaUrl || settings.value.ollamaUrl.trim() === '') {
    modelOptions.value = [{ value: '', text: 'Please enter Ollama URL' }]
    return
  }

  loadingModels.value = true
  try {
    const models = await fetchOllamaModels(settings.value.ollamaUrl)
    
    if (models.length === 0) {
      modelOptions.value = [{ value: '', text: 'No models available' }]
      return
    }

    modelOptions.value = models.map((model) => ({
      value: model.name,
      text: model.name,
    }))

    // Auto-select first model if current selection is invalid
    if (!modelOptions.value.find(m => m.value === settings.value.selectedModel)) {
      settings.value.selectedModel = modelOptions.value[0].value
    }
    
    pushMsg('Models loaded successfully')
  } catch (error) {
    console.error('Failed to fetch models:', error)
    modelOptions.value = [{ value: '', text: 'Failed to fetch models' }]
  } finally {
    loadingModels.value = false
  }
}

function closeDialog() {
  props.onClose()
}

function saveSettings() {
  props.onSave(settings.value)
  closeDialog()
}
</script>

<style scoped>
.rag-assistant-settings-dialog {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: var(--b3-theme-surface);
  border-radius: var(--b3-border-radius-b);
}

.rag-assistant-dialog__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--b3-border-color);
}

.rag-assistant-dialog__header-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--b3-theme-on-surface);
}

.rag-assistant-dialog__body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.rag-assistant-settings-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rag-assistant-setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rag-assistant-setting-row {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.rag-assistant-setting-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--b3-theme-on-surface);
}

.rag-assistant-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid var(--b3-border-color);
}
</style>

