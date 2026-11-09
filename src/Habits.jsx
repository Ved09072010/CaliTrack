import { useState } from "react";
import { createId, formatDate, todayString } from "../js/utils.js";
import { load, save } from "../js/storage.js";

function getInitialData() {
  try {
    const habits = load("habits", []);
    const checks = load("habitChecks", []);
    if (!Array.isArray(habits) || !Array.isArray(checks)) {
      throw new Error("Saved habits and checks must be lists.");
    }
    if (habits.some((habit) => !habit || typeof habit.id !== "string" || typeof habit.name !== "string")
      || checks.some((check) => !check || typeof check.habitId !== "string" || typeof check.date !== "string" || typeof check.done !== "boolean")) {
      throw new Error("Saved habit data has an invalid entry. Please keep a backup before changing it.");
    }
    return { habits, checks, error: "" };
  } catch (error) {
    return { habits: [], checks: [], error: error.message };
  }
}

function dateFor(daysAgo) {
  const date = new Date(`${todayString()}T12:00:00`);
  date.setDate(date.getDate() - daysAgo);
  return todayString(date);
}

function habitStreak(habitId, checks) {
  const completed = new Set(
    checks.filter((check) => check.habitId === habitId && check.done).map((check) => check.date),
  );
  let date = new Date(`${todayString()}T12:00:00`);
  if (!completed.has(todayString())) date.setDate(date.getDate() - 1);
  let streak = 0;
  while (completed.has(todayString(date))) {
    streak += 1;
    date.setDate(date.getDate() - 1);
  }
  return streak;
}

function HabitGrid({ habit, checks, days }) {
  const completed = new Set(
    checks.filter((check) => check.habitId === habit.id && check.done).map((check) => check.date),
  );
  return (
    <div className={`habit-grid habit-grid-${days}`} role="img" aria-label={`${days}-day completion history`}>
      {Array.from({ length: days }, (_, index) => {
        const date = dateFor(days - index - 1);
        const done = completed.has(date);
        return (
          <span
            className={`habit-day${done ? " is-done" : ""}`}
            title={`${formatDate(date)}: ${done ? "complete" : "not complete"}`}
            aria-hidden="true"
            key={date}
          />
        );
      })}
    </div>
  );
}

function HabitCard({ habit, checks, onToggle, onRename, onArchive, onDelete }) {
  const doneToday = checks.some(
    (check) => check.habitId === habit.id && check.date === todayString() && check.done,
  );
  const streak = habitStreak(habit.id, checks);
  return (
    <article className="habit-card">
      <div className="habit-card-top">
        <button
          className={`habit-check${doneToday ? " is-done" : ""}`}
          type="button"
          aria-pressed={doneToday}
          aria-label={`${doneToday ? "Uncheck" : "Complete"} ${habit.name} for today`}
          onClick={() => onToggle(habit)}
        >
          {doneToday ? "✓" : ""}
        </button>
        <div className="habit-title">
          <h2>{habit.name}</h2>
          <span>{streak} day streak</span>
        </div>
        <div className="habit-actions">
          <button className="text-button" type="button" onClick={() => onRename(habit)}>Rename</button>
          <button className="text-button" type="button" onClick={() => onArchive(habit)}>Archive</button>
          <button className="text-button danger-button" type="button" onClick={() => onDelete(habit)}>Delete</button>
        </div>
      </div>
      <div className="habit-history">
        <span className="habit-history-label">7 days</span>
        <HabitGrid habit={habit} checks={checks} days={7} />
        <span className="habit-history-label">30 days</span>
        <HabitGrid habit={habit} checks={checks} days={30} />
      </div>
    </article>
  );
}

export default function Habits() {
  const [data, setData] = useState(getInitialData);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  const activeHabits = data.habits.filter((habit) => !habit.archived);
  const archivedHabits = data.habits.filter((habit) => habit.archived);

  function saveHabits(habits) {
    save("habits", habits);
    setData((current) => ({ ...current, habits }));
  }

  function addHabit(event) {
    event.preventDefault();
    const name = newName.trim();
    if (!name) {
      setMessage("Enter a habit name.");
      return;
    }
    if (activeHabits.some((habit) => habit.name.toLowerCase() === name.toLowerCase())) {
      setMessage("That habit is already on your list.");
      return;
    }
    try {
      saveHabits([...data.habits, { id: createId(), name, createdDate: todayString() }]);
      setNewName("");
      setMessage("Habit added.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function renameHabit(event) {
    event.preventDefault();
    const name = editing.name.trim();
    if (!name) {
      setMessage("Enter a habit name.");
      return;
    }
    if (activeHabits.some((habit) => habit.id !== editing.id && habit.name.toLowerCase() === name.toLowerCase())) {
      setMessage("That habit is already on your list.");
      return;
    }
    try {
      saveHabits(data.habits.map((habit) => habit.id === editing.id ? { ...habit, name } : habit));
      setEditing(null);
      setMessage("Habit renamed.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function toggleToday(habit) {
    const date = todayString();
    const existing = data.checks.find((check) => check.habitId === habit.id && check.date === date);
    const nextChecks = existing
      ? data.checks.map((check) => check === existing ? { ...check, done: !check.done } : check)
      : [...data.checks, { habitId: habit.id, date, done: true }];
    try {
      save("habitChecks", nextChecks);
      setData((current) => ({ ...current, checks: nextChecks }));
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function archiveHabit(habit) {
    try {
      saveHabits(data.habits.map((item) => item.id === habit.id ? { ...item, archived: true } : item));
      setMessage(`${habit.name} archived.`);
    } catch (error) {
      setMessage(error.message);
    }
  }

  function restoreHabit(habit) {
    try {
      saveHabits(data.habits.map((item) => item.id === habit.id ? { ...item, archived: false } : item));
      setMessage(`${habit.name} restored.`);
    } catch (error) {
      setMessage(error.message);
    }
  }

  function deleteHabit(habit) {
    if (!window.confirm(`Permanently delete "${habit.name}" and its completion history?`)) return;
    try {
      const nextChecks = data.checks.filter((check) => check.habitId !== habit.id);
      save("habitChecks", nextChecks);
      saveHabits(data.habits.filter((item) => item.id !== habit.id));
      setData((current) => ({
        ...current,
        habits: current.habits.filter((item) => item.id !== habit.id),
        checks: nextChecks,
      }));
      setMessage("Habit deleted.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">DAILY ROUTINE</p>
        <h1>Habits</h1>
        <p className="intro">Small daily actions make training feel natural.</p>
      </div>
      {data.error && <p className="form-message is-error" role="alert">{data.error}</p>}
      {!data.error && (
        <form className="habit-add-form" onSubmit={addHabit}>
          <label className="field">
            <span>Add a habit</span>
            <input
              type="text"
              maxLength="60"
              placeholder="e.g. Stretch for five minutes"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
            />
          </label>
          <button className="primary-button" type="submit">Add habit</button>
        </form>
      )}
      {message && <p className="form-message" role="status">{message}</p>}
      {editing && (
        <form className="habit-rename-form" onSubmit={renameHabit}>
          <label className="field">
            <span>New name</span>
            <input autoFocus maxLength="60" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} />
          </label>
          <button className="primary-button" type="submit">Save name</button>
          <button className="secondary-button" type="button" onClick={() => setEditing(null)}>Cancel</button>
        </form>
      )}
      {activeHabits.length === 0 ? (
        <div className="empty-card">
          <span className="empty-icon" aria-hidden="true">✓</span>
          <h2>{data.habits.length ? "No active habits" : "Start with one small habit"}</h2>
          <p>{data.habits.length ? "Restore an archived habit or add a new one." : "Add a habit above, then tap it each day to keep your streak going."}</p>
        </div>
      ) : (
        <section className="habit-list" aria-label="Today's habits">
          <h2>Today</h2>
          {activeHabits.map((habit) => (
            <HabitCard
              habit={habit}
              checks={data.checks}
              onToggle={toggleToday}
              onRename={(item) => { setEditing(item); setMessage(""); }}
              onArchive={archiveHabit}
              onDelete={deleteHabit}
              key={habit.id}
            />
          ))}
        </section>
      )}
      {archivedHabits.length > 0 && (
        <details className="archived-habits">
          <summary>Archived habits ({archivedHabits.length})</summary>
          {archivedHabits.map((habit) => (
            <div className="archived-habit" key={habit.id}>
              <span>{habit.name}</span>
              <button className="text-button" type="button" onClick={() => restoreHabit(habit)}>Restore</button>
              <button className="text-button danger-button" type="button" onClick={() => deleteHabit(habit)}>Delete</button>
            </div>
          ))}
        </details>
      )}
    </>
  );
}
