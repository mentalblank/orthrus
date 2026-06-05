import { downloadSourcesSublevel } from "@main/level";
import { registerEvent } from "../register-event";
import { orderBy } from "lodash-es";

const getDownloadSources = async (_event: Electron.IpcMainInvokeEvent) => {
  const allSources = await downloadSourcesSublevel.values().all();
  // Pinned first, then manual order, then newest.
  return orderBy(
    allSources,
    [
      (source) => (source.pinned ? 0 : 1),
      (source) => source.order ?? Number.MAX_SAFE_INTEGER,
      "createdAt",
    ],
    ["asc", "asc", "desc"]
  );
};

registerEvent("getDownloadSources", getDownloadSources);
