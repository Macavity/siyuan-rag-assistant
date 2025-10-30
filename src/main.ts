import { createPinia } from "pinia"
import { Plugin } from "siyuan"
import { createApp, type App as AppType } from "vue"
import App from "./App.vue"
import { LOG_PREFIX } from "./constants"

let plugin: Plugin | null = null
export function usePlugin(pluginProps?: Plugin): Plugin {
  if (pluginProps) {
    plugin = pluginProps
  }
  if (!plugin && !pluginProps) {
    console.error(LOG_PREFIX, "need bind plugin")
  }
  return plugin as Plugin
}

let app: AppType<Element>
let div: HTMLDivElement | null = null

export function init(pluginInstance: Plugin) {
  // bind plugin hook
  usePlugin(pluginInstance)

  div = document.createElement("div")
  div.classList.toggle("plugin-ra-vue-app")
  div.id = "siyuan-rag-assistant"
  app = createApp(App)

  // Setup Pinia
  const pinia = createPinia()
  app.use(pinia)

  app.mount(div)
  document.body.appendChild(div)
}

export function destroy() {
  if (app && div) {
    app.unmount()
    document.body.removeChild(div)
    div = null
  }
}
