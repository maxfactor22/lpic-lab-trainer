/* LPIC-1 Lab Trainer: renders the home page, section pages, lessons and section reviews
   from the data files, and grades tasks. Routes: #/  #/section/2  #/lesson/2.1  #/review/2 */
(function () {
  "use strict";
  const LPIC = window.LPIC;
  const { esc, norm, store } = LPIC;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const view = $("#view");
  const nav = $("#nav");
  let current = null; // { lesson, section, shell, ... } while a lesson is open

  /* ------------------------------------------------------------ progress */

  function lessonItems(lesson) {
    if (lesson.kind === "vm") return ["p", ...(lesson.quiz || []).map((q) => "q:" + q.id)];
    return [
      ...(lesson.tasks || []).map((t) => "t:" + t.id),
      ...(lesson.quiz || []).map((q) => "q:" + q.id),
      ...(lesson.challenge ? ["c"] : []),
    ];
  }
  function lessonPct(lesson) {
    const items = lessonItems(lesson);
    if (!items.length) return 0;
    return Math.round((items.filter((i) => store.isDone(lesson.id, i)).length / items.length) * 100);
  }
  function sectionPct(section) {
    const items = section.lessons.flatMap((l) => lessonItems(l).map((i) => [l.id, i]));
    if (!items.length) return 0;
    return Math.round((items.filter(([l, i]) => store.isDone(l, i)).length / items.length) * 100);
  }
  function setTopProgress(label, pct, sub) {
    $("#progress-title").textContent = label;
    $("#progress-label").textContent = sub;
    $("#progress-bar").style.width = pct + "%";
    const track = $("#progress-bar").parentElement;
    track.setAttribute("aria-valuenow", String(pct));
    track.setAttribute("aria-valuetext", `${pct}% complete`);
  }
  function courseProgress() {
    const secs = LPIC.orderedSections();
    const all = secs.flatMap((s) => s.lessons.flatMap((l) => lessonItems(l).map((i) => [l.id, i])));
    const done = all.filter(([l, i]) => store.isDone(l, i)).length;
    const pct = all.length ? Math.round((done / all.length) * 100) : 0;
    setTopProgress("Course progress", pct, `${pct}% of the sections built so far`);
  }

  /* ------------------------------------------------------------ routing */

  function route() {
    const hash = location.hash.replace(/^#\/?/, "");
    const [kind, id] = hash.split("/");
    current = null;
    $("#reset-progress").hidden = true;
    try {
      if (kind === "section" && sectionById(id)) renderSection(sectionById(id));
      else if (kind === "lesson" && LPIC.findLesson(id)) renderLesson(LPIC.findLesson(id));
      else if (kind === "review" && sectionById(id)) renderReview(sectionById(id));
      else renderHome();
      if (kind) store.setLast(location.hash);
    } catch (e) {
      console.error(e);
      view.innerHTML = `<section class="card"><h2>Something went wrong</h2><p>${esc(e.message)}</p><p><a href="#/">Back to all sections</a></p></section>`;
    }
    window.scrollTo(0, 0);
  }
  const sectionById = (n) => LPIC.orderedSections().find((s) => String(s.number) === String(n));

  /* ------------------------------------------------------------ nav */

  function renderNav(section, activeId) {
    if (!section) {
      const secs = LPIC.orderedSections();
      nav.innerHTML = `
        <div class="nav-heading"><p class="eyebrow">LPIC-1 101-500</p><h2>Sections</h2></div>
        <ol class="lesson-list">${secs.map((s) => navItem(`#/section/${s.number}`, String(s.number).padStart(2, "0"), s.title, s.objectives.join(", "), sectionPct(s), false)).join("")}</ol>
        <div class="nav-note"><strong>Work in progress</strong><p>More sections are added as they're built. Export your progress now and then as a backup.</p></div>`;
      return;
    }
    nav.innerHTML = `
      <div class="nav-heading"><a class="eyebrow nav-back" href="#/">← All sections</a><h2>Section ${section.number}</h2></div>
      <ol class="lesson-list">
        ${navItem(`#/section/${section.number}`, "§", "Overview", section.kind === "vm" ? "Setup and commands" : "Scenario", null, activeId === "overview")}
        ${section.lessons.map((l) => navItem(`#/lesson/${l.id}`, l.navNumber || l.id.split(".")[1].padStart(2, "0"), l.title, l.navSubtitle || "", lessonPct(l), activeId === l.id)).join("")}
        ${section.review ? navItem(`#/review/${section.number}`, "★", "Section review", "Traps, challenge, checklist", null, activeId === "review") : ""}
      </ol>`;
  }
  function navItem(href, num, title, sub, pct, active) {
    return `<li><a class="lesson-link${active ? " current" : ""}" href="${href}"${active ? ' aria-current="page"' : ""}>
      <span class="lesson-number">${esc(num)}</span>
      <span class="lesson-text"><strong>${esc(title)}</strong><small>${esc(sub)}</small>
      ${pct === null ? "" : `<span class="lesson-meter" aria-hidden="true"><span style="width:${pct}%"></span></span>`}</span></a></li>`;
  }

  /* ------------------------------------------------------------ home */

  function renderHome() {
    renderNav(null);
    courseProgress();
    const secs = LPIC.orderedSections();
    const last = store.state.last;
    view.innerHTML = `
      <section class="hero"><div class="hero-text"><p class="eyebrow">LPIC-1 exam 101-500</p>
        <h1>${esc(LPIC.data.course.title)}</h1>
        <p class="hero-copy">${LPIC.data.course.intro}</p></div></section>
      ${last && last !== "#/" ? `<a class="button button-primary resume" href="${esc(last)}">Continue where you left off</a>` : ""}
      <section class="section-grid" aria-label="Sections">
        ${secs.map((s) => `
          <a class="card section-card" href="#/section/${s.number}">
            <span class="eyebrow">Section ${s.number} · ${esc(s.objectives.join(", "))}</span>
            <strong>${esc(s.title)}</strong>
            <span class="section-card-meta">${s.lessons.length} lessons · ${s.kind === "vm" ? "Run on your Linux Mint VM" : "Practice terminal in the browser"}</span>
            <span class="progress-track"><span style="width:${sectionPct(s)}%"></span></span>
          </a>`).join("")}
      </section>
      <section class="card">
        <div class="section-heading"><div><p class="eyebrow">Your progress</p><h2>Back up or move your progress</h2></div></div>
        <p class="muted">Progress is saved in this browser only. Export it to keep a backup or to move it between your iPhone and your computer. Safari can clear saved data for web apps you haven't opened in a while.</p>
        <div class="button-row">
          <button class="button" type="button" id="export-progress">Export progress</button>
          <label class="button" for="import-file">Import progress</label>
          <input id="import-file" type="file" accept="application/json,.json" hidden>
          <button class="button button-ghost" type="button" id="reset-all">Reset everything</button>
        </div>
        <p class="feedback" id="progress-feedback" aria-live="polite"></p>
      </section>
      <footer class="lesson-footer"><p>Lessons are based on Max's LPIC-1 lab workbooks. Terminal output is simulated and may differ from your Linux Mint VM.</p></footer>`;

    $("#export-progress").onclick = () => {
      const blob = new Blob([store.exportJSON()], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `lpic-progress-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    $("#import-file").onchange = async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const fb = $("#progress-feedback");
      try {
        store.importJSON(await f.text());
        fb.className = "feedback correct"; fb.textContent = "Progress imported.";
        setTimeout(renderHome, 600);
      } catch (err) { fb.className = "feedback incorrect"; fb.textContent = err.message; }
    };
    $("#reset-all").onclick = () => {
      if (!confirm("Erase all saved progress in this browser? Export first if you want a backup.")) return;
      store.resetAll(); renderHome();
    };
  }

  /* ------------------------------------------------------------ section page */

  function renderSection(section) {
    renderNav(section, "overview");
    setTopProgress(`Section ${section.number} progress`, sectionPct(section), `${sectionPct(section)}% complete`);
    const o = section.overview || {};
    view.innerHTML = `
      <section class="hero"><div class="hero-text">
        <p class="eyebrow">Section ${section.number} · Objective ${esc(section.objectives.join(", "))}</p>
        <h1>${esc(section.title)}</h1>
        <p class="hero-copy">${section.scenario}</p></div>
        <div class="difficulty"><span aria-hidden="true"></span>${section.kind === "vm" ? "Linux Mint VM" : "Browser terminal"}</div>
      </section>
      ${section.kind === "vm" ? `<div class="callout callout-warn"><span class="callout-icon" aria-hidden="true">!</span><div><strong>These labs run on your Linux Mint VM.</strong><br>
        A browser can't partition disks or mount filesystems, so each lesson gives you the steps to run on your VM and checks the output you paste back. On your iPhone you can read the steps and take the quizzes, then finish the lab at your computer.</div></div>` : ""}
      ${(o.paragraphs || []).length ? `<section class="card prose">${o.paragraphs.map((p) => `<p>${p}</p>`).join("")}</section>` : ""}
      ${o.setup ? `<section class="card"><div class="section-heading"><div><p class="eyebrow">Before you start</p><h2>Lab setup</h2></div></div>${stepsHtml(o.setup, null)}</section>` : ""}
      ${o.commands ? `<section class="card"><div class="section-heading"><div><p class="eyebrow">Know these cold</p><h2>Commands to memorize</h2></div></div><p class="command-cloud">${o.commands.map((c) => `<code>${esc(c)}</code>`).join(" ")}</p></section>` : ""}
      ${(o.reference || []).map((r) => `<section class="card prose"><div class="section-heading"><div><p class="eyebrow">Reference</p><h2>${esc(r.title)}</h2></div></div>
        ${r.paragraphs.map((p) => `<p>${inlineCode(p)}</p>`).join("")}
        ${r.bullets.length ? `<ul class="trap-list">${r.bullets.map((b) => `<li>${inlineCode(b)}</li>`).join("")}</ul>` : ""}</section>`).join("")}
      ${o.memoryHook ? `<aside class="memory-card callout-hint wide"><span class="memory-icon" aria-hidden="true">★</span><strong>Memory hook</strong><p>${o.memoryHook}</p></aside>` : ""}
      <section class="card"><div class="section-heading"><div><p class="eyebrow">Lessons</p><h2>Work through these in order</h2></div></div>
        <ol class="lesson-cards">${section.lessons.map((l) => `
          <li><a href="#/lesson/${l.id}"><span class="lesson-number">${esc(l.id)}</span>
            <span><strong>${esc(l.title)}</strong><small>${esc(l.navSubtitle || l.difficulty || "")}</small></span>
            <span class="pct">${lessonPct(l)}%</span></a></li>`).join("")}
          ${section.review ? `<li><a href="#/review/${section.number}"><span class="lesson-number">★</span><span><strong>Section review</strong><small>Exam traps, challenge exam, practical questions, mastery checklist</small></span><span class="pct"></span></a></li>` : ""}
        </ol></section>
      <footer class="lesson-footer"><p>Source: ${esc(section.source)}</p></footer>`;
    bindCopy(view);
    bindStepChecks(view, `setup-${section.id}`);
  }

  /* Steps: strings or {cmd} / {text}. Commands get a Copy button. */
  function stepsHtml(steps, lessonId) {
    return `<ol class="vm-steps">${steps.map((s, i) => {
      const step = typeof s === "string" ? (looksLikeCommand(s) ? { cmd: s } : { text: s }) : s;
      const body = step.cmd
        ? `${step.note ? `<p>${step.note}</p>` : ""}<div class="cmd-block"><code>${esc(step.cmd)}</code><button type="button" class="copy-btn" data-copy="${esc(step.cmd)}">Copy</button></div>`
        : `<p>${inlineCode(step.text)}</p>`;
      return `<li class="vm-step"><label class="step-check"><input type="checkbox" data-step="${i}"><span class="sr-only">Step ${i + 1} done</span></label><div class="vm-step-body">${body}</div></li>`;
    }).join("")}</ol>`;
  }
  function looksLikeCommand(s) {
    return !/^(Type|Press|If|Use|Exit|Run|Add|Open|Note|Hint|Look|Search|Find|Read|Then|Save|Write)\b/.test(s) && !/\. [A-Z]/.test(s) && !/:\s*$/.test(s);
  }
  /* Highlight commands in prose: anything in `backticks`. */
  function inlineCode(s) { return esc(s).replace(/`([^`]+)`/g, "<code>$1</code>"); }

  function bindCopy(root) {
    $$(".copy-btn", root).forEach((b) => b.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = "Copied"; }
      catch { b.textContent = "Select and copy"; }
      setTimeout(() => (b.textContent = "Copy"), 1400);
    }));
  }
  function bindStepChecks(root, key) {
    const saved = store.lesson(key).steps || [];
    $$("input[data-step]", root).forEach((cb) => {
      cb.checked = saved.includes(cb.dataset.step);
      cb.closest(".vm-step").classList.toggle("done", cb.checked);
      cb.addEventListener("change", () => {
        const cur = new Set(store.lesson(key).steps || []);
        cb.checked ? cur.add(cb.dataset.step) : cur.delete(cb.dataset.step);
        store.setLessonData(key, "steps", [...cur]);
        cb.closest(".vm-step").classList.toggle("done", cb.checked);
      });
    });
  }

  /* ------------------------------------------------------------ lesson page */

  function renderLesson({ section, lesson, index }) {
    renderNav(section, lesson.id);
    $("#reset-progress").hidden = false;
    const prev = section.lessons[index - 1], next = section.lessons[index + 1];
    const t = lesson.ticket || {};
    const hero = `
      <section class="hero" id="mission"><div class="hero-text">
        <p class="eyebrow">Section ${section.number} · Lesson ${index + 1} of ${section.lessons.length}</p>
        <h1>${esc(lesson.title)}</h1>
        ${lesson.summary ? `<p class="hero-copy">${lesson.summary}</p>` : ""}</div>
        <div class="difficulty"><span aria-hidden="true"></span>${esc(lesson.difficulty || "")}</div>
      </section>`;
    const pager = `<nav class="pager-nav" aria-label="Lesson navigation">
        ${prev ? `<a class="button" href="#/lesson/${prev.id}">← ${esc(prev.title)}</a>` : `<a class="button" href="#/section/${section.number}">← Section overview</a>`}
        ${next ? `<a class="button" href="#/lesson/${next.id}">${esc(next.title)} →</a>` : section.review ? `<a class="button" href="#/review/${section.number}">Section review →</a>` : ""}
      </nav>`;
    const quiz = (lesson.quiz || []).length ? `
      <section class="card knowledge-check"><div class="section-heading"><div><p class="eyebrow">Check yourself</p><h2>Explain what you learned</h2></div>
        <span id="quiz-status" class="status-pill"></span></div>
        <div class="quiz-grid">${lesson.quiz.map(quizHtml).join("")}</div></section>` : "";
    const done = `<section class="completion-card" id="completion-card" hidden><span class="completion-icon" aria-hidden="true">✓</span>
        <div><p class="eyebrow">Lesson complete</p><h2>${esc(lesson.completion || "Nice work.")}</h2><p>Your progress is saved in this browser.</p></div>
        ${next ? `<a class="button button-primary" href="#/lesson/${next.id}">Next lesson</a>` : section.review ? `<a class="button button-primary" href="#/review/${section.number}">Section review</a>` : `<a class="button button-primary" href="#/">All sections</a>`}</section>`;

    if (lesson.kind === "vm") view.innerHTML = hero + vmBody(lesson) + quiz + done + pager + footer(section, lesson);
    else view.innerHTML = hero + ticketHtml(t, lesson) + terminalBody(lesson) + quiz + challengeHtml(lesson) + done + pager + footer(section, lesson);

    current = { section, lesson };
    if (lesson.kind === "vm") bindVm(lesson); else bindTerminalLesson(lesson);
    bindQuiz(lesson);
    $("#reset-progress").onclick = () => {
      if (!confirm(`Reset all progress for "${lesson.title}"?`)) return;
      store.resetLesson(lesson.id); route();
    };
    refreshLesson();
  }

  const footer = (section, lesson) => `<footer class="lesson-footer"><p>Adapted from <strong>${esc(section.source)}</strong>${lesson.source ? `, ${esc(lesson.source)}` : ""}.</p>
    ${lesson.kind === "vm" ? "" : "<p>Terminal output is simulated and may differ from your Linux Mint VM.</p>"}</footer>`;

  function ticketHtml(t, lesson) {
    if (!t.body) return "";
    return `<section class="card ticket" aria-labelledby="ticket-title">
      <div class="ticket-header"><div class="ticket-id"><span class="ticket-icon" aria-hidden="true"></span>
        <div><p class="eyebrow">Support ticket</p><h2 id="ticket-title">${esc(t.heading || "Your mission")}</h2></div></div>
        ${t.badge ? `<span class="status-pill pill-accent">${esc(t.badge)}</span>` : ""}</div>
      <dl class="ticket-meta">
        <div><dt>Requested by</dt><dd>${esc(t.requestedBy || "Senior engineer")}</dd></div>
        <div><dt>System</dt><dd>${esc(t.system || "Linux Mint VM")}</dd></div>
        <div><dt>Tool</dt><dd>${(t.tools || []).map((x) => `<code>${esc(x)}</code>`).join(" ")}</dd></div>
      </dl>
      <p class="ticket-body">${t.body}</p>
      ${t.callout ? `<div class="callout callout-${t.callout.kind || "info"}"><span class="callout-icon" aria-hidden="true">${t.callout.kind === "warn" ? "!" : "i"}</span><div><strong>${esc(t.callout.title)}</strong><br>${t.callout.text}</div></div>` : ""}
    </section>`;
  }

  function terminalBody(lesson) {
    const noHints = lesson.noHints;
    return `<section class="workspace-grid" aria-label="Interactive lab workspace">
      <div class="task-column"><section class="tasks-panel">
        <div class="section-heading"><div><p class="eyebrow">${noHints ? "No hints" : "Guided practice"}</p><h2>${esc(lesson.tasksHeading || "Run each command")}</h2></div>
          <span id="task-count" class="status-pill"></span></div>
        <ol class="task-list" id="task-list">${(lesson.tasks || []).map((task, i) => `
          <li class="task" data-task="${esc(task.id)}">
            <button class="task-toggle" type="button" aria-expanded="${i === 0 ? "true" : "false"}">
              <span class="task-check" aria-hidden="true">${i + 1}</span>
              <span class="task-title"><strong>${esc(task.title)}</strong>${task.command && !noHints ? `<small>Run <code>${esc(task.command)}</code></small>` : task.short ? `<small>${task.short}</small>` : ""}</span>
              <span class="task-state"></span><span class="chevron" aria-hidden="true"></span>
            </button>
            <div class="task-detail"${i === 0 ? "" : " hidden"}>
              <p>${task.detail || ""}</p>
              ${task.command && !noHints ? `<button class="command-chip" type="button" data-command="${esc(task.command)}">Type <code>${esc(task.command)}</code> for me</button>` : ""}
            </div>
          </li>`).join("")}</ol>
      </section></div>
      <section class="terminal-panel" aria-label="Simulated Linux terminal">
        <div class="terminal-titlebar"><div class="window-dots" aria-hidden="true"><span></span><span></span><span></span></div>
          <span class="terminal-title" id="terminal-title"></span><button id="clear-terminal" type="button">Clear</button></div>
        <div class="terminal" id="terminal-output" role="log" aria-live="polite" aria-label="Terminal output">
          <p class="terminal-muted">LPIC practice terminal. Type <span class="terminal-command">help</span> for Bash's built-in help, or try the commands in the task list.</p>
        </div>
        <form class="terminal-input-row" id="terminal-form" autocomplete="off">
          <label for="terminal-input" class="prompt" id="terminal-prompt"></label>
          <input id="terminal-input" name="command" type="text" spellcheck="false" autocapitalize="none" autocorrect="off" enterkeyhint="go" aria-describedby="terminal-help">
          <button type="submit" aria-label="Run command">Run <span aria-hidden="true">↵</span></button>
        </form>
        <div class="key-row" aria-label="Terminal keys">
          <button type="button" data-key="up" aria-label="Previous command">↑</button>
          <button type="button" data-key="down" aria-label="Next command">↓</button>
          <button type="button" data-key="!" >!</button>
          <button type="button" data-key="|">|</button>
          <button type="button" data-key="~">~</button>
          <button type="button" data-key="-">-</button>
          <button type="button" data-key=">">&gt;</button>
        </div>
        <p class="sr-only" id="terminal-help">Type a command, then select Run. Up and down recall earlier commands.</p>
        <div class="pager" id="pager" hidden tabindex="-1" role="dialog" aria-label="Manual page viewer">
          <div class="pager-title" id="pager-title"></div>
          <div class="pager-body" id="pager-body"></div>
          <div class="pager-status" id="pager-status"></div>
          <form class="pager-search" id="pager-search" hidden><span>/</span><input id="pager-search-input" type="text" spellcheck="false" autocapitalize="none" autocorrect="off" aria-label="Search for"><button type="submit">Find</button></form>
          <div class="pager-keys">
            <button type="button" data-pk="up" aria-label="Up one line">↑</button>
            <button type="button" data-pk="down" aria-label="Down one line">↓</button>
            <button type="button" data-pk="b" aria-label="Back one screen">b</button>
            <button type="button" data-pk="space" aria-label="Forward one screen">Space</button>
            <button type="button" data-pk="/" aria-label="Search">/</button>
            <button type="button" data-pk="n" aria-label="Next match">n</button>
            <button type="button" data-pk="q" aria-label="Quit">q</button>
          </div>
        </div>
      </section>
    </section>`;
  }

  function quizHtml(q) {
    return `<fieldset class="question" data-question="${esc(q.id)}"><legend>${q.prompt}</legend>
      ${q.options.map((o) => { const opt = typeof o === "string" ? { value: o, label: esc(o) } : o;
        return `<label><input type="radio" name="q-${esc(q.id)}" value="${esc(opt.value)}"> <span>${opt.label}${opt.note ? `<small>${opt.note}</small>` : ""}</span></label>`; }).join("")}
      <p class="feedback" aria-live="polite"></p></fieldset>`;
  }

  function challengeHtml(lesson) {
    const c = lesson.challenge;
    if (!c) return "";
    let form = "";
    if (c.mode === "classify") {
      form = `<div class="classify" id="classify">${c.items.map((it, i) => `
        <div class="classify-row" data-i="${i}"><code>${esc(it.label)}</code>
          <div class="classify-options" role="radiogroup" aria-label="${esc(it.label)}">${c.categories.map((cat) => `<button type="button" role="radio" aria-checked="false" data-cat="${esc(cat)}">${esc(cat)}</button>`).join("")}</div></div>`).join("")}
        <button class="button button-primary" type="button" id="classify-check">Check answers</button></div>`;
    } else {
      form = `<form id="challenge-form" class="challenge-form" autocomplete="off">
        <label class="sr-only" for="challenge-input">Your answer</label>
        <div class="challenge-input-wrap"><span aria-hidden="true">${c.answerPrefix ?? "$"}</span>
          <input id="challenge-input" type="text" spellcheck="false" autocapitalize="none" autocorrect="off" enterkeyhint="done" placeholder="${esc(c.placeholder || "Enter the command")}"></div>
        <button class="button button-primary" type="submit">Check answer</button></form>`;
    }
    return `<section class="card final-challenge" id="challenge"><div class="challenge-copy">
        <div class="section-heading"><div><p class="eyebrow">Final challenge</p><h2>No-hint ticket</h2></div></div>
        <p>${c.prompt}</p>${form}<p id="challenge-feedback" class="feedback" aria-live="polite"></p></div>
      ${lesson.memoryHook ? `<aside class="memory-card callout-hint"><span class="memory-icon" aria-hidden="true">★</span><strong>Exam memory hook</strong><p>${lesson.memoryHook}</p></aside>` : ""}
    </section>`;
  }

  /* ------------------------------------------------------------ terminal lesson behaviour */

  function bindTerminalLesson(lesson) {
    const ws = lesson.workspace || {};
    const shell = new LPIC.Shell({ ...ws, canned: lesson.canned, unsupported: lesson.unsupported });
    current.shell = shell;
    const out = $("#terminal-output"), input = $("#terminal-input");
    let recall = null;

    const updatePrompt = () => {
      $("#terminal-prompt").textContent = shell.prompt();
      $("#terminal-title").textContent = shell.prompt().replace(/\$$/, "");
    };
    const line = (text, cls) => { const p = document.createElement("p"); if (cls) p.className = cls; p.textContent = text; out.append(p); out.scrollTop = out.scrollHeight; };

    const run = (raw) => {
      if (!raw.trim()) return;
      line(`${shell.prompt()} ${raw}`, "terminal-command");
      const res = shell.run(raw);
      if (res.clear) { out.replaceChildren(); }
      res.out.forEach((o) => line(o.text, o.cls));
      updatePrompt();
      grade({ res, shell });
      if (res.pager) openPager(res.pager);
    };

    $("#terminal-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = input.value; input.value = ""; recall = null;
      run(v); input.focus();
    });
    const recallMove = (dir) => {
      const h = shell.history;
      if (!h.length) return;
      recall = recall === null ? (dir < 0 ? h.length - 1 : null) : recall + dir;
      if (recall !== null && recall < 0) recall = 0;
      if (recall !== null && recall >= h.length) recall = null;
      input.value = recall === null ? "" : h[recall];
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    };
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp") { e.preventDefault(); recallMove(-1); }
      if (e.key === "ArrowDown") { e.preventDefault(); recallMove(1); }
      if (e.key === "l" && e.ctrlKey) { e.preventDefault(); out.replaceChildren(); }
    });
    $$(".key-row button").forEach((b) => b.addEventListener("mousedown", (e) => e.preventDefault()));
    $$(".key-row button").forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.key;
      if (k === "up") return recallMove(-1);
      if (k === "down") return recallMove(1);
      const pos = input.selectionStart ?? input.value.length;
      input.value = input.value.slice(0, pos) + k + input.value.slice(pos);
      input.focus(); input.setSelectionRange(pos + 1, pos + 1);
    }));
    $("#clear-terminal").addEventListener("click", () => { out.replaceChildren(); line("Terminal cleared. Your completed tasks are still saved.", "terminal-muted"); input.focus(); });
    $$(".command-chip").forEach((b) => b.addEventListener("click", () => { input.value = b.dataset.command; input.focus(); }));
    $$(".task-toggle").forEach((b) => b.addEventListener("click", () => {
      const ex = b.getAttribute("aria-expanded") === "true";
      b.setAttribute("aria-expanded", String(!ex)); b.nextElementSibling.hidden = ex;
    }));
    bindPager();
    bindChallenge(lesson);
    updatePrompt();
  }

  /* Grade every unfinished task against the latest command or pager event. */
  function grade(ctx) {
    const { lesson } = current;
    let changed = false;
    for (const task of lesson.tasks || []) {
      if (store.isDone(lesson.id, "t:" + task.id)) continue;
      if (passes(task.check, ctx)) {
        store.mark(lesson.id, "t:" + task.id);
        changed = true;
        const el = $(`[data-task="${CSS.escape(task.id)}"]`);
        el?.classList.add("just-completed");
        setTimeout(() => el?.classList.remove("just-completed"), 700);
      }
    }
    if (changed) refreshLesson();
  }

  function passes(check, ctx) {
    if (!check) return false;
    const { res, shell } = ctx;
    const cmd = norm(res?.expanded || "");
    const outText = (res?.out || []).filter((o) => o.cls !== "terminal-error" && o.cls !== "terminal-muted").map((o) => o.text).join("\n");
    switch (check.type) {
      case "command": return !!cmd && (check.accept || []).some((a) => norm(a) === cmd);
      case "pattern": return !!cmd && new RegExp(check.re).test(cmd);
      case "output": return !!res?.expanded && new RegExp(check.re, "m").test(outText) && (!check.cmd || new RegExp(check.cmd).test(cmd));
      case "file": {
        const node = shell.vfs.get(shell.abs(check.path));
        if (check.exists === false) return !node;
        if (!node || node.type !== "file") return false;
        return !check.re || new RegExp(check.re, "im").test(node.content);
      }
      case "history": return (check.includes || []).every((h) => shell.history.some((x) => new RegExp(h).test(norm(x))));
      case "event": return (res?.events || []).some((e) => e.type === check.event && Object.entries(check.match || {}).every(([k, re]) => new RegExp(re, "i").test(String(e[k] ?? ""))));
      case "all": return check.checks.every((c) => passes(c, ctx));
      case "any": return check.checks.some((c) => passes(c, ctx));
      default: return false;
    }
  }

  /* ------------------------------------------------------------ pager (man / info / less) */

  let pagerState = null;
  function openPager(p) {
    const pager = $("#pager");
    $("#pager-title").textContent = p.title;
    const body = $("#pager-body");
    body.replaceChildren(...p.text.split("\n").map((l) => { const d = document.createElement("div"); d.className = "pager-line"; d.textContent = l || " "; return d; }));
    pager.hidden = false;
    pagerState = { ...p, top: 0, term: null };
    body.scrollTop = 0;
    pagerStatus();
    pager.focus();
  }
  function pagerLines() { return $$(".pager-line", $("#pager-body")); }
  function pagerScrollTo(i) {
    const lines = pagerLines();
    pagerState.top = Math.max(0, Math.min(i, lines.length - 1));
    $("#pager-body").scrollTop = lines[pagerState.top].offsetTop - lines[0].offsetTop;
    pagerStatus();
  }
  function pagerPage() { const body = $("#pager-body"); const lh = pagerLines()[0]?.offsetHeight || 18; return Math.max(1, Math.floor(body.clientHeight / lh) - 1); }
  function pagerStatus() {
    const n = pagerLines().length;
    const end = Math.min(n, pagerState.top + pagerPage() + 1);
    $("#pager-status").textContent = `${pagerState.kind === "man" ? `Manual page ${pagerState.page}` : pagerState.title} line ${pagerState.top + 1}-${end}/${n}${end >= n ? " (END)" : ""}   q to quit`;
  }
  function pagerSearch(term, from) {
    const lines = pagerLines();
    let re;
    try { re = new RegExp(term, "i"); } catch { re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"); }
    lines.forEach((l) => l.classList.remove("hit"));
    for (let i = from; i < lines.length; i++) {
      if (re.test(lines[i].textContent)) {
        lines.forEach((l) => l.classList.toggle("hit", re.test(l.textContent)));
        pagerScrollTo(i);
        emitPager({ type: "pager-search", kind: pagerState.kind, page: pagerState.page, term, line: lines[i].textContent });
        return;
      }
    }
    $("#pager-status").textContent = "Pattern not found  (press any key)";
  }
  function emitPager(ev) { if (current?.shell) grade({ res: { events: [ev], out: [] }, shell: current.shell }); }
  function closePager() {
    $("#pager").hidden = true;
    emitPager({ type: "pager-quit", kind: pagerState.kind, page: pagerState.page });
    pagerState = null;
    $("#terminal-input").focus();
  }
  function pagerKey(k) {
    if (!pagerState) return;
    const page = pagerPage();
    if (k === "q") return closePager();
    if (k === "down") pagerScrollTo(pagerState.top + 1);
    if (k === "up") pagerScrollTo(pagerState.top - 1);
    if (k === "space") pagerScrollTo(pagerState.top + page);
    if (k === "b") pagerScrollTo(pagerState.top - page);
    if (k === "g") pagerScrollTo(0);
    if (k === "G") pagerScrollTo(pagerLines().length - 1);
    if (k === "/") { const f = $("#pager-search"); f.hidden = false; $("#pager-search-input").value = ""; $("#pager-search-input").focus(); }
    if (k === "n" && pagerState.term) pagerSearch(pagerState.term, pagerState.top + 1);
    if (["down", "up", "space", "b", "g", "G"].includes(k)) emitPager({ type: "pager-move", kind: pagerState.kind, page: pagerState.page, top: pagerState.top });
  }
  function bindPager() {
    const pager = $("#pager");
    pager.addEventListener("keydown", (e) => {
      if (e.target.id === "pager-search-input") { if (e.key === "Escape") { $("#pager-search").hidden = true; pager.focus(); } return; }
      const map = { ArrowDown: "down", j: "down", Enter: "down", ArrowUp: "up", k: "up", " ": "space", PageDown: "space", f: "space", b: "b", PageUp: "b", g: "g", G: "G", Home: "g", End: "G", "/": "/", n: "n", q: "q", Q: "q" };
      if (map[e.key]) { e.preventDefault(); pagerKey(map[e.key]); }
    });
    $$("[data-pk]", pager).forEach((b) => b.addEventListener("click", () => { pagerKey(b.dataset.pk); if (b.dataset.pk !== "/" && pagerState) pager.focus(); }));
    $("#pager-search").addEventListener("submit", (e) => {
      e.preventDefault();
      const term = $("#pager-search-input").value.trim();
      $("#pager-search").hidden = true; pager.focus();
      if (term) { pagerState.term = term; pagerSearch(term, pagerState.top); }
    });
    $("#pager-body").addEventListener("scroll", () => {
      if (!pagerState) return;
      const lines = pagerLines(), body = $("#pager-body");
      const lh = lines[0]?.offsetHeight || 18;
      pagerState.top = Math.round(body.scrollTop / lh);
      pagerStatus();
    }, { passive: true });
  }

  /* ------------------------------------------------------------ quiz + challenge */

  function bindQuiz(lesson) {
    for (const q of lesson.quiz || []) {
      const fs = $(`.question[data-question="${CSS.escape(q.id)}"]`);
      if (!fs) continue;
      $$("input", fs).forEach((input) => input.addEventListener("change", () => {
        const ok = input.value === q.answer;
        showFeedback(fs, ok, ok ? (q.explain || "Correct.") : (q.wrong || "Not quite. Think about what each option does, then try again."));
        if (!store.isDone(lesson.id, "q:" + q.id)) store.attempt(q.id, q.tags?.objective || lesson.objective, ok);
        if (ok && store.mark(lesson.id, "q:" + q.id)) refreshLesson();
      }));
      if (store.isDone(lesson.id, "q:" + q.id)) {
        const inp = $$("input", fs).find((i) => i.value === q.answer);
        if (inp) inp.checked = true;
        showFeedback(fs, true, q.explain || "Correct.");
      }
    }
  }
  function showFeedback(root, ok, text) {
    const fb = $(".feedback", root);
    fb.className = `feedback ${ok ? "correct" : "incorrect"}`;
    fb.textContent = text;
  }

  function bindChallenge(lesson) {
    const c = lesson.challenge;
    if (!c) return;
    const fb = $("#challenge-feedback");
    const finish = (ok) => {
      fb.className = `feedback ${ok ? "correct" : "incorrect"}`;
      fb.textContent = ok ? c.correct : c.incorrect;
      store.attempt(lesson.id + ":challenge", lesson.objective, ok);
      if (ok && store.mark(lesson.id, "c")) refreshLesson();
    };
    if (c.mode === "classify") {
      $$(".classify-options button").forEach((b) => b.addEventListener("click", () => {
        $$("button", b.parentElement).forEach((x) => x.setAttribute("aria-checked", String(x === b)));
      }));
      $("#classify-check").addEventListener("click", () => {
        let ok = true;
        $$(".classify-row").forEach((row) => {
          const it = c.items[row.dataset.i];
          const pick = $('button[aria-checked="true"]', row)?.dataset.cat;
          row.classList.toggle("right", pick === it.answer);
          row.classList.toggle("wrong", pick !== it.answer);
          if (pick !== it.answer) ok = false;
        });
        finish(ok);
      });
      if (store.isDone(lesson.id, "c")) {
        $$(".classify-row").forEach((row) => { const it = c.items[row.dataset.i]; $$("button", row).forEach((x) => x.setAttribute("aria-checked", String(x.dataset.cat === it.answer))); row.classList.add("right"); });
        fb.className = "feedback correct"; fb.textContent = c.correct;
      }
      return;
    }
    $("#challenge-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = norm($("#challenge-input").value);
      const ok = (c.check.accept || []).some((a) => norm(a) === v) || (c.check.re ? new RegExp(c.check.re).test(v) : false);
      finish(ok);
    });
    if (store.isDone(lesson.id, "c")) { fb.className = "feedback correct"; fb.textContent = c.correct; }
  }

  /* ------------------------------------------------------------ VM lessons */

  function vmBody(l) {
    return `
      <section class="card ticket" aria-labelledby="ticket-title">
        <div class="ticket-header"><div class="ticket-id"><span class="ticket-icon" aria-hidden="true"></span>
          <div><p class="eyebrow">Change request</p><h2 id="ticket-title">Your mission</h2></div></div>
          <span class="status-pill pill-accent">Linux Mint VM</span></div>
        <p class="ticket-body">${inlineCode(l.scenario)}</p>
        <dl class="ticket-meta two">
          <div><dt>Task</dt><dd>${inlineCode(l.task)}</dd></div>
          <div><dt>Deliverable</dt><dd><code>${esc(l.deliverable)}</code></dd></div>
        </dl>
        <div class="callout callout-info"><span class="callout-icon" aria-hidden="true">i</span><div><strong>Run this on your VM</strong><br>
          Work in <code>${esc(l.workdir || "~")}</code> and use the device variables from the section's Lab Setup. Tick each step as you go.</div></div>
      </section>
      <section class="card"><div class="section-heading"><div><p class="eyebrow">Steps</p><h2>Suggested commands and keys</h2></div></div>
        ${stepsHtml(l.steps, l.id)}</section>
      <section class="card" id="validate"><div class="section-heading"><div><p class="eyebrow">Prove it</p><h2>Check your result</h2></div>
          <span class="status-pill" id="paste-status"></span></div>
        <p>${inlineCode(l.validation)}</p>
        ${l.paste ? `<label class="paste-label" for="paste-box">Run <code>${esc(l.paste.command)}</code> on your VM and paste the output here:</label>
          <textarea id="paste-box" class="paste-box" rows="7" spellcheck="false" autocapitalize="none" autocorrect="off" placeholder="Paste output here"></textarea>
          <div class="button-row"><button class="button button-primary" type="button" id="paste-check">Check output</button>
          <button class="button button-ghost" type="button" id="self-check">I checked it myself</button></div>
          <ul class="check-list" id="check-list"></ul>` :
          `<div class="button-row"><button class="button button-primary" type="button" id="self-check">I checked it on my VM</button></div>`}
        <p class="feedback" id="paste-feedback" aria-live="polite"></p>
      </section>
      <aside class="memory-card callout-hint wide"><span class="memory-icon" aria-hidden="true">!</span><strong>Real-world trap</strong><p>${inlineCode(l.trap)}</p></aside>`;
  }

  function bindVm(l) {
    bindCopy(view);
    bindStepChecks(view, l.id);
    const fb = $("#paste-feedback");
    if (l.paste) {
      const saved = store.lesson(l.id).pasted;
      if (saved) $("#paste-box").value = saved;
      $("#paste-check").onclick = () => {
        const text = $("#paste-box").value;
        store.setLessonData(l.id, "pasted", text.slice(0, 20000));
        const results = l.paste.checks.map((c) => {
          const re = new RegExp(c.re, "gim");
          const n = (text.match(re) || []).length;
          const ok = c.min !== undefined ? n >= c.min : c.count !== undefined ? n === c.count : c.absent ? n === 0 : n > 0;
          return { ok, say: c.say, n };
        });
        $("#check-list").innerHTML = results.map((r) => `<li class="${r.ok ? "ok" : "bad"}">${r.ok ? "✓" : "✗"} ${esc(r.say)}</li>`).join("");
        const ok = results.every((r) => r.ok);
        fb.className = `feedback ${ok ? "correct" : "incorrect"}`;
        fb.textContent = ok ? "That output proves the lab worked." : "Not there yet. Compare your output with the items marked ✗, fix the lab, and paste again.";
        store.attempt(l.id + ":paste", l.objective, ok);
        if (ok) { store.setLessonData(l.id, "how", "pasted"); if (store.mark(l.id, "p")) refreshLesson(); }
      };
    }
    $("#self-check").onclick = () => {
      if (!confirm("Mark this lab as checked on your VM? Use this when you can't paste the output, for example on your iPhone after doing the lab earlier.")) return;
      store.setLessonData(l.id, "how", "self");
      if (store.mark(l.id, "p")) refreshLesson();
      fb.className = "feedback correct"; fb.textContent = "Marked as checked on your VM.";
    };
  }

  /* ------------------------------------------------------------ lesson progress display */

  function refreshLesson() {
    if (!current) return;
    const { lesson, section } = current;
    const items = lessonItems(lesson);
    const done = items.filter((i) => store.isDone(lesson.id, i)).length;
    const pct = items.length ? Math.round((done / items.length) * 100) : 0;
    setTopProgress("Lesson progress", pct, `${done} of ${items.length} ${items.length === 1 ? "item" : "items"}`);

    let assigned = false;
    $$(".task").forEach((el) => {
      const isDone = store.isDone(lesson.id, "t:" + el.dataset.task);
      const isCur = !isDone && !assigned;
      if (isCur) assigned = true;
      el.classList.toggle("completed", isDone);
      el.classList.toggle("current", isCur);
      const st = $(".task-state", el);
      if (st) st.textContent = isDone ? "Done" : isCur ? "Up next" : "Not started";
    });
    const tasks = lesson.tasks || [];
    if ($("#task-count")) $("#task-count").textContent = `${tasks.filter((t) => store.isDone(lesson.id, "t:" + t.id)).length} / ${tasks.length} complete`;
    const quiz = lesson.quiz || [];
    if ($("#quiz-status")) $("#quiz-status").textContent = `${quiz.filter((q) => store.isDone(lesson.id, "q:" + q.id)).length} / ${quiz.length} correct`;
    if ($("#paste-status")) {
      const how = store.lesson(lesson.id).how;
      $("#paste-status").textContent = store.isDone(lesson.id, "p") ? (how === "self" ? "Checked on VM" : "Output verified") : "Not checked yet";
      $("#paste-status").classList.toggle("pill-ok", store.isDone(lesson.id, "p"));
    }
    $("#completion-card").hidden = done !== items.length;
    // Update the nav meter for this lesson.
    $$(".lesson-link").forEach((a) => {
      const id = a.getAttribute("href").replace("#/lesson/", "");
      const l = section.lessons.find((x) => x.id === id);
      const m = $(".lesson-meter span", a);
      if (l && m) m.style.width = lessonPct(l) + "%";
    });
  }

  /* ------------------------------------------------------------ section review */

  function renderReview(section) {
    renderNav(section, "review");
    const r = section.review;
    const sid = section.id;
    const count = (prefix, n) => Array.from({ length: n }, (_, i) => prefix + i).filter((k) => store.reviewItem(sid, k)).length;
    const masteryPct = r.mastery?.length ? Math.round((count("m", r.mastery.length) / r.mastery.length) * 100) : 0;
    setTopProgress("Mastery checklist", masteryPct, `${count("m", r.mastery?.length || 0)} of ${r.mastery?.length || 0} skills`);
    view.innerHTML = `
      <section class="hero"><div class="hero-text"><p class="eyebrow">Section ${section.number} · Review</p>
        <h1>${esc(section.title)}: section review</h1>
        <p class="hero-copy">Do these after the lessons. They are closer to the exam: no hints, mixed topics, and traps that catch people.</p></div></section>
      ${r.trapQuiz?.length ? `<section class="card knowledge-check"><div class="section-heading"><div><p class="eyebrow">Common exam traps</p><h2>Trap quiz</h2></div><span class="status-pill" id="trap-status"></span></div>
        <div class="quiz-grid one">${r.trapQuiz.map(quizHtml).join("")}</div></section>` : ""}
      ${r.traps?.length ? `<section class="card"><div class="section-heading"><div><p class="eyebrow">Read before the exam</p><h2>${r.trapQuiz?.length ? "All the traps" : "Common exam traps"}</h2></div></div>
        <ul class="trap-list">${r.traps.map((t) => `<li>${inlineCode(t)}</li>`).join("")}</ul></section>` : ""}
      ${r.challenge ? `<section class="card"><div class="section-heading"><div><p class="eyebrow">No notes</p><h2>Scenario-based challenge exam</h2></div><span class="status-pill" id="ch-status"></span></div>
        <p>${inlineCode(r.challenge.intro)}</p>
        <ol class="check-items">${r.challenge.tasks.map((t, i) => checkItem(sid, "c" + i, t)).join("")}</ol>
        ${r.challenge.outro ? `<p class="muted">${inlineCode(r.challenge.outro)}</p>` : ""}</section>` : ""}
      ${r.questions?.length ? `<section class="card"><div class="section-heading"><div><p class="eyebrow">Explain it like a pro</p><h2>LPIC-style practical questions</h2></div></div>
        <p class="muted">Answer out loud or in your notes first, then open the model answer.</p>
        <div class="qa-list">${r.questions.map((q) => `<details class="qa"><summary>${inlineCode(q.q)}</summary><div>${q.a}</div></details>`).join("")}</div></section>` : ""}
      ${r.mastery?.length ? `<section class="card"><div class="section-heading"><div><p class="eyebrow">Be honest</p><h2>Mastery checklist</h2></div></div>
        <ul class="check-items">${r.mastery.map((t, i) => checkItem(sid, "m" + i, t)).join("")}</ul></section>` : ""}
      <div class="button-row"><button class="button button-ghost" type="button" id="reset-review">Reset this review</button></div>
      <footer class="lesson-footer"><p>Adapted from <strong>${esc(section.source)}</strong>.</p></footer>`;

    $$(".check-items input").forEach((cb) => cb.addEventListener("change", () => {
      store.markReview(sid, cb.dataset.k, cb.checked);
      cb.closest("li").classList.toggle("done", cb.checked);
      reviewCounts();
    }));
    // Trap quiz uses the lesson store under a pseudo lesson id.
    const pseudo = { id: sid + ":review", quiz: r.trapQuiz || [], objective: section.objectives[0] };
    current = null;
    bindQuiz(pseudo);
    $$(".question input", view).forEach((i) => i.addEventListener("change", reviewCounts));
    $("#reset-review").onclick = () => {
      if (!confirm("Clear the trap quiz, challenge and checklist ticks for this section?")) return;
      store.resetReview(sid); store.resetLesson(sid + ":review"); renderReview(section);
    };
    function reviewCounts() {
      if ($("#trap-status")) $("#trap-status").textContent = `${(r.trapQuiz || []).filter((q) => store.isDone(sid + ":review", "q:" + q.id)).length} / ${r.trapQuiz.length} correct`;
      if ($("#ch-status")) $("#ch-status").textContent = `${count("c", r.challenge.tasks.length)} / ${r.challenge.tasks.length} done`;
      const m = r.mastery?.length || 0;
      const pct = m ? Math.round((count("m", m) / m) * 100) : 0;
      setTopProgress("Mastery checklist", pct, `${count("m", m)} of ${m} skills`);
    }
    reviewCounts();
  }
  function checkItem(sid, k, text) {
    const on = store.reviewItem(sid, k);
    return `<li class="${on ? "done" : ""}"><label><input type="checkbox" data-k="${k}"${on ? " checked" : ""}><span>${inlineCode(text)}</span></label></li>`;
  }

  /* ------------------------------------------------------------ start */

  window.addEventListener("hashchange", route);
  route();
})();
