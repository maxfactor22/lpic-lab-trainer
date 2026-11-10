/* Compression and archive commands for the practice terminal (Section 8):
   gzip/gunzip/zcat, bzip2/bunzip2/bzcat, xz/unxz/xzcat, tar, cpio, dd, cmp, lsblk, and ls -l/-h.

   How the data is stored: the virtual filesystem holds text, so
   - tar and cpio archives are REAL ustar / newc archives (their headers are ASCII), and
   - gzip/bzip2/xz output is a placeholder of a realistic size whose first bytes point to the
     original data in LPIC.packed. It passes through pipes and redirects like any output, and
     zcat/tar -z/etc. unpack it. Sizes are estimates, not real compressed sizes. */
(function () {
  "use strict";
  const LPIC = window.LPIC;
  const { EXTERNAL, pad } = LPIC.shellUtil;
  const C = LPIC.Shell.commands;
  ["gzip", "gunzip", "zcat", "bzip2", "bunzip2", "bzcat", "xz", "unxz", "xzcat", "tar", "cpio", "dd", "cmp", "lsblk"]
    .forEach((c) => (EXTERNAL[c] = (c === "lsblk" ? "/usr/bin/" : "/usr/bin/") + c));
  const joinLines = (l) => (l.length ? l.join("\n") + "\n" : "");
  const bytes = (s) => s.length; // archive data in this terminal is ASCII, one byte per character

  /* ------------------------------------------------------------- packed (compressed) data */
  LPIC.packed = LPIC.packed || {};
  let seq = 0;
  const FORMATS = {
    gzip: { ext: ".gz", tool: "gzip", head: 20, desc: (p) => `gzip compressed data${p.name ? `, was "${p.name}"` : ""}, last modified: ${new Date(p.mtime).toString().replace(/ GMT.*/, "").replace(/^(\w+ \w+) 0?(\d+) (\d+) ([\d:]+)$/, (m, a, d, y, t) => `${a} ${String(d).padStart(2)} ${t} ${y}`)}, from Unix, original size modulo 2^32 ${bytes(p.data)}` },
    bzip2: { ext: ".bz2", tool: "bzip2", head: 37, desc: () => "bzip2 compressed data, block size = 900k" },
    xz: { ext: ".xz", tool: "xz", head: 60, desc: () => "XZ compressed data, checksum CRC64" },
  };
  function estimate(fmt, data, name) {
    const n = bytes(data);
    if (!n) return FORMATS[fmt].head + (fmt === "gzip" && name ? name.length + 1 : 0);
    const grams = new Set();
    for (let i = 0; i + 3 <= Math.min(n, 200000); i++) grams.add(data.substr(i, 3));
    const sample = Math.min(n, 200000);
    const ratio = Math.min(1.02, Math.max(0.0009, (grams.size * 3.2) / sample));
    let size = Math.ceil(n * ratio) + FORMATS[fmt].head + (fmt === "gzip" && name ? name.length + 1 : 0);
    if (fmt === "xz") size = Math.ceil(size / 4) * 4;
    return size;
  }
  function pack(fmt, data, name, mtime) {
    const id = "P" + (++seq) + Math.random().toString(36).slice(2, 6);
    LPIC.packed[id] = { fmt, data, name, mtime: mtime || Date.now() };
    const size = estimate(fmt, data, name);
    const tag = `\u0001${id}\u0001`;
    let filler = "", x = seq * 7919;
    while (tag.length + filler.length < size) { x = (x * 1103515245 + 12345) & 0x7fffffff; filler += String.fromCharCode(33 + (x % 94)); }
    return (tag + filler).slice(0, Math.max(size, tag.length));
  }
  const unpackInfo = (content) => { const m = /^\u0001(P\w+)\u0001/.exec(content || ""); return m ? LPIC.packed[m[1]] : null; };
  LPIC.unpackInfo = unpackInfo;

  /* ------------------------------------------------------------- tar (ustar) and cpio (newc) */
  const oct = (n, w) => n.toString(8).padStart(w - 1, "0") + "\0";
  function tarHeader(name, size, mtime, type, mode) {
    const f = (s, w) => (s + "\0".repeat(w)).slice(0, w);
    let h = f(name, 100) + oct(mode, 8) + oct(1000, 8) + oct(1000, 8) + oct(size, 12) + oct(Math.floor(mtime / 1000), 12) + "        " + type + f("", 100) +
      "ustar  \0" + f(LPIC.currentUser || "max", 32) + f(LPIC.currentUser || "max", 32) + f("", 8) + f("", 8) + f("", 155) + f("", 12);
    let sum = 0;
    for (let i = 0; i < 512; i++) sum += h.charCodeAt(i);
    return h.slice(0, 148) + sum.toString(8).padStart(6, "0") + "\0 " + h.slice(156);
  }
  function tarBuild(entries) {
    let out = "";
    for (const e of entries) {
      const data = e.type === "5" ? "" : e.content;
      out += tarHeader(e.path, bytes(data), e.mtime, e.type, e.type === "5" ? 0o755 : 0o644) + data + "\0".repeat((512 - (bytes(data) % 512)) % 512);
    }
    out += "\0".repeat(1024);
    return out + "\0".repeat((10240 - (out.length % 10240)) % 10240);
  }
  function tarParse(s) {
    const out = [];
    let i = 0;
    while (i + 512 <= s.length) {
      const h = s.slice(i, i + 512);
      if (!h.replace(/\0/g, "")) break;
      if (h.slice(257, 262) !== "ustar") return null;
      const str = (a, b) => h.slice(a, b).replace(/\0.*$/s, "");
      const size = parseInt(str(124, 136), 8) || 0;
      const e = { path: str(0, 100), type: h[156] === "5" ? "5" : "0", mtime: (parseInt(str(136, 148), 8) || 0) * 1000, mode: parseInt(str(100, 108), 8), owner: str(265, 297), size };
      e.content = s.slice(i + 512, i + 512 + size);
      out.push(e);
      i += 512 + Math.ceil(size / 512) * 512;
    }
    return out;
  }
  const isTar = (s) => (s || "").length >= 512 && s.slice(257, 262) === "ustar";
  function cpioBuild(entries) {
    let out = "", ino = 1000;
    const hx = (n) => n.toString(16).toUpperCase().padStart(8, "0");
    const add = (name, content, mode, mtime) => {
      out += "070701" + hx(ino++) + hx(mode) + hx(1000) + hx(1000) + hx(1) + hx(Math.floor(mtime / 1000)) + hx(bytes(content)) + hx(0) + hx(0) + hx(0) + hx(0) + hx(name.length + 1) + hx(0) + name + "\0";
      out += "\0".repeat((4 - (out.length % 4)) % 4) + content;
      out += "\0".repeat((4 - (out.length % 4)) % 4);
    };
    entries.forEach((e) => add(e.path, e.type === "5" ? "" : e.content, e.type === "5" ? 0o40755 : 0o100644, e.mtime));
    add("TRAILER!!!", "", 0, 0);
    return out + "\0".repeat((512 - (out.length % 512)) % 512);
  }
  function cpioParse(s) {
    const out = [];
    let i = 0;
    while (s.startsWith("070701", i)) {
      const f = (k) => parseInt(s.substr(i + 6 + k * 8, 8), 16);
      const mode = f(1), mtime = f(5) * 1000, size = f(6), nameLen = f(11);
      const name = s.substr(i + 110, nameLen - 1);
      let j = i + 110 + nameLen; j += (4 - (j % 4)) % 4;
      const content = s.substr(j, size);
      j += size; j += (4 - (j % 4)) % 4;
      if (name === "TRAILER!!!") break;
      out.push({ path: name, type: (mode & 0o170000) === 0o40000 ? "5" : "0", mode, mtime, content, size });
      i = j;
    }
    return out;
  }
  const isCpio = (s) => (s || "").startsWith("070701");

  /* Describe archive data for `file`. */
  LPIC.archiveDescribe = (n) => {
    const c = n.content || "";
    const p = unpackInfo(c);
    if (p) return FORMATS[p.fmt].desc(p);
    if (isTar(c)) return "POSIX tar archive (GNU)";
    if (isCpio(c)) return "ASCII cpio archive (SVR4 with no CRC)";
    if (c.length >= 512 && !c.replace(/\0/g, "")) return "data";
    return null;
  };

  /* ------------------------------------------------------------- gzip / bzip2 / xz */
  function compressor(fmt, defaults = {}) {
    const F = FORMATS[fmt], tool = F.tool;
    return function (args, stdin) {
      const o = new Set(Object.keys(defaults).filter((k) => defaults[k]));
      const files = [];
      for (const a of args) {
        if (a === "--keep") o.add("k"); else if (a === "--decompress" || a === "--uncompress") o.add("d"); else if (a === "--stdout" || a === "--to-stdout") o.add("c");
        else if (a === "--force") o.add("f"); else if (a === "--verbose") o.add("v"); else if (a === "--list") o.add("l"); else if (a === "--test") o.add("t");
        else if (/^-[a-zA-Z0-9]+$/.test(a)) for (const ch of a.slice(1)) o.add(ch);
        else files.push(a);
      }
      const decompress = o.has("d"), toStdout = o.has("c"), keep = o.has("k") || toStdout;
      const out = [], err = [];
      let stdoutData = "";
      if (o.has("l")) {
        for (const f of files) {
          const n = this.vfs.get(this.abs(f)); const p = n && unpackInfo(n.content);
          if (!n) { err.push(`${tool}: ${f}: No such file or directory`); continue; }
          if (!p) { err.push(`${tool}: ${f}: not in ${fmt} format`); continue; }
          const c = bytes(n.content), u = bytes(p.data), ratio = u ? (((u - c) / u) * 100).toFixed(1) : "0.0";
          if (fmt === "gzip") out.push(`${String(c).padStart(19)} ${String(u).padStart(19)} ${ratio.padStart(5)}% ${f.replace(/\.gz$/, "")}`);
          else out.push(`    1       1    ${(c + " B").padStart(9)}  ${(u + " B").padStart(10)}  ${(u ? (c / u).toFixed(3) : "---").padStart(5)}  CRC64   ${f}`);
        }
        // The heading only appears when there's at least one file to describe.
        if (out.length) out.unshift(fmt === "gzip" ? "         compressed        uncompressed  ratio uncompressed_name" : "Strms  Blocks   Compressed Uncompressed  Ratio  Check   Filename");
        return { stdout: joinLines(out), stderr: err.join("\n"), status: err.length ? 1 : 0 };
      }
      if (!files.length) {
        // Filter mode: standard input to standard output.
        if (decompress) { const p = unpackInfo(stdin); if (!p || p.fmt !== fmt) return { stderr: `${tool}: stdin: not in ${fmt} format`, status: 1 }; return { stdout: p.data }; }
        return { stdout: pack(fmt, stdin, "", Date.now()) };
      }
      for (const f of files) {
        const abs = this.abs(f), n = this.vfs.get(abs);
        if (!n) { err.push(`${tool}: ${f}: No such file or directory`); continue; }
        if (n.type === "dir") { err.push(`${tool}: ${f} is a directory -- ignored`); continue; }
        if (decompress) {
          if (!toStdout && !f.endsWith(F.ext) && !(fmt === "gzip" && f.endsWith(".tgz"))) { err.push(`${tool}: ${f}: unknown suffix -- ignored`); continue; }
          const p = unpackInfo(n.content);
          if (!p || p.fmt !== fmt) { err.push(fmt === "gzip" ? `gzip: ${f}: not in gzip format` : fmt === "bzip2" ? `bzip2: ${f} is not a bzip2 file.` : `xz: ${f}: File format not recognized`); continue; }
          if (toStdout) { stdoutData += p.data; continue; }
          if (!f.endsWith(F.ext) && !(fmt === "gzip" && f.endsWith(".tgz"))) { err.push(`${tool}: ${f}: unknown suffix -- ignored`); continue; }
          const target = f.endsWith(".tgz") ? f.replace(/\.tgz$/, ".tar") : f.slice(0, -F.ext.length);
          if (this.vfs.get(this.abs(target)) && !o.has("f")) { err.push(`${tool}: ${target} already exists;	not overwritten`); continue; }
          this.vfs.write(this.abs(target), p.data);
          this.vfs.get(this.abs(target)).mtime = p.mtime;
          if (!keep) this.vfs.remove(abs);
          if (o.has("v")) err.push(`${f}:\t${(bytes(p.data) ? (((bytes(p.data) - bytes(n.content)) / bytes(p.data)) * 100).toFixed(1) : "0.0").padStart(5)}% -- ${keep ? "created" : "replaced with"} ${target}`);
          continue;
        }
        if (f.endsWith(F.ext)) { err.push(`${tool}: ${f} already has ${F.ext} suffix -- unchanged`); continue; }
        const packed = pack(fmt, n.content, f.split("/").pop(), n.mtime);
        if (toStdout) { stdoutData += packed; continue; }
        const target = f + F.ext;
        if (this.vfs.get(this.abs(target)) && !o.has("f")) { err.push(`${tool}: ${target} already exists;	not overwritten`); continue; }
        this.vfs.write(this.abs(target), packed);
        this.vfs.get(this.abs(target)).mtime = n.mtime;
        if (!keep) this.vfs.remove(abs);
        if (o.has("v")) {
          const u = bytes(n.content), c = bytes(packed);
          err.push(fmt === "bzip2" ? `  ${f}: ${(u / c).toFixed(3)}:1, ${((8 * c) / Math.max(u, 1)).toFixed(3)} bits/byte, ${(100 * (1 - c / Math.max(u, 1))).toFixed(2)}% saved, ${u} in, ${c} out.`
            : `${f}:\t${(u ? ((u - c) / u) * 100 : 0).toFixed(1).padStart(5)}% -- ${keep ? "created" : "replaced with"} ${target}`);
        }
      }
      return { stdout: stdoutData, stderr: err.join("\n"), status: err.length && !o.has("v") ? 1 : 0 };
    };
  }
  C.gzip = compressor("gzip"); C.gunzip = compressor("gzip", { d: true }); C.zcat = compressor("gzip", { d: true, c: true });
  C.bzip2 = compressor("bzip2"); C.bunzip2 = compressor("bzip2", { d: true }); C.bzcat = compressor("bzip2", { d: true, c: true });
  C.xz = compressor("xz"); C.unxz = compressor("xz", { d: true }); C.xzcat = compressor("xz", { d: true, c: true });

  /* ------------------------------------------------------------- tar */
  function collect(shell, path, entries, err) {
    const abs = shell.abs(path), n = shell.vfs.get(abs);
    if (!n) { err.push(`tar: ${path}: Cannot stat: No such file or directory`); return; }
    let name = path.replace(/^\.\//, "");
    if (name.startsWith("/")) { if (!err.removedSlash) { err.push("tar: Removing leading `/' from member names"); err.removedSlash = true; } name = name.replace(/^\/+/, ""); }
    if (n.type === "dir") {
      entries.push({ path: name.replace(/\/?$/, "/"), type: "5", mtime: n.mtime, content: "" });
      Object.keys(n.children).sort().forEach((k) => collect(shell, path.replace(/\/$/, "") + "/" + k, entries, err));
    } else entries.push({ path: name, type: "0", mtime: n.mtime, content: n.content || "" });
  }
  const tarDate = (ms) => { const d = new Date(ms), p = (x) => String(x).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
  C.tar = function (args, stdin) {
    let mode = null, file = null, verbose = false, comp = null, dirC = null;
    const names = [];
    const takeFlags = (s, rest) => {
      for (let k = 0; k < s.length; k++) {
        const ch = s[k];
        if ("ctxr".includes(ch)) mode = ch;
        else if (ch === "v") verbose = true;
        else if (ch === "z") comp = "gzip"; else if (ch === "j") comp = "bzip2"; else if (ch === "J") comp = "xz";
        else if (ch === "f") { file = s.slice(k + 1) || rest.shift(); return; }
        else if (ch === "C") { dirC = s.slice(k + 1) || rest.shift(); return; }
        else if (ch === "a" || ch === "p" || ch === "k") { /* accepted, no effect here */ }
        else throw new Error(`tar: invalid option -- '${ch}'\nTry 'tar --help' or 'tar --usage' for more information.`);
      }
    };
    const rest = [...args];
    try {
      let first = true;
      while (rest.length) {
        const a = rest.shift();
        if (a === "--create") mode = "c"; else if (a === "--list") mode = "t"; else if (a === "--extract" || a === "--get") mode = "x";
        else if (a === "--gzip") comp = "gzip"; else if (a === "--bzip2") comp = "bzip2"; else if (a === "--xz") comp = "xz"; else if (a === "--verbose") verbose = true;
        else if (a.startsWith("--file=")) file = a.slice(7); else if (a === "--file") file = rest.shift();
        else if (a.startsWith("--directory=")) dirC = a.slice(12); else if (a === "--directory") dirC = rest.shift();
        else if (a.startsWith("-") && a.length > 1) takeFlags(a.slice(1), rest);
        else if (first && /^[ctxrvzjJfC]+$/.test(a) && /[ctxr]/.test(a)) takeFlags(a, rest); // old style: tar cvf x.tar dir
        else names.push(a);
        first = false;
      }
    } catch (e) { return { stderr: e.message, status: 2 }; }
    if (!mode) return { stderr: "tar: You must specify one of the '-Acdtrux', '--delete' or '--test-label' options\nTry 'tar --help' or 'tar --usage' for more information.", status: 2 };
    const err = [], out = [];
    if (mode === "c" || mode === "r") {
      if (!names.length) return { stderr: "tar: Cowardly refusing to create an empty archive\nTry 'tar --help' or 'tar --usage' for more information.", status: 2 };
      const entries = [];
      const base = dirC ? this.abs(dirC) : null;
      const saveCwd = this.cwd;
      if (base) this.cwd = base;
      names.forEach((nm) => collect(this, nm, entries, err));
      this.cwd = saveCwd;
      if (verbose) entries.forEach((e) => out.push(e.path));
      let data = tarBuild(entries);
      if (comp) data = pack(comp, data, "", Date.now());
      if (!file || file === "-") return { stdout: data, stderr: [...err, ...out].join("\n"), status: err.length ? 2 : 0 };
      try { this.vfs.write(this.abs(file), data); } catch { return { stderr: `tar: ${file}: Cannot open: No such file or directory\ntar: Error is not recoverable: exiting now`, status: 2 }; }
      return { stdout: joinLines(out), stderr: err.filter((e) => !e.startsWith("tar: Removing")).length ? err.join("\n") + "\ntar: Exiting with failure status due to previous errors" : err.join("\n"), status: err.filter((e) => !e.startsWith("tar: Removing")).length ? 2 : 0 };
    }
    // t or x: read the archive, undoing any compression automatically (as GNU tar does when reading a file).
    let raw;
    if (!file || file === "-") raw = stdin;
    else { const n = this.vfs.get(this.abs(file)); if (!n) return { stderr: `tar: ${file}: Cannot open: No such file or directory\ntar: Error is not recoverable: exiting now`, status: 2 }; raw = n.content; }
    const p = unpackInfo(raw);
    // A wrong -z/-j/-J makes tar run the wrong decompressor, which complains in its own words.
    const wrongFormat = () => ({ gzip: "gzip: stdin: not in gzip format\ntar: Child returned status 1", bzip2: "bzip2: (stdin) is not a bzip2 file.\ntar: Child returned status 2", xz: "xz: (stdin): File format not recognized\ntar: Child returned status 1" }[comp] + "\ntar: Error is not recoverable: exiting now");
    if (p) { if (comp && comp !== p.fmt) return { stderr: wrongFormat(), status: 2 }; raw = p.data; }
    else if (comp) return { stderr: wrongFormat(), status: 2 };
    const entries = tarParse(raw);
    if (!entries) return { stderr: "tar: This does not look like a tar archive\ntar: Skipping to next header\ntar: Exiting with failure status due to previous errors", status: 2 };
    const wanted = (e) => !names.length || names.some((nm) => e.path === nm || e.path.replace(/\/$/, "") === nm.replace(/\/$/, "") || e.path.startsWith(nm.replace(/\/?$/, "/")));
    for (const e of entries.filter(wanted)) {
      if (mode === "t") {
        if (!verbose) { out.push(e.path); continue; }
        const perm = e.type === "5" ? "drwxr-xr-x" : "-rw-r--r--";
        const ug = `${e.owner || this.user}/${e.owner || this.user}`;
        out.push(`${perm} ${ug} ${String(e.size).padStart(Math.max(1, 19 - ug.length))} ${tarDate(e.mtime)} ${e.path}`);
        continue;
      }
      const destBase = dirC ? this.abs(dirC) : this.cwd;
      if (dirC && !this.vfs.get(destBase)) return { stderr: `tar: ${dirC}: Cannot open: No such file or directory\ntar: Error is not recoverable: exiting now`, status: 2 };
      const target = this.vfs.resolve(e.path, destBase);
      if (e.type === "5") this.vfs.mkdirp(target);
      else { this.vfs.mkdirp(target.replace(/\/[^/]*$/, "")); this.vfs.write(target, e.content); }
      this.vfs.get(target).mtime = e.mtime;
      if (verbose) out.push(e.path);
    }
    if (names.length && !entries.some(wanted)) return { stdout: joinLines(out), stderr: names.map((nm) => `tar: ${nm}: Not found in archive`).join("\n") + "\ntar: Exiting with failure status due to previous errors", status: 2 };
    return { stdout: joinLines(out), stderr: err.join("\n"), status: 0 };
  };

  /* ------------------------------------------------------------- cpio */
  C.cpio = function (args, stdin) {
    let mode = null, verbose = false, makeDirs = false, file = null, list = false;
    const rest = [...args];
    while (rest.length) {
      const a = rest.shift();
      if (a === "--create") mode = "o"; else if (a === "--extract") mode = "i"; else if (a === "--list") { mode = "i"; list = true; }
      else if (a === "-I" || a === "-F") file = rest.shift();
      else if (a.startsWith("-I") || a.startsWith("-F")) file = a.slice(2);
      else if (/^-[a-zA-Z]+$/.test(a)) for (const ch of a.slice(1)) { if (ch === "o") mode = "o"; else if (ch === "i") mode = "i"; else if (ch === "t") { list = true; mode = mode || "i"; } else if (ch === "v") verbose = true; else if (ch === "d") makeDirs = true; else if (ch === "p") return { stderr: "cpio: pass-through mode (-p) isn't part of these lessons", status: 2 }; }
    }
    if (!mode) return { stderr: "cpio: You must specify one of -oipt options.\nTry 'cpio --help' or 'cpio --usage' for more information.", status: 2 };
    if (mode === "o") {
      const entries = [], err = [], out = [];
      for (const name of stdin.split("\n").map((l) => l.trim()).filter(Boolean)) {
        const n = this.vfs.get(this.abs(name));
        if (!n) { err.push(`cpio: ${name}: Cannot stat: No such file or directory`); continue; }
        entries.push({ path: name, type: n.type === "dir" ? "5" : "0", mtime: n.mtime, content: n.type === "dir" ? "" : n.content || "" });
        if (verbose) out.push(name);
      }
      const data = cpioBuild(entries);
      err.push(`${Math.max(1, Math.ceil(data.length / 512))} block${Math.ceil(data.length / 512) === 1 ? "" : "s"}`);
      if (file) { this.vfs.write(this.abs(file), data); return { stderr: [...out, ...err].join("\n") }; }
      return { stdout: data, stderr: [...out, ...err].join("\n") };
    }
    let raw = stdin;
    if (file) { const n = this.vfs.get(this.abs(file)); if (!n) return { stderr: `cpio: ${file}: Cannot open: No such file or directory`, status: 2 }; raw = n.content; }
    const p = unpackInfo(raw); if (p) raw = p.data;
    if (!isCpio(raw)) return { stderr: "cpio: premature end of archive", status: 2 };
    const entries = cpioParse(raw), out = [], err = [];
    for (const e of entries) {
      if (list) {
        if (!verbose) { out.push(e.path); continue; }
        const d = new Date(e.mtime), mon = d.toLocaleString("en-US", { month: "short" });
        out.push(`${e.type === "5" ? "drwxr-xr-x" : "-rw-r--r--"}   1 ${this.user.padEnd(8)} ${this.user.padEnd(8)} ${String(e.size).padStart(8)} ${mon} ${String(d.getDate()).padStart(2)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} ${e.path}`);
        continue;
      }
      const target = this.abs(e.path);
      const parent = target.replace(/\/[^/]*$/, "");
      if (!this.vfs.get(parent)) { if (!makeDirs) { err.push(`cpio: ${e.path}: Cannot open: No such file or directory`); continue; } this.vfs.mkdirp(parent); }
      if (e.type === "5") this.vfs.mkdirp(target);
      else {
        if (this.vfs.get(target) && this.vfs.get(target).mtime >= e.mtime) { err.push(`cpio: ${e.path} not created: newer or same age version exists`); continue; }
        this.vfs.write(target, e.content);
      }
      if (verbose) out.push(e.path);
    }
    err.push(`${Math.max(1, Math.ceil(raw.length / 512))} block${Math.ceil(raw.length / 512) === 1 ? "" : "s"}`);
    return { stdout: joinLines(out), stderr: err.join("\n") };
  };

  /* ------------------------------------------------------------- dd */
  const human = (n) => { const u = ["kB", "MB", "GB"]; let v = n, i = -1; while (v >= 1000 && i < 2) { v /= 1000; i++; } return i < 0 ? `${n} bytes` : `${v.toFixed(1)} ${u[i]}`; };
  const humanI = (n) => { const u = ["KiB", "MiB", "GiB"]; let v = n, i = -1; while (v >= 1024 && i < 2) { v /= 1024; i++; } return i < 0 ? null : `${v.toFixed(1)} ${u[i]}`; };
  const DEVICE = /^\/dev\/(sd[a-z]\d*|vd[a-z]\d*|nvme\d+n\d+(p\d+)?|hd[a-z]\d*|mmcblk\d+(p\d+)?|loop\d+(p\d+)?)$/;
  C.dd = function (args, stdin) {
    const o = {};
    for (const a of args) { const m = a.match(/^(\w+)=(.*)$/); if (!m) return { stderr: `dd: unrecognized operand '${a}'\nTry 'dd --help' for more information.`, status: 1 }; o[m[1]] = m[2]; }
    const num = (v) => { if (v === undefined) return undefined; const m = String(v).match(/^(\d+)([kKMG]?)$/); if (!m) return NaN; return +m[1] * ({ "": 1, k: 1024, K: 1024, M: 1048576, G: 1073741824 }[m[2]]); };
    const bs = num(o.bs) || 512, count = o.count !== undefined ? +o.count : Infinity, skip = +(o.skip || 0), seek = +(o.seek || 0);
    if (Number.isNaN(bs)) return { stderr: `dd: invalid number: '${o.bs}'`, status: 1 };
    for (const k of ["if", "of"]) if (o[k] && DEVICE.test(this.abs(o[k]))) return { stderr: `dd: ${o[k]}: this practice terminal never lets dd touch a disk device.\nPractice with image files, and on a real system check the device with lsblk before running dd.`, status: 1 };
    let src;
    if (!o.if) src = stdin;
    else if (o.if === "/dev/zero") src = "\0".repeat(Math.min(count === Infinity ? 0 : count * bs, 64 * 1048576));
    else if (o.if === "/dev/urandom" || o.if === "/dev/random") { let x = 99991, s = ""; const n = Math.min(count === Infinity ? 0 : count * bs, 16 * 1048576); for (let i = 0; i < n; i++) { x = (x * 1103515245 + 12345) & 0x7fffffff; s += String.fromCharCode(33 + (x % 94)); } src = s; }
    else { const n = this.vfs.get(this.abs(o.if)); if (!n || n.type !== "file") return { stderr: `dd: failed to open '${o.if}': No such file or directory`, status: 1 }; src = n.content || ""; }
    if ((o.if === "/dev/zero" || o.if === "/dev/urandom") && count === Infinity) return { stderr: "dd: reading /dev/zero without count= would never end. Add count= to stop it.", status: 1 };
    const data = src.slice(skip * bs, count === Infinity ? undefined : skip * bs + count * bs);
    const full = Math.floor(data.length / bs), part = data.length % bs ? 1 : 0;
    if (o.of && o.of !== "/dev/null") {
      const abs = this.abs(o.of), existing = this.vfs.get(abs);
      const keep = /notrunc/.test(o.conv || "") && existing ? existing.content : "";
      let base = (seek ? (existing ? existing.content : "").slice(0, seek * bs) : "").padEnd(seek * bs, "\0");
      const merged = base + data + (keep.length > base.length + data.length ? keep.slice(base.length + data.length) : "");
      try { this.vfs.write(abs, merged); } catch { return { stderr: `dd: failed to open '${o.of}': No such file or directory`, status: 1 }; }
    }
    const stdout = o.of ? "" : data;
    if (o.status === "none") return { stdout };
    const secs = Math.max(0.0012, data.length / 4.2e8);
    const rate = data.length / secs;
    const lines = [`${full}+${part} records in`, `${full}+${part} records out`];
    if (o.status !== "noxfer") lines.push(`${data.length} bytes${data.length >= 1000 ? ` (${human(data.length)}${humanI(data.length) ? ", " + humanI(data.length) : ""})` : ""} copied, ${secs.toFixed(5)} s, ${human(Math.round(rate)).replace(" bytes", " B")}/s`);
    if (o.status === "progress" && data.length) lines.unshift(`${data.length} bytes (${human(data.length)}${humanI(data.length) ? ", " + humanI(data.length) : ""}) copied, ${secs.toFixed(5)} s, ${human(Math.round(rate)).replace(" bytes", " B")}/s`);
    return { stdout, stderr: lines.join("\n") };
  };

  /* ------------------------------------------------------------- cmp */
  C.cmp = function (args) {
    const s = args.includes("-s") || args.includes("--silent") || args.includes("--quiet");
    const files = args.filter((a) => !a.startsWith("-") || a === "-");
    if (files.length < 2) return { stderr: `cmp: missing operand after '${files[0] || "cmp"}'\ncmp: Try 'cmp --help' for more information.`, status: 2 };
    const [a, b] = files.map((f) => this.vfs.get(this.abs(f)));
    if (!a) return { stderr: `cmp: ${files[0]}: No such file or directory`, status: 2 };
    if (!b) return { stderr: `cmp: ${files[1]}: No such file or directory`, status: 2 };
    const x = a.content || "", y = b.content || "";
    const n = Math.min(x.length, y.length);
    let line = 1;
    for (let i = 0; i < n; i++) {
      if (x[i] !== y[i]) return s ? { status: 1 } : { stdout: `${files[0]} ${files[1]} differ: byte ${i + 1}, line ${line}\n`, status: 1 };
      if (x[i] === "\n") line++;
    }
    if (x.length !== y.length) {
      const shorter = x.length < y.length ? files[0] : files[1];
      return s ? { status: 1 } : { stderr: `cmp: EOF on ${shorter} after byte ${n}, line ${line - (n && (x.length < y.length ? x : y)[n - 1] === "\n" ? 1 : 0)}`, status: 1 };
    }
    return {};
  };

  /* ------------------------------------------------------------- lsblk (a typical Mint VM) */
  C.lsblk = function (args) {
    const f = args.includes("-f");
    if (f) return { stdout: "NAME   FSTYPE FSVER LABEL UUID                                 FSAVAIL FSUSE% MOUNTPOINTS\nsda                                                                    \n├─sda1 vfat   FAT32       4A1B-2C3D                             505.8M     1% /boot/efi\n└─sda2 ext4   1.0         0b6c7f54-91a2-4e7d-8c33-5a1d2e3f4b5c   18.2G    35% /\nsr0                                                                    \n" };
    return { stdout: "NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS\nsda      8:0    0   30G  0 disk \n├─sda1   8:1    0  512M  0 part /boot/efi\n└─sda2   8:2    0 29.5G  0 part /\nsr0     11:0    1 1024M  0 rom  \n" };
  };
})();
