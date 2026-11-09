# CaliTrack

A free, mobile-first calisthenics tracker. CaliTrack is being built in small
phases with plain HTML, CSS, and JavaScript.

## What works now

- Five-tab navigation: Home, Workouts, Habits, Diet, and Library.
- Responsive slate-and-cobalt theme with automatic light and dark modes.
- Browser-only data storage helpers and date utilities.
- Workout logger with automatic date and time, reps or hold seconds, notes, recent exercises, and grouped history.
- Edit and delete saved workouts.
- Weekly workout, rep, and streak summaries; exercise records and progress charts.
- Body-weight logging and a weight-trend chart.

## Run locally

1. Open this folder in Visual Studio Code.
2. Start a local server. If Python is installed, open the VS Code terminal and run:

   ```powershell
   py -m http.server 8000
   ```

3. Open `http://localhost:8000` in your browser.
4. Use the bottom navigation to switch tabs. To view browser errors, open Developer
   Tools with `F12` and select the **Console** tab.
5. Stop the local server with `Ctrl+C` in the terminal.

## Publish with GitHub Pages

The Git repository is already connected to GitHub. After committing your changes,
push the branch with `git push`. In the repository's GitHub settings, open
**Pages**, choose the `main` branch and `/ (root)` folder, then save. GitHub will
show the published URL on that page.

## Build progress

- [x] Phase 1: Setup and foundations
- [x] Phase 2: Storage layer
- [x] Phase 3: Workout logger
- [x] Phase 4: Progress tracking and charts
- [ ] Phase 5: Habit tracker
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
