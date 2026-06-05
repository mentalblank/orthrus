import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
import { setProfileBackground, setUserDetails } from "@renderer/features";
import type { UpdateProfileRequest, UserDetails } from "@types";

export function useUserDetails() {
  const dispatch = useAppDispatch();

  const { userDetails, profileBackground } = useAppSelector(
    (state) => state.userDetails
  );

  /* Local-only: collections are local, not tied to the user session. */
  const clearUserDetails = useCallback(async () => {
    dispatch(setUserDetails(null));
    dispatch(setProfileBackground(null));

    globalThis.window.localStorage.removeItem("userDetails");
  }, [dispatch]);

  const signOut = useCallback(async () => {
    clearUserDetails();

    return globalThis.window.electron.signOut();
  }, [clearUserDetails]);

  const updateUserDetails = useCallback(
    async (userDetails: UserDetails) => {
      dispatch(setUserDetails(userDetails));
      globalThis.window.localStorage.setItem(
        "userDetails",
        JSON.stringify(userDetails)
      );
    },
    [dispatch]
  );

  const fetchUserDetails = useCallback(async () => {
    return globalThis.window.electron.getMe().then((userDetails) => {
      if (userDetails == null) {
        clearUserDetails();
      }

      window["userDetails"] = userDetails;

      return userDetails;
    });
  }, [clearUserDetails]);

  const patchUser = useCallback(
    async (values: UpdateProfileRequest) => {
      const response = await globalThis.window.electron.updateProfile(values);
      return updateUserDetails({
        ...response,
        username: userDetails?.username || "",
        karma: userDetails?.karma || 0,
      });
    },
    [updateUserDetails, userDetails?.username, userDetails?.karma]
  );

  return {
    userDetails,
    profileBackground,
    fetchUserDetails,
    signOut,
    clearUserDetails,
    updateUserDetails,
    patchUser,
  };
}
