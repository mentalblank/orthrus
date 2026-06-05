import { randomUUID } from "node:crypto";
import { db, gamesSublevel, levelKeys } from "@main/level";
import type { GameCollection } from "@types";

interface StoredCollection {
  id: string;
  name: string;
  createdAt: string;
}

const readStored = async (): Promise<StoredCollection[]> => {
  const stored = await db
    .get<string, StoredCollection[]>(levelKeys.collections, {
      valueEncoding: "json",
    })
    .catch(() => null);

  return stored ?? [];
};

const writeStored = (collections: StoredCollection[]) =>
  db.put<string, StoredCollection[]>(levelKeys.collections, collections, {
    valueEncoding: "json",
  });

const countGamesPerCollection = async (): Promise<Map<string, number>> => {
  const counts = new Map<string, number>();

  for await (const [, game] of gamesSublevel.iterator()) {
    if (game.isDeleted) continue;
    const ids = Array.isArray(game.collectionIds) ? game.collectionIds : [];
    for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return counts;
};

export const Collections = {
  async list(): Promise<GameCollection[]> {
    const [stored, counts] = await Promise.all([
      readStored(),
      countGamesPerCollection(),
    ]);

    return stored.map((collection) => ({
      id: collection.id,
      name: collection.name,
      gamesCount: counts.get(collection.id) ?? 0,
    }));
  },

  async create(name: string): Promise<GameCollection> {
    const trimmed = name.trim();
    const normalized = trimmed.toLocaleLowerCase();
    const stored = await readStored();

    if (stored.some((c) => c.name.trim().toLocaleLowerCase() === normalized)) {
      throw new Error("game/collection-name-already-in-use");
    }

    const collection: StoredCollection = {
      id: randomUUID(),
      name: trimmed,
      createdAt: new Date().toISOString(),
    };

    await writeStored([...stored, collection]);
    return { id: collection.id, name: collection.name, gamesCount: 0 };
  },

  async rename(id: string, name: string): Promise<void> {
    const trimmed = name.trim();
    const normalized = trimmed.toLocaleLowerCase();
    const stored = await readStored();

    if (
      stored.some(
        (c) => c.id !== id && c.name.trim().toLocaleLowerCase() === normalized
      )
    ) {
      throw new Error("game/collection-name-already-in-use");
    }

    await writeStored(
      stored.map((c) => (c.id === id ? { ...c, name: trimmed } : c))
    );
  },

  async remove(id: string): Promise<void> {
    const stored = await readStored();
    await writeStored(stored.filter((c) => c.id !== id));

    // Strip the collection id from every game.
    for await (const [key, game] of gamesSublevel.iterator()) {
      const ids = Array.isArray(game.collectionIds) ? game.collectionIds : [];
      if (!ids.includes(id)) continue;

      await gamesSublevel.put(key, {
        ...game,
        collectionIds: ids.filter((collectionId) => collectionId !== id),
      });
    }
  },
};
