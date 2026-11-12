import assert from "node:assert/strict";
import {
  getNewlyMasteredSkill,
  getSkillStates,
  markExistingSkillsSeen,
} from "../src/skillTree.js";
import { EXERCISES } from "../data/exercises.js";
import { SKILL_BRANCHES, SKILL_TREE } from "../data/skillTree.js";

const originalSkills = {
  "wall-push-up": "Wall push-up",
  "incline-push-up": "Incline push-up",
  "knee-push-up": "Knee push-up",
  "push-up": "Push-up",
  "diamond-push-up": "Diamond push-up",
  "archer-push-up": "Archer push-up",
  "pike-push-up": "Pike push-up",
  dips: "Dips",
  "dead-hang": "Dead hang",
  "scapular-pull-up": "Scapular pull-up",
  "inverted-row": "Inverted row",
  "negative-pull-up": "Negative pull-up",
  "chin-up": "Chin-up",
  "pull-up": "Pull-up",
  "bodyweight-squat": "Bodyweight squat",
  "reverse-lunge": "Reverse lunge",
  "split-squat": "Split squat",
  "step-up": "Step-up",
  "glute-bridge": "Glute bridge",
  "single-leg-glute-bridge": "Single-leg glute bridge",
  "dead-bug": "Dead bug",
  "bird-dog": "Bird dog",
  plank: "Plank",
  "side-plank": "Side plank",
  "hollow-hold": "Hollow hold",
  "handstand-practice": "Handstand practice",
  "wall-handstand-hold": "Wall handstand hold",
  "tuck-l-sit": "Tuck L-sit",
  "muscle-up-transition": "Muscle-up transition drill",
  "tuck-front-lever": "Tuck front lever hold",
  "planche-lean": "Planche lean",
  "muscle-up": "Muscle-up",
};

assert.equal(SKILL_TREE.length, 90);
assert.equal(new Set(SKILL_TREE.map((node) => node.id)).size, SKILL_TREE.length);
assert.equal(new Set(EXERCISES.map((exercise) => exercise.id)).size, EXERCISES.length);
const exerciseIds = new Set(EXERCISES.map((exercise) => exercise.id));
const nodesById = new Map(SKILL_TREE.map((node) => [node.id, node]));
SKILL_TREE.forEach((node) => {
  assert.ok(exerciseIds.has(node.exercise), `${node.id} exercise resolves`);
  assert.ok(node.tier >= 1 && node.tier <= 6, `${node.id} tier is valid`);
  assert.ok(["reps", "seconds"].includes(node.goal.type), `${node.id} goal type is valid`);
  assert.ok(node.goal.target > 0 && node.goal.sets > 0, `${node.id} goal is positive`);
  node.requires.forEach((id) => assert.ok(nodesById.has(id), `${node.id} prerequisite ${id} resolves`));
});
SKILL_BRANCHES.forEach((branch) => {
  const branchNodes = SKILL_TREE.filter((node) => node.branch === branch);
  assert.equal(branchNodes.length, 18, `${branch} has 18 skills`);
  assert.ok(new Set(branchNodes.map((node) => node.line)).size >= 2);
});
Object.entries(originalSkills).forEach(([id, name]) => {
  const node = nodesById.get(id);
  assert.ok(node, `legacy node ${id} remains`);
  assert.equal(EXERCISES.find((exercise) => exercise.id === node.exercise)?.name, name);
});
const reached = new Set();
function visit(id, active = new Set()) {
  assert.ok(!active.has(id), `cycle detected at ${id}`);
  if (reached.has(id)) return;
  active.add(id);
  const node = nodesById.get(id);
  node.requires.forEach((requiredId) => visit(requiredId, active));
  active.delete(id);
  reached.add(id);
}
SKILL_TREE.forEach((node) => visit(node.id));
assert.equal(reached.size, SKILL_TREE.length, "all nodes are reachable from roots");

function nodeState(result, id) {
  return result.nodes.find((node) => node.id === id);
}

function workout(exercise, values, type = "reps") {
  return {
    exercise,
    sets: values.map((value) => ({ reps: type === "reps" ? value : 0, seconds: type === "seconds" ? value : 0 })),
  };
}

let result = getSkillStates([]);
assert.equal(nodeState(result, "wall-push-up").state, "available");
assert.equal(nodeState(result, "push-up").state, "locked");
assert.equal(result.nextUp.id, "wall-push-up");

result = getSkillStates([workout("pLaNk", [60], "seconds")]);
assert.equal(nodeState(result, "plank").state, "in-progress");
assert.equal(nodeState(result, "plank").bestProgress, "Best 60 seconds of 60 · 1/3 sets");

result = getSkillStates([workout("Plank", [60, 60, 60], "seconds")]);
assert.equal(nodeState(result, "plank").state, "mastered");
assert.equal(nodeState(result, "side-plank").state, "available");
assert.equal(nodeState(result, "tuck-l-sit").state, "locked");
result = getSkillStates([workout("Plank", [60, 60, 60], "seconds")], ["dips"]);
assert.equal(nodeState(result, "tuck-l-sit").state, "available");

result = getSkillStates([workout("pushup", [7])]);
assert.equal(nodeState(result, "wall-push-up").bestValue, 0);
assert.equal(nodeState(result, "push-up").bestValue, 7);
assert.equal(nodeState(result, "push-up").state, "locked");

result = getSkillStates(
  [],
  ["pull-up", "dips", "plank", "muscle-up-transition"],
);
assert.equal(nodeState(result, "muscle-up").state, "available");
assert.equal(nodeState(result, "tuck-l-sit").state, "available");
assert.equal(nodeState(result, "diamond-push-up").state, "locked");
result = getSkillStates([], ["pull-up", "dips"]);
assert.equal(nodeState(result, "muscle-up").state, "locked");
result = getSkillStates([], ["muscle-up"]);
assert.equal(nodeState(result, "muscle-up").state, "mastered");
result = getSkillStates([workout("Muscle-up", [3, 3, 3])]);
assert.equal(nodeState(result, "muscle-up").state, "mastered");
for (const prerequisite of [
  "pull-up",
  "negative-pull-up",
  "dead-hang",
  "scapular-pull-up",
  "chin-up",
  "inverted-row",
  "dips",
  "muscle-up-transition",
]) {
  assert.equal(nodeState(result, prerequisite).state, "mastered", `${prerequisite} should be implied mastered`);
}

result = getSkillStates([workout("Wall push up", [12, 12, 12])]);
assert.equal(nodeState(result, "wall-push-up").state, "mastered");
assert.equal(nodeState(result, "incline-push-up").state, "available");
assert.equal(result.nextUp.id, "incline-push-up");
const wallPushUps = [workout("Wall push up", [12, 12, 12])];
assert.equal(getNewlyMasteredSkill([], wallPushUps).id, "wall-push-up");
assert.equal(getNewlyMasteredSkill([], wallPushUps, { seen: ["wall-push-up"] }), null);
assert.equal(getNewlyMasteredSkill(wallPushUps, wallPushUps), null);
const initializedMastery = markExistingSkillsSeen(
  { mastered: [], seen: [], initialized: false },
  wallPushUps,
);
assert.ok(initializedMastery.seen.includes("wall-push-up"));
assert.equal(initializedMastery.initialized, true);
assert.equal(markExistingSkillsSeen(initializedMastery, []).seen.includes("wall-push-up"), true);
const laterWorkouts = [...wallPushUps, workout("Incline push-up", [10, 10, 10])];
assert.equal(getNewlyMasteredSkill(wallPushUps, laterWorkouts, initializedMastery).id, "incline-push-up");

result = getSkillStates(
  [workout("Plank", [60, 60, 60], "seconds")],
  ["dips"],
);
assert.equal(nodeState(result, "tuck-l-sit").state, "available");

result = getSkillStates([
  workout("Plank", [60], "seconds"),
  workout("Dead bug", [8, 8]),
]);
assert.equal(result.nextUp.id, "dead-bug");
assert.equal(result.nodes.length, 90);

console.log("Skill tree tests passed: 90-node integrity, legacy IDs, states, prerequisites, goals, matching, overrides, and next up.");
