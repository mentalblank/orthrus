import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  useLibrary,
  useAppDispatch,
  useAppSelector,
  useGameCollections,
  useCollectionSettings,
  useToast,
} from "@renderer/hooks";
import { setHeaderTitle } from "@renderer/features";
import {
  HeartIcon,
  TelescopeIcon,
  FileDirectoryIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeClosedIcon,
  LockIcon,
  UnlockIcon,
  ListUnorderedIcon,
  CheckIcon,
  ChecklistIcon,
  XIcon,
} from "@primer/octicons-react";
import { useTranslation } from "react-i18next";
import { GameCollection, LibraryGame } from "@types";
import {
  Button,
  ConfirmationModal,
  ContextMenu,
  ContextMenuItemData,
  GameContextMenu,
  CollectionPinModal,
  ManageCollectionGamesModal,
  Modal,
  TextField,
} from "@renderer/components";
import { useSearchParams } from "react-router-dom";
import { LibraryGameCard } from "./library-game-card";
import { LibraryGameCardLarge } from "./library-game-card-large";
import { ViewOptions, ViewMode } from "./view-options";
import { FilterOptions, SortOption } from "./filter-options";
import "./library.scss";

const FAVORITES_COLLECTION_ID = "__favorites__";
const SORT_OPTIONS: SortOption[] = [
  "title_asc",
  "recently_played",
  "most_played",
  "installed_first",
  "title_desc",
];

const getGameCollectionIds = (game: LibraryGame): string[] => {
  if (Array.isArray(game.collectionIds)) {
    return game.collectionIds;
  }

  const legacyCollectionId = (game as { collectionId?: string | null })
    .collectionId;

  return legacyCollectionId ? [legacyCollectionId] : [];
};

export default function Library() {
  const { library, updateLibrary } = useLibrary();
  const { showSuccessToast, showErrorToast } = useToast();
  const {
    collections,
    loadCollections,
    bulkAssignGamesToCollection,
    hasLoaded: hasLoadedCollections,
  } = useGameCollections();
  const {
    getSettings,
    updateSettings,
    hasPin,
    unlocked,
    setPin,
    unlock,
    lockSession,
    isChipVisibleInLibrary,
    isGameHiddenInLibrary,
  } = useCollectionSettings();
  const [searchParams, setSearchParams] = useSearchParams();

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const savedViewMode = localStorage.getItem("library-view-mode");
    return (savedViewMode as ViewMode) || "compact";
  });
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const savedSortBy = localStorage.getItem("library-sort-by");
    if (savedSortBy && SORT_OPTIONS.includes(savedSortBy as SortOption)) {
      return savedSortBy as SortOption;
    }

    return "title_asc";
  });
  const [gameContextMenu, setGameContextMenu] = useState<{
    game: LibraryGame | null;
    visible: boolean;
    position: { x: number; y: number };
  }>({ game: null, visible: false, position: { x: 0, y: 0 } });
  const [collectionContextMenu, setCollectionContextMenu] = useState<{
    collection: GameCollection | null;
    visible: boolean;
    position: { x: number; y: number };
  }>({ collection: null, visible: false, position: { x: 0, y: 0 } });
  const [activeCollection, setActiveCollection] =
    useState<GameCollection | null>(null);
  const [showRenameCollectionModal, setShowRenameCollectionModal] =
    useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [isRenamingCollection, setIsRenamingCollection] = useState(false);
  const [showDeleteCollectionModal, setShowDeleteCollectionModal] =
    useState(false);
  const [isDeletingCollection, setIsDeletingCollection] = useState(false);
  const [pinModal, setPinModal] = useState<{
    visible: boolean;
    mode: "create" | "enter";
  }>({ visible: false, mode: "enter" });
  const [pendingLockCollectionId, setPendingLockCollectionId] = useState<
    string | null
  >(null);
  const [manageGamesCollection, setManageGamesCollection] =
    useState<GameCollection | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedGameKeys, setSelectedGameKeys] = useState<Set<string>>(
    new Set()
  );
  const [bulkPicker, setBulkPicker] = useState<{
    visible: boolean;
    mode: "add" | "remove";
    position: { x: number; y: number };
  }>({ visible: false, mode: "add", position: { x: 0, y: 0 } });

  const searchQuery = useAppSelector((state) => state.library.searchQuery);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const dispatch = useAppDispatch();
  const { t } = useTranslation(["library", "sidebar"]);

  const selectedCollectionId = searchParams.get("collection");

  const handleCollectionSelect = useCallback(
    (collectionId: string | null) => {
      const params = new URLSearchParams(searchParams);

      if (collectionId) {
        params.set("collection", collectionId);
      } else {
        params.delete("collection");
      }

      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("library-view-mode", mode);
  }, []);

  const handleSortChange = useCallback((nextSortBy: SortOption) => {
    setSortBy(nextSortBy);
    localStorage.setItem("library-sort-by", nextSortBy);
  }, []);

  useEffect(() => {
    dispatch(setHeaderTitle(t("library")));

    const unsubscribe = window.electron.onLibraryBatchComplete(() => {
      updateLibrary();
      void loadCollections();
    });

    window.electron.refreshLibraryAssets().finally(() => {
      const collectionsPromise = hasLoadedCollections
        ? Promise.resolve([])
        : loadCollections();

      void Promise.all([updateLibrary(), collectionsPromise]);
    });

    return () => {
      unsubscribe();
    };
  }, [dispatch, t, updateLibrary, loadCollections, hasLoadedCollections]);

  const handleOnMouseEnterGameCard = useCallback(() => {
    // Optional: pause animations if needed
  }, []);

  const handleOnMouseLeaveGameCard = useCallback(() => {
    // Optional: resume animations if needed
  }, []);

  const handleOpenContextMenu = useCallback(
    (game: LibraryGame, position: { x: number; y: number }) => {
      setGameContextMenu({ game, visible: true, position });
    },
    []
  );

  const handleCloseContextMenu = useCallback(() => {
    setGameContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleOpenCollectionContextMenu = useCallback(
    (
      event: React.MouseEvent<HTMLButtonElement>,
      collection: GameCollection
    ) => {
      event.preventDefault();

      setCollectionContextMenu({
        collection,
        visible: true,
        position: { x: event.clientX, y: event.clientY },
      });
    },
    []
  );

  const handleCloseCollectionContextMenu = useCallback(() => {
    setCollectionContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  const resolveCollectionErrorMessage = useCallback(
    (
      error: unknown,
      fallbackKey: "failed_rename_collection" | "failed_delete_collection"
    ) => {
      if (!(error instanceof Error)) return t(fallbackKey);

      if (error.message.includes("game/collection-name-already-in-use")) {
        return t("collection_name_already_in_use", { ns: "sidebar" });
      }

      if (error.message.includes("game/collection-name-required")) {
        return t("collection_name_required", { ns: "sidebar" });
      }

      return t(fallbackKey);
    },
    [t]
  );

  const handleOpenRenameCollectionModal = useCallback(() => {
    const collection = collectionContextMenu.collection;
    if (!collection) return;

    setActiveCollection(collection);
    setCollectionName(collection.name);
    setShowRenameCollectionModal(true);
    handleCloseCollectionContextMenu();
  }, [collectionContextMenu.collection, handleCloseCollectionContextMenu]);

  const handleCloseRenameCollectionModal = useCallback(() => {
    if (isRenamingCollection) return;

    setShowRenameCollectionModal(false);
    setCollectionName("");
    setActiveCollection(null);
  }, [isRenamingCollection]);

  const handleRenameCollection = useCallback(async () => {
    if (!activeCollection) return;

    const nextName = collectionName.trim();
    if (!nextName) {
      showErrorToast(t("collection_name_required", { ns: "sidebar" }));
      return;
    }

    if (nextName === activeCollection.name.trim()) {
      handleCloseRenameCollectionModal();
      return;
    }

    setIsRenamingCollection(true);

    try {
      await window.electron.renameCollection(activeCollection.id, nextName);

      await loadCollections();
      showSuccessToast(t("collection_renamed"));
      handleCloseRenameCollectionModal();
    } catch (error) {
      showErrorToast(
        resolveCollectionErrorMessage(error, "failed_rename_collection")
      );
    } finally {
      setIsRenamingCollection(false);
    }
  }, [
    activeCollection,
    collectionName,
    handleCloseRenameCollectionModal,
    loadCollections,
    resolveCollectionErrorMessage,
    showErrorToast,
    showSuccessToast,
    t,
  ]);

  const handleOpenDeleteCollectionModal = useCallback(() => {
    const collection = collectionContextMenu.collection;
    if (!collection) return;

    setActiveCollection(collection);
    setShowDeleteCollectionModal(true);
    handleCloseCollectionContextMenu();
  }, [collectionContextMenu.collection, handleCloseCollectionContextMenu]);

  const handleCloseDeleteCollectionModal = useCallback(() => {
    if (isDeletingCollection) return;

    setShowDeleteCollectionModal(false);
    setActiveCollection(null);
  }, [isDeletingCollection]);

  const handleDeleteCollection = useCallback(async () => {
    if (!activeCollection) return;

    setIsDeletingCollection(true);

    try {
      await window.electron.deleteCollection(activeCollection.id);

      if (selectedCollectionId === activeCollection.id) {
        handleCollectionSelect(null);
      }

      await Promise.all([loadCollections(), updateLibrary()]);
      showSuccessToast(t("collection_deleted"));
      handleCloseDeleteCollectionModal();
    } catch (error) {
      showErrorToast(
        resolveCollectionErrorMessage(error, "failed_delete_collection")
      );
    } finally {
      setIsDeletingCollection(false);
    }
  }, [
    activeCollection,
    selectedCollectionId,
    handleCollectionSelect,
    loadCollections,
    updateLibrary,
    showSuccessToast,
    t,
    handleCloseDeleteCollectionModal,
    showErrorToast,
    resolveCollectionErrorMessage,
  ]);

  const handleToggleShowInLibrary = useCallback(() => {
    const collection = collectionContextMenu.collection;
    if (!collection) return;

    const current = getSettings(collection.id);
    updateSettings(collection.id, { showInLibrary: !current.showInLibrary });
    handleCloseCollectionContextMenu();
  }, [
    collectionContextMenu.collection,
    getSettings,
    updateSettings,
    handleCloseCollectionContextMenu,
  ]);

  const handleToggleShowInSidebar = useCallback(() => {
    const collection = collectionContextMenu.collection;
    if (!collection) return;

    const current = getSettings(collection.id);
    updateSettings(collection.id, { showInSidebar: !current.showInSidebar });
    handleCloseCollectionContextMenu();
  }, [
    collectionContextMenu.collection,
    getSettings,
    updateSettings,
    handleCloseCollectionContextMenu,
  ]);

  const handleToggleLock = useCallback(() => {
    const collection = collectionContextMenu.collection;
    if (!collection) return;

    const current = getSettings(collection.id);
    handleCloseCollectionContextMenu();

    if (current.locked) {
      updateSettings(collection.id, { locked: false });
      return;
    }

    if (!hasPin) {
      setPendingLockCollectionId(collection.id);
      setPinModal({ visible: true, mode: "create" });
      return;
    }

    updateSettings(collection.id, { locked: true });
  }, [
    collectionContextMenu.collection,
    getSettings,
    hasPin,
    updateSettings,
    handleCloseCollectionContextMenu,
  ]);

  const handleOpenManageGames = useCallback(() => {
    const collection = collectionContextMenu.collection;
    if (!collection) return;

    setManageGamesCollection(collection);
    handleCloseCollectionContextMenu();
  }, [collectionContextMenu.collection, handleCloseCollectionContextMenu]);

  const collectionContextMenuItems = useMemo<ContextMenuItemData[]>(() => {
    const isCollectionActionBusy = isRenamingCollection || isDeletingCollection;
    const collection = collectionContextMenu.collection;
    const settings = collection
      ? getSettings(collection.id)
      : { showInLibrary: true, showInSidebar: true, locked: false };

    return [
      {
        id: "toggle-show-in-library",
        label: t("show_in_library"),
        icon: settings.showInLibrary ? (
          <EyeIcon size={16} />
        ) : (
          <EyeClosedIcon size={16} />
        ),
        trailingIcon: settings.showInLibrary ? (
          <CheckIcon size={16} />
        ) : undefined,
        onClick: handleToggleShowInLibrary,
        closeOnClick: false,
        disabled: isCollectionActionBusy,
      },
      {
        id: "toggle-show-in-sidebar",
        label: t("show_in_sidebar"),
        icon: settings.showInSidebar ? (
          <EyeIcon size={16} />
        ) : (
          <EyeClosedIcon size={16} />
        ),
        trailingIcon: settings.showInSidebar ? (
          <CheckIcon size={16} />
        ) : undefined,
        onClick: handleToggleShowInSidebar,
        closeOnClick: false,
        disabled: isCollectionActionBusy,
      },
      {
        id: "toggle-lock",
        label: settings.locked ? t("unlock_collection") : t("lock_collection"),
        icon: settings.locked ? (
          <UnlockIcon size={16} />
        ) : (
          <LockIcon size={16} />
        ),
        onClick: handleToggleLock,
        disabled: isCollectionActionBusy,
      },
      {
        id: "manage-games",
        label: t("manage_games"),
        icon: <ListUnorderedIcon size={16} />,
        onClick: handleOpenManageGames,
        separator: true,
        disabled: isCollectionActionBusy,
      },
      {
        id: "rename-collection",
        label: t("rename_collection"),
        icon: <PencilIcon size={16} />,
        onClick: handleOpenRenameCollectionModal,
        disabled: isCollectionActionBusy,
      },
      {
        id: "delete-collection",
        label: t("delete_collection"),
        icon: <TrashIcon size={16} />,
        onClick: handleOpenDeleteCollectionModal,
        danger: true,
        disabled: isCollectionActionBusy,
      },
    ];
  }, [
    collectionContextMenu.collection,
    getSettings,
    handleToggleShowInLibrary,
    handleToggleShowInSidebar,
    handleToggleLock,
    handleOpenManageGames,
    handleOpenDeleteCollectionModal,
    handleOpenRenameCollectionModal,
    isDeletingCollection,
    isRenamingCollection,
    t,
  ]);

  useEffect(() => {
    if (!selectedCollectionId) return;
    if (!hasLoadedCollections) return;

    if (selectedCollectionId === FAVORITES_COLLECTION_ID) return;

    const hasCollection = collections.some(
      (collection) => collection.id === selectedCollectionId
    );

    if (!hasCollection) {
      handleCollectionSelect(null);
    }
  }, [
    collections,
    selectedCollectionId,
    handleCollectionSelect,
    hasLoadedCollections,
  ]);

  const sortedLibrary = useMemo(() => {
    return [...library].sort((a, b) => {
      switch (sortBy) {
        case "recently_played": {
          const aHasPlayed = a.lastTimePlayed !== null;
          const bHasPlayed = b.lastTimePlayed !== null;

          if (aHasPlayed && bHasPlayed) {
            const aLastPlayed = new Date(a.lastTimePlayed as Date).getTime();
            const bLastPlayed = new Date(b.lastTimePlayed as Date).getTime();
            const lastPlayedDifference = bLastPlayed - aLastPlayed;
            if (lastPlayedDifference !== 0) return lastPlayedDifference;
          } else if (aHasPlayed !== bHasPlayed) {
            return aHasPlayed ? -1 : 1;
          }

          break;
        }

        case "most_played": {
          const playTimeDifference =
            b.playTimeInMilliseconds - a.playTimeInMilliseconds;
          if (playTimeDifference !== 0) return playTimeDifference;
          break;
        }

        case "installed_first": {
          const aIsInstalled =
            Boolean(a.executablePath) || a.installedSizeInBytes != null;
          const bIsInstalled =
            Boolean(b.executablePath) || b.installedSizeInBytes != null;

          if (aIsInstalled !== bIsInstalled) {
            return aIsInstalled ? -1 : 1;
          }

          break;
        }

        case "title_desc": {
          return b.title.localeCompare(a.title, undefined, {
            sensitivity: "base",
          });
        }

        case "title_asc":
        default:
          break;
      }

      return a.title.localeCompare(b.title, undefined, {
        sensitivity: "base",
      });
    });
  }, [library, sortBy]);

  const filteredLibrary = useMemo(() => {
    let filtered = sortedLibrary;

    if (selectedCollectionId) {
      if (selectedCollectionId === FAVORITES_COLLECTION_ID) {
        filtered = filtered.filter((game) => game.favorite);
      } else {
        filtered = filtered.filter((game) =>
          getGameCollectionIds(game).includes(selectedCollectionId)
        );
      }
    } else {
      filtered = filtered.filter(
        (game) => !isGameHiddenInLibrary(getGameCollectionIds(game))
      );
    }

    if (!deferredSearchQuery.trim()) return filtered;

    const queryLower = deferredSearchQuery.toLowerCase();
    return filtered.filter((game) => {
      const titleLower = game.title.toLowerCase();
      let queryIndex = 0;

      for (
        let i = 0;
        i < titleLower.length && queryIndex < queryLower.length;
        i++
      ) {
        if (titleLower[i] === queryLower[queryIndex]) {
          queryIndex++;
        }
      }

      return queryIndex === queryLower.length;
    });
  }, [
    sortedLibrary,
    deferredSearchQuery,
    selectedCollectionId,
    isGameHiddenInLibrary,
  ]);

  const favoritesCount = useMemo(() => {
    return library.filter((game) => game.favorite).length;
  }, [library]);

  const libraryCollections = useMemo<GameCollection[]>(() => {
    return [
      {
        id: FAVORITES_COLLECTION_ID,
        name: t("favorites"),
        gamesCount: favoritesCount,
      },
      ...collections.filter((collection) =>
        isChipVisibleInLibrary(collection.id)
      ),
    ];
  }, [collections, favoritesCount, t, isChipVisibleInLibrary]);

  const hasLockedCollections = useMemo(
    () => collections.some((collection) => getSettings(collection.id).locked),
    [collections, getSettings]
  );

  const gameKey = useCallback(
    (game: LibraryGame) => `${game.shop}:${game.objectId}`,
    []
  );

  const handleToggleSelectionMode = useCallback(() => {
    setSelectionMode((prev) => {
      if (prev) setSelectedGameKeys(new Set());
      return !prev;
    });
  }, []);

  const handleToggleSelect = useCallback(
    (game: LibraryGame) => {
      setSelectedGameKeys((prev) => {
        const next = new Set(prev);
        const key = gameKey(game);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
    },
    [gameKey]
  );

  const selectedGames = useMemo(
    () => library.filter((game) => selectedGameKeys.has(gameKey(game))),
    [library, selectedGameKeys, gameKey]
  );

  const handleBulkApply = useCallback(
    async (collectionId: string, mode: "add" | "remove") => {
      const games =
        mode === "add"
          ? { add: selectedGames, remove: [] }
          : { add: [], remove: selectedGames };

      try {
        await bulkAssignGamesToCollection(collectionId, games);
        showSuccessToast(t("collection_games_updated"));
        setSelectedGameKeys(new Set());
      } catch (error) {
        void error;
        showErrorToast(t("failed_update_collection_games"));
      }
    },
    [
      selectedGames,
      bulkAssignGamesToCollection,
      showSuccessToast,
      showErrorToast,
      t,
    ]
  );

  const bulkPickerItems = useMemo<ContextMenuItemData[]>(
    () =>
      collections.map((collection) => ({
        id: `bulk-${collection.id}`,
        label: collection.name,
        icon: <FileDirectoryIcon size={16} />,
        onClick: () => {
          void handleBulkApply(collection.id, bulkPicker.mode);
        },
      })),
    [collections, handleBulkApply, bulkPicker.mode]
  );

  const handleCreatePin = useCallback(
    async (pin: string) => {
      await setPin(pin);
      if (pendingLockCollectionId) {
        updateSettings(pendingLockCollectionId, { locked: true });
        setPendingLockCollectionId(null);
      }
    },
    [setPin, pendingLockCollectionId, updateSettings]
  );

  const hasGames = library.length > 0;
  const hasNoFilteredGames = filteredLibrary.length === 0;
  const isFavoritesCollectionSelected =
    selectedCollectionId === FAVORITES_COLLECTION_ID;
  const shouldShowFavoritesEmptyState =
    hasGames && isFavoritesCollectionSelected && hasNoFilteredGames;
  const shouldShowCollectionEmptyState =
    hasGames &&
    !shouldShowFavoritesEmptyState &&
    Boolean(selectedCollectionId) &&
    !isFavoritesCollectionSelected &&
    hasNoFilteredGames;

  return (
    <section className="library__content">
      {hasGames && (
        <div className="library__page-header">
          <div className="library__controls-row">
            <div className="library__controls-left">
              <FilterOptions sortBy={sortBy} onSortChange={handleSortChange} />
            </div>

            <div className="library__controls-right">
              {hasLockedCollections &&
                (unlocked ? (
                  <button
                    type="button"
                    className="library__control-button"
                    onClick={lockSession}
                    title={t("lock_session")}
                  >
                    <UnlockIcon size={16} />
                    <span>{t("lock_session")}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="library__control-button"
                    onClick={() =>
                      setPinModal({ visible: true, mode: "enter" })
                    }
                    title={t("reveal_locked")}
                  >
                    <LockIcon size={16} />
                    <span>{t("reveal_locked")}</span>
                  </button>
                ))}

              <button
                type="button"
                className={`library__control-button ${
                  selectionMode ? "library__control-button--active" : ""
                }`}
                onClick={handleToggleSelectionMode}
                title={selectionMode ? t("exit_selection") : t("select")}
              >
                {selectionMode ? (
                  <XIcon size={16} />
                ) : (
                  <ChecklistIcon size={16} />
                )}
                <span>{selectionMode ? t("exit_selection") : t("select")}</span>
              </button>

              <ViewOptions
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
              />
            </div>
          </div>

          {selectionMode && selectedGames.length > 0 && (
            <div className="library__bulk-bar">
              <span className="library__bulk-count">
                {t("games_selected", { count: selectedGames.length })}
              </span>

              <div className="library__bulk-actions">
                <Button
                  type="button"
                  theme="outline"
                  onClick={(event) =>
                    setBulkPicker({
                      visible: true,
                      mode: "add",
                      position: {
                        x: event.clientX,
                        y: event.clientY,
                      },
                    })
                  }
                  disabled={collections.length === 0}
                >
                  {t("add_to_collection")}
                </Button>

                <Button
                  type="button"
                  theme="outline"
                  onClick={(event) =>
                    setBulkPicker({
                      visible: true,
                      mode: "remove",
                      position: {
                        x: event.clientX,
                        y: event.clientY,
                      },
                    })
                  }
                  disabled={collections.length === 0}
                >
                  {t("remove_from_collection")}
                </Button>

                <Button
                  type="button"
                  theme="outline"
                  onClick={() => setSelectedGameKeys(new Set())}
                >
                  {t("clear_selection")}
                </Button>
              </div>
            </div>
          )}

          <div
            className="library__collections"
            role="group"
            aria-label={t("collections")}
          >
            {libraryCollections.map((collection) => {
              const isFavoritesCollection =
                collection.id === FAVORITES_COLLECTION_ID;

              return (
                <button
                  key={collection.id}
                  type="button"
                  className={`library__collection-item ${selectedCollectionId === collection.id ? "library__collection-item--active" : ""}`}
                  onClick={() =>
                    handleCollectionSelect(
                      selectedCollectionId === collection.id
                        ? null
                        : collection.id
                    )
                  }
                  onContextMenu={
                    isFavoritesCollection
                      ? undefined
                      : (event) =>
                          handleOpenCollectionContextMenu(event, collection)
                  }
                >
                  {isFavoritesCollection ? (
                    <HeartIcon size={16} />
                  ) : (
                    <FileDirectoryIcon size={16} />
                  )}
                  <span>{collection.name}</span>
                  <span className="library__collection-count">
                    {collection.gamesCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!hasGames && (
        <div className="library__no-games">
          <div className="library__telescope-icon">
            <TelescopeIcon size={24} />
          </div>
          <h2>{t("no_games_title")}</h2>
          <p>{t("no_games_description")}</p>
        </div>
      )}

      {shouldShowFavoritesEmptyState && (
        <div className="library__empty">
          <div className="library__icon-container">
            <HeartIcon size={24} />
          </div>
          <h2>{t("empty_favorites_title")}</h2>
          <p>{t("empty_favorites_description")}</p>
        </div>
      )}

      {shouldShowCollectionEmptyState && (
        <div className="library__empty">
          <div className="library__icon-container">
            <FileDirectoryIcon size={24} />
          </div>
          <h2>{t("empty_collection_title")}</h2>
          <p>{t("empty_collection_description")}</p>
        </div>
      )}

      {hasGames &&
        !shouldShowFavoritesEmptyState &&
        !shouldShowCollectionEmptyState && (
          <AnimatePresence mode="wait">
            {(viewMode === "large" || viewMode === "list") && (
              <motion.div
                key={`${sortBy}-${viewMode}`}
                className={`library__games-list library__games-list--${viewMode}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                {filteredLibrary.map((game) => (
                  <LibraryGameCardLarge
                    key={`${game.shop}-${game.objectId}`}
                    game={game}
                    onContextMenu={handleOpenContextMenu}
                    selectable={selectionMode}
                    selected={selectedGameKeys.has(gameKey(game))}
                    onToggleSelect={handleToggleSelect}
                  />
                ))}
              </motion.div>
            )}

            {(viewMode === "grid" || viewMode === "compact") && (
              <motion.ul
                key={`${sortBy}-${viewMode}`}
                className={`library__games-grid library__games-grid--${viewMode}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                {filteredLibrary.map((game) => (
                  <li
                    key={`${game.shop}-${game.objectId}`}
                    style={{ listStyle: "none" }}
                  >
                    <LibraryGameCard
                      game={game}
                      onMouseEnter={handleOnMouseEnterGameCard}
                      onMouseLeave={handleOnMouseLeaveGameCard}
                      onContextMenu={handleOpenContextMenu}
                      selectable={selectionMode}
                      selected={selectedGameKeys.has(gameKey(game))}
                      onToggleSelect={handleToggleSelect}
                    />
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        )}

      {gameContextMenu.game && (
        <GameContextMenu
          game={gameContextMenu.game}
          visible={gameContextMenu.visible}
          position={gameContextMenu.position}
          onClose={handleCloseContextMenu}
        />
      )}

      <ContextMenu
        items={collectionContextMenuItems}
        visible={collectionContextMenu.visible}
        position={collectionContextMenu.position}
        onClose={handleCloseCollectionContextMenu}
      />

      <ContextMenu
        items={bulkPickerItems}
        visible={bulkPicker.visible}
        position={bulkPicker.position}
        onClose={() => setBulkPicker((prev) => ({ ...prev, visible: false }))}
      />

      <CollectionPinModal
        visible={pinModal.visible}
        mode={pinModal.mode}
        onClose={() => {
          setPinModal((prev) => ({ ...prev, visible: false }));
          setPendingLockCollectionId(null);
        }}
        onCreate={handleCreatePin}
        onUnlock={unlock}
      />

      <ManageCollectionGamesModal
        visible={manageGamesCollection !== null}
        collection={manageGamesCollection}
        onClose={() => setManageGamesCollection(null)}
        onApplied={() => {
          void loadCollections();
        }}
      />

      <Modal
        visible={showRenameCollectionModal}
        title={t("rename_collection")}
        description={t("rename_collection_description")}
        onClose={handleCloseRenameCollectionModal}
      >
        <div className="library__collection-modal">
          <TextField
            label={t("collection_name", { ns: "sidebar" })}
            placeholder={t("collection_name_placeholder", { ns: "sidebar" })}
            value={collectionName}
            onChange={(event) => setCollectionName(event.target.value)}
            theme="dark"
            disabled={isRenamingCollection}
            maxLength={60}
          />

          <div className="library__collection-modal-actions">
            <Button
              type="button"
              theme="outline"
              onClick={handleCloseRenameCollectionModal}
              disabled={isRenamingCollection}
            >
              {t("cancel", { ns: "sidebar" })}
            </Button>

            <Button
              type="button"
              theme="primary"
              onClick={handleRenameCollection}
              disabled={!collectionName.trim() || isRenamingCollection}
            >
              {isRenamingCollection
                ? t("renaming_collection")
                : t("rename_collection")}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        visible={showDeleteCollectionModal}
        title={t("delete_collection_title")}
        descriptionText={t("delete_collection_description", {
          collectionName: activeCollection?.name ?? "",
        })}
        onClose={handleCloseDeleteCollectionModal}
        onConfirm={() => {
          void handleDeleteCollection();
        }}
        cancelButtonLabel={t("cancel", { ns: "sidebar" })}
        confirmButtonLabel={t("delete_collection")}
        buttonsIsDisabled={isDeletingCollection}
      />
    </section>
  );
}
