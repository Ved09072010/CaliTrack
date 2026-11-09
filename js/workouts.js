import { load, save } from "./storage.js";
import { createId, currentTimeString, formatDate, todayString } from "./utils.js";

const form = document.querySelector("#workout-form");
const dateInput = document.querySelector("#workout-date");
const timeInput = document.querySelector("#workout-time");
const exerciseInput = document.querySelector("#workout-exercise");
const modeInput = document.querySelector("#set-mode");
const setList = document.querySelector("#set-list");
const message = document.querySelector("#workout-message");
const submitButton = form.querySelector('[type="submit"]');
const cancelButton = document.querySelector("#cancel-edit");
const openFormButton = document.querySelector("#show-workout-form");
const workoutDialog = document.querySelector("#workout-dialog");
const feedback = document.querySelector("#workout-feedback");
let workouts = [];
let editingId = null;
let setMode = "reps";

function showMessage(text, isError = false) {
  feedback.textContent = text;
  feedback.classList.toggle("is-error", isError);
  feedback.hidden = text === "";
  message.textContent = text;
  message.classList.toggle("is-error", isError);
  message.setAttribute("role", isError ? "alert" : "status");
  message.hidden = text === "";
}

function makeInput(labelText, name, value, min, step) {
  const label = document.createElement("label");
  label.className = "field set-field";
  const caption = document.createElement("span");
  caption.textContent = labelText;
  const input = document.createElement("input");
  input.type = "number";
  input.name = name;
  input.min = String(min);
  input.step = String(step);
  input.value = value;
  input.inputMode = step === 1 ? "numeric" : "decimal";
  input.setAttribute("aria-label", labelText);
  label.append(caption, input);
  return { label, input };
}

function addSet(set = { reps: "", seconds: "", weight: "" }) {
  const row = document.createElement("div");
  row.className = "set-row";
  row.dataset.setRow = "";

  const number = document.createElement("span");
  number.className = "set-number";
  number.setAttribute("aria-hidden", "true");
  const reps = makeInput("Reps", "reps", set.reps, 1, 1);
  const seconds = makeInput("Seconds", "seconds", set.seconds, 1, 1);
  const weight = makeInput("Weight kg", "weight", set.weight || "", 0.01, 0.01);
  weight.input.placeholder = "Optional";

  const remove = document.createElement("button");
  remove.className = "remove-set";
  remove.type = "button";
  remove.textContent = "×";
  remove.setAttribute("aria-label", `Remove set ${setList.children.length + 1}`);
  remove.addEventListener("click", () => {
    row.remove();
    updateSetRows();
  });

  row.append(number, reps.label, seconds.label, weight.label, remove);
  setList.append(row);
  updateSetRows();
}

function updateSetRows() {
  const isHold = setMode === "hold";
  const rows = [...setList.querySelectorAll("[data-set-row]")];

  rows.forEach((row, index) => {
    const reps = row.querySelector('[name="reps"]');
    const seconds = row.querySelector('[name="seconds"]');
    const remove = row.querySelector(".remove-set");
    row.querySelector(".set-number").textContent = String(index + 1).padStart(2, "0");
    reps.closest("label").hidden = isHold;
    seconds.closest("label").hidden = !isHold;
    reps.required = !isHold;
    seconds.required = isHold;
    remove.disabled = rows.length === 1;
    remove.setAttribute("aria-label", `Remove set ${index + 1}`);
    reps.setAttribute("aria-label", `Set ${index + 1} reps`);
    seconds.setAttribute("aria-label", `Set ${index + 1} hold seconds`);
    row.querySelector('[name="weight"]').setAttribute("aria-label", `Set ${index + 1} weight in kilograms`);
  });
}

function resetForm() {
  form.reset();
  dateInput.value = todayString();
  timeInput.value = currentTimeString();
  editingId = null;
  setMode = "reps";
  updateModeButtons();
  submitButton.textContent = "Save workout";
  setList.replaceChildren();
  addSet();
  showMessage("");
}

function formatSet(set, mode) {
  const amount = mode === "hold" ? `${set.seconds} sec` : `${set.reps} reps`;
  const load = set.weight ? ` · ${set.weight} kg` : "";
  return `${amount}${load}`;
}

function renderRecent() {
  const container = document.querySelector("#recent-exercises");
  container.replaceChildren();
  const recent = [...new Set([...workouts].reverse().map((item) => item.exercise))].slice(0, 5);

  if (recent.length === 0) {
    container.hidden = true;
    return;
  }

  container.hidden = false;
  const label = document.createElement("span");
  label.className = "recent-label";
  label.textContent = "Recent";
  container.append(label);
  recent.forEach((exercise) => {
    const button = document.createElement("button");
    button.className = "recent-button";
    button.type = "button";
    button.textContent = exercise;
    button.addEventListener("click", () => {
      openWorkoutForm();
      exerciseInput.value = exercise;
      exerciseInput.focus();
    });
    container.append(button);
  });
}

function openWorkoutForm() {
  feedback.hidden = true;
  if (!editingId) {
    dateInput.value = todayString();
    timeInput.value = currentTimeString();
  }
  if (!workoutDialog.open) workoutDialog.showModal();
  exerciseInput.focus();
}

function closeWorkoutForm() {
  if (workoutDialog.open) workoutDialog.close();
  editingId = null;
}

function renderHistory() {
  const container = document.querySelector("#workout-history");
  container.replaceChildren();
  const grouped = [...workouts]
    .sort((a, b) => b.date.localeCompare(a.date))
    .reduce((groups, workout) => {
      groups[workout.date] ??= [];
      groups[workout.date].push(workout);
      return groups;
    }, {});

  const dates = Object.keys(grouped);
  if (dates.length === 0) {
    const empty = document.createElement("p");
    empty.className = "card empty-card";
    empty.textContent = "No workouts yet. Log your first session above.";
    container.append(empty);
    return;
  }

  const recordIds = new Set();
  const bestByExercise = new Map();
  [...workouts]
    .map((workout, index) => ({ workout, index }))
    .sort((a, b) => a.workout.date.localeCompare(b.workout.date) || a.index - b.index)
    .forEach(({ workout }) => {
      const isHold = workout.sets.some((set) => set.seconds > 0);
      const mode = isHold ? "hold" : "reps";
      const score = Math.max(...workout.sets.map((set) => isHold ? set.seconds : set.reps));
      const key = `${workout.exercise}:${mode}`;
      if (score > (bestByExercise.get(key) || 0)) {
        recordIds.add(workout.id);
        bestByExercise.set(key, score);
      }
    });

  dates.forEach((date) => {
    const group = document.createElement("section");
    group.className = "history-group";
    const heading = document.createElement("h3");
    heading.textContent = formatDate(date);
    group.append(heading);

    grouped[date].forEach((workout) => {
      const card = document.createElement("article");
      card.className = "card history-card";
      const content = document.createElement("div");
      const title = document.createElement("h4");
      title.textContent = workout.exercise;
      if (recordIds.has(workout.id)) {
        const badge = document.createElement("span");
        badge.className = "pr-badge";
        badge.textContent = "New PR";
        title.append(" ", badge);
      }
      const details = document.createElement("p");
      const mode = workout.sets.some((set) => set.seconds > 0) ? "hold" : "reps";
      const time = workout.time ? `${workout.time}  ·  ` : "";
      details.textContent = `${time}${workout.sets.map((set) => formatSet(set, mode)).join("  ·  ")}`;
      content.append(title, details);

      if (workout.notes) {
        const note = document.createElement("p");
        note.className = "history-note";
        note.textContent = workout.notes;
        content.append(note);
      }

      const actions = document.createElement("div");
      actions.className = "history-actions";
      const edit = document.createElement("button");
      edit.className = "text-button";
      edit.type = "button";
      edit.textContent = "Edit";
      edit.addEventListener("click", () => editWorkout(workout));
      const remove = document.createElement("button");
      remove.className = "text-button danger-button";
      remove.type = "button";
      remove.textContent = "Delete";
      remove.addEventListener("click", () => deleteWorkout(workout));
      actions.append(edit, remove);
      card.append(content, actions);
      group.append(card);
    });

    container.append(group);
  });
}

function render() {
  renderRecent();
  renderHistory();
}

function editWorkout(workout) {
  openWorkoutForm();
  editingId = workout.id;
  dateInput.value = workout.date;
  timeInput.value = workout.time || "";
  exerciseInput.value = workout.exercise;
  setMode = workout.sets.some((set) => set.seconds > 0) ? "hold" : "reps";
  updateModeButtons();
  document.querySelector("#workout-notes").value = workout.notes || "";
  setList.replaceChildren();
  workout.sets.forEach((set) => addSet(set));
  submitButton.textContent = "Update workout";
  showMessage("");
}

function updateModeButtons() {
  modeInput.querySelectorAll("[data-mode]").forEach((button) => {
    const selected = button.dataset.mode === setMode;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function persist(nextWorkouts) {
  save("workoutLog", nextWorkouts);
  workouts = nextWorkouts;
  render();
  window.dispatchEvent(new Event("workouts-updated"));
}

function deleteWorkout(workout) {
  if (!window.confirm(`Delete your ${workout.exercise} workout from ${formatDate(workout.date)}?`)) {
    return;
  }

  try {
    persist(workouts.filter((item) => item.id !== workout.id));
    if (editingId === workout.id) resetForm();
    showMessage("Workout deleted.");
  } catch (error) {
    showMessage(error.message, true);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  showMessage("");

  if (!dateInput.value || !exerciseInput.value) {
    showMessage("Choose a date and exercise before saving.", true);
    return;
  }

  const isHold = setMode === "hold";
  const setRows = [...setList.querySelectorAll("[data-set-row]")];
  const sets = [];

  for (const [index, row] of setRows.entries()) {
    const repsText = row.querySelector('[name="reps"]').value;
    const secondsText = row.querySelector('[name="seconds"]').value;
    const weightText = row.querySelector('[name="weight"]').value;
    const countText = isHold ? secondsText : repsText;
    const count = Number(countText);
    const weight = weightText === "" ? 0 : Number(weightText);

    if (countText === "" || !Number.isInteger(count) || count < 1) {
      showMessage(`Enter a whole number above zero for ${isHold ? "seconds" : "reps"} in set ${index + 1}.`, true);
      return;
    }

    if (weightText !== "" && (!Number.isFinite(weight) || weight <= 0)) {
      showMessage(`Enter a weight above zero in set ${index + 1}, or leave it blank.`, true);
      return;
    }

    sets.push({ reps: isHold ? 0 : count, seconds: isHold ? count : 0, weight });
  }

  const entry = {
    id: editingId || createId(),
    date: dateInput.value,
    time: timeInput.value,
    exercise: exerciseInput.value,
    sets,
    notes: document.querySelector("#workout-notes").value.trim(),
  };
  const wasEditing = editingId !== null;
  const nextWorkouts = editingId
    ? workouts.map((item) => item.id === editingId ? entry : item)
    : [...workouts, entry];

  try {
    persist(nextWorkouts);
    resetForm();
    closeWorkoutForm();
    showMessage(wasEditing ? "Workout updated." : "Workout saved.");
  } catch (error) {
    showMessage(error.message, true);
  }
});

document.querySelector("#add-set").addEventListener("click", () => addSet());
openFormButton.addEventListener("click", openWorkoutForm);
modeInput.addEventListener("click", (event) => {
  const button = event.target.closest("[data-mode]");
  if (!button) return;
  setMode = button.dataset.mode;
  updateModeButtons();
  updateSetRows();
});
cancelButton.addEventListener("click", () => {
  resetForm();
  closeWorkoutForm();
});
workoutDialog.addEventListener("cancel", () => {
  resetForm();
  closeWorkoutForm();
});

dateInput.value = todayString();
timeInput.value = currentTimeString();
addSet();
try {
  workouts = load("workoutLog", []);
  if (!Array.isArray(workouts)) {
    throw new Error("Saved workout data should be a list. Please export it before changing the data.");
  }
  render();
} catch (error) {
  showMessage(error.message, true);
  form.querySelectorAll("input, select, textarea, button").forEach((control) => {
    control.disabled = true;
  });
}
