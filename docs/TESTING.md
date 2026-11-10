# CaliTrack manual test checklist

Use a fresh browser profile or sample data when possible. Before testing import,
reset, or destructive actions against real data, export a backup in **Settings**.
The app does not upload data; browser storage belongs to the current site origin.

## Run locally

```powershell
npm ci
npm run build
npm run preview
```

Open the preview URL from Vite. Use `F12` to check the browser Console and
Application/Storage panels. The build should complete without errors.

## Feature checklist

### Phase 1 — App shell and navigation

- [ ] Open each bottom-navigation tab and confirm only its selected panel is shown.
- [ ] Use Tab/Shift+Tab and arrow/Home/End keys to navigate tabs; confirm visible focus.
- [ ] Check the empty dashboard on a new profile and follow each quick action.
- [ ] Check the bottom navigation and page content at 320px, 375px, 424px, tablet, and desktop widths.

### Phase 2 — Storage

- [ ] Add sample data, refresh, and confirm the records remain.
- [ ] In a disposable profile, corrupt one stored JSON value and confirm the relevant tab shows a readable error instead of crashing.
- [ ] Remove a stored key and confirm its normal empty state appears.
- [ ] Confirm saves and loads use `js/storage.js`.

### Phase 3 — Workouts

- [ ] Open the logger and try to save without an exercise or set values; confirm inline validation.
- [ ] Log a reps exercise and a hold exercise with notes; confirm date/time are filled automatically.
- [ ] Add and remove sets; confirm the final set cannot be removed.
- [ ] Edit and delete a workout; cancel a delete confirmation once and confirm it remains.
- [ ] Use a recent exercise and a library exercise to open the logger with the exercise selected.
- [ ] Refresh and confirm workout history and personal-record badges remain correct.

### Phase 4 — Progress

- [ ] Check weekly workout, reps, streak, and PR summaries against the sample log.
- [ ] Open an exercise chart and confirm its series and labels match the selected exercise.
- [ ] Log body weight and confirm the weight trend chart updates.
- [ ] Switch metric/imperial units and confirm displayed weights convert while saved values remain in kilograms.
- [ ] With Chart.js unavailable, confirm chart areas explain the limitation without blocking tracking.

### Phase 5 — Habits

- [ ] Add a habit; complete and uncomplete it today.
- [ ] Confirm streak and the 7-day and 30-day grids update.
- [ ] Rename a habit; archive it; restore it; then permanently delete a disposable habit and confirm the prompt.
- [ ] Refresh and confirm habit records and checks persist.

### Phase 6 — Diet

- [ ] Try an empty name and negative or missing nutrition values; confirm an inline error.
- [ ] Add a meal, save it as a favorite, and quick-add the favorite; confirm daily calories and macros.
- [ ] Delete a disposable meal and confirm totals update.
- [ ] Add and subtract water in 250 ml steps; confirm the counter cannot go below zero.
- [ ] Change nutrition goals and confirm the diet view and Home dashboard use the new values.
- [ ] Open the weekly chart and compare the bars with logged meals.

### Phase 7 — Exercise library

- [ ] Search by exercise name and filter each category.
- [ ] Open guides and review steps, cues, common mistakes, and tutorial links.
- [ ] Open progression trees and use a movement's Log action.
- [ ] Confirm a no-results search has a useful empty state.

### Phase 8 — Programs and timers

- [ ] Start a built-in routine and confirm its first movement is selected in the logger.
- [ ] Create a custom routine with at least one movement, refresh, and confirm it persists.
- [ ] Delete a disposable custom routine.
- [ ] Test Rest, Countdown, Hold, and EMOM timers, including pause, resume, and reset.
- [ ] Try invalid timer values and confirm they are rejected with an inline message.

### Phase 9 — Home dashboard

- [ ] Log sample workouts, habits, meals, and water, then confirm today's cards reflect them.
- [ ] Confirm lifetime workout, rep, streak, and monthly PR summaries match the sample records.
- [ ] Follow dashboard cards and quick actions to their matching tabs.

### Phase 10 — Settings and backup

- [ ] Change theme, units, and each goal; refresh and confirm preferences persist across tabs.
- [ ] Export all data and check the downloaded JSON contains the saved groups.
- [ ] Import a valid backup in a disposable profile and confirm all groups are restored.
- [ ] Try invalid JSON, an unsupported backup version, invalid field values, and a file over 5 MB; confirm clear errors and that existing data is not replaced.
- [ ] Test reset only after exporting a backup; cancel once, then confirm reset in a disposable profile.
- [ ] Confirm the reset clears saved records and restores default settings.

### Phase 11 — PWA and offline

- [ ] Serve the production build over localhost or HTTPS; confirm the manifest and icon load and the browser offers installation.
- [ ] Open once online; in DevTools confirm the service worker is active and the `calitrack-v1` cache contains the app shell and static assets.
- [ ] Go offline and reload; confirm the app opens, saved tracking data remains available, and the offline notice appears.
- [ ] Confirm Charts explain when Chart.js is unavailable offline.
- [ ] Increment `CACHE_VERSION`, deploy an update, and confirm the new worker replaces the old cache.

### Phase 12 — Release checks

- [ ] Run `npm ci` and `npm run build` successfully.
- [ ] Check browser Console for application errors across all tabs.
- [ ] Check form labels, keyboard focus, touch targets, text contrast, and the reduced-motion preference.
- [ ] Run Lighthouse on the deployed HTTPS page and record Performance, Accessibility, Best Practices, SEO, and PWA results below.
- [ ] Confirm the GitHub Actions Pages deployment succeeds and the published URL loads the latest version.

## Verification record

- Latest browser smoke run (local development page): all seven tabs opened; no horizontal overflow at 320, 375, 424, 768, or 1280 px; arrow/Home/End tab navigation worked. Workout validation and logging, habit completion, meal totals/favorite selection, water increment/decrement, exercise search/filter/no-results and direct logging, built-in/custom routines, timer completion, settings persistence, backup import/error/reset/export feedback, corrupt-storage messaging, and offline app loading were exercised. Temporary records and settings were restored.
- Browser errors: no uncaught application page errors. The offline simulation also produced Vite HMR WebSocket errors, which are development-server noise; offline/PWA verification still needs to be repeated against a production preview.
- Build and dependencies: an earlier production build passed with Vite 8.3.7. The latest `npm run build` could not run because `vite` is unavailable; `npm ls` also reports missing React dependencies and an invalid Vite installation. A previous `npm ci` was blocked by `EPERM` while unlinking a native Vite binary in `node_modules`, so it was not retried. A clean install and current production build remain unverified.
- Backup export: the app displayed its successful-download status. The browser automation did not capture the generated file, so the downloaded JSON contents were not independently checked.
- Lighthouse: not run; no scores are claimed. Run it in Chrome DevTools on the deployed HTTPS URL and record scores here.
- GitHub Pages: local `main` is eight commits ahead of remote `main`; the deployment commit has not been pushed. The Actions integration reports no workflows or runs for the remote repository, and `https://ved09072010.github.io/CaliTrack/` returns HTTP 404. After pushing, confirm **Settings → Pages → Build and deployment → Source** is **GitHub Actions**, then verify a successful workflow and the published URL.
