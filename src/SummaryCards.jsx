import { getWeeklyStats } from "./data.js";

export default function SummaryCards({ workouts }) {
  const stats = getWeeklyStats(workouts);
  return (
    <div className="summary-grid">
      {[
        ["Workouts", stats.count],
        ["Total reps", stats.reps],
        ["Day streak", stats.streak],
      ].map(([label, value]) => (
        <div className="summary-card" key={label}>
          <strong>{value}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
