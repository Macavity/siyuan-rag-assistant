import {
  Dialog,
  Plugin,
  getFrontend,
} from "siyuan";
import "@/index.scss";
import PluginInfoString from '@/../plugin.json'
import { destroy, init } from '@/main'
import { createApp } from 'vue'
import SettingsDialog from '@/components/SettingsDialog.vue'
import { type RAGAssistantSettings, STORAGE_NAME, DEFAULT_SETTINGS } from '@/types/settings'

let PluginInfo = {
  version: '',
}
try {
  PluginInfo = PluginInfoString
} catch (err) {
  console.log('Plugin info parse error: ', err)
}
const {
  version,
} = PluginInfo

export default class RAGAssistantPlugin extends Plugin {
  // Run as mobile
  public isMobile: boolean
  // Run in browser
  public isBrowser: boolean
  // Run as local
  public isLocal: boolean
  // Run in Electron
  public isElectron: boolean
  // Run in window
  public isInWindow: boolean
  public platform: SyFrontendTypes
  public readonly version = version

  async onload() {
    const frontEnd = getFrontend();
    this.platform = frontEnd as SyFrontendTypes
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile"
    this.isBrowser = frontEnd.includes('browser')
    this.isLocal =
      location.href.includes('127.0.0.1')
      || location.href.includes('localhost')
    this.isInWindow = location.href.includes('window.html')

    try {
      require("@electron/remote")
        .require("@electron/remote/main")
      this.isElectron = true
    } catch (err) {
      this.isElectron = false
    }

    console.log('Plugin loaded, the plugin is ', this)

    init(this)
  }

  onunload() {
    destroy()
  }

  async openSetting() {
    await this.createSettingsDialog()
  }
  
  async createSettingsDialog() {
    const dialog = new Dialog({
      title: '',
      transparent: true,
      content: `<div id="rag-assistant-settings-dialog-container" style="width: 100%; height: 100%;"></div>`,
      width: '600px',
      height: '500px',
    })
    
    const container = dialog.element.querySelector('#rag-assistant-settings-dialog-container')
    if (container) {
      // Load existing settings
      const savedSettings = await this.loadData(STORAGE_NAME) as RAGAssistantSettings | null
      
      const app = createApp(SettingsDialog, {
        onClose: () => {
          dialog.destroy()
        },
        onSave: async (settings: RAGAssistantSettings) => {
          await this.saveData(STORAGE_NAME, settings)
          dialog.destroy()
        },
        savedSettings
      })
      
      app.mount(container as Element)
      
      const originalDestroy = dialog.destroy.bind(dialog)
      dialog.destroy = () => {
        app.unmount()
        originalDestroy()
      }
    }
    
    return dialog
  }
  
  /**
   * Get the current settings
   */
  async getSettings(): Promise<RAGAssistantSettings> {
    const savedSettings = await this.loadData(STORAGE_NAME) as RAGAssistantSettings | null
    return savedSettings || { ...DEFAULT_SETTINGS }
  }
}
