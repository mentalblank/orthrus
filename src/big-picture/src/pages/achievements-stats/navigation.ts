export const ACHIEVEMENTS_STATS_PAGE_REGION_ID = "achievements-stats-page";
export const ACHIEVEMENTS_STATS_LIST_REGION_ID = "achievements-stats-list";

export function getAchievementsStatsRowId(key: string) {
  return `achievements-stats-row:${key}`;
}
