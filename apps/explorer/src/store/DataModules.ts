import { LocalConnectionModule } from "@/store/modules/data/connection/LocalConnectionModule";
import { LocalConnectionFolderModule } from "@/store/modules/data/connection_folder/LocalConnectionFolderModule";

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
];
