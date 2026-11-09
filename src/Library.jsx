import { useMemo, useState } from "react";
import { EXERCISES, PROGRESSIONS } from "../data/exercises.js";

const CATEGORIES = ["All", "Push", "Pull", "Legs", "Core", "Skills"];

function ExerciseCard({ item, onLog }) {
  return (
    <article className="exercise-card">
      <div className="exercise-card-heading">
        <div>
          <span className="exercise-category">{item.category} · {item.difficulty}</span>
          <h2>{item.name}</h2>
        </div>
        <button className="text-button" type="button" onClick={() => onLog(item.name)}>Log</button>
      </div>
      <p className="exercise-muscles">{item.muscles}</p>
      <details>
        <summary>How to practise</summary>
        <div className="exercise-details">
          <h3>Steps</h3>
          <ol>{item.steps.map((step) => <li key={step}>{step}</li>)}</ol>
          <h3>Form cues</h3>
          <p>{item.cues}</p>
          <h3>Common mistakes</h3>
          <ul>{item.mistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul>
          <a href={item.youtube} target="_blank" rel="noreferrer">Find a free YouTube tutorial <span aria-hidden="true">↗</span></a>
        </div>
      </details>
    </article>
  );
}

function ProgressionGuide({ onLog }) {
  return (
    <section className="library-progressions" aria-labelledby="progression-title">
      <h2 id="progression-title">Choose your next step</h2>
      <p className="muted">Move on when the current step feels steady and pain-free.</p>
      {PROGRESSIONS.map((path) => (
        <details className="progression-path" key={path.name}>
          <summary>{path.name}</summary>
          <ol>
            {path.steps.map((step) => (
              <li key={`${path.name}-${step.exercise}`}>
                <div><strong>{step.exercise}</strong><span>Move on when: {step.unlock}</span></div>
                <button className="text-button" type="button" onClick={() => onLog(step.exercise)}>Log</button>
              </li>
            ))}
          </ol>
        </details>
      ))}
    </section>
  );
}

export default function Library({ onLogExercise }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return EXERCISES.filter((item) => (category === "All" || item.category === category)
      && (!search || `${item.name} ${item.muscles} ${item.category} ${item.difficulty}`.toLowerCase().includes(search)));
  }, [category, query]);

  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">LEARN THE MOVEMENTS</p>
        <h1>Exercise library</h1>
        <p className="intro">Explore clear, original guides and gradual strength progressions.</p>
      </div>
      <section className="library-search" aria-label="Find an exercise">
        <label className="field">
          <span>Search exercises</span>
          <input type="search" value={query} placeholder="Try push-up, legs, or beginner" onChange={(event) => setQuery(event.target.value)} />
        </label>
        <div className="library-filters" aria-label="Filter by category">
          {CATEGORIES.map((item) => (
            <button
              className={`recent-button${category === item ? " is-selected" : ""}`}
              type="button"
              aria-pressed={category === item}
              key={item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>
      <p className="library-result-count" role="status">{filtered.length} {filtered.length === 1 ? "exercise" : "exercises"}</p>
      {filtered.length > 0 ? (
        <section className="exercise-list" aria-label="Exercises">
          {filtered.map((item) => <ExerciseCard item={item} onLog={onLogExercise} key={item.name} />)}
        </section>
      ) : (
        <div className="empty-card">
          <span className="empty-icon" aria-hidden="true">⌕</span>
          <h2>No matching exercises</h2>
          <p>Try a different search or choose another category.</p>
          <button className="secondary-button" type="button" onClick={() => { setQuery(""); setCategory("All"); }}>Show all exercises</button>
        </div>
      )}
      <ProgressionGuide onLog={onLogExercise} />
    </>
  );
}
