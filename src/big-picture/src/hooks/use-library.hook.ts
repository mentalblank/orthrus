import { useCallback, useEffect, useState } from "react";
import { IS_DESKTOP } from "../constants";
import type { LibraryGame } from "@types";

function isGameHidden(game: LibraryGame): boolean {
  try {
    const raw = localStorage.getItem("collection-settings");
    if (!raw) return false;

    const settings = JSON.parse(raw) as Record<
      string,
      { showInLibrary?: boolean; locked?: boolean }
    >;

    const collectionIds = Array.isArray(game.collectionIds)
      ? game.collectionIds
      : (game as { collectionId?: string | null }).collectionId
        ? [(game as { collectionId?: string | null }).collectionId!]
        : [];

    return collectionIds.some((id) => {
      const colSettings = settings[id];
      if (!colSettings) return false;

      const showInLibrary = colSettings.showInLibrary ?? true;
      const locked = colSettings.locked ?? false;

      return !showInLibrary || locked;
    });
  } catch {
    return false;
  }
}

export function useLibrary() {
  const [library, setLibrary] = useState<LibraryGame[]>([]);

  const updateLibrary = useCallback(async () => {
    if (!IS_DESKTOP) return;
    const updatedLibrary = await globalThis.window.electron.getLibrary();
    const filteredLibrary = updatedLibrary.filter(
      (game) => !isGameHidden(game)
    );
    setLibrary(filteredLibrary);
  }, []);

  useEffect(() => {
    updateLibrary();

    if (!IS_DESKTOP) return;

    const unsubscribeLibraryBatch =
      globalThis.window.electron.onLibraryBatchComplete(() => {
        updateLibrary();
      });

    const unsubscribeDownloadsUpdated =
      globalThis.window.electron.onDownloadsUpdated(() => {
        updateLibrary();
      });

    const handleLibraryUpdate = () => updateLibrary();
    globalThis.window.addEventListener("library-update", handleLibraryUpdate);

    return () => {
      unsubscribeLibraryBatch();
      unsubscribeDownloadsUpdated();
      globalThis.window.removeEventListener(
        "library-update",
        handleLibraryUpdate
      );
    };
  }, [updateLibrary]);

  return { library, updateLibrary };
}
