import { app, BrowserWindow, dialog } from "electron";
import * as tar from "tar";

import { registerEvent } from "../register-event";
import { WindowManager, logger } from "@main/services";
import { SystemPath } from "@main/services/system-path";

export interface RestoreBackupResult {
  canceled: boolean;
  restored?: boolean;
}

/* Extracts a previously exported archive back into userData and relaunches. */
const restoreBackup = async (
  event: Electron.IpcMainInvokeEvent
): Promise<RestoreBackupResult> => {
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

  const confirm = await dialog.showMessageBox(senderWindow, {
    type: "warning",
    buttons: ["Cancel", "Restore and restart"],
    defaultId: 1,
    cancelId: 0,
    message:
      "Restoring will overwrite your current library, settings, and save backups, then restart the app. Continue?",
  });

  if (confirm.response !== 1) {
    return { canceled: true };
  }

  const userData = SystemPath.getPath("userData");

  await tar.extract({ file: archivePath, cwd: userData });

  logger.info("Restored backup archive", { archivePath });

  app.relaunch();
  app.exit(0);

  return { canceled: false, restored: true };
};

registerEvent("restoreBackup", restoreBackup);
