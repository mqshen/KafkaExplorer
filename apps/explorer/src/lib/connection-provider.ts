import { IConnection } from "@/common/interfaces/IConnection";
import { IKafkaConnectionPublicServer } from "./kafka/server";
import { IKafkaConnectionServerConfig } from "./kafka/client";
import { createServer } from "./kafka/index";

export default {
  convertConfig(
    config: IConnection,
    osUsername: string
  ): IKafkaConnectionServerConfig {
    return {
      metaClient: "zookeeper",
      client: "kafka",
      host: config.host ? config.host.trim() : null,
      port: config.port,
      domain: config.domain || null,
      socketPath: config.socketPath,
      socketPathEnabled: config.socketPathEnabled,
      user: config.username ? config.username.trim() : null,
      osUser: osUsername,
      password: config.password,
      ssl: config.ssl,
      trustServerCertificate: config.trustServerCertificate,
      options: config.options,
    };
  },

  for(config: IConnection, osUsername: string): IKafkaConnectionPublicServer {
    const convertedConfig = this.convertConfig(config, osUsername);
    const server = createServer(convertedConfig);
    return server;
  },
};
