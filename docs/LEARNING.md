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

## Phase 5: Habit tracker

- Added habits with daily check-off buttons and streak counts.
- Added 7-day and 30-day completion grids, plus rename, archive, restore, and delete actions.
- Habit names and daily checks are saved with the shared storage helpers.
- Run `npm run dev`; add a habit, check it off, refresh, then edit or archive it.
- Concepts: React state, arrays, date loops, conditional rendering, and local storage.
- Try changing the completion grid from 30 days to 14 days.

## Phase 6: Diet tracker

- Added meal and macro logging, quick-add favorites, and a saved meal history.
- Added daily calorie, protein, and water totals, editable goals, and water buttons.
- Added a weekly calories-and-protein chart; all records use the shared storage module.
- Run `npm run dev`; log a meal, save it as a favorite, adjust water, then refresh.
- Concepts: form validation, array totals, reusable components, and Chart.js datasets.
- Try changing the default daily water goal in `src/Diet.jsx`.

## Phase 7: Exercise library

- Added 35 original exercise guides with steps, muscles, difficulty, cues, and common mistakes.
- Added search and category filters for push, pull, legs, core, and skills.
- Added strength progressions with unlock suggestions and links to free YouTube tutorial searches.
- A guide's Log button opens the workout form with that exercise selected.
- Run `npm run dev`; search, filter, open a guide, and use its Log button.
- Concepts: arrays of objects, filtering, reusable components, and passing callbacks as props.
- Try adding an exercise to `data/exercises.js` and include it in a progression.

## Phase 8: Programs and timers

- Added original beginner, intermediate, and skill routines with suggested sets and holds.
- Starting a routine opens the workout form with its first exercise selected; the full routine stays available for quick logging.
- Added a custom routine builder that saves to the shared storage module.
- Added rest, countdown, hold, and EMOM timers with pause, resume, and reset controls.
- Run `npm run dev`; start a routine, save a custom routine, and try each timer mode.
- Concepts: reusable components, state, effects, timestamps, and saved arrays.
- Try adding another built-in routine to `BUILT_IN_ROUTINES` in `data/programs.js`.

## Phase 9: Home dashboard

- Replaced the static landing view with a daily overview of workouts, habits, nutrition, and water.
- Added lifetime workout totals, best workout streak, and personal records set this month.
- Added quick actions to open the related tracker or start a workout.
- Dashboard summaries refresh when you return to Home and read data through the shared storage module.
- Run `npm run dev`; log a habit, meal, and workout, then return Home to see the totals update.
- Concepts: derived values, array filtering/reducing, and refreshing data when a view becomes active.
- Try adding another quick action in `src/Dashboard.jsx`.
