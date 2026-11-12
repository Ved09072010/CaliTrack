import { SKILL_TREE } from "../data/skillTree.js";
import { EXERCISES } from "../data/exercises.js";

const EXERCISE_NAMES = new Map(EXERCISES.map((exercise) => [exercise.id, exercise.name]));

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
  const exerciseName = EXERCISE_NAMES.get(node.exercise);
  workouts.forEach((workout) => {
    if (!workout || !exerciseName || !namesMatch(workout.exercise, exerciseName) || !Array.isArray(workout.sets)) return;
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
  const nodesById = new Map(SKILL_TREE.map((node) => [node.id, node]));
  const masteredIds = new Set([
    ...manualMastery,
    ...SKILL_TREE
      .filter((node) => progress.get(node.id).bestSetCount >= node.goal.sets)
      .map((node) => node.id),
  ]);

  function includePrerequisites(nodeId) {
    const node = nodesById.get(nodeId);
    if (!node) return;
    node.requires.forEach((requiredId) => {
      if (masteredIds.has(requiredId)) return;
      masteredIds.add(requiredId);
      includePrerequisites(requiredId);
    });
  }

  [...masteredIds].forEach(includePrerequisites);

  function getState(node) {
    const { bestSetCount } = progress.get(node.id);
    const mastered = masteredIds.has(node.id);
    const prerequisitesMet = node.requires.every((id) => masteredIds.has(id));
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
      exerciseName: EXERCISE_NAMES.get(node.exercise),
      state,
      bestValue: details.bestValue,
      qualifyingSets: details.bestSetCount,
      progress: Math.min(1, details.bestSetCount / node.goal.sets),
      bestProgress: details.bestValue
        ? `Best ${details.bestValue} ${node.goal.type} of ${node.goal.target} · ${Math.min(details.bestSetCount, node.goal.sets)}/${node.goal.sets} sets`
        : `No sets yet · ${node.goal.target} ${node.goal.type}`,
    };
    return result;
  }

  const nodes = SKILL_TREE.map(getState);
  const nextUp = nodes
    .filter((node) => node.state === "available" || node.state === "in-progress")
    .sort((left, right) => right.progress - left.progress)[0] || null;

  return { nodes, nextUp };
}

export function markExistingSkillsSeen(mastery, workoutLog) {
  if (mastery.initialized) return mastery;
  const alreadyMastered = getSkillStates(workoutLog, mastery).nodes
    .filter((node) => node.state === "mastered")
    .map((node) => node.id);
  return {
    ...mastery,
    seen: [...new Set([...mastery.seen, ...alreadyMastered])],
    initialized: true,
  };
}

export function getNewlyMasteredSkill(previousWorkouts, workoutLog, masteryOverrides = []) {
  const previous = getSkillStates(previousWorkouts, masteryOverrides);
  const current = getSkillStates(workoutLog, masteryOverrides);
  const previouslyMastered = new Set(
    previous.nodes.filter((node) => node.state === "mastered").map((node) => node.id),
  );
  const overrides = masteryOverrides && !Array.isArray(masteryOverrides)
    ? masteryOverrides
    : {};
  const seen = new Set(Array.isArray(overrides.seen) ? overrides.seen : []);
  return current.nodes.find((node) => node.state === "mastered"
    && !previouslyMastered.has(node.id)
    && !seen.has(node.id)) || null;
}
