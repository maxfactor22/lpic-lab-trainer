/* Processes, job control, signals, priorities, top, watch, tmux and screen (Section 11: 103.5, 103.6).

   Every shell gets a process table: the usual Linux Mint system processes plus whatever you start.
   Time follows the real clock, and a foreground "sleep N" moves the clock N seconds ahead instead
   of waiting, so jobs that should have finished by then have finished.

   A "context" is one interactive Bash: the terminal itself, a nested "bash", a tmux pane or a
   screen window. Each has its own jobs table, foreground job and terminal (pts/N). */
(function () {
  "use strict";
  const Shell = LPIC.Shell, C = Shell.commands, SH = Shell.prototype;
  const esc = LPIC.esc || ((s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])));

  const MEM_KB = 4010086;    // 3916.1 MiB
  const NCPU = 2;
  const UP0 = 2 * 3600 + 14 * 60; // the VM has been up 2:14 when a lesson opens
  const FG_INSTANT = 10;     // foreground sleeps up to this many seconds just move the clock on

  /* ------------------------------------------------------------------ signals */
  const SIG = ["0", "HUP", "INT", "QUIT", "ILL", "TRAP", "ABRT", "BUS", "FPE", "KILL", "USR1", "SEGV", "USR2", "PIPE", "ALRM", "TERM",
    "STKFLT", "CHLD", "CONT", "STOP", "TSTP", "TTIN", "TTOU", "URG", "XCPU", "XFSZ", "VTALRM", "PROF", "WINCH", "IO", "PWR", "SYS"];
  const sigName = (n) => (n <= 31 ? SIG[n] : n === 34 ? "RTMIN" : n === 64 ? "RTMAX" : n < 50 ? "RTMIN+" + (n - 34) : "RTMAX-" + (64 - n));
  function sigNum(s) {
    if (s === undefined || s === null) return null;
    s = String(s).toUpperCase().replace(/^SIG/, "");
    if (/^\d+$/.test(s)) { const n = +s; return n <= 64 && n !== 32 && n !== 33 ? n : null; }
    const i = SIG.indexOf(s);
    if (i > 0) return i;
    if (s === "RTMIN") return 34;
    if (s === "RTMAX") return 64;
    let m;
    if ((m = s.match(/^RTMIN\+(\d+)$/))) return 34 + +m[1];
    if ((m = s.match(/^RTMAX-(\d+)$/))) return 64 - +m[1];
    return { CLD: 17, POLL: 29, IOT: 6 }[s] ?? null;
  }
  const DEATH = { 1: "Hangup", 2: "Interrupt", 3: "Quit", 4: "Illegal instruction", 6: "Aborted", 9: "Killed", 10: "User defined signal 1",
    11: "Segmentation fault", 12: "User defined signal 2", 13: "Broken pipe", 14: "Alarm clock", 15: "Terminated" };
  const STOPS = new Set([19, 20, 21, 22]);
  const HARMLESS = new Set([17, 23, 28]); // CHLD, URG and WINCH are ignored unless caught

  const UIDS = { root: 0, messagebus: 102, syslog: 104, avahi: 105, "systemd-resolve": 991, "systemd-timesync": 992, nobody: 65534 };
  const uidOf = (u) => UIDS[u] ?? 1000;
  const actor = (sh) => sh.vfs.actor || sh.user;

  /* ------------------------------------------------------------------ the system's own processes */
  // pid, ppid, user, stat, tty, RSS kB, VSZ kB, CPU seconds so far, %CPU now, command line
  const SYSTEM = [
    [1, 0, "root", "Ss", "?", 12960, 168056, 2.1, 0, "/sbin/init splash"],
    [2, 0, "root", "S", "?", 0, 0, 0, 0, "[kthreadd]"],
    [3, 2, "root", "I<", "?", 0, 0, 0, 0, "[rcu_gp]"],
    [14, 2, "root", "S", "?", 0, 0, 0.3, 0, "[ksoftirqd/0]"],
    [61, 2, "root", "S", "?", 0, 0, 0.1, 0, "[kswapd0]"],
    [118, 2, "root", "I", "?", 0, 0, 0.4, 0, "[kworker/0:2-events]"],
    [312, 1, "root", "S<s", "?", 31104, 64720, 0.6, 0, "/usr/lib/systemd/systemd-journald"],
    [355, 1, "root", "Ss", "?", 7424, 27360, 0.4, 0, "/usr/lib/systemd/systemd-udevd"],
    [612, 1, "systemd-resolve", "Ss", "?", 13184, 21772, 0.2, 0, "/usr/lib/systemd/systemd-resolved"],
    [613, 1, "systemd-timesync", "Ssl", "?", 7168, 90936, 0.1, 0, "/usr/lib/systemd/systemd-timesyncd"],
    [640, 1, "messagebus", "Ss", "?", 5632, 10544, 0.9, 0, "@dbus-daemon --system --address=systemd: --nofork --nopidfile --systemd-activation --syslog-only"],
    [645, 1, "root", "Ssl", "?", 21888, 335220, 1.2, 0, "/usr/sbin/NetworkManager --no-daemon"],
    [650, 1, "syslog", "Ssl", "?", 6016, 222508, 0.2, 0, "/usr/sbin/rsyslogd -n -iNONE"],
    [655, 1, "avahi", "Ss", "?", 3968, 8640, 0.1, 0, "avahi-daemon: running [linux-mint.local]"],
    [690, 1, "root", "Ss", "?", 2816, 8520, 0, 0, "/usr/sbin/cron -f -P"],
    [720, 1, "root", "SLsl", "?", 8576, 249272, 0.1, 0, "/usr/sbin/lightdm"],
    [735, 720, "root", "Ssl+", "tty7", 98304, 1037476, 41.5, 0.7, "/usr/lib/xorg/Xorg -core :0 -seat seat0 -auth /var/run/lightdm/root/:0 -nolisten tcp vt7 -novtswitch"],
    [1150, 1, "root", "Ss", "?", 1792, 2800, 0, 0, "/bin/sh /usr/lib/apt/apt.systemd.daily update"],
    [1172, 1150, "root", "S", "?", 1920, 8264, 0, 0, "sleep 1714"],
    [1490, 1, "max", "Ss", "?", 10624, 18900, 0.3, 0, "/usr/lib/systemd/systemd --user"],
    [1520, 720, "max", "Ssl", "?", 17920, 309612, 0.2, 0, "cinnamon-session --session cinnamon"],
    [1610, 1520, "max", "Sl", "?", 291840, 4823408, 62.3, 1.3, "cinnamon --replace"],
    [1650, 1520, "max", "Sl", "?", 89344, 1214560, 3.1, 0, "nemo-desktop"],
    [1702, 1490, "max", "Ssl", "?", 54272, 641224, 6.8, 0.3, "/usr/libexec/gnome-terminal-server"],
    [1705, 1520, "max", "Sl", "?", 412160, 11624312, 95.4, 0.3, "/usr/lib/firefox/firefox"],
  ];

  /* ------------------------------------------------------------------ clock and process table */
  const P = (sh) => sh.proc;
  const now = (p) => (Date.now() - p.t0) / 1000 + p.offset;
  const wallDate = (p, sec) => new Date(p.t0 + sec * 1000);
  const two = (n) => String(n).padStart(2, "0");
  const hms = (d) => `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`;
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const ctime = (d) => `${DAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2)} ${hms(d)} ${d.getFullYear()}`;

  function commOf(args) {
    if (/^\[.*\]$/.test(args)) return args.slice(1, -1);
    if (args.startsWith("/sbin/init")) return "systemd"; // /sbin/init is a link to systemd
    return args.split(" ")[0].replace(/^@/, "").replace(/:$/, "").split("/").pop();
  }

  function addProc(sh, o) {
    const p = P(sh);
    const t = now(p);
    const proc = {
      pid: o.pid ?? p.next++, ppid: o.ppid ?? 1, user: o.user, tty: o.tty ?? "?", args: o.args,
      comm: (o.comm || commOf(o.args)).slice(0, 15), rss: o.rss ?? 1920, vsz: o.vsz ?? 8264,
      cpu0: o.cpu0 || 0, pct: o.pct || 0, sysPct: o.sysPct || 0, start: o.start ?? t, end: o.end ?? Infinity,
      ni: o.ni || 0, sys: !!o.sys, stat: o.stat || null, state: o.state || (o.pct ? "R" : "S"),
      ign: new Set(o.ign || []), trap: o.trap || null, nohup: !!o.nohup, ctx: o.ctx || null,
      kind: o.kind || "job", app: o.app || null, acc: 0, runFrom: t, remaining: 0, pending: null,
    };
    if (proc.nohup) proc.ign.add(1);
    p.procs.set(proc.pid, proc);
    return proc;
  }
  const cpuTime = (p, proc) => proc.cpu0 + proc.acc + (proc.state === "R" ? Math.max(0, now(p) - proc.runFrom) * proc.pct : 0);

  function stopProc(p, proc) {
    if (proc.state === "T") return;
    const t = now(p);
    if (proc.state === "R") proc.acc += Math.max(0, t - proc.runFrom) * proc.pct;
    proc.remaining = proc.end - t;
    proc.state = "T";
  }
  function contProc(sh, proc) {
    const p = P(sh);
    if (proc.state !== "T") return;
    const t = now(p);
    proc.end = t + proc.remaining;
    proc.runFrom = t;
    proc.state = proc.pct ? "R" : "S";
    if (proc.pending) { const s = proc.pending; proc.pending = null; deliver(sh, proc, s, { asRoot: true }); }
  }

  /* ------------------------------------------------------------------ contexts (interactive shells) and jobs */
  function newCtx(sh, o) {
    const p = P(sh);
    const ctx = { id: ++p.ctxSeq, kind: o.kind, tty: o.tty, parent: o.parent || null, jobs: [], order: [], fg: null, app: null, warned: false };
    const bash = addProc(sh, { pid: o.pid, ppid: o.ppid ?? (o.parent ? o.parent.pid : 1), user: o.user || sh.user, tty: o.tty, args: o.args || "bash",
      comm: "bash", rss: 5376, vsz: 11372, kind: "bash", ctx, start: o.start, cpu0: 0.1 });
    ctx.pid = bash.pid;
    p.ctxs.push(ctx);
    return ctx;
  }
  const liveJobs = (ctx) => ctx.jobs;
  function touchJob(ctx, job) { ctx.order = ctx.order.filter((n) => n !== job.num); ctx.order.push(job.num); }
  function marks(ctx) {
    const nums = ctx.order.filter((n) => ctx.jobs.some((j) => j.num === n));
    return { cur: nums[nums.length - 1], prev: nums[nums.length - 2] };
  }
  function addJob(ctx, proc, text, state, amp) {
    const num = ctx.jobs.length ? Math.max(...ctx.jobs.map((j) => j.num)) + 1 : 1;
    const job = { num, pid: proc.pid, text, state, amp, notify: false };
    ctx.jobs.push(job);
    touchJob(ctx, job);
    return job;
  }
  const finished = (job) => !/^(Running|Stopped)/.test(job.state);
  function fmtJob(ctx, job, long) {
    const { cur, prev } = marks(ctx);
    const mark = job.num === cur ? "+" : job.num === prev ? "-" : " ";
    const amp = job.amp && job.state === "Running" ? " &" : "";
    return `[${job.num}]${mark}${long ? " " + String(job.pid).padStart(5) + " " : "  "}${job.state.padEnd(24)}${job.text}${amp}`;
  }
  function removeJob(ctx, job) { ctx.jobs = ctx.jobs.filter((j) => j !== job); ctx.order = ctx.order.filter((n) => n !== job.num); }
  const jobOf = (proc) => (proc.ctx ? proc.ctx.jobs.find((j) => j.pid === proc.pid) : null);

  function resolveJob(ctx, spec) {
    const { cur, prev } = marks(ctx);
    if (spec === undefined || spec === "%" || spec === "%%" || spec === "%+") return ctx.jobs.find((j) => j.num === cur) || null;
    if (spec === "%-") return ctx.jobs.find((j) => j.num === prev) || null;
    let m;
    if ((m = spec.match(/^%?(\d+)$/))) return ctx.jobs.find((j) => j.num === +m[1]) || null;
    if ((m = spec.match(/^%\?(.+)$/))) return ctx.jobs.find((j) => j.text.includes(m[1])) || null;
    if ((m = spec.match(/^%(.+)$/))) return ctx.jobs.find((j) => j.text.startsWith(m[1])) || null;
    return null;
  }

  /* A process ends: take it out of the table and tell its job (the shell prints the news later). */
  function endProc(sh, proc, how) {
    const p = P(sh);
    if (!p.procs.has(proc.pid)) return;
    p.procs.delete(proc.pid);
    const ctx = proc.ctx;
    if (!ctx) return;
    if (ctx.app && ctx.app.proc === proc) ctx.app = null;
    const job = jobOf(proc);
    if (ctx.fg && ctx.fg.proc === proc) {
      ctx.fg = null;
      if (job) removeJob(ctx, job); // a foreground job that ends just gives the prompt back
      if (how !== "Done" && how !== "Interrupt" && ctx === p.ctx) p.outbox.push({ text: how });
      return;
    }
    if (job) { job.state = how; job.notify = true; }
  }

  /* Send a signal. Returns an error string, or null if it was delivered. */
  function deliver(sh, proc, sig, o = {}) {
    const p = P(sh);
    const me = o.asRoot ? "root" : actor(sh);
    if (me !== "root" && proc.user !== me) return "Operation not permitted";
    if (sig === 0) return null;
    if (proc.kind === "bash") return bashSignal(sh, proc, sig);
    if (proc.kind === "tmux-server" || proc.kind === "screen-server") { if ([1, 2, 9, 15].includes(sig)) killMuxServer(sh, proc); return null; }
    if (proc.kind === "mux-client") return null;
    if (proc.sys && proc.comm !== "sleep") return null; // system services in the practice VM shrug signals off
    if (sig === 9) { endProc(sh, proc, "Killed"); return null; }
    const job = jobOf(proc);
    if (STOPS.has(sig)) {
      stopProc(p, proc);
      if (proc.ctx && proc.ctx.fg && proc.ctx.fg.proc === proc) {
        // A stopped foreground job becomes a numbered job and the prompt comes back.
        const ctx = proc.ctx, f = ctx.fg;
        const j = f.job || addJob(ctx, proc, f.text, "Stopped", false);
        ctx.fg = null;
        if (ctx.app && ctx.app.proc === proc) ctx.app = null;
        j.state = sig === 20 ? "Stopped" : "Stopped (signal)"; j.notify = true; touchJob(ctx, j);
      } else if (job) { job.state = sig === 19 ? "Stopped (signal)" : sig === 20 ? "Stopped" : sig === 21 ? "Stopped (tty input)" : "Stopped (tty output)"; job.notify = true; touchJob(proc.ctx, job); }
      return null;
    }
    if (sig === 18) { contProc(sh, proc); if (job && job.state.startsWith("Stopped")) { job.state = "Running"; job.amp = true; } return null; }
    if (HARMLESS.has(sig)) return null;
    if (proc.ign.has(sig)) {
      if (proc.trap && sig === 15 && proc.tty === p.ctx.tty) p.outbox.push({ text: proc.trap });
      return null;
    }
    if (proc.state === "T" && !o.contAfter) { proc.pending = sig; return null; }
    endProc(sh, proc, DEATH[sig] || "Terminated");
    return null;
  }

  /* An interactive Bash ignores TERM, INT and QUIT. HUP or KILL closes it. */
  function bashSignal(sh, proc, sig) {
    const p = P(sh), ctx = proc.ctx;
    if (sig !== 1 && sig !== 9) return null;
    if (ctx.kind === "base") { p.outbox.push({ text: "(The practice terminal can't be closed. Start a second shell with bash, then close that one.)", cls: "terminal-muted" }); return null; }
    const current = p.ctx === ctx || isInside(p.ctx, ctx);
    closeCtx(sh, ctx, sig);
    if (ctx.kind === "nested") {
      if (current) { p.ctx = ctx.parent; p.outbox.push({ text: sig === 1 ? "Hangup" : "Killed" }); }
    } else if (ctx.kind === "pane") tmuxPaneGone(sh, ctx);
    else if (ctx.kind === "window") screenWindowGone(sh, ctx);
    return null;
  }
  const isInside = (c, outer) => { for (let x = c; x; x = x.parent) if (x === outer) return true; return false; };

  /* The shell in ctx ends. With HUP (a closed window), it passes HUP on to its jobs, so only jobs
     that ignore HUP (nohup) survive. With "exit" or KILL, running jobs carry on as orphans. */
  function closeCtx(sh, ctx, how) {
    const p = P(sh);
    for (const c of p.ctxs.filter((x) => x.parent === ctx)) closeCtx(sh, c, how); // nested shells first
    const procs = [...p.procs.values()].filter((x) => x.ctx === ctx && x.kind !== "bash");
    for (const proc of procs) {
      // Stopped jobs get HUP and CONT when their shell exits; a killed shell can't pass anything on.
      const dies = how !== 9 && ((how === 1 && !proc.ign.has(1)) || proc.state === "T");
      proc.ctx = null;
      if (dies) { p.procs.delete(proc.pid); continue; }
      proc.ppid = 1; // orphaned: init adopts it and it keeps running
    }
    p.procs.delete(ctx.pid);
    p.ctxs = p.ctxs.filter((x) => x !== ctx);
    ctx.closed = true;
  }

  function refresh(sh) {
    const p = P(sh);
    if (!p) return;
    const t = now(p);
    for (const proc of [...p.procs.values()]) if (!proc.sys && proc.state !== "T" && t >= proc.end) endProc(sh, proc, "Done");
    // /proc/loadavg follows the running processes.
    const prev = sh.vfs.actor;
    sh.vfs.actor = null;
    try {
      const la = loadavg(p);
      const running = [...p.procs.values()].filter((x) => x.state === "R" && !x.sys).length + 1;
      sh.vfs.write("/proc/loadavg", `${la.join(" ")} ${running}/${480 + p.procs.size} ${p.next - 1}\n`);
      sh.vfs.write("/proc/uptime", `${(UP0 + t).toFixed(2)} ${((UP0 + t) * 1.9).toFixed(2)}\n`);
    } finally { sh.vfs.actor = prev; }
  }
  function loadavg(p) {
    const t = now(p);
    let a = 0.18, b = 0.21, c = 0.17;
    for (const x of p.procs.values()) {
      if (x.sys || x.state !== "R") continue;
      const age = Math.max(0, t - x.runFrom);
      a += x.pct * (1 - Math.exp(-age / 60)); b += x.pct * (1 - Math.exp(-age / 300)); c += x.pct * (1 - Math.exp(-age / 900));
    }
    return [a, b, c].map((v) => v.toFixed(2));
  }

  function pushNotices(sh, ctx, res) {
    const lines = [];
    for (const job of [...ctx.jobs].sort((x, y) => x.num - y.num)) {
      if (!job.notify) continue;
      job.notify = false;
      lines.push(fmtJob(ctx, job));
    }
    ctx.jobs.filter(finished).forEach((j) => removeJob(ctx, j));
    res.out.push(...lines.map((text) => ({ text })));
  }

  /* ------------------------------------------------------------------ set-up and shell hooks */
  LPIC.shellInit = LPIC.shellInit || [];
  LPIC.shellInit.push((sh) => {
    const p = sh.proc = { t0: Date.now(), offset: 0, procs: new Map(), next: 3301, ctxs: [], ctxSeq: 0, outbox: [], pts: 1,
      tmux: null, screen: null, attached: null, awaitKey: null, ask: null };
    for (const [pid, ppid, user, stat, tty, rss, vsz, cpu, pct, args] of SYSTEM) {
      addProc(sh, { pid, ppid, user: user === "max" ? sh.user : user, stat, tty, rss, vsz, cpu0: cpu, sysPct: pct, args, sys: true, start: -UP0 + (pid > 1400 ? 45 : pid > 100 ? 8 : 0), state: stat[0] });
    }
    p.ctx = newCtx(sh, { kind: "base", tty: "pts/0", pid: 2201, ppid: 1702, start: -600 });
    p.base = p.ctx;
    sh.vfs.mkdirp("/proc");
    refresh(sh);
  });

  SH.shellPid = function () { return this.proc ? this.proc.ctx.pid : 4242; };

  const runBase = SH.run;
  SH.run = function (raw) {
    const p = this.proc;
    if (p && !this._capture) {
      refresh(this);
      // An answer to a question (screen's window title, a y/n confirmation typed with Enter).
      if (p.ask) {
        const ask = p.ask; p.ask = null;
        const res = { out: [], events: [], expanded: null, line: raw };
        Object.assign(res, ask.fn(raw.trim(), res) || {});
        return finishRes(this, res);
      }
      if (p.attached === "screen" && !activeScreenCtx(this)) {
        return { out: [{ text: "(This region is empty. Press Ctrl+A then c for a new window, or Ctrl+A then Tab to move to another region.)", cls: "terminal-muted" }], events: [], expanded: null, line: raw };
      }
    }
    return runBase.call(this, raw);
  };
  const captureBase = SH.runCapture;
  SH.runCapture = function (line) {
    this._capture = (this._capture || 0) + 1;
    try { return captureBase.call(this, line); } finally { this._capture--; }
  };
  SH.afterRun = function (res) {
    const p = this.proc;
    if (!p || this._capture) return;
    refresh(this);
    res.out.push(...p.outbox.splice(0));
    if (!p.ctx.fg) pushNotices(this, p.ctx, res);
  };
  function finishRes(sh, res) {
    const p = P(sh);
    res.out.push(...p.outbox.splice(0));
    if (!p.ctx.fg && !res.screen) pushNotices(sh, p.ctx, res);
    if (!res.screen && p.ctx.app && !res.foreground && !p.ask) res.screen = { app: p.ctx.app };
    return res;
  }

  // Remember the whole command (with nice/nohup/sudo in front) for the job list.
  const execBase = SH.exec;
  SH.exec = function (argv, stdin, res, ctx = {}) {
    const name = argv[0];
    if (!this._execDepth) this._cmdText = argv.join(" ");
    this._execDepth = (this._execDepth || 0) + 1;
    try {
      if (name && name.includes("/") && !/^[A-Za-z_]\w*=/.test(name)) return runFile(this, name, argv.slice(1), stdin, res, ctx, true);
      return execBase.call(this, argv, stdin, res, ctx);
    } finally { this._execDepth--; }
  };

  /* "cmd &": start it as a background job. */
  SH.runBackground = function (text, res) {
    const p = P(this);
    if (!p) return;
    const mark = res.out.length;
    this._bg = { text, spawned: null };
    let tokens;
    try { tokens = this.tokenize(text); }
    catch (e) { this._bg = null; res.out.push({ text: "bash: " + e.message, cls: "terminal-error" }); this.lastStatus = 2; return; }
    try {
      if (tokens.length) {
        const r = this.runPipeline(tokens, res);
        if (r.stdout) res.out.push(...r.stdout.replace(/\n$/, "").split("\n").map((t) => ({ text: t })));
      }
    } finally {
      const sp = this._bg.spawned;
      this._bg = null;
      if (!sp && tokens.length && !/^[A-Za-z_]\w*=/.test(tokens[0].word || "")) {
        // An ordinary command finishes at once; it still gets a job number and a Done notice.
        const pid = p.next++;
        const job = addJob(p.ctx, { pid }, text, "Done", true);
        job.notify = true;
        res.out.splice(mark, 0, { text: `[${job.num}] ${pid}` });
        this.lastBgPid = pid;
      }
      this.lastStatus = 0;
    }
  };

  /* Start a long-running process: as a background job, as the foreground job, or (for short
     foreground sleeps) by just moving the clock on. spec: { args, comm, duration, pct, ign, trap, app } */
  function spawn(sh, spec, res) {
    const p = P(sh), ctx = p.ctx;
    const ni = sh._spawnNi ?? 0;
    if (!sh._bg && spec.duration <= FG_INSTANT && !spec.app) { p.offset += spec.duration; refresh(sh); return {}; }
    const proc = addProc(sh, { ppid: ctx.pid, user: actor(sh), tty: ctx.tty, args: spec.args, comm: spec.comm, rss: spec.rss, vsz: spec.vsz,
      pct: spec.pct, end: now(p) + spec.duration, ni, ign: spec.ign, trap: spec.trap, nohup: !!sh._spawnNohup, ctx, kind: spec.kind || "job", app: spec.app });
    if (spec.app) spec.app.proc = proc;
    res.events.push({ type: "spawn", pid: proc.pid, comm: proc.comm, args: proc.args, ni, bg: sh._bg ? "yes" : "no", nohup: proc.nohup ? "yes" : "no" });
    if (sh._bg) {
      const job = addJob(ctx, proc, sh._bg.text, "Running", true);
      res.out.push({ text: `[${job.num}] ${proc.pid}` });
      if (spec.app) { stopProc(p, proc); job.state = "Stopped"; job.notify = true; } // a full-screen program in the background stops at once
      sh._bg.spawned = proc;
      sh.lastBgPid = proc.pid;
      return {};
    }
    ctx.fg = { proc, text: sh._cmdText || spec.args, job: null };
    if (spec.app) { ctx.app = spec.app; res.screen = { app: spec.app }; }
    else {
      res.foreground = { pid: proc.pid };
      res.out.push({ text: `(${ctx.fg.text} is running in the foreground. Press Ctrl+Z to suspend it, or Ctrl+C to stop it.)`, cls: "terminal-muted" });
    }
    return {};
  }

  /* ------------------------------------------------------------------ scripts */
  function profile(text) {
    let m;
    if ((m = text.match(/seq 1 (\d+)\)\s*;\s*do\s+sleep 1\b/))) return { duration: +m[1], pct: 0 };
    if ((m = text.match(/SECONDS\s*\+\s*(\d+)/)) && /while/.test(text)) return { duration: +m[1], pct: 0.997 };
    if ((m = text.match(/trap\s+(["'])echo ([^"']*)\1\s+(?:SIG)?(TERM|15)\b/))) return { duration: Infinity, pct: 0, ign: [15], trap: m[2] };
    if (/while\s+(true|:)\s*;\s*do/.test(text)) return { duration: Infinity, pct: /sleep/.test(text) ? 0 : 0.997 };
    if ((m = text.match(/^\s*sleep\s+(\d+)\s*$/m)) && +m[1] > FG_INSTANT) return { duration: +m[1], pct: 0 };
    return null;
  }
  function runFile(sh, path, args, stdin, res, ctx, needX) {
    const abs = sh.abs(path), node = sh.vfs.get(abs);
    if (!node) return { stderr: `bash: ${path}: No such file or directory`, status: 127 };
    if (node.type === "dir") return { stderr: `bash: ${path}: Is a directory`, status: 126 };
    if (needX && !sh.vfs.can(node, "x")) return { stderr: `bash: ${path}: Permission denied`, status: 126 };
    const base = abs.split("/").pop();
    if (/^\/(usr\/)?s?bin\/[^/]+$/.test(abs) && C[base]) return execBase.call(sh, [base, ...args], stdin, res, ctx);
    const text = node.content || "";
    const prof = profile(text);
    if (prof) return spawn(sh, { args: `/bin/bash ${path}${args.length ? " " + args.join(" ") : ""}`, comm: base, rss: 3584, vsz: 9056, ...prof }, res);
    // A plain script: run its lines in a child shell, so cd and variables don't leak out.
    const body = text.split("\n").filter((l) => l.trim() && !/^\s*#/.test(l))
      .join("\n").replace(/\b(do|then|else)\s*\n/g, "$1 ").replace(/\n/g, "; ");
    if (!body.trim()) return {};
    const save = { cwd: sh.cwd, env: { ...sh.env } };
    args.forEach((a, i) => (sh.env[String(i + 1)] = a));
    const sub = { out: [], events: [] };
    try { sh.runItems(sh.splitLists(body), sub); } finally { sh.cwd = save.cwd; sh.env = save.env; }
    const out = sub.out.filter((o) => o.cls !== "terminal-error").map((o) => o.text);
    const err = sub.out.filter((o) => o.cls === "terminal-error").map((o) => o.text);
    res.events.push(...sub.events);
    return { stdout: out.length ? out.join("\n") + "\n" : "", stderr: err.join("\n"), status: sh.lastStatus };
  }

  const bashBase = C.bash;
  C.bash = C.sh = function (args, stdin, res, ctx = {}) {
    const p = P(this);
    if (args[0] === "--version" || args[0] === "-version") return bashBase.call(this, args, stdin, res, ctx);
    if (args[0] === "-n") {
      const missing = args.slice(1).filter((f) => !this.vfs.get(this.abs(f)));
      return missing.length ? { stderr: `bash: ${missing[0]}: No such file or directory`, status: 127 } : {};
    }
    if (args[0] === "-c") {
      if (args[1] === undefined) return { stderr: "bash: -c: option requires an argument", status: 2 };
      const r = this.runSubshell(args[1]);
      res.events.push(...r.events);
      const out = r.out.filter((o) => o.cls !== "terminal-error").map((o) => o.text), err = r.out.filter((o) => o.cls === "terminal-error").map((o) => o.text);
      return { stdout: out.length ? out.join("\n") + "\n" : "", stderr: err.join("\n"), status: this.lastStatus };
    }
    if (args.length) return runFile(this, args[0], args.slice(1), stdin, res, ctx, false);
    if (!p || this.batch || ctx.tty === false) return {};
    const c = newCtx(this, { kind: "nested", tty: p.ctx.tty, parent: p.ctx });
    p.ctx = c;
    res.events.push({ type: "shell-start", pid: c.pid });
    return {};
  };

  const exitBase = C.exit;
  C.exit = C.logout = function (args, stdin, res) {
    const p = P(this);
    if (!p || p.ctx.kind === "base") return exitBase.call(this, args, stdin, res);
    const c = p.ctx;
    if (c.jobs.some((j) => j.state.startsWith("Stopped")) && !c.warned) { c.warned = true; return { stderr: "There are stopped jobs.", status: 1 }; }
    res.out.push({ text: "exit" });
    res.events.push({ type: "shell-exit", kind: c.kind });
    closeCtx(this, c, "exit");
    if (c.kind === "nested") p.ctx = c.parent;
    else if (c.kind === "pane") tmuxPaneGone(this, c, res);
    else if (c.kind === "window") screenWindowGone(this, c, res);
    return {};
  };

  /* ------------------------------------------------------------------ sleep, nice, renice, nohup */
  C.sleep = function (args, stdin, res) {
    if (!args.length) return { stderr: "sleep: missing operand\nTry 'sleep --help' for more information.", status: 1 };
    let total = 0;
    for (const a of args) {
      const m = a.match(/^(\d*\.?\d+)([smhd]?)$/);
      if (a === "infinity" || a === "inf") { total = Infinity; continue; }
      if (!m) return { stderr: `sleep: invalid time interval '${a}'\nTry 'sleep --help' for more information.`, status: 1 };
      total += +m[1] * { "": 1, s: 1, m: 60, h: 3600, d: 86400 }[m[2]];
    }
    if (!P(this)) return {};
    return spawn(this, { args: "sleep " + args.join(" "), comm: "sleep", duration: total, pct: 0, rss: 1920, vsz: 8264 }, res);
  };

  function setNice(sh, proc, val) {
    const me = actor(sh);
    if (me !== "root" && proc.user !== me) return "Operation not permitted";
    val = Math.max(-20, Math.min(19, val));
    if (me !== "root" && val < proc.ni) return "Permission denied";
    proc.ni = val;
    return null;
  }

  C.nice = function (args, stdin, res, ctx) {
    let adj = 10, i = 0;
    if (args[0] === "-n") { adj = parseInt(args[1], 10); i = 2; }
    else if (/^-n-?\d+$/.test(args[0] || "")) { adj = parseInt(args[0].slice(2), 10); i = 1; }
    else if (/^--adjustment=/.test(args[0] || "")) { adj = parseInt(args[0].split("=")[1], 10); i = 1; }
    else if (/^--?\d+$/.test(args[0] || "")) { adj = args[0].startsWith("--") ? -parseInt(args[0].slice(2), 10) : parseInt(args[0].slice(1), 10); i = 1; }
    if (Number.isNaN(adj)) return { stderr: `nice: invalid adjustment '${args[i - 1]}'\nTry 'nice --help' for more information.`, status: 125 };
    const rest = args.slice(i);
    const cur = this._spawnNi ?? 0;
    if (!rest.length) return { stdout: cur + "\n" };
    let next = Math.max(-20, Math.min(19, cur + adj)), warn = "";
    if (next < cur && actor(this) !== "root") { warn = "nice: cannot set niceness: Permission denied"; next = cur; }
    const save = this._spawnNi;
    this._spawnNi = next;
    res.events.push({ type: "nice", ni: next, cmd: rest.join(" ") });
    try {
      const r = this.exec(rest, stdin, res, ctx) || {};
      return { ...r, stderr: [warn, r.stderr].filter(Boolean).join("\n") };
    } finally { this._spawnNi = save; }
  };

  C.renice = function (args, stdin, res) {
    const p = P(this);
    refresh(this);
    let val = null, mode = "p";
    const targets = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === "-n" || a === "--priority" || a === "--relative") { val = parseInt(args[++i], 10); continue; }
      if (a === "-p" || a === "--pid") { mode = "p"; continue; }
      if (a === "-u" || a === "--user") { mode = "u"; continue; }
      if (a === "-g" || a === "--pgrp") { mode = "g"; continue; }
      if (val === null && /^[+-]?\d+$/.test(a)) { val = parseInt(a, 10); continue; }
      targets.push([mode, a]);
    }
    if (val === null || !targets.length) return { stderr: "renice: not enough arguments\nTry 'renice --help' for more information.", status: 1 };
    const out = [], err = [];
    for (const [m, t] of targets) {
      const procs = m === "u" ? [...p.procs.values()].filter((x) => x.user === t || String(uidOf(x.user)) === t)
        : m === "g" ? [...p.procs.values()].filter((x) => String(x.pid) === t) : [p.procs.get(+t)].filter(Boolean);
      const what = m === "u" ? "user ID" : m === "g" ? "process group ID" : "process ID";
      if (!procs.length) { err.push(`renice: failed to get priority for ${t} (${what}): No such process`); continue; }
      for (const proc of procs) {
        const old = proc.ni;
        const e = setNice(this, proc, val);
        if (e) { err.push(`renice: failed to set priority for ${m === "p" ? proc.pid : t} (${what}): ${e}`); continue; }
        if (m === "p") out.push(`${proc.pid} (process ID) old priority ${old}, new priority ${proc.ni}`);
        res.events.push({ type: "renice", pid: proc.pid, comm: proc.comm, ni: proc.ni });
      }
      if (m !== "p" && procs.length) out.push(`${t} (${what}) old priority ${procs[0].ni}, new priority ${Math.max(-20, Math.min(19, val))}`);
    }
    return { stdout: out.length ? out.join("\n") + "\n" : "", stderr: err.join("\n"), status: err.length ? 1 : 0 };
  };

  C.nohup = function (args, stdin, res, ctx = {}) {
    if (!args.length) return { stderr: "nohup: missing operand\nTry 'nohup --help' for more information.", status: 125 };
    if (args[0] === "--version") return { stdout: "nohup (GNU coreutils) 9.4\n" };
    let msg = "";
    if (ctx.tty !== false && !ctx.outFile) {
      const target = this.abs("nohup.out");
      try { if (!this.vfs.get(target)) this.vfs.write(target, ""); msg = "nohup: ignoring input and appending output to 'nohup.out'"; }
      catch { this.vfs.write(this.home + "/nohup.out", "", true); msg = "nohup: ignoring input and appending output to '" + this.home + "/nohup.out'"; }
    } else if (ctx.errTty) msg = "nohup: ignoring input";
    const save = this._spawnNohup;
    this._spawnNohup = true;
    res.events.push({ type: "nohup", cmd: args.join(" ") });
    try {
      const r = this.exec(args, "", res, { ...ctx, tty: false }) || {};
      if (msg.includes("nohup.out") && r.stdout) { this.vfs.write(this.abs("nohup.out"), r.stdout, true); r.stdout = ""; }
      return { ...r, stderr: [msg, r.stderr].filter(Boolean).join("\n") };
    } finally { this._spawnNohup = save; }
  };

  /* ------------------------------------------------------------------ job control builtins */
  C.jobs = function (args) {
    const p = P(this);
    if (!p) return {};
    refresh(this);
    const ctx = p.ctx;
    const f = new Set(), specs = [];
    for (const a of args) { if (/^-[lprs]+$/.test(a)) [...a.slice(1)].forEach((c) => f.add(c)); else specs.push(a); }
    let list = [...ctx.jobs].sort((a, b) => a.num - b.num);
    const errs = [];
    if (specs.length) list = specs.map((s) => { const j = resolveJob(ctx, s); if (!j) errs.push(`bash: jobs: ${s}: no such job`); return j; }).filter(Boolean);
    if (f.has("r")) list = list.filter((j) => j.state === "Running");
    if (f.has("s")) list = list.filter((j) => j.state.startsWith("Stopped"));
    const out = list.map((j) => (f.has("p") ? String(j.pid) : fmtJob(ctx, j, f.has("l"))));
    list.forEach((j) => (j.notify = false));
    list.filter(finished).forEach((j) => removeJob(ctx, j));
    return { stdout: out.length ? out.join("\n") + "\n" : "", stderr: errs.join("\n"), status: errs.length ? 1 : 0 };
  };

  C.fg = function (args, stdin, res) {
    const p = P(this);
    if (!p) return { stderr: "bash: fg: no job control", status: 1 };
    refresh(this);
    const ctx = p.ctx, spec = args[0];
    const job = resolveJob(ctx, spec);
    if (!job) return { stderr: `bash: fg: ${spec || "current"}: no such job`, status: 1 };
    const proc = p.procs.get(job.pid);
    if (!proc) { removeJob(ctx, job); return { stderr: "bash: fg: job has terminated", status: 1 }; }
    res.out.push({ text: job.text });
    if (proc.state === "T") contProc(this, proc);
    job.state = "Running"; job.amp = false; job.notify = false;
    ctx.fg = { proc, text: job.text, job };
    res.events.push({ type: "fg", pid: proc.pid, comm: proc.comm, job: job.num });
    if (proc.app) { ctx.app = proc.app; res.screen = { app: proc.app }; }
    else {
      res.foreground = { pid: proc.pid };
      res.out.push({ text: `(${job.text} is running in the foreground. Press Ctrl+Z to suspend it, or Ctrl+C to stop it.)`, cls: "terminal-muted" });
    }
    return {};
  };

  C.bg = function (args, stdin, res) {
    const p = P(this);
    if (!p) return { stderr: "bash: bg: no job control", status: 1 };
    refresh(this);
    const ctx = p.ctx, specs = args.length ? args : [undefined];
    const out = [], err = [];
    for (const spec of specs) {
      const job = resolveJob(ctx, spec);
      if (!job) { err.push(`bash: bg: ${spec || "current"}: no such job`); continue; }
      if (job.state === "Running") { err.push(`bash: bg: job ${job.num} already in background`); continue; }
      const proc = p.procs.get(job.pid);
      if (!proc) continue;
      job.amp = true;
      touchJob(ctx, job);
      out.push(`[${job.num}]${marks(ctx).cur === job.num ? "+" : "-"} ${job.text} &`);
      if (proc.app) { job.state = "Stopped"; job.notify = true; continue; } // top stops again at once (it needs the terminal)
      contProc(this, proc);
      job.state = "Running"; job.notify = false;
      res.events.push({ type: "bg", pid: proc.pid, comm: proc.comm, job: job.num });
    }
    return { stdout: out.length ? out.join("\n") + "\n" : "", stderr: err.join("\n"), status: err.length ? 1 : 0 };
  };

  C.wait = function (args) {
    const p = P(this);
    if (!p) return {};
    refresh(this);
    const ctx = p.ctx;
    const procs = (args.length ? args.map((a) => (a.startsWith("%") ? p.procs.get(resolveJob(ctx, a)?.pid) : p.procs.get(+a))) : ctx.jobs.map((j) => p.procs.get(j.pid)))
      .filter((x) => x && x.state !== "T");
    const ends = procs.map((x) => x.end);
    if (ends.some((e) => e === Infinity)) return { stderr: "(wait would never return here: one of the jobs runs forever. Stop it with kill first.)", status: 1 };
    const t = now(p), last = Math.max(t, ...ends);
    p.offset += last - t;
    refresh(this);
    return {};
  };

  function killList() {
    const names = [];
    for (let n = 1; n <= 64; n++) if (n !== 32 && n !== 33) names.push(`${String(n).padStart(2)}) SIG${sigName(n)}`);
    const lines = [];
    for (let i = 0; i < names.length; i += 5) lines.push(names.slice(i, i + 5).join("\t"));
    return lines.join("\n") + "\n";
  }

  C.kill = function (args, stdin, res) {
    const p = P(this);
    const usage = { stderr: "kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]", status: 2 };
    if (!args.length) return usage;
    if (args[0] === "-l" || args[0] === "-L" || args[0] === "--list" || args[0] === "--table") {
      const rest = args.slice(1);
      if (!rest.length || args[0] === "-L" || args[0] === "--table") return { stdout: killList() };
      const out = [], err = [];
      for (const a of rest) {
        if (/^\d+$/.test(a)) { const n = +a > 128 ? +a - 128 : +a; const ok = n >= 1 && n <= 64 && n !== 32 && n !== 33; if (ok) out.push(sigName(n)); else err.push(`bash: kill: ${a}: invalid signal specification`); }
        else { const n = sigNum(a); if (n) out.push(String(n)); else err.push(`bash: kill: ${a}: invalid signal specification`); }
      }
      return { stdout: out.length ? out.join("\n") + "\n" : "", stderr: err.join("\n"), status: err.length ? 1 : 0 };
    }
    if (!p) return {};
    refresh(this);
    let sig = 15, i = 0;
    if (args[0] === "-s" || args[0] === "-n") {
      sig = sigNum(args[1]);
      if (sig === null) return { stderr: `bash: kill: ${args[1] ?? ""}: invalid signal specification`, status: 1 };
      i = 2;
    } else if (/^-./.test(args[0]) && args[0] !== "--") {
      sig = sigNum(args[0].slice(1));
      if (sig === null) return { stderr: `bash: kill: ${args[0].slice(1)}: invalid signal specification`, status: 1 };
      i = 1;
    }
    if (args[i] === "--") i++;
    const targets = args.slice(i);
    if (!targets.length) return usage;
    const err = [];
    for (const t of targets) {
      let proc = null, viaJob = false;
      if (t.startsWith("%")) {
        const job = resolveJob(p.ctx, t);
        if (!job) { err.push(`bash: kill: ${t}: no such job`); continue; }
        proc = p.procs.get(job.pid); viaJob = true;
        if (!proc) continue;
      } else if (/^\d+$/.test(t)) {
        proc = p.procs.get(+t);
        if (!proc) { err.push(`bash: kill: (${t}) - No such process`); continue; }
        viaJob = !!jobOf(proc);
      } else { err.push(`bash: kill: ${t}: arguments must be process or job IDs`); continue; }
      const e = deliver(this, proc, sig, { contAfter: viaJob && (sig === 15 || sig === 1) });
      if (e) { err.push(`bash: kill: (${proc.pid}) - ${e}`); continue; }
      res.events.push({ type: "signal", sig: sigName(sig), num: sig, pid: proc.pid, comm: proc.comm, target: t, by: "kill" });
    }
    if (!this._capture) res.out.push(...p.outbox.splice(0)); // a trap's message appears as the signal arrives
    return { stderr: err.join("\n"), status: err.length ? 1 : 0 };
  };

  /* ------------------------------------------------------------------ pgrep, pkill, killall, pidof */
  function pmatch(sh, args, mode) {
    const p = P(sh);
    const o = { sig: 15, delim: "\n", users: null, ttys: null, ppids: null, pattern: null, flags: new Set() };
    const val = { u: "users", U: "users", t: "ttys", P: "ppids" };
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (mode === "pkill" && /^-\d+$/.test(a)) { o.sig = +a.slice(1); continue; }
      if (mode === "pkill" && /^-[A-Z]/.test(a)) { const n = sigNum(a.slice(1)); if (n === null) return { error: `pkill: unknown signal name ${a.slice(1)}` }; o.sig = n; continue; }
      if (a === "--signal" || a.startsWith("--signal=")) { const v = a.includes("=") ? a.split("=")[1] : args[++i]; const n = sigNum(v); if (n === null) return { error: `${mode}: unknown signal name ${v}` }; o.sig = n; continue; }
      const long = { "--full": "f", "--exact": "x", "--count": "c", "--list-name": "l", "--list-full": "a", "--newest": "n", "--oldest": "o", "--ignore-case": "i", "--inverse": "v", "--echo": "e" };
      if (long[a]) { o.flags.add(long[a]); continue; }
      let m;
      if ((m = a.match(/^--(euid|uid|terminal|parent|delimiter)=(.*)$/))) { const k = { euid: "users", uid: "users", terminal: "ttys", parent: "ppids", delimiter: "delim" }[m[1]]; o[k] = k === "delim" ? m[2] : m[2].split(","); continue; }
      if (a.startsWith("-") && a.length > 1) {
        for (let j = 1; j < a.length; j++) {
          const f = a[j];
          if (val[f] || f === "d") { const v = a.slice(j + 1) || args[++i]; if (v === undefined) return { error: `${mode}: option requires an argument -- '${f}'` }; if (f === "d") o.delim = v; else o[val[f]] = v.split(","); break; }
          o.flags.add(f);
        }
        continue;
      }
      if (o.pattern !== null) return { error: `${mode}: only one pattern can be provided\nTry \`${mode} --help' for more information.` };
      o.pattern = a;
    }
    if (o.pattern === null && !o.users && !o.ttys && !o.ppids) return { error: `${mode}: no matching criteria specified\nTry \`${mode} --help' for more information.`, status: 2 };
    let re = null;
    if (o.pattern !== null) {
      try { re = new RegExp(o.flags.has("x") ? `^(?:${o.pattern})$` : o.pattern, o.flags.has("i") ? "i" : ""); }
      catch { return { error: `${mode}: cannot compile regular expression '${o.pattern}'`, status: 2 }; }
    }
    let list = [...p.procs.values()].filter((x) => {
      if (/^\[/.test(x.args)) return false; // kernel threads have no command line for -f
      const okRe = !re || re.test(o.flags.has("f") ? x.args : x.comm);
      const okU = !o.users || o.users.some((u) => u === x.user || u === String(uidOf(x.user)));
      const okT = !o.ttys || o.ttys.some((t) => t.replace(/^\/dev\//, "") === x.tty);
      const okP = !o.ppids || o.ppids.includes(String(x.ppid));
      const ok = okRe && okU && okT && okP;
      return o.flags.has("v") ? !ok : ok;
    }).sort((a, b) => a.pid - b.pid);
    if (o.flags.has("n")) list = list.length ? [list.reduce((a, b) => (b.start >= a.start ? b : a))] : [];
    if (o.flags.has("o")) list = list.length ? [list.reduce((a, b) => (b.start < a.start ? b : a))] : [];
    return { o, list };
  }

  C.pgrep = function (args, stdin, res) {
    if (!P(this)) return { status: 1 };
    refresh(this);
    const m = pmatch(this, args, "pgrep");
    if (m.error) return { stderr: m.error, status: m.status || 2 };
    const { o, list } = m;
    P(this).next++;
    res.events.push({ type: "pgrep", count: list.length, pids: list.map((x) => x.pid).join(",") });
    if (o.flags.has("c")) return { stdout: list.length + "\n", status: list.length ? 0 : 1 };
    const lines = list.map((x) => (o.flags.has("a") ? `${x.pid} ${x.args}` : o.flags.has("l") ? `${x.pid} ${x.comm}` : String(x.pid)));
    return { stdout: lines.length ? lines.join(o.delim) + "\n" : "", status: lines.length ? 0 : 1 };
  };

  C.pkill = function (args, stdin, res) {
    if (!P(this)) return { status: 1 };
    refresh(this);
    const m = pmatch(this, args, "pkill");
    if (m.error) return { stderr: m.error, status: m.status || 2 };
    const { o, list } = m;
    P(this).next++;
    const out = [], err = [];
    let ok = 0;
    for (const proc of list) {
      const e = deliver(this, proc, o.sig);
      if (e) { err.push(`pkill: killing pid ${proc.pid} failed: ${e}`); continue; }
      ok++;
      if (o.flags.has("e")) out.push(`${proc.comm} killed (pid ${proc.pid})`);
      res.events.push({ type: "signal", sig: sigName(o.sig), num: o.sig, pid: proc.pid, comm: proc.comm, by: "pkill" });
    }
    if (o.flags.has("c")) out.push(String(ok));
    return { stdout: out.length ? out.join("\n") + "\n" : "", stderr: err.join("\n"), status: list.length ? 0 : 1 };
  };

  C.killall = function (args, stdin, res) {
    const p = P(this);
    if (!p) return { status: 1 };
    refresh(this);
    let sig = 15, user = null;
    const f = new Set(), names = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === "-l" || a === "--list") return { stdout: SIG.slice(1).join(" ").replace("STKFLT ", "STKFLT ") + "\n" };
      if (a === "-V" || a === "--version") return { stdout: "killall (PSmisc) 23.7\n" };
      if (a === "-s" || a === "--signal") { sig = sigNum(args[++i]); if (sig === null) return { stderr: `killall: ${args[i]}: unknown signal; killall -l lists signals.`, status: 1 }; continue; }
      if (a === "-u" || a === "--user") { user = args[++i]; continue; }
      if (/^-\d+$/.test(a)) { sig = +a.slice(1); continue; }
      if (/^-[A-Z]/.test(a)) { const n = sigNum(a.slice(1)); if (n === null) return { stderr: `killall: ${a.slice(1)}: unknown signal; killall -l lists signals.`, status: 1 }; sig = n; continue; }
      if (/^-[a-zA-Z]+$/.test(a)) { [...a.slice(1)].forEach((c) => f.add(c)); continue; }
      names.push(a);
    }
    if (!names.length && !user) return { stderr: "Usage: killall [OPTION]... [--] NAME...\n       killall -l, --list\n       killall -V, --version", status: 1 };
    const out = [], err = [];
    let failed = false;
    for (const name of names.length ? names : [null]) {
      const match = [...p.procs.values()].filter((x) => !/^\[/.test(x.args) && (name === null || (f.has("I") ? x.comm.toLowerCase() === name.toLowerCase() : x.comm === name || commOf(x.args) === name)) && (!user || x.user === user));
      let killed = 0;
      for (const proc of match) {
        const e = deliver(this, proc, sig);
        if (e) { if (!f.has("q")) err.push(`${proc.comm}(${proc.pid}): ${e}`); continue; }
        killed++;
        if (f.has("v")) err.push(`Killed ${proc.comm}(${proc.pid}) with signal ${sig}`);
        res.events.push({ type: "signal", sig: sigName(sig), num: sig, pid: proc.pid, comm: proc.comm, by: "killall" });
      }
      if (!match.length && !f.has("q")) err.push(`${name}: no process found`);
      if (!killed) failed = true;
    }
    return { stdout: out.join("\n"), stderr: err.join("\n"), status: failed ? 1 : 0 };
  };

  C.pidof = function (args) {
    const p = P(this);
    if (!p) return { status: 1 };
    refresh(this);
    const single = args.includes("-s");
    const names = args.filter((a) => !a.startsWith("-"));
    let pids = [...p.procs.values()].filter((x) => names.includes(x.comm) || names.includes(commOf(x.args))).map((x) => x.pid).sort((a, b) => b - a);
    if (single) pids = pids.slice(0, 1);
    return { stdout: pids.length ? pids.join(" ") + "\n" : "", status: pids.length ? 0 : 1 };
  };

  /* ------------------------------------------------------------------ ps */
  function info(sh, x, curCtx) {
    const p = P(sh), t = now(p);
    const elapsed = Math.max(1, t - x.start), cpu = cpuTime(p, x);
    const kthread = /^\[/.test(x.args);
    const isFg = x.isFg ?? !!(x.ctx && x.ctx.fg && x.ctx.fg.proc === x);
    let stat = x.sys ? x.stat : x.state;
    if (!x.sys) {
      stat += x.ni < 0 ? "<" : x.ni > 0 ? "N" : "";
      if (x.kind === "bash" || x.kind === "tmux-server" || x.kind === "screen-server") stat += "s";
      if (isFg || (x.kind === "bash" && x.ctx && x.ctx !== curCtx && !x.ctx.fg)) stat += "+";
    }
    const startD = wallDate(p, x.start), today = wallDate(p, t);
    const stime = startD.toDateString() === today.toDateString() ? `${two(startD.getHours())}:${two(startD.getMinutes())}` : `${MONTHS[startD.getMonth()]}${two(startD.getDate())}`;
    const cs = Math.floor(cpu), e = Math.floor(elapsed);
    const etime = (e >= 86400 ? Math.floor(e / 86400) + "-" : "") + (e >= 3600 ? two(Math.floor(e / 3600) % 24) + ":" : "") + `${two(Math.floor(e / 60) % 60)}:${two(e % 60)}`;
    const ni = kthread ? (x.stat.includes("<") ? -20 : 0) : x.ni;
    return {
      pid: x.pid, ppid: x.ppid, user: x.user, userT: x.user.length > 8 ? x.user.slice(0, 7) + "+" : x.user, uid: uidOf(x.user), tty: x.tty, stat, s: stat[0],
      ni: kthread && x.stat.includes("<") ? -20 : ni, pri: 80 + ni, opri: 19 - ni, prio: 20 + ni, c: Math.min(99, Math.floor((cpu / elapsed) * 100)),
      pcpu: Math.min(99.9, (cpu / elapsed) * 100).toFixed(1), pmem: ((x.rss / MEM_KB) * 100).toFixed(1), rss: x.rss, vsz: x.vsz, sz: Math.round(x.vsz / 4),
      wchan: x.state === "T" ? "do_sig" : x.comm === "sleep" ? "hrtime" : x.kind === "bash" ? "do_wai" : x.state === "R" ? "-" : kthread ? "-" : "ep_pol",
      f: kthread ? 1 : x.user === "root" && x.sys ? 4 : 0, addr: "-", stime, start: stime,
      timeU: `${two(Math.floor(cs / 3600))}:${two(Math.floor(cs / 60) % 60)}:${two(cs % 60)}`, timeB: `${Math.floor(cs / 60)}:${two(cs % 60)}`,
      etime, comm: x.comm, args: x.args, pgid: x.pid, sid: x.ctx ? x.ctx.pid : x.pid, raw: x, cpuSec: cpu, elapsed,
    };
  }
  const COLS = {
    pid: ["PID", 7, 1, "pid"], ppid: ["PPID", 7, 1, "ppid"], user: ["USER", 8, 0, "userT"], euser: ["EUSER", 8, 0, "userT"], ruser: ["RUSER", 8, 0, "userT"],
    uid: ["UID", 5, 1, "uid"], euid: ["EUID", 5, 1, "uid"], stat: ["STAT", 4, 0, "stat"], s: ["S", 1, 0, "s"], state: ["S", 1, 0, "s"],
    ni: ["NI", 3, 1, "ni"], nice: ["NI", 3, 1, "ni"], pri: ["PRI", 3, 1, "opri"], priority: ["PRI", 3, 1, "prio"], c: ["C", 2, 1, "c"],
    pcpu: ["%CPU", 4, 1, "pcpu"], "%cpu": ["%CPU", 4, 1, "pcpu"], pmem: ["%MEM", 4, 1, "pmem"], "%mem": ["%MEM", 4, 1, "pmem"],
    rss: ["RSS", 5, 1, "rss"], rssize: ["RSS", 5, 1, "rss"], vsz: ["VSZ", 6, 1, "vsz"], vsize: ["VSZ", 6, 1, "vsz"], sz: ["SZ", 5, 1, "sz"],
    tty: ["TT", 8, 0, "tty"], tt: ["TT", 8, 0, "tty"], tname: ["TTY", 8, 0, "tty"], time: ["TIME", 8, 1, "timeU"], cputime: ["TIME", 8, 1, "timeU"],
    etime: ["ELAPSED", 11, 1, "etime"], stime: ["STIME", 5, 0, "stime"], start_time: ["START", 5, 0, "stime"], start: ["STARTED", 8, 1, "start"],
    wchan: ["WCHAN", 6, 0, "wchan"], f: ["F", 1, 1, "f"], flags: ["F", 1, 1, "f"], comm: ["COMMAND", 15, 0, "comm"], ucomm: ["COMMAND", 15, 0, "comm"],
    ucmd: ["CMD", 15, 0, "comm"], args: ["COMMAND", 27, 0, "args"], command: ["COMMAND", 27, 0, "args"], cmd: ["CMD", 27, 0, "args"],
    pgid: ["PGID", 7, 1, "pgid"], pgrp: ["PGRP", 7, 1, "pgid"], sid: ["SID", 7, 1, "sid"], sess: ["SESS", 7, 1, "sid"],
  };
  const PRESETS = {
    std: { head: "    PID TTY          TIME CMD", cols: [["pid", 7, 1], ["tty", 8, 0], ["timeU", 8, 1], ["comm", 0, 0]] },
    f: { head: "UID          PID    PPID  C STIME TTY          TIME CMD", cols: [["userT", 8, 0], ["pid", 7, 1], ["ppid", 7, 1], ["c", 2, 1], ["stime", 5, 0], ["tty", 8, 0], ["timeU", 8, 1], ["args", 0, 0]] },
    l: { head: "F S   UID     PID    PPID  C PRI  NI ADDR SZ WCHAN  TTY          TIME CMD", cols: [["f", 1, 1], ["s", 1, 0], ["uid", 5, 1], ["pid", 7, 1], ["ppid", 7, 1], ["c", 2, 1], ["pri", 3, 1], ["ni", 3, 1], ["addr", 1, 0], ["sz", 5, 1], ["wchan", 6, 0], ["tty", 8, 0], ["timeU", 8, 1], ["comm", 0, 0]] },
    lf: { head: "F S UID          PID    PPID  C PRI  NI ADDR SZ WCHAN  STIME TTY          TIME CMD", cols: [["f", 1, 1], ["s", 1, 0], ["userT", 8, 0], ["pid", 7, 1], ["ppid", 7, 1], ["c", 2, 1], ["pri", 3, 1], ["ni", 3, 1], ["addr", 1, 0], ["sz", 5, 1], ["wchan", 6, 0], ["stime", 5, 0], ["tty", 8, 0], ["timeU", 8, 1], ["args", 0, 0]] },
    u: { head: "USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND", cols: [["userT", 8, 0], ["pid", 7, 1], ["pcpu", 4, 1], ["pmem", 4, 1], ["vsz", 6, 1], ["rss", 5, 1], ["tty", 8, 0], ["stat", 4, 0], ["start", 5, 1], ["timeB", 6, 1], ["args", 0, 0]] },
    bsd: { head: "    PID TTY      STAT   TIME COMMAND", cols: [["pid", 7, 1], ["tty", 8, 0], ["stat", 4, 0], ["timeB", 6, 1], ["args", 0, 0]] },
  };
  const SORTKEYS = { pid: "pid", ppid: "ppid", pcpu: "cpuSecRate", "%cpu": "cpuSecRate", pmem: "rss", "%mem": "rss", rss: "rss", vsz: "vsz", ni: "ni", nice: "ni",
    comm: "comm", ucomm: "comm", cmd: "args", args: "args", user: "user", uid: "uid", time: "cpuSec", cputime: "cpuSec", start_time: "start0", stime: "start0", etime: "elapsed" };
  const PS_LIST_ERR = (o) => `error: list of ${o === "p" ? "process IDs" : o === "u" || o === "U" ? "users" : "terminals"} must follow -${o}\n\nUsage:\n ps [options]\n\n Try 'ps --help <simple|list|output|threads|misc|all>'\n  or 'ps --help <s|l|o|t|m|a>'\n for additional help text.\n\nFor more details see ps(1).`;

  C.ps = function (args, stdin, res) {
    const p = P(this);
    if (!p) return { stderr: "ps: not available", status: 1 };
    refresh(this);
    let all = false, full = false, long = false, bsd = false, bA = false, bU = false, bX = false, fmt = null, sort = null, noHead = false;
    const pids = [], users = [], ttys = [], cmds = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === "-aux" || a === "-axu") { bsd = bA = bU = bX = true; continue; }
      if (a.startsWith("--")) {
        const [k, v0] = a.slice(2).split("=");
        if (k === "no-headers" || k === "no-heading") { noHead = true; continue; }
        if (k === "forest" || k === "cols" || k === "width") { if (v0 === undefined && k !== "forest") i++; continue; }
        const v = v0 ?? args[++i];
        if (v === undefined) return { stderr: `error: option --${k} requires an argument`, status: 1 };
        if (k === "sort") sort = v; else if (k === "pid") pids.push(...v.split(/[,\s]+/).filter(Boolean)); else if (k === "user" || k === "User") users.push(...v.split(","));
        else if (k === "tty") ttys.push(...v.split(",")); else if (k === "format") fmt = v; else if (k === "ppid") pids.push(...[...p.procs.values()].filter((x) => v.split(",").includes(String(x.ppid))).map((x) => String(x.pid)));
        continue;
      }
      if (a.startsWith("-")) {
        for (let j = 1; j < a.length; j++) {
          const f = a[j];
          if ("opuUtCG".includes(f)) {
            const v = a.slice(j + 1) || args[++i];
            if (v === undefined || !String(v).trim()) return { stderr: f === "o" ? "error: format specification must follow -o" : PS_LIST_ERR(f), status: 1 };
            const list = String(v).split(/[,\s]+/).filter(Boolean);
            if (f === "o") fmt = fmt ? fmt + "," + v : v; else if (f === "p") pids.push(...list); else if (f === "u" || f === "U") users.push(...list); else if (f === "t") ttys.push(...list); else if (f === "C") cmds.push(...list);
            break;
          }
          if (f === "e" || f === "A") all = true; else if (f === "f") full = true; else if (f === "l") long = true; else if (f === "a") bA = true; else if (f === "x") bX = true;
          else if (f === "F") full = true; else if (f === "H" || f === "w" || f === "y" || f === "L") {} else return { stderr: `error: unsupported SysV option\n\nUsage:\n ps [options]`, status: 1 };
        }
        continue;
      }
      if (/^\d+(,\d+)*$/.test(a)) { pids.push(...a.split(",")); continue; }
      bsd = true;
      for (const f of a) {
        if (f === "a") bA = true; else if (f === "u") bU = true; else if (f === "x") bX = true; else if (f === "l") long = true;
        else if (f === "o") { fmt = args[++i]; break; } else if (f === "f" || f === "w" || f === "e") {} else if (f === "U") { users.push(...(args[++i] || "").split(",")); break; }
      }
    }
    const curCtx = p.ctx;
    const me = actor(this);
    const self = { pid: p.next++, ppid: curCtx.pid, user: me, tty: curCtx.tty, args: ["ps", ...args].join(" "), comm: "ps", state: "R", sys: false, ni: this._spawnNi ?? 0,
      rss: 4224, vsz: 11136, start: now(p), cpu0: 0.004, acc: 0, pct: 0, runFrom: now(p), kind: "self", ctx: null, isFg: true };
    let list = [...p.procs.values(), self];
    if (pids.length || users.length || ttys.length || cmds.length) {
      list = list.filter((x) => pids.includes(String(x.pid)) || users.some((u) => u === x.user || u === String(uidOf(x.user))) ||
        ttys.some((t) => t.replace(/^\/dev\//, "") === x.tty || (t === "-" && x.tty === "?")) || cmds.includes(x.comm));
    } else if (all || (bA && bX)) { /* everything */ }
    else if (bA) list = list.filter((x) => x.tty !== "?");
    else if (bX) list = list.filter((x) => x.user === me);
    else list = list.filter((x) => x.user === me && x.tty === curCtx.tty);
    let rows = list.map((x) => info(this, x, curCtx));
    rows.forEach((r) => { r.cpuSecRate = r.cpuSec / r.elapsed; r.start0 = r.raw.start; });
    rows.sort((a, b) => a.pid - b.pid);
    if (sort) {
      const keys = sort.split(",").map((k) => { const desc = k.startsWith("-"); const name = k.replace(/^[-+]/, ""); return { key: SORTKEYS[name] || name, desc }; });
      rows.sort((a, b) => { for (const { key, desc } of keys) { const x = a[key], y = b[key]; if (x === y) continue; const c = typeof x === "number" ? x - y : String(x).localeCompare(String(y)); return desc ? -c : c; } return 0; });
    }
    let head, cols;
    if (fmt) {
      cols = [];
      for (const spec of fmt.split(/[,\s]+/).filter(Boolean)) {
        const [k, h] = spec.split("=");
        const d = COLS[k.toLowerCase()];
        if (!d) return { stderr: `error: unknown user-defined format specifier "${k}"\n\nUsage:\n ps [options]\n\n Try 'ps --help <simple|list|output|threads|misc|all>'\n  or 'ps --help <s|l|o|t|m|a>'\n for additional help text.\n\nFor more details see ps(1).`, status: 1 };
        cols.push([d[3], d[1], d[2], h !== undefined ? h : d[0]]);
      }
      const last = cols.length - 1;
      const widths = cols.map((c, i) => Math.max(c[3].length, i === last && !c[2] ? 0 : c[1]));
      head = cols.every((c) => c[3] === "") ? null : cols.map((c, i) => (c[2] ? c[3].padStart(widths[i]) : i === last ? c[3] : c[3].padEnd(widths[i]))).join(" ").replace(/\s+$/, "");
      cols = cols.map((c, i) => [c[0], widths[i], c[2]]);
    } else {
      const pre = bU ? PRESETS.u : bsd ? (long ? PRESETS.l : PRESETS.bsd) : long && full ? PRESETS.lf : long ? PRESETS.l : full ? PRESETS.f : PRESETS.std;
      head = pre.head; cols = pre.cols;
    }
    const last = cols.length - 1;
    const lines = rows.map((r) => cols.map(([k, w, right], i) => { const v = String(r[k]); return right ? v.padStart(w) : i === last ? v : v.padEnd(w); }).join(" ").replace(/\s+$/, ""));
    if (head && !noHead) lines.unshift(head);
    res.events.push({ type: "ps", count: rows.length });
    return { stdout: lines.join("\n") + "\n", status: rows.length ? 0 : 1 };
  };

  /* ------------------------------------------------------------------ uptime, free, nproc, tty, seq */
  function upText(p) {
    const s = Math.floor(UP0 + now(p)), d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60;
    const hm = s < 3600 ? `${m} min` : `${String(h).padStart(2)}:${two(m)}`;
    return (d ? `${d} day${d > 1 ? "s" : ""}, ` : "") + hm;
  }
  const users = () => "1 user";
  C.uptime = function (args) {
    const p = P(this);
    if (!p) return { stdout: " 10:20:01 up  2:14,  1 user,  load average: 0.18, 0.21, 0.17\n" };
    refresh(this);
    const t = now(p), d = wallDate(p, t);
    if (args.includes("-p") || args.includes("--pretty")) {
      const s = Math.floor(UP0 + t), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60;
      const parts = [];
      if (h) parts.push(`${h} hour${h === 1 ? "" : "s"}`);
      parts.push(`${m} minute${m === 1 ? "" : "s"}`);
      return { stdout: `up ${parts.join(", ")}\n` };
    }
    if (args.includes("-s") || args.includes("--since")) {
      const b = wallDate(p, -UP0);
      return { stdout: `${b.getFullYear()}-${two(b.getMonth() + 1)}-${two(b.getDate())} ${hms(b)}\n` };
    }
    return { stdout: ` ${hms(d)} up ${upText(p)},  ${users()},  load average: ${loadavg(p).join(", ")}\n` };
  };

  function memFigures(p) {
    const extra = [...p.procs.values()].filter((x) => !x.sys).reduce((a, x) => a + x.rss, 0) / 1024;
    return { total: 3916.1, used: 1490.2 + extra, free: 812.4 - extra, shared: 58.3, buff: 1613.5, avail: 2425.9 - extra, stotal: 2048.0, sused: 0, sfree: 2048.0 };
  }
  C.free = function (args) {
    const p = P(this);
    const m = memFigures(p || { procs: new Map() });
    const human = args.some((a) => /^-[a-z]*h/.test(a) || a === "--human");
    const unit = args.includes("-m") || args.includes("--mebi") ? "m" : args.includes("-g") || args.includes("--gibi") ? "g" : args.includes("-b") || args.includes("--bytes") ? "b" : "k";
    const fmt = (mib) => {
      if (human) {
        const b = mib * 1048576;
        if (b < 1) return "0B";
        if (mib >= 1024) return (mib / 1024).toFixed(1) + "Gi";
        if (mib >= 1) return Math.round(mib) + "Mi";
        return Math.round(mib * 1024) + "Ki";
      }
      return String(Math.round(unit === "m" ? mib : unit === "g" ? mib / 1024 : unit === "b" ? mib * 1048576 : mib * 1024));
    };
    const lines = [
      "               total        used        free      shared  buff/cache   available",
      ("Mem:").padEnd(8) + [m.total, m.used, m.free, m.shared, m.buff, m.avail].map((v) => fmt(v).padStart(12)).join(""),
      ("Swap:").padEnd(8) + [m.stotal, m.sused, m.sfree].map((v) => fmt(v).padStart(12)).join(""),
    ];
    if (args.some((a) => /^-[a-z]*t/.test(a) || a === "--total")) lines.push("Total:".padEnd(8) + [m.total + m.stotal, m.used, m.free + m.sfree].map((v) => fmt(v).padStart(12)).join(""));
    return { stdout: lines.join("\n") + "\n" };
  };
  C.nproc = function (args) { return { stdout: "2\n" }; };
  C.tty = function (args, stdin, res, ctx = {}) {
    const p = P(this);
    if (this.batch || ctx.fromXargsStdin) return { stdout: "not a tty\n", status: 1 };
    if (args.includes("-s")) return {};
    return { stdout: "/dev/" + (p ? p.ctx.tty : "pts/0") + "\n" };
  };
  if (!C.seq) C.seq = function (args) {
    const o = { s: "\n", w: false };
    const nums = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === "-s") { o.s = args[++i].replace(/\\n/g, "\n").replace(/\\t/g, "\t"); continue; }
      if (a.startsWith("-s") && a.length > 2) { o.s = a.slice(2); continue; }
      if (a === "-w") { o.w = true; continue; }
      if (!/^-?\d+(\.\d+)?$/.test(a)) return { stderr: `seq: invalid floating point argument: '${a}'\nTry 'seq --help' for more information.`, status: 1 };
      nums.push(+a);
    }
    if (!nums.length) return { stderr: "seq: missing operand\nTry 'seq --help' for more information.", status: 1 };
    const [first, step, last] = nums.length === 1 ? [1, 1, nums[0]] : nums.length === 2 ? [nums[0], 1, nums[1]] : nums;
    const out = [];
    if (step > 0) for (let v = first; v <= last && out.length < 100000; v += step) out.push(v);
    else if (step < 0) for (let v = first; v >= last && out.length < 100000; v += step) out.push(v);
    const w = Math.max(...out.map((v) => String(v).length), 1);
    return { stdout: out.length ? out.map((v) => (o.w ? String(v).padStart(w, "0") : String(v))).join(o.s) + "\n" : "" };
  };

  /* ------------------------------------------------------------------ top */
  const SORTS = { cpu: "%CPU", mem: "%MEM", pid: "PID", time: "TIME+" };
  function topRows(sh, app) {
    const p = P(sh);
    let rows = [...p.procs.values()].map((x) => {
      const kthread = /^\[/.test(x.args);
      const pct = x.state === "R" ? x.pct * 100 : x.state === "T" ? 0 : x.sysPct || (x === app.proc ? 0.3 : 0);
      const ni = kthread && x.stat.includes("<") ? -20 : x.ni;
      return { x, pid: x.pid, user: x.user, pr: kthread && x.stat.includes("<") ? "0" : String(20 + ni), ni, virt: x.vsz, res: x.rss, shr: Math.round(x.rss * 0.62),
        s: x.state === "R" || x === app.proc ? "R" : x.sys ? x.stat[0] : x.state, cpu: pct, mem: (x.rss / MEM_KB) * 100, time: cpuTime(p, x), comm: x.comm, args: x.args };
    });
    if (app.user) rows = rows.filter((r) => r.user === app.user || String(uidOf(r.user)) === app.user);
    if (app.pids) rows = rows.filter((r) => app.pids.includes(r.pid));
    const by = { cpu: (a, b) => b.cpu - a.cpu || b.time - a.time, mem: (a, b) => b.mem - a.mem || b.cpu - a.cpu, pid: (a, b) => b.pid - a.pid, time: (a, b) => b.time - a.time }[app.sort];
    rows.sort((a, b) => by(a, b) || a.pid - b.pid);
    return rows;
  }
  const kb = (v) => (v > 9999999 ? (v / 1048576).toFixed(1) + "g" : String(v));
  const timePlus = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, "0")}`;
  function topText(sh, app, maxRows) {
    const p = P(sh), t = now(p), d = wallDate(p, t);
    const rows = topRows(sh, app);
    const all = [...p.procs.values()];
    const running = all.filter((x) => x.state === "R" || x === app.proc).length, stopped = all.filter((x) => x.state === "T").length;
    const user = all.filter((x) => x.state === "R" && x.ni <= 0).reduce((a, x) => a + x.pct * 100, 0), nice = all.filter((x) => x.state === "R" && x.ni > 0).reduce((a, x) => a + x.pct * 100, 0);
    const f4 = (v) => v.toFixed(1).padStart(4), f8 = (v) => v.toFixed(1).padStart(8);
    const cpuLine = (label, us, ni, sy) => `${label} ${f4(us)} us, ${f4(sy)} sy, ${f4(ni)} ni, ${f4(Math.max(0, 100 - us - ni - sy - 0.1))} id,  0.0 wa,  0.0 hi,  0.1 si,  0.0 st`;
    const m = memFigures(p);
    const head = [
      `top - ${hms(d)} up ${upText(p)},  ${users()},  load average: ${loadavg(p).join(", ")}`,
      `Tasks: ${String(all.length).padStart(3)} total, ${String(running).padStart(3)} running, ${String(all.length - running - stopped).padStart(3)} sleeping, ${String(stopped).padStart(3)} stopped, ${"0".padStart(3)} zombie`,
      ...(app.perCpu
        ? [cpuLine("%Cpu0  :", Math.min(99.6 - Math.min(99.6, nice), user + 1.0), Math.min(99.6, nice), 0.3), cpuLine("%Cpu1  :", 1.4, 0, 0.7)]
        : [cpuLine("%Cpu(s):", (user + 2.4) / NCPU, nice / NCPU, 0.5)]),
      `MiB Mem : ${f8(m.total)} total, ${f8(m.free)} free, ${f8(m.used)} used, ${f8(m.buff)} buff/cache`,
      `MiB Swap: ${f8(m.stotal)} total, ${f8(m.sfree)} free, ${f8(m.sused)} used. ${f8(m.avail)} avail Mem`,
    ];
    const colHead = "    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND";
    const fmtRow = (r) => `${String(r.pid).padStart(7)} ${(r.user.length > 8 ? r.user.slice(0, 7) + "+" : r.user).padEnd(8)} ${r.pr.padStart(3)} ${String(r.ni).padStart(3)} ${kb(r.virt).padStart(7)} ${kb(r.res).padStart(6)} ${kb(r.shr).padStart(6)} ${r.s} ${r.cpu.toFixed(1).padStart(5)} ${r.mem.toFixed(1).padStart(5)} ${timePlus(r.time).padStart(9)} ${app.full ? r.args : r.comm}`;
    return { head, colHead, rows, fmtRow, lines: maxRows === undefined ? rows.map(fmtRow) : rows.slice(app.offset || 0, (app.offset || 0) + maxRows).map(fmtRow) };
  }

  function makeTop(sh, o = {}) {
    const app = { name: "top", sort: o.sort || "cpu", perCpu: false, user: o.user || null, pids: o.pids || null, full: !!o.full, prompt: null, msg: "", hl: null, offset: 0,
      keysUsed: new Set(), interval: o.delay || 3, proc: null };
    app.buttons = [["P", "P"], ["M", "M"], ["1", "1"], ["k", "k"], ["r", "r"], ["L", "L"], ["u", "u"], ["q", "q"], ["⏎", "Enter"], ["Esc", "Escape"], ["⌫", "Backspace"], ["^Z", "Ctrl+z"]];
    app.lines = (rows) => {
      const t = topText(sh, app, Math.max(1, rows - 7 - (app.perCpu ? 1 : 0)));
      const promptLine = app.prompt ? `<span class="sa-prompt">${esc(app.prompt.label)}</span>${esc(app.prompt.value)}<span class="vi-cursor ins"> </span>` : esc(app.msg || "");
      const body = t.rows.slice(app.offset, app.offset + Math.max(1, rows - 7 - (app.perCpu ? 1 : 0))).map((r) => {
        const line = esc(t.fmtRow(r));
        return app.hl && t.fmtRow(r).includes(app.hl) ? `<span class="sa-hl">${line}</span>` : line;
      });
      return [...t.head.map(esc), promptLine, `<span class="sa-hdr">${esc(t.colHead)}</span>`, ...body];
    };
    app.defaultPid = () => topRows(sh, app)[0]?.pid;
    app.key = (k, emit) => topKey(sh, app, k, emit);
    return app;
  }

  function topKey(sh, app, k, emit) {
    const p = P(sh);
    if (app.prompt) {
      const pr = app.prompt;
      if (k === "Escape" || k === "Ctrl+c") { app.prompt = null; app.msg = ""; return; }
      if (k === "Enter") { app.prompt = null; pr.next(pr.value.trim()); return; }
      if (k === "Backspace") { pr.value = pr.value.slice(0, -1); return; }
      if (k.length === 1) pr.value += k;
      return;
    }
    if (k === "q" || k === "Ctrl+c") {
      emit({ type: "top-quit", keys: [...app.keysUsed].join(" ") });
      if (app.proc) endProc(sh, app.proc, "Done");
      return { close: true, res: { out: [], events: [] } };
    }
    if (k === "Ctrl+z") {
      const proc = app.proc;
      deliver(sh, proc, 20, { asRoot: true });
      const ctx = proc.ctx, job = jobOf(proc);
      if (job) job.notify = false;
      return { close: true, res: { out: [{ text: "" }, { text: job ? fmtJob(ctx, job) : "[1]+  Stopped                 top" }], events: [{ type: "job-stopped", pid: proc.pid, comm: "top", how: "ctrl-z" }] } };
    }
    app.msg = "";
    app.keysUsed.add(k);
    emit({ type: "top-key", key: k });
    switch (k) {
      case "P": app.sort = "cpu"; app.offset = 0; emit({ type: "top-sort", by: "cpu" }); break;
      case "M": app.sort = "mem"; app.offset = 0; emit({ type: "top-sort", by: "mem" }); break;
      case "N": app.sort = "pid"; app.offset = 0; emit({ type: "top-sort", by: "pid" }); break;
      case "T": app.sort = "time"; app.offset = 0; emit({ type: "top-sort", by: "time" }); break;
      case "1": app.perCpu = !app.perCpu; emit({ type: "top-percpu", on: app.perCpu ? "yes" : "no" }); break;
      case "c": app.full = !app.full; break;
      case "ArrowDown": app.offset++; break;
      case "ArrowUp": app.offset = Math.max(0, app.offset - 1); break;
      case "k": {
        const def = app.defaultPid();
        app.prompt = { label: `PID to signal/kill [default pid = ${def}] `, value: "", next: (v) => {
          const pid = v === "" ? def : parseInt(v, 10);
          if (!Number.isInteger(pid)) { app.msg = " Unacceptable integer"; return; }
          app.prompt = { label: `Send pid ${pid} signal [15/sigterm] `, value: "", next: (s) => {
            const sig = s === "" ? 15 : sigNum(s);
            const proc = p.procs.get(pid);
            if (sig === null) { app.msg = " Unacceptable signal value"; return; }
            if (!proc) { app.msg = ` Failed signal pid '${pid}' with '${sig}': No such process`; return; }
            const e = deliver(sh, proc, sig);
            if (e) { app.msg = ` Failed signal pid '${pid}' with '${sig}': ${e}`; return; }
            emit({ type: "top-kill", pid, sig: sigName(sig), comm: proc.comm });
          } };
        } };
        break;
      }
      case "r": {
        const def = app.defaultPid();
        app.prompt = { label: `PID to renice [default pid = ${def}] `, value: "", next: (v) => {
          const pid = v === "" ? def : parseInt(v, 10);
          if (!Number.isInteger(pid)) { app.msg = " Unacceptable integer"; return; }
          app.prompt = { label: `Renice PID ${pid} to value `, value: "", next: (s) => {
            const val = parseInt(s, 10), proc = p.procs.get(pid);
            if (!Number.isInteger(val)) { app.msg = " Unacceptable nice value"; return; }
            if (!proc) { app.msg = ` Failed setpriority pid '${pid}' with '${val}': No such process`; return; }
            const e = setNice(sh, proc, val);
            if (e) { app.msg = ` Failed setpriority pid '${pid}' with '${val}': ${e}`; return; }
            emit({ type: "top-renice", pid, ni: proc.ni, comm: proc.comm });
            emit({ type: "renice", pid, ni: proc.ni, comm: proc.comm });
          } };
        } };
        break;
      }
      case "L": case "&": {
        const find = (s) => {
          const t = topText(sh, app);
          const idx = t.rows.findIndex((r) => t.fmtRow(r).includes(s));
          if (idx < 0) { app.msg = ` Locate string '${s}' not found`; app.hl = null; emit({ type: "top-locate", text: s, found: "no" }); return; }
          app.hl = s; app.offset = Math.max(0, idx - 2);
          emit({ type: "top-locate", text: s, found: "yes" });
        };
        if (k === "&" && app.hl) { find(app.hl); break; }
        app.prompt = { label: "Locate string ", value: "", next: (s) => (s ? find(s) : (app.hl = null)) };
        break;
      }
      case "u": case "U":
        app.prompt = { label: "Which user (blank for all) ", value: "", next: (s) => {
          if (!s) { app.user = null; return; }
          if (![...p.procs.values()].some((x) => x.user === s) && !/^\d+$/.test(s) && !["root", "max", "nobody"].includes(s)) { app.msg = " Invalid user"; return; }
          app.user = s; emit({ type: "top-user", user: s });
        } };
        break;
      case "h": case "?": app.msg = " P cpu  M mem  N pid  T time  1 cpus  k kill  r renice  L locate  u user  c command  q quit"; break;
      default: break;
    }
  }

  C.top = function (args, stdin, res, ctx = {}) {
    const p = P(this);
    if (!p) return { stderr: "top: failed tty get", status: 1 };
    refresh(this);
    const o = { batch: false, n: null, delay: 3 };
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      let m;
      if (a === "-b" || a === "--batch") o.batch = true;
      else if ((m = a.match(/^-n(\d*)$/))) o.n = parseInt(m[1] || args[++i], 10);
      else if ((m = a.match(/^-d(.*)$/))) o.delay = parseFloat(m[1] || args[++i]);
      else if ((m = a.match(/^-u(.*)$/)) || (m = a.match(/^-U(.*)$/))) o.user = m[1] || args[++i];
      else if ((m = a.match(/^-p(.*)$/))) o.pids = (m[1] || args[++i]).split(",").map(Number);
      else if ((m = a.match(/^-o(.*)$/))) { const f = (m[1] || args[++i]).replace(/^[+-]/, "").toUpperCase(); o.sort = f === "%MEM" ? "mem" : f === "PID" ? "pid" : f.startsWith("TIME") ? "time" : "cpu"; }
      else if (a === "-c") o.full = true;
      else if (/^-b/.test(a)) { o.batch = true; const n = a.match(/n(\d+)/); if (n) o.n = +n[1]; }
      else if (a === "-v" || a === "-V") return { stdout: "procps-ng 4.0.4\n" };
      else if (a === "-h") return { stdout: "Usage:\n  top -hv | -bcEeHiOSs1 -d secs -n max -u|U user -p pid(s) -o field -w [cols]\n" };
    }
    if (o.batch) {
      const app = makeTop(this, o);
      const self = addProc(this, { ppid: p.ctx.pid, user: actor(this), tty: p.ctx.tty, args: "top " + args.join(" "), comm: "top", rss: 4352, vsz: 12036, ctx: null, kind: "self" });
      app.proc = self;
      const frames = [];
      const n = o.n || 1;
      try {
        for (let i = 0; i < n; i++) {
          if (i) { p.offset += o.delay; refresh(this); }
          const t = topText(this, app);
          frames.push([...t.head, "", t.colHead, ...t.lines].join("\n"));
        }
      } finally { p.procs.delete(self.pid); }
      res.events.push({ type: "top-batch", n: String(n) });
      return { stdout: frames.join("\n\n") + "\n" };
    }
    if (this.batch || ctx.tty === false) return { stderr: "top: failed tty get", status: 1 };
    const app = makeTop(this, o);
    return spawn(this, { args: ["top", ...args].join(" "), comm: "top", duration: Infinity, pct: 0, rss: 4352, vsz: 12036, kind: "app", app }, res);
  };

  /* ------------------------------------------------------------------ watch */
  C.watch = function (args, stdin, res, ctx = {}) {
    const p = P(this);
    let n = 2, diff = false, i = 0, title = true;
    for (; i < args.length; i++) {
      const a = args[i];
      let m;
      if (a === "-n" || a === "--interval") n = parseFloat(args[++i]);
      else if ((m = a.match(/^-n(.+)$/)) || (m = a.match(/^--interval=(.+)$/))) n = parseFloat(m[1]);
      else if (a === "-d" || a === "--differences" || a.startsWith("--differences=")) diff = true;
      else if (a === "-t" || a === "--no-title") title = false;
      else if (/^-[dt]+n?$/.test(a)) { if (a.includes("d")) diff = true; if (a.includes("t")) title = false; if (a.endsWith("n")) n = parseFloat(args[++i]); }
      else break;
    }
    const cmd = args.slice(i).join(" ");
    if (!cmd) return { stderr: "Usage:\n watch [options] command", status: 1 };
    if (!(n > 0)) n = 2;
    n = Math.max(0.1, n);
    if (!p || this.batch || ctx.tty === false) return { stderr: "Error opening terminal: unknown.", status: 1 };
    const sh = this;
    const app = { name: "watch", cmd, n, diff, title, ticks: 0, prev: null, cur: "", interval: n, proc: null };
    app.tick = () => { app.prev = app.cur; app.cur = sh.runCapture(cmd); app.ticks++; app.at = wallDate(p, now(p)); };
    app.tick();
    app.buttons = [["^C", "Ctrl+c"], ["^Z", "Ctrl+z"]];
    app.lines = () => {
      const lines = [];
      if (app.title) {
        lines.push(`<span class="sa-split"><span>Every ${n.toFixed(1)}s: ${esc(cmd)}</span><span>${esc(sh.host)}: ${esc(ctime(app.at))}</span></span>`);
        lines.push("");
      }
      const prev = (app.prev || "").split("\n");
      app.cur.split("\n").forEach((l, idx) => {
        if (!app.diff || app.prev === null) { lines.push(esc(l)); return; }
        const o = prev[idx] || "";
        lines.push([...l].map((ch, k) => (ch !== o[k] ? `<mark class="watch-diff">${esc(ch)}</mark>` : esc(ch))).join(""));
      });
      return lines;
    };
    app.key = (k, emit) => {
      if (k === "Ctrl+c") {
        emit({ type: "watch-exit", cmd, ticks: String(app.ticks) });
        if (app.proc) endProc(sh, app.proc, "Done");
        return { close: true, res: { out: [], events: [] } };
      }
      if (k === "Ctrl+z") {
        deliver(sh, app.proc, 20, { asRoot: true });
        const job = jobOf(app.proc);
        if (job) job.notify = false;
        return { close: true, res: { out: [{ text: "" }, { text: job ? fmtJob(app.proc.ctx || p.ctx, job) : "" }], events: [] } };
      }
    };
    res.events.push({ type: "watch-start", cmd, n: String(n) });
    return spawn(this, { args: "watch " + args.join(" "), comm: "watch", duration: Infinity, pct: 0, rss: 3968, vsz: 9884, kind: "app", app }, res);
  };

  /* ------------------------------------------------------------------ full-screen programs (top, watch) */
  function normaliseKey(e) {
    if (e.ctrlKey && /^[a-z]$/i.test(e.key)) return "Ctrl+" + e.key.toLowerCase();
    if (e.key === "Esc") return "Escape";
    return e.key;
  }
  LPIC.openScreenApp = function ({ app, shell, panel, onEvent, onClose }) {
    const wrap = document.createElement("div");
    wrap.className = "editor screenapp sa-" + app.name;
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-label", app.name);
    const btn = ([label, key], cls = "") => `<button type="button" class="${cls}" data-k="${esc(key)}">${esc(label)}</button>`;
    wrap.innerHTML = `<div class="vi-screen sa-screen"></div><pre class="sa-note" hidden></pre>
      <textarea class="vi-input" aria-label="${esc(app.name)} keyboard input" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false"></textarea>
      <div class="vi-keys"></div>`;
    panel.append(wrap);
    const screen = wrap.querySelector(".sa-screen"), note = wrap.querySelector(".sa-note"), input = wrap.querySelector(".vi-input"), keys = wrap.querySelector(".vi-keys");
    let rows = 16, closed = false, timer = null, keySig = "";
    const render = () => {
      if (closed) return;
      screen.innerHTML = app.lines(rows).map((l) => `<div class="vi-line">${l || "&nbsp;"}</div>`).join("");
      note.hidden = !app.note;
      note.textContent = app.note ? app.note.join("\n") : "";
      // While a tmux/screen key or a y/n answer is awaited, those keys replace the program's own.
      const mux = shell.muxButtons ? shell.muxButtons() : [];
      const list = shell.awaitingKey && shell.awaitingKey() ? mux.map((b) => [b, "on"]) : [...app.buttons.map((b) => [b, ""]), ...mux.map((b) => [b, "on"])];
      const sig = JSON.stringify(list);
      if (sig !== keySig) { keySig = sig; keys.innerHTML = list.map(([b, cls]) => btn(b, cls)).join(""); }
    };
    const close = (r) => {
      if (closed) return;
      closed = true;
      clearInterval(timer);
      wrap.remove();
      onClose(r || { out: [], events: [] });
    };
    const press = (k) => {
      if (closed) return;
      app.note = null;
      if (shell.awaitingKey && (shell.awaitingKey() || (shell.muxPrefix() && k === shell.muxPrefix()))) {
        const r = shell.sendKey(k);
        if (r) {
          (r.events || []).forEach(onEvent);
          if (shell.proc.ctx.app !== app || r.leave) return close({ ...r, events: [] });
          if (r.out && r.out.length) app.note = r.out.map((o) => o.text);
        } else if (shell.awaitingKey()) app.note = [`(${shell.muxPrefix() === "Ctrl+b" ? "Ctrl+B" : "Ctrl+A"} pressed: now press the command key)`];
        render();
        return;
      }
      const r = app.key(k, onEvent);
      if (r && r.close) return close(r.res);
      render();
    };
    input.addEventListener("keydown", (e) => {
      if (e.isComposing || e.key === "Unidentified" || e.key === "Process") return;
      if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(e.key)) return;
      e.preventDefault();
      press(normaliseKey(e));
    });
    input.addEventListener("input", () => { const v = input.value; input.value = ""; for (const ch of v) press(ch === "\n" ? "Enter" : ch); });
    keys.addEventListener("mousedown", (e) => { if (e.target.closest("button")) e.preventDefault(); });
    keys.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; press(b.dataset.k); input.focus({ preventScroll: true }); });
    screen.addEventListener("click", () => input.focus({ preventScroll: true }));
    render();
    const lineH = screen.querySelector(".vi-line")?.offsetHeight || 18;
    rows = Math.max(8, Math.floor((screen.clientHeight - 8) / lineH));
    render();
    timer = setInterval(() => {
      if (!document.contains(wrap)) { clearInterval(timer); return; }
      refresh(shell);
      if (!shell.proc.procs.has(app.proc?.pid)) return close({ out: [], events: [] }); // killed from elsewhere
      if (app.tick) app.tick();
      render();
    }, app.interval * 1000);
    input.focus({ preventScroll: true });
    onEvent({ type: app.name + "-open" });
  };

  /* ------------------------------------------------------------------ tmux and screen */
  const leaves = (n) => (n.split ? [...leaves(n.a), ...leaves(n.b)] : [n]);
  const replaceNode = (n, from, to) => (n === from ? to : n.split ? { ...n, a: replaceNode(n.a, from, to), b: replaceNode(n.b, from, to) } : n);
  function removeLeaf(n, leaf) {
    if (n === leaf) return null;
    if (!n.split) return n;
    if (n.a === leaf) return n.b;
    if (n.b === leaf) return n.a;
    return { ...n, a: removeLeaf(n.a, leaf), b: removeLeaf(n.b, leaf) };
  }
  function drawLayout(tree, label) {
    const W = 46, H = 9;
    const g = Array.from({ length: H }, () => Array(W).fill(" "));
    const draw = (n, x, y, w, h) => {
      if (n.split === "h") { const w1 = Math.floor(w / 2); draw(n.a, x, y, w1 + 1, h); draw(n.b, x + w1, y, w - w1, h); return; }
      if (n.split === "v") { const h1 = Math.floor(h / 2); draw(n.a, x, y, w, h1 + 1); draw(n.b, x, y + h1, w, h - h1); return; }
      for (let i = x; i < x + w; i++) { g[y][i] = "-"; g[y + h - 1][i] = "-"; }
      for (let j = y; j < y + h; j++) { g[j][x] = "|"; g[j][x + w - 1] = "|"; }
      [[x, y], [x + w - 1, y], [x, y + h - 1], [x + w - 1, y + h - 1]].forEach(([a, b]) => (g[b][a] = "+"));
      const text = label(n).slice(0, Math.max(0, w - 4));
      const ty = y + Math.floor((h - 1) / 2);
      for (let i = 0; i < text.length; i++) g[ty][x + 2 + i] = text[i];
    };
    draw(tree, 0, 0, W, H);
    return g.map((r) => ({ text: r.join("").replace(/\s+$/, ""), cls: "terminal-muted" }));
  }
  const ctxLabel = (ctx) => (ctx.app ? ctx.app.name : ctx.fg ? ctx.fg.proc.comm : "bash");

  // --- tmux
  function tmuxSession(p, name) { return p.tmux && p.tmux.sessions.find((s) => s.name === name); }
  function tmuxActiveCtx(s) { const w = s.windows[s.cur]; return w.active.ctx; }
  function tmuxNewPane(sh, s) {
    const p = P(sh);
    return { leaf: true, ctx: newCtx(sh, { kind: "pane", tty: `pts/${p.pts++}`, ppid: p.tmux.server.pid }) };
  }
  function tmuxNewWindow(sh, s) {
    const pane = tmuxNewPane(sh, s);
    pane.ctx.session = s;
    const idx = s.windows.length ? Math.max(...s.windows.map((w) => w.index)) + 1 : 0;
    const w = { index: idx, layout: pane, active: pane };
    pane.ctx.window = w;
    s.windows.push(w);
    s.cur = s.windows.length - 1;
    return w;
  }
  function tmuxAttach(sh, s, res, how) {
    const p = P(sh);
    p.attached = "tmux";
    p.attachedSession = s;
    p.detachCtx = p.detachCtx || p.ctx;
    p.client = addProc(sh, { ppid: p.detachCtx.pid, user: sh.user, tty: p.detachCtx.tty, args: how, comm: "tmux: client", rss: 3456, vsz: 9732, kind: "mux-client" });
    p.ctx = tmuxActiveCtx(s);
    res.events.push({ type: "mux", kind: "tmux", action: "attach", session: s.name });
  }
  function tmuxDetach(sh, res, how = "detached (from session") {
    const p = P(sh), s = p.attachedSession;
    if (p.client) p.procs.delete(p.client.pid);
    p.client = null;
    p.attached = null; p.attachedSession = null;
    p.ctx = p.detachCtx; p.detachCtx = null;
    if (how) res.out.push({ text: `[${how} ${s.name})]` });
    res.events.push({ type: "mux", kind: "tmux", action: "detach", session: s.name });
  }
  function tmuxEndSession(sh, s, res) {
    const p = P(sh);
    for (const w of s.windows) for (const l of leaves(w.layout)) if (!l.ctx.closed) closeCtx(sh, l.ctx, 1);
    p.tmux.sessions = p.tmux.sessions.filter((x) => x !== s);
    const wasAttached = p.attachedSession === s;
    if (wasAttached) { tmuxDetach(sh, res, null); res.out.push({ text: "[exited]" }); }
    if (!p.tmux.sessions.length) { p.procs.delete(p.tmux.server.pid); p.tmux = null; }
    res.events.push({ type: "mux", kind: "tmux", action: "end", session: s.name });
  }
  function tmuxKillWindow(sh, s, w, res) {
    for (const l of leaves(w.layout)) if (!l.ctx.closed) closeCtx(sh, l.ctx, 1);
    s.windows = s.windows.filter((x) => x !== w);
    res.events.push({ type: "mux", kind: "tmux", action: "kill-window", session: s.name });
    if (!s.windows.length) return tmuxEndSession(sh, s, res);
    s.cur = Math.min(s.cur, s.windows.length - 1);
    if (P(sh).attachedSession === s) P(sh).ctx = tmuxActiveCtx(s);
  }
  function tmuxKillPane(sh, s, w, leaf, res) {
    if (!leaf.ctx.closed) closeCtx(sh, leaf.ctx, 1);
    const tree = removeLeaf(w.layout, leaf);
    if (!tree) return tmuxKillWindow(sh, s, w, res);
    w.layout = tree;
    w.active = leaves(tree)[0];
    if (P(sh).attachedSession === s) P(sh).ctx = tmuxActiveCtx(s);
    res.events.push({ type: "mux", kind: "tmux", action: "kill-pane", session: s.name });
  }
  // A pane's shell has gone (exit, or killed): close the pane, maybe the window and session.
  function tmuxPaneGone(sh, ctx, res = null) {
    const p = P(sh), s = ctx.session, w = ctx.window;
    if (!s || !w) return;
    const leaf = leaves(w.layout).find((l) => l.ctx === ctx);
    const r = res || { out: [], events: [] };
    if (leaf) tmuxKillPane(sh, s, w, leaf, r);
    if (!res) p.outbox.push(...r.out);
  }
  const tmuxLayout = (s) => {
    const w = s.windows[s.cur], ls = leaves(w.layout);
    return drawLayout(w.layout, (l) => `${ls.indexOf(l)}: ${ctxLabel(l.ctx)}${l === w.active ? " (active)" : ""}`);
  };

  C.tmux = function (args, stdin, res, ctx = {}) {
    const p = P(this);
    if (!p) return { stderr: "open terminal failed: not a terminal", status: 1 };
    if (args[0] === "-V") return { stdout: "tmux 3.4\n" };
    const noServer = { stderr: "no server running on /tmp/tmux-1000/default", status: 1 };
    let sub = args[0] && !args[0].startsWith("-") ? args[0] : "new-session";
    const rest = args[0] && !args[0].startsWith("-") ? args.slice(1) : args;
    const opt = (f) => { const i = rest.indexOf(f); return i >= 0 ? rest[i + 1] : undefined; };
    const alias = { new: "new-session", ls: "list-sessions", a: "attach-session", at: "attach-session", attach: "attach-session", "kill-ses": "kill-session", detach: "detach-client", neww: "new-window", splitw: "split-window", lsw: "list-windows" };
    sub = alias[sub] || sub;
    if (sub === "new-session") {
      if (p.attached) return { stderr: "sessions should be nested with care, unset $TMUX to force", status: 1 };
      if (this.batch || ctx.tty === false) return { stderr: "open terminal failed: not a terminal", status: 1 };
      if (!p.tmux) p.tmux = { sessions: [], server: addProc(this, { ppid: 1, user: this.user, tty: "?", args: "tmux " + args.join(" "), comm: "tmux: server", rss: 3712, vsz: 9876, kind: "tmux-server" }) };
      let name = opt("-s");
      if (name === undefined) { let n = 0; while (tmuxSession(p, String(n))) n++; name = String(n); }
      if (tmuxSession(p, name)) return { stderr: `duplicate session: ${name}`, status: 1 };
      const s = { name, created: now(p), windows: [], cur: 0 };
      p.tmux.sessions.push(s);
      tmuxNewWindow(this, s);
      res.events.push({ type: "mux", kind: "tmux", action: "new", session: name });
      if (rest.includes("-d")) return {};
      tmuxAttach(this, s, res, "tmux " + args.join(" "));
      res.out.push({ text: `[tmux session ${name}. Ctrl+B is the prefix: press it, then % or " to split, an arrow to move, d to detach, & to close the window.]`, cls: "terminal-muted" });
      return {};
    }
    if (sub === "list-sessions") {
      if (!p.tmux) return noServer;
      return { stdout: p.tmux.sessions.map((s) => `${s.name}: ${s.windows.length} windows (created ${ctime(wallDate(p, s.created))})${p.attachedSession === s ? " (attached)" : ""}`).join("\n") + "\n" };
    }
    if (sub === "attach-session") {
      if (!p.tmux) return noServer;
      if (p.attached) return { stderr: "sessions should be nested with care, unset $TMUX to force", status: 1 };
      const name = opt("-t");
      const s = name === undefined ? p.tmux.sessions[p.tmux.sessions.length - 1] : tmuxSession(p, name);
      if (!s) return { stderr: `can't find session: ${name}`, status: 1 };
      tmuxAttach(this, s, res, "tmux " + args.join(" "));
      res.out.push(...tmuxLayout(s));
      if (p.ctx.app) res.screen = { app: p.ctx.app };
      return {};
    }
    if (sub === "kill-session") {
      if (!p.tmux) return noServer;
      const name = opt("-t");
      const s = name === undefined ? (p.attachedSession || p.tmux.sessions[p.tmux.sessions.length - 1]) : tmuxSession(p, name);
      if (!s) return { stderr: `can't find session: ${name}`, status: 1 };
      tmuxEndSession(this, s, res);
      return {};
    }
    if (sub === "kill-server") {
      if (!p.tmux) return noServer;
      [...p.tmux.sessions].forEach((s) => tmuxEndSession(this, s, res));
      return {};
    }
    if (sub === "detach-client") {
      if (p.attached !== "tmux") return { stderr: "no current client", status: 1 };
      tmuxDetach(this, res);
      return {};
    }
    if (sub === "list-windows") {
      const s = p.attachedSession || (p.tmux && p.tmux.sessions[0]);
      if (!s) return noServer;
      return { stdout: s.windows.map((w, i) => `${w.index}: ${ctxLabel(w.active.ctx)}${i === s.cur ? "*" : "-"} (${leaves(w.layout).length} panes)`).join("\n") + "\n" };
    }
    if (sub === "split-window" || sub === "new-window") {
      if (p.attached !== "tmux") return { stderr: "no current client", status: 1 };
      const r = muxKey(this, sub === "new-window" ? "c" : rest.includes("-h") ? "%" : '"');
      res.out.push(...r.out); res.events.push(...r.events);
      return {};
    }
    return { stderr: `unknown command: ${args[0]}`, status: 1 };
  };

  // --- screen
  function screenSession(p, name) { return p.screen && p.screen.sessions.find((s) => s.name === name || `${s.pid}.${s.name}` === name || String(s.pid) === name); }
  function activeScreenCtx(sh) {
    const p = P(sh), s = p.attachedSession;
    if (p.attached !== "screen" || !s) return p.ctx;
    const w = s.windows.find((x) => x.num === s.active.win);
    return w ? w.ctx : null;
  }
  function screenNewWindow(sh, s) {
    const p = P(sh);
    let num = 0;
    while (s.windows.some((w) => w.num === num)) num++;
    const ctx = newCtx(sh, { kind: "window", tty: `pts/${p.pts++}`, ppid: s.pid });
    const w = { num, title: "bash", ctx };
    ctx.session = s; ctx.screenWin = w;
    s.windows.push(w);
    s.windows.sort((a, b) => a.num - b.num);
    return w;
  }
  function screenSync(sh) {
    const p = P(sh), s = p.attachedSession;
    const c = activeScreenCtx(sh);
    if (c) p.ctx = c;
    return c;
  }
  function screenEnd(sh, s, res) {
    const p = P(sh);
    for (const w of s.windows) if (!w.ctx.closed) closeCtx(sh, w.ctx, 1);
    p.procs.delete(s.pid);
    p.screen.sessions = p.screen.sessions.filter((x) => x !== s);
    if (p.attachedSession === s) {
      p.attached = null; p.attachedSession = null;
      if (p.client) p.procs.delete(p.client.pid);
      p.client = null;
      p.ctx = p.detachCtx; p.detachCtx = null;
      res.out.push({ text: "[screen is terminating]" });
    }
    if (!p.screen.sessions.length) p.screen = null;
    res.events.push({ type: "mux", kind: "screen", action: "end", session: s.name });
  }
  function screenKillWindow(sh, s, w, res) {
    if (!w.ctx.closed) closeCtx(sh, w.ctx, 1);
    s.windows = s.windows.filter((x) => x !== w);
    res.events.push({ type: "mux", kind: "screen", action: "kill-window", session: s.name });
    if (!s.windows.length) return screenEnd(sh, s, res);
    // Regions that showed the killed window switch to another window, as screen does.
    for (const l of leaves(s.layout)) if (l.win === w.num) {
      const shown = leaves(s.layout).map((x) => x.win);
      const next = s.windows.find((x) => !shown.includes(x.num)) || s.windows[0];
      l.win = next.num;
    }
    screenSync(sh);
  }
  function screenWindowGone(sh, ctx, res = null) {
    const p = P(sh), s = ctx.session;
    if (!s) return;
    const w = s.windows.find((x) => x.ctx === ctx);
    const r = res || { out: [], events: [] };
    if (w) screenKillWindow(sh, s, w, r);
    if (!res) p.outbox.push(...r.out);
  }
  function screenAttach(sh, s, res) {
    const p = P(sh);
    p.attached = "screen"; p.attachedSession = s;
    p.detachCtx = p.detachCtx || p.ctx;
    p.client = addProc(sh, { ppid: p.detachCtx.pid, user: sh.user, tty: p.detachCtx.tty, args: `screen -r ${s.name}`, comm: "screen", rss: 3200, vsz: 8700, kind: "mux-client" });
    screenSync(sh);
    res.events.push({ type: "mux", kind: "screen", action: "attach", session: s.name });
  }
  const screenLayout = (s) => drawLayout(s.layout, (l) => {
    const w = s.windows.find((x) => x.num === l.win);
    return (w ? `${w.num} ${w.title}${w.ctx.fg || w.ctx.app ? " (" + ctxLabel(w.ctx) + ")" : ""}` : "(empty region)") + (l === s.active ? " *" : "");
  });
  const screenDate = (d) => { const h = d.getHours() % 12 || 12; return `${two(d.getMonth() + 1)}/${two(d.getDate())}/${d.getFullYear()} ${two(h)}:${two(d.getMinutes())}:${two(d.getSeconds())} ${d.getHours() < 12 ? "AM" : "PM"}`; };

  C.screen = function (args, stdin, res, ctx = {}) {
    const p = P(this);
    if (!p) return { stderr: "Must be connected to a terminal.", status: 1 };
    if (args[0] === "-v" || args[0] === "--version") return { stdout: "Screen version 4.09.01 (GNU) 20-Aug-23\n" };
    const dir = `/run/screen/S-${this.user}`;
    if (args.includes("-ls") || args.includes("-list") || args.includes("-l")) {
      const ss = p.screen ? p.screen.sessions : [];
      if (!ss.length) return { stdout: `No Sockets found in ${dir}.\n\n`, status: 1 };
      const lines = [ss.length === 1 ? "There is a screen on:" : "There are screens on:"];
      for (const s of ss) lines.push(`\t${s.pid}.${s.name}\t(${screenDate(wallDate(p, s.created))})\t(${p.attachedSession === s ? "Attached" : "Detached"})`);
      lines.push(`${ss.length} Socket${ss.length === 1 ? "" : "s"} in ${dir}.`, "");
      return { stdout: lines.join("\n") + "\n", status: 1 };
    }
    if (this.batch || ctx.tty === false) return { stderr: "Must be connected to a terminal.", status: 1 };
    const ri = args.findIndex((a) => a === "-r" || a === "-x" || a === "-R" || a === "-dr" || a === "-d");
    if (ri >= 0) {
      if (p.attached) return { stderr: "(You're already inside a screen or tmux session here. Detach first.)", status: 1 };
      const name = args[ri + 1];
      const ss = p.screen ? p.screen.sessions : [];
      const s = name ? screenSession(p, name) : ss.length === 1 ? ss[0] : null;
      if (!s) {
        if (name) return { stdout: `There is no screen to be resumed matching ${name}.\n`, status: 1 };
        if (ss.length > 1) return { stdout: `There are several suitable screens on:\n${ss.map((x) => `\t${x.pid}.${x.name}\t(Detached)`).join("\n")}\nType "screen [-d] -r [pid.]tty.host" to resume one of them.\n`, status: 1 };
        return { stdout: "There is no screen to be resumed.\n", status: 1 };
      }
      screenAttach(this, s, res);
      res.out.push(...screenLayout(s));
      const c = activeScreenCtx(this);
      if (c && c.app) res.screen = { app: c.app };
      return {};
    }
    if (p.attached) return { stderr: "(You're already inside a screen or tmux session here. Detach first.)", status: 1 };
    const si = args.indexOf("-S");
    if (!p.screen) p.screen = { sessions: [] };
    const server = addProc(this, { ppid: 1, user: this.user, tty: "?", args: "SCREEN " + args.join(" "), comm: "screen", rss: 3072, vsz: 8960, kind: "screen-server" });
    const name = si >= 0 && args[si + 1] ? args[si + 1] : `${p.ctx.tty.replace("/", "-")}.${this.host}`;
    const s = { name, pid: server.pid, created: now(p), windows: [], layout: null, active: null };
    p.screen.sessions.push(s);
    const w = screenNewWindow(this, s);
    s.layout = { leaf: true, win: w.num };
    s.active = s.layout;
    screenAttach(this, s, res);
    res.out.push({ text: `[screen session ${name}. Ctrl+A is the prefix: press it, then d to detach, S or | to split, Tab to move, c for a new window, k to kill a window, \\ to quit.]`, cls: "terminal-muted" });
    res.events.push({ type: "mux", kind: "screen", action: "new", session: name });
    const cmdArgs = args.filter((a, i) => !(a === "-S" || (si >= 0 && i === si + 1)));
    if (cmdArgs.length) { const r2 = this.run(" " + cmdArgs.join(" ")); res.out.push(...r2.out); Object.assign(res, { foreground: r2.foreground, screen: r2.screen }); }
    return {};
  };

  /* Keys after the prefix (Ctrl+B for tmux, Ctrl+A for screen). */
  function muxKey(sh, k) {
    const p = P(sh);
    const res = { out: [], events: [] };
    if (p.attached === "tmux") {
      const s = p.attachedSession, w = s.windows[s.cur], panes = leaves(w.layout);
      res.events.push({ type: "mux-key", kind: "tmux", key: k });
      switch (k) {
        case "%": case '"': {
          const pane = tmuxNewPane(sh, s);
          pane.ctx.session = s; pane.ctx.window = w;
          w.layout = replaceNode(w.layout, w.active, { split: k === "%" ? "h" : "v", a: w.active, b: pane });
          w.active = pane;
          res.events.push({ type: "mux", kind: "tmux", action: k === "%" ? "split-h" : "split-v", session: s.name, panes: String(leaves(w.layout).length) });
          break;
        }
        case "ArrowLeft": case "ArrowUp": case "ArrowRight": case "ArrowDown": case "o": case ";": {
          if (panes.length < 2) break;
          const i = panes.indexOf(w.active), fwd = k === "ArrowRight" || k === "ArrowDown" || k === "o";
          w.active = panes[(i + (fwd ? 1 : panes.length - 1)) % panes.length];
          res.events.push({ type: "mux", kind: "tmux", action: "select-pane", session: s.name });
          break;
        }
        case "c": tmuxNewWindow(sh, s); res.events.push({ type: "mux", kind: "tmux", action: "new-window", session: s.name }); break;
        case "n": s.cur = (s.cur + 1) % s.windows.length; break;
        case "p": s.cur = (s.cur + s.windows.length - 1) % s.windows.length; break;
        case "d": tmuxDetach(sh, res); res.leave = true; return res;
        case "&":
          p.ask = { key: true, label: `kill-window ${ctxLabel(w.active.ctx)}? (y/n)`, fn: (a, r) => { if (/^y/i.test(a)) tmuxKillWindow(sh, s, w, r); } };
          res.out.push({ text: p.ask.label, cls: "terminal-muted" });
          return res;
        case "x":
          p.ask = { key: true, label: `kill-pane ${panes.indexOf(w.active)}? (y/n)`, fn: (a, r) => { if (/^y/i.test(a)) tmuxKillPane(sh, s, w, w.active, r); } };
          res.out.push({ text: p.ask.label, cls: "terminal-muted" });
          return res;
        default:
          if (/^\d$/.test(k)) { const i = s.windows.findIndex((x) => x.index === +k); if (i >= 0) s.cur = i; }
          else { res.out.push({ text: `(Ctrl+B then ${k} isn't one of the keys this practice tmux knows: % " arrows o c n p 0-9 d & x)`, cls: "terminal-muted" }); return res; }
      }
      p.ctx = tmuxActiveCtx(s);
      if (k !== "d") res.out.push(...tmuxLayout(s));
      return res;
    }
    if (p.attached === "screen") {
      const s = p.attachedSession, regions = leaves(s.layout);
      const winIn = (l) => s.windows.find((x) => x.num === l.win);
      res.events.push({ type: "mux-key", kind: "screen", key: k });
      switch (k) {
        case "d": {
          res.out.push({ text: `[detached from ${s.pid}.${s.name}]` });
          if (p.client) p.procs.delete(p.client.pid);
          p.client = null; p.attached = null; p.attachedSession = null;
          p.ctx = p.detachCtx; p.detachCtx = null;
          res.events.push({ type: "mux", kind: "screen", action: "detach", session: s.name });
          res.leave = true;
          return res;
        }
        case "S": case "|": {
          const leaf = { leaf: true, win: null };
          s.layout = replaceNode(s.layout, s.active, { split: k === "S" ? "v" : "h", a: s.active, b: leaf });
          res.events.push({ type: "mux", kind: "screen", action: k === "S" ? "split-h" : "split-v", session: s.name, regions: String(leaves(s.layout).length) });
          break;
        }
        case "Tab": {
          const i = regions.indexOf(s.active);
          s.active = regions[(i + 1) % regions.length];
          res.events.push({ type: "mux", kind: "screen", action: "focus", session: s.name, empty: s.active.win === null ? "yes" : "no" });
          break;
        }
        case "c": {
          const w = screenNewWindow(sh, s);
          s.active.win = w.num;
          res.events.push({ type: "mux", kind: "screen", action: "new-window", session: s.name });
          break;
        }
        case "n": case "p": case " ": {
          if (!s.windows.length) break;
          const i = s.windows.findIndex((x) => x.num === s.active.win);
          s.active.win = s.windows[(i + (k === "p" ? s.windows.length - 1 : 1)) % s.windows.length].num;
          break;
        }
        case "X": if (regions.length > 1) { s.layout = removeLeaf(s.layout, s.active); s.active = leaves(s.layout)[0]; } break;
        case "Q": s.layout = s.active; break;
        case "A": {
          const w = winIn(s.active);
          if (!w) break;
          p.ask = { label: "Set window's title to:", fn: (a, r) => { if (a) w.title = a; r.events.push({ type: "mux", kind: "screen", action: "title", session: s.name, title: w.title }); r.out.push(...screenLayout(s)); } };
          res.out.push({ text: "(Type the new title and press Enter.)", cls: "terminal-muted" });
          res.leave = true; // the title is typed at the terminal's prompt
          return res;
        }
        case "k": {
          const w = winIn(s.active);
          if (!w) break;
          p.ask = { key: true, label: `Really kill this window [y/n]`, fn: (a, r) => { if (/^y/i.test(a)) { screenKillWindow(sh, s, w, r); if (p.attachedSession === s) r.out.push(...screenLayout(s)); } } };
          res.out.push({ text: p.ask.label, cls: "terminal-muted" });
          return res;
        }
        case "\\":
          p.ask = { key: true, label: "Really quit and kill all your windows [y/n]", fn: (a, r) => { if (/^y/i.test(a)) screenEnd(sh, s, r); } };
          res.out.push({ text: p.ask.label, cls: "terminal-muted" });
          return res;
        case '"': case "w":
          res.out.push({ text: s.windows.map((w) => `${w.num}${w.num === s.active.win ? "*" : "-"} ${w.title}`).join("  "), cls: "terminal-muted" });
          return res;
        default:
          if (/^\d$/.test(k)) { if (s.windows.some((w) => w.num === +k)) s.active.win = +k; break; }
          res.out.push({ text: `(Ctrl+A then ${k} isn't one of the keys this practice screen knows: d S | Tab c n p A k \\ " X Q 0-9)`, cls: "terminal-muted" });
          return res;
      }
      screenSync(sh);
      res.out.push(...screenLayout(s));
      return res;
    }
    return res;
  }

  function killMuxServer(sh, proc) {
    const p = P(sh), r = { out: [], events: [] };
    if (proc.kind === "tmux-server" && p.tmux) [...p.tmux.sessions].forEach((s) => tmuxEndSession(sh, s, r));
    if (proc.kind === "screen-server" && p.screen) { const s = p.screen.sessions.find((x) => x.pid === proc.pid); if (s) screenEnd(sh, s, r); }
    p.outbox.push(...r.out);
  }

  /* ------------------------------------------------------------------ what the engine calls */
  SH.busy = function () {
    const p = this.proc;
    if (!p) return false;
    if (p.attached === "screen" && !activeScreenCtx(this)) return true;
    return !!p.ctx.fg;
  };
  SH.busyHint = function () {
    const p = this.proc;
    if (p && p.attached === "screen" && !activeScreenCtx(this)) return "(This region is empty. Press Ctrl+A then c for a new window, or Ctrl+A then Tab to move to another region.)";
    return null;
  };
  SH.muxPrefix = function () { const p = this.proc; return p && p.attached ? (p.attached === "tmux" ? "Ctrl+b" : "Ctrl+a") : null; };
  SH.awaitingKey = function () { const p = this.proc; return !!(p && (p.awaitKey || (p.ask && p.ask.key))); };
  SH.muxButtons = function () {
    const p = this.proc;
    if (!p) return [];
    if (p.ask && p.ask.key) return [["y", "y"], ["n", "n"]];
    if (p.awaitKey) return p.attached === "tmux"
      ? [["%", "%"], ['"', '"'], ["←", "ArrowLeft"], ["→", "ArrowRight"], ["↑", "ArrowUp"], ["↓", "ArrowDown"], ["d", "d"], ["c", "c"], ["&", "&"], ["x", "x"]]
      : [["d", "d"], ["S", "S"], ["|", "|"], ["Tab", "Tab"], ["c", "c"], ["A", "A"], ["k", "k"], ["\\", "\\"], ["n", "n"], ['"', '"']];
    if (p.attached) return [[p.attached === "tmux" ? "Ctrl+B" : "Ctrl+A", this.muxPrefix()]];
    return [];
  };
  SH.title = function () {
    const p = this.proc;
    const base = this.prompt().replace(/\$$/, "");
    if (!p || !p.attached) return base;
    const s = p.attachedSession;
    if (p.attached === "tmux") { const w = s.windows[s.cur]; return `[${s.name}] ${w.index}:${ctxLabel(w.active.ctx)}*  ${base}`; }
    const c = activeScreenCtx(this);
    return c ? `screen ${s.name}: window ${c.screenWin.num} ${c.screenWin.title}  ${base}` : `screen ${s.name}: empty region`;
  };
  const promptBase = SH.prompt;
  SH.prompt = function () {
    const p = this.proc;
    if (p && p.ask && !p.ask.key) return p.ask.label;
    return promptBase.call(this);
  };

  /* Special keys: Ctrl+C, Ctrl+Z, the multiplexer prefix and the key after it. Returns a
     result like run() does, or null when the key does nothing here. */
  SH.sendKey = function (k) {
    const p = this.proc;
    if (!p) return null;
    refresh(this);
    const res = { out: [], events: [] };
    if (p.ask && p.ask.key) {
      const ask = p.ask; p.ask = null;
      res.out.push({ text: k.length === 1 ? k : "", cls: "terminal-muted" });
      ask.fn(k, res);
      return finishRes(this, res);
    }
    if (p.awaitKey) {
      p.awaitKey = null;
      const r = muxKey(this, k);
      res.out.push(...r.out); res.events.push(...r.events); res.leave = r.leave;
      return finishRes(this, res);
    }
    if (k === this.muxPrefix()) { p.awaitKey = { kind: p.attached }; return res; }
    const ctx = p.ctx;
    if (k === "Ctrl+c") {
      if (!ctx.fg) return null;
      const proc = ctx.fg.proc;
      res.out.push({ text: "^C" });
      deliver(this, proc, 2, { asRoot: true });
      res.events.push({ type: "signal", sig: "INT", num: 2, pid: proc.pid, comm: proc.comm, by: "ctrl-c" });
      if (ctx.fg && ctx.fg.proc === proc) res.foreground = { pid: proc.pid };
      return finishRes(this, res);
    }
    if (k === "Ctrl+z") {
      if (!ctx.fg) return null;
      const f = ctx.fg, proc = f.proc;
      stopProc(p, proc);
      const job = f.job || addJob(ctx, proc, f.text, "Stopped", false);
      job.state = "Stopped"; job.amp = false; job.notify = false;
      touchJob(ctx, job);
      ctx.fg = null;
      res.out.push({ text: "^Z" }, { text: fmtJob(ctx, job) });
      res.events.push({ type: "job-stopped", pid: proc.pid, comm: proc.comm, how: "ctrl-z", job: job.num });
      return finishRes(this, res);
    }
    return null;
  };

  /* Called about once a second: a foreground job may have finished on its own. */
  SH.poll = function () {
    const p = this.proc;
    if (!p) return null;
    const ctx = p.ctx, had = ctx.fg;
    refresh(this);
    if (had && !ctx.fg) {
      const res = { out: [], events: [{ type: "fg-done", pid: had.proc.pid, comm: had.proc.comm }] };
      return finishRes(this, res);
    }
    return null;
  };
})();
