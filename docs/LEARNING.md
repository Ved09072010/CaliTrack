# Learning notes

## Phase 2: Storage layer

- Added one module for saving, loading, and removing JSON data in browser storage.
- Added local date, unique ID, and readable date formatting helpers.
- Removed the app name and date banner from the visible page.
- Run locally with `py -m http.server 8000`; verify storage in browser DevTools.
- Concepts: modules, functions, objects, JSON, and browser storage.
- Try changing the fallback value passed to `load` and observe missing data.

## Phase 3: Workout logger

- Added a workout form for exercises, dates, reps or hold seconds, optional weight, and notes.
- Workouts are grouped by date and can be edited or deleted after confirmation.
- Recent exercises appear as quick-pick buttons; saved workouts stay in browser storage.
- Run locally with `py -m http.server 8000`; add a workout, refresh, edit it, and delete it.
- Concepts: arrays, objects, form events, input validation, and creating page elements.
- Try adding another exercise to the exercise dropdown in `index.html`.

## Phase 4: Progress tracking

- Added weekly workout, rep, and streak totals plus new-record badges.
- Added per-exercise performance charts and a saved body-weight trend.
- Workout date and local time are filled in automatically and shown in history.
- Run locally with `py -m http.server 8000`; log workouts and body weight to view the charts.
- Concepts: dates, array filtering, chart datasets, and derived statistics.
- Try logging another workout and compare its progress chart.
