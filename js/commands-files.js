/* File-management commands for the practice terminal (Section 7 and later):
   cp, mv, rm (with -r -i -v -f), touch, stat and file. Loads after commands-find.js.
   -i prompts use the browser's confirmation box (OK = yes). */
(function () {
  "use strict";
  const LPIC = window.LPIC;
  const { EXTERNAL } = LPIC.shellUtil;
  const C = LPIC.Shell.commands;
  ["stat", "file"].forEach((c) => (EXTERNAL[c] = "/usr/bin/" + c));
  const joinLines = (lines) => (lines.length ? lines.join("\n") + "\n" : "");

  /* Split leading short options (letters only) from operands. Long options are mapped. */
  function parse(args, long = {}) {
    const f = new Set(), rest = [];
    let done = false;
    for (const a of args) {
      if (done || a === "-" || !a.startsWith("-")) { rest.push(a); continue; }
      if (a === "--") { done = true; continue; }
      if (a.startsWith("--")) { if (long[a]) f.add(long[a]); else return { bad: a }; continue; }
      for (const ch of a.slice(1)) f.add(ch);
    }
    return { f, rest };
  }
  const kindOf = (n) => (n.type === "dir" ? "directory" : (n.content || "").length ? "regular file" : "regular empty file");
  const clone = (n) => (n.type === "dir"
    ? { type: "dir", children: Object.fromEntries(Object.entries(n.children).map(([k, v]) => [k, clone(v)])), mtime: Date.now(), mode: n.mode }
    : { type: "file", content: n.content, mtime: Date.now(), mode: n.mode });
  const ask = (q) => window.confirm(q);

  /* ------------------------------------------------------------- cp */
  C.cp = function (args) {
    const p = parse(args, { "--recursive": "r", "--interactive": "i", "--verbose": "v", "--force": "f", "--archive": "a", "--no-clobber": "n" });
    if (p.bad) return { stderr: `cp: option ${p.bad} isn't part of these lessons`, status: 1 };
    const { f, rest } = p;
    const recursive = f.has("r") || f.has("R") || f.has("a");
    if (rest.length < 2) return { stderr: rest.length ? `cp: missing destination file operand after '${rest[0]}'` : "cp: missing file operand", status: 1 };
    const dest = rest.pop();
    const dAbs = this.abs(dest), dNode = this.vfs.get(dAbs);
    if (rest.length > 1 && (!dNode || dNode.type !== "dir")) return { stderr: `cp: target '${dest}' is not a directory`, status: 1 };
    const out = [], err = [];
    for (const src of rest) {
      const sAbs = this.abs(src), n = this.vfs.get(sAbs);
      if (!n) { err.push(`cp: cannot stat '${src}': No such file or directory`); continue; }
      if (n.type === "dir" && !recursive) { err.push(`cp: -r not specified; omitting directory '${src}'`); continue; }
      const intoDir = dNode && dNode.type === "dir";
      const tAbs = intoDir ? dAbs + "/" + sAbs.split("/").pop() : dAbs;
      const tShown = intoDir ? dest.replace(/\/$/, "") + "/" + sAbs.split("/").pop() : dest;
      if (tAbs === sAbs || tAbs.startsWith(sAbs + "/")) { err.push(`cp: cannot copy a directory, '${src}', into itself, '${tShown}'`); continue; }
      const existing = this.vfs.get(tAbs);
      if (existing && n.type === "file" && existing.type === "dir") { err.push(`cp: cannot overwrite directory '${tShown}' with non-directory`); continue; }
      if (existing && existing.type === "file" && f.has("n")) continue;
      if (existing && existing.type === "file" && f.has("i") && !f.has("f")) {
        const yes = ask(`cp: overwrite '${tShown}'?`);
        out.push(`cp: overwrite '${tShown}'? ${yes ? "y" : "n"}`);
        if (!yes) continue;
      }
      const { dir, name } = this.vfs.parentOf(tAbs);
      if (!dir) { err.push(`cp: cannot create regular file '${tShown}': No such file or directory`); continue; }
      if (n.type === "dir" && existing && existing.type === "dir") {
        // Copying a directory onto an existing one merges into it (target/name already resolved above).
        Object.entries(n.children).forEach(([k, v]) => (existing.children[k] = clone(v)));
      } else dir.children[name] = clone(n);
      if (f.has("v")) out.push(`'${src}' -> '${tShown}'`);
    }
    return { stdout: joinLines(out), stderr: err.join("\n"), status: err.length ? 1 : 0 };
  };

  /* ------------------------------------------------------------- mv */
  C.mv = function (args) {
    const p = parse(args, { "--interactive": "i", "--verbose": "v", "--force": "f", "--no-clobber": "n" });
    if (p.bad) return { stderr: `mv: option ${p.bad} isn't part of these lessons`, status: 1 };
    const { f, rest } = p;
    if (f.has("r") || f.has("R")) return { stderr: "mv: invalid option -- 'r'\nTry 'mv --help' for more information.\n(mv moves directories without -r; only cp needs it.)", status: 1 };
    if (rest.length < 2) return { stderr: rest.length ? `mv: missing destination file operand after '${rest[0]}'` : "mv: missing file operand", status: 1 };
    const dest = rest.pop();
    const dAbs = this.abs(dest), dNode = this.vfs.get(dAbs);
    if (rest.length > 1 && (!dNode || dNode.type !== "dir")) return { stderr: `mv: target '${dest}' is not a directory`, status: 1 };
    const out = [], err = [];
    for (const src of rest) {
      const sAbs = this.abs(src), n = this.vfs.get(sAbs);
      if (!n) { err.push(`mv: cannot stat '${src}': No such file or directory`); continue; }
      const intoDir = dNode && dNode.type === "dir";
      const tAbs = intoDir ? dAbs + "/" + sAbs.split("/").pop() : dAbs;
      const tShown = intoDir ? dest.replace(/\/$/, "") + "/" + sAbs.split("/").pop() : dest;
      if (tAbs === sAbs) continue;
      if (tAbs.startsWith(sAbs + "/")) { err.push(`mv: cannot move '${src}' to a subdirectory of itself, '${tShown}'`); continue; }
      const existing = this.vfs.get(tAbs);
      if (existing && existing.type === "dir" && n.type === "dir" && Object.keys(existing.children).length) { err.push(`mv: cannot move '${src}' to '${tShown}': Directory not empty`); continue; }
      if (existing && f.has("n")) continue;
      if (existing && f.has("i") && !f.has("f")) {
        const yes = ask(`mv: overwrite '${tShown}'?`);
        out.push(`mv: overwrite '${tShown}'? ${yes ? "y" : "n"}`);
        if (!yes) continue;
      }
      const { dir, name } = this.vfs.parentOf(tAbs);
      if (!dir) { err.push(`mv: cannot move '${src}' to '${tShown}': No such file or directory`); continue; }
      this.vfs.remove(sAbs);
      dir.children[name] = n;
      n.ctime = Date.now();
      if (f.has("v")) out.push(`renamed '${src}' -> '${tShown}'`);
    }
    return { stdout: joinLines(out), stderr: err.join("\n"), status: err.length ? 1 : 0 };
  };

  /* ------------------------------------------------------------- rm */
  C.rm = function (args, stdin, res, ctx = {}) {
    const p = parse(args, { "--recursive": "r", "--interactive": "i", "--verbose": "v", "--force": "f", "--dir": "d" });
    if (p.bad) return { stderr: `rm: option ${p.bad} isn't part of these lessons`, status: 1 };
    const { f, rest } = p;
    const recursive = f.has("r") || f.has("R");
    const interactive = f.has("i") && !f.has("f");
    if (!rest.length) return f.has("f") ? {} : { stderr: "rm: missing operand\nTry 'rm --help' for more information.", status: 1 };
    const out = [], err = [];
    if (interactive && ctx.fromXargsStdin) {
      rest.forEach((r) => err.push(`rm: remove ${kindOf(this.vfs.get(this.abs(r)) || { type: "file" })} '${r}'? (no answer: xargs gave rm no keyboard, so nothing was removed. Use xargs -a FILE so rm can ask you.)`));
      return { stderr: err.join("\n"), status: 1 };
    }
    const prompt = (q) => { const yes = ask(q); out.push(`${q} ${yes ? "y" : "n"}`); return yes; };
    const removeTree = (shown, abs, node) => {
      if (node.type === "dir") {
        if (interactive && Object.keys(node.children).length && !prompt(`rm: descend into directory '${shown}'?`)) return false;
        let all = true;
        for (const k of Object.keys(node.children).sort()) if (!removeTree(shown.replace(/\/$/, "") + "/" + k, abs + "/" + k, node.children[k])) all = false;
        if (!all) return false;
        if (interactive && !prompt(`rm: remove directory '${shown}'?`)) return false;
      } else if (interactive && !prompt(`rm: remove ${kindOf(node)} '${shown}'?`)) return false;
      this.vfs.remove(abs);
      if (f.has("v")) out.push(node.type === "dir" ? `removed directory '${shown}'` : `removed '${shown}'`);
      return true;
    };
    for (const r of rest) {
      const abs = this.abs(r), n = this.vfs.get(abs);
      if (!n) { if (!f.has("f")) err.push(`rm: cannot remove '${r}': No such file or directory`); continue; }
      if (n.type === "dir" && !recursive) {
        if (f.has("d") && !Object.keys(n.children).length) { removeTree(r, abs, n); continue; }
        err.push(`rm: cannot remove '${r}': Is a directory`); continue;
      }
      removeTree(r, abs, n);
    }
    return { stdout: joinLines(out), stderr: err.join("\n"), status: err.length ? 1 : 0 };
  };

  /* ------------------------------------------------------------- touch */
  C.touch = function (args) {
    const p = parse(args, { "--no-create": "c" });
    if (p.bad) return { stderr: `touch: option ${p.bad} isn't part of these lessons`, status: 1 };
    const { f, rest } = p;
    if (!rest.length) return { stderr: "touch: missing file operand\nTry 'touch --help' for more information.", status: 1 };
    const err = [];
    const now = Date.now();
    for (const r of rest) {
      const abs = this.abs(r), n = this.vfs.get(abs);
      if (n) {
        if (!f.has("a")) n.mtime = now;
        if (!f.has("m")) n.atime = now;
        n.ctime = now;
        continue;
      }
      if (f.has("c")) continue;
      try { this.vfs.write(abs, ""); Object.assign(this.vfs.get(abs), { mtime: now, atime: now, ctime: now }); }
      catch { err.push(`touch: cannot touch '${r}': No such file or directory`); }
    }
    return { stderr: err.join("\n"), status: err.length ? 1 : 0 };
  };

  /* ------------------------------------------------------------- stat */
  const p2 = (n) => String(n).padStart(2, "0");
  const stamp = (ms) => {
    const d = new Date(ms);
    const off = -d.getTimezoneOffset();
    const tz = (off >= 0 ? "+" : "-") + p2(Math.floor(Math.abs(off) / 60)) + p2(Math.abs(off) % 60);
    const ns = String((ms % 1000) * 1e6 + 123457).padStart(9, "0");
    return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}.${ns} ${tz}`;
  };
  let inodeSeq = 1310700;
  C.stat = function (args) {
    const p = parse(args, {});
    const fmtIdx = args.findIndex((a) => a === "-c" || a.startsWith("--format="));
    let fmt = null, files = p.rest;
    if (fmtIdx >= 0) { fmt = args[fmtIdx] === "-c" ? args[fmtIdx + 1] : args[fmtIdx].split("=").slice(1).join("="); files = args.filter((a, i) => i !== fmtIdx && i !== fmtIdx + 1 && !a.startsWith("-")); }
    if (!files.length) return { stderr: "stat: missing operand\nTry 'stat --help' for more information.", status: 1 };
    const out = [], err = [];
    for (const r of files) {
      const n = this.vfs.get(this.abs(r));
      if (!n) { err.push(`stat: cannot statx '${r}': No such file or directory`); continue; }
      n.inode = n.inode || ++inodeSeq;
      const size = n.type === "dir" ? 4096 : new TextEncoder().encode(n.content || "").length;
      const mode = n.mode || (n.type === "dir" ? "drwxr-xr-x" : "-rw-r--r--");
      const octal = "0" + [1, 4, 7].map((i) => (mode[i] === "r" ? 4 : 0) + (mode[i + 1] === "w" ? 2 : 0) + (/[xs]/.test(mode[i + 2]) ? 1 : 0)).join("");
      const a = n.atime || n.mtime, m = n.mtime, c = n.ctime || n.mtime;
      if (fmt) {
        out.push(fmt.replace(/%([nsyYxXzZaAFiUGh])/g, (x, k) => ({ n: r, s: size, y: stamp(m), Y: Math.floor(m / 1000), x: stamp(a), X: Math.floor(a / 1000), z: stamp(c), Z: Math.floor(c / 1000), a: octal.slice(1), A: mode, F: kindOf(n), i: n.inode, U: this.user, G: this.user, h: n.type === "dir" ? 2 : 1 }[k])));
        continue;
      }
      out.push(
        `  File: ${r}`,
        `  Size: ${String(size).padEnd(10)}\tBlocks: ${String(n.type === "dir" ? 8 : Math.ceil(size / 4096) * 8).padEnd(10)} IO Block: 4096   ${kindOf(n)}`,
        `Device: 8,2\tInode: ${String(n.inode).padEnd(11)} Links: ${n.type === "dir" ? 2 : 1}`,
        `Access: (${octal}/${mode})  Uid: ( 1000/${this.user.padStart(8)})   Gid: ( 1000/${this.user.padStart(8)})`,
        `Access: ${stamp(a)}`, `Modify: ${stamp(m)}`, `Change: ${stamp(c)}`, ` Birth: ${stamp(n.btime || c)}`,
      );
    }
    return { stdout: joinLines(out), stderr: err.join("\n"), status: err.length ? 1 : 0 };
  };

  /* ------------------------------------------------------------- ls
     Long format laid out like GNU ls: link, owner, group and size columns sized to fit,
     -h human sizes (K/M/G, rounded up, one decimal below 10), "total" in 1K blocks,
     and the year instead of the time for files older than about six months. */
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const humanSize = (n) => {
    if (n < 1024) return String(n);
    const u = ["K", "M", "G", "T"];
    let v = n, i = -1;
    while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
    return v < 10 ? (Math.ceil(v * 10) / 10).toFixed(1) + u[i] : Math.ceil(v) + u[i];
  };
  const lsDate = (ms) => {
    const d = new Date(ms);
    const old = Date.now() - ms > 182 * 864e5 || ms - Date.now() > 3600e3;
    return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2)} ${old ? String(d.getFullYear()).padStart(5) : `${p2(d.getHours())}:${p2(d.getMinutes())}`}`;
  };
  const sizeOfNode = (n) => (n.type === "dir" ? 4096 : new TextEncoder().encode(n.content || "").length);
  const blocksOf = (n) => (n.type === "dir" ? 4 : Math.ceil(sizeOfNode(n) / 4096) * 4);
  C.ls = function (args, stdin, res, ctx = {}) {
    const flags = new Set(), targets = [];
    for (const a of args) {
      if (a.startsWith("--color")) continue;
      if (a === "--all") flags.add("a"); else if (a === "--almost-all") flags.add("A"); else if (a === "--human-readable") flags.add("h");
      else if (a === "--recursive") flags.add("R"); else if (a === "--directory") flags.add("d"); else if (a === "--classify") flags.add("F");
      else if (/^-[a-zA-Z1]+$/.test(a)) for (const ch of a.slice(1)) flags.add(ch);
      else targets.push(a);
    }
    const long = flags.has("l"), human = flags.has("h"), all = flags.has("a"), almost = flags.has("A");
    const one = flags.has("1") || ctx.tty === false || this.batch;
    const classify = flags.has("F") || flags.has("p");
    const byTime = flags.has("t"), bySize = flags.has("S"), reverse = flags.has("r"), inode = flags.has("i");
    if (!targets.length) targets.push(".");
    const err = [], out = [];
    const suffix = (n) => (classify && n.type === "dir" ? "/" : flags.has("F") && n.mode && /x/.test(n.mode) && n.type !== "dir" ? "*" : "");
    const longRows = (items) => {
      const rows = items.map(([name, n]) => ({ name: name + suffix(n), mode: n.mode || (n.type === "dir" ? "drwxr-xr-x" : "-rw-r--r--"), links: String(n.type === "dir" ? 2 + Object.values(n.children).filter((c) => c.type === "dir").length : 1),
        size: human ? humanSize(sizeOfNode(n)) : String(sizeOfNode(n)), date: lsDate(n.mtime), ino: String(n.inode || (n.inode = 1310000 + Math.floor(Math.random() * 9000))) }));
      const w = (k) => Math.max(...rows.map((r) => r[k].length));
      const [wl, ws, wi] = [w("links"), w("size"), w("ino")];
      return rows.map((r) => `${inode ? r.ino.padStart(wi) + " " : ""}${r.mode} ${r.links.padStart(wl)} ${this.user} ${this.user} ${r.size.padStart(ws)} ${r.date} ${r.name}`);
    };
    const order = (items) => {
      items.sort((a, b) => (byTime ? b[1].mtime - a[1].mtime : bySize ? sizeOfNode(b[1]) - sizeOfNode(a[1]) : 0) || a[0].replace(/^\./, "").localeCompare(b[0].replace(/^\./, ""), "en"));
      if (reverse) items.reverse();
      return items;
    };
    const short = (items) => (one ? items.map(([nm, n]) => (inode ? (n.inode || "") + " " : "") + nm + suffix(n)) : items.length ? [items.map(([nm, n]) => nm + suffix(n)).join("  ")] : []);
    const fileItems = [], dirs = [];
    for (const t of targets) {
      const n = this.vfs.get(this.abs(t));
      if (!n) { err.push(`ls: cannot access '${t}': No such file or directory`); continue; }
      if (n.type === "file" || flags.has("d")) fileItems.push([t, n]); else dirs.push([t, n]);
    }
    if (fileItems.length) out.push(...(long ? longRows(order(fileItems)) : short(order(fileItems))));
    const multi = targets.length > 1 || flags.has("R");
    const walk = (t, n, first) => {
      if (multi) { if (out.length || !first) out.push(""); out.push(`${t}:`); }
      let items = Object.entries(n.children);
      if (!all && !almost) items = items.filter(([k]) => !k.startsWith("."));
      items = order(items);
      if (all) items.unshift([".", n], ["..", n]);
      if (long) {
        const total = items.reduce((s, [, c]) => s + blocksOf(c), 0);
        out.push(`total ${human ? humanSize(total * 1024) : total}`);
        if (items.length) out.push(...longRows(items));
      } else out.push(...short(items));
      if (flags.has("R")) Object.keys(n.children).sort((a, b) => a.localeCompare(b, "en")).forEach((k) => {
        const c = n.children[k];
        if (c.type === "dir" && (all || almost || !k.startsWith("."))) walk(`${t.replace(/\/$/, "")}/${k}`, c, false);
      });
    };
    dirs.sort((a, b) => a[0].localeCompare(b[0], "en")).forEach(([t, n], i) => walk(t, n, i === 0 && !fileItems.length));
    return { stdout: joinLines(out), stderr: err.join("\n"), status: err.length ? 2 : 0 };
  };

  /* ------------------------------------------------------------- file */
  function describe(n) {
    if (n.type === "dir") return "directory";
    const archive = LPIC.archiveDescribe && LPIC.archiveDescribe(n);
    if (archive) return archive;
    const t = n.content || "";
    if (!t.length) return "empty";
    if (t.startsWith("\x1f\x8b")) return "gzip compressed data";
    if (/^#!\s*\/(usr\/)?bin\/(env )?bash/.test(t)) return "Bourne-Again shell script, ASCII text executable";
    if (/^#!\s*\/(usr\/)?bin\/(env )?sh/.test(t)) return "POSIX shell script, ASCII text executable";
    if (/^#!\s*\/usr\/bin\/(env )?python/.test(t)) return "Python script, ASCII text executable";
    if (/^\s*<!doctype html|^\s*<html|^\s*<h1>/i.test(t)) return "HTML document, ASCII text";
    if (/[\x00-\x08\x0e-\x1f]/.test(t)) return "data";
    const enc = /[^\x00-\x7f]/.test(t) ? "Unicode text, UTF-8 text" : "ASCII text";
    const lines = t.replace(/\n$/, "").split("\n");
    let kind = enc;
    if (lines.length >= 2 && lines.every((l) => l.split(",").length === lines[0].split(",").length) && lines[0].split(",").length > 1) kind = "CSV " + enc;
    let extra = "";
    if (t.includes("\r\n")) extra += ", with CRLF line terminators";
    if (!t.endsWith("\n")) extra += ", with no line terminators";
    if (lines.some((l) => l.length > 1000)) extra = ", with very long lines (" + Math.max(...lines.map((l) => l.length)) + ")" + extra;
    return kind + extra;
  }
  C.file = function (args) {
    const p = parse(args, { "--brief": "b" });
    const files = p.rest || [];
    if (!files.length) return { stderr: "Usage: file [-bchikLlNnprsSvzZ0] [--apple] [--extension] [--mime-encoding]\n            [--mime-type] [-e <testname>] [-F <separator>]  [-f <namefile>]\n            [-m <magicfiles>] [-P <parameter=value>] [--exclude-quiet]\n            <file> ...\n       file -C [-m <magicfiles>]\n       file [--help]", status: 1 };
    const width = Math.max(...files.map((x) => x.length)) + 1;
    const out = files.map((r) => {
      const n = this.vfs.get(this.abs(r));
      const d = n ? describe(n) : `cannot open \`${r}' (No such file or directory)`;
      return p.f.has("b") ? d : `${(r + ":").padEnd(width)} ${d}`;
    });
    return { stdout: joinLines(out) };
  };
})();
