// Tune skill rewards here; mastery and activity rewards are derived from saved records.
export const TIER_XP = {
  1: 40,
  2: 80,
  3: 150,
  4: 260,
  5: 420,
  6: 700,
};

export const TRAINING_DAY_XP = 10;
export const PERSONAL_RECORD_XP = 25;

// Overall levels use 20 XP per squared level step; branch levels use 8.
export const LEVEL_FORMULAS = {
  overallDivisor: 20,
  branchDivisor: 8,
  exponent: 0.5,
};

export const RANKS = [
  { name: "Rookie", threshold: 0, crest: "round", metal: "#9b8067" },
  { name: "Trainee", threshold: 300, crest: "shield", metal: "#a7a9a8" },
  { name: "Mover", threshold: 800, crest: "hex", metal: "#b58e63" },
  { name: "Athlete", threshold: 1600, crest: "diamond", metal: "#8da9a3" },
  { name: "Adept", threshold: 2800, crest: "crown", metal: "#b39b6e" },
  { name: "Expert", threshold: 4500, crest: "star", metal: "#9aa9ad" },
  { name: "Master", threshold: 7000, crest: "laurel", metal: "#a78c64" },
  { name: "Legend", threshold: 10000, crest: "octagon", metal: "#c0aa78" },
];
