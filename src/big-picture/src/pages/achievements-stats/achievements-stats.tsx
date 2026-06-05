import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TrophyIcon, MedalIcon } from "@phosphor-icons/react";

import {
  FocusItem,
  ScrollArea,
  Typography,
  VerticalFocusGroup,
} from "../../components";
import {
  useHeaderTitle,
  useLibrary,
  useNavigationScreenActions,
} from "../../hooks";
import { getBigPictureGameAchievementsPath } from "../../helpers/game";
import {
  ACHIEVEMENTS_STATS_LIST_REGION_ID,
  ACHIEVEMENTS_STATS_PAGE_REGION_ID,
  getAchievementsStatsRowId,
} from "./navigation";
import "./achievements-stats.scss";

export default function AchievementsStats() {
  const navigate = useNavigate();
  const { library } = useLibrary();

  useHeaderTitle("Achievements");

  useNavigationScreenActions({
    press: {
      b: () => navigate(-1),
    },
  });

  const stats = useMemo(() => {
    const sum = (key: keyof (typeof library)[number]) =>
      library.reduce((acc, game) => acc + ((game[key] as number) ?? 0), 0);

    const unlocked = sum("unlockedAchievementCount");
    const total = sum("achievementCount");

    return {
      gamesCount: library.length,
      hours: Math.round(sum("playTimeInMilliseconds") / 1000 / 60 / 60),
      unlocked,
      total,
      pointsEarned: sum("achievementsPointsEarnedSum"),
      pointsTotal: sum("achievementsPointsTotal"),
    };
  }, [library]);

  const gamesWithAchievements = useMemo(
    () =>
      library
        .filter((game) => (game.achievementCount ?? 0) > 0)
        .sort(
          (a, b) =>
            (b.unlockedAchievementCount ?? 0) -
            (a.unlockedAchievementCount ?? 0)
        ),
    [library]
  );

  const statCards = [
    { label: "Games", value: String(stats.gamesCount) },
    { label: "Hours played", value: String(stats.hours) },
    { label: "Achievements", value: `${stats.unlocked} / ${stats.total}` },
    { label: "Points", value: `${stats.pointsEarned} / ${stats.pointsTotal}` },
  ];

  return (
    <VerticalFocusGroup regionId={ACHIEVEMENTS_STATS_PAGE_REGION_ID} asChild>
      <div className="bp-achievements-stats">
        <Typography className="bp-achievements-stats__title">
          Achievements
        </Typography>

        <div className="bp-achievements-stats__cards">
          {statCards.map((card) => (
            <div key={card.label} className="bp-achievements-stats__card">
              <span className="bp-achievements-stats__card-value">
                {card.value}
              </span>
              <span className="bp-achievements-stats__card-label">
                {card.label}
              </span>
            </div>
          ))}
        </div>

        <ScrollArea className="bp-achievements-stats__scroll">
          <VerticalFocusGroup
            regionId={ACHIEVEMENTS_STATS_LIST_REGION_ID}
            asChild
          >
            <ul className="bp-achievements-stats__list">
              {gamesWithAchievements.map((game) => {
                const unlocked = game.unlockedAchievementCount ?? 0;
                const total = game.achievementCount ?? 0;
                const percent = total > 0 ? (unlocked / total) * 100 : 0;
                const image = game.libraryImageUrl || game.iconUrl || "";

                return (
                  <FocusItem
                    key={`${game.shop}:${game.objectId}`}
                    id={getAchievementsStatsRowId(
                      `${game.shop}:${game.objectId}`
                    )}
                    asChild
                  >
                    <li>
                      <button
                        type="button"
                        className="bp-achievements-stats__row"
                        onClick={() =>
                          navigate(
                            getBigPictureGameAchievementsPath({
                              shop: game.shop,
                              objectId: game.objectId,
                            })
                          )
                        }
                      >
                        {image ? (
                          <img
                            className="bp-achievements-stats__row-image"
                            src={image}
                            alt={game.title}
                            loading="lazy"
                          />
                        ) : (
                          <div className="bp-achievements-stats__row-image bp-achievements-stats__row-image--placeholder">
                            <TrophyIcon size={24} />
                          </div>
                        )}

                        <div className="bp-achievements-stats__row-body">
                          <span className="bp-achievements-stats__row-title">
                            {game.title}
                          </span>
                          <div className="bp-achievements-stats__bar">
                            <div
                              className="bp-achievements-stats__bar-fill"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        <div className="bp-achievements-stats__row-meta">
                          <span>
                            {unlocked} / {total}
                          </span>
                          {(game.achievementsPointsTotal ?? 0) > 0 && (
                            <span className="bp-achievements-stats__row-points">
                              <MedalIcon size={14} weight="fill" />
                              {game.achievementsPointsEarnedSum ?? 0}
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  </FocusItem>
                );
              })}
            </ul>
          </VerticalFocusGroup>
        </ScrollArea>
      </div>
    </VerticalFocusGroup>
  );
}
