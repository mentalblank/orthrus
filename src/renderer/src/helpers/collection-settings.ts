import type { CollectionSettings } from "@types";

const SETTINGS_STORAGE_KEY = "collection-settings";
const PIN_HASH_STORAGE_KEY = "collection-pin-hash";

export const getDefaultCollectionSettings = (): CollectionSettings => ({
  showInLibrary: true,
  showInSidebar: true,
  locked: false,
});

export const loadCollectionSettings = (): Record<string, CollectionSettings> => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, Partial<CollectionSettings>>;
    const result: Record<string, CollectionSettings> = {};

    for (const [id, value] of Object.entries(parsed)) {
      result[id] = { ...getDefaultCollectionSettings(), ...value };
    }

    return result;
  } catch {
    return {};
  }
};

export const persistCollectionSettings = (
  settings: Record<string, CollectionSettings>
): void => {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
};

export const loadPinHash = (): string | null =>
  localStorage.getItem(PIN_HASH_STORAGE_KEY);

export const persistPinHash = (hash: string): void => {
  localStorage.setItem(PIN_HASH_STORAGE_KEY, hash);
};

export const hashPin = async (pin: string): Promise<string> => {
  const data = new TextEncoder().encode(pin);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};
