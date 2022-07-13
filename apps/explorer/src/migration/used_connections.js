export default {
  name: "used_connections",
  queries: [
    `CREATE TABLE IF NOT EXISTS "used_connection" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "version" integer NOT NULL, "connectionType" varchar NOT NULL, "host" varchar, "port" integer, "username" varchar, "defaultDatabase" varchar, "path" varchar, "uri" varchar, "uniqueHash" varchar(500) NOT NULL, "sshEnabled" boolean NOT NULL DEFAULT (0), "sshHost" varchar, "sshPort" integer, "sshMode" varchar(8) NOT NULL DEFAULT ('keyfile'), "sshKeyfile" varchar, "sshUsername" varchar, ssl boolean not null default false, sshBastionHost varchar(255) default null, domain varchar(255) default null, savedConnectionId integer REFERENCES saved_connection(id) ON DELETE SET NULL, sslCaFile varchar, sslCertFile varchar, sslKeyFile varchar, sslRejectUnauthorized boolean not null default true, workspaceId integer not null default -1, connectionId integer null, trustServerCertificate boolean not null default false, socketPathEnabled boolean not null default false, socketPath varchar(255) null, options text not null default '{}');`,
  ],
  async run(runner) {
    for (let i = 0; i < this.queries.length; i++) {
      await runner.query(this.queries[i]);
    }
  },
};
