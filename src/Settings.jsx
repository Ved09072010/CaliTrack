import { useState } from "react";
import { load, replaceMany } from "../js/storage.js";
import { APP_DATA_KEYS, validateAppData, validateBackup } from "./appData.js";
import { BottomSheet, Icon } from "./ui.jsx";
import { DEFAULT_SETTINGS } from "./settingsData.js";

export default function Settings({ settings, storageError, onSaveSettings, onImport, onReset, onLoadDemo, onClearDemo }) {
  const [sheet, setSheet] = useState("");
  const [draft, setDraft] = useState(settings);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(Boolean(storageError));

  function showSheet(name) {
    setDraft(settings);
    setMessage("");
    setIsError(false);
    setSheet(name);
  }

  function saveSettings(event) {
    event.preventDefault();
    try {
      onSaveSettings(draft);
      setMessage("Saved.");
      setIsError(false);
      setSheet("");
    } catch (error) {
      setMessage(error.message);
      setIsError(true);
    }
  }

  function exportBackup() {
    try {
      const current = Object.fromEntries(APP_DATA_KEYS.map((key) => [
        key,
        load(key, key === "settings" ? DEFAULT_SETTINGS : []),
      ]));
      const data = validateAppData(current);
      const backup = { version: 1, exportedAt: new Date().toISOString(), data };
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `calitrack-backup-${today()}.json`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setSheet("");
      setMessage("Backup saved.");
      setIsError(false);
    } catch (error) {
      setMessage(error.message);
      setIsError(true);
    }
  }

  async function importBackup(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("Choose a backup under 5 MB.");
      const data = validateBackup(JSON.parse(await file.text()));
      onImport(data);
      setSheet("");
      setMessage("Backup restored.");
      setIsError(false);
    } catch (error) {
      setMessage(error.message || "Backup could not be read.");
      setIsError(true);
    } finally {
      input.value = "";
    }
  }

  function reset() {
    try {
      const cleared = Object.fromEntries(APP_DATA_KEYS.map((key) => [key, null]));
      cleared.settings = DEFAULT_SETTINGS;
      replaceMany(cleared);
      onReset();
      setSheet("");
      setMessage("Data reset.");
      setIsError(false);
    } catch (error) {
      setMessage(error.message);
      setIsError(true);
    }

  }

  function runDemoAction(action) {
    try {
      const changed = action === "load" ? onLoadDemo() : onClearDemo();
      setSheet("");
      setMessage(action === "load"
        ? (changed ? "Sample data loaded." : "Sample data already loaded.")
        : "Sample data removed.");
      setIsError(false);
    } catch (error) {
      setMessage(error.message);
      setIsError(true);
    }
  }

  return <>
    <div className="page-heading"><h1>Settings</h1></div>
    {storageError && <p className="form-message is-error" role="alert">{storageError}</p>}
    <section className="settings-list" aria-label="Settings">
      <button className="settings-row" type="button" onClick={() => showSheet("theme")}><span>Theme</span><strong>{settings.theme === "system" ? "System" : settings.theme}</strong><Icon name="arrow" /></button>
      <button className="settings-row" type="button" onClick={() => showSheet("units")}><span>Units</span><strong>{settings.units === "imperial" ? "Imperial" : "Metric"}</strong><Icon name="arrow" /></button>
      <button className="settings-row" type="button" onClick={() => showSheet("goals")}><span>Goals</span><Icon name="arrow" /></button>
      <button className="settings-row" type="button" onClick={() => showSheet("export")}><span>Export backup</span><Icon name="arrow" /></button>
      <button className="settings-row" type="button" onClick={() => showSheet("import")}><span>Restore backup</span><Icon name="arrow" /></button>
      <button className="settings-row" type="button" onClick={() => showSheet("load-demo")}><span>Load demo data</span><Icon name="arrow" /></button>
      <button className="settings-row" type="button" onClick={() => showSheet("clear-demo")}><span>Remove demo data</span><Icon name="arrow" /></button>
      <button className="settings-row is-danger" type="button" onClick={() => showSheet("reset")}><span>Reset data</span><Icon name="arrow" /></button>
      {message && <p className={`form-message${isError ? " is-error" : ""}`} role={isError ? "alert" : "status"}>{message}</p>}
    </section>

    <BottomSheet open={sheet === "theme"} title="Theme" onClose={() => setSheet("")}>
      <form className="sheet-form" onSubmit={saveSettings}><label className="field"><span>Color</span><select value={draft.theme} onChange={(event) => setDraft({ ...draft, theme: event.target.value })}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label><button className="primary-button" type="submit">Save</button></form>
    </BottomSheet>
    <BottomSheet open={sheet === "units"} title="Units" onClose={() => setSheet("")}>
      <form className="sheet-form" onSubmit={saveSettings}><label className="field"><span>Measure in</span><select value={draft.units} onChange={(event) => setDraft({ ...draft, units: event.target.value })}><option value="metric">Metric (kg)</option><option value="imperial">Imperial (lb)</option></select></label><button className="primary-button" type="submit">Save</button></form>
    </BottomSheet>
    <BottomSheet open={sheet === "goals"} title="Goals" onClose={() => setSheet("")}>
      <form className="sheet-form" onSubmit={saveSettings}>
        {[[ "calorieGoal", "Calories" ], [ "proteinGoal", "Protein" ], [ "waterGoal", "Water" ], [ "weeklyWorkoutGoal", "Workouts per week" ]].map(([key, label]) => <label className="field" key={key}><span>{label}</span><input type="number" min="1" value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: Number(event.target.value) })} /></label>)}
        <button className="primary-button" type="submit">Save</button>
      </form>
    </BottomSheet>
    <BottomSheet open={sheet === "export"} title="Export backup" onClose={() => setSheet("")}>
      <p className="sheet-copy">Save a copy of all your data on this device.</p><button className="primary-button" type="button" onClick={exportBackup}>Export</button>
    </BottomSheet>
    <BottomSheet open={sheet === "import"} title="Restore backup" onClose={() => setSheet("")}>
      <label className="field"><span>JSON file</span><input type="file" accept=".json,application/json" onChange={importBackup} /></label>
      {isError && <p className="form-message is-error" role="alert">{message}</p>}
    </BottomSheet>
    <BottomSheet open={sheet === "load-demo"} title="Load demo data?" onClose={() => setSheet("")}>
      <p className="sheet-copy">Adds 12 weeks of sample records beside your data. Your goals and theme stay unchanged.</p>
      <div className="sheet-actions"><button className="secondary-button" type="button" onClick={() => setSheet("")}>Cancel</button><button className="primary-button" type="button" onClick={() => runDemoAction("load")}>Load</button></div>
    </BottomSheet>
    <BottomSheet open={sheet === "clear-demo"} title="Remove demo data?" onClose={() => setSheet("")}>
      <p className="sheet-copy">Removes only records with demo IDs. Your real records and preferences stay.</p>
      <div className="sheet-actions"><button className="secondary-button" type="button" onClick={() => setSheet("")}>Cancel</button><button className="primary-button danger-button" type="button" onClick={() => runDemoAction("clear")}>Remove</button></div>
    </BottomSheet>
    <BottomSheet open={sheet === "reset"} title="Reset CaliTrack?" onClose={() => setSheet("")}>
      <p className="sheet-copy">This removes all saved data from this device.</p>
      <div className="sheet-actions"><button className="secondary-button" type="button" onClick={() => setSheet("")}>Cancel</button><button className="primary-button danger-button" type="button" onClick={reset}>Reset</button></div>
    </BottomSheet>
  </>;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
