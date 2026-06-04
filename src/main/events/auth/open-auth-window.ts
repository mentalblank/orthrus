import { registerEvent } from "../register-event";
import type { AuthPage } from "@shared";
import { logger } from "@main/services";

/* Local-only: remote login/auth window disabled. */
const openAuthWindow = async (
  _event: Electron.IpcMainInvokeEvent,
  _page: AuthPage
) => {
  logger.info("openAuthWindow ignored: running in local-only mode");
};

registerEvent("openAuthWindow", openAuthWindow);
