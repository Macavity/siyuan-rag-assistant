<script setup lang="ts">
import { usePlugin } from '@/main'
import { onMounted, ref, watchEffect } from 'vue'


const isChecked = ref(false)

const inputValue = ref('')

const selectValue = ref()
const selectOptions = ref([
  { value: '1', text: 'Option 1' },
  { value: '2', text: 'Option 2' },
  { value: '3', text: 'Option 3' },
])

const textareaValue = ref('')

const showAllValues = () => {
  alert(`
    isChecked: ${isChecked.value}
    inputValue: ${inputValue.value}
    selectValue: ${selectValue.value}
    textareaValue: ${textareaValue.value}
  `)
}

const plugin = usePlugin()
console.log('plugin is ', plugin)

plugin.addDock({
      config: {
        position: "RightTop",
        size: { width: 300, height: 0 },
        icon: "iconSparkles",
        title: plugin.i18n.dockTitle,
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
        // mount component
      },
      destroy() {
        // console.log("Task list dock destroyed");
      },
    });


const statusRef = ref<HTMLDivElement>()
watchEffect(() => {
  console.log('statusRef is ', statusRef.value)
})
// two ways to add status bar
onMounted(() => {

})


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