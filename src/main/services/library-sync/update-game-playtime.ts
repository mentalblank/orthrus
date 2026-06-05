import type { Game } from "@types";

export const trackGamePlaytime = async (
  _game: Game,
  _deltaInMillis: number,
  _lastTimePlayed: Date
) => {
  // Local-only: do not track playtime on remote servers
};
