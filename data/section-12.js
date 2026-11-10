/* Section 12: Shell and environment variables (103.1). From "LPIC_Section12_Lab_Workbook.docx"
   (written from the course transcript on 2026-11-09). 14 labs grouped into 7 lessons. */
(function () {
  const WS = "~/lpic1-section12";
  const FILES = {
    [WS + "/bin/diskreport"]: "#!/bin/bash\necho \"Disk report for $(hostname)\"\ndf -h / | tail -1\n",
    [WS + "/bin/show-ticket.sh"]: "#!/bin/bash\necho \"child sees TICKET=[$TICKET] SHLVL=$SHLVL\"\n",
    [WS + "/configs/app02.env"]: "export APP_ENV=staging\nAPP_REGION=us-east\nexport APP_LOG=/var/log/app02\n",
    [WS + "/configs/team-bashrc"]: "export LAB_TEAM=netops\nPS1=\"[lab \\u@\\h \\W]\\$ \"\n",
    [WS + "/reports/"]: null,
  };
  const base = { user: "max", host: "linux-mint", cwd: WS, files: FILES, setup: ["chmod +x bin/diskreport bin/show-ticket.sh"] };
  const ticket = (requestedBy, body, tools, extra = {}) => ({ requestedBy, system: "Linux Mint VM", badge: "IT engineer", tools, body, ...extra });
  const file = (name, re, not) => ({ type: "file", path: WS + "/" + name, re, not });
  const hist = (...includes) => ({ type: "history", includes });
  const ev = (event, match = {}) => ({ type: "event", event, match });
  const childNote = { kind: "info", title: "Child shells here", text: "<code>bash</code> on its own starts an interactive child shell, with its own variables and a higher <code>SHLVL</code>. <code>exit</code> takes you back to the parent, whose variables are just as you left them." };

  LPIC.section({
    id: "section-12",
    number: 12,
    title: "Shell and Environment Variables",
    objectives: ["103.1"],
    kind: "terminal",
    source: "LPIC_Section12_Lab_Workbook.docx",
    scenario: "You're an IT engineer on support and session-setup tickets. For each setting, decide whether it's needed only now, in child programs too, or in every future session, and prove the result with echo, env, printenv or a child shell.",
    overview: {
      paragraphs: [
        "Almost everything here changes only your current shell and disappears with it. The one lab that edits <code>~/.bashrc</code> backs it up first and removes its own line at the end. The system startup files are only read.",
        "On your VM, run the workbook's Lab Setup to create <code>~/lpic1-section12</code> with its two programs and two settings files. The practice terminal already has them.",
      ],
      commands: ["echo $VAR", "printenv", "env", "set", "VAR=value", "export", "export -n", "export -p", "declare -p", "unset", "env VAR=value cmd", "env -u", "env -i", "bash", "bash -c", "exit", "$SHLVL", "$$", "source", ". (dot)", "exec", "type", "which", "PATH", "PS1", "PS2", "shopt login_shell", "bash -l", "bash --rcfile", "~/.bashrc", "~/.profile", "/etc/profile", "/etc/environment"],
      memoryHook: "A variable lives in one shell until you export it. NAME=value creates it, $NAME reads it, export hands a copy to every child started afterwards, unset removes it. A child never changes its parent, so you source a settings file instead of running it. Double quotes let $ expand; single quotes keep everything literal.",
    },

    lessons: [
      /* ---------------------------------------------------------- 12.1 */
      {
        id: "12.1", title: "Read your environment", navSubtitle: "printenv, env, UID, GROUPS, TZ (Labs 1–3)", objective: "103.1", difficulty: "Beginner",
        source: "Labs 1–3: Capture the environment; check the user, session and history variables; check host, locale and time zone",
        summary: "Read single variables and the whole environment, see Bash's own user and history variables, and run one command in another time zone.",
        ticket: ticket("Vendor support", "An installer fails only for you. Send the vendor your system details and environment, then check the session, history and locale settings a user is asking about.", ["uname", "echo", "printenv", "env", "id", "locale", "date"]),
        workspace: base,
        tasks: [
          { id: "snap", title: "System and key variables", short: "<code>uname -a</code>, then <code>echo \"USER=$USER LOGNAME=$LOGNAME HOME=$HOME PWD=$PWD SHELL=$SHELL\"</code>, all into <code>reports/env-snapshot.txt</code>", detail: "Then <code>printenv HOME</code>, <code>printenv NO_SUCH_VAR</code> and <code>echo \"exit code: $?\"</code>, and finally <code>printenv | wc -l</code>, all appended. printenv takes the bare name; echo needs the $.", check: file("reports/env-snapshot.txt", "^Linux linux-mint [\\s\\S]*^USER=max LOGNAME=max HOME=/home/max PWD=\\S+ SHELL=/bin/bash\\n/home/max\\nexit code: 1\\n\\d+$") },
          { id: "full", title: "The whole environment, sorted", command: "env | sort > reports/env-full.txt", detail: "Read a dump like this for passwords or tokens before you send it to anyone.", check: file("reports/env-full.txt", "^HOME=/home/max$[\\s\\S]*^PATH=[\\s\\S]*^USER=max$") },
          { id: "session", title: "User, groups and history settings", short: "<code>echo \"UID=$UID GROUPS=$GROUPS all groups: ${GROUPS[@]}\" &gt; reports/session-vars.txt; id &gt;&gt; reports/session-vars.txt</code>", detail: "Then append <code>BASH_VERSION</code>, and <code>HISTFILE</code>, <code>HISTSIZE</code> and <code>HISTFILESIZE</code> on one line, then <code>ls -l \"$HISTFILE\"</code> and <code>history | tail -3</code>. GROUPS is an array: <code>$GROUPS</code> is only the first entry.", check: file("reports/session-vars.txt", "^UID=1000 GROUPS=1000 all groups: 1000 4 24[\\s\\S]*uid=1000\\(max\\)[\\s\\S]*BASH_VERSION=5\\.2[\\s\\S]*HISTFILE=/home/max/\\.bash_history HISTSIZE=1000 HISTFILESIZE=2000") },
          { id: "locale", title: "Host, locale and time zones", short: "<code>echo \"HOSTNAME=$HOSTNAME\"</code>, <code>echo \"LANG=$LANG LC_ALL=[$LC_ALL] TZ=[$TZ] LD_LIBRARY_PATH=[$LD_LIBRARY_PATH]\"</code> and <code>locale</code> into <code>reports/locale.txt</code>", detail: "Then append <code>date</code>, <code>TZ=UTC date</code> and <code>TZ=Asia/Tokyo date</code>: three different hours, and the system's zone doesn't change.", check: file("reports/locale.txt", "HOSTNAME=linux-mint[\\s\\S]*LC_ALL=\\[\\] TZ=\\[\\] LD_LIBRARY_PATH=\\[\\][\\s\\S]*^LC_ALL=$[\\s\\S]* UTC 20\\d\\d$[\\s\\S]* JST 20\\d\\d$") },
        ],
        quiz: [
          { id: "printenv", prompt: "Which prints the value of HOME?", answer: "bare", explain: "Correct. printenv takes the bare name; echo needs the $.", options: [{ value: "bare", label: "<code>printenv HOME</code>" }, { value: "dollar", label: "<code>printenv $HOME</code>" }, { value: "echo", label: "<code>echo HOME</code>" }] },
          { id: "hist", prompt: "Which limits how many lines are kept in <code>~/.bash_history</code>?", answer: "file", explain: "Correct. HISTSIZE is the number kept in memory.", options: [{ value: "file", label: "HISTFILESIZE" }, { value: "size", label: "HISTSIZE" }, { value: "histfile", label: "HISTFILE" }] },
          { id: "lcall", prompt: "LANG=en_US.UTF-8 and LC_ALL=C are both set. Which wins?", answer: "all", explain: "Correct. LC_ALL overrides LANG and every LC_ setting.", options: [{ value: "all", label: "LC_ALL" }, { value: "lang", label: "LANG" }, { value: "neither", label: "Neither: it's an error" }] },
        ],
        challenge: {
          prompt: "Show the current time in UTC without changing your session's time zone, using TZ.",
          check: { accept: ["TZ=UTC date", "TZ=UTC0 date", "TZ=Etc/UTC date", "env TZ=UTC date"] },
          correct: "Correct. TZ is set for that one command only.",
          incorrect: "Put TZ=UTC in front of the command.",
        },
        memoryHook: "<code>echo $VAR</code> reads one, <code>printenv VAR</code> reads one (bare name), <code>env</code> and <code>printenv</code> list the exported ones, <code>set</code> lists everything.",
        completion: "You can read any environment.",
      },

      /* ---------------------------------------------------------- 12.2 */
      {
        id: "12.2", title: "Quoting", navSubtitle: "\" ' \\ and word splitting (Lab 4)", objective: "103.1", difficulty: "Beginner",
        source: "Lab 4: Use quoting to control what the shell expands",
        summary: "See what double quotes, single quotes and a backslash do to $VAR and $(command), and how quotes keep spacing.",
        ticket: ticket("Script reviewer", "A colleague's script prints the literal text $HOME in one message and loses the spacing in another. Show the team how quoting works.", ["echo", "\"…\"", "'…'", "\\"]),
        workspace: base,
        tasks: [
          { id: "three", title: "Three ways to write $HOME", short: "<code>echo \"Home is $HOME\"</code>, <code>echo 'Home is $HOME'</code> and <code>echo Home is \\$HOME</code>, into <code>reports/quoting.txt</code>", detail: "Double quotes expand; single quotes and a backslash keep it literal.", check: file("reports/quoting.txt", "^Home is /home/max\\nHome is \\$HOME\\nHome is \\$HOME$") },
          { id: "mixed", title: "Mix literal and expanded", short: "<code>echo \"Cost is \\$5 for $USER\"</code> and <code>echo \"Today is $(date +%F)\"</code>, appended", detail: "Inside double quotes, a backslash protects one $; command substitution still runs.", check: file("reports/quoting.txt", "^Cost is \\$5 for max\\nToday is \\d{4}-\\d\\d-\\d\\d$") },
          { id: "spaces", title: "Keep the spacing", short: "<code>MSG='web01    db01'; echo $MSG &gt;&gt; reports/quoting.txt; echo \"$MSG\" &gt;&gt; reports/quoting.txt</code>", detail: "Unquoted, the value is split into words and the spaces collapse. Quote variables by default.", check: file("reports/quoting.txt", "^web01 db01\\nweb01    db01$") },
        ],
        quiz: [
          { id: "single", prompt: "What does <code>echo '$USER'</code> print?", answer: "lit", explain: "Correct. Single quotes expand nothing.", options: [{ value: "lit", label: "<code>$USER</code>" }, { value: "max", label: "<code>max</code>" }, { value: "empty", label: "An empty line" }] },
          { id: "back", prompt: "How much does a backslash protect?", answer: "one", explain: "Correct. Only the next character.", options: [{ value: "one", label: "The next character" }, { value: "word", label: "The rest of the word" }, { value: "line", label: "The rest of the line" }] },
        ],
        challenge: {
          prompt: "Print the text <code>Path is $PATH</code> exactly, with the dollar sign, using single quotes.",
          check: { accept: ["echo 'Path is $PATH'"] },
          correct: "Correct.",
          incorrect: "Wrap the whole message in single quotes.",
        },
        memoryHook: "\"Double\" expands $VAR and $(cmd) but keeps spaces; 'single' expands nothing; \\ protects one character.",
        completion: "You can control exactly what the shell expands.",
      },

      /* ---------------------------------------------------------- 12.3 */
      {
        id: "12.3", title: "Shell variables and export", navSubtitle: "set vs env, export, SHLVL (Labs 5–6)", objective: "103.1", difficulty: "Intermediate",
        source: "Labs 5 and 6: Tell a shell variable from an environment variable; export a change ticket number",
        summary: "Prove where a plain variable is visible, export it so children see it, follow it into a child shell, and take the export away again.",
        ticket: ticket("Change manager", "A deploy script can't see SITE even though echo shows it at the prompt. Find out why, then make sure every script run during change CHG-1042 can see TICKET.", ["set", "env", "export", "declare -p", "bash -c", "bash", "$SHLVL"], { callout: childNote }),
        workspace: base,
        tasks: [
          { id: "before", title: "A plain shell variable", short: "<code>SITE=web01; echo \"prompt sees: $SITE\" &gt; reports/shell-vs-env.txt</code>, then append <code>set | grep '^SITE='</code>, <code>env | grep -c '^SITE='</code> and <code>bash -c 'echo \"child sees: [$SITE]\"'</code>", detail: "set finds it, env doesn't, and the child sees nothing. No spaces around =: <code>SITE = web01</code> runs a command called SITE.", check: file("reports/shell-vs-env.txt", "^prompt sees: web01\\nSITE=web01\\n0\\nchild sees: \\[\\]") },
          { id: "after", title: "Export it", short: "<code>export SITE</code>, then append <code>env | grep '^SITE='</code>, the same <code>bash -c</code> line, and <code>declare -p SITE</code>", check: file("reports/shell-vs-env.txt", "child sees: \\[\\]\\nSITE=web01\\nchild sees: \\[web01\\]\\ndeclare -x SITE=\"web01\"") },
          { id: "ticket", title: "Export the ticket number", short: "<code>TICKET=CHG-1042; bin/show-ticket.sh &gt; reports/export.txt</code>, then <code>export TICKET; bin/show-ticket.sh &gt;&gt; reports/export.txt; export -p | grep TICKET &gt;&gt; reports/export.txt</code>", detail: "The script runs in a child, so it sees TICKET only after export, with SHLVL one higher than yours.", check: file("reports/export.txt", "^child sees TICKET=\\[\\] SHLVL=2\\nchild sees TICKET=\\[CHG-1042\\] SHLVL=2\\ndeclare -x TICKET=\"CHG-1042\"") },
          { id: "inside", title: "Look from inside a child shell", short: "<code>echo $SHLVL</code>, then <code>bash</code>, then <code>echo \"inside: SHLVL=$SHLVL TICKET=$TICKET\" &gt;&gt; reports/export.txt</code>, then <code>exit</code>", check: file("reports/export.txt", "inside: SHLVL=2 TICKET=CHG-1042") },
          { id: "unexport", title: "Take the export away", command: "export -n TICKET; bin/show-ticket.sh >> reports/export.txt", detail: "export -n keeps the variable but stops passing it down. Then try <code>export PS1='lab&gt; '</code> and <code>bash</code>: ~/.bashrc sets PS1 again in the child. <code>exit</code>, then <code>source ~/.bashrc</code> to get your normal prompt back.", check: file("reports/export.txt", "inside: SHLVL=2 TICKET=CHG-1042\\nchild sees TICKET=\\[\\] SHLVL=2") },
        ],
        quiz: [
          { id: "envset", prompt: "Which lists shell variables as well as environment variables?", answer: "set", explain: "Correct. env and printenv list only exported variables.", options: [{ value: "set", label: "<code>set</code>" }, { value: "env", label: "<code>env</code>" }, { value: "printenv", label: "<code>printenv</code>" }] },
          { id: "same", prompt: "Which does <em>not</em> leave TICKET exported?", answer: "n", explain: "Correct. The others all export it.", options: [{ value: "n", label: "<code>TICKET=x; export -n TICKET</code>" }, { value: "a", label: "<code>export TICKET=x</code>" }, { value: "b", label: "<code>TICKET=x; export TICKET</code>" }] },
        ],
        challenge: {
          prompt: "Create CHANGE with the value CHG-2001 and export it, in one command.",
          check: { accept: ["export CHANGE=CHG-2001", "declare -x CHANGE=CHG-2001", "export CHANGE=\"CHG-2001\"", "export CHANGE='CHG-2001'"] },
          correct: "Correct.",
          incorrect: "export can set a value too.",
        },
        memoryHook: "Children get only <strong>exported</strong> variables. <code>declare -p VAR</code> shows <code>-x</code> when it's exported. Each child shell adds 1 to SHLVL.",
        completion: "You can control which programs see a variable.",
      },

      /* ---------------------------------------------------------- 12.4 */
      {
        id: "12.4", title: "Unset, and one-command environments", navSubtitle: "unset, VAR=x cmd, env -u, env -i (Labs 7–8)", objective: "103.1", difficulty: "Intermediate",
        source: "Labs 7 and 8: Remove a variable cleanly with unset; change the environment for a single command",
        summary: "See that an empty variable still exists, remove it properly, and change the environment for just one command.",
        ticket: ticket("Network team", "A stale proxy setting is breaking downloads in your session. Then run one command in UTC and one with a clean environment for a vendor test, without changing your own session.", ["unset", "declare -p", "TZ=UTC date", "env", "env -u", "env -i"]),
        workspace: base,
        tasks: [
          { id: "empty", title: "Empty is not gone", short: "<code>export LAB_PROXY=http://proxy01:3128; env | grep -c '^LAB_PROXY=' &gt; reports/unset.txt</code>, then <code>LAB_PROXY=;</code> and append <code>env | grep '^LAB_PROXY='</code> and <code>declare -p LAB_PROXY</code>", detail: "An empty variable still exists and is still exported.", check: file("reports/unset.txt", "^1\\nLAB_PROXY=\\ndeclare -x LAB_PROXY=\"\"") },
          { id: "unset", title: "Remove it", command: "unset LAB_PROXY; env | grep -c '^LAB_PROXY=' >> reports/unset.txt; declare -p LAB_PROXY >> reports/unset.txt 2>&1", detail: "unset takes the bare name. <code>unset $LAB_PROXY</code> would try to remove a variable named after the value.", check: file("reports/unset.txt", "declare -x LAB_PROXY=\"\"\\n0\\nbash: declare: LAB_PROXY: not found") },
          { id: "tz", title: "One command in UTC", command: "TZ=UTC date > reports/one-command.txt; echo \"session TZ is still [$TZ]\" >> reports/one-command.txt", check: file("reports/one-command.txt", "UTC 20\\d\\d\\nsession TZ is still \\[\\]") },
          { id: "env", title: "Change it for a child only", short: "<code>export LAB_COLOR=blue; env LAB_COLOR=red bash -c 'echo \"child: $LAB_COLOR\"' &gt;&gt; reports/one-command.txt; echo \"parent: $LAB_COLOR\" &gt;&gt; reports/one-command.txt</code>", check: file("reports/one-command.txt", "child: red\\nparent: blue") },
          { id: "clean", title: "Remove one, or everything", short: "<code>env -u LAB_COLOR bash -c 'echo \"after -u: [$LAB_COLOR]\"' &gt;&gt; …</code>, then <code>env -i /bin/bash -c 'env' &gt;&gt; reports/one-command.txt; unset LAB_COLOR</code>", detail: "With env -i, Bash starts with nothing and sets only PWD and SHLVL itself.", check: file("reports/one-command.txt", "after -u: \\[\\]\\nPWD=[^\\n]*\\nSHLVL=1\\n_=/usr/bin/env") },
        ],
        quiz: [
          { id: "unsetq", prompt: "Which removes the variable LAB_PROXY?", answer: "bare", explain: "Correct.", options: [{ value: "bare", label: "<code>unset LAB_PROXY</code>" }, { value: "dollar", label: "<code>unset $LAB_PROXY</code>" }, { value: "empty", label: "<code>LAB_PROXY=</code>" }] },
          { id: "oneq", prompt: "After <code>LANG=C sort names.txt</code>, what is LANG in your shell?", answer: "same", explain: "Correct. The assignment applied to sort only.", options: [{ value: "same", label: "Unchanged" }, { value: "c", label: "C" }, { value: "unset", label: "Unset" }] },
        ],
        challenge: {
          prompt: "Run <code>printenv</code> with a completely empty environment.",
          check: { accept: ["env -i printenv", "env - printenv", "env --ignore-environment printenv", "env -i /usr/bin/printenv"] },
          correct: "Correct. It prints nothing.",
          incorrect: "env has an option to start with an empty environment.",
        },
        memoryHook: "<code>VAR=x cmd</code> and <code>env VAR=x cmd</code> change one command's environment. <code>env -u VAR</code> removes one, <code>env -i</code> starts empty. <code>unset VAR</code> removes it from your shell.",
        completion: "You can change the environment exactly as far as you need.",
      },

      /* ---------------------------------------------------------- 12.5 */
      {
        id: "12.5", title: "PATH and the prompt", navSubtitle: "PATH, which, type, PS1, PS2 (Labs 9–10)", objective: "103.1", difficulty: "Intermediate",
        source: "Labs 9 and 10: Run a tool that is not in the PATH; customize the prompt",
        summary: "See why a command is not found, run it by path, extend PATH safely, find out what a name runs, and change PS1 and PS2.",
        ticket: ticket("Teammate", "I dropped a diskreport tool in the lab bin folder and the shell says command not found. Then: set up a prompt that shows user, host and folder so I stop typing in the wrong window.", ["PATH", "which", "type", "PS1", "PS2"], { callout: { kind: "info", title: "Continuing a line", text: "End a line with a backslash and press Enter: the PS2 prompt appears and you carry on typing the same command." } }),
        workspace: base,
        tasks: [
          { id: "fail", title: "Why it isn't found", short: "<code>echo \"$PATH\" | tr ':' '\\n' &gt; reports/path.txt; diskreport &gt;&gt; reports/path.txt 2&gt;&amp;1</code>, then run it as <code>./bin/diskreport</code> and <code>~/lpic1-section12/bin/diskreport</code>, appending both", detail: "The shell only looks in the PATH folders. A path with a slash runs the file directly.", check: file("reports/path.txt", "^/usr/local/sbin\\n[\\s\\S]*diskreport: command not found\\nDisk report for linux-mint\\n.*\\nDisk report for linux-mint") },
          { id: "path", title: "Add its folder to PATH", short: "<code>PATH=\"$PATH:$HOME/lpic1-section12/bin\"; diskreport &gt;&gt; reports/path.txt</code>, then append <code>which diskreport</code>, <code>type diskreport</code> and <code>type echo cd</code>", detail: "Always keep <code>$PATH</code> in the new value, and never add <code>.</code>. type also knows builtins and aliases; which only searches PATH.", check: file("reports/path.txt", "/home/max/lpic1-section12/bin/diskreport\\ndiskreport is (hashed \\()?/home/max/lpic1-section12/bin/diskreport\\)?\\necho is a shell builtin\\ncd is a shell builtin") },
          { id: "ps1", title: "A clearer prompt", short: "Save the old values (<code>echo \"old PS1: $PS1\"</code>, <code>echo \"old PS2: $PS2\"</code> into <code>reports/prompt.txt</code>; <code>OLD_PS1=$PS1</code>), then <code>PS1='[\\u@\\h \\W]\\$ '; PS2='continue&gt; '</code>", detail: "\\u user, \\h short host name, \\W last part of the folder (\\w the whole path). Single quotes store the escapes.", check: hist("^PS1='\\[\\\\u@\\\\h \\\\W\\]\\\\\\$ '; PS2='continue> '$|^PS1=.*\\\\u.*\\\\h.*\\\\W") },
          { id: "ps2", title: "Use the continuation prompt", short: "Type <code>echo one \\</code> and press Enter, then <code>two</code> and Enter", check: hist("^echo one +two$") },
          { id: "restore", title: "Record and restore", command: "echo \"new PS1: $PS1\" >> reports/prompt.txt; echo \"new PS2: $PS2\" >> reports/prompt.txt; PS1=$OLD_PS1; PS2='> '", check: file("reports/prompt.txt", "^old PS1: [\\s\\S]*\\nold PS2: > \\nnew PS1: \\[\\\\u@\\\\h \\\\W\\]\\\\\\$ \\nnew PS2: continue> ") },
        ],
        quiz: [
          { id: "pathq", prompt: "Which adds <code>/opt/tools/bin</code> to PATH safely?", answer: "keep", explain: "Correct. The other one replaces PATH and breaks almost every command.", options: [{ value: "keep", label: "<code>PATH=\"$PATH:/opt/tools/bin\"</code>" }, { value: "replace", label: "<code>PATH=/opt/tools/bin</code>" }, { value: "dot", label: "<code>PATH=\"$PATH:.\"</code>" }] },
          { id: "ps2q", prompt: "When does Bash show PS2?", answer: "cont", explain: "Correct.", options: [{ value: "cont", label: "When a command continues on the next line" }, { value: "root", label: "When you're root" }, { value: "sub", label: "In a subshell" }] },
          { id: "typeq", prompt: "Which tells you that <code>cd</code> is a shell builtin?", answer: "type", explain: "Correct. which only searches PATH.", options: [{ value: "type", label: "<code>type cd</code>" }, { value: "which", label: "<code>which cd</code>" }, { value: "whereis", label: "<code>whereis cd</code>" }] },
        ],
        challenge: {
          prompt: "Add <code>$HOME/scripts</code> to the end of PATH for this session.",
          check: { accept: ["PATH=\"$PATH:$HOME/scripts\"", "PATH=$PATH:$HOME/scripts", "export PATH=\"$PATH:$HOME/scripts\"", "export PATH=$PATH:$HOME/scripts", "PATH=\"$PATH:~/scripts\"", "PATH=$PATH:~/scripts"] },
          correct: "Correct. PATH is already exported, so children see the change too.",
          incorrect: "Keep $PATH in the new value and add the folder after a colon.",
        },
        memoryHook: "<code>PATH=\"$PATH:/new/dir\"</code>, never <code>PATH=/new/dir</code>. PS1 is the prompt, PS2 the continuation prompt; \\u user, \\h host, \\w folder, \\W its last part.",
        completion: "You can make a tool runnable by name and read any prompt.",
      },

      /* ---------------------------------------------------------- 12.6 */
      {
        id: "12.6", title: "source and exec", navSubtitle: "source, ., exec (Labs 11–12)", objective: "103.1", difficulty: "Advanced",
        source: "Labs 11 and 12: Load an application's settings into your shell; see exec replace the shell",
        summary: "Load a settings file into your own shell instead of a child, and see exec replace a shell with a command.",
        ticket: ticket("app02 runbook owner", "A teammate ran the app02 settings file as a script and the variables never appeared. Then explain why a wrapper's own process disappears from ps when it ends with exec.", ["bash file", "source", ".", "exec", "ps"], { callout: childNote }),
        workspace: base,
        tasks: [
          { id: "run", title: "Run it, then source it", short: "<code>bash configs/app02.env; echo \"after bash: [$APP_ENV] [$APP_REGION]\" &gt; reports/source.txt</code>, then <code>source configs/app02.env; echo \"after source: [$APP_ENV] [$APP_REGION]\" &gt;&gt; reports/source.txt</code>", detail: "Running a file starts a child shell; a child can't change its parent. source runs it in your shell.", check: file("reports/source.txt", "^after bash: \\[\\] \\[\\]\\nafter source: \\[staging\\] \\[us-east\\]") },
          { id: "child", title: "What a child sees", command: "bash -c 'echo \"child: [$APP_ENV] [$APP_REGION]\"' >> reports/source.txt", detail: "APP_REGION wasn't exported in the file, so it stays behind.", check: file("reports/source.txt", "child: \\[staging\\] \\[\\]") },
          { id: "dot", title: "The dot command", command: "unset APP_ENV APP_REGION APP_LOG; . configs/app02.env; echo \"after dot: [$APP_LOG]\" >> reports/source.txt; unset APP_ENV APP_REGION APP_LOG", check: file("reports/source.txt", "after dot: \\[/var/log/app02\\]") },
          { id: "exec", title: "exec keeps the PID and doesn't come back", short: "<code>bash -c 'echo \"shell PID $$\"; exec ps -o pid,comm -p $$' &gt; reports/exec.txt</code>, then <code>bash -c 'exec echo \"exec ran\"; echo \"this line never runs\"' &gt;&gt; reports/exec.txt</code>", detail: "Use child shells: exec at your own prompt would close the terminal.", check: file("reports/exec.txt", "^shell PID (\\d+)\\n +PID COMMAND\\n +\\1 ps\\nexec ran$", "this line never runs") },
          { id: "level", title: "exec ends a child shell", short: "<code>echo \"before: SHLVL=$SHLVL\" &gt;&gt; reports/exec.txt</code>, then <code>bash</code>, then <code>exec sleep 2</code>, then <code>echo \"after: SHLVL=$SHLVL\" &gt;&gt; reports/exec.txt</code>", detail: "When sleep finishes, the child shell it replaced is gone and you're back in the first one.", check: { type: "all", checks: [file("reports/exec.txt", "before: SHLVL=1\\nafter: SHLVL=1"), hist("^exec sleep")] } },
        ],
        quiz: [
          { id: "why", prompt: "Why does <code>bash settings.env</code> leave your shell unchanged?", answer: "child", explain: "Correct. Use source or . instead.", options: [{ value: "child", label: "It runs in a child shell, which can't change its parent" }, { value: "export", label: "The file has no export lines" }, { value: "x", label: "The file isn't executable" }] },
          { id: "execq", prompt: "What happens to your terminal after <code>exec ls</code> at your own prompt?", answer: "close", explain: "Correct. ls replaced the shell, and when ls ends there is no shell left.", options: [{ value: "close", label: "It closes" }, { value: "back", label: "You get your prompt back" }, { value: "sub", label: "You're in a subshell" }] },
        ],
        challenge: {
          prompt: "Load <code>~/.bashrc</code> into your current shell with the dot command.",
          check: { accept: [". ~/.bashrc", ". $HOME/.bashrc", ". /home/max/.bashrc", ". \"$HOME/.bashrc\""] },
          correct: "Correct. source ~/.bashrc does the same.",
          incorrect: "Use a dot, a space, then the file.",
        },
        memoryHook: "<code>source file</code> and <code>. file</code> run it in <em>this</em> shell. <code>bash file</code> runs it in a child. <code>exec cmd</code> replaces the shell with cmd.",
        completion: "You can load settings and explain exec.",
      },

      /* ---------------------------------------------------------- 12.7 */
      {
        id: "12.7", title: "Startup files", navSubtitle: "login vs non-login, ~/.bashrc (Labs 13–14)", objective: "103.1", difficulty: "Advanced",
        source: "Labs 13 and 14: Map which startup files a session reads; make a team variable permanent, then roll it back",
        summary: "Tell login from non-login shells, read the startup files Mint has, test a custom startup file, and make a setting permanent and undo it.",
        ticket: ticket("Help desk", "A user's setting in ~/.bashrc is missing when they log in over ssh but present in the desktop terminal. Explain why, then make LAB_TEAM=netops appear in every new terminal in a way that's easy to undo.", ["shopt login_shell", "bash -l", "bash --rcfile", "bash -i -c", "cp", "sed -i", "diff"]),
        workspace: base,
        tasks: [
          { id: "login", title: "Login or not?", command: "shopt login_shell > reports/startup-files.txt; bash -l -c 'shopt login_shell' >> reports/startup-files.txt", detail: "A desktop terminal is not a login shell; ssh and the console are.", check: file("reports/startup-files.txt", "^login_shell +\\toff\\nlogin_shell +\\ton") },
          { id: "files", title: "Which startup files exist", short: "<code>ls -ld</code> the system and home startup files into the report (with <code>2&gt;&amp;1</code>), then <code>grep -n 'bashrc' /etc/profile ~/.profile</code> and <code>cat /etc/environment</code>", detail: "~/.bash_profile and ~/.bash_login are missing on Mint, so a login reads ~/.profile, which sources ~/.bashrc.", check: file("reports/startup-files.txt", "\\.bash_profile': No such file or directory[\\s\\S]*\\.profile:\\d+:.*bashrc[\\s\\S]*^PATH=\"") },
          { id: "rcfile", title: "Test a startup file without touching ~/.bashrc", short: "<code>bash --rcfile configs/team-bashrc</code>, notice the <code>[lab …]</code> prompt, <code>echo $LAB_TEAM &gt;&gt; reports/startup-files.txt</code>, then <code>exit</code>", check: { type: "all", checks: [file("reports/startup-files.txt", "^netops$"), hist("^bash --rcfile configs/team-bashrc")] } },
          { id: "add", title: "Make it permanent", short: "<code>cp ~/.bashrc reports/bashrc.backup</code>, then <code>echo 'export LAB_TEAM=netops  # lpic1-s12' &gt;&gt; ~/.bashrc; tail -1 ~/.bashrc &gt; reports/bashrc-change.txt</code>", detail: "Then append <code>bash -i -c 'echo \"new shell sees: $LAB_TEAM\"'</code> and <code>bash -c 'echo \"non-interactive sees: [$LAB_TEAM]\"'</code>: ~/.bashrc stops early for non-interactive shells.", check: file("reports/bashrc-change.txt", "export LAB_TEAM=netops +# lpic1-s12\\nnew shell sees: netops\\nnon-interactive sees: \\[\\]") },
          { id: "undo", title: "Roll it back", command: "sed -i '/# lpic1-s12$/d' ~/.bashrc; diff ~/.bashrc reports/bashrc.backup && echo 'bashrc restored' >> reports/bashrc-change.txt", detail: "If diff shows a difference, put the backup back with <code>cp reports/bashrc.backup ~/.bashrc</code>.", check: { type: "all", checks: [file("reports/bashrc-change.txt", "bashrc restored"), { type: "file", path: "~/.bashrc", re: "", not: "lpic1-s12" }] } },
        ],
        quiz: [
          { id: "loginq", prompt: "On Mint, an ssh login reads which of your files?", answer: "profile", explain: "Correct. The first of ~/.bash_profile, ~/.bash_login and ~/.profile that exists, and Mint has only ~/.profile, which sources ~/.bashrc.", options: [{ value: "profile", label: "~/.profile (which sources ~/.bashrc)" }, { value: "bashrc", label: "Only ~/.bashrc" }, { value: "none", label: "None of them" }] },
          { id: "envfile", prompt: "What is <code>/etc/environment</code>?", answer: "plain", explain: "Correct. export and $VAR don't work there.", options: [{ value: "plain", label: "Plain NAME=value lines read at login" }, { value: "script", label: "A shell script run by every shell" }, { value: "bashrc", label: "The system-wide ~/.bashrc" }] },
          { id: "open", prompt: "You just edited ~/.bashrc. How do you get the change in the terminal that's already open?", answer: "source", explain: "Correct. Or open a new terminal.", options: [{ value: "source", label: "<code>source ~/.bashrc</code>" }, { value: "export", label: "<code>export ~/.bashrc</code>" }, { value: "nothing", label: "It's already there" }] },
        ],
        challenge: {
          prompt: "Start a login shell that runs <code>shopt login_shell</code> and exits.",
          check: { accept: ["bash -l -c 'shopt login_shell'", "bash -lc 'shopt login_shell'", "bash --login -c 'shopt login_shell'", "bash -l -c \"shopt login_shell\"", "bash -lc \"shopt login_shell\""] },
          correct: "Correct. It prints login_shell on.",
          incorrect: "bash has a login option, and -c runs one command.",
        },
        memoryHook: "Login: /etc/profile, then the first of ~/.bash_profile, ~/.bash_login, ~/.profile. Interactive non-login: /etc/bash.bashrc and ~/.bashrc. Permanent for you: ~/.bashrc.",
        completion: "You can explain and change how sessions start.",
      },

      /* ---------------------------------------------------------- 12.C */
      {
        id: "12.C", navNumber: "C", title: "Challenge exam: session setup", navSubtitle: "No notes", objective: "103.1", difficulty: "Hard",
        source: "Scenario-Based Challenge Exam", noHints: true, tasksHeading: "Tasks",
        summary: "The workbook's challenge tasks, checked by your reports and the commands you run.",
        ticket: ticket("Operations manager", "Set up tonight's maintenance session and prove each setting reaches exactly as far as it should.", ["echo", "export", "env", "PATH", "source", "unset", "shopt"], { heading: "Ticket: session setup", callout: childNote }),
        workspace: base,
        tasks: [
          { id: "c1", title: "Save your user name, home folder, shell, bash version and history file to reports/challenge-vars.txt, using variables only", check: { type: "all", checks: [file("reports/challenge-vars.txt", "^(?=[\\s\\S]*\\bmax\\b)(?=[\\s\\S]*/home/max)(?=[\\s\\S]*/bin/bash)(?=[\\s\\S]*5\\.2\\.21)(?=[\\s\\S]*\\.bash_history)"), hist("\\$\\{?(USER|HOME|SHELL|BASH_VERSION|HISTFILE)")] } },
          { id: "c2", title: "Create CHANGE=CHG-2001 and prove a child shell can't see it until you export it", check: hist("CHANGE=CHG-2001", "bash -c .*\\$\\{?CHANGE", "export (-[a-z] )?CHANGE") },
          { id: "c3", title: "Run date in UTC without changing your session's time zone", check: hist("^(TZ=(UTC|UTC0|Etc/UTC) date|date -u|date --utc|env TZ=UTC date)") },
          { id: "c4", title: "Make diskreport run by name for this session only, and show where the shell found it", check: hist("^(export )?PATH=.*lpic1-section12/bin", "^diskreport\\b", "^(which|type)( -[a-zA-Z]+)* .*diskreport") },
          { id: "c5", title: "Load configs/app02.env into your shell and prove which of its variables a child can see", check: hist("^(source|\\.) (\\./)?configs/app02\\.env", "bash -c .*APP_(ENV|REGION|LOG)") },
          { id: "c6", title: "Show echo \"$HOME\", echo '$HOME' and echo \\$HOME, one line each", check: hist("^echo \"\\$HOME\"$", "^echo '\\$HOME'$", "^echo \\\\\\$HOME$") },
          { id: "c7", title: "Remove CHANGE from your session and prove it's gone, not just empty", check: hist("^unset CHANGE", "declare -p CHANGE|set \\| grep .*CHANGE|printenv CHANGE|env \\| grep .*CHANGE|echo \\$\\{CHANGE[-+]") },
          { id: "c8", title: "Prove which kind of shell you're in (login or not)", check: hist("shopt (-q )?login_shell|echo \\$0") },
        ],
        quiz: [],
        completion: "Session set up.",
      },
    ],

    review: {
      traps: [
        "Putting spaces around =. `VAR=value` works; `VAR = value` runs a command named VAR.",
        "Using $ in the wrong place. `echo $VAR` reads a value, but `VAR=`, `export VAR`, `unset VAR` and `printenv VAR` take the bare name.",
        "Expecting a variable to reach a child without export. Children get only exported variables.",
        "Expecting a child to change its parent. A script can't set variables in the shell that ran it; source it instead.",
        "Confusing set, env and printenv. set shows shell and environment variables plus functions; env and printenv show only the environment.",
        "Mixing up quotes. Double quotes expand $VAR and $(command); single quotes expand nothing; a backslash protects one character.",
        "Replacing PATH instead of adding to it. Use `PATH=\"$PATH:/new/dir\"`, never `PATH=/new/dir`, and never add the current folder.",
        "Expecting which to find builtins and aliases. type does; which only searches PATH.",
        "Forgetting that changes at the prompt are temporary. They end with the shell; put them in ~/.bashrc or ~/.profile to keep them.",
        "Mixing up login and non-login files. Login shells read /etc/profile and the first of ~/.bash_profile, ~/.bash_login and ~/.profile; interactive non-login shells read ~/.bashrc.",
        "Running exec at your own prompt. It replaces the shell, so the terminal closes when the command ends.",
        "Reading $GROUPS as all groups. It's an array; use ${GROUPS[@]} or id -G.",
        "Mixing up PS1 and PS2. PS1 is the main prompt; PS2 is the continuation prompt.",
        "Thinking LC_ALL is a fallback. When set, it overrides LANG and all other LC_ variables.",
      ],
      trapQuiz: [
        { id: "t1", prompt: "Which creates a variable called NAME?", answer: "ok", options: [{ value: "ok", label: "<code>NAME=web01</code>" }, { value: "sp", label: "<code>NAME = web01</code>" }, { value: "dl", label: "<code>$NAME=web01</code>" }], explain: "Correct. No spaces, no $." },
        { id: "t2", prompt: "A script needs to change variables in your current shell. How do you run it?", answer: "source", options: [{ value: "source", label: "<code>source script.sh</code>" }, { value: "bash", label: "<code>bash script.sh</code>" }, { value: "exec", label: "<code>exec script.sh</code>" }], explain: "Correct." },
        { id: "t3", prompt: "Which lists only exported variables?", answer: "env", options: [{ value: "env", label: "<code>env</code>" }, { value: "set", label: "<code>set</code>" }, { value: "declare", label: "<code>declare</code>" }], explain: "Correct. printenv does too." },
        { id: "t4", prompt: "An interactive non-login shell on Mint reads…", answer: "bashrc", options: [{ value: "bashrc", label: "/etc/bash.bashrc and ~/.bashrc" }, { value: "profile", label: "/etc/profile and ~/.profile" }, { value: "env", label: "Only /etc/environment" }], explain: "Correct." },
        { id: "t5", prompt: "<code>echo \"Cost: \\$5\"</code> prints…", answer: "lit", options: [{ value: "lit", label: "<code>Cost: $5</code>" }, { value: "empty", label: "<code>Cost: </code>" }, { value: "bs", label: "<code>Cost: \\$5</code>" }], explain: "Correct. The backslash protects the $." },
      ],
      challenge: {
        intro: "On your Linux Mint VM, without notes, in ~/lpic1-section12. Open a fresh terminal first so you start with a clean session.",
        tasks: [
          "Save your user name, home folder, shell, bash version and history file location to `reports/challenge-vars.txt` using variables only.",
          "Create a variable called CHANGE with the value CHG-2001 and prove that a child shell can't see it until you export it.",
          "Run date in UTC without changing your session's time zone.",
          "Make diskreport run by name for this session only, and show where the shell found it.",
          "Load `configs/app02.env` into your current shell and prove which of its variables a child process can see.",
          "Show, in one line each, the difference between `echo \"$HOME\"`, `echo '$HOME'` and `echo \\$HOME`.",
          "Remove CHANGE from your session and prove it's gone, not just empty.",
          "Explain which startup files a desktop terminal reads on Mint and which an ssh login reads, and prove which kind of shell you're in.",
        ],
        outro: "Your final handoff is the reports directory. For each file, write a short sentence explaining what it proves, and confirm that ~/.bashrc matches reports/bashrc.backup.",
      },
      questions: [
        { q: "Vendor request: “Send me your shell environment and kernel version so we can see why the installer fails.”", a: "<code>uname -a</code> and <code>env | sort</code> into a file. Read it for tokens or passwords before you send it." },
        { q: "Developer request: “My deploy script can’t see the SITE variable even though echo shows it at my prompt. Why?”", a: "SITE is a shell variable. <code>export SITE</code>; prove it with <code>bash -c 'echo $SITE'</code> or <code>declare -p SITE</code> (declare -x)." },
        { q: "Teammate request: “I dropped a tool in a bin folder in my home directory and the shell says command not found.”", a: "The folder isn't in PATH. Run it by path, or <code>PATH=\"$PATH:$HOME/bin\"</code> (in ~/.bashrc to keep it). Check with <code>type tool</code>." },
        { q: "Change manager request: “Every script you run tonight must see the change number. Set it up once.”", a: "<code>export CHANGE=CHG-2001</code> in the session that runs the scripts." },
        { q: "Operations request: “Load the app02 settings file into your session before you run the maintenance commands.”", a: "<code>source configs/app02.env</code> (or <code>. configs/app02.env</code>), not <code>bash configs/app02.env</code>." },
        { q: "Help desk request: “The user’s alias works in the desktop terminal but not when they ssh in. Explain why.”", a: "ssh starts a login shell, which reads ~/.bash_profile, ~/.bash_login or ~/.profile, not ~/.bashrc directly. On Mint ~/.profile sources ~/.bashrc; if a ~/.bash_profile exists it hides ~/.profile." },
        { q: "Team lead request: “Make the team variable appear in every new terminal, and show me how you would undo it.”", a: "Back up ~/.bashrc, append a marked <code>export LAB_TEAM=netops  # tag</code> line, test with <code>bash -i -c</code>; undo with <code>sed -i '/# tag$/d' ~/.bashrc</code> and check with diff." },
      ],
      mastery: [
        "I can read variables with echo $VAR and printenv VAR, and list them with env, printenv and set.",
        "I can explain the difference between a shell variable and an environment variable.",
        "I can create, change, export, unexport and unset a variable, with no spaces around =.",
        "I can prove whether a child shell or script sees a variable, and read SHLVL to know how deep I am.",
        "I can run one command with a changed environment using VAR=value command, env, env -u and env -i.",
        "I can use double quotes, single quotes and backslashes to control expansion.",
        "I can read and extend PATH safely, and run a program by relative or absolute path when it isn't in PATH.",
        "I can use type and which to find out what a command name really runs.",
        "I can explain USER, LOGNAME, HOME, PWD, UID, GROUPS, BASH_VERSION, HISTFILE, HISTSIZE, HOSTNAME, LANG, LC_ALL, TZ and LD_LIBRARY_PATH.",
        "I can change PS1 and PS2 and restore them.",
        "I can explain source, the dot command and exec, and when each one is safe to use.",
        "I can name the startup files read by login and non-login shells, and make a setting permanent in ~/.bashrc.",
      ],
    },
  });
})();
