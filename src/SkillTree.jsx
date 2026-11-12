import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { load, save } from "../js/storage.js";
import { PROGRESSIONS, EXERCISES } from "../data/exercises.js";
import { SKILL_BRANCHES } from "../data/skillTree.js";
import { normalizeSkillMastery } from "./appData.js";
import { getSkillStates, markExistingSkillsSeen } from "./skillTree.js";
import { BottomSheet, Icon } from "./ui.jsx";

const EMPTY_MASTERY = { mastered: [], seen: [], initialized: false };
const STATE_LABELS = {
  locked: "Locked",
  available: "Available",
  "in-progress": "In progress",
  mastered: "Mastered",
};

function readMastery() {
  try {
    return { value: normalizeSkillMastery(load("skillMastery", EMPTY_MASTERY)), error: "" };
  } catch (readError) {
    return { value: EMPTY_MASTERY, error: readError.message };
  }
}

function StatusMark({ state }) {
  return <span className={`skill-state-mark is-${state}`} aria-hidden="true">
    {state === "locked" ? <svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
      : state === "mastered" ? <svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg>
        : <span>{state === "in-progress" ? "…" : "○"}</span>}
  </span>;
}

function goalLabel(goal) {
  return `${goal.sets} × ${goal.target} ${goal.type}`;
}

export default function SkillTree({ workouts, onLogExercise }) {
  const [savedMastery, setSavedMastery] = useState(readMastery);
  const [activeBranch, setActiveBranch] = useState(SKILL_BRANCHES[0]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null);
  const [showAllPaths, setShowAllPaths] = useState(false);
  const [connectionLayout, setConnectionLayout] = useState({ width: 1, height: 1, edges: [] });
  const [error, setError] = useState(savedMastery.error);
  const stageRef = useRef(null);
  const nodeRefs = useRef(new Map());
  const mastery = savedMastery.value;
  const states = useMemo(() => getSkillStates(workouts, mastery), [workouts, mastery]);
  const nodesInBranch = useMemo(
    () => states.nodes.filter((node) => node.branch === activeBranch),
    [states.nodes, activeBranch],
  );
  const selected = states.nodes.find((node) => node.id === selectedNode?.id) || null;
  const exerciseDetails = selected && EXERCISES.find((item) => item.id === selected.exercise);
  const masteredCount = states.nodes.filter((node) => node.state === "mastered").length;
  const manualMastery = useMemo(() => new Set(mastery.mastered), [mastery.mastered]);
  const seen = useMemo(() => new Set(mastery.seen), [mastery.seen]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    function updateConnections() {
      const bounds = stage.getBoundingClientRect();
      const edges = [];
      nodesInBranch.forEach((node) => {
        const target = nodeRefs.current.get(node.id);
        if (!target) return;
        const targetBounds = target.getBoundingClientRect();
        node.requires.forEach((requiredId) => {
          if (!nodesInBranch.some((item) => item.id === requiredId)) return;
          const source = nodeRefs.current.get(requiredId);
          if (!source) return;
          const sourceBounds = source.getBoundingClientRect();
          const x1 = sourceBounds.left + sourceBounds.width / 2 - bounds.left;
          const y1 = sourceBounds.bottom - bounds.top;
          const x2 = targetBounds.left + targetBounds.width / 2 - bounds.left;
          const y2 = targetBounds.top - bounds.top;
          const bend = Math.max(12, (y2 - y1) / 2);
          edges.push({
            id: `${requiredId}-${node.id}`,
            path: `M ${x1} ${y1} C ${x1} ${y1 + bend}, ${x2} ${y2 - bend}, ${x2} ${y2}`,
          });
        });
      });
      setConnectionLayout((current) => (
        current.width === stage.clientWidth
        && current.height === stage.clientHeight
        && JSON.stringify(current.edges) === JSON.stringify(edges)
          ? current
          : { width: stage.clientWidth || 1, height: stage.clientHeight || 1, edges }
      ));
    }

    updateConnections();
    window.addEventListener("resize", updateConnections);
    return () => window.removeEventListener("resize", updateConnections);
  }, [nodesInBranch]);

  useEffect(() => {
    if (mastery.initialized || error) return;
    updateMastery(markExistingSkillsSeen(mastery, workouts));
  }, [mastery.initialized, error, workouts]);

  function updateMastery(next) {
    try {
      save("skillMastery", next);
      setSavedMastery({ value: next, error: "" });
      setError("");
      return true;
    } catch (saveError) {
      setError(saveError.message);
      return false;
    }
  }

  function openNode(node) {
    if (!seen.has(node.id) && !error) {
      const next = { ...mastery, seen: [...mastery.seen, node.id] };
      if (!updateMastery(next)) return;
    }
    setSelectedNode(node);
  }

  function toggleManualMastery() {
    if (!selected) return;
    const nextMastered = manualMastery.has(selected.id)
      ? mastery.mastered.filter((id) => id !== selected.id)
      : [...mastery.mastered, selected.id];
    updateMastery({ ...mastery, mastered: nextMastered });
  }

  function jumpToPrerequisite(node) {
    setActiveBranch(node.branch);
    openNode(node);
  }

  function nodeCounts(branch) {
    const branchNodes = states.nodes.filter((node) => node.branch === branch);
    return `${branchNodes.filter((node) => node.state === "mastered").length}/${branchNodes.length}`;
  }

  return <>
    <div className="skill-branch-chips" role="group" aria-label="Skill branches">
      {SKILL_BRANCHES.map((branch) => <button
        className={branch === activeBranch ? "is-selected" : ""}
        type="button"
        aria-pressed={branch === activeBranch}
        key={branch}
        onClick={() => setActiveBranch(branch)}
      >{branch}<small>{nodeCounts(branch)}</small></button>)}
    </div>

    {workouts.length === 0 && masteredCount === 0 && <p className="skill-tree-empty">Start with any open skill.</p>}
    {states.nextUp && <p className="skill-next-up">Next up: <strong>{states.nextUp.exerciseName}</strong></p>}
    {error && <p className="form-message is-error" role="alert">{error}</p>}

    <div className="skill-tree-stage" ref={stageRef}>
      <svg className="skill-tree-connectors" viewBox={`0 0 ${connectionLayout.width} ${connectionLayout.height}`} aria-hidden="true" focusable="false">
        {connectionLayout.edges.map((connection) => <path key={connection.id} d={connection.path} />)}
      </svg>
      <div className="skill-tree-nodes">
        {nodesInBranch.map((node, index) => <button
          className={`skill-node is-${node.state}`}
          data-lane={index % 2 ? "right" : "left"}
          type="button"
          key={node.id}
          ref={(element) => {
            if (element) nodeRefs.current.set(node.id, element);
            else nodeRefs.current.delete(node.id);
          }}
          aria-label={`${node.exerciseName}, ${STATE_LABELS[node.state]}, ${node.bestProgress}`}
          onClick={() => openNode(node)}
        >
          <StatusMark state={node.state} />
          <span className="skill-node-copy">
            <strong>{node.exerciseName}{mastery.initialized && node.state === "mastered" && !seen.has(node.id) && <small className="skill-new-marker">New</small>}</strong>
            <small>{node.bestProgress}</small>
            <span className="skill-progress-track"><i style={{ "--skill-progress": `${node.progress * 100}%` }} /></span>
          </span>
          <span className="skill-node-state">{STATE_LABELS[node.state]}</span>
        </button>)}
      </div>
    </div>

    <section className="skill-progression-refs" aria-label="Progression paths">
      <h2>Progressions</h2>
      {PROGRESSIONS.slice(0, showAllPaths ? undefined : 5).map((path) => <button className="progression-row" type="button" key={path.name} onClick={() => setSelectedPath(path)}>
        <span><strong>{path.name}</strong><small>{path.steps.length} steps</small></span><Icon name="arrow" />
      </button>)}
      {PROGRESSIONS.length > 5 && <button className="quiet-link" type="button" onClick={() => setShowAllPaths((value) => !value)}>{showAllPaths ? "Show fewer" : "See all"}</button>}
    </section>

    <BottomSheet open={Boolean(selected)} title={selected?.exerciseName || "Skill"} onClose={() => setSelectedNode(null)}>
      {selected && <div className="skill-node-sheet">
        <p className="skill-node-description">{exerciseDetails?.difficulty} · {exerciseDetails?.muscles}</p>
        <p><strong>Goal</strong><span>{goalLabel(selected.goal)}</span></p>
        <p><strong>Your best</strong><span>{selected.bestProgress}</span></p>
        <span className="skill-progress-track" role="progressbar" aria-label="Goal progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(selected.progress * 100)}>
          <i style={{ "--skill-progress": `${selected.progress * 100}%` }} />
        </span>
        {selected.requires.length > 0 && <div className="skill-prerequisites">
          <strong>Requires</strong>
          {selected.requires.map((id) => {
            const prerequisite = states.nodes.find((node) => node.id === id);
            return prerequisite && <button type="button" key={id} onClick={() => jumpToPrerequisite(prerequisite)}>
              {prerequisite.exercise} · {STATE_LABELS[prerequisite.state]}
            </button>;
          })}
        </div>}
        <button className="primary-button" type="button" onClick={() => { onLogExercise(selected.exerciseName); setSelectedNode(null); }}>Log this</button>
        <button className="skill-manual-toggle" type="button" role="switch" aria-checked={manualMastery.has(selected.id)} disabled={Boolean(error)} onClick={toggleManualMastery}>
          <span>Mark as mastered</span><i aria-hidden="true">{manualMastery.has(selected.id) ? "On" : "Off"}</i>
        </button>
      </div>}
    </BottomSheet>

    <BottomSheet open={Boolean(selectedPath)} title={selectedPath?.name || "Progression"} onClose={() => setSelectedPath(null)}>
      {selectedPath && <ol className="progression-steps">{selectedPath.steps.map((step) => <li key={`${selectedPath.name}-${step.exercise}`}><strong>{step.exercise}</strong><span>{step.unlock}</span><button className="secondary-button" type="button" onClick={() => { onLogExercise(step.exercise); setSelectedPath(null); }}>Log</button></li>)}</ol>}
    </BottomSheet>
  </>;
}
