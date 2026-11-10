import { SKILL_TREE } from "../data/skillTree.js";

function normalizedName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/s$/, "");
}

function editDistance(left, right) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (left[i - 1] === right[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[right.length];
}

function namesMatch(left, right) {
  const first = normalizedName(left);
  const second = normalizedName(right);
  if (!first || !second) return false;
  if (first === second) return true;
  return Math.min(first.length, second.length) >= 6
    && editDistance(first, second) <= 1;
}

function masteredOverrides(overrides) {
  if (Array.isArray(overrides)) return new Set(overrides);
  if (!overrides || typeof overrides !== "object") return new Set();
  if (Array.isArray(overrides.mastered)) return new Set(overrides.mastered);
  return new Set(Object.keys(overrides).filter((key) => overrides[key] === true));
}

function getBestSets(workouts, node) {
  let bestValue = 0;
  let bestSetCount = 0;
  workouts.forEach((workout) => {
    if (!workout || !namesMatch(workout.exercise, node.exercise) || !Array.isArray(workout.sets)) return;
    const values = workout.sets.map((set) => Number(set?.[node.goal.type]) || 0);
    bestValue = Math.max(bestValue, ...values);
    bestSetCount = Math.max(bestSetCount, values.filter((value) => value >= node.goal.target).length);
  });
  return { bestValue, bestSetCount };
}

export function getSkillStates(workoutLog = [], masteryOverrides = []) {
  const workouts = Array.isArray(workoutLog) ? workoutLog : [];
  const manualMastery = masteredOverrides(masteryOverrides);
  const progress = new Map(SKILL_TREE.map((node) => [node.id, getBestSets(workouts, node)]));
  const states = new Map();

  function getState(node) {
    if (states.has(node.id)) return states.get(node.id);
    const { bestSetCount } = progress.get(node.id);
    const mastered = manualMastery.has(node.id)
      || bestSetCount >= node.goal.sets;
    const prerequisitesMet = node.requires.every((id) => {
      const prerequisite = SKILL_TREE.find((item) => item.id === id);
      return prerequisite && getState(prerequisite).state === "mastered";
    });
    const state = mastered
      ? "mastered"
      : !prerequisitesMet
        ? "locked"
        : bestSetCount > 0
          ? "in-progress"
          : "available";
    const details = progress.get(node.id);
    const result = {
      ...node,
      state,
      bestValue: details.bestValue,
      qualifyingSets: details.bestSetCount,
      progress: Math.min(1, details.bestSetCount / node.goal.sets),
      bestProgress: details.bestValue
        ? `Best ${details.bestValue} ${node.goal.type} of ${node.goal.target} · ${Math.min(details.bestSetCount, node.goal.sets)}/${node.goal.sets} sets`
        : `No sets yet · ${node.goal.target} ${node.goal.type}`,
    };
    states.set(node.id, result);
    return result;
  }

  const nodes = SKILL_TREE.map(getState);
  const nextUp = nodes
    .filter((node) => node.state === "available" || node.state === "in-progress")
    .sort((left, right) => right.progress - left.progress)[0] || null;

  return { nodes, nextUp };
}
