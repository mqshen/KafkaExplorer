export default {
  name: "used_query",
  queries: [
    `CREATE TABLE IF NOT EXISTS "used_query" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "version" integer NOT NULL, "text" text NOT NULL, "database" varchar NOT NULL, "connectionHash" varchar NOT NULL, "status" varchar NOT NULL, "numberOfRecords" bigint, connectionId integer, workspaceId integer not null default -1);`,
  ],
  async run(runner) {
    for (let i = 0; i < this.queries.length; i++) {
      await runner.query(this.queries[i]);
    }
  },
};
