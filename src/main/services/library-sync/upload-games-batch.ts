import { WindowManager } from "../window-manager";
import { AchievementWatcherManager } from "../achievements/achievement-watcher-manager";

export const uploadGamesBatch = async () => {
  // Local-only: do not upload anything.

  AchievementWatcherManager.preSearchAchievements();

  if (WindowManager.mainWindow) {
    WindowManager.sendToAppWindows("on-library-batch-complete");
  }
};
