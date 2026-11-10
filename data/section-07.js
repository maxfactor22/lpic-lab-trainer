/* Section 7: File and directory management (103.3). From "LPIC - Section 7.docx", Labs 1–17
   grouped into six lessons, plus the challenge exam. */
(function () {
  const WS = "~/lpic1-section7";
  const FILES = {
    [WS + "/logs/incident-bridge.log"]: "2026-08-26 09:01 INFO bridge opened\n2026-08-26 09:04 WARN packet loss from lab-gw01\n2026-08-26 09:07 ERROR dns lookup failed\n2026-08-26 09:12 INFO service restored\n",
    [WS + "/incoming/asset-export.csv"]: "asset_id,hostname,status\n1001,web01,active\n1002,db01,active\n1003,old01,retired\n",
    [WS + "/configs/backup.conf"]: "backup_enabled=true\nretention_days=30\nowner=ops\n",
    [WS + "/incoming/ticket-1042.txt"]: "", [WS + "/incoming/ticket-1043.log"]: "", [WS + "/incoming/ticket-1044.txt"]: "",
    [WS + "/incoming/notes-final.md"]: "", [WS + "/incoming/notes-draft.md"]: "",
    [WS + "/projects/network-refresh/plans/change-plan.txt"]: "", [WS + "/projects/network-refresh/logs/precheck.log"]: "", [WS + "/projects/network-refresh/configs/router.conf"]: "",
    [WS + "/projects/identity-audit/raw/"]: null, [WS + "/archive/old-network-refresh/"]: null,
    [WS + "/users/mock-passwd"]: "root:x:0:0:root:/root:/bin/bash\nsvc-backup:x:998:998:Backup Service:/var/lib/backup:/usr/sbin/nologin\nmax:x:1000:1000:Max:/home/max:/bin/bash\ntemp-audit:x:1005:1005:Temp Audit:/home/temp-audit:/bin/bash\n",
    [WS + "/workbench/"]: null, [WS + "/reports/"]: null, [WS + "/tmp/"]: null,
  };
  const base = { user: "max", host: "linux-mint", cwd: WS, files: FILES };
  const ticket = (requestedBy, body, tools, extra = {}) => ({ requestedBy, system: "Linux Mint VM", badge: "IT engineer", tools, body, ...extra });
  const pat = (re) => ({ type: "pattern", re });
  const file = (name, re, not) => ({ type: "file", path: WS + "/" + name, re, not });
  const gone = (name) => ({ type: "file", path: WS + "/" + name, exists: false });
  const dir = (name) => ({ type: "dir", path: WS + "/" + name });
  const nodir = (name) => ({ type: "dir", path: WS + "/" + name, exists: false });
  const out = (re) => ({ type: "output", re });
  const confirmNote = { kind: "info", title: "Interactive prompts", text: "<code>-i</code> makes cp, mv and rm ask first. Here a confirmation box pops up: OK means yes, Cancel means no." };

  LPIC.section({
    id: "section-07",
    number: 7,
    title: "File and Directory Management",
    objectives: ["103.3"],
    kind: "terminal",
    source: "LPIC - Section 7.docx",
    scenario: "You're an IT engineer handling ticket files, evidence and project folders. Select exactly the right files with wildcards, prove what they are, and create, copy, move, rename and remove files and directory trees without losing anything you meant to keep.",
    overview: {
      paragraphs: [
        "Treat each lab like a ticket: decide what evidence you need, run the safest command, and leave a small handoff file that proves the work.",
        "On your VM, run the workbook's Lab Setup to create <code>~/lpic1-section7</code>. The practice terminal already has it. Preview every wildcard with <code>ls</code> before you hand it to <code>rm</code>, <code>cp</code> or <code>mv</code>.",
      ],
      commands: ["ls", "ls -d", "ls -F", "ls -R", "ls -A", "*", "?", "[abc]", "[a-z]", "[^abc]", "file", "touch", "stat", "echo >", "echo >>", "rm", "rm -i", "rm -v", "rm -r", "mkdir", "mkdir -p", "rmdir", "cp", "cp -i", "cp -r", "mv", "mv -i"],
      memoryHook: "<code>ls</code> shows what exists, <code>file</code> what it really is, <code>touch</code> creates or re-dates, <code>stat</code> shows timestamps, <code>rm</code> removes (carefully), <code>cp</code> keeps the original and makes a copy, <code>mv</code> moves or renames.",
    },

    lessons: [
      /* ---------------------------------------------------------- 7.1 */
      {
        id: "7.1", title: "Select files with wildcards", navSubtitle: "* ? [ ] (Labs 1–2)", objective: "103.3", difficulty: "Beginner",
        source: "Labs 1–2: Triage incoming ticket files with globbing",
        summary: "Use <code>*</code>, <code>?</code> and brackets to list exactly the files a request asks for.",
        ticket: ticket("Incident lead", "Before a handoff, the lead wants only the ticket text files from <code>incoming</code>, not the Markdown notes or logs, and then just tickets 1042 to 1044.", ["ls", "*", "?", "[ ]"]),
        workspace: base,
        tasks: [
          { id: "star", title: "Only ticket text files", short: "Save to <code>reports/ticket-text-files.txt</code>", detail: "<code>ls incoming/ticket-*.txt &gt; reports/ticket-text-files.txt</code>. <code>*</code> matches any number of characters.", check: file("reports/ticket-text-files.txt", "ticket-1042\\.txt[\\s\\S]*ticket-1044\\.txt", "\\.log|\\.md") },
          { id: "toowide", title: "See a pattern that's too wide", command: "ls incoming/*.txt", detail: "Here it happens to match the same files, but in a real folder <code>*.txt</code> catches every text file, not just tickets. Read the request first.", check: pat("^ls incoming/\\*\\.txt$") },
          { id: "q", title: "One changing character", short: "Save to <code>reports/ticket-range.txt</code>", detail: "<code>ls incoming/ticket-104?.txt</code>. <code>?</code> matches exactly one character.", check: file("reports/ticket-range.txt", "ticket-1042\\.txt[\\s\\S]*ticket-1044\\.txt", "\\.log|\\.md") },
          { id: "brackets", title: "A set and a range", short: "<code>ls incoming/ticket-104[34].*</code> and <code>ls incoming/ticket-104[2-3]*</code>", detail: "<code>[34]</code> is one character, 3 or 4. <code>[2-3]</code> is a range. Both match one character only.", check: { type: "history", includes: ["\\[\\d\\d\\]", "\\[\\d-\\d\\]"] } },
          { id: "negate", title: "Everything except drafts", command: "ls incoming/notes-[^d]*", detail: "<code>[^d]</code> means any one character except d. <code>[!d]</code> is the POSIX spelling, but in an interactive Bash the <code>!</code> starts history expansion, so try it and see.", check: { type: "all", checks: [pat("notes-\\[\\^d\\]"), out("notes-final\\.md")] } },
        ],
        quiz: [
          { id: "qzero", prompt: "Does <code>?</code> match zero characters?", answer: "no", explain: "Correct. ? is exactly one character; * is zero or more.",
            options: [{ value: "no", label: "No, exactly one" }, { value: "yes", label: "Yes, zero or one" }] },
          { id: "who", prompt: "Who expands <code>*.txt</code> into file names?", answer: "shell", explain: "Correct. The shell expands the pattern before the command runs, so rm never sees the *.",
            options: [{ value: "shell", label: "The shell, before the command runs" }, { value: "cmd", label: "The command, such as ls or rm" }, { value: "kernel", label: "The kernel" }] },
        ],
        challenge: {
          prompt: "List only tickets 1043 and 1044, with any extension, using one bracket pattern.",
          check: { accept: ["ls incoming/ticket-104[34].*", "ls incoming/ticket-104[34]*", "ls incoming/ticket-104[3-4].*", "ls incoming/ticket-104[3-4]*"] },
          correct: "Correct. One bracket set picks the last digit.",
          incorrect: "Put the two possible last digits in square brackets, then match any extension.",
        },
        memoryHook: "Globs are not regex: <code>*</code> = anything, <code>?</code> = one character, <code>[ ]</code> = one from the set. (In regex, <code>.*</code> is the anything.)",
        completion: "You can pick exactly the right files with wildcards.",
      },

      /* ---------------------------------------------------------- 7.2 */
      {
        id: "7.2", title: "Identify files and timestamps", navSubtitle: "file, stat, touch (Labs 3, 5)", objective: "103.3", difficulty: "Beginner",
        source: "Labs 3 and 5: Verify file types; refresh a timestamp",
        summary: "Prove what a file really is with <code>file</code>, read its timestamps with <code>stat</code>, and see what <code>touch</code> changes.",
        ticket: ticket("Security analyst", "Before an export is uploaded to a case record, prove it's plain text. Then show that the backup config was reviewed today without changing its contents.", ["file", "stat", "touch"]),
        workspace: base,
        tasks: [
          { id: "file", title: "What kind of files are these?", short: "Save to <code>reports/file-type-check.txt</code>", detail: "<code>file incoming/asset-export.csv configs/backup.conf &gt; reports/file-type-check.txt</code>. file reads the content, not the name.", check: file("reports/file-type-check.txt", "asset-export\\.csv:\\s+CSV[\\s\\S]*backup\\.conf:\\s+ASCII text") },
          { id: "empty", title: "An empty file and a directory", command: "file incoming/ticket-1042.txt projects", detail: "Even names that look like text files can be empty.", check: { type: "all", checks: [pat("^file "), out("empty"), out("directory")] } },
          { id: "before", title: "Timestamps before", command: "stat configs/backup.conf > reports/backup-conf-timestamps.txt", detail: "Access, Modify and Change times are near the bottom.", check: file("reports/backup-conf-timestamps.txt", "Modify:") },
          { id: "touch", title: "Touch and compare", short: "<code>touch configs/backup.conf</code>, then append <code>stat</code> again", detail: "<code>stat configs/backup.conf &gt;&gt; reports/backup-conf-timestamps.txt</code>, then <code>cat</code> it. Modify changed; the content didn't.", check: { type: "all", checks: [file("reports/backup-conf-timestamps.txt", "Modify:[\\s\\S]*Modify:"), file("configs/backup.conf", "^backup_enabled=true\\nretention_days=30\\nowner=ops\\n$"), { type: "history", includes: ["^touch configs/backup\\.conf$"] }] } },
        ],
        quiz: [
          { id: "touchcontent", prompt: "What does <code>touch</code> do to a file that already exists?", answer: "time", explain: "Correct. It updates the timestamps and leaves the content alone.",
            options: [{ value: "time", label: "Updates its timestamps; the content stays" }, { value: "empty", label: "Empties it" }, { value: "error", label: "Fails because it exists" }] },
          { id: "ext", prompt: "How does <code>file</code> decide what a file is?", answer: "content", explain: "Correct. It looks at the bytes inside, not the extension.",
            options: [{ value: "content", label: "By reading its content" }, { value: "ext", label: "By its extension" }, { value: "perm", label: "By its permissions" }] },
        ],
        challenge: {
          prompt: "Identify the type of every file in <code>configs</code> and <code>logs</code> with one command.",
          check: { accept: ["file configs/* logs/*", "file logs/* configs/*", "file configs/backup.conf logs/incident-bridge.log"] },
          correct: "Correct. The shell expands both wildcards and file checks each one.",
          incorrect: "Give file a wildcard for each folder.",
        },
        memoryHook: "<code>stat</code>: Access = last read, Modify = content changed (or touch), Change = metadata changed.",
        completion: "You can prove what a file is and when it changed.",
      },

      /* ---------------------------------------------------------- 7.3 */
      {
        id: "7.3", title: "Create and remove files safely", navSubtitle: "echo >, >>, rm -i (Labs 4, 6)", objective: "103.3", difficulty: "Intermediate",
        source: "Labs 4 and 6: Create a handoff note; safely remove temporary notes",
        summary: "Write a short file without an editor, and remove exactly one file after previewing the pattern.",
        ticket: ticket("Project lead", "You're leaving the incident bridge and need a two-line handoff note. Then remove the draft Markdown note, but keep the final one.", ["echo", ">", ">>", "rm -i"], { callout: confirmNote }),
        workspace: base,
        tasks: [
          { id: "note", title: "Write the handoff note", short: "Two lines into <code>reports/handoff-note.txt</code>", detail: "<code>echo 'Status: DNS lookup failures restored at 09:12' &gt; reports/handoff-note.txt</code>, then the next action with <code>&gt;&gt;</code>.", check: file("reports/handoff-note.txt", "^Status:.+\\n.*(Next|action).+\\n?$") },
          { id: "preview", title: "Preview before removing", command: "ls incoming/notes-*.md", detail: "Always check what a wildcard matches before handing it to rm.", check: pat("^ls incoming/notes-\\*\\.md$") },
          { id: "remove", title: "Remove only the draft", command: "rm -i incoming/notes-draft.md", detail: "Answer yes. Then <code>ls incoming/notes-*.md</code> again.", check: { type: "all", checks: [gone("incoming/notes-draft.md"), file("incoming/notes-final.md")] } },
          { id: "verbose", title: "See what rm removed", short: "<code>touch tmp/a.tmp tmp/b.tmp</code>, then <code>rm -v tmp/*.tmp</code>", detail: "<code>-v</code> prints each file it removes.", check: { type: "all", checks: [pat("^rm -v "), out("^removed ")] } },
        ],
        quiz: [
          { id: "gt", prompt: "Which keeps the existing lines and adds one more?", answer: ">>", explain: "Correct. > overwrites; >> appends.",
            options: [{ value: ">", label: "<code>echo line &gt; file</code>" }, { value: ">>", label: "<code>echo line &gt;&gt; file</code>" }] },
          { id: "bin", prompt: "Where does a file go after <code>rm</code>?", answer: "gone", explain: "Correct. There's no recycle bin at the command line.",
            options: [{ value: "gone", label: "It's gone; there's no recycle bin" }, { value: "trash", label: "~/.local/share/Trash" }, { value: "tmp", label: "/tmp" }] },
        ],
        challenge: {
          prompt: "Remove <code>incoming/notes-draft.md</code> so that rm asks you first.",
          check: { accept: ["rm -i incoming/notes-draft.md"] },
          correct: "Correct.",
          incorrect: "Use rm's interactive option.",
        },
        memoryHook: "Preview with <code>ls PATTERN</code>, then run <code>rm -i PATTERN</code>. Same pattern, no surprises.",
        completion: "You can create and remove files without accidents.",
      },

      /* ---------------------------------------------------------- 7.4 */
      {
        id: "7.4", title: "Copy, move and rename", navSubtitle: "cp, mv, cp -i (Labs 7–10)", objective: "103.3", difficulty: "Advanced",
        source: "Labs 7–10: Copy evidence, move an export, rename a report, prevent overwrites",
        summary: "Copy evidence while keeping the original, move and rename with <code>mv</code>, and stop accidental overwrites with <code>-i</code>.",
        ticket: ticket("Operations manager", "Attach a copy of the bridge log to the handoff, stage the asset export in the workbench, give the timestamp report a clearer name, and copy the reviewed config without overwriting anything silently.", ["cp", "mv", "cp -i"], { callout: confirmNote }),
        workspace: { ...base, files: { ...FILES, [WS + "/reports/backup-conf-timestamps.txt"]: "  File: configs/backup.conf\n", [WS + "/workbench/backup.conf"]: "backup_enabled=false\n# old copy\n" } },
        tasks: [
          { id: "copy", title: "Copy the evidence", command: "cp logs/incident-bridge.log reports/incident-bridge-evidence.log", detail: "Then <code>ls logs/incident-bridge.log reports/incident-bridge-evidence.log</code>: both exist.", check: { type: "all", checks: [file("reports/incident-bridge-evidence.log", "ERROR dns lookup failed"), file("logs/incident-bridge.log", "ERROR dns")] } },
          { id: "move", title: "Move the export", command: "mv incoming/asset-export.csv workbench/asset-export.csv", detail: "It's now in workbench and gone from incoming.", check: { type: "all", checks: [file("workbench/asset-export.csv", "asset_id"), gone("incoming/asset-export.csv")] } },
          { id: "rename", title: "Rename a report", command: "mv reports/backup-conf-timestamps.txt reports/backup-review-evidence.txt", detail: "Renaming is just moving to a new name in the same folder.", check: { type: "all", checks: [file("reports/backup-review-evidence.txt"), gone("reports/backup-conf-timestamps.txt")] } },
          { id: "cpi", title: "Copy without silent overwrite", command: "cp -i configs/backup.conf workbench/backup.conf", detail: "workbench already has an old backup.conf, so cp asks first. Answer yes to replace it.", check: { type: "all", checks: [pat("^cp -i "), file("workbench/backup.conf", "backup_enabled=true")] } },
        ],
        quiz: [
          { id: "rename", prompt: "Which command renames a file for this objective?", answer: "mv", explain: "Correct. mv old new. There's no separate rename command to learn here.",
            options: [{ value: "mv", label: "<code>mv</code>" }, { value: "rename", label: "<code>rename</code>" }, { value: "cp", label: "<code>cp</code> then <code>rm</code>" }] },
          { id: "silent", prompt: "Without <code>-i</code>, what do cp and mv do if the destination exists?", answer: "over", explain: "Correct. They overwrite it silently.",
            options: [{ value: "over", label: "Overwrite it silently" }, { value: "ask", label: "Ask first" }, { value: "fail", label: "Refuse with an error" }] },
        ],
        challenge: {
          prompt: "Rename <code>reports/handoff.txt</code> to <code>reports/storage-migration-handoff.txt</code>.",
          check: { accept: ["mv reports/handoff.txt reports/storage-migration-handoff.txt"] },
          correct: "Correct.",
          incorrect: "Renaming uses mv with the old name, then the new name.",
        },
        memoryHook: "<code>cp</code> = two files afterward. <code>mv</code> = one file, new place or new name. Add <code>-i</code> when the destination might exist.",
        completion: "You can copy, move and rename safely.",
      },

      /* ---------------------------------------------------------- 7.5 */
      {
        id: "7.5", title: "Make and inspect directories", navSubtitle: "mkdir -p, {a,b}, ls -F -d (Labs 11–13)", objective: "103.3", difficulty: "Beginner",
        source: "Labs 11–13: Create project folders and identify directories",
        summary: "Create one directory, a whole nested layout in one command, and spot directories with <code>ls -F</code>.",
        ticket: ticket("Project lead", "Set up a clean folder for a router maintenance window with plans, logs, configs and rollback subfolders, then report which items in projects are directories.", ["mkdir", "mkdir -p", "ls -F", "ls -d"]),
        workspace: base,
        tasks: [
          { id: "one", title: "One new directory", command: "mkdir projects/router-maintenance", detail: "Check it with <code>ls -d projects/router-maintenance</code>.", check: dir("projects/router-maintenance") },
          { id: "fail", title: "See mkdir fail without -p", command: "mkdir projects/change-2026/plans", detail: "The parent <code>change-2026</code> doesn't exist yet, so mkdir refuses.", check: pat("^mkdir projects/change-2026/plans$") },
          { id: "nested", title: "A whole layout in one command", command: "mkdir -p projects/router-maintenance/{plans,logs,configs,rollback}", detail: "The shell expands the braces into four paths; <code>-p</code> creates parents and doesn't complain about ones that exist. Check with <code>ls -F projects/router-maintenance</code>.", check: { type: "all", checks: ["plans", "logs", "configs", "rollback"].map((d) => dir("projects/router-maintenance/" + d)) } },
          { id: "types", title: "Which items are directories?", short: "Save <code>ls -F projects</code> to <code>reports/project-directory-types.txt</code>", detail: "A trailing <code>/</code> marks a directory.", check: file("reports/project-directory-types.txt", "router-maintenance/") },
        ],
        quiz: [
          { id: "p", prompt: "What does <code>mkdir -p</code> do if the directory already exists?", answer: "quiet", explain: "Correct. That's handy, but it also hides typos.",
            options: [{ value: "quiet", label: "Nothing, and no error" }, { value: "error", label: "Fails with File exists" }, { value: "empty", label: "Empties it" }] },
          { id: "brace", prompt: "<code>mkdir d/{a,b}</code> creates…", answer: "two", explain: "Correct. The shell turns it into mkdir d/a d/b.",
            options: [{ value: "two", label: "<code>d/a</code> and <code>d/b</code>" }, { value: "lit", label: "A directory named <code>{a,b}</code>" }, { value: "err", label: "An error" }] },
        ],
        challenge: {
          prompt: "Create <code>projects/storage-migration</code> with <code>plans</code>, <code>logs</code>, <code>configs</code> and <code>rollback</code> subdirectories, in one command.",
          check: { accept: ["mkdir -p projects/storage-migration/{plans,logs,configs,rollback}"], re: "^mkdir -p projects/storage-migration/\\{(plans|logs|configs|rollback)(,(plans|logs|configs|rollback)){3}\\}$" },
          correct: "Correct.",
          incorrect: "Use mkdir -p with brace expansion for the four subdirectories.",
        },
        memoryHook: "<code>-p</code> = parents. <code>ls -d</code> = the directory itself, <code>ls -F</code> = mark types, <code>ls -R</code> = everything below.",
        completion: "You can build and inspect directory layouts.",
      },

      /* ---------------------------------------------------------- 7.6 */
      {
        id: "7.6", title: "Remove, copy and move directory trees", navSubtitle: "rmdir, rm -ri, cp -r (Labs 14–17)", objective: "103.3", difficulty: "Intermediate to Advanced",
        source: "Labs 14–17: Remove directories; copy and move directory trees",
        summary: "Remove empty and full directories safely, find the hidden file that blocks <code>rmdir</code>, and copy or move whole trees.",
        ticket: ticket("Change manager", "Clean up the staging and test folders from the maintenance window, back up the network-refresh project before a risky change, and archive the finished identity audit.", ["rmdir", "ls -A", "rm -ri", "cp -r", "mv", "ls -R"], { callout: confirmNote }),
        workspace: { ...base, files: { ...FILES, [WS + "/tmp/cleanup-test/.lock"]: "" } },
        tasks: [
          { id: "rmdir", title: "Remove an empty staging folder", short: "<code>mkdir tmp/empty-staging</code>, <code>ls -A</code> it, then <code>rmdir</code> it", detail: "<code>rmdir</code> only removes empty directories.", check: { type: "all", checks: [{ type: "history", includes: ["^rmdir tmp/empty-staging/?$"] }, nodir("tmp/empty-staging")] } },
          { id: "hidden", title: "Find the hidden blocker", short: "<code>rmdir tmp/cleanup-test</code>, then <code>ls</code> and <code>ls -A</code> it", detail: "rmdir says it isn't empty, but <code>ls</code> shows nothing. <code>ls -A</code> reveals <code>.lock</code>.", check: { type: "history", includes: ["^rmdir tmp/cleanup-test/?$", "^ls -[aA]\\w* tmp/cleanup-test/?$"] } },
          { id: "tree", title: "Remove a tree, interactively", short: "Build <code>tmp/repro-test/subtest</code> with a file, <code>ls -R</code> it, then <code>rm -ri tmp/repro-test</code>", detail: "<code>mkdir -p tmp/repro-test/subtest; touch tmp/repro-test/subtest/error-sample.log</code>. rm -ri asks before descending and before each removal; answer yes to each.", check: { type: "all", checks: [{ type: "history", includes: ["^rm -(ri|ir|r -i|i -r) tmp/repro-test/?$"] }, nodir("tmp/repro-test")] } },
          { id: "cpr", title: "Back up a whole project", command: "cp -r projects/network-refresh archive/network-refresh-prechange", detail: "<code>-r</code> is required for directories. Prove it with <code>ls -R archive/network-refresh-prechange</code>.", check: { type: "all", checks: [file("archive/network-refresh-prechange/configs/router.conf"), file("projects/network-refresh/configs/router.conf")] } },
          { id: "mvdir", title: "Archive a finished project", command: "mv projects/identity-audit archive/identity-audit-complete", detail: "mv moves directories without <code>-r</code>.", check: { type: "all", checks: [dir("archive/identity-audit-complete/raw"), nodir("projects/identity-audit")] } },
        ],
        quiz: [
          { id: "r", prompt: "Which needs <code>-r</code> to work on a directory?", answer: "cp", explain: "Correct. cp needs -r; mv moves directories as they are.",
            options: [{ value: "cp", label: "<code>cp</code>" }, { value: "mv", label: "<code>mv</code>" }, { value: "both", label: "Both" }] },
          { id: "hiddenq", prompt: "rmdir says <em>Directory not empty</em>, but <code>ls</code> shows nothing. Why?", answer: "dot", explain: "Correct. ls hides dotfiles; ls -A shows them.",
            options: [{ value: "dot", label: "It contains a hidden file, such as .lock" }, { value: "perm", label: "You need sudo" }, { value: "bug", label: "rmdir is confused; use rm" }] },
        ],
        challenge: {
          prompt: "Copy the whole <code>projects/storage-migration</code> tree to <code>archive/storage-migration-prechange</code>.",
          check: { accept: ["cp -r projects/storage-migration archive/storage-migration-prechange", "cp -R projects/storage-migration archive/storage-migration-prechange", "cp -a projects/storage-migration archive/storage-migration-prechange"] },
          correct: "Correct.",
          incorrect: "cp needs its recursive option for a directory.",
        },
        memoryHook: "<code>rmdir</code> = empty only. <code>rm -r</code> = everything below, no bin. Practice with <code>rm -ri</code> so every step asks.",
        completion: "You can manage whole directory trees safely.",
      },

      /* ---------------------------------------------------------- 7.C */
      {
        id: "7.C", navNumber: "C", title: "Challenge exam: storage migration", navSubtitle: "No notes", objective: "103.3", difficulty: "Hard",
        source: "Scenario-Based Challenge Exam", noHints: true, tasksHeading: "Tasks",
        summary: "The workbook's seven challenge tasks. Each is checked by what's left on disk.",
        ticket: ticket("Change manager", "Prepare the storage migration: gather evidence, build and back up the project layout, give the handoff a clear name, and clean up the test folder. Don't delete anything you weren't asked to.", ["ls", "file", "mkdir", "cp", "mv", "rm"], { heading: "Ticket: storage migration", callout: confirmNote }),
        workspace: base,
        tasks: [
          { id: "c1", title: "reports/challenge-tickets.txt: only tickets 1043 and 1044, any extension, using one bracket pattern", check: { type: "all", checks: [file("reports/challenge-tickets.txt", "ticket-1043\\.log[\\s\\S]*ticket-1044\\.txt", "1042"), { type: "history", includes: ["104\\[(34|3-4)\\]"] }] } },
          { id: "c2", title: "reports/challenge-file-types.txt: the file type of everything in configs and logs, one command", check: file("reports/challenge-file-types.txt", "backup\\.conf:[\\s\\S]*incident-bridge\\.log:|incident-bridge\\.log:[\\s\\S]*backup\\.conf:") },
          { id: "c3", title: "Create projects/storage-migration with plans, logs, configs and rollback in one command", check: { type: "all", checks: ["plans", "logs", "configs", "rollback"].map((d) => dir("projects/storage-migration/" + d)) } },
          { id: "c4", title: "Copy the whole storage-migration tree to archive/storage-migration-prechange", check: { type: "all", checks: ["plans", "logs", "configs", "rollback"].map((d) => dir("archive/storage-migration-prechange/" + d)) } },
          { id: "c5", title: "Write a two-line handoff (status, next action) and end up with it named reports/storage-migration-handoff.txt, with no copy left under another name", check: { type: "all", checks: [file("reports/storage-migration-handoff.txt", "\\n.+"), gone("reports/challenge-handoff.txt")] } },
          { id: "c6", title: "Create tmp/cleanup-test containing only a hidden file named .lock, show rmdir fail, then remove it with rm -ri", check: { type: "all", checks: [{ type: "history", includes: ["^rmdir tmp/cleanup-test/?$", "^rm -(ri|ir|r -i|i -r) tmp/cleanup-test/?$"] }, nodir("tmp/cleanup-test")] } },
        ],
        quiz: [],
        completion: "Storage migration prepared.",
      },
    ],

    review: {
      traps: [
        "Globs aren't regular expressions: `*` is any number of characters, `?` exactly one, `[abc]` or `[a-z]` one from a set.",
        "The shell expands wildcards before the command runs. rm receives every matching name, so preview with ls first.",
        "In an interactive Bash, `[!x]` triggers history expansion; `[^x]` does the same job safely.",
        "The `file` command identifies a file by its content, not its extension.",
        "On an existing file, `touch` updates the timestamps and leaves the content alone.",
        "A single `>` overwrites; `>>` appends.",
        "`cp` skips a directory without `-r` and says it's omitting it.",
        "`mv` moves directories without `-r`; only cp needs it.",
        "Renaming is done with `mv old-name new-name`.",
        "`rmdir` only removes empty directories, and hidden files count. Check with `ls -A`.",
        "`mkdir` fails if the parent is missing, unless you use `-p`.",
        "cp and mv overwrite the destination silently unless you add `-i`.",
        "There's no recycle bin at the command line. Practice `rm -r` as `rm -ri`.",
        "`ls -d` shows the directory entry itself, `ls` its contents, `ls -R` everything below it.",
      ],
      trapQuiz: [
        { id: "t1", prompt: "Which lists <code>a1.txt</code> and <code>a2.txt</code> but not <code>a10.txt</code>?", answer: "q", options: [{ value: "q", label: "<code>ls a?.txt</code>" }, { value: "s", label: "<code>ls a*.txt</code>" }, { value: "r", label: "<code>ls a[0-9]*.txt</code>" }], explain: "Correct. ? is exactly one character." },
        { id: "t2", prompt: "<code>cp projects archive/</code> prints <em>-r not specified; omitting directory</em>. Fix?", answer: "r", options: [{ value: "r", label: "<code>cp -r projects archive/</code>" }, { value: "mv", label: "<code>mv -r projects archive/</code>" }, { value: "f", label: "<code>cp -f projects archive/</code>" }], explain: "Correct." },
        { id: "t3", prompt: "Which removes an empty directory and fails safely if it isn't empty?", answer: "rmdir", options: ["rmdir", "rm -r", "rm -f", "mv"], explain: "Correct." },
        { id: "t4", prompt: "Which shows hidden files but not <code>.</code> and <code>..</code>?", answer: "A", options: [{ value: "A", label: "<code>ls -A</code>" }, { value: "a", label: "<code>ls -a</code>" }, { value: "R", label: "<code>ls -R</code>" }], explain: "Correct. -a also shows . and .." },
        { id: "t5", prompt: "You run <code>touch report.txt</code> on an existing report. What changes?", answer: "mtime", options: [{ value: "mtime", label: "Its timestamps" }, { value: "content", label: "Its content is cleared" }, { value: "owner", label: "Its owner" }], explain: "Correct." },
      ],
      challenge: {
        intro: "Complete these on your Linux Mint VM without notes, in `~/lpic1-section7`. Rerun the Lab Setup first if files are missing.",
        tasks: [
          "List only ticket files 1043 and 1044, with any extension, using one bracket pattern. Save the list to `reports/challenge-tickets.txt`.",
          "Identify the file type of everything in configs and logs with one command. Save the output to `reports/challenge-file-types.txt`.",
          "Without opening an editor, create `reports/challenge-handoff.txt` with a status line and a next-action line.",
          "Create `projects/storage-migration` with plans, logs, configs and rollback subdirectories in one command. Prove the layout with `ls -F`.",
          "Copy the whole `projects/storage-migration` tree to `archive/storage-migration-prechange`. Prove the copy with `ls -R`.",
          "Rename `reports/challenge-handoff.txt` to `reports/storage-migration-handoff.txt`. Prove the old name is gone.",
          "Create `tmp/cleanup-test` containing only a hidden file named `.lock`. Show why rmdir fails, then remove the directory safely with `rm -ri`.",
        ],
        outro: "Your final handoff is the reports directory. For each file in it, write one short sentence explaining what it proves.",
      },
      questions: [
        { q: "Manager request: “Send me a list of only the ticket text files from incoming. Leave out the Markdown notes and the log files.”", a: "<code>ls incoming/ticket-*.txt &gt; reports/ticket-text-files.txt</code>." },
        { q: "Security analyst request: “Before I upload this export to the case record, prove what kind of file it really is.”", a: "<code>file incoming/asset-export.csv</code>. It reads the content (CSV ASCII text), not the extension." },
        { q: "Incident bridge request: “Copy the bridge log into reports for the handoff. The original has to stay where it is.”", a: "<code>cp logs/incident-bridge.log reports/</code>, then <code>ls</code> both paths to prove they exist." },
        { q: "Project lead request: “Create the folder layout for next week’s change window: plans, logs, configs, and rollback, in one command.”", a: "<code>mkdir -p projects/change-window/{plans,logs,configs,rollback}</code>, proven with <code>ls -F</code>." },
        { q: "Teammate request: “rmdir says the staging folder is not empty, but ls shows nothing. What is going on, and how do we clean it up safely?”", a: "It holds a hidden dotfile. <code>ls -A</code> shows it; then <code>rm -ri folder</code> (or remove the dotfile and <code>rmdir</code>)." },
        { q: "Operations handoff request: “Move the finished project into archive and give its report a clearer name. Do not leave copies behind.”", a: "<code>mv projects/x archive/x-complete</code> (no -r) and <code>mv reports/old.txt reports/clear-name.txt</code>. mv leaves nothing behind." },
        { q: "Maintenance window request: “Copy the reviewed config into workbench, but do not overwrite anything there without asking first.”", a: "<code>cp -i configs/backup.conf workbench/</code>. Without -i, cp would overwrite silently." },
      ],
      mastery: [
        "I can use `*`, `?`, `[abc]` and `[a-z]` to select exactly the files a request asks for.",
        "I can preview a wildcard pattern with ls before using it with rm, cp or mv.",
        "I can identify a file's real type with file instead of trusting its extension.",
        "I can read timestamps with stat and explain what touch changes.",
        "I can create a short file with echo and redirection, and I know when to use `>` versus `>>`.",
        "I can remove files safely with `rm -i` and explain what `rm -v` and `rm -r` do.",
        "I can create nested directories with `mkdir -p` and brace expansion.",
        "I can remove empty directories with rmdir and find hidden files with `ls -A`.",
        "I can copy files and directory trees with cp and `cp -r`, and use `cp -i` to avoid overwriting.",
        "I can move and rename files and directories with mv, and explain why mv doesn't need `-r`.",
        "I can use `ls -d`, `ls -F` and `ls -R` to show exactly the information a request needs.",
        "I can turn each file management task into evidence for a ticket, handoff or change record.",
      ],
    },
  });
})();
