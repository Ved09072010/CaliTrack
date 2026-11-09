import { useEffect, useState } from "react";
import { todayString } from "../js/utils.js";
import { load } from "../js/storage.js";
import { getDashboardStats } from "./dashboardStats.js";

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

export default function Dashboard({ workouts, workoutError, active, onWorkout, onTab }) {
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
  const todayHeading = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">YOUR TRAINING SPACE <span className="live-dot" aria-hidden="true" /></p>
        <h1>Move with purpose.</h1>
        <p className="intro">{todayHeading} · A little progress adds up.</p>
      </div>
      <section className="home-hero">
        <div className="hero-copy">
          <span className="hero-kicker">READY WHEN YOU ARE</span>
          <h2>{todaysWorkouts.length ? "You showed up today." : "Build strength one session at a time."}</h2>
          <p>{todaysWorkouts.length ? `${todaysWorkouts.length} workout${todaysWorkouts.length === 1 ? "" : "s"} logged today. Keep listening to your body.` : "Your next step starts with showing up."}</p>
          <button className="hero-button" type="button" disabled={Boolean(workoutError)} onClick={onWorkout}>
            <span>{todaysWorkouts.length ? "Log another workout" : "Start a workout"}</span><span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="hero-mark" aria-hidden="true">
          <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="44" /><path d="M37 62h46M60 39v46" /><circle cx="60" cy="60" r="56" /></svg>
        </div>
      </section>
      {workoutError && <p className="form-message is-error" role="alert">{workoutError}</p>}
      {data.error && <p className="form-message is-error" role="alert">{data.error}</p>}

      <section className="dashboard-section" aria-labelledby="today-overview-title">
        <div className="home-section-title">
          <div><p className="eyebrow">A QUICK CHECK-IN</p><h2 id="today-overview-title">Today</h2></div>
        </div>
        <div className="dashboard-overview">
          <button className="dashboard-overview-card" type="button" onClick={() => onTab("habits")}>
            <span className="dashboard-card-label">Habits</span>
            <strong>{completedHabits} / {activeHabits.length}</strong>
            <small>{activeHabits.length ? "completed today" : "add your first habit"}</small>
          </button>
          <button className="dashboard-overview-card" type="button" onClick={() => onTab("diet")}>
            <span className="dashboard-card-label">Calories</span>
            <strong>{Math.round(calories)} <small>/ {data.settings.calorieGoal} kcal</small></strong>
            <progress aria-label="Calories goal progress" max={data.settings.calorieGoal} value={Math.min(calories, data.settings.calorieGoal)} />
            <small>{Math.round(protein)} / {data.settings.proteinGoal} g protein</small>
            <progress aria-label="Protein goal progress" max={data.settings.proteinGoal} value={Math.min(protein, data.settings.proteinGoal)} />
          </button>
          <button className="dashboard-overview-card" type="button" onClick={() => onTab("diet")}>
            <span className="dashboard-card-label">Water</span>
            <strong>{water} <small>/ {data.settings.waterGoal} ml</small></strong>
            <progress aria-label="Water goal progress" max={data.settings.waterGoal} value={Math.min(water, data.settings.waterGoal)} />
            <small>logged today</small>
          </button>
          <button className="dashboard-overview-card" type="button" onClick={() => onTab("workouts")}>
            <span className="dashboard-card-label">Workout</span>
            <strong>{todaysWorkouts.length ? todaysWorkouts.length : "—"}</strong>
            <small>{todaysWorkouts.length ? "logged today" : "nothing logged yet"}</small>
          </button>
        </div>
      </section>

      <section className="home-section" aria-labelledby="week-summary-title">
        <div className="home-section-title">
          <div><p className="eyebrow">KEEP YOUR MOMENTUM</p><h2 id="week-summary-title">Your progress</h2></div>
          <button type="button" className="quiet-link" onClick={() => onTab("workouts")}>See workouts</button>
        </div>
        <div className="summary-grid">
          <Stat value={stats.totalWorkouts} label="Total workouts" />
          <Stat value={stats.totalReps} label="Total reps" />
          <Stat value={stats.bestStreak} label="Best streak" />
          <Stat value={stats.recordsThisMonth} label="PRs this month" />
        </div>
      </section>

      <section className="dashboard-actions" aria-label="Quick actions">
        <h2>Quick actions</h2>
        <div className="dashboard-action-grid">
          <button className="primary-button" type="button" disabled={Boolean(workoutError)} onClick={onWorkout}>+ Log workout</button>
          <button className="secondary-button" type="button" onClick={() => onTab("habits")}>Check habits</button>
          <button className="secondary-button" type="button" onClick={() => onTab("diet")}>Log a meal</button>
          <button className="secondary-button" type="button" onClick={() => onTab("library")}>Find an exercise</button>
          <button className="secondary-button" type="button" onClick={() => onTab("programs")}>Open programs</button>
        </div>
      </section>
      <button className="library-prompt" type="button" onClick={() => onTab("library")}>
        <span className="library-icon" aria-hidden="true">↗</span>
        <span><strong>Need an idea?</strong><small>Explore the exercise library</small></span>
        <span className="prompt-arrow" aria-hidden="true">›</span>
      </button>
    </>
  );
}
