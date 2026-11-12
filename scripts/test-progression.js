import assert from "node:assert/strict";
import { BADGES } from "../data/badges.js";
import {
  LEVEL_FORMULAS,
  PERSONAL_RECORD_XP,
  RANKS,
  TIER_XP,
  TRAINING_DAY_XP,
} from "../data/progression.js";
import { EXERCISES } from "../data/exercises.js";
import { SKILL_TREE } from "../data/skillTree.js";
import {
  getBadges,
  getLevelForXP,
  getProgress,
  getProgressionCelebrations,
  getRankForXP,
  initializeProgressionSeen,
} from "../src/progression.js";

const emptyMastery = () => ({
  mastered: [],
  seen: [],
  initialized: true,
  badgesSeen: [],
  rankSeen: "Rookie",
});
const workout = (id, date, exercise, reps = [1]) => ({
  id,
  date,
  exercise,
  sets: reps.map((reps) => ({ reps, seconds: 0, weight: 0 })),
});

assert.deepEqual(TIER_XP, { 1: 40, 2: 80, 3: 150, 4: 260, 5: 420, 6: 700 });
assert.equal(TRAINING_DAY_XP, 10);
assert.equal(PERSONAL_RECORD_XP, 25);
for (let tier = 1; tier <= 6; tier += 1) {
  const node = SKILL_TREE.find((entry) => entry.tier === tier);
  const progress = getProgress([], { mastered: [node.id] });
  assert.equal(progress.xpList.find((entry) => entry.skillId === node.id)?.amount, TIER_XP[tier]);
}

const oneDay = [
  workout("day-one-a", "2026-01-01", "Push-up", [1]),
  workout("day-one-b", "2026-01-01", "Push-up", [2]),
];
let progress = getProgress(oneDay, emptyMastery());
assert.equal(progress.xpList.filter((entry) => entry.type === "training-day").length, 1);
assert.equal(progress.xpList.filter((entry) => entry.type === "personal-record").length, 2);
assert.equal(progress.totalXP, TRAINING_DAY_XP + (2 * PERSONAL_RECORD_XP));
assert.equal(progress.branches.Push.xp, progress.totalXP);

progress = getProgress([
  workout("day-one", "2026-01-01", "Push-up", [1]),
  workout("day-two", "2026-01-02", "Push-up", [2]),
], emptyMastery());
assert.equal(progress.workoutDays, 2);
assert.equal(progress.personalRecordCount, 2);
assert.equal(progress.branches.Push.xp, 2 * TRAINING_DAY_XP + 2 * PERSONAL_RECORD_XP);

assert.equal(getLevelForXP(0, LEVEL_FORMULAS.overallDivisor), 1);
assert.equal(getLevelForXP(19, LEVEL_FORMULAS.overallDivisor), 1);
assert.equal(getLevelForXP(20, LEVEL_FORMULAS.overallDivisor), 2);
assert.equal(getLevelForXP(79, LEVEL_FORMULAS.overallDivisor), 2);
assert.equal(getLevelForXP(80, LEVEL_FORMULAS.overallDivisor), 3);
assert.equal(getLevelForXP(7, LEVEL_FORMULAS.branchDivisor), 1);
assert.equal(getLevelForXP(8, LEVEL_FORMULAS.branchDivisor), 2);
RANKS.forEach((rank, index) => {
  assert.equal(getRankForXP(rank.threshold).name, rank.name);
  if (rank.threshold > 0) assert.equal(getRankForXP(rank.threshold - 1).name, RANKS[index - 1].name);
});
progress = getProgress([], { mastered: ["wall-push-up"] });
assert.equal(progress.branches.Push.xp, TIER_XP[1]);
assert.equal(progress.branches.Push.level, 3);
assert.equal(progress.branches.Pull.level, 1);
assert.equal(progress.level, getLevelForXP(progress.totalXP, LEVEL_FORMULAS.overallDivisor));
assert.equal(progress.xpToNextRank, RANKS[1].threshold - progress.totalXP);

const highWorkouts = Array.from({ length: 100 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 0, 1 + (index < 30 ? index : index % 30)));
  return workout(`high-${index}`, date.toISOString().slice(0, 10), EXERCISES[index % EXERCISES.length].name, [index + 1, index + 1, index + 1]);
});
const fullMastery = { ...emptyMastery(), mastered: SKILL_TREE.map((node) => node.id) };
const earnedBadges = getBadges(highWorkouts, fullMastery);
const lockedBadges = getBadges([], emptyMastery());
assert.equal(earnedBadges.length, BADGES.length);
earnedBadges.forEach((badge, index) => {
  assert.equal(badge.earned, true, `${badge.id} should be earned in the high-progress profile`);
  assert.equal(lockedBadges[index].earned, false, `${badge.id} should be locked in the empty profile`);
  assert.ok(badge.name && badge.requirement && badge.medal);
});

const practiceWorkout = workout("wall-goal", "2026-02-01", "Wall push-up", [12, 12, 12]);
const firstUnlock = getProgressionCelebrations([], [practiceWorkout], emptyMastery(), emptyMastery());
assert.ok(firstUnlock.celebrations.some((item) => item.type === "skill"));
assert.ok(firstUnlock.celebrations.some((item) => item.type === "badge" && item.badgeId === "first-skill"));
const alreadyEarned = initializeProgressionSeen([practiceWorkout], { ...emptyMastery(), initialized: false });
assert.equal(getProgressionCelebrations(
  [practiceWorkout],
  [practiceWorkout],
  alreadyEarned,
  alreadyEarned,
).celebrations.length, 0, "existing achievements on first load do not celebrate");
const repeatedUnlock = getProgressionCelebrations(
  [practiceWorkout],
  [practiceWorkout],
  firstUnlock.mastery,
  firstUnlock.mastery,
);
assert.deepEqual(repeatedUnlock.celebrations, [], "the same progression change is not queued twice");

const rankUp = getProgressionCelebrations(
  [],
  [],
  emptyMastery(),
  { ...emptyMastery(), mastered: ["one-arm-pull-up"] },
);
assert.equal(rankUp.celebrations.filter((item) => item.type === "rank").length, 1);
assert.equal(rankUp.mastery.rankSeen, rankUp.celebrations.find((item) => item.type === "rank").rank);
const repeatedRank = getProgressionCelebrations([], [], rankUp.mastery, rankUp.mastery);
assert.equal(repeatedRank.celebrations.filter((item) => item.type === "rank").length, 0);

console.log(`Progression tests passed: XP, levels, ranks, ${BADGES.length} badge rules, and one-time celebration queue.`);
