import { createClient } from "@mqshensc/zk-client";
export default async function (server, zk) {
  const zkConfig = configZooKeeper(server, zk);
  const client = createClient(zkConfig.host + ":" + zkConfig.port);

  await client.connect();
  const conn = {
    client: client,
  };

  return {
    disconnect: () => disconnect(conn),
    listBrokers: () => listBrokers(conn),
    listTopics: () => listTopics(conn),
    listPartitions: (topic: string) => listPartitions(conn, topic),
  };
}

export async function disconnect(conn) {
  await conn.client.close();
}

export function listBrokers(conn) {
  console.log("sjs", conn);
  return ["sss"];
}

export async function listTopics(conn) {
  const brokers = await conn.client.getChildren("/brokers/topics");
  console.log(brokers);

  return brokers.children;
}

export async function listPartitions(conn, topic) {
  const partitions = await conn.client.getChildren(
    "/brokers/topics/" + topic + "/partitions"
  );
  console.log(partitions);

  return partitions.children;
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
