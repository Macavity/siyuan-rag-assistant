import {
  Plugin,
} from "siyuan";
import { createApp } from 'vue'
import App from './App.vue'

let plugin = null
export function usePlugin(pluginProps?: Plugin): Plugin {
  console.log('usePlugin', pluginProps, plugin)
  if (pluginProps) {
    plugin = pluginProps
  }
  if (!plugin && !pluginProps) {
    console.error('need bind plugin')
  }
  return plugin;
}


let app = null
let div: HTMLDivElement | null = null

export function init(pluginInstance: Plugin) {
  // bind plugin hook
  usePlugin(pluginInstance);

  div = document.createElement('div')
  div.classList.toggle('plugin-sample-vite-vue-app')
  div.id = 'siyuan-rag-assistant'
  app = createApp(App)
  app.mount(div)
  document.body.appendChild(div)
}

export function destroy() {
  if (app && div) {
    app.unmount()
    document.body.removeChild(div)
    div = null
    app = null
  }
}
