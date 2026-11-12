# CaliTrack

A free, mobile-first calisthenics tracker built with React, Vite, and plain CSS.
Your records stay in this browser's local storage.

## What works now

- Five-tab navigation: Home, Workouts, Habits, Diet, and Library. Programs and timers are inside Workouts; Settings opens from Home.
- Warm cream-and-charcoal theme with section accents, glass surfaces, and a system theme default.
- React UI, with all saved data accessed through the shared storage module.
- Workout logger automatically records the date and time, with reps or hold seconds, notes, recent exercises, and grouped history.
- Edit and delete saved workouts.
- Weekly workout goal, current streak, exercise records, and progress charts.
- Body-weight logging and a weight-trend chart; Chart.js is bundled for offline use.
- Habits with daily check-offs, streaks, and 7-day/30-day completion grids.
- Habit rename, archive/restore, and permanent delete.
- Meal logging with calories and macros, saved food favorites, and meal history.
- Daily calorie, protein, and water goals with progress bars and one-tap water logging.
- Weekly calories and protein chart.
- Searchable exercise library with 35+ movement guides, form cues, and free YouTube tutorial search links.
- Expanded 90-node branching Skill Tree across Push (18), Pull (18), Legs (18), Core (18), and Skills (18), unlocked from logged sets or manual mastery.
- Comprehensive XP and progression system: transparently derived from skill tier masteries (T1: 40 XP to T6: 700 XP), workout consistency (10 XP/active day), and personal records (25 XP/PR). Never stored independently or duplicated.
- Progressive rank crests (Rookie through Legend) with mathematical level scaling (`floor(sqrt(XP / 20)) + 1`), rank progress tracking, and dedicated rank-up celebrations.
- 29 visual milestone badges across skills, branch completions, workout consistency, volume, variety, personal records, and ranks with earned and locked states.
- Progression paths remain available in the Skill Tree view; node sheets show goals, prerequisites, progress, XP rewards, and a direct Log action.
- Skill mastery, progression tracking (`badgesSeen`, `rankSeen`), and opened-node markers are fully backwards-compatible, included in backup/restore, and reset with the rest of app data.
- Android native build powered by Capacitor (`com.calitrack.app`), building into a standalone APK.
- Log an exercise directly from its guide into the workout form.
- Beginner, intermediate, and skill routines; starting one opens the logger with the first exercise preselected.
- Custom routines saved on-device, with one-tap logging for each planned movement.
- Rest, countdown, hold, and EMOM timers with pause/resume controls.
- Home dashboard with today's workout, habit, meal, and hydration totals plus workout streaks, lifetime workouts, and monthly PRs.
- Quick actions to log workouts, check habits, log meals, browse exercises, or open programs.
- Settings for system/light/dark theme, metric/imperial display, nutrition goals, and weekly workout goals.
- Downloadable JSON backup, validated backup restore, and a confirmed reset for all saved app data.
- Deterministic 12-week demo data that can be loaded and removed without touching real records.
- Installable PWA with PNG icons, offline app caching, and an offline status notice.

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
Run the test suite with:

```powershell
node scripts/test-skill-tree.js
node scripts/test-progression.js
node scripts/test-backup-compatibility.js
node scripts/test-dashboard-stats.js
node scripts/test-demo-workout-schedule.js
```

## Android build (Capacitor)

CaliTrack is configured for Android using Capacitor:

```powershell
# 1. Build web production bundle
npm run build

# 2. Sync web assets with native Android project
npx cap sync android

# 3. Compile standalone Android debug APK
cd android
.\gradlew.bat assembleDebug
```

The resulting APK is output to `android/app/build/outputs/apk/debug/app-debug.apk`.

## Install and use offline

On a supported browser, open the deployed HTTPS site and choose **Install app** or
**Add to Home Screen**. Open it once while online so the app files can be cached.
Workout, habit, meal, and settings data remain in this device's browser storage.
Chart.js is included in the app bundle, so charts do not need a network connection.

The service worker checks page navigations online first and falls back to the
cached app shell offline. Hashed JavaScript and CSS assets are cache-first; the
active build discovers and caches them during installation.

## Publish with GitHub Pages

The included GitHub Actions workflow builds `dist` and deploys it to GitHub Pages
when a commit is pushed to `main`. In the repository's **Settings → Pages**,
choose **GitHub Actions** as the build and deployment source once. Then push your
commit and wait for the **Deploy CaliTrack to GitHub Pages** workflow to finish.
For a local production check, run `npm run build` followed by `npm run preview`.

See [docs/TESTING.md](docs/TESTING.md) for the manual feature checklist, test
results, Lighthouse status, and current deployment status.

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
- [x] Phase 11: PWA and offline
- [ ] Phase 12: Testing and deployment (Pages deployment awaits push)

## Data stays on this device

Saved app data lives in this browser's local storage. Clearing the browser's site
data will remove it. Do not use private browsing if you want records to persist.
