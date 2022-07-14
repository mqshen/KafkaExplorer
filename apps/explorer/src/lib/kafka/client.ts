import clients from "./clients";
import createLogger from "../logger";
import { listTopics, listPartitions } from "./clients/kafka";

const logger = createLogger("kafka");

export interface IKafkaConnectionServerConfig {
  metaClient: Nullable<keyof typeof clients>;
  client: Nullable<keyof typeof clients>;
  host?: string;
  port: Nullable<number>;
  domain: Nullable<string>;
  socketPath: Nullable<string>;
  socketPathEnabled: boolean;
  user: Nullable<string>;
  osUser: string;
  password: Nullable<string>;
  ssl: boolean;
  localHost?: string;
  localPort?: number;
  trustServerCertificate?: boolean;
  options?: any;
}

export interface ZooKeeperClient {
  disconnect: () => void;
  listTopics: () => Promise<string[]>;
  listPartitions: (topic: string) => Promise<string[]>;
}

export interface IZookeeperConnection {
  zk: string;
  connection: Nullable<ZooKeeperClient>;
  connecting: boolean;
}

export function createConnection(
  server: IKafkaConnectionServer,
  zk: IZookeeperConnection
) {
  /**
   * Database public API
   */
  return new KafkaConnection(server, zk);
}

async function connect(
  server: IKafkaConnectionServer,
  zk: IZookeeperConnection
) {
  /* eslint no-param-reassign: 0 */
  if (zk.connecting) {
    throw new Error(
      "There is already a connection in progress for this database. Aborting this new request."
    );
  }

  try {
    zk.connecting = true;

    // terminate any previous lost connection for this DB
    if (zk.connection) {
      zk.connection.disconnect();
    }

    if (server.config.metaClient) {
      const driver = clients[server.config.metaClient];

      const connection = await driver(server, zk);
      zk.connection = connection;
    }
  } catch (err) {
    logger().error("Connection error %j", err);
    disconnect(server, zk);
    throw err;
  } finally {
    zk.connecting = false;
  }
}

function disconnect(
  server: IKafkaConnectionServer,
  zk: IZookeeperConnection
): void {
  zk.connecting = false;

  if (zk.connection) {
    zk.connection.disconnect();
    zk.connection = null;
  }

  if (server.kafka[zk.zk]) {
    delete server.kafka[zk.zk];
  }
}

export interface IKafkaConnectionServer {
  kafka: {
    [x: string]: KafkaConnection;
  };
  config: IKafkaConnectionServerConfig;
}

export class KafkaConnection {
  connectionType = this.server.config.client;
  constructor(
    private server: IKafkaConnectionServer,
    private zk: IZookeeperConnection
  ) {}
  connect = connect.bind(null, this.server, this.zk);
  disconnect = disconnect.bind(null, this.server, this.zk);
  listTopics = listTopics.bind(null, this.server, this.zk);
  listPartitions = listPartitions.bind(null, this.server, this.zk);
}
