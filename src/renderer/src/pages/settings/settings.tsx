import { useTranslation } from "react-i18next";
import {
  SettingsContextConsumer,
  SettingsContextProvider,
} from "@renderer/context";
import { useMemo } from "react";
import "./settings.scss";
import {
  BellIcon,
  CloudIcon,
  DownloadIcon,
  GearIcon,
  InfoIcon,
  PlayIcon,
} from "@primer/octicons-react";
import { Wrench } from "lucide-react";
import { SettingsContextGeneral } from "./settings-context-general";
import { SettingsContextDownloads } from "./settings-context-downloads";
import { SettingsContextNotifications } from "./settings-context-notifications";
import { SettingsContextContentGameplay } from "./settings-context-content-gameplay";
import { SettingsContextIntegrations } from "./settings-context-integrations";
import { SettingsContextCompatibility } from "./settings-context-compatibility";
import { SettingsAbout } from "./settings-about";

export default function Settings() {
  const { t } = useTranslation("settings");

  const categories = useMemo(
    () => [
      {
        id: "general" as const,
        label: t("general"),
        icon: <GearIcon size={16} />,
      },
      {
        id: "downloads" as const,
        label: t("downloads"),
        icon: <DownloadIcon size={16} />,
      },
      {
        id: "notifications" as const,
        label: t("notifications"),
        icon: <BellIcon size={16} />,
      },
      {
        id: "content_gameplay" as const,
        label: t("content_gameplay"),
        icon: <PlayIcon size={16} />,
      },
      {
        id: "integrations" as const,
        label: t("integrations"),
        icon: <CloudIcon size={16} />,
      },
      {
        id: "compatibility" as const,
        label: t("compatibility"),
        icon: <Wrench size={16} />,
      },
      {
        id: "about" as const,
        label: t("about"),
        icon: <InfoIcon size={16} />,
      },
    ],
    [t]
  );

  return (
    <SettingsContextProvider>
      <SettingsContextConsumer>
        {({ currentCategoryId, setCurrentCategoryId, appearance }) => {
          const currentCategory =
            categories.find((category) => category.id === currentCategoryId) ??
            categories[0];
          const selectedCategoryId = currentCategory.id;

          const renderCategory = () => {
            if (selectedCategoryId === "general") {
              return <SettingsContextGeneral appearance={appearance} />;
            }

            if (selectedCategoryId === "downloads") {
              return <SettingsContextDownloads />;
            }

            if (selectedCategoryId === "notifications") {
              return <SettingsContextNotifications />;
            }

            if (selectedCategoryId === "content_gameplay") {
              return <SettingsContextContentGameplay />;
            }

            if (selectedCategoryId === "integrations") {
              return <SettingsContextIntegrations />;
            }

            if (selectedCategoryId === "compatibility") {
              return <SettingsContextCompatibility />;
            }

            if (selectedCategoryId === "about") {
              return <SettingsAbout />;
            }

            return <SettingsContextGeneral appearance={appearance} />;
          };

          return (
            <section className="settings__container">
              <div className="settings__content">
                <aside className="settings__sidebar">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className={`settings__sidebar-button ${
                        currentCategory.id === category.id
                          ? "settings__sidebar-button--active"
                          : ""
                      }`}
                      onClick={() => setCurrentCategoryId(category.id)}
                    >
                      <span className="settings__sidebar-button-icon">
                        {category.icon}
                      </span>
                      <span>{category.label}</span>
                    </button>
                  ))}
                </aside>

                <div className="settings__panel">
                  <h2>{currentCategory.label}</h2>
                  {renderCategory()}
                </div>
              </div>
            </section>
          );
        }}
      </SettingsContextConsumer>
    </SettingsContextProvider>
  );
}
