import { useEffect, useMemo, useRef, useState } from "react";
import { createId, formatDate, todayString } from "../js/utils.js";
import { load, save } from "../js/storage.js";

const DEFAULT_GOALS = { calorieGoal: 2000, proteinGoal: 100, waterGoal: 2000 };
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];

function isFood(item) {
  return item && typeof item.name === "string"
    && MEAL_TYPES.includes(item.mealType)
    && ["calories", "protein", "carbs", "fat"].every(
      (key) => Number.isFinite(item[key]) && item[key] >= 0,
    );
}

function isValidDate(value) {
  return typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && todayString(new Date(`${value}T12:00:00`)) === value;
}

function getInitialData() {
  try {
    const meals = load("meals", []);
    const favorites = load("favoriteFoods", []);
    const water = load("water", []);
    const storedSettings = load("settings", {});
    if (!Array.isArray(meals) || !Array.isArray(favorites) || !Array.isArray(water)
      || !storedSettings || typeof storedSettings !== "object" || Array.isArray(storedSettings)) {
      throw new Error("Saved nutrition data has an invalid format.");
    }
    if (meals.some((meal) => !isFood(meal) || typeof meal.id !== "string" || !isValidDate(meal.date))
      || favorites.some((food) => !isFood(food) || typeof food.id !== "string")
      || water.some((entry) => !entry || !isValidDate(entry.date) || !Number.isFinite(entry.ml) || entry.ml < 0)) {
      throw new Error("Saved nutrition data has an invalid entry. Keep a backup before changing it.");
    }
    const settings = { ...DEFAULT_GOALS, ...storedSettings };
    if (Object.keys(DEFAULT_GOALS).some((key) => !Number.isFinite(settings[key]) || settings[key] <= 0)) {
      throw new Error("Nutrition goals must be numbers above zero.");
    }
    return { meals, favorites, water, settings, error: "" };
  } catch (error) {
    return { meals: [], favorites: [], water: [], settings: DEFAULT_GOALS, error: error.message };
  }
}

function getFoodTotals(meals) {
  return meals.reduce((totals, meal) => ({
    calories: totals.calories + meal.calories,
    protein: totals.protein + meal.protein,
    carbs: totals.carbs + meal.carbs,
    fat: totals.fat + meal.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

function dateAgo(daysAgo) {
  const date = new Date(`${todayString()}T12:00:00`);
  date.setDate(date.getDate() - daysAgo);
  return todayString(date);
}

function WeeklyNutritionChart({ meals }) {
  const [expanded, setExpanded] = useState(false);
  const canvasRef = useRef(null);
  const chartData = useMemo(() => {
    const byDate = new Map();
    meals.forEach((meal) => {
      const totals = byDate.get(meal.date) || { calories: 0, protein: 0 };
      totals.calories += meal.calories;
      totals.protein += meal.protein;
      byDate.set(meal.date, totals);
    });
    const dates = Array.from({ length: 7 }, (_, index) => dateAgo(6 - index));
    return {
      labels: dates.map((date) => formatDate(date)),
      calories: dates.map((date) => byDate.get(date)?.calories || 0),
      protein: dates.map((date) => byDate.get(date)?.protein || 0),
    };
  }, [meals]);

  useEffect(() => {
    if (!expanded || !window.Chart || !canvasRef.current) return undefined;
    const chart = new window.Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: chartData.labels,
        datasets: [
          { label: "Calories", data: chartData.calories, backgroundColor: "#4b8be8", yAxisID: "y" },
          { label: "Protein (g)", data: chartData.protein, backgroundColor: "#8b9bb3", yAxisID: "y1" },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        color: "#a3afbf",
        scales: {
          y: { beginAtZero: true, ticks: { color: "#a3afbf" }, grid: { color: "#364357" } },
          y1: { beginAtZero: true, position: "right", grid: { drawOnChartArea: false } },
          x: { ticks: { color: "#a3afbf" }, grid: { color: "#364357" } },
        },
        plugins: { legend: { labels: { color: "#f1f5f9" } } },
      },
    });
    return () => chart.destroy();
  }, [chartData, expanded]);

  return (
    <details className="progress-disclosure" onToggle={(event) => setExpanded(event.currentTarget.open)}>
      <summary>Weekly calories &amp; protein</summary>
      <div className="disclosure-content">
        {meals.length > 0 && window.Chart
          ? <div className="progress-card"><canvas ref={canvasRef} role="img" aria-label="Weekly calories and protein chart" /></div>
          : <p className="muted">{meals.length === 0 ? "Log meals to see your weekly chart." : "The chart needs an internet connection to load."}</p>}
      </div>
    </details>
  );
}

export default function Diet() {
  const [data, setData] = useState(getInitialData);
  const [food, setFood] = useState({ name: "", mealType: "Breakfast", calories: "", protein: "", carbs: "", fat: "" });
  const [saveFavorite, setSaveFavorite] = useState(false);
  const [goals, setGoals] = useState(data.settings);
  const [message, setMessage] = useState("");
  const today = todayString();
  const todaysMeals = data.meals.filter((meal) => meal.date === today);
  const totals = getFoodTotals(todaysMeals);
  const todaysWater = data.water.find((entry) => entry.date === today)?.ml || 0;
  const history = [...data.meals].sort((a, b) => b.date.localeCompare(a.date));
  const weeklyMeals = useMemo(
    () => data.meals.filter((meal) => meal.date >= dateAgo(6) && meal.date <= today),
    [data.meals, today],
  );

  function addFood(event) {
    event.preventDefault();
    const name = food.name.trim();
    const nutrientKeys = ["calories", "protein", "carbs", "fat"];
    const values = nutrientKeys.map((key) => Number(food[key]));
    if (!name || nutrientKeys.some((key) => food[key] === "")
      || values.some((value) => !Number.isFinite(value) || value < 0)) {
      setMessage("Enter a food name and non-negative nutrition values.");
      return;
    }
    const [calories, protein, carbs, fat] = values;
    const meal = { id: createId(), date: today, mealType: food.mealType, name, calories, protein, carbs, fat };
    try {
      const meals = [...data.meals, meal];
      save("meals", meals);
      setData((current) => ({ ...current, meals }));
      if (saveFavorite && !data.favorites.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
        const favorites = [...data.favorites, { id: createId(), name, mealType: food.mealType, calories, protein, carbs, fat }];
        save("favoriteFoods", favorites);
        setData((current) => ({ ...current, favorites }));
      }
      setFood({ name: "", mealType: food.mealType, calories: "", protein: "", carbs: "", fat: "" });
      setSaveFavorite(false);
      setMessage("Meal added for today.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function logFavorite(favorite) {
    const meal = { ...favorite, id: createId(), date: today };
    try {
      const meals = [...data.meals, meal];
      save("meals", meals);
      setData((current) => ({ ...current, meals }));
      setMessage(`${favorite.name} added for today.`);
    } catch (error) {
      setMessage(error.message);
    }
  }

  function deleteMeal(meal) {
    if (!window.confirm(`Delete "${meal.name}" from ${formatDate(meal.date)}?`)) return;
    try {
      const meals = data.meals.filter((item) => item.id !== meal.id);
      save("meals", meals);
      setData((current) => ({ ...current, meals }));
      setMessage("Meal deleted.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function changeWater(amount) {
    const nextAmount = Math.max(0, todaysWater + amount);
    const water = [...data.water.filter((entry) => entry.date !== today), { date: today, ml: nextAmount }];
    try {
      save("water", water);
      setData((current) => ({ ...current, water }));
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function saveGoals(event) {
    event.preventDefault();
    const nextGoals = Object.fromEntries(
      Object.entries(goals).filter(([key]) => Object.hasOwn(DEFAULT_GOALS, key))
        .map(([key, value]) => [key, Number(value)]),
    );
    if (Object.values(nextGoals).some((value) => !Number.isFinite(value) || value <= 0)) {
      setMessage("Each goal must be a number above zero.");
      return;
    }
    try {
      const settings = { ...data.settings, ...nextGoals };
      save("settings", settings);
      setData((current) => ({ ...current, settings }));
      setMessage("Goals saved.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function progress(label, value, goal, unit) {
    return (
      <div className="diet-progress" key={label}>
        <div><span>{label}</span><strong>{Math.round(value)} / {goal} {unit}</strong></div>
        <progress aria-label={`${label} goal progress`} max={goal} value={Math.min(value, goal)} />
      </div>
    );
  }

  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">FUEL &amp; RECOVERY</p>
        <h1>Nutrition</h1>
        <p className="intro">Keep meals, hydration, and daily goals in one simple place.</p>
      </div>
      {data.error && <p className="form-message is-error" role="alert">{data.error}</p>}
      {!data.error && (
        <>
          <section className="diet-section" aria-labelledby="diet-today-title">
            <div className="diet-section-heading"><h2 id="diet-today-title">Today's nutrition</h2><span>{formatDate(today)}</span></div>
            {progress("Calories", totals.calories, data.settings.calorieGoal, "kcal")}
            {progress("Protein", totals.protein, data.settings.proteinGoal, "g")}
            <div className="diet-macros">
              <span>Carbs <strong>{Math.round(totals.carbs)}g</strong></span>
              <span>Fat <strong>{Math.round(totals.fat)}g</strong></span>
            </div>
          </section>

          <section className="diet-section" aria-labelledby="water-title">
            <div className="diet-section-heading"><h2 id="water-title">Water</h2><strong>{todaysWater} / {data.settings.waterGoal} ml</strong></div>
            <progress aria-label="Water goal progress" max={data.settings.waterGoal} value={Math.min(todaysWater, data.settings.waterGoal)} />
            <div className="water-actions">
              <button className="secondary-button" type="button" onClick={() => changeWater(-250)} disabled={todaysWater === 0}>−250 ml</button>
              <button className="primary-button" type="button" onClick={() => changeWater(250)}>+250 ml water</button>
            </div>
          </section>

          {data.favorites.length > 0 && (
            <section className="diet-section" aria-labelledby="favorites-title">
              <h2 id="favorites-title">Quick add a favorite</h2>
              <div className="diet-favorites">
                {data.favorites.map((favorite) => (
                  <button className="recent-button" type="button" key={favorite.id} onClick={() => logFavorite(favorite)}>
                    {favorite.name}<small>{favorite.calories} kcal</small>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="diet-section" aria-labelledby="add-meal-title">
            <h2 id="add-meal-title">Add a meal</h2>
            <form className="diet-form" noValidate onSubmit={addFood}>
              <label className="field diet-name"><span>Food or meal</span><input maxLength="80" placeholder="e.g. Oats and yogurt" value={food.name} onChange={(event) => setFood({ ...food, name: event.target.value })} /></label>
              <label className="field"><span>Meal</span><select value={food.mealType} onChange={(event) => setFood({ ...food, mealType: event.target.value })}>{MEAL_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
              {[
                ["calories", "Calories", "kcal"],
                ["protein", "Protein", "g"],
                ["carbs", "Carbs", "g"],
                ["fat", "Fat", "g"],
              ].map(([key, label, unit]) => (
                <label className="field" key={key}><span>{label} ({unit})</span><input type="number" min="0" step="1" inputMode="decimal" placeholder="0" value={food[key]} onChange={(event) => setFood({ ...food, [key]: event.target.value })} /></label>
              ))}
              <label className="diet-favorite-check"><input type="checkbox" checked={saveFavorite} onChange={(event) => setSaveFavorite(event.target.checked)} /><span>Save as a favorite</span></label>
              <button className="primary-button diet-submit" type="submit">Add meal</button>
            </form>
            {message && <p className="form-message" role="status">{message}</p>}
          </section>

          <section className="diet-section" aria-labelledby="meal-history-title">
            <h2 id="meal-history-title">Meal history</h2>
            {history.length === 0 ? (
              <div className="empty-card"><span className="empty-icon" aria-hidden="true">◒</span><h2>Start with your first meal</h2><p>Add a meal above to see your daily totals and build a simple food history.</p></div>
            ) : (
              <div className="diet-history">
                {history.map((meal) => (
                  <article className="diet-meal" key={meal.id}>
                    <div><h3>{meal.name}</h3><p>{formatDate(meal.date)} · {meal.mealType} · {meal.calories} kcal</p><p>{meal.protein}g protein · {meal.carbs}g carbs · {meal.fat}g fat</p></div>
                    <button className="text-button danger-button" type="button" aria-label={`Delete ${meal.name}`} onClick={() => deleteMeal(meal)}>Delete</button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <details className="progress-disclosure">
            <summary>Edit daily goals</summary>
            <form className="disclosure-content diet-goals" noValidate onSubmit={saveGoals}>
              {[
                ["calorieGoal", "Calories (kcal)"],
                ["proteinGoal", "Protein (g)"],
                ["waterGoal", "Water (ml)"],
              ].map(([key, label]) => (
                <label className="field" key={key}><span>{label}</span><input type="number" min="1" step="1" value={goals[key]} onChange={(event) => setGoals({ ...goals, [key]: event.target.value })} /></label>
              ))}
              <button className="primary-button" type="submit">Save goals</button>
            </form>
          </details>
          <WeeklyNutritionChart meals={weeklyMeals} />
        </>
      )}
    </>
  );
}
