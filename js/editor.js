/* vi and nano for the practice terminal (Section 9).
   The vi here covers what LPIC-1 objective 103.8 asks for: the three modes, movement
   (h j k l, arrows, 0 ^ $ w b e, gg G, :N, Ctrl+D Ctrl+U), insert (i a o O I A), deleting
   (x X dd dw D d$ dG and counts such as d2w and 3dd), yank and put (yy yw p P), undo and redo
   (u, Ctrl+R), search (/ ? n N), and ex commands (:w :w FILE :q :q! :wq :x ZZ :r FILE
   :set number/nonumber, :set ff=unix/dos, :N, :s and :%s). Messages match real vim.
   nano is a plain editing area with Ctrl+O (write out) and Ctrl+X (exit).
   On a phone, a key row supplies Esc, Ctrl, arrows and the most-used vi keys. */
(function () {
  "use strict";
  const LPIC = window.LPIC;
  const esc = LPIC.esc;
  const bytesOf = (s) => new TextEncoder().encode(s).length;

  /* ================================================================ vi model */
  class ViModel {
    constructor(text, opts) {
      this.path = opts.path;
      this.isNew = opts.isNew;
      this.rows = opts.rows || 16;
      const dos = /\r\n/.test(text) && text.replace(/\r\n/g, "").indexOf("\n") < 0;
      this.ff = dos ? "dos" : "unix";
      const body = dos ? text.replace(/\r\n/g, "\n") : text;
      this.lines = body === "" ? [""] : body.replace(/\n$/, "").split("\n");
      this.empty = body === "";
      this.cy = 0; this.cx = 0; this.top = 0;
      this.mode = "normal";
      this.cmd = null; // { prefix, text }
      this.count = ""; this.op = ""; this.opCount = "";
      this.reg = null;
      this.undo = []; this.redo = [];
      this.number = false;
      this.modified = false;
      this.search = null;
      this.keysUsed = new Set();
      this.exUsed = [];
      this.saved = false;
      this.quit = null; // { forced }
      this.writes = [];
      const lc = this.lines.length, bc = bytesOf(text);
      this.msg = this.isNew ? `"${this.path}" [New]` : `"${this.path}"${dos ? " [dos]" : ""} ${lc}L, ${bc}B`;
      this.insertStart = null;
    }
    snapshot() { this.empty = false; this.undo.push({ lines: [...this.lines], cy: this.cy, cx: this.cx }); this.redo = []; if (this.undo.length > 200) this.undo.shift(); }
    clampX(insert = false) { const len = this.lines[this.cy].length; this.cx = Math.max(0, Math.min(this.cx, insert ? len : Math.max(0, len - 1))); }
    clampY() { this.cy = Math.max(0, Math.min(this.cy, this.lines.length - 1)); }
    firstNonBlank() { const m = this.lines[this.cy].match(/^\s*/); this.cx = m[0].length; this.clampX(); }
    scroll() { if (this.cy < this.top) this.top = this.cy; if (this.cy >= this.top + this.rows) this.top = this.cy - this.rows + 1; }
    text(ff = this.ff) { if (this.empty && this.lines.length === 1 && this.lines[0] === "") return ""; return this.lines.join(ff === "dos" ? "\r\n" : "\n") + (ff === "dos" ? "\r\n" : "\n"); }

    /* Word motions on the current line and beyond (vim "word": letters/digits/_ or runs of other punctuation). */
    wordForward() {
      const cls = (c) => (c === undefined ? -1 : /\s/.test(c) ? 0 : /\w/.test(c) ? 1 : 2);
      let y = this.cy, x = this.cx, line = this.lines[y];
      const start = cls(line[x]);
      while (x < line.length && cls(line[x]) === start && start !== 0) x++;
      while (true) {
        while (x < line.length && cls(line[x]) === 0) x++;
        if (x < line.length || y >= this.lines.length - 1) break;
        y++; x = 0; line = this.lines[y];
        if (line.length === 0) break;
      }
      return { y, x: Math.min(x, Math.max(0, line.length)) };
    }
    wordBack() {
      const cls = (c) => (/\s/.test(c) ? 0 : /\w/.test(c) ? 1 : 2);
      let y = this.cy, x = this.cx;
      if (x === 0) { if (y === 0) return { y, x }; y--; x = this.lines[y].length; }
      let line = this.lines[y];
      x--;
      while (x > 0 && cls(line[x]) === 0) x--;
      const c = cls(line[x]);
      while (x > 0 && cls(line[x - 1]) === c) x--;
      return { y, x: Math.max(0, x) };
    }
    wordEnd() {
      const cls = (c) => (c === undefined ? -1 : /\s/.test(c) ? 0 : /\w/.test(c) ? 1 : 2);
      let y = this.cy, x = this.cx + 1, line = this.lines[y];
      while (true) {
        while (x < line.length && cls(line[x]) === 0) x++;
        if (x < line.length || y >= this.lines.length - 1) break;
        y++; x = 0; line = this.lines[y];
      }
      const c = cls(line[x]);
      while (x + 1 < line.length && cls(line[x + 1]) === c) x++;
      return { y, x: Math.max(0, Math.min(x, line.length - 1)) };
    }

    doSearch(term, dir, fromNext = true) {
      let re;
      try { re = new RegExp(LPIC.toJsRegex ? LPIC.toJsRegex(term, false) : term); } catch { this.msg = `E486: Pattern not found: ${term}`; return; }
      const n = this.lines.length;
      for (let step = 0; step <= n; step++) {
        const y = (this.cy + (dir > 0 ? step : -step) + n * 2) % n;
        const line = this.lines[y];
        const hits = [];
        let m; const g = new RegExp(re.source, "g");
        while ((m = g.exec(line))) { hits.push(m.index); if (!m[0].length) g.lastIndex++; }
        let pick = null;
        if (dir > 0) pick = hits.find((x) => (y === this.cy && step === 0 ? x > this.cx || !fromNext : true));
        else pick = [...hits].reverse().find((x) => (y === this.cy && step === 0 ? x < this.cx || !fromNext : true));
        if (step === n && y === this.cy) pick = hits.find(() => true) ?? null;
        if (pick !== undefined && pick !== null) {
          const wrapped = dir > 0 ? y < this.cy || (y === this.cy && step > 0) : y > this.cy || (y === this.cy && step > 0);
          this.cy = y; this.cx = pick;
          this.msg = wrapped ? (dir > 0 ? "search hit BOTTOM, continuing at TOP" : "search hit TOP, continuing at BOTTOM") : (dir > 0 ? "/" : "?") + term;
          return true;
        }
      }
      this.msg = `E486: Pattern not found: ${term}`;
      return false;
    }

    deleteRange(y1, x1, y2, x2, linewise, yankOnly = false) {
      // Normalise so (y1,x1) <= (y2,x2). For charwise, x2 is exclusive.
      if (y2 < y1 || (y2 === y1 && x2 < x1)) [y1, x1, y2, x2] = [y2, x2, y1, x1];
      if (linewise) {
        const taken = this.lines.slice(y1, y2 + 1);
        this.reg = { text: taken, linewise: true };
        if (!yankOnly) {
          this.lines.splice(y1, y2 - y1 + 1);
          if (!this.lines.length) { this.lines = [""]; this.empty = true; this.msg = "--No lines in buffer--"; }
          this.cy = Math.min(y1, this.lines.length - 1);
          this.firstNonBlank();
          if (taken.length > 2) this.msg = `${taken.length} fewer lines`;
        } else if (taken.length > 2) this.msg = `${taken.length} lines yanked`;
        return;
      }
      if (y1 === y2) {
        const line = this.lines[y1];
        this.reg = { text: [line.slice(x1, x2)], linewise: false };
        if (!yankOnly) { this.lines[y1] = line.slice(0, x1) + line.slice(x2); this.cy = y1; this.cx = x1; this.clampX(); }
        return;
      }
      const first = this.lines[y1], last = this.lines[y2];
      this.reg = { text: [first.slice(x1), ...this.lines.slice(y1 + 1, y2), last.slice(0, x2)], linewise: false };
      if (!yankOnly) { this.lines.splice(y1, y2 - y1 + 1, first.slice(0, x1) + last.slice(x2)); this.cy = y1; this.cx = x1; this.clampX(); }
    }

    put(before) {
      if (!this.reg) { this.msg = "E353: Nothing in register \""; return; }
      this.snapshot();
      const t = this.reg.text;
      if (this.reg.linewise) {
        const at = before ? this.cy : this.cy + 1;
        this.lines.splice(at, 0, ...t);
        this.cy = at; this.firstNonBlank();
        if (t.length > 2) this.msg = `${t.length} more lines`;
      } else {
        const line = this.lines[this.cy];
        const at = before ? this.cx : Math.min(line.length, this.cx + 1);
        if (t.length === 1) { this.lines[this.cy] = line.slice(0, at) + t[0] + line.slice(at); this.cx = at + t[0].length - 1; }
        else {
          const tail = line.slice(at);
          const newLines = [line.slice(0, at) + t[0], ...t.slice(1, -1), t[t.length - 1] + tail];
          this.lines.splice(this.cy, 1, ...newLines);
          this.cx = at;
        }
        this.clampX();
      }
      this.modified = true;
    }

    /* ------------------------------------------------------------ keys */
    key(k) {
      if (this.mode === "insert") return this.insertKey(k);
      if (this.mode === "cmdline") return this.cmdKey(k);
      return this.normalKey(k);
    }

    insertKey(k) {
      const line = this.lines[this.cy];
      if (k === "Escape") { this.mode = "normal"; this.cx = Math.max(0, this.cx - 1); this.clampX(); this.msg = ""; return; }
      if (k === "Enter") { this.lines.splice(this.cy, 1, line.slice(0, this.cx), line.slice(this.cx)); this.cy++; this.cx = 0; this.modified = true; return; }
      if (k === "Backspace") {
        if (this.cx > 0) { this.lines[this.cy] = line.slice(0, this.cx - 1) + line.slice(this.cx); this.cx--; this.modified = true; }
        else if (this.cy > 0) { const prev = this.lines[this.cy - 1]; this.lines.splice(this.cy - 1, 2, prev + line); this.cy--; this.cx = prev.length; this.modified = true; }
        return;
      }
      if (k === "ArrowLeft") { this.cx = Math.max(0, this.cx - 1); return; }
      if (k === "ArrowRight") { this.cx = Math.min(line.length, this.cx + 1); return; }
      if (k === "ArrowUp") { this.cy = Math.max(0, this.cy - 1); this.clampX(true); return; }
      if (k === "ArrowDown") { this.cy = Math.min(this.lines.length - 1, this.cy + 1); this.clampX(true); return; }
      if (k === "Tab") k = "\t";
      if (k.length === 1) { this.lines[this.cy] = line.slice(0, this.cx) + k + line.slice(this.cx); this.cx++; this.modified = true; }
    }

    startInsert(where) {
      this.snapshot();
      const line = this.lines[this.cy];
      if (where === "a") this.cx = Math.min(line.length, this.cx + (line.length ? 1 : 0));
      if (where === "A") this.cx = line.length;
      if (where === "I") { this.firstNonBlank(); }
      if (where === "o") { this.lines.splice(this.cy + 1, 0, ""); this.cy++; this.cx = 0; this.modified = true; }
      if (where === "O") { this.lines.splice(this.cy, 0, ""); this.cx = 0; this.modified = true; }
      this.mode = "insert";
      this.msg = "-- INSERT --";
    }

    normalKey(k) {
      this.keysUsed.add(k);
      const n = (dflt = 1) => (this.count || this.opCount ? (parseInt(this.count, 10) || 1) * (parseInt(this.opCount, 10) || 1) : dflt);
      // After r, the next key is the replacement character, even if it's a digit.
      if (/^[1-9]$/.test(k) && this.op !== "r" || (k === "0" && this.count && this.op !== "r")) { this.count += k; return; }
      const op = this.op;
      const reset = () => { this.count = ""; this.op = ""; this.opCount = ""; };
      const line = this.lines[this.cy];
      if (k === "Escape") { reset(); this.msg = ""; return; }

      // Two-key commands: gg, ZZ/ZQ, and operators d/y/c followed by a motion.
      if (op === "r") { // r{char}: replace the character(s) under the cursor without entering insert mode
        const cnt = n(); reset();
        if (k.length === 1 && line.length >= this.cx + cnt) { this.snapshot(); this.lines[this.cy] = line.slice(0, this.cx) + k.repeat(cnt) + line.slice(this.cx + cnt); this.cx += cnt - 1; this.modified = true; }
        return;
      }
      if (op === "g") { reset(); if (k === "g") { this.cy = this.count ? n() - 1 : 0; this.clampY(); this.firstNonBlank(); } return; }
      if (op === "Z") { reset(); if (k === "Z") return this.ex("x"); if (k === "Q") return this.ex("q!"); return; }
      if (op === "d" || op === "y" || op === "c") {
        const yank = op === "y", change = op === "c";
        const cnt = n();
        reset();
        if (k === op) { // dd, yy, cc
          if (!yank) this.snapshot();
          const y2 = Math.min(this.lines.length - 1, this.cy + cnt - 1);
          if (change) { this.reg = { text: this.lines.slice(this.cy, y2 + 1), linewise: true }; this.lines.splice(this.cy, y2 - this.cy + 1, ""); this.cx = 0; this.mode = "insert"; this.msg = "-- INSERT --"; this.modified = true; return; }
          this.deleteRange(this.cy, 0, y2, 0, true, yank);
          if (!yank) this.modified = true;
          return;
        }
        let target = null, linewise = false, inclusive = false;
        if (k === "w") { // dw stays on the line like vim; cw acts like ce
          let y = this.cy, x = this.cx;
          for (let i = 0; i < cnt; i++) { const save = [this.cy, this.cx]; [this.cy, this.cx] = [y, x]; const t = change ? this.wordEnd() : this.wordForward(); [this.cy, this.cx] = save; ({ y, x } = t); if (change) x++; }
          if (y > this.cy && !change) { y = this.cy; x = this.lines[this.cy].length; }
          target = { y, x };
        } else if (k === "e") { let y = this.cy, x = this.cx; for (let i = 0; i < cnt; i++) { const s = [this.cy, this.cx]; [this.cy, this.cx] = [y, x]; ({ y, x } = this.wordEnd()); [this.cy, this.cx] = s; } target = { y, x: x + 1 }; }
        else if (k === "b") { let y = this.cy, x = this.cx; for (let i = 0; i < cnt; i++) { const s = [this.cy, this.cx]; [this.cy, this.cx] = [y, x]; ({ y, x } = this.wordBack()); [this.cy, this.cx] = s; } target = { y, x }; }
        else if (k === "$") target = { y: this.cy, x: line.length };
        else if (k === "0") target = { y: this.cy, x: 0 };
        else if (k === "^") target = { y: this.cy, x: line.match(/^\s*/)[0].length };
        else if (k === "j" || k === "ArrowDown") { target = { y: Math.min(this.lines.length - 1, this.cy + cnt), x: 0 }; linewise = true; }
        else if (k === "k" || k === "ArrowUp") { target = { y: Math.max(0, this.cy - cnt), x: 0 }; linewise = true; }
        else if (k === "G") { target = { y: this.lines.length - 1, x: 0 }; linewise = true; }
        else if (k === "l" || k === "ArrowRight") target = { y: this.cy, x: Math.min(line.length, this.cx + cnt) };
        else if (k === "h" || k === "ArrowLeft") target = { y: this.cy, x: Math.max(0, this.cx - cnt) };
        if (!target) return;
        if (!yank) this.snapshot();
        if (linewise) this.deleteRange(this.cy, 0, target.y, 0, true, yank);
        else this.deleteRange(this.cy, this.cx, target.y, target.x + (inclusive ? 1 : 0), false, yank);
        if (yank) { /* cursor stays */ } else this.modified = true;
        if (change) { this.mode = "insert"; this.msg = "-- INSERT --"; this.cx = Math.min(this.cx, this.lines[this.cy].length); if (k === "$" || k === "w" || k === "e") this.cx = target.x <= this.lines[this.cy].length ? this.cx : this.lines[this.cy].length; }
        return;
      }

      const cnt = n();
      switch (k) {
        case "h": case "ArrowLeft": case "Backspace": this.cx = Math.max(0, this.cx - cnt); break;
        case "l": case "ArrowRight": case " ": this.cx = Math.min(Math.max(0, line.length - 1), this.cx + cnt); break;
        case "j": case "ArrowDown": case "Enter": this.cy = Math.min(this.lines.length - 1, this.cy + cnt); if (k === "Enter") this.firstNonBlank(); else this.clampX(); break;
        case "k": case "ArrowUp": this.cy = Math.max(0, this.cy - cnt); this.clampX(); break;
        case "0": case "Home": this.cx = 0; break;
        case "^": this.firstNonBlank(); break;
        case "$": case "End": this.cx = Math.max(0, line.length - 1); break;
        case "w": for (let i = 0; i < cnt; i++) { const t = this.wordForward(); this.cy = t.y; this.cx = t.x; } this.clampX(); break;
        case "b": for (let i = 0; i < cnt; i++) { const t = this.wordBack(); this.cy = t.y; this.cx = t.x; } break;
        case "e": for (let i = 0; i < cnt; i++) { const t = this.wordEnd(); this.cy = t.y; this.cx = t.x; } break;
        case "G": this.cy = this.count ? cnt - 1 : this.lines.length - 1; this.clampY(); this.firstNonBlank(); break;
        case "g": this.op = "g"; return;
        case "r": this.op = "r"; this.opCount = this.count; this.count = ""; return;
        case "Z": this.op = "Z"; return;
        case "d": case "y": case "c": this.op = k; this.opCount = this.count; this.count = ""; return;
        case "Ctrl+d": this.cy = Math.min(this.lines.length - 1, this.cy + Math.floor(this.rows / 2)); this.top = Math.min(Math.max(0, this.lines.length - this.rows), this.top + Math.floor(this.rows / 2)); this.firstNonBlank(); break;
        case "Ctrl+u": this.cy = Math.max(0, this.cy - Math.floor(this.rows / 2)); this.top = Math.max(0, this.top - Math.floor(this.rows / 2)); this.firstNonBlank(); break;
        case "Ctrl+f": case "PageDown": this.cy = Math.min(this.lines.length - 1, this.cy + this.rows - 2); this.firstNonBlank(); break;
        case "Ctrl+b": case "PageUp": this.cy = Math.max(0, this.cy - this.rows + 2); this.firstNonBlank(); break;
        case "x": case "Delete": if (line.length) { this.snapshot(); this.deleteRange(this.cy, this.cx, this.cy, Math.min(line.length, this.cx + cnt), false); this.modified = true; } break;
        case "X": if (this.cx > 0) { this.snapshot(); const from = Math.max(0, this.cx - cnt); this.deleteRange(this.cy, from, this.cy, this.cx, false); this.modified = true; } break;
        case "D": this.snapshot(); this.deleteRange(this.cy, this.cx, this.cy, line.length, false); this.cx = Math.max(0, this.lines[this.cy].length - 1); this.modified = true; break;
        case "C": this.snapshot(); this.deleteRange(this.cy, this.cx, this.cy, line.length, false); this.cx = this.lines[this.cy].length; this.mode = "insert"; this.msg = "-- INSERT --"; this.modified = true; break;
        case "Y": this.deleteRange(this.cy, 0, Math.min(this.lines.length - 1, this.cy + cnt - 1), 0, true, true); break;
        case "J": if (this.cy < this.lines.length - 1) { this.snapshot(); const nx = this.lines[this.cy + 1].replace(/^\s+/, ""); this.cx = this.lines[this.cy].length; this.lines.splice(this.cy, 2, this.lines[this.cy] + (nx ? " " + nx : "")); this.modified = true; } break;
        case "p": for (let i = 0; i < cnt; i++) this.put(false); break;
        case "P": for (let i = 0; i < cnt; i++) this.put(true); break;
        case "u": if (this.undo.length) { this.redo.push({ lines: [...this.lines], cy: this.cy, cx: this.cx }); const s = this.undo.pop(); this.lines = s.lines; this.cy = s.cy; this.cx = s.cx; this.clampY(); this.clampX(); this.modified = this.undo.length > 0 || this.writes.length > 0; this.msg = "1 change; before #" + (this.undo.length + 1); } else this.msg = "Already at oldest change"; break;
        case "Ctrl+r": if (this.redo.length) { this.undo.push({ lines: [...this.lines], cy: this.cy, cx: this.cx }); const s = this.redo.pop(); this.lines = s.lines; this.cy = s.cy; this.cx = s.cx; this.modified = true; this.msg = "1 change; after #" + this.undo.length; } else this.msg = "Already at newest change"; break;
        case "i": case "a": case "o": case "O": case "I": case "A": this.startInsert(k); break;
        case "s": this.snapshot(); if (line.length) this.deleteRange(this.cy, this.cx, this.cy, Math.min(line.length, this.cx + cnt), false); this.mode = "insert"; this.msg = "-- INSERT --"; this.modified = true; break;
        case "n": case "N": if (this.search) { for (let i = 0; i < cnt; i++) this.doSearch(this.search.term, k === "n" ? this.search.dir : -this.search.dir); } else this.msg = "E35: No previous regular expression"; break;
        case ":": case "/": case "?": this.mode = "cmdline"; this.cmd = { prefix: k, text: "" }; this.msg = ""; break;
        default: break;
      }
      reset();
    }

    cmdKey(k) {
      const c = this.cmd;
      if (k === "Escape") { this.mode = "normal"; this.cmd = null; this.msg = ""; return; }
      if (k === "Backspace") { if (!c.text) { this.mode = "normal"; this.cmd = null; return; } c.text = c.text.slice(0, -1); return; }
      if (k === "Enter") {
        this.mode = "normal"; this.cmd = null;
        if (c.prefix === ":") return this.ex(c.text.trim());
        const term = c.text || (this.search && this.search.term);
        if (!term) { this.msg = "E35: No previous regular expression"; return; }
        this.search = { term, dir: c.prefix === "/" ? 1 : -1 };
        this.exUsed.push(c.prefix + term);
        this.doSearch(term, this.search.dir);
        return;
      }
      if (k.length === 1) c.text += k;
    }

    /* ------------------------------------------------------------ ex commands */
    ex(cmd) {
      this.exUsed.push(":" + cmd);
      if (!cmd) return;
      let m;
      if (/^\d+$/.test(cmd)) { this.cy = Math.min(this.lines.length, Math.max(1, +cmd)) - 1; this.firstNonBlank(); return; }
      if (cmd === "$") { this.cy = this.lines.length - 1; this.firstNonBlank(); return; }
      if ((m = cmd.match(/^set?\s+(.+)$/))) {
        for (const opt of m[1].split(/\s+/)) {
          if (opt === "number" || opt === "nu") this.number = true;
          else if (opt === "nonumber" || opt === "nonu") this.number = false;
          else if (opt === "number!" || opt === "nu!" || opt === "invnumber") this.number = !this.number;
          else if (/^(ff|fileformat)=(unix|dos)$/.test(opt)) { const f = opt.split("=")[1]; if (f !== this.ff) { this.ff = f; this.modified = true; } }
          else if (/^(ff|fileformat)\??$/.test(opt)) this.msg = `  fileformat=${this.ff}`;
          else { this.msg = `E518: Unknown option: ${opt}`; return; }
        }
        return;
      }
      if ((m = cmd.match(/^(%|\d+(?:,\d+)?)?s(.)(.*?)\2(.*?)(?:\2([gi]*))?$/))) {
        const [, range, , pat, rep, flags = ""] = m;
        let y1 = this.cy, y2 = this.cy;
        if (range === "%") { y1 = 0; y2 = this.lines.length - 1; }
        else if (range) { const [a, b] = range.split(",").map(Number); y1 = a - 1; y2 = (b || a) - 1; }
        let re;
        try { re = new RegExp(LPIC.toJsRegex(pat, false), (flags.includes("g") ? "g" : "") + (flags.includes("i") ? "i" : "")); } catch { this.msg = "E486: Pattern not found: " + pat; return; }
        const repl = rep.replace(/\$/g, "$$$$").replace(/\\(\d)/g, "$$$1").replace(/(^|[^\\])&/g, "$1$$&").replace(/\\&/g, "&");
        this.snapshot();
        let changed = 0, last = this.cy;
        for (let y = y1; y <= y2 && y < this.lines.length; y++) { const before = this.lines[y]; this.lines[y] = before.replace(re, repl); if (this.lines[y] !== before) { changed++; last = y; } }
        if (!changed) { this.undo.pop(); this.msg = "E486: Pattern not found: " + pat; return; }
        this.cy = last; this.firstNonBlank(); this.modified = true;
        if (changed > 2) this.msg = `${changed} substitutions on ${changed} lines`;
        return;
      }
      if ((m = cmd.match(/^r(?:ead)?\s+(\S+)$/))) {
        const content = this.readFile ? this.readFile(m[1]) : null;
        if (content === null) { this.msg = `E484: Can't open file ${m[1]}`; return; }
        this.snapshot();
        const add = content.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n");
        if (this.lines.length === 1 && this.lines[0] === "" && this.isNew && !this.modified) { this.lines.splice(1, 0, ...add); this.cy = 1; }
        else { this.lines.splice(this.cy + 1, 0, ...add); this.cy++; }
        this.firstNonBlank(); this.modified = true;
        this.msg = `"${m[1]}" ${add.length}L, ${bytesOf(content)}B`;
        return;
      }
      if ((m = cmd.match(/^(w|write|wq|x|xit|exit)(!?)(?:\s+(\S+))?$/))) {
        const [, c, bang, file] = m;
        const isWq = c === "wq" || c === "x" || c === "xit" || c === "exit";
        if ((c === "x" || c === "xit" || c === "exit") && !this.modified && !file && !this.isNew) { this.quit = { forced: false }; return; }
        const target = file || this.path;
        const res = this.writeFile(target, this.text(), { other: !!file && file !== this.path, bang: !!bang });
        if (res.error) { this.msg = res.error; return; }
        this.writes.push(target);
        if (!file || file === this.path) { this.modified = false; this.isNew = false; this.saved = true; }
        const L = this.lines.length, B = bytesOf(this.text());
        this.msg = `"${target}" ${res.created ? "[New] " : ""}${this.ff === "dos" ? "[dos] " : ""}${L}L, ${B}B written`;
        if (isWq) this.quit = { forced: !!bang };
        return;
      }
      if ((m = cmd.match(/^(q|quit|qa|qall)(!?)$/))) {
        if (this.modified && !m[2]) { this.msg = "E37: No write since last change (add ! to override)"; return; }
        this.quit = { forced: !!m[2] };
        return;
      }
      if (cmd === "e!" || cmd === "edit!") {
        const content = this.readFile(this.path);
        if (content !== null) { const fresh = new ViModel(content, { path: this.path, rows: this.rows }); this.lines = fresh.lines; this.ff = fresh.ff; this.modified = false; this.cy = 0; this.cx = 0; this.msg = fresh.msg; }
        return;
      }
      if (cmd === "help" || cmd === "h") { this.msg = "Help isn't available here. Try :q to quit, :wq to save and quit."; return; }
      this.msg = `E492: Not an editor command: ${cmd}`;
    }
  }

  /* ================================================================ UI */
  const KEYMAP = { Esc: "Escape" };
  function normaliseKey(e) {
    if (e.ctrlKey && /^[a-z]$/i.test(e.key)) return "Ctrl+" + e.key.toLowerCase();
    if (e.key === "Esc") return "Escape";
    return e.key;
  }

  LPIC.openEditor = function ({ kind, path, shell, panel, onEvent, onClose }) {
    const abs = shell.abs(path);
    const node = shell.vfs.get(abs);
    if (node && node.type === "dir") { onClose([{ text: `"${path}" is a directory`, cls: "terminal-error" }]); return; }
    const parent = shell.vfs.get(abs.replace(/\/[^/]*$/, "") || "/");
    const isNew = !node;
    const text = node ? node.content || "" : "";

    const writeFile = (target, content, o) => {
      const tAbs = shell.abs(target);
      const existing = shell.vfs.get(tAbs);
      const dir = shell.vfs.get(tAbs.replace(/\/[^/]*$/, "") || "/");
      if (!dir) return { error: `"${target}" E212: Can't open file for writing` };
      if (existing && o.other && !o.bang) return { error: "E13: File exists (add ! to override)" };
      shell.vfs.write(tAbs, content);
      onEvent({ type: "editor-save", kind, path: tAbs });
      return { created: !existing };
    };
    const readFile = (p) => { const n = shell.vfs.get(shell.abs(p)); return n && n.type === "file" ? n.content : null; };

    const wrap = document.createElement("div");
    wrap.className = "editor " + kind;
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-label", kind === "vi" ? "vi editor" : "nano editor");
    panel.append(wrap);
    const close = (lines) => { wrap.remove(); onClose(lines || []); };

    if (kind === "nano") return openNano();
    return openVi();

    /* ------------------------------------------------------------ vi UI */
    function openVi() {
      const rows = window.matchMedia("(max-width: 600px)").matches ? 11 : 16;
      const vi = new ViModel(parent || node ? text : text, { path, isNew, rows });
      if (!parent && isNew) vi.msg = `"${path}" [New DIRECTORY]`;
      vi.writeFile = writeFile; vi.readFile = readFile;
      let ctrl = false;
      wrap.innerHTML = `
        <div class="vi-screen" aria-live="polite"></div>
        <div class="vi-status"></div>
        <textarea class="vi-input" aria-label="vi keyboard input" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false"></textarea>
        <div class="vi-keys">
          <button type="button" data-k="Escape">Esc</button><button type="button" data-k="ctrl" class="vi-ctrl">Ctrl</button>
          <button type="button" data-k=":">:</button><button type="button" data-k="/">/</button><button type="button" data-k="Enter">⏎</button>
          <button type="button" data-k="ArrowLeft">←</button><button type="button" data-k="ArrowDown">↓</button><button type="button" data-k="ArrowUp">↑</button><button type="button" data-k="ArrowRight">→</button>
          <button type="button" data-k="i">i</button><button type="button" data-k="x">x</button><button type="button" data-k="u">u</button>
        </div>`;
      const screen = wrap.querySelector(".vi-screen"), status = wrap.querySelector(".vi-status"), input = wrap.querySelector(".vi-input");
      const render = () => {
        vi.scroll();
        const w = String(vi.lines.length).length;
        const html = [];
        for (let r = 0; r < vi.rows; r++) {
          const y = vi.top + r;
          if (y >= vi.lines.length) { html.push(`<div class="vi-line tilde">~</div>`); continue; }
          const line = vi.lines[y].replace(/\t/g, "    ");
          const num = vi.number ? `<span class="vi-num">${String(y + 1).padStart(Math.max(3, w))} </span>` : "";
          let body;
          if (y === vi.cy && vi.mode !== "cmdline") {
            const cx = Math.min(vi.cx, line.length);
            body = esc(line.slice(0, cx)) + `<span class="vi-cursor${vi.mode === "insert" ? " ins" : ""}">${esc(line[cx] || " ")}</span>` + esc(line.slice(cx + 1));
          } else body = esc(line) || "&nbsp;";
          html.push(`<div class="vi-line">${num}${body}</div>`);
        }
        screen.innerHTML = html.join("");
        const left = vi.mode === "cmdline" ? esc(vi.cmd.prefix + vi.cmd.text) + `<span class="vi-cursor ins"> </span>` : esc(vi.msg || "");
        const pos = vi.lines.length <= vi.rows ? "All" : vi.top === 0 ? "Top" : vi.top + vi.rows >= vi.lines.length ? "Bot" : Math.round((vi.top / (vi.lines.length - vi.rows)) * 100) + "%";
        status.innerHTML = `<span class="${/^E\d+/.test(vi.msg || "") && vi.mode !== "cmdline" ? "vi-err" : ""}">${left}</span><span>${vi.cy + 1},${vi.lines[vi.cy] ? vi.cx + 1 : "0-1"}${" ".repeat(6)}${pos}</span>`;
        wrap.querySelector(".vi-ctrl").classList.toggle("on", ctrl);
      };
      const press = (k) => {
        if (ctrl && k.length === 1) { k = "Ctrl+" + k.toLowerCase(); ctrl = false; }
        vi.key(k);
        if (vi.mode === "normal" && k === "Escape") onEvent({ type: "vi-key", key: "Escape" });
        if (vi.quit) return finish();
        render();
      };
      const finish = () => {
        onEvent({ type: "editor-quit", kind: "vi", path: shell.abs(path), saved: vi.saved ? "yes" : "no", forced: vi.quit.forced ? "yes" : "no",
          keys: [...vi.keysUsed].join(" "), ex: vi.exUsed.join("\n"), number: vi.number ? "yes" : "no" });
        close([]);
      };
      input.addEventListener("keydown", (e) => {
        if (e.isComposing || e.key === "Unidentified" || e.key === "Process") return;
        if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(e.key)) return;
        e.preventDefault();
        press(normaliseKey(e));
      });
      input.addEventListener("input", () => { const v = input.value; input.value = ""; for (const ch of v) press(ch === "\n" ? "Enter" : ch); });
      wrap.querySelectorAll(".vi-keys button").forEach((b) => {
        b.addEventListener("mousedown", (e) => e.preventDefault());
        b.addEventListener("click", () => { if (b.dataset.k === "ctrl") { ctrl = !ctrl; render(); } else press(b.dataset.k); input.focus({ preventScroll: true }); });
      });
      screen.addEventListener("click", () => input.focus({ preventScroll: true }));
      // Fit the number of text rows to the space the editor really has.
      render();
      const lineH = screen.querySelector(".vi-line")?.offsetHeight || 18;
      const fit = Math.max(6, Math.floor((screen.clientHeight - 8) / lineH));
      if (fit !== vi.rows) { vi.rows = fit; vi.top = Math.max(0, Math.min(vi.top, vi.lines.length - fit)); }
      render();
      input.focus({ preventScroll: true });
      onEvent({ type: "editor-open", kind: "vi", path: shell.abs(path) });
      return { model: vi, press };
    }

    /* ------------------------------------------------------------ nano UI */
    function openNano() {
      const dos = /\r\n/.test(text);
      wrap.innerHTML = `
        <div class="nano-head"><span>GNU nano 7.2</span><span class="nano-name">${esc(path)}</span><span class="nano-mod"></span></div>
        <textarea class="nano-area" spellcheck="false" autocapitalize="off" autocorrect="off" aria-label="File contents"></textarea>
        <div class="nano-msg" aria-live="polite"></div>
        <form class="nano-prompt" hidden><label></label><input type="text" spellcheck="false" autocapitalize="off" autocorrect="off"></form>
        <div class="nano-keys">
          <button type="button" data-k="o"><b>^O</b> Write Out</button><button type="button" data-k="x"><b>^X</b> Exit</button>
          <button type="button" data-k="k"><b>^K</b> Cut</button><button type="button" data-k="u"><b>^U</b> Paste</button>
          <button type="button" data-k="w"><b>^W</b> Where Is</button><button type="button" data-k="c"><b>^C</b> Location</button>
        </div>`;
      const area = wrap.querySelector(".nano-area"), msg = wrap.querySelector(".nano-msg"), form = wrap.querySelector(".nano-prompt");
      const label = form.querySelector("label"), pin = form.querySelector("input"), mod = wrap.querySelector(".nano-mod");
      area.value = dos ? text.replace(/\r\n/g, "\n") : text;
      let modified = false, saved = false, cutBuf = null, name = path, pending = null;
      const say = (t) => { msg.textContent = t ? `[ ${t} ]` : ""; };
      say(isNew ? "New File" : `Read ${area.value.split("\n").length - (area.value.endsWith("\n") ? 1 : 0)} lines${dos ? " (Converted from DOS format)" : ""}`);
      area.addEventListener("input", () => { modified = true; mod.textContent = "Modified"; });
      const content = () => { let v = area.value; if (v && !v.endsWith("\n")) v += "\n"; return v; };
      const ask = (q, dflt, then) => { label.textContent = q; pin.value = dflt; form.hidden = false; pending = then; pin.focus(); };
      form.addEventListener("submit", (e) => { e.preventDefault(); const v = pin.value; form.hidden = true; const t = pending; pending = null; area.focus(); t && t(v); });
      pin.addEventListener("keydown", (e) => { if ((e.ctrlKey && e.key.toLowerCase() === "c") || e.key === "Escape") { e.preventDefault(); form.hidden = true; pending = null; say("Cancelled"); area.focus(); } });
      const write = (target, after) => {
        const r = writeFile(target, content(), { other: target !== path, bang: true });
        if (r.error) { say("Error writing " + target + ": No such file or directory"); return; }
        name = target; modified = false; saved = true; mod.textContent = "";
        const n = content().split("\n").length - 1;
        say(`Wrote ${n} line${n === 1 ? "" : "s"}`);
        wrap.querySelector(".nano-name").textContent = target;
        after && after();
      };
      const exit = () => { onEvent({ type: "editor-quit", kind: "nano", path: shell.abs(name), saved: saved ? "yes" : "no", forced: "no", keys: "", ex: "" }); close([]); };
      const cmd = (k) => {
        if (k === "o") ask("File Name to Write: ", name, (v) => v && write(v));
        else if (k === "x") {
          if (!modified) return exit();
          ask("Save modified buffer?  (Y Yes · N No · ^C Cancel) ", "", (v) => {
            if (/^y/i.test(v)) ask("File Name to Write: ", name, (f) => f && write(f, exit));
            else if (/^n/i.test(v)) exit();
            else say("Cancelled");
          });
        } else if (k === "k") {
          const s = area.selectionStart, v = area.value, a = v.lastIndexOf("\n", s - 1) + 1, b0 = v.indexOf("\n", s), b = b0 < 0 ? v.length : b0 + 1;
          cutBuf = v.slice(a, b); area.value = v.slice(0, a) + v.slice(b); area.selectionStart = area.selectionEnd = a; modified = true; mod.textContent = "Modified";
        } else if (k === "u") {
          if (cutBuf === null) return;
          const s = area.selectionStart, v = area.value, a = v.lastIndexOf("\n", s - 1) + 1;
          area.value = v.slice(0, a) + cutBuf + v.slice(a); area.selectionStart = area.selectionEnd = a + cutBuf.length; modified = true; mod.textContent = "Modified";
        } else if (k === "w") ask("Search: ", "", (t) => { if (!t) return; const at = area.value.indexOf(t, area.selectionEnd); const i = at >= 0 ? at : area.value.indexOf(t); if (i < 0) say(`"${t}" not found`); else { area.setSelectionRange(i, i + t.length); say(at < 0 ? "Search Wrapped" : ""); } });
        else if (k === "c") { const before = area.value.slice(0, area.selectionStart); const ln = before.split("\n").length, col = before.length - before.lastIndexOf("\n"); say(`line ${ln}/${area.value.split("\n").length}, col ${col}`); }
        area.focus();
      };
      wrap.addEventListener("keydown", (e) => { if (e.ctrlKey && /^[oxkuwc]$/i.test(e.key) && e.target === area) { e.preventDefault(); cmd(e.key.toLowerCase()); } });
      wrap.querySelectorAll(".nano-keys button").forEach((b) => { b.addEventListener("mousedown", (e) => e.preventDefault()); b.addEventListener("click", () => cmd(b.dataset.k)); });
      area.focus();
      onEvent({ type: "editor-open", kind: "nano", path: shell.abs(path) });
      return { cmd };
    }
  };

  LPIC.ViModel = ViModel;

  /* ================================================================ shell commands */
  const C = LPIC.Shell.commands;
  const { EXTERNAL } = LPIC.shellUtil;
  Object.assign(EXTERNAL, { vi: "/usr/bin/vi", vim: "/usr/bin/vim", view: "/usr/bin/view", nano: "/usr/bin/nano", readlink: "/usr/bin/readlink", "vim.basic": "/usr/bin/vim.basic" });
  // Mint installs vim through the alternatives system, so vi is a chain of symbolic links.
  const LINKS = {
    "/usr/bin/vi": "/etc/alternatives/vi", "/etc/alternatives/vi": "/usr/bin/vim.basic",
    "/usr/bin/vim": "/etc/alternatives/vim", "/etc/alternatives/vim": "/usr/bin/vim.basic",
    "/usr/bin/view": "/etc/alternatives/view", "/etc/alternatives/view": "/usr/bin/vim.basic",
    "/usr/bin/editor": "/etc/alternatives/editor", "/etc/alternatives/editor": "/bin/nano",
    "/bin": "usr/bin", "/lib": "usr/lib", "/sbin": "usr/sbin",
  };
  LPIC.symlinks = Object.assign(LPIC.symlinks || {}, LINKS);
  const openIn = (kind) => function (args, stdin, res) {
    const files = args.filter((a) => !a.startsWith("-") && !a.startsWith("+"));
    if (!files.length) return { stderr: `${kind === "nano" ? "nano" : "vi"}: give a file name, for example: ${kind === "nano" ? "nano" : "vi"} notes.txt`, status: 1 };
    res.editor = { kind, path: files[0] };
    res.events.push({ type: "editor-start", kind, path: this.abs(files[0]) });
    return {};
  };
  C.vi = openIn("vi"); C.vim = openIn("vi"); C.view = openIn("vi"); C["vim.basic"] = openIn("vi");
  C.nano = openIn("nano"); C.pico = openIn("nano");
  C.emacs = function () { return { stderr: "Command 'emacs' not found, but can be installed with:\nsudo apt install emacs-gtk  # version 1:29.3+1-1ubuntu2, or\nsudo apt install emacs-nox  # version 1:29.3+1-1ubuntu2\n(emacs saves with Ctrl+X Ctrl+S and exits with Ctrl+X Ctrl+C.)", status: 127 }; };
  C.readlink = function (args) {
    // Plain readlink prints one link's target; -f follows every link to the real path (-e also requires it to exist).
    const full = args.some((a) => /^-[a-z]*[fem]/.test(a) || a === "--canonicalize");
    const mustExist = args.some((a) => /^-[a-z]*e/.test(a));
    const files = args.filter((a) => !a.startsWith("-"));
    const out = [];
    let status = 0;
    for (const f of files) {
      const abs = this.abs(f);
      if (!full) { const n = this.vfs.lget(abs); if (n && n.type === "link") out.push(n.target); else status = 1; continue; }
      const w = this.vfs.walk(abs, true);
      if (mustExist && !w.node) { status = 1; continue; }
      out.push(w.real);
    }
    return { stdout: out.length ? out.join("\n") + "\n" : "", status };
  };
})();
