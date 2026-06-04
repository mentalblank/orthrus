import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TrophyIcon } from "@primer/octicons-react";

import { useAppDispatch, useFormat } from "@renderer/hooks";
import { setHeaderTitle } from "@renderer/features";
import type { LibraryGame } from "@types";

import "./achievements-stats.scss";

export default function AchievementsStats() {
  const { t } = useTranslation("achievements_stats");
  const dispatch = useAppDispatch();
  const { numberFormatter } = useFormat();

  const [games, setGames] = useState<LibraryGame[]>([]);

  useEffect(() => {
    dispatch(setHeaderTitle(t("title")));
    window.electron.getLibrary().then(setGames);
  }, [dispatch, t]);

  const stats = useMemo(() => {
    const totalPlaytimeMs = games.reduce(
      (sum, game) => sum + (game.playTimeInMilliseconds ?? 0),
      0
    );
    const unlocked = games.reduce(
      (sum, game) => sum + (game.unlockedAchievementCount ?? 0),
      0
    );
    const total = games.reduce(
      (sum, game) => sum + (game.achievementCount ?? 0),
      0
    );

    return {
      gamesCount: games.length,
      totalPlaytimeMs,
      unlocked,
      total,
      completion: total > 0 ? Math.round((unlocked / total) * 100) : 0,
    };
  }, [games]);

  const formatPlaytime = (milliseconds: number) => {
    const minutes = milliseconds / 1000 / 60;

    if (minutes < 120) {
      return t("amount_minutes", { amount: Math.round(minutes) });
    }

    return t("amount_hours", {
      amount: numberFormatter.format(minutes / 60),
    });
  };

  const gamesWithAchievements = useMemo(
    () =>
      games
        .filter((game) => (game.achievementCount ?? 0) > 0)
        .sort(
          (a, b) =>
            (b.unlockedAchievementCount ?? 0) -
            (a.unlockedAchievementCount ?? 0)
        ),
    [games]
  );

  const statCards = [
    {
      label: t("games_in_library"),
      value: numberFormatter.format(stats.gamesCount),
    },
    {
      label: t("total_playtime"),
      value: formatPlaytime(stats.totalPlaytimeMs),
    },
    {
      label: t("achievements_unlocked"),
      value: `${numberFormatter.format(stats.unlocked)} / ${numberFormatter.format(stats.total)}`,
    },
    { label: t("completion"), value: `${stats.completion}%` },
  ];

  return (
    <div className="achievements-stats">
      <div className="achievements-stats__cards">
        {statCards.map((card) => (
          <div key={card.label} className="achievements-stats__card">
            <span className="achievements-stats__card-value">{card.value}</span>
            <span className="achievements-stats__card-label">{card.label}</span>
          </div>
        ))}
      </div>

      <h2 className="achievements-stats__section-title">
        {t("games_with_achievements")}
      </h2>

      {gamesWithAchievements.length === 0 ? (
        <p className="achievements-stats__empty">{t("no_games")}</p>
      ) : (
        <ul className="achievements-stats__list">
          {gamesWithAchievements.map((game) => {
            const unlocked = game.unlockedAchievementCount ?? 0;
            const total = game.achievementCount ?? 0;
            const percent = total > 0 ? (unlocked / total) * 100 : 0;
            const image = game.libraryImageUrl || game.iconUrl || "";

            return (
              <li
                key={`${game.shop}:${game.objectId}`}
                className="achievements-stats__item"
              >
                {image ? (
                  <img
                    className="achievements-stats__item-image"
                    src={image}
                    alt={game.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="achievements-stats__item-image achievements-stats__item-image--placeholder">
                    <TrophyIcon size={20} />
                  </div>
                )}

                <div className="achievements-stats__item-body">
                  <div className="achievements-stats__item-header">
                    <span className="achievements-stats__item-title">
                      {game.title}
                    </span>
                    <span className="achievements-stats__item-progress">
                      {t("progress", {
                        unlocked: numberFormatter.format(unlocked),
                        total: numberFormatter.format(total),
                      })}
                    </span>
                  </div>

                  <div className="achievements-stats__bar">
                    <div
                      className="achievements-stats__bar-fill"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <span className="achievements-stats__item-playtime">
                    {formatPlaytime(game.playTimeInMilliseconds ?? 0)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
