import { setHeaderTitle } from "@renderer/features";
import { useAppDispatch, useUserDetails } from "@renderer/hooks";
import { useContext, useEffect, useRef, useState } from "react";
import {
  buildGameDetailsPath,
  formatDownloadProgress,
} from "@renderer/helpers";
import { PersonIcon, TrophyIcon } from "@primer/octicons-react";
import { gameDetailsContext } from "@renderer/context";
import { Link } from "@renderer/components";
import { AchievementList } from "./achievement-list";
import { AchievementPanel } from "./achievement-panel";
import "./achievements-content.scss";

interface UserInfo {
  id: string;
  displayName: string;
  profileImageUrl: string | null;
  totalAchievementCount: number;
  unlockedAchievementCount: number;
}

interface AchievementSummaryProps {
  user: UserInfo;
}

function AchievementSummary({ user }: AchievementSummaryProps) {
  const getProfileImage = (
    user: Pick<UserInfo, "profileImageUrl" | "displayName">
  ) => {
    return (
      <div className="achievements-content__profile-avatar">
        {user.profileImageUrl ? (
          <img
            className="achievements-content__profile-avatar"
            src={user.profileImageUrl}
            alt={user.displayName}
          />
        ) : (
          <PersonIcon size={24} />
        )}
      </div>
    );
  };

  return (
    <div className="achievements-content__user-summary">
      {getProfileImage(user)}
      <div className="achievements-content__user-summary__container">
        <h1>{user.displayName}</h1>
        <div className="achievements-content__user-summary__container__stats">
          <div className="achievements-content__user-summary__container__stats__trophy-count">
            <TrophyIcon size={13} />
            <span>
              {user.unlockedAchievementCount} / {user.totalAchievementCount}
            </span>
          </div>

          <span>
            {formatDownloadProgress(
              user.unlockedAchievementCount / user.totalAchievementCount
            )}
          </span>
        </div>
        <progress
          max={1}
          value={user.unlockedAchievementCount / user.totalAchievementCount}
          className="achievements-content__user-summary__container__stats__progress-bar"
        />
      </div>
    </div>
  );
}

export function AchievementsContent() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isHeaderStuck, setIsHeaderStuck] = useState(false);

  const { gameTitle, objectId, shop, shopDetails, achievements } =
    useContext(gameDetailsContext);

  const dispatch = useAppDispatch();

  const { userDetails } = useUserDetails();
  useEffect(() => {
    dispatch(setHeaderTitle(gameTitle));
  }, [dispatch, gameTitle]);

  const onScroll: React.UIEventHandler<HTMLElement> = (event) => {
    const heroHeight = heroRef.current?.clientHeight ?? 150;

    const scrollY = (event.target as HTMLDivElement).scrollTop;
    if (scrollY >= heroHeight && !isHeaderStuck) {
      setIsHeaderStuck(true);
    }

    if (scrollY <= heroHeight && isHeaderStuck) {
      setIsHeaderStuck(false);
    }
  };

  if (!objectId || !shop || !gameTitle || !userDetails) return null;

  return (
    <div className="achievements-content__achievements-list">
      <img
        src={shopDetails?.assets?.libraryHeroImageUrl ?? ""}
        className="achievements-content__achievements-list__image"
        alt={gameTitle}
      />

      <section
        ref={containerRef}
        onScroll={onScroll}
        className="achievements-content__achievements-list__section"
      >
        <div className="achievements-content__achievements-list__section__container">
          <div
            ref={heroRef}
            className="achievements-content__achievements-list__section__container__hero"
          >
            <div className="achievements-content__achievements-list__section__container__hero__content">
              <Link
                to={buildGameDetailsPath({ shop, objectId, title: gameTitle })}
              >
                <img
                  src={shopDetails?.assets?.logoImageUrl ?? ""}
                  className="achievements-content__achievements-list__section__container__hero__content__game-logo"
                  alt={gameTitle}
                />
              </Link>
            </div>
          </div>

          <div className="achievements-content__achievements-list__section__container__achievements-summary-wrapper">
            <AchievementSummary
              user={{
                ...userDetails,
                totalAchievementCount: achievements!.length,
                unlockedAchievementCount: achievements!.filter(
                  (achievement) => achievement.unlocked
                ).length,
              }}
            />
          </div>
        </div>

        <AchievementPanel achievements={achievements!} />
        <AchievementList achievements={achievements!} />
      </section>
    </div>
  );
}
