import { useState, useEffect, useCallback, useRef } from "react";

const PROGRAM = [
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

const today = new Date().toISOString().split("T")[0];
const todayDow = new Date().getDay();
const DOW_MAP = [6, 0, 1, 2, 3, 4, 5];

function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveToStorage(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

export default function App() {
  const [selectedDay, setSelectedDay] = useState(DOW_MAP[todayDow]);
  const [sets, setSets] = useState({});
  const [energy, setEnergy] = useState(0);
  const [bodyweight, setBodyweight] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const saveTimer = useRef(null);

  const storageKey = `pr_workout:${selectedDay}:${today}`;

  useEffect(() => {
    setSaveStatus(null);
    const d = loadFromStorage(storageKey);
    if (d) {
      setSets(d.sets || {}); setEnergy(d.energy || 0);
      setBodyweight(d.bodyweight || ""); setNotes(d.notes || "");
    } else {
      setSets({}); setEnergy(0); setBodyweight(""); setNotes("");
    }
  }, [selectedDay, storageKey]);

  const persist = useCallback((s, e, bw, n) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveToStorage(storageKey, { sets: s, energy: e, bodyweight: bw, notes: n });
    }, 400);
  }, [storageKey]);

  const updateSet = (exName, setIdx, field, val) => {
    setSets(prev => {
      const exSets = [...(prev[exName] || [])];
      if (!exSets[setIdx]) exSets[setIdx] = { weight: "", reps: "" };
      exSets[setIdx] = { ...exSets[setIdx], [field]: val };
      const next = { ...prev, [exName]: exSets };
      persist(next, energy, bodyweight, notes);
      return next;
    });
  };

  const handleEnergy = (val) => { setEnergy(val); persist(sets, val, bodyweight, notes); };
  const handleBW = (val) => { setBodyweight(val); persist(sets, energy, val, notes); };
  const handleNotes = (val) => { setNotes(val); persist(sets, energy, bodyweight, val); };

  const workout = PROGRAM[selectedDay];
  const completedSets = Object.values(sets).flat().filter(s => s && (s.weight || s.reps)).length;
  const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets, 0);
  const progress = totalSets ? Math.round((completedSets / totalSets) * 100) : 0;

  async function saveToNotion() {
    setSaving(true); setSaveStatus(null); setSaveError(null);
    const dateLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const sessionName = `${workout.name} — ${dateLabel}`;

    let exerciseText = "";
    workout.exercises.forEach(ex => {
      const exSets = sets[ex.name] || [];
      const filled = exSets.filter(s => s && (s.weight || s.reps));
      if (!filled.length) return;
      exerciseText += `${ex.name} (${ex.reps}): `;
      exerciseText += filled.map((s, i) => `Set ${i + 1}: ${s.weight || "—"} lbs x ${s.reps || "—"}`).join(" | ");
      exerciseText += "\n";
    });

    try {
      const res = await fetch("/api/save-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionName,
          dayType: workout.dayType,
          date: today,
          energy: energy ? ENERGY_NOTION[energy] : null,
          bodyweight: bodyweight || null,
          notes: notes || null,
          exerciseText,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveStatus("success");
      } else {
        setSaveStatus("error");
        setSaveError(data.error || `Error ${res.status}`);
      }
    } catch (err) {
      setSaveStatus("error");
      setSaveError(err.message || "Network error — check connection");
    }
    setSaving(false);
  }

  return (
    <div style={{ background: "#080808", minHeight: "100vh", minHeight: "100dvh", fontFamily: "'Inter', system-ui, sans-serif", color: "#fff", maxWidth: 480, margin: "0 auto", paddingBottom: 120 }}>

      {/* Day Bar */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "20px 16px 0", scrollbarWidth: "none" }}>
        {PROGRAM.map((w, i) => (
          <button key={i} onClick={() => setSelectedDay(i)} style={{
            flexShrink: 0, padding: "8px 16px", borderRadius: 6, cursor: "pointer",
            fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", border: "1px solid",
            background: i === selectedDay ? "#e8192c" : "transparent",
            borderColor: i === selectedDay ? "#e8192c" : "#444",
            color: i === selectedDay ? "#fff" : "#bbb", transition: "all 0.15s"
          }}>{w.day}</button>
        ))}
      </div>

      {/* Header */}
      <div style={{ padding: "20px 16px 0" }}>
        <h1 style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}>{workout.name}</h1>
        <div style={{ fontSize: 13, color: "#aaa", marginTop: 6 }}>{workout.focus}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {workout.tags?.map(t => (
            <span key={t} style={{
              fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", padding: "4px 10px",
              borderRadius: 4, border: `1px solid ${t === "NO YOHIMBINE" ? "#e8192c" : "#555"}`,
              color: t === "NO YOHIMBINE" ? "#e8192c" : "#ccc"
            }}>{t}</span>
          ))}
        </div>
      </div>

      {!workout.recovery && (
        <>
          {/* Progress */}
          <div style={{ margin: "18px 16px 0", height: 3, background: "#2a2a2a", borderRadius: 2 }}>
            <div style={{ height: "100%", background: "#e8192c", borderRadius: 2, transition: "width 0.3s", width: `${progress}%` }} />
          </div>
          <div style={{ fontSize: 12, color: "#aaa", padding: "6px 16px 0", fontWeight: 600, letterSpacing: "0.06em" }}>
            {completedSets} / {totalSets} SETS LOGGED — {progress}%
          </div>

          {/* Meta */}
          <div style={{ display: "flex", gap: 10, padding: "14px 16px 0" }}>
            <div style={{ flex: 1, background: "#141414", borderRadius: 10, padding: 14, border: "1px solid #333" }}>
              <div style={{ fontSize: 10, color: "#aaa", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 8 }}>BODYWEIGHT</div>
              <input type="text" inputMode="decimal" placeholder="—" value={bodyweight}
                onChange={e => handleBW(e.target.value)}
                style={{ background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 26, fontWeight: 800, width: "100%", fontFamily: "inherit" }} />
              <div style={{ fontSize: 11, color: "#888", marginTop: 2, fontWeight: 600 }}>LBS</div>
            </div>
            <div style={{ flex: 1, background: "#141414", borderRadius: 10, padding: 14, border: "1px solid #333" }}>
              <div style={{ fontSize: 10, color: "#aaa", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 8 }}>ENERGY</div>
              <div style={{ display: "flex", gap: 5 }}>
                {[1, 2, 3, 4, 5].map(v => (
                  <button key={v} onClick={() => handleEnergy(v)} style={{
                    flex: 1, height: 32, borderRadius: 6, cursor: "pointer", border: "1px solid",
                    background: energy === v ? ENERGY_COLORS[v] : "transparent",
                    borderColor: energy === v ? ENERGY_COLORS[v] : "#444",
                    color: energy === v ? "#fff" : "#bbb",
                    fontSize: 12, fontWeight: 800, transition: "all 0.15s"
                  }}>{v}</button>
                ))}
              </div>
              {energy > 0 && <div style={{ fontSize: 11, color: ENERGY_COLORS[energy], marginTop: 7, fontWeight: 700, letterSpacing: "0.06em" }}>{ENERGY_LABELS[energy]}</div>}
            </div>
          </div>

          {/* Exercises */}
          <div style={{ padding: "14px 16px 0" }}>
            {workout.exercises.map(ex => {
              const exSets = sets[ex.name] || [];
              const filled = exSets.filter(s => s && (s.weight || s.reps)).length;
              const done = filled >= ex.sets;
              const started = filled > 0 && !done;
              return (
                <div key={ex.name} style={{
                  background: "#111", borderRadius: 10, marginBottom: 10,
                  border: "1px solid #333",
                  borderLeft: `4px solid ${done ? "#4caf50" : started ? "#e8192c" : "#333"}`,
                  overflow: "hidden"
                }}>
                  <div style={{ padding: "12px 14px 8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 15, fontWeight: 800 }}>{ex.name}</span>
                      {ex.heavy && <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.1em", color: "#e8192c", border: "1px solid #e8192c", borderRadius: 4, padding: "2px 7px" }}>HEAVY</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#bbb", marginTop: 4, fontWeight: 600 }}>
                      {ex.sets} sets · {ex.reps} reps · <span style={{ color: done ? "#4caf50" : "#fff" }}>{filled}/{ex.sets} done</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 10px 6px" }}>
                    <div style={{ width: 20, flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: 10, color: "#888", textAlign: "center", fontWeight: 800, letterSpacing: "0.08em" }}>WEIGHT (LBS)</div>
                    <div style={{ width: 18, flexShrink: 0, textAlign: "center", color: "#888", fontSize: 13, fontWeight: 700 }}>×</div>
                    <div style={{ flex: 1, fontSize: 10, color: "#888", textAlign: "center", fontWeight: 800, letterSpacing: "0.08em" }}>REPS</div>
                  </div>

                  <div style={{ padding: "0 10px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
                    {Array.from({ length: ex.sets }).map((_, si) => {
                      const set = exSets[si] || { weight: "", reps: "" };
                      const setDone = set.weight && set.reps;
                      return (
                        <div key={si} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 20, flexShrink: 0, fontSize: 12, color: setDone ? "#4caf50" : "#999", fontWeight: 800, textAlign: "center" }}>
                            {setDone ? "✓" : si + 1}
                          </div>
                          <input type="text" inputMode="decimal" placeholder="—"
                            value={set.weight || ""}
                            onChange={e => updateSet(ex.name, si, "weight", e.target.value)}
                            style={{ flex: 1, minWidth: 0, background: set.weight ? "#1e1e1e" : "#161616", border: `1px solid ${set.weight ? "#555" : "#333"}`, borderRadius: 8, padding: "10px 4px", color: "#fff", fontSize: 16, fontWeight: 700, outline: "none", textAlign: "center", fontFamily: "inherit", boxSizing: "border-box" }}
                          />
                          <div style={{ width: 18, flexShrink: 0, textAlign: "center", color: "#fff", fontSize: 16, fontWeight: 700 }}>×</div>
                          <input type="text" inputMode="numeric" placeholder="—"
                            value={set.reps || ""}
                            onChange={e => updateSet(ex.name, si, "reps", e.target.value)}
                            style={{ flex: 1, minWidth: 0, background: set.reps ? "#1e1e1e" : "#161616", border: `1px solid ${set.reps ? "#555" : "#333"}`, borderRadius: 8, padding: "10px 4px", color: "#fff", fontSize: 16, fontWeight: 700, outline: "none", textAlign: "center", fontFamily: "inherit", boxSizing: "border-box" }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {workout.recovery && (
        <div style={{ margin: "24px 16px 0", background: "#111", borderRadius: 12, border: "1px solid #333", padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "0.06em", color: "#555" }}>REST & RECOVER</div>
          <div style={{ fontSize: 14, color: "#aaa", marginTop: 14, lineHeight: 1.8 }}>No lifting. No pump work.<br />Cardio only + Cold Plunge.<br />Growth happens here.</div>
        </div>
      )}

      {/* Notes */}
      <div style={{ padding: "14px 16px 0" }}>
        <textarea rows={3} placeholder="Session notes..." value={notes}
          onChange={e => handleNotes(e.target.value)}
          style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 10, padding: 14, color: "#fff", fontSize: 14, outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box", lineHeight: 1.6 }} />
      </div>

      {/* Bottom Bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#080808", borderTop: "1px solid #333", maxWidth: 480, margin: "0 auto" }}>
        {saveError && (
          <div style={{ padding: "8px 16px", fontSize: 11, color: "#e8192c", fontWeight: 600, letterSpacing: "0.04em", borderBottom: "1px solid #1a1a1a" }}>
            {saveError}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#aaa", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{progress}%</div>
          <button onClick={saveToNotion} disabled={saving} style={{
            flex: 1, background: saving ? "#2a0a0a" : saveStatus === "success" ? "#0a2a0a" : "#e8192c",
            borderRadius: 10, border: "none",
            color: saving ? "#888" : saveStatus === "success" ? "#4caf50" : "#fff",
            fontSize: 13, fontWeight: 900, letterSpacing: "0.08em", padding: "15px 0",
            cursor: saving ? "not-allowed" : "pointer", transition: "all 0.2s", fontFamily: "inherit"
          }}>
            {saving ? "SAVING..." : saveStatus === "success" ? "✓ SAVED TO NOTION" : saveStatus === "error" ? "RETRY — TAP TO SEE ERROR" : "SAVE TO NOTION"}
          </button>
        </div>
      </div>
    </div>
  );
}
