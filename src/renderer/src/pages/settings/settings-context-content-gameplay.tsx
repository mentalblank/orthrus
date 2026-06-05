import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { CheckboxField, Button, ConfirmationModal } from "@renderer/components";
import { settingsContext } from "@renderer/context";
import {
  useAppSelector,
  useCollectionSettings,
  useGameCollections,
  useLibrary,
  useToast,
} from "@renderer/hooks";
import { QuestionIcon } from "@primer/octicons-react";

import "./settings-behavior.scss";

export function SettingsContextContentGameplay() {
  const { t } = useTranslation("settings");
  const { updateUserPreferences } = useContext(settingsContext);
  const { resetPinAndLockedCategories, hasPin } = useCollectionSettings();
  const { collections, loadCollections } = useGameCollections();
  const { library, updateLibrary } = useLibrary();
  const { showSuccessToast } = useToast();

  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const userPreferences = useAppSelector(
    (state) => state.userPreferences.value
  );

  const [form, setForm] = useState({
    autoplayGameTrailers: true,
    disableNsfwAlert: false,
    showHiddenAchievementsDescription: false,
    enableSteamAchievements: false,
    enableNewDownloadOptionsBadges: true,
  });

  useEffect(() => {
    if (!userPreferences) return;

    setForm({
      autoplayGameTrailers: userPreferences.autoplayGameTrailers ?? true,
      disableNsfwAlert: userPreferences.disableNsfwAlert ?? false,
      showHiddenAchievementsDescription:
        userPreferences.showHiddenAchievementsDescription ?? false,
      enableSteamAchievements: userPreferences.enableSteamAchievements ?? false,
      enableNewDownloadOptionsBadges:
        userPreferences.enableNewDownloadOptionsBadges ?? true,
    });
  }, [userPreferences]);

  const handleChange = (values: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...values }));
    updateUserPreferences(values);
  };

  const handleResetPin = async () => {
    setIsResetting(true);
    try {
      await resetPinAndLockedCategories(collections, library);
      await Promise.all([updateLibrary(), loadCollections()]);
      showSuccessToast(t("forgot_pin_success"));
      setShowConfirmReset(false);
    } catch (error) {
      void error;
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="settings-context-panel">
      <div className="settings-context-panel__group">
        <h3>{t("content_preferences")}</h3>

        <CheckboxField
          label={t("autoplay_trailers_on_game_page")}
          checked={form.autoplayGameTrailers}
          onChange={() =>
            handleChange({
              autoplayGameTrailers: !form.autoplayGameTrailers,
            })
          }
        />

        <CheckboxField
          label={t("disable_nsfw_alert")}
          checked={form.disableNsfwAlert}
          onChange={() =>
            handleChange({ disableNsfwAlert: !form.disableNsfwAlert })
          }
        />

        <CheckboxField
          label={t("show_hidden_achievement_description")}
          checked={form.showHiddenAchievementsDescription}
          onChange={() =>
            handleChange({
              showHiddenAchievementsDescription:
                !form.showHiddenAchievementsDescription,
            })
          }
        />
      </div>

      <div className="settings-context-panel__group">
        <h3>{t("gameplay_metadata")}</h3>

        <div className={`settings-behavior__checkbox-container--with-tooltip`}>
          <CheckboxField
            label={t("enable_steam_achievements")}
            checked={form.enableSteamAchievements}
            onChange={() =>
              handleChange({
                enableSteamAchievements: !form.enableSteamAchievements,
              })
            }
          />

          <small
            className="settings-behavior__checkbox-container--tooltip"
            data-open-article="steam-achievements"
          >
            <QuestionIcon size={12} />
          </small>
        </div>

        <CheckboxField
          label={t("enable_new_download_options_badges")}
          checked={form.enableNewDownloadOptionsBadges}
          onChange={() =>
            handleChange({
              enableNewDownloadOptionsBadges:
                !form.enableNewDownloadOptionsBadges,
            })
          }
        />
      </div>

      {hasPin && (
        <div className="settings-context-panel__group">
          <h3>{t("collection_pin_settings")}</h3>
          <p className="settings-behavior__description" style={{ marginBottom: "12px", fontSize: "13px", color: "#8a8a8a" }}>
            {t("forgot_pin_description")}
          </p>
          <div>
            <Button
              type="button"
              theme="danger"
              onClick={() => setShowConfirmReset(true)}
              disabled={isResetting}
            >
              {isResetting ? t("resetting") : t("reset_pin_and_locked_categories")}
            </Button>
          </div>
        </div>
      )}

      <ConfirmationModal
        visible={showConfirmReset}
        title={t("forgot_pin_confirm_title")}
        descriptionText={t("forgot_pin_confirm_description")}
        onClose={() => setShowConfirmReset(false)}
        onConfirm={() => {
          void handleResetPin();
        }}
        confirmButtonLabel={t("yes_reset")}
        cancelButtonLabel={t("cancel")}
      />
    </div>
  );
}
