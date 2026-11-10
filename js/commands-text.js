/* Text-processing commands for the practice terminal (Section 4 and later):
   sort, paste, split, cut, tr, sed, od, and BRE/ERE handling for grep and sed.
   Each supports the options the LPIC lessons teach; anything else says so. */
(function () {
  "use strict";
  const LPIC = window.LPIC;
  const { opts, pad, EXTERNAL } = LPIC.shellUtil;
  const C = LPIC.Shell.commands;
  ["paste", "split", "cut", "tr", "sed", "od", "egrep", "fgrep", "tee", "xargs", "diff"].forEach((c) => (EXTERNAL[c] = "/usr/bin/" + c));

  /* Read the named files (or stdin) the way most filters do. */
  function input(shell, files, stdin, cmd) {
    if (!files.length || (files.length === 1 && files[0] === "-")) return { text: stdin };
    let text = "";
    for (const p of files) {
      if (p === "-") { text += stdin; continue; }
      const n = shell.vfs.get(shell.abs(p));
      if (!n) return { err: `${cmd}: ${p}: No such file or directory` };
      if (n.type === "dir") return { err: `${cmd}: ${p}: Is a directory` };
      text += n.content;
    }
    return { text };
  }
  const linesOf = (text) => (text ? text.replace(/\n$/, "").split("\n") : []);
  const joinLines = (lines) => (lines.length ? lines.join("\n") + "\n" : "");

  /* POSIX basic regular expressions (grep, sed) differ from JS: \( \) \{ \} \+ \? \| are
     special and the bare characters are literal. ERE (grep -E, sed -E) is close to JS. */
  function toJsRegex(pattern, extended) {
    let out = "";
    for (let i = 0; i < pattern.length; i++) {
      const c = pattern[i];
      if (c === "\\" && i + 1 < pattern.length) {
        const n = pattern[++i];
        if (n === "<" || n === ">") out += "\\b";
        else if (!extended && "(){}+?|".includes(n)) out += n;
        else out += "\\" + n;
        continue;
      }
      if (c === "[") { // copy a bracket expression, translating POSIX classes
        let j = i + 1;
        if (pattern[j] === "^") j++;
        if (pattern[j] === "]") j++;
        while (j < pattern.length && pattern[j] !== "]") j = pattern[j] === "[" && pattern[j + 1] === ":" ? pattern.indexOf(":]", j) + 2 : j + 1;
        // Backslash is literal inside a POSIX bracket expression, so escape it for JS first,
        // then swap [:class:] names for JS ranges.
        const body = pattern.slice(i, j + 1).replace(/\\/g, "\\\\").replace(/\[:(\w+):\]/g, (m, cls) => CLASSES_RE[cls] || m);
        out += body;
        i = j;
        continue;
      }
      if (!extended && "(){}+?|".includes(c)) { out += "\\" + c; continue; }
      out += c;
    }
    return out;
  }
  const CLASSES_RE = { upper: "A-Z", lower: "a-z", digit: "0-9", alpha: "A-Za-z", alnum: "A-Za-z0-9", space: " \\t\\n\\r\\f\\v", blank: " \\t", punct: "!-\\/:-@\\[-`{-~", xdigit: "0-9A-Fa-f" };
  LPIC.toJsRegex = toJsRegex;

  /* ------------------------------------------------------------- sort */
  C.sort = function (args, stdin) {
    let numeric = false, reverse = false, unique = false, fold = false, sep = null, key = null, human = false;
    const files = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === "-t") { sep = args[++i]; continue; }
      if (a.startsWith("-t") && a.length > 2) { sep = a.slice(2); continue; }
      if (a === "-k") { key = args[++i]; continue; }
      if (a.startsWith("-k") && a.length > 2) { key = a.slice(2); continue; }
      if (a === "--numeric-sort") { numeric = true; continue; }
      if (a === "--reverse") { reverse = true; continue; }
      if (a === "--unique") { unique = true; continue; }
      if (/^-[nrufh]+$/.test(a)) { for (const f of a.slice(1)) { if (f === "n") numeric = true; if (f === "r") reverse = true; if (f === "u") unique = true; if (f === "f") fold = true; if (f === "h") human = true; } continue; }
      if (/^-[nrufh]*k\d/.test(a)) { const m = a.match(/^-([nrufh]*)k(.+)$/); for (const f of m[1]) { if (f === "n") numeric = true; if (f === "r") reverse = true; } key = m[2]; continue; }
      if (a.startsWith("-") && a !== "-") return { stderr: `sort: option ${a} isn't part of these lessons`, status: 2 };
      files.push(a);
    }
    const inp = input(this, files, stdin, "sort");
    if (inp.err) return { stderr: inp.err, status: 2 };
    let lines = linesOf(inp.text);
    let k1 = 1, k2 = null, keyNumeric = numeric, keyReverse = reverse;
    if (key) {
      const m = key.match(/^(\d+)(?:\.\d+)?([a-z]*)(?:,(\d+)(?:\.\d+)?([a-z]*))?$/);
      if (!m) return { stderr: `sort: invalid number at field start: invalid count at start of '${key}'`, status: 2 };
      k1 = +m[1]; k2 = m[3] ? +m[3] : null;
      const mods = (m[2] || "") + (m[4] || "");
      if (mods.includes("n")) keyNumeric = true;
      if (mods.includes("r")) keyReverse = true;
    }
    const fieldsOf = (l) => (sep ? l.split(sep) : l.trim().split(/\s+/));
    const keyOf = (l) => {
      if (!key) return l;
      const f = fieldsOf(l);
      return f.slice(k1 - 1, k2 ? k2 : f.length).join(sep || " ");
    };
    const HUMAN = { K: 1e3, M: 1e6, G: 1e9, T: 1e12 };
    const num = (s) => { const m = String(s).trim().match(/^-?\d+(\.\d+)?([KMGT])?/i); if (!m) return 0; return parseFloat(m[0]) * (human && m[2] ? HUMAN[m[2].toUpperCase()] : 1); };
    const textCmp = (a, b) => (fold ? a.toLowerCase().localeCompare(b.toLowerCase(), "en") : a.localeCompare(b, "en"));
    lines = lines.map((l, i) => ({ l, k: keyOf(l), i }));
    lines.sort((a, b) => {
      let c = keyNumeric || human ? num(a.k) - num(b.k) : textCmp(a.k, b.k);
      if (keyReverse) c = -c;
      if (c === 0) { c = textCmp(a.l, b.l); if (reverse) c = -c; }
      return c;
    });
    let out = lines.map((x) => x.l);
    if (unique) out = out.filter((l, i) => i === 0 || (key ? keyOf(l) !== keyOf(out[i - 1]) : fold ? l.toLowerCase() !== out[i - 1].toLowerCase() : l !== out[i - 1]));
    return { stdout: joinLines(out) };
  };

  /* ------------------------------------------------------------- paste */
  C.paste = function (args, stdin) {
    let delims = "\t", serial = false;
    const files = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === "-d") { delims = args[++i] ?? "\t"; continue; }
      if (a.startsWith("-d")) { delims = a.slice(2); continue; }
      if (a === "-s") { serial = true; continue; }
      if (a === "-sd") { serial = true; delims = args[++i]; continue; }
      if (/^-sd./.test(a)) { serial = true; delims = a.slice(3); continue; } // -sd, joins with commas
      files.push(a);
    }
    delims = delims.replace(/\\t/g, "\t").replace(/\\n/g, "\n") || "\t";
    const contents = [];
    for (const f of files.length ? files : ["-"]) {
      const r = input(this, [f], stdin, "paste");
      if (r.err) return { stderr: r.err, status: 1 };
      contents.push(linesOf(r.text));
    }
    const d = (i) => delims[i % delims.length];
    if (serial) return { stdout: joinLines(contents.map((ls) => ls.reduce((acc, l, i) => (i ? acc + d(i - 1) + l : l), ""))) };
    const n = Math.max(...contents.map((c) => c.length));
    const out = [];
    for (let i = 0; i < n; i++) out.push(contents.map((c) => c[i] ?? "").reduce((acc, v, j) => (j ? acc + d(j - 1) + v : v), ""));
    return { stdout: joinLines(out) };
  };

  /* ------------------------------------------------------------- split */
  C.split = function (args, stdin) {
    let lines = 1000, bytes = null, numeric = false, suffixLen = 2;
    const rest = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === "-l") { lines = parseInt(args[++i], 10); continue; }
      if (/^-l\d+$/.test(a)) { lines = parseInt(a.slice(2), 10); continue; }
      if (/^-\d+$/.test(a)) { lines = parseInt(a.slice(1), 10); continue; }
      if (a === "-b") { bytes = args[++i]; continue; }
      if (a === "-d") { numeric = true; continue; }
      if (a === "-a") { suffixLen = parseInt(args[++i], 10); continue; }
      rest.push(a);
    }
    if (!(lines > 0)) return { stderr: "split: invalid number of lines", status: 1 };
    const [file = "-", prefix = "x"] = rest;
    const r = input(this, [file], stdin, "split");
    if (r.err) return { stderr: r.err.replace("split: ", "split: cannot open ") + "", status: 1 };
    const chunks = [];
    if (bytes) {
      const m = String(bytes).match(/^(\d+)([KM]?)$/i);
      const size = m ? +m[1] * ({ k: 1024, m: 1048576 }[m[2].toLowerCase()] || 1) : 1000;
      for (let i = 0; i < r.text.length; i += size) chunks.push(r.text.slice(i, i + size));
    } else {
      const ls = linesOf(r.text);
      for (let i = 0; i < ls.length; i += lines) chunks.push(ls.slice(i, i + lines).join("\n") + "\n");
    }
    const suffix = (n) => {
      if (numeric) return String(n).padStart(suffixLen, "0");
      let s = "";
      for (let k = 0; k < suffixLen; k++) { s = String.fromCharCode(97 + (n % 26)) + s; n = Math.floor(n / 26); }
      return s;
    };
    chunks.forEach((c, i) => this.vfs.write(this.abs(prefix + suffix(i)), c));
    return {};
  };

  /* ------------------------------------------------------------- cut */
  function parseList(list) {
    const ranges = [];
    for (const part of String(list).split(",")) {
      const m = part.match(/^(\d*)(-?)(\d*)$/);
      if (!m || (!m[1] && !m[3])) return null;
      const a = m[1] ? +m[1] : 1, b = m[2] ? (m[3] ? +m[3] : Infinity) : a;
      ranges.push([a, b]);
    }
    return (i) => ranges.some(([a, b]) => i >= a && i <= b);
  }
  C.cut = function (args, stdin) {
    let delim = "\t", fields = null, chars = null, onlyDelimited = false, outDelim = null;
    const files = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === "-d") { delim = args[++i]; continue; }
      if (a.startsWith("-d")) { delim = a.slice(2); continue; }
      if (a === "-f") { fields = args[++i]; continue; }
      if (a.startsWith("-f")) { fields = a.slice(2); continue; }
      if (a === "-c" || a === "-b") { chars = args[++i]; continue; }
      if (a.startsWith("-c") || a.startsWith("-b")) { chars = a.slice(2); continue; }
      if (a === "-s") { onlyDelimited = true; continue; }
      if (a.startsWith("--output-delimiter=")) { outDelim = a.split("=").slice(1).join("="); continue; }
      if (a.startsWith("--delimiter=")) { delim = a.split("=").slice(1).join("="); continue; }
      if (a.startsWith("--fields=")) { fields = a.split("=")[1]; continue; }
      files.push(a);
    }
    if (!fields && !chars) return { stderr: "cut: you must specify a list of bytes, characters, or fields\nTry 'cut --help' for more information.", status: 1 };
    if (delim === undefined || delim.length !== 1) return { stderr: "cut: the delimiter must be a single character", status: 1 };
    const sel = parseList(fields || chars);
    if (!sel) return { stderr: `cut: invalid field value '${fields || chars}'`, status: 1 };
    const r = input(this, files, stdin, "cut");
    if (r.err) return { stderr: r.err, status: 1 };
    const out = [];
    for (const l of linesOf(r.text)) {
      if (chars) { out.push([...l].filter((_, i) => sel(i + 1)).join("")); continue; }
      if (!l.includes(delim)) { if (!onlyDelimited) out.push(l); continue; }
      out.push(l.split(delim).filter((_, i) => sel(i + 1)).join(outDelim ?? delim));
    }
    return { stdout: joinLines(out) };
  };

  /* ------------------------------------------------------------- tr */
  const CLASS_CHARS = {
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", lower: "abcdefghijklmnopqrstuvwxyz", digit: "0123456789",
    space: " \t\n\r\f\v", blank: " \t", punct: "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~",
  };
  CLASS_CHARS.alpha = CLASS_CHARS.upper + CLASS_CHARS.lower;
  CLASS_CHARS.alnum = CLASS_CHARS.alpha + CLASS_CHARS.digit;
  function expandSet(s) {
    const out = [];
    let i = 0;
    const take = () => {
      const c = s[i];
      if (c === "\\" && i + 1 < s.length) { i += 2; return { n: "\n", t: "\t", r: "\r", "\\": "\\" }[s[i - 1]] ?? s[i - 1]; }
      i++; return c;
    };
    while (i < s.length) {
      const m = s.slice(i).match(/^\[:(\w+):\]/);
      if (m && CLASS_CHARS[m[1]]) { out.push(...CLASS_CHARS[m[1]]); i += m[0].length; continue; }
      const a = take();
      if (s[i] === "-" && i + 1 < s.length) {
        i++;
        const b = take();
        for (let c = a.charCodeAt(0); c <= b.charCodeAt(0); c++) out.push(String.fromCharCode(c));
      } else out.push(a);
    }
    return out;
  }
  C.tr = function (args, stdin) {
    let del = false, squeeze = false, complement = false;
    const sets = [];
    for (const a of args) {
      if (/^-[dsc]+$/.test(a)) { if (a.includes("d")) del = true; if (a.includes("s")) squeeze = true; if (a.includes("c")) complement = true; continue; }
      sets.push(a);
    }
    if (!sets.length) return { stderr: "tr: missing operand\nTry 'tr --help' for more information.", status: 1 };
    if (!del && !squeeze && sets.length < 2) return { stderr: `tr: missing operand after '${sets[0]}'\nTwo strings must be given when translating.`, status: 1 };
    if (sets.length > 2 || (del && !squeeze && sets.length > 1)) {
      const extra = sets[del && !squeeze ? 1 : 2];
      const why = del && !squeeze ? "\nOnly one string may be given when deleting without squeezing repeats." : "";
      return { stderr: `tr: extra operand '${extra}'${why}\nTry 'tr --help' for more information.\n(tr reads standard input only. Feed it a file with < file.)`, status: 1 };
    }
    const s1 = expandSet(sets[0]), s2 = sets[1] !== undefined ? expandSet(sets[1]) : [];
    const in1 = (c) => (complement ? !s1.includes(c) : s1.includes(c));
    let out = "";
    let last = null;
    for (const c of stdin) {
      let ch = c;
      if (del && in1(c)) continue;
      if (!del && s2.length && in1(c)) {
        const idx = complement ? s2.length - 1 : s1.indexOf(c);
        ch = s2[Math.min(idx, s2.length - 1)];
      }
      const squeezeSet = del ? s2 : s2.length ? s2 : s1;
      if (squeeze && ch === last && squeezeSet.includes(ch)) continue;
      out += ch; last = ch;
    }
    return { stdout: out };
  };

  /* ------------------------------------------------------------- sed */
  function parseSed(script, extended) {
    const cmds = [];
    let i = 0;
    const s = script;
    const skipWs = () => { while (i < s.length && /[\s;]/.test(s[i])) i++; };
    const readRegexAddr = () => {
      const d = s[i] === "\\" ? s[++i] : "/";
      i++;
      let re = "";
      while (i < s.length && s[i] !== d) { if (s[i] === "\\" && s[i + 1] === d) { re += d; i += 2; continue; } re += s[i++]; }
      i++;
      return { re: new RegExp(toJsRegex(re, extended)) };
    };
    const readAddr = () => {
      if (/\d/.test(s[i])) { let n = ""; while (/\d/.test(s[i])) n += s[i++]; return { line: +n }; }
      if (s[i] === "$") { i++; return { last: true }; }
      if (s[i] === "/" || s[i] === "\\") return readRegexAddr();
      return null;
    };
    while (true) {
      skipWs();
      if (i >= s.length) break;
      const a1 = readAddr();
      let a2 = null;
      if (a1 && s[i] === ",") { i++; a2 = readAddr(); }
      let neg = false;
      while (s[i] === " ") i++;
      if (s[i] === "!") { neg = true; i++; }
      while (s[i] === " ") i++;
      const c = s[i++];
      const cmd = { a1, a2, neg, c };
      if (c === "s" || c === "y") {
        const d = s[i++];
        const parts = [];
        for (let p = 0; p < 2; p++) {
          let t = "";
          while (i < s.length && s[i] !== d) { if (s[i] === "\\" && i + 1 < s.length) { t += s[i + 1] === d ? d : s[i] + s[i + 1]; i += 2; continue; } t += s[i++]; }
          if (s[i] !== d) throw new Error(`-e expression #1, char ${i}: unterminated \`${c}' command`);
          i++; parts.push(t);
        }
        let flags = "";
        while (i < s.length && /[gIipw0-9]/.test(s[i])) flags += s[i++];
        if (c === "s") {
          const nth = (flags.match(/\d+/) || [])[0];
          cmd.re = new RegExp(toJsRegex(parts[0], extended), "g" + (/[Ii]/.test(flags) ? "i" : ""));
          cmd.repl = parts[1].replace(/\$/g, "$$$$").replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\(\d)/g, "$$$1").replace(/(^|[^\\])&/g, "$1$$&").replace(/\\&/g, "&");
          cmd.global = flags.includes("g"); cmd.nth = nth ? +nth : 1; cmd.print = flags.includes("p");
        } else { cmd.from = [...parts[0]]; cmd.to = [...parts[1]]; if (cmd.from.length !== cmd.to.length) throw new Error("strings for `y' command are different lengths"); }
      } else if (c === "a" || c === "i" || c === "c") {
        if (s[i] === "\\") i++;
        while (s[i] === " ") i++;
        let t = "";
        while (i < s.length && s[i] !== "\n" && s[i] !== ";") t += s[i++];
        cmd.text = t;
      } else if (!"dpqn=".includes(c)) {
        throw new Error(`-e expression #1, char ${i}: unknown command: \`${c}'`);
      }
      cmds.push(cmd);
    }
    return cmds;
  }
  C.sed = function (args, stdin) {
    let quiet = false, inPlace = false, extended = false, suffix = "";
    const scripts = [], files = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === "-e") { scripts.push(args[++i]); continue; }
      if (a === "-n" || a === "--quiet") { quiet = true; continue; }
      if (a === "-i" || a.startsWith("-i")) { inPlace = true; suffix = a.slice(2); continue; }
      if (a.startsWith("--in-place")) { inPlace = true; suffix = a.split("=")[1] || ""; continue; }
      if (a === "-E" || a === "-r") { extended = true; continue; }
      if (/^-[nEr]+$/.test(a)) { if (a.includes("n")) quiet = true; if (/[Er]/.test(a)) extended = true; continue; }
      if (!scripts.length && !args.slice(0, i).includes("-e")) { scripts.push(a); continue; }
      files.push(a);
    }
    if (!scripts.length) return { stderr: "Usage: sed [OPTION]... {script-only-if-no-other-script} [input-file]...", status: 1 };
    let prog;
    try { prog = parseSed(scripts.join("\n"), extended); } catch (e) { return { stderr: "sed: " + e.message, status: 1 }; }
    const run = (text) => {
      const lines = linesOf(text);
      const out = [];
      const range = new Map();
      for (let n = 0; n < lines.length; n++) {
        let line = lines[n];
        const isLast = n === lines.length - 1;
        const hit = (a) => (a.line ? a.line === n + 1 : a.last ? isLast : a.re ? a.re.test(line) : false);
        let deleted = false, quit = false;
        const append = [];
        for (const [ci, c] of prog.entries()) {
          let match = true;
          if (c.a1 && !c.a2) match = hit(c.a1);
          else if (c.a1 && c.a2) {
            if (range.get(ci)) { match = true; if (c.a2.line ? n + 1 >= c.a2.line : hit(c.a2)) range.set(ci, false); }
            else if (hit(c.a1)) { match = true; range.set(ci, !(c.a2.line && c.a2.line <= n + 1)); }
            else match = false;
          }
          if (c.neg) match = !match;
          if (!match) continue;
          if (c.c === "s") {
            let count = 0, did = false;
            line = line.replace(c.re, (...m) => {
              count++;
              if (c.global ? count >= c.nth : count === c.nth) { did = true; return m[0].replace(new RegExp(c.re.source, c.re.flags.replace("g", "")), c.repl); }
              return m[0];
            });
            if (did && c.print) out.push(line);
          } else if (c.c === "y") line = [...line].map((ch) => { const k = c.from.indexOf(ch); return k >= 0 ? c.to[k] : ch; }).join("");
          else if (c.c === "d") { deleted = true; break; }
          else if (c.c === "p") out.push(line);
          else if (c.c === "=") out.push(String(n + 1));
          else if (c.c === "i") out.push(c.text);
          else if (c.c === "a") append.push(c.text);
          else if (c.c === "c") { out.push(c.text); deleted = true; break; }
          else if (c.c === "q") { quit = true; break; }
        }
        if (!deleted && !quiet) out.push(line);
        out.push(...append);
        if (quit) break;
      }
      return joinLines(out);
    };
    if (inPlace) {
      if (!files.length) return { stderr: "sed: no input files", status: 1 };
      for (const f of files) {
        const node = this.vfs.get(this.abs(f));
        if (!node || node.type !== "file") return { stderr: `sed: can't read ${f}: No such file or directory`, status: 2 };
        if (suffix) this.vfs.write(this.abs(f) + suffix, node.content); // -i.bak keeps the original
        node.content = run(node.content);
        node.mtime = Date.now();
      }
      return {};
    }
    const r = input(this, files, stdin, "sed");
    if (r.err) return { stderr: r.err.replace(/^sed: (.*): No such/, "sed: can't read $1: No such"), status: 2 };
    return { stdout: run(r.text) };
  };

  /* ------------------------------------------------------------- od */
  C.od = function (args, stdin) {
    const o = opts(args);
    const r = input(this, o.rest, stdin, "od");
    if (r.err) return { stderr: r.err, status: 1 };
    const bytes = [...new TextEncoder().encode(r.text)];
    const out = [];
    const off = (n) => n.toString(8).padStart(7, "0");
    const NAMES = { 0: "\\0", 7: "\\a", 8: "\\b", 9: "\\t", 10: "\\n", 11: "\\v", 12: "\\f", 13: "\\r" };
    for (let i = 0; i < bytes.length; i += 16) {
      const row = bytes.slice(i, i + 16);
      let body;
      if (o.flags.has("c")) body = row.map((b) => (NAMES[b] || (b >= 32 && b < 127 ? String.fromCharCode(b) : b.toString(8).padStart(3, "0"))).padStart(4, " ")).join("");
      else {
        const words = [];
        for (let j = 0; j < row.length; j += 2) words.push((row[j] | ((row[j + 1] || 0) << 8)));
        body = words.map((w) => " " + (o.flags.has("x") ? w.toString(16).padStart(4, "0") : w.toString(8).padStart(6, "0"))).join("");
      }
      out.push(off(i) + body);
    }
    out.push(off(bytes.length));
    return { stdout: joinLines(out) };
  };

  /* ------------------------------------------------------------- grep (BRE/ERE aware) */
  const baseGrep = C.grep;
  C.grep = function (args, stdin, res) {
    const extended = args.some((a) => /^-[a-zA-Z]*E/.test(a));
    const fixed = args.some((a) => /^-[a-zA-Z]*F/.test(a));
    const words = args.some((a) => /^-[a-zA-Z]*w/.test(a));
    const onlyMatch = args.some((a) => /^-[a-zA-Z]*o/.test(a));
    let patIdx = -1;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "-e") { patIdx = i + 1; break; }
      if (!args[i].startsWith("-") || args[i] === "-") { patIdx = i; break; }
    }
    if (patIdx < 0 || patIdx >= args.length) return baseGrep.call(this, args, stdin, res);
    let p = args[patIdx];
    if (!fixed) p = toJsRegex(p, extended);
    else p = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (words) p = `\\b(?:${p})\\b`;
    const cleaned = args.map((a, i) => (i === patIdx ? p : /^-[a-zA-Z]+$/.test(a) ? a.replace(/[EFwo]/g, "") : a)).filter((a) => a !== "-");
    if (onlyMatch) {
      const o = opts(cleaned.filter((a, i) => i !== cleaned.indexOf(p)));
      const re = new RegExp(p, "g" + (o.flags.has("i") ? "i" : ""));
      const r = input(this, o.rest, stdin, "grep");
      if (r.err) return { stderr: r.err, status: 2 };
      const hits = linesOf(r.text).flatMap((l) => l.match(re) || []);
      return { stdout: joinLines(hits), status: hits.length ? 0 : 1 };
    }
    return baseGrep.call(this, cleaned, stdin, res);
  };
  /* ------------------------------------------------------------- tee */
  C.tee = function (args, stdin) {
    const append = args.includes("-a") || args.includes("--append");
    const files = args.filter((a) => a !== "-a" && a !== "--append");
    for (const f of files) {
      if (f === "/dev/null") continue;
      try { this.vfs.write(this.abs(f), stdin, append); }
      catch { return { stdout: stdin, stderr: `tee: ${f}: No such file or directory`, status: 1 }; }
    }
    return { stdout: stdin };
  };

  /* ------------------------------------------------------------- xargs */
  C.xargs = function (args, stdin, res) {
    let file = null, perCmd = null, replace = null, trace = false, nulSep = false, delim = null;
    let i = 0;
    for (; i < args.length; i++) {
      const a = args[i];
      if (a === "-a") { file = args[++i]; continue; }
      if (a === "-n") { perCmd = parseInt(args[++i], 10); continue; }
      if (/^-n\d+$/.test(a)) { perCmd = parseInt(a.slice(2), 10); continue; }
      if (a === "-I") { replace = args[++i]; continue; }
      if (a.startsWith("-I") && a.length > 2) { replace = a.slice(2); continue; }
      if (a === "-t") { trace = true; continue; }
      if (a === "-0" || a === "--null") { nulSep = true; continue; }
      if (a === "-d") { delim = args[++i]; continue; }
      if (a === "-p") return { stderr: "xargs: -p (prompt) isn't simulated here. Use rm -i instead.", status: 1 };
      break;
    }
    const cmd = args.slice(i);
    if (!cmd.length) cmd.push("echo");
    let text = stdin;
    if (file) {
      const n = this.vfs.get(this.abs(file));
      if (!n || n.type !== "file") return { stderr: `xargs: ${file}: No such file or directory`, status: 1 };
      text = n.content;
    }
    let items;
    if (nulSep) items = text.split("\0").filter(Boolean);
    else if (delim) items = text.split(delim.replace("\\n", "\n")).filter(Boolean);
    else if (replace) items = text.split("\n").filter((l) => l.trim());
    else items = (text.match(/'[^']*'|"[^"]*"|\S+/g) || []).map((w) => w.replace(/^(['"])(.*)\1$/, "$2"));
    const groups = [];
    if (replace) items.forEach((it) => groups.push(cmd.map((w) => w.split(replace).join(it))));
    else if (perCmd) for (let k = 0; k < items.length; k += perCmd) groups.push([...cmd, ...items.slice(k, k + perCmd)]);
    else groups.push([...cmd, ...items]);
    let out = "", err = "", status = 0;
    for (const g of groups) {
      if (trace) err += g.join(" ") + "\n";
      // Commands run by xargs read from xargs's own input, not the keyboard,
      // unless the list came from -a. rm -i notices this.
      const r = this.exec(g, "", res, { fromXargsStdin: !file });
      out += r.stdout || "";
      if (r.stderr) err += r.stderr.replace(/\n?$/, "\n");
      if (r.status) status = 123;
    }
    return { stdout: out, stderr: err.replace(/\n$/, ""), status };
  };

  /* ------------------------------------------------------------- rm -i (interactive) */
  const baseRm = C.rm;
  C.rm = function (args, stdin, res, ctx = {}) {
    const flags = args.filter((a) => /^-[a-zA-Z]+$/.test(a)).join("");
    if (!flags.includes("i") || flags.includes("f")) return baseRm.call(this, args.map((a) => (/^-[a-zA-Z]+$/.test(a) ? a.replace("i", "") : a)).filter((a) => a !== "-"), stdin, res);
    const files = args.filter((a) => !/^-[a-zA-Z]+$/.test(a));
    const out = [], err = [];
    for (const f of files) {
      const node = this.vfs.get(this.abs(f));
      if (!node) { err.push(`rm: cannot remove '${f}': No such file or directory`); continue; }
      const kind = node.type === "dir" ? "directory" : node.content ? "regular file" : "regular empty file";
      const q = `rm: remove ${kind} '${f}'?`;
      let yes;
      if (ctx.fromXargsStdin) { yes = false; err.push(`${q} (no answer: xargs gave rm no keyboard, so nothing was removed. Use xargs -a FILE so rm can ask you.)`); continue; }
      yes = window.confirm(q);
      out.push(`${q} ${yes ? "y" : "n"}`);
      if (yes) {
        if (node.type === "dir" && !/[rR]/.test(flags)) { err.push(`rm: cannot remove '${f}': Is a directory`); continue; }
        this.vfs.remove(this.abs(f));
      }
    }
    return { stdout: out.length ? out.join("\n") + "\n" : "", stderr: err.join("\n"), status: err.length ? 1 : 0 };
  };

  /* ------------------------------------------------------------- printf (format reuse, %s %d %%) */
  C.printf = function (args) {
    if (!args.length) return { stderr: "printf: usage: printf [-v var] format [arguments]", status: 2 };
    const [fmt, ...rest] = args;
    const esc = (s) => s.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\\\/g, "\\");
    const once = (vals) => {
      let k = 0;
      const s = esc(fmt).replace(/%(-?\d*)([sdf%])/g, (m, w, t) => {
        if (t === "%") return "%";
        let v = vals[k++] ?? (t === "s" ? "" : "0");
        if (t === "d") v = String(parseInt(v, 10) || 0);
        if (t === "f") v = (parseFloat(v) || 0).toFixed(6);
        const width = parseInt(w, 10);
        return width ? (width < 0 ? v.padEnd(-width) : v.padStart(width)) : v;
      });
      return { s, used: k };
    };
    let out = "", vals = rest;
    do {
      const { s, used } = once(vals);
      out += s;
      if (!used) break;
      vals = vals.slice(used);
    } while (vals.length);
    return { stdout: out };
  };

  /* ------------------------------------------------------------- date +FORMAT */
  const baseDate = C.date;
  C.date = function (args) {
    const f = args.find((a) => a.startsWith("+"));
    if (!f) return baseDate.call(this, args);
    const d = new Date(), p2 = (n) => String(n).padStart(2, "0");
    const map = { Y: d.getFullYear(), m: p2(d.getMonth() + 1), d: p2(d.getDate()), H: p2(d.getHours()), M: p2(d.getMinutes()), S: p2(d.getSeconds()),
      F: `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`, T: `${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`,
      s: Math.floor(d / 1000), A: d.toLocaleDateString("en-US", { weekday: "long" }), a: d.toLocaleDateString("en-US", { weekday: "short" }),
      B: d.toLocaleDateString("en-US", { month: "long" }), b: d.toLocaleDateString("en-US", { month: "short" }), j: String(Math.ceil((d - new Date(d.getFullYear(), 0, 1)) / 864e5) + 0).padStart(3, "0"), "%": "%" };
    return { stdout: f.slice(1).replace(/%(.)/g, (m, c) => (map[c] !== undefined ? map[c] : m)) + "\n" };
  };

  C.egrep = function (args, stdin, res) { return C.grep.call(this, ["-E", ...args], stdin, res); };
  C.fgrep = function (args, stdin, res) { return C.grep.call(this, ["-F", ...args], stdin, res); };
})();
