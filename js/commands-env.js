/* Shell and environment variables, PATH, child shells, startup files (Section 12: 103.1).

   The shell keeps every variable in this.env and remembers which ones are exported in
   this.exported. Child shells (bash -c, scripts, "bash" at the prompt) start from a copy of
   the exported variables only, so a child never sees a plain shell variable and can never
   change its parent's. ~/.bashrc and friends are real files that are sourced the way Bash
   reads them on Linux Mint. */
(function () {
  "use strict";
  const Shell = LPIC.Shell, C = Shell.commands, SH = Shell.prototype;
  const { BUILTINS, KEYWORDS } = Shell;

  /* ------------------------------------------------------------------ startup files */
  const BASHRC = `# ~/.bashrc: executed by bash(1) for non-login shells.

# If not running interactively, don't do anything
case $- in
    *i*) ;;
      *) return;;
esac

# don't put duplicate lines or lines starting with space in the history.
HISTCONTROL=ignoreboth

# append to the history file, don't overwrite it
shopt -s histappend

# for setting history length see HISTSIZE and HISTFILESIZE in bash(1)
HISTSIZE=1000
HISTFILESIZE=2000

# check the window size after each command
shopt -s checkwinsize

PS1='\${debian_chroot:+($debian_chroot)}\\[\\033[01;32m\\]\\u@\\h\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ '

# If this is an xterm set the title to user@host:dir
PS1="\\[\\e]0;\${debian_chroot:+($debian_chroot)}\\u@\\h: \\w\\a\\]$PS1"

# enable color support of ls and also add handy aliases
alias ls='ls --color=auto'
alias grep='grep --color=auto'

# some more ls aliases
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'
`;
  const PROFILE = `# ~/.profile: executed by the command interpreter for login shells.
# This file is not read by bash(1), if ~/.bash_profile or ~/.bash_login
# exists.

# if running bash
if [ -n "$BASH_VERSION" ]; then
    # include .bashrc if it exists
    if [ -f "$HOME/.bashrc" ]; then
	. "$HOME/.bashrc"
    fi
fi

# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/bin" ] ; then
    PATH="$HOME/bin:$PATH"
fi

# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/.local/bin" ] ; then
    PATH="$HOME/.local/bin:$PATH"
fi
`;
  const ETC_PROFILE = `# /etc/profile: system-wide .profile file for the Bourne shell (sh(1))
# and Bourne compatible shells (bash(1), ksh(1), ash(1), ...).

if [ "\${PS1-}" ]; then
  if [ "\${BASH-}" ] && [ "$BASH" != "/bin/sh" ]; then
    # The file bash.bashrc already sets the default PS1.
    # PS1='\\h:\\w\\$ '
    if [ -f /etc/bash.bashrc ]; then
      . /etc/bash.bashrc
    fi
  else
    if [ "$(id -u)" -eq 0 ]; then
      PS1='# '
    else
      PS1='$ '
    fi
  fi
fi

if [ -d /etc/profile.d ]; then
  for i in /etc/profile.d/*.sh; do
    if [ -r $i ]; then
      . $i
    fi
  done
  unset i
fi
`;
  const ETC_BASHRC = `# System-wide .bashrc file for interactive bash(1) shells.

# To enable the settings / commands in this file for login shells as well,
# this file has to be sourced in /etc/profile.

# If not running interactively, don't do anything
[ -z "$PS1" ] && return

# check the window size after each command
shopt -s checkwinsize

# set a fancy prompt (non-color, overwrite the one in /etc/profile)
PS1='\${debian_chroot:+($debian_chroot)}\\u@\\h:\\w\\$ '
`;
  const ETC_ENV = `PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games"\n`;
  const PROFILE_D = {
    "01-locale-fix.sh": "# Make sure the locale variables are set to valid values.\n",
    "apps-bin-path.sh": "# Expand $PATH to include the directory where snappy applications go.\n",
    "bash_completion.sh": "# Check for interactive bash and that we haven't already been sourced.\n",
    "vte-2.91.sh": "# Copyright (c) 2006 The GNOME Foundation\n# Shell integration for VTE terminals.\n",
    "xdg_dirs_desktop_session.sh": "# Set XDG_DATA_DIRS for the desktop session.\n",
  };
  const DEFAULT_PATH = "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games";
  const STD_DIRS = ["/usr/local/sbin", "/usr/local/bin", "/usr/sbin", "/usr/bin", "/sbin", "/bin"];
  const GIDS = { root: 0, daemon: 1, adm: 4, disk: 6, cdrom: 24, sudo: 27, dip: 30, shadow: 42, plugdev: 46, users: 100, nogroup: 65534, syslog: 104, lpadmin: 120 };
  const NOT_EXPORTED = ["HOSTNAME", "PS1", "PS2", "PS4", "HISTFILE", "HISTSIZE", "HISTFILESIZE", "HISTCONTROL", "BASH_VERSION"];

  const uidOf = (sh) => (sh.user === "root" ? 0 : 1000);
  const gidsOf = (sh) => (LPIC.groupsOf ? LPIC.groupsOf(sh.user) : [sh.user]).map((g) => (g === sh.user && sh.user !== "root" ? 1000 : GIDS[g] ?? 1000));

  LPIC.shellInit = LPIC.shellInit || [];
  LPIC.shellInit.push((sh) => {
    const prev = sh.vfs.actor;
    sh.vfs.actor = null;
    try {
      const home = sh.home;
      sh.vfs.write(home + "/.bashrc", BASHRC);
      sh.vfs.write(home + "/.profile", PROFILE);
      sh.vfs.write("/etc/profile", ETC_PROFILE);
      sh.vfs.write("/etc/bash.bashrc", ETC_BASHRC);
      sh.vfs.write("/etc/environment", ETC_ENV);
      sh.vfs.mkdirp("/etc/profile.d");
      for (const [f, c] of Object.entries(PROFILE_D)) sh.vfs.write("/etc/profile.d/" + f, c);
      for (const f of [home + "/.bashrc", home + "/.profile", home + "/.bash_logout", home + "/.bash_history"]) {
        const n = sh.vfs.get(f);
        if (n) Object.assign(n, { owner: sh.user, group: sh.user === "root" ? "root" : sh.user, perm: f.endsWith("history") ? 0o600 : 0o644 });
      }
      for (const f of ["/etc/profile", "/etc/bash.bashrc", "/etc/environment"]) { const n = sh.vfs.get(f); if (n) Object.assign(n, { owner: "root", group: "root", perm: 0o644 }); }
    } finally { sh.vfs.actor = prev; }
    // A desktop terminal on Linux Mint: the environment it inherits, then what ~/.bashrc sets.
    const add = {
      SHLVL: "1", LANGUAGE: "en_US", DISPLAY: ":0", XDG_SESSION_TYPE: "x11", XDG_CURRENT_DESKTOP: "X-Cinnamon", DESKTOP_SESSION: "cinnamon",
      GDMSESSION: "cinnamon", XDG_RUNTIME_DIR: "/run/user/" + uidOf(sh), DBUS_SESSION_BUS_ADDRESS: `unix:path=/run/user/${uidOf(sh)}/bus`,
      COLORTERM: "truecolor", VTE_VERSION: "7600", XDG_DATA_DIRS: "/usr/share/cinnamon:/usr/share/gnome:/usr/local/share:/usr/share",
      LESSOPEN: "| /usr/bin/lesspipe %s", LESSCLOSE: "/usr/bin/lesspipe %s %s",
    };
    for (const [k, v] of Object.entries(add)) if (sh.env[k] === undefined) sh.env[k] = v;
    if (sh.env.PATH === "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin") sh.env.PATH = DEFAULT_PATH;
    sh.exported = new Set(Object.keys(sh.env).filter((k) => !NOT_EXPORTED.includes(k)));
    Object.assign(sh.env, { HISTFILE: sh.home + "/.bash_history", PS2: "> ", PS4: "+ " });
    sh.aliases = {};
    sh._interactive = true;
    sh._login = false;
    sh._shellKind = "top";
    sh._started = Date.now();
    sh.hashedPaths = {};
    // Read ~/.bashrc like a new terminal does (it sets PS1, the history sizes and the aliases).
    const r = { out: [], events: [] };
    sh.sourceText(BASHRC, r);
  });

  /* ------------------------------------------------------------------ variables Bash keeps for itself */
  SH.dynVar = function (name) {
    switch (name) {
      case "UID": case "EUID": return String(uidOf(this));
      case "GROUPS": return String(gidsOf(this)[0]);
      case "PPID": return this._childPid ? String(this.proc ? this.proc.base.pid : 2201) : "1702";
      case "BASHPID": return String(this.shellPid ? this.shellPid() : 4242);
      case "RANDOM": return String(Math.floor(Math.random() * 32768));
      case "SECONDS": return String(Math.floor((Date.now() - (this._started || Date.now())) / 1000));
      case "EPOCHSECONDS": return String(Math.floor(Date.now() / 1000));
      case "BASH": return "/usr/bin/bash";
      case "BASH_VERSION": return "5.2.21(1)-release";
      case "HOSTTYPE": return "x86_64";
      case "OSTYPE": return "linux-gnu";
      case "MACHTYPE": return "x86_64-pc-linux-gnu";
      case "HOSTNAME": return this.host;
      default: return undefined;
    }
  };
  SH.arrayVar = function (name) {
    if (name === "GROUPS") return gidsOf(this).map(String);
    if (name === "BASH_VERSINFO") return ["5", "2", "21", "1", "release", "x86_64-pc-linux-gnu"];
    return null;
  };
  SH.dashFlags = function () { return this._interactive ? "himBHs" : "hB"; };
  const varValue = (sh, k) => sh.env[k] ?? sh.dynVar(k);

  /* ------------------------------------------------------------------ child shells */
  const exportedEnv = (sh) => Object.fromEntries(Object.entries(sh.env).filter(([k]) => sh.exported.has(k)));

  /* Start a new Bash in this shell object: save the parent, keep only exported variables,
     then read the startup files a shell of this kind reads. Returns what leaveShell needs. */
  SH.enterShell = function (o = {}) {
    const saved = { env: this.env, exported: this.exported, cwd: this.cwd, interactive: this._interactive, login: this._login, kind: this._shellKind,
      childPid: this._childPid, depth: this._childDepth || 0, aliases: this.aliases, umask: this.umask, status: this.lastStatus };
    const base = o.env || exportedEnv(this);
    this.env = { ...base };
    this.exported = new Set(Object.keys(base));
    this.env.PWD = this.cwd; this.exported.add("PWD");
    this.env.SHLVL = String((parseInt(base.SHLVL, 10) || 0) + 1); this.exported.add("SHLVL");
    if (this.env.PATH === undefined) this.env.PATH = DEFAULT_PATH, this.exported.delete("PATH"); // Bash's own default, not exported
    this._interactive = !!o.interactive;
    this._login = !!o.login;
    this._shellKind = o.interactive && !o.command ? "interactive" : "child";
    this._childDepth = saved.depth + 1;
    this._childPid = o.pid ?? (this.proc ? this.proc.next++ : 4243);
    this.aliases = {};
    if (this._interactive) Object.assign(this.env, { PS1: "\\s-\\v\\$ ", PS2: "> ", PS4: "+ ", HISTFILE: this.home + "/.bash_history", HISTSIZE: "500", HISTFILESIZE: "500" });
    const res = o.res || { out: [], events: [] };
    const sourceFile = (f) => { const n = this.vfs.get(this.abs(f)); if (n && n.type === "file") this.sourceText(n.content || "", res); };
    if (this._login) {
      sourceFile("/etc/profile");
      const first = ["~/.bash_profile", "~/.bash_login", "~/.profile"].find((f) => this.vfs.get(this.abs(f)));
      if (first) sourceFile(first);
    } else if (this._interactive && !o.norc) {
      if (o.rcfile) { if (this.vfs.get(this.abs(o.rcfile))) sourceFile(o.rcfile); else res.out.push({ text: `bash: ${o.rcfile}: No such file or directory`, cls: "terminal-error" }); }
      else { sourceFile("/etc/bash.bashrc"); sourceFile("~/.bashrc"); }
    }
    this.lastStatus = 0;
    return saved;
  };
  SH.leaveShell = function (saved) {
    if (!saved) return;
    this.env = saved.env; this.exported = saved.exported; this.cwd = saved.cwd;
    this._interactive = saved.interactive; this._login = saved.login; this._shellKind = saved.kind;
    this._childPid = saved.childPid; this._childDepth = saved.depth; this.aliases = saved.aliases;
    this.umask = saved.umask; if (this.vfs) this.vfs.umask = saved.umask;
  };
  SH.onCtxClosed = function (ctx) { if (ctx.saved) { const s = ctx.saved; ctx.saved = null; this.leaveShell(s); } };

  const shellPidBase = SH.shellPid;
  SH.shellPid = function () { return this._childPid || (shellPidBase ? shellPidBase.call(this) : 4242); };

  /* Turn a script's text into one line the shell can split: drop comments, join lines. */
  function stripComment(line) {
    let q = null;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) { if (c === "\\" && q === '"') i++; else if (c === q) q = null; continue; }
      if (c === "\\") { i++; continue; }
      if (c === "'" || c === '"') q = c;
      else if (c === "#" && (i === 0 || /\s/.test(line[i - 1]))) return line.slice(0, i);
    }
    return line;
  }
  function scriptBody(text) {
    const lines = text.split("\n").map(stripComment).map((l) => l.replace(/\s+$/, "")).filter((l) => l.trim() && !/^#!/.test(l));
    let out = "";
    for (const l of lines) {
      if (!out) { out = l; continue; }
      out += /(\||&&|\|\|)$/.test(out) ? " " + l.trim() : /\\$/.test(out) ? l.trim() : "; " + l.trim();
      if (/\\$/.test(out)) out = out.slice(0, -1);
    }
    return out;
  }
  LPIC.scriptBody = scriptBody;

  /* Run text in this shell (source, .): variables it sets stay set. */
  SH.sourceText = function (text, res) {
    let body = text;
    // Mint's ~/.bashrc stops at once unless the shell is interactive.
    const guard = body.match(/^[ \t]*case \$- in[\s\S]*?^[ \t]*esac[ \t]*$/m);
    if (guard) body = this._interactive ? body.replace(guard[0], "") : body.slice(0, guard.index);
    body = scriptBody(body);
    if (!body.trim()) return { status: 0 };
    this._sourceDepth = (this._sourceDepth || 0) + 1;
    const sub = { out: [], events: [] };
    try { this.runItems(this.splitLists(body), sub); }
    catch (e) { sub.out.push({ text: "bash: " + e.message, cls: "terminal-error" }); }
    finally { this._sourceDepth--; }
    res.out.push(...sub.out);
    res.events.push(...sub.events);
    return { status: this.lastStatus };
  };

  /* Run a script's text in a child shell. */
  SH.runScriptText = function (text, args, res) {
    const saved = this.enterShell({ command: true });
    const sub = { out: [], events: [] };
    try {
      args.forEach((a, i) => (this.env[String(i + 1)] = a));
      const body = scriptBody(text);
      if (body.trim()) this.runItems(this.splitLists(body), sub);
    } catch (e) { sub.out.push({ text: "bash: " + e.message, cls: "terminal-error" }); }
    finally { const st = this.lastStatus; this.leaveShell(saved); this.lastStatus = st; }
    res.events.push(...sub.events);
    if (sub.foreground) res.foreground = sub.foreground;
    const out = sub.out.filter((o) => o.cls !== "terminal-error" && o.cls !== "terminal-muted").map((o) => o.text);
    const err = sub.out.filter((o) => o.cls === "terminal-error").map((o) => o.text);
    return { stdout: out.length ? out.join("\n") + "\n" : "", stderr: err.join("\n"), status: sub.exitStatus ?? this.lastStatus };
  };

  const procBash = C.bash;
  C.bash = C.sh = function (args, stdin, res, ctx = {}) {
    let interactive = false, login = false, rcfile = null, norc = false, check = false, cmd = null, i = 0;
    for (; i < args.length; i++) {
      const a = args[i];
      if (a === "--version" || a === "-version") return procBash.call(this, [a], stdin, res, ctx);
      if (a === "-c") { cmd = args[i + 1]; i += 2; break; }
      if (a === "-i") interactive = true;
      else if (a === "-l" || a === "--login") login = true;
      else if (a === "--rcfile" || a === "--init-file") rcfile = args[++i];
      else if (a === "--norc") norc = true;
      else if (a === "--noprofile" || a === "--posix") { /* nothing to read anyway */ }
      else if (a === "-n") check = true;
      else if (/^-[ilnc]+$/.test(a)) {
        if (a.includes("i")) interactive = true;
        if (a.includes("l")) login = true;
        if (a.includes("n")) check = true;
        if (a.includes("c")) { cmd = args[i + 1]; i += 2; break; }
      } else break;
    }
    if (cmd === undefined) return { stderr: "bash: -c: option requires an argument", status: 2 };
    const rest = args.slice(i);
    if (check) {
      const missing = rest.filter((f) => !this.vfs.get(this.abs(f)));
      return missing.length ? { stderr: `bash: ${missing[0]}: No such file or directory`, status: 127 } : {};
    }
    if (cmd !== null) {
      const sub = { out: [], events: [] };
      const saved = this.enterShell({ interactive, login, rcfile, norc, command: true, res: sub });
      try { this.runItems(this.splitLists(cmd), sub); }
      catch (e) { sub.out.push({ text: "bash: " + e.message, cls: "terminal-error" }); }
      finally { var status = sub.exitStatus ?? this.lastStatus; this.leaveShell(saved); }
      res.events.push(...sub.events);
      if (sub.foreground) res.foreground = sub.foreground;
      const out = sub.out.filter((o) => o.cls !== "terminal-error" && o.cls !== "terminal-muted").map((o) => o.text);
      const err = sub.out.filter((o) => o.cls === "terminal-error").map((o) => o.text);
      res.events.push({ type: "child-shell", cmd, interactive: interactive ? "yes" : "no", login: login ? "yes" : "no" });
      return { stdout: out.length ? out.join("\n") + "\n" : "", stderr: err.join("\n"), status };
    }
    if (rest.length) return this.runFile(rest[0], rest.slice(1), stdin, res, ctx, false);
    if (!this.proc || this.batch || ctx.tty === false) return stdin ? this.runScriptText(stdin, [], res) : {};
    // An interactive shell at the prompt: a new context (its own jobs and PID) and its own variables.
    const r = procBash.call(this, [], stdin, res, ctx) || {};
    const c = this.proc.ctx;
    const startup = { out: [], events: [] };
    c.saved = this.enterShell({ interactive: true, login, rcfile, norc, pid: c.pid, res: startup });
    res.out.push(...startup.out);
    res.events.push({ type: "shell-start", pid: c.pid, shlvl: this.env.SHLVL, rcfile: rcfile || "", login: login ? "yes" : "no" });
    return r;
  };

  const procExit = C.exit;
  C.exit = C.logout = function (args, stdin, res) {
    if (this._shellKind === "child") { res.exit = true; res.exitStatus = args[0] !== undefined ? (parseInt(args[0], 10) || 0) & 255 : this.lastStatus; return { status: res.exitStatus }; }
    return procExit.call(this, args, stdin, res);
  };
  C.return = function (args, stdin, res) {
    if (this._sourceDepth) { res.exit = true; return { status: args[0] !== undefined ? parseInt(args[0], 10) || 0 : this.lastStatus }; }
    return { stderr: "bash: return: can only `return' from a function or sourced script", status: 1 };
  };

  C.source = C["."] = function (args, stdin, res) {
    const name = args[0] === "." ? "." : "source";
    if (!args.length) return { stderr: `bash: ${name}: filename argument required\n${name}: usage: ${name} filename [arguments]`, status: 2 };
    const f = args[0];
    let abs = null;
    if (f.includes("/")) abs = this.abs(f);
    else {
      for (const d of (this.env.PATH || "").split(":")) { const c = this.vfs.resolve(f, d || this.cwd); const n = this.vfs.get(c); if (n && n.type === "file") { abs = c; break; } }
      if (!abs) abs = this.abs(f);
    }
    const node = this.vfs.get(abs);
    if (!node || node.type !== "file") return { stderr: `bash: ${f}: No such file or directory`, status: 1 };
    if (this.vfs.actor && this.vfs.actor !== "root" && !this.vfs.can(node, "r")) return { stderr: `bash: ${f}: Permission denied`, status: 1 };
    res.events.push({ type: "source", path: abs });
    return this.sourceText(node.content || "", res);
  };

  C.exec = function (args, stdin, res, ctx) {
    if (!args.length) return {};
    const prev = this._execPid;
    this._execPid = this.shellPid();
    let r;
    try { r = this.exec(args, stdin, res, ctx) || {}; }
    finally { this._execPid = prev; }
    res.events.push({ type: "exec", cmd: args.join(" "), kind: this._shellKind || "top" });
    if (this._shellKind === "child") { res.exit = true; res.exitStatus = r.status || 0; return r; }
    const pc = this.procCtx ? this.procCtx() : null;
    if (this._shellKind === "interactive" && pc && pc.kind === "nested") {
      // The command replaced this shell; when it finishes the shell is gone too.
      const sub = { out: [], events: [] };
      procExit.call(this, [], "", sub);
      res.events.push(...sub.events);
      return r;
    }
    if (this.proc) this.proc.outbox.push({ text: "(exec replaced this shell, so a real terminal window would close now. The practice terminal starts you a fresh shell instead.)", cls: "terminal-muted" });
    return r;
  };

  /* ------------------------------------------------------------------ assignments before a command, and PATH */
  function pathDirs(sh) { return (sh.env.PATH ?? DEFAULT_PATH).split(":"); }
  function known(sh, name) { return !!C[name] || Object.keys(sh.canned || {}).some((k) => k.split(" ")[0] === name); }
  function findInPath(sh, name, all = false) {
    const found = [];
    for (const d of pathDirs(sh)) {
      const dir = (d || ".").replace(/\/$/, "") || "/";
      if (["/usr/bin", "/bin"].includes(dir) && known(sh, name) && !BUILTINS.has(name)) { found.push(`${dir}/${name}`); if (!all) break; continue; }
      if (["/usr/bin", "/bin"].includes(dir) && Shell.ALSO_EXTERNAL.has(name)) { found.push(`${dir}/${name}`); if (!all) break; continue; }
      const abs = sh.vfs.resolve(name, dir.startsWith("/") ? dir : sh.abs(dir));
      const n = sh.vfs.get(abs);
      if (n && n.type === "file" && n.content !== undefined && !/^\/(usr\/)?bin\//.test(abs) && (sh.vfs.can ? sh.vfs.can(n, "x") : true)) { found.push(abs); if (!all) break; }
    }
    return found;
  }

  const execPrev = SH.exec;
  SH.exec = function (argv, stdin, res, ctx = {}) {
    // NAME=value command: the variables are in that one command's environment only.
    let k = 0;
    while (k < argv.length - 1 && /^[A-Za-z_]\w*=/.test(argv[k])) k++;
    if (k > 0) {
      const saved = [];
      for (const a of argv.slice(0, k)) {
        const name = a.split("=")[0];
        saved.push([name, this.env[name], this.exported.has(name)]);
        this.env[name] = a.slice(name.length + 1);
        this.exported.add(name);
      }
      try { return SH.exec.call(this, argv.slice(k), stdin, res, ctx); }
      finally {
        for (const [name, v, ex] of saved.reverse()) {
          if (v === undefined) delete this.env[name]; else this.env[name] = v;
          if (!ex) this.exported.delete(name);
        }
      }
    }
    const name = argv[0];
    if (name && !name.includes("/") && !BUILTINS.has(name) && !KEYWORDS.has(name) && !/^[A-Za-z_]\w*=/.test(name) && name !== "sudo" && this.exported) {
      if (known(this, name)) {
        if (this.env.PATH !== undefined && !pathDirs(this).some((d) => STD_DIRS.includes(d.replace(/\/$/, "")))) {
          return { stderr: `Command '${name}' is available in the following places\n * /bin/${name}\n * /usr/bin/${name}\nThe command could not be located because '/bin:/usr/bin' is not included in the PATH environment variable.\n${name}: command not found`, status: 127 };
        }
      } else {
        const hit = findInPath(this, name)[0];
        if (hit) { this.hashedPaths[name] = hit; return this.runFile(hit, argv.slice(1), stdin, res, ctx, true); }
      }
    }
    return execPrev.call(this, argv, stdin, res, ctx);
  };

  const whichBase = C.which, typeBase = C.type;
  C.which = function (args) {
    const all = args.includes("-a"), names = args.filter((a) => !a.startsWith("-"));
    const out = [];
    let missing = false;
    for (const n of names) {
      if (n.includes("/")) { const node = this.vfs.get(this.abs(n)); if (node && node.type === "file") out.push(n); else missing = true; continue; }
      const f = findInPath(this, n, all);
      if (f.length) out.push(...(all ? f : f.slice(0, 1))); else missing = true;
    }
    return { stdout: out.length ? out.join("\n") + "\n" : "", status: missing ? 1 : 0 };
  };
  void whichBase;
  C.type = function (args, stdin, res, ctx) {
    const flags = args.filter((a) => a.startsWith("-")), names = args.filter((a) => !a.startsWith("-"));
    const out = [], err = [];
    let status = 0;
    for (const n of names) {
      if (this.aliases && this.aliases[n] && !flags.includes("-P")) {
        out.push(flags.includes("-t") ? "alias" : `${n} is aliased to \`${this.aliases[n]}'`);
        if (!flags.includes("-a")) continue;
      }
      const r = typeBase.call(this, [...flags, n], stdin, res, ctx);
      if (!r.status) { if (r.stdout) out.push(r.stdout.replace(/\n$/, "")); continue; }
      const hit = this.hashedPaths[n] || findInPath(this, n)[0];
      if (hit) { out.push(flags.includes("-t") ? "file" : flags.includes("-p") || flags.includes("-P") ? hit : this.hashedPaths[n] ? `${n} is hashed (${hit})` : `${n} is ${hit}`); continue; }
      if (!flags.includes("-t")) err.push(`bash: type: ${n}: not found`);
      status = 1;
    }
    return { stdout: out.length ? out.join("\n") + "\n" : "", stderr: err.join("\n"), status };
  };

  /* ------------------------------------------------------------------ export, unset, env, printenv, set, declare */
  const VALID = /^[A-Za-z_]\w*$/;
  const dq = (v) => `"${String(v).replace(/(["\\$`])/g, "\\$1")}"`;
  function setQuote(v) {
    if (v === "") return "";
    if (/^[\w./:,+@%=-]+$/.test(v)) return v;
    if (/[\n\t]/.test(v)) return "$'" + v.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\t/g, "\\t") + "'";
    return "'" + v.replace(/'/g, "'\\''") + "'";
  }
  const declLine = (sh, k) => {
    if (k === "GROUPS") return `declare -a GROUPS=(${sh.arrayVar("GROUPS").map((g, i) => `[${i}]="${g}"`).join(" ")})`;
    if (k === "BASH_VERSINFO") return `declare -ar BASH_VERSINFO=(${sh.arrayVar(k).map((g, i) => `[${i}]="${g}"`).join(" ")})`;
    if (k === "UID" || k === "EUID" || k === "PPID") return `declare -ir ${k}="${sh.dynVar(k)}"`;
    const v = varValue(sh, k);
    const flag = sh.exported.has(k) ? "-x" : /^(SHLVL|HISTCMD|RANDOM|SECONDS)$/.test(k) && !sh.exported.has(k) ? "-i" : "--";
    return v === undefined ? `declare ${flag} ${k}` : `declare ${flag} ${k}=${dq(v)}`;
  };

  C.export = function (args) {
    let unexport = false, print = false;
    const names = [];
    for (const a of args) { if (a === "-n") unexport = true; else if (a === "-p") print = true; else if (a === "-f" || a === "--") {} else names.push(a); }
    if (!names.length) {
      const keys = [...this.exported].filter((k) => k !== "_").sort();
      return { stdout: keys.length ? keys.map((k) => (this.env[k] === undefined ? `declare -x ${k}` : `declare -x ${k}=${dq(this.env[k])}`)).join("\n") + "\n" : "" };
    }
    const err = [];
    for (const a of names) {
      const k = a.split("=")[0];
      if (!VALID.test(k)) { err.push(`bash: export: \`${a}': not a valid identifier`); continue; }
      if (a.includes("=")) this.env[k] = a.slice(k.length + 1);
      if (unexport) this.exported.delete(k); else this.exported.add(k);
    }
    void print;
    return { stderr: err.join("\n"), status: err.length ? 1 : 0 };
  };
  C.unset = function (args) {
    const err = [];
    for (const k of args.filter((a) => !/^-[vfn]$/.test(a))) {
      if (!VALID.test(k)) { err.push(`bash: unset: \`${k}': not a valid identifier`); continue; }
      if (k === "UID" || k === "EUID" || k === "PPID") { err.push(`bash: unset: ${k}: cannot unset: readonly variable`); continue; }
      delete this.env[k];
      this.exported.delete(k);
    }
    return { stderr: err.join("\n"), status: err.length ? 1 : 0 };
  };

  /* Run fn with the exported environment replaced by vars (env VAR=x cmd, env -i cmd). */
  SH.withEnv = function (vars, fn) {
    const save = { env: this.env, exported: this.exported };
    this.env = { ...vars };
    this.exported = new Set(Object.keys(vars));
    try { return fn(); } finally { this.env = save.env; this.exported = save.exported; }
  };
  C.env = function (args, stdin, res, ctx) {
    let clear = false, i = 0;
    const unset = [], assigns = {};
    for (; i < args.length; i++) {
      const a = args[i];
      if (a === "-i" || a === "-" || a === "--ignore-environment") clear = true;
      else if (a === "-u" || a === "--unset") unset.push(args[++i]);
      else if (/^--unset=/.test(a)) unset.push(a.split("=")[1]);
      else if (/^-u./.test(a)) unset.push(a.slice(2));
      else if (a === "--") { i++; break; }
      else if (/^[A-Za-z_]\w*=/.test(a)) { const k = a.split("=")[0]; assigns[k] = a.slice(k.length + 1); }
      else if (/^-/.test(a)) return { stderr: `env: invalid option -- '${a.replace(/^-+/, "")[0]}'\nTry 'env --help' for more information.`, status: 125 };
      else break;
    }
    const vars = clear ? {} : exportedEnv(this);
    unset.forEach((k) => delete vars[k]);
    Object.assign(vars, assigns);
    const cmd = args.slice(i);
    if (!cmd.length) return { stdout: [...Object.entries(vars).map(([k, v]) => `${k}=${v}`), "_=/usr/bin/env"].join("\n") + "\n" };
    res.events.push({ type: "env-run", cmd: cmd.join(" "), clear: clear ? "yes" : "no", unset: unset.join(","), set: Object.keys(assigns).join(",") });
    return this.withEnv(vars, () => this.exec(cmd, stdin, res, ctx));
  };
  C.printenv = function (args) {
    const names = args.filter((a) => !a.startsWith("-"));
    const vars = exportedEnv(this);
    if (!names.length) return { stdout: [...Object.entries(vars).map(([k, v]) => `${k}=${v}`), "_=/usr/bin/printenv"].join("\n") + "\n" };
    const out = names.filter((k) => vars[k] !== undefined).map((k) => vars[k]);
    return { stdout: out.length ? out.join("\n") + "\n" : "", status: out.length === names.length ? 0 : 1 };
  };

  const SHELL_EXTRAS = (sh) => ({
    BASH: "/usr/bin/bash", BASHOPTS: "checkwinsize:cmdhist:complete_fullquote:expand_aliases:extglob:extquote:force_fignore:globasciiranges:globskipdots:histappend:interactive_comments:patsub_replacement:progcomp:promptvars:sourcepath",
    BASH_VERSION: "5.2.21(1)-release", EUID: String(uidOf(sh)), HOSTNAME: sh.host, HOSTTYPE: "x86_64", IFS: " \t\n", MACHTYPE: "x86_64-pc-linux-gnu",
    OPTERR: "1", OPTIND: "1", OSTYPE: "linux-gnu", PPID: sh.dynVar("PPID"), SHELLOPTS: "braceexpand:emacs:hashall:histexpand:history:interactive-comments:monitor", UID: String(uidOf(sh)),
  });
  C.set = function (args) {
    if (args.length) return {}; // set -o, set -e and friends: accepted, no effect here
    const all = { ...SHELL_EXTRAS(this), ...this.env };
    const lines = Object.keys(all).filter((k) => !/^\d+$/.test(k)).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)).map((k) => `${k}=${setQuote(all[k])}`);
    lines.splice(lines.findIndex((l) => l > "GROUPS") >= 0 ? lines.findIndex((l) => l > "GROUPS") : lines.length, 0, "GROUPS=()");
    return { stdout: lines.join("\n") + "\n" };
  };
  C.declare = C.typeset = function (args) {
    const flags = args.filter((a) => /^[-+]/.test(a)).join(""), names = args.filter((a) => !/^[-+]/.test(a));
    if (flags.includes("p") || (!names.length && !flags)) {
      const list = names.length ? names : Object.keys({ ...this.env }).filter((k) => !/^\d+$/.test(k)).sort();
      const out = [], err = [];
      for (const k of list) {
        if (varValue(this, k) === undefined && !this.arrayVar(k) && !this.exported.has(k)) { err.push(`bash: declare: ${k}: not found`); continue; }
        out.push(declLine(this, k));
      }
      return { stdout: out.length ? out.join("\n") + "\n" : "", stderr: err.join("\n"), status: err.length ? 1 : 0 };
    }
    for (const a of names) {
      const k = a.split("=")[0];
      if (!VALID.test(k)) return { stderr: `bash: declare: \`${a}': not a valid identifier`, status: 1 };
      if (a.includes("=")) this.env[k] = a.slice(k.length + 1); else if (this.env[k] === undefined && !flags.includes("x")) this.env[k] = "";
      if (/-[a-z]*x/.test(flags)) this.exported.add(k);
      if (/\+[a-z]*x/.test(flags)) this.exported.delete(k);
    }
    return {};
  };

  C.alias = function (args) {
    if (!args.length) return { stdout: Object.keys(this.aliases).sort().map((k) => `alias ${k}='${this.aliases[k]}'`).join("\n") + (Object.keys(this.aliases).length ? "\n" : "") };
    const out = [], err = [];
    for (const a of args.filter((x) => x !== "-p")) {
      const m = a.match(/^([^=]+)=([\s\S]*)$/);
      if (m) this.aliases[m[1]] = m[2];
      else if (this.aliases[a] !== undefined) out.push(`alias ${a}='${this.aliases[a]}'`);
      else err.push(`bash: alias: ${a}: not found`);
    }
    return { stdout: out.length ? out.join("\n") + "\n" : "", stderr: err.join("\n"), status: err.length ? 1 : 0 };
  };
  C.unalias = function (args) {
    if (args[0] === "-a") { this.aliases = {}; return {}; }
    const err = [];
    for (const a of args) { if (this.aliases[a] !== undefined) delete this.aliases[a]; else err.push(`bash: unalias: ${a}: not found`); }
    return { stderr: err.join("\n"), status: err.length ? 1 : 0 };
  };

  C.shopt = function (args) {
    const sh = this;
    const opts = { autocd: false, cdspell: false, checkwinsize: true, cmdhist: true, dotglob: false, expand_aliases: !!sh._interactive, extglob: true, globstar: false,
      histappend: true, interactive_comments: true, login_shell: !!sh._login, nocaseglob: false, progcomp: true, promptvars: true, sourcepath: true };
    sh.shoptSet = sh.shoptSet || {};
    Object.assign(opts, sh.shoptSet, { login_shell: !!sh._login });
    const flags = args.filter((a) => a.startsWith("-")).join(""), names = args.filter((a) => !a.startsWith("-"));
    if (/[su]/.test(flags)) {
      for (const n of names) { if (n === "login_shell") continue; if (!(n in opts)) return { stderr: `bash: shopt: ${n}: invalid shell option name`, status: 1 }; sh.shoptSet[n] = flags.includes("s"); }
      return {};
    }
    const list = names.length ? names : Object.keys(opts);
    const out = [], err = [];
    let status = 0;
    for (const n of list) {
      if (!(n in opts)) { err.push(`bash: shopt: ${n}: invalid shell option name`); status = 1; continue; }
      if (!opts[n]) status = 1;
      out.push(`${n.padEnd(15)}\t${opts[n] ? "on" : "off"}`);
    }
    if (flags.includes("q")) return { status };
    return { stdout: out.length ? out.join("\n") + "\n" : "", stderr: err.join("\n"), status };
  };

  /* ------------------------------------------------------------------ prompt */
  function renderPrompt(sh, ps) {
    let s = String(ps);
    s = s.replace(/\\\[[\s\S]*?\\\]/g, ""); // \[ … \] wraps non-printing sequences (colours, the window title)
    const dir = sh.displayCwd();
    s = s.replace(/\\(0?33|e)\[[0-9;]*m/g, "");
    s = s.replace(/\\(.)/g, (m, c) => ({
      u: sh.vfs.actor === "root" && sh.euser === "root" ? "root" : sh.user, h: sh.host.split(".")[0], H: sh.host, w: dir, W: dir === "~" ? "~" : dir.split("/").pop() || "/",
      $: uidOf(sh) === 0 ? "#" : "$", s: "bash", v: "5.2", V: "5.2.21", n: " ", t: new Date().toTimeString().slice(0, 8), A: new Date().toTimeString().slice(0, 5),
      d: new Date().toDateString().slice(0, 10), "\\": "\\", a: "", e: "", "!": String(sh.history.length + 1), "#": String(sh.history.length + 1), j: "0", l: "pts/0",
    }[c] ?? m));
    s = s.replace(/\$\{(\w+):\+([^}]*)\}/g, (m, n, w) => (varValue(sh, n) ? w.replace(/\$(\w+)/g, (x, k) => varValue(sh, k) ?? "") : ""));
    s = s.replace(/\$\{(\w+)\}|\$([A-Za-z_]\w*)/g, (m, a, b) => varValue(sh, a || b) ?? "");
    return s;
  }
  const promptPrev = SH.prompt;
  SH.prompt = function () {
    const p = this.proc;
    if ((p && p.ask && !p.ask.key) || this.env.PS1 === undefined) return promptPrev.call(this);
    return renderPrompt(this, this.env.PS1).replace(/\s+$/, "");
  };
  SH.ps2 = function () { return renderPrompt(this, this.env.PS2 ?? "> ").replace(/\s+$/, "") || ">"; };

  /* ------------------------------------------------------------------ date, locale, df, diff */
  const SYS_TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; } })();
  const ABBR = { "Asia/Tokyo": "JST", "Asia/Seoul": "KST", "Asia/Kolkata": "IST", "Asia/Shanghai": "CST", "Asia/Singapore": "+08", "Europe/Berlin": ["CET", "CEST"], "Europe/Paris": ["CET", "CEST"],
    "Europe/Madrid": ["CET", "CEST"], "Europe/Rome": ["CET", "CEST"], "Europe/Amsterdam": ["CET", "CEST"], "Europe/London": ["GMT", "BST"], "Europe/Dublin": ["GMT", "IST"],
    "Australia/Sydney": ["AEST", "AEDT"], "Australia/Brisbane": "AEST", "Pacific/Auckland": ["NZST", "NZDT"], "America/Sao_Paulo": "-03", "Africa/Johannesburg": "SAST" };
  function zoned(ms, tz) {
    let zone = tz, abbr = null;
    let fmt;
    try { fmt = new Intl.DateTimeFormat("en-US", { timeZone: zone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", weekday: "short", timeZoneName: "short" }); }
    catch { abbr = tz.replace(/[^A-Za-z]/g, "").slice(0, 6) || "UTC"; zone = "UTC"; fmt = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", weekday: "short", timeZoneName: "short" }); }
    const parts = Object.fromEntries(fmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
    const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute, +parts.second);
    const offMin = Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60000);
    if (!abbr) {
      abbr = parts.timeZoneName;
      if (zone === "UTC" || zone === "Etc/UTC") abbr = "UTC";
      else if (/^GMT[+-]/.test(abbr) || abbr === "GMT") {
        const m = ABBR[zone];
        if (Array.isArray(m)) { const jan = zoned(Date.UTC(new Date(ms).getUTCFullYear(), 0, 1), zone).offMin; abbr = offMin === jan ? m[0] : m[1]; }
        else if (m) abbr = m;
        else { const h = offMin / 60; abbr = (h >= 0 ? "+" : "-") + String(Math.abs(Math.trunc(h))).padStart(2, "0") + (offMin % 60 ? String(Math.abs(offMin % 60)).padStart(2, "0") : ""); }
      }
    }
    return { y: +parts.year, mo: +parts.month, d: +parts.day, H: +parts.hour % 24, M: +parts.minute, S: +parts.second, wd: parts.weekday, abbr, offMin };
  }
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const WDAY = { Sun: "Sunday", Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday" };
  const p2 = (n) => String(n).padStart(2, "0");
  function strftime(f, z, ms) {
    const off = (z.offMin >= 0 ? "+" : "-") + p2(Math.floor(Math.abs(z.offMin) / 60)) + p2(Math.abs(z.offMin) % 60);
    const doy = Math.floor((Date.UTC(z.y, z.mo - 1, z.d) - Date.UTC(z.y, 0, 1)) / 864e5) + 1;
    return f.replace(/%([a-zA-Z%:+])/g, (m, c) => ({
      Y: z.y, y: p2(z.y % 100), m: p2(z.mo), d: p2(z.d), e: String(z.d).padStart(2), H: p2(z.H), I: p2(z.H % 12 || 12), M: p2(z.M), S: p2(z.S), p: z.H < 12 ? "AM" : "PM",
      a: z.wd, A: WDAY[z.wd], b: MON[z.mo - 1], h: MON[z.mo - 1], B: MONTH[z.mo - 1], Z: z.abbr, z: off, F: `${z.y}-${p2(z.mo)}-${p2(z.d)}`, T: `${p2(z.H)}:${p2(z.M)}:${p2(z.S)}`,
      R: `${p2(z.H)}:${p2(z.M)}`, D: `${p2(z.mo)}/${p2(z.d)}/${p2(z.y % 100)}`, s: Math.floor(ms / 1000), j: String(doy).padStart(3, "0"), u: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(z.wd) + 1,
      n: "\n", t: "\t", "%": "%", c: `${z.wd} ${MON[z.mo - 1]} ${String(z.d).padStart(2)} ${p2(z.H)}:${p2(z.M)}:${p2(z.S)} ${z.y}`, x: `${p2(z.mo)}/${p2(z.d)}/${p2(z.y % 100)}`, X: `${p2(z.H)}:${p2(z.M)}:${p2(z.S)}`,
    }[c] ?? m));
  }
  C.date = function (args) {
    let utc = false, fmt = null, when = null;
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === "-u" || a === "--utc" || a === "--universal") utc = true;
      else if (a.startsWith("+")) fmt = a.slice(1);
      else if (a === "-d" || a === "--date") when = args[++i];
      else if (a.startsWith("--date=")) when = a.slice(7);
      else if (a === "-R" || a === "--rfc-email") fmt = "%a, %d %b %Y %H:%M:%S %z";
      else if (a === "-I" || a === "--iso-8601") fmt = "%F";
      else if (a === "-Iseconds") fmt = "%FT%T%:z";
      else return { stderr: `date: invalid date '${a}'`, status: 1 };
    }
    let ms = Date.now() + (this.proc ? this.proc.offset * 1000 : 0);
    if (when) {
      const w = when.trim().toLowerCase();
      if (w === "now" || w === "today") {} else if (w === "tomorrow") ms += 864e5; else if (w === "yesterday") ms -= 864e5;
      else if (/^@\d+$/.test(w)) ms = +w.slice(1) * 1000;
      else { const t = Date.parse(when); if (Number.isNaN(t)) return { stderr: `date: invalid date '${when}'`, status: 1 }; ms = t; }
    }
    const tzVar = this.exported && this.exported.has("TZ") ? this.env.TZ : undefined;
    const tz = utc ? "UTC" : tzVar !== undefined ? tzVar.replace(/^:/, "") || "UTC" : SYS_TZ;
    const z = zoned(ms, tz);
    const f = (fmt || "%a %b %e %H:%M:%S %Z %Y").replace(/%:z/g, () => { const o = strftime("%z", z, ms); return o.slice(0, 3) + ":" + o.slice(3); });
    return { stdout: strftime(f, z, ms) + "\n" };
  };

  C.locale = function (args) {
    if (args.includes("-a")) return { stdout: "C\nC.utf8\nen_US.utf8\nPOSIX\n" };
    const ex = (k) => (this.exported.has(k) ? this.env[k] : undefined);
    const lang = ex("LANG") ?? "", all = ex("LC_ALL");
    const cats = ["LC_CTYPE", "LC_NUMERIC", "LC_TIME", "LC_COLLATE", "LC_MONETARY", "LC_MESSAGES", "LC_PAPER", "LC_NAME", "LC_ADDRESS", "LC_TELEPHONE", "LC_MEASUREMENT", "LC_IDENTIFICATION"];
    const lines = [`LANG=${lang}`, `LANGUAGE=${ex("LANGUAGE") ?? ""}`];
    for (const c of cats) { const own = ex(c); lines.push(own && !all ? `${c}=${own}` : `${c}="${all || own || lang || "POSIX"}"`); }
    lines.push(`LC_ALL=${all ?? ""}`);
    return { stdout: lines.join("\n") + "\n" };
  };

  const MOUNTS = [
    ["tmpfs", 401408, 1640, 399768, "/run"], ["/dev/sda2", 50770432, 14234112, 33924404, "/"], ["tmpfs", 2005040, 0, 2005040, "/dev/shm"],
    ["tmpfs", 5120, 4, 5116, "/run/lock"], ["/dev/sda1", 524252, 6220, 518032, "/boot/efi"], ["tmpfs", 401004, 128, 400876, "/run/user/1000"],
  ];
  if (!C.df) C.df = function (args) {
    const human = args.some((a) => /^-[a-zA-Z]*h/.test(a)), files = args.filter((a) => !a.startsWith("-"));
    const hz = (kb) => { if (!kb) return "0"; const u = ["K", "M", "G", "T"]; let v = kb, i = 0; while (v >= 1024 && i < 3) { v /= 1024; i++; } return (v < 10 && i ? v.toFixed(1) : String(Math.ceil(v))) + u[i]; };
    let rows = MOUNTS;
    if (files.length) {
      rows = [];
      for (const f of files) {
        const abs = this.abs(f);
        if (!this.vfs.get(abs)) return { stderr: `df: ${f}: No such file or directory`, status: 1 };
        rows.push(MOUNTS.filter((m) => abs === m[4] || abs.startsWith(m[4] === "/" ? "/" : m[4] + "/")).sort((a, b) => b[4].length - a[4].length)[0]);
      }
    }
    const head = human ? "Filesystem      Size  Used Avail Use% Mounted on" : "Filesystem     1K-blocks     Used Available Use% Mounted on";
    const lines = rows.map(([fs, size, used, avail, mnt]) => {
      const pct = size ? Math.ceil((used / (used + avail)) * 100) + "%" : "-";
      return human ? `${fs.padEnd(15)}${hz(size).padStart(5)} ${hz(used).padStart(5)} ${hz(avail).padStart(5)} ${pct.padStart(4)} ${mnt}`
        : `${fs.padEnd(14)}${String(size).padStart(10)} ${String(used).padStart(8)} ${String(avail).padStart(9)} ${pct.padStart(4)} ${mnt}`;
    });
    return { stdout: [head, ...lines].join("\n") + "\n" };
  };

  if (!C.diff) C.diff = function (args) {
    const flags = args.filter((a) => /^-/.test(a)).join(""), files = args.filter((a) => !/^-/.test(a));
    if (files.length !== 2) return { stderr: `diff: missing operand after '${files[0] || "diff"}'\ndiff: Try 'diff --help' for more information.`, status: 2 };
    const read = (f) => { const n = this.vfs.get(this.abs(f)); return n && n.type === "file" ? n.content || "" : null; };
    const A = read(files[0]), B = read(files[1]);
    for (const [f, t] of [[files[0], A], [files[1], B]]) if (t === null) return { stderr: `diff: ${f}: No such file or directory`, status: 2 };
    if (A === B) return flags.includes("s") ? { stdout: `Files ${files[0]} and ${files[1]} are identical\n` } : {};
    if (flags.includes("q")) return { stdout: `Files ${files[0]} and ${files[1]} differ\n`, status: 1 };
    const a = A.replace(/\n$/, "").split("\n"), b = B.replace(/\n$/, "").split("\n");
    const n = a.length, m = b.length;
    const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const out = [];
    const range = (s, e) => (e - s === 1 ? String(s + 1) : `${s + 1},${e}`);
    let i = 0, j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && a[i] === b[j]) { i++; j++; continue; }
      const si = i, sj = j;
      while ((i < n || j < m) && !(i < n && j < m && a[i] === b[j])) { if (j >= m || (i < n && L[i + 1][j] >= L[i][j + 1])) i++; else j++; }
      if (si < i && sj < j) out.push(`${range(si, i)}c${range(sj, j)}`, ...a.slice(si, i).map((l) => "< " + l), "---", ...b.slice(sj, j).map((l) => "> " + l));
      else if (si < i) out.push(`${range(si, i)}d${sj}`, ...a.slice(si, i).map((l) => "< " + l));
      else out.push(`${si}a${range(sj, j)}`, ...b.slice(sj, j).map((l) => "> " + l));
    }
    return { stdout: out.join("\n") + "\n", status: 1 };
  };
})();
