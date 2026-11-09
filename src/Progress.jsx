import { useEffect, useRef, useState } from "react";
import { save } from "../js/storage.js";
import { formatDate, readList } from "./data.js";
import { todayString } from "../js/utils.js";
import { fromKilograms, toKilograms } from "./settingsData.js";
import SummaryCards from "./SummaryCards.jsx";

function initialBodyData() {
  try {
    return { stats: readList("bodyStats"), error: "" };
  } catch (error) {
    return { stats: [], error: error.message };
  }
}

function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    color: "#a3afbf",
    scales: {
      y: { beginAtZero: true, ticks: { color: "#a3afbf" }, grid: { color: "#364357" } },
      x: { ticks: { color: "#a3afbf" }, grid: { color: "#364357" } },
    },
    plugins: { legend: { labels: { color: "#f1f5f9" } } },
  };
}

function ExerciseProgress({ workouts, units }) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState("");
  const canvasRef = useRef(null);
  const exercises = [...new Set(workouts.map((workout) => workout.exercise))].sort();
  const records = workouts
    .filter((workout) => workout.exercise === selected)
    .sort((a, b) => a.date.localeCompare(b.date));
  const isHold = records.length > 0 && records.every((workout) => workout.sets.some((set) => set.seconds > 0));

  useEffect(() => {
    if (!expanded || records.length === 0 || !window.Chart || !canvasRef.current) return undefined;
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
    const chart = new window.Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: dates.map(formatDate),
        datasets: [
          {
            label: isHold ? "Best hold (sec)" : "Best reps",
            data: values.map((point) => point.best),
            borderColor: "#4b8be8",
            backgroundColor: "#4b8be8",
          },
          ...(!isHold ? [{
            label: `Volume (reps × ${units === "imperial" ? "lb" : "kg"})`,
            data: values.map((point) => point.volume * (units === "imperial" ? 1 / 0.45359237 : 1)),
            borderColor: "#8b9bb3",
            backgroundColor: "#8b9bb3",
            yAxisID: "y1",
          }] : []),
        ],
      },
      options: {
        ...chartOptions(),
        scales: {
          ...chartOptions().scales,
          y1: { beginAtZero: true, position: "right", grid: { drawOnChartArea: false } },
        },
      },
    });
    return () => chart.destroy();
  }, [expanded, records, isHold, units]);

  const chartAvailable = Boolean(window.Chart);
  return (
    <details className="progress-disclosure" onToggle={(event) => setExpanded(event.currentTarget.open)}>
      <summary>Exercise progress</summary>
      <div className="disclosure-content">
        <label className="field">
          <span>Exercise</span>
          <select id="progress-exercise" aria-label="Choose an exercise to see progress" value={selected} onChange={(event) => setSelected(event.target.value)} disabled={exercises.length === 0}>
            <option value="">Choose an exercise</option>
            {exercises.map((exercise) => <option key={exercise}>{exercise}</option>)}
          </select>
        </label>
        {records.length > 0 && chartAvailable
          ? <div className="progress-card"><canvas id="exercise-chart" ref={canvasRef} role="img" aria-label="Exercise performance chart" /></div>
          : <p className="muted">{records.length === 0 ? "Log workouts to see exercise progress here." : "The chart needs an internet connection to load."}</p>}
      </div>
    </details>
  );
}

function BodyWeightProgress({ units }) {
  const [bodyData, setBodyData] = useState(initialBodyData);
  const [date, setDate] = useState(todayString());
  const [weight, setWeight] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(Boolean(bodyData.error));
  const [expanded, setExpanded] = useState(false);
  const canvasRef = useRef(null);
  const stats = bodyData.stats;
  const sortedStats = [...stats].sort((a, b) => a.date.localeCompare(b.date));

  useEffect(() => {
    if (!expanded || !sortedStats.length || !window.Chart || !canvasRef.current) return undefined;
    const chart = new window.Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: sortedStats.map((item) => formatDate(item.date)),
        datasets: [{
          label: `Weight (${units === "imperial" ? "lb" : "kg"})`,
          data: sortedStats.map((item) => fromKilograms(item.weightKg, units)),
          borderColor: "#4b8be8",
          backgroundColor: "#4b8be8",
          tension: 0.25,
        }],
      },
      options: {
        ...chartOptions(),
        scales: {
          ...chartOptions().scales,
          y: { beginAtZero: false, ticks: { color: "#a3afbf" }, grid: { color: "#364357" } },
        },
      },
    });
    return () => chart.destroy();
  }, [expanded, sortedStats, units]);

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
      setMessage("Weight saved.");
    } catch (error) {
      setIsError(true);
      setMessage(error.message);
    }
  }

  return (
    <details className="progress-disclosure" onToggle={(event) => setExpanded(event.currentTarget.open)}>
      <summary>Body weight</summary>
      <div className="disclosure-content">
        {bodyData.error && <p className="form-message is-error" role="alert">{bodyData.error}</p>}
        <form className="body-stats-form" noValidate onSubmit={submit}>
          <label className="field">
            <span>Date</span>
            <input id="body-date" type="date" required disabled={Boolean(bodyData.error)} value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label className="field">
            <span>Weight ({units === "imperial" ? "lb" : "kg"})</span>
            <input id="body-weight" type="number" min="0.1" step="0.1" inputMode="decimal" placeholder={units === "imperial" ? "e.g. 145" : "e.g. 65.5"} required disabled={Boolean(bodyData.error)} value={weight} onChange={(event) => setWeight(event.target.value)} />
          </label>
          <button className="primary-button" type="submit" disabled={Boolean(bodyData.error)}>Save weight</button>
          {message && <p id="body-stats-message" className={`form-message${isError ? " is-error" : ""}`} role={isError ? "alert" : "status"}>{message}</p>}
        </form>
        {sortedStats.length > 0 && window.Chart
          ? <div className="progress-card"><canvas id="body-weight-chart" ref={canvasRef} role="img" aria-label="Body weight history chart" /></div>
          : <p className="muted">{sortedStats.length === 0 ? "Log body weight to see your trend." : "The chart needs an internet connection to load."}</p>}
      </div>
    </details>
  );
}

export default function Progress({ workouts, units = "metric" }) {
  return (
    <>
      <section className="workout-section" aria-labelledby="weekly-title">
        <h2 id="weekly-title">Your week</h2>
        <SummaryCards workouts={workouts} />
      </section>
      <ExerciseProgress workouts={workouts} units={units} />
      <BodyWeightProgress units={units} />
    </>
  );
}
