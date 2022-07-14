import { createConnection, Connection as TypeKafkaConnection } from "typeorm";
import { SavedConnection } from "./models/saved_connection";
import { UsedConnection } from "./models/used_connection";
import { UsedQuery } from "./models/used_query";
import { UserSetting } from "./models/user_setting";
import { LoggerOptions } from "typeorm/logger/LoggerOptions";

const models = [SavedConnection, UserSetting, UsedConnection, UsedQuery];

export default class Connection {
  private connection?: TypeKafkaConnection;

  constructor(private path: string, private logging: LoggerOptions) {}

  async connect() {
    this.connection = await createConnection({
      database: this.path,
      type: "better-sqlite3",
      synchronize: false,
      migrationsRun: false,
      entities: models,
      logging: this.logging,
    });
    return this.connection;
  }
}
