import { registerEvent } from "../register-event";
import { Collections } from "@main/services/collections";

const deleteCollection = async (
  _event: Electron.IpcMainInvokeEvent,
  id: string
) => Collections.remove(id);

registerEvent("deleteCollection", deleteCollection);
