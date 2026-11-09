function exercise(name, category, muscles, difficulty, steps, mistakes, cues) {
  const search = encodeURIComponent(`${name} exercise tutorial proper form`);
  return {
    name,
    category,
    muscles,
    difficulty,
    steps,
    mistakes,
    cues,
    youtube: `https://www.youtube.com/results?search_query=${search}`,
  };
}

export const EXERCISES = [
  exercise("Wall push-up", "Push", "Chest, shoulders, triceps", "Beginner", ["Stand an arm's length from a wall and place hands at chest height.", "Bend elbows to bring your chest toward the wall, then press away."], ["Sagging through the hips", "Flaring elbows straight out"], "Keep your body in one line and elbows slightly tucked."),
  exercise("Incline push-up", "Push", "Chest, shoulders, triceps", "Beginner", ["Place hands on a stable bench or counter.", "Lower your chest toward the edge, then press back to straight arms."], ["Using an unstable surface", "Letting hips drop"], "The higher the hands, the easier the variation."),
  exercise("Knee push-up", "Push", "Chest, shoulders, triceps", "Beginner", ["Start on hands and knees with hands just wider than shoulders.", "Keep a straight line from knees to head as you lower and press."], ["Bending at the hips", "Short, uncontrolled reps"], "Brace your middle and lower your chest between your hands."),
  exercise("Push-up", "Push", "Chest, shoulders, triceps", "Intermediate", ["Start in a high plank with hands under shoulders.", "Lower as one unit until your chest is near the floor, then press up."], ["Flaring elbows", "Dropping the hips"], "Squeeze glutes and keep elbows about 30 to 45 degrees from your sides."),
  exercise("Diamond push-up", "Push", "Triceps, chest", "Advanced", ["Set hands close together beneath your chest.", "Lower under control with elbows tracking back, then push away."], ["Forcing a painful wrist angle", "Letting elbows flare wide"], "Use a wider hand position if wrists or shoulders feel uncomfortable."),
  exercise("Archer push-up", "Push", "Chest, shoulders, triceps", "Advanced", ["Take a wide push-up stance and turn the fingers slightly outward.", "Bend one elbow while keeping the other arm long, then push back to center."], ["Twisting the hips", "Going deeper than you can control"], "Shift gradually; keep both shoulders steady."),
  exercise("Dips", "Push", "Chest, triceps, shoulders", "Advanced", ["Support yourself on sturdy parallel bars with shoulders away from ears.", "Bend elbows under control and press back to support."], ["Bouncing at the bottom", "Dropping below a comfortable depth"], "Build support holds first; stop if your shoulder hurts."),
  exercise("Pike push-up", "Push", "Shoulders, triceps", "Intermediate", ["Start with hands and feet on the floor and hips raised.", "Bend elbows to lower the head toward the floor, then press up."], ["Letting hips drift back", "Dropping onto the head"], "Keep the hips high and move slowly."),
  exercise("Bench dip", "Push", "Triceps, shoulders", "Beginner", ["Place hands on a stable bench behind you and feet comfortably forward.", "Bend elbows a little, then press back up without shrugging."], ["Going too deep", "Letting shoulders roll forward"], "Use a small range and stop if the front of the shoulder hurts."),
  exercise("Parallel-bar dip", "Push", "Chest, triceps, shoulders", "Advanced", ["Support yourself on stable bars with shoulders away from ears.", "Bend elbows under control and press back to support."], ["Bouncing at the bottom", "Dropping below a comfortable depth"], "Build support holds first; stop for shoulder pain."),
  exercise("Pull-up", "Pull", "Back, biceps, grip", "Advanced", ["Hang from a secure bar with hands just wider than shoulders.", "Pull your chest upward, then lower slowly to a comfortable hang."], ["Kicking to start each rep", "Shrugging shoulders toward ears"], "Practice assisted reps or controlled negatives before full reps."),
  exercise("Chin-up", "Pull", "Back, biceps, grip", "Intermediate", ["Hold a secure bar with palms facing you.", "Pull until your chin clears the bar, then lower with control."], ["Swinging the legs", "Straining the neck to reach the bar"], "Think elbows down toward your ribs."),
  exercise("Scapular pull-up", "Pull", "Upper back, shoulders, grip", "Beginner", ["Hang from a secure bar with arms straight.", "Draw shoulder blades down to lift slightly, then relax slowly."], ["Bending the elbows", "Using a big swing"], "Keep the movement small and smooth."),
  exercise("Inverted row", "Pull", "Back, biceps, rear shoulders", "Beginner", ["Use a stable low bar or table and hold it with arms extended.", "Keep your body straight, pull your chest toward the bar, then lower."], ["Using an unsecured table", "Letting hips sag"], "Make it easier by standing more upright."),
  exercise("Doorway towel row", "Pull", "Back, biceps", "Beginner", ["Only use a sturdy, closed door that opens away from you; secure the towel safely.", "Lean back gently and row toward the door without jerking."], ["Using a weak handle or loose door", "Leaning back too far"], "Skip this if the door or anchor is not completely secure."),
  exercise("Dead hang", "Pull", "Grip, shoulders", "Beginner", ["Use a securely mounted bar and step into a comfortable hang.", "Breathe calmly and step down before your grip fails."], ["Holding through sharp pain", "Starting with an overly long hold"], "Begin with short holds and a safe way to get down."),
  exercise("Negative pull-up", "Pull", "Back, biceps, grip", "Intermediate", ["Step or jump to a supported position with chin above a secure bar.", "Lower as slowly as you can, then step down rather than jumping repeatedly."], ["Dropping quickly", "Repeated uncontrolled jumps"], "Use a stable step and keep each descent comfortable."),
  exercise("Bodyweight squat", "Legs", "Quads, glutes", "Beginner", ["Stand about shoulder-width with feet turned slightly out.", "Sit hips down and back, then push through the whole foot to stand."], ["Heels lifting", "Knees collapsing inward"], "Use a depth you can control with a steady torso."),
  exercise("Reverse lunge", "Legs", "Quads, glutes", "Beginner", ["Stand tall and step one foot back.", "Lower both knees comfortably, then push through the front foot to return."], ["Narrow, wobbly stance", "Slamming the back knee down"], "Hold a wall lightly if balance is new."),
  exercise("Split squat", "Legs", "Quads, glutes", "Beginner", ["Stand in a comfortable staggered stance.", "Lower straight down under control and press through the front foot."], ["Front heel lifting", "Taking an unstable stance"], "Use a wall for balance and shorten the range if needed."),
  exercise("Step-up", "Legs", "Quads, glutes", "Beginner", ["Choose a low, stable step that cannot slide.", "Place the whole foot on it, stand up smoothly, then step down carefully."], ["Using a wobbly or high surface", "Pushing off hard from the trailing foot"], "Start low and keep the movement quiet."),
  exercise("Glute bridge", "Legs", "Glutes, hamstrings", "Beginner", ["Lie on your back with knees bent and feet flat.", "Press through your feet to lift hips, pause, and lower slowly."], ["Overarching the lower back", "Pushing mostly through the toes"], "Finish by squeezing glutes, not by arching your back."),
  exercise("Single-leg glute bridge", "Legs", "Glutes, hamstrings", "Intermediate", ["Lie with one foot planted and the other leg lifted comfortably.", "Raise hips evenly, then lower without twisting."], ["Letting the pelvis rotate", "Forcing a high range"], "Return to two feet if your hips rock."),
  exercise("Calf raise", "Legs", "Calves, ankles", "Beginner", ["Stand near a wall for balance with feet hip-width apart.", "Rise onto the balls of your feet, pause, and lower slowly."], ["Bouncing quickly", "Rolling ankles outward"], "Use a steady, comfortable range."),
  exercise("Plank", "Core", "Abdominals, shoulders, glutes", "Beginner", ["Place forearms on the floor with elbows under shoulders.", "Step back and hold a straight line while breathing normally."], ["Hips sagging or piking up", "Holding your breath"], "Stop the set when you can no longer keep a straight line."),
  exercise("Side plank", "Core", "Obliques, shoulders, hips", "Beginner", ["Lie on one side with elbow under shoulder and knees bent if needed.", "Lift hips and hold without rolling forward or backward."], ["Shoulder sinking toward ear", "Forcing a long hold"], "Start from your knees and keep breathing."),
  exercise("Dead bug", "Core", "Abdominals, hip flexors", "Beginner", ["Lie on your back with arms up and knees bent over hips.", "Slowly reach opposite arm and leg away, then return and switch."], ["Lower back arching away from the floor", "Moving too quickly"], "Shorten the reach to keep your back gently settled."),
  exercise("Bird dog", "Core", "Core, back, glutes", "Beginner", ["Start on hands and knees with a steady, neutral back.", "Reach opposite arm and leg long, pause, and return without shifting."], ["Twisting the torso", "Lifting the leg too high"], "Imagine balancing a cup on your lower back."),
  exercise("Hollow hold", "Core", "Abdominals", "Intermediate", ["Lie on your back and gently flatten your lower back.", "Lift shoulders and legs only as far as you can keep that contact."], ["Back arching off the floor", "Starting with a difficult lever"], "Bend knees or keep arms by your sides to make it easier."),
  exercise("Hanging knee raise", "Core", "Abdominals, hip flexors, grip", "Intermediate", ["Hang from a secure bar with shoulders comfortable.", "Lift knees toward your chest without swinging, then lower slowly."], ["Kipping or swinging", "Shrugging through the shoulders"], "Use a captain's chair or lying knee tuck if hanging is not comfortable."),
  exercise("Handstand practice", "Skills", "Shoulders, core, wrists", "Intermediate", ["Begin with a comfortable pike position or a supported wall hold near a clear space.", "Practise brief, controlled balance drills and come down before tiring."], ["Kicking up near clutter", "Holding your breath"], "Use a spotter or a qualified coach if new to inversions."),
  exercise("Wall handstand hold", "Skills", "Shoulders, core, wrists", "Intermediate", ["Start with hands on the floor near a clear wall and walk feet up only as far as comfortable.", "Press through the floor, breathe, and come down under control."], ["Practising near clutter", "Holding your breath"], "Use a spotter or a qualified coach if new to inversions."),
  exercise("Wall handstand shoulder tap", "Skills", "Shoulders, core", "Advanced", ["Face the wall in a secure handstand position with a clear landing area.", "Shift weight gently and lift one hand briefly, then switch."], ["Rushing weight shifts", "Training while fatigued"], "Master a comfortable wall hold before trying taps."),
  exercise("Tuck L-sit", "Skills", "Core, triceps, hip flexors", "Intermediate", ["Support yourself between stable parallettes or on sturdy blocks.", "Press down and lift bent knees briefly while keeping shoulders active."], ["Using unstable furniture", "Shrugging shoulders"], "Start with feet assisting on the floor."),
  exercise("Muscle-up transition drill", "Skills", "Back, chest, triceps, core", "Advanced", ["Practise a low-bar transition with feet supported and a coach nearby if possible.", "Move slowly from a pull to a press without forcing the shoulder."], ["Attempting high, uncontrolled jumps", "Training through shoulder pain"], "Build strong pull-ups and dips first; use safe equipment."),
  exercise("Tuck front lever hold", "Skills", "Back, core, shoulders", "Advanced", ["Use a secure bar and begin from a controlled hang.", "Tuck knees and lean back slightly, keeping arms straight and shoulders active."], ["Trying a full lever too soon", "Swinging into position"], "Work on short, assisted holds and dismount carefully."),
  exercise("Planche lean", "Skills", "Shoulders, wrists, core", "Advanced", ["Start in a sturdy high plank with fingers turned only as comfortable.", "Lean shoulders slightly ahead of wrists while keeping elbows straight, then return."], ["Leaning too far too soon", "Ignoring wrist discomfort"], "Use a small lean, warm up wrists, and stop if pain appears."),
];

export const PROGRESSIONS = [
  {
    name: "Push-up strength",
    steps: [
      { exercise: "Wall push-up", unlock: "3 × 12 smooth reps" },
      { exercise: "Incline push-up", unlock: "3 × 10 with a steady body" },
      { exercise: "Knee push-up", unlock: "3 × 10 full controlled reps" },
      { exercise: "Push-up", unlock: "3 × 10 clean floor reps" },
      { exercise: "Diamond push-up", unlock: "3 × 8 without wrist discomfort" },
      { exercise: "Archer push-up", unlock: "3 × 6 per side, controlled" },
    ],
  },
  {
    name: "Pull-up strength",
    steps: [
      { exercise: "Dead hang", unlock: "3 × 20-second comfortable holds" },
      { exercise: "Scapular pull-up", unlock: "3 × 8 smooth reps" },
      { exercise: "Inverted row", unlock: "3 × 10 controlled reps" },
      { exercise: "Negative pull-up", unlock: "3 × 5 slow descents" },
      { exercise: "Pull-up", unlock: "3 × 5 clean reps" },
      { exercise: "Muscle-up transition drill", unlock: "Only after strong pull-ups and dips" },
    ],
  },
  {
    name: "Leg strength",
    steps: [
      { exercise: "Bodyweight squat", unlock: "3 × 12 steady reps" },
      { exercise: "Reverse lunge", unlock: "3 × 8 per side" },
      { exercise: "Split squat", unlock: "3 × 10 per side" },
      { exercise: "Step-up", unlock: "3 × 10 per side on a low step" },
      { exercise: "Single-leg glute bridge", unlock: "3 × 10 per side, hips level" },
    ],
  },
  {
    name: "Core control",
    steps: [
      { exercise: "Dead bug", unlock: "3 × 8 per side, back steady" },
      { exercise: "Bird dog", unlock: "3 × 8 per side without twisting" },
      { exercise: "Plank", unlock: "3 × 30-second holds with steady breathing" },
      { exercise: "Hollow hold", unlock: "3 × 20-second holds with back down" },
      { exercise: "Tuck L-sit", unlock: "3 × 10-second supported holds" },
    ],
  },
  {
    name: "Handstand basics",
    steps: [
      { exercise: "Pike push-up", unlock: "3 × 8 controlled reps" },
      { exercise: "Wall handstand hold", unlock: "3 × 20-second calm holds" },
      { exercise: "Wall handstand shoulder tap", unlock: "3 × 6 controlled taps per side" },
    ],
  },
  {
    name: "Front lever basics",
    steps: [
      { exercise: "Dead hang", unlock: "3 × 20-second comfortable holds" },
      { exercise: "Scapular pull-up", unlock: "3 × 8 controlled reps" },
      { exercise: "Tuck front lever hold", unlock: "3 × 10-second steady holds" },
    ],
  },
  {
    name: "Planche basics",
    steps: [
      { exercise: "Push-up", unlock: "3 × 12 clean reps" },
      { exercise: "Planche lean", unlock: "3 × 15-second easy leans" },
      { exercise: "Tuck L-sit", unlock: "3 × 10-second supported holds" },
    ],
  },
];
