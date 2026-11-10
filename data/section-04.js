/* Section 4: Text manipulation and searching (103.2, 103.7). From "LPIC_Section4_Lab_Workbook.docx". */
(function () {
  const WS = "~/lpic-section4-labs";
  const FILES = {
    [WS + "/patch-reboots.txt"]: "server3 10\nserver1 2\nserver2 30\nserver5 1\nserver4 12\n",
    [WS + "/users-sample.txt"]: "root:x:0:0:root:/root:/bin/bash\nmax:x:1000:1000:Max:/home/max:/bin/bash\nsvcbackup:x:998:998:Backup Service:/srv/backup:/usr/sbin/nologin\nappuser:x:1001:1001:Application User:/opt/app:/bin/bash\n",
    [WS + "/incident-log.txt"]: "Aug 19 08:01 server1 sshd: Failed password for invalid user admin\nAug 19 08:03 server1 sshd: Accepted password for max\nAug 19 08:05 server2 kernel: disk warning sda\nAug 19 08:07 server3 sshd: Failed password for root\nAug 19 08:09 server2 app: ERROR database timeout\n",
    [WS + "/server-list.txt"]: "server1\nserver2\nserver3\nserver4\nserver5\n",
    [WS + "/service-list.txt"]: "web\ndatabase\nnetwork\nbackup\nmonitoring\n",
  };
  const base = { user: "max", host: "linux-mint", cwd: WS, files: FILES };
  const ticket = (requestedBy, body, tools, extra = {}) => ({ requestedBy, system: "Linux Mint VM", badge: "IT engineer", tools, body, ...extra });
  const preview = { kind: "info", title: "Preview, then save", text: "Run each command to see the output first. When it looks right, add <code>&gt; newfile</code> to save it. Never overwrite the original file." };
  const pat = (re) => ({ type: "pattern", re });
  const file = (name, re, not) => ({ type: "file", path: WS + "/" + name, re, not });

  LPIC.section({
    id: "section-04",
    number: 4,
    title: "Text Manipulation and Searching",
    objectives: ["103.2", "103.7"],
    kind: "terminal",
    source: "LPIC_Section4_Lab_Workbook.docx",
    scenario: "You're an IT engineer handed messy text: patch windows, account lists and incident logs. Sort it, join it, cut out fields, translate characters, redact with sed and search with grep, and hand back clean answers.",
    overview: {
      paragraphs: [
        "Every lab is a small ticket. Inspect the data, extract what's needed, transform it safely into a new file, and leave the original alone.",
        "On your VM, run the workbook's Lab Setup to create <code>~/lpic-section4-labs</code> and its five sample files. The practice terminal already has them.",
      ],
      commands: ["sort", "sort -n", "sort -k2 -n", "sort -t: -k3", "paste", "split -l", "cut -d -f", "cut -c", "tr", "tr -d", "sed 's/old/new/'", "sed 's/old/new/g'", "grep", "grep -i", "grep -v", "grep -c", "grep ^pattern", "grep pattern$", "od -c"],
      memoryHook: "<code>sort</code> orders lines, <code>paste</code> puts files side by side, <code>split</code> breaks a file into chunks, <code>cut</code> pulls out fields or characters, <code>tr</code> swaps characters, <code>sed</code> edits the stream, and <code>grep</code> finds lines.",
    },

    lessons: [
      /* ---------------------------------------------------------- 4.1 */
      {
        id: "4.1", title: "Prioritize server reboots", navSubtitle: "sort -n -k", objective: "103.2", difficulty: "Easy",
        source: "Lab 1: Prioritize Server Reboots from a Patch Window",
        summary: "Sort a patch list by the reboot estimate in the second column, numerically, and save the plan.",
        ticket: ticket("Change manager", "A patching project left <code>patch-reboots.txt</code> with each server and its reboot time in minutes. Your manager wants the shortest reboots first so the team can clear them quickly.", ["sort"], { callout: preview }),
        workspace: base,
        tasks: [
          { id: "look", title: "Review the file", command: "cat patch-reboots.txt", detail: "Server name, then minutes.", check: pat("^cat patch-reboots\\.txt$") },
          { id: "alpha", title: "See the alphabetical trap", command: "sort -k2 patch-reboots.txt", detail: "Without <code>-n</code>, numbers sort as text: 1, 10, 12, 2, 30. That would be a bad plan.", check: pat("^sort -k ?2 patch-reboots\\.txt$") },
          { id: "numeric", title: "Sort by number", command: "sort -k2 -n patch-reboots.txt", detail: "<code>-k2</code> sorts on the second field; <code>-n</code> compares numbers. server5 (1 minute) comes first.", check: { type: "output", re: "^server5 1\\nserver1 2\\nserver3 10\\nserver4 12\\nserver2 30$" } },
          { id: "save", title: "Save the plan", command: "sort -k2 -n patch-reboots.txt > reboot-priority.txt", detail: "Redirect the same command into a new file, then <code>cat reboot-priority.txt</code>.", check: file("reboot-priority.txt", "^server5 1\\nserver1 2\\nserver3 10\\nserver4 12\\nserver2 30\\n?$") },
        ],
        quiz: [
          { id: "ten", prompt: "Without <code>-n</code>, why does 10 sort before 2?", answer: "text", explain: "Correct. Plain sort compares characters, and \"1\" comes before \"2\".",
            options: [{ value: "text", label: "Lines are compared as text, character by character" }, { value: "bug", label: "sort is broken for numbers" }, { value: "rev", label: "sort reverses numbers by default" }] },
          { id: "k", prompt: "In <code>sort -k2 -n</code>, what does <code>-k2</code> do?", answer: "field", explain: "Correct. -k picks the key field to sort on.",
            options: [{ value: "field", label: "Sort on the second field" }, { value: "two", label: "Keep the first two lines" }, { value: "cols", label: "Sort two columns at once" }] },
        ],
        challenge: {
          prompt: "Create <code>reboot-priority.txt</code> with the shortest reboot first. Enter the full command.",
          check: { accept: ["sort -k2 -n patch-reboots.txt > reboot-priority.txt", "sort -n -k2 patch-reboots.txt > reboot-priority.txt", "sort -k2n patch-reboots.txt > reboot-priority.txt", "sort -k 2 -n patch-reboots.txt > reboot-priority.txt", "sort -nk2 patch-reboots.txt > reboot-priority.txt"] },
          correct: "Correct. Numeric sort on field 2, saved to a new file.",
          incorrect: "Sort on field 2, numerically, and redirect into reboot-priority.txt.",
        },
        memoryHook: "<code>-n</code> numbers, <code>-r</code> reverse, <code>-k</code> key field, <code>-t</code> field separator, <code>-u</code> unique.",
        completion: "You can sort data by a numeric field.",
      },

      /* ---------------------------------------------------------- 4.2 */
      {
        id: "4.2", title: "Build a server-to-service sheet", navSubtitle: "paste, split", objective: "103.2", difficulty: "Easy",
        source: "Lab 2: Build a Server-to-Service Assignment Sheet",
        summary: "Join two lists side by side with <code>paste</code>, then break a list into batches with <code>split</code>.",
        ticket: ticket("Project lead", "One file lists servers and another lists the service each one runs, in the same order. Build an assignment sheet for the maintenance checklist, then cut the server list into batches of two.", ["paste", "split"], { callout: preview }),
        workspace: base,
        tasks: [
          { id: "paste", title: "Join the lists", command: "paste server-list.txt service-list.txt", detail: "Line 1 of each file goes on line 1 of the output, separated by a tab.", check: pat("^paste server-list\\.txt service-list\\.txt$") },
          { id: "save", title: "Save the sheet", command: "paste server-list.txt service-list.txt > server-service-map.txt", detail: "Then <code>cat server-service-map.txt</code> to check it.", check: file("server-service-map.txt", "^server1\\tweb\\n[\\s\\S]*server5\\tmonitoring") },
          { id: "comma", title: "Use a comma instead", command: "paste -d, server-list.txt service-list.txt", detail: "<code>-d</code> sets the delimiter. A comma gives you CSV for a spreadsheet.", check: pat("^paste -d ?['\"]?,['\"]? server-list\\.txt service-list\\.txt") },
          { id: "split", title: "Split into batches of two", command: "split -l 2 server-list.txt batch-", detail: "<code>-l 2</code> means two lines per file. The prefix <code>batch-</code> gives <code>batch-aa</code>, <code>batch-ab</code>, <code>batch-ac</code>. Check with <code>ls batch-*</code>.", check: { type: "all", checks: [file("batch-aa", "^server1\\nserver2\\n$"), file("batch-ac", "^server5\\n$")] } },
        ],
        quiz: [
          { id: "prefix", prompt: "With no prefix, what does <code>split</code> name its output files?", answer: "xaa", explain: "Correct. xaa, xab, xac, and so on.",
            options: [{ value: "xaa", label: "<code>xaa</code>, <code>xab</code>, …" }, { value: "part1", label: "<code>part1</code>, <code>part2</code>, …" }, { value: "file.1", label: "<code>file.1</code>, <code>file.2</code>, …" }] },
          { id: "tab", prompt: "What does <code>paste</code> put between the columns by default?", answer: "tab", explain: "Correct. A tab, unless you change it with -d.",
            options: [{ value: "tab", label: "A tab" }, { value: "space", label: "A space" }, { value: "comma", label: "A comma" }] },
        ],
        challenge: {
          prompt: "Build <code>server-service-map.txt</code> from the two lists. Enter the command.",
          check: { accept: ["paste server-list.txt service-list.txt > server-service-map.txt"] },
          correct: "Correct. paste joins the files line by line.",
          incorrect: "Use paste with the server list first, then the service list, redirected to the new file.",
        },
        memoryHook: "<code>paste</code> = side by side (columns). <code>cat</code> = one after another (rows). <code>split</code> = the opposite of <code>cat</code>.",
        completion: "You can join and split files.",
      },

      /* ---------------------------------------------------------- 4.3 */
      {
        id: "4.3", title: "Audit local accounts", navSubtitle: "cut -d -f, -c", objective: "103.2", difficulty: "Easy to Medium",
        source: "Lab 3: Audit Local Accounts from a Support Ticket",
        summary: "Pull usernames and login shells out of a colon-separated file with <code>cut</code>.",
        ticket: ticket("Security analyst", "A security review wants every local account and its login shell from a test machine's passwd-style file, so they can spot service accounts that shouldn't log in.", ["cut"], { callout: preview }),
        workspace: base,
        tasks: [
          { id: "names", title: "Usernames", command: "cut -d: -f1 users-sample.txt", detail: "<code>-d:</code> says fields are separated by colons; <code>-f1</code> picks the first one.", check: pat("^cut -d ?['\"]?:['\"]? -f ?1 users-sample\\.txt$|^cut -f ?1 -d ?['\"]?:['\"]? users-sample\\.txt$") },
          { id: "shells", title: "Login shells", command: "cut -d: -f7 users-sample.txt", detail: "Field 7 is the shell. <code>/usr/sbin/nologin</code> means the account can't log in interactively.", check: { type: "output", re: "^/bin/bash\\n/bin/bash\\n/usr/sbin/nologin\\n/bin/bash$" } },
          { id: "both", title: "Name and shell together", command: "cut -d: -f1,7 users-sample.txt > account-shell-report.txt", detail: "A comma picks several fields; a dash picks a range, like <code>-f1-3</code>. Check with <code>cat</code>.", check: file("account-shell-report.txt", "^svcbackup:/usr/sbin/nologin$") },
          { id: "chars", title: "Cut by character position", command: "cut -c1-6 incident-log.txt", detail: "<code>-c</code> cuts by character position instead of field. Here it keeps the date.", check: pat("^cut -c ?1-6 incident-log\\.txt$") },
        ],
        quiz: [
          { id: "delim", prompt: "Which <code>cut</code> option sets the field separator?", answer: "-d", explain: "Correct. -d delimiter, -f fields, -c characters.",
            options: [{ value: "-d", label: "<code>-d</code>" }, { value: "-f", label: "<code>-f</code>" }, { value: "-t", label: "<code>-t</code>" }, { value: "-s", label: "<code>-s</code>" }] },
          { id: "default", prompt: "If you don't give <code>-d</code>, what does <code>cut</code> split fields on?", answer: "tab", explain: "Correct. Tab is cut's default delimiter (sort and awk use whitespace).",
            options: [{ value: "tab", label: "Tab" }, { value: "space", label: "Any whitespace" }, { value: "colon", label: "Colon" }] },
        ],
        challenge: {
          prompt: "Create <code>account-shell-report.txt</code> with each username and its shell. Enter the command.",
          check: { accept: ["cut -d: -f1,7 users-sample.txt > account-shell-report.txt", "cut -d ':' -f1,7 users-sample.txt > account-shell-report.txt", "cut -f1,7 -d: users-sample.txt > account-shell-report.txt", "cut -d: -f 1,7 users-sample.txt > account-shell-report.txt"] },
          correct: "Correct. Fields 1 and 7, colon-separated.",
          incorrect: "Use cut with a colon delimiter and fields 1 and 7, redirected to the report.",
        },
        memoryHook: "<code>cut -d: -f1</code> on passwd = usernames. Fields in <code>/etc/passwd</code>: name:x:UID:GID:comment:home:shell (1 to 7).",
        completion: "You can extract fields and characters.",
      },

      /* ---------------------------------------------------------- 4.4 */
      {
        id: "4.4", title: "Clean up log formatting", navSubtitle: "tr, od", objective: "103.2", difficulty: "Medium",
        source: "Lab 4: Clean Up Log Formatting for a Handoff",
        summary: "Translate and delete characters with <code>tr</code>, and see a file's hidden characters with <code>od</code>.",
        ticket: ticket("Teammate", "A teammate wants <code>incident-log.txt</code> with colons turned into pipes so it pastes cleanly into a ticket or spreadsheet. The original must stay as it is.", ["tr", "od"], { callout: { kind: "warn", title: "tr reads standard input only", text: "<code>tr</code> doesn't take a file name. Feed it a file with <code>&lt;</code>, or pipe into it." } }),
        workspace: base,
        tasks: [
          { id: "pipes", title: "Colons to pipes", command: "tr ':' '|' < incident-log.txt", detail: "Each character in the first set is replaced by the matching one in the second.", check: pat("^tr ['\"]?:['\"]? ['\"]?\\|['\"]? < incident-log\\.txt$") },
          { id: "save", title: "Save the clean copy", command: "tr ':' '|' < incident-log.txt > incident-log-clean.txt", detail: "Then <code>head incident-log-clean.txt</code>, and <code>cat incident-log.txt</code> to prove the original still has colons.", check: { type: "all", checks: [file("incident-log-clean.txt", "sshd\\| Failed"), file("incident-log.txt", "sshd: Failed")] } },
          { id: "upper", title: "Change case", command: "tr 'a-z' 'A-Z' < service-list.txt", detail: "Ranges work, and so do classes: <code>tr '[:lower:]' '[:upper:]'</code>.", check: pat("^tr ['\"]?(a-z|\\[:lower:\\])['\"]? ['\"]?(A-Z|\\[:upper:\\])['\"]? < service-list\\.txt$") },
          { id: "delete", title: "Delete characters", command: "tr -d '0-9' < server-list.txt", detail: "<code>-d</code> deletes every character in the set. <code>-s</code> squeezes repeats into one.", check: pat("^tr -d ") },
          { id: "od", title: "Show hidden characters", command: "od -c service-list.txt", detail: "<code>od -c</code> prints every byte, so you can see the <code>\\n</code> at the end of each line. Handy when tr or a script behaves oddly.", check: pat("^od (-c|-x) ") },
        ],
        quiz: [
          { id: "file", prompt: "Can you write <code>tr ':' '|' incident-log.txt</code>?", answer: "no", explain: "Correct. tr only reads standard input; it complains about an extra operand.",
            options: [{ value: "no", label: "No. tr reads standard input, so use < or a pipe" }, { value: "yes", label: "Yes, tr accepts file names" }, { value: "edit", label: "Yes, and it edits the file in place" }] },
          { id: "d", prompt: "What does <code>tr -d 'aeiou'</code> do?", answer: "delete", explain: "Correct. -d deletes the listed characters.",
            options: [{ value: "delete", label: "Removes every vowel" }, { value: "dup", label: "Doubles every vowel" }, { value: "lines", label: "Deletes lines that contain vowels" }] },
        ],
        challenge: {
          prompt: "Save a copy of <code>incident-log.txt</code> with colons replaced by pipes, as <code>incident-log-clean.txt</code>. Enter the command.",
          check: { accept: ["tr ':' '|' < incident-log.txt > incident-log-clean.txt", "tr : '|' < incident-log.txt > incident-log-clean.txt", "cat incident-log.txt | tr ':' '|' > incident-log-clean.txt", "tr \":\" \"|\" < incident-log.txt > incident-log-clean.txt"] },
          correct: "Correct. tr reads the file through <, and the output goes to a new file.",
          incorrect: "tr needs the file on standard input (<), and the result redirected to the new file.",
        },
        memoryHook: "<strong>tr</strong> = <strong>tr</strong>anslate characters, one for one. It never takes a file name.",
        completion: "You can translate, delete and inspect characters.",
      },

      /* ---------------------------------------------------------- 4.5 */
      {
        id: "4.5", title: "Redact log data before sharing", navSubtitle: "sed s///g", objective: "103.7", difficulty: "Medium",
        source: "Lab 5: Redact Sensitive Log Data Before Sharing",
        summary: "Use <code>sed</code> to substitute text in a stream: preview first, then save to a new file.",
        ticket: ticket("Application team lead", "You're sharing a log excerpt with the application team, but references to <code>root</code> must become <code>REDACTED</code> first. The original is evidence and must not change.", ["sed"], { callout: preview }),
        workspace: base,
        tasks: [
          { id: "preview", title: "Preview the change", command: "sed 's/root/REDACTED/g' incident-log.txt", detail: "<code>s/old/new/</code> substitutes; the <code>g</code> at the end means every match on the line, not just the first.", check: pat("^sed ['\"]s/root/REDACTED/g['\"] incident-log\\.txt$") },
          { id: "first", title: "See what happens without g", command: "sed 's/s/S/' server-list.txt", detail: "Without <code>g</code>, only the first match on each line changes: <code>Server1</code>, not <code>SerVer1</code>-style changes everywhere.", check: pat("^sed ['\"]s/s/S/['\"] server-list\\.txt$") },
          { id: "save", title: "Save the redacted copy", command: "sed 's/root/REDACTED/g' incident-log.txt > incident-log-redacted.txt", detail: "Redirect into a new file. The original still says root.", check: { type: "all", checks: [file("incident-log-redacted.txt", "Failed password for REDACTED"), file("incident-log.txt", "Failed password for root")] } },
          { id: "print", title: "Print only matching lines", command: "sed -n '/sshd/p' incident-log.txt", detail: "<code>-n</code> turns off normal output and <code>p</code> prints just the matches, like grep.", check: pat("^sed -n ['\"]/sshd/p['\"] incident-log\\.txt$") },
          { id: "delete", title: "Delete lines", command: "sed '/kernel/d' incident-log.txt", detail: "<code>d</code> drops matching lines from the output. <code>sed '2d'</code> drops line 2.", check: pat("^sed ['\"](/[^/]+/|\\d+)d['\"] ") },
        ],
        quiz: [
          { id: "g", prompt: "What does the <code>g</code> in <code>s/root/REDACTED/g</code> change?", answer: "all", explain: "Correct. Without g, only the first match on each line is replaced.",
            options: [{ value: "all", label: "Every match on each line is replaced, not just the first" }, { value: "global", label: "The file itself is edited" }, { value: "case", label: "Matching ignores case" }] },
          { id: "i", prompt: "Which <code>sed</code> option edits the file in place instead of printing?", answer: "-i", explain: "Correct. -i edits in place; preview without it first.",
            options: [{ value: "-i", label: "<code>-i</code>" }, { value: "-n", label: "<code>-n</code>" }, { value: "-e", label: "<code>-e</code>" }, { value: "-w", label: "<code>-w</code>" }] },
        ],
        challenge: {
          prompt: "Save a copy of <code>incident-log.txt</code> with every <code>root</code> replaced by <code>REDACTED</code>, as <code>incident-log-redacted.txt</code>.",
          check: { accept: ["sed 's/root/REDACTED/g' incident-log.txt > incident-log-redacted.txt", "sed \"s/root/REDACTED/g\" incident-log.txt > incident-log-redacted.txt", "sed -e 's/root/REDACTED/g' incident-log.txt > incident-log-redacted.txt"] },
          correct: "Correct. Substitute globally, and redirect to a new file.",
          incorrect: "Use sed's s command with the g flag, then redirect to the new file.",
        },
        memoryHook: "<code>s/old/new/</code> = first per line; add <code>g</code> for all. <code>-n …p</code> = print only. <code>d</code> = delete. <code>-i</code> = in place (dangerous).",
        completion: "You can redact text safely with sed.",
      },

      /* ---------------------------------------------------------- 4.6 */
      {
        id: "4.6", title: "Investigate failed logins", navSubtitle: "grep -i -v -c ^ $", objective: "103.7", difficulty: "Medium",
        source: "Lab 6: Investigate Failed Logins and Application Errors",
        summary: "Search logs with <code>grep</code>: ignore case, count, invert, anchor to the start or end of a line, and save the results.",
        ticket: ticket("Major Incident Manager", "During an incident, the bridge needs every failed SSH login and every application error from the log sample, saved to separate files.", ["grep", "wc"], { callout: preview }),
        workspace: base,
        tasks: [
          { id: "failed", title: "Failed logins, any case", command: "grep -i 'failed password' incident-log.txt", detail: "grep is case-sensitive; <code>-i</code> ignores case.", check: pat("^grep -i ['\"]failed password['\"] incident-log\\.txt$") },
          { id: "save", title: "Save both investigations", short: "<code>failed-logins.txt</code> and <code>app-errors.txt</code>", detail: "<code>grep -i 'failed password' incident-log.txt &gt; failed-logins.txt</code>, then <code>grep 'ERROR' incident-log.txt &gt; app-errors.txt</code>.", check: { type: "all", checks: [file("failed-logins.txt", "for invalid user admin\\n[\\s\\S]*for root", "Accepted"), file("app-errors.txt", "^Aug 19 08:09 server2 app: ERROR database timeout\\n?$")] } },
          { id: "count", title: "Check the counts", command: "wc -l failed-logins.txt app-errors.txt", detail: "Expect 2 failed logins and 1 error. <code>grep -c</code> counts directly.", check: pat("^wc -l failed-logins\\.txt app-errors\\.txt$") },
          { id: "anchors", title: "Anchor to the start and end", short: "<code>grep '^Aug'</code> and <code>grep 'root$'</code>", detail: "<code>^</code> means start of line, <code>$</code> end of line. Run both against incident-log.txt.", check: { type: "history", includes: ["^grep ['\"]?\\^\\S+['\"]? incident-log\\.txt$", "^grep ['\"]?\\S+\\$['\"]? incident-log\\.txt$"] } },
          { id: "invert", title: "Everything except sshd", command: "grep -v sshd incident-log.txt", detail: "<code>-v</code> inverts the match: lines that don't contain the pattern.", check: pat("^grep -v ['\"]?sshd['\"]? incident-log\\.txt$") },
        ],
        quiz: [
          { id: "case", prompt: "Is <code>grep</code> case-sensitive by default?", answer: "yes", explain: "Correct. Use -i to ignore case.",
            options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
          { id: "anchor", prompt: "Which pattern matches lines that <em>end</em> with root?", answer: "root$", explain: "Correct. $ anchors to the end, ^ to the start.",
            options: [{ value: "^root", label: "<code>^root</code>" }, { value: "root$", label: "<code>root$</code>" }, { value: "$root", label: "<code>$root</code>" }] },
          { id: "c", prompt: "Which option prints how many lines match instead of the lines?", answer: "-c", explain: "Correct. -c counts matching lines.",
            options: [{ value: "-c", label: "<code>-c</code>" }, { value: "-n", label: "<code>-n</code>" }, { value: "-l", label: "<code>-l</code>" }, { value: "-v", label: "<code>-v</code>" }] },
        ],
        challenge: {
          prompt: "Count the lines in <code>incident-log.txt</code> that contain <code>sshd</code>, using grep alone. Enter the command.",
          check: { accept: ["grep -c sshd incident-log.txt", "grep -c 'sshd' incident-log.txt", "grep -c \"sshd\" incident-log.txt"] },
          correct: "Correct. grep -c prints 3.",
          incorrect: "Use grep's count option.",
        },
        memoryHook: "<code>-i</code> ignore case, <code>-v</code> invert, <code>-c</code> count, <code>-n</code> line numbers, <code>-E</code> extended regex (<code>a|b</code>), <code>^</code> start, <code>$</code> end.",
        completion: "You can search logs like an incident responder.",
      },

      /* ---------------------------------------------------------- 4.P */
      {
        id: "4.P", navNumber: "P", title: "LPIC-style practical set", navSubtitle: "Five tickets, no hints", objective: "103.7", difficulty: "Hard",
        source: "LPIC-Style Practical Questions", noHints: true, tasksHeading: "Tickets",
        summary: "The workbook's five practical questions as tickets. No commands are given; each is checked by the file you produce.",
        ticket: ticket("Several requesters", "Five requests arrive at once. Answer each by creating the named file in <code>~/lpic-section4-labs</code>. Leave the original files unchanged.", ["sort", "cut", "grep", "paste", "sed"], { heading: "Five tickets" }),
        workspace: base,
        tasks: [
          { id: "q1", title: "Manager: create reboot-priority.txt with the fastest reboots first", check: file("reboot-priority.txt", "^server5 1\\nserver1 2\\nserver3 10\\nserver4 12\\nserver2 30\\n?$") },
          { id: "q2", title: "Security analyst: report which accounts have interactive shells (bash), in shell-users.txt", check: { type: "all", checks: [file("shell-users.txt", "root"), file("shell-users.txt", "appuser"), file("shell-users.txt", "", "svcbackup")] } },
          { id: "q3", title: "Incident bridge: save failed SSH login lines to failed-logins.txt", check: file("failed-logins.txt", "invalid user admin[\\s\\S]*for root", "Accepted") },
          { id: "q4", title: "Project lead: build server-service-map.txt from the two lists", check: file("server-service-map.txt", "^server1\\s+web\\n[\\s\\S]*server5\\s+monitoring") },
          { id: "q5", title: "Teammate: create a redacted copy where root becomes REDACTED", check: { type: "all", checks: [{ type: "any", checks: ["incident-log-redacted.txt", "redacted.txt", "incident-log-redact.txt"].map((f) => file(f, "for REDACTED")) }, file("incident-log.txt", "for root")] } },
        ],
        quiz: [],
        completion: "All five tickets answered.",
      },
    ],

    review: {
      traps: [
        "`sort` is alphabetical unless you add `-n`, so 10 sorts before 2.",
        "`sort -k2` sorts from field 2 to the end of the line; `-k2,2` uses field 2 only.",
        "`cut` splits on tab unless you give `-d`. `-f` picks fields, `-c` picks characters.",
        "`tr` reads standard input only. `tr a b file` fails; use `tr a b < file`.",
        "`sed 's/a/b/'` replaces only the first match on each line. Add `g` for all of them.",
        "`sed` prints to the screen and leaves the file alone unless you use `-i`.",
        "`grep` is case-sensitive by default; `-i` ignores case.",
        "`^` anchors to the start of a line and `$` to the end.",
        "Basic regex treats `|`, `+`, `?` and `()` as literal; use `grep -E` (or `\\|`) for alternation.",
        "`split` names its output `xaa`, `xab`, … unless you give a prefix.",
      ],
      trapQuiz: [
        { id: "t1", prompt: "Which sorts lines by the third colon-separated field, as numbers?", answer: "sort -t: -k3 -n", options: ["sort -d: -f3 -n", "sort -t: -k3 -n", "sort -k3 -n -d:", "cut -d: -f3 | sort"], explain: "Correct. sort uses -t for the separator and -k for the key." },
        { id: "t2", prompt: "<code>echo aaa | sed 's/a/b/'</code> prints what?", answer: "baa", options: ["bbb", "baa", "aab", "aaa"], explain: "Correct. Without g only the first a changes." },
        { id: "t3", prompt: "Which finds lines containing <em>error</em> or <em>warning</em>?", answer: "grep -E 'error|warning'", options: ["grep 'error|warning'", "grep -E 'error|warning'", "grep -v 'error warning'", "grep -c error warning"], explain: "Correct. Plain grep treats | as a literal character." },
        { id: "t4", prompt: "Which prints usernames from <code>/etc/passwd</code>?", answer: "cut -d: -f1 /etc/passwd", options: ["cut -f1 /etc/passwd", "cut -d: -f1 /etc/passwd", "cut -c: -f1 /etc/passwd", "tr : ' ' /etc/passwd"], explain: "Correct. Without -d: cut would split on tabs." },
        { id: "t5", prompt: "Which changes every lowercase letter in <code>file</code> to uppercase on screen?", answer: "tr a-z A-Z < file", options: ["tr a-z A-Z file", "tr a-z A-Z < file", "sed 's/a-z/A-Z/g' file", "tr -u file"], explain: "Correct. tr needs its input on stdin." },
      ],
      challenge: {
        intro: "On your VM, rerun the Lab Setup, then do every lab again without notes. Explain each command as you go.",
        tasks: [
          "Sort `patch-reboots.txt` by reboot time, shortest first, into `reboot-priority.txt`.",
          "Build `server-service-map.txt` with `paste`, and split `server-list.txt` into batches of two.",
          "Produce `account-shell-report.txt` with usernames and shells using `cut`.",
          "Make `incident-log-clean.txt` with pipes instead of colons, without changing the original.",
          "Make `incident-log-redacted.txt` with `root` replaced by `REDACTED`.",
          "Save failed SSH logins to `failed-logins.txt` and application errors to `app-errors.txt`, then count them.",
        ],
        outro: "Then demonstrate grep, cut, sed and sort from memory to someone else, or out loud.",
      },
      questions: [
        { q: "Manager request: “Give me the fastest reboot order from patch-reboots.txt.”", a: "<code>sort -k2 -n patch-reboots.txt &gt; reboot-priority.txt</code>. Numeric sort on the minutes column; server5 comes first." },
        { q: "Security analyst request: “Which local accounts have interactive shells?”", a: "<code>grep 'bash$' users-sample.txt | cut -d: -f1</code> lists accounts whose shell ends in bash. <code>cut -d: -f1,7</code> shows every account with its shell, so you can spot <code>nologin</code>." },
        { q: "Incident bridge request: “Send me the failed SSH logins.”", a: "<code>grep -i 'failed password' incident-log.txt &gt; failed-logins.txt</code>, then <code>wc -l failed-logins.txt</code> to report the count (2)." },
        { q: "Project lead request: “I need a server-to-service mapping.”", a: "<code>paste server-list.txt service-list.txt &gt; server-service-map.txt</code>. Add <code>-d,</code> for a CSV." },
        { q: "Teammate request: “Send me the log with root redacted, but don't touch the original.”", a: "<code>sed 's/root/REDACTED/g' incident-log.txt &gt; incident-log-redacted.txt</code>. Without <code>-i</code>, sed never changes the original." },
      ],
      mastery: [
        "I can sort operational data by a specific numeric field.",
        "I can join files with `paste` and break them up with `split`.",
        "I can extract useful account data from colon-delimited files with `cut`.",
        "I can translate, squeeze and delete characters with `tr`, and see hidden characters with `od -c`.",
        "I can substitute, print and delete lines with `sed`, and explain `g` and `-i`.",
        "I can search logs for failed logins, errors and other incident clues with `grep` and its options.",
        "I can safely clean, redact, split and transform text without damaging the original evidence or source file.",
      ],
    },
  });
})();
