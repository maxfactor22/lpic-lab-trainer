/* LPIC-1 Lab Trainer: shared namespace, data registration and saved progress.
   Data files call LPIC.course({...}) and LPIC.section({...}); they load with plain
   <script> tags so the app works from GitHub Pages, file:// and offline. */
(function () {
  "use strict";

  const LPIC = (window.LPIC = window.LPIC || {});
  LPIC.data = { course: null, sections: {} };

  LPIC.course = (c) => { LPIC.data.course = c; };
  LPIC.section = (s) => {
    s.lessons = s.lessons || [];
    s.lessons.forEach((l) => { l.sectionId = s.id; });
    LPIC.data.sections[s.id] = s;
  };

  LPIC.orderedSections = () =>
    (LPIC.data.course?.sections || [])
      .map((id) => LPIC.data.sections[id])
      .filter((s) => s && (s.status !== "draft" || location.search.includes("preview")));

  LPIC.findLesson = (lessonId) => {
    for (const s of Object.values(LPIC.data.sections)) {
      const i = s.lessons.findIndex((l) => l.id === lessonId);
      if (i >= 0) return { section: s, lesson: s.lessons[i], index: i };
    }
    return null;
  };

  /* ---------------- Progress ---------------- */

  const KEY = "lpic-lab-trainer.v2";
  const OLD_KEY = "lpic-lab-trainer.lesson-1.v1";
  const blank = () => ({ v: 2, lessons: {}, review: {}, attempts: [], last: null });

  function load() {
    let st;
    try { st = { ...blank(), ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
    catch { st = blank(); }
    // One-time move of the original Lesson 1 progress into lesson 2.1.
    try {
      const old = JSON.parse(localStorage.getItem(OLD_KEY) || "null");
      if (old && !st.migratedV1) {
        const done = [
          ...(old.completedTasks || []).map((t) => "t:" + t),
          ...(old.correctQuestions || []).map((q) => "q:" + q),
          ...(old.challengeComplete ? ["c"] : []),
        ];
        const cur = st.lessons["2.1"] || { done: [] };
        cur.done = [...new Set([...cur.done, ...done])];
        st.lessons["2.1"] = cur;
        st.migratedV1 = true;
      }
    } catch { /* ignore */ }
    return st;
  }

  let state = load();
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
  };
  save();

  LPIC.store = {
    get state() { return state; },
    lesson(id) { return (state.lessons[id] = state.lessons[id] || { done: [] }); },
    isDone(id, item) { return (state.lessons[id]?.done || []).includes(item); },
    mark(id, item, on = true) {
      const l = this.lesson(id);
      const has = l.done.includes(item);
      if (on && !has) l.done.push(item);
      if (!on && has) l.done = l.done.filter((x) => x !== item);
      if (on !== has) save();
      return on && !has;
    },
    setLessonData(id, key, value) { this.lesson(id)[key] = value; save(); },
    resetLesson(id) { delete state.lessons[id]; save(); },
    reviewItem(sectionId, item) { return (state.review[sectionId] || []).includes(item); },
    markReview(sectionId, item, on) {
      const r = (state.review[sectionId] = state.review[sectionId] || []);
      const has = r.includes(item);
      if (on && !has) r.push(item);
      if (!on && has) state.review[sectionId] = r.filter((x) => x !== item);
      save();
    },
    resetReview(sectionId) { delete state.review[sectionId]; save(); },
    attempt(q, objective, ok) {
      state.attempts.push({ q, objective, ok, at: new Date().toISOString().slice(0, 10) });
      if (state.attempts.length > 2000) state.attempts.splice(0, state.attempts.length - 2000);
      save();
    },
    setLast(route) { state.last = route; save(); },
    /* Review area data: exam (in progress), lastExam, examHistory, missed. null removes the key. */
    put(key, value) { if (value == null) delete state[key]; else state[key] = value; save(); },
    exportJSON() { return JSON.stringify(state, null, 1); },
    importJSON(text) {
      const data = JSON.parse(text);
      if (!data || data.v !== 2 || typeof data.lessons !== "object") throw new Error("This file is not LPIC Lab Trainer progress.");
      state = { ...blank(), ...data, migratedV1: true };
      save();
    },
    resetAll() { state = { ...blank(), migratedV1: true }; save(); },
  };

  /* ---------------- Small helpers ---------------- */

  LPIC.norm = (s) => String(s || "").trim().replace(/\s+/g, " ");
  LPIC.esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  /* Data strings are trusted HTML written in this repo; `code` wraps plain text. */
  LPIC.code = (s) => `<code>${LPIC.esc(s)}</code>`;
})();
