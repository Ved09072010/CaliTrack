# Learning notes

## React migration

- Moved the existing five-tab interface into React components without changing its visual theme.
- Workout history, weekly summaries, the modal form, and progress charts now update from component state.
- All saved data still uses `js/storage.js`, so existing browser records remain available.
- Run `npm install` once, then `npm run dev`; run `npm run build` to check the publishable site.
- Concepts: components, props, state, event handlers, and effects.
- Try adding one more exercise to the list in `src/data.js`.

## Phase 2: Storage layer

- Added one module for saving, loading, and removing JSON data in browser storage.
- Added local date, unique ID, and readable date formatting helpers.
- Removed the app name and date banner from the visible page.
- Run locally with `npm run dev`; verify storage in browser DevTools.
- Concepts: modules, functions, objects, JSON, and browser storage.
- Try changing the fallback value passed to `load` and observe missing data.

## Phase 3: Workout logger

- Added a workout form for exercises, dates, reps or hold seconds, optional weight, and notes.
- Workouts are grouped by date and can be edited or deleted after confirmation.
- Recent exercises appear as quick-pick buttons; saved workouts stay in browser storage.
- Run locally with `npm run dev`; add a workout, refresh, edit it, and delete it.
- Concepts: arrays, objects, form events, input validation, and creating page elements.
- Try adding another exercise to the exercise dropdown in `index.html`.

## Phase 4: Progress tracking

- Added weekly workout, rep, and streak totals plus new-record badges.
- Added per-exercise performance charts and a saved body-weight trend.
- Workout date and local time are saved automatically and shown in history, so they do not need manual entry.
- Run locally with `npm run dev`; log workouts and body weight to view the charts.
- Concepts: dates, array filtering, chart datasets, and derived statistics.
- Try logging another workout and compare its progress chart.
