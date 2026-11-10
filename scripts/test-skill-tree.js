import assert from "node:assert/strict";
import { getSkillStates } from "../src/skillTree.js";

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
result = getSkillStates([], ["pull-up", "muscle-up-transition"]);
assert.equal(nodeState(result, "muscle-up").state, "locked");
result = getSkillStates([], ["muscle-up"]);
assert.equal(nodeState(result, "muscle-up").state, "mastered");

result = getSkillStates([workout("Wall push up", [12, 12, 12])]);
assert.equal(nodeState(result, "wall-push-up").state, "mastered");
assert.equal(nodeState(result, "incline-push-up").state, "available");
assert.equal(result.nextUp.id, "incline-push-up");

result = getSkillStates(
  [workout("Plank", [60, 60, 60], "seconds")],
  ["dips"],
);
assert.equal(nodeState(result, "tuck-l-sit").state, "available");

console.log("Skill tree tests passed: states, branching prerequisites, goal types, name matching, overrides, and next up.");
