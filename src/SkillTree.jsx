import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { EXERCISES, PROGRESSIONS } from "../data/exercises.js";
import { RANKS, TIER_XP } from "../data/progression.js";
import { SKILL_BRANCHES } from "../data/skillTree.js";
import { load, save } from "../js/storage.js";
import { normalizeSkillMastery } from "./appData.js";
import { getBadges, getProgress } from "./progression.js";
import { getSkillStates } from "./skillTree.js";
import { BottomSheet, Icon, IconButton } from "./ui.jsx";
import RankCrest from "./RankCrest.jsx";
import BadgeGrid from "./BadgeGrid.jsx";

const EMPTY_MASTERY = { mastered: [], seen: [], initialized: false, badgesSeen: [], rankSeen: "Rookie" };
const STATE_LABELS = {
  locked: "Locked",
  available: "Available",
  "in-progress": "In progress",
  mastered: "Mastered",
};

function readMastery() {
  try {
    return { value: normalizeSkillMastery(load("skillMastery", EMPTY_MASTERY)), error: "" };
  } catch (error) {
    return { value: EMPTY_MASTERY, error: error.message };
  }
}

function goalLabel(goal) {
  return `${goal.sets} × ${goal.target} ${goal.type}`;
}

function StatusMark({ state }) {
  return <span className={`skill-state-mark is-${state}`} aria-hidden="true">
    {state === "locked" ? <svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
      : state === "mastered" ? <svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg>
        : <span>{state === "in-progress" ? "…" : "○"}</span>}
  </span>;
}

function XpBar({ earned, needed, label }) {
  const percent = needed ? Math.min(100, (earned / needed) * 100) : 100;
  return <div
    className="progression-xp-track"
    role="progressbar"
    aria-label={label}
    aria-valuemin="0"
    aria-valuemax={needed || 1}
    aria-valuenow={Math.min(earned, needed)}
    style={{ "--xp-progress": `${percent}%` }}
  ><i /></div>;
}

function SkillOverview({ nodes, progress, onOpenBranch, onOpenBadges, badges }) {
  const rank = RANKS[progress.rankIndex];
  return <div className="skill-overview">
    <section className="skill-profile glass-panel" aria-label="Progress profile">
      <RankCrest rank={rank} />
      <div className="skill-profile-main">
        <div className="skill-profile-heading"><h2>{progress.rank}</h2><span>Level {progress.level}</span></div>
        <strong className="skill-profile-xp">{progress.totalXP.toLocaleString()} XP</strong>
        <XpBar earned={progress.rankProgress.earned} needed={progress.rankProgress.needed} label="Progress to next rank" />
        <div className="skill-profile-foot">
          <span>{progress.rankProgress.nextRank ? `${progress.xpToNextRank.toLocaleString()} XP to ${progress.rankProgress.nextRank}` : "Highest rank"}</span>
          <span>Level progress {progress.levelProgress.earned} / {progress.levelProgress.needed} XP</span>
        </div>
      </div>
    </section>

    <div className="skill-overview-grid">
      {SKILL_BRANCHES.map((branch) => {
        const branchNodes = nodes.filter((node) => node.branch === branch);
        const mastered = branchNodes.filter((node) => node.state === "mastered").length;
        const nextUp = branchNodes.find((node) => node.state === "available" || node.state === "in-progress");
        const branchProgress = progress.branches[branch];
        return <button className="skill-overview-tile" type="button" key={branch} onClick={() => onOpenBranch(branch)}>
          <span className="skill-tile-top"><strong>{branch}</strong><Icon name="arrow" /></span>
          <span className="skill-mini-map" aria-hidden="true">
            {branchNodes.map((node) => <i className={`is-${node.state}`} key={node.id} />)}
          </span>
          <span className="skill-tile-stats"><strong>{mastered} / {branchNodes.length}</strong><small>Level {branchProgress.level}</small></span>
          <span className="skill-tile-next"><small>Next up</small><strong>{nextUp?.exerciseName || "Complete"}</strong></span>
        </button>;
      })}
      <button className="skill-overview-tile skill-badges-tile" type="button" onClick={onOpenBadges}>
        <span className="skill-tile-top"><strong>Badges</strong><Icon name="arrow" /></span>
        <span className="skill-badge-tile-count">{badges.filter((badge) => badge.earned).length} <small>/ {badges.length}</small></span>
        <span className="skill-tile-next"><small>Earned</small><strong>Personal milestones</strong></span>
      </button>
    </div>
  </div>;
}

function SkillBranch({ branch, nodes, progress, onBack, onOpenNode, onOpenPath }) {
  const stageRef = useRef(null);
  const nodeRefs = useRef(new Map());
  const [layout, setLayout] = useState({ width: 1, height: 1, edges: [] });
  const branchNodes = nodes.filter((node) => node.branch === branch);
  const lines = [...new Set(branchNodes.map((node) => node.line))];
  const lineNodes = lines.map((line) => ({
    line,
    nodes: branchNodes.filter((node) => node.line === line),
  }));
  const branchProgress = progress.branches[branch];

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const update = () => {
      const bounds = stage.getBoundingClientRect();
      const edges = [];
      branchNodes.forEach((node) => {
        const target = nodeRefs.current.get(node.id);
        if (!target) return;
        const targetBounds = target.getBoundingClientRect();
        node.requires.forEach((requiredId) => {
          if (!branchNodes.some((item) => item.id === requiredId)) return;
          const source = nodeRefs.current.get(requiredId);
          if (!source) return;
          const sourceBounds = source.getBoundingClientRect();
          const x1 = sourceBounds.left + sourceBounds.width / 2 - bounds.left;
          const y1 = sourceBounds.bottom - bounds.top;
          const x2 = targetBounds.left + targetBounds.width / 2 - bounds.left;
          const y2 = targetBounds.top - bounds.top;
          const bend = Math.max(12, Math.abs(y2 - y1) / 2);
          edges.push({
            id: `${requiredId}-${node.id}`,
            path: `M ${x1} ${y1} C ${x1} ${y1 + bend}, ${x2} ${y2 - bend}, ${x2} ${y2}`,
          });
        });
      });
      setLayout((current) => {
        const width = stage.clientWidth || 1;
        const height = stage.clientHeight || 1;
        return current.width === width && current.height === height
          && JSON.stringify(current.edges) === JSON.stringify(edges)
          ? current
          : { width, height, edges };
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [branchNodes]);

  return <>
    <header className="skill-branch-header">
      <IconButton label="Back to skill overview" onClick={onBack}><Icon name="back" /></IconButton>
      <div><h2>{branch}</h2><span>Level {branchProgress.level} · {branchProgress.xp.toLocaleString()} XP</span></div>
      <span className="skill-branch-count">{branchNodes.filter((node) => node.state === "mastered").length}/{branchNodes.length}</span>
    </header>
    <div className="skill-tree-stage skill-lane-stage" ref={stageRef}>
      <svg className="skill-tree-connectors" viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true" focusable="false">
        {layout.edges.map((edge) => <path key={edge.id} d={edge.path} />)}
      </svg>
      <div className="skill-lanes">
        {lineNodes.map(({ line, nodes: laneNodes }) => <section className="skill-lane" key={line} aria-label={`${line} line`}>
          <h3>{line}</h3>
          {laneNodes.map((node) => <button
            className={`skill-node is-${node.state}`}
            type="button"
            key={node.id}
            ref={(element) => {
              if (element) nodeRefs.current.set(node.id, element);
              else nodeRefs.current.delete(node.id);
            }}
            aria-label={`${node.exerciseName}, Tier ${node.tier}, ${STATE_LABELS[node.state]}, ${node.bestProgress}`}
            onClick={() => onOpenNode(node)}
          >
            <StatusMark state={node.state} />
            <span className="skill-node-copy">
              <strong>{node.exerciseName}</strong>
              <span className="skill-tier-pips" aria-label={`Tier ${node.tier}`}>
                {Array.from({ length: 6 }, (_, index) => <i className={index < node.tier ? "is-filled" : ""} key={index} />)}
              </span>
              <small>{node.bestProgress}</small>
            </span>
            <span className="skill-node-state">{STATE_LABELS[node.state]}</span>
          </button>)}
        </section>)}
      </div>
    </div>
    <details className="skill-progression-refs">
      <summary>Progression guides</summary>
      {PROGRESSIONS.map((path) => <button className="progression-row" type="button" key={path.name} onClick={() => onOpenPath(path)}>
        <span><strong>{path.name}</strong><small>{path.steps.length} steps</small></span><Icon name="arrow" />
      </button>)}
    </details>
  </>;
}

export default function SkillTree({ workouts, onLogExercise, onProgressionChange }) {
  const [savedMastery, setSavedMastery] = useState(readMastery);
  const [view, setView] = useState("overview");
  const [activeBranch, setActiveBranch] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [selectedPath, setSelectedPath] = useState(null);
  const [error, setError] = useState(savedMastery.error);
  const mastery = savedMastery.value;
  const states = useMemo(() => getSkillStates(workouts, mastery), [workouts, mastery]);
  const progress = useMemo(() => getProgress(workouts, mastery), [workouts, mastery]);
  const badges = useMemo(() => getBadges(workouts, mastery, progress), [workouts, mastery, progress]);
  const selected = states.nodes.find((node) => node.id === selectedNodeId) || null;
  const exerciseDetails = selected && EXERCISES.find((item) => item.id === selected.exercise);
  const manualMastery = new Set(mastery.mastered);

  function updateMastery(next) {
    try {
      save("skillMastery", next);
      setSavedMastery({ value: next, error: "" });
      setError("");
      onProgressionChange?.();
      return true;
    } catch (saveError) {
      setError(saveError.message);
      return false;
    }
  }

  function openNode(node) {
    if (!mastery.seen.includes(node.id) && !error) {
      const next = { ...mastery, seen: [...mastery.seen, node.id] };
      if (!updateMastery(next)) return;
    }
    setSelectedNodeId(node.id);
  }

  function toggleManualMastery() {
    if (!selected) return;
    const mastered = manualMastery.has(selected.id)
      ? mastery.mastered.filter((id) => id !== selected.id)
      : [...mastery.mastered, selected.id];
    updateMastery({ ...mastery, mastered });
  }

  function jumpToPrerequisite(node) {
    setActiveBranch(node.branch);
    setView("branch");
    setSelectedNodeId(node.id);
  }

  const visibleBranches = states.nodes.filter((node) => node.branch === activeBranch);

  return <>
    {error && <p className="form-message is-error" role="alert">{error}</p>}
    {view === "overview" && <SkillOverview
      nodes={states.nodes}
      progress={progress}
      badges={badges}
      onOpenBranch={(branch) => { setActiveBranch(branch); setView("branch"); }}
      onOpenBadges={() => setView("badges")}
    />}
    {view === "branch" && <SkillBranch
      branch={activeBranch}
      nodes={visibleBranches}
      progress={progress}
      onBack={() => setView("overview")}
      onOpenNode={openNode}
      onOpenPath={setSelectedPath}
    />}
    {view === "badges" && <BadgeGrid badges={badges} onBack={() => setView("overview")} />}

    <BottomSheet open={Boolean(selected)} title={selected?.exerciseName || "Skill"} onClose={() => setSelectedNodeId("")}>
      {selected && <div className="skill-node-sheet">
        <p className="skill-node-description">{exerciseDetails?.difficulty} · {exerciseDetails?.muscles}</p>
        <p><strong>Tier</strong><span>{selected.tier} · {["", "Beginner", "Novice", "Intermediate", "Advanced", "Expert", "Elite"][selected.tier]}</span></p>
        <p><strong>Goal</strong><span>{goalLabel(selected.goal)}</span></p>
        <p><strong>Your best</strong><span>{selected.bestProgress}</span></p>
        <p><strong>Reward</strong><span>+{TIER_XP[selected.tier]} XP</span></p>
        <XpBar earned={selected.qualifyingSets} needed={selected.goal.sets} label="Skill goal progress" />
        {selected.requires.length > 0 && <div className="skill-prerequisites">
          <strong>Requires</strong>
          {selected.requires.map((id) => {
            const prerequisite = states.nodes.find((node) => node.id === id);
            const crossBranch = prerequisite || getSkillStates(workouts, mastery).nodes.find((node) => node.id === id);
            return crossBranch && <button type="button" key={id} onClick={() => jumpToPrerequisite(crossBranch)}>
              {crossBranch.exerciseName} · {STATE_LABELS[crossBranch.state]}
            </button>;
          })}
        </div>}
        {exerciseDetails && <details className="skill-exercise-guide">
          <summary>Form guide</summary>
          <ol>{exerciseDetails.steps.map((step) => <li key={step}>{step}</li>)}</ol>
          <p>{exerciseDetails.cues}</p>
        </details>}
        <button className="primary-button" type="button" onClick={() => { onLogExercise(selected.exerciseName); setSelectedNodeId(""); }}>Log this</button>
        <button className="skill-manual-toggle" type="button" role="switch" aria-checked={manualMastery.has(selected.id)} disabled={Boolean(error)} onClick={toggleManualMastery}>
          <span>Mark as mastered</span><i aria-hidden="true">{manualMastery.has(selected.id) ? "On" : "Off"}</i>
        </button>
      </div>}
    </BottomSheet>

    <BottomSheet open={Boolean(selectedPath)} title={selectedPath?.name || "Progression"} onClose={() => setSelectedPath(null)}>
      {selectedPath && <ol className="progression-steps">{selectedPath.steps.map((step) => <li key={`${selectedPath.name}-${step.exercise}`}>
        <strong>{step.exercise}</strong><span>{step.unlock}</span>
        <button className="secondary-button" type="button" onClick={() => { onLogExercise(step.exercise); setSelectedPath(null); }}>Log</button>
      </li>)}</ol>}
    </BottomSheet>
  </>;
}
