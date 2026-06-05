import fs from "node:fs";
import { shell } from "electron";

import { registerEvent } from "../register-event";
import { backupsPath } from "@main/constants";

const openBackupsFolder = async () => {
  fs.mkdirSync(backupsPath, { recursive: true });
  await shell.openPath(backupsPath);
};

registerEvent("openBackupsFolder", openBackupsFolder);
