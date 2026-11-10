export const SKILL_BRANCHES = ["Push", "Pull", "Legs", "Core", "Skills"];

export const SKILL_TREE = [
  { id: "wall-push-up", exercise: "Wall push-up", branch: "Push", requires: [], goal: { type: "reps", target: 12, sets: 3 } },
  { id: "incline-push-up", exercise: "Incline push-up", branch: "Push", requires: ["wall-push-up"], goal: { type: "reps", target: 10, sets: 3 } },
  { id: "knee-push-up", exercise: "Knee push-up", branch: "Push", requires: ["incline-push-up"], goal: { type: "reps", target: 10, sets: 3 } },
  { id: "push-up", exercise: "Push-up", branch: "Push", requires: ["knee-push-up"], goal: { type: "reps", target: 15, sets: 3 } },
  { id: "diamond-push-up", exercise: "Diamond push-up", branch: "Push", requires: ["push-up"], goal: { type: "reps", target: 8, sets: 3 } },
  { id: "archer-push-up", exercise: "Archer push-up", branch: "Push", requires: ["diamond-push-up"], goal: { type: "reps", target: 6, sets: 3 } },
  { id: "pike-push-up", exercise: "Pike push-up", branch: "Push", requires: [], goal: { type: "reps", target: 8, sets: 3 } },
  { id: "dips", exercise: "Dips", branch: "Push", requires: [], goal: { type: "reps", target: 8, sets: 3 } },

  { id: "dead-hang", exercise: "Dead hang", branch: "Pull", requires: [], goal: { type: "seconds", target: 20, sets: 3 } },
  { id: "scapular-pull-up", exercise: "Scapular pull-up", branch: "Pull", requires: ["dead-hang"], goal: { type: "reps", target: 8, sets: 3 } },
  { id: "inverted-row", exercise: "Inverted row", branch: "Pull", requires: [], goal: { type: "reps", target: 10, sets: 3 } },
  { id: "negative-pull-up", exercise: "Negative pull-up", branch: "Pull", requires: ["dead-hang", "scapular-pull-up"], goal: { type: "reps", target: 8, sets: 3 } },
  { id: "chin-up", exercise: "Chin-up", branch: "Pull", requires: ["inverted-row"], goal: { type: "reps", target: 8, sets: 3 } },
  { id: "pull-up", exercise: "Pull-up", branch: "Pull", requires: ["negative-pull-up", "chin-up"], goal: { type: "reps", target: 8, sets: 3 } },

  { id: "bodyweight-squat", exercise: "Bodyweight squat", branch: "Legs", requires: [], goal: { type: "reps", target: 12, sets: 3 } },
  { id: "reverse-lunge", exercise: "Reverse lunge", branch: "Legs", requires: [], goal: { type: "reps", target: 8, sets: 3 } },
  { id: "split-squat", exercise: "Split squat", branch: "Legs", requires: ["reverse-lunge"], goal: { type: "reps", target: 10, sets: 3 } },
  { id: "step-up", exercise: "Step-up", branch: "Legs", requires: ["bodyweight-squat"], goal: { type: "reps", target: 10, sets: 3 } },
  { id: "glute-bridge", exercise: "Glute bridge", branch: "Legs", requires: [], goal: { type: "reps", target: 12, sets: 3 } },
  { id: "single-leg-glute-bridge", exercise: "Single-leg glute bridge", branch: "Legs", requires: ["glute-bridge", "split-squat"], goal: { type: "reps", target: 10, sets: 3 } },

  { id: "dead-bug", exercise: "Dead bug", branch: "Core", requires: [], goal: { type: "reps", target: 8, sets: 3 } },
  { id: "bird-dog", exercise: "Bird dog", branch: "Core", requires: [], goal: { type: "reps", target: 8, sets: 3 } },
  { id: "plank", exercise: "Plank", branch: "Core", requires: [], goal: { type: "seconds", target: 60, sets: 3 } },
  { id: "side-plank", exercise: "Side plank", branch: "Core", requires: ["plank"], goal: { type: "seconds", target: 30, sets: 3 } },
  { id: "hollow-hold", exercise: "Hollow hold", branch: "Core", requires: ["dead-bug", "plank"], goal: { type: "seconds", target: 20, sets: 3 } },

  { id: "handstand-practice", exercise: "Handstand practice", branch: "Skills", requires: [], goal: { type: "seconds", target: 20, sets: 3 } },
  { id: "wall-handstand-hold", exercise: "Wall handstand hold", branch: "Skills", requires: ["handstand-practice", "pike-push-up"], goal: { type: "seconds", target: 20, sets: 3 } },
  { id: "tuck-l-sit", exercise: "Tuck L-sit", branch: "Skills", requires: ["plank", "dips"], goal: { type: "seconds", target: 10, sets: 3 } },
  { id: "muscle-up-transition", exercise: "Muscle-up transition drill", branch: "Skills", requires: ["pull-up", "dips"], goal: { type: "reps", target: 5, sets: 3 } },
  { id: "tuck-front-lever", exercise: "Tuck front lever hold", branch: "Skills", requires: ["scapular-pull-up", "pull-up"], goal: { type: "seconds", target: 10, sets: 3 } },
  { id: "planche-lean", exercise: "Planche lean", branch: "Skills", requires: ["push-up"], goal: { type: "seconds", target: 15, sets: 3 } },
  { id: "muscle-up", exercise: "Muscle-up", branch: "Skills", requires: ["pull-up", "dips", "muscle-up-transition"], goal: { type: "reps", target: 3, sets: 3 } },
];
