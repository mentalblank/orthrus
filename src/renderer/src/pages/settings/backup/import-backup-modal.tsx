import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, CheckboxField, Modal } from "@renderer/components";
import { useLibrary, useToast } from "@renderer/hooks";
import type { BackupArchiveContents, BackupSelection } from "@types";
import "./backup-modal.scss";

interface ImportBackupModalProps {
  visible: boolean;
  archivePath: string;
  contents: BackupArchiveContents;
  onClose: () => void;
  onRestored: () => void;
}

export function ImportBackupModal({
  visible,
  archivePath,
  contents,
  onClose,
  onRestored,
}: Readonly<ImportBackupModalProps>) {
  const { t } = useTranslation("settings");
  const { library } = useLibrary();
  const { showSuccessToast, showErrorToast } = useToast();

  const [database, setDatabase] = useState(true);
  const [themes, setThemes] = useState(true);
  const [assets, setAssets] = useState(true);
  const [saves, setSaves] = useState(true);
  const [selectedSaves, setSelectedSaves] = useState<Set<string>>(new Set());
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDatabase(contents.database);
    setThemes(contents.themes);
    setAssets(contents.assets);
    setSaves(contents.saves.length > 0);
    setSelectedSaves(new Set(contents.saves));
  }, [visible, contents]);

  // Map archive folder names (shop-objectId) to known titles where possible.
  const titleByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const game of library) {
      map.set(`${game.shop}-${game.objectId}`, game.title);
    }
    return map;
  }, [library]);

  const toggleSave = (name: string) => {
    setSelectedSaves((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleRestore = async () => {
    const allSaves = saves && selectedSaves.size === contents.saves.length;

    const selection: BackupSelection = {
      database: database && contents.database,
      themes: themes && contents.themes,
      assets: assets && contents.assets,
      saves: saves
        ? {
            all: allSaves,
            games: allSaves ? undefined : Array.from(selectedSaves),
          }
        : undefined,
    };

    const savesEmpty = saves && selectedSaves.size === 0;
    if (
      (!selection.database &&
        !selection.themes &&
        !selection.assets &&
        !saves) ||
      savesEmpty
    ) {
      showErrorToast(t("backup_nothing_selected"));
      return;
    }

    setIsRestoring(true);
    try {
      const result = await window.electron.restoreBackup(
        archivePath,
        selection
      );
      if (!result.canceled && result.restored && !result.relaunched) {
        showSuccessToast(t("backup_imported"));
        onRestored();
        onClose();
      }
    } catch {
      showErrorToast(t("backup_restore_failed"));
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Modal
      visible={visible}
      title={t("import_backup_title")}
      description={t("import_data_description")}
      onClose={onClose}
    >
      <div className="backup-modal">
        <div className="backup-modal__group">
          <span className="backup-modal__group-title">
            {t("backup_select_data")}
          </span>
          {contents.database && (
            <CheckboxField
              label={t("backup_library_settings")}
              checked={database}
              onChange={() => setDatabase((value) => !value)}
            />
          )}
          {contents.themes && (
            <CheckboxField
              label={t("backup_themes")}
              checked={themes}
              onChange={() => setThemes((value) => !value)}
            />
          )}
          {contents.assets && (
            <CheckboxField
              label={t("backup_assets")}
              checked={assets}
              onChange={() => setAssets((value) => !value)}
            />
          )}
        </div>

        {contents.saves.length > 0 && (
          <div className="backup-modal__group">
            <CheckboxField
              label={t("backup_select_saves")}
              checked={saves}
              onChange={() => setSaves((value) => !value)}
            />

            {saves && (
              <ul className="backup-modal__list backup-modal__nested">
                {contents.saves.map((name) => (
                  <li key={name}>
                    <CheckboxField
                      label={titleByName.get(name) ?? name}
                      checked={selectedSaves.has(name)}
                      onChange={() => toggleSave(name)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="backup-modal__actions">
          <Button theme="outline" onClick={onClose} disabled={isRestoring}>
            {t("cancel", { ns: "sidebar" })}
          </Button>
          <Button
            theme="primary"
            onClick={handleRestore}
            disabled={isRestoring}
          >
            {database && contents.database
              ? t("restore_and_restart")
              : t("restore")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
