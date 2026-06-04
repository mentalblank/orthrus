import { Button, CheckboxField } from "@renderer/components";
import { useContext, useEffect, useMemo } from "react";
import type { ChangeEvent } from "react";
import { cloudSyncContext, gameDetailsContext } from "@renderer/context";
import "./cloud-sync-panel.scss";
import { SyncIcon, UploadIcon } from "@primer/octicons-react";
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

  const { lastDownloadedOption, game } = useContext(gameDetailsContext);

  useEffect(() => {
    /* Local-only: load the Ludusavi save preview so backups can be created. */
    getGameBackupPreview();
  }, [getGameBackupPreview]);

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
    </>
  );
}
