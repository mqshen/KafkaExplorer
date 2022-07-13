// Copyright (c) 2015 The SQLECTRON Team
import {
  createConnection,
  KafkaConnection,
  IKafkaConnectionServer,
  IKafkaConnectionServerConfig,
} from "./client";
import { findClient } from "./clients";

export interface IKafkaConnectionPublicServer {
  kafka: (dbName: string) => KafkaConnection;
  disconnect: () => void;
  end: () => void;
  createConnection: (dbName?: string, cryptoSecret?: string) => KafkaConnection;
}

export function createServer(
  config: IKafkaConnectionServerConfig
): IKafkaConnectionPublicServer {
  if (!config) {
    throw new Error("Missing server configuration");
  }
  const client = findClient(config.metaClient);

  if (!client) {
    throw new Error("Invalid " + config.metaClient + " client");
  }

  if (config.socketPathEnabled && !client.supportsSocketPath) {
    throw new Error(`${client.name} does not support socket path`);
  }

  const server: IKafkaConnectionServer = {
    /**
     * All connected dbs
     */
    kafka: {},
    config,
  };

  return {
    kafka(dbName: string) {
      return server.kafka[dbName];
    },

    disconnect() {
      return this.end();
    },

    end() {
      // disconnect from all DBs
      Object.keys(server.kafka).forEach((key) =>
        server.kafka[key].disconnect()
      );
    },

    createConnection(dbName?: string, cryptoSecret?: string) {
      console.log(" create connection test");
      if (server.kafka[dbName]) {
        // @ts-ignore
        return server.kafka[dbName];
      }

      const database = {
        database: dbName,
        connection: null,
        connecting: false,
      };

      // @ts-ignore
      server.kafka[dbName] = createConnection(server, database, cryptoSecret);

      // @ts-ignore
      return server.kafka[dbName];
    },
  } as IKafkaConnectionPublicServer;
}
