# CaliTrack

A free, mobile-first calisthenics tracker built with React, Vite, and plain CSS.
Workout and body-weight records stay in this browser's local storage.

## What works now

- Five-tab navigation: Home, Workouts, Habits, Diet, and Library.
- Responsive dark slate-and-cobalt theme with five-tab navigation.
- React UI, with all saved data accessed through the shared storage module.
- Workout logger automatically records the date and time, with reps or hold seconds, notes, recent exercises, and grouped history.
- Edit and delete saved workouts.
- Weekly workout, rep, and streak summaries; exercise records and progress charts.
- Body-weight logging and a weight-trend chart.
- Habits with daily check-offs, streaks, and 7-day/30-day completion grids.
- Habit rename, archive/restore, and permanent delete.

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
- [ ] Phase 6: Diet tracker
- [ ] Phase 7: Exercise library and progressions
- [ ] Phase 8: Workout programs and timers
- [ ] Phase 9: Home dashboard
- [ ] Phase 10: Settings, backup, and polish
- [ ] Phase 11: PWA and offline
- [ ] Phase 12: Testing and deployment

## Data stays on this device

Saved workouts live in this browser's local storage. Clearing the browser's site
data will remove them. Do not use private browsing if you want records to persist.
