import { registerEvent } from "../register-event";
import { downloadSourcesSublevel } from "@main/level";

const reorderDownloadSources = async (
  _event: Electron.IpcMainInvokeEvent,
  orderedIds: string[]
) => {
  await Promise.all(
    orderedIds.map(async (id, index) => {
      const source = await downloadSourcesSublevel.get(id);
      if (!source) return;
      await downloadSourcesSublevel.put(id, { ...source, order: index });
    })
  );
};

registerEvent("reorderDownloadSources", reorderDownloadSources);
