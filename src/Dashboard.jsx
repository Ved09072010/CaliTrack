import { useEffect, useState } from "react";
import { todayString } from "../js/utils.js";
import { load } from "../js/storage.js";
import { getDashboardStats } from "./dashboardStats.js";
import { IconButton, ProgressRing, SectionHeading } from "./ui.jsx";

const DEFAULT_GOALS = { calorieGoal: 2000, proteinGoal: 100, waterGoal: 2000 };

function getDashboardData() {
  try {
    const habits = load("habits", []);
    const checks = load("habitChecks", []);
    const meals = load("meals", []);
    const water = load("water", []);
    const savedSettings = load("settings", {});
    if (!savedSettings || typeof savedSettings !== "object" || Array.isArray(savedSettings)) {
      throw new Error("Saved nutrition goals have an invalid format. Open Diet to review them.");
    }
    const settings = { ...DEFAULT_GOALS, ...savedSettings };
    if (![habits, checks, meals, water].every(Array.isArray)
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
    return { habits, checks, meals, water, settings, error: "" };
  } catch (error) {
    return { habits: [], checks: [], meals: [], water: [], settings: DEFAULT_GOALS, error: error.message };
  }
}

function Stat({ value, label }) {
  return <div className="dashboard-stat"><strong>{value}</strong><span>{label}</span></div>;
}

export default function Dashboard({ workouts, workoutError, active, onWorkout, onTab, onSettings }) {
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
  const protein = todaysMeals.reduce((total, meal) => total + meal.protein, 0);
  const water = data.water.find((entry) => entry.date === today)?.ml || 0;
  const todaysWorkouts = workouts.filter((workout) => workout.date === today);
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
  const todayLabel = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  return (
    <>
      <div className="home-header">
        <div className="page-heading">
          <p className="eyebrow">{todayLabel}</p>
          <h1>Move with purpose.</h1>
          <p className="intro">Your day, at a glance.</p>
        </div>
        <IconButton label="Open settings and backup" onClick={onSettings}>
          <Icon name="settings" />
        </IconButton>
      </div>
      {workoutError && <p className="form-message is-error" role="alert">{workoutError}</p>}
      {data.error && <p className="form-message is-error" role="alert">{data.error}</p>}

      <section className="home-rings glass-panel" aria-label="Today's progress">
        <div className="ring-row">
          <button type="button" onClick={() => onTab("workouts")} aria-label="View workouts this week">
            <ProgressRing label="This week" value={workoutDays} total={3} color="var(--workout-accent)" />
          </button>
          <button type="button" onClick={() => onTab("habits")} aria-label="View habits completed today">
            <ProgressRing label="Habits" value={completedHabits} total={activeHabits.length} color="var(--habit-accent)" />
          </button>
          <button type="button" onClick={() => onTab("diet")} aria-label="View calories today">
            <ProgressRing label="Calories" value={Math.round(calories)} total={data.settings.calorieGoal} color="var(--diet-accent)" />
          </button>
        </div>
      </section>

      <section className="home-week-section" aria-labelledby="week-overview-title">
        <SectionHeading title="This week" action="Workouts" onAction={() => onTab("workouts")} />
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

      <section className="home-section" aria-labelledby="week-summary-title">
        <SectionHeading title="Your progress" action="See all" onAction={() => onTab("workouts")} />
        <div className="home-stats">
          <Stat value={stats.bestStreak} label="Day streak" />
          <Stat value={stats.totalWorkouts} label="Workouts" />
          <Stat value={stats.recordsThisMonth} label="PRs this month" />
        </div>
      </section>
    </>
  );
}
