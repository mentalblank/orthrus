import { BrowserWindow, dialog } from "electron";
import path from "node:path";
import fs from "node:fs";
import * as tar from "tar";

import { registerEvent } from "../register-event";
import { WindowManager } from "@main/services";
import { backupsPath } from "@main/constants";
import type { GameShop } from "@types";

const exportGameSave = async (
  event: Electron.IpcMainInvokeEvent,
  shop: GameShop,
  objectId: string
): Promise<{ canceled: boolean; path?: string }> => {
  const senderWindow =
    BrowserWindow.fromWebContents(event.sender) ?? WindowManager.mainWindow;

  if (!senderWindow) {
    throw new Error("Main window is not available");
  }

  const backupPath = path.join(backupsPath, `${shop}-${objectId}`);

  if (!fs.existsSync(backupPath)) {
    throw new Error("no-backup");
  }

  const { canceled, filePath } = await dialog.showSaveDialog(senderWindow, {
    defaultPath: `${shop}-${objectId}-save.tar.gz`,
    filters: [{ name: "Archive", extensions: ["tar.gz", "tgz"] }],
  });

  if (canceled || !filePath) {
    return { canceled: true };
  }

  await tar.create({ gzip: true, file: filePath, cwd: backupPath }, ["."]);
  return { canceled: false, path: filePath };
};

registerEvent("exportGameSave", exportGameSave);
