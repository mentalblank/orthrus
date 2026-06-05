import { Button, CheckboxField } from "@renderer/components";
import { useContext, useEffect, useMemo } from "react";
import type { ChangeEvent } from "react";
import { cloudSyncContext, gameDetailsContext } from "@renderer/context";
import { useToast } from "@renderer/hooks";
import "./cloud-sync-panel.scss";
import { DownloadIcon, SyncIcon, UploadIcon } from "@primer/octicons-react";
import { useTranslation } from "react-i18next";

interface CloudSyncPanelProps {
  automaticCloudSync: boolean;
  onToggleAutomaticCloudSync: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function CloudSyncPanel({
  automaticCloudSync,
  onToggleAutomaticCloudSync,
}: Readonly<CloudSyncPanelProps>) {
  const { t } = useTranslation("game_details");

  const {
    backupPreview,
    uploadingBackup,
    loadingPreview,
    uploadSaveGame,
    setShowCloudSyncFilesModal,
    getGameBackupPreview,
  } = useContext(cloudSyncContext);

  const { lastDownloadedOption, game, objectId, shop } =
    useContext(gameDetailsContext);
  const { showSuccessToast, showErrorToast } = useToast();

  useEffect(() => {
    /* Local-only: load the Ludusavi save preview so backups can be created. */
    getGameBackupPreview();
  }, [getGameBackupPreview]);

  const handleExportSave = async () => {
    if (!objectId || !shop) return;
    try {
      const result = await window.electron.exportGameSave(shop, objectId);
      if (!result.canceled && result.path) {
        showSuccessToast(t("save_exported"));
        window.electron.showItemInFolder(result.path);
      }
    } catch {
      showErrorToast(t("save_export_failed"));
    }
  };

  const handleImportSave = async () => {
    if (!objectId || !shop) return;
    try {
      const result = await window.electron.importGameSave(shop, objectId);
      if (!result.canceled && result.restored) {
        showSuccessToast(t("save_imported"));
        getGameBackupPreview();
      }
    } catch {
      showErrorToast(t("save_import_failed"));
    }
  };

  const backupStateLabel = useMemo(() => {
    if (uploadingBackup) {
      return (
        <span className="cloud-sync-panel__backup-state-label">
          <SyncIcon className="cloud-sync-panel__sync-icon" />
          {t("uploading_backup")}
        </span>
      );
    }
    if (loadingPreview) {
      return (
        <span className="cloud-sync-panel__backup-state-label">
          <SyncIcon className="cloud-sync-panel__sync-icon" />
          {t("loading_save_preview")}
        </span>
      );
    }
    if (!backupPreview) {
      return t("no_backup_preview");
    }
    return "";
  }, [backupPreview, loadingPreview, t, uploadingBackup]);

  return (
    <>
      <div className="cloud-sync-panel__section-header">
        <h2>{t("backup")}</h2>
        <p>{t("backup_description")}</p>
      </div>

      <div className="cloud-sync-panel__automatic-sync">
        <CheckboxField
          label={t("enable_automatic_backup")}
          checked={automaticCloudSync}
          disabled={!game?.executablePath}
          onChange={onToggleAutomaticCloudSync}
        />
      </div>

      <div className="cloud-sync-panel__header">
        <div className="cloud-sync-panel__title-container">
          <p>{backupStateLabel}</p>
          <button
            type="button"
            className="cloud-sync-panel__manage-files-button"
            onClick={() => setShowCloudSyncFilesModal(true)}
            disabled={uploadingBackup}
          >
            {t("manage_files")}
          </button>
        </div>

        <Button
          type="button"
          onClick={() => uploadSaveGame(lastDownloadedOption?.title ?? null)}
          disabled={uploadingBackup || !backupPreview?.overall.totalGames}
        >
          {uploadingBackup ? (
            <SyncIcon className="cloud-sync-panel__sync-icon" />
          ) : (
            <UploadIcon />
          )}
          {t("create_backup")}
        </Button>
      </div>

      <div className="cloud-sync-panel__transfer-buttons">
        <Button
          type="button"
          theme="outline"
          onClick={handleExportSave}
          disabled={uploadingBackup || !backupPreview?.overall.totalGames}
        >
          <UploadIcon />
          {t("export_save")}
        </Button>

        <Button type="button" theme="outline" onClick={handleImportSave}>
          <DownloadIcon />
          {t("import_save")}
        </Button>
      </div>
    </>
  );
}
