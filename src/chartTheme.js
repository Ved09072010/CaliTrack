export function getChartTheme(theme) {
  const isLight = theme === "light";
  return {
    accent: isLight ? "#285ea8" : "#4b8be8",
    secondary: isLight ? "#60758f" : "#8b9bb3",
    text: isLight ? "#172033" : "#f1f5f9",
    muted: isLight ? "#526174" : "#a3afbf",
    grid: isLight ? "#cbd5e1" : "#364357",
  };
}
