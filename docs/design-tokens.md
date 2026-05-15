# Design Tokens — Kanban TODO

> Source of truth for visuals in the Kanban project. Distilled from the approved Phase 0 prototype (`prototype/`) on 2026-05-15.
> Once Phase 2's `app/ui/tokens.stylex.ts` (or split files) is written from these values, the prototype directory is deleted; this file becomes the canonical reference.

**Visual lineage:** Linear-style structure (typography, spacing, monochromatic surfaces, 1px borders, no shadows, no gradients). **Deliberately non-AI palette** — no purple / violet / magenta accents, no gradient backgrounds, no glassmorphism.

**Theming intent:** Light only ships first. Token names are scaffolded so a dark theme can later be added by overriding values in `stylex.defineVars` without renaming or restructuring.

---

## 1. Colour palette

All values are hex. Names are role-based (what the token *means*), not literal (what the colour *is*).

### Surfaces

| Token | Value | Role |
|-------|-------|------|
| `--surface-0` | `#fafafa` | Page background (the lowest, calmest layer). |
| `--surface-1` | `#ffffff` | Cards, panels, dialogs, table containers. |
| `--surface-2` | `#f4f4f5` | Subtle inset surfaces — columns, hover states, badges, segmented-control track. |
| `--surface-3` | `#ebebed` | Tertiary surface — chip backgrounds, hover-within-already-subtle. |

### Borders

| Token | Value | Role |
|-------|-------|------|
| `--border-subtle` | `#e4e4e7` | Default border (cards, panels, separators). |
| `--border-default` | `#d4d4d8` | Form fields, button outlines, more emphasis. |
| `--border-strong` | `#a1a1aa` | Reserved for tooltips / popovers / overlays sitting above surfaces. |

### Text

| Token | Value | Role |
|-------|-------|------|
| `--text-default` | `#18181b` | Default body and heading text. |
| `--text-muted` | `#71717a` | Secondary text, table headers, helper text, navigation idle state. |
| `--text-faint` | `#a1a1aa` | Tertiary text — timestamps, disabled labels. |
| `--text-inverse` | `#fafafa` | Text on accent backgrounds (primary button label, brand mark). |

### Accent — deep teal (single accent)

| Token | Value | Role |
|-------|-------|------|
| `--accent` | `#1f5862` | Primary action background, selected-task border, focus ring, admin role chip. |
| `--accent-hover` | `#2a6b70` | Primary action hover. |
| `--accent-active` | `#18484f` | Primary action pressed. |
| `--accent-bg` | `#e6eef0` | Subtle accent surface — accent chip background, avatar background. |

**Discipline:** the accent is used *sparingly*. Anywhere you find yourself reaching for it more than once or twice on a screen, choose a neutral instead. Linear's discipline is that monochromaticity does the work; the accent earns attention by being rare.

### Semantic — low saturation, never primary

These are reserved for status / state communication, never for decoration.

| Token | Value | Role |
|-------|-------|------|
| `--success` | `#2f6f4f` | Done states, success chips. |
| `--success-bg` | `#e8f1ec` | Success-chip background. |
| `--warning` | `#b07a2c` | Due-soon date, expired-invite chip. |
| `--warning-bg` | `#f7ecdc` | Warning-chip background. |
| `--danger` | `#9b2c2c` | Destructive actions (delete), overdue dates. |
| `--danger-bg` | `#f4e3e3` | Danger-chip and destructive-hover background. |
| `--info` | `#3b5c7a` | Informational chips (pending invite). |
| `--info-bg` | `#e6ecf2` | Info-chip background. |

---

## 2. Typography

| Property | Value |
|----------|-------|
| **Font family (text)** | `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif` — system stack only; no web fonts, no CDN. |
| **Font family (mono)** | `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace` — used for keyboard chips, code if needed. |
| **Default body size** | 14 px = `bodyMd` (Linear-density). |
| **Heading defaults** | semiBold weight, line-height 1.2, letter-spacing `-0.02em` (tight, Linear-style). |
| **Body default** | normal weight, line-height 1.5. |

### Size scale — split into title and body

Two separate scales mirror the typography component API (§2A): `<Heading>` consumes title sizes; `<Text>` consumes body sizes. Direct application of font-size outside these components is disallowed.

**Title scale** — for `<Heading>` and `<PageHeading>`.

| Token | Value | Role |
|-------|-------|------|
| `titleSm` | 16 px | Card titles, modal section headings, task-detail title, section-title in dialogs. |
| `titleMd` | 20 px | Auth-card title, empty-state title, sub-page headings. (Was 18 px in the prototype; folded to 20 px for a clean three-size scale.) |
| `titleLg` | 24 px | Page titles ("Archive", "Users"). The PageHeading component pins this. |

**Body scale** — for `<Text>`.

| Token | Value | Role |
|-------|-------|------|
| `bodyXxs` | 11 px | Micro text: keyboard chips (`⌘K`), table column headers (uppercase + letter-spacing), inline glyph captions. |
| `bodyXs` | 12 px | Helper text, timestamps, small chips. |
| `bodySm` | 13 px | Form labels, secondary buttons, table cell text, navigation idle. |
| `bodyMd` | 14 px | **Default body.** Default button, task title, most paragraph copy. |

**Reserved range:** no `bodyLg` and no `titleXl`/`titleXxl`. If a layout needs them, the design needs reconsidering before the scale needs extending.

### Weight set

| Token | Value | Use |
|-------|-------|-----|
| `normal` | 400 | Default body, helper text. |
| `medium` | 500 | Labels, navigation, secondary buttons, table cells with emphasis. |
| `semiBold` | 600 | Headings (always), primary actions, workspace name, selected-nav. |
| `bold` | 700 | Reserved — strong CTAs only, very rare. |

---

## 2A. Typography components — the rendering contract

Three components own all text rendering. Raw `<h*>`, `<p>`, `<span>` styled directly are disallowed in feature code; use the components below. The components live at `app/ui/typography/{Heading,PageHeading,Text}/`.

### `<Heading>`

```tsx
type Props = {
  children: ReactNode;
  size: "sm" | "md" | "lg";              // → titleSm / titleMd / titleLg
  as: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"; // HTML semantics independent of visual size
  color?: "primary" | "inherit";          // default "primary"
  align?: "initial" | "left" | "center" | "right"; // default "initial"
  clamp?: boolean;                        // truncate to single line with ellipsis
};
```

Defaults baked in: semiBold weight, line-height 1.2, letter-spacing `-0.02em`, margin reset.

**`as` ≠ `size`:** the HTML tag (semantics, document outline, screen-reader landmark) is independent of the visual size. An h2 page subhead can be `size="sm"` if that's what the layout calls for.

### `<PageHeading>`

```tsx
type Props = {
  backLink: { to: string; label: string };
  children: ReactNode;
};
```

Composed h1 with a backlink + breadcrumb separator. Always `<Heading as="h1" size="lg">` under the hood. Used at the top of pages that have a parent route (e.g. user detail, archived task detail).

### `<Text>`

```tsx
type Props = {
  children: ReactNode;
  size: "xxs" | "xs" | "sm" | "md";       // → bodyXxs / bodyXs / bodySm / bodyMd
  color?: "primary" | "muted" | "accent" | "danger" | "inherit"; // default "primary"
  align?: "initial" | "left" | "center" | "right"; // default "initial"
  weight?: "normal" | "medium" | "semiBold" | "bold"; // default "normal"
  role?: "alert" | "status";              // ARIA live region semantics
};
```

Renders as a `<span>`. Line-height 1.5 baked in.

**`role`:** when the text content is dynamic and must be announced to assistive tech (error message, status update, toast body), set `role="alert"` (assertive) or `role="status"` (polite). Don't set without reason.

### Hard rules

1. **No direct font-size or font-weight on elements outside these three components.** If feature code needs a text style that the components don't expose, **stop and ask** rather than dropping to raw CSS — same rule as the [[feedback-ui-component-checkpoint]] memory.
2. **Headings always semiBold.** Don't override with `<Heading weight="normal">` — that prop doesn't exist on `<Heading>` by design.
3. **`<Text>` for inline strings; `<Heading>` for any text that introduces a section.** Mixing them confuses screen readers.

---

## 3. Spacing — 4-px grid

| Token | Value |
|-------|-------|
| `--space-1` | 4 px |
| `--space-2` | 8 px |
| `--space-3` | 12 px |
| `--space-4` | 16 px |
| `--space-5` | 20 px |
| `--space-6` | 24 px |
| `--space-8` | 32 px |
| `--space-10` | 40 px |
| `--space-12` | 48 px |
| `--space-16` | 64 px |

Values above 64 px are intentionally absent — if a layout needs them, the design needs reconsidering before the scale needs extending.

---

## 4. Radius scale

| Token | Value | Role |
|-------|-------|------|
| `--radius-sm` | 4 px | Keyboard chips, small interactive elements. |
| `--radius-md` | 6 px | Buttons, form fields, task cards. |
| `--radius-lg` | 8 px | Sections, columns, dialogs, detail panel. |
| `--radius-xl` | 10 px | Reserved (slightly softer cards if needed). |
| `--radius-full` | 9999 px | Avatars, count badges, chip pills. |

---

## 5. Shadows

**Intentionally none.** The Linear-structure aesthetic relies on borders and surface contrast, not elevation. Adding shadows is the fastest way to drift toward an "AI-tool" look (especially soft glows). If a depth cue is genuinely needed in the future (e.g. a floating popover), the rule is: one shadow token, very subtle, agreed before adoption — not improvised.

---

## 6. Focus ring

Visible focus is **non-negotiable** (plan §10 a11y).

| Property | Value |
|----------|-------|
| Style | `2px solid var(--accent)` |
| Offset | `2px` outside the element (default), or `-1px` *inside* the border for form fields (avoids double-ring visual). |
| Applies to | Every focusable element via `:focus-visible`. |

---

## 7. Component-specific notes

These aren't tokens but are reference patterns the prototype established that Phase 2 implementation should preserve:

- **Buttons.** Primary = filled accent. Secondary = `surface-1` background, `border-default` outline. Ghost = transparent, gains `surface-2` on hover. Danger-ghost = transparent, gains `danger-bg` on hover.
- **Task cards.** `surface-1` background, `border-subtle`, hover transitions to `border-default`, selected = `border-color: var(--accent)`. **No box-shadow.**
- **Chips.** `surface-2` background + `border-subtle` by default. Variants (`accent`, `success`, `warning`, `danger`, `info`) replace background+colour and drop the border (border-color: transparent).
- **Tables.** Headers are `--text-muted`, `--size-xs`, uppercase, letter-spacing `0.04em`. Rows separated by `--border-subtle`. Last row has no bottom border.
- **Keyboard chips.** Mono font, 11 px, `--surface-1` background with `--border-default`, `--radius-sm`. Used for shortcut hints (`⌘K`).

---

## 8. Theming intent

- **Light only ships first.** All values above are the light theme.
- **Dark theme deferred** past MVP. Token names are role-based so a dark theme can be added later by overriding values in `stylex.defineVars` (the API supports theme variants) without renaming tokens or touching components.
- When dark is added, the same accent (`#1f5862`) will likely need a brighter variant for sufficient contrast; that decision happens then, not now.

---

## 9. Deliberately deferred

These are *not* in the token set on purpose. Re-evaluate when the corresponding need actually arises.

- **Dark theme.** Past MVP.
- **Web fonts** (Inter or otherwise). System stack ships first; revisit only if visual feedback after real use says "too generic". Not currently planned — the typography component layer (§2A) gives most of the perceived quality, font choice gives diminishing returns on top.
- **Animation / transition token set.** The prototype uses a few short eases (e.g. 80 ms on button hover) inline; no formal scale yet. Add when more than three components share a need.
- **Icon system.** Prototype uses unicode (`⋯`, `⌘`, `×`, `✓`). Real app needs a decision: `lucide-react` is the default recommendation (good coverage, tree-shakeable, matches Linear-clean), but defer until Phase 2 actually needs an icon.
- **Spacing > 64 px.** Add if a layout demands it; don't pre-build.
- **Z-index scale.** Only one stack-level (popover) exists in the prototype; add a token set when overlays / dialogs / dropdowns coexist.
- **Density variants** (compact / comfortable). Single density for now.

---

## 10. How Phase 2 consumes this

At the Pre-Phase-2 design review, these values translate to StyleX tokens (`app/ui/tokens.stylex.ts` or split files — to be decided at that review). **Every value the agent writes traces back to a row in this doc.** If a value is needed that isn't here, the agent stops and asks rather than improvising — the same rule as the `feedback-ui-component-checkpoint` memory.
