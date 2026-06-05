import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  EyeClosedIcon,
  EyeIcon,
  FileDirectoryIcon,
  LockIcon,
  PlusIcon,
  UnlockIcon,
} from "@primer/octicons-react";

import { useAppDispatch, useLibrary } from "@renderer/hooks";
import { setHeaderTitle } from "@renderer/features";
import { useGameCollections, useCollectionSettings } from "@renderer/hooks";
import {
  Button,
  CollectionPinModal,
  CreateCollectionModal,
} from "@renderer/components";
import type { LibraryGame } from "@types";
import { ViewOptions, ViewMode } from "../library/view-options";
import "./collections.scss";

const getCollectionIds = (game: LibraryGame): string[] => {
  if (Array.isArray(game.collectionIds)) return game.collectionIds;
  const legacy = (game as { collectionId?: string | null }).collectionId;
  return legacy ? [legacy] : [];
};

const getCoverImage = (game: LibraryGame): string =>
  game.customHeroImageUrl ||
  game.libraryHeroImageUrl ||
  game.libraryImageUrl ||
  game.iconUrl ||
  "";

export default function Collections() {
  const { t } = useTranslation(["library", "sidebar"]);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { collections, loadCollections } = useGameCollections();
  const { library } = useLibrary();
  const { getSettings, updateSettings, hasPin, setPin, unlock } =
    useCollectionSettings();

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("collections-view-mode");
    return saved && saved !== "list" ? (saved as ViewMode) : "grid";
  });

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("collections-view-mode", mode);
  };

  const [showCreate, setShowCreate] = useState(false);
  const [pinModal, setPinModal] = useState<{
    visible: boolean;
    mode: "create" | "enter";
  }>({ visible: false, mode: "enter" });
  const [pendingLockId, setPendingLockId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(setHeaderTitle(t("collections", { ns: "sidebar" })));
    void loadCollections();
  }, [dispatch, loadCollections, t]);

  const coversByCollection = useMemo(() => {
    const map = new Map<string, string[]>();

    for (const game of library) {
      const cover = getCoverImage(game);
      if (!cover) continue;

      for (const id of getCollectionIds(game)) {
        const covers = map.get(id) ?? [];
        if (covers.length < 4) covers.push(cover);
        map.set(id, covers);
      }
    }

    return map;
  }, [library]);

  const handleToggleLock = (collectionId: string) => {
    const settings = getSettings(collectionId);

    if (settings.locked) {
      updateSettings(collectionId, { locked: false });
      return;
    }

    if (!hasPin) {
      setPendingLockId(collectionId);
      setPinModal({ visible: true, mode: "create" });
      return;
    }

    updateSettings(collectionId, { locked: true });
  };

  const handleCreatePin = async (pin: string) => {
    await setPin(pin);
    if (pendingLockId) {
      updateSettings(pendingLockId, { locked: true });
      setPendingLockId(null);
    }
  };

  return (
    <section className="collections">
      <div className="collections__header">
        <h2>{t("collections", { ns: "sidebar" })}</h2>
        <div className="collections__header-controls">
          <ViewOptions
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            availableModes={["compact", "grid", "large"]}
          />
          <Button theme="outline" onClick={() => setShowCreate(true)}>
            <PlusIcon size={16} />
            {t("create_collection", { ns: "sidebar" })}
          </Button>
        </div>
      </div>

      {collections.length === 0 ? (
        <p className="collections__empty">{t("collections_empty")}</p>
      ) : (
        <ul className={`collections__grid collections__grid--${viewMode}`}>
          {collections.map((collection) => {
            const settings = getSettings(collection.id);
            const covers = coversByCollection.get(collection.id) ?? [];

            return (
              <li key={collection.id} className="collections__card">
                <button
                  type="button"
                  className="collections__card-cover"
                  onClick={() =>
                    navigate(`/library?collection=${collection.id}`)
                  }
                >
                  {covers.length > 0 ? (
                    <div
                      className={`collections__mosaic collections__mosaic--${Math.min(covers.length, 4)}`}
                    >
                      {covers.map((cover, index) => (
                        <img
                          key={`${collection.id}-${index}`}
                          src={cover}
                          alt=""
                          loading="lazy"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="collections__mosaic collections__mosaic--empty">
                      <FileDirectoryIcon size={32} />
                    </div>
                  )}

                  <div className="collections__card-overlay">
                    <span className="collections__card-name">
                      {collection.name}
                    </span>
                    <span className="collections__card-count">
                      {t("collections_games_count", {
                        count: collection.gamesCount,
                      })}
                    </span>
                  </div>
                </button>

                <div className="collections__card-actions">
                  <button
                    type="button"
                    title={t("show_in_library")}
                    onClick={() =>
                      updateSettings(collection.id, {
                        showInLibrary: !settings.showInLibrary,
                      })
                    }
                  >
                    {settings.showInLibrary ? (
                      <EyeIcon size={16} />
                    ) : (
                      <EyeClosedIcon size={16} />
                    )}
                  </button>

                  <button
                    type="button"
                    title={
                      settings.locked
                        ? t("unlock_collection")
                        : t("lock_collection")
                    }
                    onClick={() => handleToggleLock(collection.id)}
                  >
                    {settings.locked ? (
                      <LockIcon size={16} />
                    ) : (
                      <UnlockIcon size={16} />
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <CreateCollectionModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
      />

      <CollectionPinModal
        visible={pinModal.visible}
        mode={pinModal.mode}
        onClose={() => setPinModal((prev) => ({ ...prev, visible: false }))}
        onCreate={handleCreatePin}
        onUnlock={unlock}
      />
    </section>
  );
}
