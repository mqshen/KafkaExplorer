import Vue from "vue";
import App from "./App.vue";
import VModal from "vue-js-modal";
import "xel/xel";
// @ts-ignore
import { TabulatorFull as Tabulator, EditModule } from "tabulator-tables";
import PortalVue from "portal-vue";

import "./assets/styles/app.scss";

import store from "./store/index";
import { AppEventMixin } from "./common/AppEvent";
import platformInfo from "./common/platform_info";
import Connection from "./common/appdb/Connection";
import config from "./config";
import ConfigPlugin from "./plugins/ConfigPlugin";

import AppEventHandler from "./lib/events/AppEventHandler";
import { ipcRenderer } from "electron";
import log from "electron-log";
import _ from "lodash";

(async () => {
  try {
    _.mixin({
      deepMapKeys: function (obj, fn) {
        const x = {};

        _.forOwn(obj, function (rawV, k) {
          let v = rawV;
          if (_.isPlainObject(v)) {
            v = _.deepMapKeys(v, fn);
          } else if (_.isArray(v)) {
            v = v.map((item) => _.deepMapKeys(item, fn));
          }
          x[fn(v, k)] = v;
        });

        return x;
      },
    });

    const transports = [log.transports.console, log.transports.file];
    if (platformInfo.isDevelopment || platformInfo.debugEnabled) {
      transports.forEach((t) => (t.level = "silly"));
    } else {
      transports.forEach((t) => (t.level = "warn"));
    }

    log.info("starting logging");
    // @ts-ignore
    Tabulator.defaultOptions.layout = "fitDataFill";
    // @ts-ignore
    Tabulator.defaultOptions.menuContainer = ".beekeeper-studio-wrapper";
    // Tabulator.prototype.bindModules([EditModule]);
    const appDb = platformInfo.appDbPath;
    const connection = new Connection(
      appDb,
      config.isDevelopment ? true : ["error"]
    );
    await connection.connect();

    // (window as any).sql = SQL;
    // (window as any).hint = Hint;
    // (window as any).SQLHint = SQLHint;
    Vue.config.devtools = platformInfo.isDevelopment;

    Vue.mixin(AppEventMixin);
    Vue.mixin({
      methods: {
        ctrlOrCmd(key) {
          if (this.$config.isMac) return `meta+${key}`;
          return `ctrl+${key}`;
        },
        selectChildren(element) {
          const selection = window.getSelection();
          if (selection) {
            selection.selectAllChildren(element);
          } else {
            console.log("no selection");
          }
        },
      },
    });

    Vue.config.productionTip = false;
    //     Vue.use(TypeOrmPlugin, { connection });
    //     Vue.use(VueHotkey);
    //     Vue.use(VTooltip);
    Vue.use(VModal);
    //     Vue.use(VueClipboard);
    Vue.use(ConfigPlugin);
    //     Vue.use(BeekeeperPlugin);
    //     Vue.use(VueElectronPlugin);
    Vue.use(PortalVue);
    //     Vue.use(VueNoty, {
    //       timeout: 2300,
    //       progressBar: true,
    //       layout: "bottomRight",
    //       theme: "mint",
    //       closeWith: ["button", "click"],
    //     });

    const app = new Vue({
      render: (h) => h(App),
      store,
    });
    await app.$store.dispatch("settings/initializeSettings");
    const handler = new AppEventHandler(ipcRenderer, app);
    handler.registerCallbacks();
    app.$mount("#app");
  } catch (err) {
    console.error("ERROR INITIALIZING APP");
    console.error(err);
    throw err;
  }
})();