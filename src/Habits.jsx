import { useMemo, useState } from "react";
import { createId, formatDate, todayString } from "../js/utils.js";
import { load, save } from "../js/storage.js";
import { BottomSheet, Icon, IconButton, ProgressRing, SegmentedControl } from "./ui.jsx";

function readData() {
  try {
    const habits = load("habits", []);
    const checks = load("habitChecks", []);
    if (!Array.isArray(habits) || !Array.isArray(checks)) throw new Error("Saved habits are invalid.");
    return { habits, checks, error: "" };
  } catch (error) {
    return { habits: [], checks: [], error: error.message };
  }
}

function dateOffset(daysAgo) {
  const date = new Date(`${todayString()}T12:00:00`);
  date.setDate(date.getDate() - daysAgo);
  return todayString(date);
}

function habitStreak(id, checks) {
  const completed = new Set(checks.filter((check) => check.habitId === id && check.done).map((check) => check.date));
  const date = new Date(`${todayString()}T12:00:00`);
  if (!completed.has(todayString())) date.setDate(date.getDate() - 1);
  let count = 0;
  while (completed.has(todayString(date))) {
    count += 1;
    date.setDate(date.getDate() - 1);
  }
  return count;
}

function HabitHeatmap({ habits, checks }) {
  const active = habits.filter((habit) => !habit.archived);
  const byDate = useMemo(() => {
    const counts = new Map();
    checks.filter((check) => check.done).forEach((check) => counts.set(check.date, (counts.get(check.date) || 0) + 1));
    return counts;
  }, [checks]);
  return <div className="habit-heatmap" role="img" aria-label="Habit completion for the last 12 weeks">
    {Array.from({ length: 84 }, (_, index) => {
      const date = dateOffset(83 - index);
      const ratio = active.length ? (byDate.get(date) || 0) / active.length : 0;
      const level = ratio === 0 ? 0 : ratio < .35 ? 1 : ratio < .7 ? 2 : 3;
      return <span className={`heat-day intensity-${level}`} title={`${formatDate(date)}: ${Math.round(ratio * 100)}%`} key={date} />;
    })}
  </div>;
}

export default function Habits() {
  const [data, setData] = useState(readData);
  const [activeSection, setActiveSection] = useState("Today");
  const [sheet, setSheet] = useState("");
  const [draftName, setDraftName] = useState("");
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [showAll, setShowAll] = useState(false);
  const active = data.habits.filter((habit) => !habit.archived);
  const archived = data.habits.filter((habit) => habit.archived);
  const doneToday = active.filter((habit) => data.checks.some((check) => check.habitId === habit.id && check.date === todayString() && check.done));
  const currentStreak = Math.max(0, ...active.map((habit) => habitStreak(habit.id, data.checks)));
  const visibleHabits = showAll ? active : active.slice(0, 5);

  function persistHabits(habits) {
    save("habits", habits);
    setData((current) => ({ ...current, habits }));
  }

  function toggle(habit) {
    const date = todayString();
    const found = data.checks.find((check) => check.habitId === habit.id && check.date === date);
    const checks = found
      ? data.checks.map((check) => check === found ? { ...check, done: !check.done } : check)
      : [...data.checks, { habitId: habit.id, date, done: true }];
    try {
      save("habitChecks", checks);
      setData((current) => ({ ...current, checks }));
    } catch (error) {
      setMessage(error.message);
    }
  }

  function addHabit(event) {
    event.preventDefault();
    const name = draftName.trim();
    if (!name || active.some((habit) => habit.name.toLowerCase() === name.toLowerCase())) {
      setMessage(name ? "Already on your list." : "Enter a name.");
      return;
    }
    try {
      persistHabits([...data.habits, { id: createId(), name, createdDate: todayString() }]);
      setDraftName("");
      setSheet("");
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function renameHabit(event) {
    event.preventDefault();
    const name = draftName.trim();
    if (!name || active.some((habit) => habit.id !== selected.id && habit.name.toLowerCase() === name.toLowerCase())) {
      setMessage(name ? "Already on your list." : "Enter a name.");
      return;
    }
    try {
      persistHabits(data.habits.map((habit) => habit.id === selected.id ? { ...habit, name } : habit));
      setSelected(null);
      setSheet("");
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function archiveSelected() {
    try {
      persistHabits(data.habits.map((habit) => habit.id === selected.id ? { ...habit, archived: true } : habit));
      setSelected(null);
      setSheet("");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function restoreHabit(habit) {
    try {
      persistHabits(data.habits.map((item) => item.id === habit.id ? { ...item, archived: false } : item));
    } catch (error) {
      setMessage(error.message);
    }
  }

  function deleteSelected() {
    try {
      const habits = data.habits.filter((habit) => habit.id !== selected.id);
      const checks = data.checks.filter((check) => check.habitId !== selected.id);
      save("habitChecks", checks);
      save("habits", habits);
      setData((current) => ({ ...current, habits, checks }));
      setSelected(null);
      setSheet("");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return <>
    <div className="page-heading"><h1>Habits</h1></div>
    <SegmentedControl label="Habit view" options={["Today", "Streaks"]} value={activeSection} onChange={setActiveSection} />
    {data.error && <p className="form-message is-error" role="alert">{data.error}</p>}
    {!data.error && activeSection === "Today" && <>
      <section className="habit-today-summary glass-panel">
        <ProgressRing label="Today" value={doneToday.length} total={active.length} color="var(--habit-accent)" size={104} />
        <div><strong className="habit-current-streak">{currentStreak}</strong><span>day streak</span></div>
      </section>
      {active.length ? <section className="habit-list" aria-label="Today's habits">
        {visibleHabits.map((habit) => {
          const checked = data.checks.some((check) => check.habitId === habit.id && check.date === todayString() && check.done);
          return <article className="habit-row" key={habit.id}>
            <button className={`habit-check${checked ? " is-done" : ""}`} type="button" aria-pressed={checked} aria-label={`${checked ? "Uncheck" : "Complete"} ${habit.name}`} onClick={() => toggle(habit)}>{checked ? "✓" : ""}</button>
            <h2>{habit.name}</h2>
            <IconButton label={`More actions for ${habit.name}`} onClick={() => { setSelected(habit); setDraftName(habit.name); setSheet("actions"); }}><Icon name="more" /></IconButton>
          </article>;
        })}
        {active.length > 5 && <button className="quiet-link" type="button" onClick={() => setShowAll((value) => !value)}>{showAll ? "Show fewer" : "See all"}</button>}
      </section> : <div className="empty-card"><p>Add your first habit.</p><button className="secondary-button" type="button" onClick={() => setSheet("add")}>Add habit</button></div>}
      {archived.length > 0 && <details className="archived-habits"><summary>Archived ({archived.length})</summary>{archived.map((habit) => <div className="archived-habit" key={habit.id}><span>{habit.name}</span><button className="text-button" type="button" onClick={() => restoreHabit(habit)}>Restore</button></div>)}</details>}
    </>}
    {!data.error && activeSection === "Streaks" && <section className="habit-streaks">
      <div className="habit-streak-hero glass-panel"><strong>{currentStreak}</strong><span>current day streak</span></div>
      <HabitHeatmap habits={data.habits} checks={data.checks} />
    </section>}
    {message && <p className="form-message" role="status">{message}</p>}
    {!data.error && <button className="screen-fab" type="button" aria-label="Add habit" onClick={() => { setDraftName(""); setSheet("add"); }}><Icon name="plus" /><span>Add</span></button>}
    <BottomSheet open={sheet === "add"} title="Add habit" onClose={() => setSheet("")}>
      <form className="sheet-form" onSubmit={addHabit}><label className="field"><span>Name</span><input autoFocus maxLength="60" placeholder="Stretch" value={draftName} onChange={(event) => setDraftName(event.target.value)} /></label>{message && <p className="form-message" role="status">{message}</p>}<button className="primary-button" type="submit">Add</button></form>
    </BottomSheet>
    <BottomSheet open={sheet === "actions"} title={selected?.name || "Habit"} onClose={() => setSheet("")}>
      <form className="sheet-form" onSubmit={renameHabit}><label className="field"><span>Name</span><input autoFocus maxLength="60" value={draftName} onChange={(event) => setDraftName(event.target.value)} /></label><button className="secondary-button" type="submit">Rename</button></form>
      <div className="sheet-actions"><button className="secondary-button" type="button" onClick={archiveSelected}>Archive</button><button className="secondary-button danger-button" type="button" onClick={deleteSelected}>Delete</button></div>
    </BottomSheet>
  </>;
}
