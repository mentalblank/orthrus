import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { GameCollection, LibraryGame } from "@types";

import { Button, CheckboxField, Modal, TextField } from "@renderer/components";
import { useGameCollections, useLibrary, useToast } from "@renderer/hooks";

import "./manage-collection-games-modal.scss";

export interface ManageCollectionGamesModalProps {
  visible: boolean;
  collection: GameCollection | null;
  onClose: () => void;
  onApplied?: () => void;
}

const getGameCollectionIds = (game: LibraryGame): string[] => {
  if (Array.isArray(game.collectionIds)) return game.collectionIds;

  const legacyCollectionId = (game as { collectionId?: string | null })
    .collectionId;

  return legacyCollectionId ? [legacyCollectionId] : [];
};

export function ManageCollectionGamesModal({
  visible,
  collection,
  onClose,
  onApplied,
}: Readonly<ManageCollectionGamesModalProps>) {
  const { t } = useTranslation("library");
  const { library } = useLibrary();
  const { bulkAssignGamesToCollection } = useGameCollections();
  const { showSuccessToast, showErrorToast } = useToast();

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isApplying, setIsApplying] = useState(false);

  const eligibleGames = library;

  const gameKey = (game: LibraryGame) => `${game.shop}:${game.objectId}`;

  useEffect(() => {
    if (!visible || !collection) return;

    const initial = new Set<string>();
    for (const game of eligibleGames) {
      if (getGameCollectionIds(game).includes(collection.id)) {
        initial.add(gameKey(game));
      }
    }

    setSelectedIds(initial);
    setSearch("");
  }, [visible, collection, eligibleGames]);

  const filteredGames = useMemo(() => {
    const query = search.trim().toLowerCase();
    const sorted = [...eligibleGames].sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
    );

    if (!query) return sorted;
    return sorted.filter((game) => game.title.toLowerCase().includes(query));
  }, [eligibleGames, search]);

  const toggleGame = (game: LibraryGame) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const key = gameKey(game);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  };

  const handleApply = async () => {
    if (!collection) return;

    const add: LibraryGame[] = [];
    const remove: LibraryGame[] = [];

    for (const game of eligibleGames) {
      const isSelected = selectedIds.has(gameKey(game));
      const isMember = getGameCollectionIds(game).includes(collection.id);

      if (isSelected && !isMember) add.push(game);
      if (!isSelected && isMember) remove.push(game);
    }

    if (add.length === 0 && remove.length === 0) {
      onClose();
      return;
    }

    setIsApplying(true);

    try {
      await bulkAssignGamesToCollection(collection.id, { add, remove });
      showSuccessToast(t("collection_games_updated"));
      onApplied?.();
      onClose();
    } catch (error) {
      void error;
      showErrorToast(t("failed_update_collection_games"));
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Modal
      visible={visible}
      title={t("manage_games")}
      description={collection?.name ?? ""}
      onClose={() => {
        if (isApplying) return;
        onClose();
      }}
    >
      <div className="manage-collection-games-modal">
        <TextField
          placeholder={t("filter", { ns: "sidebar" })}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          theme="dark"
          disabled={isApplying}
        />

        <ul className="manage-collection-games-modal__list">
          {filteredGames.map((game) => (
            <li
              key={gameKey(game)}
              className="manage-collection-games-modal__item"
            >
              <CheckboxField
                label={game.title}
                checked={selectedIds.has(gameKey(game))}
                onChange={() => toggleGame(game)}
                disabled={isApplying}
              />
            </li>
          ))}
        </ul>

        <div className="manage-collection-games-modal__actions">
          <Button
            type="button"
            theme="outline"
            onClick={onClose}
            disabled={isApplying}
          >
            {t("cancel", { ns: "sidebar" })}
          </Button>

          <Button
            type="button"
            theme="primary"
            onClick={() => {
              void handleApply();
            }}
            disabled={isApplying}
          >
            {t("apply")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
