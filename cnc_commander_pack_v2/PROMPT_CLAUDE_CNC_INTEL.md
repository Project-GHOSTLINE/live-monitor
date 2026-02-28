# Claude Code — Apply Bubble-Head RTS Commander Pack to Template

## What you are doing
Integrate the provided leader PNGs into the existing Command Center / Choose Your Commander page.
Render cards from JSON, with neon rings, hover glow, selection state, and a right-side info panel.

## IMPORTANT — Accuracy
Do not hard-assert real-world officeholders beyond the `meta.lastVerifiedAt` date.
Display the UI-friendly `role` label (e.g., "Commander") unless a verified leader source is wired.

## Assets included
- `public/leaders/*.png` (8 portraits, 384x512 PNG tiles)
- `data/leaders/leaders_2024.json`

## UI Requirements
- Grid: 4 columns desktop, 2 columns mobile
- Each card:
  - circular portrait frame (center-crop) + neon ring (theme.ring)
  - glow on hover (theme.glow)
  - label: COUNTRY (big) + name (small) + readiness badge
- Hover: scale 1.04 + stronger glow + show tooltip panel (name/role/readiness/lastVerifiedAt)
- Click: set selected leader, highlight, update right panel

## Implementation steps
1) Locate the current route (likely `/command-center`) and existing commander data source.
2) Replace hardcoded data with JSON from `data/leaders/leaders_2024.json`.
3) Add `CommanderCard` and `CommanderGrid` components.
4) Use `next/image` with fixed container sizes to avoid layout shift.
5) Add a small note in UI: "Verification date shown in tooltip."

## Files to create/update
- `components/CommanderCard.tsx`
- `components/CommanderGrid.tsx`
- Update the command center page to use the components + JSON

## Acceptance
- All 8 render correctly
- Hover/selection works
- Responsive layout OK
- No console errors


## Added (v2)
- Use `labels.rolePublic` for the card label and `labels.roleTooltip` + `meta.lastVerifiedAt` in the tooltip.
- New seed files:
  - `data/factions/middle_east_factions_2026_seed.json`
  - `data/factions/middle_east_relations_seed.json`
Render them in a "Middle East Theater" panel (filterable list + mini-map overlays).
