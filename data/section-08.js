/* Section 8: Compression, archives and dd (103.3). From "LPIC Section 8.docx". */
(function () {
  const WS = "~/lpic-section8";
  const FILES = {
    [WS + "/logs/incident.log"]: "CRITICAL auth failure on web01\nINFO backup completed\nWARNING disk usage high\n",
    [WS + "/logs/incident-copy.log"]: "CRITICAL auth failure on web01\nINFO backup completed\nWARNING disk usage high\n",
    [WS + "/configs/webapp.conf"]: "server_name=web01\nport=8080\nmode=production\n",
    [WS + "/configs/webapp-copy.conf"]: "server_name=web01\nport=8080\nmode=production\n",
    [WS + "/images/mock-disk.img"]: "\0".repeat(5 * 1048576),
    [WS + "/backups/"]: null, [WS + "/restore/"]: null,
  };
  const base = { user: "max", host: "linux-mint", cwd: WS, files: FILES };
  const ticket = (requestedBy, body, tools, extra = {}) => ({ requestedBy, system: "Linux Mint VM", badge: "IT engineer", tools, body, ...extra });
  const pat = (re) => ({ type: "pattern", re });
  const file = (name, re, not) => ({ type: "file", path: WS + "/" + name, re, not });
  const gone = (name) => ({ type: "file", path: WS + "/" + name, exists: false });
  const out = (re) => ({ type: "output", re });
  const hist = (...includes) => ({ type: "history", includes });
  const sizesNote = { kind: "info", title: "About sizes here", text: "Compressed sizes in the practice terminal are close estimates. On your VM the exact numbers differ, and for files this small, the compressed version can even be bigger than the original." };

  LPIC.section({
    id: "section-08",
    number: 8,
    title: "Compression, Archives and dd",
    objectives: ["103.3"],
    kind: "terminal",
    source: "LPIC Section 8.docx",
    scenario: "You're an IT engineer packaging incident evidence, backing up configs before maintenance, building handoff bundles, archiving only selected files, and practising byte-level copies safely on a mock disk image.",
    overview: {
      paragraphs: [
        "Read the scenario, decide what evidence you need, run the safest command that answers it, and prove the result. Anything risky in production stays simulated.",
        "On your VM, the workbook's Lab Setup creates <code>~/lpic-section8</code> with logs, configs, an empty <code>backups</code> and <code>restore</code>, and a 5 MB mock disk image made with <code>dd</code>. The practice terminal already has them.",
      ],
      commands: ["gzip", "gunzip", "zcat", "bzip2", "bunzip2", "bzcat", "xz", "unxz", "xzcat", "-k", "-c", "-d", "file", "tar -cf", "tar -tf", "tar -xf", "tar -C", "tar -z -j -J", "cpio -o", "cpio -i", "cpio -t", "dd if= of= bs= count=", "cmp", "lsblk", "ls -lh"],
      memoryHook: "<code>gzip</code> is quick, <code>bzip2</code> often smaller, <code>xz</code> smallest. <code>zcat</code>/<code>bzcat</code>/<code>xzcat</code> read without extracting. <code>tar</code> bundles; <code>cpio</code> takes its file list on standard input. <code>dd</code> copies bytes, so check <code>if=</code> and <code>of=</code> twice.",
    },

    lessons: [
      /* ---------------------------------------------------------- 8.1 */
      {
        id: "8.1", title: "Compress incident evidence", navSubtitle: "gzip, bzip2, xz, -k", objective: "103.3", difficulty: "Beginner",
        source: "Lab 1: Compress incident evidence safely",
        summary: "Compress a copy of a log three ways, see the original disappear, and keep it with <code>-k</code>.",
        ticket: ticket("Application owner", "During the incident bridge, package a copy of the incident log for the handoff without wasting space. Compare gzip, bzip2 and xz.", ["gzip", "bzip2", "xz", "ls -lh", "file"], { callout: sizesNote }),
        workspace: base,
        tasks: [
          { id: "gzip", title: "Copy, then gzip", short: "<code>cp logs/incident.log backups/incident-bridge.log</code>, then <code>gzip backups/incident-bridge.log</code>", detail: "Run <code>ls backups</code>: the .log is gone and a .log.gz took its place. gzip replaces the original by default.", check: { type: "all", checks: [file("backups/incident-bridge.log.gz"), gone("backups/incident-bridge.log")] } },
          { id: "keep", title: "Keep the original this time", short: "Copy again, then <code>bzip2 -k</code> and <code>xz -k</code>", detail: "<code>cp logs/incident.log backups/incident-bridge.log</code>, then <code>bzip2 -k backups/incident-bridge.log</code> and <code>xz -k backups/incident-bridge.log</code>. <code>-k</code> keeps the source.", check: { type: "all", checks: [file("backups/incident-bridge.log.bz2"), file("backups/incident-bridge.log.xz"), file("backups/incident-bridge.log")] } },
          { id: "compare", title: "Compare sizes and types", short: "<code>ls -lh backups</code> and <code>file backups/incident-bridge.log.*</code>", detail: "<code>file</code> names each format from the data inside.", check: { type: "all", checks: [hist("^ls -l\\w* backups/?$"), { type: "history", includes: ["^file backups/incident-bridge\\.log\\.\\*$|^file .*\\.gz .*\\.bz2 .*\\.xz"] }] } },
        ],
        quiz: [
          { id: "keepq", prompt: "What happens to <code>report.txt</code> after <code>gzip report.txt</code>?", answer: "replaced", explain: "Correct. gzip, bzip2 and xz replace the original unless you use -k (or -c).",
            options: [{ value: "replaced", label: "It's replaced by report.txt.gz" }, { value: "kept", label: "It stays alongside report.txt.gz" }, { value: "moved", label: "It moves to /tmp" }] },
          { id: "smallest", prompt: "Which usually gives the smallest file on large data?", answer: "xz", explain: "Correct. xz usually compresses best; gzip is fastest.",
            options: ["gzip", "bzip2", "xz"] },
        ],
        challenge: {
          prompt: "Compress <code>logs/incident-copy.log</code> with gzip but keep the original.",
          check: { accept: ["gzip -k logs/incident-copy.log", "gzip --keep logs/incident-copy.log"] },
          correct: "Correct. -k keeps the source.",
          incorrect: "gzip needs the keep option.",
        },
        memoryHook: "Endings: <code>.gz</code> gzip, <code>.bz2</code> bzip2, <code>.xz</code> xz. Undo with <code>gunzip</code>, <code>bunzip2</code>, <code>unxz</code> (or <code>-d</code>).",
        completion: "You can compress files and keep the originals when you need to.",
      },

      /* ---------------------------------------------------------- 8.2 */
      {
        id: "8.2", title: "Read compressed logs", navSubtitle: "zcat, bzcat, xzcat", objective: "103.3", difficulty: "Beginner",
        source: "Lab 2: Read compressed logs without extracting them",
        summary: "Search inside compressed files without extracting them, and check the real format when an extension lies.",
        ticket: ticket("Teammate", "During an outage a teammate sends compressed logs and asks whether they mention CRITICAL. Don't extract anything into the working folder.", ["zcat", "bzcat", "xzcat", "grep", "file"]),
        workspace: { ...base, setup: ["cp logs/incident.log backups/incident-bridge.log", "gzip -k backups/incident-bridge.log", "bzip2 -k backups/incident-bridge.log", "xz backups/incident-bridge.log", "cp logs/incident.log backups/mystery", "xz backups/mystery", "mv backups/mystery.xz backups/teammate-notes.log"] },
        tasks: [
          { id: "xzcat", title: "Search the xz copy", command: "xzcat backups/incident-bridge.log.xz | grep CRITICAL", detail: "<code>xzcat</code> writes the uncompressed text to the screen (or a pipe) and leaves the file as it is.", check: { type: "all", checks: [pat("^xzcat backups/incident-bridge\\.log\\.xz \\| grep"), out("CRITICAL auth failure")] } },
          { id: "others", title: "Same search, other formats", short: "<code>zcat …gz</code> and <code>bzcat …bz2</code>", detail: "Each format has its own cat.", check: hist("^zcat backups/incident-bridge\\.log\\.gz", "^bzcat backups/incident-bridge\\.log\\.bz2") },
          { id: "wrong", title: "See the wrong tool fail", command: "zcat backups/incident-bridge.log.xz", detail: "zcat only reads gzip data.", check: pat("^zcat backups/incident-bridge\\.log\\.xz$") },
          { id: "lies", title: "A file whose name lies", short: "<code>file backups/teammate-notes.log</code>, then read it", detail: "It ends in .log but <code>file</code> says it's XZ data. Read it with <code>xzcat</code>.", check: { type: "all", checks: [hist("^file backups/teammate-notes\\.log$"), pat("^xzcat backups/teammate-notes\\.log"), out("CRITICAL|INFO|WARNING")] } },
        ],
        quiz: [
          { id: "bz", prompt: "Which reads a <code>.bz2</code> file without extracting it?", answer: "bzcat", explain: "Correct.", options: ["zcat", "bzcat", "xzcat", "cat -z"] },
          { id: "ext", prompt: "A file named <code>notes.log</code> won't open as text. What do you run first?", answer: "file", explain: "Correct. file reads the content and names the real format.",
            options: [{ value: "file", label: "<code>file notes.log</code>" }, { value: "rm", label: "<code>rm notes.log</code>" }, { value: "gunzip", label: "<code>gunzip notes.log</code>" }] },
        ],
        challenge: {
          prompt: "Count the WARNING lines in <code>backups/incident-bridge.log.bz2</code> without extracting it.",
          check: { accept: ["bzcat backups/incident-bridge.log.bz2 | grep -c WARNING", "bzcat backups/incident-bridge.log.bz2 | grep WARNING | wc -l", "bzip2 -dc backups/incident-bridge.log.bz2 | grep -c WARNING"] },
          correct: "Correct.",
          incorrect: "Pipe bzcat into grep -c.",
        },
        memoryHook: "<strong>z</strong>cat = g<strong>z</strong>ip, <strong>bz</strong>cat = <strong>bz</strong>ip2, <strong>xz</strong>cat = <strong>xz</strong>. Same as <code>gzip -dc</code>, <code>bzip2 -dc</code>, <code>xz -dc</code>.",
        completion: "You can read compressed files in place.",
      },

      /* ---------------------------------------------------------- 8.3 */
      {
        id: "8.3", title: "Build and verify a tar backup", navSubtitle: "tar -cf -tf -xf -C", objective: "103.3", difficulty: "Intermediate",
        source: "Lab 3: Build and verify a tar backup for a maintenance window",
        summary: "Bundle directories into one archive, list it before extracting, and extract into a safe folder.",
        ticket: ticket("Change manager", "Before the maintenance window, back up the configs and logs so the team can roll back. Prove what's in the archive before anyone restores it.", ["tar"]),
        workspace: base,
        tasks: [
          { id: "create", title: "Create the archive", command: "tar -cf backups/pre-maintenance.tar configs logs", detail: "<code>c</code> create, <code>f</code> the archive file name comes next. The originals stay.", check: file("backups/pre-maintenance.tar", "ustar") },
          { id: "list", title: "List before extracting", command: "tar -tf backups/pre-maintenance.tar", detail: "<code>t</code> lists. Add <code>v</code> for sizes and dates.", check: { type: "all", checks: [pat("^tar -t\\w*f backups/pre-maintenance\\.tar"), out("configs/webapp\\.conf"), out("logs/incident\\.log")] } },
          { id: "extract", title: "Extract into a safe folder", command: "tar -xf backups/pre-maintenance.tar -C restore", detail: "<code>x</code> extracts; <code>-C restore</code> extracts there instead of over your working files. Check with <code>ls -R restore</code>.", check: { type: "all", checks: [file("restore/configs/webapp.conf", "port=8080"), file("restore/logs/incident.log", "CRITICAL")] } },
          { id: "verbose", title: "See tar -v", command: "tar -tvf backups/pre-maintenance.tar", detail: "The long listing looks like <code>ls -l</code>.", check: pat("^tar -t?v?t?f? ?-?\\w*v\\w* .*pre-maintenance\\.tar|^tar -tvf ") },
        ],
        quiz: [
          { id: "t", prompt: "Which tar option lists an archive without extracting it?", answer: "t", explain: "Correct. List first, extract second.",
            options: [{ value: "t", label: "<code>-t</code>" }, { value: "x", label: "<code>-x</code>" }, { value: "c", label: "<code>-c</code>" }, { value: "v", label: "<code>-v</code>" }] },
          { id: "orig", prompt: "Does <code>tar -cf backup.tar configs</code> remove the configs folder?", answer: "no", explain: "Correct. tar copies into the archive; unlike gzip, it never removes the originals.",
            options: [{ value: "no", label: "No" }, { value: "yes", label: "Yes" }] },
        ],
        challenge: {
          prompt: "Extract <code>backups/pre-maintenance.tar</code> into the <code>restore</code> folder.",
          check: { accept: ["tar -xf backups/pre-maintenance.tar -C restore", "tar -xf backups/pre-maintenance.tar -C restore/", "tar -C restore -xf backups/pre-maintenance.tar", "tar xf backups/pre-maintenance.tar -C restore", "tar -xvf backups/pre-maintenance.tar -C restore"] },
          correct: "Correct.",
          incorrect: "Use tar's extract option with -C for the target folder.",
        },
        memoryHook: "<strong>c</strong>reate, <strong>t</strong>able of contents, e<strong>x</strong>tract; <strong>v</strong>erbose; <strong>f</strong> = the file comes next (keep it last in the group).",
        completion: "You can create, verify and restore tar backups.",
      },

      /* ---------------------------------------------------------- 8.4 */
      {
        id: "8.4", title: "Compressed tarballs", navSubtitle: "tar -z -j -J", objective: "103.3", difficulty: "Intermediate",
        source: "Lab 4: Create compressed tarballs for operational handoff",
        summary: "Build compressed archives in one step with <code>-z</code>, <code>-j</code> and <code>-J</code>, and verify each.",
        ticket: ticket("Incident manager", "One compressed handoff bundle with the config snapshot and the logs, in each of the three formats so the receiving team can pick.", ["tar -z", "tar -j", "tar -J"], { callout: sizesNote }),
        workspace: base,
        tasks: [
          { id: "gz", title: "gzip tarball", command: "tar -czf backups/handoff.tar.gz configs logs", detail: "lowercase <code>z</code> = gzip.", check: file("backups/handoff.tar.gz") },
          { id: "bz", title: "bzip2 tarball", command: "tar -cjf backups/handoff.tar.bz2 configs logs", detail: "lowercase <code>j</code> = bzip2.", check: file("backups/handoff.tar.bz2") },
          { id: "xz", title: "xz tarball", command: "tar -cJf backups/handoff.tar.xz configs logs", detail: "uppercase <code>J</code> = xz.", check: file("backups/handoff.tar.xz") },
          { id: "verify", title: "Verify all three", short: "<code>tar -tf</code> each one", detail: "When reading a file, GNU tar detects the compression on its own, so <code>tar -tf</code> works on all three. A wrong letter, such as <code>tar -tjf handoff.tar.gz</code>, fails.", check: hist("^tar -t\\w*f backups/handoff\\.tar\\.gz$", "^tar -t\\w*f backups/handoff\\.tar\\.bz2$", "^tar -t\\w*f backups/handoff\\.tar\\.xz$") },
        ],
        quiz: [
          { id: "J", prompt: "Which tar option compresses with xz?", answer: "J", explain: "Correct. z gzip, j bzip2, J xz.",
            options: [{ value: "z", label: "<code>-z</code>" }, { value: "j", label: "<code>-j</code>" }, { value: "J", label: "<code>-J</code>" }, { value: "x", label: "<code>-x</code>" }] },
          { id: "tgz", prompt: "What's a <code>.tgz</code> file?", answer: "targz", explain: "Correct. A short name for .tar.gz.",
            options: [{ value: "targz", label: "A gzip-compressed tar archive" }, { value: "tar", label: "An uncompressed tar archive" }, { value: "xz", label: "An xz file" }] },
        ],
        challenge: {
          prompt: "Create <code>backups/handoff.tar.xz</code> from <code>configs</code> and <code>logs</code>.",
          check: { accept: ["tar -cJf backups/handoff.tar.xz configs logs", "tar cJf backups/handoff.tar.xz configs logs", "tar -cJvf backups/handoff.tar.xz configs logs", "tar -Jcf backups/handoff.tar.xz configs logs"] },
          correct: "Correct. Uppercase J for xz.",
          incorrect: "Create with the xz option (uppercase).",
        },
        memoryHook: "<code>z</code> gzip, <code>j</code> bzip2, <code>J</code> xz. The capital letter goes with the strongest compression.",
        completion: "You can build and verify compressed tarballs.",
      },

      /* ---------------------------------------------------------- 8.5 */
      {
        id: "8.5", title: "Archive selected files with cpio", navSubtitle: "find | cpio -o, cpio -it", objective: "103.3", difficulty: "Intermediate to Advanced",
        source: "Lab 5: Use cpio from a file list",
        summary: "Feed <code>cpio</code> a list of files from <code>find</code>, write the archive with a redirect, and list or extract it.",
        ticket: ticket("Project lead", "Before a small application change, preserve only the regular files in configs and logs, not the whole directories.", ["find", "cpio"]),
        workspace: base,
        tasks: [
          { id: "list", title: "Preview the file list", command: "find configs logs -type f", detail: "This list is exactly what cpio will archive.", check: pat("^find configs logs -type f$") },
          { id: "create", title: "Create the cpio archive", command: "find configs logs -type f | cpio -o > backups/selected-files.cpio", detail: "<code>-o</code> is copy-out: names come in on standard input, the archive goes out on standard output, and <code>&gt;</code> saves it. cpio prints the block count.", check: file("backups/selected-files.cpio", "^070701") },
          { id: "listarch", title: "List the archive", command: "cpio -itv -I backups/selected-files.cpio", detail: "<code>-i</code> copy-in, <code>-t</code> list only, <code>-I</code> read from this file (or use <code>&lt;</code>).", check: { type: "all", checks: [pat("^cpio -i\\w*t|^cpio -t\\w*"), out("configs/webapp\\.conf"), out("logs/incident\\.log")] } },
          { id: "extract", title: "Extract into restore", short: "<code>cd restore</code>, then <code>cpio -id &lt; ../backups/selected-files.cpio</code>", detail: "<code>-d</code> creates the directories the paths need.", check: { type: "all", checks: [file("restore/configs/webapp.conf"), file("restore/logs/incident.log")] } },
        ],
        quiz: [
          { id: "from", prompt: "Where does <code>cpio -o</code> get the names of files to archive?", answer: "stdin", explain: "Correct. Usually from find through a pipe.",
            options: [{ value: "stdin", label: "From standard input, one name per line" }, { value: "args", label: "From its command-line arguments" }, { value: "dir", label: "From the current directory automatically" }] },
          { id: "itv", prompt: "Which lists a cpio archive's contents?", answer: "it", explain: "Correct. -i copy-in with -t means list only.",
            options: [{ value: "it", label: "<code>cpio -it &lt; archive.cpio</code>" }, { value: "o", label: "<code>cpio -o &lt; archive.cpio</code>" }, { value: "tf", label: "<code>cpio -tf archive.cpio</code>" }] },
        ],
        challenge: {
          prompt: "Archive every regular file under <code>configs</code> into <code>backups/configs.cpio</code> with cpio.",
          check: { accept: ["find configs -type f | cpio -o > backups/configs.cpio", "find configs -type f | cpio -ov > backups/configs.cpio", "find configs -type f | cpio -o -O backups/configs.cpio", "find configs/ -type f | cpio -o > backups/configs.cpio"] },
          correct: "Correct. find makes the list, cpio -o makes the archive, > saves it.",
          incorrect: "Pipe find's list into cpio's copy-out mode and redirect to the file.",
        },
        memoryHook: "<code>cpio -o</code> = <strong>o</strong>ut to an archive. <code>cpio -i</code> = <strong>i</strong>n from an archive. <code>-t</code> lists, <code>-d</code> makes directories, <code>-v</code> shows names.",
        completion: "You can archive just the files a list names.",
      },

      /* ---------------------------------------------------------- 8.6 */
      {
        id: "8.6", title: "Practise dd safely", navSubtitle: "dd if= of= bs= count=, cmp", objective: "103.3", difficulty: "Advanced",
        source: "Lab 6: Practice dd safely with a mock disk image",
        summary: "Copy a mock disk image byte for byte with <code>dd</code>, prove the copy matches with <code>cmp</code>, and learn to check devices first.",
        ticket: ticket("Security analyst", "Make a byte-level copy of a small evidence image for training, without going near a real disk.", ["dd", "cmp", "lsblk", "ls -lh"], {
          callout: { kind: "warn", title: "dd has no undo", text: "Swapping <code>if=</code> (input) and <code>of=</code> (output) overwrites the good copy. On a real system, check device names with <code>lsblk</code> first. This terminal refuses to let dd touch a device." } }),
        workspace: base,
        tasks: [
          { id: "lsblk", title: "Look before you copy", command: "lsblk", detail: "Know which devices exist. Here you'll only use image files.", check: pat("^lsblk") },
          { id: "copy", title: "Copy the image", command: "dd if=images/mock-disk.img of=backups/mock-disk-copy.img bs=1M status=progress", detail: "<code>if=</code> input file, <code>of=</code> output file, <code>bs=</code> block size. dd reports records in and out.", check: file("backups/mock-disk-copy.img") },
          { id: "cmp", title: "Prove the copy matches", command: "cmp images/mock-disk.img backups/mock-disk-copy.img", detail: "No output means identical. <code>ls -lh</code> both files to compare sizes.", check: { type: "all", checks: [pat("^cmp images/mock-disk\\.img backups/mock-disk-copy\\.img"), { type: "file", path: WS + "/backups/mock-disk-copy.img", re: "^\\0{100}" }] } },
          { id: "count", title: "Copy only part", command: "dd if=images/mock-disk.img of=backups/first-2mb.img bs=1M count=2", detail: "<code>count=</code> limits how many blocks are copied. Then <code>cmp</code> the two images to see where they differ.", check: pat("count=2") },
          { id: "zero", title: "Make a new blank image", command: "dd if=/dev/zero of=images/blank.img bs=1M count=1", detail: "<code>/dev/zero</code> supplies zero bytes; the workbook's setup made the mock disk the same way.", check: pat("^dd if=/dev/zero of=\\S+ ") },
        ],
        quiz: [
          { id: "ifof", prompt: "In <code>dd if=A of=B</code>, which file gets overwritten?", answer: "B", explain: "Correct. if is input, of is output.",
            options: [{ value: "B", label: "B" }, { value: "A", label: "A" }, { value: "both", label: "Neither; dd only reads" }] },
          { id: "cmpq", prompt: "<code>cmp a.img b.img</code> prints nothing. What does that mean?", answer: "same", explain: "Correct. cmp only speaks up about differences.",
            options: [{ value: "same", label: "The files are identical" }, { value: "fail", label: "cmp failed" }, { value: "empty", label: "Both files are empty" }] },
        ],
        challenge: {
          prompt: "Copy <code>images/mock-disk.img</code> to <code>backups/evidence.img</code> with dd, using 1 MB blocks.",
          check: { accept: ["dd if=images/mock-disk.img of=backups/evidence.img bs=1M", "dd if=images/mock-disk.img of=backups/evidence.img bs=1M status=progress", "dd bs=1M if=images/mock-disk.img of=backups/evidence.img", "dd if=images/mock-disk.img bs=1M of=backups/evidence.img"] },
          correct: "Correct.",
          incorrect: "Use if= for the source, of= for the copy, and bs=1M.",
        },
        memoryHook: "<strong>i</strong>f = <strong>i</strong>nput, <strong>o</strong>f = <strong>o</strong>utput. Read the line back left to right before you press Enter.",
        completion: "You can use dd safely and prove copies match.",
      },

      /* ---------------------------------------------------------- 8.C */
      {
        id: "8.C", navNumber: "C", title: "Challenge exam: evidence bundle", navSubtitle: "No notes", objective: "103.3", difficulty: "Hard",
        source: "Scenario-Based Challenge Exam", noHints: true, tasksHeading: "Tasks",
        summary: "The workbook's five challenge tasks, checked by what's on disk and what you ran.",
        ticket: ticket("Incident commander", "Package and verify the incident evidence. Don't extract anything you only need to read, and prove each copy.", ["tar", "file", "xzcat", "cpio", "dd", "cmp"], { heading: "Ticket: evidence bundle" }),
        workspace: { ...base, setup: ["cp logs/incident.log backups/x", "xz backups/x", "mv backups/x.xz backups/shift-log.log"] },
        tasks: [
          { id: "c1", title: "backups/challenge.tar.xz: configs and logs, xz-compressed; prove it holds both", check: { type: "all", checks: [file("backups/challenge.tar.xz"), hist("^tar -?t\\w*f backups/challenge\\.tar\\.xz")] } },
          { id: "c2", title: "backups/shift-log.log was renamed by a teammate. Identify its real type without extracting it", check: { type: "all", checks: [hist("^file backups/shift-log\\.log$")] } },
          { id: "c3", title: "Search that file for WARNING without creating an extracted copy", check: { type: "all", checks: [pat("^xzcat backups/shift-log\\.log \\| grep|^xz -dc backups/shift-log\\.log \\| grep"), out("WARNING disk usage high"), file("backups/shift-log.log")] } },
          { id: "c4", title: "backups/challenge.cpio from a find-generated list, and list its contents", check: { type: "all", checks: [file("backups/challenge.cpio", "^070701"), hist("^cpio -i\\w*t|^cpio -t")] } },
          { id: "c5", title: "Copy the mock disk image with dd to backups/challenge.img and prove it matches", check: { type: "all", checks: [file("backups/challenge.img"), hist("^cmp images/mock-disk\\.img backups/challenge\\.img$|^cmp backups/challenge\\.img images/mock-disk\\.img$")] } },
        ],
        quiz: [],
        completion: "Evidence bundle packaged and verified.",
      },
    ],

    review: {
      traps: [
        "gzip, bzip2 and xz replace the original file by default. Use `-k` to keep it, or `-c` to write to standard output.",
        "`zcat` reads gzip, `bzcat` bzip2 and `xzcat` xz. Mixing them up fails.",
        "`tar -x` extracts and `tar -t` lists. List first, extract second, ideally into a safe folder with `-C`.",
        "tar's compression letters: `-z` gzip, `-j` bzip2, `-J` xz.",
        "Keep `f` last in a tar option group, because the archive name follows it: `tar -czf file.tgz dir`.",
        "tar doesn't remove the originals. gzip does.",
        "`cpio -o` reads file names from standard input and writes the archive to standard output; forgetting the pipe or the redirect is a common mistake.",
        "An extension doesn't prove the format. `file` reads the content.",
        "`dd` has no confirmation. Check `if=` and `of=` and the device name (with `lsblk`) before pressing Enter.",
        "`cmp` prints nothing when files match.",
      ],
      trapQuiz: [
        { id: "t1", prompt: "Which keeps <code>big.log</code> and also creates <code>big.log.xz</code>?", answer: "k", options: [{ value: "k", label: "<code>xz -k big.log</code>" }, { value: "d", label: "<code>xz -d big.log</code>" }, { value: "plain", label: "<code>xz big.log</code>" }], explain: "Correct." },
        { id: "t2", prompt: "Which extracts <code>site.tar.bz2</code>?", answer: "xjf", options: [{ value: "xjf", label: "<code>tar -xjf site.tar.bz2</code>" }, { value: "cjf", label: "<code>tar -cjf site.tar.bz2</code>" }, { value: "xJf", label: "<code>tar -xJf site.tar.bz2</code>" }], explain: "Correct. x extract, j bzip2." },
        { id: "t3", prompt: "Which is the right way to make a cpio archive?", answer: "pipe", options: [{ value: "pipe", label: "<code>ls | cpio -o &gt; files.cpio</code>" }, { value: "arg", label: "<code>cpio -o files.cpio *</code>" }, { value: "i", label: "<code>ls | cpio -i &gt; files.cpio</code>" }], explain: "Correct. Names on stdin, archive on stdout." },
        { id: "t4", prompt: "You need to back up a whole disk partition to an image file. Which tool copies it byte for byte?", answer: "dd", options: ["dd", "tar", "cpio", "gzip"], explain: "Correct." },
        { id: "t5", prompt: "In <code>tar -cvzf out.tgz dir</code>, what does <code>v</code> do?", answer: "v", options: [{ value: "v", label: "Lists each file as it's added" }, { value: "verify", label: "Verifies the archive" }, { value: "version", label: "Shows tar's version" }], explain: "Correct. v is verbose." },
      ],
      challenge: {
        intro: "On your VM, in `~/lpic-section8`, complete these without notes.",
        tasks: [
          "Create a compressed tarball of configs and logs using xz compression. Prove the archive contains both directories.",
          "A teammate renames a .xz file with a .log extension. Identify the real file type without extracting it.",
          "Read a compressed log and search for WARNING without creating an extracted copy.",
          "Create a cpio archive from a find-generated file list and verify the archive contents.",
          "Copy the mock disk image with dd and prove the copy matches the original.",
        ],
        outro: "",
      },
      questions: [
        { q: "Manager request: Package the maintenance files into one compressed archive and send the command you used.", a: "<code>tar -czf backups/maintenance.tar.gz configs logs</code> (or <code>-cJf … .tar.xz</code>), then <code>tar -tf</code> it to prove the contents." },
        { q: "Security analyst request: Confirm whether the compressed incident log contains the word CRITICAL without extracting it.", a: "<code>zcat log.gz | grep CRITICAL</code> (bzcat for .bz2, xzcat for .xz). If unsure of the format, run <code>file</code> first." },
        { q: "Incident bridge request: Verify what files are inside a handoff archive before anyone restores it.", a: "<code>tar -tvf handoff.tar.gz</code>. It only lists; nothing is extracted." },
        { q: "Project lead request: Archive only files selected by a find command so the change record has a targeted backup.", a: "<code>find configs logs -type f | cpio -o &gt; backups/selected.cpio</code>, verified with <code>cpio -itv &lt; backups/selected.cpio</code>." },
        { q: "Teammate request: Explain why their gzip command made the original file disappear.", a: "gzip replaces the file with the .gz version by default. Use <code>gzip -k</code> to keep it, or <code>gzip -c file &gt; file.gz</code>." },
        { q: "Operations request: Use a safe mock image to demonstrate the dd syntax for a byte-level copy.", a: "<code>dd if=images/mock-disk.img of=backups/copy.img bs=1M status=progress</code>, then <code>cmp</code> the two files (no output means they match)." },
      ],
      mastery: [
        "I can choose gzip, bzip2 or xz based on the situation.",
        "I can view compressed files without extracting them.",
        "I can create, list and extract tar archives safely.",
        "I can create compressed tarballs and match the right compression option.",
        "I can use cpio with a file list from find.",
        "I can explain why dd is risky and practise it safely with mock files.",
        "I can validate every archive or copy before calling the task complete.",
        "I can recognise LPIC-1 wording traps around compression, archiving and file types.",
      ],
    },
  });
})();
