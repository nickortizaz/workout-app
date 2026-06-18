import { useState, useEffect, useCallback, useRef } from "react";

const DEFAULT_PROGRAM = [
  {
    day: "MON", name: "PUSH", dayType: "Push",
    focus: "Upper Chest / Side Delts / Tricep Mass",
    tags: ["20 MIN CARDIO", "SAUNA"],
    exercises: [
      { name: "Incline DB Press", sets: 5, reps: "5–8", heavy: true },
      { name: "Machine Incline Press", sets: 4, reps: "8–12" },
      { name: "Low-to-High Cable Fly", sets: 3, reps: "12–15" },
      { name: "Flat Pec Deck", sets: 3, reps: "10–12" },
      { name: "Atlantis Shoulder Press", sets: 4, reps: "8–10", heavy: true },
      { name: "DB Lateral Raise", sets: 4, reps: "15–20" },
      { name: "Lean-Away Cable Lateral Raise", sets: 3, reps: "12–15 ea" },
      { name: "Overhead Rope Tricep Ext", sets: 4, reps: "10–15" },
      { name: "Dip Machine / Close-Grip", sets: 3, reps: "8–12" },
    ],
  },
  {
    day: "TUE", name: "PULL", dayType: "Pull",
    focus: "Lat Width / Back Thickness / Traps / Biceps",
    tags: ["20 MIN CARDIO", "SAUNA"],
    exercises: [
      { name: "Wide-Grip Lat Pulldown", sets: 5, reps: "6–10", heavy: true },
      { name: "Chest-Supported Row (flared)", sets: 4, reps: "8–12" },
      { name: "Single-Arm Cable Lat Pulldown", sets: 3, reps: "10–12 ea" },
      { name: "Chest-Supported High Row", sets: 3, reps: "10–12" },
      { name: "Machine Shrug / DB Shrug", sets: 4, reps: "8–12", heavy: true },
      { name: "Reverse Pec Deck", sets: 4, reps: "12–20" },
      { name: "DB Curl / EZ Bar Curl", sets: 3, reps: "8–12" },
      { name: "Incline DB Curl", sets: 3, reps: "10–12" },
      { name: "Hammer Curl", sets: 2, reps: "10–12" },
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
      { name: "Seated / Lying Leg Curl", sets: 4, reps: "10–15" },
      { name: "Romanian Deadlift — DB/Smith", sets: 4, reps: "8–10" },
      { name: "Belt Squat", sets: 5, reps: "6–10", heavy: true },
      { name: "Bulgarian Split Squat", sets: 3, reps: "10–12 ea" },
      { name: "Leg Press — feet higher", sets: 4, reps: "10–15" },
      { name: "Hip Thrust / Glute Drive", sets: 4, reps: "8–12" },
      { name: "Leg Extension", sets: 3, reps: "12–15" },
      { name: "Standing Calf Raise", sets: 4, reps: "10–15" },
    ],
  },
  {
    day: "FRI", name: "SHOULDERS + ARMS", dayType: "Upper",
    focus: "Full Delt Roundness / Arm Size / Thickness",
    tags: ["20 MIN CARDIO", "SAUNA"],
    exercises: [
      { name: "Machine OHP", sets: 5, reps: "5–8", heavy: true },
      { name: "DB Lateral Raise", sets: 4, reps: "15–20" },
      { name: "Lean-Away Cable Lateral Raise", sets: 3, reps: "12–15 ea" },
      { name: "Reverse Pec Deck", sets: 3, reps: "15–20" },
      { name: "Overhead Rope Tricep Ext", sets: 4, reps: "10–15" },
      { name: "Rope Tricep Pushdown", sets: 3, reps: "12–15" },
      { name: "Dip Machine", sets: 3, reps: "8–12" },
      { name: "DB Curl / EZ Bar Curl", sets: 4, reps: "8–12" },
      { name: "Incline DB Curl", sets: 3, reps: "10–12" },
      { name: "Hammer Curl", sets: 3, reps: "10–12" },
    ],
  },
  {
    day: "SAT", name: "UPPER VOLUME", dayType: "Upper",
    focus: "Lat Flare / Upper Chest / Traps / Rear Delts / Abs",
    tags: ["20 MIN CARDIO", "SAUNA"],
    exercises: [
      { name: "Wide-Grip Lat Pulldown", sets: 4, reps: "10–12" },
      { name: "Single-Arm Machine / DB Row", sets: 3, reps: "10–12 ea" },
      { name: "Incline DB Press", sets: 4, reps: "8–12" },
      { name: "Low-to-High Cable Fly", sets: 3, reps: "12–15" },
      { name: "Face Pull / Rear Delt Fly", sets: 4, reps: "15–20" },
      { name: "Cable Lateral Raise", sets: 4, reps: "15–20 ea" },
      { name: "Machine Shrug", sets: 3, reps: "10–15" },
      { name: "Cable Crunch / Ab Wheel", sets: 4, reps: "12–15" },
      { name: "Hanging Knee / Rev Crunch", sets: 3, reps: "10–15" },
    ],
  },
  {
    day: "SUN", name: "RECOVERY", dayType: "Active Recovery",
    focus: "Full Reset", recovery: true,
    tags: ["COLD PLUNGE"], exercises: [],
  },
];

const ENERGY_LABELS = { 5: "LOCKED IN", 4: "GOOD", 3: "SOLID", 2: "LOW", 1: "ROUGH" };
const ENERGY_NOTION = { 5: "5 — Locked In", 4: "4 — Good", 3: "3 — Solid", 2: "2 — Low", 1: "1 — Rough" };
const ENERGY_COLORS = { 1: "#e8192c", 2: "#ff6b2b", 3: "#f5c842", 4: "#4fc3f7", 5: "#4caf50" };
const DAY_COLORS = { Push: "#e8192c", Pull: "#4fc3f7", Legs: "#4caf50", Upper: "#a855f7", "Active Recovery": "#555" };

const today = new Date().toISOString().split("T")[0];
const DOW_MAP = [6, 0, 1, 2, 3, 4, 5];

const getLS = (k) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } };
const setLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const calcVolume = (sets) => {
  let v = 0;
  Object.values(sets).forEach(es => es?.forEach(s => { if (s?.weight && s?.reps) v += parseFloat(s.weight) * parseFloat(s.reps); }));
  return Math.round(v);
};

export default function App() {
  const [tab, setTab] = useState("train");
  const [program, setProgram] = useState(() => getLS("custom_program") || DEFAULT_PROGRAM);
  const [selectedDay, setSelectedDay] = useState(DOW_MAP[todayDow()]);
  const [sets, setSets] = useState({});
  const [energy, setEnergy] = useState(0);
  const [bodyweight, setBodyweight] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [history, setHistory] = useState([]);
  const [expandedHistory, setExpandedHistory] = useState(null);
  const [lastSession, setLastSession] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [editProgram, setEditProgram] = useState(null);
  const [savePrompt, setSavePrompt] = useState(false);
  const [detailExercise, setDetailExercise] = useState(null);
  const [restTimer, setRestTimer] = useState(null);
  const [restSeconds, setRestSeconds] = useState(0);
  const [swapTarget, setSwapTarget] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const saveTimer = useRef(null);
  const restRef = useRef(null);

  function todayDow() { return new Date().getDay(); }
  const storageKey = `pr_workout:${selectedDay}:${today}`;
  const workout = editMode && editProgram ? editProgram[selectedDay] : program[selectedDay];

  useEffect(() => {
    const h = getLS("session_history") || [];
    setHistory(h.sort((a, b) => new Date(b.date) - new Date(a.date)));
  }, []);

  useEffect(() => {
    setSaveStatus(null); setSaveError(null);
    const saved = getLS(storageKey);
    if (saved) { setSets(saved.sets || {}); setEnergy(saved.energy || 0); setBodyweight(saved.bodyweight || ""); setNotes(saved.notes || ""); }
    else { setSets({}); setEnergy(0); setBodyweight(""); setNotes(""); }
    const last = getLS(`last_session:${selectedDay}`);
    setLastSession(last?.sets || {});
  }, [selectedDay, storageKey]);

  // Rest timer countdown
  useEffect(() => {
    if (restTimer === null) return;
    restRef.current = setInterval(() => {
      setRestSeconds(s => {
        if (s <= 1) { clearInterval(restRef.current); setRestTimer(null); if (navigator.vibrate) navigator.vibrate(200); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(restRef.current);
  }, [restTimer]);

  const persist = useCallback((s, e, bw, n) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setLS(storageKey, { sets: s, energy: e, bodyweight: bw, notes: n }), 400);
  }, [storageKey]);

  const updateSet = (exName, setIdx, field, val) => {
    setSets(prev => {
      const es = [...(prev[exName] || [])];
      if (!es[setIdx]) es[setIdx] = { weight: "", reps: "" };
      es[setIdx] = { ...es[setIdx], [field]: val };
      const next = { ...prev, [exName]: es };
      persist(next, energy, bodyweight, notes);
      return next;
    });
  };

  const startRest = (seconds) => { setRestSeconds(seconds); setRestTimer(Date.now()); };

  const handleEnergy = (v) => { setEnergy(v); persist(sets, v, bodyweight, notes); };
  const handleBW = (v) => { setBodyweight(v); persist(sets, energy, v, notes); };
  const handleNotes = (v) => { setNotes(v); persist(sets, energy, bodyweight, v); };

  const completedSets = Object.values(sets).flat().filter(s => s && (s.weight || s.reps)).length;
  const totalSets = workout.exercises.reduce((a, e) => a + e.sets, 0);
  const progress = totalSets ? Math.round((completedSets / totalSets) * 100) : 0;

  const getLastForExercise = (exName) => {
    const es = lastSession[exName];
    if (!es?.length) return null;
    const filled = es.filter(s => s?.weight && s?.reps);
    if (!filled.length) return null;
    const best = filled.reduce((b, s) => parseFloat(s.weight) > parseFloat(b.weight) ? s : b, filled[0]);
    return `${best.weight} × ${best.reps}`;
  };

  // PR + volume trend across all history for an exercise
  const getExerciseStats = (exName) => {
    let pr = null, prDate = null;
    const volumes = [];
    [...history].reverse().forEach(sess => {
      const es = sess.sets?.[exName];
      if (!es) return;
      let sessVol = 0, sessMax = 0;
      es.forEach(s => {
        if (s?.weight && s?.reps) {
          const w = parseFloat(s.weight);
          sessVol += w * parseFloat(s.reps);
          if (w > sessMax) sessMax = w;
        }
      });
      if (sessVol > 0) volumes.push({ date: sess.date, vol: sessVol });
      if (sessMax > (pr ? parseFloat(pr) : 0)) { pr = String(sessMax); prDate = sess.date; }
    });
    return { pr, prDate, volumes };
  };

  // ── EDIT MODE ACTIONS ──
  const enterEdit = () => { setEditProgram(JSON.parse(JSON.stringify(program))); setEditMode(true); };
  const cancelEdit = () => { setEditMode(false); setEditProgram(null); };
  const commitEdit = (permanent) => {
    if (permanent) { setProgram(editProgram); setLS("custom_program", editProgram); }
    else { setProgram(editProgram); } // session-only: apply but don't persist to LS
    setEditMode(false); setSavePrompt(false); setEditProgram(null);
  };
  const editExercise = (idx, field, val) => {
    setEditProgram(p => { const np = JSON.parse(JSON.stringify(p)); np[selectedDay].exercises[idx][field] = field === "sets" ? parseInt(val) || 1 : val; return np; });
  };
  const deleteExercise = (idx) => { setEditProgram(p => { const np = JSON.parse(JSON.stringify(p)); np[selectedDay].exercises.splice(idx, 1); return np; }); };
  const addExercise = () => { setEditProgram(p => { const np = JSON.parse(JSON.stringify(p)); np[selectedDay].exercises.push({ name: "New Exercise", sets: 3, reps: "8–12" }); return np; }); };
  const moveExercise = (from, to) => {
    if (to < 0 || to >= editProgram[selectedDay].exercises.length) return;
    setEditProgram(p => { const np = JSON.parse(JSON.stringify(p)); const [m] = np[selectedDay].exercises.splice(from, 1); np[selectedDay].exercises.splice(to, 0, m); return np; });
  };

  async function saveToNotion() {
    setSaving(true); setSaveStatus(null); setSaveError(null);
    const dateLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const sessionName = `${workout.name} — ${dateLabel}`;
    let exerciseText = "";
    workout.exercises.forEach(ex => {
      const es = sets[ex.name] || [];
      const filled = es.filter(s => s && (s.weight || s.reps));
      if (!filled.length) return;
      exerciseText += `${ex.name}: ` + filled.map((s, i) => `Set ${i+1}: ${s.weight||"—"} × ${s.reps||"—"}`).join(" | ") + "\n";
    });
    try {
      const res = await fetch("/api/save-workout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionName, dayType: workout.dayType, date: today, energy: energy ? ENERGY_NOTION[energy] : null, bodyweight: bodyweight || null, notes: notes || null, exerciseText }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveStatus("success");
        const volume = calcVolume(sets);
        const entry = { date: today, dayIndex: selectedDay, dayType: workout.dayType, name: workout.name, sessionName, energy, bodyweight, notes, sets, volume };
        setLS(`last_session:${selectedDay}`, entry);
        setLastSession(sets);
        const h = getLS("session_history") || [];
        const updated = [entry, ...h.filter(x => !(x.date === today && x.dayIndex === selectedDay))].slice(0, 200);
        setLS("session_history", updated);
        setHistory(updated.sort((a, b) => new Date(b.date) - new Date(a.date)));
      } else { setSaveStatus("error"); setSaveError(data.error || `Error ${res.status}`); }
    } catch (err) { setSaveStatus("error"); setSaveError(err.message || "Network error"); }
    setSaving(false);
  }

  const fmtTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  const fmtDate = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

  // ════════════════════════════ STYLES ════════════════════════════
  const S = {
    root: { background: "#080808", minHeight: "100dvh", fontFamily: "'Inter',system-ui,sans-serif", color: "#fff", maxWidth: 480, margin: "0 auto", paddingBottom: 150 },
    chip: (a) => ({ flexShrink: 0, padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", border: "1px solid", background: a ? "#e8192c" : "transparent", borderColor: a ? "#e8192c" : "#444", color: a ? "#fff" : "#bbb", transition: "all .15s" }),
    input: (filled) => ({ width: "100%", background: filled ? "#1e1e1e" : "#161616", border: `1px solid ${filled ? "#666" : "#333"}`, borderRadius: 8, padding: "11px 4px", color: "#fff", fontSize: 17, fontWeight: 700, outline: "none", textAlign: "center", fontFamily: "inherit", boxSizing: "border-box" }),
  };

  // ════════════════════════════ EXERCISE DETAIL MODAL ════════════════════════════
  const ExerciseDetail = () => {
    if (!detailExercise) return null;
    const stats = getExerciseStats(detailExercise);
    const maxVol = Math.max(...stats.volumes.map(v => v.vol), 1);
    return (
      <div onClick={() => setDetailExercise(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div onClick={e => e.stopPropagation()} style={{ background: "#0e0e0e", width: "100%", maxWidth: 480, borderRadius: "20px 20px 0 0", border: "1px solid #222", borderBottom: "none", padding: "20px 18px 32px", maxHeight: "80vh", overflowY: "auto" }}>
          <div style={{ width: 40, height: 4, background: "#333", borderRadius: 2, margin: "0 auto 18px" }} />
          <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>{detailExercise}</div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 20 }}>Progression & records</div>

          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <div style={{ flex: 1, background: "#141414", borderRadius: 10, padding: 14, border: "1px solid #2a2a2a" }}>
              <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.08em", fontWeight: 700 }}>PERSONAL RECORD</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#f5c842", marginTop: 4 }}>{stats.pr ? `${stats.pr}` : "—"}<span style={{ fontSize: 13, color: "#666", fontWeight: 600 }}>{stats.pr ? " lbs" : ""}</span></div>
              {stats.prDate && <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{fmtDate(stats.prDate)}</div>}
            </div>
            <div style={{ flex: 1, background: "#141414", borderRadius: 10, padding: 14, border: "1px solid #2a2a2a" }}>
              <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.08em", fontWeight: 700 }}>SESSIONS</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", marginTop: 4 }}>{stats.volumes.length}</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>logged</div>
            </div>
          </div>

          <div style={{ fontSize: 11, color: "#888", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 12 }}>VOLUME TREND</div>
          {stats.volumes.length === 0 ? (
            <div style={{ fontSize: 13, color: "#555", padding: "20px 0", textAlign: "center" }}>No history yet. Log this exercise to track progress.</div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120, marginBottom: 8 }}>
              {stats.volumes.slice(-12).map((v, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: "100%", height: `${(v.vol / maxVol) * 100}%`, minHeight: 4, background: i === stats.volumes.slice(-12).length - 1 ? "#e8192c" : "#444", borderRadius: 3, transition: "height .3s" }} />
                  <div style={{ fontSize: 8, color: "#555", transform: "rotate(-45deg)", whiteSpace: "nowrap", marginTop: 4 }}>{fmtDate(v.date)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ════════════════════════════ SAVE PROMPT MODAL ════════════════════════════
  const SavePrompt = () => savePrompt && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#0e0e0e", borderRadius: 16, border: "1px solid #2a2a2a", padding: 24, maxWidth: 360, width: "100%" }}>
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Save changes</div>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 20, lineHeight: 1.5 }}>Keep these edits to {workout.name} permanently, or just for today's session?</div>
        <button onClick={() => commitEdit(true)} style={{ width: "100%", background: "#e8192c", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 800, padding: "14px 0", cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>SAVE PERMANENTLY</button>
        <button onClick={() => commitEdit(false)} style={{ width: "100%", background: "#1a1a1a", border: "1px solid #333", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 800, padding: "14px 0", cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>JUST FOR TODAY</button>
        <button onClick={() => setSavePrompt(false)} style={{ width: "100%", background: "transparent", border: "none", color: "#666", fontSize: 13, fontWeight: 700, padding: "8px 0", cursor: "pointer", fontFamily: "inherit" }}>Keep editing</button>
      </div>
    </div>
  );

  // ════════════════════════════ SWAP MODAL ════════════════════════════
  const SwapModal = () => {
    if (swapTarget === null) return null;
    const allExercises = [...new Set(DEFAULT_PROGRAM.flatMap(d => d.exercises.map(e => e.name)))].sort();
    return (
      <div onClick={() => setSwapTarget(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 105, display: "flex", alignItems: "flex-end" }}>
        <div onClick={e => e.stopPropagation()} style={{ background: "#0e0e0e", width: "100%", maxWidth: 480, margin: "0 auto", borderRadius: "20px 20px 0 0", border: "1px solid #222", padding: "20px 18px 32px", maxHeight: "70vh", overflowY: "auto" }}>
          <div style={{ width: 40, height: 4, background: "#333", borderRadius: 2, margin: "0 auto 18px" }} />
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Swap exercise</div>
          {allExercises.map(name => (
            <button key={name} onClick={() => { editExercise(swapTarget, "name", name); setSwapTarget(null); }} style={{ display: "block", width: "100%", textAlign: "left", background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, padding: "13px 14px", cursor: "pointer", fontFamily: "inherit", marginBottom: 8 }}>{name}</button>
          ))}
        </div>
      </div>
    );
  };

  // ════════════════════════════ REST TIMER BAR ════════════════════════════
  const RestBar = () => restTimer !== null && (
    <div style={{ position: "fixed", bottom: 132, left: 0, right: 0, maxWidth: 480, margin: "0 auto", padding: "0 16px", zIndex: 90 }}>
      <div style={{ background: "#e8192c", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 8px 24px rgba(232,25,44,0.4)" }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "#fff" }}>REST</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{fmtTime(restSeconds)}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setRestSeconds(s => s + 30)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 800, padding: "6px 10px", cursor: "pointer", fontFamily: "inherit" }}>+30</button>
          <button onClick={() => { setRestTimer(null); setRestSeconds(0); }} style={{ background: "rgba(0,0,0,0.3)", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 800, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit" }}>SKIP</button>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════ TAB BAR ════════════════════════════
  const TabBar = () => (
    <div style={{ display: "flex", borderTop: "1px solid #1a1a1a", background: "#080808" }}>
      {["train", "history"].map(t => (
        <button key={t} onClick={() => { setTab(t); if (editMode) cancelEdit(); }} style={{ flex: 1, padding: "12px 0 18px", background: "transparent", border: "none", color: tab === t ? "#e8192c" : "#555", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", cursor: "pointer", fontFamily: "inherit" }}>{t.toUpperCase()}</button>
      ))}
    </div>
  );

  // ════════════════════════════ HISTORY TAB ════════════════════════════
  const HistoryView = () => {
    const grouped = {};
    history.forEach(s => {
      const label = new Date(s.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
      (grouped[label] = grouped[label] || []).push(s);
    });
    return (
      <>
        <div style={{ padding: "24px 16px 0" }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>HISTORY</h1>
          <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>{history.length} sessions logged</div>
        </div>
        {history.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "50vh", gap: 12 }}>
            <div style={{ fontSize: 40 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>No sessions yet</div>
            <div style={{ fontSize: 13, color: "#555", textAlign: "center", maxWidth: 240 }}>Save your first workout to start building history.</div>
          </div>
        ) : (
          <div style={{ padding: "16px 16px 0" }}>
            {Object.entries(grouped).map(([date, sessions]) => (
              <div key={date} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#555", letterSpacing: "0.1em", marginBottom: 10 }}>{date.toUpperCase()}</div>
                {sessions.map((s, idx) => {
                  const key = `${s.date}-${s.dayIndex}`;
                  const exp = expandedHistory === key;
                  const color = DAY_COLORS[s.dayType] || "#555";
                  return (
                    <div key={idx} style={{ background: "#111", borderRadius: 12, marginBottom: 10, border: "1px solid #222", borderLeft: `4px solid ${color}`, overflow: "hidden" }}>
                      <div onClick={() => setExpandedHistory(exp ? null : key)} style={{ padding: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800 }}>{s.name}</div>
                          <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>{s.volume ? `${s.volume.toLocaleString()} lbs volume` : "Recovery"}{s.bodyweight ? ` · ${s.bodyweight} BW` : ""}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {s.energy > 0 && <div style={{ width: 28, height: 28, borderRadius: 6, background: ENERGY_COLORS[s.energy], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>{s.energy}</div>}
                          <div style={{ color: "#555" }}>{exp ? "▲" : "▼"}</div>
                        </div>
                      </div>
                      {exp && s.sets && (
                        <div style={{ borderTop: "1px solid #1a1a1a", padding: 14 }}>
                          {Object.entries(s.sets).map(([n, es]) => {
                            const filled = (es || []).filter(st => st && (st.weight || st.reps));
                            if (!filled.length) return null;
                            return (
                              <div key={n} style={{ marginBottom: 10 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "#bbb", marginBottom: 4 }}>{n}</div>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                  {filled.map((st, i) => <div key={i} style={{ background: "#1a1a1a", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>{st.weight||"—"} × {st.reps||"—"}</div>)}
                                </div>
                              </div>
                            );
                          })}
                          {s.notes && <div style={{ fontSize: 12, color: "#666", marginTop: 8, fontStyle: "italic" }}>{s.notes}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  // ════════════════════════════ MAIN RENDER ════════════════════════════
  if (tab === "history") {
    return (
      <div style={S.root}>
        <HistoryView />
        <ExerciseDetail />
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto" }}><TabBar /></div>
      </div>
    );
  }

  return (
    <div style={S.root}>
      {/* Day Bar */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "20px 16px 0", scrollbarWidth: "none" }}>
        {program.map((w, i) => (
          <button key={i} onClick={() => !editMode && setSelectedDay(i)} style={S.chip(i === selectedDay)}>{w.day}</button>
        ))}
      </div>

      {/* Header */}
      <div style={{ padding: "20px 16px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}>{workout.name}</h1>
          <div style={{ fontSize: 13, color: "#aaa", marginTop: 6 }}>{workout.focus}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {workout.tags?.map(t => <span key={t} style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", padding: "4px 10px", borderRadius: 4, border: `1px solid ${t === "NO YOHIMBINE" ? "#e8192c" : "#555"}`, color: t === "NO YOHIMBINE" ? "#e8192c" : "#ccc" }}>{t}</span>)}
          </div>
        </div>
        {!workout.recovery && (
          editMode
            ? <button onClick={() => setSavePrompt(true)} style={{ background: "#4caf50", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 800, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.05em" }}>DONE</button>
            : <button onClick={enterEdit} style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, color: "#bbb", fontSize: 12, fontWeight: 800, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.05em" }}>EDIT</button>
        )}
      </div>

      {editMode && <div style={{ padding: "12px 16px 0" }}><div style={{ background: "#1a1505", border: "1px solid #4a3a0a", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#f5c842", fontWeight: 600 }}>Editing mode — rename, reorder, swap, add or remove exercises. Tap DONE to save.</div></div>}

      {!workout.recovery && !editMode && (
        <>
          <div style={{ margin: "18px 16px 0", height: 3, background: "#2a2a2a", borderRadius: 2 }}><div style={{ height: "100%", background: "#e8192c", borderRadius: 2, transition: "width .3s", width: `${progress}%` }} /></div>
          <div style={{ fontSize: 12, color: "#aaa", padding: "6px 16px 0", fontWeight: 600, letterSpacing: "0.06em" }}>{completedSets} / {totalSets} SETS — {progress}%</div>

          <div style={{ display: "flex", gap: 10, padding: "14px 16px 0" }}>
            <div style={{ flex: 1, background: "#141414", borderRadius: 10, padding: 14, border: "1px solid #333" }}>
              <div style={{ fontSize: 10, color: "#aaa", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 8 }}>BODYWEIGHT</div>
              <input type="text" inputMode="decimal" placeholder="—" value={bodyweight} onChange={e => handleBW(e.target.value)} style={{ background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 26, fontWeight: 800, width: "100%", fontFamily: "inherit" }} />
              <div style={{ fontSize: 11, color: "#888", marginTop: 2, fontWeight: 600 }}>LBS</div>
            </div>
            <div style={{ flex: 1, background: "#141414", borderRadius: 10, padding: 14, border: "1px solid #333" }}>
              <div style={{ fontSize: 10, color: "#aaa", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 8 }}>ENERGY</div>
              <div style={{ display: "flex", gap: 5 }}>
                {[1,2,3,4,5].map(v => <button key={v} onClick={() => handleEnergy(v)} style={{ flex: 1, height: 32, borderRadius: 6, cursor: "pointer", border: "1px solid", background: energy === v ? ENERGY_COLORS[v] : "transparent", borderColor: energy === v ? ENERGY_COLORS[v] : "#444", color: energy === v ? "#fff" : "#bbb", fontSize: 12, fontWeight: 800 }}>{v}</button>)}
              </div>
              {energy > 0 && <div style={{ fontSize: 11, color: ENERGY_COLORS[energy], marginTop: 7, fontWeight: 700, letterSpacing: "0.06em" }}>{ENERGY_LABELS[energy]}</div>}
            </div>
          </div>
        </>
      )}

      {/* ─── EXERCISES ─── */}
      {!workout.recovery && (
        <div style={{ padding: "14px 16px 0" }}>
          {workout.exercises.map((ex, idx) => {
            if (editMode) {
              return (
                <div key={idx} style={{ background: "#111", borderRadius: 10, marginBottom: 10, border: "1px solid #333", padding: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <button onClick={() => moveExercise(idx, idx-1)} style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 4, color: "#999", fontSize: 10, padding: "2px 7px", cursor: "pointer" }}>▲</button>
                      <button onClick={() => moveExercise(idx, idx+1)} style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 4, color: "#999", fontSize: 10, padding: "2px 7px", cursor: "pointer" }}>▼</button>
                    </div>
                    <input value={ex.name} onChange={e => editExercise(idx, "name", e.target.value)} style={{ flex: 1, background: "#161616", border: "1px solid #333", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, padding: "10px 12px", outline: "none", fontFamily: "inherit" }} />
                    <button onClick={() => deleteExercise(idx)} style={{ background: "#2a0a0a", border: "1px solid #5a1a1a", borderRadius: 8, color: "#e8192c", fontSize: 16, fontWeight: 800, padding: "8px 12px", cursor: "pointer" }}>✕</button>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#161616", borderRadius: 8, padding: "6px 10px", border: "1px solid #2a2a2a" }}>
                      <span style={{ fontSize: 11, color: "#888", fontWeight: 700 }}>SETS</span>
                      <button onClick={() => editExercise(idx, "sets", ex.sets - 1)} style={{ background: "#222", border: "none", borderRadius: 4, color: "#fff", width: 24, height: 24, fontSize: 16, cursor: "pointer" }}>−</button>
                      <span style={{ fontSize: 15, fontWeight: 800, minWidth: 18, textAlign: "center" }}>{ex.sets}</span>
                      <button onClick={() => editExercise(idx, "sets", ex.sets + 1)} style={{ background: "#222", border: "none", borderRadius: 4, color: "#fff", width: 24, height: 24, fontSize: 16, cursor: "pointer" }}>+</button>
                    </div>
                    <input value={ex.reps} onChange={e => editExercise(idx, "reps", e.target.value)} placeholder="reps" style={{ flex: 1, background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, padding: "9px 12px", outline: "none", fontFamily: "inherit" }} />
                    <button onClick={() => setSwapTarget(idx)} style={{ background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8, color: "#4fc3f7", fontSize: 11, fontWeight: 800, padding: "9px 12px", cursor: "pointer", fontFamily: "inherit" }}>SWAP</button>
                  </div>
                </div>
              );
            }
            // NORMAL MODE
            const es = sets[ex.name] || [];
            const filled = es.filter(s => s && (s.weight || s.reps)).length;
            const done = filled >= ex.sets;
            const started = filled > 0 && !done;
            const lastBest = getLastForExercise(ex.name);
            return (
              <div key={idx} style={{ background: "#111", borderRadius: 10, marginBottom: 10, border: "1px solid #333", borderLeft: `4px solid ${done ? "#4caf50" : started ? "#e8192c" : "#333"}`, overflow: "hidden" }}>
                <div onClick={() => setDetailExercise(ex.name)} style={{ padding: "12px 14px 8px", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 800 }}>{ex.name}</span>
                    {ex.heavy && <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.1em", color: "#e8192c", border: "1px solid #e8192c", borderRadius: 4, padding: "2px 7px" }}>HEAVY</span>}
                    <span style={{ fontSize: 11, color: "#4fc3f7", marginLeft: "auto", fontWeight: 700 }}>STATS ›</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#bbb", marginTop: 3, fontWeight: 600 }}>
                    {ex.sets} sets · {ex.reps} reps · <span style={{ color: done ? "#4caf50" : "#fff" }}>{filled}/{ex.sets}</span>
                    {lastBest && <span style={{ color: "#666", marginLeft: 8 }}>· Last {lastBest}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 10px 6px" }}>
                  <div style={{ width: 20, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 10, color: "#888", textAlign: "center", fontWeight: 800, letterSpacing: "0.08em" }}>WEIGHT (LBS)</div>
                  <div style={{ width: 18, flexShrink: 0, textAlign: "center", color: "#888", fontSize: 13, fontWeight: 700 }}>×</div>
                  <div style={{ flex: 1, fontSize: 10, color: "#888", textAlign: "center", fontWeight: 800, letterSpacing: "0.08em" }}>REPS</div>
                  <div style={{ width: 34, flexShrink: 0 }} />
                </div>
                <div style={{ padding: "0 10px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
                  {Array.from({ length: ex.sets }).map((_, si) => {
                    const set = es[si] || { weight: "", reps: "" };
                    const lastSet = lastSession[ex.name]?.[si];
                    const setDone = set.weight && set.reps;
                    return (
                      <div key={si} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 20, flexShrink: 0, fontSize: 12, color: setDone ? "#4caf50" : "#999", fontWeight: 800, textAlign: "center" }}>{setDone ? "✓" : si + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <input type="text" inputMode="decimal" placeholder={lastSet?.weight || "—"} value={set.weight || ""} onChange={e => updateSet(ex.name, si, "weight", e.target.value)} style={S.input(set.weight)} />
                        </div>
                        <div style={{ width: 18, flexShrink: 0, textAlign: "center", color: "#fff", fontSize: 16, fontWeight: 700 }}>×</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <input type="text" inputMode="numeric" placeholder={lastSet?.reps || "—"} value={set.reps || ""} onChange={e => updateSet(ex.name, si, "reps", e.target.value)} style={S.input(set.reps)} />
                        </div>
                        <button onClick={() => startRest(90)} style={{ width: 34, flexShrink: 0, height: 38, background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8, color: "#666", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Start rest timer">⏱</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {editMode && <button onClick={addExercise} style={{ width: "100%", background: "#161616", border: "1px dashed #444", borderRadius: 10, color: "#4fc3f7", fontSize: 14, fontWeight: 800, padding: "16px 0", cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>+ ADD EXERCISE</button>}
        </div>
      )}

      {workout.recovery && (
        <div style={{ margin: "24px 16px 0", background: "#111", borderRadius: 12, border: "1px solid #333", padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "0.06em", color: "#555" }}>REST & RECOVER</div>
          <div style={{ fontSize: 14, color: "#aaa", marginTop: 14, lineHeight: 1.8 }}>No lifting. No pump work.<br />Cardio only + Cold Plunge.<br />Growth happens here.</div>
        </div>
      )}

      {!editMode && (
        <div style={{ padding: "14px 16px 0" }}>
          <textarea rows={3} placeholder="Session notes..." value={notes} onChange={e => handleNotes(e.target.value)} style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 10, padding: 14, color: "#fff", fontSize: 14, outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box", lineHeight: 1.6 }} />
        </div>
      )}

      <RestBar />
      <ExerciseDetail />
      <SavePrompt />
      <SwapModal />

      {/* Bottom */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#080808", borderTop: "1px solid #222", maxWidth: 480, margin: "0 auto" }}>
        {!editMode && (
          <>
            {saveError && <div style={{ padding: "8px 16px", fontSize: 11, color: "#e8192c", fontWeight: 600, borderBottom: "1px solid #1a1a1a" }}>{saveError}</div>}
            <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 16px" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#aaa", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{progress}%</div>
              <button onClick={saveToNotion} disabled={saving} style={{ flex: 1, background: saving ? "#2a0a0a" : saveStatus === "success" ? "#0a2a0a" : "#e8192c", borderRadius: 10, border: "none", color: saving ? "#888" : saveStatus === "success" ? "#4caf50" : "#fff", fontSize: 13, fontWeight: 900, letterSpacing: "0.08em", padding: "14px 0", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                {saving ? "SAVING..." : saveStatus === "success" ? "✓ SAVED" : saveStatus === "error" ? "RETRY SAVE" : "SAVE TO NOTION"}
              </button>
            </div>
          </>
        )}
        <TabBar />
      </div>
    </div>
  );
}
