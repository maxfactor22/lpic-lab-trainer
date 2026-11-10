/* Ownership, permissions and links for the practice terminal (Section 10 and later):
   users and groups, permission checks with real "Permission denied" errors, chmod (octal and
   symbolic, special bits, -R, X), chown, chgrp, umask, id, groups, getent, newgrp, mkfifo, ln
   (-s -f -n -v), sudo -u, ( subshells ), and find -perm/-user/-group/-printf/-samefile/-xtype. */
(function () {
  "use strict";
  const LPIC = window.LPIC;
  const { EXTERNAL, opts } = LPIC.shellUtil;
  const C = LPIC.Shell.commands;
  ["chmod", "chown", "chgrp", "id", "groups", "getent", "mkfifo", "ln"].forEach((c) => (EXTERNAL[c] = "/usr/bin/" + c));
  const joinLines = (l) => (l.length ? l.join("\n") + "\n" : "");

  /* ------------------------------------------------------------- users and groups */
  const USERS = { root: { uid: 0, gid: 0, group: "root" }, daemon: { uid: 1, gid: 1, group: "daemon" }, nobody: { uid: 65534, gid: 65534, group: "nogroup" }, syslog: { uid: 102, gid: 104, group: "syslog" } };
  const GROUPS = { root: 0, daemon: 1, adm: 4, disk: 6, cdrom: 24, sudo: 27, dip: 30, shadow: 42, plugdev: 46, users: 100, nogroup: 65534, syslog: 104, lpadmin: 120 };
  const MEMBERS = { adm: ["syslog"], cdrom: [], sudo: [], dip: [], plugdev: [], lpadmin: [] };
  let LOGIN = "max";
  LPIC.groupsOf = (u) => {
    if (u === "root") return ["root"];
    if (u === "nobody") return ["nogroup"];
    if (u === LOGIN) return [LOGIN, "adm", "cdrom", "sudo", "dip", "plugdev", "users", "lpadmin"];
    return [USERS[u]?.group || u, ...Object.keys(MEMBERS).filter((g) => MEMBERS[g].includes(u))];
  };
  const uidOf = (u) => (u === LOGIN ? 1000 : USERS[u]?.uid ?? null);
  const gidOf = (g) => (g === LOGIN ? 1000 : GROUPS[g] ?? null);

  /* ------------------------------------------------------------- mode helpers */
  const TYPE_CHAR = { file: "-", dir: "d", link: "l", fifo: "p", sock: "s", chr: "c", blk: "b" };
  const permOf = (n) => (n.perm !== undefined ? n.perm : n.type === "dir" ? 0o775 : n.type === "link" ? 0o777 : 0o664);
  function modeString(n) {
    const p = permOf(n);
    const tri = (r, w, x, special, lo, hi) => (p & r ? "r" : "-") + (p & w ? "w" : "-") + (p & special ? (p & x ? lo : hi) : p & x ? "x" : "-");
    return (TYPE_CHAR[n.type] || "-") + tri(0o400, 0o200, 0o100, 0o4000, "s", "S") + tri(0o040, 0o020, 0o010, 0o2000, "s", "S") + tri(0o004, 0o002, 0o001, 0o1000, "t", "T");
  }
  let inoSeq = 1310700;
  const inodeOf = (n) => n.ino || (n.ino = ++inoSeq);
  const linksOf = (n) => (n.type === "dir" ? 2 + Object.values(n.children).filter((c) => c.type === "dir").length : n.nlink || 1);
  LPIC.perm = { modeString, permOf, inodeOf, linksOf, owner: (n) => n.owner || LOGIN, group: (n) => n.group || n.owner || LOGIN, octal: (n) => (permOf(n) & 0o7777).toString(8) };

  /* System files, devices, sockets and SUID programs, set up for every new shell. */
  LPIC.shellInit = LPIC.shellInit || [];
  LPIC.shellInit.push((sh) => {
    LOGIN = sh.user;
    const v = sh.vfs;
    const mk = (path, node) => { v.mkdirp(path.replace(/\/[^/]+$/, "")); const { dir, name } = v.parentOf(path); dir.children[name] = { owner: "root", group: "root", mtime: Date.now() - 30 * 864e5, nlink: 1, ...node }; };
    mk("/dev/null", { type: "chr", perm: 0o666, major: 1, minor: 3 });
    mk("/dev/zero", { type: "chr", perm: 0o666, major: 1, minor: 5 });
    mk("/dev/urandom", { type: "chr", perm: 0o666, major: 1, minor: 9 });
    mk("/dev/tty", { type: "chr", perm: 0o666, group: "tty", major: 5, minor: 0 });
    mk("/dev/sda", { type: "blk", perm: 0o660, group: "disk", major: 8, minor: 0 });
    mk("/dev/sda1", { type: "blk", perm: 0o660, group: "disk", major: 8, minor: 1 });
    mk("/dev/sda2", { type: "blk", perm: 0o660, group: "disk", major: 8, minor: 2 });
    mk("/dev/sr0", { type: "blk", perm: 0o660, group: "cdrom", major: 11, minor: 0 });
    v.mkdirp("/dev/shm"); v.get("/dev/shm").perm = 0o1777; v.get("/dev/shm").fs = "tmpfs";
    mk("/run/dbus/system_bus_socket", { type: "sock", perm: 0o666 });
    mk("/run/snapd.socket", { type: "sock", perm: 0o666 });
    mk("/run/systemd/notify", { type: "sock", perm: 0o777 });
    v.get("/tmp").perm = 0o1777;
    const suid = { "/usr/bin/passwd": 0o4755, "/usr/bin/sudo": 0o4755, "/usr/bin/su": 0o4755, "/usr/bin/mount": 0o4755, "/usr/bin/umount": 0o4755, "/usr/bin/chsh": 0o4755, "/usr/bin/newgrp": 0o4755, "/usr/bin/gpasswd": 0o4755 };
    for (const [p, perm] of Object.entries(suid)) { v.write(p, ""); Object.assign(v.get(p), { perm, owner: "root", group: "root" }); }
    for (const [p, g] of Object.entries({ "/usr/bin/crontab": "crontab", "/usr/bin/ssh-agent": "_ssh", "/usr/sbin/unix_chkpwd": "shadow", "/usr/bin/chage": "shadow", "/usr/bin/expiry": "shadow" })) { v.write(p, ""); Object.assign(v.get(p), { perm: 0o2755, owner: "root", group: g }); }
    // Programs on disk are executable.
    for (const dir of ["/usr/bin", "/usr/sbin", "/usr/local/bin"]) { const d = v.get(dir); if (d) for (const n of Object.values(d.children)) if (n.type === "file" && !(n.perm & 0o6000)) n.perm = 0o755; }
    for (const [l, t] of Object.entries(LPIC.symlinks || {})) if (!v.lget(l) && t) { const { dir, name } = v.parentOf(l); if (dir && !dir.children[name]) dir.children[name] = { type: "link", target: t, owner: "root", group: "root", perm: 0o777, mtime: Date.now() - 30 * 864e5, nlink: 1 }; }
    for (const a of ["vi", "vim", "view", "editor"]) { const p = "/etc/alternatives/" + a; if (!v.lget(p)) { v.mkdirp("/etc/alternatives"); v.get("/etc/alternatives").children[a] = { type: "link", target: (LPIC.symlinks || {})[p] || "/usr/bin/vim.basic", owner: "root", group: "root", perm: 0o777, mtime: Date.now(), nlink: 1 }; } }
    if (!v.get("/usr/bin/vim.basic")) { v.write("/usr/bin/vim.basic", ""); v.get("/usr/bin/vim.basic").perm = 0o755; }
    const ub = v.get("/usr/bin"); for (const name of ["vi", "vim", "view"]) if (ub.children[name] && ub.children[name].type !== "link") ub.children[name] = { type: "link", target: "/etc/alternatives/" + name, owner: "root", group: "root", perm: 0o777, mtime: Date.now(), nlink: 1 };
    sh.umask = 0o002;
    v.umask = 0o002;
    v.actor = sh.user; // from here on, permissions are enforced
  });

  /* ------------------------------------------------------------- run commands as another user */
  const baseExec = LPIC.Shell.prototype.exec;
  LPIC.Shell.prototype.exec = function (argv, stdin, res, ctx = {}) {
    if (argv[0] !== "sudo" || argv.length < 2) {
      const prev = this.vfs.actor;
      if (prev !== "root" && prev !== null) this.vfs.actor = this.euser || this.user;
      try { return baseExec.call(this, argv, stdin, res, ctx); } finally { this.vfs.actor = prev; }
    }
    let i = 1, as = "root";
    while (argv[i] && argv[i].startsWith("-")) { if (argv[i] === "-u") { as = argv[i + 1]; i += 2; } else if (/^-u.+/.test(argv[i])) { as = argv[i].slice(2); i++; } else i++; }
    if (uidOf(as) === null && !USERS[as]) return { stderr: `sudo: unknown user ${as}\nsudo: error initializing audit plugin sudoers_audit`, status: 1 };
    res.events.push({ type: "sudo", cmd: argv.slice(i).join(" "), as });
    const prev = this.vfs.actor, prevE = this.euser;
    this.vfs.actor = as; this.euser = as;
    try { return baseExec.call(this, argv.slice(i), stdin, res, ctx); }
    finally { this.vfs.actor = prev; this.euser = prevE; }
  };
  const actor = (sh) => sh.vfs.actor || sh.user;

  /* ------------------------------------------------------------- ( subshell ) */
  const baseRun = LPIC.Shell.prototype.run;
  LPIC.Shell.prototype.runSubshell = function (inner) {
    const save = { cwd: this.cwd, env: { ...this.env }, umask: this.umask };
    const saveHist = this.history.length;
    const r = baseRun.call(this, " " + inner);
    this.history.length = saveHist;
    this.cwd = save.cwd; this.env = save.env; this.umask = save.umask; this.vfs.umask = save.umask;
    return r;
  };

  /* ------------------------------------------------------------- permission checks on common commands */
  const READERS = { cat: "", head: "cannot open '%s' for reading", tail: "cannot open '%s' for reading", less: "", more: "", grep: "", wc: "", sort: "open failed: %s", uniq: "", nl: "", cut: "", md5sum: "", sha256sum: "", sha1sum: "", sha512sum: "", file: "" };
  for (const [cmd, fmt] of Object.entries(READERS)) {
    const base = C[cmd];
    if (!base) continue;
    C[cmd] = function (args, stdin, res, ctx) {
      const errs = [], keep = [];
      let skipNext = false;
      args.forEach((a, idx) => {
        if (skipNext) { keep.push(a); skipNext = false; return; }
        if (a.startsWith("-") || (cmd === "grep" && !keep.some((k) => !k.startsWith("-")) && idx === args.findIndex((x) => !x.startsWith("-")))) { keep.push(a); if (/^-[nef]$/.test(a)) skipNext = true; return; }
        const abs = this.abs(a), node = this.vfs.get(abs);
        if (node && (!this.vfs.canTraverse(abs) || (node.type === "file" && !this.vfs.can(node, "r")))) {
          if (cmd === "file") { errs.push(`${a}: cannot open \`${a}' (Permission denied)`); return; }
          errs.push(fmt ? `${cmd}: ${fmt.replace("%s", a)}: Permission denied` : `${cmd}: ${a}: Permission denied`);
          return;
        }
        keep.push(a);
      });
      if (!errs.length) return base.call(this, args, stdin, res, ctx);
      const hasFile = keep.some((k, i) => !k.startsWith("-") && !(cmd === "grep" && i === keep.findIndex((x) => !x.startsWith("-"))));
      const r = hasFile ? base.call(this, keep, stdin, res, ctx) : {};
      return { stdout: r.stdout || "", stderr: [r.stderr, ...errs].filter(Boolean).join("\n"), status: cmd === "grep" && !r.stdout ? 2 : 1 };
    };
  }
  const baseCd = C.cd;
  C.cd = function (args, stdin, res, ctx) {
    const t = args[0];
    if (t && t !== "-") { const abs = this.abs(t), n = this.vfs.get(abs); if (n && n.type === "dir" && !this.vfs.canTraverse(abs + "/x")) return { stderr: `bash: cd: ${t}: Permission denied`, status: 1 }; }
    return baseCd.call(this, args, stdin, res, ctx);
  };
  const baseTouch = C.touch;
  C.touch = function (args, stdin, res, ctx) {
    const errs = [], keep = [];
    for (const a of args) {
      if (a.startsWith("-")) { keep.push(a); continue; }
      const abs = this.abs(a), n = this.vfs.get(abs), { dir } = this.vfs.parentOf(abs);
      if ((n && !this.vfs.can(n, "w") && n.owner !== actor(this)) || (!n && dir && (!this.vfs.can(dir, "w") || !this.vfs.can(dir, "x"))) || !this.vfs.canTraverse(abs)) { errs.push(`touch: cannot touch '${a}': Permission denied`); continue; }
      keep.push(a);
    }
    const r = keep.some((k) => !k.startsWith("-")) ? baseTouch.call(this, keep, stdin, res, ctx) : {};
    return { stderr: [r.stderr, ...errs].filter(Boolean).join("\n"), status: errs.length || r.status ? 1 : 0 };
  };
  const baseRm = C.rm;
  C.rm = function (args, stdin, res, ctx) {
    const errs = [], keep = [];
    const force = args.some((a) => /^-[a-zA-Z]*f/.test(a));
    for (const a of args) {
      if (a.startsWith("-")) { keep.push(a); continue; }
      const abs = this.abs(a), n = this.vfs.lget(abs), { dir } = this.vfs.parentOf(abs);
      if (n && dir) {
        const me = actor(this);
        if (!this.vfs.can(dir, "w") || !this.vfs.can(dir, "x") || !this.vfs.canTraverse(abs)) { errs.push(`rm: cannot remove '${a}': Permission denied`); continue; }
        if ((dir.perm & 0o1000) && me !== "root" && n.owner !== me && dir.owner !== me) { errs.push(`rm: cannot remove '${a}': Operation not permitted`); continue; }
        if (n.type === "file" && !this.vfs.can(n, "w") && !force && n.owner === me && !/^-[a-zA-Z]*i/.test(args.join(" "))) { /* GNU asks "remove write-protected file?"; treat as yes */ }
      }
      keep.push(a);
    }
    const r = keep.some((k) => !k.startsWith("-")) ? baseRm.call(this, keep, stdin, res, ctx) : {};
    return { stdout: r.stdout || "", stderr: [r.stderr, ...errs].filter(Boolean).join("\n"), status: errs.length || r.status ? 1 : 0 };
  };

  /* ------------------------------------------------------------- id, groups, getent, newgrp, umask */
  C.id = function (args) {
    const f = new Set(), names = [];
    for (const a of args) if (a.startsWith("-")) for (const ch of a.replace(/^--?/, "")) f.add(ch); else names.push(a);
    const u = names[0] || actor(this);
    if (uidOf(u) === null) return { stderr: `id: '${u}': no such user`, status: 1 };
    const gs = LPIC.groupsOf(u);
    const primary = u === LOGIN ? LOGIN : USERS[u]?.group || u;
    const n = f.has("n");
    if (f.has("u")) return { stdout: (n ? u : uidOf(u)) + "\n" };
    if (f.has("g") && !f.has("G")) return { stdout: (n ? primary : gidOf(primary)) + "\n" };
    if (f.has("G")) return { stdout: gs.map((g) => (n ? g : gidOf(g))).join(" ") + "\n" };
    return { stdout: `uid=${uidOf(u)}(${u}) gid=${gidOf(primary)}(${primary}) groups=${gs.map((g) => `${gidOf(g)}(${g})`).join(",")}\n` };
  };
  C.groups = function (args) {
    const u = args[0] || actor(this);
    const gs = LPIC.groupsOf(u).join(" ");
    return { stdout: (args[0] ? `${u} : ${gs}` : gs) + "\n" };
  };
  C.getent = function (args) {
    const [db, key] = args;
    if (db === "group") {
      const all = { ...GROUPS, [LOGIN]: 1000 };
      const line = (g) => `${g}:x:${all[g]}:${g === LOGIN ? "" : Object.entries({ adm: ["syslog", LOGIN], cdrom: [LOGIN], sudo: [LOGIN], dip: [LOGIN], plugdev: [LOGIN], lpadmin: [LOGIN], users: [LOGIN] }).find(([k]) => k === g)?.[1].join(",") || ""}`;
      if (key) return all[key] !== undefined || key in all ? { stdout: line(key) + "\n" } : { status: 2 };
      return { stdout: joinLines(Object.keys(all).map(line)) };
    }
    if (db === "passwd") {
      const n = this.vfs.get("/etc/passwd");
      const lines = (n?.content || "").split("\n").filter(Boolean);
      const hit = key ? lines.filter((l) => l.startsWith(key + ":")) : lines;
      return hit.length ? { stdout: joinLines(hit) } : { status: 2 };
    }
    return { stderr: `Unknown database: ${db}\nTry \`getent --help' or \`getent --usage' for more information.`, status: 1 };
  };
  C.newgrp = function () { return { stderr: "newgrp starts a new shell with a different primary group. The practice terminal keeps your current group; on your VM, type exit to leave the new shell.", status: 1 }; };
  const symbolicMask = (m) => { const p = 0o777 & ~m; const t = (s) => ((p >> s) & 4 ? "r" : "") + ((p >> s) & 2 ? "w" : "") + ((p >> s) & 1 ? "x" : ""); return `u=${t(6)},g=${t(3)},o=${t(0)}`; };
  C.umask = function (args) {
    if (!args.length) return { stdout: this.umask.toString(8).padStart(4, "0") + "\n" };
    if (args[0] === "-S") return { stdout: symbolicMask(this.umask) + "\n" };
    if (/^[0-7]{1,4}$/.test(args[0])) { this.umask = parseInt(args[0], 8) & 0o777; this.vfs.umask = this.umask; return {}; }
    const r = applySymbolic(0o777 & ~this.umask, args[0], true);
    if (r === null) return { stderr: `bash: umask: ${args[0]}: invalid symbolic mode operator`, status: 1 };
    this.umask = 0o777 & ~r; this.vfs.umask = this.umask; return {};
  };

  /* ------------------------------------------------------------- chmod */
  function applySymbolic(perm, spec, isDir) {
    for (const clause of spec.split(",")) {
      const m = clause.match(/^([ugoa]*)((?:[-+=][rwxXstugo]*)+)$/);
      if (!m) return null;
      const who = m[1] || "a";
      const parts = m[2].match(/[-+=][rwxXstugo]*/g);
      for (const part of parts) {
        const op = part[0], letters = part.slice(1);
        let bits = 0;
        const sel = (w) => who.includes(w) || who.includes("a");
        for (const l of letters) {
          if ("ugo".includes(l)) { const src = { u: 6, g: 3, o: 0 }[l]; const v = (perm >> src) & 7; if (sel("u")) bits |= v << 6; if (sel("g")) bits |= v << 3; if (sel("o")) bits |= v; continue; }
          const v = { r: 4, w: 2, x: 1, X: isDir || perm & 0o111 ? 1 : 0, s: 0, t: 0 }[l];
          if (sel("u")) bits |= v << 6; if (sel("g")) bits |= v << 3; if (sel("o")) bits |= v;
          if (l === "s") { if (sel("u")) bits |= 0o4000; if (sel("g")) bits |= 0o2000; }
          if (l === "t" && (sel("o") || !m[1])) bits |= 0o1000;
        }
        let mask = 0;
        if (sel("u")) mask |= 0o4700; if (sel("g")) mask |= 0o2070; if (sel("o")) mask |= 0o1007;
        if (op === "+") perm |= bits;
        else if (op === "-") perm &= ~bits;
        else perm = (perm & ~mask) | bits | (isDir && !letters.includes("s") ? perm & mask & 0o2000 & (sel("g") ? 0 : 0o7777) : 0);
      }
    }
    return perm;
  }
  C.chmod = function (args) {
    const f = new Set(), rest = [];
    for (const a of args) { if (/^-[Rvcf]+$/.test(a)) for (const ch of a.slice(1)) f.add(ch); else if (a === "--recursive") f.add("R"); else rest.push(a); }
    const [spec, ...files] = rest;
    if (!spec || !files.length) return { stderr: spec ? `chmod: missing operand after '${spec}'\nTry 'chmod --help' for more information.` : "chmod: missing operand\nTry 'chmod --help' for more information.", status: 1 };
    const out = [], err = [];
    const me = actor(this);
    const one = (path, node) => {
      if (me !== "root" && node.owner !== me) { err.push(`chmod: changing permissions of '${path}': Operation not permitted`); return; }
      const before = permOf(node);
      let p;
      if (/^[0-7]{1,4}$/.test(spec)) {
        p = parseInt(spec, 8);
        if (node.type === "dir" && spec.length < 4) p |= before & 0o6000; // GNU keeps a directory's SUID/SGID with short octal modes
      } else { p = applySymbolic(before & 0o7777, spec, node.type === "dir"); if (p === null) { err.push(`chmod: invalid mode: '${spec}'\nTry 'chmod --help' for more information.`); return "stop"; } }
      node.perm = p; node.ctime = Date.now();
      if (f.has("v") || (f.has("c") && p !== before)) out.push(p === before ? `mode of '${path}' retained as ${p.toString(8).padStart(4, "0")} (${modeString(node).slice(1)})` : `mode of '${path}' changed from ${before.toString(8).padStart(4, "0")} (${modeString({ ...node, perm: before }).slice(1)}) to ${p.toString(8).padStart(4, "0")} (${modeString(node).slice(1)})`);
    };
    for (const file of files) {
      const abs = this.abs(file), node = this.vfs.get(abs);
      if (!node) { err.push(`chmod: cannot access '${file}': No such file or directory`); continue; }
      if (!this.vfs.canTraverse(abs)) { err.push(`chmod: cannot access '${file}': Permission denied`); continue; }
      if (one(file, node) === "stop") break;
      if (f.has("R") && node.type === "dir") {
        const walk = (p, n) => Object.keys(n.children).sort().forEach((k) => { const c = n.children[k]; if (c.type === "link") return; one(p + "/" + k, c); if (c.type === "dir") walk(p + "/" + k, c); });
        walk(file.replace(/\/$/, ""), node);
      }
    }
    return { stdout: joinLines(out), stderr: err.join("\n"), status: err.length ? 1 : 0 };
  };

  /* ------------------------------------------------------------- chown / chgrp */
  function changeOwner(cmd, args) {
    const f = new Set(), rest = [];
    for (const a of args) { if (/^-[Rvch]+$/.test(a)) for (const ch of a.slice(1)) f.add(ch); else rest.push(a); }
    const [spec, ...files] = rest;
    if (!spec || !files.length) return { stderr: `${cmd}: missing operand\nTry '${cmd} --help' for more information.`, status: 1 };
    let user = null, group = null;
    if (cmd === "chgrp") group = spec;
    else {
      const m = spec.match(/^([^:.]*)(?:[:.](.*))?$/);
      user = m[1] || null;
      group = m[2] === undefined ? null : m[2] === "" ? (user === LOGIN ? LOGIN : USERS[user]?.group || user) : m[2];
    }
    if (user && uidOf(user) === null) return { stderr: `chown: invalid user: '${spec}'`, status: 1 };
    if (group && gidOf(group) === null) return { stderr: `${cmd}: invalid group: '${spec}'`, status: 1 };
    const me = actor(this), err = [], out = [];
    const one = (path, node) => {
      if (me !== "root") {
        if ((user && user !== node.owner) || node.owner !== me) { err.push(`${cmd}: changing ${user && user !== node.owner ? "ownership" : "group"} of '${path}': Operation not permitted`); return; }
        if (group && !LPIC.groupsOf(me).includes(group)) { err.push(`${cmd}: changing group of '${path}': Operation not permitted`); return; }
      }
      const before = `${node.owner}:${node.group}`;
      if (user) node.owner = user;
      if (group) node.group = group;
      if (node.type !== "dir") node.perm &= ~0o6000 | (me === "root" ? 0 : 0); // changing owner clears SUID/SGID on files
      node.ctime = Date.now();
      if (f.has("v")) out.push(before === `${node.owner}:${node.group}` ? `ownership of '${path}' retained as ${node.owner}:${node.group}` : `changed ownership of '${path}' from ${before} to ${node.owner}:${node.group}`);
    };
    for (const file of files) {
      const abs = this.abs(file), node = f.has("h") ? this.vfs.lget(abs) : this.vfs.get(abs);
      if (!node) { err.push(`${cmd}: cannot access '${file}': No such file or directory`); continue; }
      one(file, node);
      if (f.has("R") && node.type === "dir") {
        const walk = (p, n) => Object.keys(n.children).sort().forEach((k) => { const c = n.children[k]; one(p + "/" + k, c); if (c.type === "dir") walk(p + "/" + k, c); });
        walk(file.replace(/\/$/, ""), node);
      }
    }
    return { stdout: joinLines(out), stderr: err.join("\n"), status: err.length ? 1 : 0 };
  }
  C.chown = function (args) { return changeOwner.call(this, "chown", args); };
  C.chgrp = function (args) { return changeOwner.call(this, "chgrp", args); };

  /* ------------------------------------------------------------- mkfifo, ln */
  C.mkfifo = function (args) {
    const err = [];
    for (const a of args.filter((x) => !x.startsWith("-"))) {
      const abs = this.abs(a);
      if (this.vfs.lget(abs)) { err.push(`mkfifo: cannot create fifo '${a}': File exists`); continue; }
      try { const n = this.vfs.write(abs, ""); n.type = "fifo"; delete n.content; } catch (e) { err.push(`mkfifo: cannot create fifo '${a}': ${e.message}`); }
    }
    return { stderr: err.join("\n"), status: err.length ? 1 : 0 };
  };
  const fsOf = (sh, abs) => (abs.startsWith("/dev/shm") ? "tmpfs" : abs.startsWith("/proc") ? "proc" : "root");
  C.ln = function (args) {
    const f = new Set(), rest = [];
    for (const a of args) { if (/^-[sfnvTr]+$/.test(a)) for (const ch of a.slice(1)) f.add(ch); else if (a === "--symbolic") f.add("s"); else if (a === "--force") f.add("f"); else rest.push(a); }
    if (!rest.length) return { stderr: "ln: missing file operand\nTry 'ln --help' for more information.", status: 1 };
    if (rest.length === 1) rest.push(rest[0].split("/").filter(Boolean).pop());
    const dest = rest.pop();
    const out = [], err = [];
    for (const target of rest) {
      let dAbs = this.abs(dest);
      let dNode = f.has("n") ? this.vfs.lget(dAbs) : this.vfs.get(dAbs);
      if (dNode && dNode.type === "dir" && rest.length >= 1 && !(f.has("n") && this.vfs.lget(dAbs)?.type === "link")) { dAbs = dAbs + "/" + target.split("/").filter(Boolean).pop(); dNode = this.vfs.lget(dAbs); }
      const shownDest = dAbs === this.abs(dest) ? dest : dest.replace(/\/$/, "") + "/" + target.split("/").filter(Boolean).pop();
      const existing = this.vfs.lget(dAbs);
      if (existing) {
        if (!f.has("f")) { err.push(`ln: failed to create ${f.has("s") ? "symbolic" : "hard"} link '${shownDest}': File exists`); continue; }
        if (existing.type === "dir") { err.push(`ln: '${shownDest}': cannot overwrite directory`); continue; }
        this.vfs.remove(dAbs);
      }
      const { dir, name, dirPath } = this.vfs.parentOf(dAbs);
      if (!dir) { err.push(`ln: failed to create ${f.has("s") ? "symbolic" : "hard"} link '${shownDest}': No such file or directory`); continue; }
      if (actor(this) !== "root" && (!this.vfs.can(dir, "w") || !this.vfs.can(dir, "x"))) { err.push(`ln: failed to create ${f.has("s") ? "symbolic" : "hard"} link '${shownDest}': Permission denied`); continue; }
      if (f.has("s")) {
        dir.children[name] = { type: "link", target, ...this.vfs.meta("link", dAbs, dir), perm: 0o777 };
        if (f.has("v")) out.push(`'${shownDest}' -> '${target}'`);
        continue;
      }
      const src = this.vfs.get(this.abs(target));
      if (!src) { err.push(`ln: failed to access '${target}': No such file or directory`); continue; }
      if (src.type === "dir") { err.push(`ln: ${target}: hard link not allowed for directory`); continue; }
      if (fsOf(this, this.vfs.realpath(this.abs(target))) !== fsOf(this, dirPath + "/")) { err.push(`ln: failed to create hard link '${shownDest}' => '${target}': Invalid cross-device link`); continue; }
      src.nlink = (src.nlink || 1) + 1;
      dir.children[name] = src;
      src.ctime = Date.now();
      if (f.has("v")) out.push(`'${shownDest}' => '${target}'`);
    }
    return { stdout: joinLines(out), stderr: err.join("\n"), status: err.length ? 1 : 0 };
  };

  /* ------------------------------------------------------------- find: permission, owner and link tests */
  const baseFind = C.find;
  C.find = function (args, stdin, res) {
    // Handle the tests the base find doesn't know by rewriting them into -samefile-style checks it can call back.
    const extra = [];
    const keep = [];
    let printf = null;
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (["-perm", "-user", "-group", "-samefile", "-xtype", "-links", "-printf", "-uid"].includes(a)) { extra.push([a, args[i + 1]]); if (a === "-printf") printf = args[i + 1]; else keep.push("-path", "*"); i++; continue; }
      if (a === "-type" && /^[lpsbc]$/.test(args[i + 1])) { extra.push(["-type", args[i + 1]]); keep.push("-path", "*"); i++; continue; }
      keep.push(a);
    }
    if (!extra.length) return baseFind.call(this, args, stdin, res);
    const shell = this;
    const tests = extra.filter(([a]) => a !== "-printf").map(([a, v]) => {
      if (a === "-perm") {
        const any = v.startsWith("/"), all = v.startsWith("-");
        const want = /^[-/]?[0-7]+$/.test(v) ? parseInt(v.replace(/^[-/]/, ""), 8) : applySymbolic(0, v.replace(/^[-/]/, ""), false);
        return (n) => { const p = permOf(n) & 0o7777; return any ? (p & want) !== 0 || want === 0 : all ? (p & want) === want : p === want; };
      }
      if (a === "-user" || a === "-uid") return (n) => (n.owner || LOGIN) === v || String(uidOf(n.owner || LOGIN)) === v;
      if (a === "-group") return (n) => (n.group || LOGIN) === v;
      if (a === "-links") { const m = v.match(/^([+-]?)(\d+)$/); return (n) => { const l = linksOf(n); return m[1] === "+" ? l > +m[2] : m[1] === "-" ? l < +m[2] : l === +m[2]; }; }
      if (a === "-samefile") { const ref = shell.vfs.get(shell.abs(v)); return (n) => n === ref; }
      if (a === "-xtype") return (n, abs) => (v === "l" ? n.type === "link" && !shell.vfs.get(abs) : (shell.vfs.get(abs) || n).type === { f: "file", d: "dir", p: "fifo", s: "sock", b: "blk", c: "chr" }[v]);
      if (a === "-type") return (n) => n.type === { l: "link", p: "fifo", s: "sock", b: "blk", c: "chr" }[v];
      return () => true;
    });
    // Run the base find for the names it selects, then filter on the extra tests using lstat nodes.
    const sub = baseFind.call(this, keep.filter((x, i) => !(x === "-print")), stdin, res);
    const lines = (sub.stdout || "").split("\n").filter(Boolean);
    const out = [];
    for (const p of lines) {
      const abs = this.abs(p), n = this.vfs.lget(abs);
      if (!n || !tests.every((t) => t(n, abs))) continue;
      if (printf) {
        out.push(printf.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/%([mMugUGpfhisyn])/g, (m, k) => ({ m: (permOf(n) & 0o7777).toString(8), M: modeString(n), u: n.owner || LOGIN, g: n.group || LOGIN, U: uidOf(n.owner || LOGIN), G: gidOf(n.group || LOGIN), p, f: p.split("/").pop(), h: p.split("/").slice(0, -1).join("/") || ".", i: inodeOf(n), s: n.type === "dir" ? 4096 : (n.content || "").length, y: TYPE_CHAR[n.type] === "-" ? "f" : TYPE_CHAR[n.type], n: linksOf(n) }[k])).replace(/\n$/, ""));
      } else out.push(p);
    }
    return { stdout: printf ? out.join("\n") + (out.length && /\\n$/.test(printf) ? "\n" : "") : joinLines(out), stderr: sub.stderr, status: sub.status };
  };
})();
