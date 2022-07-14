<template>
  <div class="list-item"
       @contextmenu="$emit('contextmenu', $event)">
    <a class="list-item-btn"
       role="button"
       v-bind:class="{'active': active, 'selected': selected,'open': showColumns }">
      <span @contextmenu.prevent.stop=""
            class="btn-fab open-close"
            @mousedown.prevent="toggleColumns">
        <i class="dropdown-icon material-icons">keyboard_arrow_right</i>
      </span>
      <span class="item-wrapper flex flex-middle expand"
            @dblclick.prevent="openTable"
            @mousedown="selectItem">
        <table-icon :table="topic" />
        <span class="table-name truncate"
              :title="topic.name">{{topic.name}}</span>
      </span>
      <span class="actions"
            v-bind:class="{'pinned': pinned}">
        <span v-if="!pinned"
              @mousedown.prevent.stop="pin"
              class="btn-fab pin"
              :title="'Pin'"><i class="bk-pin"></i></span>
        <span v-if="pinned"
              @mousedown.prevent.stop="unpin"
              class="btn-fab unpin"
              :title="'Unpin'"><i class="material-icons">clear</i></span>
        <span v-if="pinned"
              class="btn-fab pinned"><i class="bk-pin"
             :title="'Unpin'"></i></span>
      </span>
    </a>
    <div v-if="showColumns"
         class="sub-items">
      <span v-bind:key="c.columnName"
            v-for="(c, i) in table.columns"
            class="sub-item">
        <span class="title truncate"
              ref="title"
              @click="selectColumn(i)">{{c.columnName}}</span>
        <span class="badge"
              v-bind:class="c.dataType"><span>{{c.dataType}}</span></span>
      </span>
    </div>

  </div>
</template>

<style lang="scss">
.sub-item {
  .title {
    user-select: text;
    cursor: pointer;
  }
}
</style>

<script type="text/javascript">
import { mapGetters, mapState } from "vuex"
import _ from "lodash"
import { AppEvent } from "../../../../common/AppEvent"
import { uuidv4 } from "../../../../lib/uuid"
import TableIcon from "@/components/common/TableIcon.vue"
export default {
  props: [
    "connection",
    "topic",
    "noSelect",
    "forceExpand",
    "forceCollapse",
    "container",
    "pinned",
  ],
  components: { TableIcon },
  mounted() {
    this.showColumns = !!this.topic.showColumns
    console.log("jjjjjjjjjjj", this.topic)
  },
  data() {
    return {
      showColumns: false,
      id: uuidv4(),
      clickState: {
        timer: null,
        openClicks: 0,
        delay: 500,
      },
    }
  },
  watch: {
    forceExpand() {
      if (this.forceExpand) {
        this.showColumns = true
      }
    },
    forceCollapse() {
      if (this.forceCollapse) {
        this.showColumns = false
      }
    },
    showColumns() {
      this.topic.showColumns = this.showColumns
    },
    active() {
      if (this.selected && !this.noSelect) {
        let shouldScroll = true
        if (this.container) {
          const box = this.$el.getBoundingClientRect()
          const parentBox = this.container.getBoundingClientRect()
          shouldScroll = !(
            box.top > parentBox.top && box.bottom <= parentBox.bottom
          )
        }
        if (shouldScroll) {
          this.$el.scrollIntoView()
        }
      }
    },
  },
  computed: {
    supportsDDL() {
      return ["table", "view"].includes(this.table.entityType)
    },
    iconClass() {
      const result = {}
      result[`${this.topic.entityType}-icon`] = true
      return result
    },
    title() {
      return _.startCase(this.topic.entityType)
    },
    selected() {
      return this.selectedSidebarItem === this.id
    },
    active() {
      const tableSelected =
        this.activeTab &&
        this.activeTab.table &&
        this.activeTab.table.name === this.topic.name &&
        this.activeTab.table.schema === this.topic.schema

      return tableSelected
    },
    ...mapGetters(["selectedSidebarItem"]),
    ...mapState(["activeTab", "database", "config"]),
  },
  methods: {
    doNothing() {
      // do nothing
    },
    selectItem() {
      this.$store.commit("selectSidebarItem", this.id)
    },
    createTable() {
      this.$root.$emit("loadTableCreate", this.topic)
    },
    exportTable() {
      this.trigger(AppEvent.beginExport, { table: this.topic })
    },
    copyTable() {
      this.$copyText(this.topic.name)
    },
    selectTable() {
      this.$emit("selected", this.topic)
    },
    selectColumn(i) {
      this.selectChildren(this.$refs.title[i])
    },
    async toggleColumns() {
      this.$emit("selected", this.topic)
      this.showColumns = !this.showColumns
    },
    openTable() {
      if (this.clickState.openClicks > 0) {
        return
      }
      this.$root.$emit("loadTable", { topic: this.topic })
      this.clickState.openClicks++
      this.clickState.timer = setTimeout(() => {
        this.clickState.openClicks = 0
      }, this.clickState.delay)
    },
    openTableStructure() {
      this.$root.$emit(AppEvent.openTableProperties, { table: this.topic })
    },
    pin() {
      this.$store.dispatch("pins/add", this.topic)
    },
    unpin() {
      this.$store.dispatch("pins/remove", this.topic)
    },
  },
}
</script>
