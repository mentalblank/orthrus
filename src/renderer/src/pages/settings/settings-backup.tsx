import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@renderer/components";
import { useToast } from "@renderer/hooks";
import "./settings-backup.scss";

export function SettingsBackup() {
  const { t } = useTranslation("settings");
  const { showSuccessToast, showErrorToast } = useToast();

  const [isExporting, setIsExporting] = useState<"all" | "saves" | null>(null);

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

  return (
    <div className="settings-backup">
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
