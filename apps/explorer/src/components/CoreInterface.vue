<template>
  <div id="interface"
       class="interface"
       v-hotkey="keymap">
    <div v-if="initializing">
      <progress-bar />
    </div>
    <div v-else
         class="interface-wrap row">
      <sidebar ref="sidebar"
               :class="{hide: !sidebarShown}">
        <core-sidebar @databaseSelected="databaseSelected"
                      @toggleSidebar="toggleSidebar"
                      :connection="connection"
                      :sidebarShown="sidebarShown"></core-sidebar>
        <statusbar>
          <ConnectionButton></ConnectionButton>
        </statusbar>
      </sidebar>
      <div ref="content"
           class="page-content flex-col"
           id="page-content">
        <core-tabs :connection="connection"></core-tabs>
      </div>
    </div>
    <quick-search v-if="quickSearchShown"
                  @close="quickSearchShown=false" />
    <ExportManager :connection="connection"></ExportManager>
  </div>
</template>
<script>
import Split from "split.js"
import Sidebar from "./common/Sidebar"
import Statusbar from "./common/StatusBar"
import CoreTabs from "./CoreTabs"
import CoreSidebar from "./sidebar/CoreSidebar"
import ConnectionButton from "./sidebar/core/ConnectionButton"
import ExportManager from "./export/ExportManager"
import ProgressBar from "./editor/ProgressBar.vue"
import { AppEvent } from "../common/AppEvent"
export default {
  components: {
    CoreSidebar,
    Sidebar,
    Statusbar,
    CoreTabs,
    ConnectionButton,
    ExportManager,
    ProgressBar,
  },
  props: ["connection"],
  data() {
    return {
      split: null,
      sidebarShown: true,
      quickSearchShown: false,
      rootBindings: [
        { event: AppEvent.quickSearch, handler: this.showQuickSearch },
        { event: AppEvent.toggleSidebar, handler: this.toggleSidebar },
      ],
      initializing: true,
    }
  },
  watch: {
    initializing() {
      if (this.initializing) return
      this.$nextTick(() => {
        this.split = Split(this.splitElements, {
          elementStyle: (dimension, size) => ({
            "flex-basis": `calc(${size}%)`,
          }),
          sizes: [25, 75],
          minSize: 280,
          expandToMin: true,
          gutterSize: 5,
        })
      })
    },
  },
  mounted() {
    this.$store.dispatch("pins/loadPins")
    this.registerHandlers(this.rootBindings)
    this.$nextTick(() => {
      this.initializing = false
    })
  },
  computed: {
    keymap() {
      const results = {}
      results[this.ctrlOrCmd("p")] = () => (this.quickSearchShown = true)
      return results
    },
    splitElements() {
      return [this.$refs.sidebar.$refs.sidebar, this.$refs.content]
    },
  },
  methods: {
    databaseSelected(database) {
      this.$emit("databaseSelected", database)
    },
    toggleSidebar() {
      this.sidebarShown = !this.sidebarShown
    },
  },
}
</script>

<style>
</style>