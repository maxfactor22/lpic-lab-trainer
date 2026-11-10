/* Section 3: Viewing and inspecting text files (103.2). From "LPIC_Section3_Lab_Workbook.docx". */
(function () {
  const WS = "~/lpic1-section3-labs";
  const FILES = {
    [WS + "/duplicates.txt"]: "alpha\nbeta\nbeta\ngamma\ngamma\ngamma\n",
    [WS + "/app.log"]: "INFO workstation booted\nWARN disk latency reported\nERROR backup agent failed\nERROR backup agent failed\nINFO ticket INC1001 opened\n",
    [WS + "/incident-notes.txt"]: "INC1001 user reports slow login\nINC1002 printer queue stuck\nINC1003 VPN connection failed\nINC1003 VPN connection failed\n",
    [WS + "/app-original.log"]: "INFO workstation booted\nWARN disk latency reported\nERROR backup agent failed\nERROR backup agent failed\nINFO ticket INC1001 opened\n",
  };
  const base = { user: "max", host: "linux-mint", files: FILES };
  const ticket = (body, tools, extra = {}) => ({ requestedBy: "Service desk lead", system: "Linux Mint workstation", badge: "IT support", tools, body, ...extra });
  const readOnly = { kind: "info", title: "Read-only practice", text: "Files under <code>/etc</code> are only read, never changed. The terminal is a simulation, so nothing here can harm a real system." };
  const cmd = (...accept) => ({ type: "command", accept });
  const pat = (re) => ({ type: "pattern", re });

  LPIC.section({
    id: "section-03",
    number: 3,
    title: "Viewing and Inspecting Text Files",
    objectives: ["103.2"],
    kind: "terminal",
    source: "LPIC_Section3_Lab_Workbook.docx",
    scenario: "You're a new IT support technician on a Linux Mint workstation. You read system files without changing them, review ticket notes and logs, spot repeated events, watch a log as it grows, and prove whether two files are identical.",
    overview: {
      paragraphs: [
        "On your VM, the workbook's prep command builds the practice folder and its files. The practice terminal already has them, in <code>~/lpic1-section3-labs</code>.",
        "Prep command for your VM: <code>mkdir -p ~/lpic1-section3-labs &amp;&amp; cd ~/lpic1-section3-labs &amp;&amp; printf 'alpha\\nbeta\\nbeta\\ngamma\\ngamma\\ngamma\\n' &gt; duplicates.txt &amp;&amp; printf 'INFO workstation booted\\nWARN disk latency reported\\nERROR backup agent failed\\nERROR backup agent failed\\nINFO ticket INC1001 opened\\n' &gt; app.log &amp;&amp; printf 'INC1001 user reports slow login\\nINC1002 printer queue stuck\\nINC1003 VPN connection failed\\nINC1003 VPN connection failed\\n' &gt; incident-notes.txt &amp;&amp; cp app.log app-original.log</code>",
      ],
      commands: ["ls -alF", "cat", "head", "tail", "tail -f", "more", "less", "wc", "uniq", "nl", "md5sum", "sha256sum", "sha512sum"],
      memoryHook: "Look, count, compare. <code>cat</code>/<code>head</code>/<code>tail</code>/<code>less</code> to look; <code>wc</code>, <code>uniq -c</code> and <code>nl</code> to count; <code>sha256sum</code> to compare. <code>uniq</code> only sees neighbours.",
    },

    lessons: [
      /* ---------------------------------------------------------- 3.1 */
      {
        id: "3.1", title: "Inspect a workstation safely", navSubtitle: "ls -alF, cat, head, tail", objective: "103.2", difficulty: "Easy",
        source: "Beginner Labs: Learn the Commands",
        summary: "List hidden files, read a small file whole, and look at just the start or end of a longer one.",
        ticket: ticket("A user says their profile settings vanished. Before you change anything, check the home folder's hidden files and take a read-only look at a few system files.", ["ls", "cat", "head", "tail"], { callout: readOnly }),
        workspace: { ...base, cwd: "~" },
        tasks: [
          { id: "ls", title: "List everything with details", command: "ls -alF", detail: "<code>-a</code> shows hidden files (names starting with a dot), <code>-l</code> the long format, <code>-F</code> adds <code>/</code> after directory names.", check: pat("^ls -(alF|aFl|laF|lFa|Fal|Fla|a -l -F|l -a -F)$") },
          { id: "hostname", title: "Read a one-line file", command: "cat /etc/hostname", detail: "<code>cat</code> prints the whole file. Fine for short files.", check: cmd("cat /etc/hostname") },
          { id: "head", title: "First five lines", command: "head -5 /etc/passwd", detail: "<code>head</code> shows the start of a file: 10 lines unless you say otherwise. <code>-5</code> and <code>-n 5</code> mean the same.", check: pat("^head (-5|-n ?5) /etc/passwd$") },
          { id: "tail", title: "Last five lines", command: "tail -5 /etc/passwd", detail: "<code>tail</code> shows the end. Your own account is usually near the bottom of <code>/etc/passwd</code>.", check: pat("^tail (-5|-n ?5) /etc/passwd$") },
        ],
        quiz: [
          { id: "slash", prompt: "In <code>ls -F</code> output, what does a trailing <code>/</code> mean?", answer: "dir", explain: "Correct. -F marks directories with /.",
            options: [{ value: "dir", label: "It's a directory" }, { value: "hidden", label: "It's hidden" }, { value: "exec", label: "It's executable" }] },
          { id: "default", prompt: "How many lines does <code>head</code> show if you give no number?", answer: "10", explain: "Correct. head and tail both default to 10 lines.",
            options: ["5", "10", "20", "The whole file"] },
        ],
        challenge: {
          prompt: "Show only the last 3 lines of <code>/etc/passwd</code>. Enter the command.",
          check: { accept: ["tail -3 /etc/passwd", "tail -n 3 /etc/passwd", "tail -n3 /etc/passwd"] },
          correct: "Correct. tail -3 (or tail -n 3) shows the last three lines.",
          incorrect: "Use the command that shows the end of a file, with a line count of 3.",
        },
        memoryHook: "<code>head</code> = top, <code>tail</code> = bottom, both 10 lines by default. Hidden files start with a dot and need <code>-a</code>.",
        completion: "You can inspect files without changing them.",
      },

      /* ---------------------------------------------------------- 3.2 */
      {
        id: "3.2", title: "Page through long files", navSubtitle: "more and less", objective: "103.2", difficulty: "Easy",
        source: "Beginner Labs: Learn the Commands",
        summary: "Read long files a screen at a time with <code>less</code> and <code>more</code>, search inside them, and quit cleanly.",
        ticket: ticket("You need to confirm that the <code>root</code> account exists in <code>/etc/passwd</code> without dumping the whole file to the screen.", ["less", "more"], { callout: { kind: "info", title: "Pager keys", text: "Space for the next screen, <code>b</code> to go back, <code>/text</code> to search forward, <code>n</code> for the next match, <code>q</code> to quit. On iPhone, use the buttons under the page." } }),
        workspace: { ...base, cwd: WS },
        tasks: [
          { id: "less", title: "Open the file in less", command: "less /etc/passwd", detail: "<code>less</code> opens the file in a pager. It doesn't load the whole file first, so it's fast on huge logs.", check: { type: "event", event: "pager-open", match: { kind: "less", page: "/etc/passwd$" } } },
          { id: "search", title: "Search for root", short: "Type <code>/root</code> in the pager", detail: "Press <code>/</code>, type <code>root</code>, press Enter. Matching lines are highlighted.", check: { type: "event", event: "pager-search", match: { page: "/etc/passwd$", term: "root" } } },
          { id: "quit", title: "Quit the pager", short: "Press <code>q</code>", detail: "<code>q</code> returns you to the prompt without closing the terminal.", check: { type: "event", event: "pager-quit", match: { kind: "less" } } },
          { id: "more", title: "Try more", command: "more app.log", detail: "<code>more</code> is the older pager. It reads forward only on many systems, and it exits by itself when it reaches the end.", check: { type: "event", event: "pager-open", match: { kind: "more" } } },
        ],
        quiz: [
          { id: "back", prompt: "Which pager is known for moving backward as well as forward?", answer: "less", explain: "Correct. \"less is more\": less can scroll both ways.",
            options: [{ value: "more", label: "<code>more</code>" }, { value: "less", label: "<code>less</code>" }, { value: "cat", label: "<code>cat</code>" }] },
          { id: "backsearch", prompt: "In <code>less</code>, which key starts a search <em>backward</em>?", answer: "?", explain: "Correct. / searches forward, ? searches backward.",
            options: [{ value: "/", label: "<code>/</code>" }, { value: "?", label: "<code>?</code>" }, { value: "b", label: "<code>b</code>" }, { value: "N", label: "<code>N</code>" }] },
        ],
        challenge: {
          prompt: "Which command opens <code>/etc/passwd</code> in the pager that can scroll backward? Enter it.",
          check: { accept: ["less /etc/passwd"] },
          correct: "Correct. less /etc/passwd, then /root to search.",
          incorrect: "Use the pager whose name is the joke: it's more than more.",
        },
        memoryHook: "<code>man</code> pages open in <code>less</code>, so the same keys work in both.",
        completion: "You can page through and search long files.",
      },

      /* ---------------------------------------------------------- 3.3 */
      {
        id: "3.3", title: "Count lines, words and bytes", navSubtitle: "wc", objective: "103.2", difficulty: "Easy",
        source: "Intermediate Labs: Combine Commands and Check Results",
        summary: "Use <code>wc</code> to count a file's lines, words and bytes, and pick out just the number you need.",
        ticket: ticket("The service desk lead wants quick numbers for the ticket review: how many notes are in the incident file, and how big the duplicate test file is.", ["wc"], { callout: readOnly }),
        workspace: { ...base, cwd: WS },
        tasks: [
          { id: "notes", title: "Review the incident notes", command: "cat incident-notes.txt", detail: "Read the file first so you know what you're counting.", check: cmd("cat incident-notes.txt") },
          { id: "wc", title: "Count everything", command: "wc duplicates.txt", detail: "Three numbers, always in this order: lines, words, bytes, then the file name.", check: cmd("wc duplicates.txt") },
          { id: "wc-l", title: "Count only lines", command: "wc -l duplicates.txt", detail: "<code>-l</code> lines, <code>-w</code> words, <code>-c</code> bytes, <code>-m</code> characters.", check: pat("^wc -l duplicates\\.txt$") },
          { id: "wc-w", title: "Count words in the notes", command: "wc -w incident-notes.txt", detail: "Words are anything separated by spaces or new lines.", check: pat("^wc -w incident-notes\\.txt$") },
        ],
        quiz: [
          { id: "order", prompt: "<code>wc app.log</code> prints <code>5 19 128 app.log</code>. What is 19?", answer: "words", explain: "Correct. The order is lines, words, bytes.",
            options: [{ value: "lines", label: "Lines" }, { value: "words", label: "Words" }, { value: "bytes", label: "Bytes" }] },
          { id: "c", prompt: "What does <code>wc -c</code> count?", answer: "bytes", explain: "Correct. -c is bytes; -m is characters, which differ for non-ASCII text.",
            options: [{ value: "bytes", label: "Bytes" }, { value: "chars", label: "Characters" }, { value: "cols", label: "Columns" }] },
        ],
        challenge: {
          prompt: "Give the command that prints only the line count of <code>duplicates.txt</code>.",
          check: { accept: ["wc -l duplicates.txt", "wc --lines duplicates.txt"] },
          correct: "Correct. wc -l prints just the lines.",
          incorrect: "Add the option for lines to wc.",
        },
        memoryHook: "<code>wc</code> reads Lines, Words, Characters-as-bytes: <strong>L W C</strong>, in that order.",
        completion: "You can count lines, words and bytes.",
      },

      /* ---------------------------------------------------------- 3.4 */
      {
        id: "3.4", title: "Find duplicates and number lines", navSubtitle: "uniq, nl", objective: "103.2", difficulty: "Medium",
        source: "Intermediate Labs: Combine Commands and Check Results",
        summary: "Collapse repeated lines with <code>uniq</code>, count them with <code>-c</code>, and number a file with <code>nl</code>.",
        ticket: ticket("Monitoring sends the same event several times. Find which lines repeat and how often, and number the log so you can refer to lines in the ticket.", ["uniq", "nl"], { callout: readOnly }),
        workspace: { ...base, cwd: WS, files: { ...FILES, [WS + "/mixed.txt"]: "hello\nworld\nhello\n" } },
        tasks: [
          { id: "uniq", title: "Remove adjacent duplicates", command: "uniq duplicates.txt", detail: "Each run of identical neighbouring lines is printed once.", check: cmd("uniq duplicates.txt") },
          { id: "uniq-c", title: "Count each run", command: "uniq -c duplicates.txt", detail: "<code>-c</code> puts a count in front of each line.", check: pat("^uniq -c duplicates\\.txt$") },
          { id: "uniq-d", title: "Only the repeated lines", command: "uniq -d duplicates.txt", detail: "<code>-d</code> prints one copy of each line that repeats. <code>-u</code> does the opposite.", check: pat("^uniq -d duplicates\\.txt$") },
          { id: "adjacent", title: "See the neighbour rule", command: "uniq mixed.txt", detail: "<code>mixed.txt</code> has hello, world, hello. Both hellos survive because they aren't next to each other. <code>sort mixed.txt | uniq</code> fixes that.", check: cmd("uniq mixed.txt") },
          { id: "nl", title: "Number the lines", command: "nl app.log", detail: "<code>nl</code> numbers non-blank lines. <code>nl -ba</code> numbers blank lines too.", check: pat("^nl (-ba )?app\\.log$") },
        ],
        quiz: [
          { id: "neighbour", prompt: "Why does <code>uniq mixed.txt</code> still print <em>hello</em> twice?", answer: "adjacent", explain: "Correct. uniq only compares each line with the one right before it.",
            options: [{ value: "adjacent", label: "The two hellos aren't next to each other" }, { value: "case", label: "uniq is case-sensitive" }, { value: "bug", label: "uniq needs -d to remove duplicates" }] },
          { id: "blank", prompt: "By default, does <code>nl</code> number blank lines?", answer: "no", explain: "Correct. Use nl -ba to number every line.",
            options: [{ value: "no", label: "No" }, { value: "yes", label: "Yes" }] },
        ],
        challenge: {
          prompt: "Show each line of <code>duplicates.txt</code> with how many times it repeats. Enter the command.",
          check: { accept: ["uniq -c duplicates.txt", "uniq --count duplicates.txt"] },
          correct: "Correct. uniq -c counts each run of repeated lines.",
          incorrect: "Use uniq with its count option.",
        },
        memoryHook: "<code>uniq</code> only sees neighbours, so the usual pattern is <code>sort file | uniq -c</code>.",
        completion: "You can find repeats and number lines.",
      },

      /* ---------------------------------------------------------- 3.5 */
      {
        id: "3.5", title: "Watch a growing log", navSubtitle: "tail -f, Ctrl+C", objective: "103.2", difficulty: "Medium",
        source: "Advanced Labs: Troubleshoot Like a Support Engineer",
        summary: "Follow a log with <code>tail -f</code> while another terminal writes to it, then stop safely with Ctrl+C.",
        ticket: ticket("A user is about to retry a VPN login. Watch the application log live so you see the error the moment it's written.", ["tail -f", "less"], {
          callout: { kind: "info", title: "Two terminals in one", text: "While <code>tail -f</code> runs, the input box acts as a second terminal. Anything you append to the file shows up in the followed output. Stop with <strong>Ctrl+C</strong> (keyboard or button)." } }),
        workspace: { ...base, cwd: WS },
        tasks: [
          { id: "follow", title: "Follow the log", command: "tail -f app.log", detail: "<code>tail -f</code> prints the last lines, then keeps waiting for new ones.", check: { type: "event", event: "follow-start", match: { path: "app\\.log$" } } },
          { id: "write", title: "Write a new event from the second terminal", command: "echo 'ERROR VPN authentication failed for user testuser' >> app.log", detail: "Type this while <code>tail -f</code> is running. The new line appears in the followed output.", check: { type: "event", event: "follow-new", match: { path: "app\\.log$" } } },
          { id: "stop", title: "Stop following", short: "Press Ctrl+C", detail: "Ctrl+C stops <code>tail</code>. The file isn't harmed.", check: { type: "event", event: "follow-stop", match: { path: "app\\.log$" } } },
          { id: "less-error", title: "Find the errors in less", short: "<code>less app.log</code>, then <code>/ERROR</code>", detail: "Open the log in <code>less</code> and search for ERROR. <code>n</code> jumps to the next one.", check: { type: "event", event: "pager-search", match: { page: "app\\.log$", term: "error" } } },
        ],
        quiz: [
          { id: "which", prompt: "Which command can keep printing new lines as a file grows?", answer: "tail", explain: "Correct. tail -f follows; head can't.",
            options: [{ value: "head", label: "<code>head -f</code>" }, { value: "tail", label: "<code>tail -f</code>" }, { value: "cat", label: "<code>cat -f</code>" }] },
          { id: "stopq", prompt: "How do you stop <code>tail -f</code>?", answer: "ctrlc", explain: "Correct. Ctrl+C interrupts it; q is for pagers.",
            options: [{ value: "ctrlc", label: "Ctrl+C" }, { value: "q", label: "<code>q</code>" }, { value: "esc", label: "Esc" }] },
        ],
        challenge: {
          prompt: "Enter the command that starts following <code>app.log</code>.",
          check: { accept: ["tail -f app.log", "tail --follow app.log", "tail -F app.log"] },
          correct: "Correct. tail -f app.log follows the file until Ctrl+C.",
          incorrect: "Use the command that shows the end of a file, with its follow option.",
        },
        memoryHook: "<strong>f</strong> for follow. <code>-F</code> also survives the log being rotated.",
        completion: "You can watch a log live and stop safely.",
      },

      /* ---------------------------------------------------------- 3.6 */
      {
        id: "3.6", title: "Prove file integrity with hashes", navSubtitle: "md5sum, sha256sum", objective: "103.2", difficulty: "Medium to Hard",
        source: "Advanced Labs: Troubleshoot Like a Support Engineer",
        summary: "Hash files with <code>md5sum</code>, <code>sha256sum</code> and <code>sha512sum</code>, and prove whether two files are identical.",
        ticket: ticket("Audit wants proof that the archived copy of the application log matches the live one, and proof that any edit would be detected.", ["md5sum", "sha256sum", "sha512sum", "cp"], { callout: readOnly }),
        workspace: { ...base, cwd: WS },
        tasks: [
          { id: "three", title: "Hash one file three ways", short: "<code>md5sum</code>, <code>sha256sum</code>, <code>sha512sum</code> on duplicates.txt", detail: "Same file, three algorithms. Compare the lengths: 32, 64 and 128 hex characters.", check: { type: "history", includes: ["^md5sum duplicates\\.txt$", "^sha256sum duplicates\\.txt$", "^sha512sum duplicates\\.txt$"] } },
          { id: "match", title: "Compare the two logs", command: "sha256sum app.log app-original.log", detail: "Identical files give identical hashes.", check: pat("^sha256sum app\\.log app-original\\.log$") },
          { id: "edit", title: "Change the copy", command: "echo 'INFO manual edit' >> app-original.log", detail: "One extra line in the copy.", check: { type: "file", path: WS + "/app-original.log", re: "manual edit" } },
          { id: "differ", title: "Compare again", command: "sha256sum app.log app-original.log", detail: "The copy's hash changed completely, even though only one line was added.", check: { type: "all", checks: [pat("^sha256sum app\\.log app-original\\.log$"), { type: "file", path: WS + "/app-original.log", re: "manual edit" }] } },
        ],
        quiz: [
          { id: "md5", prompt: "Which of these is no longer trusted for security, because collisions can be made on purpose?", answer: "md5", explain: "Correct. MD5 is fine for spotting accidents, not for security.",
            options: [{ value: "md5", label: "MD5" }, { value: "sha256", label: "SHA-256" }, { value: "sha512", label: "SHA-512" }] },
          { id: "change", prompt: "You add one space to a file. What happens to its SHA-256 hash?", answer: "all", explain: "Correct. Any change produces a completely different hash.",
            options: [{ value: "all", label: "It changes completely" }, { value: "one", label: "One character changes" }, { value: "same", label: "It stays the same" }] },
        ],
        challenge: {
          prompt: "In one command, show SHA-256 hashes for <code>app.log</code> and <code>app-original.log</code> so you can compare them.",
          check: { accept: ["sha256sum app.log app-original.log", "sha256sum app-original.log app.log"] },
          correct: "Correct. Matching hashes mean identical files; different hashes mean they differ.",
          incorrect: "Use sha256sum with both file names.",
        },
        memoryHook: "MD5 = 32 hex, SHA-256 = 64, SHA-512 = 128. Save hashes with <code>sha256sum file &gt; file.sha256</code> and check later with <code>sha256sum -c file.sha256</code>.",
        completion: "You can prove whether files match.",
      },

      /* ---------------------------------------------------------- 3.M */
      {
        id: "3.M", navNumber: "M", title: "Mastery challenge: support scenario", navSubtitle: "No hints", objective: "103.2", difficulty: "Hard",
        source: "Mastery Challenge", noHints: true, tasksHeading: "Ticket requirements",
        summary: "A fresh support scenario with no hints. Use every tool from this section.",
        ticket: ticket("A help desk ticket says the backup agent keeps failing. Inspect the log, count and de-duplicate the errors, number the lines for your notes, and prove whether the archived copy still matches. Save your findings to <code>findings.txt</code>.", ["cat", "head", "tail", "less", "wc", "uniq", "nl", "sha256sum"], {
          heading: "Ticket: backup agent failures",
          callout: { kind: "info", title: "Saving findings", text: "Add lines with <code>echo 'text' &gt;&gt; findings.txt</code>. Check with <code>cat findings.txt</code>." } }),
        workspace: { ...base, cwd: WS },
        tasks: [
          { id: "inspect", title: "Inspect the log three ways: whole, first 2 lines, last 2 lines", check: { type: "history", includes: ["^(cat|less|more) app\\.log$", "^head (-2|-n ?2) app\\.log$", "^tail (-2|-n ?2) app\\.log$"] } },
          { id: "count", title: "Count the log's lines", check: { type: "all", checks: [pat("^(wc -l app\\.log|wc -l < app\\.log|cat app\\.log \\| wc -l)$"), { type: "output", re: "^5( app\\.log)?$" }] } },
          { id: "dupes", title: "Show how many times each log line repeats", check: pat("^uniq -c app\\.log$|^sort app\\.log \\| uniq -c$|^cat app\\.log \\| uniq -c$") },
          { id: "number", title: "Number the log lines", check: pat("^nl (-ba )?app\\.log$|^cat -n app\\.log$") },
          { id: "prove", title: "Prove whether app.log and app-original.log match", check: pat("^sha256sum (app\\.log app-original\\.log|app-original\\.log app\\.log)$") },
          { id: "findings", title: "Save findings: how many ERROR lines, and whether the copies match", check: { type: "file", path: WS + "/findings.txt", re: "error[\\s\\S]*(match|same|identical|differ)|(match|same|identical|differ)[\\s\\S]*error" } },
        ],
        quiz: [],
        completion: "Ticket closed: you inspected, counted and verified the log.",
      },
    ],

    review: {
      traps: [
        "`head` and `tail` show 10 lines unless you give a number. `-5` and `-n 5` are the same.",
        "Hidden files start with a dot and only show with `ls -a` (or `-A`).",
        "`less` can move backward and search with `/` (forward) and `?` (backward); `q` quits.",
        "`more` is the older pager and quits on its own at the end of the file.",
        "`wc` prints lines, words, bytes, in that order. `-c` is bytes; `-m` is characters.",
        "`uniq` only removes duplicates that are next to each other. Sort first if they're scattered.",
        "`uniq -c` counts, `-d` shows only repeated lines, `-u` only unique lines.",
        "`nl` doesn't number blank lines unless you use `-ba`. `cat -n` numbers every line.",
        "`tail -f` follows a growing file until Ctrl+C. `head` has no follow mode.",
        "MD5 is 32 hex characters, SHA-256 64, SHA-512 128. Any change to a file changes its hash completely.",
      ],
      trapQuiz: [
        { id: "t1", prompt: "Which shows the first 3 lines of a file?", answer: "head -n 3 file", options: ["head -n 3 file", "tail -n 3 file", "head -c 3 file", "less -3 file"], explain: "Correct. -c 3 would be the first 3 bytes." },
        { id: "t2", prompt: "A file has <em>a, b, a</em>. What does <code>uniq</code> print?", answer: "aba", options: [{ value: "aba", label: "a, b, a" }, { value: "ab", label: "a, b" }, { value: "b", label: "b" }], explain: "Correct. The two a lines aren't adjacent." },
        { id: "t3", prompt: "Which numbers blank lines too?", answer: "nl -ba", options: ["nl", "nl -ba", "wc -l", "uniq -c"], explain: "Correct. Plain nl skips blank lines." },
        { id: "t4", prompt: "How long is a SHA-256 hash in hex characters?", answer: "64", options: ["32", "40", "64", "128"], explain: "Correct. MD5 32, SHA-1 40, SHA-256 64, SHA-512 128." },
        { id: "t5", prompt: "Which pager command searches backward?", answer: "?pattern", options: ["/pattern", "?pattern", "n", "b"], explain: "Correct." },
      ],
      challenge: {
        intro: "On your VM, rerun the prep command so you start fresh, then do these without notes.",
        tasks: [
          "List every file in your home folder, hidden ones included, with directories marked.",
          "Show the first 5 and last 5 lines of `/etc/passwd`.",
          "Find `root` in `/etc/passwd` with `less`, and quit cleanly.",
          "Count the lines, words and bytes of `duplicates.txt`, then the lines only.",
          "Show each line of `duplicates.txt` with its repeat count, then only the repeated lines.",
          "Follow `app.log` with `tail -f`, add an ERROR line from a second terminal, and stop with Ctrl+C.",
          "Prove whether `app.log` and `app-original.log` match, change one, and prove they no longer match.",
        ],
        outro: "Then explain out loud when you'd use each command on a real ticket.",
      },
      questions: [
        { q: "Service desk request: “The log is 200,000 lines. Show me the last 20.”", a: "<code>tail -n 20 logfile</code> (or <code>tail -20</code>). <code>cat</code> would flood the screen." },
        { q: "Teammate request: “uniq didn't remove all the duplicates. Is it broken?”", a: "No. <code>uniq</code> only collapses adjacent duplicates. Use <code>sort file | uniq</code>, or <code>sort -u file</code>." },
        { q: "Auditor request: “Prove the backup copy is identical to the original.”", a: "<code>sha256sum original backup</code>. Identical hashes mean identical content. For later checks, save the hash with <code>sha256sum original &gt; original.sha256</code> and verify with <code>sha256sum -c original.sha256</code>." },
        { q: "On-call request: “Watch the log while I reproduce the error.”", a: "<code>tail -f logfile</code>, then Ctrl+C when done. <code>tail -F</code> keeps following even if the log is rotated." },
      ],
      mastery: [
        "I can list hidden files and spot directories with `ls -alF`.",
        "I can show the start or end of a file with `head` and `tail`, with any line count.",
        "I can page, search forward and backward, and quit in `less`, and I know how `more` differs.",
        "I can count lines, words, bytes and characters with `wc`.",
        "I can use `uniq`, `-c`, `-d` and `-u`, and explain the adjacent-lines rule.",
        "I can number lines with `nl` and `nl -ba`.",
        "I can follow a growing log with `tail -f` and stop it with Ctrl+C.",
        "I can prove two files match with `sha256sum`, and explain MD5's weakness.",
      ],
    },
  });
})();
