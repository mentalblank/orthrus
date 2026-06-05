import { setHeaderTitle } from "@renderer/features";
import { useAppDispatch, useLibrary, useCollectionSettings } from "@renderer/hooks";
import type { GameShop, LibraryGame } from "@types";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  GameDetailsContextConsumer,
  GameDetailsContextProvider,
} from "@renderer/context";
import { SkeletonTheme } from "react-loading-skeleton";
import { AchievementsSkeleton } from "./achievements-skeleton";
import { AchievementsContent } from "./achievements-content";

const getGameCollectionIds = (game: LibraryGame): string[] => {
  if (Array.isArray(game.collectionIds)) return game.collectionIds;

  const legacyCollectionId = (game as { collectionId?: string | null })
    .collectionId;

  return legacyCollectionId ? [legacyCollectionId] : [];
};

export default function Achievements() {
  const [searchParams] = useSearchParams();
  const objectId = searchParams.get("objectId");
  const shop = searchParams.get("shop");
  const title = searchParams.get("title");

  const dispatch = useAppDispatch();
  const { library } = useLibrary();
  const { getSettings, unlocked } = useCollectionSettings();

  const isLocked = useMemo(() => {
    const game = library.find(
      (g) => g.objectId === objectId && g.shop === shop
    );
    if (!game) return false;
    const collectionIds = getGameCollectionIds(game);
    const hasLockedCollection = collectionIds.some(
      (id) => getSettings(id).locked
    );
    return hasLockedCollection && !unlocked;
  }, [library, objectId, shop, getSettings, unlocked]);

  useEffect(() => {
    if (title && !isLocked) {
      dispatch(setHeaderTitle(title));
    }
  }, [dispatch, title, isLocked]);

  if (isLocked) {
    return null;
  }

  return (
    <GameDetailsContextProvider
      gameTitle={title!}
      shop={shop as GameShop}
      objectId={objectId!}
    >
      <GameDetailsContextConsumer>
        {({ isLoading, achievements }) => {
          const showSkeleton = isLoading || achievements === null;

          return (
            <SkeletonTheme baseColor="#1c1c1c" highlightColor="#444">
              {showSkeleton ? (
                <AchievementsSkeleton />
              ) : (
                <AchievementsContent />
              )}
            </SkeletonTheme>
          );
        }}
      </GameDetailsContextConsumer>
    </GameDetailsContextProvider>
  );
}
