import path from "node:path";
import fs from "node:fs";

import type { LibraryGame } from "@types";
import { registerEvent } from "../register-event";
import {
  downloadsSublevel,
  gameAchievementsSublevel,
  gamesShopAssetsSublevel,
  gamesSublevel,
} from "@main/level";

const getLibrary = async (): Promise<LibraryGame[]> => {
  return gamesSublevel
    .iterator()
    .all()
    .then((results) => {
      return Promise.all(
        results
          .filter(([_key, game]) => game.isDeleted === false)
          .map(async ([key, game]) => {
            const download = await downloadsSublevel.get(key);
            const gameAssets = await gamesShopAssetsSublevel.get(key);
            const achievements = await gameAchievementsSublevel
              .get(key)
              .catch(() => null);

            const validAchievementNames = new Set(
              achievements?.achievements?.map((a) =>
                (a.name ?? "").toUpperCase()
              ) || []
            );

            const unlockedAchievementNames = new Set(
              achievements?.unlockedAchievements
                ?.filter(
                  (unlocked) =>
                    validAchievementNames.has(
                      (unlocked.name ?? "").toUpperCase()
                    ) && unlocked.unlockTime > 0
                )
                .map((unlocked) => (unlocked.name ?? "").toUpperCase()) ?? []
            );

            const unlockedAchievementCount =
              unlockedAchievementNames.size ||
              game.unlockedAchievementCount ||
              0;

            const achievementsPointsTotal =
              achievements?.achievements?.reduce(
                (sum, a) => sum + (a.points ?? 0),
                0
              ) ?? 0;

            const achievementsPointsEarnedSum =
              achievements?.achievements?.reduce(
                (sum, a) =>
                  sum +
                  (unlockedAchievementNames.has((a.name ?? "").toUpperCase())
                    ? (a.points ?? 0)
                    : 0),
                0
              ) ?? 0;

            // Verify installer still exists, clear if deleted externally
            let installerSizeInBytes = game.installerSizeInBytes;
            if (installerSizeInBytes && download?.folderName) {
              const installerPath = path.join(
                download.downloadPath,
                download.folderName
              );

              if (!fs.existsSync(installerPath)) {
                installerSizeInBytes = null;
                gamesSublevel.put(key, { ...game, installerSizeInBytes: null });
              }
            }

            // Verify installed folder still exists, clear if deleted externally
            let installedSizeInBytes = game.installedSizeInBytes;
            if (installedSizeInBytes && game.executablePath) {
              const executableDir = path.dirname(game.executablePath);

              if (!fs.existsSync(executableDir)) {
                installedSizeInBytes = null;
                gamesSublevel.put(key, {
                  ...game,
                  installerSizeInBytes,
                  installedSizeInBytes: null,
                });
              }
            }

            return {
              id: key,
              ...game,
              installerSizeInBytes,
              installedSizeInBytes,
              download: download ?? null,
              unlockedAchievementCount,
              achievementCount: game.achievementCount ?? 0,
              achievementsPointsEarnedSum,
              achievementsPointsTotal,
              // Spread gameAssets last to ensure all image URLs are properly set
              ...gameAssets,
              // Preserve custom image URLs from game if they exist
              customIconUrl: game.customIconUrl,
              customLogoImageUrl: game.customLogoImageUrl,
              customHeroImageUrl: game.customHeroImageUrl,
            };
          })
      );
    });
};

registerEvent("getLibrary", getLibrary);
