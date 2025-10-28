import {
  Dialog,
  Plugin,
  getFrontend,
  IEventBusMap,
  IProtyle,
} from "siyuan";
import "@/index.scss";
import {icons} from "./utils/icons";
import PluginInfoString from '@/../plugin.json'
import {destroy, init} from '@/main'
import {createApp} from 'vue'
import SettingsDialog from '@/components/SettingsDialog.vue'
import {type RAGAssistantSettings, STORAGE_NAME, DEFAULT_SETTINGS} from '@/types/settings'
import {SiyuanEvents} from "./types/siyuan-events";
import {getBlockByID} from '@/api'
import {useDocumentContextStore} from "@/stores/document-context.ts";

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

type TEventSwitchProtyle = CustomEvent<
  IEventBusMap[SiyuanEvents.SWITCH_PROTYLE]
>;


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
    this.addIcons(icons);
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

    // Listen for document switching events to track current document context
    this.eventBus.on(SiyuanEvents.SWITCH_PROTYLE, async (e: TEventSwitchProtyle) => {
      const protyleData = e.detail as { protyle: IProtyle }

      // Log the full event data for debugging
      console.log('SWITCH_PROTYLE event data:', protyleData)

      if (!protyleData?.protyle) {
        console.log('No protyle instance found in event')
        return
      }

      const protyle = protyleData.protyle
      const block = protyle.block as any

      // Extract document ID and block ID from the protyle instance
      const documentId = block?.rootID || block?.id || null
      const blockId = block?.id || null

      console.log('Document context updated:', {documentId, blockId})

      // Only update if we have valid IDs
      if (documentId || blockId) {
        // Fetch document name from the block data
        let documentName: string | null = null
        try {
          // Get the document ID (root_id) to fetch the document name
          const targetBlockId = documentId || blockId
          if (targetBlockId) {
            const blockData = await getBlockByID(targetBlockId)
            console.log('Fetched block data:', blockData)

            // Try different ways to get the document name
            if (blockData?.content) {
              documentName = blockData.content
            }

            console.log('Fetched document name:', documentName)
          }
        } catch (error) {
          console.error('Error fetching document name:', error)
        }

        // Update the document context store
        const store = useDocumentContextStore()
        store.updateDocumentContext(documentId, blockId, documentName)
      }
    })

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
    return savedSettings || {...DEFAULT_SETTINGS}
  }
}
