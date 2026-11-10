import { DEFAULT_SETTINGS } from "./settingsData.js";
import { EXERCISES } from "../data/exercises.js";
import { SKILL_TREE } from "../data/skillTree.js";

export const APP_DATA_KEYS = [
  "workoutLog",
  "bodyStats",
  "habits",
  "habitChecks",
  "meals",
  "favoriteFoods",
  "water",
  "settings",
  "customRoutines",
  "skillMastery",
];

const SKILL_NODE_IDS = new Set(SKILL_TREE.map((node) => node.id));
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function validDate(value) {
  return typeof value === "string"
    && DATE_PATTERN.test(value)
    && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime())
    && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

function validFood(item, needsId) {
  return item && typeof item.name === "string" && item.name.trim()
    && MEAL_TYPES.includes(item.mealType)
    && (!needsId || typeof item.id === "string")
    && ["calories", "protein", "carbs", "fat"].every(
      (key) => Number.isFinite(item[key]) && item[key] >= 0,
    );
}

export function normalizeSettings(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Settings must be a JSON object.");
  }
  const settings = { ...DEFAULT_SETTINGS, ...value };
  if (!["system", "dark", "light"].includes(settings.theme)
    || !["metric", "imperial"].includes(settings.units)
    || ["calorieGoal", "proteinGoal", "waterGoal", "weeklyWorkoutGoal"].some(
      (key) => !Number.isFinite(settings[key]) || settings[key] <= 0,
    )) {
    throw new Error("Theme, units, or daily goals are invalid.");
  }
  return settings;
}

export function normalizeSkillMastery(value = { mastered: [], seen: [], initialized: false }) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || !Array.isArray(value.mastered) || !Array.isArray(value.seen)
    || (value.initialized !== undefined && typeof value.initialized !== "boolean")
    || [...value.mastered, ...value.seen].some((id) => typeof id !== "string" || !SKILL_NODE_IDS.has(id))) {
    throw new Error("Skill mastery data must contain valid mastered and seen skill IDs.");
  }
  return {
    mastered: [...new Set(value.mastered)],
    seen: [...new Set(value.seen)],
    initialized: value.initialized === true,
  };
}

export function validateAppData(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Backup data must be a JSON object.");
  }
  const missingKeys = APP_DATA_KEYS.filter((key) => key !== "skillMastery" && !Object.hasOwn(value, key));
  if (missingKeys.length) {
    throw new Error(`Backup is missing data: ${missingKeys.join(", ")}.`);
  }
  if (APP_DATA_KEYS.some((key) => key !== "settings" && key !== "skillMastery" && !Array.isArray(value[key]))) {
    throw new Error("Every saved record group in a backup must be a list.");
  }
  const settings = normalizeSettings(value.settings);
  const data = { ...value, settings, skillMastery: normalizeSkillMastery(value.skillMastery) };

  if (data.workoutLog.some((item) => (
    !item
    || typeof item.id !== "string"
    || !validDate(item.date)
    || typeof item.exercise !== "string"
    || !item.exercise.trim()
    || !Array.isArray(item.sets)
    || item.sets.length === 0
    || item.sets.some((set) => (
      !set
      || !Number.isFinite(set.reps)
      || set.reps < 0
      || !Number.isFinite(set.seconds)
      || set.seconds < 0
      || !Number.isFinite(set.weight)
      || set.weight < 0
      || (set.reps === 0 && set.seconds === 0)
    ))
    || (item.notes !== undefined && typeof item.notes !== "string")
  ))) throw new Error("Backup contains an invalid workout entry.");

  if (data.bodyStats.some((item) => !item || !validDate(item.date) || !Number.isFinite(item.weightKg) || item.weightKg <= 0)) {
    throw new Error("Backup contains an invalid body-weight entry.");
  }
  if (data.habits.some((item) => (
    !item
    || typeof item.id !== "string"
    || typeof item.name !== "string"
    || !item.name.trim()
    || !validDate(item.createdDate)
    || (item.archived !== undefined && typeof item.archived !== "boolean")
  ))) throw new Error("Backup contains an invalid habit.");
  if (data.habitChecks.some((item) => (
    !item || typeof item.habitId !== "string" || !validDate(item.date) || typeof item.done !== "boolean"
  ))) throw new Error("Backup contains an invalid habit check.");
  if (data.meals.some((item) => !validFood(item, true) || !validDate(item.date))) {
    throw new Error("Backup contains an invalid meal.");
  }
  if (data.favoriteFoods.some((item) => !validFood(item, true))) {
    throw new Error("Backup contains an invalid favorite food.");
  }
  if (data.water.some((item) => !item || !validDate(item.date) || !Number.isFinite(item.ml) || item.ml < 0)) {
    throw new Error("Backup contains an invalid water entry.");
  }
  if (data.customRoutines.some((routine) => (
    !routine
    || typeof routine.id !== "string"
    || typeof routine.name !== "string"
    || !routine.name.trim()
    || typeof routine.level !== "string"
    || typeof routine.description !== "string"
    || !Array.isArray(routine.exercises)
    || routine.exercises.length === 0
    || routine.exercises.some((item) => (
      !item
      || !EXERCISES.some((exercise) => exercise.name === item.name)
      || typeof item.target !== "string"
      || !item.target.trim()
    ))
  ))) throw new Error("Backup contains an invalid custom routine.");

  return Object.fromEntries(APP_DATA_KEYS.map((key) => [key, data[key]]));
}

export function validateBackup(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || value.version !== 1) {
    throw new Error("This backup format is not supported.");
  }
  return validateAppData(value.data);
}
