import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MarkGithubIcon, LinkExternalIcon } from "@primer/octicons-react";

import HydraIcon from "@renderer/assets/icons/hydra.svg?react";
import "./settings-about.scss";

const FORK_REPO_URL = "https://github.com/mentalblank/orthrus";
const UPSTREAM_REPO_URL = "https://github.com/hydralauncher/hydra";
const UPSTREAM_SITE_URL = "https://hydralauncher.gg";

export function SettingsAbout() {
  const { t } = useTranslation("settings");

  const [version, setVersion] = useState("");

  useEffect(() => {
    window.electron.getVersion().then(setVersion);
  }, []);

  const openExternal = (url: string) => window.electron.openExternal(url);

  return (
    <div className="settings-about">
      <div className="settings-about__header">
        <HydraIcon className="settings-about__logo" />
        <div className="settings-about__heading">
          <h2>Orthrus Launcher</h2>
          <span className="settings-about__version">v{version}</span>
        </div>
      </div>

      <p className="settings-about__description">{t("about_description")}</p>

      <div className="settings-about__links">
        <button
          type="button"
          className="settings-about__link"
          onClick={() => openExternal(FORK_REPO_URL)}
        >
          <MarkGithubIcon size={16} />
          {t("about_repository")}
        </button>
        <button
          type="button"
          className="settings-about__link"
          onClick={() => openExternal(UPSTREAM_REPO_URL)}
        >
          <MarkGithubIcon size={16} />
          {t("about_upstream_repository")}
        </button>
        <button
          type="button"
          className="settings-about__link"
          onClick={() => openExternal(UPSTREAM_SITE_URL)}
        >
          <LinkExternalIcon size={16} />
          {t("about_upstream_site")}
        </button>
      </div>

      <p className="settings-about__credit">{t("about_credit")}</p>
    </div>
  );
}
