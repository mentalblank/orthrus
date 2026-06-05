import { BrowserWindow, dialog } from "electron";
import path from "node:path";
import fs from "node:fs";
import * as tar from "tar";

import { registerEvent } from "../register-event";
import { Ludusavi, WindowManager } from "@main/services";
import { Wine } from "@main/services/wine";
import { backupsPath } from "@main/constants";
import { gamesSublevel, levelKeys } from "@main/level";
import type { GameShop } from "@types";

const importGameSave = async (
  event: Electron.IpcMainInvokeEvent,
  shop: GameShop,
  objectId: string
): Promise<{ canceled: boolean; restored?: boolean }> => {
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

  const backupPath = path.join(backupsPath, `${shop}-${objectId}`);
  fs.mkdirSync(backupPath, { recursive: true });

  await tar.extract({ file: archivePath, cwd: backupPath });

  const game = await gamesSublevel.get(levelKeys.game(shop, objectId));
  const winePrefix = Wine.getEffectivePrefixPath(
    game?.winePrefixPath,
    objectId
  );

  await Ludusavi.restoreGame(objectId, backupPath, winePrefix);

  return { canceled: false, restored: true };
};

registerEvent("importGameSave", importGameSave);
