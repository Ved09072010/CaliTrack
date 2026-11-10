import assert from "node:assert/strict";
import { getWorkoutDaysThisWeek } from "../src/dashboardStats.js";

const workouts = [
  { date: "2026-11-09" },
  { date: "2026-11-09" },
  { date: "2026-11-10" },
  { date: "2026-11-15" },
  { date: "2026-11-08" },
  { date: "2026-11-16" },
  { date: "not-a-date" },
];

assert.equal(getWorkoutDaysThisWeek(workouts, "2026-11-10"), 3);
assert.equal(getWorkoutDaysThisWeek([{ date: "2026-11-02" }], "2026-11-08"), 1);
console.log("Dashboard weekly workout-day tests passed.");
