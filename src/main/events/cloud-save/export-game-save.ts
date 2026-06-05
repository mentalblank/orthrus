import { BrowserWindow, dialog } from "electron";
import path from "node:path";
import fs from "node:fs";
import * as tar from "tar";

import { registerEvent } from "../register-event";
import { WindowManager } from "@main/services";
import { backupsPath } from "@main/constants";
import { gamesSublevel, levelKeys } from "@main/level";
import type { GameShop } from "@types";

const ILLEGAL_FILENAME_CHARS = /[<>:"/\\|?*]/g;

const sanitizeFileName = (name: string) =>
  name.replace(ILLEGAL_FILENAME_CHARS, "").replace(/\s+/g, " ").trim();

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

  const game = await gamesSublevel.get(levelKeys.game(shop, objectId));
  const baseName = sanitizeFileName(game?.title ?? "") || `${shop}-${objectId}`;

  // 2026-06-05 14-30-00
  const timestamp = new Date()
    .toISOString()
    .slice(0, 19)
    .replace("T", " ")
    .replace(/:/g, "-");

  const { canceled, filePath } = await dialog.showSaveDialog(senderWindow, {
    defaultPath: `${baseName} ${timestamp}.tar.gz`,
    filters: [{ name: "Archive", extensions: ["tar.gz", "tgz"] }],
  });

  if (canceled || !filePath) {
    return { canceled: true };
  }

  await tar.create({ gzip: true, file: filePath, cwd: backupPath }, ["."]);
  return { canceled: false, path: filePath };
};

registerEvent("exportGameSave", exportGameSave);
