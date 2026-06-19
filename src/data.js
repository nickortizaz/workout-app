// ════════════════════════════════════════════════════════════════
// PROGRAM DATA + HELPERS
// ════════════════════════════════════════════════════════════════

export const DEFAULT_PROGRAM = [
  {
    day: "MON", name: "PUSH", dayType: "Push",
    focus: "Upper Chest / Side Delts / Tricep Mass",
    tags: ["20 MIN CARDIO", "SAUNA"],
    exercises: [
      { name: "Incline DB Press", sets: 5, reps: "5–8", repLow: 5, repHigh: 8, heavy: true, muscles: ["Chest", "Shoulders"], rest: 150 },
      { name: "Machine Incline Press", sets: 4, reps: "8–12", repLow: 8, repHigh: 12, muscles: ["Chest"] },
      { name: "Low-to-High Cable Fly", sets: 3, reps: "12–15", repLow: 12, repHigh: 15, muscles: ["Chest"] },
      { name: "Flat Pec Deck", sets: 3, reps: "10–12", repLow: 10, repHigh: 12, muscles: ["Chest"] },
      { name: "Atlantis Shoulder Press", sets: 4, reps: "8–10", repLow: 8, repHigh: 10, heavy: true, muscles: ["Shoulders"] },
      { name: "DB Lateral Raise", sets: 4, reps: "15–20", repLow: 15, repHigh: 20, muscles: ["Shoulders"], rest: 60 },
      { name: "Lean-Away Cable Lateral Raise", sets: 3, reps: "12–15 ea", repLow: 12, repHigh: 15, muscles: ["Shoulders"] },
      { name: "Overhead Rope Tricep Ext", sets: 4, reps: "10–15", repLow: 10, repHigh: 15, muscles: ["Triceps"] },
      { name: "Dip Machine / Close-Grip", sets: 3, reps: "8–12", repLow: 8, repHigh: 12, muscles: ["Triceps"], rest: 90 },
    ],
  },
  {
    day: "TUE", name: "PULL", dayType: "Pull",
    focus: "Lat Width / Back Thickness / Traps / Biceps",
    tags: ["20 MIN CARDIO", "SAUNA"],
    exercises: [
      { name: "Wide-Grip Lat Pulldown", sets: 5, reps: "6–10", repLow: 6, repHigh: 10, heavy: true, muscles: ["Back"], rest: 120 },
      { name: "Chest-Supported Row (flared)", sets: 4, reps: "8–12", repLow: 8, repHigh: 12, muscles: ["Back"] },
      { name: "Single-Arm Cable Lat Pulldown", sets: 3, reps: "10–12 ea", repLow: 10, repHigh: 12, muscles: ["Back"] },
      { name: "Chest-Supported High Row", sets: 3, reps: "10–12", repLow: 10, repHigh: 12, muscles: ["Back"] },
      { name: "Machine Shrug / DB Shrug", sets: 4, reps: "8–12", repLow: 8, repHigh: 12, heavy: true, muscles: ["Traps"] },
      { name: "Reverse Pec Deck", sets: 4, reps: "12–20", repLow: 12, repHigh: 20, muscles: ["Rear Delts"] },
      { name: "DB Curl / EZ Bar Curl", sets: 3, reps: "8–12", repLow: 8, repHigh: 12, muscles: ["Biceps"] },
      { name: "Incline DB Curl", sets: 3, reps: "10–12", repLow: 10, repHigh: 12, muscles: ["Biceps"] },
      { name: "Hammer Curl", sets: 2, reps: "10–12", repLow: 10, repHigh: 12, muscles: ["Biceps"] },
    ],
  },
  {
    day: "WED", name: "RECOVERY", dayType: "Active Recovery",
    focus: "Active Recovery Only", recovery: true,
    tags: ["COLD PLUNGE"], exercises: [],
  },
  {
    day: "THU", name: "LEGS", dayType: "Legs",
    focus: "Posterior Chain / Quad Mass / Glutes",
    tags: ["20 MIN CARDIO", "SAUNA", "NO YOHIMBINE"],
    exercises: [
      { name: "Seated / Lying Leg Curl", sets: 4, reps: "10–15", repLow: 10, repHigh: 15, muscles: ["Hamstrings"] },
      { name: "Romanian Deadlift — DB/Smith", sets: 4, reps: "8–10", repLow: 8, repHigh: 10, muscles: ["Hamstrings", "Glutes"], rest: 150 },
      { name: "Belt Squat", sets: 5, reps: "6–10", repLow: 6, repHigh: 10, heavy: true, muscles: ["Legs"], rest: 180 },
      { name: "Bulgarian Split Squat", sets: 3, reps: "10–12 ea", repLow: 10, repHigh: 12, muscles: ["Legs", "Glutes"] },
      { name: "Leg Press — feet higher", sets: 4, reps: "10–15", repLow: 10, repHigh: 15, muscles: ["Legs", "Glutes"] },
      { name: "Hip Thrust / Glute Drive", sets: 4, reps: "8–12", repLow: 8, repHigh: 12, muscles: ["Glutes"] },
      { name: "Leg Extension", sets: 3, reps: "12–15", repLow: 12, repHigh: 15, muscles: ["Legs"] },
      { name: "Standing Calf Raise", sets: 4, reps: "10–15", repLow: 10, repHigh: 15, muscles: ["Calves"] },
    ],
  },
  {
    day: "FRI", name: "SHOULDERS + ARMS", dayType: "Upper",
    focus: "Full Delt Roundness / Arm Size / Thickness",
    tags: ["20 MIN CARDIO", "SAUNA"],
    exercises: [
      { name: "Machine OHP", sets: 5, reps: "5–8", repLow: 5, repHigh: 8, heavy: true, muscles: ["Shoulders"], rest: 150 },
      { name: "DB Lateral Raise", sets: 4, reps: "15–20", repLow: 15, repHigh: 20, muscles: ["Shoulders"], rest: 60 },
      { name: "Lean-Away Cable Lateral Raise", sets: 3, reps: "12–15 ea", repLow: 12, repHigh: 15, muscles: ["Shoulders"] },
      { name: "Reverse Pec Deck", sets: 3, reps: "15–20", repLow: 15, repHigh: 20, muscles: ["Rear Delts"] },
      { name: "Overhead Rope Tricep Ext", sets: 4, reps: "10–15", repLow: 10, repHigh: 15, muscles: ["Triceps"] },
      { name: "Rope Tricep Pushdown", sets: 3, reps: "12–15", repLow: 12, repHigh: 15, muscles: ["Triceps"] },
      { name: "Dip Machine", sets: 3, reps: "8–12", repLow: 8, repHigh: 12, muscles: ["Triceps"], rest: 90 },
      { name: "DB Curl / EZ Bar Curl", sets: 4, reps: "8–12", repLow: 8, repHigh: 12, muscles: ["Biceps"] },
      { name: "Incline DB Curl", sets: 3, reps: "10–12", repLow: 10, repHigh: 12, muscles: ["Biceps"] },
      { name: "Hammer Curl", sets: 3, reps: "10–12", repLow: 10, repHigh: 12, muscles: ["Biceps"] },
    ],
  },
  {
    day: "SAT", name: "UPPER VOLUME", dayType: "Upper",
    focus: "Lat Flare / Upper Chest / Traps / Rear Delts / Abs",
    tags: ["20 MIN CARDIO", "SAUNA"],
    exercises: [
      { name: "Wide-Grip Lat Pulldown", sets: 4, reps: "10–12", repLow: 10, repHigh: 12, muscles: ["Back"] },
      { name: "Single-Arm Machine / DB Row", sets: 3, reps: "10–12 ea", repLow: 10, repHigh: 12, muscles: ["Back"] },
      { name: "Incline DB Press", sets: 4, reps: "8–12", repLow: 8, repHigh: 12, muscles: ["Chest"] },
      { name: "Low-to-High Cable Fly", sets: 3, reps: "12–15", repLow: 12, repHigh: 15, muscles: ["Chest"] },
      { name: "Face Pull / Rear Delt Fly", sets: 4, reps: "15–20", repLow: 15, repHigh: 20, muscles: ["Rear Delts"] },
      { name: "Cable Lateral Raise", sets: 4, reps: "15–20 ea", repLow: 15, repHigh: 20, muscles: ["Shoulders"] },
      { name: "Machine Shrug", sets: 3, reps: "10–15", repLow: 10, repHigh: 15, muscles: ["Traps"] },
      { name: "Cable Crunch / Ab Wheel", sets: 4, reps: "12–15", repLow: 12, repHigh: 15, muscles: ["Abs"] },
      { name: "Hanging Knee / Rev Crunch", sets: 3, reps: "10–15", repLow: 10, repHigh: 15, muscles: ["Abs"], bodyweight: true, rest: 60 },
    ],
  },
  {
    day: "SUN", name: "RECOVERY", dayType: "Active Recovery",
    focus: "Full Reset", recovery: true,
    tags: ["COLD PLUNGE"], exercises: [],
  },
];

export const ENERGY_LABELS = { 5: "LOCKED IN", 4: "GOOD", 3: "SOLID", 2: "LOW", 1: "ROUGH" };
export const ENERGY_NOTION = { 5: "5 — Locked In", 4: "4 — Good", 3: "3 — Solid", 2: "2 — Low", 1: "1 — Rough" };
export const ENERGY_COLORS = { 1: "#e8192c", 2: "#ff6b2b", 3: "#f5c842", 4: "#4fc3f7", 5: "#4caf50" };
export const DAY_COLORS = { Push: "#e8192c", Pull: "#4fc3f7", Legs: "#4caf50", Upper: "#a855f7", "Active Recovery": "#555" };

export const getLS = (k) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } };
export const setLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export const calcVolume = (sets) => {
  let v = 0;
  Object.values(sets).forEach(es => es?.forEach(s => {
    if (s?.weight && s?.reps && !s?.warmup) v += parseFloat(s.weight) * parseFloat(s.reps);
  }));
  return Math.round(v);
};

// Epley 1RM estimate
export const est1RM = (weight, reps) => {
  const w = parseFloat(weight), r = parseFloat(reps);
  if (!w || !r) return 0;
  if (r === 1) return w;
  return Math.round(w * (1 + r / 30));
};


// Plate math — standard lbs plates, two sides of a 45lb bar by default
export const PLATES = [45, 35, 25, 10, 5, 2.5];
export const calcPlates = (target, barWeight = 45) => {
  const perSide = (parseFloat(target) - barWeight) / 2;
  if (isNaN(perSide) || perSide <= 0) return null;
  let remaining = perSide;
  const result = [];
  for (const p of PLATES) {
    let count = 0;
    while (remaining >= p - 0.01) { remaining -= p; count++; }
    if (count > 0) result.push({ plate: p, count });
  }
  return { perSide, plates: result, leftover: Math.round(remaining * 10) / 10 };
};

// Quick increment options
export const WEIGHT_INCREMENTS = [-10, -5, 5, 10];
export const REST_OPTIONS = [60, 90, 120, 150, 180];

export const fmtTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
export const fmtDate = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
export const haptic = (ms = 30) => { if (navigator.vibrate) navigator.vibrate(ms); };
