import { BrowserWindow, dialog } from "electron";
import path from "node:path";
import fs from "node:fs";
import * as tar from "tar";

import { registerEvent } from "../register-event";
import { WindowManager, logger } from "@main/services";
import { SystemPath } from "@main/services/system-path";
import {
  ASSETS_PATH,
  THEMES_PATH,
  backupsPath,
  levelDatabasePath,
} from "@main/constants";

export type BackupScope = "all" | "saves";

export interface ExportBackupResult {
  canceled: boolean;
  path?: string;
}

/* Bundles local app data (and/or Ludusavi save backups) into a .tar.gz the user picks. */
const exportBackup = async (
  event: Electron.IpcMainInvokeEvent,
  scope: BackupScope = "all"
): Promise<ExportBackupResult> => {
  const senderWindow =
    BrowserWindow.fromWebContents(event.sender) ?? WindowManager.mainWindow;

  if (!senderWindow) {
    throw new Error("Main window is not available");
  }

  const userData = SystemPath.getPath("userData");
  const timestamp = new Date().toISOString().slice(0, 10);
  const defaultName =
    scope === "saves"
      ? `hydra-saves-${timestamp}.tar.gz`
      : `hydra-backup-${timestamp}.tar.gz`;

  const { canceled, filePath } = await dialog.showSaveDialog(senderWindow, {
    defaultPath: defaultName,
    filters: [{ name: "Archive", extensions: ["tar.gz", "tgz"] }],
  });

  if (canceled || !filePath) {
    return { canceled: true };
  }

  const targets =
    scope === "saves"
      ? [backupsPath]
      : [levelDatabasePath, backupsPath, ASSETS_PATH, THEMES_PATH];

  const entries = targets
    .filter((dir) => fs.existsSync(dir))
    .map((dir) => path.relative(userData, dir));

  if (entries.length === 0) {
    throw new Error("Nothing to export");
  }

  await tar.create({ gzip: true, file: filePath, cwd: userData }, entries);

  logger.info("Exported backup archive", { filePath, scope });
  return { canceled: false, path: filePath };
};

registerEvent("exportBackup", exportBackup);
