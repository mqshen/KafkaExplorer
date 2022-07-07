export default {
  name: "saved_connections",
  queries: [
    `CREATE TABLE IF NOT EXISTS "saved_connection" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "version" integer NOT NULL, "connectionType" varchar NOT NULL, "host" varchar, "port" integer, "username" varchar, "defaultDatabase" varchar, "path" varchar, "uri" varchar, "uniqueHash" varchar(500) NOT NULL, "name" varchar NOT NULL, "password" varchar, "sshEnabled" boolean NOT NULL DEFAULT (0), "sshHost" varchar, "sshPort" integer, "sshMode" varchar(8) NOT NULL DEFAULT ('keyfile'), "sshKeyfile" varchar, "sshUsername" varchar, "rememberPassword" boolean NOT NULL DEFAULT (1), "rememberSshPassword" boolean NOT NULL DEFAULT (1), "rememberSshKeyfilePassword" boolean NOT NULL DEFAULT (1), "sshKeyfilePassword" varchar, "sshPassword" varchar, socketPathEnabled boolean not null DEFAULT (false), socketPath varchar(255) null, domain varchar(255), sshBastionHost varchar(255), ssl boolean not null default false, labelColor varchar(255) default 'default', sslCaFile varchar, sslCertFile varchar, sslKeyFile varchar, sslRejectUnauthorized boolean not null default true, workspaceId integer not null default -1, trustServerCertificate boolean not null default false, options text not null default '{}' );`,
  ],
  async run(runner) {
    for (let i = 0; i < this.queries.length; i++) {
      await runner.query(this.queries[i]);
    }
  },
};
