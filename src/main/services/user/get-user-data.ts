import type { UserDetails } from "@types";
import { getLocalUser, toUserDetails } from "./local-user";

/* Local-only: profile data lives in LevelDB, no remote account. */
export const getUserData = async (): Promise<UserDetails | null> => {
  const user = await getLocalUser();
  return toUserDetails(user);
};
