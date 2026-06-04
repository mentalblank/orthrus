import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TrophyIcon, SearchIcon } from "@primer/octicons-react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useFormat } from "@renderer/hooks";
import { setHeaderTitle } from "@renderer/features";
import { buildGameAchievementPath } from "@renderer/helpers";
import HydraIcon from "@renderer/assets/icons/hydra.svg?react";
import type { LibraryGame } from "@types";

import "./achievements-stats.scss";

export default function AchievementsStats() {
  const { t } = useTranslation("achievements_stats");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { numberFormatter } = useFormat();

  const [games, setGames] = useState<LibraryGame[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(setHeaderTitle(t("title")));
    window.electron.getLibrary().then(setGames);
  }, [dispatch, t]);

  const stats = useMemo(() => {
    const reduce = (key: keyof LibraryGame) =>
      games.reduce((sum, game) => sum + ((game[key] as number) ?? 0), 0);

    const unlocked = reduce("unlockedAchievementCount");
    const total = reduce("achievementCount");

    return {
      gamesCount: games.length,
      totalPlaytimeMs: reduce("playTimeInMilliseconds"),
      unlocked,
      total,
      pointsEarned: reduce("achievementsPointsEarnedSum"),
      pointsTotal: reduce("achievementsPointsTotal"),
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

  const gamesWithAchievements = useMemo(() => {
    const query = search.trim().toLowerCase();

    return games
      .filter((game) => (game.achievementCount ?? 0) > 0)
      .filter((game) => !query || game.title.toLowerCase().includes(query))
      .sort(
        (a, b) =>
          (b.unlockedAchievementCount ?? 0) - (a.unlockedAchievementCount ?? 0)
      );
  }, [games, search]);

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
    {
      label: t("points_earned"),
      value: `${numberFormatter.format(stats.pointsEarned)} / ${numberFormatter.format(stats.pointsTotal)}`,
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

      <div className="achievements-stats__list-header">
        <h2 className="achievements-stats__section-title">
          {t("games_with_achievements")}
        </h2>

        <div className="achievements-stats__search">
          <SearchIcon size={16} />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("search_placeholder")}
            className="achievements-stats__search-input"
          />
        </div>
      </div>

      {gamesWithAchievements.length === 0 ? (
        <p className="achievements-stats__empty">{t("no_games")}</p>
      ) : (
        <ul className="achievements-stats__list">
          {gamesWithAchievements.map((game) => {
            const unlocked = game.unlockedAchievementCount ?? 0;
            const total = game.achievementCount ?? 0;
            const percent = total > 0 ? (unlocked / total) * 100 : 0;
            const image = game.libraryImageUrl || game.iconUrl || "";
            const pointsTotal = game.achievementsPointsTotal ?? 0;

            return (
              <li key={`${game.shop}:${game.objectId}`}>
                <button
                  type="button"
                  className="achievements-stats__item"
                  onClick={() =>
                    navigate(
                      buildGameAchievementPath({
                        shop: game.shop,
                        objectId: game.objectId,
                        title: game.title,
                      })
                    )
                  }
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

                    <div className="achievements-stats__item-footer">
                      <span className="achievements-stats__item-playtime">
                        {formatPlaytime(game.playTimeInMilliseconds ?? 0)}
                      </span>
                      {pointsTotal > 0 && (
                        <span className="achievements-stats__item-points">
                          <HydraIcon className="achievements-stats__item-points-icon" />
                          {numberFormatter.format(
                            game.achievementsPointsEarnedSum ?? 0
                          )}{" "}
                          / {numberFormatter.format(pointsTotal)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
