/* LPIC-1 Lab Trainer: Section 24, the review area.
   Routes (dispatched from engine.js):
     #/prep            hub: practice exam, weak areas, quick practice, section reviews, exam day
     #/exam            the 60-question practice exam (start, resume, run)
     #/exam/results    results by objective and a review of every answer
     #/drill/<spec>    short practice with instant feedback. spec = mixed | weak | missed | t:103 | o:103.4,103.7
   Questions come from the section files: every lesson quiz, every section trap quiz, and the
   terminal-lesson command challenges (used as fill-in-the-blank questions). Nothing is written twice. */
(function () {
  "use strict";
  const LPIC = window.LPIC;
  const { esc, norm, store } = LPIC;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const EXAM_N = 60, EXAM_MIN = 90, FILL_SHARE = 0.17, DRILL_N = 10;

  const TOPICS = {
    "101": "System architecture",
    "102": "Linux installation and package management",
    "103": "GNU and Unix commands",
    "104": "Devices, Linux filesystems, Filesystem Hierarchy Standard",
  };
  const OBJECTIVES = {
    "101.1": "Determine and configure hardware settings",
    "101.2": "Boot the system",
    "101.3": "Change runlevels / boot targets and shut down or reboot",
    "102.1": "Design hard disk layout",
    "102.2": "Install a boot manager",
    "102.3": "Manage shared libraries",
    "102.4": "Use Debian package management",
    "102.5": "Use RPM and YUM package management",
    "102.6": "Linux as a virtualization guest",
    "103.1": "Work on the command line",
    "103.2": "Process text streams using filters",
    "103.3": "Perform basic file management",
    "103.4": "Use streams, pipes and redirects",
    "103.5": "Create, monitor and kill processes",
    "103.6": "Modify process execution priorities",
    "103.7": "Search text files using regular expressions",
    "103.8": "Basic file editing",
    "104.1": "Create partitions and filesystems",
    "104.2": "Maintain the integrity of filesystems",
    "104.3": "Control mounting and unmounting of filesystems",
    "104.5": "Manage file permissions and ownership",
    "104.6": "Create and change hard and symbolic links",
    "104.7": "Find system files and place files in the correct location",
  };
  const objName = (o) => OBJECTIVES[o] || o;

  let ui = null;      // helpers handed over by engine.js
  let tick = null;    // exam clock interval
  let drill = null;   // the drill in progress (memory only)

  /* ------------------------------------------------------------ question pool */

  let POOL = null;
  function pool() {
    if (POOL) return POOL;
    const items = [], seen = new Set();
    const add = (it) => { if (it && !seen.has(it.key)) { seen.add(it.key); items.push(it); } };
    for (const s of LPIC.orderedSections()) {
      for (const l of s.lessons) {
        for (const q of l.quiz || []) add(mc(q, s, l.objective, l.id, `Lesson ${l.id}`, `#/lesson/${l.id}`));
        const c = l.challenge;
        if (c && c.mode !== "classify" && c.check && ((c.check.accept || []).length || c.check.re)) {
          add({
            key: `${l.id}/c`, type: "fill", objective: l.objective, section: s.number,
            where: `Lesson ${l.id} challenge`, href: `#/lesson/${l.id}`,
            prompt: c.examPrompt || c.prompt, accept: c.check.accept || [], re: c.check.re || null,
            prefix: c.answerPrefix ?? "$", explain: c.correct || "", hint: c.incorrect || "",
            model: (c.check.accept || [])[0] || "",
          });
        }
      }
      for (const q of s.review?.trapQuiz || []) {
        add(mc(q, s, s.objectives[0], `${s.number}:trap`, `Section ${s.number} trap quiz`, `#/review/${s.number}`));
      }
    }
    POOL = { items, byKey: Object.fromEntries(items.map((i) => [i.key, i])) };
    return POOL;
  }
  function mc(q, s, objective, keyBase, where, href) {
    const options = (q.options || []).map((o) => (typeof o === "string" ? { value: o, label: esc(o) } : o));
    if (!options.some((o) => o.value === q.answer)) return null;
    return {
      key: `${keyBase}/${q.id}`, type: "mc", objective: q.tags?.objective || objective, section: s.number,
      where, href, prompt: q.prompt, options, answer: q.answer, explain: q.explain || "", hint: q.wrong || "",
    };
  }
  const isRight = (it, ans) => {
    if (ans == null || ans === "") return false;
    if (it.type === "mc") return ans === it.answer;
    const v = norm(ans);
    return it.accept.some((a) => norm(a) === v) || (it.re ? new RegExp(it.re).test(v) : false);
  };
  const cleanExplain = (t) => String(t || "").replace(/^(Correct|Right|Yes|Exactly)[.!]\s*/i, "");

  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  /* Split n questions over objectives in proportion to the exam weights (largest remainder). */
  function allocate(n, avail) {
    const W = LPIC.data.course.objectiveWeights || {};
    const list = Object.keys(avail).filter((o) => (W[o] || 0) > 0 && avail[o] > 0);
    const tw = list.reduce((a, o) => a + W[o], 0);
    const rows = list.map((o) => { const x = (n * W[o]) / tw; return { o, x, k: Math.min(Math.floor(x), avail[o]) }; });
    let left = n - rows.reduce((a, r) => a + r.k, 0);
    rows.sort((a, b) => (b.x - Math.floor(b.x)) - (a.x - Math.floor(a.x)));
    while (left > 0) {
      let moved = false;
      for (const r of rows) { if (left > 0 && r.k < avail[r.o]) { r.k++; left--; moved = true; } }
      if (!moved) break;
    }
    return Object.fromEntries(rows.map((r) => [r.o, r.k]));
  }

  /* ------------------------------------------------------------ stats */

  function recordAnswer(it, ok) {
    store.attempt(it.key, it.objective, ok);
    const missed = { ...(store.state.missed || {}) };
    if (!ok) missed[it.key] = Math.min((missed[it.key] || 0) + 1, 5);
    else if (missed[it.key]) { missed[it.key] -= 1; if (!missed[it.key]) delete missed[it.key]; }
    store.put("missed", missed);
  }

  /* Accuracy per objective over the last 25 answers (lesson quizzes, trap quizzes, exams, drills). */
  function objectiveStats() {
    const by = {};
    for (const a of store.state.attempts || []) {
      if (!a.objective || !OBJECTIVES[a.objective]) continue;
      (by[a.objective] = by[a.objective] || []).push(a.ok);
    }
    return Object.keys(OBJECTIVES).map((o) => {
      const last = (by[o] || []).slice(-25);
      const right = last.filter(Boolean).length;
      return { o, n: last.length, right, pct: last.length ? Math.round((right / last.length) * 100) : null };
    });
  }
  function weakest(k = 3) {
    return objectiveStats().filter((s) => s.n >= 2).sort((a, b) => a.pct - b.pct || b.n - a.n).slice(0, k).filter((s) => s.pct < 85);
  }
  const missedKeys = () => Object.keys(store.state.missed || {}).filter((k) => pool().byKey[k]);

  /* ------------------------------------------------------------ shared bits */

  const pctClass = (p) => (p == null ? "" : p >= 80 ? "good" : p >= 65 ? "fair" : "low");
  const fmtTime = (s) => { s = Math.max(0, Math.round(s)); const m = Math.floor(s / 60); return `${m}:${String(s % 60).padStart(2, "0")}`; };
  const fmtDate = (t) => new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  function hero(eyebrow, title, copy) {
    return `<section class="hero"><div class="hero-text"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1>${copy ? `<p class="hero-copy">${copy}</p>` : ""}</div></section>`;
  }
  function objBar(s) {
    return `<li class="obj-row"><span class="obj-id">${esc(s.o)}</span>
      <span class="obj-name">${esc(objName(s.o))}</span>
      <span class="obj-meter ${pctClass(s.pct)}" aria-hidden="true"><span style="width:${s.pct ?? 0}%"></span></span>
      <span class="obj-pct">${s.pct == null ? "—" : s.pct + "%"}<small>${s.n ? `${s.right}/${s.n}` : "no answers"}</small></span></li>`;
  }

  /* ------------------------------------------------------------ hub (#/prep) */

  function renderHub() {
    ui.renderNav(null, "prep");
    const exam = store.state.exam, last = store.state.lastExam, hist = store.state.examHistory || [];
    const stats = objectiveStats();
    const answered = stats.filter((s) => s.n).length;
    const overall = stats.reduce((a, s) => [a[0] + s.right, a[1] + s.n], [0, 0]);
    const readiness = overall[1] ? Math.round((overall[0] / overall[1]) * 100) : 0;
    ui.setTopProgress("Exam readiness", readiness, overall[1] ? `${readiness}% right recently · ${answered} of ${Object.keys(OBJECTIVES).length} objectives tried` : "Answer some questions to see this");
    const weak = weakest();
    const missed = missedKeys();
    const P = pool();
    const left = exam ? EXAM_MIN * 60 - examUsed(exam) : 0;
    const secs = LPIC.orderedSections().filter((s) => s.review?.mastery?.length);

    ui.view.innerHTML = `
      ${hero("Section 24 · Course wrap-up", "Review and practice exam",
        `Everything here draws on the ${P.items.length} questions from Sections 2–23: lesson quizzes, trap quizzes and command challenges. Take the practice exam, then drill the objectives it shows you're weakest on.`)}

      <section class="card exam-card">
        <div class="section-heading"><div><p class="eyebrow">Exam 101-500 format</p><h2>Practice exam</h2></div>
          ${last ? `<span class="status-pill">Last: ${last.pct}%</span>` : ""}</div>
        <p>60 questions in 90 minutes, spread across the objectives by their exam weights. About one in six asks you to type a command, like the fill-in-the-blank questions on the real exam. You see your score by objective at the end and can go through every answer.</p>
        <div class="button-row">
          ${exam ? `<a class="button button-primary" href="#/exam">Resume exam · ${Object.keys(exam.answers).length}/${exam.qs.length} answered · ${fmtTime(left)} left</a>`
                 : `<a class="button button-primary" href="#/exam">Start a practice exam</a>`}
          ${last ? `<a class="button" href="#/exam/results">Review last exam (${fmtDate(last.at)})</a>` : ""}
        </div>
        ${hist.length > 1 ? `<ol class="exam-history" aria-label="Past exams">${hist.slice(-8).map((h) => `<li><span class="${pctClass(h.pct)}">${h.pct}%</span><small>${fmtDate(h.at)}</small></li>`).join("")}</ol>` : ""}
      </section>

      <section class="card">
        <div class="section-heading"><div><p class="eyebrow">Short sets, instant feedback</p><h2>Quick practice</h2></div></div>
        <p class="muted">${DRILL_N} questions at a time. Questions you get wrong come back more often until you get them right.</p>
        <div class="button-row">
          ${weak.length ? `<a class="button button-primary" href="#/drill/weak">Weakest objectives (${weak.map((w) => w.o).join(", ")})</a>` : ""}
          ${missed.length ? `<a class="button" href="#/drill/missed">Questions I missed (${missed.length})</a>` : ""}
          <a class="button" href="#/drill/mixed">Mixed, weighted like the exam</a>
        </div>
        <div class="topic-drills">${Object.entries(TOPICS).map(([t, name]) => `
          <details class="qa"><summary><strong>Topic ${t}</strong> · ${esc(name)}</summary><div>
            <a class="button" href="#/drill/t:${t}">All of topic ${t}</a>
            <ul class="obj-links">${Object.keys(OBJECTIVES).filter((o) => o.startsWith(t + ".")).map((o) => {
              const n = P.items.filter((i) => i.objective === o).length;
              return `<li><a href="#/drill/o:${o}"><span class="obj-id">${o}</span> ${esc(objName(o))} <small>${n} questions</small></a></li>`; }).join("")}</ul>
          </div></details>`).join("")}</div>
      </section>

      <section class="card">
        <div class="section-heading"><div><p class="eyebrow">From every answer you've given</p><h2>Weak areas</h2></div></div>
        <p class="muted">Your last 25 answers per objective, across lessons, section reviews, exams and practice. Lowest first.</p>
        <ul class="obj-table">${stats.slice().sort((a, b) => (a.pct ?? 101) - (b.pct ?? 101) || a.o.localeCompare(b.o)).map(objBar).join("")}</ul>
      </section>

      <section class="card">
        <div class="section-heading"><div><p class="eyebrow">No hints</p><h2>Section reviews</h2></div></div>
        <p class="muted">Each has a trap quiz, a no-notes challenge, practical questions and a mastery checklist.</p>
        <ul class="obj-links review-links">${secs.map((s) => {
          const m = s.review.mastery.length, done = s.review.mastery.filter((_, i) => store.reviewItem(s.id, "m" + i)).length;
          return `<li><a href="#/review/${s.number}"><span class="obj-id">${String(s.number).padStart(2, "0")}</span> ${esc(s.title)} <small>${done}/${m} mastered</small></a></li>`; }).join("")}</ul>
      </section>

      <section class="card">
        <div class="section-heading"><div><p class="eyebrow">Before you book</p><h2>Exam day</h2></div></div>
        <ul class="trap-list">
          <li>Exam 101-500 is 60 questions in 90 minutes: mostly multiple choice (some with more than one right answer) plus fill-in-the-blank, where you type a command, option or file name exactly.</li>
          <li>LPI scores from 200 to 800 and you pass at 500. LPIC-1 also needs exam 102-500 (topics 105–110), which this course doesn't cover.</li>
          <li>Topic 103 (GNU and Unix commands) carries the most weight: almost half the exam. 103.1, 103.3, 103.4 and 103.5 are the heaviest objectives.</li>
          <li>Fill-in answers have to be exact: <code>-r</code> isn't <code>-R</code> for every command, and a path needs its leading <code>/</code>.</li>
          <li>Aim for 80% or better on two practice exams in a row before you book.</li>
          <li>Skim every section's trap list the night before. Those are the questions that catch people.</li>
        </ul>
      </section>
      <footer class="lesson-footer"><p>Practice questions are drawn from the lessons in this app. They're not real exam questions.</p></footer>`;
  }

  /* ------------------------------------------------------------ practice exam (#/exam) */

  function examUsed(exam) {
    return (exam.used || 0) + (exam.resumedAt ? (Date.now() - exam.resumedAt) / 1000 : 0);
  }
  function newExam() {
    const P = pool();
    const avail = {};
    P.items.forEach((i) => { avail[i.objective] = (avail[i.objective] || 0) + 1; });
    const alloc = allocate(EXAM_N, avail);
    const prev = new Set(store.state.lastExam?.qs || []);
    const missed = store.state.missed || {};
    const qs = [];
    for (const [o, k] of Object.entries(alloc)) {
      // Fresh questions first, then ones you've missed before; last exam's questions last.
      const rank = (i) => (prev.has(i.key) ? 2 : missed[i.key] ? 0 : 1);
      const its = shuffle(P.items.filter((i) => i.objective === o)).sort((a, b) => rank(a) - rank(b));
      const fills = its.filter((i) => i.type === "fill"), mcs = its.filter((i) => i.type === "mc");
      let f = Math.min(fills.length, Math.round(k * FILL_SHARE));
      if (mcs.length < k - f) f = Math.min(fills.length, k - mcs.length);
      qs.push(...fills.slice(0, f).map((i) => i.key), ...mcs.slice(0, k - f).map((i) => i.key));
    }
    return { id: Date.now(), started: Date.now(), used: 0, resumedAt: null, qs: shuffle(qs), answers: {}, flags: [], cur: 0 };
  }
  const saveExam = (exam) => store.put("exam", exam);

  function renderExamStart() {
    ui.renderNav(null, "prep");
    ui.setTopProgress("Practice exam", 0, "Not started");
    const P = pool();
    ui.view.innerHTML = `
      ${hero("Section 24 · Practice exam", "Exam 101-500 practice exam",
        `${EXAM_N} questions, ${EXAM_MIN} minutes, drawn from ${P.items.length} questions in proportion to the exam objective weights.`)}
      <section class="card">
        <h2>How it works</h2>
        <ul class="trap-list">
          <li>One question at a time. Go back and change answers whenever you like, and flag questions to come back to.</li>
          <li>No feedback until you finish, same as the real exam.</li>
          <li>Type-in questions start with a prompt such as <code>$</code>. Enter the whole command, exactly.</li>
          <li>The clock pauses when you leave the exam page, and your answers are saved as you go.</li>
          <li>When the clock runs out, the exam is marked with the answers you have.</li>
        </ul>
        <div class="button-row"><button class="button button-primary" type="button" id="exam-begin">Begin the exam</button>
          <a class="button button-ghost" href="#/prep">Back to review</a></div>
      </section>`;
    $("#exam-begin").onclick = () => { saveExam(newExam()); renderExam(); };
  }

  function renderExam() {
    const exam = store.state.exam;
    if (!exam) return renderExamStart();
    const P = pool();
    // Drop any question that no longer exists (section data changed since the exam started).
    exam.qs = exam.qs.filter((k) => P.byKey[k]);
    if (!exam.resumedAt) exam.resumedAt = Date.now();
    exam.cur = Math.min(Math.max(0, exam.cur || 0), exam.qs.length - 1);
    saveExam(exam);
    ui.renderNav(null, "prep");

    const draw = () => {
      const i = exam.cur, it = P.byKey[exam.qs[i]], ans = exam.answers[i];
      const answeredN = Object.keys(exam.answers).filter((k) => exam.answers[k] !== "").length;
      const flagged = exam.flags.includes(i);
      ui.setTopProgress("Practice exam", Math.round((answeredN / exam.qs.length) * 100), `${answeredN} of ${exam.qs.length} answered`);
      ui.view.innerHTML = `
        <section class="card exam-bar">
          <span class="exam-pos">Question <strong>${i + 1}</strong> of ${exam.qs.length}</span>
          <span class="exam-clock" id="exam-clock" role="timer" aria-live="off"></span>
          <button class="button button-ghost exam-flag${flagged ? " on" : ""}" type="button" id="exam-flag" aria-pressed="${flagged}">${flagged ? "⚑ Flagged" : "⚐ Flag"}</button>
        </section>
        ${it.type === "mc" ? `
          <fieldset class="question exam-q"><legend>${it.prompt}</legend>
            ${it.options.map((o) => `<label><input type="radio" name="exam-q" value="${esc(o.value)}"${ans === o.value ? " checked" : ""}> <span>${o.label}${o.note ? `<small>${o.note}</small>` : ""}</span></label>`).join("")}
          </fieldset>` : `
          <section class="question exam-q"><p class="exam-fill-prompt">${it.prompt}</p>
            <label class="sr-only" for="exam-fill">Your answer</label>
            <div class="challenge-input-wrap"><span aria-hidden="true">${esc(it.prefix)}</span>
              <input id="exam-fill" type="text" spellcheck="false" autocapitalize="none" autocorrect="off" enterkeyhint="next" value="${esc(ans || "")}" placeholder="Type the command"></div>
          </section>`}
        <div class="button-row exam-nav">
          <button class="button" type="button" id="exam-prev"${i === 0 ? " disabled" : ""}>← Previous</button>
          ${i < exam.qs.length - 1 ? `<button class="button button-primary" type="button" id="exam-next">Next →</button>` : ""}
          <button class="button${i === exam.qs.length - 1 ? " button-primary" : " button-ghost"}" type="button" id="exam-finish">Finish exam</button>
        </div>
        <details class="card exam-map"${exam.mapOpen ? " open" : ""}><summary>All questions · ${answeredN} answered${exam.flags.length ? ` · ${exam.flags.length} flagged` : ""}</summary>
          <div class="map-grid">${exam.qs.map((_, j) => `<button type="button" data-j="${j}" class="${[exam.answers[j] ? "answered" : "", exam.flags.includes(j) ? "flagged" : "", j === i ? "current" : ""].join(" ")}" aria-label="Question ${j + 1}${exam.answers[j] ? ", answered" : ""}${exam.flags.includes(j) ? ", flagged" : ""}">${j + 1}</button>`).join("")}</div>
          <p class="muted map-key"><span class="answered">■</span> answered <span class="flagged">⚑</span> flagged</p>
        </details>
        <p class="muted exam-note">The clock pauses when you leave this page. <a href="#/prep">Back to review</a></p>`;

      $$('input[name="exam-q"]').forEach((r) => r.addEventListener("change", () => { exam.answers[i] = r.value; saveExam(exam); }));
      const fill = $("#exam-fill");
      if (fill) {
        fill.addEventListener("input", () => { exam.answers[i] = fill.value; if (!fill.value.trim()) delete exam.answers[i]; saveExam(exam); });
        fill.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); go(i + 1); } });
      }
      $("#exam-flag").onclick = () => {
        exam.flags = flagged ? exam.flags.filter((x) => x !== i) : [...exam.flags, i];
        saveExam(exam); draw();
      };
      $("#exam-prev").onclick = () => go(i - 1);
      if ($("#exam-next")) $("#exam-next").onclick = () => go(i + 1);
      $("#exam-finish").onclick = () => {
        const open = exam.qs.length - Object.keys(exam.answers).length;
        const msg = open ? `${open} question${open === 1 ? " is" : "s are"} unanswered${exam.flags.length ? ` and ${exam.flags.length} flagged` : ""}. Finish and mark the exam?` : (exam.flags.length ? `${exam.flags.length} question(s) still flagged. Finish and mark the exam?` : "Finish and mark the exam?");
        if (confirm(msg)) finishExam();
      };
      $(".exam-map").addEventListener("toggle", (e) => { exam.mapOpen = e.target.open; saveExam(exam); });
      $$(".map-grid button").forEach((b) => b.addEventListener("click", () => go(+b.dataset.j)));
      updateClock();
    };
    const go = (j) => {
      if (j < 0 || j >= exam.qs.length) return;
      exam.cur = j; saveExam(exam); draw(); window.scrollTo(0, 0);
    };
    const updateClock = () => {
      const left = EXAM_MIN * 60 - examUsed(exam);
      const el = $("#exam-clock");
      if (el) { el.textContent = `⏱ ${fmtTime(left)}`; el.classList.toggle("low", left < 600); }
      if (left <= 0) { stopClock(); alert("Time's up. Your exam is being marked with the answers you have."); finishExam(); }
    };
    stopClock();
    tick = setInterval(updateClock, 1000);
    draw();
  }

  function stopClock() { if (tick) { clearInterval(tick); tick = null; } }

  /* Called by engine.js on every route change: pause the exam clock when leaving the exam. */
  function leave() {
    stopClock();
    const exam = store.state.exam;
    if (exam && exam.resumedAt && !/^#\/exam\/?$/.test(location.hash)) {
      exam.used = examUsed(exam); exam.resumedAt = null; saveExam(exam);
    }
  }

  function finishExam() {
    stopClock();
    const exam = store.state.exam;
    if (!exam) return;
    const P = pool();
    const byObj = {};
    let right = 0;
    exam.qs.forEach((k, i) => {
      const it = P.byKey[k];
      const ok = isRight(it, exam.answers[i]);
      if (ok) right++;
      const b = (byObj[it.objective] = byObj[it.objective] || [0, 0]);
      b[0] += ok ? 1 : 0; b[1] += 1;
      recordAnswer(it, ok);
    });
    const secs = Math.round(examUsed(exam));
    const pct = Math.round((right / exam.qs.length) * 100);
    const result = { at: Date.now(), secs, right, total: exam.qs.length, pct, byObj, qs: exam.qs, answers: exam.answers, flags: exam.flags };
    store.put("lastExam", result);
    store.put("examHistory", [...(store.state.examHistory || []), { at: result.at, pct, right, total: result.total, secs }].slice(-30));
    store.put("exam", null);
    if (location.hash === "#/exam/results") renderResults(); else location.hash = "#/exam/results";
  }

  /* ------------------------------------------------------------ results (#/exam/results) */

  function renderResults() {
    const r = store.state.lastExam;
    if (!r) { location.hash = "#/prep"; return; }
    ui.renderNav(null, "prep");
    const P = pool();
    ui.setTopProgress("Last practice exam", r.pct, `${r.right} of ${r.total} right · ${r.pct}%`);
    const rows = Object.entries(r.byObj).map(([o, [ok, n]]) => ({ o, right: ok, n, pct: Math.round((ok / n) * 100) }))
      .sort((a, b) => a.pct - b.pct || a.o.localeCompare(b.o));
    const weakObjs = rows.filter((x) => x.pct < 70).slice(0, 4).map((x) => x.o);
    const verdict = r.pct >= 80 ? "Exam-ready territory. Do one more on another day to be sure."
      : r.pct >= 65 ? "Close. Drill the objectives at the top of the list, then take another."
      : "Not yet. Work back through the weakest objectives' lessons and drills first.";
    const uncovered = Object.keys(OBJECTIVES).filter((o) => !r.byObj[o]);

    ui.view.innerHTML = `
      ${hero(`Practice exam · ${fmtDate(r.at)}`, `${r.pct}% <small class="hero-sub">${r.right} of ${r.total} right · ${fmtTime(r.secs)} used</small>`, verdict)}
      <div class="button-row results-actions">
        ${weakObjs.length ? `<a class="button button-primary" href="#/drill/o:${weakObjs.join(",")}">Practice ${weakObjs.join(", ")}</a>` : ""}
        <a class="button" href="#/exam">Take another exam</a>
        <a class="button button-ghost" href="#/prep">Back to review</a>
      </div>
      <section class="card">
        <div class="section-heading"><div><p class="eyebrow">Weakest first</p><h2>Score by objective</h2></div></div>
        <ul class="obj-table">${rows.map(objBar).join("")}</ul>
        ${uncovered.length ? `<p class="muted">Not in this exam: ${uncovered.join(", ")}. With 60 questions, low-weight objectives sometimes get none.</p>` : ""}
      </section>
      <section class="card">
        <div class="section-heading"><div><p class="eyebrow">Every question</p><h2>Review your answers</h2></div>
          <div class="seg" role="group" aria-label="Show">
            <button type="button" data-f="wrong" aria-pressed="true">Wrong (${r.total - r.right})</button>
            <button type="button" data-f="flagged" aria-pressed="false">Flagged (${(r.flags || []).length})</button>
            <button type="button" data-f="all" aria-pressed="false">All</button></div></div>
        <ol class="answer-list" id="answer-list">${r.qs.map((k, i) => answerCard(P.byKey[k], r.answers[i], i, (r.flags || []).includes(i))).join("")}</ol>
      </section>`;
    const list = $("#answer-list");
    const filter = (f) => {
      $$(".seg button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.f === f)));
      $$("li", list).forEach((li) => { li.hidden = f === "wrong" ? li.dataset.ok === "1" : f === "flagged" ? li.dataset.flag !== "1" : false; });
    };
    $$(".seg button").forEach((b) => b.addEventListener("click", () => filter(b.dataset.f)));
    filter(r.right === r.total ? "all" : "wrong");
  }

  function answerCard(it, ans, i, flagged) {
    if (!it) return "";
    const ok = isRight(it, ans);
    let body;
    if (it.type === "mc") {
      body = `<ul class="answer-options">${it.options.map((o) => {
        const cls = o.value === it.answer ? "right" : o.value === ans ? "wrong" : "";
        const tag = o.value === it.answer ? (o.value === ans ? "Your answer · correct" : "Correct answer") : o.value === ans ? "Your answer" : "";
        return `<li class="${cls}"><span>${o.label}</span>${tag ? `<small>${tag}</small>` : ""}</li>`; }).join("")}</ul>`;
    } else {
      body = `<ul class="answer-options">
        <li class="${ok ? "right" : "wrong"}"><span><code>${esc(it.prefix)} ${esc(ans || "(no answer)")}</code></span><small>Your answer</small></li>
        ${ok ? "" : `<li class="right"><span><code>${esc(it.prefix)} ${esc(it.model)}</code></span><small>A correct answer</small></li>`}</ul>`;
    }
    const why = cleanExplain(it.explain) || (ok ? "" : it.hint);
    return `<li class="answer-card ${ok ? "ok" : "bad"}" data-ok="${ok ? 1 : 0}" data-flag="${flagged ? 1 : 0}">
      <p class="answer-meta"><span class="mark">${ok ? "✓" : "✗"}</span> Question ${i + 1} · ${esc(it.objective)} ${esc(objName(it.objective))}${flagged ? " · ⚑" : ""}</p>
      <div class="answer-prompt">${it.prompt}</div>${body}
      ${why ? `<p class="answer-why">${why}</p>` : ""}
      <p class="answer-src"><a href="${it.href}">${esc(it.where)}</a></p></li>`;
  }

  /* ------------------------------------------------------------ drills (#/drill/<spec>) */

  function drillSpec(spec) {
    const P = pool();
    const missed = store.state.missed || {};
    let items, title;
    if (spec === "missed") {
      items = missedKeys().map((k) => P.byKey[k]);
      title = "Questions you missed";
      return { title, qs: shuffle(items).sort((a, b) => (missed[b.key] || 0) - (missed[a.key] || 0)).slice(0, DRILL_N) };
    }
    if (spec === "mixed") {
      const avail = {};
      P.items.forEach((i) => { avail[i.objective] = (avail[i.objective] || 0) + 1; });
      // Weighted draw: allocate a large exam, then sample from it.
      const alloc = allocate(DRILL_N * 6, avail);
      const keys = Object.entries(alloc).flatMap(([o, k]) => shuffle(P.items.filter((i) => i.objective === o)).slice(0, k));
      return { title: "Mixed practice", qs: pickFavoringMissed(shuffle(keys), DRILL_N) };
    }
    let objs;
    if (spec === "weak") { objs = weakest().map((w) => w.o); title = `Weakest objectives: ${objs.join(", ")}`; }
    else if (spec.startsWith("t:")) { const t = spec.slice(2); objs = Object.keys(OBJECTIVES).filter((o) => o.startsWith(t + ".")); title = `Topic ${t}: ${TOPICS[t] || ""}`; }
    else if (spec.startsWith("o:")) { objs = spec.slice(2).split(",").filter((o) => OBJECTIVES[o]); title = objs.length === 1 ? `${objs[0]} ${objName(objs[0])}` : `Objectives ${objs.join(", ")}`; }
    if (!objs || !objs.length) return null;
    items = P.items.filter((i) => objs.includes(i.objective));
    // Spread across the chosen objectives, missed questions first within each.
    const per = objs.map((o) => pickFavoringMissed(shuffle(items.filter((i) => i.objective === o)), DRILL_N));
    const qs = [];
    for (let r = 0; qs.length < DRILL_N && per.some((l) => l.length > r); r++) per.forEach((l) => { if (l[r] && qs.length < DRILL_N) qs.push(l[r]); });
    return { title, qs: shuffle(qs) };
  }
  function pickFavoringMissed(items, n) {
    const missed = store.state.missed || {};
    const a = items.filter((i) => missed[i.key]), b = items.filter((i) => !missed[i.key]);
    // Up to half the set can be questions you've missed before.
    return shuffle([...a.slice(0, Math.ceil(n / 2)), ...b].slice(0, n));
  }

  function renderDrill(spec) {
    ui.renderNav(null, "prep");
    if (!drill || drill.spec !== spec || drill.done) {
      const d = drillSpec(spec || "mixed");
      if (!d || !d.qs.length) {
        ui.setTopProgress("Practice", 0, "Nothing to practice");
        ui.view.innerHTML = `${hero("Quick practice", "Nothing to practice here yet", spec === "missed" ? "You haven't missed any questions in practice or exams yet." : "Answer a few more questions first, so there's data on your weak areas.")}
          <div class="button-row"><a class="button button-primary" href="#/drill/mixed">Mixed practice instead</a><a class="button" href="#/prep">Back to review</a></div>`;
        return;
      }
      drill = { spec, title: d.title, qs: d.qs, i: 0, results: [], done: false };
    }
    drawDrill();
  }

  function drawDrill() {
    const d = drill;
    if (d.i >= d.qs.length) return drillSummary();
    const it = d.qs[d.i];
    const res = d.results[d.i];
    ui.setTopProgress("Practice", Math.round((d.i / d.qs.length) * 100), `Question ${d.i + 1} of ${d.qs.length}`);
    const fb = res ? `<p class="feedback ${res.ok ? "correct" : "incorrect"}"><span>${res.ok ? cleanExplain(it.explain) || "Correct." : (it.type === "fill" ? `Not quite. One right answer: <code>${esc(it.model)}</code>. ` : "Not quite. ") + (cleanExplain(it.explain) || it.hint)}</span></p>` : `<p class="feedback" aria-live="polite"></p>`;
    ui.view.innerHTML = `
      <section class="card exam-bar"><span class="exam-pos">${esc(d.title)}</span><span class="exam-pos"><strong>${d.i + 1}</strong> / ${d.qs.length}</span></section>
      ${it.type === "mc" ? `
        <fieldset class="question exam-q"${res ? " disabled" : ""}><legend>${it.prompt}</legend>
          ${it.options.map((o) => `<label><input type="radio" name="drill-q" value="${esc(o.value)}"${res && res.ans === o.value ? " checked" : ""}> <span>${o.label}${o.note ? `<small>${o.note}</small>` : ""}</span></label>`).join("")}
          ${fb}</fieldset>` : `
        <form class="question exam-q" id="drill-fill-form" autocomplete="off"><p class="exam-fill-prompt">${it.prompt}</p>
          <label class="sr-only" for="drill-fill">Your answer</label>
          <div class="challenge-input-wrap"><span aria-hidden="true">${esc(it.prefix)}</span>
            <input id="drill-fill" type="text" spellcheck="false" autocapitalize="none" autocorrect="off" enterkeyhint="done" placeholder="Type the command"${res ? ` value="${esc(res.ans)}" disabled` : ""}></div>
          ${res ? "" : `<div class="button-row"><button class="button button-primary" type="submit">Check</button></div>`}
          ${fb}</form>`}
      <p class="answer-src muted">From <a href="${it.href}">${esc(it.where)}</a> · ${esc(it.objective)} ${esc(objName(it.objective))}</p>
      <div class="button-row exam-nav">
        ${res ? `<button class="button button-primary" type="button" id="drill-next">${d.i < d.qs.length - 1 ? "Next question →" : "See results"}</button>` : ""}
        <a class="button button-ghost" href="#/prep">End practice</a>
      </div>`;
    const answer = (ans) => {
      const ok = isRight(it, ans);
      d.results[d.i] = { ans, ok };
      recordAnswer(it, ok);
      drawDrill();
      $("#drill-next")?.focus();
    };
    if (!res) {
      $$('input[name="drill-q"]').forEach((r) => r.addEventListener("change", () => answer(r.value)));
      const f = $("#drill-fill-form");
      if (f) f.addEventListener("submit", (e) => { e.preventDefault(); const v = $("#drill-fill").value; if (v.trim()) answer(v); });
    } else {
      $("#drill-next").onclick = () => { d.i++; drawDrill(); window.scrollTo(0, 0); };
    }
  }

  function drillSummary() {
    const d = drill;
    d.done = true;
    const right = d.results.filter((r) => r.ok).length;
    const pct = Math.round((right / d.qs.length) * 100);
    ui.setTopProgress("Practice", 100, `${right} of ${d.qs.length} right`);
    ui.view.innerHTML = `
      ${hero("Quick practice · done", `${right} of ${d.qs.length} right <small class="hero-sub">${pct}%</small>`, esc(d.title))}
      <div class="button-row results-actions">
        <button class="button button-primary" type="button" id="drill-again">Another ${d.qs.length}</button>
        ${missedKeys().length ? `<a class="button" href="#/drill/missed">Questions I missed (${missedKeys().length})</a>` : ""}
        <a class="button button-ghost" href="#/prep">Back to review</a>
      </div>
      <section class="card"><h2>Your answers</h2>
        <ol class="answer-list">${d.qs.map((it, i) => answerCard(it, d.results[i]?.ans, i, false)).join("")}</ol></section>`;
    $("#drill-again").onclick = () => { drill = null; renderDrill(d.spec); window.scrollTo(0, 0); };
  }

  /* ------------------------------------------------------------ entry points for engine.js */

  LPIC.prep = {
    handles: (kind) => ["prep", "exam", "drill"].includes(kind),
    leave,
    render(kind, id, helpers) {
      ui = helpers;
      if (kind === "prep") renderHub();
      else if (kind === "exam" && id === "results") renderResults();
      else if (kind === "exam") renderExam();
      else if (kind === "drill") renderDrill(decodeURIComponent(id || "mixed"));
    },
    // For tests and the console.
    pool, allocate, isRight, objectiveStats,
  };
})();
