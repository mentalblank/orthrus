import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, CheckboxField, Modal, TextField } from "@renderer/components";
import { useLibrary, useToast, useCollectionSettings } from "@renderer/hooks";
import type { BackupSelection, LibraryGame } from "@types";
import "./backup-modal.scss";

interface ExportBackupModalProps {
  visible: boolean;
  onClose: () => void;
}

const getGameCollectionIds = (game: LibraryGame): string[] => {
  if (Array.isArray(game.collectionIds)) return game.collectionIds;

  const legacyCollectionId = (game as { collectionId?: string | null })
    .collectionId;

  return legacyCollectionId ? [legacyCollectionId] : [];
};

export function ExportBackupModal({
  visible,
  onClose,
}: Readonly<ExportBackupModalProps>) {
  const { t } = useTranslation("settings");
  const { library } = useLibrary();
  const { showSuccessToast, showErrorToast } = useToast();
  const { getSettings, unlocked } = useCollectionSettings();

  const [database, setDatabase] = useState(true);
  const [themes, setThemes] = useState(false);
  const [assets, setAssets] = useState(false);
  const [saves, setSaves] = useState(true);
  const [allSaves, setAllSaves] = useState(true);
  const [selectedSaves, setSelectedSaves] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const games = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...library]
      .filter((game) => {
        const collectionIds = getGameCollectionIds(game);
        const hasLockedCollection = collectionIds.some(
          (id) => getSettings(id).locked
        );
        return !hasLockedCollection || unlocked;
      })
      .sort((a, b) => a.title.localeCompare(b.title))
      .filter((game) => !query || game.title.toLowerCase().includes(query));
  }, [library, search, getSettings, unlocked]);

  const folderName = (shop: string, objectId: string) => `${shop}-${objectId}`;

  const toggleSave = (name: string) => {
    setSelectedSaves((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleExport = async () => {
    const lockedGameIds = new Set<string>();
    library.forEach((game) => {
      const collectionIds = getGameCollectionIds(game);
      const hasLockedCollection = collectionIds.some(
        (id) => getSettings(id).locked
      );
      if (hasLockedCollection && !unlocked) {
        lockedGameIds.add(folderName(game.shop, game.objectId));
      }
    });

    const isAllSavesFiltered = allSaves && lockedGameIds.size > 0;

    const selection: BackupSelection = {
      database,
      themes,
      assets,
      saves: saves
        ? {
            all: isAllSavesFiltered ? false : allSaves,
            games: isAllSavesFiltered
              ? library
                  .filter((game) => {
                    const collectionIds = getGameCollectionIds(game);
                    const hasLockedCollection = collectionIds.some(
                      (id) => getSettings(id).locked
                    );
                    return !hasLockedCollection;
                  })
                  .map((game) => folderName(game.shop, game.objectId))
              : allSaves
                ? undefined
                : Array.from(selectedSaves).filter((name) => !lockedGameIds.has(name)),
          }
        : undefined,
    };

    const savesEmpty = saves && !allSaves && selectedSaves.size === 0;
    if ((!database && !themes && !assets && !saves) || savesEmpty) {
      showErrorToast(t("backup_nothing_selected"));
      return;
    }

    setIsExporting(true);
    try {
      const result = await window.electron.exportBackup(selection);
      if (!result.canceled && result.path) {
        showSuccessToast(t("backup_exported"));
        window.electron.showItemInFolder(result.path);
        onClose();
      }
    } catch {
      showErrorToast(t("backup_export_failed"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      title={t("export_backup_title")}
      description={t("export_data_description")}
      onClose={onClose}
    >
      <div className="backup-modal">
        <div className="backup-modal__group">
          <span className="backup-modal__group-title">
            {t("backup_select_data")}
          </span>
          <CheckboxField
            label={t("backup_library_settings")}
            checked={database}
            onChange={() => setDatabase((value) => !value)}
          />
          <CheckboxField
            label={t("backup_themes")}
            checked={themes}
            onChange={() => setThemes((value) => !value)}
          />
          <CheckboxField
            label={t("backup_assets")}
            checked={assets}
            onChange={() => setAssets((value) => !value)}
          />
        </div>

        <div className="backup-modal__group">
          <CheckboxField
            label={t("backup_select_saves")}
            checked={saves}
            onChange={() => setSaves((value) => !value)}
          />

          {saves && (
            <div className="backup-modal__nested">
              <CheckboxField
                label={t("backup_all_saves")}
                checked={allSaves}
                onChange={() => setAllSaves((value) => !value)}
              />

              {!allSaves && (
                <>
                  <TextField
                    theme="dark"
                    placeholder={t("filter", { ns: "sidebar" })}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <ul className="backup-modal__list">
                    {games.map((game) => {
                      const name = folderName(game.shop, game.objectId);
                      return (
                        <li key={name}>
                          <CheckboxField
                            label={game.title}
                            checked={selectedSaves.has(name)}
                            onChange={() => toggleSave(name)}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>

        <div className="backup-modal__actions">
          <Button theme="outline" onClick={onClose} disabled={isExporting}>
            {t("cancel", { ns: "sidebar" })}
          </Button>
          <Button theme="primary" onClick={handleExport} disabled={isExporting}>
            {isExporting ? t("exporting") : t("export")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
