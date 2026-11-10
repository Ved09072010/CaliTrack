# CaliTrack design audit

1. Home is crowded with many equal-weight cards; make rings and the week strip the glanceable focus.
2. Workouts mixes logging, history, and progress; separate Log, Programs, and Timer.
3. Keep workout fields in a sheet and collapse notes, weight, and advanced options.
4. Habits currently repeats dense per-habit grids; lead with today's checklist and one shared 12-week heatmap.
5. Diet puts the meal form beside totals; lead with progress, quick water, favorites, and a weekly chart.
6. Library search/results and progressions compete; separate Browse from Progressions.
7. Programs and timers share a long page; segment them and keep custom routines behind an add action.
8. Settings should leave the bottom navigation and open from a labeled gear control.
9. Give each screen one accent, warm glass surfaces, concise labels, and tap-first detail sheets.
10. Keep every current data flow, storage key, feature, and offline behavior intact while reshaping presentation.

## Visual system

The interface uses a warm cream and charcoal palette with translucent warm-white
surfaces in light mode, and a soft near-black backdrop with warm glass surfaces
in dark mode. Each section uses only its own accent: terracotta for Home and
Workouts, sage for Habits, saffron for Diet, and dusty teal for Library and
other informational details.

| Section | Light accent | Dark accent |
| --- | --- | --- |
| Home and Workouts | `#c8553d` | `#e7765e` |
| Habits | `#6b8f71` | `#8fb996` |
| Diet | `#d99a2b` | `#f0b44c` |
| Library and information | `#3f7d82` | `#6fb3b8` |

Use the system serif stack for headings and system sans-serif for body text.
Surfaces have a translucent border and warm shadow; blur is decorative and has
a solid-color fallback. Controls have a minimum 44px touch target, a visible
keyboard focus ring, and motion respects `prefers-reduced-motion`.

## Screen structure

- Home: three progress rings, a seven-day activity strip, and compact training
  statistics. Settings and backup open from a gear button in the header.
- Workouts: Log, Programs, and Timer segments. Forms live in bottom sheets;
  performance trends remain compact and body stats are collapsed by default.
- Habits: Today and Streaks segments with a shared 12-week completion heatmap.
- Diet: Today and Week segments with calorie/protein progress, quick water and
  favorite-food actions, and a weekly chart.
- Library: Browse and Progressions segments; guide detail remains available on
  demand.
- Settings: preference, backup, restore, export, and reset actions remain
  available from the Home gear entry.

No storage schema or storage module changes are part of the visual redesign.
