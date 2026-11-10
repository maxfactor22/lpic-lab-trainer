/* Searching commands for the practice terminal (Section 6 and later): a full grep
   (-E -F -f -e -i -v -c -n -l -L -h -H -r -w -o -q -s), find, locate/updatedb, whereis,
   and test / [ ]. Loads after commands-text.js and replaces its grep. */
(function () {
  "use strict";
  const LPIC = window.LPIC;
  const { EXTERNAL } = LPIC.shellUtil;
  const C = LPIC.Shell.commands;
  const toJs = LPIC.toJsRegex;
  ["find", "locate", "updatedb", "whereis", "test"].forEach((c) => (EXTERNAL[c] = c === "updatedb" ? "/usr/bin/updatedb" : "/usr/bin/" + c));
  const joinLines = (lines) => (lines.length ? lines.join("\n") + "\n" : "");

  /* ------------------------------------------------------------- grep */
  function grep(args, stdin, mode) {
    const f = new Set();
    const patterns = [];
    const files = [];
    let i = 0, endOpts = false;
    for (; i < args.length; i++) {
      const a = args[i];
      if (endOpts || !a.startsWith("-") || a === "-") { files.push(a); continue; }
      if (a === "--") { endOpts = true; continue; }
      if (a.startsWith("--color")) continue;
      if (a === "-e") { patterns.push(args[++i]); continue; }
      if (a === "-f") {
        const p = args[++i];
        const n = this.vfs.get(this.abs(p));
        if (!n || n.type !== "file") return { stderr: `grep: ${p}: No such file or directory`, status: 2 };
        patterns.push(...n.content.split("\n").filter((l, k, arr) => !(l === "" && k === arr.length - 1)));
        continue;
      }
      if (a.startsWith("--")) {
        const map = { "--ignore-case": "i", "--invert-match": "v", "--count": "c", "--line-number": "n", "--files-with-matches": "l", "--recursive": "r", "--word-regexp": "w", "--only-matching": "o", "--quiet": "q", "--extended-regexp": "E", "--fixed-strings": "F" };
        if (map[a]) { f.add(map[a]); continue; }
        return { stderr: `grep: option ${a} isn't part of these lessons`, status: 2 };
      }
      for (let k = 1; k < a.length; k++) {
        const ch = a[k];
        if (ch === "e" || ch === "f") {
          const val = a.slice(k + 1) || args[++i];
          if (ch === "e") patterns.push(val);
          else { const n = this.vfs.get(this.abs(val)); if (!n) return { stderr: `grep: ${val}: No such file or directory`, status: 2 }; patterns.push(...n.content.split("\n").filter(Boolean)); }
          break;
        }
        if (ch === "A" || ch === "B" || ch === "C" || ch === "m") { i++; break; }
        f.add(ch);
      }
    }
    if (mode) f.add(mode);
    if (!patterns.length) {
      if (!files.length) return { stderr: "Usage: grep [OPTION]... PATTERNS [FILE]...\nTry 'grep --help' for more information.", status: 2 };
      patterns.push(files.shift());
    }
    const flags = f.has("i") ? "i" : "";
    let res;
    try {
      res = patterns.map((p) => {
        let src = f.has("F") ? p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : toJs(p, f.has("E"));
        if (f.has("w")) src = `(?<![\\w])(?:${src})(?![\\w])`;
        if (f.has("x")) src = `^(?:${src})$`;
        return new RegExp(src, flags);
      });
    } catch { return { stderr: "grep: Invalid regular expression", status: 2 }; }
    const test = (line) => res.some((re) => re.test(line));
    // Collect sources, expanding -r directories.
    const sources = [];
    const err = [];
    const addFile = (name, abs) => {
      const n = this.vfs.get(abs);
      if (!n) { if (!f.has("s")) err.push(`grep: ${name}: No such file or directory`); return; }
      if (n.type === "dir") {
        if (!f.has("r") && !f.has("R")) { if (!f.has("s")) err.push(`grep: ${name}: Is a directory`); return; }
        Object.keys(n.children).sort().forEach((c) => addFile(name.replace(/\/$/, "") + "/" + c, abs + "/" + c));
        return;
      }
      sources.push({ name, text: n.content });
    };
    const defaulted = !files.length && (f.has("r") || f.has("R"));
    if (defaulted) files.push(".");
    if (!files.length) sources.push({ name: "(standard input)", text: stdin });
    else files.forEach((p) => (p === "-" ? sources.push({ name: "(standard input)", text: stdin }) : addFile(p, this.abs(p))));
    const showName = (files.length > 1 || sources.length > 1 || f.has("r") || f.has("R") || f.has("H")) && !f.has("h");
    const out = [];
    let total = 0;
    for (const s of sources) {
      const lines = s.text === "" ? [] : s.text.replace(/\n$/, "").split("\n");
      let c = 0;
      lines.forEach((l, idx) => {
        const hit = test(l) !== f.has("v");
        if (!hit) return;
        c++;
        if (f.has("c") || f.has("l") || f.has("L") || f.has("q")) return;
        const prefix = (showName ? (defaulted ? s.name.replace(/^\.\//, "") : s.name) + ":" : "") + (f.has("n") ? idx + 1 + ":" : "");
        if (f.has("o") && !f.has("v")) res.forEach((re) => (l.match(new RegExp(re.source, "g" + re.flags)) || []).forEach((m) => out.push(prefix + m)));
        else out.push(prefix + l);
      });
      if (f.has("c")) out.push((showName ? (defaulted ? s.name.replace(/^\.\//, "") : s.name) + ":" : "") + c);
      if (f.has("l") && c) out.push((defaulted ? s.name.replace(/^\.\//, "") : s.name));
      if (f.has("L") && !c) out.push((defaulted ? s.name.replace(/^\.\//, "") : s.name));
      total += c;
    }
    if (f.has("q")) return { status: total ? 0 : 1 };
    return { stdout: joinLines(out), stderr: err.join("\n"), status: err.length && !total ? 2 : total ? 0 : 1 };
  }
  C.grep = function (args, stdin) { return grep.call(this, args, stdin); };
  C.egrep = function (args, stdin) { return grep.call(this, args, stdin, "E"); };
  C.fgrep = function (args, stdin) { return grep.call(this, args, stdin, "F"); };

  /* ------------------------------------------------------------- find */
  const globRe = (g, i) => new RegExp("^" + g.replace(/[.+^${}()|\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".").replace(/\[(!|\\\^)/g, "[^") + "$", i ? "i" : "");
  const sizeOf = (n) => (n.type === "dir" ? 4096 : new TextEncoder().encode(n.content || "").length);
  C.find = function (args, stdin, res) {
    const starts = [];
    let i = 0;
    while (i < args.length && !/^[-!(]/.test(args[i])) starts.push(args[i++]);
    if (!starts.length) starts.push(".");
    const expr = args.slice(i);
    let maxdepth = Infinity, mindepth = 0;
    // Parse the expression into a tree: or-of-ands of tests, with ! and -not.
    let p = 0;
    const err = [];
    const actions = [];
    const parsePrimary = () => {
      const a = expr[p++];
      if (a === "!" || a === "-not") { const t = parsePrimary(); return (n) => !t(n); }
      if (a === "(") { const t = parseOr(); if (expr[p] === ")") p++; return t; }
      const val = () => { const v = expr[p++]; if (v === undefined) throw new Error(`missing argument to \`${a}'`); return v; };
      const num = (v) => { const m = String(v).match(/^([+-]?)(\d+)$/); if (!m) throw new Error(`invalid argument \`${v}' to \`${a}'`); return [m[1], +m[2]]; };
      const cmpN = ([sign, n], x) => (sign === "+" ? x > n : sign === "-" ? x < n : x === n);
      switch (a) {
        case "-name": { const re = globRe(val(), false); return (n) => re.test(n.name); }
        case "-iname": { const re = globRe(val(), true); return (n) => re.test(n.name); }
        case "-path": case "-wholename": { const re = globRe(val(), false); return (n) => re.test(n.path); }
        case "-regex": { const re = new RegExp("^(?:" + toJs(val(), false) + ")$"); return (n) => re.test(n.path); }
        case "-type": { const t = val(); return (n) => (t === "f" ? n.node.type === "file" : t === "d" ? n.node.type === "dir" : t === "l" ? n.node.type === "link" : false); }
        case "-empty": return (n) => (n.node.type === "dir" ? !Object.keys(n.node.children).length : !(n.node.content || "").length);
        case "-size": {
          const v = val(); const m = v.match(/^([+-]?)(\d+)([ckMGb]?)$/);
          if (!m) throw new Error(`invalid -size type in \`${v}'`);
          const unit = { c: 1, k: 1024, M: 1048576, G: 1073741824, b: 512, "": 512 }[m[3]];
          return (n) => { const units = Math.ceil(sizeOf(n.node) / unit); return cmpN([m[1], +m[2]], units); };
        }
        case "-mtime": { const v = num(val()); return (n) => cmpN(v, Math.floor((Date.now() - n.node.mtime) / 864e5)); }
        case "-mmin": { const v = num(val()); return (n) => cmpN(v, Math.ceil((Date.now() - n.node.mtime) / 6e4)); }
        case "-newer": { const ref = this.vfs.get(this.abs(val())); return (n) => !!ref && n.node.mtime > ref.mtime; }
        case "-maxdepth": maxdepth = +val(); return () => true;
        case "-mindepth": mindepth = +val(); return () => true;
        case "-user": { const u = val(); return () => u === this.user; }
        case "-perm": { val(); return () => true; }
        case "-print": actions.push("print"); return (n) => { n.print = true; return true; };
        case "-ls": actions.push("ls"); return (n) => { n.ls = true; return true; };
        case "-delete": actions.push("delete"); return (n) => { n.del = true; return true; };
        case "-exec": case "-ok": {
          const cmd = [];
          while (p < expr.length && expr[p] !== ";" && expr[p] !== "+") cmd.push(expr[p++]);
          const term = expr[p++];
          if (term === undefined) throw new Error(`missing argument to \`${a}'`);
          actions.push("exec");
          return (n) => { (n.execs = n.execs || []).push({ cmd, batch: term === "+" }); return true; };
        }
        default: throw new Error(`unknown predicate \`${a}'`);
      }
    };
    const parseAnd = () => {
      let t = parsePrimary();
      while (p < expr.length && expr[p] !== "-o" && expr[p] !== "-or" && expr[p] !== ")") {
        if (expr[p] === "-a" || expr[p] === "-and") p++;
        const left = t, right = parsePrimary();
        t = (n) => left(n) && right(n);
      }
      return t;
    };
    const parseOr = () => {
      let t = parseAnd();
      while (expr[p] === "-o" || expr[p] === "-or") { p++; const left = t, right = parseAnd(); t = (n) => left(n) || right(n); }
      return t;
    };
    let match;
    try { match = expr.length ? parseOr() : () => true; }
    catch (e) { return { stderr: "find: " + e.message, status: 1 }; }
    const out = [];
    const batches = new Map();
    const toDelete = [];
    const walk = (path, abs, node, depth) => {
      const name = depth === 0 ? path : path.split("/").pop();
      const item = { path, abs, node, name: depth === 0 ? (abs.split("/").pop() || "/") : name };
      if (depth >= mindepth && depth <= maxdepth && match(item)) {
        if (!actions.length || item.print) out.push(path);
        if (item.ls) out.push(`${node.type === "dir" ? "drwxr-xr-x" : "-rw-r--r--"}   1 ${this.user} ${this.user} ${String(sizeOf(node)).padStart(8)} ${path}`);
        if (item.del) toDelete.push({ abs, path });
        for (const e of item.execs || []) {
          if (e.batch) { const k = e.cmd.join("\u0000"); if (!batches.has(k)) batches.set(k, { cmd: e.cmd, items: [] }); batches.get(k).items.push(path); }
          else {
            const argv = e.cmd.map((w) => w.split("{}").join(path));
            const r = this.exec(argv, "", res);
            if (r.stdout) out.push(r.stdout.replace(/\n$/, ""));
            if (r.stderr) err.push(r.stderr.replace(/\n$/, ""));
          }
        }
      }
      if (node.type === "dir" && depth < maxdepth) {
        Object.keys(node.children).sort().forEach((c) => walk((path === "/" ? "" : path.replace(/\/$/, "")) + "/" + c, abs === "/" ? "/" + c : abs + "/" + c, node.children[c], depth + 1));
      }
    };
    for (const s of starts) {
      const abs = this.abs(s);
      const node = this.vfs.get(abs);
      if (!node) { err.push(`find: '${s}': No such file or directory`); continue; }
      walk(s, abs, node, 0);
    }
    for (const b of batches.values()) {
      const argv = []; b.cmd.forEach((w) => (w === "{}" ? argv.push(...b.items) : argv.push(w)));
      const r = this.exec(argv, "", res);
      if (r.stdout) out.push(r.stdout.replace(/\n$/, ""));
      if (r.stderr) err.push(r.stderr.replace(/\n$/, ""));
    }
    toDelete.reverse().forEach((d) => {
      const n = this.vfs.get(d.abs);
      if (n && n.type === "dir" && Object.keys(n.children).length) err.push(`find: cannot delete '${d.path}': Directory not empty`);
      else this.vfs.remove(d.abs);
    });
    return { stdout: joinLines(out), stderr: err.join("\n"), status: err.length ? 1 : 0 };
  };

  /* ------------------------------------------------------------- locate / updatedb */
  function snapshot(shell) {
    const paths = [];
    const walk = (abs, node) => { paths.push(abs); if (node.type === "dir") Object.keys(node.children).sort().forEach((c) => walk((abs === "/" ? "" : abs) + "/" + c, node.children[c])); };
    walk("/", shell.vfs.root);
    return paths.filter((p) => !p.startsWith("/proc") && !p.startsWith("/tmp/.here"));
  }
  LPIC.locateSnapshot = snapshot;
  C.updatedb = function (args, stdin, res) {
    if (!res.events.some((e) => e.type === "sudo")) return { stderr: "updatedb: can not open a temporary file for `/var/lib/plocate/plocate.db'\n(run it with sudo)", status: 1 };
    this.locateDb = snapshot(this);
    return {};
  };
  C.locate = function (args) {
    if (!this.locateDb) this.locateDb = snapshot(this);
    let ci = false, count = false, basename = false, limit = Infinity;
    const pats = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === "-i") ci = true; else if (a === "-c") count = true; else if (a === "-b") basename = true;
      else if (a === "-n" || a === "-l") limit = +args[++i];
      else pats.push(a);
    }
    if (!pats.length) return { stderr: "locate: no pattern to search for specified", status: 1 };
    const hits = this.locateDb.filter((path) => {
      const subject = basename ? path.split("/").pop() : path;
      return pats.every((pt) => (/[*?[]/.test(pt) ? globRe(pt.includes("/") || basename ? pt : "*" + pt + "*", ci).test(subject) || globRe(pt, ci).test(subject.split("/").pop()) : (ci ? subject.toLowerCase().includes(pt.toLowerCase()) : subject.includes(pt))));
    }).slice(0, limit);
    if (count) return { stdout: hits.length + "\n" };
    return { stdout: joinLines(hits), status: hits.length ? 0 : 1 };
  };

  /* ------------------------------------------------------------- whereis */
  const BUILTIN_ONLY = new Set(["cd", "type", "history", "help", "export", "alias", "source", "unset", "set", "exit", "jobs", "fg", "bg", "umask"]);
  C.whereis = function (args) {
    const o = args.filter((a) => !a.startsWith("-"));
    const onlyB = args.includes("-b"), onlyM = args.includes("-m");
    const out = o.map((n) => {
      const parts = [];
      if (!onlyM && EXTERNAL[n] && !BUILTIN_ONLY.has(n)) parts.push(EXTERNAL[n]);
      if (!onlyB && (EXTERNAL[n] || (this.docs.man || {})[n])) {
        const sec = (this.docs.man || {})[n]?.section || 1;
        if (!BUILTIN_ONLY.has(n) || (this.docs.man || {})[n]) parts.push(`/usr/share/man/man${sec}/${n}.${sec}.gz`);
      }
      return `${n}:${parts.length ? " " + parts.join(" ") : ""}`;
    });
    return { stdout: joinLines(out) };
  };

  /* ------------------------------------------------------------- test / [ ] */
  function evalTest(a) {
    if (a.length === 0) return false;
    if (a[0] === "!") return !evalTest(a.slice(1));
    if (a.length === 1) return a[0] !== "";
    const node = (p) => this.vfs.get(this.abs(p));
    if (a.length === 2) {
      const [op, v] = a;
      switch (op) {
        case "-e": return !!node(v);
        case "-f": return node(v)?.type === "file";
        case "-d": return node(v)?.type === "dir";
        case "-s": { const n = node(v); return !!n && (n.type === "dir" || (n.content || "").length > 0); }
        case "-r": case "-w": return !!node(v);
        case "-x": return !!node(v) && (node(v).type === "dir" || /^\/usr\/s?bin\//.test(this.abs(v)));
        case "-z": return v === "";
        case "-n": return v !== "";
        default: return false;
      }
    }
    const [l, op, r] = a;
    switch (op) {
      case "=": case "==": return l === r;
      case "!=": return l !== r;
      case "-eq": return +l === +r; case "-ne": return +l !== +r;
      case "-lt": return +l < +r; case "-le": return +l <= +r;
      case "-gt": return +l > +r; case "-ge": return +l >= +r;
      case "-nt": return (node(l)?.mtime || 0) > (node(r)?.mtime || 0);
      default: return false;
    }
  }
  C.test = function (args) { return { status: evalTest.call(this, args) ? 0 : 1 }; };
  C["["] = function (args) {
    if (args[args.length - 1] !== "]") return { stderr: "bash: [: missing `]'", status: 2 };
    return { status: evalTest.call(this, args.slice(0, -1)) ? 0 : 1 };
  };

  /* xargs -r (no-run-if-empty) */
  const baseXargs = C.xargs;
  C.xargs = function (args, stdin, res) {
    const r = args.indexOf("-r") >= 0 ? args.indexOf("-r") : args.indexOf("--no-run-if-empty");
    if (r < 0) return baseXargs.call(this, args, stdin, res);
    const rest = args.filter((_, i) => i !== r);
    const fileIdx = rest.indexOf("-a");
    const text = fileIdx >= 0 ? this.vfs.get(this.abs(rest[fileIdx + 1]))?.content ?? "" : stdin;
    if (!text.trim()) return {};
    return baseXargs.call(this, rest, stdin, res);
  };
})();
