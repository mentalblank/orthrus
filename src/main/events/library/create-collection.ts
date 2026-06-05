import { registerEvent } from "../register-event";
import { Collections } from "@main/services/collections";

const createCollection = async (
  _event: Electron.IpcMainInvokeEvent,
  name: string
) => Collections.create(name);

registerEvent("createCollection", createCollection);
