import { load, replaceMany } from "../js/storage.js";
import { todayString } from "../js/utils.js";
import { normalizeSettings } from "./appData.js";
import { DEFAULT_SETTINGS } from "./settingsData.js";

const DEMO_PREFIX = "demo_";
const HABIT_PREFIX = "demo_habit_";
const DEMO_GOALS = { calorieGoal: 2200, proteinGoal: 110, waterGoal: 3000 };
const HABIT_NAMES = [
  "Drink water",
  "10-minute stretch",
  "Walk 8k steps",
  "Sleep before 11",
  "Read 10 pages",
];
const EXERCISES = [
  { name: "Push-up", base: 12, end: 22, mode: "reps" },
  { name: "Negative pull-up", base: 3, end: 8, mode: "reps" },
  { name: "Bodyweight squat", base: 15, end: 25, mode: "reps" },
  { name: "Dips", base: 5, end: 12, mode: "reps" },
  { name: "Plank", base: 40, end: 90, mode: "seconds" },
  { name: "Hanging knee raise", base: 6, end: 15, mode: "reps" },
  { name: "Pike push-up", base: 5, end: 12, mode: "reps" },
];
const SKILL_TREE_SESSIONS = [
  { exercise: "Wall push-up", daysAgo: 7, reps: [12, 12, 12] },
  { exercise: "Incline push-up", daysAgo: 5, reps: [10, 10, 10] },
  { exercise: "Bodyweight squat", daysAgo: 6, reps: [12, 12, 12] },
  { exercise: "Reverse lunge", daysAgo: 4, reps: [8, 8, 8] },
  { exercise: "Dead hang", daysAgo: 10, seconds: [20, 20, 20] },
  { exercise: "Scapular pull-up", daysAgo: 9, reps: [8, 8, 8] },
  { exercise: "Negative pull-up", daysAgo: 8, reps: [8, 7, 6] },
  { exercise: "Bird dog", daysAgo: 3, reps: [8, 6] },
];
const FOODS = [
  { name: "Greek yogurt oats", mealType: "Breakfast", calories: 430, protein: 28, carbs: 55, fat: 10 },
  { name: "Paneer lentil bowl", mealType: "Lunch", calories: 620, protein: 34, carbs: 68, fat: 20 },
  { name: "Tofu chickpea curry", mealType: "Dinner", calories: 690, protein: 32, carbs: 78, fat: 23 },
  { name: "Roasted chickpeas", mealType: "Snack", calories: 250, protein: 12, carbs: 32, fat: 8 },
];

function randomGenerator(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function dateAgo(daysAgo) {
  const date = new Date(`${todayString()}T12:00:00`);
  date.setDate(date.getDate() - daysAgo);
  return todayString(date);
}

function makeWorkoutRecords(random) {
  const records = [];
  const schedule = [1, 2, 4, 6];
  for (let week = 0; week < 12; week += 1) {
    const sessions = week === 5 ? [1, 5] : schedule;
    sessions.forEach((day, sessionIndex) => {
      const daysAgo = week * 7 + day;
      const exercise = EXERCISES[(week * 2 + sessionIndex * 3) % EXERCISES.length];
      const progress = week / 11;
      const peak = Math.round(exercise.end - (exercise.end - exercise.base) * progress);
      const variation = Math.floor(random() * 3) - 1;
      const best = Math.max(1, peak + variation);
      const setCount = 3 + Math.floor(random() * 2);
      const sets = Array.from({ length: setCount }, (_, index) => {
        const amount = Math.max(1, best - index * (exercise.mode === "seconds" ? 5 : 1));
        return {
          reps: exercise.mode === "reps" ? amount : 0,
          seconds: exercise.mode === "seconds" ? amount : 0,
          weight: 0,
        };
      });
      records.push({
        id: `${DEMO_PREFIX}workout_${week}_${sessionIndex}`,
        date: dateAgo(daysAgo),
        time: `${String(7 + sessionIndex * 3).padStart(2, "0")}:15`,
        exercise: exercise.name,
        sets,
        notes: (week + sessionIndex) % 5 === 0 ? "Smooth, controlled sets." : "",
      });
    });
  }
  const skillRecords = SKILL_TREE_SESSIONS.map((session, index) => ({
    id: `${DEMO_PREFIX}skill_workout_${index}`,
    date: dateAgo(session.daysAgo),
    time: "08:00",
    exercise: session.exercise,
    sets: (session.reps || session.seconds).map((value) => ({
      reps: session.reps ? value : 0,
      seconds: session.seconds ? value : 0,
      weight: 0,
    })),
    notes: "",
  }));
  return [...records, ...skillRecords];
}

function makeHabitRecords(random) {
  const habits = HABIT_NAMES.map((name, index) => ({
    id: `${HABIT_PREFIX}${index + 1}`,
    name,
    createdDate: dateAgo(83),
  }));
  const completionRates = [.9, .78, .68, .58, .5];
  const checks = [];
  for (let day = 0; day < 84; day += 1) {
    const date = dateAgo(day);
    habits.forEach((habit, index) => {
      const guaranteedStreak = index === 0 && day < 9;
      const completeToday = day !== 0 || index === 0 || index === 2;
      const done = completeToday && (guaranteedStreak || random() < completionRates[index]);
      checks.push({
        id: `${DEMO_PREFIX}check_${index}_${day}`,
        habitId: habit.id,
        date,
        done,
      });
    });
  }
  return { habits, checks };
}

function makeMealRecords(random) {
  const meals = [];
  const water = [];
  for (let day = 0; day < 84; day += 1) {
    const date = dateAgo(day);
    const dailyCalories = 1900 + Math.floor(random() * 501);
    const dailyProtein = 85 + Math.floor(random() * 36);
    const caloriesFactor = dailyCalories / FOODS.reduce((sum, food) => sum + food.calories, 0);
    const proteinFactor = dailyProtein / FOODS.reduce((sum, food) => sum + food.protein, 0);
    const types = day === 0 ? FOODS.slice(0, 2) : FOODS;
    types.forEach((food, index) => {
      const remainingMeals = day === 0 ? 2 : FOODS.length;
      const partialScale = day === 0 ? .48 : 1;
      meals.push({
        id: `${DEMO_PREFIX}meal_${day}_${index}`,
        date,
        mealType: food.mealType,
        name: food.name,
        calories: Math.round(food.calories * caloriesFactor * partialScale),
        protein: Math.round(food.protein * proteinFactor * partialScale),
        carbs: Math.round(food.carbs * caloriesFactor * partialScale),
        fat: Math.round(food.fat * caloriesFactor * partialScale),
      });
    });
    const ml = day === 0 ? 1500 : 1500 + Math.floor(random() * 1501);
    water.push({ id: `${DEMO_PREFIX}water_${day}`, date, ml });
  }
  return { meals, water };
}

function makeBodyStats(random) {
  return Array.from({ length: 12 }, (_, index) => {
    const weeksAgo = 11 - index;
    const noise = (random() - .5) * .3;
    return {
      id: `${DEMO_PREFIX}body_${index}`,
      date: dateAgo(weeksAgo * 7),
      weightKg: Number((72 - (1.5 * index / 11) + noise).toFixed(1)),
      notes: index === 0 || index === 6 ? "Weekly check-in." : "",
    };
  });
}

function hasDemoRecords(groups) {
  return Object.values(groups).some((value) => Array.isArray(value) && value.some((entry) => (
    typeof entry?.id === "string" && entry.id.startsWith(DEMO_PREFIX)
  )));
}

export function loadDemoData() {
  const savedSettings = load("settings", {});
  const settings = normalizeSettings(savedSettings);
  if (settings.demoLoaded || hasDemoRecords({
    workoutLog: load("workoutLog", []),
    bodyStats: load("bodyStats", []),
    habits: load("habits", []),
    habitChecks: load("habitChecks", []),
    meals: load("meals", []),
    favoriteFoods: load("favoriteFoods", []),
    water: load("water", []),
  })) return false;

  const random = randomGenerator(873421);
  const habitData = makeHabitRecords(random);
  const mealData = makeMealRecords(random);
  const favorites = FOODS.map((food, index) => ({ ...food, id: `${DEMO_PREFIX}favorite_${index}` }));
  const currentSettings = { ...DEFAULT_SETTINGS, ...settings, demoLoaded: true };
  ["calorieGoal", "proteinGoal", "waterGoal"].forEach((key) => {
    if (savedSettings[key] === undefined || savedSettings[key] === null) currentSettings[key] = DEMO_GOALS[key];
  });

  replaceMany({
    workoutLog: [...load("workoutLog", []), ...makeWorkoutRecords(random)],
    bodyStats: [...load("bodyStats", []), ...makeBodyStats(random)],
    habits: [...load("habits", []), ...habitData.habits],
    habitChecks: [...load("habitChecks", []), ...habitData.checks],
    meals: [...load("meals", []), ...mealData.meals],
    favoriteFoods: [...load("favoriteFoods", []), ...favorites],
    water: [...load("water", []), ...mealData.water],
    settings: currentSettings,
  });
  return true;
}

export function clearDemoData() {
  const settings = load("settings", DEFAULT_SETTINGS);
  replaceMany({
    workoutLog: load("workoutLog", []).filter((entry) => !entry.id?.startsWith(DEMO_PREFIX)),
    bodyStats: load("bodyStats", []).filter((entry) => !entry.id?.startsWith(DEMO_PREFIX)),
    habits: load("habits", []).filter((entry) => !entry.id?.startsWith(DEMO_PREFIX)),
    habitChecks: load("habitChecks", []).filter((entry) => (
      !entry.id?.startsWith(DEMO_PREFIX) && !entry.habitId?.startsWith(HABIT_PREFIX)
    )),
    meals: load("meals", []).filter((entry) => !entry.id?.startsWith(DEMO_PREFIX)),
    favoriteFoods: load("favoriteFoods", []).filter((entry) => !entry.id?.startsWith(DEMO_PREFIX)),
    water: load("water", []).filter((entry) => !entry.id?.startsWith(DEMO_PREFIX)),
    settings: { ...settings, demoLoaded: false },
  });
  return true;
}
