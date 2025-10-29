<script setup lang="ts">
import { usePlugin } from '@/main'
import { createApp } from 'vue'
import ChatInterface from '@/components/ChatInterface.vue'

const plugin = usePlugin()

let chatApp: any = null
let chatDiv: HTMLDivElement | null = null

plugin.addDock({
      config: {
        position: "RightTop",
        size: { width: 400, height: 0 },
        icon: "iconSparkles",
        title: plugin.i18n.dockTitle || 'RAG Assistant',
      },
      data: {
        // Any initial data for the dock, if needed
      },
      type: "rag-assistant-dock",
      resize() {
        // console.log("Task list dock resized");
      },
      update() {
        // console.log("Task list dock update");
      },
      init: (dock) => {
        // Create container for chat interface
        chatDiv = document.createElement('div')
        chatDiv.style.width = '100%'
        chatDiv.style.height = '100%'
        
        // Append to dock element
        if (dock?.element) {
          dock.element.appendChild(chatDiv)
        }
        
        // Mount ChatInterface component
        chatApp = createApp(ChatInterface)
        chatApp.mount(chatDiv)
      },
      destroy() {
        // Clean up chat interface
        if (chatApp && chatDiv) {
          chatApp.unmount()
          chatDiv = null
          chatApp = null
        }
      },
    });

</script>


<!-- 局部样式 -->
<style lang="scss" scoped>
.plugin-app-main {
  width: 100%;
  height: 100%;
  max-height: 100vh;
  box-sizing: border-box;
  pointer-events: none;

  position: absolute;
  top: 0;
  left: 0;
  z-index: 4;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;

  .demo {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    pointer-events: auto;

    z-index: 10;

    background-color: var(--b3-theme-surface);
    border-radius: var(--b3-border-radius);
    border: 1px solid var(--b3-border-color);
    padding: 16px;
  }
}
</style>

<!-- 全局样式 -->
<style lang="scss">
.plugin-ra-vue-app {
  width: 100vw;
  height: 100dvh;
  max-height: 100vh;
  position: absolute;
  top: 0px;
  left: 0px;
  pointer-events: none;
  box-sizing: border-box;
}

.row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
</style>