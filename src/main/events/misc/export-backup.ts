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
import type { BackupSelection } from "@types";

export interface ExportBackupResult {
  canceled: boolean;
  path?: string;
}

/* Bundles the selected local data and/or save backups into a .tar.gz. */
const exportBackup = async (
  event: Electron.IpcMainInvokeEvent,
  selection: BackupSelection
): Promise<ExportBackupResult> => {
  const senderWindow =
    BrowserWindow.fromWebContents(event.sender) ?? WindowManager.mainWindow;

  if (!senderWindow) {
    throw new Error("Main window is not available");
  }

  const userData = SystemPath.getPath("userData");
  const targets: string[] = [];

  if (selection.database) targets.push(levelDatabasePath);
  if (selection.themes) targets.push(THEMES_PATH);
  if (selection.assets) targets.push(ASSETS_PATH);

  if (selection.saves?.all) {
    targets.push(backupsPath);
  } else if (selection.saves?.games?.length) {
    for (const name of selection.saves.games) {
      targets.push(path.join(backupsPath, name));
    }
  }

  const entries = targets
    .filter((dir) => fs.existsSync(dir))
    .map((dir) => path.relative(userData, dir));

  if (entries.length === 0) {
    throw new Error("Nothing to export");
  }

  const onlySaves =
    !selection.database && !selection.themes && !selection.assets;
  const timestamp = new Date().toISOString().slice(0, 10);
  const defaultName = onlySaves
    ? `orthrus-saves-${timestamp}.tar.gz`
    : `orthrus-backup-${timestamp}.tar.gz`;

  const { canceled, filePath } = await dialog.showSaveDialog(senderWindow, {
    defaultPath: defaultName,
    filters: [{ name: "Archive", extensions: ["tar.gz", "tgz"] }],
  });

  if (canceled || !filePath) {
    return { canceled: true };
  }

  await tar.create({ gzip: true, file: filePath, cwd: userData }, entries);

  logger.info("Exported backup archive", { filePath, entries });
  return { canceled: false, path: filePath };
};

registerEvent("exportBackup", exportBackup);
