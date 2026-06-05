import { useCallback, useRef } from "react";
import type { LibraryGame } from "@types";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  addCollection,
  applyCollectionAssignment,
  setCollections,
  setCollectionsLoading,
  setGameCollectionIds,
} from "@renderer/features";

const getNormalizedCollectionIds = (
  game: Partial<LibraryGame> | undefined
): string[] => {
  if (!game) return [];
  if (Array.isArray(game.collectionIds)) return game.collectionIds;

  const legacyCollectionId = (game as { collectionId?: string | null })
    .collectionId;

  return legacyCollectionId ? [legacyCollectionId] : [];
};

export function useGameCollections() {
  const dispatch = useAppDispatch();
  // Monotonic guard: only the most recent load may write redux, so a slow,
  // stale read (started before an assign) can't revert a newer one.
  const loadSeqRef = useRef(0);
  const collections = useAppSelector((state) => state.collections.items);
  const isLoading = useAppSelector((state) => state.collections.isLoading);
  const hasLoaded = useAppSelector((state) => state.collections.hasLoaded);
  const library = useAppSelector((state) => state.library.value);

  const loadCollections = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    dispatch(setCollectionsLoading(true));

    try {
      const response = await window.electron.getCollections();

      if (seq === loadSeqRef.current) {
        dispatch(setCollections(response));
      }
      return response;
    } catch (error) {
      void error;
      // Keep existing collections in redux; don't wipe on transient error.
      return [];
    } finally {
      if (seq === loadSeqRef.current) {
        dispatch(setCollectionsLoading(false));
      }
    }
  }, [dispatch]);

  const assignGameToCollection = useCallback(
    async (
      game: Pick<LibraryGame, "shop" | "objectId">,
      collectionIds: string[]
    ) => {
      const currentGame = library.find(
        (libraryGame) =>
          libraryGame.shop === game.shop &&
          libraryGame.objectId === game.objectId
      );

      const previousCollectionIds = getNormalizedCollectionIds(currentGame);

      await window.electron.assignGameToCollection(
        game.shop,
        game.objectId,
        collectionIds
      );

      dispatch(
        setGameCollectionIds({
          shop: game.shop,
          objectId: game.objectId,
          collectionIds,
        })
      );

      dispatch(
        applyCollectionAssignment({
          previousCollectionIds,
          nextCollectionIds: collectionIds,
        })
      );

      // Authoritative re-sync; bumps the load sequence so any stale in-flight
      // load resolved afterwards is ignored.
      await loadCollections();
    },
    [dispatch, library, loadCollections]
  );

  const bulkAssignGamesToCollection = useCallback(
    async (
      collectionId: string,
      games: { add: LibraryGame[]; remove: LibraryGame[] }
    ) => {
      const apply = async (game: LibraryGame, shouldBeMember: boolean) => {
        const currentGame = library.find(
          (libraryGame) =>
            libraryGame.shop === game.shop &&
            libraryGame.objectId === game.objectId
        );

        const previousCollectionIds = getNormalizedCollectionIds(
          currentGame ?? game
        );
        const isMember = previousCollectionIds.includes(collectionId);

        if (shouldBeMember === isMember) return;

        const nextCollectionIds = shouldBeMember
          ? [...previousCollectionIds, collectionId]
          : previousCollectionIds.filter((id) => id !== collectionId);

        await window.electron.assignGameToCollection(
          game.shop,
          game.objectId,
          nextCollectionIds
        );

        dispatch(
          setGameCollectionIds({
            shop: game.shop,
            objectId: game.objectId,
            collectionIds: nextCollectionIds,
          })
        );

        dispatch(
          applyCollectionAssignment({
            previousCollectionIds,
            nextCollectionIds,
          })
        );
      };

      for (const game of games.add) {
        await apply(game, true);
      }

      for (const game of games.remove) {
        await apply(game, false);
      }

      // Authoritative re-sync; bumps the load sequence so any stale in-flight
      // load resolved afterwards is ignored.
      await loadCollections();
    },
    [dispatch, library, loadCollections]
  );

  const createCollection = useCallback(
    async (name: string) => {
      const normalizedName = name.trim().toLocaleLowerCase();
      const alreadyExists = collections.some(
        (collection) =>
          collection.name.trim().toLocaleLowerCase() === normalizedName
      );

      if (alreadyExists) {
        throw new Error("game/collection-name-already-in-use");
      }

      const response = await window.electron.createCollection(name);

      dispatch(addCollection(response));

      return response;
    },
    [collections, dispatch]
  );

  return {
    collections,
    isLoading,
    hasLoaded,
    loadCollections,
    assignGameToCollection,
    bulkAssignGamesToCollection,
    createCollection,
  };
}
