import { useEffect, useState } from "react";
import { createId } from "../js/utils.js";
import { load, save } from "../js/storage.js";
import { BUILT_IN_ROUTINES } from "../data/programs.js";
import { EXERCISES } from "./data.js";
import { BottomSheet, Icon, IconButton, SegmentedControl } from "./ui.jsx";

const TIMER_MODES = ["Rest", "Countdown", "Hold", "EMOM"];
const DEFAULT_SECONDS = { Rest: 60, Countdown: 60, Hold: 0, EMOM: 600 };

function readRoutines() {
  const routines = load("customRoutines", []);
  if (!Array.isArray(routines) || routines.some((routine) => (
    !routine
    || typeof routine.id !== "string"
    || typeof routine.name !== "string"
    || !routine.name.trim()
    || typeof routine.level !== "string"
    || typeof routine.description !== "string"
    || !Array.isArray(routine.exercises)
    || routine.exercises.length === 0
    || routine.exercises.some((exercise) => (
      !exercise
      || typeof exercise.name !== "string"
      || !EXERCISES.includes(exercise.name)
      || typeof exercise.target !== "string"
      || !exercise.target.trim()
    ))
  )) || new Set(routines.map((routine) => routine.id)).size !== routines.length) {
    throw new Error("Saved routines have an invalid format. Keep a backup before changing them.");
  }
  return routines;
}

function readSavedRoutines() {
  try {
    return { routines: readRoutines(), error: "" };
  } catch (error) {
    return { routines: [], error: error.message };
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function RoutineCard({ routine, onStart, onMore }) {
  return (
    <article className="routine-row">
      <div className="routine-row-copy"><h3>{routine.name}</h3><span>{routine.level} · {routine.exercises.length} moves</span></div>
      <button className="primary-button routine-start" type="button" onClick={() => onStart(routine)}>Start</button>
      {onMore && <IconButton label={`More actions for ${routine.name}`} onClick={() => onMore(routine)}><Icon name="more" /></IconButton>}
    </article>
  );
}

function WorkoutTimer() {
  const [mode, setMode] = useState("Rest");
  const [seconds, setSeconds] = useState(DEFAULT_SECONDS.Rest);
  const [rounds, setRounds] = useState(10);
  const [timer, setTimer] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const elapsed = timer?.running
    ? timer.elapsedBefore + Math.floor((now - timer.startedAt) / 1000)
    : timer?.elapsedBefore || 0;
  const totalSeconds = timer?.mode === "EMOM" ? timer.rounds * 60 : timer?.duration;
  const timeLeft = timer?.mode === "Hold" ? elapsed : Math.max(0, totalSeconds - elapsed);
  const timerFinished = Boolean(timer && timer.mode !== "Hold" && timer.elapsedBefore >= totalSeconds);
  const currentRound = timer?.mode === "EMOM"
    ? Math.min(timer.rounds, Math.floor(elapsed / 60) + 1)
    : 0;
  const intervalLeft = timer?.mode === "EMOM" && elapsed < totalSeconds
    ? 60 - (elapsed % 60)
    : timeLeft;

  useEffect(() => {
    if (!timer?.running) return undefined;
    const interval = window.setInterval(() => {
      const currentTime = Date.now();
      const currentElapsed = timer.elapsedBefore + Math.floor((currentTime - timer.startedAt) / 1000);
      setNow(currentTime);
      if (timer.mode !== "Hold" && currentElapsed >= totalSeconds) {
        setTimer((current) => ({ ...current, running: false, elapsedBefore: totalSeconds, startedAt: null }));
        setMessage(timer.mode === "EMOM" ? "EMOM complete. Nice work." : "Timer complete.");
        setIsError(false);
      }
    }, 250);
    return () => window.clearInterval(interval);
  }, [timer, totalSeconds]);

  function chooseMode(nextMode) {
    setMode(nextMode);
    setSeconds(DEFAULT_SECONDS[nextMode]);
    setTimer(null);
    setMessage("");
    setIsError(false);
  }

  function startTimer() {
    const duration = Number(seconds);
    const roundCount = Number(rounds);
    if (mode !== "Hold" && mode !== "EMOM" && (!Number.isInteger(duration) || duration < 1 || duration > 5999)) {
      setMessage("Enter a timer length between 1 and 5999 seconds.");
      setIsError(true);
      return;
    }
    if (mode === "EMOM" && (!Number.isInteger(roundCount) || roundCount < 1 || roundCount > 60)) {
      setMessage("Choose between 1 and 60 EMOM rounds.");
      setIsError(true);
      return;
    }
    setMessage("");
    setIsError(false);
    setNow(Date.now());
    setTimer({
      mode,
      running: true,
      startedAt: Date.now(),
      elapsedBefore: 0,
      duration,
      rounds: roundCount,
    });
  }

  function pauseTimer() {
    if (!timer?.running) return;
    const elapsedBefore = timer.elapsedBefore + Math.floor((Date.now() - timer.startedAt) / 1000);
    setTimer({ ...timer, running: false, startedAt: null, elapsedBefore });
    setNow(Date.now());
  }

  function resumeTimer() {
    if (!timer || timer.running) return;
    setNow(Date.now());
    setTimer({ ...timer, running: true, startedAt: Date.now() });
    setMessage("");
    setIsError(false);
  }

  function resetTimer() {
    setTimer(null);
    setMessage("");
    setIsError(false);
  }

  return (
    <section className="program-section" aria-labelledby="timer-title">
      <h2 id="timer-title">Workout timers</h2>
      <p className="muted">Use a simple rest, countdown, hold, or EMOM timer.</p>
      <SegmentedControl label="Timer type" options={TIMER_MODES} value={mode} onChange={chooseMode} />
      {mode === "EMOM" ? (
        <label className="field timer-input">
          <span>Rounds, one minute each</span>
          <input type="number" min="1" max="60" step="1" value={rounds} disabled={Boolean(timer)} onChange={(event) => setRounds(event.target.value)} />
        </label>
      ) : mode !== "Hold" ? (
        <label className="field timer-input">
          <span>{mode} time (seconds)</span>
          <input type="number" min="1" max="5999" step="1" value={seconds} disabled={Boolean(timer)} onChange={(event) => setSeconds(event.target.value)} />
        </label>
      ) : (
        <p className="muted">Start when you begin your hold, then stop or pause when you finish.</p>
      )}
      <div className="timer-display" role="timer" aria-label={`${mode} timer ${formatTime(timeLeft)}`}>
        <strong>{formatTime(timeLeft)}</strong>
        {timer?.mode === "EMOM" && <span>Round {currentRound} of {timer.rounds} · next minute in {formatTime(intervalLeft)}</span>}
        {timer?.mode === "Hold" && timer.running && <span>Hold in progress</span>}
        {timer && !timer.running && !message && <span>Paused · {timer.mode}</span>}
      </div>
      <div className="timer-actions">
        {!timer?.running
          ? <button className="primary-button" type="button" onClick={timer && !timerFinished ? resumeTimer : startTimer}>{timer && !timerFinished ? "Resume" : "Start timer"}</button>
          : <button className="secondary-button" type="button" onClick={pauseTimer}>Pause</button>}
        {timer && <button className="text-button" type="button" onClick={resetTimer}>Reset</button>}
      </div>
      {message && <p className={`form-message${isError ? " is-error" : ""}`} role={isError ? "alert" : "status"}>{message}</p>}
    </section>
  );
}

export default function Programs({ onStartRoutine, view = "Programs" }) {
  const [saved, setSaved] = useState(readSavedRoutines);
  const [name, setName] = useState("");
  const [selectedExercise, setSelectedExercise] = useState(EXERCISES[0] || "");
  const [draftExercises, setDraftExercises] = useState([]);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const customRoutines = saved.routines;
  const choices = EXERCISES.filter((exercise) => !draftExercises.includes(exercise));

  function addExercise() {
    if (!selectedExercise || draftExercises.includes(selectedExercise)) return;
    const nextExercises = [...draftExercises, selectedExercise];
    setDraftExercises(nextExercises);
    setSelectedExercise(EXERCISES.find((exercise) => !nextExercises.includes(exercise)) || "");
  }

  function saveRoutine(event) {
    event.preventDefault();
    const routineName = name.trim();
    if (!routineName || draftExercises.length === 0) {
      setMessage("Add a name and at least one exercise for your routine.");
      setIsError(true);
      return;
    }
    const routine = {
      id: createId(),
      name: routineName,
      level: "Custom routine",
      description: `${draftExercises.length} exercises, picked by you.`,
      exercises: draftExercises.map((exercise) => ({ name: exercise, target: "Set your reps or hold time in the logger" })),
    };
    const routines = [...customRoutines, routine];
    try {
      save("customRoutines", routines);
      setSaved({ routines, error: "" });
      setName("");
      setDraftExercises([]);
      setBuilderOpen(false);
      setMessage("Routine saved on this device.");
      setIsError(false);
    } catch (error) {
      setMessage(error.message);
      setIsError(true);
    }
  }

  function deleteRoutine(routine) {
    const routines = customRoutines.filter((item) => item.id !== routine.id);
    try {
      save("customRoutines", routines);
      setSaved({ routines, error: "" });
      setMessage("Routine deleted.");
      setIsError(false);
      setSelectedRoutine(null);
    } catch (error) {
      setMessage(error.message);
      setIsError(true);
    }
  }

  return (
    <>
      {view === "Programs" && <>
      {saved.error && <p className="form-message is-error" role="alert">{saved.error}</p>}
      <section className="program-section" aria-labelledby="built-in-programs-title">
        <div className="section-heading"><h2 id="built-in-programs-title">Programs</h2><IconButton label="Create routine" onClick={() => setBuilderOpen(true)}><Icon name="plus" /></IconButton></div>
        <div className="routine-list">
          {BUILT_IN_ROUTINES.slice(0, 5).map((routine) => (
            <RoutineCard routine={routine} onStart={onStartRoutine} key={routine.id} />
          ))}
        </div>
      </section>
      {customRoutines.length > 0 && (
        <section className="program-section" aria-labelledby="saved-routines-title">
          <h2 id="saved-routines-title">Your routines</h2>
          <div className="routine-list">
            {customRoutines.slice(0, 5).map((routine) => (
              <RoutineCard routine={routine} onStart={onStartRoutine} onMore={(item) => setSelectedRoutine(item)} key={routine.id} />
            ))}
          </div>
        </section>
      )}
      <BottomSheet open={builderOpen} title="Build a routine" onClose={() => setBuilderOpen(false)}>
        {!saved.error ? (
          <form className="custom-routine-form" noValidate onSubmit={saveRoutine}>
            <label className="field">
              <span>Routine name</span>
              <input maxLength="60" placeholder="e.g. Quick upper body" value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <div className="custom-exercise-picker">
              <label className="field">
                <span>Choose an exercise</span>
                <select value={selectedExercise} onChange={(event) => setSelectedExercise(event.target.value)}>
                  <option value="">Choose an exercise</option>
                  {choices.map((exercise) => <option key={exercise}>{exercise}</option>)}
                </select>
              </label>
              <button className="secondary-button" type="button" disabled={!choices.length} onClick={addExercise}>Add exercise</button>
            </div>
            {draftExercises.length > 0 && (
              <ol className="draft-exercises">
                {draftExercises.map((exercise, index) => (
                  <li key={exercise}>
                    <span>{index + 1}. {exercise}</span>
                    <button className="text-button danger-button" type="button" aria-label={`Remove ${exercise}`} onClick={() => setDraftExercises((current) => current.filter((item) => item !== exercise))}>Remove</button>
                  </li>
                ))}
              </ol>
            )}
            <button className="primary-button" type="submit">Save routine</button>
            {message && <p className={`form-message${isError ? " is-error" : ""}`} role={isError ? "alert" : "status"}>{message}</p>}
          </form>
        ) : <p className="muted">Routine data is invalid.</p>}
      </BottomSheet>
      <BottomSheet open={Boolean(selectedRoutine)} title={selectedRoutine?.name || "Routine"} onClose={() => setSelectedRoutine(null)}>
        <div className="sheet-actions"><button className="secondary-button danger-button" type="button" onClick={() => deleteRoutine(selectedRoutine)}>Delete routine</button></div>
      </BottomSheet>
      </>}
      {view === "Timer" && <WorkoutTimer />}
    </>
  );
}
