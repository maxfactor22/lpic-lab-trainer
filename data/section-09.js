/* Section 9: Editing files with nano and vi (103.8). From "LPIC_Section9_Lab_Workbook.docx"
   (written from the course transcript on 2026-11-09). 13 labs grouped into 7 lessons. */
(function () {
  const WS = "~/lpic1-section9";
  const APP = Array.from({ length: 30 }, (_, i) => `setting_${i + 1}=${i + 1 === 23 ? "onn" : "on"}\n`).join("");
  const MAINT = "Maintenance checklist\nNotify the service desk\nStop the web service on web01\nStop the web service on web02\nBack up the config files\nApply the patch\nRestart the services\nConfirm monitoring is green\n";
  const FILES = {
    [WS + "/configs/backup.conf"]: "backup_enabled=true\nretention_dyas=30\nbackup_target=/srv/backup\nowner=ops\n",
    [WS + "/configs/app.conf"]: APP,
    [WS + "/configs/maintenance.txt"]: MAINT,
    [WS + "/snippets/web03-entry.txt"]: "server=web03\nrole=web\nstatus=active\n",
    [WS + "/incoming/windows-notes.txt"]: "Shift notes from the Windows desktop team\r\nPrinter queue cleared\r\nVPN client updated\r\n",
    [WS + "/reports/"]: null,
  };
  const base = { user: "max", host: "linux-mint", cwd: WS, files: FILES };
  const ticket = (requestedBy, body, tools, extra = {}) => ({ requestedBy, system: "Linux Mint VM", badge: "IT engineer", tools, body, ...extra });
  const pat = (re) => ({ type: "pattern", re });
  const file = (name, re, not) => ({ type: "file", path: WS + "/" + name, re, not });
  const out = (re) => ({ type: "output", re });
  const hist = (...includes) => ({ type: "history", includes });
  const quit = (fileRe, match = {}) => ({ type: "event", event: "editor-quit", match: { path: fileRe, ...match } });
  const keysNote = { kind: "info", title: "Using vi here", text: "Type on your keyboard as in a real terminal. On iPhone, tap the editor to bring up the keyboard and use the key row for <strong>Esc</strong>, <strong>Ctrl</strong>, <code>:</code>, <code>/</code> and the arrows. For Ctrl+D, tap Ctrl, then d." };

  LPIC.section({
    id: "section-09",
    number: 9,
    title: "Editing Files with nano and vi",
    objectives: ["103.8"],
    kind: "terminal",
    source: "LPIC_Section9_Lab_Workbook.docx",
    scenario: "You're an IT engineer fixing configs and writing handoff notes from the command line. Choose the right editor, move between vi's modes without getting stuck, fix exactly the line an error names, and leave a file untouched when you mean to.",
    overview: {
      paragraphs: [
        "Every lab here edits practice copies, never real files under <code>/etc</code>. Prove each result from the command line with <code>cat</code>, <code>grep</code>, <code>file</code> or a hash.",
        "On your VM, check first whether <code>vi</code> is the full vim: <code>readlink -f $(which vi)</code>. If it ends in <code>vim.tiny</code>, install full vim with <code>sudo apt install vim</code>. Then run the workbook's Lab Setup to create <code>~/lpic1-section9</code>; the practice terminal already has it.",
      ],
      commands: ["nano", "Ctrl+O", "Ctrl+X", "vi", "vim", "which vi", "readlink -f", "i a o O A I", "Esc", "h j k l", "0 ^ $", "w b e", "gg G :N", "Ctrl+D Ctrl+U", "/pattern ?pattern n N", "x dw d2w D dd d3d", "yw yy p P", "u Ctrl+R", ":w :w newfile", ":wq :x ZZ", ":q :q!", ":r file", ":set number", ":set ff=unix", ":%s/old/new/g", "EDITOR"],
      memoryHook: "vi has three modes. <strong>Command mode</strong> is home: keys move and change text. <strong>Insert mode</strong> is for typing; <code>i</code>, <code>a</code> and <code>o</code> get you there and <code>Esc</code> brings you back. <strong>Ex mode</strong> starts with a colon: write, quit, read, number lines, change line endings. Lost? Press Esc, then <code>:wq</code> to save or <code>:q!</code> to abandon.",
    },

    lessons: [
      /* ---------------------------------------------------------- 9.1 */
      {
        id: "9.1", title: "Know which editor you'll get", navSubtitle: "which, readlink -f, EDITOR (Labs 1, 13)", objective: "103.8", difficulty: "Beginner",
        source: "Labs 1 and 13: Confirm which vi will run; set the default editor",
        summary: "Prove which program <code>vi</code> really is, and set the editor that other tools open.",
        ticket: ticket("Teammate", "Some builds ship only a stripped-down vi. Before a maintenance window, prove which vi this workstation runs. Then make tools like <code>crontab -e</code> open vi for your session.", ["which", "type", "readlink", "export"]),
        workspace: base,
        tasks: [
          { id: "which", title: "Where vi runs from", short: "Save <code>which vi</code> and <code>type vi</code> to <code>reports/editor-check.txt</code>", detail: "<code>which vi &gt; reports/editor-check.txt</code>, then <code>type vi &gt;&gt; reports/editor-check.txt</code>.", check: file("reports/editor-check.txt", "/usr/bin/vi[\\s\\S]*vi is ") },
          { id: "real", title: "What vi really is", command: "readlink -f $(which vi) >> reports/editor-check.txt", detail: "<code>/usr/bin/vi</code> is a symbolic link through <code>/etc/alternatives</code>. <code>readlink -f</code> follows the whole chain. On Mint it should end in <code>vim.basic</code>, not <code>vim.tiny</code>.", check: file("reports/editor-check.txt", "vim\\.basic") },
          { id: "editor", title: "Set the default editor", short: "<code>echo $EDITOR</code>, <code>export EDITOR=vi</code>, then save it", detail: "<code>echo $EDITOR &gt; reports/editor-variable.txt</code> after the export. It lasts for this shell only; add it to <code>~/.bashrc</code> to keep it.", check: { type: "all", checks: [hist("^export EDITOR=vi"), file("reports/editor-variable.txt", "^vi$")] } },
        ],
        quiz: [
          { id: "readlink", prompt: "Why use <code>readlink -f $(which vi)</code> instead of just <code>which vi</code>?", answer: "chain", explain: "Correct. which shows the first path; readlink -f follows the links to the real program.",
            options: [{ value: "chain", label: "which shows a link; readlink -f follows it to the real program" }, { value: "faster", label: "It's faster" }, { value: "root", label: "which needs root" }] },
          { id: "editorq", prompt: "Which variable decides the editor that <code>crontab -e</code> opens?", answer: "EDITOR", explain: "Correct. (VISUAL is checked first by some tools.)", options: ["EDITOR", "SHELL", "PAGER", "TERM"] },
        ],
        challenge: {
          prompt: "Make vi the default editor for programs started from this shell.",
          check: { accept: ["export EDITOR=vi", "export EDITOR=vim", "export EDITOR=/usr/bin/vi"] },
          correct: "Correct.",
          incorrect: "Export the EDITOR variable.",
        },
        memoryHook: "<code>which</code> = where. <code>readlink -f</code> = what it really is. <code>EDITOR</code> = what other tools open.",
        completion: "You know which editor will open.",
      },

      /* ---------------------------------------------------------- 9.2 */
      {
        id: "9.2", title: "Write a quick note with nano", navSubtitle: "nano, Ctrl+O, Ctrl+X (Lab 2)", objective: "103.8", difficulty: "Beginner",
        source: "Lab 2: Write a quick shift handoff with nano",
        summary: "Create and save a short file in nano, the simplest terminal editor.",
        ticket: ticket("Incident bridge", "You're leaving the bridge and need a two-line handoff note for the next engineer, fast.", ["nano"], { callout: { kind: "info", title: "nano's shortcuts", text: "<code>^</code> means the Ctrl key. Ctrl+O writes out (saves), then Enter keeps the file name; Ctrl+X exits. On iPhone, use the buttons at the bottom of the editor." } }),
        workspace: base,
        tasks: [
          { id: "open", title: "Open a new file in nano", command: "nano reports/nano-handoff.txt", detail: "nano shows the file name at the top and its shortcuts at the bottom.", check: { type: "event", event: "editor-open", match: { kind: "nano", path: "nano-handoff\\.txt$" } } },
          { id: "write", title: "Type two lines and save", short: "A status line and a next-action line, then Ctrl+O and Enter", detail: "nano reports how many lines it wrote.", check: file("reports/nano-handoff.txt", ".+\\n.+") },
          { id: "exit", title: "Exit", short: "Ctrl+X", detail: "Then <code>cat reports/nano-handoff.txt</code>.", check: quit("nano-handoff\\.txt$", { kind: "nano" }) },
        ],
        quiz: [
          { id: "ctrlo", prompt: "In nano, what does Ctrl+O do?", answer: "write", explain: "Correct. O for write Out.",
            options: [{ value: "write", label: "Writes (saves) the file" }, { value: "open", label: "Opens another file" }, { value: "quit", label: "Quits" }] },
          { id: "emacs", prompt: "Which keys save in emacs?", answer: "xs", explain: "Correct. Ctrl+X Ctrl+C exits.",
            options: [{ value: "xs", label: "Ctrl+X then Ctrl+S" }, { value: "o", label: "Ctrl+O" }, { value: "w", label: ":w" }] },
        ],
        challenge: {
          prompt: "Which key combination exits nano?",
          answerPrefix: "", placeholder: "Ctrl+…",
          check: { accept: ["Ctrl+X", "ctrl+x", "^X", "ctrl-x", "Ctrl-X", "Ctrl x", "ctrl x"] },
          correct: "Correct.",
          incorrect: "It's Ctrl plus the letter for eXit.",
        },
        memoryHook: "nano: <strong>^O</strong> write Out, <strong>^X</strong> eXit, <strong>^K</strong> cut line, <strong>^U</strong> paste, <strong>^W</strong> Where is (search).",
        completion: "You can make quick edits in nano.",
      },

      /* ---------------------------------------------------------- 9.3 */
      {
        id: "9.3", title: "vi's three modes, and leaving safely", navSubtitle: "i, Esc, :w :q :q! (Labs 3–4)", objective: "103.8", difficulty: "Beginner",
        source: "Labs 3 and 4: Move between the three vi modes; abandon a bad edit",
        summary: "Create a file in vi, save it with an ex command, and quit without saving when an edit goes wrong.",
        ticket: ticket("Senior engineer", "Prove you can create a file in vi without getting stuck in it, then show you can back out of a bad edit to the backup config without changing it.", ["vi", "sha256sum"], { callout: keysNote }),
        workspace: base,
        tasks: [
          { id: "create", title: "Create a file in vi", short: "<code>vi reports/vi-modes.txt</code>, <code>i</code>, type a line, Esc, <code>:w</code>, <code>:q</code>", detail: "Watch the bottom line: <code>-- INSERT --</code> means insert mode. Type <code>Command mode, insert mode, ex mode</code>.", check: { type: "all", checks: [file("reports/vi-modes.txt", "^Command mode, insert mode, ex mode\\n?$"), quit("vi-modes\\.txt$", { saved: "yes" })] } },
          { id: "hash1", title: "Hash before the edit", command: "sha256sum configs/backup.conf > reports/backup-hash.txt", detail: "This proves what the file looked like.", check: file("reports/backup-hash.txt", "backup\\.conf") },
          { id: "abandon", title: "Make a bad edit and abandon it", short: "<code>vi configs/backup.conf</code>, <code>dd</code> twice, then <code>:q!</code>", detail: "Plain <code>:q</code> refuses because there are unsaved changes (E37). <code>:q!</code> throws them away.", check: { type: "all", checks: [quit("backup\\.conf$", { saved: "no", forced: "yes" }), file("configs/backup.conf", "^backup_enabled=true\\nretention_dyas=30")] } },
          { id: "hash2", title: "Prove nothing changed", command: "sha256sum configs/backup.conf >> reports/backup-hash.txt", detail: "Then <code>cat reports/backup-hash.txt</code>: both hashes match.", check: file("reports/backup-hash.txt", "^(\\w{64})  configs/backup\\.conf\\n\\1  configs/backup\\.conf") },
        ],
        quiz: [
          { id: "qbang", prompt: "What's the difference between <code>:q!</code> and <code>:wq!</code>?", answer: "opp", explain: "Correct. :q! discards; :wq! forces the save.",
            options: [{ value: "opp", label: ":q! quits without saving; :wq! forces a save and quits" }, { value: "same", label: "They're the same" }, { value: "root", label: ":wq! needs root" }] },
          { id: "typed", prompt: "You type <code>:wq</code> but it appears inside your file. Why?", answer: "insert", explain: "Correct. Press Esc first.",
            options: [{ value: "insert", label: "You were still in insert mode" }, { value: "tiny", label: "vi is vim-tiny" }, { value: "ro", label: "The file is read-only" }] },
        ],
        challenge: {
          prompt: "You've made changes in vi that you want to throw away. What do you type (from command mode) to quit?",
          answerPrefix: "", placeholder: ":…",
          check: { accept: [":q!", ":quit!"] },
          correct: "Correct.",
          incorrect: "Quit, forcing it, without writing.",
        },
        memoryHook: "<code>:w</code> write, <code>:q</code> quit, <code>!</code> = \"I mean it\". <code>:wq</code>, <code>:x</code> and <code>ZZ</code> all save and quit.",
        completion: "You can get in and out of vi safely.",
      },

      /* ---------------------------------------------------------- 9.4 */
      {
        id: "9.4", title: "Move and search in command mode", navSubtitle: "hjkl ^ $ Ctrl+D/U, / ? n (Labs 5–6)", objective: "103.8", difficulty: "Intermediate",
        source: "Labs 5 and 6: Navigate without arrow keys; search forward and backward",
        summary: "Move around a 30-line config using command-mode keys only, and find settings with forward and backward searches.",
        ticket: ticket("Teammate", "You're on a console that drops arrow keys. Check whether setting_17 is enabled in the application config without leaving command mode.", ["vi"], { callout: keysNote }),
        workspace: base,
        tasks: [
          { id: "move", title: "Move with h, j, k and l", short: "<code>vi configs/app.conf</code>, then use <code>h j k l</code>, <code>$</code> and <code>^</code>", detail: "<code>j</code> down, <code>k</code> up, <code>h</code> left, <code>l</code> right. <code>$</code> to the end of the line, <code>^</code> to its first character. Quit with <code>:q</code>.", check: quit("app\\.conf$", { keys: "(?=.*(^| )j( |$))(?=.*(^| )k( |$))(?=.*(^| )l( |$))(?=.*\\$)(?=.*\\^)" }) },
          { id: "page", title: "Half a screen at a time", short: "Ctrl+D and Ctrl+U", detail: "Open app.conf again: <code>Ctrl+D</code> moves down half a screen, <code>Ctrl+U</code> back up. <code>G</code> jumps to the last line, <code>gg</code> to the first.", check: quit("app\\.conf$", { keys: "(?=.*Ctrl\\+d)(?=.*Ctrl\\+u)" }) },
          { id: "search", title: "Search both ways", short: "<code>/setting_17</code>, <code>?setting_5</code>, then <code>n</code>", detail: "<code>/</code> searches forward, <code>?</code> backward, <code>n</code> repeats in the same direction, <code>N</code> the other way.", check: quit("app\\.conf$", { ex: "(?=[\\s\\S]*/setting_17)(?=[\\s\\S]*\\?setting_5)", keys: "(^| )n( |$)" }) },
          { id: "answer", title: "Record the answer", command: "grep setting_17 configs/app.conf > reports/setting-17.txt", detail: "Then <code>cat reports/setting-17.txt</code>.", check: file("reports/setting-17.txt", "^setting_17=on$") },
        ],
        quiz: [
          { id: "hjkl", prompt: "In command mode, which key moves the cursor down?", answer: "j", explain: "Correct. h left, j down, k up, l right.", options: ["h", "j", "k", "l"] },
          { id: "back", prompt: "Which starts a <em>backward</em> search?", answer: "?", explain: "Correct. Same as less and man.", options: [{ value: "/", label: "<code>/</code>" }, { value: "?", label: "<code>?</code>" }, { value: "n", label: "<code>n</code>" }, { value: "N", label: "<code>N</code>" }] },
        ],
        challenge: {
          prompt: "In vi, which key repeats the last search in the same direction?",
          answerPrefix: "", placeholder: "key",
          check: { accept: ["n"] },
          correct: "Correct. N repeats it in the opposite direction.",
          incorrect: "It's a single lowercase letter.",
        },
        memoryHook: "Search for <code>setting_1</code> also matches setting_10 to setting_19. Make the pattern as specific as the request.",
        completion: "You can move and search without the arrow keys.",
      },

      /* ---------------------------------------------------------- 9.5 */
      {
        id: "9.5", title: "Fix lines precisely", navSubtitle: ":set number, :N, x, i a o (Labs 7–8)", objective: "103.8", difficulty: "Intermediate",
        source: "Labs 7 and 8: Fix the line named in an error; insert, append and open lines",
        summary: "Jump to the line an error message names, delete single characters, and add text before, after or below the cursor.",
        ticket: ticket("Application owner", "The app won't start: <em>invalid value on line 23 of app.conf</em>. Also fix the misspelled <code>retention_dyas</code> in backup.conf, and add a snapshot step to the maintenance checklist.", ["vi"], { callout: keysNote }),
        workspace: base,
        tasks: [
          { id: "line23", title: "Fix line 23", short: "<code>:set number</code>, <code>:23</code>, <code>$</code>, <code>x</code>, <code>:wq</code>", detail: "Line numbers are only on screen; they're not saved into the file.", check: { type: "all", checks: [file("configs/app.conf", "^setting_23=on$"), file("configs/app.conf", "", "onn"), quit("app\\.conf$", { ex: "set (number|nu)" })] } },
          { id: "typo", title: "Fix the misspelling", short: "In backup.conf: go to <code>dyas</code>, delete two characters with <code>x</code>, insert the right ones", detail: "Put the cursor on the <code>y</code> of dyas, <code>xx</code> leaves <code>ds</code>, then <code>i</code>, type <code>ay</code>, Esc, <code>:wq</code>.", check: file("configs/backup.conf", "^retention_days=30$") },
          { id: "open", title: "Open a new line below", short: "In maintenance.txt: on <code>Apply the patch</code>, press <code>o</code>, type the step, Esc, <code>:x</code>", detail: "Type <code>Take a snapshot of the VM</code>. <code>o</code> opens a line below, <code>O</code> above, <code>a</code> types after the cursor, <code>i</code> before it, <code>A</code> at the end of the line.", check: file("configs/maintenance.txt", "^Apply the patch\\nTake a snapshot of the VM\\nRestart the services$") },
        ],
        quiz: [
          { id: "nu", prompt: "Does <code>:set number</code> add line numbers to the saved file?", answer: "no", explain: "Correct. It only changes the display.",
            options: [{ value: "no", label: "No, it only shows them on screen" }, { value: "yes", label: "Yes" }] },
          { id: "ai", prompt: "What's the difference between <code>a</code> and <code>i</code>?", answer: "ai", explain: "Correct.",
            options: [{ value: "ai", label: "a types after the cursor, i before it" }, { value: "line", label: "a adds a line, i inserts a line" }, { value: "same", label: "No difference" }] },
        ],
        challenge: {
          prompt: "In vi command mode, type the ex command that jumps to line 23.",
          answerPrefix: "", placeholder: ":…",
          check: { accept: [":23"] },
          correct: "Correct. 23G does the same.",
          incorrect: "A colon followed by the line number.",
        },
        memoryHook: "<code>i</code> in, <code>a</code> after, <code>o</code> open below, <code>O</code> open above, <code>A</code> end of line, <code>I</code> start of line.",
        completion: "You can fix exactly the line you're told to.",
      },

      /* ---------------------------------------------------------- 9.6 */
      {
        id: "9.6", title: "Delete, yank and put", navSubtitle: "dd dw D d3d yy p P u (Labs 9–10)", objective: "103.8", difficulty: "Advanced",
        source: "Labs 9 and 10: Delete and move text; yank and paste to duplicate entries",
        summary: "Move a line by deleting and putting it, duplicate lines with yank, and undo anything that goes wrong.",
        ticket: ticket("Change manager", "The backup step must happen before any service is stopped, and the checklist needs Stop lines for two new servers, web03 and web04.", ["vi"], { callout: keysNote }),
        workspace: base,
        tasks: [
          { id: "move", title: "Move the backup step up", short: "On <code>Back up the config files</code>: <code>dd</code>. On <code>Notify the service desk</code>: <code>p</code>. Then <code>:wq</code>", detail: "dd deletes the line into the buffer; p puts it below the cursor line.", check: file("configs/maintenance.txt", "^Notify the service desk\\nBack up the config files\\nStop the web service on web01") },
          { id: "dup", title: "Duplicate a line twice", short: "On the web02 line: <code>yy</code>, then <code>p</code> twice; edit the copies to web03 and web04", detail: "<code>yy</code> yanks (copies) the line. Change the digits with <code>x</code> and <code>i</code> (or <code>r</code>), then <code>:wq</code>. <code>grep -c '^Stop' configs/maintenance.txt</code> should say 4.", check: file("configs/maintenance.txt", "on web01\\nStop the web service on web02\\nStop the web service on web03\\nStop the web service on web04") },
          { id: "practice", title: "Practise the deletes, with undo", short: "<code>cp configs/maintenance.txt reports/scratch.txt</code>, then try <code>dw</code>, <code>d2w</code>, <code>D</code>, <code>d3d</code> in vi, pressing <code>u</code> after each", detail: "Quit with <code>:q!</code> when you're done. Nothing needs saving.", check: quit("scratch\\.txt$", { keys: "(?=.*(^| )d( |$))(?=.*(^| )D( |$))(?=.*(^| )u( |$))" }) },
        ],
        quiz: [
          { id: "dD", prompt: "What's the difference between <code>D</code> and <code>dd</code>?", answer: "D", explain: "Correct.",
            options: [{ value: "D", label: "D deletes to the end of the line; dd deletes the whole line" }, { value: "same", label: "No difference" }, { value: "dir", label: "D deletes backwards" }] },
          { id: "pP", prompt: "After <code>yy</code>, which key puts the copy <em>above</em> the current line?", answer: "P", explain: "Correct. p puts below, P above.", options: ["p", "P", "y", "u"] },
        ],
        challenge: {
          prompt: "In vi, delete three lines starting at the cursor line with a single command.",
          answerPrefix: "", placeholder: "keys",
          check: { accept: ["3dd", "d3d", "d2j"] },
          correct: "Correct.",
          incorrect: "Put a count of 3 with dd.",
        },
        memoryHook: "<code>d</code> cut, <code>y</code> copy (yank), <code>p</code>/<code>P</code> paste, <code>u</code> undo, Ctrl+R redo. Doubling the letter (<code>dd</code>, <code>yy</code>) means the whole line.",
        completion: "You can cut, copy and paste in vi.",
      },

      /* ---------------------------------------------------------- 9.7 */
      {
        id: "9.7", title: "Work with files from inside vi", navSubtitle: ":r, :w newname, :set ff=unix (Labs 11–12)", objective: "103.8", difficulty: "Advanced",
        source: "Labs 11 and 12: Read a snippet in and save a copy; convert Windows line endings",
        summary: "Read another file into the buffer, save a second copy under a new name, and convert Windows line endings.",
        ticket: ticket("Desktop team lead", "Start an inventory file from the web03 snippet and keep a copy. Then fix the shift notes the Windows team sent: a Linux script shows a stray ^M at the end of every line.", ["vi", "file"], { callout: keysNote }),
        workspace: base,
        tasks: [
          { id: "read", title: "Read a snippet into a new file", short: "<code>vi reports/inventory.txt</code>, <code>:r snippets/web03-entry.txt</code>, <code>:w</code>", detail: "<code>:r</code> inserts the file below the cursor.", check: file("reports/inventory.txt", "server=web03\\nrole=web\\nstatus=active") },
          { id: "copy", title: "Save a second copy", short: "<code>:w reports/inventory-copy.txt</code>, then <code>:q</code>", detail: "You're still editing inventory.txt; :w with a name writes a copy.", check: { type: "all", checks: [file("reports/inventory-copy.txt", "server=web03"), quit("inventory\\.txt$")] } },
          { id: "before", title: "Check the line endings", command: "file incoming/windows-notes.txt > reports/line-endings.txt", detail: "file reports CRLF line terminators. vi shows <code>[dos]</code> when it opens the file.", check: file("reports/line-endings.txt", "CRLF") },
          { id: "convert", title: "Convert to Unix endings", short: "<code>vi incoming/windows-notes.txt</code>, <code>:set ff=unix</code>, <code>:x</code>", detail: "Then <code>file incoming/windows-notes.txt &gt;&gt; reports/line-endings.txt</code>: the second line no longer mentions CRLF.", check: { type: "all", checks: [file("incoming/windows-notes.txt", "^Shift notes from the Windows desktop team\\nPrinter", "\\r"), file("reports/line-endings.txt", "CRLF[^\\n]*\\n[^\\n]*windows-notes\\.txt: ASCII text$")] } },
        ],
        quiz: [
          { id: "rq", prompt: "What does <code>:r notes.txt</code> do?", answer: "read", explain: "Correct. It reads the file's contents in below the cursor.",
            options: [{ value: "read", label: "Inserts notes.txt below the cursor" }, { value: "rename", label: "Renames the file to notes.txt" }, { value: "replace", label: "Replaces the buffer with notes.txt" }] },
          { id: "ffq", prompt: "Which converts a file to Windows line endings for a Windows user?", answer: "dos", explain: "Correct. :set ff=unix goes the other way.",
            options: [{ value: "dos", label: "<code>:set ff=dos</code>" }, { value: "unix", label: "<code>:set ff=unix</code>" }, { value: "win", label: "<code>:set ff=windows</code>" }] },
        ],
        challenge: {
          prompt: "In vi, type the command that sets the file format to Unix line endings.",
          answerPrefix: "", placeholder: ":…",
          check: { accept: [":set ff=unix", ":set fileformat=unix", ":se ff=unix"] },
          correct: "Correct. Then save with :wq or :x.",
          incorrect: "Use :set with the ff (fileformat) option.",
        },
        memoryHook: "<code>:r</code> read in, <code>:w name</code> write a copy, <code>:set ff=unix</code> drop the ^M. Check with <code>file</code>.",
        completion: "You can read, copy and convert files from inside vi.",
      },

      /* ---------------------------------------------------------- 9.C */
      {
        id: "9.C", navNumber: "C", title: "Challenge exam: config repair", navSubtitle: "No notes", objective: "103.8", difficulty: "Hard",
        source: "Scenario-Based Challenge Exam", noHints: true, tasksHeading: "Tasks",
        summary: "The workbook's challenge tasks, checked by the files and editor sessions you leave behind.",
        ticket: ticket("Change manager", "Repair the configs and checklist for tonight's change, prove you left the backup config untouched, and fix the Windows notes. Use vi for every edit.", ["vi", "sha256sum", "file", "readlink"], { heading: "Ticket: config repair", callout: keysNote }),
        workspace: base,
        tasks: [
          { id: "c1", title: "Save proof of which program vi really runs to reports/challenge-editor.txt", check: file("reports/challenge-editor.txt", "vim\\.basic") },
          { id: "c2", title: "Fix the bad value on line 23 of configs/app.conf, using line numbers", check: { type: "all", checks: [file("configs/app.conf", "^setting_23=on$"), quit("app\\.conf$", { ex: "set (number|nu)" })] } },
          { id: "c3", title: "Correct the misspelled setting in configs/backup.conf without retyping the whole line", check: file("configs/backup.conf", "^retention_days=30$") },
          { id: "c4", title: "Move the backup step to right after the service desk notification", check: file("configs/maintenance.txt", "^Notify the service desk\\nBack up the config files") },
          { id: "c5", title: "Add Stop lines for web03 and web04 by yanking and putting", check: file("configs/maintenance.txt", "on web02\\nStop the web service on web03\\nStop the web service on web04") },
          { id: "c6", title: "Convert incoming/windows-notes.txt to Unix line endings, and prove it with file", check: { type: "all", checks: [file("incoming/windows-notes.txt", "^Shift", "\\r"), hist("^file incoming/windows-notes\\.txt")] } },
        ],
        quiz: [],
        completion: "Configs repaired.",
      },
    ],

    review: {
      traps: [
        "Forgetting which mode you're in. Commands typed in insert mode become text in the file. Press Esc first.",
        "Mixing up `:q!` and `:wq!`. `:q!` quits and throws changes away; `:wq!` forces the write, then quits.",
        "Thinking `:x` and `ZZ` discard changes. Both save and exit, like `:wq`.",
        "Forgetting the colon. `:w`, `:q`, `:r` and `:set` start with a colon; `ZZ` doesn't.",
        "Confusing `p` and `P`. `p` puts after the cursor or below the line; `P` before or above.",
        "Mixing up `a` and `i`. `a` appends after the cursor; `i` inserts before it. `o` opens a line below.",
        "Expecting `dw` to delete the whole word from the middle of it. It deletes from the cursor forward.",
        "Confusing `D` with `dd`. `D` deletes to the end of the line; `dd` deletes the whole line.",
        "Forgetting that yank means copy. `yy` copies a line; `dd` cuts it.",
        "Mixing up search directions. `/` searches forward and `?` backward, as in less and man.",
        "Thinking `:set number` saves line numbers into the file. It only changes the display.",
        "Expecting every exam command to work on vim-tiny. Check with `readlink -f $(which vi)`.",
        "nano saves with Ctrl+O and exits with Ctrl+X; emacs saves with Ctrl+X Ctrl+S and exits with Ctrl+X Ctrl+C.",
        "EDITOR controls which editor other tools open, and `export` only lasts for the current shell.",
      ],
      trapQuiz: [
        { id: "t1", prompt: "Which saves and quits vi?", answer: "x", options: [{ value: "x", label: "<code>:x</code>" }, { value: "q!", label: "<code>:q!</code>" }, { value: "q", label: "<code>:q</code>" }, { value: "e!", label: "<code>:e!</code>" }], explain: "Correct. So do :wq and ZZ." },
        { id: "t2", prompt: "You're in insert mode. How do you get back to command mode?", answer: "Esc", options: ["Esc", "Ctrl+C", ":", "q"], explain: "Correct." },
        { id: "t3", prompt: "Which deletes from the cursor to the end of the line?", answer: "D", options: ["D", "dd", "x", "dw"], explain: "Correct. d$ does the same." },
        { id: "t4", prompt: "Which replaces every <em>old</em> with <em>new</em> in the whole file?", answer: "pct", options: [{ value: "pct", label: "<code>:%s/old/new/g</code>" }, { value: "s", label: "<code>:s/old/new/</code>" }, { value: "slash", label: "<code>/old/new</code>" }], explain: "Correct. % means every line, g every match on a line." },
        { id: "t5", prompt: "In nano, the bottom line shows <code>^X Exit</code>. What's ^?", answer: "ctrl", options: [{ value: "ctrl", label: "The Ctrl key" }, { value: "shift", label: "Shift" }, { value: "caret", label: "The ^ character" }], explain: "Correct." },
      ],
      challenge: {
        intro: "On your Linux Mint VM, without notes. Rerun Step 3 of the Lab Setup first so you start from fresh sample files.",
        tasks: [
          "Prove which program vi really runs on your system and save the evidence to `reports/challenge-editor.txt`.",
          "Fix the bad value on line 23 of `configs/app.conf` using line numbers in vi.",
          "Correct the misspelled setting in `configs/backup.conf` without retyping the whole line.",
          "Move the backup step in `configs/maintenance.txt` so it comes right after the service desk notification.",
          "Add Stop lines for web03 and web04 to the checklist by yanking and pasting.",
          "Make a throwaway edit to `configs/backup.conf` and leave vi without saving it. Prove with a hash that the file didn't change.",
          "Convert `incoming/windows-notes.txt` to Unix line endings and prove the change with file.",
          "Set EDITOR to vi for your session and show its value.",
        ],
        outro: "Your final handoff is the reports directory and the corrected files. For each one, write a short sentence explaining what it proves.",
      },
      questions: [
        { q: "Manager request: “The app log says line 23 of app.conf is invalid. Fix that line and nothing else.”", a: "<code>vi configs/app.conf</code>, <code>:set number</code>, <code>:23</code>, fix it (for example <code>$x</code>), <code>:wq</code>. Prove it with <code>grep -n setting_23 configs/app.conf</code>." },
        { q: "Security analyst request: “You opened the backup config by mistake and changed it. Leave the editor without saving and prove the file is untouched.”", a: "Esc, then <code>:q!</code>. Compare <code>sha256sum</code> before and after." },
        { q: "Incident bridge request: “Write a two-line handoff note quickly. Use whichever editor is fastest for you.”", a: "<code>nano handoff.txt</code>, type, Ctrl+O, Enter, Ctrl+X. Or <code>vi</code>, <code>i</code>, type, Esc, <code>:wq</code>." },
        { q: "Project lead request: “Add entries for two new web servers to the maintenance checklist without retyping the existing line.”", a: "On the web02 line: <code>yy</code>, <code>p</code>, <code>p</code>, then change the digits with <code>r3</code> / <code>r4</code> (or <code>x</code> and <code>i</code>), and <code>:wq</code>." },
        { q: "Teammate request: “My script chokes on a file from a Windows user and shows ^M at the end of each line. Can you fix the file?”", a: "<code>vi file</code>, <code>:set ff=unix</code>, <code>:wq</code>. Check with <code>file</code>: it no longer says CRLF." },
        { q: "Operations request: “crontab -e keeps opening nano. Make it open vi for your session.”", a: "<code>export EDITOR=vi</code>. Put it in <code>~/.bashrc</code> to make it permanent." },
        { q: "Maintenance window request: “Before you edit anything, confirm this build has the full vi editor and not the tiny version.”", a: "<code>readlink -f $(which vi)</code>. It should end in <code>vim.basic</code>; if it's <code>vim.tiny</code>, run <code>sudo apt install vim</code>." },
      ],
      mastery: [
        "I can name the three vi modes and move between them with `i`, `a`, `o`, Esc and the colon.",
        "I can save and exit vi with `:wq`, `:x` and `ZZ`, and abandon changes with `:q!`.",
        "I can explain the difference between `:q!`, `:wq!` and `:wq`.",
        "I can move around with h, j, k, l, ^, $, Ctrl+D and Ctrl+U.",
        "I can search forward with / and backward with ?, and repeat a search with n.",
        "I can jump to a line number with `:set number` and `:NUMBER`.",
        "I can delete text with dw, a count such as d2w, D, dd and d3d, and undo with u.",
        "I can copy with yw and yy and paste with p and P.",
        "I can read another file into the buffer with `:r` and save a copy with `:w newname`.",
        "I can check line endings with file and convert them with `:set ff=unix` or `:set ff=dos`.",
        "I can create and save a file in nano with Ctrl+O and Ctrl+X, and I know the basic emacs save and exit keys.",
        "I can check whether vi is the full vim or vim-tiny, and set the EDITOR variable.",
      ],
    },
  });
})();
