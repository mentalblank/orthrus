import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { CollectionSettings } from "@types";
import {
  loadCollectionSettings,
  loadPinHash,
} from "@renderer/helpers/collection-settings";

export interface CollectionSettingsState {
  settings: Record<string, CollectionSettings>;
  unlocked: boolean;
  hasPin: boolean;
}

const initialState: CollectionSettingsState = {
  settings: loadCollectionSettings(),
  unlocked: false,
  hasPin: Boolean(loadPinHash()),
};

export const collectionSettingsSlice = createSlice({
  name: "collectionSettings",
  initialState,
  reducers: {
    setCollectionSettings: (
      state,
      action: PayloadAction<{
        id: string;
        partial: Partial<CollectionSettings>;
      }>
    ) => {
      const { id, partial } = action.payload;
      const current = state.settings[id] ?? {
        showInLibrary: true,
        showInSidebar: true,
        locked: false,
      };

      state.settings[id] = { ...current, ...partial };
    },
    setUnlocked: (state, action: PayloadAction<boolean>) => {
      state.unlocked = action.payload;
    },
    setHasPin: (state, action: PayloadAction<boolean>) => {
      state.hasPin = action.payload;
    },
  },
});

export const { setCollectionSettings, setUnlocked, setHasPin } =
  collectionSettingsSlice.actions;
