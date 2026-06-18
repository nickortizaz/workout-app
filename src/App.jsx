import { useState, useEffect, useCallback, useRef } from "react";
import {
  DEFAULT_PROGRAM, ENERGY_LABELS, ENERGY_NOTION, ENERGY_COLORS, DAY_COLORS,
  getLS, setLS, calcVolume, est1RM, fmtTime, fmtDate, haptic
} from "./data";

const today = new Date().toISOString().split("T")[0];
const DOW_MAP = [6, 0, 1, 2, 3, 4, 5];

export default function App() {
  const [tab, setTab] = useState("train");
  const [program, setProgram] = useState(() => getLS("custom_program") || DEFAULT_PROGRAM);
  const [selectedDay, setSelectedDay] = useState(DOW_MAP[new Date().getDay()]);
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
  const [restTotal, setRestTotal] = useState(90);
  const [swapTarget, setSwapTarget] = useState(null);
  const [prFlash, setPrFlash] = useState(null);
  const [editHistory, setEditHistory] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [sessionStart, setSessionStart] = useState(null);
  const [autoRest, setAutoRest] = useState(() => getLS("auto_rest") ?? true);
  const saveTimer = useRef(null);
  const restRef = useRef(null);

  const storageKey = `pr_workout:${selectedDay}:${today}`;
  const workout = editMode && editProgram ? editProgram[selectedDay] : program[selectedDay];

  // ── Load history + PRs once ──
  useEffect(() => {
    const h = getLS("session_history") || [];
    setHistory(h.sort((a, b) => new Date(b.date) - new Date(a.date)));
  }, []);

  // ── Load today's session for selected day ──
  useEffect(() => {
    setSaveStatus(null); setSaveError(null);
    const saved = getLS(storageKey);
    if (saved) {
      setSets(saved.sets || {}); setEnergy(saved.energy || 0);
      setBodyweight(saved.bodyweight || ""); setNotes(saved.notes || "");
      setSessionStart(saved.sessionStart || null);
    } else {
      setSets({}); setEnergy(0); setBodyweight(""); setNotes(""); setSessionStart(null);
    }
    const last = getLS(`last_session:${selectedDay}`);
    setLastSession(last?.sets || {});
  }, [selectedDay, storageKey]);

  // ── Rest timer ──
  useEffect(() => {
    if (restTimer === null) return;
    restRef.current = setInterval(() => {
      setRestSeconds(s => {
        if (s <= 1) { clearInterval(restRef.current); setRestTimer(null); haptic([100,50,100]); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(restRef.current);
  }, [restTimer]);

  const persist = useCallback((s, e, bw, n, ss) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setLS(storageKey, { sets: s, energy: e, bodyweight: bw, notes: n, sessionStart: ss }), 400);
  }, [storageKey]);

  // ── PR detection: returns true if this is a new e1RM PR for the exercise ──
  const getPR = (exName) => {
    let best = 0;
    history.forEach(sess => {
      (sess.sets?.[exName] || []).forEach(s => {
        if (s?.weight && s?.reps && !s?.warmup) { const e = est1RM(s.weight, s.reps); if (e > best) best = e; }
      });
    });
    return best;
  };

  const updateSet = (exName, setIdx, field, val) => {
    setSets(prev => {
      const es = [...(prev[exName] || [])];
      if (!es[setIdx]) es[setIdx] = { weight: "", reps: "", warmup: false };
      es[setIdx] = { ...es[setIdx], [field]: val };
      const next = { ...prev, [exName]: es };
      let ss = sessionStart;
      if (!ss && (field === "weight" || field === "reps") && val) { ss = Date.now(); setSessionStart(ss); }
      persist(next, energy, bodyweight, notes, ss);

      // PR check + auto-rest when a set is completed
      const s = es[setIdx];
      if (s.weight && s.reps && !s.warmup) {
        const newE = est1RM(s.weight, s.reps);
        const prevPR = getPR(exName);
        if (newE > prevPR && prevPR > 0) { setPrFlash({ ex: exName, e1rm: newE }); haptic([60,40,60,40,120]); setTimeout(() => setPrFlash(null), 2600); }
        else { haptic(25); }
        if (autoRest && field === "reps") startRest(restTotal);
      }
      return next;
    });
  };

  const toggleWarmup = (exName, setIdx) => {
    setSets(prev => {
      const es = [...(prev[exName] || [])];
      if (!es[setIdx]) es[setIdx] = { weight: "", reps: "", warmup: false };
      es[setIdx] = { ...es[setIdx], warmup: !es[setIdx].warmup };
      const next = { ...prev, [exName]: es };
      persist(next, energy, bodyweight, notes, sessionStart);
      return next;
    });
  };

  const fillFromLast = (exName, exSets) => {
    const last = lastSession[exName];
    if (!last?.length) return;
    setSets(prev => {
      const next = { ...prev, [exName]: last.map(s => ({ weight: s.weight || "", reps: s.reps || "", warmup: s.warmup || false })) };
      persist(next, energy, bodyweight, notes, sessionStart);
      return next;
    });
    haptic(40);
  };

  const startRest = (seconds) => { setRestSeconds(seconds); setRestTotal(seconds); setRestTimer(Date.now()); };
  const handleEnergy = (v) => { setEnergy(v); persist(sets, v, bodyweight, notes, sessionStart); };
  const handleBW = (v) => { setBodyweight(v); persist(sets, energy, v, notes, sessionStart); };
  const handleNotes = (v) => { setNotes(v); persist(sets, energy, bodyweight, v, sessionStart); };

  const completedSets = Object.values(sets).flat().filter(s => s && (s.weight || s.reps) && !s.warmup).length;
  const totalSets = workout.exercises.reduce((a, e) => a + e.sets, 0);
  const progress = totalSets ? Math.round((completedSets / totalSets) * 100) : 0;

  const getLastForExercise = (exName) => {
    const es = lastSession[exName];
    if (!es?.length) return null;
    const filled = es.filter(s => s?.weight && s?.reps && !s?.warmup);
    if (!filled.length) return null;
    const best = filled.reduce((b, s) => parseFloat(s.weight) > parseFloat(b.weight) ? s : b, filled[0]);
    return `${best.weight} × ${best.reps}`;
  };

  // Progressive overload suggestion
  const getOverloadCue = (ex) => {
    const es = lastSession[ex.name];
    if (!es?.length || !ex.repHigh) return null;
    const filled = es.filter(s => s?.weight && s?.reps && !s?.warmup);
    if (!filled.length) return null;
    const hitTop = filled.every(s => parseFloat(s.reps) >= ex.repHigh);
    if (hitTop) { const w = Math.max(...filled.map(s => parseFloat(s.weight))); return `Hit top reps last time — try ${w + 5} lbs`; }
    return null;
  };

  const getExerciseStats = (exName) => {
    let pr = 0, prDate = null, e1rmBest = 0;
    const volumes = [];
    [...history].reverse().forEach(sess => {
      const es = sess.sets?.[exName];
      if (!es) return;
      let sv = 0, sm = 0, se = 0;
      es.forEach(s => { if (s?.weight && s?.reps && !s?.warmup) { const w = parseFloat(s.weight); sv += w * parseFloat(s.reps); if (w > sm) sm = w; const e = est1RM(s.weight, s.reps); if (e > se) se = e; } });
      if (sv > 0) volumes.push({ date: sess.date, vol: sv, e1rm: se });
      if (sm > pr) { pr = sm; prDate = sess.date; }
      if (se > e1rmBest) e1rmBest = se;
    });
    return { pr: pr || null, prDate, e1rmBest, volumes };
  };

  // Weekly muscle volume (last 7 days)
  const getWeeklyMuscleVolume = () => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
    const vol = {};
    history.forEach(sess => {
      if (new Date(sess.date) < cutoff) return;
      const dayDef = program.find(p => p.dayType === sess.dayType) || DEFAULT_PROGRAM.find(p => p.dayType === sess.dayType);
      Object.entries(sess.sets || {}).forEach(([exName, es]) => {
        const exDef = dayDef?.exercises.find(e => e.name === exName) || DEFAULT_PROGRAM.flatMap(d => d.exercises).find(e => e.name === exName);
        const muscles = exDef?.muscles || [];
        const workingSets = (es || []).filter(s => s?.weight && s?.reps && !s?.warmup).length;
        muscles.forEach(m => { vol[m] = (vol[m] || 0) + workingSets; });
      });
    });
    return vol;
  };

  // ── EDIT MODE ──
  const enterEdit = () => { setEditProgram(JSON.parse(JSON.stringify(program))); setEditMode(true); };
  const cancelEdit = () => { setEditMode(false); setEditProgram(null); };
  const commitEdit = (permanent) => {
    setProgram(editProgram);
    if (permanent) setLS("custom_program", editProgram);
    setEditMode(false); setSavePrompt(false); setEditProgram(null);
  };
  const editEx = (idx, field, val) => setEditProgram(p => { const np = JSON.parse(JSON.stringify(p)); np[selectedDay].exercises[idx][field] = field === "sets" ? Math.max(1, parseInt(val) || 1) : val; return np; });
  const deleteEx = (idx) => setEditProgram(p => { const np = JSON.parse(JSON.stringify(p)); np[selectedDay].exercises.splice(idx, 1); return np; });
  const addEx = () => setEditProgram(p => { const np = JSON.parse(JSON.stringify(p)); np[selectedDay].exercises.push({ name: "New Exercise", sets: 3, reps: "8–12", muscles: [] }); return np; });
  const moveEx = (from, to) => { if (to < 0 || to >= editProgram[selectedDay].exercises.length) return; setEditProgram(p => { const np = JSON.parse(JSON.stringify(p)); const [m] = np[selectedDay].exercises.splice(from, 1); np[selectedDay].exercises.splice(to, 0, m); return np; }); };

  // ── SAVE / SYNC ──
  function buildEntry(syncedFlag) {
    const dateLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const duration = sessionStart ? Math.round((Date.now() - sessionStart) / 60000) : null;
    return { date: today, dayIndex: selectedDay, dayType: workout.dayType, name: workout.name, sessionName: `${workout.name} — ${dateLabel}`, energy, bodyweight, notes, sets, volume: calcVolume(sets), duration, synced: syncedFlag };
  }

  function saveLocal(syncedFlag) {
    const entry = buildEntry(syncedFlag);
    setLS(`last_session:${selectedDay}`, entry);
    setLastSession(sets);
    const h = getLS("session_history") || [];
    const updated = [entry, ...h.filter(x => !(x.date === today && x.dayIndex === selectedDay))];
    setLS("session_history", updated);
    setHistory(updated.sort((a, b) => new Date(b.date) - new Date(a.date)));
    return entry;
  }

  async function pushToNotion(entry) {
    let exerciseText = "";
    Object.entries(entry.sets).forEach(([name, es]) => {
      const filled = (es || []).filter(s => s && (s.weight || s.reps));
      if (!filled.length) return;
      exerciseText += `${name}: ` + filled.map((s, i) => `${s.warmup ? "(W) " : ""}Set ${i+1}: ${s.weight||"—"} × ${s.reps||"—"}`).join(" | ") + "\n";
    });
    const res = await fetch("/api/save-workout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionName: entry.sessionName, dayType: entry.dayType, date: entry.date, energy: entry.energy ? ENERGY_NOTION[entry.energy] : null, bodyweight: entry.bodyweight || null, notes: entry.notes || null, exerciseText, duration: entry.duration }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    return data;
  }

  async function saveToNotion() {
    setSaving(true); setSaveStatus(null); setSaveError(null);
    try {
      const entry = saveLocal(false);
      await pushToNotion(entry);
      // mark synced
      const h = getLS("session_history") || [];
      const updated = h.map(x => (x.date === entry.date && x.dayIndex === entry.dayIndex) ? { ...x, synced: true } : x);
      setLS("session_history", updated);
      setHistory(updated.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setSaveStatus("success");
    } catch (err) { setSaveStatus("error"); setSaveError(err.message || "Network error"); }
    setSaving(false);
  }

  // Sync all unsynced sessions
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  async function syncAll() {
    setSyncing(true); setSyncMsg(null);
    const h = getLS("session_history") || [];
    const unsynced = h.filter(x => !x.synced && x.volume > 0);
    if (!unsynced.length) { setSyncMsg("All sessions already synced"); setSyncing(false); setTimeout(() => setSyncMsg(null), 2500); return; }
    let ok = 0, fail = 0;
    for (const entry of unsynced) {
      try { await pushToNotion(entry); ok++; } catch { fail++; }
    }
    const updated = h.map(x => unsynced.find(u => u.date === x.date && u.dayIndex === x.dayIndex) && !fail ? { ...x, synced: true } : (unsynced.find(u => u.date === x.date && u.dayIndex === x.dayIndex) && ok > 0 ? { ...x, synced: true } : x));
    // Simpler: re-mark all attempted as synced if they succeeded — mark the ones we know
    const finalHist = h.map(x => {
      const wasUnsynced = unsynced.find(u => u.date === x.date && u.dayIndex === x.dayIndex);
      return wasUnsynced && fail === 0 ? { ...x, synced: true } : x;
    });
    setLS("session_history", finalHist);
    setHistory(finalHist.sort((a, b) => new Date(b.date) - new Date(a.date)));
    setSyncMsg(fail ? `${ok} synced, ${fail} failed` : `${ok} session${ok>1?"s":""} synced`);
    setSyncing(false);
    setTimeout(() => setSyncMsg(null), 3000);
  }

  // Delete / edit history
  function deleteSession(entry) {
    const h = getLS("session_history") || [];
    const updated = h.filter(x => !(x.date === entry.date && x.dayIndex === entry.dayIndex));
    setLS("session_history", updated);
    setHistory(updated.sort((a, b) => new Date(b.date) - new Date(a.date)));
    const last = getLS(`last_session:${entry.dayIndex}`);
    if (last && last.date === entry.date) setLS(`last_session:${entry.dayIndex}`, null);
    setConfirmDelete(null); setExpandedHistory(null);
    haptic(40);
  }

  const unsyncedCount = history.filter(x => !x.synced && x.volume > 0).length;

  // ════════════════════════════ STYLES ════════════════════════════
  const inputStyle = (filled, warmup) => ({ width: "100%", background: warmup ? "#1a1505" : filled ? "#1e1e1e" : "#161616", border: `1px solid ${warmup ? "#5a4a0a" : filled ? "#666" : "#333"}`, borderRadius: 8, padding: "11px 4px", color: warmup ? "#f5c842" : "#fff", fontSize: 17, fontWeight: 700, outline: "none", textAlign: "center", fontFamily: "inherit", boxSizing: "border-box" });
  const chipStyle = (a) => ({ flexShrink: 0, padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", border: "1px solid", background: a ? "#e8192c" : "transparent", borderColor: a ? "#e8192c" : "#444", color: a ? "#fff" : "#bbb" });

  // ════════════════════════════ MODALS ════════════════════════════
  const PRFlash = () => prFlash && (
    <div style={{ position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)", zIndex: 200, background: "linear-gradient(135deg,#f5c842,#ff6b2b)", borderRadius: 14, padding: "14px 24px", boxShadow: "0 8px 32px rgba(245,200,66,0.5)", animation: "prpop 0.3s ease", maxWidth: 320 }}>
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.15em", color: "#1a1505" }}>🏆 NEW PERSONAL RECORD</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#1a1505", marginTop: 2 }}>{prFlash.ex} · {prFlash.e1rm} lbs est. 1RM</div>
    </div>
  );

  const ExerciseDetail = () => {
    if (!detailExercise) return null;
    const stats = getExerciseStats(detailExercise);
    const maxVol = Math.max(...stats.volumes.map(v => v.vol), 1);
    return (
      <div onClick={() => setDetailExercise(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div onClick={e => e.stopPropagation()} style={{ background: "#0e0e0e", width: "100%", maxWidth: 480, borderRadius: "20px 20px 0 0", border: "1px solid #222", borderBottom: "none", padding: "20px 18px 32px", maxHeight: "82vh", overflowY: "auto" }}>
          <div style={{ width: 40, height: 4, background: "#333", borderRadius: 2, margin: "0 auto 18px" }} />
          <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>{detailExercise}</div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 20 }}>Progression & records</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <div style={{ flex: 1, background: "#141414", borderRadius: 10, padding: 14, border: "1px solid #2a2a2a" }}>
              <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.08em", fontWeight: 700 }}>HEAVIEST</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#f5c842", marginTop: 4 }}>{stats.pr || "—"}<span style={{ fontSize: 12, color: "#666", fontWeight: 600 }}>{stats.pr ? " lbs" : ""}</span></div>
              {stats.prDate && <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{fmtDate(stats.prDate)}</div>}
            </div>
            <div style={{ flex: 1, background: "#141414", borderRadius: 10, padding: 14, border: "1px solid #2a2a2a" }}>
              <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.08em", fontWeight: 700 }}>EST. 1RM</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#4fc3f7", marginTop: 4 }}>{stats.e1rmBest || "—"}<span style={{ fontSize: 12, color: "#666", fontWeight: 600 }}>{stats.e1rmBest ? " lbs" : ""}</span></div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{stats.volumes.length} sessions</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#888", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 12 }}>VOLUME TREND</div>
          {stats.volumes.length === 0 ? <div style={{ fontSize: 13, color: "#555", padding: "20px 0", textAlign: "center" }}>No history yet. Log this exercise to track progress.</div> : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120, marginBottom: 8 }}>
              {stats.volumes.slice(-12).map((v, i, arr) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: "100%", height: `${(v.vol / maxVol) * 100}%`, minHeight: 4, background: i === arr.length - 1 ? "#e8192c" : "#444", borderRadius: 3 }} />
                  <div style={{ fontSize: 8, color: "#555", transform: "rotate(-45deg)", whiteSpace: "nowrap", marginTop: 4 }}>{fmtDate(v.date)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const SavePrompt = () => savePrompt && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#0e0e0e", borderRadius: 16, border: "1px solid #2a2a2a", padding: 24, maxWidth: 360, width: "100%" }}>
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Save changes</div>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 20, lineHeight: 1.5 }}>Keep these edits to {workout.name} permanently, or just for today?</div>
        <button onClick={() => commitEdit(true)} style={{ width: "100%", background: "#e8192c", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 800, padding: "14px 0", cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>SAVE PERMANENTLY</button>
        <button onClick={() => commitEdit(false)} style={{ width: "100%", background: "#1a1a1a", border: "1px solid #333", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 800, padding: "14px 0", cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>JUST FOR TODAY</button>
        <button onClick={() => setSavePrompt(false)} style={{ width: "100%", background: "transparent", border: "none", color: "#666", fontSize: 13, fontWeight: 700, padding: "8px 0", cursor: "pointer", fontFamily: "inherit" }}>Keep editing</button>
      </div>
    </div>
  );

  const SwapModal = () => {
    if (swapTarget === null) return null;
    const all = [...new Set(DEFAULT_PROGRAM.flatMap(d => d.exercises.map(e => e.name)))].sort();
    return (
      <div onClick={() => setSwapTarget(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 105, display: "flex", alignItems: "flex-end" }}>
        <div onClick={e => e.stopPropagation()} style={{ background: "#0e0e0e", width: "100%", maxWidth: 480, margin: "0 auto", borderRadius: "20px 20px 0 0", border: "1px solid #222", padding: "20px 18px 32px", maxHeight: "70vh", overflowY: "auto" }}>
          <div style={{ width: 40, height: 4, background: "#333", borderRadius: 2, margin: "0 auto 18px" }} />
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Swap exercise</div>
          {all.map(name => <button key={name} onClick={() => { editEx(swapTarget, "name", name); setSwapTarget(null); }} style={{ display: "block", width: "100%", textAlign: "left", background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, padding: "13px 14px", cursor: "pointer", fontFamily: "inherit", marginBottom: 8 }}>{name}</button>)}
        </div>
      </div>
    );
  };

  const ConfirmDelete = () => confirmDelete && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 120, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#0e0e0e", borderRadius: 16, border: "1px solid #2a2a2a", padding: 24, maxWidth: 340, width: "100%" }}>
        <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Delete session?</div>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 20, lineHeight: 1.5 }}>{confirmDelete.name} on {fmtDate(confirmDelete.date)} will be permanently removed from history. This does not delete it from Notion.</div>
        <button onClick={() => deleteSession(confirmDelete)} style={{ width: "100%", background: "#e8192c", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 800, padding: "14px 0", cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>DELETE</button>
        <button onClick={() => setConfirmDelete(null)} style={{ width: "100%", background: "#1a1a1a", border: "1px solid #333", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 800, padding: "14px 0", cursor: "pointer", fontFamily: "inherit" }}>CANCEL</button>
      </div>
    </div>
  );

  const RestBar = () => restTimer !== null && (
    <div style={{ position: "fixed", bottom: 132, left: 0, right: 0, maxWidth: 480, margin: "0 auto", padding: "0 16px", zIndex: 90 }}>
      <div style={{ background: "#e8192c", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 8px 24px rgba(232,25,44,0.4)" }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em" }}>REST</div>
        <div style={{ fontSize: 24, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{fmtTime(restSeconds)}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setRestSeconds(s => s + 30)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 800, padding: "6px 10px", cursor: "pointer", fontFamily: "inherit" }}>+30</button>
          <button onClick={() => { setRestTimer(null); setRestSeconds(0); }} style={{ background: "rgba(0,0,0,0.3)", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 800, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit" }}>SKIP</button>
        </div>
      </div>
    </div>
  );

  const TabBar = () => (
    <div style={{ display: "flex", borderTop: "1px solid #1a1a1a", background: "#080808" }}>
      {[["train","TRAIN"],["history","HISTORY"],["stats","STATS"]].map(([t,l]) => (
        <button key={t} onClick={() => { setTab(t); if (editMode) cancelEdit(); }} style={{ flex: 1, padding: "12px 0 18px", background: "transparent", border: "none", color: tab === t ? "#e8192c" : "#555", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", cursor: "pointer", fontFamily: "inherit", position: "relative" }}>
          {l}{t === "history" && unsyncedCount > 0 && <span style={{ position: "absolute", top: 6, marginLeft: 4, background: "#e8192c", borderRadius: 8, fontSize: 9, padding: "1px 5px", color: "#fff" }}>{unsyncedCount}</span>}
        </button>
      ))}
    </div>
  );

  // ════════════════════════════ HISTORY VIEW ════════════════════════════
  const HistoryView = () => {
    const grouped = {};
    history.forEach(s => { const l = new Date(s.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }); (grouped[l] = grouped[l] || []).push(s); });
    return (
      <>
        <div style={{ padding: "24px 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>HISTORY</h1>
            <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>{history.length} sessions · {unsyncedCount} unsynced</div>
          </div>
          <button onClick={syncAll} disabled={syncing} style={{ background: unsyncedCount ? "#e8192c" : "#1a1a1a", border: unsyncedCount ? "none" : "1px solid #333", borderRadius: 10, color: unsyncedCount ? "#fff" : "#777", fontSize: 12, fontWeight: 800, padding: "10px 16px", cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.05em" }}>{syncing ? "SYNCING..." : "⟳ SYNC"}</button>
        </div>
        {syncMsg && <div style={{ padding: "8px 16px 0", fontSize: 12, color: "#4caf50", fontWeight: 600 }}>{syncMsg}</div>}
        {history.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "50vh", gap: 12 }}>
            <div style={{ fontSize: 40 }}>📋</div><div style={{ fontSize: 16, fontWeight: 700 }}>No sessions yet</div>
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
                          <div style={{ fontSize: 15, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>{s.name}{!s.synced && s.volume > 0 && <span style={{ width: 7, height: 7, borderRadius: 4, background: "#e8192c" }} title="Not synced" />}</div>
                          <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>{s.volume ? `${s.volume.toLocaleString()} lbs` : "Recovery"}{s.bodyweight ? ` · ${s.bodyweight} BW` : ""}{s.duration ? ` · ${s.duration}min` : ""}</div>
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
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{filled.map((st, i) => <div key={i} style={{ background: st.warmup ? "#1a1505" : "#1a1a1a", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: st.warmup ? "#f5c842" : "#fff" }}>{st.weight||"—"} × {st.reps||"—"}</div>)}</div>
                              </div>
                            );
                          })}
                          {s.notes && <div style={{ fontSize: 12, color: "#666", marginTop: 8, fontStyle: "italic" }}>{s.notes}</div>}
                          <button onClick={() => setConfirmDelete(s)} style={{ marginTop: 12, background: "#2a0a0a", border: "1px solid #5a1a1a", borderRadius: 8, color: "#e8192c", fontSize: 12, fontWeight: 800, padding: "10px 16px", cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.05em" }}>DELETE SESSION</button>
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

  // ════════════════════════════ STATS VIEW ════════════════════════════
  const StatsView = () => {
    const muscleVol = getWeeklyMuscleVolume();
    const muscleOrder = ["Chest","Shoulders","Back","Triceps","Biceps","Legs","Hamstrings","Glutes","Rear Delts","Traps","Calves","Abs"];
    const maxM = Math.max(...Object.values(muscleVol), 1);
    const bwHistory = history.filter(s => s.bodyweight).map(s => ({ date: s.date, bw: parseFloat(s.bodyweight) })).reverse();
    const maxBw = Math.max(...bwHistory.map(b => b.bw), 1);
    const minBw = Math.min(...bwHistory.map(b => b.bw), maxBw);
    // streak
    let streak = 0;
    const dates = [...new Set(history.filter(s => s.volume > 0).map(s => s.date))].sort().reverse();
    if (dates.length) {
      let cur = new Date(); cur.setHours(0,0,0,0);
      for (const d of dates) {
        const sd = new Date(d + "T00:00:00");
        const diff = Math.round((cur - sd) / 86400000);
        if (diff <= 1) { streak++; cur = sd; } else break;
      }
    }
    const totalVol = history.reduce((a, s) => a + (s.volume || 0), 0);
    return (
      <div style={{ paddingBottom: 20 }}>
        <div style={{ padding: "24px 16px 0" }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>STATS</h1>
          <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>Your training intelligence</div>
        </div>
        <div style={{ display: "flex", gap: 10, padding: "18px 16px 0" }}>
          <div style={{ flex: 1, background: "#141414", borderRadius: 12, padding: 16, border: "1px solid #2a2a2a" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#e8192c" }}>{streak}</div>
            <div style={{ fontSize: 11, color: "#888", fontWeight: 700, letterSpacing: "0.06em" }}>DAY STREAK</div>
          </div>
          <div style={{ flex: 1, background: "#141414", borderRadius: 12, padding: 16, border: "1px solid #2a2a2a" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#4fc3f7" }}>{history.filter(s=>s.volume>0).length}</div>
            <div style={{ fontSize: 11, color: "#888", fontWeight: 700, letterSpacing: "0.06em" }}>WORKOUTS</div>
          </div>
          <div style={{ flex: 1, background: "#141414", borderRadius: 12, padding: 16, border: "1px solid #2a2a2a" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#4caf50" }}>{(totalVol/1000).toFixed(0)}k</div>
            <div style={{ fontSize: 11, color: "#888", fontWeight: 700, letterSpacing: "0.06em" }}>TOTAL LBS</div>
          </div>
        </div>

        <div style={{ padding: "24px 16px 0" }}>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.06em", marginBottom: 4 }}>WEEKLY MUSCLE VOLUME</div>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 14 }}>Working sets per muscle, last 7 days</div>
          {Object.keys(muscleVol).length === 0 ? <div style={{ fontSize: 13, color: "#555", padding: "10px 0" }}>Log workouts to see muscle volume.</div> : (
            muscleOrder.filter(m => muscleVol[m]).map(m => (
              <div key={m} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "#ccc", fontWeight: 600 }}>{m}</span>
                  <span style={{ color: muscleVol[m] < 6 ? "#ff6b2b" : "#4caf50", fontWeight: 700 }}>{muscleVol[m]} sets{muscleVol[m] < 6 ? " · low" : ""}</span>
                </div>
                <div style={{ height: 8, background: "#1a1a1a", borderRadius: 4 }}>
                  <div style={{ height: "100%", width: `${(muscleVol[m]/maxM)*100}%`, background: muscleVol[m] < 6 ? "#ff6b2b" : "#4caf50", borderRadius: 4 }} />
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: "24px 16px 0" }}>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.06em", marginBottom: 4 }}>BODYWEIGHT TREND</div>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 14 }}>{bwHistory.length} entries logged</div>
          {bwHistory.length < 2 ? <div style={{ fontSize: 13, color: "#555" }}>Log bodyweight on 2+ sessions to see the trend.</div> : (
            <>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 100 }}>
                {bwHistory.slice(-20).map((b, i, arr) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                    <div style={{ fontSize: 8, color: "#888", marginBottom: 2 }}>{b.bw}</div>
                    <div style={{ width: "100%", height: `${maxBw === minBw ? 50 : ((b.bw - minBw) / (maxBw - minBw)) * 80 + 15}%`, background: i === arr.length-1 ? "#4fc3f7" : "#2a4a5a", borderRadius: 3 }} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // ════════════════════════════ MAIN RENDER ════════════════════════════
  const bottomNav = <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto" }}><TabBar /></div>;

  if (tab === "history") return <div style={rootStyle()}><HistoryView /><ConfirmDelete />{bottomNav}</div>;
  if (tab === "stats") return <div style={rootStyle()}><StatsView /><ExerciseDetail />{bottomNav}</div>;

  return (
    <div style={rootStyle()}>
      <style>{`@keyframes prpop{0%{transform:translateX(-50%) scale(0.8);opacity:0}100%{transform:translateX(-50%) scale(1);opacity:1}}`}</style>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "20px 16px 0", scrollbarWidth: "none" }}>
        {program.map((w, i) => <button key={i} onClick={() => !editMode && setSelectedDay(i)} style={chipStyle(i === selectedDay)}>{w.day}</button>)}
      </div>

      <div style={{ padding: "20px 16px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}>{workout.name}</h1>
          <div style={{ fontSize: 13, color: "#aaa", marginTop: 6 }}>{workout.focus}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {workout.tags?.map(t => <span key={t} style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", padding: "4px 10px", borderRadius: 4, border: `1px solid ${t === "NO YOHIMBINE" ? "#e8192c" : "#555"}`, color: t === "NO YOHIMBINE" ? "#e8192c" : "#ccc" }}>{t}</span>)}
          </div>
        </div>
        {!workout.recovery && (editMode
          ? <button onClick={() => setSavePrompt(true)} style={{ background: "#4caf50", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 800, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>DONE</button>
          : <button onClick={enterEdit} style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, color: "#bbb", fontSize: 12, fontWeight: 800, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>EDIT</button>)}
      </div>

      {editMode && <div style={{ padding: "12px 16px 0" }}><div style={{ background: "#1a1505", border: "1px solid #4a3a0a", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#f5c842", fontWeight: 600 }}>Editing — rename, reorder, swap, add or remove. Tap DONE to save.</div></div>}

      {!workout.recovery && !editMode && (
        <>
          <div style={{ margin: "18px 16px 0", height: 3, background: "#2a2a2a", borderRadius: 2 }}><div style={{ height: "100%", background: "#e8192c", borderRadius: 2, width: `${progress}%` }} /></div>
          <div style={{ fontSize: 12, color: "#aaa", padding: "6px 16px 0", fontWeight: 600, letterSpacing: "0.06em" }}>{completedSets} / {totalSets} SETS — {progress}%</div>
          <div style={{ display: "flex", gap: 10, padding: "14px 16px 0" }}>
            <div style={{ flex: 1, background: "#141414", borderRadius: 10, padding: 14, border: "1px solid #333" }}>
              <div style={{ fontSize: 10, color: "#aaa", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 8 }}>BODYWEIGHT</div>
              <input type="text" inputMode="decimal" placeholder="—" value={bodyweight} onChange={e => handleBW(e.target.value)} style={{ background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 26, fontWeight: 800, width: "100%", fontFamily: "inherit" }} />
              <div style={{ fontSize: 11, color: "#888", marginTop: 2, fontWeight: 600 }}>LBS</div>
            </div>
            <div style={{ flex: 1, background: "#141414", borderRadius: 10, padding: 14, border: "1px solid #333" }}>
              <div style={{ fontSize: 10, color: "#aaa", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 8 }}>ENERGY</div>
              <div style={{ display: "flex", gap: 5 }}>{[1,2,3,4,5].map(v => <button key={v} onClick={() => handleEnergy(v)} style={{ flex: 1, height: 32, borderRadius: 6, cursor: "pointer", border: "1px solid", background: energy === v ? ENERGY_COLORS[v] : "transparent", borderColor: energy === v ? ENERGY_COLORS[v] : "#444", color: energy === v ? "#fff" : "#bbb", fontSize: 12, fontWeight: 800 }}>{v}</button>)}</div>
              {energy > 0 && <div style={{ fontSize: 11, color: ENERGY_COLORS[energy], marginTop: 7, fontWeight: 700, letterSpacing: "0.06em" }}>{ENERGY_LABELS[energy]}</div>}
            </div>
          </div>
        </>
      )}

      {!workout.recovery && (
        <div style={{ padding: "14px 16px 0" }}>
          {workout.exercises.map((ex, idx) => {
            if (editMode) {
              return (
                <div key={idx} style={{ background: "#111", borderRadius: 10, marginBottom: 10, border: "1px solid #333", padding: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <button onClick={() => moveEx(idx, idx-1)} style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 4, color: "#999", fontSize: 10, padding: "2px 7px", cursor: "pointer" }}>▲</button>
                      <button onClick={() => moveEx(idx, idx+1)} style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 4, color: "#999", fontSize: 10, padding: "2px 7px", cursor: "pointer" }}>▼</button>
                    </div>
                    <input value={ex.name} onChange={e => editEx(idx, "name", e.target.value)} style={{ flex: 1, background: "#161616", border: "1px solid #333", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, padding: "10px 12px", outline: "none", fontFamily: "inherit" }} />
                    <button onClick={() => deleteEx(idx)} style={{ background: "#2a0a0a", border: "1px solid #5a1a1a", borderRadius: 8, color: "#e8192c", fontSize: 16, fontWeight: 800, padding: "8px 12px", cursor: "pointer" }}>✕</button>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#161616", borderRadius: 8, padding: "6px 10px", border: "1px solid #2a2a2a" }}>
                      <span style={{ fontSize: 11, color: "#888", fontWeight: 700 }}>SETS</span>
                      <button onClick={() => editEx(idx, "sets", ex.sets - 1)} style={{ background: "#222", border: "none", borderRadius: 4, color: "#fff", width: 24, height: 24, fontSize: 16, cursor: "pointer" }}>−</button>
                      <span style={{ fontSize: 15, fontWeight: 800, minWidth: 18, textAlign: "center" }}>{ex.sets}</span>
                      <button onClick={() => editEx(idx, "sets", ex.sets + 1)} style={{ background: "#222", border: "none", borderRadius: 4, color: "#fff", width: 24, height: 24, fontSize: 16, cursor: "pointer" }}>+</button>
                    </div>
                    <input value={ex.reps} onChange={e => editEx(idx, "reps", e.target.value)} placeholder="reps" style={{ flex: 1, background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, padding: "9px 12px", outline: "none", fontFamily: "inherit" }} />
                    <button onClick={() => setSwapTarget(idx)} style={{ background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8, color: "#4fc3f7", fontSize: 11, fontWeight: 800, padding: "9px 12px", cursor: "pointer", fontFamily: "inherit" }}>SWAP</button>
                  </div>
                </div>
              );
            }
            const es = sets[ex.name] || [];
            const filled = es.filter(s => s && (s.weight || s.reps) && !s.warmup).length;
            const done = filled >= ex.sets;
            const started = filled > 0 && !done;
            const lastBest = getLastForExercise(ex.name);
            const overload = getOverloadCue(ex);
            return (
              <div key={idx} style={{ background: "#111", borderRadius: 10, marginBottom: 10, border: "1px solid #333", borderLeft: `4px solid ${done ? "#4caf50" : started ? "#e8192c" : "#333"}`, overflow: "hidden" }}>
                <div onClick={() => setDetailExercise(ex.name)} style={{ padding: "12px 14px 6px", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 800 }}>{ex.name}</span>
                    {ex.heavy && <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.1em", color: "#e8192c", border: "1px solid #e8192c", borderRadius: 4, padding: "2px 7px" }}>HEAVY</span>}
                    <span style={{ fontSize: 11, color: "#4fc3f7", marginLeft: "auto", fontWeight: 700 }}>STATS ›</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#bbb", marginTop: 3, fontWeight: 600 }}>{ex.sets} sets · {ex.reps} reps · <span style={{ color: done ? "#4caf50" : "#fff" }}>{filled}/{ex.sets}</span>{lastBest && <span style={{ color: "#666", marginLeft: 8 }}>· Last {lastBest}</span>}</div>
                </div>
                {overload && <div style={{ margin: "0 14px 8px", background: "#0a1f0a", border: "1px solid #1a4a1a", borderRadius: 6, padding: "6px 10px", fontSize: 11, color: "#4caf50", fontWeight: 700 }}>↗ {overload}</div>}
                {lastBest && <div style={{ padding: "0 14px 8px" }}><button onClick={() => fillFromLast(ex.name, es)} style={{ background: "#161616", border: "1px solid #2a2a2a", borderRadius: 6, color: "#4fc3f7", fontSize: 11, fontWeight: 700, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit" }}>↺ Same as last time</button></div>}
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 10px 6px" }}>
                  <div style={{ width: 20, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 10, color: "#888", textAlign: "center", fontWeight: 800, letterSpacing: "0.08em" }}>WEIGHT</div>
                  <div style={{ width: 18, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 10, color: "#888", textAlign: "center", fontWeight: 800, letterSpacing: "0.08em" }}>REPS</div>
                  <div style={{ width: 30, flexShrink: 0 }} />
                </div>
                <div style={{ padding: "0 10px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
                  {Array.from({ length: ex.sets }).map((_, si) => {
                    const set = es[si] || { weight: "", reps: "", warmup: false };
                    const lastSet = lastSession[ex.name]?.[si];
                    const setDone = set.weight && set.reps;
                    return (
                      <div key={si} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button onClick={() => toggleWarmup(ex.name, si)} style={{ width: 20, flexShrink: 0, fontSize: 12, color: set.warmup ? "#f5c842" : setDone ? "#4caf50" : "#999", fontWeight: 800, textAlign: "center", background: "transparent", border: "none", cursor: "pointer", padding: 0 }} title="Tap to toggle warmup">{set.warmup ? "W" : setDone ? "✓" : si + 1}</button>
                        <div style={{ flex: 1, minWidth: 0 }}><input type="text" inputMode="decimal" placeholder={lastSet?.weight || "—"} value={set.weight || ""} onChange={e => updateSet(ex.name, si, "weight", e.target.value)} style={inputStyle(set.weight, set.warmup)} /></div>
                        <div style={{ width: 18, flexShrink: 0, textAlign: "center", color: "#fff", fontSize: 16, fontWeight: 700 }}>×</div>
                        <div style={{ flex: 1, minWidth: 0 }}><input type="text" inputMode="numeric" placeholder={lastSet?.reps || "—"} value={set.reps || ""} onChange={e => updateSet(ex.name, si, "reps", e.target.value)} style={inputStyle(set.reps, set.warmup)} /></div>
                        <button onClick={() => startRest(restTotal)} style={{ width: 30, flexShrink: 0, height: 38, background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8, color: "#666", fontSize: 13, cursor: "pointer" }} title="Rest timer">⏱</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {editMode && <button onClick={addEx} style={{ width: "100%", background: "#161616", border: "1px dashed #444", borderRadius: 10, color: "#4fc3f7", fontSize: 14, fontWeight: 800, padding: "16px 0", cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>+ ADD EXERCISE</button>}
        </div>
      )}

      {workout.recovery && <div style={{ margin: "24px 16px 0", background: "#111", borderRadius: 12, border: "1px solid #333", padding: 32, textAlign: "center" }}><div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "0.06em", color: "#555" }}>REST & RECOVER</div><div style={{ fontSize: 14, color: "#aaa", marginTop: 14, lineHeight: 1.8 }}>No lifting. No pump work.<br />Cardio only + Cold Plunge.<br />Growth happens here.</div></div>}

      {!editMode && <div style={{ padding: "14px 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label style={{ fontSize: 12, color: "#888", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <span onClick={() => { const v = !autoRest; setAutoRest(v); setLS("auto_rest", v); }} style={{ width: 40, height: 22, borderRadius: 11, background: autoRest ? "#4caf50" : "#333", position: "relative", transition: "all .2s" }}>
            <span style={{ position: "absolute", top: 2, left: autoRest ? 20 : 2, width: 18, height: 18, borderRadius: 9, background: "#fff", transition: "all .2s" }} />
          </span>
          Auto rest timer
        </label>
      </div>}

      {!editMode && <div style={{ padding: "12px 16px 0" }}><textarea rows={3} placeholder="Session notes..." value={notes} onChange={e => handleNotes(e.target.value)} style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 10, padding: 14, color: "#fff", fontSize: 14, outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box", lineHeight: 1.6 }} /></div>}

      <RestBar /><ExerciseDetail /><SavePrompt /><SwapModal /><PRFlash />

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#080808", borderTop: "1px solid #222", maxWidth: 480, margin: "0 auto" }}>
        {!editMode && <>
          {saveError && <div style={{ padding: "8px 16px", fontSize: 11, color: "#e8192c", fontWeight: 600, borderBottom: "1px solid #1a1a1a" }}>{saveError}</div>}
          <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 16px" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#aaa", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{progress}%</div>
            <button onClick={saveToNotion} disabled={saving} style={{ flex: 1, background: saving ? "#2a0a0a" : saveStatus === "success" ? "#0a2a0a" : "#e8192c", borderRadius: 10, border: "none", color: saving ? "#888" : saveStatus === "success" ? "#4caf50" : "#fff", fontSize: 13, fontWeight: 900, letterSpacing: "0.08em", padding: "14px 0", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>{saving ? "SAVING..." : saveStatus === "success" ? "✓ SAVED" : saveStatus === "error" ? "RETRY SAVE" : "SAVE TO NOTION"}</button>
          </div>
        </>}
        <TabBar />
      </div>
    </div>
  );
}

function rootStyle() {
  return { background: "#080808", minHeight: "100dvh", fontFamily: "'Inter',system-ui,sans-serif", color: "#fff", maxWidth: 480, margin: "0 auto", paddingBottom: 150 };
}
