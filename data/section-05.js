/* Section 5: Streams, pipes and redirects (103.4). From "LPIC - Section 5.docx".
   Lesson 5.6 adds exam items the workbook doesn't cover: 2>&1, &>, here-documents and tee -a. */
(function () {
  const WS = "~/lpic1-section5";
  const FILES = {
    [WS + "/reports/server-list.txt"]: "alpha\nfoxtrot\ncharlie\nnovember\nsierra\n",
    [WS + "/users/mock-passwd"]: "root:x:0:0:root:/root:/bin/bash\nbackup:x:34:34:backup:/var/backups:/usr/sbin/nologin\nmax:x:1000:1000:Max:/home/max:/bin/bash\nsvc_dns:x:1001:1001:DNS Service:/srv/dns:/usr/sbin/nologin\n",
    [WS + "/logs/incident.log"]: "INFO service dns started\nWARN packet loss detected\nERROR dns lookup failed\nINFO service recovered\nERROR permission denied reading config\n",
    [WS + "/logs/network-check.log"]: "host=lab-gw01 status=up latency=22ms\nhost=lab-sw01 status=down latency=timeout\nhost=lab-dns01 status=up latency=18ms\n",
    [WS + "/configs/"]: null,
    [WS + "/tmp/"]: null,
  };
  const base = { user: "max", host: "linux-mint", cwd: WS, files: FILES };
  const ticket = (requestedBy, body, tools, extra = {}) => ({ requestedBy, system: "Linux Mint VM", badge: "Support engineer", tools, body, ...extra });
  const pat = (re) => ({ type: "pattern", re });
  const file = (name, re, not) => ({ type: "file", path: WS + "/" + name, re, not });
  const hist = (...includes) => ({ type: "history", includes });

  LPIC.section({
    id: "section-05",
    number: 5,
    title: "Streams, Pipes and Redirects",
    objectives: ["103.4"],
    kind: "terminal",
    source: "LPIC - Section 5.docx",
    scenario: "You're a Linux support engineer. Feed files into commands, save and append reports, chain commands with pipes, keep errors apart from real output, and turn lists into arguments, without damaging the source data.",
    overview: {
      paragraphs: [
        "Every program has three streams: standard input (0, normally the keyboard), standard output (1, normally the screen) and standard error (2, also the screen). Redirects and pipes reconnect them.",
        "On your VM, the workbook's Lab Setup creates <code>~/lpic1-section5</code> with <code>logs</code>, <code>reports</code>, <code>configs</code>, <code>users</code> and <code>tmp</code>, plus four sample files. The practice terminal already has them. Lesson 5.6 is added: it covers exam items the workbook doesn't.",
      ],
      commands: ["cmd < file", "cmd > file", "cmd >> file", "cmd 2> file", "cmd 2>> file", "cmd 2>/dev/null", "cmd > file 2>&1", "cmd &> file", "cmd1 | cmd2", "tee", "tee -a", "xargs", "xargs -a", "xargs -n", "xargs -I {}", "$(command)", "`command`", "cat <<EOF", "tr", "sort", "grep", "cut", "wc", "printf"],
      memoryHook: "<code>&lt;</code> read from a file. <code>&gt;</code> create or replace. <code>&gt;&gt;</code> add to the end. <code>|</code> hand the output to the next command. <code>2&gt;</code> save errors. <code>2&gt;/dev/null</code> throw errors away. <code>tee</code> see it and save it. <code>xargs</code> turn a list into arguments. <code>$( )</code> put one command's answer inside another.",
    },

    lessons: [
      /* ---------------------------------------------------------- 5.1 */
      {
        id: "5.1", title: "Redirect standard input", navSubtitle: "< and >", objective: "103.4", difficulty: "Easy",
        source: "Lab 1: Redirect Standard Input with tr",
        summary: "Make a command read a file instead of the keyboard with <code>&lt;</code>, and save its output with <code>&gt;</code>.",
        ticket: ticket("Teammate", "A teammate's account data uses colons, but the handoff needs a readable comma-separated report. The original must not change.", ["tr", "cat", "head"]),
        workspace: base,
        tasks: [
          { id: "look", title: "Look at the original", command: "cat users/mock-passwd", detail: "Four accounts, colon-separated.", check: pat("^cat users/mock-passwd$") },
          { id: "convert", title: "Convert and save", command: "tr ':' ',' < users/mock-passwd > reports/passwd-readable.csv", detail: "Read left to right: <code>tr</code> swaps colons for commas, <code>&lt;</code> feeds it the file, <code>&gt;</code> saves the result in a new file.", check: file("reports/passwd-readable.csv", "^root,x,0,0,root,/root,/bin/bash$") },
          { id: "check", title: "Check both files", command: "head reports/passwd-readable.csv users/mock-passwd", detail: "The report has commas; the original still has colons.", check: { type: "all", checks: [hist("^(head|cat) (reports/passwd-readable\\.csv|.*passwd-readable)"), file("users/mock-passwd", "^root:x:0:0")] } },
        ],
        quiz: [
          { id: "dir", prompt: "In <code>cmd &lt; in &gt; out</code>, which way does the data flow?", answer: "lr", explain: "Correct. < points into the command; > points out to the file.",
            options: [{ value: "lr", label: "From <code>in</code> into cmd, and from cmd out to <code>out</code>" }, { value: "rl", label: "From <code>out</code> into cmd, then to <code>in</code>" }, { value: "both", label: "Both files are inputs" }] },
          { id: "fd", prompt: "Which file descriptor number is standard input?", answer: "0", explain: "Correct. 0 stdin, 1 stdout, 2 stderr.", options: ["0", "1", "2"] },
        ],
        challenge: {
          prompt: "Write the general pattern: run <code>cmd</code> reading <code>input-file</code> and saving to <code>output-file</code>.",
          answerPrefix: "", placeholder: "cmd ... input-file ... output-file",
          check: { accept: ["cmd < input-file > output-file", "cmd > output-file < input-file"] },
          correct: "Correct. command < input-file > output-file.",
          incorrect: "Use < for the input file and > for the output file.",
        },
        memoryHook: "The arrow points the way the data moves: <code>&lt;</code> into the command, <code>&gt;</code> out of it.",
        completion: "You can feed a file to a command and save the result.",
      },

      /* ---------------------------------------------------------- 5.2 */
      {
        id: "5.2", title: "Build an operations report", navSubtitle: "> vs >>", objective: "103.4", difficulty: "Easy",
        source: "Lab 2: Redirect Standard Output into an Operations Report",
        summary: "Create a report with <code>&gt;</code>, add to it with <code>&gt;&gt;</code>, and see what <code>&gt;</code> does to an existing file.",
        ticket: ticket("Maintenance lead", "During a maintenance window, the lead wants a sorted server list with a verification line at the bottom. The source list must stay in its original order.", ["sort", "printf", "date"]),
        workspace: base,
        tasks: [
          { id: "sort", title: "Sort into a new report", command: "sort reports/server-list.txt > reports/sorted-server-list.txt", detail: "<code>&gt;</code> creates the file, or replaces it if it exists.", check: file("reports/sorted-server-list.txt", "^alpha\\ncharlie\\nfoxtrot\\nnovember\\nsierra") },
          { id: "append", title: "Append a verification line", command: "printf '%s\\n' \"Verified by Max on $(date +%F)\" >> reports/sorted-server-list.txt", detail: "<code>&gt;&gt;</code> adds to the end. <code>$(date +%F)</code> puts today's date (YYYY-MM-DD) into the line.", check: file("reports/sorted-server-list.txt", "^sierra\\nVerified by .* on \\d{4}-\\d\\d-\\d\\d$") },
          { id: "source", title: "Prove the source didn't change", command: "cat reports/server-list.txt", detail: "Still alpha, foxtrot, charlie, november, sierra.", check: { type: "all", checks: [pat("^cat reports/server-list\\.txt$"), file("reports/server-list.txt", "^alpha\\nfoxtrot")] } },
          { id: "clobber", title: "See > replace a file", command: "echo oops > reports/scratch.txt", detail: "Run <code>echo first &gt; reports/scratch.txt</code>, then <code>echo oops &gt; reports/scratch.txt</code>, then <code>cat</code> it. Only oops is left: <code>&gt;</code> wipes the file first.", check: file("reports/scratch.txt", "^oops\\n?$") },
        ],
        quiz: [
          { id: "gt", prompt: "What does <code>&gt;</code> do to a file that already exists?", answer: "replace", explain: "Correct. > empties the file first; >> appends.",
            options: [{ value: "replace", label: "Replaces its contents" }, { value: "append", label: "Adds to the end" }, { value: "error", label: "Refuses and shows an error" }] },
          { id: "trap", prompt: "<code>sort list.txt &gt; list.txt</code>: what's left in list.txt?", answer: "empty", explain: "Correct. The shell empties list.txt before sort even reads it.",
            options: [{ value: "empty", label: "Nothing. The file is emptied before sort runs" }, { value: "sorted", label: "The sorted list" }, { value: "same", label: "The original list" }] },
        ],
        challenge: {
          prompt: "Add the line <code>Window closed</code> to the end of <code>reports/sorted-server-list.txt</code> without removing anything. Enter the command.",
          check: { accept: ["echo 'Window closed' >> reports/sorted-server-list.txt", "echo \"Window closed\" >> reports/sorted-server-list.txt", "echo Window closed >> reports/sorted-server-list.txt", "printf '%s\\n' 'Window closed' >> reports/sorted-server-list.txt"] },
          correct: "Correct. >> appends.",
          incorrect: "Use echo with the append redirect.",
        },
        memoryHook: "One <code>&gt;</code> = one new file (old content gone). Two <code>&gt;&gt;</code> = add on.",
        completion: "You can create and append to reports safely.",
      },

      /* ---------------------------------------------------------- 5.3 */
      {
        id: "5.3", title: "Build an incident pipeline", navSubtitle: "| and tee", objective: "103.4", difficulty: "Medium",
        source: "Lab 3: Build an Incident Pipeline",
        summary: "Pass one command's output to another with <code>|</code>, and use <code>tee</code> to see output and save it at once.",
        ticket: ticket("Incident bridge", "The bridge needs the error messages from the incident log quickly: how many there are, plus a saved copy for the handoff.", ["grep", "wc", "tee"]),
        workspace: base,
        tasks: [
          { id: "grep", title: "Find the errors", command: "grep 'ERROR' logs/incident.log", detail: "Exact, uppercase ERROR.", check: pat("^grep ['\"]?ERROR['\"]? logs/incident\\.log$") },
          { id: "count", title: "Count them with a pipe", command: "grep 'ERROR' logs/incident.log | wc -l", detail: "The pipe sends grep's output into <code>wc -l</code>. The answer is 2.", check: { type: "all", checks: [pat("\\| ?wc -l$"), { type: "output", re: "^2$" }] } },
          { id: "tee", title: "See it and save it", command: "grep 'ERROR' logs/incident.log | tee reports/error-lines.txt", detail: "<code>tee</code> writes to the file <em>and</em> passes the lines on to the screen.", check: file("reports/error-lines.txt", "^ERROR dns lookup failed\\nERROR permission denied") },
          { id: "chain", title: "A longer pipeline", command: "cut -d: -f1,7 users/mock-passwd | grep nologin | sort", detail: "Pipes can go on and on. Which accounts can't log in?", check: { type: "all", checks: [pat("\\|.*\\|"), { type: "output", re: "nologin" }] } },
        ],
        quiz: [
          { id: "teeq", prompt: "What does <code>tee</code> do that <code>&gt;</code> doesn't?", answer: "both", explain: "Correct. tee splits the stream: one copy to the file, one onward.",
            options: [{ value: "both", label: "Saves the output and still shows it (or passes it on)" }, { value: "append", label: "Appends instead of replacing" }, { value: "errors", label: "Saves error messages" }] },
          { id: "orig", prompt: "Does <code>grep ERROR log | wc -l</code> change the log file?", answer: "no", explain: "Correct. Pipes only pass data along; files are untouched.",
            options: [{ value: "no", label: "No" }, { value: "yes", label: "Yes, it removes the matching lines" }] },
        ],
        challenge: {
          prompt: "Count the ERROR lines in <code>logs/incident.log</code> using a pipe. Enter the command.",
          check: { accept: ["grep ERROR logs/incident.log | wc -l", "grep 'ERROR' logs/incident.log | wc -l", "grep \"ERROR\" logs/incident.log | wc -l", "cat logs/incident.log | grep ERROR | wc -l"] },
          correct: "Correct. (grep -c ERROR does it without a pipe.)",
          incorrect: "Send grep's matches into wc -l with a pipe.",
        },
        memoryHook: "<code>tee</code> is a T-junction in a pipe: one branch to the file, one onward. <code>tee -a</code> appends.",
        completion: "You can build pipelines and keep copies with tee.",
      },

      /* ---------------------------------------------------------- 5.4 */
      {
        id: "5.4", title: "Redirect standard error", navSubtitle: "2>, 2>/dev/null", objective: "103.4", difficulty: "Medium",
        source: "Lab 4: Redirect Standard Error Safely",
        summary: "Keep error messages apart from real output: save them with <code>2&gt;</code>, or throw them away with <code>2&gt;/dev/null</code>.",
        ticket: ticket("Senior engineer", "A search across several logs is noisy because one log is missing. Keep the real matches on screen, save the errors once for the ticket, then hide them.", ["grep", "/dev/null"]),
        workspace: base,
        tasks: [
          { id: "save", title: "Save only the errors", command: "grep 'ERROR' logs/incident.log logs/missing.log 2> reports/search-errors.txt", detail: "The matches still appear, because only stream 2 was redirected.", check: file("reports/search-errors.txt", "missing\\.log: No such file or directory") },
          { id: "look", title: "Read the error report", command: "cat reports/search-errors.txt", detail: "Only the error message is in it.", check: pat("^cat reports/search-errors\\.txt$") },
          { id: "hide", title: "Discard expected errors", command: "grep 'ERROR' logs/incident.log logs/missing.log 2>/dev/null", detail: "<code>/dev/null</code> swallows anything written to it. The matches stay; the noise is gone.", check: pat("2> ?/dev/null$") },
          { id: "append", title: "Append errors", command: "cat logs/nothing.log 2>> reports/search-errors.txt", detail: "<code>2&gt;&gt;</code> adds errors to the end instead of replacing the file.", check: file("reports/search-errors.txt", "nothing\\.log") },
        ],
        quiz: [
          { id: "null", prompt: "Does <code>/dev/null</code> keep a copy of what you send to it?", answer: "no", explain: "Correct. It discards everything.",
            options: [{ value: "no", label: "No, it's discarded" }, { value: "yes", label: "Yes, until the next reboot" }] },
          { id: "two", prompt: "You type <code>cmd &gt; out.txt</code>. Where do error messages go?", answer: "screen", explain: "Correct. > only redirects stdout; stderr still goes to the screen.",
            options: [{ value: "screen", label: "Still to the screen" }, { value: "file", label: "Into out.txt as well" }, { value: "lost", label: "Nowhere" }] },
        ],
        challenge: {
          prompt: "Search for ERROR in <code>logs/incident.log</code> and <code>logs/missing.log</code>, hiding the missing-file error but keeping the matches.",
          check: { accept: ["grep ERROR logs/incident.log logs/missing.log 2>/dev/null", "grep 'ERROR' logs/incident.log logs/missing.log 2>/dev/null", "grep \"ERROR\" logs/incident.log logs/missing.log 2>/dev/null", "grep 'ERROR' logs/incident.log logs/missing.log 2> /dev/null"] },
          correct: "Correct. 2>/dev/null discards only the errors.",
          incorrect: "Redirect stream 2 to /dev/null.",
        },
        memoryHook: "Plain <code>&gt;</code> means <code>1&gt;</code>. Errors are stream <strong>2</strong>, so they need the 2.",
        completion: "You can separate errors from output.",
      },

      /* ---------------------------------------------------------- 5.5 */
      {
        id: "5.5", title: "xargs and command substitution", navSubtitle: "xargs, $( )", objective: "103.4", difficulty: "Medium to Hard",
        source: "Lab 5: Build Commands with xargs and Command Substitution",
        summary: "Turn a list of names into command arguments with <code>xargs</code>, and put one command's output inside another with <code>$( )</code>.",
        ticket: ticket("Project lead", "The project lead lists temporary files to remove. Check the list, delete only those files with a confirmation for each, then search the log for a term stored in a config file.", ["xargs", "rm -i", "$( )"], {
          callout: { kind: "warn", title: "Confirm each delete", text: "<code>rm -i</code> asks before each file. In the practice terminal a confirmation box pops up: choose OK for yes, Cancel for no." } }),
        workspace: base,
        tasks: [
          { id: "setup", title: "Create the practice files and the list", short: "<code>touch</code> three files, then write the list", detail: "<code>touch tmp/cache-one.tmp tmp/cache-two.tmp tmp/keep-me.txt</code>, then <code>printf '%s\\n' 'tmp/cache-one.tmp' 'tmp/cache-two.tmp' &gt; configs/delete-list.txt</code>, and <code>cat configs/delete-list.txt</code> to check it.", check: { type: "all", checks: [file("tmp/keep-me.txt"), file("configs/delete-list.txt", "^tmp/cache-one\\.tmp\\ntmp/cache-two\\.tmp\\n?$")] } },
          { id: "xargs", title: "Delete the listed files, with confirmation", command: "xargs -a configs/delete-list.txt rm -i", detail: "<code>-a</code> reads the list from the file, so <code>rm -i</code> can still ask you. Answer yes for both. Then <code>ls -l tmp</code>: only keep-me.txt is left.", check: { type: "all", checks: [file("tmp/keep-me.txt"), { type: "file", path: WS + "/tmp/cache-one.tmp", exists: false }, { type: "file", path: WS + "/tmp/cache-two.tmp", exists: false }] } },
          { id: "term", title: "Store a search term", command: "printf '%s\\n' 'ERROR' > configs/search-term.txt", detail: "One word, on its own line.", check: file("configs/search-term.txt", "^ERROR$") },
          { id: "subst", title: "Search with the stored term", command: "grep \"$(cat configs/search-term.txt)\" logs/incident.log > reports/command-substitution-result.txt", detail: "<code>$(cat …)</code> runs first and its output becomes grep's pattern.", check: file("reports/command-substitution-result.txt", "^ERROR dns lookup failed\\nERROR permission denied") },
        ],
        quiz: [
          { id: "check", prompt: "Why look at the list before running <code>xargs … rm</code>?", answer: "danger", explain: "Correct. xargs passes every item to rm; one wrong line deletes the wrong file.",
            options: [{ value: "danger", label: "Every name in it gets deleted, so a wrong line is a wrong delete" }, { value: "speed", label: "It makes xargs faster" }, { value: "format", label: "xargs needs the list sorted" }] },
          { id: "back", prompt: "Which is the same as <code>$(date +%F)</code>?", answer: "tick", explain: "Correct. Backticks are the older form; $( ) is easier to read and nest.",
            options: [{ value: "tick", label: "<code>`date +%F`</code>" }, { value: "brace", label: "<code>${date +%F}</code>" }, { value: "paren", label: "<code>(date +%F)</code>" }] },
        ],
        challenge: {
          prompt: "Pass the list in <code>configs/delete-list.txt</code> to <code>rm</code> so it asks before each delete. Enter the command.",
          check: { accept: ["xargs -a configs/delete-list.txt rm -i", "xargs --arg-file=configs/delete-list.txt rm -i"] },
          correct: "Correct. xargs -a keeps the keyboard free for rm -i's questions.",
          incorrect: "Use xargs with the option that reads the list from a file, then rm -i.",
        },
        memoryHook: "<code>xargs</code> turns lines into arguments. <code>-n 1</code> one at a time, <code>-I {}</code> put each item where <code>{}</code> is, <code>-a file</code> read the list from a file.",
        completion: "You can build commands from lists and from other commands.",
      },

      /* ---------------------------------------------------------- 5.6 (added) */
      {
        id: "5.6", title: "Combine streams and here-documents", navSubtitle: "2>&1, &>, <<EOF (added)", objective: "103.4", difficulty: "Hard",
        source: "Added for exam objective 103.4",
        summary: "Send errors and output to the same place with <code>2&gt;&amp;1</code> or <code>&amp;&gt;</code>, see why order matters, and feed text in with a here-document.",
        ticket: ticket("Change manager", "A nightly job's log must hold both its output and its errors, in one file. You also need to create a small config file from the command line in one go.", ["2>&1", "&>", "cat <<EOF", "tee -a"], {
          callout: { kind: "info", title: "Typing a here-document", text: "Type <code>cat &lt;&lt;EOF &gt; configs/app.conf</code> and press Run. The prompt changes to <code>&gt;</code>. Type each line, then a line with just <code>EOF</code> to finish." } }),
        workspace: base,
        tasks: [
          { id: "both", title: "Output and errors in one file", command: "grep ERROR logs/incident.log logs/missing.log > reports/job.log 2>&1", detail: "<code>&gt; file</code> points stream 1 at the file, then <code>2&gt;&amp;1</code> points stream 2 at the same place.", check: file("reports/job.log", "incident\\.log:ERROR[\\s\\S]*missing\\.log: No such file") },
          { id: "order", title: "See why order matters", command: "grep ERROR logs/incident.log logs/missing.log 2>&1 > reports/job2.log", detail: "Reversed, <code>2&gt;&amp;1</code> copies stream 1 while it still points at the screen, so the error shows on screen and only matches go to the file.", check: { type: "all", checks: [file("reports/job2.log", "incident\\.log:ERROR", "No such file"), pat("2>&1 > ?reports/job2\\.log$")] } },
          { id: "amp", title: "The short form", command: "grep ERROR logs/incident.log logs/missing.log &> reports/job3.log", detail: "<code>&amp;&gt;</code> is Bash shorthand for <code>&gt; file 2&gt;&amp;1</code>. <code>&amp;&gt;&gt;</code> appends.", check: file("reports/job3.log", "incident\\.log:ERROR[\\s\\S]*No such file") },
          { id: "heredoc", title: "Write a file with a here-document", short: "<code>cat &lt;&lt;EOF &gt; configs/app.conf</code>, two lines, then <code>EOF</code>", detail: "Everything up to the EOF line becomes cat's input. Write <code>server=lab-gw01</code> and <code>port=8080</code>.", check: file("configs/app.conf", "^server=lab-gw01\\nport=8080\\n?$") },
          { id: "teea", title: "Append with tee", command: "echo 'job finished' | tee -a reports/job.log", detail: "<code>tee -a</code> appends instead of replacing, and still shows the line.", check: file("reports/job.log", "job finished\\n?$") },
        ],
        quiz: [
          { id: "ord", prompt: "Which sends <em>both</em> output and errors to <code>log.txt</code>?", answer: "right", explain: "Correct. Point stream 1 at the file first, then copy it to stream 2.",
            options: [{ value: "right", label: "<code>cmd &gt; log.txt 2&gt;&amp;1</code>" }, { value: "wrong", label: "<code>cmd 2&gt;&amp;1 &gt; log.txt</code>" }, { value: "pipe", label: "<code>cmd | log.txt</code>" }] },
          { id: "hd", prompt: "In <code>cat &lt;&lt;END</code>, what ends the input?", answer: "line", explain: "Correct. A line containing only the delimiter word.",
            options: [{ value: "line", label: "A line with just <code>END</code>" }, { value: "ctrl", label: "Ctrl+Z" }, { value: "blank", label: "A blank line" }] },
        ],
        challenge: {
          prompt: "Run <code>./backup.sh</code> so that both its output and its errors are <em>appended</em> to <code>backup.log</code>. Give the portable form (not <code>&amp;&gt;&gt;</code>).",
          check: { accept: ["./backup.sh >> backup.log 2>&1", "./backup.sh 1>> backup.log 2>&1"] },
          correct: "Correct. >> appends stream 1, then 2>&1 sends stream 2 to the same place.",
          incorrect: "Append stream 1 to the file first, then redirect stream 2 to stream 1.",
        },
        memoryHook: "Read redirects left to right. <code>2&gt;&amp;1</code> means \"send 2 wherever 1 points <em>right now</em>\".",
        completion: "You can combine streams and write here-documents.",
      },

      /* ---------------------------------------------------------- 5.C */
      {
        id: "5.C", navNumber: "C", title: "Challenge exam: support handoff", navSubtitle: "No notes", objective: "103.4", difficulty: "Hard",
        source: "Scenario-Based Challenge Exam", noHints: true, tasksHeading: "Handoff files to produce",
        summary: "The workbook's challenge exam. No commands are given; each item is checked by the file it produces in <code>reports/</code>.",
        ticket: ticket("Incident commander", "Build the handoff package in <code>reports/</code>. Keep errors apart from real output, and don't change any source file.", ["sort", "grep", "wc", "tee", "2>", "$( )"], { heading: "Ticket: incident handoff" }),
        workspace: { ...base, files: { ...FILES, [WS + "/configs/search-term.txt"]: "denied\n" } },
        tasks: [
          { id: "sorted", title: "reports/final-servers.txt: the server list, sorted", check: file("reports/final-servers.txt", "^alpha\\ncharlie\\nfoxtrot\\nnovember\\nsierra\\n?$") },
          { id: "down", title: "reports/failed-checks.txt: only the network checks that are down", check: file("reports/failed-checks.txt", "lab-sw01 status=down", "status=up") },
          { id: "count", title: "reports/error-count.txt: just the number of ERROR lines in the incident log", check: file("reports/error-count.txt", "^\\s*2\\s*$") },
          { id: "tee", title: "Show the ERROR lines on screen and save them to reports/errors-seen.txt in the same command", check: { type: "all", checks: [pat("\\| ?tee "), file("reports/errors-seen.txt", "ERROR dns lookup failed")] } },
          { id: "noise", title: "Search incident.log and missing.log for WARN; matches to reports/warn.txt, errors to reports/warn-errors.txt", check: { type: "all", checks: [file("reports/warn.txt", "packet loss", "No such file"), file("reports/warn-errors.txt", "No such file")] } },
          { id: "subst", title: "reports/term-matches.txt: incident.log lines matching the term stored in configs/search-term.txt, using $( )", check: { type: "all", checks: [pat("\\$\\(cat configs/search-term\\.txt\\)|`cat configs/search-term\\.txt`|\\$\\(< ?configs/search-term\\.txt\\)"), file("reports/term-matches.txt", "permission denied")] } },
        ],
        quiz: [],
        completion: "Handoff complete: every file proves something.",
      },
    ],

    review: {
      traps: [
        "`>` overwrites an existing file without asking. `>>` appends.",
        "The shell empties the target of `>` before the command runs, so `sort f > f` leaves `f` empty.",
        "A pipe passes output along; it never changes the original file.",
        "Standard output is stream 1 and standard error is stream 2. Plain `>` is `1>`.",
        "Forgetting the 2 in `2>` or `2>>` sends normal output to the file and leaves errors on screen.",
        "`/dev/null` discards data. It doesn't save anything.",
        "`cmd > f 2>&1` puts both streams in f; `cmd 2>&1 > f` leaves errors on the screen. Order matters.",
        "`&>` is Bash shorthand for `> f 2>&1`.",
        "`$(command)` and backticks do the same thing; `$( )` is clearer and can be nested.",
        "Check the list before `xargs rm`. Use `xargs -a list rm -i` so rm can ask you.",
        "`tr` reads standard input only, so it needs `<` or a pipe.",
      ],
      trapQuiz: [
        { id: "t1", prompt: "Which appends errors to <code>err.log</code>?", answer: "2>>", options: [{ value: ">>", label: "<code>cmd &gt;&gt; err.log</code>" }, { value: "2>>", label: "<code>cmd 2&gt;&gt; err.log</code>" }, { value: "2>", label: "<code>cmd 2&gt; err.log</code>" }, { value: "&>", label: "<code>cmd &amp;&gt; err.log</code>" }], explain: "Correct." },
        { id: "t2", prompt: "Which hides <em>all</em> output, both normal and errors?", answer: "both", options: [{ value: "one", label: "<code>cmd &gt; /dev/null</code>" }, { value: "two", label: "<code>cmd 2&gt; /dev/null</code>" }, { value: "both", label: "<code>cmd &gt; /dev/null 2&gt;&amp;1</code>" }], explain: "Correct. The first only hides stdout, the second only stderr." },
        { id: "t3", prompt: "<code>ls /etc | wc -l</code>: what does <code>wc</code> count?", answer: "entries", options: [{ value: "entries", label: "The lines ls printed, one per entry" }, { value: "bytes", label: "The size of /etc" }, { value: "files", label: "Files changed by the pipe" }], explain: "Correct. Piped ls prints one name per line." },
        { id: "t4", prompt: "Which runs <code>echo</code> once per item?", answer: "n1", options: [{ value: "plain", label: "<code>xargs echo</code>" }, { value: "n1", label: "<code>xargs -n 1 echo</code>" }, { value: "a", label: "<code>xargs -a echo</code>" }], explain: "Correct. Plain xargs packs as many items as fit into one command." },
        { id: "t5", prompt: "Which saves output to a file <em>and</em> shows it on screen?", answer: "tee", options: [{ value: "tee", label: "<code>cmd | tee out.txt</code>" }, { value: "gt", label: "<code>cmd &gt; out.txt</code>" }, { value: "lt", label: "<code>cmd &lt; out.txt</code>" }], explain: "Correct." },
      ],
      challenge: {
        intro: "On your VM, rerun the Lab Setup, then do this without notes:",
        tasks: [
          "Create a clean sorted server report without changing the source.",
          "Extract the failed network checks into a report.",
          "Count the incident errors and save only the number.",
          "Save visible output with `tee` while it's still shown.",
          "Redirect noisy errors to a separate file while the matches stay visible.",
          "Use command substitution to search for a pattern stored in `configs/search-term.txt`.",
          "Capture a command's output and errors in one log with `> log 2>&1`, then explain why `2>&1 > log` is different.",
        ],
        outro: "Your final handoff is the files in reports/, with one short sentence explaining what each file proves.",
      },
      questions: [
        { q: "Your manager asks for a sorted server list saved as a file, but the original list must not change. What command do you run?", a: "<code>sort reports/server-list.txt &gt; reports/sorted-server-list.txt</code>. Never redirect into the file you're reading." },
        { q: "A security analyst asks for all mock accounts using nologin, saved to a report. What pipeline produces the evidence?", a: "<code>grep nologin users/mock-passwd | cut -d: -f1 &gt; reports/nologin-accounts.txt</code>. Add <code>| tee</code> instead of <code>&gt;</code> to also see it." },
        { q: "An incident bridge needs the number of ERROR lines in incident.log. What command gives only the count?", a: "<code>grep -c ERROR logs/incident.log</code>, or <code>grep ERROR logs/incident.log | wc -l</code>." },
        { q: "A teammate needs to see command output live and keep a copy for handoff. Which command belongs in the pipeline?", a: "<code>tee</code>, as in <code>cmd | tee handoff.txt</code>. Use <code>tee -a</code> to append." },
        { q: "A project lead gives you a file containing filenames to clean up in a lab folder. How do you safely pass that list to rm interactively?", a: "Check it with <code>cat list</code> first, then <code>xargs -a list rm -i</code>. Piping the list into xargs would leave rm with no keyboard to ask you on." },
      ],
      mastery: [
        "I can explain standard input, standard output and standard error in plain language, with their numbers.",
        "I can redirect input from a file into a command.",
        "I can save output to a new file and append output to an existing file.",
        "I can build useful pipelines with grep, cut, sort, wc, less and tee.",
        "I can separate useful output from error messages.",
        "I can safely discard expected errors with `/dev/null`.",
        "I can send both streams to one file with `> file 2>&1` or `&>`, and explain why order matters.",
        "I can feed text to a command with a here-document.",
        "I can use xargs carefully when a list needs to become command arguments.",
        "I can use `$(command)` when a command needs the result of another command.",
        "I can solve a realistic support task without being told the exact command first.",
      ],
    },
  });
})();
