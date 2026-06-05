import { useContext, useEffect, useState } from "react";

import {
  TextField,
  Button,
  Badge,
  ConfirmationModal,
} from "@renderer/components";
import { useTranslation } from "react-i18next";

import type { DownloadSource } from "@types";
import {
  NoEntryIcon,
  PlusCircleIcon,
  SyncIcon,
  TrashIcon,
} from "@primer/octicons-react";
import { AddDownloadSourceModal } from "./add-download-source-modal";
import { useAppDispatch, useToast } from "@renderer/hooks";
import { useFormat } from "@renderer/hooks/use-format";
import { DownloadSourceStatus } from "@shared";
import { settingsContext } from "@renderer/context";
import { useNavigate } from "react-router-dom";
import { setFilters, clearFilters } from "@renderer/features";
import { levelDBService } from "@renderer/services/leveldb.service";
import { orderBy } from "lodash-es";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  PinIcon,
} from "@primer/octicons-react";
import "./settings-download-sources.scss";
import { logger } from "@renderer/logger";

const sortDownloadSources = (sources: DownloadSource[]) =>
  orderBy(
    sources,
    [
      (source) => (source.pinned ? 0 : 1),
      (source) => source.order ?? Number.MAX_SAFE_INTEGER,
      "createdAt",
    ],
    ["asc", "asc", "desc"]
  );

export function SettingsDownloadSources() {
  const [
    showConfirmationDeleteAllSourcesModal,
    setShowConfirmationDeleteAllSourcesModal,
  ] = useState(false);
  const [showAddDownloadSourceModal, setShowAddDownloadSourceModal] =
    useState(false);
  const [downloadSources, setDownloadSources] = useState<DownloadSource[]>([]);
  const [isSyncingDownloadSources, setIsSyncingDownloadSources] =
    useState(false);
  const [isRemovingDownloadSource, setIsRemovingDownloadSource] =
    useState(false);

  const { sourceUrl, clearSourceUrl } = useContext(settingsContext);

  const { t } = useTranslation("settings");
  const { showSuccessToast } = useToast();
  const { numberFormatter } = useFormat();

  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  useEffect(() => {
    if (sourceUrl) setShowAddDownloadSourceModal(true);
  }, [sourceUrl]);

  useEffect(() => {
    const fetchDownloadSources = async () => {
      const sources = (await levelDBService.values(
        "downloadSources"
      )) as DownloadSource[];
      const sorted = sortDownloadSources(sources);
      setDownloadSources(sorted);
    };

    fetchDownloadSources();
  }, []);

  useEffect(() => {
    const hasPendingOrMatchingSource = downloadSources.some(
      (source) =>
        source.status === DownloadSourceStatus.PendingMatching ||
        source.status === DownloadSourceStatus.Matching
    );

    if (!hasPendingOrMatchingSource || !downloadSources.length) {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        await window.electron.syncDownloadSources();
        const sources = (await levelDBService.values(
          "downloadSources"
        )) as DownloadSource[];
        const sorted = sortDownloadSources(sources);
        setDownloadSources(sorted);
      } catch (error) {
        logger.error("Failed to fetch download sources:", error);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [downloadSources]);

  const handleTogglePinSource = async (source: DownloadSource) => {
    await window.electron.updateDownloadSource(source.id, {
      pinned: !source.pinned,
    });
    const sources = (await levelDBService.values(
      "downloadSources"
    )) as DownloadSource[];
    setDownloadSources(sortDownloadSources(sources));
  };

  const handleMoveSource = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= downloadSources.length) return;

    const next = [...downloadSources];
    [next[index], next[target]] = [next[target], next[index]];
    setDownloadSources(next);
    await window.electron.reorderDownloadSources(next.map((s) => s.id));
  };

  const handleRemoveSource = async (downloadSource: DownloadSource) => {
    setIsRemovingDownloadSource(true);

    try {
      await window.electron.removeDownloadSource(false, downloadSource.id);
      const sources = (await levelDBService.values(
        "downloadSources"
      )) as DownloadSource[];
      const sorted = sortDownloadSources(sources);
      setDownloadSources(sorted);
      showSuccessToast(t("removed_download_source"));
    } catch (error) {
      logger.error("Failed to remove download source:", error);
    } finally {
      setIsRemovingDownloadSource(false);
    }
  };

  const handleRemoveAllDownloadSources = async () => {
    setIsRemovingDownloadSource(true);

    try {
      await window.electron.removeDownloadSource(true);
      const sources = (await levelDBService.values(
        "downloadSources"
      )) as DownloadSource[];
      const sorted = sortDownloadSources(sources);
      setDownloadSources(sorted);
      showSuccessToast(t("removed_all_download_sources"));
    } catch (error) {
      logger.error("Failed to remove all download sources:", error);
    } finally {
      setIsRemovingDownloadSource(false);
      setShowConfirmationDeleteAllSourcesModal(false);
    }
  };

  const handleAddDownloadSource = async () => {
    try {
      const sources = (await levelDBService.values(
        "downloadSources"
      )) as DownloadSource[];
      const sorted = sortDownloadSources(sources);
      setDownloadSources(sorted);
    } catch (error) {
      logger.error("Failed to refresh download sources:", error);
    }
  };

  const syncDownloadSources = async () => {
    setIsSyncingDownloadSources(true);
    try {
      await window.electron.syncDownloadSources();
      const sources = (await levelDBService.values(
        "downloadSources"
      )) as DownloadSource[];
      const sorted = sortDownloadSources(sources);
      setDownloadSources(sorted);

      showSuccessToast(t("download_sources_synced_successfully"));
    } finally {
      setIsSyncingDownloadSources(false);
    }
  };

  const statusTitle = {
    [DownloadSourceStatus.PendingMatching]: t(
      "download_source_pending_matching"
    ),
    [DownloadSourceStatus.Matched]: t("download_source_matched"),
    [DownloadSourceStatus.Matching]: t("download_source_matching"),
    [DownloadSourceStatus.Failed]: t("download_source_failed"),
  };

  const handleModalClose = () => {
    clearSourceUrl();
    setShowAddDownloadSourceModal(false);
  };

  const navigateToCatalogue = (fingerprint?: string) => {
    if (!fingerprint) {
      logger.error("Cannot navigate: fingerprint is undefined");
      return;
    }

    dispatch(clearFilters());
    dispatch(setFilters({ downloadSourceFingerprints: [fingerprint] }));

    navigate("/catalogue");
  };

  return (
    <>
      <AddDownloadSourceModal
        visible={showAddDownloadSourceModal}
        onClose={handleModalClose}
        onAddDownloadSource={handleAddDownloadSource}
      />
      <ConfirmationModal
        cancelButtonLabel={t("cancel_button_confirmation_delete_all_sources")}
        confirmButtonLabel={t("confirm_button_confirmation_delete_all_sources")}
        descriptionText={t("description_confirmation_delete_all_sources")}
        clickOutsideToClose={false}
        onConfirm={handleRemoveAllDownloadSources}
        visible={showConfirmationDeleteAllSourcesModal}
        title={t("title_confirmation_delete_all_sources")}
        onClose={() => setShowConfirmationDeleteAllSourcesModal(false)}
        buttonsIsDisabled={isRemovingDownloadSource}
      />

      <p>{t("download_sources_description")}</p>

      <div className="settings-download-sources__header">
        <Button
          type="button"
          theme="outline"
          disabled={
            !downloadSources.length ||
            isSyncingDownloadSources ||
            isRemovingDownloadSource
          }
          onClick={syncDownloadSources}
        >
          <SyncIcon />
          {t("sync_download_sources")}
        </Button>

        <div className="settings-download-sources__buttons-container">
          <Button
            type="button"
            theme="danger"
            onClick={() => setShowConfirmationDeleteAllSourcesModal(true)}
            disabled={
              isRemovingDownloadSource ||
              isSyncingDownloadSources ||
              !downloadSources.length
            }
          >
            <TrashIcon />
            {t("button_delete_all_sources")}
          </Button>

          <Button
            type="button"
            theme="outline"
            onClick={() => setShowAddDownloadSourceModal(true)}
            disabled={isSyncingDownloadSources || isRemovingDownloadSource}
          >
            <PlusCircleIcon />
            {t("add_download_source")}
          </Button>
        </div>
      </div>

      <ul className="settings-download-sources__list">
        {downloadSources.map((downloadSource, index) => {
          const isPendingOrMatching =
            downloadSource.status === DownloadSourceStatus.PendingMatching ||
            downloadSource.status === DownloadSourceStatus.Matching;

          return (
            <li
              key={downloadSource.id}
              className={`settings-download-sources__item ${isSyncingDownloadSources ? "settings-download-sources__item--syncing" : ""} ${isPendingOrMatching ? "settings-download-sources__item--pending" : ""}`}
            >
              <div className="settings-download-sources__item-header">
                <h2>{downloadSource.name}</h2>

                <div className="settings-download-sources__item-controls">
                  <button
                    type="button"
                    title={t("pin_download_source")}
                    className={`settings-download-sources__icon-button ${downloadSource.pinned ? "settings-download-sources__icon-button--active" : ""}`}
                    onClick={() => handleTogglePinSource(downloadSource)}
                  >
                    <PinIcon />
                  </button>
                  <button
                    type="button"
                    title={t("reorder_move_up")}
                    className="settings-download-sources__icon-button"
                    disabled={index === 0}
                    onClick={() => handleMoveSource(index, -1)}
                  >
                    <ChevronUpIcon />
                  </button>
                  <button
                    type="button"
                    title={t("reorder_move_down")}
                    className="settings-download-sources__icon-button"
                    disabled={index === downloadSources.length - 1}
                    onClick={() => handleMoveSource(index, 1)}
                  >
                    <ChevronDownIcon />
                  </button>
                </div>

                <div style={{ display: "flex" }}>
                  <Badge>
                    {isPendingOrMatching && (
                      <SyncIcon className="settings-download-sources__spinner" />
                    )}
                    {statusTitle[downloadSource.status]}
                  </Badge>
                </div>

                <button
                  type="button"
                  className="settings-download-sources__navigate-button"
                  disabled={!downloadSource.fingerprint}
                  onClick={() =>
                    navigateToCatalogue(downloadSource.fingerprint)
                  }
                >
                  <small>
                    {isPendingOrMatching
                      ? t("download_source_no_information")
                      : t("download_count", {
                          count: downloadSource.downloadCount,
                          countFormatted: numberFormatter.format(
                            downloadSource.downloadCount
                          ),
                        })}
                  </small>
                </button>
              </div>

              <TextField
                label={t("download_source_url")}
                value={downloadSource.url}
                readOnly
                theme="dark"
                disabled
                rightContent={
                  <Button
                    type="button"
                    theme="outline"
                    onClick={() => handleRemoveSource(downloadSource)}
                    disabled={isRemovingDownloadSource}
                  >
                    <NoEntryIcon />
                    {t("remove_download_source")}
                  </Button>
                }
              />
            </li>
          );
        })}
      </ul>
    </>
  );
}
