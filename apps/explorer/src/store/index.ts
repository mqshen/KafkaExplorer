import _ from "lodash";
import Vue from "vue";
import Vuex from "vuex";
import username from "username";

import SettingStoreModule from "./modules/settings/SettingStoreModule";
import { TabModule } from "./modules/TabModule";

import { UsedConnection } from "../common/appdb/models/used_connection";
import { SavedConnection } from "@/common/appdb/models/saved_connection";
import { IConnection } from "@/common/interfaces/IConnection";
import { IWorkspace, LocalWorkspace } from "@/common/interfaces/IWorkspace";

import { IKafkaConnectionPublicServer } from "../lib/kafka/server";
import { KafkaConnection } from "../lib/kafka/client";

import ConnectionProvider from "../lib/connection-provider";
import { Routine, TableOrView } from "../lib/db/models";

import RawLog from "electron-log";

const log = RawLog.scope("store/index");

const tablesMatch = (t: TableOrView, t2: TableOrView) => {
  return (
    t2.name === t.name &&
    t2.schema === t.schema &&
    t2.entityType === t.entityType
  );
};

export interface State {
  usedConfig: Nullable<IConnection>;
  usedConfigs: UsedConnection[];
  server: Nullable<IKafkaConnectionPublicServer>;
  connection: Nullable<KafkaConnection>;
  database: Nullable<string>;
  tables: TableOrView[];
  routines: Routine[];
  tablesLoading: string;
  tablesInitialLoaded: boolean;
  username: Nullable<string>;
  menuActive: boolean;
  selectedSidebarItem: Nullable<string>;
  workspaceId: number;
  storeInitialized: boolean;
}

Vue.use(Vuex);
// const vuexFile = new VueXPersistence()

const store = new Vuex.Store<State>({
  modules: {
    settings: SettingStoreModule,
    tabs: TabModule,
  },
  state: {
    usedConfig: null,
    usedConfigs: [],
    server: null,
    connection: null,
    database: null,
    tables: [],
    routines: [],
    tablesLoading: "loading tables...",
    tablesInitialLoaded: false,
    username: null,
    menuActive: false,
    selectedSidebarItem: null,
    workspaceId: LocalWorkspace.id,
    storeInitialized: false,
  },

  getters: {
    workspace(): IWorkspace {
      return LocalWorkspace;
    },
    isCloud(state: State) {
      return state.workspaceId !== LocalWorkspace.id;
    },
    workspaceEmail(_state: State, getters): string | null {
      return getters.cloudClient?.options?.email || null;
    },
    selectedSidebarItem(state) {
      return state.selectedSidebarItem;
    },
    orderedUsedConfigs(state) {
      return _.sortBy(state.usedConfigs, "updatedAt").reverse();
    },
    schemaTables(state, g) {
      // if no schemas, just return a single schema
      if (_.chain(state.tables).map("schema").uniq().value().length <= 1) {
        return [
          {
            schema: g.schemas[0] || null,
            skipSchemaDisplay: g.schemas.length < 2,
            tables: g.filteredTables,
            routines: g.filteredRoutines,
          },
        ];
      }
      const obj = _.chain(g.filteredTables).groupBy("schema").value();
      const routines = _.groupBy(g.filteredRoutines, "schema");
      return _(obj)
        .keys()
        .map((k) => {
          return {
            schema: k,
            tables: obj[k],
            routines: routines[k] || [],
          };
        })
        .orderBy((o) => {
          // TODO: have the connection provide the default schema, hard-coded to public by default
          if (o.schema === "public") return "0";
          return o.schema;
        })
        .value();
    },
    tablesHaveSchemas(_state, getters) {
      return getters.schemas.length > 1;
    },
    schemas(state) {
      if (state.tables.find((t) => !!t.schema)) {
        return _.uniq(state.tables.map((t) => t.schema));
      }
      return [];
    },
  },
  mutations: {
    storeInitialized(state, b: boolean) {
      state.storeInitialized = b;
    },
    workspaceId(state, id: number) {
      state.workspaceId = id;
    },
    selectSidebarItem(state, item: string) {
      state.selectedSidebarItem = item;
    },

    menuActive(state, value) {
      state.menuActive = !!value;
    },
    setUsername(state, name) {
      state.username = name;
    },
    newConnection(state, payload) {
      state.server = payload.server;
      state.usedConfig = payload.config;
      state.connection = payload.connection;
      state.database = payload.config.defaultDatabase;
    },

    clearConnection(state) {
      state.database = null;
      state.tables = [];
      state.routines = [];
    },
    updateConnection(state, { database }) {
      state.database = database;
    },
    unloadTables(state) {
      state.tables = [];
      state.tablesInitialLoaded = false;
    },
    tables(state, tables: TableOrView[]) {
      if (state.tables.length === 0) {
        state.tables = tables;
      } else {
        // TODO: make this not O(n^2)
        const result = tables.map((t) => {
          const existingIdx = state.tables.findIndex((st) =>
            tablesMatch(st, t)
          );
          if (existingIdx >= 0) {
            const existing = state.tables[existingIdx];
            Object.assign(existing, t);
            return existing;
          } else {
            return t;
          }
        });
        state.tables = result;
      }

      if (!state.tablesInitialLoaded) state.tablesInitialLoaded = true;
    },

    table(state, table: TableOrView) {
      const existingIdx = state.tables.findIndex((st) =>
        tablesMatch(st, table)
      );
      if (existingIdx >= 0) {
        const result = state.tables;
        Object.assign(result[existingIdx], table);
        state.tables = result;
      } else {
        state.tables = [...state.tables, table];
      }
    },

    routines(state, routines) {
      state.routines = Object.freeze(routines);
    },
    tablesLoading(state, value: string) {
      state.tablesLoading = value;
    },
    usedConfigs(state, configs: UsedConnection[]) {
      Vue.set(state, "usedConfigs", configs);
    },
  },
  actions: {
    async test(context, config: SavedConnection) {
      // TODO (matthew): fix this mess.
      if (context.state.username) {
        config.defaultDatabase;
        const server = ConnectionProvider.for(config, context.state.username);
        await server
          ?.createConnection(config.defaultDatabase || undefined)
          .connect();
        server.disconnect();
      } else {
        throw "No username provided";
      }
    },

    async connect(context, config: IConnection) {
      if (context.state.username) {
        const server = ConnectionProvider.for(config, context.state.username);
        // TODO: (geovannimp) Check case connection is been created with undefined as key
        const connection = server.createConnection(
          config.defaultDatabase || undefined
        );
        await connection.connect();
        connection.connectionType = "zookeeper";

        context.commit("newConnection", { config: config, server, connection });
        context.dispatch("recordUsedConfig", config);
      } else {
        throw "No username provided";
      }
    },

    async recordUsedConfig(context, config: IConnection) {
      log.info("finding last used connection", config);
      const lastUsedConnection = context.state.usedConfigs.find((c) => {
        return (
          config.id &&
          config.workspaceId &&
          c.connectionId === config.id &&
          c.workspaceId === config.workspaceId
        );
      });
      console.log("Found used config", lastUsedConnection);
      if (!lastUsedConnection) {
        const usedConfig = new UsedConnection(config);
        log.info("logging used connection", usedConfig, config);
        await usedConfig.save();
        context.commit("usedConfigs", [
          ...context.state.usedConfigs,
          usedConfig,
        ]);
      } else {
        lastUsedConnection.connectionId = config.id;
        lastUsedConnection.workspaceId = config.workspaceId;
        await lastUsedConnection.save();
      }
    },

    async fetchUsername(context) {
      const name = await username();
      context.commit("setUsername", name);
    },

    async loadUsedConfigs(context) {
      const configs = await UsedConnection.find({
        take: 10,
        order: { createdAt: "DESC" },
        where: { workspaceId: context.state.workspaceId },
      });
      context.commit("usedConfigs", configs);
    },
  },
  plugins: [],
});

export default store;
