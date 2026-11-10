import { useEffect, useState } from "react";
import { todayString } from "../js/utils.js";
import { load } from "../js/storage.js";
import { getDashboardStats } from "./dashboardStats.js";
import { Icon, IconButton, ProgressRing, SectionHeading } from "./ui.jsx";

const DEFAULT_GOALS = {
  calorieGoal: 2000,
  proteinGoal: 100,
  waterGoal: 2000,
  weeklyWorkoutGoal: 4,
};

function getDashboardData() {
  try {
    const habits = load("habits", []);
    const checks = load("habitChecks", []);
    const meals = load("meals", []);
    const water = load("water", []);
    const bodyStats = load("bodyStats", []);
    const favoriteFoods = load("favoriteFoods", []);
    const routines = load("customRoutines", []);
    const savedSettings = load("settings", {});
    if (!savedSettings || typeof savedSettings !== "object" || Array.isArray(savedSettings)) {
      throw new Error("Saved nutrition goals have an invalid format. Open Diet to review them.");
    }
    const settings = { ...DEFAULT_GOALS, ...savedSettings };
    if (![habits, checks, meals, water, bodyStats, favoriteFoods, routines].every(Array.isArray)
      || !settings
      || Object.keys(DEFAULT_GOALS).some((key) => !Number.isFinite(settings[key]) || settings[key] <= 0)) {
      throw new Error("Saved dashboard data has an invalid format. Open each tracker to review its saved data.");
    }
    if (habits.some((habit) => !habit || typeof habit.id !== "string" || typeof habit.name !== "string")
      || checks.some((check) => !check || typeof check.habitId !== "string" || typeof check.date !== "string" || typeof check.done !== "boolean")
      || meals.some((meal) => !meal || typeof meal.date !== "string" || !["calories", "protein"].every((key) => Number.isFinite(meal[key]) && meal[key] >= 0))
      || water.some((entry) => !entry || typeof entry.date !== "string" || !Number.isFinite(entry.ml) || entry.ml < 0)) {
      throw new Error("Some saved tracker entries are invalid. Open the relevant tab to review its data.");
    }
    return { habits, checks, meals, water, bodyStats, favoriteFoods, routines, settings, error: "" };
  } catch (error) {
    return { habits: [], checks: [], meals: [], water: [], bodyStats: [], favoriteFoods: [], routines: [], settings: DEFAULT_GOALS, error: error.message };
  }
}

function Stat({ value, label }) {
  return <div className="dashboard-stat"><strong>{value}</strong><span>{label}</span></div>;
}

export default function Dashboard({ workouts, workoutError, active, onWorkout, onSettings, onLoadDemo, onDismissDemo }) {
  const [data, setData] = useState(getDashboardData);
  const today = todayString();

  useEffect(() => {
    if (active) setData(getDashboardData());
  }, [active]);

  const activeHabits = data.habits.filter((habit) => !habit.archived);
  const completedHabits = activeHabits.filter((habit) => data.checks.some(
    (check) => check.habitId === habit.id && check.date === today && check.done,
  )).length;
  const todaysMeals = data.meals.filter((meal) => meal.date === today);
  const calories = todaysMeals.reduce((total, meal) => total + meal.calories, 0);
  const stats = getDashboardStats(workouts, today);
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${today}T12:00:00`);
    date.setDate(date.getDate() - (6 - index));
    const key = todayString(date);
    const trained = workouts.some((workout) => workout.date === key);
    const done = activeHabits.filter((habit) => data.checks.some(
      (check) => check.habitId === habit.id && check.date === key && check.done,
    )).length;
    const mealCalories = data.meals
      .filter((meal) => meal.date === key)
      .reduce((sum, meal) => sum + meal.calories, 0);
    return {
      date: key,
      day: new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date),
      trained,
      habits: activeHabits.length ? done / activeHabits.length : 0,
      calories: data.settings.calorieGoal ? Math.min(1, mealCalories / data.settings.calorieGoal) : 0,
    };
  });
  const workoutDays = workouts.filter((workout) => workout.date >= week[0].date && workout.date <= today).length;
  const showDemoPrompt = !data.error && !workoutError
    && !data.settings.demoPromptDismissed && !data.settings.demoLoaded
    && !workouts.length && !data.habits.length && !data.checks.length && !data.meals.length
    && !data.water.length && !data.bodyStats.length && !data.favoriteFoods.length && !data.routines.length;
  const todayLabel = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  return (
    <>
      <div className="home-header">
        <div className="page-heading">
          <p className="eyebrow">{todayLabel}</p>
          <h1>Today</h1>
        </div>
        <IconButton label="Open settings and backup" onClick={onSettings}>
          <Icon name="settings" />
        </IconButton>
      </div>
      {workoutError && <p className="form-message is-error" role="alert">{workoutError}</p>}
      {data.error && <p className="form-message is-error" role="alert">{data.error}</p>}
      <section className="home-rings glass-panel" aria-label="Today's progress">
        <div className="ring-row">
          <ProgressRing label="This week" value={workoutDays} total={data.settings.weeklyWorkoutGoal} color="var(--workout-accent)" />
          <ProgressRing label="Habits" value={completedHabits} total={activeHabits.length} color="var(--habit-accent)" />
          <ProgressRing label="Calories" value={Math.round(calories)} total={data.settings.calorieGoal} color="var(--diet-accent)" />
        </div>
      </section>

      <section className="home-today-action" aria-labelledby="today-action-title">
        <h2 id="today-action-title">Today</h2>
        <button className="primary-button" type="button" onClick={onWorkout}>Log workout</button>
      </section>

      <section className="home-week-section" aria-labelledby="week-overview-title">
        <SectionHeading title="Week" />
        <div className="week-overview glass-panel" role="list" aria-label="Daily activity for the last seven days">
          {week.map((day) => (
            <div className="week-day" role="listitem" key={day.date} aria-label={`${day.day}: ${day.trained ? "workout" : "no workout"}, ${Math.round(day.habits * 100)} percent habits, ${Math.round(day.calories * 100)} percent calories`}>
              <span>{day.day}</span>
              <i className={day.trained ? "trained" : ""} aria-hidden="true" />
              <span className="week-day-bars" aria-hidden="true">
                <i className="habit-bar" style={{ "--bar-value": `${day.habits * 100}%` }} />
                <i className="calorie-bar" style={{ "--bar-value": `${day.calories * 100}%` }} />
              </span>
            </div>
          ))}
        </div>
      </section>

      <details className="home-extra-stats">
        <summary>Stats</summary>
        <div className="home-stats">
          <Stat value={stats.currentStreak} label="Day streak" />
          <Stat value={stats.totalWorkouts} label="Workouts" />
          <Stat value={stats.recordsThisMonth} label="PRs this month" />
        </div>
      </details>

      {showDemoPrompt && <section className="demo-prompt glass-panel" aria-label="Sample data">
        <h2>Try sample data?</h2>
        <div><button className="primary-button" type="button" onClick={onLoadDemo}>Load sample</button><button className="secondary-button" type="button" onClick={onDismissDemo}>Start fresh</button></div>
      </section>}
    </>
  );
}
