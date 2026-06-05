import {
  AppsIcon,
  ListUnorderedIcon,
  RowsIcon,
  SquareIcon,
} from "@primer/octicons-react";
import { useTranslation } from "react-i18next";
import "./view-options.scss";

export type ViewMode = "grid" | "compact" | "large" | "list";

const MODE_CONFIG: {
  mode: ViewMode;
  icon: typeof AppsIcon;
  titleKey: string;
}[] = [
  { mode: "compact", icon: SquareIcon, titleKey: "compact_view" },
  { mode: "grid", icon: AppsIcon, titleKey: "grid_view" },
  { mode: "large", icon: RowsIcon, titleKey: "large_view" },
  { mode: "list", icon: ListUnorderedIcon, titleKey: "list_view" },
];

interface ViewOptionsProps {
  viewMode: ViewMode;
  onViewModeChange: (viewMode: ViewMode) => void;
  availableModes?: ViewMode[];
}

export function ViewOptions({
  viewMode,
  onViewModeChange,
  availableModes,
}: Readonly<ViewOptionsProps>) {
  const { t } = useTranslation("library");

  const modes = availableModes
    ? MODE_CONFIG.filter((config) => availableModes.includes(config.mode))
    : MODE_CONFIG;

  return (
    <div className="library-view-options__container">
      <div className="library-view-options__options">
        {modes.map(({ mode, icon: Icon, titleKey }) => (
          <button
            key={mode}
            className={`library-view-options__option ${viewMode === mode ? "active" : ""}`}
            onClick={() => onViewModeChange(mode)}
            title={t(titleKey)}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
    </div>
  );
}
