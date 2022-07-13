import kafka from "./kafka";
import zookeeper from "./zookeeper";

export function findClient(key: string): Client | undefined {
  const client = CLIENTS.find((cli) => cli.key === key);
  if (!client) return undefined;

  return {
    ...client,
    get supportsSocketPath(): boolean {
      return this.supports("server:socketPath");
    },
    supports(feature: string): boolean {
      return !client.disabledFeatures?.includes(feature);
    },
  };
}

interface Client extends ClientConfig {
  readonly supportsSocketPath: boolean;
  supports: (feature: string) => boolean;
}

interface ClientConfig {
  key: string;
  name: string;
  defaultPort?: number;
  defaultDatabase?: string;
  disabledFeatures?: string[];
}

/**
 * List of supported database clients
 */
export const CLIENTS: ClientConfig[] = [
  {
    key: "zookeeper",
    name: "ZooKeeper",
    defaultPort: 2181,
    disabledFeatures: ["server:domain", "server:socketPath"],
  },
  {
    key: "kafka",
    name: "Kafka",
    defaultPort: 2181,
    disabledFeatures: ["server:domain", "server:socketPath"],
  },
];

export default {
  kafka,
  zookeeper,
};
