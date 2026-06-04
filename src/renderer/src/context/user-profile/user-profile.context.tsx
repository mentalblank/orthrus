import { darkenColor } from "@renderer/helpers";
import {
  useAppSelector,
  useCollectionSettings,
  useUserDetails,
} from "@renderer/hooks";
import type {
  Badge,
  LibraryGame,
  UserGame,
  UserProfile,
  UserStats,
} from "@types";
import { average } from "color.js";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from "react";
import { useTranslation } from "react-i18next";

export interface UserProfileContext {
  userProfile: UserProfile | null;
  heroBackground: string;
  /* Indicates if the current user is viewing their own profile */
  isMe: boolean;
  userStats: UserStats | null;
  getUserProfile: () => Promise<void>;
  getUserLibraryGames: (sortBy?: string, reset?: boolean) => Promise<void>;
  loadMoreLibraryGames: (sortBy?: string) => Promise<boolean>;
  setSelectedBackgroundImage: React.Dispatch<React.SetStateAction<string>>;
  backgroundImage: string;
  badges: Badge[];
  libraryGames: UserGame[];
  pinnedGames: UserGame[];
  hasMoreLibraryGames: boolean;
  isLoadingLibraryGames: boolean;
}

export const DEFAULT_USER_PROFILE_BACKGROUND = "#151515B3";

const LIBRARY_PAGE_SIZE = 12;

export const userProfileContext = createContext<UserProfileContext>({
  userProfile: null,
  heroBackground: DEFAULT_USER_PROFILE_BACKGROUND,
  isMe: false,
  userStats: null,
  getUserProfile: async () => {},
  getUserLibraryGames: async (_sortBy?: string, _reset?: boolean) => {},
  loadMoreLibraryGames: async (_sortBy?: string) => false,
  setSelectedBackgroundImage: () => {},
  backgroundImage: "",
  badges: [],
  libraryGames: [],
  pinnedGames: [],
  hasMoreLibraryGames: false,
  isLoadingLibraryGames: false,
});

const { Provider } = userProfileContext;
export const { Consumer: UserProfileContextConsumer } = userProfileContext;

export interface UserProfileContextProviderProps {
  children: React.ReactNode;
  userId: string;
}

/* Local-only: maps a locally stored library game into the profile shape. */
const toUserGame = (game: LibraryGame): UserGame => ({
  objectId: game.objectId,
  shop: game.shop,
  title: game.title,
  iconUrl: game.iconUrl ?? null,
  libraryHeroImageUrl: game.libraryHeroImageUrl ?? null,
  libraryImageUrl: game.libraryImageUrl ?? null,
  logoImageUrl: game.logoImageUrl ?? null,
  logoPosition: game.logoPosition ?? null,
  coverImageUrl: game.coverImageUrl ?? null,
  downloadSources: game.downloadSources ?? [],
  playTimeInSeconds: Math.floor((game.playTimeInMilliseconds ?? 0) / 1000),
  lastTimePlayed: game.lastTimePlayed ?? null,
  unlockedAchievementCount: game.unlockedAchievementCount ?? 0,
  achievementCount: game.achievementCount ?? 0,
  achievementsPointsEarnedSum: 0,
  hasManuallyUpdatedPlaytime: false,
  isFavorite: game.favorite ?? false,
  isPinned: game.isPinned ?? false,
  pinnedDate: game.pinnedDate ?? null,
});

const sortByLastPlayed = (games: UserGame[]): UserGame[] =>
  [...games].sort((a, b) => {
    const aTime = a.lastTimePlayed ? new Date(a.lastTimePlayed).getTime() : 0;
    const bTime = b.lastTimePlayed ? new Date(b.lastTimePlayed).getTime() : 0;
    return bTime - aTime;
  });

export function UserProfileContextProvider({
  children,
}: Readonly<UserProfileContextProviderProps>) {
  const { userDetails } = useUserDetails();

  const [userStats] = useState<UserStats | null>(null);

  const [allGames, setAllGames] = useState<UserGame[]>([]);
  const [libraryGames, setLibraryGames] = useState<UserGame[]>([]);
  const [pinnedGames, setPinnedGames] = useState<UserGame[]>([]);
  const [badges] = useState<Badge[]>([]);
  const [heroBackground, setHeroBackground] = useState(
    DEFAULT_USER_PROFILE_BACKGROUND
  );
  const [selectedBackgroundImage, setSelectedBackgroundImage] = useState("");
  const [libraryPage, setLibraryPage] = useState(0);
  const [hasMoreLibraryGames, setHasMoreLibraryGames] = useState(true);
  const [isLoadingLibraryGames, setIsLoadingLibraryGames] = useState(false);

  /* Local-only: the profile always belongs to the local user. */
  const isMe = true;

  const library = useAppSelector((state) => state.library.value);
  const { isGameHiddenInLibrary } = useCollectionSettings();

  const isGameHidden = useCallback(
    (shop: string, objectId: string) => {
      const localGame = library.find(
        (g) => g.shop === shop && g.objectId === objectId
      );
      const collectionIds =
        localGame && Array.isArray(localGame.collectionIds)
          ? localGame.collectionIds
          : [];
      return isGameHiddenInLibrary(collectionIds);
    },
    [library, isGameHiddenInLibrary]
  );

  const visibleLibraryGames = useMemo(() => {
    return libraryGames.filter(
      (game) => !isGameHidden(game.shop, game.objectId)
    );
  }, [libraryGames, isGameHidden]);

  const visiblePinnedGames = useMemo(() => {
    return pinnedGames.filter(
      (game) => !isGameHidden(game.shop, game.objectId)
    );
  }, [pinnedGames, isGameHidden]);

  const userProfile = useMemo<UserProfile | null>(() => {
    if (!userDetails) return null;

    const recentGames = sortByLastPlayed(
      allGames.filter((game) => !isGameHidden(game.shop, game.objectId))
    ).slice(0, 12);

    return {
      id: userDetails.id,
      displayName: userDetails.displayName,
      profileImageUrl: userDetails.profileImageUrl,
      email: userDetails.email,
      backgroundImageUrl: userDetails.backgroundImageUrl,
      profileVisibility: userDetails.profileVisibility,
      libraryGames: [],
      recentGames,
      friends: [],
      totalFriends: 0,
      relation: null,
      currentGame: null,
      bio: userDetails.bio,
      hasActiveSubscription: false,
      karma: userDetails.karma,
      quirks: userDetails.quirks ?? { backupsPerGameLimit: 0 },
      badges: [],
      hasCompletedWrapped2025: false,
    };
  }, [userDetails, allGames, isGameHidden]);

  const getHeroBackgroundFromImageUrl = async (imageUrl: string) => {
    const output = await average(imageUrl, { amount: 1, format: "hex" });

    return `linear-gradient(135deg, ${darkenColor(output as string, 0.5)}, ${darkenColor(output as string, 0.6, 0.5)})`;
  };

  const getBackgroundImageUrl = () => {
    if (selectedBackgroundImage && isMe)
      return `local:${selectedBackgroundImage}`;
    if (userProfile?.backgroundImageUrl) return userProfile.backgroundImageUrl;

    return "";
  };

  const { i18n } = useTranslation("user_profile");

  const loadLocalGames = useCallback(async (): Promise<UserGame[]> => {
    const games = await window.electron.getLibrary();
    return games.map(toUserGame);
  }, []);

  const getUserLibraryGames = useCallback(
    async (sortBy?: string, reset = true) => {
      if (reset) {
        setLibraryPage(0);
        setIsLoadingLibraryGames(true);
      }

      try {
        const games = await loadLocalGames();
        const sorted =
          sortBy === "playTime"
            ? [...games].sort(
                (a, b) => b.playTimeInSeconds - a.playTimeInSeconds
              )
            : sortByLastPlayed(games);

        setAllGames(sorted);
        setLibraryGames(sorted.slice(0, LIBRARY_PAGE_SIZE));
        setPinnedGames(sorted.filter((game) => game.isPinned));
        setHasMoreLibraryGames(sorted.length > LIBRARY_PAGE_SIZE);
      } catch {
        setAllGames([]);
        setLibraryGames([]);
        setPinnedGames([]);
        setHasMoreLibraryGames(false);
      } finally {
        setIsLoadingLibraryGames(false);
      }
    },
    [loadLocalGames]
  );

  const loadMoreLibraryGames = useCallback(
    async (_sortBy?: string): Promise<boolean> => {
      if (isLoadingLibraryGames || !hasMoreLibraryGames) {
        return false;
      }

      const nextPage = libraryPage + 1;
      const nextGames = allGames.slice(0, (nextPage + 1) * LIBRARY_PAGE_SIZE);

      setLibraryGames(nextGames);
      setLibraryPage(nextPage);
      setHasMoreLibraryGames(nextGames.length < allGames.length);
      return nextGames.length > libraryGames.length;
    },
    [
      allGames,
      libraryGames,
      libraryPage,
      hasMoreLibraryGames,
      isLoadingLibraryGames,
    ]
  );

  const getUserProfile = useCallback(async () => {
    await getUserLibraryGames();
  }, [getUserLibraryGames]);

  useEffect(() => {
    if (userProfile?.profileImageUrl) {
      getHeroBackgroundFromImageUrl(userProfile.profileImageUrl).then((color) =>
        setHeroBackground(color)
      );
    } else {
      setHeroBackground(DEFAULT_USER_PROFILE_BACKGROUND);
    }
  }, [userProfile?.profileImageUrl]);

  useEffect(() => {
    setLibraryPage(0);
    setHasMoreLibraryGames(true);
    getUserProfile();
    /* i18n dependency kept so localized data refreshes on language change. */
  }, [getUserProfile, i18n.language]);

  return (
    <Provider
      value={{
        userProfile,
        heroBackground,
        isMe,
        getUserProfile,
        getUserLibraryGames,
        loadMoreLibraryGames,
        setSelectedBackgroundImage,
        backgroundImage: getBackgroundImageUrl(),
        userStats,
        badges,
        libraryGames: visibleLibraryGames,
        pinnedGames: visiblePinnedGames,
        hasMoreLibraryGames,
        isLoadingLibraryGames,
      }}
    >
      {children}
    </Provider>
  );
}
