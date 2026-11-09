import { load, save } from "./storage.js";
import { formatDate, todayString } from "./utils.js";

let exerciseChart;
let weightChart;

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function readList(key) {
  const value = load(key, []);
  if (!Array.isArray(value)) throw new Error(`Saved ${key} data must be a list.`);
  return value;
}

function startOfWeek() {
  const date = new Date(`${todayString()}T12:00:00`);
  date.setDate(date.getDate() - (date.getDay() + 6) % 7);
  return dateKey(date);
}

function renderWeekly(workouts) {
  const weekStart = startOfWeek();
  const thisWeek = workouts.filter((workout) => workout.date >= weekStart && workout.date <= todayString());
  const reps = thisWeek.reduce((sum, workout) => sum + workout.sets.reduce((total, set) => total + set.reps, 0), 0);
  const days = new Set(workouts.map((workout) => workout.date));
  let cursor = new Date(`${todayString()}T12:00:00`);
  if (!days.has(todayString())) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  ["#weekly-summary", "#home-weekly-summary"].forEach((selector) => {
    const summary = document.querySelector(selector);
    summary.replaceChildren();
    [["Workouts", thisWeek.length], ["Total reps", reps], ["Day streak", streak]].forEach(([label, value]) => {
      const card = document.createElement("div");
      card.className = "summary-card";
      const number = document.createElement("strong");
      number.textContent = value;
      const caption = document.createElement("span");
      caption.textContent = label;
      card.append(number, caption);
      summary.append(card);
    });
  });
}

function drawExercise(workouts) {
  const select = document.querySelector("#progress-exercise");
  const selected = select.value;
  const exercises = [...new Set(workouts.map((workout) => workout.exercise))].sort();
  select.replaceChildren(...exercises.map((name) => new Option(name, name)));
  if (exercises.includes(selected)) select.value = selected;

  const records = workouts.filter((workout) => workout.exercise === select.value).sort((a, b) => a.date.localeCompare(b.date));
  const message = document.querySelector("#exercise-chart-message");
  if (!records.length) {
    if (exerciseChart) exerciseChart.destroy();
    exerciseChart = null;
    message.textContent = "Log workouts to see exercise progress here.";
    return;
  }
  if (!window.Chart) {
    message.textContent = "The chart could not load. Check your internet connection and refresh.";
    return;
  }

  const isHold = records.every((workout) => workout.sets.some((set) => set.seconds > 0));
  const byDate = new Map();
  records.forEach((workout) => {
    const point = byDate.get(workout.date) || { best: 0, volume: 0 };
    workout.sets.forEach((set) => {
      point.best = Math.max(point.best, isHold ? set.seconds : set.reps);
      if (!isHold) point.volume += set.reps * set.weight;
    });
    byDate.set(workout.date, point);
  });
  message.textContent = isHold ? "Best hold time, in seconds." : "Best reps and added-weight volume (reps × kg).";
  if (exerciseChart) exerciseChart.destroy();
  exerciseChart = new window.Chart(document.querySelector("#exercise-chart"), {
    type: "line",
    data: {
      labels: [...byDate.keys()].map(formatDate),
      datasets: [
        { label: isHold ? "Best hold (sec)" : "Best reps", data: [...byDate.values()].map((point) => point.best), borderColor: "#4b8be8", backgroundColor: "#4b8be8", yAxisID: "y" },
        ...(!isHold ? [{ label: "Volume (reps × kg)", data: [...byDate.values()].map((point) => point.volume), borderColor: "#8b9bb3", backgroundColor: "#8b9bb3", yAxisID: "y1" }] : []),
      ],
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true }, y1: { beginAtZero: true, position: "right", grid: { drawOnChartArea: false } } } },
  });
}

function drawWeight(stats) {
  const message = document.querySelector("#body-weight-chart-message");
  if (!stats.length) {
    if (weightChart) weightChart.destroy();
    weightChart = null;
    message.hidden = false;
    return;
  }
  if (!window.Chart) {
    message.textContent = "The chart could not load. Check your internet connection and refresh.";
    return;
  }

  message.hidden = true;
  if (weightChart) weightChart.destroy();
  const sorted = [...stats].sort((a, b) => a.date.localeCompare(b.date));
  weightChart = new window.Chart(document.querySelector("#body-weight-chart"), {
    type: "line",
    data: {
      labels: sorted.map((item) => formatDate(item.date)),
      datasets: [{ label: "Weight (kg)", data: sorted.map((item) => item.weightKg), borderColor: "#4b8be8", backgroundColor: "#4b8be8", tension: 0.25 }],
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: false } } },
  });
}

export function renderProgress() {
  try {
    const workouts = readList("workoutLog");
    const stats = readList("bodyStats");
    renderWeekly(workouts);
    drawExercise(workouts);
    drawWeight(stats);
  } catch (error) {
    document.querySelector("#weekly-summary").textContent = error.message;
  }
}

document.querySelector("#progress-exercise").addEventListener("change", () => {
  try {
    drawExercise(readList("workoutLog"));
  } catch (error) {
    document.querySelector("#exercise-chart-message").textContent = error.message;
  }
});

document.querySelectorAll(".progress-disclosure").forEach((details) => {
  details.addEventListener("toggle", () => {
    if (details.open) renderProgress();
  });
});

document.querySelector("#body-date").value = todayString();
document.querySelector("#body-stats-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const date = document.querySelector("#body-date").value;
  const weightKg = Number(document.querySelector("#body-weight").value);
  const message = document.querySelector("#body-stats-message");
  if (!date || !Number.isFinite(weightKg) || weightKg <= 0) {
    message.textContent = "Enter a date and a weight above zero.";
    message.classList.add("is-error");
    message.hidden = false;
    return;
  }

  try {
    const stats = readList("bodyStats").filter((item) => item.date !== date);
    stats.push({ date, weightKg, notes: "" });
    save("bodyStats", stats);
    document.querySelector("#body-weight").value = "";
    message.classList.remove("is-error");
    message.textContent = "Weight saved.";
    message.hidden = false;
    renderProgress();
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("is-error");
    message.hidden = false;
  }
});

window.addEventListener("workouts-updated", renderProgress);
window.addEventListener("load", renderProgress, { once: true });
