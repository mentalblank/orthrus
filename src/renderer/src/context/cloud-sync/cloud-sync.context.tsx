import { useToast } from "@renderer/hooks";
import { logger } from "@renderer/logger";
import type { LudusaviBackup, GameShop } from "@types";
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

export enum CloudSyncState {
  New,
  Different,
  Same,
  Unknown,
}

export interface CloudSyncContext {
  backupPreview: LudusaviBackup | null;
  showCloudSyncFilesModal: boolean;
  backupState: CloudSyncState;
  uploadSaveGame: (downloadOptionTitle: string | null) => Promise<void>;
  setShowCloudSyncFilesModal: React.Dispatch<React.SetStateAction<boolean>>;
  getGameBackupPreview: () => Promise<void>;
  uploadingBackup: boolean;
  loadingPreview: boolean;
}

export const cloudSyncContext = createContext<CloudSyncContext>({
  backupPreview: null,
  backupState: CloudSyncState.Unknown,
  uploadSaveGame: async () => {},
  showCloudSyncFilesModal: false,
  setShowCloudSyncFilesModal: () => {},
  getGameBackupPreview: async () => {},
  uploadingBackup: false,
  loadingPreview: false,
});

const { Provider } = cloudSyncContext;
export const { Consumer: CloudSyncContextConsumer } = cloudSyncContext;

export interface CloudSyncContextProviderProps {
  children: React.ReactNode;
  objectId: string;
  shop: GameShop;
}

export function CloudSyncContextProvider({
  children,
  objectId,
  shop,
}: CloudSyncContextProviderProps) {
  const { t } = useTranslation("game_details");

  const [backupPreview, setBackupPreview] = useState<LudusaviBackup | null>(
    null
  );
  const [uploadingBackup, setUploadingBackup] = useState(false);
  const [showCloudSyncFilesModal, setShowCloudSyncFilesModal] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const { showSuccessToast, showErrorToast } = useToast();

  const getGameBackupPreview = useCallback(async () => {
    setLoadingPreview(true);

    try {
      const preview = await window.electron.getGameBackupPreview(
        objectId,
        shop
      );

      setBackupPreview(preview);
    } catch (err) {
      logger.error("Failed to get game backup preview", objectId, shop, err);
    } finally {
      setLoadingPreview(false);
    }
  }, [objectId, shop]);

  const uploadSaveGame = useCallback(
    async (downloadOptionTitle: string | null) => {
      setUploadingBackup(true);
      window.electron
        .uploadSaveGame(objectId, shop, downloadOptionTitle)
        .catch((err) => {
          setUploadingBackup(false);
          logger.error("Failed to upload save game", { objectId, shop, err });
          showErrorToast(t("backup_failed"));
        });
    },
    [objectId, shop, t, showErrorToast]
  );

  useEffect(() => {
    const removeUploadCompleteListener = window.electron.onUploadComplete(
      objectId,
      shop,
      () => {
        showSuccessToast(t("backup_uploaded"));
        setUploadingBackup(false);
        getGameBackupPreview();
      }
    );

    return () => {
      removeUploadCompleteListener();
    };
  }, [objectId, shop, showSuccessToast, t, getGameBackupPreview]);

  useEffect(() => {
    setBackupPreview(null);
    setUploadingBackup(false);
  }, [objectId, shop]);

  const backupState = useMemo(() => {
    if (!backupPreview) return CloudSyncState.Unknown;
    if (backupPreview.overall.changedGames.new) return CloudSyncState.New;
    if (backupPreview.overall.changedGames.different)
      return CloudSyncState.Different;
    if (backupPreview.overall.changedGames.same) return CloudSyncState.Same;

    return CloudSyncState.Unknown;
  }, [backupPreview]);

  return (
    <Provider
      value={{
        backupPreview,
        backupState,
        uploadingBackup,
        showCloudSyncFilesModal,
        loadingPreview,
        uploadSaveGame,
        setShowCloudSyncFilesModal,
        getGameBackupPreview,
      }}
    >
      {children}
    </Provider>
  );
}
