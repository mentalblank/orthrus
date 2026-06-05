import path from "node:path";
import { app, BrowserWindow, dialog } from "electron";
import * as tar from "tar";
import i18next from "i18next";

import { registerEvent } from "../register-event";
import { WindowManager, logger } from "@main/services";
import { SystemPath } from "@main/services/system-path";
import { backupsPath, levelDatabasePath } from "@main/constants";
import type { BackupSelection } from "@types";

export interface RestoreBackupResult {
  canceled: boolean;
  restored?: boolean;
  relaunched?: boolean;
}

const dbBase = path.basename(levelDatabasePath);
const backupsBase = path.basename(backupsPath);

/* Extracts the selected parts of an archive back into userData. */
const restoreBackup = async (
  event: Electron.IpcMainInvokeEvent,
  archivePath: string,
  selection: BackupSelection
): Promise<RestoreBackupResult> => {
  const senderWindow =
    BrowserWindow.fromWebContents(event.sender) ?? WindowManager.mainWindow;

  if (!senderWindow) {
    throw new Error("Main window is not available");
  }

  if (!archivePath) {
    return { canceled: true };
  }

  const allowedPrefixes: string[] = [];
  if (selection.database) allowedPrefixes.push(`${dbBase}/`);
  if (selection.themes) allowedPrefixes.push("themes/");
  if (selection.assets) allowedPrefixes.push("Assets/");
  if (selection.saves?.all) {
    allowedPrefixes.push(`${backupsBase}/`);
  } else if (selection.saves?.games?.length) {
    for (const name of selection.saves.games) {
      allowedPrefixes.push(`${backupsBase}/${name}/`);
    }
  }

  if (allowedPrefixes.length === 0) {
    return { canceled: true };
  }

  const confirm = await dialog.showMessageBox(senderWindow, {
    type: "warning",
    buttons: [
      i18next.t("cancel", { ns: "sidebar" }),
      selection.database
        ? i18next.t("restore_and_restart", { ns: "settings" })
        : i18next.t("restore", { ns: "settings" }),
    ],
    defaultId: 1,
    cancelId: 0,
    message: selection.database
      ? i18next.t("restore_backup_warning", { ns: "settings" })
      : i18next.t("restore_backup_partial_warning", { ns: "settings" }),
  });

  if (confirm.response !== 1) {
    return { canceled: true };
  }

  const userData = SystemPath.getPath("userData");

  await tar.extract({
    file: archivePath,
    cwd: userData,
    filter: (entryPath) => {
      const normalized = entryPath.replace(/\\/g, "/");
      return allowedPrefixes.some((prefix) => normalized.startsWith(prefix));
    },
  });

  logger.info("Restored backup archive", { archivePath, allowedPrefixes });

  // Restoring the database changes the live data — relaunch to load it cleanly.
  if (selection.database) {
    app.relaunch();
    app.exit(0);
    return { canceled: false, restored: true, relaunched: true };
  }

  return { canceled: false, restored: true, relaunched: false };
};

registerEvent("restoreBackup", restoreBackup);
