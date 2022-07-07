import { Entity, Column, BeforeInsert, BeforeUpdate } from "typeorm";

import { ApplicationEntity } from "./application_entity";
import { IDbClients } from "@/lib/db/client";
import { ConnectionString } from "connection-string";
import log from "electron-log";

export const ConnectionTypes = [
  { name: "MySQL", value: "mysql" },
  { name: "MariaDB", value: "mariadb" },
  { name: "Postgres", value: "postgresql" },
  { name: "SQLite", value: "sqlite" },
  { name: "SQL Server", value: "sqlserver" },
  { name: "Amazon Redshift", value: "redshift" },
  { name: "CockroachDB", value: "cockroachdb" },
  { name: "Other (Oracle, etc)", value: "other" },
];

export interface ConnectionOptions {
  cluster?: string;
}

function parseConnectionType(t: Nullable<IDbClients>) {
  if (!t) return null;

  const mapping: { [x: string]: IDbClients } = {
    sqlite: "sqlite",
  };
  const allowed = ConnectionTypes.map((c) => c.value);
  const result = mapping[t] || t;
  if (!allowed.includes(result)) return null;
  return result;
}

export class DbConnectionBase extends ApplicationEntity {
  _connectionType: Nullable<IDbClients> = null;

  @Column({ type: "varchar", name: "connectionType" })
  public set connectionType(value: Nullable<IDbClients>) {
    if (this._connectionType !== value) {
      const changePort = this._port === this.defaultPort;
      this._connectionType = parseConnectionType(value);
      this._port = changePort ? this.defaultPort : this._port;
    }
  }

  public get connectionType() {
    return this._connectionType;
  }

  @Column({ type: "varchar", nullable: true })
  host: string = "localhost";

  _port: Nullable<number> = null;

  @Column({ type: "int", nullable: true })
  public set port(v: Nullable<number>) {
    this._port = v;
  }

  public get port(): Nullable<number> {
    return this._port;
  }

  public get defaultPort(): Nullable<number> {
    if (["mysql", "mariadb"].includes(this.connectionType || "")) {
      return 3306;
    }
    return null;
  }

  _socketPath: Nullable<string> = null;

  @Column({ type: "varchar", nullable: true })
  public set socketPath(v: Nullable<string>) {
    this._socketPath = v;
  }

  public get socketPath(): Nullable<string> {
    return this._socketPath || this.defaultSocketPath;
  }

  public get defaultSocketPath(): Nullable<string> {
    if (["mysql", "mariadb"].includes(this.connectionType || "")) {
      return "/var/run/mysqld/mysqld.sock";
    }
    return null;
  }

  @Column({ type: "boolean", nullable: false, default: false })
  socketPathEnabled = false;

  @Column({ type: "varchar", nullable: true })
  username: Nullable<string> = null;

  @Column({ type: "varchar", nullable: true })
  domain: Nullable<string> = null;

  @Column({ type: "varchar", nullable: true })
  defaultDatabase: Nullable<string> = null;

  @Column({ type: "varchar", nullable: true })
  uri: Nullable<string> = null;

  @Column({ type: "varchar", length: 500, nullable: false })
  uniqueHash = "DEPRECATED";

  @Column({ type: "boolean", nullable: false, default: false })
  sshEnabled = false;

  @Column({ type: "varchar", nullable: true })
  sshHost: Nullable<string> = null;

  @Column({ type: "int", nullable: true })
  sshPort: number = 22;

  @Column({ type: "varchar", nullable: true })
  sshKeyfile: Nullable<string> = null;

  @Column({ type: "varchar", nullable: true })
  sshUsername: Nullable<string> = null;

  @Column({ type: "varchar", nullable: true })
  sshBastionHost: Nullable<string> = null;

  @Column({ type: "boolean", nullable: false, default: false })
  ssl: boolean = false;

  @Column({ type: "varchar", nullable: true })
  sslCaFile: Nullable<string> = null;

  @Column({ type: "varchar", nullable: true })
  sslCertFile: Nullable<string> = null;

  @Column({ type: "varchar", nullable: true })
  sslKeyFile: Nullable<string> = null;

  // this only takes effect if SSL certs are provided
  @Column({ type: "boolean", nullable: false })
  sslRejectUnauthorized: boolean = true;

  @Column({ type: "simple-json", nullable: false })
  options: ConnectionOptions = {};

  // this is only for SQL Server.
  @Column({ type: "boolean", nullable: false })
  trustServerCertificate = false;
}

@Entity({ name: "saved_connection" })
export class SavedConnection extends DbConnectionBase {
  @Column("varchar")
  name!: string;

  @Column({
    type: "varchar",
    nullable: true,
    default: null,
  })
  labelColor?: string = "default";

  @Column({ update: false, default: -1, type: "integer" })
  workspaceId: number = -1;

  @Column({ type: "boolean", default: true })
  rememberPassword: boolean = true;

  @Column({
    name: "sshMode",
    type: "varchar",
    length: "8",
    nullable: false,
    default: "agent",
  })
  private smellsLikeUrl(url: string): boolean {
    return url.includes("://");
  }

  parse(url: string) {
    try {
      const goodEndings = [".db", ".sqlite", ".sqlite3"];
      if (!this.smellsLikeUrl(url)) {
        // it's a sqlite file
        if (goodEndings.find((e) => url.endsWith(e))) {
          // it's a valid sqlite file
          this.connectionType = "sqlite";
          this.defaultDatabase = url;
          return true;
        } else {
          // do nothing, continue url parsing
        }
      }

      const parsed = new ConnectionString(url.replaceAll(/\s/g, "%20"));
      this.connectionType =
        (parsed.protocol as IDbClients) || this.connectionType || "sqlite";

      if (parsed.params?.sslmode && parsed.params.sslmode !== "disable") {
        this.ssl = true;
      }
      this.host = parsed.hostname || this.host;
      this.port = parsed.port || this.port;
      this.username = parsed.user || this.username;
      this.defaultDatabase = parsed.path?.[0] ?? this.defaultDatabase;
      return true;
    } catch (ex) {
      log.error("unable to parse connection string, assuming sqlite file", ex);
      return false;
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  checkSqlite() {
    if (this.connectionType === "sqlite" && !this.defaultDatabase) {
      throw new Error("database path must be set for SQLite databases");
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  maybeClearPasswords() {
    if (!this.rememberPassword) {
    }
  }
}
