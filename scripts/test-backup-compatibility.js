import assert from "node:assert/strict";
import { APP_DATA_KEYS, normalizeSkillMastery, validateAppData } from "../src/appData.js";
import { DEFAULT_SETTINGS } from "../src/settingsData.js";
import { EXERCISES } from "../data/exercises.js";
import { SKILL_TREE } from "../data/skillTree.js";
import { loadDemoData, clearDemoData } from "../src/demo.js";
import { load, replaceMany } from "../js/storage.js";
import { getProgress, getBadges } from "../src/progression.js";

// Mock localStorage for node environment
const storageStore = {};
global.window = {
  localStorage: {
    getItem: (k) => storageStore[k] || null,
    setItem: (k, v) => { storageStore[k] = String(v); },
    removeItem: (k) => { delete storageStore[k]; },
    clear: () => { Object.keys(storageStore).forEach((k) => delete storageStore[k]); },
  },
};

console.log("Running backup compatibility and data integrity tests...");

// 1. Test legacy skillMastery normalization
// Legacy format: { mastered: ["wall-push-up"], seen: ["wall-push-up"] } (no badgesSeen or rankSeen)
const legacyMastery = { mastered: ["wall-push-up"], seen: ["wall-push-up"] };
const normalizedLegacy = normalizeSkillMastery(legacyMastery);
assert.deepEqual(normalizedLegacy.mastered, ["wall-push-up"]);
assert.deepEqual(normalizedLegacy.seen, ["wall-push-up"]);
assert.equal(normalizedLegacy.initialized, false);
assert.deepEqual(normalizedLegacy.badgesSeen, []);
assert.equal(normalizedLegacy.rankSeen, "Rookie");

// Modern format with all progression fields
const modernMastery = {
  mastered: ["wall-push-up", "incline-push-up"],
  seen: ["wall-push-up", "incline-push-up", "knee-push-up"],
  initialized: true,
  badgesSeen: ["first-skill", "rank-trainee"],
  rankSeen: "Trainee",
};
const normalizedModern = normalizeSkillMastery(modernMastery);
assert.deepEqual(normalizedModern.mastered, ["wall-push-up", "incline-push-up"]);
assert.equal(normalizedModern.initialized, true);
assert.deepEqual(normalizedModern.badgesSeen, ["first-skill", "rank-trainee"]);
assert.equal(normalizedModern.rankSeen, "Trainee");

// Invalid mastery checks
assert.throws(() => normalizeSkillMastery({ mastered: ["non-existent-skill-id"], seen: [] }), /valid mastered and seen/);
assert.throws(() => normalizeSkillMastery({ mastered: [], seen: [], badgesSeen: ["fake-badge"] }), /invalid badge or rank/);
assert.throws(() => normalizeSkillMastery({ mastered: [], seen: [], rankSeen: "SupremeGrandmaster" }), /invalid badge or rank/);

// 2. Test validateAppData with minimal valid legacy backup
const validLegacyBackup = {
  workoutLog: [
    {
      id: "w_legacy_1",
      date: "2026-11-01",
      exercise: "Push-up",
      sets: [{ reps: 15, seconds: 0, weight: 0 }],
      notes: "Legacy workout",
    },
  ],
  bodyStats: [{ date: "2026-11-01", weightKg: 70 }],
  habits: [{ id: "h1", name: "Drink water", createdDate: "2026-11-01" }],
  habitChecks: [{ habitId: "h1", date: "2026-11-01", done: true }],
  meals: [{ id: "m1", date: "2026-11-01", name: "Oatmeal", calories: 350, protein: 15, carbs: 55, fat: 5, mealType: "Breakfast" }],
  favoriteFoods: [{ id: "f1", name: "Oatmeal", calories: 350, protein: 15, carbs: 55, fat: 5, mealType: "Breakfast" }],
  water: [{ date: "2026-11-01", ml: 2000 }],
  customRoutines: [
    {
      id: "r1",
      name: "Push day",
      level: "Beginner",
      description: "Basic push routine",
      exercises: [{ name: "Push-up", target: "3x10" }],
    },
  ],
  settings: DEFAULT_SETTINGS,
  // skillMastery omitted (optional legacy field)
};

const validated = validateAppData(validLegacyBackup);
assert.ok(validated.workoutLog.length === 1);
assert.equal(validated.skillMastery.rankSeen, "Rookie");
assert.equal(validated.skillMastery.initialized, false);
assert.deepEqual(validated.skillMastery.mastered, []);

// 3. Test validateAppData missing required keys
const missingKeysData = { ...validLegacyBackup };
delete missingKeysData.workoutLog;
assert.throws(() => validateAppData(missingKeysData), /Backup is missing data: workoutLog/);

// 4. Test validateAppData with invalid workout set (negative or 0 reps/seconds)
const invalidWorkoutBackup = {
  ...validLegacyBackup,
  workoutLog: [
    {
      id: "bad_w",
      date: "2026-11-01",
      exercise: "Push-up",
      sets: [{ reps: 0, seconds: 0, weight: 0 }],
    },
  ],
};
assert.throws(() => validateAppData(invalidWorkoutBackup), /Backup contains an invalid workout entry/);

// 5. Test Demo Data Load, Progression, and Deterministic Removal
storageStore.settings = JSON.stringify(DEFAULT_SETTINGS);
const loaded = loadDemoData();
assert.equal(loaded, true, "Demo data should load cleanly on empty store");

const workouts = load("workoutLog", []);
const mastery = load("skillMastery", { mastered: [], seen: [] });
assert.ok(workouts.length >= 50, "Demo data should contain at least 50 workouts");

const demoProg = getProgress(workouts, mastery);
assert.equal(demoProg.rank, "Athlete", "Demo profile should be Athlete rank");
assert.equal(demoProg.level, 12, "Demo profile should be Level 12");
assert.ok(demoProg.totalXP >= 2400 && demoProg.totalXP <= 2800, "Demo profile XP should be near Adept threshold");

const demoBadges = getBadges(workouts, mastery, demoProg);
const earnedBadges = demoBadges.filter((b) => b.earned);
assert.ok(earnedBadges.length >= 10, "Demo profile should have at least 10 earned badges");

// Verify demo data cannot be loaded twice
const reloadAttempt = loadDemoData();
assert.equal(reloadAttempt, false, "Duplicate demo data loading should return false");

// Verify clearDemoData removes all demo records cleanly
const cleared = clearDemoData();
assert.equal(cleared, true, "clearDemoData should return true");
assert.equal(load("workoutLog", []).length, 0, "No workout logs should remain after clearing demo data");
assert.equal(load("habits", []).length, 0, "No habits should remain after clearing demo data");
assert.equal(load("meals", []).length, 0, "No meals should remain after clearing demo data");

// 6. Test User Data Preservation during clearDemoData
// If user has a real workout, clearDemoData must NOT remove the user workout
const realUserWorkout = {
  id: "user_real_workout_123",
  date: "2026-11-12",
  exercise: "Push-up",
  sets: [{ reps: 20, seconds: 0, weight: 0 }],
};
replaceMany({ workoutLog: [realUserWorkout] });
loadDemoData();
assert.equal(load("workoutLog", []).some((w) => w.id === "user_real_workout_123"), true);
clearDemoData();
const preserved = load("workoutLog", []);
assert.equal(preserved.length, 1, "Only user workout should remain");
assert.equal(preserved[0].id, "user_real_workout_123", "User workout ID must match exactly");

console.log("All backup compatibility and data integrity tests passed successfully.");
