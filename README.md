# CaliTrack

A free, mobile-first calisthenics tracker built with React, Vite, and plain CSS.
Your records stay in this browser's local storage.

## What works now

- Seven-tab navigation: Home, Workouts, Habits, Diet, Library, Programs, and Settings.
- Responsive dark slate-and-cobalt theme with mobile-friendly navigation.
- React UI, with all saved data accessed through the shared storage module.
- Workout logger automatically records the date and time, with reps or hold seconds, notes, recent exercises, and grouped history.
- Edit and delete saved workouts.
- Weekly workout, rep, and streak summaries; exercise records and progress charts.
- Body-weight logging and a weight-trend chart.
- Habits with daily check-offs, streaks, and 7-day/30-day completion grids.
- Habit rename, archive/restore, and permanent delete.
- Meal logging with calories and macros, saved food favorites, and meal history.
- Daily calorie, protein, and water goals with progress bars and one-tap water logging.
- Weekly calories and protein chart.
- Searchable exercise library with 35+ movement guides, form cues, and free YouTube tutorial search links.
- Push, pull, legs, core, and skills filters with gradual progressions and unlock suggestions.
- Log an exercise directly from its guide into the workout form.
- Beginner, intermediate, and skill routines; starting one opens the logger with the first exercise preselected.
- Custom routines saved on-device, with one-tap logging for each planned movement.
- Rest, countdown, hold, and EMOM timers with pause/resume controls.
- Home dashboard with today's workout, habit, meal, and hydration totals plus workout streaks, lifetime workouts, and monthly PRs.
- Quick actions to log workouts, check habits, log meals, browse exercises, or open programs.
- Settings for dark/light theme, metric/imperial display, and nutrition goals.
- Downloadable JSON backup, validated backup restore, and a confirmed reset for all saved app data.

## Run locally

1. Install [Node.js](https://nodejs.org/).
2. Open this folder in Visual Studio Code and run these commands in the terminal:

   ```powershell
   npm install
   npm run dev
   ```

3. Open the local URL printed by Vite.
4. Use the bottom navigation to switch tabs. To view browser errors, open Developer
   Tools with `F12` and select the **Console** tab.
5. Stop the development server with `Ctrl+C` in the terminal.

To make a production build, run `npm run build`. Vite writes the ready-to-publish
site to the `dist` folder. Preview it locally with `npm run preview`.

## Publish with GitHub Pages

Build the site with `npm run build`, then publish the contents of `dist` using
GitHub Pages. For a local check first, run `npm run preview`.

## Build progress

- [x] Phase 1: Setup and foundations
- [x] Phase 2: Storage layer
- [x] Phase 3: Workout logger
- [x] Phase 4: Progress tracking and charts
- [x] Phase 5: Habit tracker
- [x] Phase 6: Diet tracker
- [x] Phase 7: Exercise library and progressions
- [x] Phase 8: Workout programs and timers
- [x] Phase 9: Home dashboard
- [x] Phase 10: Settings, backup, and polish
- [ ] Phase 11: PWA and offline
- [ ] Phase 12: Testing and deployment

## Data stays on this device

Saved app data lives in this browser's local storage. Clearing the browser's site
data will remove it. Do not use private browsing if you want records to persist.
