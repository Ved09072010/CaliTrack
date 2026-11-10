# CaliTrack design audit

## Initial phone audit

Counts are from the empty app at 390×844; text rows are approximate visible baselines.

1. Home: 6 buttons / 10 text rows; untap the rings, keep the gear and one Today action.
2. Workouts: 4 / 14; keep the three segments, move logging and item actions into sheets.
3. Habits: 1 / 7 when empty; populated rows repeat controls and two grids, so use one menu per habit.
4. Diet: 3 / 13; move the inline meal form and history actions into sheets.
5. Library: 10 / 26; combine category choices into one control and cap visible results at five.
6. Settings: 6 controls / 12 rows; make it a compact list with forms and backups on demand.
7. Programs: routine cards repeat long descriptions and actions; show concise rows with one start action.
8. Timers: four mode buttons and multiple actions compete; use a compact mode selector and one primary action.
9. Across screens: collapse notes, macros, cues, and advanced fields; keep rows to one visible menu.
10. Preserve every feature, data key, chart, storage flow, and offline behavior as content moves.

## Clutter rules

- At 390×844, show at most one primary button and three other controls above the fold (bottom navigation and list rows excluded).
- Use at most two body-text sizes per screen; keep the title and no more than one short subtitle.
- Do not add helper paragraphs below headings or fields. Labels and placeholders carry the necessary meaning.
- Show no more than five list items before a “See all” action.
- Keep each screen's main content within about one screen of scroll, two at most.
- Put forms in bottom sheets; reveal secondary fields through one “More” control.
- Put edit, delete, archive, rename, and duplicate behind one per-item menu.
- Use icon-only repeated actions with accessible names; keep horizontally scrolling chips on one line.
- Empty states use one short sentence and one clear next action.
- Keep touch targets at least 44px and prevent horizontal page overflow at 360px.

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
The default theme follows the device; a saved light or dark choice overrides
that preference. The browser theme color follows the resolved palette.

## Screen structure

- Home: three progress rings, a seven-day activity strip, and compact training
  statistics. Settings and backup open from a gear button in the header.
- Workouts: Log, Programs, and Timer segments. Forms live in bottom sheets;
  exercise and body-weight charts appear when data exists.
- Habits: Today and Streaks segments with a shared 12-week completion heatmap.
- Diet: Today and Week segments with calorie/protein progress, quick water and
  favorite-food actions, and a weekly chart.
- Library: Browse and Skill tree segments. The tree has one-line branch chips
  and a vertical, connected node list; existing progression paths live below it.
- Settings: preference, backup, restore, export, and reset actions remain
  available from the Home gear entry.

## Data presentation

- Chart.js is bundled with the app so progress charts remain available offline.
- Sample data uses `demo_` IDs, is relative to the current date, and can be
  removed without deleting user records.
- First launch offers sample data once; either choice is remembered.
- The Home workout ring uses the editable weekly workout goal. The displayed
  day streak is the current consecutive streak, not the lifetime best.
- The Skill Tree has 32 nodes in five branches. A session masters a node only
  when the required number of sets meet its reps/seconds goal; manual mastery
  is stored separately from workouts under `skillMastery`.
- Node state is communicated by both a shape and a short text label. Available
  nodes use a subtle teal pulse that is removed for reduced-motion preferences.
- The Home Stats disclosure adds only the mastered count and next skill.

The storage module and record groups remain unchanged. Settings also include a
weekly workout goal, and theme selection supports the device's system preference.
