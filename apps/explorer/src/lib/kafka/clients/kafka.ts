import { createClient } from "@mqshensc/zk-client";

export default async function (server, zk) {
  const zkConfig = configZooKeeper(server, zk);
  const conn = {
    client: createClient(zkConfig.host + ":" + zkConfig.port),
  };

  return {
    disconnect: () => disconnect(conn),
    listBrokers: () => listBrokers(conn),
    listTopic: () => listTopic(conn),
  };
}

export function disconnect(conn) {
  console.log(conn);
  // conn.client.close();
}

export function listBrokers(conn) {
  conn.client.close();
}

export function listTopic(conn) {
  conn.client.close();
}

function configZooKeeper(server, zk) {
  const config = {
    host: server.config.host,
    port: server.config.port,
    user: server.config.user,
    password: server.config.password,
    multipleStatements: true,
    zookeeper: zk,
    dateStrings: true,
    supportBigNumbers: true,
    bigNumberStrings: true,
    connectTimeout: 60 * 60 * 1000,
  };

  return config;
}
