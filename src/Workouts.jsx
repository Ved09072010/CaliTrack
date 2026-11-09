import { useEffect, useRef, useState } from "react";
import { createId, currentTimeString, formatDate, todayString } from "../js/utils.js";
import { fromKilograms, toKilograms } from "./settingsData.js";
import { EXERCISES } from "./data.js";

const newSet = () => ({ reps: "", seconds: "", weight: "" });
const emptyForm = () => ({ exercise: "", mode: "reps", sets: [newSet()], notes: "" });
const HOLD_EXERCISES = new Set([
  "Dead hang",
  "Hollow hold",
  "Plank",
  "Planche lean",
  "Side plank",
  "Tuck front lever hold",
  "Tuck L-sit",
  "Wall handstand hold",
]);

function formForExercise(exercise) {
  return {
    ...emptyForm(),
    exercise,
    mode: HOLD_EXERCISES.has(exercise) ? "hold" : "reps",
  };
}

function getInitialForm() {
  return emptyForm();
}

function setSummary(set, mode, units) {
  const amount = mode === "hold" ? `${set.seconds} sec` : `${set.reps} reps`;
  const weight = set.weight ? Number(fromKilograms(set.weight, units).toFixed(1)) : 0;
  return `${amount}${weight ? ` · ${weight} ${units === "imperial" ? "lb" : "kg"}` : ""}`;
}

function getRecordIds(workouts) {
  const bestByExercise = new Map();
  const records = new Set();
  [...workouts]
    .map((workout, index) => ({ workout, index }))
    .sort((a, b) => a.workout.date.localeCompare(b.workout.date) || a.index - b.index)
    .forEach(({ workout }) => {
      const isHold = workout.sets.some((set) => set.seconds > 0);
      const score = Math.max(...workout.sets.map((set) => isHold ? set.seconds : set.reps));
      const key = `${workout.exercise}:${isHold ? "hold" : "reps"}`;
      if (score > (bestByExercise.get(key) || 0)) {
        bestByExercise.set(key, score);
        records.add(workout.id);
      }
    });
  return records;
}

function WorkoutDialog({ isOpen, onClose, workouts, onSave, onMessage, editingWorkout, initialExercise, disabled, units }) {
  const dialogRef = useRef(null);
  const [form, setForm] = useState(getInitialForm);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
    if (isOpen) dialog.querySelector("#workout-exercise")?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!editingWorkout) return;
    setEditing(editingWorkout);
    setForm({
      exercise: editingWorkout.exercise,
      mode: editingWorkout.sets.some((set) => set.seconds > 0) ? "hold" : "reps",
      sets: editingWorkout.sets.map((set) => ({
        reps: set.reps || "",
        seconds: set.seconds || "",
        weight: set.weight ? String(Number(fromKilograms(set.weight, units).toFixed(2))) : "",
      })),
      notes: editingWorkout.notes || "",
    });
    setError("");
    onMessage("");
  }, [editingWorkout, onMessage, units]);

  useEffect(() => {
    if (editingWorkout || !initialExercise) return;
    setEditing(null);
    setForm(formForExercise(initialExercise));
  }, [editingWorkout, initialExercise]);

  function close() {
    setForm(emptyForm());
    setEditing(null);
    setError("");
    onClose();
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateSet(index, field, value) {
    setForm((current) => ({
      ...current,
      sets: current.sets.map((set, setIndex) => setIndex === index ? { ...set, [field]: value } : set),
    }));
  }

  function submit(event) {
    event.preventDefault();
    setError("");
    if (!form.exercise) {
      setError("Choose an exercise before saving.");
      return;
    }

    const isHold = form.mode === "hold";
    const sets = [];
    for (const [index, set] of form.sets.entries()) {
      const rawCount = isHold ? set.seconds : set.reps;
      const count = Number(rawCount);
      const weight = set.weight === "" ? 0 : Number(set.weight);
      if (rawCount === "" || !Number.isInteger(count) || count < 1) {
        setError(`Enter a whole number above zero for ${isHold ? "seconds" : "reps"} in set ${index + 1}.`);
        return;
      }
      if (set.weight !== "" && (!Number.isFinite(weight) || weight <= 0)) {
        setError(`Enter a weight above zero in set ${index + 1}, or leave it blank.`);
        return;
      }
      sets.push({ reps: isHold ? 0 : count, seconds: isHold ? count : 0, weight: toKilograms(weight, units) });
    }

    const now = new Date();
    const workout = {
      id: editing?.id || createId(),
      date: editing?.date || todayString(now),
      time: editing?.time || currentTimeString(now),
      exercise: form.exercise,
      sets,
      notes: form.notes.trim(),
    };
    const nextWorkouts = editing
      ? workouts.map((item) => item.id === editing.id ? workout : item)
      : [...workouts, workout];
    try {
      onSave(nextWorkouts);
      close();
      onMessage(editing ? "Workout updated." : "Workout saved.");
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      id="workout-dialog"
      className="workout-dialog"
      onCancel={(event) => { event.preventDefault(); close(); }}
    >
      <form id="workout-form" className="workout-form" noValidate onSubmit={submit}>
        <div className="workout-form-heading">
          <h2>Log a workout</h2>
          <button className="close-button" type="button" aria-label="Close workout form" onClick={close}>×</button>
        </div>
        <label className="field">
          <span>Exercise</span>
          <select id="workout-exercise" value={form.exercise} onChange={(event) => updateForm("exercise", event.target.value)}>
            <option value="">Choose an exercise</option>
            {EXERCISES.map((exercise) => <option key={exercise}>{exercise}</option>)}
          </select>
        </label>
        <div className="mode-control">
          <span className="control-label" id="mode-label">Track by</span>
          <div className="segmented-control" role="group" aria-labelledby="mode-label">
            {["reps", "hold"].map((mode) => (
              <button
                className={`mode-button${form.mode === mode ? " is-selected" : ""}`}
                type="button"
                aria-pressed={form.mode === mode}
                onClick={() => updateForm("mode", mode)}
                key={mode}
              >
                {mode === "reps" ? "Reps" : "Hold time"}
              </button>
            ))}
          </div>
        </div>
        <div className="set-heading">
          <h2>Sets</h2>
          <button className="text-button" type="button" onClick={() => setForm((current) => ({ ...current, sets: [...current.sets, newSet()] }))}>+ Add set</button>
        </div>
        <div className="set-column-labels" aria-hidden="true">
          <span />
          <span>{form.mode === "hold" ? "Hold (sec)" : "Reps"}</span>
          <span>Weight ({units === "imperial" ? "lb" : "kg"})</span>
          <span />
        </div>
        <div className="set-list">
          {form.sets.map((set, index) => (
            <div className="set-row" key={index}>
              <span className="set-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              {form.mode === "reps" ? (
                <NumberField label={`Set ${index + 1} reps`} value={set.reps} min="1" step="1" onChange={(value) => updateSet(index, "reps", value)} />
              ) : (
                <NumberField label={`Set ${index + 1} hold seconds`} value={set.seconds} min="1" step="1" onChange={(value) => updateSet(index, "seconds", value)} />
              )}
              <NumberField label={`Set ${index + 1} weight in ${units === "imperial" ? "pounds" : "kilograms"}`} value={set.weight} min="0.01" step="0.01" placeholder="Optional" onChange={(value) => updateSet(index, "weight", value)} />
              <button className="remove-set" type="button" aria-label={`Remove set ${index + 1}`} disabled={form.sets.length === 1} onClick={() => setForm((current) => ({ ...current, sets: current.sets.filter((_, setIndex) => setIndex !== index) }))}>×</button>
            </div>
          ))}
        </div>
        <label className="field">
          <span>Notes <span className="muted">(optional)</span></span>
          <textarea rows="2" maxLength="500" placeholder="How did it feel?" value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} />
        </label>
        {error && <p className="form-message is-error" role="alert">{error}</p>}
        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={disabled}>{editing ? "Update workout" : "Save workout"}</button>
        </div>
      </form>
    </dialog>
  );
}

function NumberField({ label, value, min, step, placeholder, onChange }) {
  return (
    <label className="field set-field">
      <span>{label}</span>
      <input
        type="number"
        aria-label={label}
        inputMode={step === "1" ? "numeric" : "decimal"}
        min={min}
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export default function Workouts({
  workouts,
  storageError,
  onSave,
  openRequest,
  initialExercise = "",
  activeRoutine = null,
  onLogRoutineExercise,
  units = "metric",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [selectedEdit, setSelectedEdit] = useState(null);
  const [quickExercise, setQuickExercise] = useState("");
  const recordIds = getRecordIds(workouts);
  const recent = [...new Set([...workouts].reverse().map((workout) => workout.exercise))].slice(0, 5);

  useEffect(() => {
    if (openRequest > 0) {
      setSelectedEdit(null);
      setQuickExercise(initialExercise);
      setIsOpen(true);
    }
  }, [initialExercise, openRequest]);

  function edit(workout) {
    setSelectedEdit(workout);
    setIsOpen(true);
  }

  function finishClose() {
    setIsOpen(false);
    setSelectedEdit(null);
    setQuickExercise("");
  }

  function saveWorkouts(nextWorkouts) {
    onSave(nextWorkouts);
    setSelectedEdit(null);
  }

  function deleteWorkout(workout) {
    if (!window.confirm(`Delete your ${workout.exercise} workout from ${formatDate(workout.date)}?`)) return;
    try {
      onSave(workouts.filter((item) => item.id !== workout.id));
      setFeedback("Workout deleted.");
    } catch (error) {
      setFeedback(error.message);
    }
  }

  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">TRAINING</p>
        <h1>Workouts</h1>
        <p className="intro">Log a session, then check in on your progress.</p>
      </div>
      <div className="workout-start">
        <button id="show-workout-form" className="primary-button log-workout-button" type="button" disabled={Boolean(storageError)} onClick={() => { setSelectedEdit(null); setQuickExercise(""); setIsOpen(true); }}>+ Log workout</button>
        {storageError && <p className="form-message is-error" role="alert">{storageError}</p>}
        {feedback && <p className="form-message" role="status">{feedback}</p>}
        {recent.length > 0 && (
          <div className="recent-exercises" aria-label="Recent exercises">
            <span className="recent-label">Recent</span>
            {recent.map((exercise) => (
              <button className="recent-button" type="button" onClick={() => { setSelectedEdit(null); setQuickExercise(exercise); setIsOpen(true); }} key={exercise}>{exercise}</button>
            ))}
          </div>
        )}
      </div>
      {activeRoutine && (
        <section className="active-routine" aria-labelledby="active-routine-title">
          <div>
            <span className="routine-level">TODAY'S ROUTINE · {activeRoutine.level}</span>
            <h2 id="active-routine-title">{activeRoutine.name}</h2>
          </div>
          <ol className="active-routine-list">
            {activeRoutine.exercises.map((exercise, index) => (
              <li key={`${activeRoutine.id}-${exercise.name}-${index}`}>
                <span><strong>{index + 1}. {exercise.name}</strong><small>{exercise.target}</small></span>
                <button className="text-button" type="button" disabled={Boolean(storageError)} onClick={() => onLogRoutineExercise(exercise.name)}>Log</button>
              </li>
            ))}
          </ol>
        </section>
      )}
      <section className="workout-section" aria-labelledby="history-title">
        <h2 id="history-title">Workout history</h2>
        <div className="workout-history">
          {workouts.length === 0 ? (
            <p className="card empty-card">No workouts yet. Log your first session above.</p>
          ) : Object.entries(
            [...workouts].sort((a, b) => b.date.localeCompare(a.date)).reduce((groups, workout) => {
              groups[workout.date] ??= [];
              groups[workout.date].push(workout);
              return groups;
            }, {}),
          ).map(([date, entries]) => (
            <section className="history-group" key={date}>
              <h3>{formatDate(date)}</h3>
              {entries.map((workout) => {
                const mode = workout.sets.some((set) => set.seconds > 0) ? "hold" : "reps";
                return (
                  <article className="card history-card" key={workout.id}>
                    <div>
                      <h4>{workout.exercise}{recordIds.has(workout.id) && <span className="pr-badge">New PR</span>}</h4>
                      <p>{workout.time ? `${workout.time} · ` : ""}{workout.sets.map((set) => setSummary(set, mode, units)).join("  ·  ")}</p>
                      {workout.notes && <p className="history-note">{workout.notes}</p>}
                    </div>
                    <div className="history-actions">
                      <button className="text-button" type="button" onClick={() => edit(workout)}>Edit</button>
                      <button className="text-button danger-button" type="button" onClick={() => deleteWorkout(workout)}>Delete</button>
                    </div>
                  </article>
                );
              })}
            </section>
          ))}
        </div>
      </section>
      <WorkoutDialog
        isOpen={isOpen}
        onClose={finishClose}
        workouts={workouts}
        onSave={saveWorkouts}
        onMessage={setFeedback}
        editingWorkout={selectedEdit}
        initialExercise={quickExercise}
        disabled={Boolean(storageError)}
        units={units}
      />
    </>
  );
}
