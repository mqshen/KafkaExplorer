import { createClient } from "@mqshensc/zk-client";
import { IZookeeperConnection } from "../client";

export default async function (server, zk) {
  const zkConfig = configZooKeeper(server, zk);
  const conn = {
    client: createClient(zkConfig.host + ":" + zkConfig.port),
  };

  return {
    disconnect: () => disconnect(conn),
    listBrokers: () => listBrokers(conn),
    listTopics: () => listTopics(server, zk),
    listPartitions: (topic: string) => listPartitions(server, zk, topic),
  };
}

export function disconnect(conn) {
  console.log(conn);
  // conn.client.close();
}

export function listBrokers(conn) {
  conn.client.close();
}

export async function listTopics(_, zk: IZookeeperConnection) {
  const brokers = await zk.connection.listTopics();
  console.log(brokers);
  return brokers;
}

export async function listPartitions(
  _,
  zk: IZookeeperConnection,
  topic: string
) {
  const brokers = await zk.connection.listPartitions(topic);
  console.log(brokers);
  return ["sss"];
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
