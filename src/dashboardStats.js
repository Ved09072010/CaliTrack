function isValidDate(value) {
  return typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

export function getBestWorkoutStreak(workouts) {
  const days = [...new Set(workouts.map((workout) => workout.date).filter(isValidDate))].sort();
  let best = 0;
  let current = 0;
  let previous = null;
  days.forEach((day) => {
    const date = new Date(`${day}T00:00:00Z`);
    current = previous && date.getTime() - previous.getTime() === 86400000 ? current + 1 : 1;
    best = Math.max(best, current);
    previous = date;
  });
  return best;
}

export function getCurrentWorkoutStreak(workouts, today) {
  const days = new Set(workouts.map((workout) => workout.date).filter(isValidDate));
  const yesterday = new Date(`${today}T00:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  let cursor = days.has(today) ? today : yesterday.toISOString().slice(0, 10);
  if (!days.has(cursor)) return 0;

  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    const previous = new Date(`${cursor}T00:00:00Z`);
    previous.setUTCDate(previous.getUTCDate() - 1);
    cursor = previous.toISOString().slice(0, 10);
  }
  return streak;
}

export function getWorkoutDaysThisWeek(workouts, today) {
  const monday = new Date(`${today}T00:00:00Z`);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  const start = monday.toISOString().slice(0, 10);
  const end = sunday.toISOString().slice(0, 10);
  return new Set(
    workouts
      .map((workout) => workout.date)
      .filter((date) => isValidDate(date) && date >= start && date <= end),
  ).size;
}

export function getPersonalRecordsThisMonth(workouts, today) {
  const month = today.slice(0, 7);
  const bestByExercise = new Map();
  let records = 0;
  [...workouts]
    .map((workout, index) => ({ workout, index }))
    .sort((a, b) => a.workout.date.localeCompare(b.workout.date) || a.index - b.index)
    .forEach(({ workout }) => {
      if (!Array.isArray(workout.sets) || workout.sets.length === 0) return;
      const isHold = workout.sets.some((set) => Number(set?.seconds) > 0);
      const score = Math.max(...workout.sets.map((set) => Number(set?.[isHold ? "seconds" : "reps"]) || 0));
      const key = `${workout.exercise}:${isHold ? "hold" : "reps"}`;
      if (score > (bestByExercise.get(key) || 0)) {
        bestByExercise.set(key, score);
        if (isValidDate(workout.date) && workout.date.startsWith(month) && workout.date <= today) records += 1;
      }
    });
  return records;
}

export function getDashboardStats(workouts, today) {
  return {
    totalWorkouts: workouts.length,
    totalReps: workouts.reduce((total, workout) => total + (
      Array.isArray(workout.sets)
        ? workout.sets.reduce((sum, set) => sum + (Number(set?.reps) || 0), 0)
        : 0
    ), 0),
    bestStreak: getBestWorkoutStreak(workouts),
    currentStreak: getCurrentWorkoutStreak(workouts, today),
    recordsThisMonth: getPersonalRecordsThisMonth(workouts, today),
  };
}
