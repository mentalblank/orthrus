# Hydra Style Guide

UI + code conventions for the Hydra renderer. Read before adding components or styles.

## Design tokens (SCSS)

Source of truth: `src/renderer/src/scss/globals.scss`. Import with
`@use "../../scss/globals.scss";` and reference as `globals.$token`. Never hardcode values that
a token already covers.

### Colors
| Token | Value | Use |
|-------|-------|-----|
| `$background-color` | `#121212` | app background |
| `$dark-background-color` | `#0d0d0d` | recessed surfaces |
| `$muted-color` | `#f0f1f7` | primary/emphasis text |
| `$body-color` | `#d0d1d7` | body text |
| `$border-color` | `rgba(255,255,255,0.08)` | borders, dividers |
| `$brand-teal` | `#16b195` | primary accent, active state |
| `$brand-blue` | `#3e62c0` | secondary accent |
| `$success-color` | `#1c9749` | success |
| `$warning-color` | `#ffc107` | warning |
| `$danger-color` / `$error-color` | `#801d1e` / `#e11d48` | destructive / error |

Ad-hoc translucent surfaces follow `rgba(255,255,255,0.04)` (fill) /
`rgba(255,255,255,0.08)` (border/hover) — match existing usage rather than inventing new alphas.

### Spacing
- `$spacing-unit: 8px`. Compose with `calc(globals.$spacing-unit * N)`. Avoid raw px for layout gaps.

### Typography
- `$body-font-size: 14px`, `$small-font-size: 12px`.

### Z-index (use the scale, don't guess)
`$bottom-panel-z-index: 3`, `$title-bar-z-index: 4`, `$backdrop-z-index: 4`,
`$modal-z-index: 5`, `$toast-z-index: 150`.

### Opacity
`$disabled-opacity: 0.5`, `$active-opacity: 0.7`.

## SCSS conventions
- One `.scss` per component, imported from its `.tsx`.
- BEM-ish, kebab-case: block `library-game-card`, element `&__title`, modifier `&--selected`.
- Nest elements/modifiers with `&__` / `&--` under the block.
- Class names are semantic, never presentational (`__select-indicator`, not `__top-left-icon`).

## Components
- Reuse shared primitives in `src/renderer/src/components`: `Button`, `Modal`,
  `ConfirmationModal`, `TextField`, `CheckboxField`, `ContextMenu`, `Badge`, `Select`.
- `Button` themes: `primary` | `outline` | `dark` | `danger`.
- Destructive actions (delete, remove files) go through `ConfirmationModal`.
- Multi-select pattern: pass `selectable` / `selected` / `onToggleSelect` props to the item;
  render a `CircleIcon` / `CheckCircleFillIcon` overlay indicator (see `library-game-card`).
- Icons: `@primer/octicons-react` (sized `size={16}` in menus/buttons). `lucide-react` only where
  already established.

## React / TypeScript
- Strict mode, **no `any`** (use `unknown` or precise types). Array type is `T[]`, never `Array<T>`.
- Named exports for components/hooks/utilities; explicit return types on public APIs.
- `interface` for shapes, `type` for unions/aliases. PascalCase types/components, camelCase vars.
- `async`/`await` over `.then()`. Early returns + guard clauses over nesting.

## Logging
- Never `console`. Renderer: `import { logger } from "@renderer/logger"`. Main:
  `import { logger } from "@main/services"`.

## i18n
- No hardcoded user-facing strings. `const { t } = useTranslation("namespace")`.
- New keys land in `src/locales/en/translation.json` (en = source of truth); other locales fall back.
- Cross-namespace lookups: `t("key", { ns: "other" })`.

## Local vs remote state
- Server-owned data (library, collections, catalogue) comes from IPC / Hydra API.
- Client-only UX prefs persist to `localStorage` (+ redux for reactivity) — e.g.
  `library-view-mode`, `sidebarWidth`, `collection-settings`. See `[[hydra-collections-arch]]`.
