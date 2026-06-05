import { registerEvent } from "../register-event";
import { downloadSourcesSublevel } from "@main/level";
import type { DownloadSource } from "@types";

const updateDownloadSource = async (
  _event: Electron.IpcMainInvokeEvent,
  id: string,
  patch: Partial<Pick<DownloadSource, "pinned">>
) => {
  const source = await downloadSourcesSublevel.get(id);
  if (!source) return;

  await downloadSourcesSublevel.put(id, { ...source, ...patch });
};

registerEvent("updateDownloadSource", updateDownloadSource);
