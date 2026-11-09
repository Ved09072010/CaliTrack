export const DEFAULT_SETTINGS = {
  theme: "dark",
  units: "metric",
  calorieGoal: 2000,
  proteinGoal: 100,
  waterGoal: 2000,
};

export const KG_PER_POUND = 0.45359237;

export function toKilograms(value, units) {
  return units === "imperial" ? value * KG_PER_POUND : value;
}

export function fromKilograms(value, units) {
  return units === "imperial" ? value / KG_PER_POUND : value;
}
