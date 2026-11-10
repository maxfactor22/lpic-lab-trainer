/* LPIC-1 Lab Trainer: simulated Bash shell with a small virtual filesystem.
   It is not a real shell. It supports what the lessons teach: quoting, variables,
   ~, {a,b} and * ? globbing, ; && || |, > >> 2> 2>> &> <, $(...), and history
   expansion (!! !N !-N). Commands it doesn't know say so clearly. */
(function () {
  "use strict";
  const LPIC = window.LPIC;

  /* ------------------------------------------------------------------ VFS */

  class VFS {
    constructor() { this.root = { type: "dir", children: {}, mtime: Date.now() }; }

    static split(path) { return path.split("/").filter(Boolean); }

    resolve(path, cwd) {
      const parts = path.startsWith("/") ? [] : VFS.split(cwd);
      for (const p of VFS.split(path)) {
        if (p === ".") continue;
        if (p === "..") parts.pop(); else parts.push(p);
      }
      return "/" + parts.join("/");
    }

    get(abs) {
      let node = this.root;
      for (const p of VFS.split(abs)) {
        if (!node || node.type !== "dir") return null;
        node = node.children[p];
      }
      return node || null;
    }

    parentOf(abs) {
      const parts = VFS.split(abs);
      const name = parts.pop();
      return { dir: this.get("/" + parts.join("/")), name };
    }

    mkdirp(abs) {
      let node = this.root;
      for (const p of VFS.split(abs)) {
        if (!node.children[p]) node.children[p] = { type: "dir", children: {}, mtime: Date.now() };
        node = node.children[p];
        if (node.type !== "dir") throw new Error("Not a directory");
      }
      return node;
    }

    write(abs, content, append = false) {
      const { dir, name } = this.parentOf(abs);
      if (!dir || dir.type !== "dir") throw new Error("No such file or directory");
      const cur = dir.children[name];
      if (cur && cur.type === "dir") throw new Error("Is a directory");
      if (cur && append) cur.content += content;
      else dir.children[name] = { type: "file", content, mtime: Date.now() };
      dir.children[name].mtime = Date.now();
    }

    remove(abs) {
      const { dir, name } = this.parentOf(abs);
      if (dir?.children[name]) delete dir.children[name];
    }
  }

  /* ------------------------------------------------- reference data */

  const BUILTINS = new Set(["cd", "pwd", "echo", "history", "help", "type", "exit", "export", "alias", "unalias",
    "set", "unset", "source", ".", "read", "printf", "test", "[", "true", "false", "jobs", "fg", "bg", "kill",
    "umask", "wait", "times", "hash", "enable", "shopt", "declare", "let", "local", "logout", "builtin", "command"]);
  const KEYWORDS = new Set(["if", "then", "else", "elif", "fi", "for", "while", "until", "do", "done", "case", "esac", "function", "time", "[[", "]]", "!", "{", "}"]);
  /* Builtins that also exist as programs on disk, so `which` finds them. */
  const ALSO_EXTERNAL = new Set(["echo", "pwd", "printf", "test", "[", "true", "false", "kill"]);
  const EXTERNAL = {
    uname: "/usr/bin/uname", ls: "/usr/bin/ls", cat: "/usr/bin/cat", which: "/usr/bin/which", man: "/usr/bin/man",
    info: "/usr/bin/info", bash: "/usr/bin/bash", date: "/usr/bin/date", mkdir: "/usr/bin/mkdir", touch: "/usr/bin/touch",
    rm: "/usr/bin/rm", cp: "/usr/bin/cp", mv: "/usr/bin/mv", head: "/usr/bin/head", tail: "/usr/bin/tail",
    wc: "/usr/bin/wc", grep: "/usr/bin/grep", whoami: "/usr/bin/whoami", hostname: "/usr/bin/hostname",
    nano: "/usr/bin/nano", vi: "/usr/bin/vi", less: "/usr/bin/less", clear: "/usr/bin/clear", sleep: "/usr/bin/sleep",
    whatis: "/usr/bin/whatis", uniq: "/usr/bin/uniq", nl: "/usr/bin/nl", more: "/usr/bin/more",
    md5sum: "/usr/bin/md5sum", sha1sum: "/usr/bin/sha1sum", sha256sum: "/usr/bin/sha256sum", sha512sum: "/usr/bin/sha512sum", apropos: "/usr/bin/apropos", sort: "/usr/bin/sort", rmdir: "/usr/bin/rmdir",
    echo: "/usr/bin/echo", pwd: "/usr/bin/pwd", printf: "/usr/bin/printf", test: "/usr/bin/test", "[": "/usr/bin/[",
    true: "/usr/bin/true", false: "/usr/bin/false", kill: "/usr/bin/kill", sudo: "/usr/bin/sudo",
  };
  const ALIASES = { ls: "ls --color=auto", grep: "grep --color=auto", ll: "ls -alF", la: "ls -A", l: "ls -CF" };

  const PASSWD = [
    "root:x:0:0:root:/root:/bin/bash", "daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin", "bin:x:2:2:bin:/bin:/usr/sbin/nologin",
    "sys:x:3:3:sys:/dev:/usr/sbin/nologin", "sync:x:4:65534:sync:/bin:/bin/sync", "games:x:5:60:games:/usr/games:/usr/sbin/nologin",
    "man:x:6:12:man:/var/cache/man:/usr/sbin/nologin", "lp:x:7:7:lp:/var/spool/lpd:/usr/sbin/nologin", "mail:x:8:8:mail:/var/mail:/usr/sbin/nologin",
    "news:x:9:9:news:/var/spool/news:/usr/sbin/nologin", "www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin", "backup:x:34:34:backup:/var/backups:/usr/sbin/nologin",
    "nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin", "systemd-network:x:998:998:systemd Network Management:/:/usr/sbin/nologin",
    "messagebus:x:100:102::/nonexistent:/usr/sbin/nologin", "syslog:x:102:104::/nonexistent:/usr/sbin/nologin", "avahi:x:105:110:Avahi mDNS daemon,,,:/run/avahi-daemon:/usr/sbin/nologin",
    "lightdm:x:113:119:Light Display Manager:/var/lib/lightdm:/bin/false", "max:x:1000:1000:Max,,,:/home/max:/bin/bash",
  ].join("\n") + "\n";
  const GROUP = ["root:x:0:", "adm:x:4:syslog,max", "cdrom:x:24:max", "sudo:x:27:max", "dip:x:30:max", "plugdev:x:46:max", "users:x:100:", "lpadmin:x:120:max", "max:x:1000:"].join("\n") + "\n";

  const DEFAULT_CANNED = {
    "uname": "Linux",
    "uname -s": "Linux",
    "uname -n": "linux-mint",
    "uname -r": "6.8.0-44-generic",
    "uname -v": "#44-Ubuntu SMP PREEMPT_DYNAMIC Thu Aug 22 13:54:21 UTC 2026",
    "uname -m": "x86_64",
    "uname -o": "GNU/Linux",
    "uname -a": "Linux linux-mint 6.8.0-44-generic #44-Ubuntu SMP PREEMPT_DYNAMIC Thu Aug 22 13:54:21 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux",
    "uname --all": "Linux linux-mint 6.8.0-44-generic #44-Ubuntu SMP PREEMPT_DYNAMIC Thu Aug 22 13:54:21 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux",
    "uname --kernel-release": "6.8.0-44-generic",
    "uname --kernel-name": "Linux",
    "uname --kernel-version": "#44-Ubuntu SMP PREEMPT_DYNAMIC Thu Aug 22 13:54:21 UTC 2026",
    "bash --version":
      "GNU bash, version 5.2.21(1)-release (x86_64-pc-linux-gnu)\nCopyright (C) 2022 Free Software Foundation, Inc.\n" +
      "License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>\n\n" +
      "This is free software; you are free to change and redistribute it.\nThere is NO WARRANTY, to the extent permitted by law.",
    "hostname": "linux-mint",
  };

  /* --------------------------------------------------------------- Shell */

  class Shell {
    /* opts: { user, host, cwd, files, canned, history, docs, unsupported } */
    constructor(opts = {}) {
      this.user = opts.user || "max";
      this.host = opts.host || "linux-mint";
      this.home = "/home/" + this.user;
      this.vfs = new VFS();
      this.env = { HOME: this.home, USER: this.user, LOGNAME: this.user, SHELL: "/bin/bash", HOSTNAME: this.host,
        PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin", LANG: "en_US.UTF-8", TERM: "xterm-256color", BASH_VERSION: "5.2.21(1)-release" };
      this.canned = { ...DEFAULT_CANNED, ...(opts.canned || {}) };
      this.docs = opts.docs || LPIC.docs || {};
      this.unsupported = opts.unsupported || null;
      // batch: behave like "bash -c" (no history expansion, output not a terminal). Used by tools/tests.
      this.batch = !!opts.batch;
      this.hashed = new Set();
      this.history = [...(opts.history || [])];
      this.lastStatus = 0;

      // Base system tree.
      ["/etc", "/etc/ssh", "/etc/default", "/usr/bin", "/usr/sbin", "/usr/lib", "/usr/local/bin", "/usr/share/doc", "/usr/share/man/man1", "/var/log", "/var/lib", "/var/cache", "/var/spool", "/var/tmp", "/tmp", "/dev", "/proc", "/sys", "/run", "/boot", "/opt", "/srv", "/root", "/media", "/mnt", "/home", "/lib", "/bin", "/sbin"]
        .forEach((d) => this.vfs.mkdirp(d));
      this.vfs.write("/etc/hostname", this.host + "\n");
      this.vfs.write("/dev/null", "");
      this.vfs.write("/etc/os-release", 'NAME="Linux Mint"\nVERSION="22 (Wilma)"\nID=linuxmint\nID_LIKE="ubuntu debian"\n');
      this.vfs.write("/etc/shells", "/bin/sh\n/bin/bash\n/usr/bin/bash\n/bin/dash\n");
      this.vfs.write("/etc/passwd", PASSWD.replace(/\bmax\b/g, this.user));
      this.vfs.write("/etc/group", GROUP.replace(/\bmax\b/g, this.user));
      ["fstab", "hosts", "profile", "bash.bashrc"].forEach((f) => this.vfs.write("/etc/" + f, ""));
      Object.keys(EXTERNAL).forEach((c) => this.vfs.write(EXTERNAL[c], ""));
      this.vfs.mkdirp(this.home);
      this.vfs.write(this.home + "/.bashrc", "# ~/.bashrc: executed by bash(1) for non-login shells.\nHISTSIZE=1000\nHISTFILESIZE=2000\nalias ll='ls -alF'\n");
      this.vfs.write(this.home + "/.profile", "# ~/.profile: executed by the command interpreter for login shells.\n");
      this.vfs.write(this.home + "/.bash_logout", "# ~/.bash_logout: executed by bash(1) when login shell exits.\n");
      this.vfs.write(this.home + "/.bash_history", "");

      // A few system files so find, locate and the FHS lesson have something real to look at.
      const sys = {
        "/etc/ssh/sshd_config": "# sshd configuration\nPort 22\nPermitRootLogin no\n", "/etc/default/grub": "GRUB_DEFAULT=0\nGRUB_TIMEOUT=10\n",
        "/etc/crontab": "# /etc/crontab: system-wide crontab\n", "/etc/updatedb.conf": "PRUNE_BIND_MOUNTS=\"yes\"\nPRUNEPATHS=\"/tmp /var/spool /media /var/lib/os-prober /var/lib/ceph /home/.ecryptfs /var/lib/schroot\"\nPRUNEFS=\"NFS afs autofs binfmt_misc ceph cgroup cifs coda configfs cramfs debugfs devpts devtmpfs ecryptfs fuse proc sysfs tmpfs usbfs\"\n",
        "/var/log/syslog": "Nov  9 08:00:01 linux-mint CRON[812]: (root) CMD (command -v debian-sa1 > /dev/null && debian-sa1 1 1)\n",
        "/var/log/auth.log": "Nov  9 08:02:11 linux-mint sudo:      max : TTY=pts/0 ; PWD=/home/max ; USER=root ; COMMAND=/usr/bin/apt update\n",
        "/var/log/dpkg.log": "2026-11-09 07:55:12 status installed tree:amd64 2.1.1-2\n", "/boot/vmlinuz-6.8.0-44-generic": "", "/boot/initrd.img-6.8.0-44-generic": "",
        "/usr/share/doc/grep/README": "GNU grep\n", "/usr/share/man/man1/grep.1.gz": "", "/usr/share/man/man1/find.1.gz": "", "/usr/local/bin/backup-check": "#!/bin/bash\necho ok\n",
        "/opt/vendor-agent/agent.conf": "interval=60\n", "/srv/www/index.html": "<h1>web01</h1>\n", "/var/spool/cron/.keep": "", "/media/.keep": "", "/mnt/.keep": "",
      };
      for (const [p, c] of Object.entries(sys)) { this.vfs.mkdirp(p.replace(/\/[^/]*$/, "")); if (!this.vfs.get(p)) this.vfs.write(p, c); }

      // Workspace files. A value can be a string, null (a directory), or
      // { content, ageDays } to make the file look older for find -mtime.
      for (const [p, content] of Object.entries(opts.files || {})) {
        const abs = this.vfs.resolve(this.expandTilde(p), this.home);
        if (p.endsWith("/") || content === null) { this.vfs.mkdirp(abs); continue; }
        const text = typeof content === "object" ? content.content || "" : content;
        this.vfs.mkdirp(abs.replace(/\/[^/]*$/, "") || "/");
        this.vfs.write(abs, text);
        // Lab files look as if the setup ran an hour ago, so touch visibly changes the time.
        const t = Date.now() - (typeof content === "object" && content.ageDays ? content.ageDays * 864e5 : 3600e3);
        Object.assign(this.vfs.get(abs), { mtime: t, atime: t, ctime: t });
      }
      this.cwd = this.vfs.resolve(this.expandTilde(opts.cwd || "~"), this.home);
      this.vfs.mkdirp(this.cwd);
      this.env.PWD = this.cwd;
    }

    expandTilde(p) { return p === "~" ? this.home : p.startsWith("~/") ? this.home + p.slice(1) : p; }
    abs(p) { return this.vfs.resolve(this.expandTilde(p), this.cwd); }
    displayCwd() { return this.cwd === this.home ? "~" : this.cwd.startsWith(this.home + "/") ? "~" + this.cwd.slice(this.home.length) : this.cwd; }
    prompt() { return `${this.user}@${this.host}:${this.displayCwd()}$`; }

    /* ----------------------------------------------------------- run a line
       Returns { out: [{text, cls}], events: [], pager, clear, expanded } */
    run(raw) {
      const res = { out: [], events: [], pager: null, clear: false, expanded: null, line: raw };
      let line = raw.replace(/\s+$/, "");
      if (!line.trim()) return res;

      // History expansion (outside single quotes).
      const hx = this.batch ? { line } : this.expandHistory(line);
      if (hx.error) { res.out.push({ text: hx.error, cls: "terminal-error" }); return res; }
      if (hx.changed) { line = hx.line; res.out.push({ text: line, cls: "terminal-muted" }); res.events.push({ type: "history-expand", from: raw.trim(), to: line.trim() }); }
      res.expanded = line.trim();
      if (!/^\s/.test(raw)) this.history.push(line.trim());

      // Here-documents: the engine collects the lines up to the delimiter, so a line can arrive
      // as "cmd <<EOF\nbody...\nEOF". Each body becomes a hidden temp file read with <.
      // Here-strings (<<< word) become a temp file with that word and a newline.
      if (line.includes("\n")) {
        const [first, ...rest] = line.split("\n");
        let cmdLine = first, n = 0;
        const docs = [];
        cmdLine = cmdLine.replace(/<<(-?)\s*(['"]?)([A-Za-z_]\w*)\2/g, (m, dash, q, word) => { docs.push({ word, quoted: !!q, dash: !!dash }); return `< /tmp/.heredoc-${docs.length}`; });
        for (const d of docs) {
          const body = [];
          while (rest.length) {
            let l = rest.shift();
            if (d.dash) l = l.replace(/^\t+/, "");
            if (l.trim() === d.word) break;
            body.push(l);
          }
          let text = body.join("\n") + (body.length ? "\n" : "");
          if (!d.quoted) text = text.replace(/\$\(([^)]*)\)|`([^`]*)`|\$\{(\w+)\}|\$(\w+)/g, (m, c1, c2, v1, v2) => (c1 !== undefined || c2 !== undefined ? this.runCapture(c1 ?? c2).replace(/\n+$/, "") : this.env[v1 || v2] ?? ""));
          this.vfs.write(`/tmp/.heredoc-${++n}`, text);
        }
        line = cmdLine;
      }
      line = line.replace(/<<<\s*('([^']*)'|"([^"]*)"|(\S+))/g, (m, all, a, b, c) => {
        const id = `/tmp/.herestring-${Math.random().toString(36).slice(2, 8)}`;
        const raw = a ?? b ?? c;
        this.vfs.write(id, (a !== undefined ? raw : raw.replace(/\$\{?(\w+)\}?/g, (x, v) => this.env[v] ?? "")) + "\n");
        return `< ${id}`;
      });

      // Split into ; && || lists first, and expand each part only when it runs, so
      // "cmd; echo $?" and "x=1; echo $x" see the results of the earlier commands.
      let lists;
      try { lists = this.splitLists(line); }
      catch (e) { res.out.push({ text: "bash: " + e.message, cls: "terminal-error" }); this.lastStatus = 2; return res; }

      for (const item of lists) {
        if (!item.text.trim()) continue;
        if (item.op === "&&" && this.lastStatus !== 0) continue;
        if (item.op === "||" && this.lastStatus === 0) continue;
        let tokens;
        try { tokens = this.tokenize(item.text); }
        catch (e) { res.out.push({ text: "bash: " + e.message, cls: "terminal-error" }); this.lastStatus = 2; return res; }
        if (!tokens.length) continue;
        const r = this.runPipeline(tokens, res);
        if (r.stdout) res.out.push(...r.stdout.replace(/\n$/, "").split("\n").map((text) => ({ text })));
        if (res.pager || res.clear || res.exit) break;
      }
      return res;
    }

    /* Split a line on ; && || that sit outside quotes, $( ) and backticks. */
    splitLists(line) {
      const parts = [];
      let cur = "", op = null, i = 0, depth = 0, q = null;
      while (i < line.length) {
        const c = line[i];
        if (q) {
          cur += c;
          if (c === "\\" && q === '"' && i + 1 < line.length) { cur += line[++i]; }
          else if (c === q) q = null;
          i++; continue;
        }
        if (c === "\\" && i + 1 < line.length) { cur += c + line[i + 1]; i += 2; continue; }
        if (c === "'" || c === '"' || c === "`") { q = c; cur += c; i++; continue; }
        if (c === "$" && line[i + 1] === "(") { depth++; cur += "$("; i += 2; continue; }
        if (c === "(" && depth) { depth++; cur += c; i++; continue; }
        if (c === ")" && depth) { depth--; cur += c; i++; continue; }
        if (c === "#" && !depth && (i === 0 || /\s/.test(line[i - 1]))) break;
        if (!depth && (line.startsWith("&&", i) || line.startsWith("||", i))) { parts.push({ op, text: cur }); op = line.slice(i, i + 2); cur = ""; i += 2; continue; }
        if (!depth && c === ";") { parts.push({ op, text: cur }); op = ";"; cur = ""; i++; continue; }
        cur += c; i++;
      }
      if (q === "'") throw new Error("unexpected EOF while looking for matching `''");
      if (q === '"') throw new Error("unexpected EOF while looking for matching `\"'");
      parts.push({ op, text: cur });
      return parts;
    }

    expandHistory(line) {
      let out = "", changed = false, inSingle = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === "'") inSingle = !inSingle;
        if (c === "!" && !inSingle && i + 1 < line.length && !/[\s=(]/.test(line[i + 1])) {
          const rest = line.slice(i + 1);
          let m, cmd = null;
          if (rest[0] === "!") { cmd = this.history[this.history.length - 1]; i += 1; }
          else if ((m = rest.match(/^-?\d+/))) {
            const n = parseInt(m[0], 10);
            cmd = n < 0 ? this.history[this.history.length + n] : this.history[n - 1];
            if (cmd === undefined) return { error: `bash: !${m[0]}: event not found` };
            i += m[0].length;
          } else if ((m = rest.match(/^[A-Za-z][\w.-]*/))) {
            cmd = [...this.history].reverse().find((h) => h.startsWith(m[0]));
            if (cmd === undefined) return { error: `bash: !${(rest.match(/^\S+/) || [m[0]])[0]}: event not found` };
            i += m[0].length;
          } else { out += c; continue; }
          if (cmd === undefined || cmd === null) return { error: "bash: !!: event not found" };
          out += cmd; changed = true; continue;
        }
        out += c;
      }
      return { line: out, changed };
    }

    /* Tokens: {word, glob, brace} or {op}. Handles quotes, $VAR, ${VAR}, $?, $(cmd), ~. */
    tokenize(line) {
      const tokens = [];
      let i = 0, word = null;
      const start = () => { if (!word) word = { word: "", glob: false, brace: false, quoted: false }; };
      const push = () => { if (word) { tokens.push(word); word = null; } };
      const ops = ["&>>", "&>", "2>>", "2>&1", "2>", "1>&2", "1>>", "1>", ">&2", ">>", "&&", "||", ">", "<", "|", ";"];
      while (i < line.length) {
        const c = line[i];
        if (/\s/.test(c)) { push(); i++; continue; }
        if (c === "#" && !word) break;
        const op = ops.find((o) => line.startsWith(o, i) && (!/^[12]/.test(o) || !word));
        if (c === "`") { // backtick command substitution
          const j = line.indexOf("`", i + 1);
          if (j < 0) throw new Error("unexpected EOF while looking for matching ``'");
          start(); word.word += this.runCapture(line.slice(i + 1, j)).replace(/\n+$/, ""); i = j + 1; continue;
        }
        if (op) { push(); tokens.push({ op }); i += op.length; continue; }
        start();
        if (c === "'") {
          const j = line.indexOf("'", i + 1);
          if (j < 0) throw new Error("unexpected EOF while looking for matching `''");
          word.word += line.slice(i + 1, j); word.quoted = true; i = j + 1; continue;
        }
        if (c === '"') {
          i++; word.quoted = true;
          while (i < line.length && line[i] !== '"') {
            if (line[i] === "\\" && /["\\$`]/.test(line[i + 1] || "")) { word.word += line[i + 1]; i += 2; continue; }
            if (line[i] === "$") { const r = this.dollar(line, i); word.word += r.value; i = r.end; continue; }
            if (line[i] === "`") { const j = line.indexOf("`", i + 1); if (j > i) { word.word += this.runCapture(line.slice(i + 1, j)).replace(/\n+$/, ""); i = j + 1; continue; } }
            word.word += line[i++];
          }
          if (line[i] !== '"') throw new Error("unexpected EOF while looking for matching `\"'");
          i++; continue;
        }
        if (c === "\\") { word.word += line[i + 1] || ""; word.quoted = true; i += 2; continue; }
        if (c === "$") { const r = this.dollar(line, i); word.word += r.value.replace(/\s*\n\s*/g, " "); i = r.end; continue; } // unquoted: newlines split words
        if (c === "~" && word.word === "" && (i + 1 >= line.length || /[\/\s]/.test(line[i + 1]))) { word.word += this.home; i++; continue; }
        if (c === "*" || c === "?" || c === "[") word.glob = true;
        if (c === "{") word.brace = true;
        word.word += c; i++;
      }
      push();
      return tokens;
    }

    dollar(line, i) {
      const rest = line.slice(i + 1);
      let m;
      if (rest.startsWith("(")) {
        let depth = 0, j = i + 1;
        for (; j < line.length; j++) {
          if (line[j] === "(") depth++;
          else if (line[j] === ")" && --depth === 0) break;
        }
        const inner = line.slice(i + 2, j);
        const sub = this.runCapture(inner);
        return { value: sub.replace(/\n+$/, ""), end: j + 1 };
      }
      if ((m = rest.match(/^\{(\w+)\}/))) return { value: this.env[m[1]] ?? "", end: i + 1 + m[0].length };
      if ((m = rest.match(/^\w+/))) return { value: this.env[m[0]] ?? "", end: i + 1 + m[0].length };
      if (rest[0] === "?") return { value: String(this.lastStatus), end: i + 2 };
      if (rest[0] === "$") return { value: "4242", end: i + 2 };
      return { value: "$", end: i + 1 };
    }

    runCapture(line) {
      const saved = this.history.length;
      const r = this.run(line);
      this.history.length = saved;
      return r.out.filter((o) => o.cls !== "terminal-error" && o.cls !== "terminal-muted").map((o) => o.text).join("\n");
    }

    expandBraces(w) {
      const m = w.match(/^(.*?)\{([^{}]*,[^{}]*)\}(.*)$/);
      if (!m) return [w];
      return m[2].split(",").flatMap((part) => this.expandBraces(m[1] + part + m[3]));
    }

    expandGlob(pattern) {
      const isAbs = pattern.startsWith("/");
      const parts = VFS.split(pattern);
      let paths = [isAbs ? "/" : ""];
      for (const part of parts) {
        const next = [];
        for (const base of paths) {
          if (!/[*?[]/.test(part)) { next.push(base + (base && !base.endsWith("/") ? "/" : "") + part); continue; }
          const dirAbs = this.vfs.resolve(base || ".", this.cwd);
          const dir = this.vfs.get(dirAbs);
          if (!dir || dir.type !== "dir") continue;
          let re;
          try { re = new RegExp("^" + part.replace(/[.+^${}()|\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".").replace(/\[(!|\\\^)/g, "[^") + "$"); } // [!x] and [^x] both negate
          catch { continue; } // not a valid pattern (a lone "[" for example), so it stays a plain word
          Object.keys(dir.children).sort().forEach((name) => {
            if (name.startsWith(".") && !part.startsWith(".")) return;
            if (re.test(name)) next.push(base + (base && !base.endsWith("/") ? "/" : "") + name);
          });
        }
        paths = next;
      }
      return paths.filter((p) => this.vfs.get(this.vfs.resolve(p, this.cwd)));
    }

    /* Build argv + redirects, run each stage of a pipeline. */
    runPipeline(tokens, res) {
      const stages = [[]];
      for (const t of tokens) { if (t.op === "|") stages.push([]); else stages[stages.length - 1].push(t); }
      let stdin = "";
      let final = { stdout: "", status: 0 };
      for (let s = 0; s < stages.length; s++) {
        const words = [], redirs = [];
        const st = stages[s];
        for (let k = 0; k < st.length; k++) {
          const t = st[k];
          if (t.op) {
            if (t.op === "2>&1" || t.op === "1>&2" || t.op === ">&2") { redirs.push({ op: t.op }); continue; }
            const target = st[k + 1];
            if (!target || target.op) { res.out.push({ text: "bash: syntax error near unexpected token `newline'", cls: "terminal-error" }); this.lastStatus = 2; return { stdout: "" }; }
            redirs.push({ op: t.op, target: target.word }); k++; continue;
          }
          let list = t.brace && !t.quoted ? this.expandBraces(t.word) : [t.word];
          if (t.glob) list = list.flatMap((w) => { const g = this.expandGlob(w); return g.length ? g : [w]; });
          words.push(...list);
        }
        // Input redirect
        const inR = redirs.find((r) => r.op === "<");
        if (inR) {
          const node = this.vfs.get(this.abs(inR.target));
          if (!node || node.type !== "file") { res.out.push({ text: `bash: ${inR.target}: No such file or directory`, cls: "terminal-error" }); this.lastStatus = 1; return { stdout: "" }; }
          stdin = node.content;
        }
        /* Work out where file descriptors 1 (stdout) and 2 (stderr) point, left to right,
           as Bash does. So "> f 2>&1" sends both to f, but "2>&1 > f" leaves errors on screen.
           Files named by > are created (or emptied) even if the command fails. */
        const STD = { kind: "std" }, TERM = { kind: "term" };
        let fd1 = STD, fd2 = TERM;
        const files = new Map();
        const fileDest = (target, append) => {
          const abs = this.abs(target);
          if (!files.has(abs)) files.set(abs, { kind: "file", abs, target, append, data: "" });
          return files.get(abs);
        };
        for (const rd of redirs) {
          if (rd.op === "<") continue;
          if (rd.op === "2>&1") fd2 = fd1;
          else if (rd.op === "1>&2" || rd.op === ">&2") fd1 = fd2;
          else if (rd.op === ">" || rd.op === "1>" || rd.op === ">>" || rd.op === "1>>") fd1 = fileDest(rd.target, rd.op.endsWith(">>"));
          else if (rd.op === "2>" || rd.op === "2>>") fd2 = fileDest(rd.target, rd.op === "2>>");
          else if (rd.op === "&>" || rd.op === "&>>") { fd1 = fd2 = fileDest(rd.target, rd.op === "&>>"); }
        }
        // Truncate files before the command runs, so "sort f > f" empties f like the real shell.
        for (const f of files.values()) {
          if (f.target === "/dev/null") continue;
          try { if (!f.append) this.vfs.write(f.abs, ""); else if (!this.vfs.get(f.abs)) this.vfs.write(f.abs, ""); }
          catch (e) { res.out.push({ text: `bash: ${f.target}: ${e.message}`, cls: "terminal-error" }); this.lastStatus = 1; return { stdout: "" }; }
        }
        const r = this.exec(words, stdin, res, { tty: !this.batch && s === stages.length - 1 && fd1 === STD });
        let out = "", err = "";
        const send = (dest, text, isErr) => {
          if (!text) return;
          if (dest.kind === "std") out += text;
          else if (dest.kind === "term") err += text;
          else dest.data += text;
          if (isErr && dest.kind === "std") res.events.push({ type: "stderr-to-stdout" });
        };
        send(fd1, r.stdout || "", false);
        send(fd2, r.stderr ? r.stderr.replace(/\n?$/, "\n") : "", true);
        for (const f of files.values()) {
          if (f.target !== "/dev/null") this.vfs.write(f.abs, f.data, true);
          res.events.push({ type: "file-written", path: f.abs });
        }
        if (err) res.out.push(...err.replace(/\n$/, "").split("\n").map((text) => ({ text, cls: "terminal-error" })));
        this.lastStatus = r.status || 0;
        stdin = out;
        final = { stdout: s === stages.length - 1 ? out : "", status: r.status };
      }
      return final;
    }

    /* --------------------------------------------------------- commands */
    exec(argv, stdin, res, ctx = {}) {
      if (!argv.length) return { status: 0 };
      let [name, ...args] = argv;
      // Variable assignment: NAME=value
      if (/^[A-Za-z_]\w*=/.test(name) && !args.length) { const k = name.split("=")[0]; this.env[k] = name.slice(k.length + 1); return {}; }
      if (name === "sudo") {
        if (!args.length) return { stderr: "usage: sudo command", status: 1 };
        res.events.push({ type: "sudo", cmd: args.join(" ") });
        [name, ...args] = args;
      }
      // Aliases (only the ls/grep color aliases matter here)
      const key = [name, ...args].join(" ");
      if (Object.hasOwn(this.canned, key)) {
        if (EXTERNAL[name]) this.hashed.add(name);
        res.events.push({ type: "command", name, args });
        return { stdout: this.canned[key] + "\n" };
      }
      const fn = Shell.commands[name];
      if (fn) {
        if (EXTERNAL[name] && !BUILTINS.has(name)) this.hashed.add(name);
        res.events.push({ type: "command", name, args });
        try { return fn.call(this, args, stdin, res, ctx) || {}; }
        catch (e) { return { stderr: `${name}: ${e.message}`, status: 1 }; }
      }
      if (this.unsupported && name === this.unsupported.prefix) {
        return { stderr: `${name}: that option or format isn't part of this lesson.\n${this.unsupported.message}`, status: 1 };
      }
      if (EXTERNAL[name]) return { stderr: `${name}: this command is real, but this lesson's simulation doesn't run it.`, status: 127 };
      return { stderr: `${name}: command not found`, status: 127 };
    }
  }

  /* Option parser: returns { flags:Set, values:{}, rest:[] }. valueOpts take an argument. */
  function opts(args, valueOpts = []) {
    const flags = new Set(), values = {}, rest = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === "--") { rest.push(...args.slice(i + 1)); break; }
      if (a.startsWith("--")) { const [k, v] = a.slice(2).split("="); if (v !== undefined) values[k] = v; else flags.add(k); continue; }
      if (a.startsWith("-") && a.length > 1 && !/^-\d+$/.test(a)) {
        for (let j = 1; j < a.length; j++) {
          const f = a[j];
          if (valueOpts.includes(f)) { values[f] = a.slice(j + 1) || args[++i]; break; }
          flags.add(f);
        }
        continue;
      }
      rest.push(a);
    }
    return { flags, values, rest };
  }

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const pad = (n, w = 2, ch = "0") => String(n).padStart(w, ch);
  function lsDate(ms) { const d = new Date(ms); return `${MONTHS[d.getMonth()]} ${pad(d.getDate(), 2, " ")} ${pad(d.getHours())}:${pad(d.getMinutes())}`; }

  Shell.commands = {
    pwd() { return { stdout: this.cwd + "\n" }; },

    cd(args) {
      const target = args[0] === undefined || args[0] === "~" ? this.home : args[0] === "-" ? (this.env.OLDPWD || this.cwd) : args[0];
      const abs = this.abs(target);
      const node = this.vfs.get(abs);
      if (!node) return { stderr: `bash: cd: ${args[0]}: No such file or directory`, status: 1 };
      if (node.type !== "dir") return { stderr: `bash: cd: ${args[0]}: Not a directory`, status: 1 };
      this.env.OLDPWD = this.cwd; this.cwd = abs; this.env.PWD = abs;
      return args[0] === "-" ? { stdout: abs + "\n" } : {};
    },

    ls(args, stdin, res, ctx = {}) {
      const o = opts(args.filter((a) => !a.startsWith("--color")));
      const all = o.flags.has("a"), almost = o.flags.has("A"), long = o.flags.has("l"), dirOnly = o.flags.has("d");
      const one = o.flags.has("1") || ctx.tty === false || this.batch, recursive = o.flags.has("R"), classify = o.flags.has("F");
      const targets = o.rest.length ? o.rest : ["."];
      const out = [], err = [];
      const fmt = (name, node) => {
        const suffix = classify && node.type === "dir" ? "/" : "";
        if (!long) return name + suffix;
        const isDir = node.type === "dir";
        const size = isDir ? 4096 : (node.content || "").length;
        const perms = node.mode || (isDir ? "drwxr-xr-x" : "-rw-r--r--");
        const links = isDir ? 2 : 1;
        return `${perms} ${links} ${this.user} ${this.user} ${pad(size, 5, " ")} ${lsDate(node.mtime)} ${name}${suffix}`;
      };
      const listDir = (path, node) => {
        let names = Object.keys(node.children).sort((a, b) => a.replace(/^\./, "").localeCompare(b.replace(/^\./, "")));
        if (!all && !almost) names = names.filter((n) => !n.startsWith("."));
        const entries = names.map((n) => fmt(n, node.children[n]));
        if (all) entries.unshift(fmt(".", node), fmt("..", node));
        const lines = [];
        if (long) lines.push(`total ${names.length * 4}`);
        if (long || one) lines.push(...entries); else if (entries.length) lines.push(entries.join("  "));
        return lines;
      };
      const files = [], dirs = [];
      for (const t of targets) {
        const node = this.vfs.get(this.abs(t));
        if (!node) { err.push(`ls: cannot access '${t}': No such file or directory`); continue; }
        if (node.type === "file" || dirOnly) files.push(fmt(t, node)); else dirs.push([t, node]);
      }
      if (files.length) out.push(...(long || one ? files : [files.join("  ")]));
      const multi = targets.length > 1 || recursive;
      const walk = (t, node, first) => {
        if (multi) { if (out.length || !first) out.push(""); out.push(`${t}:`); }
        out.push(...listDir(t, node));
        if (recursive) Object.keys(node.children).sort().forEach((n) => {
          const c = node.children[n];
          if (c.type === "dir" && (all || !n.startsWith("."))) walk(`${t}/${n}`, c, false);
        });
      };
      dirs.forEach(([t, node], i) => walk(t, node, i === 0 && !files.length));
      return { stdout: out.length ? out.join("\n") + "\n" : "", stderr: err.join("\n"), status: err.length ? 2 : 0 };
    },

    mkdir(args) {
      const o = opts(args);
      const err = [];
      for (const p of o.rest) {
        const abs = this.abs(p);
        if (this.vfs.get(abs)) { if (!o.flags.has("p")) err.push(`mkdir: cannot create directory '${p}': File exists`); continue; }
        const { dir } = this.vfs.parentOf(abs);
        if (!dir && !o.flags.has("p")) { err.push(`mkdir: cannot create directory '${p}': No such file or directory`); continue; }
        this.vfs.mkdirp(abs);
      }
      if (!o.rest.length) err.push("mkdir: missing operand");
      return { stderr: err.join("\n"), status: err.length ? 1 : 0 };
    },

    rmdir(args) {
      const err = [];
      for (const p of args) {
        const n = this.vfs.get(this.abs(p));
        if (!n) err.push(`rmdir: failed to remove '${p}': No such file or directory`);
        else if (n.type !== "dir") err.push(`rmdir: failed to remove '${p}': Not a directory`);
        else if (Object.keys(n.children).length) err.push(`rmdir: failed to remove '${p}': Directory not empty`);
        else this.vfs.remove(this.abs(p));
      }
      return { stderr: err.join("\n"), status: err.length ? 1 : 0 };
    },

    touch(args) {
      const err = [];
      for (const p of opts(args).rest) {
        const abs = this.abs(p);
        const n = this.vfs.get(abs);
        if (n) { n.mtime = Date.now(); continue; }
        try { this.vfs.write(abs, ""); } catch { err.push(`touch: cannot touch '${p}': No such file or directory`); }
      }
      return { stderr: err.join("\n"), status: err.length ? 1 : 0 };
    },

    rm(args) {
      const o = opts(args);
      const err = [], out = [];
      for (const p of o.rest) {
        const abs = this.abs(p);
        const n = this.vfs.get(abs);
        if (!n) { if (!o.flags.has("f")) err.push(`rm: cannot remove '${p}': No such file or directory`); continue; }
        if (n.type === "dir" && !o.flags.has("r") && !o.flags.has("R")) { err.push(`rm: cannot remove '${p}': Is a directory`); continue; }
        this.vfs.remove(abs);
        if (o.flags.has("v")) out.push(`removed '${p}'`);
      }
      return { stdout: out.length ? out.join("\n") + "\n" : "", stderr: err.join("\n"), status: err.length ? 1 : 0 };
    },

    cp(args) {
      const o = opts(args);
      if (o.rest.length < 2) return { stderr: "cp: missing destination file operand", status: 1 };
      const dest = o.rest.pop();
      const dAbs = this.abs(dest), dNode = this.vfs.get(dAbs);
      for (const src of o.rest) {
        const n = this.vfs.get(this.abs(src));
        if (!n) return { stderr: `cp: cannot stat '${src}': No such file or directory`, status: 1 };
        if (n.type === "dir") return { stderr: `cp: -r not specified; omitting directory '${src}'`, status: 1 };
        const target = dNode && dNode.type === "dir" ? dAbs + "/" + src.split("/").pop() : dAbs;
        this.vfs.write(target, n.content);
      }
      return {};
    },

    mv(args) {
      const o = opts(args);
      if (o.rest.length < 2) return { stderr: "mv: missing destination file operand", status: 1 };
      const dest = o.rest.pop();
      const dAbs = this.abs(dest), dNode = this.vfs.get(dAbs);
      for (const src of o.rest) {
        const sAbs = this.abs(src), n = this.vfs.get(sAbs);
        if (!n) return { stderr: `mv: cannot stat '${src}': No such file or directory`, status: 1 };
        const target = dNode && dNode.type === "dir" ? dAbs + "/" + src.split("/").pop() : dAbs;
        const { dir, name } = this.vfs.parentOf(target);
        if (!dir) return { stderr: `mv: cannot move '${src}': No such file or directory`, status: 1 };
        this.vfs.remove(sAbs); dir.children[name] = n;
      }
      return {};
    },

    cat(args, stdin) {
      const o = opts(args);
      if (!o.rest.length) return { stdout: stdin };
      let out = "", err = [];
      for (const p of o.rest) {
        if (p === "-") { out += stdin; continue; }
        const n = this.vfs.get(this.abs(p));
        if (!n) err.push(`cat: ${p}: No such file or directory`);
        else if (n.type === "dir") err.push(`cat: ${p}: Is a directory`);
        else out += n.content;
      }
      if (o.flags.has("n")) out = out.replace(/\n$/, "").split("\n").map((l, i) => `${pad(i + 1, 6, " ")}\t${l}`).join("\n") + "\n";
      return { stdout: out, stderr: err.join("\n"), status: err.length ? 1 : 0 };
    },

    echo(args) {
      let n = false, e = false;
      while (args.length && /^-[neE]+$/.test(args[0])) { if (args[0].includes("n")) n = true; if (args[0].includes("e")) e = true; args = args.slice(1); }
      let s = args.join(" ");
      if (e) s = s.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
      return { stdout: s + (n ? "" : "\n") };
    },

    printf(args) {
      if (!args.length) return { stderr: "printf: usage: printf [-v var] format [arguments]", status: 2 };
      let [fmt, ...rest] = args, i = 0;
      const s = fmt.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/%[sd]/g, () => rest[i++] ?? "");
      return { stdout: s };
    },

    date() {
      const d = new Date();
      const tz = (d.toLocaleTimeString("en-US", { timeZoneName: "short" }).split(" ").pop()) || "UTC";
      return { stdout: `${DAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${pad(d.getDate(), 2, " ")} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${tz} ${d.getFullYear()}\n` };
    },

    whoami() { return { stdout: this.user + "\n" }; },
    hostname() { return { stdout: this.host + "\n" }; },
    true() { return { status: 0 }; },
    false() { return { status: 1 }; },
    clear(args, stdin, res) { res.clear = true; return {}; },
    exit(args, stdin, res) { return { stderr: "exit: this practice terminal stays open. Use Clear to start fresh.", status: 0 }; },
    sleep() { return {}; },

    export(args) {
      for (const a of args) { const k = a.split("=")[0]; if (a.includes("=")) this.env[k] = a.slice(k.length + 1); }
      return {};
    },
    unset(args) { args.forEach((k) => delete this.env[k]); return {}; },
    env() { return { stdout: Object.entries(this.env).map(([k, v]) => `${k}=${v}`).join("\n") + "\n" }; },
    printenv(args) { return args.length ? { stdout: args.map((k) => this.env[k] ?? "").join("\n") + "\n" } : Shell.commands.env.call(this); },

    head(args, stdin) { return headTail.call(this, "head", args, stdin); },
    tail(args, stdin, res) {
      const follow = args.some((a) => /^-[a-zA-Z0-9]*f/.test(a) || a === "--follow");
      const rest = args.filter((a) => a !== "-f" && a !== "--follow").map((a) => (/^-\d*f$/.test(a) ? a.replace("f", "") : a)).filter((a) => a !== "-");
      const r = headTail.call(this, "tail", rest, stdin);
      if (follow && !r.stderr) {
        const files = rest.filter((a) => !a.startsWith("-") && !/^\d+$/.test(a));
        if (!files.length) return { stderr: "tail: -f needs a file name in this practice terminal", status: 1 };
        res.follow = { path: this.abs(files[files.length - 1]), name: files[files.length - 1] };
        res.events.push({ type: "follow-start", path: res.follow.path });
      }
      return r;
    },

    more(args, stdin, res) {
      const r = Shell.commands.less.call(this, args, stdin, res);
      if (res.pager) { res.pager.kind = "more"; res.events[res.events.length - 1].kind = "more"; }
      return r;
    },

    uniq(args, stdin) {
      const o = opts(args);
      let text = stdin;
      if (o.rest[0]) {
        const n = this.vfs.get(this.abs(o.rest[0]));
        if (!n || n.type !== "file") return { stderr: `uniq: ${o.rest[0]}: No such file or directory`, status: 1 };
        text = n.content;
      }
      const lines = text.replace(/\n$/, "").split("\n");
      if (!text) return {};
      const same = (a, b) => (o.flags.has("i") ? a.toLowerCase() === b.toLowerCase() : a === b);
      const groups = [];
      for (const l of lines) { const g = groups[groups.length - 1]; if (g && same(g.line, l)) g.items.push(l); else groups.push({ line: l, items: [l] }); }
      let out = [];
      for (const g of groups) {
        const n = g.items.length;
        if (o.flags.has("d") && n < 2) continue;
        if (o.flags.has("u") && n > 1) continue;
        if (o.flags.has("D")) { if (n > 1) out.push(...g.items); continue; }
        out.push(o.flags.has("c") ? `${pad(n, 7, " ")} ${g.line}` : g.line);
      }
      return { stdout: out.length ? out.join("\n") + "\n" : "" };
    },

    nl(args, stdin) {
      let all = false;
      const files = [];
      for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === "-ba" || (a === "-b" && args[i + 1] === "a")) { all = true; if (a === "-b") i++; }
        else if (a === "-bt" || (a === "-b" && args[i + 1] === "t")) { all = false; if (a === "-b") i++; }
        else files.push(a);
      }
      let text = stdin;
      if (files.length) {
        const n = this.vfs.get(this.abs(files[0]));
        if (!n || n.type !== "file") return { stderr: `nl: ${files[0]}: No such file or directory`, status: 1 };
        text = n.content;
      }
      if (!text) return {};
      let k = 0;
      const out = text.replace(/\n$/, "").split("\n").map((l) => (l === "" && !all ? "" : `${pad(++k, 6, " ")}\t${l}`));
      return { stdout: out.join("\n") + "\n" };
    },

    md5sum(args, stdin) { return hashCmd.call(this, "md5", args, stdin); },
    sha1sum(args, stdin) { return hashCmd.call(this, "sha1", args, stdin); },
    sha256sum(args, stdin) { return hashCmd.call(this, "sha256", args, stdin); },
    sha512sum(args, stdin) { return hashCmd.call(this, "sha512", args, stdin); },

    wc(args, stdin) {
      // GNU wc pads every number to the width of the total byte count of all inputs
      // (7 for standard input), except that one number for one file isn't padded.
      const o = opts(args);
      const count = (txt) => ({ l: (txt.match(/\n/g) || []).length, w: (txt.match(/\S+/g) || []).length, m: [...txt].length, c: new TextEncoder().encode(txt).length });
      const which = ["l", "w", "m", "c"].filter((f) => o.flags.has(f));
      const show = which.length ? which : ["l", "w", "c"];
      const fmt = (r, name, width) => show.map((f) => String(r[f]).padStart(width)).join(" ") + (name ? " " + name : "");
      if (!o.rest.length) { const r = count(stdin); return { stdout: fmt(r, "", show.length === 1 ? 1 : 7) + "\n" }; }
      const rows = [], err = [];
      for (const p of o.rest) {
        const n = this.vfs.get(this.abs(p));
        if (!n) { err.push(`wc: ${p}: No such file or directory`); continue; }
        if (n.type !== "file") { err.push(`wc: ${p}: Is a directory`); rows.push({ r: { l: 0, w: 0, m: 0, c: 0 }, p }); continue; }
        rows.push({ r: count(n.content), p });
      }
      const total = rows.reduce((t, x) => ({ l: t.l + x.r.l, w: t.w + x.r.w, m: t.m + x.r.m, c: t.c + x.r.c }), { l: 0, w: 0, m: 0, c: 0 });
      const width = show.length === 1 && rows.length === 1 ? 1 : Math.max(1, String(total.c).length);
      const out = rows.map((x) => fmt(x.r, x.p, width));
      if (rows.length > 1) out.push(fmt(total, "total", width));
      return { stdout: out.length ? out.join("\n") + "\n" : "", stderr: err.join("\n"), status: err.length ? 1 : 0 };
    },

    grep(args, stdin) {
      const o = opts(args.filter((a) => !a.startsWith("--color")), ["e"]);
      const pattern = o.values.e ?? o.rest.shift();
      if (pattern === undefined) return { stderr: "Usage: grep [OPTION]... PATTERNS [FILE]...", status: 2 };
      let re;
      try { re = new RegExp(o.flags.has("F") ? pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : pattern.replace(/\\</g, "\\b").replace(/\\>/g, "\\b"), o.flags.has("i") ? "i" : ""); }
      catch { return { stderr: "grep: Invalid regular expression", status: 2 }; }
      const sources = o.rest.length ? o.rest.map((p) => [p, this.vfs.get(this.abs(p))]) : [[null, { type: "file", content: stdin }]];
      const out = [], err = [];
      let total = 0;
      for (const [name, n] of sources) {
        if (!n) { err.push(`grep: ${name}: No such file or directory`); continue; }
        if (n.type === "dir") { err.push(`grep: ${name}: Is a directory`); continue; }
        const lines = n.content.replace(/\n$/, "").split("\n");
        let c = 0;
        lines.forEach((l, idx) => {
          if (n.content === "") return;
          if (re.test(l) !== o.flags.has("v")) {
            c++;
            if (!o.flags.has("c") && !o.flags.has("l")) out.push((sources.length > 1 ? name + ":" : "") + (o.flags.has("n") ? idx + 1 + ":" : "") + l);
          }
        });
        if (o.flags.has("c")) out.push((sources.length > 1 ? name + ":" : "") + c);
        if (o.flags.has("l") && c) out.push(name);
        total += c;
      }
      return { stdout: out.length ? out.join("\n") + "\n" : "", stderr: err.join("\n"), status: err.length ? 2 : total ? 0 : 1 };
    },

    sort(args, stdin) {
      const o = opts(args);
      let text = stdin;
      if (o.rest.length) text = o.rest.map((p) => this.vfs.get(this.abs(p))?.content || "").join("");
      let lines = text.replace(/\n$/, "").split("\n");
      lines.sort(o.flags.has("n") ? (a, b) => parseFloat(a) - parseFloat(b) : (a, b) => a.localeCompare(b));
      if (o.flags.has("r")) lines.reverse();
      return { stdout: text ? lines.join("\n") + "\n" : "" };
    },

    nano(args) {
      return { stderr: "nano: full-screen editors don't run in this practice terminal.\nTo add a line to a file, use: echo 'your text' >> FILE", status: 1 };
    },
    vi(args) { return Shell.commands.nano.call(this, args); },
    vim(args) { return Shell.commands.nano.call(this, args); },

    /* ------------ type / which / help / man / info / history ------------ */
    type(args) {
      const o = opts(args);
      const out = [], err = [];
      for (const n of o.rest) {
        if (o.flags.has("t")) {
          const kind = ALIASES[n] ? "alias" : KEYWORDS.has(n) ? "keyword" : BUILTINS.has(n) ? "builtin" : EXTERNAL[n] ? "file" : null;
          if (kind) out.push(kind); else err.push("");
          continue;
        }
        const found = [];
        if (ALIASES[n]) found.push(`${n} is aliased to \`${ALIASES[n]}'`);
        if (KEYWORDS.has(n)) found.push(`${n} is a shell keyword`);
        if (BUILTINS.has(n)) found.push(`${n} is a shell builtin`);
        if (EXTERNAL[n] && (!BUILTINS.has(n) || o.flags.has("a"))) {
          if (o.flags.has("a")) { found.push(`${n} is ${EXTERNAL[n]}`); found.push(`${n} is ${EXTERNAL[n].replace("/usr", "")}`); }
          else found.push(this.hashed.has(n) ? `${n} is hashed (${EXTERNAL[n]})` : `${n} is ${EXTERNAL[n]}`);
        }
        if (!found.length) { err.push(`bash: type: ${n}: not found`); continue; }
        out.push(...(o.flags.has("a") ? found : [found[0]]));
      }
      return { stdout: out.length ? out.join("\n") + "\n" : "", stderr: err.filter(Boolean).join("\n"), status: err.length ? 1 : 0 };
    },

    which(args) {
      const o = opts(args);
      const out = [];
      let missing = false;
      for (const n of o.rest) {
        if (EXTERNAL[n] && (!BUILTINS.has(n) || ALSO_EXTERNAL.has(n))) {
          out.push(EXTERNAL[n]);
          if (o.flags.has("a")) out.push(EXTERNAL[n].replace("/usr", ""));
        } else missing = true;
      }
      return { stdout: out.length ? out.join("\n") + "\n" : "", status: missing ? 1 : 0 };
    },

    help(args) {
      const topics = this.docs.help || {};
      const o = opts(args);
      if (!o.rest.length) return { stdout: topics[""] || "GNU bash, version 5.2.21(1)-release\nType `help name' to find out more about the function `name'.\n" };
      const out = [], err = [];
      for (const t of o.rest) {
        if (topics[t]) out.push(o.flags.has("d") ? `${t} - ${topics[t].split("\n")[1].trim()}` : o.flags.has("s") ? topics[t].split("\n")[0] : topics[t].replace(/\n$/, ""));
        else err.push(`bash: help: no help topics match \`${t}'.  Try \`help help' or \`man -k ${t}' or \`info ${t}'.`);
      }
      return { stdout: out.length ? out.join("\n") + "\n" : "", stderr: err.join("\n"), status: err.length ? 1 : 0 };
    },

    man(args, stdin, res) {
      const o = opts(args);
      const pages = this.docs.man || {};
      if (o.flags.has("k")) return Shell.commands.apropos.call(this, o.rest);
      if (o.flags.has("f")) return Shell.commands.whatis.call(this, o.rest);
      const page = o.rest[o.rest.length - 1];
      if (!page) return { stderr: "What manual page do you want?\nFor example, try 'man man'.", status: 1 };
      if (!pages[page]) return { stderr: `No manual entry for ${page}`, status: 16 };
      res.pager = { kind: "man", page, title: `Manual page ${page}(${pages[page].section || 1})`, text: pages[page].text };
      res.events.push({ type: "pager-open", kind: "man", page });
      return {};
    },

    info(args, stdin, res) {
      const page = args[args.length - 1] || "dir";
      const pages = this.docs.info || {};
      const manPages = this.docs.man || {};
      let text = pages[page]?.text;
      if (!text && manPages[page]) text = manPages[page].text; // info falls back to the man page
      if (!text) return { stderr: `info: No menu item '${page}' in node '(dir)Top'`, status: 1 };
      res.pager = { kind: "info", page, title: `info ${page}`, text };
      res.events.push({ type: "pager-open", kind: "info", page });
      return {};
    },

    less(args, stdin, res) {
      const p = args[args.length - 1];
      const n = p ? this.vfs.get(this.abs(p)) : { type: "file", content: stdin };
      if (!n) return { stderr: `${p}: No such file or directory`, status: 1 };
      res.pager = { kind: "less", page: p || "(stdin)", title: p || "less", text: n.content };
      res.events.push({ type: "pager-open", kind: "less", page: p });
      return {};
    },

    whatis(args) {
      const pages = this.docs.man || {};
      const out = [], err = [];
      for (const n of args) {
        if (pages[n]) out.push(`${(n + " (" + (pages[n].section || 1) + ")").padEnd(20)} - ${pages[n].summary}`);
        else err.push(`${n}: nothing appropriate.`);
      }
      return { stdout: out.length ? out.join("\n") + "\n" : "", stderr: err.join("\n"), status: err.length ? 16 : 0 };
    },

    apropos(args) {
      const pages = this.docs.man || {};
      const kw = (args[0] || "").toLowerCase();
      const out = Object.entries(pages).filter(([n, p]) => n.includes(kw) || (p.summary || "").toLowerCase().includes(kw))
        .map(([n, p]) => `${(n + " (" + (p.section || 1) + ")").padEnd(20)} - ${p.summary}`);
      return out.length ? { stdout: out.join("\n") + "\n" } : { stderr: `${args[0]}: nothing appropriate.`, status: 16 };
    },

    history(args) {
      const histFile = this.home + "/.bash_history";
      const a = args[0];
      if (a === "--help") return Shell.commands.help.call(this, ["history"]);
      if (a === "-c") { this.history = []; return {}; }
      if (a === "-w") { this.vfs.write(histFile, this.history.map((h) => h + "\n").join("")); return {}; }
      if (a === "-a") { this.vfs.write(histFile, this.history.map((h) => h + "\n").join(""), true); return {}; }
      if (a === "-r") { const f = this.vfs.get(histFile); if (f) this.history.push(...f.content.split("\n").filter(Boolean)); return {}; }
      if (a === "-d") { const n = parseInt(args[1], 10); if (!(n >= 1 && n <= this.history.length)) return { stderr: `bash: history: ${args[1]}: history position out of range`, status: 1 }; this.history.splice(n - 1, 1); return {}; }
      if (a && a.startsWith("-")) return { stderr: `bash: history: ${a}: invalid option\nhistory: usage: history [-c] [-d offset] [n] or history -anrw [filename] or history -ps arg [arg...]`, status: 2 };
      const n = a ? parseInt(a, 10) : this.history.length;
      const start = Math.max(0, this.history.length - n);
      return { stdout: this.history.slice(start).map((h, i) => `${pad(start + i + 1, 5, " ")}  ${h}`).join("\n") + "\n" };
    },

    bash(args) {
      if (args[0] === "--version" || args[0] === "-version") return { stdout: DEFAULT_CANNED["bash --version"] + "\n" };
      return { stderr: "bash: a new shell isn't needed here. You're already in Bash.", status: 1 };
    },

    uname(args) {
      return { stderr: `uname: this practice terminal knows these forms: uname, uname -s, -n, -r, -v, -m, -o, -a`, status: 1 };
    },
  };

  /* md5sum / sha*sum, including -c to verify a saved checksum list. */
  function hashCmd(algo, args, stdin) {
    const fn = LPIC.hash[algo];
    const name = algo + "sum";
    const o = opts(args);
    if (o.flags.has("c") || o.flags.has("check")) {
      const out = [], err = [];
      let bad = 0;
      for (const listFile of o.rest.length ? o.rest : ["-"]) {
        const list = listFile === "-" ? stdin : this.vfs.get(this.abs(listFile))?.content;
        if (list === undefined) { err.push(`${name}: ${listFile}: No such file or directory`); continue; }
        for (const line of list.split("\n").filter(Boolean)) {
          const m = line.match(/^([0-9a-f]+)\s+\*?(.+)$/i);
          if (!m) continue;
          const node = this.vfs.get(this.abs(m[2]));
          if (!node || node.type !== "file") { out.push(`${m[2]}: FAILED open or read`); bad++; continue; }
          const ok = fn(node.content) === m[1].toLowerCase();
          out.push(`${m[2]}: ${ok ? "OK" : "FAILED"}`);
          if (!ok) bad++;
        }
      }
      if (bad) err.push(`${name}: WARNING: ${bad} computed checksum${bad > 1 ? "s" : ""} did NOT match`);
      return { stdout: out.length ? out.join("\n") + "\n" : "", stderr: err.join("\n"), status: bad || err.length ? 1 : 0 };
    }
    if (!o.rest.length) return { stdout: `${fn(stdin)}  -\n` };
    const out = [], err = [];
    for (const p of o.rest) {
      const node = this.vfs.get(this.abs(p));
      if (!node) err.push(`${name}: ${p}: No such file or directory`);
      else if (node.type === "dir") err.push(`${name}: ${p}: Is a directory`);
      else out.push(`${fn(node.content)}  ${p}`);
    }
    return { stdout: out.length ? out.join("\n") + "\n" : "", stderr: err.join("\n"), status: err.length ? 1 : 0 };
  }

  function headTail(cmd, args, stdin) {
    let n = 10;
    const rest = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === "-n") n = parseInt(args[++i], 10);
      else if (/^-n\d+$/.test(a)) n = parseInt(a.slice(2), 10);
      else if (/^-\d+$/.test(a)) n = parseInt(a.slice(1), 10);
      else rest.push(a);
    }
    const pick = (txt) => {
      const lines = txt.replace(/\n$/, "").split("\n");
      const sel = cmd === "head" ? lines.slice(0, n) : lines.slice(Math.max(0, lines.length - n));
      return txt ? sel.join("\n") + "\n" : "";
    };
    if (!rest.length) return { stdout: pick(stdin) };
    let out = "";
    const err = [];
    rest.forEach((p, i) => {
      const node = this.vfs.get(this.abs(p));
      if (!node || node.type !== "file") { err.push(`${cmd}: cannot open '${p}' for reading: No such file or directory`); return; }
      if (rest.length > 1) out += (i ? "\n" : "") + `==> ${p} <==\n`;
      out += pick(node.content);
    });
    return { stdout: out, stderr: err.join("\n"), status: err.length ? 1 : 0 };
  }

  LPIC.Shell = Shell;
  LPIC.VFS = VFS;
  LPIC.shellUtil = { opts, pad, EXTERNAL };
})();
