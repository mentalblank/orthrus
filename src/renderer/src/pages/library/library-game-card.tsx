import { LibraryGame } from "@types";
import { useGameCard } from "@renderer/hooks";
import { memo, useEffect, useState } from "react";
import type { MouseEvent } from "react";
import {
  ClockIcon,
  AlertFillIcon,
  TrophyIcon,
  ImageIcon,
  CheckCircleFillIcon,
  CircleIcon,
} from "@primer/octicons-react";
import "./library-game-card.scss";
import { logger } from "@renderer/logger";

interface LibraryGameCardProps {
  game: LibraryGame;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onContextMenu: (
    game: LibraryGame,
    position: { x: number; y: number }
  ) => void;
  onShowTooltip?: (gameId: string) => void;
  onHideTooltip?: () => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (game: LibraryGame) => void;
}

export const LibraryGameCard = memo(function LibraryGameCard({
  game,
  onMouseEnter,
  onMouseLeave,
  onContextMenu,
  selectable = false,
  selected = false,
  onToggleSelect,
}: Readonly<LibraryGameCardProps>) {
  const { formatPlayTime, handleCardClick, handleContextMenuClick } =
    useGameCard(game, onContextMenu);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (selectable) {
      event.preventDefault();
      onToggleSelect?.(game);
      return;
    }

    handleCardClick();
  };

  const sources = [
    game.customIconUrl, // Level 0
    game.coverImageUrl, // Level 1
    game.libraryImageUrl, // Level 2
    game.iconUrl, // Level 3
  ].filter((url) => url && url.trim() !== "");

  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const resolveImageSource = (imageUrl: string | null | undefined): string => {
    if (!imageUrl) return "";

    const trimmedImageUrl = imageUrl.trim();
    if (!trimmedImageUrl) return "";

    if (
      trimmedImageUrl.startsWith("http://") ||
      trimmedImageUrl.startsWith("https://") ||
      trimmedImageUrl.startsWith("data:") ||
      trimmedImageUrl.startsWith("blob:")
    ) {
      return trimmedImageUrl;
    }

    if (trimmedImageUrl.startsWith("local:")) {
      const normalizedLocalPath = trimmedImageUrl
        .slice("local:".length)
        .replaceAll("\\", "/");
      return `local:${normalizedLocalPath}`;
    }

    const normalizedPath = trimmedImageUrl.replaceAll("\\", "/");
    if (/^[A-Za-z]:\//.test(normalizedPath) || normalizedPath.startsWith("/")) {
      return `local:${normalizedPath}`;
    }

    return normalizedPath;
  };

  const activeImageSource = resolveImageSource(sources[fallbackIndex]);

  const handleImageError = () => {
    logger.warn(`Image failed to load for ${game.title}`, {
      failedUrl: sources[fallbackIndex],
      level: fallbackIndex,
    });

    if (fallbackIndex < sources.length - 1) {
      setFallbackIndex((prevIndex) => prevIndex + 1);
    } else {
      setImageError(true);
    }
  };

  useEffect(() => {
    setFallbackIndex(0);
    setImageError(false);
  }, [game.id]);

  return (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`library-game-card__wrapper${
        selectable ? " library-game-card__wrapper--selectable" : ""
      }${selected ? " library-game-card__wrapper--selected" : ""}`}
      title={game.title}
      onClick={handleClick}
      onContextMenu={handleContextMenuClick}
    >
      {selectable && (
        <div className="library-game-card__select-indicator">
          {selected ? (
            <CheckCircleFillIcon size={20} />
          ) : (
            <CircleIcon size={20} />
          )}
        </div>
      )}

      <div className="library-game-card__overlay">
        <div className="library-game-card__top-section">
          <div className="library-game-card__playtime">
            {game.hasManuallyUpdatedPlaytime ? (
              <AlertFillIcon
                size={11}
                className="library-game-card__manual-playtime"
              />
            ) : (
              <ClockIcon size={11} />
            )}
            <span className="library-game-card__playtime-long">
              {formatPlayTime(game.playTimeInMilliseconds)}
            </span>
            <span className="library-game-card__playtime-short">
              {formatPlayTime(game.playTimeInMilliseconds, true)}
            </span>
          </div>
        </div>

        {(game.achievementCount ?? 0) > 0 && (
          <div className="library-game-card__achievements">
            <div className="library-game-card__achievement-header">
              <div className="library-game-card__achievements-gap">
                <TrophyIcon
                  size={13}
                  className="library-game-card__achievement-trophy"
                />
                <span className="library-game-card__achievement-count">
                  {game.unlockedAchievementCount ?? 0} /{" "}
                  {game.achievementCount ?? 0}
                </span>
              </div>
              <span className="library-game-card__achievement-percentage">
                {Math.round(
                  ((game.unlockedAchievementCount ?? 0) /
                    (game.achievementCount ?? 1)) *
                    100
                )}
                %
              </span>
            </div>
            <div className="library-game-card__achievement-progress">
              <div
                className="library-game-card__achievement-bar"
                style={{
                  width: `${((game.unlockedAchievementCount ?? 0) / (game.achievementCount ?? 1)) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {imageError || !activeImageSource ? (
        <div className="library-game-card__cover-placeholder">
          <ImageIcon size={48} />
        </div>
      ) : (
        <img
          src={activeImageSource}
          alt={game.title}
          className="library-game-card__game-image"
          loading="lazy"
          onError={handleImageError}
        />
      )}
    </button>
  );
});
