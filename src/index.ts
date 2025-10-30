import type { RAGAssistantSettings } from "@/types/settings"
import { Dialog, getFrontend, type IEventBusMap, type IProtyle, Plugin } from "siyuan"
import { createApp } from "vue"
import PluginInfoString from "@/../plugin.json"
import { getBlockByID } from "@/api"
import SettingsDialog from "@/components/SettingsDialog.vue"
import { destroy, init } from "@/main"
import { useDocumentContextStore } from "@/stores/document-context.ts"
import { DEFAULT_SETTINGS } from "@/types/settings"
import { LOG_PREFIX, STORAGE_NAME } from "./constants"
import { SiyuanEvents } from "./types/siyuan-events"
import { icons } from "./utils/icons"
import "@/index.scss"

let PluginInfo = {
  version: "",
}
try {
  PluginInfo = PluginInfoString
} catch (err) {
  console.log("Plugin info parse error: ", err)
}
const { version } = PluginInfo

type TEventSwitchProtyle = CustomEvent<IEventBusMap[SiyuanEvents.SWITCH_PROTYLE]>

export default class RAGAssistantPlugin extends Plugin {
  // Run as mobile
  public isMobile = false
  // Run in browser
  public isBrowser = false
  // Run as local
  public isLocal = false
  // Run in Electron
  public isElectron = false
  // Run in window
  public isInWindow = false
  public platform: SyFrontendTypes | null = null
  public readonly version = version

  async onload() {
    const frontEnd = getFrontend()
    this.addIcons(icons)
    this.platform = frontEnd as SyFrontendTypes
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile"
    this.isBrowser = frontEnd.includes("browser")
    this.isLocal = location.href.includes("127.0.0.1") || location.href.includes("localhost")
    this.isInWindow = location.href.includes("window.html")

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const electronRemote = (globalThis as any)?.require?.("@electron/remote")
      if (electronRemote) {
        electronRemote.require?.("@electron/remote/main")
        this.isElectron = true
      } else {
        this.isElectron = false
      }
    } catch (err) {
      this.isElectron = false
      console.debug(err)
    }

    // Listen for document switching events to track current document context
    this.eventBus.on(SiyuanEvents.SWITCH_PROTYLE, async (e: TEventSwitchProtyle) => {
      const protyleData = e.detail as { protyle: IProtyle }

      // Log the full event data for debugging
      console.log("SWITCH_PROTYLE event data:", protyleData)

      if (!protyleData?.protyle) {
        console.log(LOG_PREFIX, "No protyle instance found in event")
        return
      }

      const protyle = protyleData.protyle as IProtyle
      const block = protyle.block

      // Extract document ID from the protyle instance
      const documentId = block?.rootID || block?.id || null

      console.log(LOG_PREFIX, "Document context updated:", { documentId })

      if (!documentId) {
        console.warn(LOG_PREFIX, "No document ID found in event.")
        return
      }

      // Fetch document name from the block data
      let documentName: string | null = null
      const blockData = await getBlockByID(documentId)
      console.log(LOG_PREFIX, "Fetched block data:", blockData)

      // Try different ways to get the document name
      if (blockData?.content) {
        documentName = blockData.content
      }

      console.log(LOG_PREFIX, "Fetched document name:", documentName)

      // Update the document context store
      const store = useDocumentContextStore()
      store.updateDocumentContext(documentId, documentName)
    })

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
      title: "",
      transparent: true,
      content: `<div id="rag-assistant-settings-dialog-container" style="width: 100%; height: 100%;"></div>`,
      width: "600px",
      height: "500px",
    })

    const container = dialog.element.querySelector("#rag-assistant-settings-dialog-container")
    if (container) {
      // Load existing settings
      const savedSettings = (await this.loadData(STORAGE_NAME)) as RAGAssistantSettings | null

      const app = createApp(SettingsDialog, {
        onClose: () => {
          dialog.destroy()
        },
        onSave: async (settings: RAGAssistantSettings) => {
          await this.saveData(STORAGE_NAME, settings)
          dialog.destroy()
        },
        savedSettings,
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
    const savedSettings = (await this.loadData(STORAGE_NAME)) as RAGAssistantSettings | null
    return savedSettings || { ...DEFAULT_SETTINGS }
  }
}
