import { useEffect, useState } from "react";
import { createId, currentTimeString, formatDate, todayString } from "../js/utils.js";
import { fromKilograms, toKilograms } from "./settingsData.js";
import { EXERCISES } from "./data.js";
import { BottomSheet, Icon, IconButton, QuickChips, SegmentedControl } from "./ui.jsx";
import Programs from "./Programs.jsx";
import Progress from "./Progress.jsx";

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

function formForExercise(exercise, workouts = [], units = "metric") {
  const previous = [...workouts]
    .filter((workout) => workout.exercise === exercise)
    .sort((a, b) => b.date.localeCompare(a.date) || (b.time || "").localeCompare(a.time || ""))[0];
  if (!previous) {
    return {
      ...emptyForm(),
      exercise,
      mode: HOLD_EXERCISES.has(exercise) ? "hold" : "reps",
    };
  }
  const mode = previous.sets.some((set) => set.seconds > 0) ? "hold" : "reps";
  return {
    ...emptyForm(),
    exercise,
    mode,
    sets: previous.sets.map((set) => ({
      reps: set.reps || "",
      seconds: set.seconds || "",
      weight: set.weight ? String(Number(fromKilograms(set.weight, units).toFixed(2))) : "",
    })),
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
  const [form, setForm] = useState(getInitialForm);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [moreOptions, setMoreOptions] = useState(false);

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
    setForm(formForExercise(initialExercise, workouts, units));
    setMoreOptions(false);
  }, [editingWorkout, initialExercise, units, workouts]);

  function close() {
    setForm(emptyForm());
    setEditing(null);
    setError("");
    onClose();
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function chooseExercise(exercise) {
    setForm(exercise ? formForExercise(exercise, workouts, units) : emptyForm());
    setMoreOptions(false);
    setError("");
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
    <BottomSheet open={isOpen} title={editing ? "Edit workout" : "Log workout"} onClose={close} className="workout-dialog">
      <form id="workout-form" className="workout-form" noValidate onSubmit={submit}>
        <label className="field">
          <span>Exercise</span>
          <select id="workout-exercise" value={form.exercise} onChange={(event) => chooseExercise(event.target.value)}>
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
        <div className="set-list">
          {form.sets.map((set, index) => (
            <div className="set-row" key={index}>
              <span className="set-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              {form.mode === "reps" ? (
                <NumberField label={`Set ${index + 1} reps`} value={set.reps} min="1" step="1" onChange={(value) => updateSet(index, "reps", value)} />
              ) : (
                <NumberField label={`Set ${index + 1} hold seconds`} value={set.seconds} min="1" step="1" onChange={(value) => updateSet(index, "seconds", value)} />
              )}
              <button className="remove-set" type="button" aria-label={`Remove set ${index + 1}`} disabled={form.sets.length === 1} onClick={() => setForm((current) => ({ ...current, sets: current.sets.filter((_, setIndex) => setIndex !== index) }))}>×</button>
            </div>
          ))}
        </div>
        <details className="form-more-options" open={moreOptions} onToggle={(event) => setMoreOptions(event.currentTarget.open)}>
          <summary>More options</summary>
          <div className="form-more-content">
            {form.sets.map((set, index) => (
              <NumberField key={index} label={`Set ${index + 1} weight in ${units === "imperial" ? "pounds" : "kilograms"}`} value={set.weight} min="0.01" step="0.01" placeholder="Optional weight" onChange={(value) => updateSet(index, "weight", value)} />
            ))}
            <label className="field">
              <span>Notes (optional)</span>
              <textarea rows="2" maxLength="500" placeholder="How did it feel?" value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} />
            </label>
          </div>
        </details>
        {error && <p className="form-message is-error" role="alert">{error}</p>}
        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={disabled}>{editing ? "Update workout" : "Save workout"}</button>
        </div>
      </form>
    </BottomSheet>
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
  onStartRoutine,
  units = "metric",
  theme = "dark",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [selectedEdit, setSelectedEdit] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [quickExercise, setQuickExercise] = useState("");
  const [activeSection, setActiveSection] = useState("Log");
  const [showAll, setShowAll] = useState(false);
  const recordIds = getRecordIds(workouts);
  const recent = [...new Set([...workouts].reverse().map((workout) => workout.exercise))].slice(0, 5);
  const sortedWorkouts = [...workouts].sort((a, b) => b.date.localeCompare(a.date) || (b.time || "").localeCompare(a.time || ""));
  const visibleWorkouts = showAll ? sortedWorkouts : sortedWorkouts.slice(0, 7);

  useEffect(() => {
    if (openRequest > 0) {
      setSelectedEdit(null);
      setQuickExercise(initialExercise);
      setActiveSection("Log");
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
    try {
      onSave(workouts.filter((item) => item.id !== workout.id));
      setFeedback("Workout deleted.");
      setConfirmDelete(false);
      setSelectedAction(null);
    } catch (error) {
      setFeedback(error.message);
    }
  }

  return (
    <>
      <div className="page-heading">
        <h1>Workouts</h1>
      </div>
      <SegmentedControl label="Workout screens" options={["Log", "Programs", "Timer"]} value={activeSection} onChange={setActiveSection} />
      {activeSection === "Log" && <>
        {storageError && <p className="form-message is-error" role="alert">{storageError}</p>}
        {feedback && <p className="form-message" role="status">{feedback}</p>}
        <QuickChips label="Recent exercises" items={recent} onSelect={(exercise) => { setSelectedEdit(null); setQuickExercise(exercise); setIsOpen(true); }} emptyText={workouts.length ? "" : "Recent exercises will appear here."} />
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
          <div className="section-heading">
            <h2 id="history-title">Recent sessions</h2>
            {workouts.length > 7 && <button className="quiet-link" type="button" onClick={() => setShowAll((value) => !value)}>{showAll ? "Show recent" : "See all"}</button>}
          </div>
          <div className="workout-history">
            {workouts.length === 0 ? (
              <p className="empty-card">Add a workout to start your history.</p>
            ) : Object.entries(
              visibleWorkouts.reduce((groups, workout) => {
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
                      <IconButton label={`More actions for ${workout.exercise}`} onClick={() => { setSelectedAction(workout); setConfirmDelete(false); }}><Icon name="more" /></IconButton>
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
        <Progress workouts={workouts} units={units} theme={theme} />
        <button id="show-workout-form" className="screen-fab" type="button" aria-label="Log a workout" disabled={Boolean(storageError)} onClick={() => { setSelectedEdit(null); setQuickExercise(""); setIsOpen(true); }}>
          <Icon name="plus" /><span>Log</span>
        </button>
      </>}
      {activeSection === "Programs" && <Programs view="Programs" onStartRoutine={(routine) => { setActiveSection("Log"); onStartRoutine(routine); }} />}
      {activeSection === "Timer" && <Programs view="Timer" onStartRoutine={onStartRoutine} />}
      <BottomSheet open={Boolean(selectedAction) && !confirmDelete} title={selectedAction?.exercise || "Workout"} onClose={() => setSelectedAction(null)}>
        <div className="sheet-actions"><button className="secondary-button" type="button" onClick={() => { edit(selectedAction); setSelectedAction(null); }}>Edit</button><button className="secondary-button danger-button" type="button" onClick={() => setConfirmDelete(true)}>Delete</button></div>
      </BottomSheet>
      <BottomSheet open={confirmDelete} title="Delete workout?" onClose={() => setConfirmDelete(false)}>
        <div className="sheet-actions"><button className="secondary-button" type="button" onClick={() => setConfirmDelete(false)}>Cancel</button><button className="primary-button danger-button" type="button" onClick={() => deleteWorkout(selectedAction)}>Delete</button></div>
      </BottomSheet>
    </>
  );
}
