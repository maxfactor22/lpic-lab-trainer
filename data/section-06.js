/* Section 6: Regular expressions and finding things (103.7, 104.7). From "LPIC - Section 6.docx"
   (its heading says "Section 5"; the app uses Section 6 and ~/lpic-section6-lab).
   Lesson 6.7 adds the Filesystem Hierarchy Standard and find -size/-mtime/-exec, which the workbook leaves out.
   Lesson 6.8 adds quantifiers, POSIX classes, grep -o/-i, and sed -n ranges, -E groups and -i.bak. */
(function () {
  const WS = "~/lpic-section6-lab";
  const INV = WS + "/configs/hosts-inventory.txt";
  const FILES = {
    [WS + "/logs/incident-bridge.log"]: "2026-08-26 09:01 INFO bridge opened for vpn latency incident\n2026-08-26 09:04 WARN packet loss detected from site-a01\n2026-08-26 09:07 ERROR vpn tunnel reset for user alex\n2026-08-26 09:09 INFO service restored after route refresh\n2026-08-26 09:11 WARN follow-up needed with network team\n",
    [WS + "/logs/auth-review.log"]: "root:x:0:0:root:/root:/bin/bash\ndeploy:x:1001:1001:Deployment User:/home/deploy:/bin/bash\nsvc-backup:x:998:998:Backup Service:/var/lib/backup:/usr/sbin/nologin\nshutdown:x:6:0:shutdown:/sbin:/sbin/shutdown\ntempuser:x:1005:1005:Temporary User:/home/tempuser:/bin/bash\n",
    [WS + "/configs/network.conf"]: "# IPv4 enabled for branch sites\nipv4=true\n# IPv6 pilot enabled for site-a01\nipv6=true\ndns_primary=10.10.1.10\ndns_secondary=10.10.1.11\n",
    [WS + "/configs/services.conf"]: "# bootp legacy entry kept for audit\nrouter=enabled\nbackup=enabled\nmonitoring=enabled\n",
    [WS + "/reports/maintenance-handoff.txt"]: "",
    [WS + "/reports/security-audit.txt"]: "",
    [WS + "/archive/old-maintenance-note.txt"]: { content: "", ageDays: 45 },
    [WS + "/archive/empty-placeholder.log"]: { content: "", ageDays: 12 },
    [WS + "/archive/rotated-app.log"]: { content: "x".repeat(3000) + "\n", ageDays: 40 },
    [WS + "/reports/noisy-report.txt"]: "line one\n\nline three\n\n",
    [WS + "/reports/pattern-file.txt"]: "root\nshutdown\nsvc-backup\n",
    [WS + "/bin/"]: null,
  };
  const base = { user: "max", host: "linux-mint", cwd: WS, files: FILES };
  const ticket = (requestedBy, body, tools, extra = {}) => ({ requestedBy, system: "Linux Mint VM", badge: "Support engineer", tools, body, ...extra });
  const pat = (re) => ({ type: "pattern", re });
  const file = (name, re, not) => ({ type: "file", path: WS + "/" + name, re, not });
  const out = (re) => ({ type: "output", re });
  const quote = { kind: "info", title: "Quote your patterns", text: "Put regex patterns in single quotes. Characters like <code>|</code>, <code>$</code>, <code>*</code> and <code>#</code> mean something to the shell before grep ever sees them." };

  LPIC.section({
    id: "section-06",
    number: 6,
    title: "Regular Expressions and Finding Things",
    objectives: ["103.7", "104.7"],
    kind: "terminal",
    source: "LPIC - Section 6.docx",
    scenario: "You're a support engineer. Pull evidence out of logs and configs with regular expressions, clean reports with sed, find out where commands live, and locate files fast with locate or precisely with find.",
    overview: {
      paragraphs: [
        "These labs give you the task, not the command. Decide what evidence you need, run the command, and prove the answer. Each lesson's tasks spell out the hints if you get stuck.",
        "On your VM, run the workbook's Lab Setup; the app calls the folder <code>~/lpic-section6-lab</code> instead of <code>lpic-section5-lab</code>. The practice terminal already has the files. Lesson 6.7 is added: the Filesystem Hierarchy Standard and <code>find -size</code>, <code>-mtime</code> and <code>-exec</code>. Lesson 6.8 is added too: regex quantifiers, character classes, and <code>sed -n</code>, <code>-E</code> and <code>-i.bak</code>.",
      ],
      commands: ["grep", "grep -E", "grep -F", "grep -f file", "grep -c -n -v -l -w -o -r", "^ $ . * [ ] [^ ]", "+ ? | ( ) {n,m}", "sed", "sed '/^$/d'", "sed -n '2,4p'", "sed -E groups \\1", "sed -i.bak", "[[:digit:]] [[:alpha:]]", "which", "type", "whereis", "locate", "updatedb", "find -name -iname", "find -type f d", "find -empty", "find -size", "find -mtime", "find -maxdepth", "find -exec {} \\;"],
      memoryHook: "<code>grep</code> finds text, <code>sed</code> changes it. <code>which</code> shows where a command runs from, <code>type</code> what kind it is, <code>whereis</code> its binary and manual. <code>locate</code> is fast but can be stale; <code>updatedb</code> refreshes it. <code>find</code> is slower but live and precise.",
    },

    lessons: [
      /* ---------------------------------------------------------- 6.1 */
      {
        id: "6.1", title: "Basic regular expressions", navSubtitle: "[ ], \\|, quoting", objective: "103.7", difficulty: "Beginner",
        source: "Topic 1: Basic Regular Expressions with grep (Labs 1A–1C)",
        summary: "Match one of several characters with brackets, alternate in basic regex, and keep the shell from eating your pattern.",
        ticket: ticket("Network team", "During an incident bridge, the network team wants to know if the config mentions IPv4 and IPv6, and the Major Incident Manager wants only the warning and error lines from the bridge log.", ["grep"], { callout: quote }),
        workspace: base,
        tasks: [
          { id: "brackets", title: "IPv4 or IPv6 in one pattern", short: "Save to <code>reports/ip-version-findings.txt</code>", detail: "<code>[46]</code> matches one character: a 4 or a 6. Try <code>grep 'IPv[46]' configs/network.conf &gt; reports/ip-version-findings.txt</code>.", check: file("reports/ip-version-findings.txt", "IPv4 enabled[\\s\\S]*IPv6 pilot") },
          { id: "literal", title: "See basic regex treat | literally", command: "grep 'WARN|ERROR' logs/incident-bridge.log", detail: "Nothing matches: in basic regex, a plain <code>|</code> is just a character.", check: pat("^grep ['\"]WARN\\|ERROR['\"] logs/incident-bridge\\.log$") },
          { id: "alt", title: "WARN or ERROR, saved", short: "Save to <code>reports/incident-signals.txt</code>", detail: "In basic regex, escape it: <code>grep 'WARN\\|ERROR' …</code>. Or use <code>grep -E 'WARN|ERROR'</code>. Then <code>wc -l reports/incident-signals.txt</code> should say 3.", check: file("reports/incident-signals.txt", "WARN packet loss[\\s\\S]*ERROR vpn[\\s\\S]*WARN follow-up", "INFO") },
          { id: "comment", title: "Only the bootp comment", short: "<code>grep '^#.*bootp' configs/services.conf</code>", detail: "<code>^#</code> anchors to lines starting with #, <code>.*</code> means anything, then bootp. Unquoted, the shell would treat <code>#</code> as the start of a comment.", check: { type: "all", checks: [pat("^grep .*bootp.* configs/services\\.conf$"), out("^# bootp legacy entry kept for audit$")] } },
        ],
        quiz: [
          { id: "b46", prompt: "Does <code>IPv[46]</code> match the text <code>IPv46</code>?", answer: "partly", explain: "Correct. [46] is one character, so it matches the IPv4 part; it never means \"46\".",
            options: [{ value: "partly", label: "It matches IPv4 inside it; brackets match one character" }, { value: "yes", label: "Yes, [46] means the string 46" }, { value: "no", label: "No, it can't match at all" }] },
          { id: "dot", prompt: "In a regex, what does <code>.</code> match?", answer: "any", explain: "Correct. Use \\. for a literal dot.",
            options: [{ value: "any", label: "Any single character" }, { value: "dot", label: "Only a dot" }, { value: "end", label: "The end of the line" }] },
        ],
        challenge: {
          prompt: "Using <em>basic</em> grep (no -E), show lines in <code>logs/incident-bridge.log</code> containing WARN or ERROR.",
          check: { accept: ["grep 'WARN\\|ERROR' logs/incident-bridge.log", "grep \"WARN\\|ERROR\" logs/incident-bridge.log", "grep -e WARN -e ERROR logs/incident-bridge.log", "grep 'ERROR\\|WARN' logs/incident-bridge.log"] },
          correct: "Correct. In basic regex the | needs a backslash (or use two -e patterns).",
          incorrect: "Without -E, alternation is written \\|, inside quotes.",
        },
        memoryHook: "<code>^</code> start, <code>$</code> end, <code>.</code> any one character, <code>*</code> zero or more of the thing before, <code>[abc]</code> one of these, <code>[^abc]</code> none of these.",
        completion: "You can write basic regular expressions.",
      },

      /* ---------------------------------------------------------- 6.2 */
      {
        id: "6.2", title: "Extended regular expressions", navSubtitle: "grep -E, ( | ) + ? {n}", objective: "103.7", difficulty: "Intermediate",
        source: "Topic 2: Extended Regular Expressions with grep -E (Labs 2A–2C)",
        summary: "Use <code>grep -E</code> for alternation, grouping and quantifiers, and anchor to the end of a line.",
        ticket: ticket("Security analyst", "Security wants the accounts whose login shell is Bash, and the bridge needs the packet loss, reset and restore lines as evidence.", ["grep -E"], { callout: quote }),
        workspace: base,
        tasks: [
          { id: "bash", title: "Accounts that end with /bin/bash", short: "Save to <code>reports/bash-accounts.txt</code>", detail: "<code>grep -E '/bin/bash$' logs/auth-review.log &gt; reports/bash-accounts.txt</code>. The <code>$</code> makes sure Bash is the login shell field, at the very end.", check: file("reports/bash-accounts.txt", "^root:[\\s\\S]*^deploy:[\\s\\S]*^tempuser:", "nologin|shutdown") },
          { id: "evidence", title: "Packet loss, reset or restored", short: "Save to <code>reports/bridge-evidence.txt</code>", detail: "<code>grep -E 'packet loss|reset|restored' logs/incident-bridge.log</code>. Without quotes, the shell would treat each <code>|</code> as a pipe.", check: file("reports/bridge-evidence.txt", "packet loss[\\s\\S]*reset[\\s\\S]*restored", "opened|follow-up") },
          { id: "group", title: "Only root or deploy with Bash", short: "Save to <code>reports/security-shell-review.txt</code>", detail: "Group the names and anchor both ends: <code>grep -E '^(root|deploy):.*/bin/bash$'</code>.", check: file("reports/security-shell-review.txt", "^root:[\\s\\S]*^deploy:", "tempuser|nologin") },
          { id: "quant", title: "Use a quantifier", short: "Times like <code>09:04</code>: <code>grep -E -o '[0-9]{2}:[0-9]{2}' logs/incident-bridge.log</code>", detail: "<code>{2}</code> means exactly two of the thing before. <code>+</code> is one or more, <code>?</code> zero or one. <code>-o</code> prints only the matched part.", check: { type: "all", checks: [pat("\\{2\\}|\\\\\\{2\\\\\\}"), out("^09:04$")] } },
        ],
        quiz: [
          { id: "special", prompt: "When are <code>( )</code>, <code>|</code>, <code>+</code> and <code>?</code> special without a backslash?", answer: "ere", explain: "Correct. Basic regex needs \\( \\) \\| \\+ \\?.",
            options: [{ value: "ere", label: "In extended regex: grep -E or egrep" }, { value: "always", label: "Always" }, { value: "never", label: "Never; they always need a backslash" }] },
          { id: "plus", prompt: "In <code>grep -E</code>, what does <code>o+</code> match?", answer: "one", explain: "Correct. + is one or more; * is zero or more.",
            options: [{ value: "one", label: "One or more o's" }, { value: "zero", label: "Zero or more o's" }, { value: "lit", label: "The text o+" }] },
        ],
        challenge: {
          prompt: "Show only lines of <code>logs/auth-review.log</code> that start with <code>root</code> or <code>deploy</code> and end with <code>/bin/bash</code>, using extended regex.",
          check: { accept: ["grep -E '^(root|deploy):.*/bin/bash$' logs/auth-review.log", "grep -E '^(root|deploy).*/bin/bash$' logs/auth-review.log", "egrep '^(root|deploy):.*/bin/bash$' logs/auth-review.log", "egrep '^(root|deploy).*/bin/bash$' logs/auth-review.log", "grep -E \"^(root|deploy):.*/bin/bash$\" logs/auth-review.log"] },
          correct: "Correct. Grouping, alternation and both anchors.",
          incorrect: "Use grep -E with ^( | ) at the start, .* in the middle and /bin/bash$ at the end.",
        },
        memoryHook: "<code>-E</code> unlocks <code>( ) | + ? {n,m}</code>. Basic regex has them too, but only with a backslash in front.",
        completion: "You can write extended regular expressions.",
      },

      /* ---------------------------------------------------------- 6.3 */
      {
        id: "6.3", title: "Pattern files and fixed strings", navSubtitle: "grep -f, -F, egrep, fgrep", objective: "103.7", difficulty: "Intermediate",
        source: "Topic 3: grep variants and pattern files (Labs 3A–3B)",
        summary: "Search for a list of patterns kept in a file, treat patterns as plain text, and know the old egrep and fgrep names.",
        ticket: ticket("Manager", "Your manager hands you a list of account names and wants to know which appear in the mock account file. An old script also uses egrep and fgrep, which need modern equivalents.", ["grep -f", "grep -F"]),
        workspace: base,
        tasks: [
          { id: "patfile", title: "Search with a pattern file", short: "Save to <code>reports/account-pattern-matches.txt</code>", detail: "<code>grep -F -f reports/pattern-file.txt logs/auth-review.log</code>. <code>-f</code> reads one pattern per line; <code>-F</code> treats each as plain text.", check: file("reports/account-pattern-matches.txt", "^root:[\\s\\S]*^svc-backup:[\\s\\S]*^shutdown:", "deploy|tempuser") },
          { id: "fixed", title: "See why -F matters", short: "Compare <code>grep '10.10.1.1' configs/network.conf</code> with <code>grep -F</code>", detail: "In a regex, <code>.</code> matches any character, so dots are wildcards. With <code>-F</code>, they're just dots.", check: { type: "history", includes: ["^grep -F .*10\\.10\\.1\\.1"] } },
          { id: "notes", title: "Write the modernization notes", short: "<code>reports/grep-modernization-notes.txt</code>", detail: "<code>echo 'egrep = grep -E' &gt; reports/grep-modernization-notes.txt</code>, then append <code>fgrep = grep -F</code> with <code>&gt;&gt;</code>.", check: file("reports/grep-modernization-notes.txt", "egrep\\s*=\\s*grep -E[\\s\\S]*fgrep\\s*=\\s*grep -F|fgrep\\s*=\\s*grep -F[\\s\\S]*egrep\\s*=\\s*grep -E") },
          { id: "count", title: "Count and list", short: "<code>grep -c</code> and <code>grep -l</code>", detail: "<code>grep -c enabled configs/services.conf</code> counts lines; <code>grep -l enabled configs/*</code> lists only the file names that match.", check: { type: "history", includes: ["^grep -c ", "^grep -l "] } },
        ],
        quiz: [
          { id: "fF", prompt: "What's the difference between <code>-f</code> and <code>-F</code>?", answer: "diff", explain: "Correct. -f says where the patterns come from; -F says how to read them.",
            options: [{ value: "diff", label: "-f reads patterns from a file; -F treats patterns as fixed strings" }, { value: "same", label: "They're the same" }, { value: "case", label: "-F ignores case" }] },
          { id: "egrep", prompt: "<code>egrep</code> is the same as…", answer: "E", explain: "Correct. And fgrep is grep -F.",
            options: [{ value: "E", label: "<code>grep -E</code>" }, { value: "F", label: "<code>grep -F</code>" }, { value: "e", label: "<code>grep -e</code>" }] },
        ],
        challenge: {
          prompt: "Search <code>logs/auth-review.log</code> for every name listed in <code>reports/pattern-file.txt</code>, as plain strings.",
          check: { accept: ["grep -F -f reports/pattern-file.txt logs/auth-review.log", "grep -Ff reports/pattern-file.txt logs/auth-review.log", "fgrep -f reports/pattern-file.txt logs/auth-review.log", "grep -f reports/pattern-file.txt -F logs/auth-review.log"] },
          correct: "Correct.",
          incorrect: "Use -f for the pattern file and -F for fixed strings.",
        },
        memoryHook: "<strong>f</strong>ile vs <strong>F</strong>ixed. <code>egrep</code> = <code>grep -E</code>, <code>fgrep</code> = <code>grep -F</code>.",
        completion: "You can search with pattern files and fixed strings.",
      },

      /* ---------------------------------------------------------- 6.4 */
      {
        id: "6.4", title: "Clean up with sed", navSubtitle: "sed '/^$/d', s/…$/", objective: "103.7", difficulty: "Beginner to Intermediate",
        source: "Topic 4: sed for stream editing and cleanup (Labs 4A–4B)",
        summary: "Delete blank lines and replace text only at the end of a line, without touching the original file.",
        ticket: ticket("Project lead", "A maintenance handoff has stray blank lines, and some status lines end in <em>pending</em> that should say <em>complete</em>. The originals must not change.", ["sed"]),
        workspace: { ...base, files: { ...FILES, [WS + "/reports/status.txt"]: "patch web01 pending\npending review of db01\nreboot app02 pending\n" } },
        tasks: [
          { id: "blank", title: "Remove blank lines", short: "Save to <code>reports/clean-report.txt</code>", detail: "<code>sed '/^$/d' reports/noisy-report.txt &gt; reports/clean-report.txt</code>. <code>^$</code> is a line with nothing between start and end.", check: file("reports/clean-report.txt", "^line one\\nline three\\n?$") },
          { id: "verify", title: "Prove there are no blank lines", command: "grep -n '^$' reports/clean-report.txt", detail: "No output means no blank lines. Then check the original still has them.", check: pat("^grep -n ['\"]\\^\\$['\"] reports/clean-report\\.txt$") },
          { id: "end", title: "Replace only at the end", short: "Save to <code>reports/status-complete.txt</code>", detail: "<code>sed 's/pending$/complete/' reports/status.txt</code>. The <code>$</code> means only a final <em>pending</em> changes; \"pending review\" stays.", check: file("reports/status-complete.txt", "web01 complete\\npending review of db01\\nreboot app02 complete") },
          { id: "print", title: "Print just the warnings", command: "sed -n '/WARN/p' logs/incident-bridge.log", detail: "<code>-n</code> silences sed and <code>p</code> prints the matches, like grep.", check: { type: "all", checks: [pat("^sed -n "), out("WARN packet loss")] } },
        ],
        quiz: [
          { id: "default", prompt: "Does <code>sed '/^$/d' report.txt</code> change report.txt?", answer: "no", explain: "Correct. It writes to the screen; -i would edit the file.",
            options: [{ value: "no", label: "No, it prints the result" }, { value: "yes", label: "Yes, it deletes the lines in the file" }] },
          { id: "caret", prompt: "What does <code>^$</code> match?", answer: "empty", explain: "Correct. Start, then immediately end.",
            options: [{ value: "empty", label: "An empty line" }, { value: "any", label: "Any line" }, { value: "dollar", label: "A line containing $" }] },
        ],
        challenge: {
          prompt: "Remove the blank lines from <code>reports/noisy-report.txt</code> into <code>reports/clean-report.txt</code> with sed.",
          check: { accept: ["sed '/^$/d' reports/noisy-report.txt > reports/clean-report.txt", "sed \"/^$/d\" reports/noisy-report.txt > reports/clean-report.txt", "sed -e '/^$/d' reports/noisy-report.txt > reports/clean-report.txt"] },
          correct: "Correct.",
          incorrect: "Use sed's d command with the empty-line address ^$, redirected to the new file.",
        },
        memoryHook: "<code>sed '/pattern/d'</code> deletes matching lines. <code>sed -n '/pattern/p'</code> prints only them. <code>$</code> pins a substitution to the end.",
        completion: "You can clean reports with sed.",
      },

      /* ---------------------------------------------------------- 6.5 */
      {
        id: "6.5", title: "Where commands live", navSubtitle: "which, type, whereis", objective: "104.7", difficulty: "Beginner to Intermediate",
        source: "Topic 5: Finding command information with which, type, and whereis (Labs 5A–5B)",
        summary: "Prove which grep will run, whether it's an alias, and where its binary and manual page are.",
        ticket: ticket("Change manager", "Before tonight's maintenance, confirm where grep and sed run from and whether the shell changes them with an alias. Save it for the handoff, plus where grep's manual lives.", ["which", "type", "whereis"]),
        workspace: base,
        tasks: [
          { id: "review", title: "Paths and aliases into one file", short: "<code>reports/command-path-review.txt</code>", detail: "<code>which grep sed &gt; reports/command-path-review.txt</code>, then <code>type grep &gt;&gt; reports/command-path-review.txt</code>. On Mint, grep is an alias for <code>grep --color=auto</code>.", check: file("reports/command-path-review.txt", "/usr/bin/grep[\\s\\S]*/usr/bin/sed[\\s\\S]*grep is aliased") },
          { id: "whereis", title: "Binary and manual", short: "Save <code>whereis grep</code> to <code>reports/whereis-grep.txt</code>", detail: "<code>whereis</code> lists the binary, source and manual page paths.", check: file("reports/whereis-grep.txt", "^grep: /usr/bin/grep .*man1/grep\\.1\\.gz") },
          { id: "builtin", title: "See whereis miss a builtin", command: "whereis type", detail: "<code>type</code> is built into Bash, so there's no binary to find.", check: pat("^whereis type$") },
        ],
        quiz: [
          { id: "whichtype", prompt: "Which tells you a command is an alias?", answer: "type", explain: "Correct. which only searches PATH for files.",
            options: [{ value: "type", label: "<code>type</code>" }, { value: "which", label: "<code>which</code>" }, { value: "whereis", label: "<code>whereis</code>" }] },
          { id: "whereisq", prompt: "What does <code>whereis</code> find that <code>which</code> doesn't?", answer: "man", explain: "Correct. Binary, source and manual page locations.",
            options: [{ value: "man", label: "Manual pages (and source)" }, { value: "alias", label: "Aliases" }, { value: "running", label: "Running processes" }] },
        ],
        challenge: {
          prompt: "Prove whether <code>grep</code> is an alias, a builtin or a file on this system. Enter the one command.",
          check: { accept: ["type grep", "type -a grep"] },
          correct: "Correct. type reports aliases, builtins, keywords and files.",
          incorrect: "Use the command that explains how the shell will interpret a name.",
        },
        memoryHook: "<code>which</code> = where in PATH. <code>type</code> = what kind. <code>whereis</code> = binary + manual.",
        completion: "You can prove where a command comes from.",
      },

      /* ---------------------------------------------------------- 6.6 */
      {
        id: "6.6", title: "Find files with locate and find", navSubtitle: "locate, updatedb, find", objective: "104.7", difficulty: "Intermediate to Advanced",
        source: "Topic 6: Finding files with locate, updatedb, and find (Labs 6A–6C)",
        summary: "Search a file database with <code>locate</code>, see it go stale, refresh it, and search live with <code>find</code>.",
        ticket: ticket("Teammate", "A teammate needs the maintenance handoff file and a security audit file created this shift. Then operations wants every empty placeholder in the archive documented, but nothing deleted.", ["locate", "updatedb", "find"], {
          callout: { kind: "info", title: "This shift's file", text: "<code>reports/shift-audit.txt</code> was created after last night's <code>updatedb</code> run, so <code>locate</code> can't see it yet." } }),
        workspace: { ...base, lateFiles: { [WS + "/reports/shift-audit.txt"]: "audit started 08:00\n" } },
        tasks: [
          { id: "locate", title: "Fast search", command: "locate maintenance-handoff.txt", detail: "<code>locate</code> searches a database of file names, so it's instant.", check: { type: "all", checks: [pat("^locate .*maintenance-handoff"), out("lpic-section6-lab/reports/maintenance-handoff\\.txt$")] } },
          { id: "stale", title: "Watch locate miss a new file", command: "locate shift-audit.txt", detail: "No result, even though <code>ls reports</code> shows it. The database is from before the file existed.", check: pat("^locate .*shift-audit") },
          { id: "refresh", title: "Refresh the database", command: "sudo updatedb", detail: "<code>updatedb</code> rebuilds the database (it needs root). Then run <code>locate shift-audit.txt</code> again.", check: { type: "all", checks: [{ type: "history", includes: ["^sudo updatedb$"] }, pat("^locate .*shift-audit"), out("shift-audit\\.txt$")] } },
          { id: "find", title: "Live search with find", short: "Save the path to <code>reports/find-security-audit.txt</code>", detail: "<code>find ~/lpic-section6-lab -name 'security-audit.txt' &gt; reports/find-security-audit.txt</code>. Start as close to the file as you can.", check: file("reports/find-security-audit.txt", "lpic-section6-lab/reports/security-audit\\.txt|^\\./reports/security-audit\\.txt|^reports/security-audit\\.txt") },
          { id: "empty", title: "Document empty files, delete nothing", short: "Save to <code>reports/empty-files.txt</code>", detail: "<code>find archive -type f -empty &gt; reports/empty-files.txt</code>, then <code>xargs -r ls -l &lt; reports/empty-files.txt</code> to show them.", check: { type: "all", checks: [file("reports/empty-files.txt", "empty-placeholder\\.log[\\s\\S]*old-maintenance-note\\.txt|old-maintenance-note\\.txt[\\s\\S]*empty-placeholder\\.log", "rotated-app"), file("archive/empty-placeholder.log")] } },
        ],
        quiz: [
          { id: "stale", prompt: "Why didn't <code>locate</code> find a file you created an hour ago?", answer: "db", explain: "Correct. It searches a database that updatedb refreshes, usually nightly.",
            options: [{ value: "db", label: "Its database is older than the file" }, { value: "perm", label: "You need sudo for locate" }, { value: "name", label: "locate only finds directories" }] },
          { id: "start", prompt: "Why not always start <code>find</code> at <code>/</code>?", answer: "slow", explain: "Correct. It walks everything, including /proc, and prints many permission errors.",
            options: [{ value: "slow", label: "It's slow and noisy; start near the likely location" }, { value: "danger", label: "It can delete files" }, { value: "cant", label: "find can't search /" }] },
        ],
        challenge: {
          prompt: "Find every empty regular file under <code>archive</code>, without deleting anything. Enter the command.",
          check: { accept: ["find archive -type f -empty", "find archive/ -type f -empty", "find ./archive -type f -empty", "find archive -empty -type f", "find ~/lpic-section6-lab/archive -type f -empty"] },
          correct: "Correct. find lists them; nothing is touched unless you add -delete.",
          incorrect: "Use find on archive with the file type and empty tests.",
        },
        memoryHook: "<code>locate</code> = phone book (fast, can be out of date). <code>find</code> = knocking on every door (slow, always current).",
        completion: "You can find files fast or precisely.",
      },

      /* ---------------------------------------------------------- 6.7 (added) */
      {
        id: "6.7", title: "Where things live and deeper find", navSubtitle: "FHS, -size, -mtime, -exec (added)", objective: "104.7", difficulty: "Advanced",
        source: "Added for exam objective 104.7",
        summary: "Learn the standard Linux directory layout, and use <code>find</code> by size, age and with <code>-exec</code>.",
        ticket: ticket("Senior engineer", "A disk-space ticket: you need to know where configs, logs and add-on software normally live, find large and old files in the archive, and act on what you find.", ["ls /", "find -size", "find -mtime", "find -exec"], {
          callout: { kind: "info", title: "Filesystem Hierarchy Standard", text: "<code>/etc</code> configs, <code>/var</code> changing data (logs in <code>/var/log</code>), <code>/usr</code> installed programs, <code>/opt</code> add-on software, <code>/home</code> users, <code>/tmp</code> temporary, <code>/boot</code> kernel, <code>/dev</code> devices, <code>/proc</code> and <code>/sys</code> live kernel info." } }),
        workspace: base,
        tasks: [
          { id: "root", title: "Look at the top level", command: "ls /", detail: "Every Linux system has this same layout. That's the FHS.", check: pat("^ls (-\\w+ )?/$") },
          { id: "etc", title: "Configs live in /etc", command: "find /etc -name 'sshd_config'", detail: "System-wide configuration files go in <code>/etc</code>.", check: { type: "all", checks: [pat("^find /etc "), out("^/etc/ssh/sshd_config$")] } },
          { id: "size", title: "Find big files", command: "find archive -type f -size +2k", detail: "<code>-size +2k</code> means larger than 2 KiB. <code>-size -1k</code> is smaller; <code>c</code> is bytes, <code>M</code> megabytes.", check: { type: "all", checks: [pat("-size \\+"), out("rotated-app\\.log")] } },
          { id: "mtime", title: "Find old files", command: "find archive -type f -mtime +30", detail: "<code>-mtime +30</code> is modified more than 30 days ago; <code>-mtime -1</code> is within the last day.", check: { type: "all", checks: [pat("-mtime \\+"), out("old-maintenance-note\\.txt"), out("rotated-app\\.log")] } },
          { id: "exec", title: "Act on each result", command: "find archive -type f -mtime +30 -exec ls -l {} \\;", detail: "<code>-exec … {} \\;</code> runs the command once per file, with <code>{}</code> replaced by the name. End with <code>+</code> to pass them all at once.", check: pat("-exec .*\\{\\} ?(\\\\;|';'|\\+)") },
          { id: "updatedbconf", title: "What locate skips", command: "cat /etc/updatedb.conf", detail: "<code>PRUNEPATHS</code> and <code>PRUNEFS</code> list the paths and filesystem types updatedb leaves out, which is why locate never finds files in /tmp.", check: pat("^(cat|less|grep .*) .*/etc/updatedb\\.conf$") },
        ],
        quiz: [
          { id: "fhs-var", prompt: "Where do log files normally live?", answer: "varlog", explain: "Correct. /var holds data that changes while the system runs.",
            options: [{ value: "varlog", label: "<code>/var/log</code>" }, { value: "etc", label: "<code>/etc/log</code>" }, { value: "usr", label: "<code>/usr/log</code>" }, { value: "tmp", label: "<code>/tmp</code>" }] },
          { id: "fhs-opt", prompt: "A vendor's self-contained add-on package should install under…", answer: "opt", explain: "Correct. /opt is for add-on application software.",
            options: [{ value: "opt", label: "<code>/opt</code>" }, { value: "srv", label: "<code>/srv</code>" }, { value: "home", label: "<code>/home</code>" }, { value: "boot", label: "<code>/boot</code>" }] },
          { id: "mtime", prompt: "<code>find . -mtime -7</code> finds files modified…", answer: "within", explain: "Correct. -7 is less than 7 days; +7 is more than 7 days.",
            options: [{ value: "within", label: "Within the last 7 days" }, { value: "over", label: "More than 7 days ago" }, { value: "exact", label: "Exactly 7 days ago only" }] },
          { id: "srv", prompt: "Data served by this system, like a website's files, belongs in…", answer: "srv", explain: "Correct. /srv is for site-specific data served by the system.",
            options: [{ value: "srv", label: "<code>/srv</code>" }, { value: "var", label: "<code>/var/tmp</code>" }, { value: "media", label: "<code>/media</code>" }] },
        ],
        challenge: {
          prompt: "Find regular files under <code>archive</code> larger than 2 KiB and modified more than 30 days ago. Enter one find command.",
          check: { accept: ["find archive -type f -size +2k -mtime +30", "find archive -type f -mtime +30 -size +2k", "find archive -size +2k -mtime +30 -type f", "find archive/ -type f -size +2k -mtime +30"] },
          correct: "Correct. Tests side by side are ANDed together.",
          incorrect: "Combine -type f, -size +2k and -mtime +30 in one find.",
        },
        memoryHook: "<code>+</code> more than, <code>-</code> less than, no sign = exactly. Applies to <code>-size</code>, <code>-mtime</code> and <code>-mmin</code>.",
        completion: "You know where things live and can find them by any attribute.",
      },

      /* ---------------------------------------------------------- 6.8 (added) */
      {
        id: "6.8", title: "Quantifiers, classes and sed in place", navSubtitle: ". * {n,m} [[:digit:]], sed -n -E -i (added)", objective: "103.7", difficulty: "Advanced",
        source: "Added for exam objective 103.7",
        summary: "Match any character, repeat with quantifiers, use POSIX character classes, pull out just the match, print line ranges with sed, rewrite fields with groups, and edit a file in place with a backup.",
        ticket: ticket("Network engineer", "The host inventory needs an audit before a firewall change: find hosts by pattern, list every IP and the high ports, build a hosts-file view, and fix one port in the file itself, keeping a backup.", ["grep -i -o -E", "[[:digit:]]", "sed -n", "sed -E", "sed -i.bak"], {
          callout: { kind: "info", title: "Quantifiers", text: "<code>.</code> any one character · <code>*</code> zero or more of the thing before · <code>+</code> one or more · <code>?</code> zero or one · <code>{n,m}</code> between n and m. In basic regex, write <code>\\+ \\? \\{n,m\\}</code>; with <code>grep -E</code> or <code>sed -E</code>, no backslashes." } }),
        workspace: { ...base, files: { ...FILES, [INV]: "web01 10.10.1.21 port=443 owner=ops\nweb02 10.10.1.22 port=8443 owner=ops\ndb01 10.10.2.5 port=5432 owner=dba\napp02 10.10.3.101 port=80 owner=ops\nbackup-host 10.10.9.250 port=22 owner=storage\nWEB03 10.10.1.23 port=443 owner=ops\n" } },
        tasks: [
          { id: "look", title: "Look at the inventory", command: "cat configs/hosts-inventory.txt", detail: "Six hosts: name, IP, port and owner. On your VM, create this file with the same six lines.", check: { type: "all", checks: [pat("^(cat|less|more) configs/hosts-inventory\\.txt$")] } },
          { id: "dot", title: "Any one character", command: "grep 'web0.' configs/hosts-inventory.txt", detail: "<code>.</code> matches exactly one character, so <code>web0.</code> finds web01 and web02. WEB03 doesn't match: regex is case-sensitive.", check: { type: "all", checks: [pat("^grep (-\\w+ )*['\"]?web0\\.['\"]? configs/hosts-inventory\\.txt$"), out("^web02 ")] } },
          { id: "case", title: "Ignore case", command: "grep -i 'web0.' configs/hosts-inventory.txt", detail: "<code>-i</code> makes the match case-insensitive, so WEB03 shows up too.", check: { type: "all", checks: [pat("^grep (-\\w*i\\w* )"), out("^WEB03 ")] } },
          { id: "class", title: "High ports with a character class", short: "Ports with 4 or more digits, saved to <code>reports/high-ports.txt</code>", detail: "<code>grep -E 'port=[[:digit:]]{4,}' configs/hosts-inventory.txt &gt; reports/high-ports.txt</code>. <code>[[:digit:]]</code> is the same as <code>[0-9]</code>; <code>{4,}</code> means four or more. Other classes: <code>[[:alpha:]]</code>, <code>[[:upper:]]</code>, <code>[[:space:]]</code>, <code>[[:alnum:]]</code>.", check: file("reports/high-ports.txt", "^web02 [\\s\\S]*^db01 ", "port=443 |port=80 |port=22 ") },
          { id: "ips", title: "Only the IP addresses", short: "Save just the IPs, one per line, to <code>reports/ip-list.txt</code>", detail: "<code>grep -o -E '([0-9]{1,3}\\.){3}[0-9]{1,3}' configs/hosts-inventory.txt &gt; reports/ip-list.txt</code>. <code>-o</code> prints only the matched part. The dot is escaped (<code>\\.</code>) because a bare <code>.</code> would match any character.", check: file("reports/ip-list.txt", "^10\\.10\\.1\\.21\\n10\\.10\\.1\\.22\\n10\\.10\\.2\\.5\\n10\\.10\\.3\\.101\\n10\\.10\\.9\\.250\\n10\\.10\\.1\\.23\\n?$") },
          { id: "range", title: "Print a range of lines", command: "sed -n '2,4p' configs/hosts-inventory.txt", detail: "<code>-n</code> turns off sed's automatic printing; <code>2,4p</code> prints lines 2 to 4. <code>$p</code> prints the last line, and <code>'/db/,$p'</code> prints from the first match to the end.", check: { type: "all", checks: [pat("^sed -n (-e )?['\"]?2,4p['\"]? "), out("^db01 ")] } },
          { id: "groups", title: "Rewrite fields with groups", short: "Hosts-file view (IP, then name) in <code>reports/hosts-view.txt</code>", detail: "<code>sed -E 's/^([^ ]+) ([^ ]+) .*/\\2 \\1/' configs/hosts-inventory.txt &gt; reports/hosts-view.txt</code>. Each <code>( )</code> captures text; <code>\\1</code> and <code>\\2</code> put it back. Without <code>-E</code>, write the groups as <code>\\( \\)</code>.", check: file("reports/hosts-view.txt", "^10\\.10\\.1\\.21 web01$[\\s\\S]*^10\\.10\\.9\\.250 backup-host$", "port=") },
          { id: "inplace", title: "Edit the file in place, with a backup", command: "sed -i.bak 's/port=80 /port=8080 /' configs/hosts-inventory.txt", detail: "<code>-i</code> writes the change back into the file. <code>-i.bak</code> first saves the original as <code>hosts-inventory.txt.bak</code>. The space after 80 stops it touching port=8443. Compare the two with <code>diff configs/hosts-inventory.txt.bak configs/hosts-inventory.txt</code>.", check: { type: "all", checks: [file("configs/hosts-inventory.txt", "^app02 .*port=8080 ", "port=80 |port=808443"), file("configs/hosts-inventory.txt.bak", "^app02 .*port=80 ")] } },
        ],
        quiz: [
          { id: "star", prompt: "Which of these lines does the basic regex <code>ab*c</code> match?", answer: "ac", explain: "Correct. <code>*</code> means zero or more b's, so ac, abc and abbbc all match.",
            options: [{ value: "ac", label: "<code>ac</code>" }, { value: "axc", label: "<code>axc</code>" }, { value: "abd", label: "<code>abd</code>" }] },
          { id: "dotstar", prompt: "What does <code>.*</code> match?", answer: "any", explain: "Correct. Any character, any number of times, including none.",
            options: [{ value: "any", label: "Any run of characters, including nothing" }, { value: "dot", label: "Dots only" }, { value: "one", label: "Exactly one character" }] },
          { id: "brace", prompt: "Without <code>-E</code>, how do you write \"two or three digits\" for grep?", answer: "bre", explain: "Correct. Basic regex needs the backslashes; grep -E takes [0-9]{2,3}.",
            options: [{ value: "bre", label: "<code>[0-9]\\{2,3\\}</code>" }, { value: "ere", label: "<code>[0-9]{2,3}</code>" }, { value: "paren", label: "<code>[0-9](2,3)</code>" }] },
          { id: "ibak", prompt: "What does <code>sed -i.bak 's/a/b/' f.txt</code> leave behind?", answer: "both", explain: "Correct. f.txt has the change; f.txt.bak is the original.",
            options: [{ value: "both", label: "f.txt changed, and f.txt.bak with the original" }, { value: "out", label: "Only screen output; f.txt is unchanged" }, { value: "bak", label: "f.txt.bak with the change; f.txt unchanged" }] },
          { id: "classdigit", prompt: "Which character class is the same as <code>[0-9]</code>?", answer: "digit", explain: "Correct. Note the double brackets: the class goes inside a bracket expression.",
            options: [{ value: "digit", label: "<code>[[:digit:]]</code>" }, { value: "num", label: "<code>[:num:]</code>" }, { value: "alnum", label: "<code>[[:alnum:]]</code>" }] },
        ],
        challenge: {
          prompt: "Print only lines 2 through 4 of <code>configs/hosts-inventory.txt</code> with sed. Enter the command.",
          examPrompt: "Use sed to print only lines 2 through 4 of <code>hosts.txt</code>. Enter the command.",
          check: { accept: ["sed -n '2,4p' configs/hosts-inventory.txt", "sed -n 2,4p configs/hosts-inventory.txt", "sed -n \"2,4p\" configs/hosts-inventory.txt", "sed -n -e '2,4p' configs/hosts-inventory.txt", "sed -n '2,4p' hosts.txt", "sed -n 2,4p hosts.txt", "sed -n \"2,4p\" hosts.txt", "sed -n -e '2,4p' hosts.txt"] },
          correct: "Correct. -n stops the automatic print, and 2,4p prints just that range.",
          incorrect: "Use sed -n with the address range 2,4 and the p command.",
        },
        memoryHook: "<code>.</code> one of anything, <code>*</code> zero or more, <code>+</code> one or more, <code>?</code> maybe, <code>{n,m}</code> a count. <code>sed -n …p</code> = print only; <code>sed -i.bak</code> = edit the file, keep the original.",
        completion: "You can write precise patterns and edit files safely with sed.",
      },

      /* ---------------------------------------------------------- 6.C */
      {
        id: "6.C", navNumber: "C", title: "Challenge exam: evidence pack", navSubtitle: "No notes", objective: "103.7", difficulty: "Hard",
        source: "Scenario-Based Challenge Exam", noHints: true, tasksHeading: "Evidence to produce",
        summary: "The workbook's seven challenge tasks. Each is checked by what you produce.",
        ticket: ticket("Incident commander", "Build an evidence pack in <code>reports/</code>. Leave every source file unchanged and delete nothing.", ["grep", "sed", "type", "find"], { heading: "Ticket: evidence pack" }),
        workspace: base,
        tasks: [
          { id: "c1", title: "reports/c-signals.txt: every WARN and ERROR line from the bridge log", check: file("reports/c-signals.txt", "WARN packet[\\s\\S]*ERROR vpn[\\s\\S]*WARN follow", "INFO") },
          { id: "c2", title: "reports/c-bash.txt: every account ending with /bin/bash", check: file("reports/c-bash.txt", "^root:[\\s\\S]*^deploy:[\\s\\S]*^tempuser:", "nologin|/sbin/shutdown") },
          { id: "c3", title: "reports/c-patterns.txt: auth-review lines for the names in pattern-file.txt", check: file("reports/c-patterns.txt", "^root:[\\s\\S]*^svc-backup:[\\s\\S]*^shutdown:", "deploy|tempuser") },
          { id: "c4", title: "reports/c-clean.txt: the noisy report without blank lines (original unchanged)", check: { type: "all", checks: [file("reports/c-clean.txt", "^line one\\nline three\\n?$"), file("reports/noisy-report.txt", "line one\\n\\nline three")] } },
          { id: "c5", title: "Prove whether grep is an alias, builtin or file", check: { type: "all", checks: [pat("^type( -a)? grep$"), out("aliased")] } },
          { id: "c6", title: "Find security-audit.txt with find", check: { type: "all", checks: [pat("^find .*security-audit"), out("reports/security-audit\\.txt$")] } },
          { id: "c7", title: "reports/c-empty.txt: empty files under archive, none deleted", check: { type: "all", checks: [file("reports/c-empty.txt", "empty-placeholder\\.log", "rotated-app"), file("archive/empty-placeholder.log")] } },
        ],
        quiz: [],
        completion: "Evidence pack complete.",
      },
    ],

    review: {
      traps: [
        "Shell wildcards and regex differ: `*.log` as a glob is `.*\\.log` as a regex.",
        "`+`, `?`, `|`, `( )` and `{ }` need `grep -E` (or a backslash in basic regex).",
        "Quote patterns that contain shell characters such as `|`, `$`, `*` and `#`.",
        "`[46]` matches one character, a 4 or a 6, never the string 46.",
        "`-f` reads patterns from a file; `-F` treats patterns as fixed strings. `egrep` = `grep -E`, `fgrep` = `grep -F`.",
        "`sed` writes to standard output; it doesn't change the file unless you use `-i`. `-i.bak` keeps the original as a `.bak` file.",
        "Character classes need double brackets: `[[:digit:]]`. A bare `[:digit:]` is a bracket list of the characters d, i, g, t and `:`.",
        "`*` repeats the thing before it, zero or more times; `.*` means anything. A regex `*` is not a shell glob.",
        "`locate` uses a database that can be stale; `updatedb` refreshes it, and `/etc/updatedb.conf` controls what it skips.",
        "Start `find` close to where the file probably is, not at `/`.",
        "`which` and `type` overlap, but only `type` knows about aliases, builtins and keywords. `whereis` adds manual pages.",
        "In find, `+N` means more than N and `-N` less than N, for `-size`, `-mtime` and `-mmin`.",
        "`-exec cmd {} \\;` runs once per file; `-exec cmd {} +` runs once with all of them.",
      ],
      trapQuiz: [
        { id: "t1", prompt: "Which matches lines that are only digits?", answer: "digits", options: [{ value: "digits", label: "<code>grep -E '^[0-9]+$'</code>" }, { value: "star", label: "<code>grep '[0-9]*'</code>" }, { value: "noanchor", label: "<code>grep -E '[0-9]+'</code>" }], explain: "Correct. [0-9]* also matches empty, and without anchors any line with a digit matches." },
        { id: "t2", prompt: "Which finds files in /var/log bigger than 10 MB?", answer: "find", options: [{ value: "find", label: "<code>find /var/log -size +10M</code>" }, { value: "minus", label: "<code>find /var/log -size -10M</code>" }, { value: "locate", label: "<code>locate -size 10M</code>" }], explain: "Correct." },
        { id: "t3", prompt: "Why does <code>grep root|bash file</code> fail?", answer: "pipe", options: [{ value: "pipe", label: "The shell treats | as a pipe because the pattern isn't quoted" }, { value: "E", label: "It needs -E" }, { value: "file", label: "grep can't read files" }], explain: "Correct. Quote it: grep -E 'root|bash' file." },
        { id: "t4", prompt: "Where is the configuration that tells updatedb what to skip?", answer: "conf", options: [{ value: "conf", label: "<code>/etc/updatedb.conf</code>" }, { value: "var", label: "<code>/var/lib/locate</code>" }, { value: "profile", label: "<code>~/.locaterc</code>" }], explain: "Correct." },
        { id: "t5", prompt: "Which directory holds the kernel and boot loader files?", answer: "boot", options: ["/boot", "/etc", "/usr", "/var"], explain: "Correct." },
      ],
      challenge: {
        intro: "Complete these on your Linux Mint VM without notes, using only the files in your lab folder.",
        tasks: [
          "Find all warning and error lines in the incident bridge log and save them to a report.",
          "Find all accounts that end with `/bin/bash`.",
          "Use a pattern file to search for root, shutdown and svc-backup in the auth review log.",
          "Remove blank lines from the noisy report without changing the original file.",
          "Prove whether grep is an alias, built-in or executable on your system.",
          "Find the file named `security-audit.txt` using `find`.",
          "Find all empty files under the archive directory without deleting them.",
          "Find files in `/var/log` larger than 1 MB, and log files modified in the last day.",
        ],
        outro: "",
      },
      questions: [
        { q: "Manager request: “Before tonight’s maintenance, confirm where grep and sed run from and save the output for the handoff.”", a: "<code>which grep sed &gt; handoff.txt; type grep sed &gt;&gt; handoff.txt</code>. which gives the paths; type shows that grep is an alias on Mint." },
        { q: "Security analyst request: “Show me only the accounts in this mock password file that have an interactive Bash shell.”", a: "<code>grep -E '/bin/bash$' logs/auth-review.log</code>, or <code>cut -d: -f1</code> on that output for just the names." },
        { q: "Incident bridge request: “Pull all lines showing packet loss, reset, or restoration from the bridge log.”", a: "<code>grep -E 'packet loss|reset|restored' logs/incident-bridge.log</code>, quoted so the shell doesn't treat | as a pipe." },
        { q: "Project lead request: “Clean the blank lines out of this report, but do not modify the original file.”", a: "<code>sed '/^$/d' report.txt &gt; clean.txt</code> (or <code>grep -v '^$'</code>). No -i, so the original stays." },
        { q: "Teammate request: “Locate the security audit file. If locate does not find it, use a live search.”", a: "<code>locate security-audit.txt</code>; if it's new, <code>sudo updatedb</code> first, or search live with <code>find ~/lpic-section6-lab -name security-audit.txt</code>." },
        { q: "Operations handoff request: “Find empty placeholder files in the archive folder and document them. Do not remove anything.”", a: "<code>find archive -type f -empty &gt; empty-files.txt</code>, then <code>xargs -r ls -l &lt; empty-files.txt</code>. No -delete." },
      ],
      mastery: [
        "I can use basic regular expressions with grep.",
        "I can use grep -E for extended regular expressions, including quantifiers like `{n,m}`.",
        "I can quote or escape patterns that contain shell metacharacters.",
        "I can use grep -F and grep -f correctly, and know egrep and fgrep.",
        "I can use sed to replace text and remove blank lines safely.",
        "I can explain the difference between which, type and whereis.",
        "I can explain why locate may miss a new file, and what updatedb and updatedb.conf do.",
        "I can use find with name, type, empty, size, mtime and -exec, from a sensible starting directory.",
        "I can name what lives in /etc, /var, /usr, /opt, /home, /tmp, /boot, /dev and /proc.",
        "I can turn a command into evidence for an incident note, audit request or maintenance handoff.",
      ],
    },
  });
})();
