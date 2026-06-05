import { useCallback, useEffect, useState } from "react";
import { IS_DESKTOP } from "../constants";
import type { UserDetails } from "@types";

const USER_DETAILS_STORAGE_KEY = "userDetails";

function getInitialUserDetails() {
  try {
    const cachedUserDetails = globalThis.window.localStorage.getItem(
      USER_DETAILS_STORAGE_KEY
    );

    if (!cachedUserDetails) {
      return null;
    }

    return JSON.parse(cachedUserDetails) as UserDetails;
  } catch {
    return null;
  }
}

function persistUserDetails(userDetails: UserDetails | null) {
  if (!userDetails) {
    globalThis.window.localStorage.removeItem(USER_DETAILS_STORAGE_KEY);
    return;
  }

  globalThis.window.localStorage.setItem(
    USER_DETAILS_STORAGE_KEY,
    JSON.stringify(userDetails)
  );
}

export function useUserDetails() {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(
    getInitialUserDetails
  );

  const fetchUserDetails = useCallback(async () => {
    if (!IS_DESKTOP) return;

    try {
      const details = await window.electron.getMe();
      persistUserDetails(details);
      setUserDetails(details);
      return details;
    } catch {
      persistUserDetails(null);
      setUserDetails(null);
      return null;
    }
  }, []);

  useEffect(() => {
    void fetchUserDetails();
  }, [fetchUserDetails]);

  useEffect(() => {
    const unsubscribeAccountUpdated =
      globalThis.window.electron.onAccountUpdated(() => {
        void fetchUserDetails();
      });
    const unsubscribeSignOut = globalThis.window.electron.onSignOut(() => {
      persistUserDetails(null);
      setUserDetails(null);
    });

    return () => {
      unsubscribeAccountUpdated();
      unsubscribeSignOut();
    };
  }, [fetchUserDetails]);

  return {
    userDetails,
    fetchUserDetails,
  };
}
