import assert from "node:assert/strict";
import {
  getNewlyMasteredSkill,
  getSkillStates,
  markExistingSkillsSeen,
} from "../src/skillTree.js";

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
assert.equal(result.nodes.length, 32);

console.log("Skill tree tests passed: states, branching prerequisites, goal types, name matching, overrides, and next up.");
