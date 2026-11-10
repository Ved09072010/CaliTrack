const SECTION_COLORS = {
  workout: { light: "#c8553d", dark: "#e7765e" },
  habit: { light: "#6b8f71", dark: "#8fb996" },
  diet: { light: "#d99a2b", dark: "#f0b44c" },
  info: { light: "#3f7d82", dark: "#6fb3b8" },
};

export function getChartTheme(theme, section = "workout") {
  const isLight = theme === "light";
  const colors = SECTION_COLORS[section] || SECTION_COLORS.workout;
  return {
    accent: isLight ? colors.light : colors.dark,
    secondary: isLight ? SECTION_COLORS.diet.light : SECTION_COLORS.diet.dark,
    text: isLight ? "#2b241d" : "#f0e9df",
    muted: isLight ? "#6f6256" : "#a89d90",
    grid: isLight ? "rgb(79 61 43 / 9%)" : "rgb(240 233 223 / 9%)",
  };
}
