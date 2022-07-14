import { LocalConnectionModule } from "@/store/modules/data/connection/LocalConnectionModule";
import { LocalConnectionFolderModule } from "@/store/modules/data/connection_folder/LocalConnectionFolderModule";
import { LocalUsedQueryModule } from "@/store/modules/data/used_query/LocalUsedQueryModule";

export const DataModules = [
  {
    path: "data/connections",
    cloud: null,
    local: LocalConnectionModule,
  },
  {
    path: "data/connectionFolders",
    cloud: null,
    local: LocalConnectionFolderModule,
  },
  {
    path: "data/usedQueries",
    cloud: null,
    local: LocalUsedQueryModule,
  },
];
