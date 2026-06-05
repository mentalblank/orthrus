import { registerEvent } from "../register-event";
import { Collections } from "@main/services/collections";

const renameCollection = async (
  _event: Electron.IpcMainInvokeEvent,
  id: string,
  name: string
) => Collections.rename(id, name);

registerEvent("renameCollection", renameCollection);
