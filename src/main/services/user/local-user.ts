import { randomUUID } from "node:crypto";
import os from "node:os";
import type { User, UserDetails, UserProfile } from "@types";
import { db } from "@main/level";
import { levelKeys } from "@main/level/sublevels";
import { logger } from "../logger";

const defaultDisplayName = () => {
  try {
    const name = os.userInfo().username;
    return name && name.trim().length > 0 ? name : "Player";
  } catch {
    return "Player";
  }
};

const createDefaultUser = (): User => ({
  id: randomUUID(),
  displayName: defaultDisplayName(),
  profileImageUrl: null,
  backgroundImageUrl: null,
  username: "",
  bio: "",
  profileVisibility: "PUBLIC",
});

/* Reads the local user, creating a default one on first run. */
export const getLocalUser = async (): Promise<User> => {
  try {
    const user = await db.get<string, User>(levelKeys.user, {
      valueEncoding: "json",
    });
    if (user?.id) return user;
  } catch (error) {
    logger.error("Failed to read local user", error);
  }

  const user = createDefaultUser();
  await db.put<string, User>(levelKeys.user, user, { valueEncoding: "json" });
  return user;
};

export const updateLocalUser = async (patch: Partial<User>): Promise<User> => {
  const current = await getLocalUser();
  const updated: User = { ...current, ...patch };
  await db.put<string, User>(levelKeys.user, updated, {
    valueEncoding: "json",
  });
  return updated;
};

export const toUserDetails = (user: User): UserDetails => ({
  id: user.id,
  username: user.username ?? "",
  email: null,
  displayName: user.displayName,
  profileImageUrl: user.profileImageUrl,
  backgroundImageUrl: user.backgroundImageUrl,
  profileVisibility: user.profileVisibility ?? "PUBLIC",
  bio: user.bio ?? "",
  karma: 0,
  quirks: { backupsPerGameLimit: 0 },
});

export const toUserProfile = (user: User): UserProfile => ({
  id: user.id,
  displayName: user.displayName,
  profileImageUrl: user.profileImageUrl,
  email: null,
  backgroundImageUrl: user.backgroundImageUrl,
  profileVisibility: user.profileVisibility ?? "PUBLIC",
  libraryGames: [],
  recentGames: [],
  friends: [],
  totalFriends: 0,
  relation: null,
  currentGame: null,
  bio: user.bio ?? "",
  karma: 0,
  quirks: { backupsPerGameLimit: 0 },
  badges: [],
  hasCompletedWrapped2025: false,
});
