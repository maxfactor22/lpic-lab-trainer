/* Section 11: Processes, signals and priorities (103.5, 103.6). From "LPIC_Section11_Lab_Workbook.docx"
   (written from the course transcript on 2026-11-09). 14 labs grouped into 7 lessons. */
(function () {
  const WS = "~/lpic1-section11";
  const FILES = {
    [WS + "/bin/fake-backup.sh"]: "#!/bin/bash\n# simulated nightly backup, runs for up to 30 minutes\nfor i in $(seq 1 1800); do sleep 1; done\n",
    [WS + "/bin/cpu-hog.sh"]: "#!/bin/bash\n# busy loop that ends by itself after 300 seconds\nend=$((SECONDS+300)); while [ $SECONDS -lt $end ]; do :; done\n",
    [WS + "/bin/stubborn.sh"]: "#!/bin/bash\n# ignores SIGTERM, like a hung service\ntrap \"echo stubborn: ignoring TERM\" TERM\nwhile true; do sleep 1; done\n",
    [WS + "/reports/"]: null,
  };
  const base = { user: "max", host: "linux-mint", cwd: WS, files: FILES, setup: ["chmod +x bin/*.sh"] };
  const ticket = (requestedBy, body, tools, extra = {}) => ({ requestedBy, system: "Linux Mint VM", badge: "IT engineer", tools, body, ...extra });
  const file = (name, re, not) => ({ type: "file", path: WS + "/" + name, re, not });
  const exists = (name) => ({ type: "file", path: WS + "/" + name });
  const out = (re) => ({ type: "output", re });
  const hist = (...includes) => ({ type: "history", includes });
  const ev = (event, match = {}) => ({ type: "event", event, match });
  const keysNote = { kind: "info", title: "Keys here", text: "Use <strong>^C</strong> and <strong>^Z</strong> in the key row (or Ctrl+C and Ctrl+Z on a keyboard) while a job runs in the foreground. While a job runs, the prompt disappears, just like a real terminal." };
  const muxNote = { kind: "info", title: "The prefix key", text: "A blue key row appears while you're in tmux or screen. Tap <strong>Ctrl+B</strong> (tmux) or <strong>Ctrl+A</strong> (screen), then the command key. On a keyboard, press Ctrl+B or Ctrl+A, let go, then press the key." };

  LPIC.section({
    id: "section-11",
    number: 11,
    title: "Processes, Signals and Priorities",
    objectives: ["103.5", "103.6"],
    kind: "terminal",
    source: "LPIC_Section11_Lab_Workbook.docx",
    scenario: "You're an IT engineer on triage and maintenance tickets. Find the right process before you touch it, use the gentlest signal that works, and prove the result with ps, pgrep, jobs or top.",
    overview: {
      paragraphs: [
        "Every process you start, stop or kill here is one of the practice scripts in <code>bin/</code> or a <code>sleep</code>. As a normal user you can't touch system processes, and that's the safety net: never use <code>sudo</code> with kill, killall or pkill in these labs.",
        "Time in the practice terminal follows the real clock. A short foreground <code>sleep</code> (10 seconds or less) jumps the clock ahead instead of making you wait, so <code>sleep 2</code> behaves as if two seconds passed.",
        "On your VM, check <code>command -v tmux screen killall</code> first and install anything missing with <code>sudo apt install tmux screen psmisc</code>. Then run the workbook's Lab Setup to create <code>~/lpic1-section11</code>; the practice terminal already has it.",
      ],
      commands: ["ps", "ps -ef", "ps -elf", "ps aux", "ps -l", "ps -o", "ps --sort", "tty", "pgrep -a -l -u -t -f -c", "top", "top -b -n 1", "uptime", "free -h", "nproc", "watch -n", "&", "$!", "Ctrl+Z", "Ctrl+C", "jobs -l", "bg", "fg", "kill -l", "kill -15 / -9", "kill -STOP / -CONT", "kill %1", "pkill", "killall", "nohup", "nice -n", "renice -n -p", "tmux new -s / ls / attach -t", "screen -S / -ls / -r"],
      memoryHook: "Find it, then signal it. pgrep and ps find the PID; kill, pkill and killall send the signal. Ask nicely with 15 (TERM, the default) and force it only with 9 (KILL). 1 (HUP) is what a closing terminal sends, and nohup protects against it. Nice values run from -20 to 19: the higher the number, the nicer to everyone else.",
    },

    lessons: [
      /* ---------------------------------------------------------- 11.1 */
      {
        id: "11.1", title: "Find and measure processes", navSubtitle: "ps, pgrep, uptime, free (Labs 1–3)", objective: "103.5", difficulty: "Beginner",
        source: "Labs 1–3: Inventory the processes; find a process by name, user and terminal; check load and memory",
        summary: "List processes in both ps styles, find one by name, user or terminal with pgrep, and read the load averages and memory figures.",
        ticket: ticket("Service desk", "A workstation feels slow and the backup team wants to know if their job is running. Take a process snapshot, find the backup several ways, and send the load and memory figures for the ticket.", ["ps", "pgrep", "tty", "uptime", "free", "nproc"]),
        workspace: base,
        tasks: [
          { id: "inventory", title: "Snapshot the processes", short: "<code>tty</code> and <code>ps</code>, then the first lines of <code>ps -ef</code>, <code>ps aux</code> and <code>ps -eo pid,ppid,user,stat,ni,comm --sort=-pcpu</code>, all into <code>reports/ps-inventory.txt</code>", detail: "Plain <code>ps</code> shows only your terminal. <code>ps -ef</code> is UNIX style (UID PID PPID); <code>ps aux</code> is BSD style with no dash (USER PID %CPU %MEM).", check: file("reports/ps-inventory.txt", "^/dev/pts/0\\n[\\s\\S]*PID TTY[\\s\\S]*^UID +PID +PPID[\\s\\S]*^USER +PID +%CPU[\\s\\S]*PID +PPID USER +STAT +NI COMMAND") },
          { id: "pgrep", title: "Find the backup", short: "<code>bin/fake-backup.sh &amp;</code>, then <code>pgrep</code>, <code>pgrep -a</code> and <code>pgrep -l fake-backup</code> into <code>reports/pgrep.txt</code>", detail: "Then add <code>pgrep -l -u $USER bash</code>, <code>pgrep -l -t $(tty | cut -d/ -f3-)</code> and <code>pgrep -c -f 'bin/fake-backup'</code>, and stop it with <code>kill %1</code>.", check: file("reports/pgrep.txt", "^(\\d+)\\n\\1 /bin/bash bin/fake-backup\\.sh\\n\\1 fake-backup\\.sh\\n[\\s\\S]*\\d+ bash\\n[\\s\\S]*fake-backup\\.sh\\n1$") },
          { id: "health", title: "Load and memory for the ticket", short: "<code>uptime</code>, <code>uptime -p</code>, <code>cat /proc/loadavg</code>, <code>nproc</code>, <code>free -h</code> and <code>free -m</code> into <code>reports/health.txt</code>", detail: "The three load averages are 1, 5 and 15 minutes. They only mean something next to the CPU count from nproc. In free, <em>available</em> is what programs can still get.", check: file("reports/health.txt", "load average:[\\s\\S]*^up \\d[\\s\\S]*^\\d+\\.\\d\\d \\d+\\.\\d\\d \\d+\\.\\d\\d \\d+/\\d+ \\d+$[\\s\\S]*^2$[\\s\\S]*available[\\s\\S]*^Mem:") },
          { id: "clean", title: "Nothing left running", command: "jobs; pgrep -a -u $USER -f 'bin/|sleep'", detail: "Do this before every lab. Neither command should print anything.", check: { type: "all", checks: [hist("^jobs\\b"), hist("pgrep -a -u \\$USER -f")] } },
        ],
        quiz: [
          { id: "styles", prompt: "Which is BSD style?", answer: "aux", explain: "Correct. BSD options have no dash; ps -ef is UNIX style.", options: [{ value: "aux", label: "<code>ps aux</code>" }, { value: "ef", label: "<code>ps -ef</code>" }, { value: "elf", label: "<code>ps -elf</code>" }] },
          { id: "f", prompt: "pgrep matches the process name. What makes it match the whole command line?", answer: "f", explain: "Correct. The name is also cut to 15 characters, so -f is often what you want.", options: [{ value: "f", label: "<code>-f</code>" }, { value: "a", label: "<code>-a</code>" }, { value: "l", label: "<code>-l</code>" }] },
          { id: "load", prompt: "The load average is 2.0 and nproc says 8. The machine is…", answer: "quiet", explain: "Correct. 2.0 would be busy on one CPU but is light work for eight.", options: [{ value: "quiet", label: "Mostly idle" }, { value: "over", label: "Overloaded" }, { value: "full", label: "Exactly full" }] },
        ],
        challenge: {
          prompt: "Count how many processes have <code>bin/fake-backup</code> anywhere in their command line.",
          check: { accept: ["pgrep -c -f bin/fake-backup", "pgrep -cf bin/fake-backup", "pgrep -fc bin/fake-backup", "pgrep -c -f 'bin/fake-backup'", "pgrep -f -c bin/fake-backup", "pgrep -c -f \"bin/fake-backup\""] },
          correct: "Correct.",
          incorrect: "Use pgrep with the count and full-command-line options.",
        },
        memoryHook: "<code>ps</code> = a snapshot, <code>pgrep</code> = PIDs by name, <code>-f</code> = whole command line, <code>-a</code> = show it, <code>-c</code> = count.",
        completion: "You can find any process and size up a machine.",
      },

      /* ---------------------------------------------------------- 11.2 */
      {
        id: "11.2", title: "Triage a CPU spike in top", navSubtitle: "top keys P M 1 q, top -b (Lab 4)", objective: "103.5", difficulty: "Beginner",
        source: "Lab 4: Triage a CPU spike in top",
        summary: "Watch a busy script in top, sort by CPU and by memory, and save a batch-mode snapshot for the ticket.",
        ticket: ticket("Help desk", "A user says a script is eating the CPU. Look at it live, sort the list by CPU and by memory, and attach a snapshot to the ticket.", ["top", "top -b -n 1", "kill"], { callout: { kind: "info", title: "top here", text: "top opens full screen and updates every 3 seconds. Use the key row (P, M, 1, q…) or your keyboard. <strong>q</strong> quits." } }),
        workspace: base,
        tasks: [
          { id: "hog", title: "Start the CPU hog", command: "bin/cpu-hog.sh &", detail: "It keeps one CPU busy and stops by itself after five minutes.", check: ev("spawn", { comm: "^cpu-hog\\.sh$", bg: "yes" }) },
          { id: "keys", title: "Look at it live", short: "<code>top</code>, then <strong>P</strong> (sort by CPU), <strong>M</strong> (by memory), <strong>P</strong> again, <strong>1</strong> (each CPU), <strong>q</strong>", detail: "cpu-hog.sh sits at the top with close to 100 %CPU. With 1 you see it fill one of the two CPUs.", check: ev("top-quit", { keys: "(?=.*\\bP\\b)(?=.*\\bM\\b)(?=.*\\b1\\b)" }) },
          { id: "snap", title: "Save a snapshot", short: "<code>top -b -n 1 | head -15 &gt; reports/top-snapshot.txt</code>, then the same with <code>-u $USER | head -12 &gt;&gt;</code>", detail: "<code>-b</code> is batch mode (plain text) and <code>-n 1</code> is one screen. Then stop the hog with <code>kill %1</code>.", check: file("reports/top-snapshot.txt", "^top - [\\s\\S]*^Tasks:[\\s\\S]*cpu-hog\\.sh[\\s\\S]*^top - [\\s\\S]*cpu-hog\\.sh") },
          { id: "stop", title: "Stop the hog", command: "kill %1", check: ev("signal", { comm: "^cpu-hog\\.sh$" }) },
        ],
        quiz: [
          { id: "M", prompt: "In top, which key sorts by memory?", answer: "M", options: ["M", "P", "m", "k"], explain: "Correct. P sorts by CPU." },
          { id: "zombie", prompt: "top's Tasks line shows 1 zombie. Killing the zombie's PID…", answer: "nothing", explain: "Correct. It has already finished; its parent has to collect it.", options: [{ value: "nothing", label: "Does nothing" }, { value: "frees", label: "Frees its memory" }, { value: "parent", label: "Kills its parent" }] },
        ],
        challenge: {
          prompt: "Save one screen of top, as plain text, to <code>reports/top.txt</code>.",
          check: { accept: ["top -b -n 1 > reports/top.txt", "top -bn1 > reports/top.txt", "top -n 1 -b > reports/top.txt", "top -b -n1 > reports/top.txt", "top -bn 1 > reports/top.txt"] },
          correct: "Correct.",
          incorrect: "Use batch mode and one iteration.",
        },
        memoryHook: "top: <strong>P</strong> CPU, <strong>M</strong> memory, <strong>1</strong> each CPU, <strong>k</strong> kill, <strong>r</strong> renice, <strong>q</strong> quit. <code>top -b -n 1</code> for a text snapshot.",
        completion: "You can triage a busy machine.",
      },

      /* ---------------------------------------------------------- 11.3 */
      {
        id: "11.3", title: "Foreground and background jobs", navSubtitle: "&, Ctrl+Z, bg, fg, jobs (Lab 5)", objective: "103.5", difficulty: "Intermediate",
        source: "Lab 5: Move a long job between the foreground and the background",
        summary: "Suspend a foreground job, carry on with it in the background, start another, and move one back to the foreground.",
        ticket: ticket("Operations", "You started a long job in the foreground and need your prompt back without losing its progress.", ["Ctrl+Z", "bg", "fg", "jobs -l", "kill %n"], { callout: keysNote }),
        workspace: base,
        tasks: [
          { id: "stop", title: "Suspend a foreground job", short: "<code>sleep 3000</code>, then <strong>^Z</strong>", detail: "Note the job number in brackets and the word Stopped.", check: ev("job-stopped", { comm: "^sleep$", how: "ctrl-z" }) },
          { id: "bg", title: "Resume it in the background, start another", command: "bg %1; sleep 4000 & jobs -l > reports/jobs.txt", detail: "Careful: <code>sleep 4000 &amp;;</code> is a syntax error in Bash. The <code>&amp;</code> already ends the command.", check: file("reports/jobs.txt", "^\\[1\\][-+ ] +\\d+ Running +sleep 3000 &\\n\\[2\\][-+ ] +\\d+ Running +sleep 4000 &") },
          { id: "fg", title: "Bring one back, and send it away again", short: "<code>fg %2</code>, <strong>^Z</strong>, <code>bg</code>, then <code>jobs -l &gt;&gt; reports/jobs.txt</code>", check: { type: "all", checks: [hist("^fg %?2$", "^bg( %?2)?$"), file("reports/jobs.txt", "sleep 4000 &[\\s\\S]*sleep 4000 &")] } },
          { id: "ps", title: "Match jobs to PIDs, then clean up", short: "<code>ps -o pid,stat,comm -p \"$(jobs -p | paste -sd,)\" &gt;&gt; reports/jobs.txt</code>, then <code>kill %1 %2</code>", detail: "The PIDs from jobs -l are the PIDs ps shows. <code>jobs -p</code> prints just the PIDs.", check: { type: "all", checks: [file("reports/jobs.txt", "PID STAT COMMAND\\n *\\d+ S +sleep\\n *\\d+ S +sleep"), hist("^kill %1 %2$|^kill %2 %1$")] } },
        ],
        quiz: [
          { id: "ctrlz", prompt: "What does Ctrl+Z do to a foreground job?", answer: "stop", explain: "Correct. Ctrl+C sends SIGINT, which usually ends it.", options: [{ value: "stop", label: "Suspends (stops) it" }, { value: "end", label: "Ends it" }, { value: "bg", label: "Moves it to the background, still running" }] },
          { id: "pct", prompt: "What does <code>kill 1</code> target?", answer: "pid1", explain: "Correct. Job 1 is <code>kill %1</code>.", options: [{ value: "pid1", label: "PID 1" }, { value: "job1", label: "Job 1" }, { value: "last", label: "The last background job" }] },
        ],
        challenge: {
          prompt: "Job 2 is stopped. Let it carry on running in the background.",
          check: { accept: ["bg %2", "bg 2", "bg %2 ", "kill -CONT %2", "kill -s CONT %2", "kill -18 %2"] },
          correct: "Correct.",
          incorrect: "Use bg with a job number.",
        },
        memoryHook: "<code>&amp;</code> starts in the background, <strong>Ctrl+Z</strong> stops, <code>bg</code> resumes in the background, <code>fg</code> brings it forward. Job numbers need <code>%</code>.",
        completion: "You can juggle jobs in one shell.",
      },

      /* ---------------------------------------------------------- 11.4 */
      {
        id: "11.4", title: "Signals: pause, resume, stop", navSubtitle: "kill -STOP/-CONT, -15, -9, kill -l (Labs 6–7)", objective: "103.5", difficulty: "Intermediate",
        source: "Labs 6 and 7: Pause and resume a job; terminate a hung service that ignores the polite signal",
        summary: "Pause a job with SIGSTOP and resume it with SIGCONT, list the signals, and see a script ignore TERM until KILL ends it.",
        ticket: ticket("Storage team", "Pause the backup while we fail over a disk, then resume it exactly where it was. Separately, a service won't shut down: try TERM first and use KILL only as a last resort.", ["kill -STOP", "kill -CONT", "kill -l", "kill", "kill -s SIGKILL"]),
        workspace: base,
        tasks: [
          { id: "pause", title: "Pause and resume the backup", short: "<code>bin/fake-backup.sh &amp; PID=$!</code>, <code>kill -STOP $PID</code>, then <code>kill -CONT $PID</code>, saving <code>ps -o pid,stat,comm -p $PID</code> after each to <code>reports/pause.txt</code>", detail: "<code>$!</code> is the PID of the last background job. The state goes T (stopped), then S (sleeping).", check: file("reports/pause.txt", "PID STAT COMMAND\\n *\\d+ T +fake-backup\\.sh\\n *PID STAT COMMAND\\n *\\d+ S +fake-backup\\.sh") },
          { id: "list", title: "List the signals", command: "kill -l > reports/signals.txt; kill -l 1 2 9 15 18 19 >> reports/signals.txt; kill $PID", detail: "A signal has three names: 15, TERM and SIGTERM.", check: file("reports/signals.txt", "1\\) SIGHUP[\\s\\S]*^HUP\\nINT\\nKILL\\nTERM\\nCONT\\nSTOP$") },
          { id: "term", title: "Ask the hung service to stop", short: "<code>bin/stubborn.sh &amp;</code>, then <code>kill %1; sleep 2; jobs -l &gt; reports/hung-service.txt</code>", detail: "It catches TERM and says so. jobs still shows it Running.", check: file("reports/hung-service.txt", "Running +bin/stubborn\\.sh &") },
          { id: "kill", title: "Force it", short: "<code>kill -s SIGKILL %1; sleep 1; jobs -l &gt;&gt; reports/hung-service.txt</code>, then <code>pgrep -c -f bin/stubborn &gt;&gt;</code> it", detail: "KILL can't be caught or ignored, but it also gives the program no chance to clean up.", check: file("reports/hung-service.txt", "Running +bin/stubborn\\.sh &\\n[\\s\\S]*Killed +bin/stubborn\\.sh\\n0$") },
        ],
        quiz: [
          { id: "default", prompt: "Which signal does <code>kill PID</code> send?", answer: "15", options: ["15 (TERM)", "9 (KILL)", "1 (HUP)", "2 (INT)"].map((l) => ({ value: l.split(" ")[0], label: l })), explain: "Correct. So do pkill and killall." },
          { id: "catch", prompt: "Which two signals can never be caught or ignored?", answer: "9-19", options: [{ value: "9-19", label: "KILL (9) and STOP (19)" }, { value: "15-1", label: "TERM (15) and HUP (1)" }, { value: "2-9", label: "INT (2) and KILL (9)" }], explain: "Correct." },
          { id: "T", prompt: "In ps, what does state <code>T</code> mean?", answer: "stopped", explain: "Correct. R running, S sleeping, D uninterruptible, Z zombie.", options: [{ value: "stopped", label: "Stopped" }, { value: "terminated", label: "Terminated" }, { value: "thread", label: "A thread" }] },
        ],
        challenge: {
          prompt: "Resume process 4321, which was paused with SIGSTOP.",
          check: { accept: ["kill -CONT 4321", "kill -SIGCONT 4321", "kill -18 4321", "kill -s CONT 4321", "kill -s SIGCONT 4321", "kill -s 18 4321"] },
          correct: "Correct.",
          incorrect: "Send the continue signal.",
        },
        memoryHook: "1 HUP, 2 INT, 9 KILL, 15 TERM, 18 CONT, 19 STOP. Try 15 first; 9 and 19 can't be caught.",
        completion: "You can pause, resume and stop processes safely.",
      },

      /* ---------------------------------------------------------- 11.5 */
      {
        id: "11.5", title: "Kill by name; survive logout", navSubtitle: "pkill, killall, nohup (Labs 8–9)", objective: "103.5", difficulty: "Intermediate",
        source: "Labs 8 and 9: Clean up runaway jobs by name; keep a job running after you disconnect",
        summary: "Preview a match with pgrep, end every copy with pkill or killall, and start a job with nohup so it survives its terminal closing.",
        ticket: ticket("Change manager", "A cron mistake left several copies of a job running: stop them all. Then start the backup from a terminal you're about to close, so it keeps running after you leave.", ["pgrep", "pkill", "killall", "nohup", "bash", "kill -HUP $$"], {
          callout: { kind: "info", title: "A second window here", text: "On your VM, Lab 9 uses a second terminal window. Here, type <code>bash</code> to start a second shell instead. Closing a window sends SIGHUP to its shell, so close the second shell the same way: <code>kill -HUP $$</code>. Don't use <code>exit</code>: Bash doesn't hang up its jobs on exit, so both would survive." } }),
        workspace: base,
        tasks: [
          { id: "bulk", title: "Stop every copy", short: "<code>for i in 1 2 3; do sleep 700 &amp; done; pgrep -a -f 'sleep 700' &gt; reports/bulk-kill.txt</code>, then <code>pkill -15 -f 'sleep 700'</code>", detail: "Then <code>sleep 1; echo \"after pkill: $(pgrep -c -f 'sleep 700')\" &gt;&gt; reports/bulk-kill.txt</code>. pkill matches exactly what pgrep showed you.", check: file("reports/bulk-kill.txt", "^\\d+ sleep 700\\n\\d+ sleep 700\\n\\d+ sleep 700\\nafter pkill: 0") },
          { id: "killall", title: "The same with killall", short: "<code>for i in 1 2 3; do sleep 800 &amp; done; killall sleep &gt;&gt; reports/bulk-kill.txt 2&gt;&amp;1</code>, then <code>echo \"after killall: $(pgrep -c -u $USER -x sleep)\" &gt;&gt;</code> it", detail: "killall tries every process called sleep. The <em>Operation not permitted</em> line is root's sleep, which you can't touch.", check: file("reports/bulk-kill.txt", "after pkill: 0[\\s\\S]*Operation not permitted[\\s\\S]*after killall: 0") },
          { id: "second", title: "Start two jobs in a second shell", short: "<code>bash</code>, then <code>nohup bin/fake-backup.sh &gt; reports/backup.out 2&gt;&amp;1 &amp;</code> and <code>sleep 901 &amp;</code>", check: { type: "all", checks: [ev("spawn", { comm: "^sleep$", args: "sleep 901" }), hist("^bash$", "^nohup bin/fake-backup\\.sh")] } },
          { id: "close", title: "Close it like a window", command: "kill -HUP $$", detail: "You're back in the first shell (<code>echo $$</code> shows 2201 again).", check: ev("signal", { sig: "^HUP$", comm: "^bash$" }) },
          { id: "check", title: "See which job survived", short: "<code>pgrep -a -f 'fake-backup|sleep 901' &gt; reports/nohup.txt</code>, then <code>pkill -f bin/fake-backup</code>", detail: "nohup made the backup ignore the hangup; sleep 901 got it and ended.", check: { type: "all", checks: [file("reports/nohup.txt", "fake-backup\\.sh", "sleep 901"), hist("^pkill -f bin/fake-backup")] } },
        ],
        quiz: [
          { id: "nohupbg", prompt: "<code>nohup ./long.sh</code> (no &amp;). What happens?", answer: "fg", explain: "Correct. nohup only ignores SIGHUP; you still need & to get the prompt back.", options: [{ value: "fg", label: "It runs in the foreground, ignoring hangups" }, { value: "bg", label: "It runs in the background" }, { value: "err", label: "nohup refuses without &" }] },
          { id: "out", prompt: "Where does nohup put the output if you don't redirect it?", answer: "nohup", explain: "Correct. Or ~/nohup.out if it can't write in the current folder.", options: [{ value: "nohup", label: "nohup.out in the current folder" }, { value: "null", label: "/dev/null" }, { value: "log", label: "/var/log/nohup.log" }] },
          { id: "killall", prompt: "Why be careful with killall as root?", answer: "all", explain: "Correct. It matches every process with that exact name on the system.", options: [{ value: "all", label: "It hits every process with that name, system services included" }, { value: "slow", label: "It's slow" }, { value: "9", label: "It always sends KILL" }] },
        ],
        challenge: {
          prompt: "Send TERM to every process whose full command line contains <code>sleep 700</code>.",
          check: { accept: ["pkill -f 'sleep 700'", "pkill -f \"sleep 700\"", "pkill -15 -f 'sleep 700'", "pkill -TERM -f 'sleep 700'", "pkill -f -15 'sleep 700'", "pkill -15 -f \"sleep 700\""] },
          correct: "Correct. Preview it first with pgrep -a -f.",
          incorrect: "Use pkill with the full-command-line option.",
        },
        memoryHook: "Preview with <code>pgrep -a</code>, then <code>pkill</code> the same pattern. A closing terminal sends HUP; <code>nohup … &amp;</code> survives it.",
        completion: "You can clean up by name and keep jobs alive.",
      },

      /* ---------------------------------------------------------- 11.6 */
      {
        id: "11.6", title: "Priorities and watching", navSubtitle: "nice, renice, top r, watch (Labs 10–12)", objective: "103.6", difficulty: "Advanced",
        source: "Labs 10–12: Start a job at low priority; lower a running hog's priority; watch a queue drain",
        summary: "Start jobs with nice values, change a running process with renice and from top, and watch a count fall to zero.",
        ticket: ticket("Shared server team", "Run tonight's report at low priority, and make a colleague's CPU hog give way without killing it. Then watch the migration workers finish.", ["nice", "renice", "top r", "watch"]),
        workspace: base,
        tasks: [
          { id: "nice", title: "Start jobs at three priorities", short: "<code>nice -n 19 sleep 900 &amp; nice sleep 901 &amp; sleep 902 &amp;</code>, then <code>ps -l | head -1 &gt; reports/nice.txt; ps -l | grep sleep &gt;&gt; reports/nice.txt</code>", detail: "Then try <code>nice -n -5 sleep 1 &gt;&gt; reports/nice.txt 2&gt;&amp;1</code> (only root may go below 0) and clean up with <code>pkill -f 'sleep 90[0-2]'</code>.", check: file("reports/nice.txt", "PRI +NI[\\s\\S]*\\b99 +19\\b[\\s\\S]*\\b90 +10\\b[\\s\\S]*\\b80 +0\\b[\\s\\S]*cannot set niceness: Permission denied") },
          { id: "renice", title: "Lower the hog's priority", short: "<code>bin/cpu-hog.sh &amp; HOG=$!</code>, <code>renice -n 5 -p $HOG &gt; reports/renice.txt</code>, then try <code>renice -n -5 -p $HOG &gt;&gt; reports/renice.txt 2&gt;&amp;1</code>", detail: "Add <code>ps -o pid,ni,comm -p $HOG &gt;&gt; reports/renice.txt</code> after the first renice. A normal user can raise a nice value but not lower it again.", check: file("reports/renice.txt", "old priority 0, new priority 5[\\s\\S]* 5 cpu-hog\\.sh[\\s\\S]*Permission denied") },
          { id: "topr", title: "Renice it again from top", short: "<code>top</code>, <strong>L</strong> cpu-hog ⏎, <strong>r</strong> ⏎ (the default PID), <code>15</code> ⏎, <strong>q</strong>", detail: "Then <code>ps -o pid,ni,comm -p $HOG &gt;&gt; reports/renice.txt; kill $HOG</code>.", check: { type: "any", checks: [ev("top-renice", { comm: "cpu-hog", ni: "^15$" }), file("reports/renice.txt", "Permission denied[\\s\\S]* 15 cpu-hog\\.sh")] } },
          { id: "watch", title: "Watch the workers finish", short: "<code>for i in 1 2 3; do sleep $((i*20)) &amp; done</code>, then <code>watch -n 2 'pgrep -c -u $USER -x sleep'</code>", detail: "The count falls from 3 to 0 over about a minute. Press <strong>^C</strong> to leave watch, then <code>echo \"workers left: $(pgrep -c -u $USER -x sleep)\" &gt; reports/watch.txt</code>.", check: { type: "all", checks: [file("reports/watch.txt", "^workers left: 0$"), hist("^watch ")] } },
        ],
        quiz: [
          { id: "range", prompt: "Which nice value gives the highest priority?", answer: "-20", options: ["-20", "0", "19", "20"], explain: "Correct. Higher numbers are nicer to everyone else." },
          { id: "default", prompt: "<code>nice sleep 60</code> starts sleep at nice…", answer: "10", options: ["10", "0", "19", "-10"], explain: "Correct. nice with no value adds 10." },
          { id: "minus5", prompt: "<code>nice -5 cmd</code> means…", answer: "plus", explain: "Correct. Use nice -n -5 (or nice --5) for a negative value, as root.", options: [{ value: "plus", label: "Nice value 5" }, { value: "minus", label: "Nice value -5" }, { value: "err", label: "An error" }] },
        ],
        challenge: {
          prompt: "Make the running process 4321 nicer, with a nice value of 10.",
          check: { accept: ["renice -n 10 -p 4321", "renice 10 4321", "renice -n 10 4321", "renice 10 -p 4321", "renice +10 4321", "renice +10 -p 4321"] },
          correct: "Correct.",
          incorrect: "renice changes a running process; nice only starts new ones.",
        },
        memoryHook: "<code>nice -n N cmd</code> starts a new process, <code>renice -n N -p PID</code> changes a running one. -20 highest, 19 lowest; only root goes down. ps -l PRI = 80 + NI; top PR = 20 + NI.",
        completion: "You can control who gets the CPU.",
      },

      /* ---------------------------------------------------------- 11.7 */
      {
        id: "11.7", title: "tmux and screen", navSubtitle: "sessions, splits, detach (Labs 13–14)", objective: "103.5", difficulty: "Advanced",
        source: "Labs 13 and 14: Run a patch session in tmux; run the nightly job in GNU screen",
        summary: "Start named sessions, split them into panes and regions, detach, list them, reattach and close them, in tmux and in screen.",
        ticket: ticket("Patch lead", "You're patching over a flaky connection. Work inside tmux so the work keeps running if you drop, and do the same with screen on the old jump host.", ["tmux", "screen"], { callout: muxNote }),
        workspace: base,
        tasks: [
          { id: "tnew", title: "Start a tmux session running top", short: "<code>tmux new -s patching</code>, then <code>top</code>", detail: "top keeps running in the first pane while you split.", check: ev("mux", { kind: "tmux", action: "^new$", session: "^patching$" }) },
          { id: "tsplit", title: "Split it two ways", short: "<strong>Ctrl+B</strong> then <strong>%</strong> (side by side), <strong>Ctrl+B</strong> then <strong>\"</strong> (top and bottom); run <code>uptime</code> in a new pane", detail: "Move between panes with Ctrl+B and an arrow.", check: ev("mux", { kind: "tmux", action: "^split", panes: "^3$" }) },
          { id: "tls", title: "Detach and list", short: "<strong>Ctrl+B</strong> then <strong>d</strong>, then <code>tmux ls &gt; reports/tmux.txt</code>", detail: "Everything in the session keeps running.", check: file("reports/tmux.txt", "^patching: 1 windows \\(created [^)]+\\)") },
          { id: "tclose", title: "Reattach and close", short: "<code>tmux attach -t patching</code>, <strong>Ctrl+B</strong> then <strong>&amp;</strong>, <strong>y</strong>, then <code>tmux ls &gt;&gt; reports/tmux.txt 2&gt;&amp;1</code>", detail: "Closing the window ends the session's programs too.", check: file("reports/tmux.txt", "^patching: 1 windows[\\s\\S]*no server running") },
          { id: "snew", title: "Run the backup inside screen", short: "<code>screen -S nightly</code>, <code>bin/fake-backup.sh</code>, <strong>Ctrl+A</strong> then <strong>d</strong>, then <code>screen -ls &gt; reports/screen.txt</code> and <code>screen -r nightly</code>", check: file("reports/screen.txt", "\\d+\\.nightly\\t\\([^)]+\\)\\t\\(Detached\\)") },
          { id: "sregions", title: "Split and add a window", short: "<strong>Ctrl+A</strong> <strong>S</strong>, <strong>Ctrl+A</strong> <strong>Tab</strong>, <strong>Ctrl+A</strong> <strong>c</strong>, run <code>top</code>; then <strong>Ctrl+A</strong> <strong>|</strong> and <strong>Ctrl+A</strong> <strong>A</strong> to rename", detail: "A new region stays empty until you press c or pick a window for it.", check: ev("mux", { kind: "screen", action: "^new-window$" }) },
          { id: "squit", title: "Kill a window, then quit", short: "<strong>Ctrl+A</strong> <strong>k</strong> <strong>y</strong>, <strong>Ctrl+A</strong> <strong>\\</strong> <strong>y</strong>, then <code>screen -ls &gt;&gt; reports/screen.txt; pkill -f bin/fake-backup</code>", check: file("reports/screen.txt", "\\(Detached\\)[\\s\\S]*No Sockets found") },
        ],
        quiz: [
          { id: "prefix", prompt: "What is screen's prefix key?", answer: "a", options: [{ value: "a", label: "Ctrl+A" }, { value: "b", label: "Ctrl+B" }, { value: "x", label: "Ctrl+X" }], explain: "Correct. tmux uses Ctrl+B." },
          { id: "detach", prompt: "After you detach from a session, the programs in it…", answer: "run", options: [{ value: "run", label: "Keep running" }, { value: "stop", label: "Are stopped" }, { value: "end", label: "End" }], explain: "Correct. Reattach with tmux attach or screen -r." },
          { id: "split", prompt: "In tmux, which key after the prefix splits side by side?", answer: "%", options: ["%", "\"", "|", "S"], explain: "Correct. \" splits top and bottom. In screen, | splits side by side and S top and bottom." },
        ],
        challenge: {
          prompt: "List the screen sessions on this machine.",
          check: { accept: ["screen -ls", "screen -list", "screen -l"] },
          correct: "Correct.",
          incorrect: "screen has a list option.",
        },
        memoryHook: "tmux: Ctrl+B, then % \" split, d detach, &amp; close; <code>tmux ls</code>, <code>tmux attach -t</code>. screen: Ctrl+A, then S | split, Tab move, c new, d detach, \\ quit; <code>screen -ls</code>, <code>screen -r</code>.",
        completion: "You can keep work alive across dropped connections.",
      },

      /* ---------------------------------------------------------- 11.C */
      {
        id: "11.C", navNumber: "C", title: "Challenge exam: process triage", navSubtitle: "No notes", objective: "103.5", difficulty: "Hard",
        source: "Scenario-Based Challenge Exam", noHints: true, tasksHeading: "Tasks",
        summary: "The workbook's challenge tasks, checked by your reports, your commands and what happened to the processes.",
        ticket: ticket("Operations manager", "Work the queue of process tickets, and leave nothing running when you're done.", ["ps", "pgrep", "kill", "nice", "nohup", "tmux"], { heading: "Ticket: process triage", callout: keysNote }),
        workspace: base,
        tasks: [
          { id: "c1", title: "Save the load averages, CPU count and available memory to reports/challenge-health.txt", check: file("reports/challenge-health.txt", "^(?=[\\s\\S]*(load average|\\d\\.\\d\\d \\d\\.\\d\\d \\d\\.\\d\\d))(?=[\\s\\S]*^2$)(?=[\\s\\S]*available)") },
          { id: "c2", title: "Start the fake backup in the foreground, suspend it, resume it in the background, and show its job number and PID", check: { type: "all", checks: [hist("^(\\./)?bin/fake-backup\\.sh$", "^bg\\b"), out("^\\[\\d+\\][-+ ] +\\d+ Running +bin/fake-backup\\.sh &")] } },
          { id: "c3", title: "Pause the backup with a signal, prove it is stopped, and resume it", check: hist("^kill -(STOP|SIGSTOP|19|s STOP|s SIGSTOP|s 19) ", "^(ps|jobs)\\b", "^kill -(CONT|SIGCONT|18|s CONT|s SIGCONT|s 18) ") },
          { id: "c4", title: "Start the stubborn script, show the default signal doesn't stop it, then stop it for good", check: { type: "all", checks: [hist("^kill (%\\d+|\\d+)$|^kill -(15|TERM|SIGTERM) |^pkill (-15 )?-f .*stubborn"), ev("signal", { sig: "^KILL$", comm: "stubborn" })] } },
          { id: "c5", title: "Start three sleep 600 jobs, preview the match, and end all of them with one command", check: { type: "all", checks: [hist("^pgrep .*sleep"), ev("signal", { comm: "^sleep$", by: "pkill|killall" })] } },
          { id: "c6", title: "Start the CPU hog at nice 10, then lower its priority further to 15 while it runs", check: { type: "all", checks: [hist("nice (-n ?10|-10) .*cpu-hog"), ev("renice", { comm: "cpu-hog", ni: "^15$" })] } },
          { id: "c7", title: "Start a backup that survives closing the terminal, with its output in reports/challenge-backup.out", check: { type: "all", checks: [ev("spawn", { comm: "fake-backup", nohup: "yes" }), exists("reports/challenge-backup.out")] } },
          { id: "c8", title: "Start a named tmux session running top, detach, prove it still exists, then reattach and close it", check: { type: "all", checks: [hist("^tmux (ls|list-sessions)$"), ev("mux", { kind: "tmux", action: "^end$" })] } },
        ],
        quiz: [],
        completion: "Triage complete.",
      },
    ],

    review: {
      traps: [
        "Mixing up ps styles. `ps aux` is BSD style, `ps -ef` and `ps -elf` are UNIX style, and long options use two dashes.",
        "Forgetting the default signal. kill, pkill and killall send 15 (SIGTERM) unless told otherwise.",
        "Expecting SIGKILL or SIGSTOP to be caught. 9 and 19 can't be ignored; 1, 2 and 15 can.",
        "Leaving out the percent sign. `kill %2` is job 2; `kill 2` is PID 2.",
        "Confusing Ctrl+Z and Ctrl+C. Ctrl+Z suspends the job; Ctrl+C sends SIGINT and usually ends it.",
        "Thinking nohup backgrounds a job. It only ignores SIGHUP; add & to get your prompt back. Output goes to nohup.out.",
        "Running killall casually. It matches every process with that exact name, and as root that can include system services.",
        "Matching the wrong thing with pgrep or pkill. They match the process name by default; -f matches the whole command line.",
        "Reading nice values backwards. -20 is the highest priority and 19 the lowest; a higher number is nicer to others.",
        "Misreading `nice -5`. It means +5. A negative value needs `nice -n -5` or `nice --5`, and root.",
        "Forgetting nice's default. nice with no value adds 10.",
        "Expecting a normal user to raise priority. Only root can set a negative nice value or lower an existing one.",
        "Mixing up the multiplexer prefixes. tmux uses Ctrl+B (% and \" split, d detaches); screen uses Ctrl+A (S and | split, d detaches).",
        "Reading free's free column as usable memory. The available column is the one that matters.",
      ],
      trapQuiz: [
        { id: "t1", prompt: "Which ends job 3?", answer: "pct", options: [{ value: "pct", label: "<code>kill %3</code>" }, { value: "num", label: "<code>kill 3</code>" }, { value: "j", label: "<code>kill -j 3</code>" }], explain: "Correct. kill 3 would target PID 3." },
        { id: "t2", prompt: "A process ignores <code>kill 4321</code>. What's the last resort?", answer: "9", options: [{ value: "9", label: "<code>kill -9 4321</code>" }, { value: "1", label: "<code>kill -1 4321</code>" }, { value: "19", label: "<code>kill -19 4321</code>" }], explain: "Correct. 19 would only pause it." },
        { id: "t3", prompt: "Which starts a job at the lowest priority?", answer: "19", options: [{ value: "19", label: "<code>nice -n 19 job</code>" }, { value: "-20", label: "<code>nice -n -20 job</code>" }, { value: "r", label: "<code>renice 19 job</code>" }], explain: "Correct. renice takes a PID, not a command." },
        { id: "t4", prompt: "You need to keep a migration running after your VPN drops. Which?", answer: "nohup", options: [{ value: "nohup", label: "<code>nohup ./migrate.sh &amp;</code>" }, { value: "bg", label: "<code>./migrate.sh</code>, then Ctrl+Z" }, { value: "nice", label: "<code>nice ./migrate.sh &amp;</code>" }], explain: "Correct. tmux or screen would also work." },
        { id: "t5", prompt: "In tmux, how do you detach?", answer: "bd", options: [{ value: "bd", label: "Ctrl+B, then d" }, { value: "ad", label: "Ctrl+A, then d" }, { value: "x", label: "Type exit" }], explain: "Correct. exit would close the pane." },
      ],
      challenge: {
        intro: "On your Linux Mint VM, without notes, inside ~/lpic1-section11. Make sure <code>jobs</code> and <code>pgrep -a -f bin/</code> show nothing running before you begin.",
        tasks: [
          "Save the load averages, CPU count and available memory to `reports/challenge-health.txt`.",
          "Start the fake backup in the foreground, suspend it, resume it in the background, and show its job number and PID.",
          "Pause the backup with a signal, prove it is stopped, and resume it.",
          "Start the stubborn script, show that the default signal does not stop it, and then stop it for good.",
          "Start three `sleep 600` jobs and end all of them with one command, after previewing the match.",
          "Start the CPU hog at nice 10, then lower its priority further to 15 while it runs.",
          "Start a backup that will survive closing the terminal, with its output in `reports/challenge-backup.out`.",
          "Start a named tmux session running top, detach, prove it still exists, then reattach and close it.",
        ],
        outro: "Your final handoff is the reports directory. For each file, write a short sentence explaining what it proves, and confirm that no practice processes are still running.",
      },
      questions: [
        { q: "Service desk request: “The workstation is slow. Tell me the load averages and what is using the most CPU.”", a: "<code>uptime</code> (compare with <code>nproc</code>), then <code>top</code> sorted by CPU (P), or <code>ps aux --sort=-%cpu | head</code>." },
        { q: "Storage team request: “Pause the backup while we fail over the disk, then let it carry on from where it stopped.”", a: "<code>kill -STOP PID</code>, check with <code>ps -o pid,stat,comm -p PID</code> (T), then <code>kill -CONT PID</code>." },
        { q: "On-call request: “The service ignores a normal stop. Get rid of it, but only after trying the polite way.”", a: "<code>kill PID</code> (TERM), wait and check, then <code>kill -9 PID</code>." },
        { q: "Operations request: “A bad cron entry started a dozen copies of the same job. Stop them all.”", a: "Preview with <code>pgrep -a -f 'job'</code>, then <code>pkill -f 'job'</code> with the same pattern." },
        { q: "Change manager request: “Start the long migration now and make sure it keeps going when your VPN drops.”", a: "<code>nohup ./migrate.sh &gt; migrate.log 2&gt;&amp;1 &amp;</code>, or run it inside <code>tmux new -s migrate</code> and detach." },
        { q: "Shared server request: “Someone’s script is hogging a CPU. Don’t kill it; make it give way to everyone else.”", a: "<code>renice -n 19 -p PID</code> (or <strong>r</strong> in top). Raising the nice value is allowed for your own processes; for someone else's you need root." },
        { q: "Team lead request: “Start tonight’s report job at the lowest possible priority.”", a: "<code>nice -n 19 ./report.sh &amp;</code>" },
      ],
      mastery: [
        "I can list processes with ps, ps -ef, ps -elf and ps aux, and choose columns with ps -o.",
        "I can find processes by name, user, terminal and full command line with pgrep.",
        "I can read uptime, the load averages and free -h, and explain the available column.",
        "I can sort top by CPU and memory, filter it, renice from it, and save a batch-mode snapshot.",
        "I can start a job with &, suspend it with Ctrl+Z, and move it with bg and fg using job numbers.",
        "I can list jobs with jobs and jobs -l and match job numbers to PIDs.",
        "I can name and number HUP, INT, KILL, TERM, STOP and CONT, and list all signals with kill -l.",
        "I can send signals with kill by PID or by %job, and with pkill and killall by name.",
        "I can explain why TERM may be ignored and when KILL is the right choice.",
        "I can keep a job running after logout with nohup and say where its output goes.",
        "I can start a process with nice, change it with renice, and explain the nice range and the root-only limits.",
        "I can create, split, detach from, list and reattach to tmux and screen sessions.",
      ],
    },
  });
})();
