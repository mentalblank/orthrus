import { useEffect, useState } from "react";
import { Modal } from "../modal/modal";
import { useTranslation } from "react-i18next";
import { Badge } from "../badge/badge";
import "./changelog-modal.scss";

export interface ChangelogModalProps {
  visible: boolean;
  onClose: () => void;
}

interface GitHubRelease {
  id: number;
  name: string;
  tag_name: string;
  published_at: string;
  body: string;
  prerelease: boolean;
  html_url: string;
}

function parseMarkdown(text: string) {
  if (!text) return "";
  // Escape HTML to prevent basic XSS
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headers (e.g. ### Header)
  html = html.replace(/^(#{1,6})\s+(.+)$/gm, (_, hashes, content) => {
    const level = hashes.length;
    return `<h${level}>${content}</h${level}>`;
  });

  // Bullet points
  html = html.replace(/^\*\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/^-\s+(.+)$/gm, "<li>$1</li>");
  // Group <li> into <ul> (rough replacement)
  html = html.replace(/((?:<li>.+?<\/li>\s*)+)/gs, "<ul>$1</ul>");

  // Bold (**text**)
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Links ([text](url))
  html = html.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Paragraphs / line breaks
  html = html.replace(/\n/g, "<br />");

  return html;
}

export function ChangelogModal({ visible, onClose }: ChangelogModalProps) {
  const { t } = useTranslation("bottom_panel");
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;

    const fetchReleases = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          "https://api.github.com/repos/mentalblank/hydra/releases"
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        const data = await response.json();
        setReleases(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchReleases();
  }, [visible]);

  return (
    <Modal
      visible={visible}
      title={t("changelog", "Changelog")}
      onClose={onClose}
      large
    >
      <div className="changelog-modal">
        {loading && (
          <div className="changelog-modal__loading">
            <p>{t("loading_changelog", "Loading changelogs...")}</p>
          </div>
        )}

        {error && (
          <div className="changelog-modal__error">
            <p>{t("failed_changelog", "Failed to load changelogs.")}</p>
            <small>{error}</small>
          </div>
        )}

        {!loading && !error && releases.length === 0 && (
          <div className="changelog-modal__empty">
            <p>{t("no_changelogs", "No changelogs available.")}</p>
          </div>
        )}

        {!loading && !error && releases.length > 0 && (
          <div className="changelog-modal__list">
            {releases.map((release) => (
              <div key={release.id} className="changelog-modal__item">
                <div className="changelog-modal__item-header">
                  <div className="changelog-modal__item-title-wrapper">
                    <h3 className="changelog-modal__item-title">
                      {release.name || release.tag_name}
                    </h3>
                    {release.prerelease && (
                      <Badge>{t("prerelease", "Beta")}</Badge>
                    )}
                  </div>
                  <span className="changelog-modal__item-date">
                    {new Date(release.published_at).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </span>
                </div>

                <div
                  className="changelog-modal__item-body"
                  dangerouslySetInnerHTML={{
                    __html: parseMarkdown(release.body),
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
