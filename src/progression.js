import { BADGES } from "../data/badges.js";
import {
  LEVEL_FORMULAS,
  PERSONAL_RECORD_XP,
  RANKS,
  TIER_XP,
  TRAINING_DAY_XP,
} from "../data/progression.js";
import { EXERCISES } from "../data/exercises.js";
import { SKILL_BRANCHES } from "../data/skillTree.js";
import { getSkillStates } from "./skillTree.js";
import { getBestWorkoutStreak } from "./dashboardStats.js";

const RANK_INDEX = new Map(RANKS.map((rank, index) => [rank.name, index]));
const EXERCISE_BY_NAME = new Map(EXERCISES.map((exercise) => [normalizeName(exercise.name), exercise]));

function normalizeName(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function validDate(value) {
  return typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime())
    && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

export function getLevelForXP(xp, divisor) {
  return Math.floor((Math.max(0, xp) / divisor) ** LEVEL_FORMULAS.exponent) + 1;
}

function getLevelProgress(xp, divisor, level) {
  const power = 1 / LEVEL_FORMULAS.exponent;
  const currentThreshold = divisor * (level - 1) ** power;
  const nextThreshold = divisor * level ** power;
  return {
    xpToNextLevel: Math.max(0, nextThreshold - xp),
    levelProgress: {
      earned: Math.max(0, xp - currentThreshold),
      needed: nextThreshold - currentThreshold,
      nextThreshold,
    },
  };
}

export function getRankForXP(xp) {
  let index = 0;
  RANKS.forEach((rank, rankIndex) => {
    if (xp >= rank.threshold) index = rankIndex;
  });
  return { ...RANKS[index], index };
}

function getPersonalRecords(workouts) {
  const bestByExercise = new Map();
  return [...workouts]
    .map((workout, index) => ({ workout, index }))
    .filter(({ workout }) => workout && validDate(workout.date) && Array.isArray(workout.sets) && workout.sets.length > 0)
    .sort((left, right) => left.workout.date.localeCompare(right.workout.date)
      || (left.workout.time || "").localeCompare(right.workout.time || "")
      || left.index - right.index)
    .flatMap(({ workout }) => {
      const isHold = workout.sets.some((set) => Number(set?.seconds) > 0);
      const score = Math.max(...workout.sets.map((set) => Number(set?.[isHold ? "seconds" : "reps"]) || 0));
      const key = `${normalizeName(workout.exercise)}:${isHold ? "hold" : "reps"}`;
      if (score <= (bestByExercise.get(key) || 0)) return [];
      bestByExercise.set(key, score);
      return [{ workout, score, branch: EXERCISE_BY_NAME.get(normalizeName(workout.exercise))?.category }];
    });
}

function getWorkoutDays(workouts) {
  const days = new Map();
  workouts.forEach((workout) => {
    if (!workout || !validDate(workout.date)) return;
    if (!days.has(workout.date)) days.set(workout.date, new Set());
    const exercise = EXERCISE_BY_NAME.get(normalizeName(workout.exercise));
    if (SKILL_BRANCHES.includes(exercise?.category)) days.get(workout.date).add(exercise.category);
  });
  return days;
}

function xpEntry(id, type, label, amount, extra = {}) {
  return { id, type, label, amount, ...extra };
}

export function getProgress(workoutLog = [], mastery = { mastered: [] }) {
  const workouts = Array.isArray(workoutLog) ? workoutLog : [];
  const states = getSkillStates(workouts, mastery);
  const entries = [];
  const branchXP = Object.fromEntries(SKILL_BRANCHES.map((branch) => [branch, 0]));

  states.nodes.forEach((node) => {
    if (node.state !== "mastered") return;
    const amount = TIER_XP[node.tier];
    branchXP[node.branch] += amount;
    entries.push(xpEntry(`skill:${node.id}`, "skill", node.exerciseName, amount, {
      branch: node.branch,
      skillId: node.id,
      tier: node.tier,
    }));
  });

  const workoutDays = getWorkoutDays(workouts);
  workoutDays.forEach((branches, date) => {
    entries.push(xpEntry(`day:${date}`, "training-day", "Training day", TRAINING_DAY_XP, { date }));
    branches.forEach((branch) => { branchXP[branch] += TRAINING_DAY_XP; });
  });

  const records = getPersonalRecords(workouts);
  records.forEach(({ workout, branch }) => {
    entries.push(xpEntry(`record:${workout.id}`, "personal-record", `Personal record · ${workout.exercise}`, PERSONAL_RECORD_XP, {
      date: workout.date,
      workoutId: workout.id,
      ...(SKILL_BRANCHES.includes(branch) ? { branch } : {}),
    }));
    if (SKILL_BRANCHES.includes(branch)) branchXP[branch] += PERSONAL_RECORD_XP;
  });

  const totalXP = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const level = getLevelForXP(totalXP, LEVEL_FORMULAS.overallDivisor);
  const levelProgress = getLevelProgress(totalXP, LEVEL_FORMULAS.overallDivisor, level);
  const rank = getRankForXP(totalXP);
  const nextRank = RANKS[rank.index + 1] || null;
  const branchProgress = Object.fromEntries(SKILL_BRANCHES.map((branch) => {
    const xp = branchXP[branch];
    const branchLevel = getLevelForXP(xp, LEVEL_FORMULAS.branchDivisor);
    return [branch, {
      xp,
      level: branchLevel,
      ...getLevelProgress(xp, LEVEL_FORMULAS.branchDivisor, branchLevel),
    }];
  }));

  return {
    totalXP,
    level,
    ...levelProgress,
    rank: rank.name,
    rankIndex: rank.index,
    rankProgress: {
      earned: totalXP - rank.threshold,
      needed: nextRank ? nextRank.threshold - rank.threshold : 0,
      nextRank: nextRank?.name || null,
      nextThreshold: nextRank?.threshold ?? null,
    },
    xpToNextRank: nextRank ? nextRank.threshold - totalXP : 0,
    branches: branchProgress,
    xpList: entries,
    masteredSkills: states.nodes.filter((node) => node.state === "mastered").length,
    workoutDays: workoutDays.size,
    workoutCount: workouts.length,
    personalRecordCount: records.length,
  };
}

export function getBadges(workoutLog = [], mastery = { mastered: [] }, progress = getProgress(workoutLog, mastery)) {
  const workouts = Array.isArray(workoutLog) ? workoutLog : [];
  const states = getSkillStates(workouts, mastery);
  const masteredIds = new Set(states.nodes.filter((node) => node.state === "mastered").map((node) => node.id));
  const reps = workouts.reduce((sum, workout) => sum + (Array.isArray(workout?.sets)
    ? workout.sets.reduce((setSum, set) => setSum + (Number(set?.reps) || 0), 0)
    : 0), 0);
  const hasVarietyWeek = getVarietyWeeks(workouts);

  return BADGES.map((badge) => {
    let earned = false;
    if (badge.rule === "skills") earned = progress.masteredSkills >= badge.target;
    if (badge.rule === "branch") {
      const branchNodes = states.nodes.filter((node) => node.branch === badge.branch);
      earned = branchNodes.length > 0 && branchNodes.every((node) => node.state === "mastered");
    }
    if (badge.rule === "skill") earned = masteredIds.has(badge.skill);
    if (badge.rule === "streak") earned = getBestWorkoutStreak(workouts) >= badge.target;
    if (badge.rule === "workouts") earned = workouts.length >= badge.target;
    if (badge.rule === "reps") earned = reps >= badge.target;
    if (badge.rule === "variety") earned = hasVarietyWeek;
    if (badge.rule === "records") earned = progress.personalRecordCount >= badge.target;
    if (badge.rule === "rank") earned = progress.rankIndex >= RANK_INDEX.get(badge.rank);
    return { ...badge, earned };
  });
}

function getVarietyWeeks(workouts) {
  const branchesByWeek = new Map();
  workouts.forEach((workout) => {
    if (!workout || !validDate(workout.date)) return;
    const branch = EXERCISE_BY_NAME.get(normalizeName(workout.exercise))?.category;
    if (!SKILL_BRANCHES.includes(branch)) return;
    const date = new Date(`${workout.date}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    const week = date.toISOString().slice(0, 10);
    if (!branchesByWeek.has(week)) branchesByWeek.set(week, new Set());
    branchesByWeek.get(week).add(branch);
  });
  return [...branchesByWeek.values()].some((branches) => SKILL_BRANCHES.every((branch) => branches.has(branch)));
}

export function initializeProgressionSeen(workouts, mastery) {
  const progress = getProgress(workouts, mastery);
  const earnedBadges = getBadges(workouts, mastery, progress).filter((badge) => badge.earned).map((badge) => badge.id);
  const states = getSkillStates(workouts, mastery);
  return {
    ...mastery,
    seen: [...new Set([...(mastery.seen || []), ...states.nodes.filter((node) => node.state === "mastered").map((node) => node.id)])],
    badgesSeen: [...new Set([...(mastery.badgesSeen || []), ...earnedBadges])],
    rankSeen: RANKS[Math.max(RANK_INDEX.get(mastery.rankSeen) ?? 0, progress.rankIndex)].name,
    initialized: true,
  };
}

export function getProgressionCelebrations(previousWorkouts, workoutLog, previousMastery, mastery) {
  const before = getProgress(previousWorkouts, previousMastery);
  const current = getProgress(workoutLog, mastery);
  const previouslyMastered = new Set(getSkillStates(previousWorkouts, previousMastery).nodes
    .filter((node) => node.state === "mastered").map((node) => node.id));
  const newlyMastered = getSkillStates(workoutLog, mastery).nodes
    .filter((node) => node.state === "mastered" && !previouslyMastered.has(node.id));
  const celebrations = [];

  if (current.rankIndex > (RANK_INDEX.get(mastery.rankSeen) ?? -1)) {
    celebrations.push({
      type: "rank",
      rank: current.rank,
      level: current.level,
      totalXP: current.totalXP,
      rankProgress: current.rankProgress,
      xpToNextRank: current.xpToNextRank,
    });
  }
  if (newlyMastered.length) {
    celebrations.push({
      type: "skill",
      exerciseName: newlyMastered[0].exerciseName,
      count: newlyMastered.length,
      xp: newlyMastered.reduce((sum, node) => sum + TIER_XP[node.tier], 0),
    });
  }
  if (current.level > before.level) celebrations.push({ type: "level", level: current.level });

  const seenBadges = new Set(mastery.badgesSeen || []);
  const newBadges = getBadges(workoutLog, mastery, current).filter((badge) => badge.earned && !seenBadges.has(badge.id));
  newBadges.forEach((badge) => celebrations.push({ type: "badge", badgeId: badge.id, name: badge.name }));

  const highestRank = Math.max(RANK_INDEX.get(mastery.rankSeen) ?? 0, current.rankIndex);
  return {
    celebrations,
    mastery: {
      ...mastery,
      badgesSeen: [...new Set([...(mastery.badgesSeen || []), ...newBadges.map((badge) => badge.id)])],
      rankSeen: RANKS[highestRank].name,
      initialized: true,
    },
  };
}
