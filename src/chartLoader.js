export async function createChart(canvas, config) {
  const { default: Chart } = await import("chart.js/auto");
  return new Chart(canvas, config);
}
