import createLogger from "../lib/logger";

import createSettings from "./create_settings";
import saveConnections from "./saved_connections";
import useConnections from "./used_connections";
import useQuery from "./used_query";

const logger = createLogger("migrations")();

const setupSQL = `
 CREATE TABLE IF NOT EXISTS BK_MIGRATIONS(
   name VARCHAR(255) PRIMARY KEY NOT NULL,
   run_at datetime NOT NULL DEFAULT (datetime('now'))
 )
`;
const realMigrations = [
  createSettings,
  saveConnections,
  useConnections,
  useQuery,
];

// fixtures require the models
const fixtures = [];

const devMigrations = [];

const migrations = [...realMigrations, ...fixtures, ...devMigrations];

const Manager = {
  ceQuery: "select name from bk_migrations where name = ?",
  meQuery: "INSERT INTO bk_migrations(name) values (?)",

  async checkExists(runner, name) {
    const result = await runner.query(this.ceQuery, [name]);
    return result.length > 0;
  },
  async markExists(runner, name) {
    const result = await runner.query(this.meQuery, [name]);
    return !!result;
  },
};

export default class {
  constructor(connection, env) {
    this.connection = connection;
    this.env = env;
  }

  async run() {
    console.log("running migrations");
    const runner = this.connection.connection.createQueryRunner();
    await runner.query(setupSQL);
    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      logger.debug(`Checking migration ${migration.name}`);
      if (migration.env && migration.env !== this.env) {
        // env defined, and does not match
        logger.debug(
          `Skipping ${migration.name} in ${this.env}, required ${migration.env} `
        );
        continue;
      }
      const hasRun = await Manager.checkExists(runner, migration.name);
      if (!hasRun) {
        await migration.run(runner, this.env);
        await Manager.markExists(runner, migration.name);
      }
    }
  }
}
