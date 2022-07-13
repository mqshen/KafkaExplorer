import { IConnection } from "@/common/interfaces/IConnection";
import path from "path";

export const KafkaExplorerPlugin = {
  buildConnectionString(config: IConnection): string {
    if (config.socketPathEnabled) return config.socketPath;

    if (config.connectionType === "sqlite") {
      return config.defaultDatabase || "./unknown.db";
    } else {
      let result = `${config.username || "user"}@${config.host}:${config.port}`;

      if (config.defaultDatabase) {
        result += `/${config.defaultDatabase}`;
      }

      if (config.sshHost) {
        result += ` via ${config.sshUsername}@${config.sshHost}`;
        if (config.sshBastionHost) result += ` jump(${config.sshBastionHost})`;
      }
      return result;
    }
  },
  simpleConnectionString(config: IConnection): string {
    if (config.socketPathEnabled) return config.socketPath;

    let connectionString = `${config.host}:${config.port}`;
    if (config.connectionType === "sqlite") {
      return path.basename(config.defaultDatabase || "./unknown.db");
    } else if (
      config.connectionType === "cockroachdb" &&
      config.options?.cluster
    ) {
      connectionString = `${config.options.cluster}/${
        config.defaultDatabase || "cloud"
      }`;
    } else {
      if (config.defaultDatabase) {
        connectionString += `/${config.defaultDatabase}`;
      }
    }
    return connectionString;
  },
};

export default {
  install(Vue) {
    Vue.prototype.$app = KafkaExplorerPlugin;
    Vue.prototype.$bks = KafkaExplorerPlugin;
  },
};
