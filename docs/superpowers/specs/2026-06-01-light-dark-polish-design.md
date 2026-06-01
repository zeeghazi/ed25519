# ed25519.com — Light/Dark Polish Pass (design)

**Date:** 2026-06-01 · **Branch:** `astro-migration`

## Goal

Make the site feel more professional, distinctive, and immediately
trustworthy — especially in **light mode**, which currently reads as a flat
near-white sheet with the dark console as the only element with visual weight.
Do it as **polish, not redesign**: keep the current Vercel-inspired look and the
existing `DESIGN.md` system; add depth and confidence through tokens and shared
components.

## Principles

- **Both modes are first-class.** Every change is verified in light _and_ dark;
  nothing improves one at the other's expense. Terminal/console surfaces keep
  their fixed `--color-term-*` tokens (intentionally non-inverting).
- **Minimal footprint.** Prefer changes to `global.css` tokens and shared
  components (`Button`, card patterns, `PageHeader`, section components) so they
  cascade across home, the three tool pages, and secondary pages — few files.
- **Use the system we already have** (`DESIGN.md`): the stacked-shadow elevation
  ladder, surface cycling (`canvas` / `canvas-soft` / `canvas-soft-2`), the mesh
  gradient, the type scale. No new accent colors; display weight ceiling stays
  600; headlines stay sentence-case with negative tracking.
- **Graphic-designer eye:** confident hierarchy, intentional spacing ("large
  gaps, tight interiors"), crisp edges. Restraint over decoration.

## Non-goals

- No structural redesign of the home page or its tool-first layout.
- No new color palette or sixth accent.
- No change to tool behavior or the console's dark-terminal treatment.

## Changes (core)

1. **Card elevation.** Move feature cards, the FAQ accordion, RelatedTools,
   About cards, and worked-example blocks from flat hairline outlines to the
   `DESIGN.md` stacked-shadow ladder (Level 2 for grids, Level 1 inset
   elsewhere). White `canvas` cards on the `canvas-soft` page gain real depth in
   light mode; in dark mode the same tokens read as subtle raised surfaces.

2. **Subtle surface rhythm.** Give adjacent sections gentle surface contrast
   (`canvas` ↔ `canvas-soft` / `canvas-soft-2`) so the page reads as distinct
   bands instead of one continuous sheet — kept subtle so it still feels calm.

3. **Hairline & contrast tuning (light mode).** Strengthen the light-mode
   hairline slightly (≈ `#ebebeb` → `#e3e3e3`) and use `hairline-strong` for
   primary section/card edges so structure is legible without feeling heavy.
   Dark-mode hairlines unchanged.

4. **Mesh gradient presence.** The hero gradient is currently 15% opacity +
   90px blur — invisible in light mode. Tune it to be just perceptible (a warm,
   premium glow) in both modes without dominating. No miniaturizing.

5. **Typography rhythm.** Section leads move to `body-lg` (18px) where they are
   currently small; standardize the section header pattern (heading + lead) and
   vertical band spacing to the `DESIGN.md` scale (64–96px between bands; tight
   8px heading→body inside cards). Bump tool-page section headings
   `display-md` → `display-lg`; give the hero headline a touch more presence on
   desktop.

## Optional (ask-first, default OFF)

- **One polarity-flipped dark anchor band** (e.g. the bottom CTA) using
  `showcase-band-dark`. Highest visual impact but the closest to a redesign, so
  it ships only if explicitly approved after seeing the core polish.

## Acceptance criteria

- Light mode: the page has clear surface depth and hierarchy; no longer reads as
  a single flat white sheet. Dark mode: unchanged-to-better, never regressed.
- `pnpm check` 0 errors; `pnpm test` 21/21; `pnpm build` clean.
- Changes concentrated in tokens + shared components; per-page edits minimal.
- Each visual change eyeballed in both light and dark before commit.

## Approach

Implement as small, independently reviewable increments (one concern per commit:
elevation, surfaces, hairlines, gradient, type) so the look can be judged live
and pulled back easily — matching "we'll see when we implement."
