import { registerEvent } from "../register-event";
import { getLocalUser } from "@main/services/user/local-user";

/* Local-only: session identity is the local user id, no JWT. */
const getSessionHash = async (_event: Electron.IpcMainInvokeEvent) => {
  const user = await getLocalUser();
  return user.id;
};

registerEvent("getSessionHash", getSessionHash);
