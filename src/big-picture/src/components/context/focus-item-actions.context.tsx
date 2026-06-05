import type { FocusItemActionsMeta } from "../../types";
import { createContext } from "react";

const defaultFocusItemActionsMeta: FocusItemActionsMeta = {
  hasPrimary: false,
  hasSecondary: false,
  hasPressX: false,
  hasPressY: false,
  hasHoldA: false,
  hasHoldB: false,
  hasHoldX: false,
  hasHoldY: false,
};

export const FocusItemActionsMetaContext = createContext<FocusItemActionsMeta>(
  defaultFocusItemActionsMeta
);
