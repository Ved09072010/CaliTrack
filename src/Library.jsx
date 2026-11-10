import { useMemo, useState } from "react";
import { EXERCISES } from "../data/exercises.js";
import { BottomSheet, Icon, IconButton, SegmentedControl } from "./ui.jsx";
import SkillTree from "./SkillTree.jsx";

const CATEGORIES = ["All", "Push", "Pull", "Legs", "Core", "Skills"];

function ExerciseRow({ item, onOpen }) {
  return <button className="exercise-row" type="button" onClick={() => onOpen(item)}>
    <span className="exercise-row-copy"><strong>{item.name}</strong><small>{item.difficulty} · {item.muscles}</small></span>
    <Icon name="arrow" />
  </button>;
}

export default function Library({ workouts, onLogExercise }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [activeSection, setActiveSection] = useState("Browse");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return EXERCISES.filter((item) => (category === "All" || item.category === category)
      && (!search || `${item.name} ${item.muscles} ${item.category} ${item.difficulty}`.toLowerCase().includes(search)));
  }, [category, query]);

  return <>
    <div className="page-heading"><h1>Library</h1></div>
    <SegmentedControl label="Library view" options={["Browse", "Skill tree"]} value={activeSection} onChange={setActiveSection} />
    {activeSection === "Browse" && <>
      <div className="library-controls">
        <label className="field"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <IconButton label="Search exercises" onClick={() => setSearchOpen((value) => !value)}><span aria-hidden="true">⌕</span></IconButton>
      </div>
      {searchOpen && <label className="field library-search-field"><span>Search</span><input autoFocus type="search" value={query} placeholder="Exercise or muscle" onChange={(event) => setQuery(event.target.value)} /></label>}
      {filtered.length ? <section className="exercise-list" aria-label="Exercises">
        {filtered.slice(0, showAll ? undefined : 5).map((item) => <ExerciseRow item={item} onOpen={setSelectedExercise} key={item.name} />)}
        {filtered.length > 5 && <button className="quiet-link" type="button" onClick={() => setShowAll((value) => !value)}>{showAll ? "Show fewer" : "See all"}</button>}
      </section> : <div className="empty-card"><p>No matching exercises.</p><button className="secondary-button" type="button" onClick={() => { setQuery(""); setCategory("All"); }}>Show all</button></div>}
    </>}
    {activeSection === "Skill tree" && <SkillTree workouts={workouts} onLogExercise={onLogExercise} />}
    <BottomSheet open={Boolean(selectedExercise)} title={selectedExercise?.name || "Exercise"} onClose={() => setSelectedExercise(null)}>
      {selectedExercise && <div className="exercise-details">
        <p className="exercise-meta">{selectedExercise.difficulty} · {selectedExercise.muscles}</p>
        <details><summary>Steps</summary><ol>{selectedExercise.steps.map((step) => <li key={step}>{step}</li>)}</ol></details>
        <details><summary>Form cues</summary><p>{selectedExercise.cues}</p></details>
        <details><summary>Common mistakes</summary><ul>{selectedExercise.mistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></details>
        <a href={selectedExercise.youtube} target="_blank" rel="noreferrer">Free tutorial</a>
        <button className="primary-button" type="button" onClick={() => { onLogExercise(selectedExercise.name); setSelectedExercise(null); }}>Log</button>
      </div>}
    </BottomSheet>
  </>;
}
