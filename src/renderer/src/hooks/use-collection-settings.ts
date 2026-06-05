import { useCallback } from "react";
import type { CollectionSettings } from "@types";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  setCollectionSettings,
  setHasPin,
  setUnlocked,
} from "@renderer/features";
import {
  getDefaultCollectionSettings,
  hashPin,
  loadPinHash,
  persistCollectionSettings,
  persistPinHash,
} from "@renderer/helpers/collection-settings";

export function useCollectionSettings() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.collectionSettings.settings);
  const unlocked = useAppSelector((state) => state.collectionSettings.unlocked);
  const hasPin = useAppSelector((state) => state.collectionSettings.hasPin);

  const getSettings = useCallback(
    (collectionId: string): CollectionSettings => ({
      ...getDefaultCollectionSettings(),
      ...settings[collectionId],
    }),
    [settings]
  );

  const updateSettings = useCallback(
    (collectionId: string, partial: Partial<CollectionSettings>) => {
      const next = {
        ...settings,
        [collectionId]: {
          ...getDefaultCollectionSettings(),
          ...settings[collectionId],
          ...partial,
        },
      };

      persistCollectionSettings(next);
      dispatch(setCollectionSettings({ id: collectionId, partial }));
    },
    [dispatch, settings]
  );

  const setPin = useCallback(
    async (pin: string) => {
      persistPinHash(await hashPin(pin));
      dispatch(setHasPin(true));
      dispatch(setUnlocked(true));
    },
    [dispatch]
  );

  const unlock = useCallback(
    async (pin: string): Promise<boolean> => {
      const storedHash = loadPinHash();
      if (!storedHash) return false;

      const matches = (await hashPin(pin)) === storedHash;
      if (matches) dispatch(setUnlocked(true));

      return matches;
    },
    [dispatch]
  );

  const changePin = useCallback(
    async (currentPin: string, newPin: string): Promise<boolean> => {
      const storedHash = loadPinHash();
      if (!storedHash) return false;

      const matches = (await hashPin(currentPin)) === storedHash;
      if (!matches) return false;

      persistPinHash(await hashPin(newPin));
      dispatch(setUnlocked(true));
      return true;
    },
    [dispatch]
  );

  const lockSession = useCallback(() => {
    dispatch(setUnlocked(false));
  }, [dispatch]);

  /* Session unlock only bypasses the `locked` gate — not show-in-library/sidebar. */
  const isChipVisibleInLibrary = useCallback(
    (collectionId: string): boolean => {
      const { showInLibrary, locked } = getSettings(collectionId);
      return showInLibrary && (!locked || unlocked);
    },
    [getSettings, unlocked]
  );

  const isChipVisibleInSidebar = useCallback(
    (collectionId: string): boolean => {
      const { locked } = getSettings(collectionId);
      return !locked || unlocked;
    },
    [getSettings, unlocked]
  );

  const isGameHiddenInLibrary = useCallback(
    (collectionIds: string[]): boolean =>
      collectionIds.some((id) => {
        const { showInLibrary, locked } = getSettings(id);
        return !showInLibrary || (locked && !unlocked);
      }),
    [getSettings, unlocked]
  );

  const isGameHiddenInSidebar = useCallback(
    (collectionIds: string[]): boolean =>
      collectionIds.some((id) => {
        const { showInSidebar, locked } = getSettings(id);
        return !showInSidebar || (locked && !unlocked);
      }),
    [getSettings, unlocked]
  );

  return {
    settings,
    unlocked,
    hasPin,
    getSettings,
    updateSettings,
    setPin,
    unlock,
    changePin,
    lockSession,
    isChipVisibleInLibrary,
    isChipVisibleInSidebar,
    isGameHiddenInLibrary,
    isGameHiddenInSidebar,
  };
}
