import { useState } from "react";
import { save } from "../js/storage.js";
import { readList } from "./data.js";
import Diet from "./Diet.jsx";
import Habits from "./Habits.jsx";
import Library from "./Library.jsx";
import Progress from "./Progress.jsx";
import SummaryCards from "./SummaryCards.jsx";
import Workouts from "./Workouts.jsx";

const TABS = [
  { id: "home", label: "Home", icon: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /> },
  { id: "workouts", label: "Workouts", icon: <path d="M6 4v16M18 4v16M3 8h6M3 16h6m6-8h6m-6 8h6M9 12h6" /> },
  { id: "habits", label: "Habits", icon: <><path d="m5 12 4 4L19 6" /><circle cx="12" cy="12" r="10" /></> },
  { id: "diet", label: "Diet", icon: <path d="M12 3s7 7.2 7 12a7 7 0 0 1-14 0c0-4.8 7-12 7-12z" /> },
  { id: "library", label: "Library", icon: <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5zM4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h8m-8 4h8" /> },
];

function initialWorkoutData() {
  try {
    return { workouts: readList("workoutLog"), error: "" };
  } catch (error) {
    return { workouts: [], error: error.message };
  }
}

function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [workoutData, setWorkoutData] = useState(initialWorkoutData);
  const [workoutRequest, setWorkoutRequest] = useState(0);
  const [requestedExercise, setRequestedExercise] = useState("");

  function persistWorkouts(nextWorkouts) {
    save("workoutLog", nextWorkouts);
    setWorkoutData({ workouts: nextWorkouts, error: "" });
  }

  function openWorkout() {
    setRequestedExercise("");
    setActiveTab("workouts");
    setWorkoutRequest((request) => request + 1);
  }

  function logLibraryExercise(exercise) {
    setRequestedExercise(exercise);
    setActiveTab("workouts");
    setWorkoutRequest((request) => request + 1);
  }

  function chooseTab(tab) {
    setActiveTab(tab);
    document.getElementById(`panel-${tab}`)?.focus({ preventScroll: true });
  }

  function handleTabKeyDown(event, index) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? TABS.length - 1
        : (index + (event.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length;
    chooseTab(TABS[nextIndex].id);
    document.getElementById(`tab-${TABS[nextIndex].id}`)?.focus();
  }

  return (
    <div className="app-shell">
      <main id="main-content">
        <section id="panel-home" className="tab-panel" role="tabpanel" aria-labelledby="tab-home" tabIndex="-1" hidden={activeTab !== "home"}>
          <div className="page-heading">
            <p className="eyebrow">YOUR TRAINING SPACE <span className="live-dot" aria-hidden="true" /></p>
            <h1>Move with purpose.</h1>
            <p className="intro">Every rep is a step forward. Make today count.</p>
          </div>
          <section className="home-hero">
            <div className="hero-copy">
              <span className="hero-kicker">READY WHEN YOU ARE</span>
              <h2>Build strength<br />one session at a time.</h2>
              <p>Your next step starts with showing up.</p>
              <button className="hero-button" type="button" onClick={openWorkout}>
                <span>Start a workout</span><span aria-hidden="true">→</span>
              </button>
            </div>
            <div className="hero-mark" aria-hidden="true">
              <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="44" /><path d="M37 62h46M60 39v46" /><circle cx="60" cy="60" r="56" /></svg>
            </div>
          </section>
          <section className="home-section">
            <div className="home-section-title">
              <div><p className="eyebrow">KEEP YOUR MOMENTUM</p><h2>This week</h2></div>
              <button type="button" className="quiet-link" onClick={() => chooseTab("workouts")}>See workouts</button>
            </div>
            <SummaryCards workouts={workoutData.workouts} />
          </section>
          <button className="library-prompt" type="button" onClick={() => chooseTab("library")}>
            <span className="library-icon" aria-hidden="true">↗</span>
            <span><strong>Need an idea?</strong><small>Explore the exercise library</small></span>
            <span className="prompt-arrow" aria-hidden="true">›</span>
          </button>
        </section>

        <section id="panel-workouts" className="tab-panel" role="tabpanel" aria-labelledby="tab-workouts" tabIndex="-1" hidden={activeTab !== "workouts"}>
          <Workouts
            workouts={workoutData.workouts}
            storageError={workoutData.error}
            onSave={persistWorkouts}
            openRequest={workoutRequest}
            initialExercise={requestedExercise}
          />
          <Progress workouts={workoutData.workouts} />
        </section>

        <section id="panel-habits" className="tab-panel" role="tabpanel" aria-labelledby="tab-habits" tabIndex="-1" hidden={activeTab !== "habits"}>
          <Habits />
        </section>

        <section id="panel-diet" className="tab-panel" role="tabpanel" aria-labelledby="tab-diet" tabIndex="-1" hidden={activeTab !== "diet"}>
          <Diet />
        </section>

        <section id="panel-library" className="tab-panel" role="tabpanel" aria-labelledby="tab-library" tabIndex="-1" hidden={activeTab !== "library"}>
          <Library onLogExercise={logLibraryExercise} />
        </section>
      </main>

      <nav className="bottom-nav" aria-label="Main navigation" role="tablist">
        {TABS.map((tab, index) => (
          <button
            id={`tab-${tab.id}`}
            className={`nav-tab${activeTab === tab.id ? " is-active" : ""}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => chooseTab(tab.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
            key={tab.id}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">{tab.icon}</svg>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
