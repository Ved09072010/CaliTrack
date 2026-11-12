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
- [ ] Check the empty dashboard on a new profile; load sample data or choose Start fresh and confirm the prompt does not return.
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
- [ ] In offline mode, confirm bundled Chart.js renders charts without a CDN request.

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
- [ ] Switch to Skill tree and verify all five branch chips and their progress counts.
- [ ] Confirm locked, available, in-progress, and mastered nodes have distinct shapes and text labels.
- [ ] Complete a goal in one workout session and confirm its node masters only after enough qualifying sets.
- [ ] Confirm a two-prerequisite skill stays locked until both prerequisite nodes are mastered.
- [ ] Open a node, follow a prerequisite, mark mastery manually, and use Log this to preselect the exercise.
- [ ] Confirm a newly mastered node shows New until opened and that an unlock toast appears after logging.
- [ ] Verify the 90-node skill tree (18 per branch across Push, Pull, Legs, Core, Skills).
- [ ] Verify XP calculations match exact formulas (mastery tiers, workout days, PRs).
- [ ] Verify overall and branch level calculations.
- [ ] Verify rank thresholds and rank-up celebrations.
- [ ] Verify all 29 milestone badges unlock correctly and show earned vs locked states.
- [ ] Verify Android debug APK build via Gradle.
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
- [ ] Set weekly workout goal to a non-default number and confirm the Home ring uses it.
- [ ] Set Theme to System, switch the browser's color preference, and confirm the app and charts follow it.
- [ ] Export all data and check the downloaded JSON contains the saved groups.
- [ ] Confirm `skillMastery` includes manual mastery and opened-node IDs in the backup.
- [ ] Import a valid backup in a disposable profile and confirm all groups are restored.
- [ ] Import a legacy backup without `skillMastery` and confirm empty skill progress is supplied.
- [ ] Try invalid JSON, an unsupported backup version, invalid field values, and a file over 5 MB; confirm clear errors and that existing data is not replaced.
- [ ] Test reset only after exporting a backup; cancel once, then confirm reset in a disposable profile.
- [ ] Confirm the reset clears saved records and restores default settings.
- [ ] Confirm reset removes `skillMastery`; removing demo data must leave manual skill mastery intact.
- [ ] Load and remove demo data; confirm the real records, theme, and goals are unchanged.
- [ ] Export and restore a backup containing demo records, then remove the restored demo data.
- [ ] Reload demo data in a clean profile twice and compare the generated records for determinism.

### Phase 11 — PWA and offline

- [ ] Serve the production build over localhost or HTTPS; confirm the manifest and icon load and the browser offers installation.
- [ ] Open once online; in DevTools confirm the service worker is active and its cache contains the app shell, hashed JS/CSS, manifest, and PNG icons.
- [ ] Go offline and reload; confirm the app opens, saved tracking data remains available, and the offline notice appears.
- [ ] Confirm page navigation is network-first with a cache fallback and hashed JS/CSS are cache-first.
- [ ] Deploy an updated hashed build and confirm the service worker picks up the new page and assets.

### Phase 12 — Release checks

- [ ] Run `npm ci` and `npm run build` successfully.
- [ ] Check browser Console for application errors across all tabs.
- [ ] Check form labels, keyboard focus, touch targets, text contrast, and the reduced-motion preference.
- [ ] Run Lighthouse on the deployed HTTPS page and record Performance, Accessibility, Best Practices, SEO, and PWA results below.
- [ ] Confirm the GitHub Actions Pages deployment succeeds and the published URL loads the latest version.

## Verification record

- Skill tree unit script: `node scripts/test-skill-tree.js` passed for all four states, multi-prerequisite unlocks, seconds/reps goals, exercise-name matching, manual overrides, and next-up selection.
- Demo tree/backup assertions passed: 32 nodes, Push and Legs examples mastered, Pull and Core examples in progress, Skills remain locked, and manual mastery survives demo clearing and backup restoration.
- Tree integrity assertions passed: all 32 IDs are unique, each branch has an available root, and exercise and prerequisite references resolve.
- Production build passed after the Library skill-tree UI and backup changes.
- Earlier browser smoke tests covered existing screens before this Skill Tree change; they do not verify the new UI.
- Browser verification: Vite dev server started at `http://127.0.0.1:5174/`, but both the integrated browser and shell timed out connecting to it. Screenshots at 390×844, light/dark appearance, console inspection, and live offline behavior remain unverified in this environment.
- Production build: `npm run build` passed with Vite 8.3.7. Vite reports a 517 kB JavaScript chunk-size advisory; the build completed successfully.
- Demo data checks: direct assertions passed for deterministic generation, safe merge and removal, idempotent loading, preservation of real records/goals/theme, daily nutrition ranges, backup validation/restore followed by demo removal, and unset-goal defaults.
- Settings checks: current streak and weekly-goal normalization assertions passed.
- PWA assets: verified the PNG signatures and dimensions: 192×192, 512×512, and 180×180.
- Lighthouse: not run; no scores are claimed. Run it in Chrome DevTools on the deployed HTTPS URL and record scores here.
- GitHub Pages: deployment was previously reported as failing because Pages was not enabled/configured. These changes have not been pushed; after pushing, select **Settings → Pages → Build and deployment → Source: GitHub Actions**, then verify the workflow and published URL.
