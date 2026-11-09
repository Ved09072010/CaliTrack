import { useEffect, useState } from "react";
import { load, replaceMany } from "../js/storage.js";
import { APP_DATA_KEYS, validateAppData, validateBackup } from "./appData.js";
import { DEFAULT_SETTINGS } from "./settingsData.js";

function SettingsForm({ settings, storageError, onSave }) {
  const [draft, setDraft] = useState(settings);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(Boolean(storageError));

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  function submit(event) {
    event.preventDefault();
    try {
      onSave(draft);
      setMessage("Settings saved.");
      setIsError(false);
    } catch (error) {
      setMessage(error.message);
      setIsError(true);
    }
  }

  return (
    <section className="settings-section" aria-labelledby="preferences-title">
      <h2 id="preferences-title">Preferences &amp; goals</h2>
      <form className="settings-form" noValidate onSubmit={submit}>
        <label className="field">
          <span>Color theme</span>
          <select value={draft.theme} onChange={(event) => setDraft({ ...draft, theme: event.target.value })}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>
        <label className="field">
          <span>Measurement units</span>
          <select value={draft.units} onChange={(event) => setDraft({ ...draft, units: event.target.value })}>
            <option value="metric">Metric (kg)</option>
            <option value="imperial">Imperial (lb)</option>
          </select>
        </label>
        {[
          ["calorieGoal", "Daily calorie goal (kcal)"],
          ["proteinGoal", "Daily protein goal (g)"],
          ["waterGoal", "Daily water goal (ml)"],
        ].map(([key, label]) => (
          <label className="field" key={key}>
            <span>{label}</span>
            <input type="number" min="1" step="1" value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: Number(event.target.value) })} />
          </label>
        ))}
        {storageError && <p className="form-message is-error" role="alert">{storageError}</p>}
        {message && <p className={`form-message${isError ? " is-error" : ""}`} role={isError ? "alert" : "status"}>{message}</p>}
        <button className="primary-button" type="submit">Save settings</button>
      </form>
      <p className="muted settings-hint">Weights are stored in kilograms. Changing units converts how they appear without changing your saved records.</p>
    </section>
  );
}

function BackupSection({ onImport, onReset }) {
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

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
      link.download = `calitrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Backup downloaded. Keep it somewhere safe.");
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
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Choose a backup smaller than 5 MB.");
      }
      const backup = JSON.parse(await file.text());
      const data = validateBackup(backup);
      onImport(data);
      setMessage("Backup restored successfully.");
      setIsError(false);
    } catch (error) {
      setMessage(error.message || "The selected backup could not be read.");
      setIsError(true);
    } finally {
      input.value = "";
    }
  }

  function reset() {
    if (!window.confirm("Reset CaliTrack on this device? All workouts, habits, meals, routines, and settings will be deleted.")) return;
    try {
      const cleared = Object.fromEntries(APP_DATA_KEYS.map((key) => [key, null]));
      cleared.settings = DEFAULT_SETTINGS;
      replaceMany(cleared);
      onReset();
      setMessage("All app data was reset on this device.");
      setIsError(false);
    } catch (error) {
      setMessage(error.message);
      setIsError(true);
    }
  }

  return (
    <section className="settings-section" aria-labelledby="backup-title">
      <h2 id="backup-title">Backup &amp; reset</h2>
      <p className="muted">Your backup is a JSON file stored wherever you choose. It is not uploaded.</p>
      <div className="settings-actions">
        <button className="secondary-button" type="button" onClick={exportBackup}>Export all data</button>
        <label className="field backup-file">
          <span>Restore from a JSON backup</span>
          <input type="file" accept=".json,application/json" onChange={importBackup} />
        </label>
        <button className="secondary-button danger-button" type="button" onClick={reset}>Reset all app data</button>
      </div>
      {message && <p className={`form-message${isError ? " is-error" : ""}`} role={isError ? "alert" : "status"}>{message}</p>}
    </section>
  );
}

export default function Settings({ settings, storageError, onSaveSettings, onImport, onReset }) {
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">YOUR APP, YOUR DATA</p>
        <h1>Settings</h1>
        <p className="intro">Choose how CaliTrack looks and keep a copy of your progress.</p>
      </div>
      <SettingsForm settings={settings} storageError={storageError} onSave={onSaveSettings} />
      <BackupSection onImport={onImport} onReset={onReset} />
    </>
  );
}
