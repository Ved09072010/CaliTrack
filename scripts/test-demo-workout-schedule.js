import assert from "node:assert/strict";
import { loadDemoData } from "../src/demo.js";
import { todayString } from "../js/utils.js";

const values = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  },
};

assert.equal(loadDemoData(), true);
const workouts = JSON.parse(values.get("workoutLog"));
const today = new Date(`${todayString()}T12:00:00`);
const relativeDays = (date) => {
  const parsed = new Date(`${date}T12:00:00`);
  return Math.round((today - parsed) / 86400000);
};
const daysByWeek = new Map();
workouts.forEach((workout) => {
  const daysAgo = relativeDays(workout.date);
  const week = Math.floor(daysAgo / 7);
  if (!daysByWeek.has(week)) daysByWeek.set(week, new Set());
  daysByWeek.get(week).add(daysAgo);
});

for (let week = 0; week < 12; week += 1) {
  assert.equal(daysByWeek.get(week).size, week === 5 ? 2 : 4, `unexpected training days in demo week ${week}`);
}

const days = [...new Set(workouts.map((workout) => workout.date))].sort();
let longestStreak = 0;
let currentStreak = 0;
let previous = null;
days.forEach((day) => {
  const date = new Date(`${day}T00:00:00Z`);
  const consecutive = previous && date - previous === 86400000;
  currentStreak = consecutive ? currentStreak + 1 : 1;
  longestStreak = Math.max(longestStreak, currentStreak);
  previous = date;
});
assert.ok(longestStreak < 6, `demo workouts ran ${longestStreak} consecutive days`);
console.log("Demo workout schedule tests passed: about four days per week, one lighter week, and regular rest days.");
