import { Dialect, DialectData } from "./models";
import { SqliteData } from "./sqlite";

export function getDialectData(dialect: Dialect): DialectData {
  switch (dialect) {
    case "sqlite":
      return SqliteData;
    default:
      return SqliteData;
  }
}
