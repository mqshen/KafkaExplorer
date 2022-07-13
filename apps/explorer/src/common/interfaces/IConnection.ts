export type ConnectionType = "sqlite";
export type SshMode = null | "agent" | "userpass" | "keyfile";

export interface ISimpleConnection {
  id: number | null;
  workspaceId: Nullable<number>;
  connectionType: ConnectionType;
  host: Nullable<string>;
  port: Nullable<number>;
  socketPath: Nullable<string>;
  socketPathEnabled: boolean;
  username: Nullable<string>;
  domain: Nullable<string>;
  defaultDatabase: Nullable<string>;
  uri: Nullable<string>;
  sshEnabled: boolean;
  sshHost: Nullable<string>;
  sshPort: Nullable<number>;
  sshKeyfile: Nullable<string>;
  sshUsername: Nullable<string>;
  sshBastionHost: Nullable<string>;
  ssl: boolean;
  sslCaFile: Nullable<string>;
  sslCertFile: Nullable<string>;
  sslKeyFile: Nullable<string>;
  sslRejectUnauthorized: boolean;
  labelColor?: Nullable<string>;
  trustServerCertificate?: boolean;
  options?: any;
}

export interface IConnection extends ISimpleConnection {
  name: Nullable<string>;
  password: Nullable<string>;
}

export interface ICloudSavedConnection extends IConnection {
  userSpecificCredentials: boolean;
  userSpecificPaths: boolean;
}
