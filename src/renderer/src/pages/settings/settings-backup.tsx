import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DownloadIcon,
  FileDirectoryIcon,
  UploadIcon,
} from "@primer/octicons-react";

import { Button } from "@renderer/components";
import { useToast } from "@renderer/hooks";
import type { BackupArchiveContents } from "@types";
import { ExportBackupModal } from "./backup/export-backup-modal";
import { ImportBackupModal } from "./backup/import-backup-modal";
import "./settings-backup.scss";

export function SettingsBackup() {
  const { t } = useTranslation("settings");
  const { showErrorToast } = useToast();

  const [showExport, setShowExport] = useState(false);
  const [importState, setImportState] = useState<{
    path: string;
    contents: BackupArchiveContents;
  } | null>(null);

  const handleOpenImport = async () => {
    try {
      const result = await window.electron.openBackupArchive();
      if (result.canceled || !result.path || !result.contents) return;

      const { database, themes, assets, saves } = result.contents;
      if (!database && !themes && !assets && saves.length === 0) {
        showErrorToast(t("backup_archive_empty"));
        return;
      }

      setImportState({ path: result.path, contents: result.contents });
    } catch {
      showErrorToast(t("backup_restore_failed"));
    }
  };

  return (
    <div className="settings-backup">
      <div className="settings-backup__card">
        <div className="settings-backup__card-header">
          <UploadIcon size={20} />
          <div>
            <h3>{t("export_data")}</h3>
            <p>{t("export_data_description")}</p>
          </div>
        </div>
        <Button theme="outline" onClick={() => setShowExport(true)}>
          {t("export_data")}
        </Button>
      </div>

      <div className="settings-backup__card">
        <div className="settings-backup__card-header">
          <DownloadIcon size={20} />
          <div>
            <h3>{t("import_data")}</h3>
            <p>{t("import_data_description")}</p>
          </div>
        </div>
        <Button theme="outline" onClick={handleOpenImport}>
          {t("import_data")}
        </Button>
      </div>

      <div className="settings-backup__card">
        <div className="settings-backup__card-header">
          <FileDirectoryIcon size={20} />
          <div>
            <h3>{t("open_backups_folder")}</h3>
          </div>
        </div>
        <Button
          theme="outline"
          onClick={() => window.electron.openBackupsFolder()}
        >
          {t("open_backups_folder")}
        </Button>
      </div>

      <ExportBackupModal
        visible={showExport}
        onClose={() => setShowExport(false)}
      />

      {importState && (
        <ImportBackupModal
          visible
          archivePath={importState.path}
          contents={importState.contents}
          onClose={() => setImportState(null)}
          onRestored={() => setImportState(null)}
        />
      )}
    </div>
  );
}
