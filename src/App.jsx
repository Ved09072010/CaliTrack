import { useEffect, useRef, useState } from "react";
import { load, replaceMany, save } from "../js/storage.js";
import { normalizeSettings, normalizeSkillMastery } from "./appData.js";
import { getProgressionCelebrations, initializeProgressionSeen } from "./progression.js";
import { RANKS } from "../data/progression.js";
import { readList } from "./data.js";
import Dashboard from "./Dashboard.jsx";
import Diet from "./Diet.jsx";
import Habits from "./Habits.jsx";
import Library from "./Library.jsx";
import Settings from "./Settings.jsx";
import { DEFAULT_SETTINGS } from "./settingsData.js";
import Workouts from "./Workouts.jsx";
import { clearDemoData, loadDemoData } from "./demo.js";
import RankCelebration from "./RankCelebration.jsx";

const EMPTY_MASTERY = { mastered: [], seen: [], initialized: false, badgesSeen: [], rankSeen: "Rookie" };

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

function initialSettings() {
  try {
    return { settings: normalizeSettings(load("settings", DEFAULT_SETTINGS)), error: "" };
  } catch (error) {
    return { settings: DEFAULT_SETTINGS, error: error.message };
  }
}

function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [noticeQueue, setNoticeQueue] = useState([]);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [workoutData, setWorkoutData] = useState(initialWorkoutData);
  const [settingsData, setSettingsData] = useState(initialSettings);
  const [dataVersion, setDataVersion] = useState(0);
  const [progressionRevision, setProgressionRevision] = useState(0);
  const [librarySection, setLibrarySection] = useState("Browse");
  const [workoutRequest, setWorkoutRequest] = useState(0);
  const [requestedExercise, setRequestedExercise] = useState("");
  const [activeRoutine, setActiveRoutine] = useState(null);
  const progressionSnapshot = useRef(null);
  const skipProgressionRef = useRef(false);
  const activeNotice = noticeQueue[0] || null;
  const effectiveTheme = settingsData.settings.theme === "system"
    ? (systemDark ? "dark" : "light")
    : settingsData.settings.theme;

  useEffect(() => {
    document.documentElement.dataset.theme = effectiveTheme;
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", effectiveTheme === "light" ? "#f6f0e6" : "#0e0d0c");
  }, [effectiveTheme]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-color-scheme: dark)");
    const updatePreference = (event) => setSystemDark(event.matches);
    preference.addEventListener("change", updatePreference);
    return () => preference.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    let rawMastery;
    let mastery;
    try {
      rawMastery = load("skillMastery", EMPTY_MASTERY);
      mastery = normalizeSkillMastery(rawMastery);
    } catch (error) {
      setNoticeQueue((queue) => [...queue, { type: "toast", message: error.message }]);
      return;
    }

    if (!progressionSnapshot.current || skipProgressionRef.current) {
      skipProgressionRef.current = false;
      const hasProgressionFields = Array.isArray(rawMastery?.badgesSeen)
        && typeof rawMastery.rankSeen === "string";
      const initialMastery = mastery.initialized && hasProgressionFields
        ? mastery
        : initializeProgressionSeen(workoutData.workouts, mastery);
      if (JSON.stringify(initialMastery) !== JSON.stringify(mastery)) save("skillMastery", initialMastery);
      progressionSnapshot.current = { workouts: workoutData.workouts, mastery: initialMastery };
      return;
    }

    const previous = progressionSnapshot.current;
    const result = getProgressionCelebrations(previous.workouts, workoutData.workouts, previous.mastery, mastery);
    save("skillMastery", result.mastery);
    progressionSnapshot.current = { workouts: workoutData.workouts, mastery: result.mastery };
    const notices = result.celebrations.map((celebration) => {
      if (celebration.type === "rank") return celebration;
      if (celebration.type === "skill") return {
        type: "toast",
        message: celebration.count > 1
          ? `${celebration.count} skills mastered · +${celebration.xp} XP`
          : `Skill mastered: ${celebration.exerciseName} · +${celebration.xp} XP`,
      };
      if (celebration.type === "level") return { type: "toast", message: `Level ${celebration.level} reached.` };
      return { type: "toast", message: `Badge earned: ${celebration.name}` };
    });
    if (notices.length) setNoticeQueue((queue) => [...queue, ...notices]);
  }, [workoutData.workouts, progressionRevision]);

  useEffect(() => {
    if (!activeNotice || activeNotice.type === "rank") return undefined;
    const timeout = window.setTimeout(() => setNoticeQueue((queue) => queue.slice(1)), 2600);
    return () => window.clearTimeout(timeout);
  }, [activeNotice]);

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  function persistWorkouts(nextWorkouts) {
    save("workoutLog", nextWorkouts);
    setWorkoutData({ workouts: nextWorkouts, error: "" });
  }

  function saveSettings(nextSettings) {
    const settings = normalizeSettings(nextSettings);
    save("settings", settings);
    setSettingsData({ settings, error: "" });
  }

  function importAppData(data) {
    replaceMany(data);
    skipProgressionRef.current = true;
    setSettingsData({ settings: data.settings, error: "" });
    setWorkoutData({ workouts: data.workoutLog, error: "" });
    setDataVersion((version) => version + 1);
    setProgressionRevision((version) => version + 1);
  }

  function resetAppData() {
    skipProgressionRef.current = true;
    setSettingsData({ settings: DEFAULT_SETTINGS, error: "" });
    setWorkoutData({ workouts: [], error: "" });
    setDataVersion((version) => version + 1);
    setProgressionRevision((version) => version + 1);
  }

  function refreshSavedData() {
    setSettingsData(initialSettings());
    setWorkoutData(initialWorkoutData());
    setDataVersion((version) => version + 1);
    setProgressionRevision((version) => version + 1);
  }

  function addDemoData() {
    const loaded = loadDemoData();
    const settings = { ...load("settings", DEFAULT_SETTINGS), demoPromptDismissed: true };
    save("settings", settings);
    skipProgressionRef.current = true;
    refreshSavedData();
    setNoticeQueue((queue) => [...queue, { type: "toast", message: loaded ? "Sample data loaded." : "Sample data already loaded." }]);
    return loaded;
  }

  function removeDemoData() {
    clearDemoData();
    skipProgressionRef.current = true;
    refreshSavedData();
    setNoticeQueue((queue) => [...queue, { type: "toast", message: "Sample data removed." }]);
  }

  function dismissDemoPrompt() {
    save("settings", { ...load("settings", DEFAULT_SETTINGS), demoPromptDismissed: true });
    setDataVersion((version) => version + 1);
  }

  function openWorkout() {
    setActiveRoutine(null);
    setRequestedExercise("");
    setActiveTab("workouts");
    setWorkoutRequest((request) => request + 1);
  }

  function logLibraryExercise(exercise) {
    setActiveRoutine(null);
    setRequestedExercise(exercise);
    setActiveTab("workouts");
    setWorkoutRequest((request) => request + 1);
  }

  function startRoutine(routine) {
    setActiveRoutine(routine);
    setRequestedExercise(routine.exercises[0]?.name || "");
    setActiveTab("workouts");
    setWorkoutRequest((request) => request + 1);
  }

  function logRoutineExercise(exercise) {
    setRequestedExercise(exercise);
    setWorkoutRequest((request) => request + 1);
  }

  function chooseTab(tab) {
    if (tab === "library") setLibrarySection("Browse");
    setActiveTab(tab);
    document.getElementById(`panel-${tab}`)?.focus({ preventScroll: true });
  }

  function openSkillTree() {
    setLibrarySection("Skill tree");
    setActiveTab("library");
    document.getElementById("panel-library")?.focus({ preventScroll: true });
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
    <div className="app-shell" data-theme={effectiveTheme} data-active-tab={activeTab}>
      <main id="main-content">
        {!isOnline && <p className="offline-notice" role="status">Offline mode · Your saved data stays on this device.</p>}
        {activeNotice?.type === "toast" && <p className="app-toast" role="status">{activeNotice.message}</p>}
        <RankCelebration
          notice={activeNotice?.type === "rank" ? activeNotice : null}
          rank={activeNotice?.type === "rank" ? RANKS.find((rank) => rank.name === activeNotice.rank) : null}
          onClose={() => setNoticeQueue((queue) => queue.slice(1))}
        />
        <section id="panel-home" className="tab-panel" role="tabpanel" aria-labelledby="tab-home" tabIndex="-1" hidden={activeTab !== "home"}>
          <Dashboard
            key={`dashboard-${dataVersion}`}
            workouts={workoutData.workouts}
            workoutError={workoutData.error}
            active={activeTab === "home"}
            onWorkout={openWorkout}
            onSettings={() => chooseTab("settings")}
            onSkillTree={openSkillTree}
            onLoadDemo={addDemoData}
            onDismissDemo={dismissDemoPrompt}
          />
        </section>

        <section id="panel-workouts" className="tab-panel" role="tabpanel" aria-labelledby="tab-workouts" tabIndex="-1" hidden={activeTab !== "workouts"}>
          <Workouts
            key={`workouts-${dataVersion}`}
            workouts={workoutData.workouts}
            storageError={workoutData.error}
            onSave={persistWorkouts}
            openRequest={workoutRequest}
            initialExercise={requestedExercise}
            activeRoutine={activeRoutine}
            onLogRoutineExercise={logRoutineExercise}
            units={settingsData.settings.units}
            theme={effectiveTheme}
            onStartRoutine={startRoutine}
          />
        </section>

        <section id="panel-habits" className="tab-panel" role="tabpanel" aria-labelledby="tab-habits" tabIndex="-1" hidden={activeTab !== "habits"}>
          <Habits key={`habits-${dataVersion}`} />
        </section>

        <section id="panel-diet" className="tab-panel" role="tabpanel" aria-labelledby="tab-diet" tabIndex="-1" hidden={activeTab !== "diet"}>
          <Diet
            key={`diet-${dataVersion}`}
            settings={settingsData.settings}
            onSettingsChange={saveSettings}
          />
        </section>

        <section id="panel-library" className="tab-panel" role="tabpanel" aria-labelledby="tab-library" tabIndex="-1" hidden={activeTab !== "library"}>
          <Library
            key={`library-${dataVersion}`}
            workouts={workoutData.workouts}
            onLogExercise={logLibraryExercise}
            initialSection={librarySection}
            onProgressionChange={() => setProgressionRevision((version) => version + 1)}
          />
        </section>

        <section id="panel-settings" className="tab-panel" role="tabpanel" aria-label="Settings and backup" tabIndex="-1" hidden={activeTab !== "settings"}>
          <Settings
            settings={settingsData.settings}
            storageError={settingsData.error}
            onSaveSettings={saveSettings}
            onImport={importAppData}
            onReset={resetAppData}
            onLoadDemo={addDemoData}
            onClearDemo={removeDemoData}
          />
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
