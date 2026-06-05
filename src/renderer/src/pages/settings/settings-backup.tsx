import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, TextField } from "@renderer/components";
import { settingsContext } from "@renderer/context";
import { useAppSelector, useToast } from "@renderer/hooks";
import "./settings-backup.scss";

export function SettingsBackup() {
  const { t } = useTranslation("settings");
  const { updateUserPreferences } = useContext(settingsContext);
  const { showSuccessToast, showErrorToast } = useToast();

  const userPreferences = useAppSelector(
    (state) => state.userPreferences.value
  );

  const [isExporting, setIsExporting] = useState<"all" | "saves" | null>(null);
  const [backupsToKeep, setBackupsToKeep] = useState("5");

  useEffect(() => {
    if (userPreferences?.backupsToKeep != null) {
      setBackupsToKeep(String(userPreferences.backupsToKeep));
    }
  }, [userPreferences?.backupsToKeep]);

  const handleExportBackup = async (scope: "all" | "saves") => {
    setIsExporting(scope);
    try {
      const result = await window.electron.exportBackup(scope);
      if (!result.canceled && result.path) {
        showSuccessToast(t("backup_exported"));
        window.electron.showItemInFolder(result.path);
      }
    } catch {
      showErrorToast(t("backup_export_failed"));
    } finally {
      setIsExporting(null);
    }
  };

  const handleRestoreBackup = async () => {
    try {
      await window.electron.restoreBackup();
    } catch {
      showErrorToast(t("backup_restore_failed"));
    }
  };

  const handleRetentionChange = (value: string) => {
    setBackupsToKeep(value);
    const parsed = Math.max(1, Math.min(50, Number(value) || 1));
    updateUserPreferences({ backupsToKeep: parsed });
  };

  return (
    <div className="settings-backup">
      <div className="settings-backup__group">
        <h3>{t("incremental_backups")}</h3>
        <p>{t("incremental_backups_description")}</p>

        <TextField
          type="number"
          min={1}
          max={50}
          label={t("backups_to_keep")}
          value={backupsToKeep}
          onChange={(event) => handleRetentionChange(event.target.value)}
        />
      </div>

      <div className="settings-backup__group">
        <h3>{t("data_backup")}</h3>
        <p>{t("export_backup_description")}</p>

        <div className="settings-backup__buttons">
          <Button
            theme="outline"
            onClick={() => handleExportBackup("all")}
            disabled={isExporting !== null}
          >
            {isExporting === "all" ? t("exporting") : t("export_all_data")}
          </Button>

          <Button
            theme="outline"
            onClick={() => handleExportBackup("saves")}
            disabled={isExporting !== null}
          >
            {isExporting === "saves"
              ? t("exporting")
              : t("export_save_backups")}
          </Button>

          <Button
            theme="outline"
            onClick={handleRestoreBackup}
            disabled={isExporting !== null}
          >
            {t("restore_backup")}
          </Button>

          <Button
            theme="outline"
            onClick={() => window.electron.openBackupsFolder()}
          >
            {t("open_backups_folder")}
          </Button>
        </div>
      </div>
    </div>
  );
}
