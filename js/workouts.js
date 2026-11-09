import { load, save } from "./storage.js";
import { createId, formatDate, todayString } from "./utils.js";

const form = document.querySelector("#workout-form");
const dateInput = document.querySelector("#workout-date");
const exerciseInput = document.querySelector("#workout-exercise");
const modeInput = document.querySelector("#set-mode");
const setList = document.querySelector("#set-list");
const message = document.querySelector("#workout-message");
const submitButton = form.querySelector('[type="submit"]');
const cancelButton = document.querySelector("#cancel-edit");
let workouts = [];
let editingId = null;

function showMessage(text, isError = false) {
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
  label.append(caption, input);
  return { label, input };
}

function addSet(set = { reps: "", seconds: "", weight: "" }) {
  const row = document.createElement("div");
  row.className = "set-row";
  row.dataset.setRow = "";

  const reps = makeInput("Reps", "reps", set.reps, 1, 1);
  const seconds = makeInput("Seconds", "seconds", set.seconds, 1, 1);
  const weight = makeInput("Weight kg", "weight", set.weight || "", 0.01, 0.01);
  weight.input.placeholder = "Optional";

  const remove = document.createElement("button");
  remove.className = "remove-set";
  remove.type = "button";
  remove.textContent = "Remove";
  remove.setAttribute("aria-label", `Remove set ${setList.children.length + 1}`);
  remove.addEventListener("click", () => {
    row.remove();
    updateSetRows();
  });

  row.append(reps.label, seconds.label, weight.label, remove);
  setList.append(row);
  updateSetRows();
}

function updateSetRows() {
  const isHold = modeInput.value === "hold";
  const rows = [...setList.querySelectorAll("[data-set-row]")];

  rows.forEach((row, index) => {
    const reps = row.querySelector('[name="reps"]');
    const seconds = row.querySelector('[name="seconds"]');
    const remove = row.querySelector(".remove-set");
    reps.closest("label").hidden = isHold;
    seconds.closest("label").hidden = !isHold;
    reps.required = !isHold;
    seconds.required = isHold;
    remove.disabled = rows.length === 1;
    remove.setAttribute("aria-label", `Remove set ${index + 1}`);
  });
}

function resetForm() {
  form.reset();
  dateInput.value = todayString();
  editingId = null;
  submitButton.textContent = "Save workout";
  cancelButton.hidden = true;
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
  const recent = [...new Set([...workouts].reverse().sort((a, b) => b.date.localeCompare(a.date)).map((item) => item.exercise))].slice(0, 5);

  if (recent.length === 0) {
    const hint = document.createElement("p");
    hint.className = "muted";
    hint.textContent = "Your recent choices will appear here.";
    container.append(hint);
    return;
  }

  recent.forEach((exercise) => {
    const button = document.createElement("button");
    button.className = "recent-button";
    button.type = "button";
    button.textContent = exercise;
    button.addEventListener("click", () => {
      exerciseInput.value = exercise;
      exerciseInput.focus();
      form.scrollIntoView({ block: "start" });
    });
    container.append(button);
  });
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
      const details = document.createElement("p");
      const mode = workout.sets.some((set) => set.seconds > 0) ? "hold" : "reps";
      details.textContent = workout.sets.map((set) => formatSet(set, mode)).join("  ·  ");
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
  editingId = workout.id;
  dateInput.value = workout.date;
  exerciseInput.value = workout.exercise;
  modeInput.value = workout.sets.some((set) => set.seconds > 0) ? "hold" : "reps";
  document.querySelector("#workout-notes").value = workout.notes || "";
  setList.replaceChildren();
  workout.sets.forEach((set) => addSet(set));
  submitButton.textContent = "Update workout";
  cancelButton.hidden = false;
  showMessage("");
  form.scrollIntoView({ block: "start" });
  exerciseInput.focus();
}

function persist(nextWorkouts) {
  save("workoutLog", nextWorkouts);
  workouts = nextWorkouts;
  render();
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

  const isHold = modeInput.value === "hold";
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
    showMessage(wasEditing ? "Workout updated." : "Workout saved.");
  } catch (error) {
    showMessage(error.message, true);
  }
});

document.querySelector("#add-set").addEventListener("click", () => addSet());
modeInput.addEventListener("change", updateSetRows);
cancelButton.addEventListener("click", resetForm);

dateInput.value = todayString();
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
