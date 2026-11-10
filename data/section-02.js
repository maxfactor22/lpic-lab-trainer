/* Section 2: Command line basics (103.1). From "LPIC - Section 2.docx", Labs 1-8 and the final ticket. */
(function () {
  const WS = "~/lpic1031-labs";
  const base = { user: "max", host: "linux-mint" };
  const ticket = (body, tools, extra = {}) => ({ requestedBy: "Senior engineer", system: "Linux Mint VM", badge: "Junior engineer", tools, body, ...extra });
  const safe = { kind: "info", title: "Safe practice", text: "No <code>sudo</code> is needed. The terminal is a simulation, so you can experiment without changing a real system." };
  const cmd = (...accept) => ({ type: "command", accept });

  LPIC.section({
    id: "section-02",
    number: 2,
    title: "Command Line Basics",
    objectives: ["103.1"],
    kind: "terminal",
    source: "LPIC - Section 2.docx",
    scenario: "You are a junior Linux engineer on a Linux Mint VM. Your senior engineer wants you to check system facts, read command structure, tell built-in commands from programs on disk, use the help systems, and handle command history safely.",
    overview: {
      paragraphs: [
        "Every lesson gives you a short ticket, a list of commands to run in the practice terminal, a quick quiz, and a no-hint challenge. Run the same commands on your Mint VM too: the output there is the real thing.",
        "On your VM, the workbook's workspace is <code>~/lpic1031-labs</code>. Create it with <code>mkdir -p ~/lpic1031-labs/{system-info,command-structure,help-practice,history-practice}</code>. The practice terminal already has it.",
      ],
      commands: ["uname", "uname -s", "uname -r", "uname -v", "uname -a", "bash --version", "pwd", "ls", "ls -d", "type", "which", "man", "info", "help", "history", "!!", "!N", "history -w", "history -c", "~/.bash_history"],
      memoryHook: "Three help systems for three jobs: <code>man</code> for programs on disk, <code>info</code> for longer linked documents, <code>help</code> for Bash built-ins. Ask <code>type</code> first and it tells you which one to use.",
    },

    lessons: [
      /* ---------------------------------------------------------- 2.1 */
      {
        id: "2.1", title: "Identify basic system information", navSubtitle: "uname fundamentals", objective: "103.1", difficulty: "Easy",
        source: "Lab 1: Identify Basic System Information",
        summary: "Use <code>uname</code> to identify the kernel name, release, build information, and full system summary.",
        ticket: ticket("A senior engineer needs a quick system summary from a Linux Mint virtual machine. Collect the information with the right <code>uname</code> options and explain what each result means.", ["uname"], { callout: safe }),
        workspace: { ...base, cwd: WS + "/system-info", files: { [WS + "/system-info/uname-notes.txt"]: "" } },
        tasks: [
          { id: "uname", title: "Kernel name", command: "uname", detail: "Start with the command by itself. Compare this result with the next task.", check: cmd("uname") },
          { id: "uname-s", title: "Kernel name, explicit", command: "uname -s", detail: "The <code>-s</code> option asks for the kernel name. Does it match plain <code>uname</code>?", check: cmd("uname -s") },
          { id: "uname-r", title: "Kernel release", command: "uname -r", detail: "The release is the kernel version identifier you will often use during troubleshooting.", check: cmd("uname -r") },
          { id: "uname-v", title: "Kernel build", command: "uname -v", detail: "This is build information. It is not the same thing as the kernel release.", check: cmd("uname -v") },
          { id: "uname-a", title: "Full summary", command: "uname -a", detail: "Look for at least three pieces of information, such as kernel name, host name, release, build, machine architecture, and operating system.", check: cmd("uname -a", "uname --all") },
        ],
        quiz: [
          { id: "release", prompt: "Which option shows the kernel release?", answer: "-r", explain: "Correct. uname -r prints the kernel release.",
            options: [{ value: "-s", label: "<code>-s</code>", note: "Kernel name" }, { value: "-r", label: "<code>-r</code>", note: "Kernel release" }, { value: "-v", label: "<code>-v</code>", note: "Kernel build" }] },
          { id: "build", prompt: "Which option shows kernel build information?", answer: "-v", explain: "Correct. uname -v prints build information, not the release.",
            options: [{ value: "-r", label: "<code>-r</code>", note: "Kernel release" }, { value: "-v", label: "<code>-v</code>", note: "Kernel build" }, { value: "-a", label: "<code>-a</code>", note: "Full summary" }] },
        ],
        challenge: {
          prompt: "Your senior engineer asks for all available system information from <code>uname</code>. Enter the complete command.",
          check: { accept: ["uname -a", "uname --all"] },
          correct: "Correct. uname -a requests all available system information.",
          incorrect: "That does not request the full summary. Review the guided commands, then try again.",
        },
        memoryHook: "<code>r</code> means release. <code>v</code> means version, but for <code>uname</code> it reports the kernel build version.",
        completion: "You can identify basic Linux system information.",
      },

      /* ---------------------------------------------------------- 2.2 */
      {
        id: "2.2", title: "Check the Bash shell version", navSubtitle: "Long options", objective: "103.1", difficulty: "Easy",
        source: "Lab 2: Check the Bash Shell Version",
        summary: "Use <code>bash --version</code> to see which shell gives you your prompt, and learn why some options start with two dashes.",
        ticket: ticket("A vendor's install script says it needs Bash 5 or newer. Confirm the Bash version on the VM and record the first line of the output.", ["bash"], { callout: safe }),
        workspace: { ...base, cwd: WS + "/system-info", files: { [WS + "/system-info/uname-notes.txt"]: "" } },
        tasks: [
          { id: "bash-version", title: "Show the Bash version", command: "bash --version", detail: "The first line has the version number. The rest is the license notice.", check: cmd("bash --version") },
          { id: "record", title: "Record the first line", command: "bash --version | head -1 >> bash-version.txt", detail: "Pipe the output into <code>head -1</code> to keep only the first line, and append it to a notes file with <code>&gt;&gt;</code>. Then <code>cat bash-version.txt</code> to check.",
            check: { type: "file", path: WS + "/system-info/bash-version.txt", re: "GNU bash, version 5" } },
          { id: "echo-var", title: "Compare with a shell variable", command: "echo $BASH_VERSION", detail: "Bash also keeps its version in the <code>BASH_VERSION</code> variable. It's the same version as the first line of <code>bash --version</code>, without the license text.",
            check: { type: "pattern", re: "^echo \\$\\{?BASH_VERSION\\}?$" } },
        ],
        quiz: [
          { id: "dashes", prompt: "Why does <code>--version</code> use two dashes?", answer: "long", explain: "Correct. Two dashes start a long option, which is a whole word. One dash starts short, single-letter options.",
            options: [{ value: "long", label: "It's a long option, a whole word rather than one letter" }, { value: "root", label: "It needs root privileges" }, { value: "combine", label: "Two dashes combine two options" }] },
          { id: "short", prompt: "If you typed <code>bash -version</code> with one dash, what would Bash normally treat it as?", answer: "letters", explain: "Correct. A single dash introduces short options, so <code>-version</code> reads as -v -e -r and so on. Bash happens to accept it anyway, but most commands don't.",
            options: [{ value: "letters", label: "A bundle of single-letter options: -v -e -r -s -i -o -n" }, { value: "same", label: "Always exactly the same as --version" }, { value: "file", label: "A file named version" }] },
        ],
        challenge: {
          prompt: "The vendor asks again: which command prints the version of the shell you are using? Enter it.",
          check: { accept: ["bash --version"] },
          correct: "Correct. bash --version prints the Bash version and license.",
          incorrect: "Not quite. Use the shell's name with its long version option.",
        },
        memoryHook: "One dash, one letter: <code>-a</code>. Two dashes, one word: <code>--all</code>, <code>--version</code>, <code>--help</code>.",
        completion: "You can check the Bash version and explain long options.",
      },

      /* ---------------------------------------------------------- 2.3 */
      {
        id: "2.3", title: "Break down command structure", navSubtitle: "Command, option, argument", objective: "103.1", difficulty: "Easy to Medium",
        source: "Lab 3: Break Down Command Structure",
        summary: "See how a command, an option and an argument work together, using <code>pwd</code> and <code>ls</code>.",
        ticket: ticket("A new teammate asks why <code>ls demo-dir</code> and <code>ls -d demo-dir</code> print different things. Run both and be ready to name the command, option and argument in each.", ["pwd", "ls"], { callout: safe }),
        workspace: { ...base, cwd: WS + "/command-structure", files: {
          [WS + "/command-structure/demo-dir/subdir/"]: null,
          [WS + "/command-structure/demo-dir/file1.txt"]: "",
          [WS + "/command-structure/demo-dir/file2.log"]: "",
        } },
        tasks: [
          { id: "pwd", title: "Confirm where you are", command: "pwd", detail: "<code>pwd</code> prints the working directory. It needs no options or arguments.", check: cmd("pwd") },
          { id: "ls", title: "Command on its own", command: "ls", detail: "With no options or arguments, <code>ls</code> lists the current directory.", check: { type: "pattern", re: "^ls( --color=auto)?$" } },
          { id: "ls-dir", title: "Add an argument", command: "ls demo-dir", detail: "<code>demo-dir</code> is the argument: what the command works on. <code>ls</code> shows what's inside it.", check: { type: "pattern", re: "^ls demo-dir/?$" } },
          { id: "ls-d-dir", title: "Add an option", command: "ls -d demo-dir", detail: "<code>-d</code> is the option: it changes how <code>ls</code> behaves. Now it lists the directory itself, not its contents.", check: { type: "pattern", re: "^ls -d demo-dir/?$" } },
          { id: "ls-d-etc", title: "Option and argument together", command: "ls -d /etc", detail: "Name the parts: <code>ls</code> is the command, <code>-d</code> the option, <code>/etc</code> the argument.", check: { type: "pattern", re: "^ls -d /etc/?$" } },
        ],
        quiz: [
          { id: "argument", prompt: "In <code>ls -d /etc</code>, what is <code>/etc</code>?", answer: "arg", explain: "Correct. /etc is the argument, the thing the command acts on.",
            options: [{ value: "cmd", label: "The command" }, { value: "opt", label: "The option" }, { value: "arg", label: "The argument" }] },
          { id: "d-effect", prompt: "What does <code>-d</code> change about <code>ls</code>?", answer: "itself", explain: "Correct. ls -d lists the directory entry itself instead of what's inside it.",
            options: [{ value: "itself", label: "It lists the directory itself, not its contents" }, { value: "deep", label: "It lists every subdirectory too" }, { value: "delete", label: "It deletes the directory" }] },
        ],
        challenge: {
          prompt: "Show the directory entry for <code>/etc</code> itself, not the files inside it. Enter the command.",
          check: { accept: ["ls -d /etc", "ls -d /etc/", "ls --directory /etc"], re: "^ls -(d|ld|dl) /etc/?$" },
          correct: "Correct. ls -d stops ls from opening the directory.",
          incorrect: "That would list what's inside /etc, or isn't an ls command. Add the option that lists the directory itself.",
        },
        memoryHook: "Command = the verb. Option = how (starts with a dash). Argument = what.",
        completion: "You can name the command, option and argument in a command line.",
      },

      /* ---------------------------------------------------------- 2.4 */
      {
        id: "2.4", title: "Identify built-in and external commands", navSubtitle: "type and which", objective: "103.1", difficulty: "Medium",
        source: "Lab 4: Identify Built-in and External Commands",
        summary: "Use <code>type</code> and <code>which</code> to find out whether a command is part of Bash or a program on disk.",
        ticket: ticket("A script fails on a minimal server with \"command not found\". Your senior engineer wants to know which of the script's commands are built into Bash and which are separate programs that have to be installed.", ["type", "which"], { callout: safe }),
        workspace: { ...base, cwd: WS + "/command-structure" },
        tasks: [
          { id: "type-pwd", title: "Is pwd built in?", command: "type pwd", detail: "Bash has its own <code>pwd</code>, so this says <em>shell builtin</em>.", check: cmd("type pwd") },
          { id: "type-cd", title: "Why cd has to be built in", command: "type cd", detail: "A separate program can only change its own directory, not your shell's. So <code>cd</code> must be part of the shell.", check: cmd("type cd") },
          { id: "type-uname", title: "An external command", command: "type uname", detail: "Run <code>uname</code> first, then <code>type uname</code>. If it says <em>hashed</em>, Bash already found the program once and remembered its path.", check: cmd("type uname") },
          { id: "which-uname", title: "Find the path", command: "which uname", detail: "<code>which</code> searches the directories in <code>PATH</code> and prints the program's full path.", check: cmd("which uname") },
          { id: "which-which", title: "Turn the tools on themselves", command: "type which", detail: "Run <code>type which</code> and then <code>which which</code>. Both show that <code>which</code> is a program in <code>/usr/bin</code>.", check: { type: "history", includes: ["^type which$", "^which which$"] } },
        ],
        quiz: [
          { id: "hashed", prompt: "<code>type uname</code> says <code>uname is hashed (/usr/bin/uname)</code>. What does hashed mean?", answer: "cache", explain: "Correct. Bash remembers where it found the program so it doesn't search PATH again.",
            options: [{ value: "cache", label: "Bash found it before and cached its location" }, { value: "secure", label: "The file is protected by a checksum" }, { value: "builtin", label: "It's built into Bash" }] },
          { id: "which-cd", prompt: "Why does <code>which cd</code> print nothing?", answer: "builtin", explain: "Correct. which only searches PATH for files. cd is part of the shell, so there's no file to find.",
            options: [{ value: "builtin", label: "cd is a shell builtin, and which only looks for files in PATH" }, { value: "missing", label: "cd isn't installed" }, { value: "root", label: "which needs sudo" }] },
        ],
        challenge: {
          mode: "classify",
          prompt: "Test <code>echo</code>, <code>history</code>, <code>cat</code>, <code>ls</code> and <code>help</code> with <code>type</code> in the terminal, then sort them. (On Mint, <code>ls</code> is an alias for <code>ls --color=auto</code>, and the alias runs the program in <code>/usr/bin</code>.)",
          categories: ["Built-in", "External"],
          items: [
            { label: "echo", answer: "Built-in" }, { label: "history", answer: "Built-in" }, { label: "cat", answer: "External" },
            { label: "ls", answer: "External" }, { label: "help", answer: "Built-in" },
          ],
          correct: "Correct. echo, history and help are part of Bash; cat and ls are programs on disk.",
          incorrect: "Some are in the wrong column. Run type on each one and look for \"shell builtin\".",
        },
        memoryHook: "<code>type</code> knows everything Bash knows: aliases, keywords, builtins and files. <code>which</code> only knows files in <code>PATH</code>.",
        completion: "You can tell built-in commands from external programs.",
      },

      /* ---------------------------------------------------------- 2.5 */
      {
        id: "2.5", title: "Use manual pages", navSubtitle: "man and the pager", objective: "103.1", difficulty: "Medium",
        source: "Lab 5: Use Manual Pages",
        summary: "Open a manual page with <code>man</code>, find the standard sections, move around, search, and quit.",
        ticket: ticket("You're about to use a <code>uname</code> option you haven't used before. Policy is to check the manual instead of guessing.", ["man"], { callout: { kind: "info", title: "Pager keys", text: "In the manual viewer use the arrow keys, <code>Space</code> and <code>b</code> to move, <code>/</code> to search, <code>n</code> for the next match, and <code>q</code> to quit. On iPhone, use the buttons under the page." } }),
        workspace: { ...base, cwd: WS + "/help-practice" },
        tasks: [
          { id: "man-uname", title: "Open the uname manual", command: "man uname", detail: "The page opens in a pager over the terminal.", check: { type: "event", event: "pager-open", match: { kind: "man", page: "^uname$" } } },
          { id: "synopsis", title: "Find the SYNOPSIS", short: "Search with <code>/SYNOPSIS</code>", detail: "Press <code>/</code>, type <code>SYNOPSIS</code> and press Enter. The synopsis shows the command's format: <code>uname [OPTION]...</code>.", check: { type: "event", event: "pager-search", match: { page: "^uname$", term: "synopsis" } } },
          { id: "move", title: "Move a line and a screen", short: "Use ↓ and Space", detail: "Down arrow (or <code>j</code>) moves one line. <code>Space</code> moves one screen. <code>b</code> goes back a screen.", check: { type: "event", event: "pager-move", match: { page: "^uname$" } } },
          { id: "quit", title: "Quit the manual", short: "Press <code>q</code>", detail: "<code>q</code> closes the pager and returns you to the prompt.", check: { type: "event", event: "pager-quit", match: { page: "^uname$" } } },
          { id: "man-man", title: "Read the manual's own manual", command: "man man", detail: "Find the list of numbered sections and the keys while reading. Pick one key you didn't know.", check: { type: "event", event: "pager-open", match: { page: "^man$" } } },
        ],
        quiz: [
          { id: "synopsis-q", prompt: "Which part of a man page shows the basic command format?", answer: "SYNOPSIS", explain: "Correct. SYNOPSIS shows how to type the command and its options.",
            options: ["NAME", "SYNOPSIS", "DESCRIPTION", "SEE ALSO"] },
          { id: "quit-q", prompt: "Which key exits a manual page?", answer: "q", explain: "Correct. q quits the pager.",
            options: [{ value: "Esc", label: "<code>Esc</code>" }, { value: "q", label: "<code>q</code>" }, { value: "x", label: "<code>x</code>" }, { value: "Ctrl+X", label: "<code>Ctrl+X</code>" }] },
          { id: "sections", prompt: "Manual section 5 covers what?", answer: "formats", explain: "Correct. Section 5 is file formats, such as man 5 passwd for /etc/passwd.",
            options: [{ value: "cmds", label: "User commands" }, { value: "formats", label: "File formats and configuration files" }, { value: "admin", label: "System administration commands" }] },
        ],
        challenge: {
          prompt: "Open the <code>uname</code> manual in the terminal and find the long form of the option that prints the kernel release. Enter that long option.",
          answerPrefix: "uname", placeholder: "--option-name",
          check: { accept: ["--kernel-release"] },
          correct: "Correct. --kernel-release is the long form of -r.",
          incorrect: "Not that one. Search the manual with /release and read the line above the description.",
        },
        memoryHook: "<code>man</code> reads like <code>less</code>: Space forward, b back, / search, n next, q quit.",
        completion: "You can open, read, search and quit a manual page.",
      },

      /* ---------------------------------------------------------- 2.6 */
      {
        id: "2.6", title: "Compare man, info and help", navSubtitle: "Three help systems", objective: "103.1", difficulty: "Medium",
        source: "Lab 6: Compare man, info, and help",
        summary: "Learn which help system to use for which command: <code>man</code>, <code>info</code> or Bash's <code>help</code>.",
        ticket: ticket("A teammate tried <code>help uname</code> and got an error, then <code>man cd</code> and got nothing useful. Show them which help system fits which kind of command.", ["man", "info", "help", "type"], { callout: safe }),
        workspace: { ...base, cwd: WS + "/help-practice" },
        tasks: [
          { id: "info-uname", title: "Read the info page", command: "info uname", detail: "Info documents are split into linked nodes. Look at the header line: it names this node and the next one. Press <code>q</code> to leave.", check: { type: "event", event: "pager-open", match: { kind: "info", page: "^uname$" } } },
          { id: "help-pwd", title: "Built-in help", command: "help pwd", detail: "<code>help</code> prints straight to the terminal, with no pager.", check: cmd("help pwd") },
          { id: "type-pwd", title: "Why help pwd works", command: "type pwd", detail: "<code>pwd</code> is a shell builtin, and <code>help</code> covers builtins.", check: cmd("type pwd") },
          { id: "help-cd", title: "Help on cd and on help", command: "help cd", detail: "Run <code>help cd</code>, then <code>help help</code>.", check: { type: "history", includes: ["^help cd$", "^help help$"] } },
          { id: "help-uname", title: "See help fail", command: "help uname", detail: "<code>uname</code> is a program, not a builtin, so Bash's help has no topic for it. The error even suggests <code>man</code> and <code>info</code>.", check: cmd("help uname") },
        ],
        quiz: [
          { id: "which-help", prompt: "Which help system is meant for Bash built-in commands?", answer: "help", explain: "Correct. help documents Bash builtins such as cd, pwd and history.",
            options: [{ value: "man", label: "<code>man</code>" }, { value: "info", label: "<code>info</code>" }, { value: "help", label: "<code>help</code>" }, { value: "whatis", label: "<code>whatis</code>" }] },
          { id: "info-nodes", prompt: "What makes <code>info</code> documents different from man pages?", answer: "nodes", explain: "Correct. Info pages are organised as nodes with links and menus, and are often longer.",
            options: [{ value: "nodes", label: "They're split into linked nodes, like pages of a small website" }, { value: "short", label: "They're always shorter" }, { value: "builtins", label: "They only cover Bash builtins" }] },
        ],
        challenge: {
          prompt: "Get help for <code>cd</code> using the right help system. Enter the command.",
          check: { accept: ["help cd"] },
          correct: "Correct. cd is a builtin, so help cd is the right tool.",
          incorrect: "cd is part of the shell. Which help system covers shell builtins?",
        },
        memoryHook: "Ask <code>type</code> first. Builtin → <code>help</code>. File on disk → <code>man</code>, or <code>info</code> for the long version.",
        completion: "You can pick the right help system for any command.",
      },

      /* ---------------------------------------------------------- 2.7 */
      {
        id: "2.7", title: "Practice command history recall", navSubtitle: "history, !!, !N, ↑", objective: "103.1", difficulty: "Medium to Hard",
        source: "Lab 7: Practice Command History Recall",
        summary: "Rerun and edit earlier commands with <code>history</code>, <code>!N</code>, <code>!!</code> and the up arrow.",
        ticket: ticket("You're checking several folders during an incident and keep retyping the same commands. Use history to work faster, without running anything by accident.", ["history"], {
          callout: { kind: "warn", title: "Safety note", text: "<code>!!</code> and <code>!N</code> run the recalled command immediately. Check the number in <code>history</code> before you press Enter." } }),
        workspace: { ...base, cwd: WS + "/history-practice", files: {
          [WS + "/history-practice/alpha/a.txt"]: "", [WS + "/history-practice/beta/b.txt"]: "", [WS + "/history-practice/gamma/g.txt"]: "",
        } },
        tasks: [
          { id: "build", title: "Build up some history", short: "Run <code>pwd</code>, <code>ls</code>, <code>ls alpha</code>, <code>ls beta</code>, <code>uname -r</code>", detail: "Run each of these five commands, one at a time.",
            check: { type: "history", includes: ["^pwd$", "^ls$", "^ls alpha/?$", "^ls beta/?$", "^uname -r$"] } },
          { id: "history", title: "List the history", command: "history", detail: "Find the number next to <code>pwd</code>.", check: cmd("history") },
          { id: "bang-n", title: "Rerun pwd by number", short: "Run <code>!N</code> with pwd's number", detail: "Type <code>!</code> and the number, for example <code>!1</code>. Bash prints the recalled command, then runs it.", check: { type: "event", event: "history-expand", match: { from: "^!\\d+$", to: "^pwd$" } } },
          { id: "bang-bang", title: "Repeat the last command", command: "!!", detail: "<code>!!</code> reruns whatever ran last.", check: { type: "event", event: "history-expand", match: { from: "^!!$" } } },
          { id: "arrow", title: "Recall and edit", short: "Press ↑ to find <code>ls beta</code>, change it to <code>ls gamma</code>", detail: "Press the up arrow (or the ↑ button under the terminal) until <code>ls beta</code> appears, edit it to <code>ls gamma</code>, and press Enter.", check: { type: "pattern", re: "^ls gamma/?$" } },
        ],
        quiz: [
          { id: "bangbang", prompt: "What does <code>!!</code> do?", answer: "last", explain: "Correct. !! reruns the previous command, straight away.",
            options: [{ value: "last", label: "Runs the previous command again" }, { value: "list", label: "Lists the history" }, { value: "not", label: "Negates the last command's exit status" }] },
          { id: "risk", prompt: "What's the main risk with <code>!N</code>?", answer: "runs", explain: "Correct. There's no confirmation, so a wrong number can rerun a destructive command.",
            options: [{ value: "runs", label: "It runs the command immediately, with no chance to check it" }, { value: "deletes", label: "It deletes that history entry" }, { value: "root", label: "It runs the command as root" }] },
        ],
        challenge: {
          prompt: "<code>history</code> shows <code>&nbsp;&nbsp;&nbsp;12&nbsp;&nbsp;pwd</code>. Enter the shortest command that reruns it.",
          check: { accept: ["!12"] },
          correct: "Correct. !12 recalls and runs history entry 12.",
          incorrect: "Use an exclamation mark followed by the history number.",
        },
        memoryHook: "<code>!!</code> = last command. <code>!12</code> = entry 12. <code>!-2</code> = two commands ago. <code>!ls</code> = the last command starting with ls.",
        completion: "You can recall and rerun commands from history safely.",
      },

      /* ---------------------------------------------------------- 2.8 */
      {
        id: "2.8", title: "Inspect and update Bash history", navSubtitle: "~/.bash_history", objective: "103.1", difficulty: "Hard",
        source: "Lab 8: Inspect and Update Bash History",
        summary: "See the difference between the history list in memory and the <code>~/.bash_history</code> file on disk.",
        ticket: ticket("An auditor asks whether clearing your shell history also clears the saved history file. Prove the answer with commands, not guesses.", ["history", "cat"], { callout: safe }),
        workspace: { ...base, cwd: WS + "/history-practice", files: { "~/.bash_history": "cd ~/lpic1031-labs\nls\nuname -a\n" } },
        tasks: [
          { id: "list", title: "Look at both histories", short: "Run <code>history</code>, then <code>cat ~/.bash_history</code>", detail: "The list in memory and the file on disk aren't the same thing.", check: { type: "history", includes: ["^history$", "^cat (~|/home/max)/\\.bash_history$"] } },
          { id: "harmless", title: "Add a few commands", short: "Run <code>pwd</code>, <code>date</code>, <code>uname -s</code>", detail: "Three harmless commands so you can spot them later.", check: { type: "history", includes: ["^pwd$", "^date$", "^uname -s$"] } },
          { id: "write", title: "Write the list to the file", command: "history -w", detail: "<code>-w</code> writes the in-memory list to <code>~/.bash_history</code>. Then <code>cat ~/.bash_history</code> again and compare.", check: { type: "file", path: "~/.bash_history", re: "^uname -s$" } },
          { id: "clear", title: "Clear only the list in memory", command: "history -c", detail: "<code>-c</code> empties the in-memory list. Run <code>history</code> to see it's almost empty.", check: cmd("history -c") },
          { id: "file-kept", title: "Prove the file survived", command: "cat ~/.bash_history", detail: "The file still has your commands, because <code>history -c</code> doesn't touch it.",
            check: { type: "all", checks: [{ type: "pattern", re: "^cat (~|/home/max)/\\.bash_history$" }, { type: "output", re: "^uname -s$" }] } },
          { id: "help", title: "Find an option worth memorizing", command: "history --help", detail: "Read the options list. <code>-a</code> (append), <code>-r</code> (read) and <code>-d</code> (delete one entry) are all fair game on the exam.", check: cmd("history --help", "help history") },
        ],
        quiz: [
          { id: "c-file", prompt: "Does <code>history -c</code> clear <code>~/.bash_history</code>?", answer: "no", explain: "Correct. history -c clears only the list in memory. The file changes when history is written, such as with history -w or when the shell exits.",
            options: [{ value: "no", label: "No, it clears only the list in memory" }, { value: "yes", label: "Yes, it clears both" }, { value: "file", label: "It clears only the file" }] },
          { id: "w", prompt: "Which option writes the current history list to the history file?", answer: "-w", explain: "Correct. -w writes; -a appends this session's new lines; -r reads the file into memory.",
            options: [{ value: "-a", label: "<code>-a</code>" }, { value: "-w", label: "<code>-w</code>" }, { value: "-r", label: "<code>-r</code>" }, { value: "-c", label: "<code>-c</code>" }] },
        ],
        challenge: {
          prompt: "Save the current history list to the file, then clear only the in-memory list, on one line. Enter the command line.",
          check: { accept: ["history -w; history -c", "history -w && history -c", "history -w ; history -c"], re: "^history -w ?(;|&&) ?history -c$" },
          correct: "Correct. -w saves to ~/.bash_history first, then -c clears the list in memory.",
          incorrect: "Order matters: write first, then clear. Join the two commands with ; or &&.",
        },
        memoryHook: "<code>-w</code> write, <code>-a</code> append, <code>-r</code> read, <code>-c</code> clear (memory only), <code>-d N</code> delete entry N.",
        completion: "You understand the history list and the history file.",
      },

      /* ---------------------------------------------------------- 2.T */
      {
        id: "2.T", navNumber: "T", title: "Junior engineer diagnostics ticket", navSubtitle: "Section ticket, no hints", objective: "103.1", difficulty: "Hard",
        source: "Final Challenge: Junior Engineer Ticket", noHints: true, tasksHeading: "Ticket requirements",
        summary: "A multi-step ticket with no hints. Use everything from this section and write your findings to a report file.",
        ticket: ticket("Collect basic command-line diagnostics from the VM and explain how you found them. Don't guess: use the built-in help where it fits. Save your findings in <code>~/lpic1031-labs/junior-engineer-report.txt</code>.", ["uname", "bash", "type", "man", "info", "help", "history"], {
          heading: "Ticket: command-line diagnostics",
          callout: { kind: "info", title: "Writing the report", text: "Full-screen editors don't run here. Add lines with <code>echo 'text' &gt;&gt; file</code>, and check with <code>cat</code>." } }),
        workspace: { ...base, cwd: WS, files: { [WS + "/system-info/"]: null, [WS + "/command-structure/"]: null, [WS + "/help-practice/"]: null, [WS + "/history-practice/"]: null } },
        tasks: [
          { id: "report", title: "Create the report file", short: "In <code>~/lpic1031-labs</code>", check: { type: "file", path: WS + "/junior-engineer-report.txt" } },
          { id: "uname", title: "Kernel name, release, build and full summary", check: { type: "history", includes: ["^uname( -s)?$", "^uname -r$", "^uname -v$", "^uname (-a|--all)$"] } },
          { id: "bash", title: "Bash version", check: { type: "history", includes: ["bash --version"] } },
          { id: "classify", title: "Built-in or external: cd, pwd, uname, history, cat", check: { type: "history", includes: ["^type .*\\bcd\\b", "^type .*\\bpwd\\b", "^type .*\\buname\\b", "^type .*\\bhistory\\b", "^type .*\\bcat\\b"] } },
          { id: "help", title: "Compare the help systems: man uname, info uname, help pwd", check: { type: "history", includes: ["^man uname$", "^info uname$", "^help pwd$"] } },
          { id: "history", title: "Use history to find three commands you ran", check: { type: "history", includes: ["^history( \\d+)?$"] } },
          { id: "summary", title: "Write a summary: at least the release and the Bash version", check: { type: "file", path: WS + "/junior-engineer-report.txt", re: "6\\.8\\.0-44-generic[\\s\\S]*5\\.2|5\\.2[\\s\\S]*6\\.8\\.0-44-generic" } },
        ],
        quiz: [],
        memoryHook: "",
        completion: "Ticket closed: you collected the diagnostics and wrote the report.",
      },
    ],

    review: {
      traps: [
        "`uname` on its own prints only the kernel name, the same as `uname -s`.",
        "`uname -r` is the release; `uname -v` is build information, not the version number you usually want.",
        "`uname -a` prints everything, in a fixed order.",
        "Long options use two dashes (`--version`); short options use one and can be bundled (`-la`).",
        "`type` reports aliases, keywords, builtins and files. `which` only finds files in `PATH`.",
        "`cd` must be a builtin, because a separate program can't change the shell's directory.",
        "`help` is for Bash builtins. `help uname` fails because `uname` is a program.",
        "`info` pages are organised into linked nodes; `man` pages into sections such as NAME, SYNOPSIS and DESCRIPTION.",
        "`!!` and `!N` run the recalled command immediately.",
        "`history -c` clears only the list in memory, not `~/.bash_history`. `history -w` writes the list to the file.",
      ],
      trapQuiz: [
        { id: "t1", prompt: "Which command shows only the kernel release?", answer: "uname -r", options: ["uname", "uname -r", "uname -v", "uname -a"], explain: "Correct. -r is the release." },
        { id: "t2", prompt: "Which command tells you that <code>ls</code> is an alias on Mint?", answer: "type ls", options: ["which ls", "type ls", "man ls", "help ls"], explain: "Correct. which only searches PATH; type knows about aliases." },
        { id: "t3", prompt: "You need help on the <code>history</code> builtin. Which works?", answer: "help history", options: ["man history", "help history", "which history", "info history -k"], explain: "Correct. history is a Bash builtin." },
        { id: "t4", prompt: "After <code>history -c</code>, what's in <code>~/.bash_history</code>?", answer: "same", options: [{ value: "same", label: "Whatever was written there before" }, { value: "empty", label: "Nothing" }, { value: "deleted", label: "The file is deleted" }], explain: "Correct. -c only clears the in-memory list." },
        { id: "t5", prompt: "Which manual section holds file formats such as <code>/etc/passwd</code>?", answer: "5", options: ["1", "5", "7", "8"], explain: "Correct. man 5 passwd." },
      ],
      challenge: {
        intro: "Do these on your Linux Mint VM, without notes. Save what you find in `~/lpic1031-labs/junior-engineer-report.txt`.",
        tasks: [
          "Record the kernel name, release, build information and full summary with `uname`.",
          "Record the Bash version.",
          "Classify `cd`, `pwd`, `uname`, `history` and `cat` as built-in or external, with the command that proves each.",
          "Show the help for `cd` with the right help system, and explain why `man cd` isn't the answer.",
          "Use `history` to list your last ten commands, then rerun one by number.",
          "Write the history list to `~/.bash_history`, clear the list in memory, and prove the file kept your commands.",
        ],
        outro: "When you're done, read your report back with `cat` and check it would make sense to someone who wasn't there.",
      },
      questions: [
        { q: "Senior engineer request: “Which kernel is this VM running? I only need the release.”", a: "<code>uname -r</code>. It prints only the kernel release, for example <code>6.8.0-44-generic</code>." },
        { q: "Teammate request: “My script says <code>which cd</code> found nothing. Is cd missing?”", a: "No. <code>cd</code> is a shell builtin, and <code>which</code> only searches <code>PATH</code> for files. <code>type cd</code> confirms it: <em>cd is a shell builtin</em>." },
        { q: "Help desk request: “How do I find which uname option shows the hardware platform, without searching the web?”", a: "<code>man uname</code>, then search with <code>/platform</code>. The manual lists <code>-i, --hardware-platform</code>." },
        { q: "Auditor request: “If I run <code>history -c</code>, is my saved history gone?”", a: "No. <code>history -c</code> clears the list in memory. <code>~/.bash_history</code> keeps what was last written to it. Prove it with <code>cat ~/.bash_history</code>." },
        { q: "New hire request: “What's the difference between <code>-a</code> and <code>--all</code>?”", a: "Nothing for <code>uname</code>: one is the short option, the other the long option. Short options use one dash and one letter; long options use two dashes and a word." },
      ],
      mastery: [
        "I can show the kernel name, release, build information and full summary with `uname`.",
        "I can check the Bash version and explain short and long options.",
        "I can name the command, options and arguments in any command line.",
        "I can tell builtins from external programs with `type` and `which`, and explain hashed.",
        "I can open, read, search and quit a man page, and name the main man sections.",
        "I can choose between `man`, `info` and `help` for a given command.",
        "I can rerun commands with `!!`, `!N` and the up arrow, and know the risk.",
        "I can explain and use `history -w`, `-a`, `-r`, `-c` and `~/.bash_history`.",
      ],
    },
  });
})();
