import { useTranslation } from "react-i18next";
import { MedalIcon } from "@phosphor-icons/react";
import { UserAchievement } from "@types";
import "./achievement-panel.scss";

export interface AchievementPanelProps {
  achievements: UserAchievement[];
}

export function AchievementPanel({ achievements }: AchievementPanelProps) {
  const { t } = useTranslation("achievement");

  const achievementsPointsTotal = achievements.reduce(
    (acc, achievement) => acc + (achievement.points ?? 0),
    0
  );

  const achievementsPointsEarnedSum = achievements.reduce(
    (acc, achievement) =>
      acc + (achievement.unlocked ? (achievement.points ?? 0) : 0),
    0
  );

  return (
    <div className="achievement-panel">
      <div className="achievement-panel__content">
        {t("earned_points")}{" "}
        <MedalIcon weight="fill" className="achievement-panel__content-icon" />
        {achievementsPointsEarnedSum} / {achievementsPointsTotal}
      </div>
    </div>
  );
}
