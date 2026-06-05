import { registerEvent } from "../register-event";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { UpdateProfileRequest, User, UserProfile } from "@types";
import { ASSETS_PATH } from "@main/constants";
import { toUserProfile, updateLocalUser } from "@main/services/user/local-user";

/* Copies a picked image into the local assets dir and returns a local: url. */
const persistImage = (imagePath: string): string => {
  if (!fs.existsSync(ASSETS_PATH)) {
    fs.mkdirSync(ASSETS_PATH, { recursive: true });
  }

  const dest = path.join(
    ASSETS_PATH,
    `${randomUUID()}${path.extname(imagePath)}`
  );
  fs.copyFileSync(imagePath, dest);
  return `local:${dest}`;
};

const updateProfile = async (
  _event: Electron.IpcMainInvokeEvent,
  updateProfile: UpdateProfileRequest
): Promise<UserProfile> => {
  const patch: Partial<User> = {};

  if (updateProfile.displayName !== undefined) {
    patch.displayName = updateProfile.displayName;
  }
  if (updateProfile.bio !== undefined) {
    patch.bio = updateProfile.bio;
  }
  if (updateProfile.profileVisibility !== undefined) {
    patch.profileVisibility = updateProfile.profileVisibility;
  }

  if (updateProfile.profileImageUrl !== undefined) {
    patch.profileImageUrl =
      updateProfile.profileImageUrl === null
        ? null
        : persistImage(updateProfile.profileImageUrl);
  }
  if (updateProfile.backgroundImageUrl !== undefined) {
    patch.backgroundImageUrl =
      updateProfile.backgroundImageUrl === null
        ? null
        : persistImage(updateProfile.backgroundImageUrl);
  }

  const user = await updateLocalUser(patch);
  return toUserProfile(user);
};

registerEvent("updateProfile", updateProfile);
