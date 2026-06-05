import path from "node:path";
import { BrowserWindow, dialog } from "electron";
import * as tar from "tar";

import { registerEvent } from "../register-event";
import { WindowManager } from "@main/services";
import { backupsPath, levelDatabasePath } from "@main/constants";
import type { BackupArchiveContents } from "@types";

export interface OpenBackupArchiveResult {
  canceled: boolean;
  path?: string;
  contents?: BackupArchiveContents;
}

const dbBase = path.basename(levelDatabasePath);
const backupsBase = path.basename(backupsPath);

/* Lets the user pick an archive and reports which categories/saves it holds. */
const openBackupArchive = async (
  event: Electron.IpcMainInvokeEvent
): Promise<OpenBackupArchiveResult> => {
  const senderWindow =
    BrowserWindow.fromWebContents(event.sender) ?? WindowManager.mainWindow;

  if (!senderWindow) {
    throw new Error("Main window is not available");
  }

  const { canceled, filePaths } = await dialog.showOpenDialog(senderWindow, {
    properties: ["openFile"],
    filters: [{ name: "Archive", extensions: ["tar.gz", "tgz", "gz"] }],
  });

  const archivePath = filePaths?.[0];
  if (canceled || !archivePath) {
    return { canceled: true };
  }

  const contents: BackupArchiveContents = {
    database: false,
    themes: false,
    assets: false,
    saves: [],
  };
  const saves = new Set<string>();

  await tar.list({
    file: archivePath,
    onentry: (entry) => {
      const entryPath = entry.path.replace(/\\/g, "/");
      const [top, second] = entryPath.split("/");

      if (top === dbBase) contents.database = true;
      else if (top === "themes") contents.themes = true;
      else if (top === "Assets") contents.assets = true;
      else if (top === backupsBase && second) saves.add(second);
    },
  });

  contents.saves = Array.from(saves).sort();
  return { canceled: false, path: archivePath, contents };
};

registerEvent("openBackupArchive", openBackupArchive);
