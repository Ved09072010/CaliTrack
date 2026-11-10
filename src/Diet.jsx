import { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { createId, formatDate, todayString } from "../js/utils.js";
import { load, save } from "../js/storage.js";
import { BottomSheet, Icon, IconButton, QuickChips, SegmentedControl } from "./ui.jsx";
import { getChartTheme } from "./chartTheme.js";

const DEFAULT_GOALS = { calorieGoal: 2000, proteinGoal: 100, waterGoal: 2000 };
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];
const EMPTY_FOOD = { name: "", mealType: "Breakfast", calories: "", protein: "", carbs: "", fat: "" };

function getInitialData() {
  try {
    const meals = load("meals", []);
    const favorites = load("favoriteFoods", []);
    const water = load("water", []);
    const storedSettings = load("settings", {});
    if (![meals, favorites, water].every(Array.isArray) || !storedSettings || typeof storedSettings !== "object") {
      throw new Error("Saved nutrition data is invalid.");
    }
    return { meals, favorites, water, settings: { ...DEFAULT_GOALS, ...storedSettings }, error: "" };
  } catch (error) {
    return { meals: [], favorites: [], water: [], settings: DEFAULT_GOALS, error: error.message };
  }
}

function totalsFor(meals) {
  return meals.reduce((sum, meal) => ({
    calories: sum.calories + meal.calories,
    protein: sum.protein + meal.protein,
    carbs: sum.carbs + meal.carbs,
    fat: sum.fat + meal.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

function dateAgo(daysAgo) {
  const date = new Date(`${todayString()}T12:00:00`);
  date.setDate(date.getDate() - daysAgo);
  return todayString(date);
}

function WeeklyNutritionChart({ meals, theme }) {
  const canvasRef = useRef(null);
  const chartData = useMemo(() => {
    const daily = new Map();
    meals.forEach((meal) => {
      const current = daily.get(meal.date) || { calories: 0, protein: 0 };
      current.calories += meal.calories;
      current.protein += meal.protein;
      daily.set(meal.date, current);
    });
    const dates = Array.from({ length: 7 }, (_, index) => dateAgo(6 - index));
    return {
      labels: dates.map(formatDate),
      calories: dates.map((date) => daily.get(date)?.calories || 0),
      protein: dates.map((date) => daily.get(date)?.protein || 0),
    };
  }, [meals]);

  useEffect(() => {
    if (!canvasRef.current || !meals.length) return undefined;
    const colors = getChartTheme(theme);
    const context = canvasRef.current.getContext("2d");
    const fill = context.createLinearGradient(0, 0, 0, 220);
    fill.addColorStop(0, `${colors.accent}cc`);
    fill.addColorStop(1, `${colors.accent}40`);
    const chart = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: chartData.labels,
        datasets: [
          { label: "Calories", data: chartData.calories, backgroundColor: fill, borderRadius: 7, yAxisID: "y" },
          { label: "Protein", data: chartData.protein, backgroundColor: `${colors.secondary}bb`, borderRadius: 7, yAxisID: "y1" },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        color: colors.muted,
        scales: {
          y: { beginAtZero: true, ticks: { color: colors.muted }, grid: { color: colors.grid } },
          y1: { beginAtZero: true, position: "right", ticks: { color: colors.muted }, grid: { display: false } },
          x: { ticks: { color: colors.muted }, grid: { display: false } },
        },
        plugins: { legend: { labels: { color: colors.text } } },
      },
    });
    return () => chart.destroy();
  }, [chartData, meals.length, theme]);

  return meals.length
    ? <div className="progress-card"><canvas ref={canvasRef} role="img" aria-label="Weekly calories and protein chart" /></div>
    : <p className="empty-line">Log meals to see your week.</p>;
}

export default function Diet({ settings: appSettings, onSettingsChange }) {
  const [data, setData] = useState(getInitialData);
  const [food, setFood] = useState(EMPTY_FOOD);
  const [saveFavorite, setSaveFavorite] = useState(false);
  const [more, setMore] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [sheet, setSheet] = useState("");
  const [activeSection, setActiveSection] = useState("Today");
  const [showAllMeals, setShowAllMeals] = useState(false);
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState("");
  const [goals, setGoals] = useState(appSettings || data.settings);
  const settings = appSettings || data.settings;
  const today = todayString();
  const todaysMeals = data.meals.filter((meal) => meal.date === today);
  const totals = totalsFor(todaysMeals);
  const todaysWater = data.water.find((entry) => entry.date === today)?.ml || 0;
  const pastMeals = [...data.meals]
    .filter((meal) => meal.date !== today)
    .sort((a, b) => b.date.localeCompare(a.date));
  const weeklyMeals = useMemo(
    () => data.meals.filter((meal) => meal.date >= dateAgo(6) && meal.date <= today),
    [data.meals, today],
  );
  const theme = settings.theme === "system"
    ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
    : settings.theme;

  useEffect(() => setGoals(settings), [settings]);

  function openNewMeal(favorite) {
    setEditing(null);
    setFood(favorite ? { ...favorite, calories: String(favorite.calories), protein: String(favorite.protein), carbs: String(favorite.carbs), fat: String(favorite.fat) } : { ...EMPTY_FOOD, mealType: data.meals[0]?.mealType || "Breakfast" });
    setSaveFavorite(false);
    setMore(false);
    setSheet("meal");
  }

  function openEditMeal(meal) {
    setEditing(meal);
    setFood({ ...meal, calories: String(meal.calories), protein: String(meal.protein), carbs: String(meal.carbs), fat: String(meal.fat) });
    setMore(true);
    setSheet("meal");
  }

  function submitMeal(event) {
    event.preventDefault();
    const name = food.name.trim();
    const calories = Number(food.calories);
    const nutrient = (key) => food[key] === "" ? 0 : Number(food[key]);
    const protein = nutrient("protein");
    const carbs = nutrient("carbs");
    const fat = nutrient("fat");
    if (!name || !Number.isFinite(calories) || calories < 0
      || [protein, carbs, fat].some((value) => !Number.isFinite(value) || value < 0)) {
      setMessage("Enter a name and valid values.");
      return;
    }
    const meal = {
      id: editing?.id || createId(),
      date: editing?.date || today,
      mealType: food.mealType,
      name,
      calories,
      protein,
      carbs,
      fat,
    };
    try {
      const meals = editing ? data.meals.map((item) => item.id === editing.id ? meal : item) : [...data.meals, meal];
      save("meals", meals);
      let favorites = data.favorites;
      if (saveFavorite && !favorites.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
        favorites = [...favorites, { ...meal, id: createId() }];
        save("favoriteFoods", favorites);
      }
      setData((current) => ({ ...current, meals, favorites }));
      setMessage(editing ? "Meal updated." : "Meal added.");
      setSheet("");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function deleteMeal() {
    try {
      const meals = data.meals.filter((item) => item.id !== selectedMeal.id);
      save("meals", meals);
      setData((current) => ({ ...current, meals }));
      setSelectedMeal(null);
      setSheet("");
      setMessage("Meal deleted.");
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
      setMessage("Meal added.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function changeWater(add) {
    const next = Math.max(0, todaysWater + add);
    const water = [...data.water.filter((entry) => entry.date !== today), { date: today, ml: next }];
    try {
      save("water", water);
      setData((current) => ({ ...current, water }));
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function saveCustomWater(event) {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setMessage("Enter an amount above zero.");
      return;
    }
    changeWater(value);
    setAmount("");
    setSheet("");
  }

  function saveGoals(event) {
    event.preventDefault();
    const next = Object.fromEntries(
      Object.entries(goals).filter(([key]) => Object.hasOwn(DEFAULT_GOALS, key))
        .map(([key, value]) => [key, Number(value)]),
    );
    if (Object.values(next).some((value) => !Number.isFinite(value) || value <= 0)) {
      setMessage("Goals must be above zero.");
      return;
    }
    try {
      const updated = { ...settings, ...next };
      onSettingsChange?.(updated);
      save("settings", updated);
      setData((current) => ({ ...current, settings: updated }));
      setSheet("");
      setMessage("Goals saved.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function progress(label, value, goal, unit) {
    return <div className="diet-progress" key={label}>
      <div><span>{label}</span><strong>{Math.round(value)} / {goal} {unit}</strong></div>
      <progress aria-label={`${label} goal progress`} max={goal} value={Math.min(value, goal)} />
    </div>;
  }

  function mealList(meals, emptyMessage) {
    if (!meals.length) return <div className="empty-card"><p>{emptyMessage}</p></div>;
    const visibleMeals = showAllMeals ? meals : meals.slice(0, 5);
    return <div className="diet-history">
      {visibleMeals.map((meal) => <article className="diet-meal" key={meal.id}>
        <div><h3>{meal.name}</h3><p>{formatDate(meal.date)} · {meal.mealType} · {meal.calories} kcal</p></div>
        <IconButton label={`More actions for ${meal.name}`} onClick={() => { setSelectedMeal(meal); setSheet("meal-actions"); }}><Icon name="more" /></IconButton>
      </article>)}
      {meals.length > 5 && <button className="quiet-link" type="button" onClick={() => setShowAllMeals((value) => !value)}>{showAllMeals ? "Show fewer" : "See all"}</button>}
    </div>;
  }

  return (
    <>
      <div className="page-heading"><h1>Diet</h1></div>
      <SegmentedControl label="Diet view" options={["Today", "Week"]} value={activeSection} onChange={setActiveSection} />
      {data.error && <p className="form-message is-error" role="alert">{data.error}</p>}
      {!data.error && activeSection === "Today" && <>
        <section className="diet-section">
          {progress("Calories", totals.calories, settings.calorieGoal, "kcal")}
          {progress("Protein", totals.protein, settings.proteinGoal, "g")}
          {progress("Water", todaysWater, settings.waterGoal, "ml")}
          <div className="water-actions">
            <button className="primary-button" type="button" onClick={() => changeWater(250)}>+250 ml</button>
            <IconButton label="Custom water amount" onClick={() => { setAmount(""); setSheet("water"); }}><Icon name="more" /></IconButton>
          </div>
        </section>
        <QuickChips label="Favorite foods" items={data.favorites.slice(0, 5)} onSelect={logFavorite} getLabel={(item) => item.name} />
        <div className="section-heading"><h2>Meals</h2><IconButton label="Edit daily goals" onClick={() => setSheet("goals")}><span aria-hidden="true">◎</span></IconButton></div>
        {mealList(todaysMeals, "Log your first meal.")}
      </>}
      {!data.error && activeSection === "Week" && <section className="diet-section">
        <h2>This week</h2>
        <WeeklyNutritionChart meals={weeklyMeals} theme={theme} />
        {progress("Calories today", totals.calories, settings.calorieGoal, "kcal")}
        {progress("Protein today", totals.protein, settings.proteinGoal, "g")}
        <div className="section-heading"><h2>Meal history</h2></div>
        {mealList(pastMeals, "Past meals appear here.")}
      </section>}
      {message && <p className="form-message" role="status">{message}</p>}
      {!data.error && <button className="screen-fab" type="button" aria-label="Add meal" onClick={() => openNewMeal()}><Icon name="plus" /><span>Add</span></button>}

      <BottomSheet open={sheet === "meal"} title={editing ? "Edit meal" : "Add meal"} onClose={() => setSheet("")}>
        <form className="diet-form" noValidate onSubmit={submitMeal}>
          <label className="field"><span>Name</span><input autoFocus maxLength="80" placeholder="Oats and yogurt" value={food.name} onChange={(event) => setFood({ ...food, name: event.target.value })} /></label>
          <label className="field"><span>Meal</span><select value={food.mealType} onChange={(event) => setFood({ ...food, mealType: event.target.value })}>{MEAL_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
          <label className="field"><span>Calories</span><input type="number" min="0" step="1" placeholder="0" value={food.calories} onChange={(event) => setFood({ ...food, calories: event.target.value })} /></label>
          <details className="form-more-options" open={more} onToggle={(event) => setMore(event.currentTarget.open)}>
            <summary>More</summary>
            <div className="form-more-content">
              {[[ "protein", "Protein" ], [ "carbs", "Carbs" ], [ "fat", "Fat" ]].map(([key, label]) => <label className="field" key={key}><span>{label} (g)</span><input type="number" min="0" step="1" value={food[key]} onChange={(event) => setFood({ ...food, [key]: event.target.value })} /></label>)}
              <label className="diet-favorite-check"><input type="checkbox" checked={saveFavorite} onChange={(event) => setSaveFavorite(event.target.checked)} /><span>Save as favorite</span></label>
            </div>
          </details>
          {message && <p className="form-message" role="status">{message}</p>}
          <button className="primary-button" type="submit">{editing ? "Save" : "Add meal"}</button>
        </form>
      </BottomSheet>
      <BottomSheet open={sheet === "meal-actions"} title={selectedMeal?.name || "Meal"} onClose={() => setSheet("")}>
        <div className="sheet-actions">
          <button className="secondary-button" type="button" onClick={() => openEditMeal(selectedMeal)}>Edit</button>
          <button className="secondary-button danger-button" type="button" onClick={deleteMeal}>Delete</button>
        </div>
      </BottomSheet>
      <BottomSheet open={sheet === "water"} title="Water" onClose={() => setSheet("")}>
        <form className="sheet-form" onSubmit={saveCustomWater}>
          <label className="field"><span>Millilitres</span><input autoFocus type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
          <button className="primary-button" type="submit">Add water</button>
        </form>
      </BottomSheet>
      <BottomSheet open={sheet === "goals"} title="Daily goals" onClose={() => setSheet("")}>
        <form className="sheet-form" onSubmit={saveGoals}>
          {[[ "calorieGoal", "Calories" ], [ "proteinGoal", "Protein" ], [ "waterGoal", "Water" ]].map(([key, label]) => <label className="field" key={key}><span>{label}</span><input type="number" min="1" value={goals[key]} onChange={(event) => setGoals({ ...goals, [key]: event.target.value })} /></label>)}
          <button className="primary-button" type="submit">Save goals</button>
        </form>
      </BottomSheet>
    </>
  );
}
