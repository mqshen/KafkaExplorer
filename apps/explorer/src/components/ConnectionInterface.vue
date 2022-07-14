<template>

  <div class="interface connection-interface">
    <div class="interface-wrap row"
         @dragover.prevent=""
         @drop.prevent="maybeLoadSqlite">
      <sidebar class="connection-sidebar"
               ref="sidebar"
               v-show="sidebarShown">
        <connection-sidebar :selectedConfig="config"
                            @remove="remove"
                            @duplicate="duplicate"
                            @edit="edit"
                            @connect="handleConnect"
                            @create="create"></connection-sidebar>
      </sidebar>
      <div ref="content"
           class="connection-main page-content flex-col"
           id="page-content">
        <div class="small-wrap expand">
          <div class="card-flat padding">
            <div class="flex flex-between">
              <h3 class="card-title"
                  v-if="!pageTitle">New Connection</h3>
              <h3 class="card-title"
                  v-if="pageTitle">{{pageTitle}}</h3>
              <ImportButton :config="config">Import from URL</ImportButton>
            </div>
            <error-alert :error="errors"
                         title="Please fix the following errors" />
            <form @action="submit"
                  v-if="config">
              <div class="form-group">
                <label for="connectionType">Connection Type</label>
                <select name="connectionType"
                        class="form-control custom-select"
                        v-model="config.connectionType"
                        id="connection-select">
                  <option disabled
                          value="null">Select a connection type...</option>
                  <option :key="t.value"
                          v-for="t in connectionTypes"
                          :value="t.value">{{t.name}}</option>
                </select>
              </div>
              <div v-if="config.connectionType">

                <zoo-keeper-form v-if="config.connectionType === 'zookeeper'"
                                 :config="config"
                                 :testing="testing"></zoo-keeper-form>

                <!-- TEST AND CONNECT -->
                <div v-if="config.connectionType !== 'other'"
                     class="test-connect row flex-middle">
                  <span class="expand"></span>
                  <div class="btn-group">
                    <button :disabled="testing"
                            class="btn btn-flat"
                            type="button"
                            @click.prevent="testConnection">Test</button>
                    <button :disabled="testing"
                            class="btn btn-primary"
                            type="submit"
                            @click.prevent="submit">Connect</button>
                  </div>
                </div>
                <div class="row"
                     v-if="connectionError">
                  <div class="col">
                    <error-alert :error="connectionError"
                                 :helpText="errorHelp"
                                 @close="connectionError = null"
                                 :closable="true" />

                  </div>
                </div>
                <SaveConnectionForm v-if="config.connectionType !== 'other'"
                                    :config="config"
                                    @save="save"></SaveConnectionForm>
              </div>

            </form>

          </div>
          <div class="pitch"
               v-if="!config.connectionType"><span class="badge badge-primary">NEW</span> Check out <a href="https://beekeeperstudio.io/get#ultimate-features"
               class="">Beekeeper Studio Ultimate Edition</a></div>
        </div>

        <small class="app-version"><a href="https://www.github.io/releases/latest">Kafka Explorer {{version}}</a></small>
      </div>
    </div>
  </div>
</template>
<script>
import os from "os"
import { SavedConnection } from "../common/appdb/models/saved_connection"
import ConnectionSidebar from "./sidebar/ConnectionSidebar"
import Sidebar from "./common/Sidebar"
import platformInfo from "@/common/platform_info"
import Split from "split.js"
import ImportButton from "./connection/ImportButton"
import ErrorAlert from "./common/ErrorAlert.vue"
import { findClient } from "@/lib/kafka/clients"
import SaveConnectionForm from "./connection/SaveConnectionForm"
import ZooKeeperForm from "./connection/ZooKeeperForm"
import _ from "lodash"
import rawLog from "electron-log"

const log = rawLog.scope("ConnectionInterface")

export default {
  components: {
    ConnectionSidebar,
    Sidebar,
    ImportButton,
    ErrorAlert,
    ZooKeeperForm,
    SaveConnectionForm,
  },
  data() {
    return {
      config: new SavedConnection(),
      errors: null,
      connectionError: null,
      split: null,
      sidebarShown: true,
      testing: false,
      version: platformInfo.appVersion,
    }
  },
  computed: {
    connectionTypes() {
      return this.$config.defaults.connectionTypes
    },
    pageTitle() {
      if (_.isNull(this.config) || _.isUndefined(this.config.id)) {
        return "New Connection"
      } else {
        return this.config.name
      }
    },
  },
  watch: {
    workspaceId() {
      this.config = new SavedConnection()
    },
    config: {
      deep: true,
      handler() {
        this.connectionError = null
      },
    },
    "config.connectionType"(newConnectionType) {
      console.log(findClient(newConnectionType))
      if (!findClient(newConnectionType)?.supportsSocketPath) {
        this.config.socketPathEnabled = false
      }
    },
    connectionError() {
      console.log("error watch", this.connectionError, this.dialect)
      if (
        this.connectionError &&
        this.dialect == "sqlserver" &&
        this.connectionError.message &&
        this.connectionError.message.includes("self signed certificate")
      ) {
        this.errorHelp = `You might need to check 'Trust Server Certificate'`
      } else {
        this.errorHelp = null
      }
    },
  },
  async mounted() {
    if (!this.$store.getters.workspace) {
      await this.$store.commit("workspace", this.$store.state.localWorkspace)
    }
    // await this.$store.dispatch('loadUsedConfigs')
    // this.config.sshUsername = os.userInfo().username
    this.$nextTick(() => {
      const components = [this.$refs.sidebar.$refs.sidebar, this.$refs.content]
      this.split = Split(components, {
        elementStyle: (dimension, size) => ({
          "flex-basis": `calc(${size}%)`,
        }),
        sizes: [300, 500],
        gutterize: 8,
        minSize: [300, 300],
        expandToMin: true,
      })
    })
  },
  beforeDestroy() {
    if (this.split) {
      this.split.destroy()
    }
  },
  methods: {
    create() {
      this.config = new SavedConnection()
    },
    edit(config) {
      this.config = config
      this.errors = null
      this.connectionError = null
    },
    async remove(config) {
      if (this.config === config) {
        this.config = new SavedConnection()
      }
      await this.$store.dispatch("data/connections/remove", config)
      this.$noty.success(`${config.name} deleted`)
    },
    async duplicate(config) {
      // Duplicates ES 6 class of the connection, without any reference to the old one.
      const duplicateConfig = await this.$store.dispatch(
        "data/connections/clone",
        config
      )
      duplicateConfig.name = "Copy of " + duplicateConfig.name

      try {
        const id = await this.$store.dispatch(
          "data/connections/save",
          duplicateConfig
        )
        this.$noty.success(`The connection was successfully duplicated!`)
        this.config = this.connections.find((c) => c.id === id) || this.config
      } catch (ex) {
        this.$noty.error(`Could not duplicate Connection: ${ex.message}`)
      }
    },
    async submit() {
      this.connectionError = null
      try {
        await this.$store.dispatch("connect", this.config)
      } catch (ex) {
        this.connectionError = ex
        this.$noty.error("Error establishing a connection")
        log.error(ex)
      }
    },
    async handleConnect(config) {
      this.config = config
      await this.submit()
    },
    async testConnection() {
      try {
        this.testing = true
        this.connectionError = null
        await this.$store.dispatch("test", this.config)
        this.$noty.success("Connection looks good!")
        return true
      } catch (ex) {
        this.connectionError = ex
        this.$noty.error("Error establishing a connection")
      } finally {
        this.testing = false
      }
    },
    clearForm() {},
    async save() {
      try {
        this.errors = null
        this.connectionError = null
        if (!this.config.name) {
          throw new Error("Name is required")
        }
        await this.$store.dispatch("data/connections/save", this.config)
        this.$noty.success("Connection Saved")
      } catch (ex) {
        console.error(ex)
        this.errors = [ex.message]
        this.$noty.error("Could not save connection information")
      }
    },
    handleErrorMessage(message) {
      if (message) {
        this.errors = [message]
        this.$noty.error("Could not parse connection URL.")
      } else {
        this.errors = null
      }
    },
  },
}
</script>

<style>
</style>