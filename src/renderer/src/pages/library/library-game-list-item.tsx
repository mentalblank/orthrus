import { LibraryGame } from "@types";
import { useGameCard } from "@renderer/hooks";
import {
  ClockIcon,
  TrophyIcon,
  AppsIcon,
  CheckCircleFillIcon,
  CircleIcon,
} from "@primer/octicons-react";
import { memo } from "react";
import type { MouseEvent } from "react";
import cn from "classnames";
import "./library-game-list-item.scss";

interface LibraryGameListItemProps {
  game: LibraryGame;
  onContextMenu: (
    game: LibraryGame,
    position: { x: number; y: number }
  ) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (game: LibraryGame) => void;
}

export const LibraryGameListItem = memo(function LibraryGameListItem({
  game,
  onContextMenu,
  selectable = false,
  selected = false,
  onToggleSelect,
}: Readonly<LibraryGameListItemProps>) {
  const { formatPlayTime, handleCardClick, handleContextMenuClick } =
    useGameCard(game, onContextMenu);

  const icon = game.customIconUrl || game.iconUrl || game.libraryImageUrl || "";
  const unlocked = game.unlockedAchievementCount ?? 0;
  const total = game.achievementCount ?? 0;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (selectable) {
      event.preventDefault();
      onToggleSelect?.(game);
      return;
    }

    handleCardClick();
  };

  return (
    <button
      type="button"
      className={cn("library-game-list-item", {
        "library-game-list-item--selected": selected,
      })}
      onClick={handleClick}
      onContextMenu={handleContextMenuClick}
    >
      {selectable && (
        <div className="library-game-list-item__select-indicator">
          {selected ? (
            <CheckCircleFillIcon size={18} />
          ) : (
            <CircleIcon size={18} />
          )}
        </div>
      )}

      {icon ? (
        <img
          className="library-game-list-item__icon"
          src={icon}
          alt={game.title}
          loading="lazy"
        />
      ) : (
        <div className="library-game-list-item__icon library-game-list-item__icon--placeholder">
          <AppsIcon size={20} />
        </div>
      )}

      <div className="library-game-list-item__body">
        <span className="library-game-list-item__title">{game.title}</span>

        <div className="library-game-list-item__meta">
          <span className="library-game-list-item__playtime">
            <ClockIcon size={12} />
            {formatPlayTime(game.playTimeInMilliseconds)}
          </span>

          {total > 0 && (
            <span className="library-game-list-item__achievements">
              <TrophyIcon size={12} />
              {unlocked} / {total}
            </span>
          )}
        </div>
      </div>
    </button>
  );
});
