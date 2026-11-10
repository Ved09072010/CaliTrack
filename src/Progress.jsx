import { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { save } from "../js/storage.js";
import { formatDate, readList } from "./data.js";
import { todayString } from "../js/utils.js";
import { fromKilograms, toKilograms } from "./settingsData.js";
import { getChartTheme } from "./chartTheme.js";
import SummaryCards from "./SummaryCards.jsx";
import { BottomSheet, Icon, IconButton } from "./ui.jsx";

function initialBodyData() {
  try {
    return { stats: readList("bodyStats"), error: "" };
  } catch (error) {
    return { stats: [], error: error.message };
  }
}

function chartOptions(theme) {
  const colors = getChartTheme(theme);
  return {
    responsive: true,
    maintainAspectRatio: false,
    color: colors.muted,
    scales: {
      y: { beginAtZero: true, ticks: { color: colors.muted, maxTicksLimit: 4 }, grid: { color: colors.grid, drawBorder: false } },
      x: { ticks: { color: colors.muted, maxTicksLimit: 5 }, grid: { display: false } },
    },
    interaction: { intersect: false, mode: "index" },
    plugins: { legend: { labels: { color: colors.text, usePointStyle: true, boxWidth: 8 } } },
  };
}

function ExerciseProgress({ workouts, units, theme }) {
  const [selected, setSelected] = useState("");
  const canvasRef = useRef(null);
  const exercises = [...new Set(workouts.map((workout) => workout.exercise))].sort();
  const selectedExercise = selected || exercises[0] || "";
  const records = useMemo(() => workouts
    .filter((workout) => workout.exercise === selectedExercise)
    .sort((a, b) => a.date.localeCompare(b.date)), [workouts, selectedExercise]);
  const isHold = records.length > 0 && records.every((workout) => workout.sets.some((set) => set.seconds > 0));

  useEffect(() => {
    if (records.length === 0 || !canvasRef.current) return undefined;
    const points = new Map();
    records.forEach((workout) => {
      const point = points.get(workout.date) || { best: 0, volume: 0 };
      workout.sets.forEach((set) => {
        point.best = Math.max(point.best, isHold ? set.seconds : set.reps);
        if (!isHold) point.volume += set.reps * set.weight;
      });
      points.set(workout.date, point);
    });

    const dates = [...points.keys()];
    const values = [...points.values()];
    const colors = getChartTheme(theme);
    const context = canvasRef.current.getContext("2d");
    const fill = context.createLinearGradient(0, 0, 0, 220);
    fill.addColorStop(0, `${colors.accent}55`);
    fill.addColorStop(1, `${colors.accent}00`);
    const chart = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: dates.map(formatDate),
        datasets: [
          {
            type: "line",
            label: isHold ? "Best hold (sec)" : "Best reps",
            data: values.map((point) => point.best),
            borderColor: colors.accent,
            backgroundColor: fill,
            fill: true,
            tension: 0.36,
            pointRadius: 3,
            pointHoverRadius: 5,
            borderWidth: 2,
          },
          ...(!isHold ? [{
            type: "bar",
            label: `Volume (reps × ${units === "imperial" ? "lb" : "kg"})`,
            data: values.map((point) => point.volume * (units === "imperial" ? 1 / 0.45359237 : 1)),
            backgroundColor: colors.secondary,
            borderRadius: 7,
            barPercentage: 0.58,
            categoryPercentage: 0.72,
            yAxisID: "y1",
          }] : []),
        ],
      },
      options: {
        ...chartOptions(theme),
        scales: {
          ...chartOptions(theme).scales,
          y1: { beginAtZero: true, position: "right", ticks: { color: colors.muted, maxTicksLimit: 4 }, grid: { display: false, drawBorder: false } },
        },
      },
    });
    return () => chart.destroy();
  }, [records, isHold, units, theme]);

  return (
    <section className="progress-disclosure">
      <h2>Exercise progress</h2>
      {exercises.length > 1 && <div className="exercise-chips" role="group" aria-label="Choose an exercise to see progress">
        {exercises.map((exercise) => (
          <button className={`quick-chip${selectedExercise === exercise ? " is-selected" : ""}`} type="button" aria-pressed={selectedExercise === exercise} key={exercise} onClick={() => setSelected(exercise)}>{exercise}</button>
        ))}
      </div>}
      {records.length > 0
        ? <div className="progress-card"><canvas id="exercise-chart" ref={canvasRef} role="img" aria-label="Exercise performance chart" /></div>
        : <p className="muted">Log workouts to see progress.</p>}
    </section>
  );
}

function BodyWeightProgress({ units, theme }) {
  const [bodyData, setBodyData] = useState(initialBodyData);
  const [date, setDate] = useState(todayString());
  const [weight, setWeight] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(Boolean(bodyData.error));
  const [sheetOpen, setSheetOpen] = useState(false);
  const canvasRef = useRef(null);
  const stats = bodyData.stats;
  const sortedStats = useMemo(() => [...stats].sort((a, b) => a.date.localeCompare(b.date)), [stats]);

  useEffect(() => {
    if (!sortedStats.length || !canvasRef.current) return undefined;
    const colors = getChartTheme(theme);
    const chart = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: sortedStats.map((item) => formatDate(item.date)),
        datasets: [{
          label: `Weight (${units === "imperial" ? "lb" : "kg"})`,
          data: sortedStats.map((item) => fromKilograms(item.weightKg, units)),
          borderColor: colors.accent,
          backgroundColor: `${colors.accent}26`,
          fill: true,
          tension: 0.36,
          pointRadius: 3,
          pointHoverRadius: 5,
        }],
      },
      options: {
        ...chartOptions(theme),
        scales: {
          ...chartOptions(theme).scales,
          y: { beginAtZero: false, ticks: { color: colors.muted, maxTicksLimit: 4 }, grid: { color: colors.grid, drawBorder: false } },
        },
      },
    });
    return () => chart.destroy();
  }, [sortedStats, units, theme]);

  function submit(event) {
    event.preventDefault();
    const enteredWeight = Number(weight);
    if (!date || !Number.isFinite(enteredWeight) || enteredWeight <= 0) {
      setIsError(true);
      setMessage("Enter a date and a weight above zero.");
      return;
    }

    try {
      const weightKg = toKilograms(enteredWeight, units);
      const nextStats = stats.filter((item) => item.date !== date);
      nextStats.push({ date, weightKg, notes: "" });
      save("bodyStats", nextStats);
      setBodyData({ stats: nextStats, error: "" });
      setWeight("");
      setIsError(false);
      setMessage("Saved.");
      setSheetOpen(false);
    } catch (error) {
      setIsError(true);
      setMessage(error.message);
    }
  }

  return (
    <section className="progress-disclosure">
      <div className="section-heading"><h2>Body weight</h2><IconButton label="Log body weight" onClick={() => setSheetOpen(true)}><Icon name="plus" /></IconButton></div>
      <div className="disclosure-content">
        {bodyData.error && <p className="form-message is-error" role="alert">{bodyData.error}</p>}
        {sortedStats.length > 0
          ? <div className="progress-card"><canvas id="body-weight-chart" ref={canvasRef} role="img" aria-label="Body weight history chart" /></div>
          : <p className="muted">Log weight to see your trend.</p>}
        {message && <p id="body-stats-message" className={`form-message${isError ? " is-error" : ""}`} role={isError ? "alert" : "status"}>{message}</p>}
      </div>
      <BottomSheet open={sheetOpen} title="Body weight" onClose={() => setSheetOpen(false)}>
        <form className="body-stats-form sheet-form" noValidate onSubmit={submit}>
          <label className="field">
            <span>Date</span>
            <input id="body-date" type="date" required disabled={Boolean(bodyData.error)} value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label className="field">
            <span>Weight ({units === "imperial" ? "lb" : "kg"})</span>
            <input id="body-weight" type="number" min="0.1" step="0.1" inputMode="decimal" placeholder={units === "imperial" ? "e.g. 145" : "e.g. 65.5"} required disabled={Boolean(bodyData.error)} value={weight} onChange={(event) => setWeight(event.target.value)} />
          </label>
          <button className="primary-button" type="submit" disabled={Boolean(bodyData.error)}>Save weight</button>
        </form>
      </BottomSheet>
    </section>
  );
}

export default function Progress({ workouts, units = "metric", theme = "dark" }) {
  return (
    <>
      <section className="workout-section" aria-labelledby="weekly-title">
        <h2 id="weekly-title">Your week</h2>
        <SummaryCards workouts={workouts} />
      </section>
      <ExerciseProgress workouts={workouts} units={units} theme={theme} />
      <BodyWeightProgress units={units} theme={theme} />
    </>
  );
}
