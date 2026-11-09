import { formatDate, todayString } from "../js/utils.js";
import { load } from "../js/storage.js";
import { EXERCISES as EXERCISE_GUIDES } from "../data/exercises.js";

export const EXERCISES = [...new Set([
  ...EXERCISE_GUIDES.map((exercise) => exercise.name),
  "Dips",
  "Handstand practice",
])];

export function readList(key) {
  const value = load(key, []);
  if (!Array.isArray(value)) {
    throw new Error(`Saved ${key} data must be a list.`);
  }
  return value;
}

export function getWeeklyStats(workouts) {
  const today = todayString();
  const monday = new Date(`${today}T12:00:00`);
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  const weekStart = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
  const thisWeek = workouts.filter((workout) => workout.date >= weekStart && workout.date <= today);
  const reps = thisWeek.reduce(
    (total, workout) => total + workout.sets.reduce((sum, set) => sum + set.reps, 0),
    0,
  );
  const days = new Set(workouts.map((workout) => workout.date));
  const cursor = new Date(`${today}T12:00:00`);
  if (!days.has(today)) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  const keyFor = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  while (days.has(keyFor(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { count: thisWeek.length, reps, streak };
}

export { formatDate };
