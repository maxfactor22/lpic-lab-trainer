/* Section 10: Permissions, ownership and links (104.5, 104.6). From "LPIC_Section10_Lab_Workbook.docx"
   (written from the course transcript on 2026-11-09). 14 labs grouped into 7 lessons. */
(function () {
  const WS = "~/lpic1-section10";
  const FILES = {
    [WS + "/reports/"]: null, [WS + "/shared/"]: null,
    [WS + "/deploy/db.credentials"]: "db_user=svc-backup\ndb_pass=CHANGE-ME\n",
    [WS + "/deploy/deploy.sh"]: "#!/bin/bash\necho \"Deploying app02\"\n",
    [WS + "/logs/health.log"]: "web01 OK\nweb02 OK\ndb01 WARN\n",
    [WS + "/releases/app-1.0/app.conf"]: "version=1.0\n",
    [WS + "/releases/app-1.1/app.conf"]: "version=1.1\n",
  };
  const SETUP = ["chmod 666 deploy/db.credentials", "chmod 644 deploy/deploy.sh logs/health.log", "chmod 777 releases/app-1.0/app.conf"];
  const base = { user: "max", host: "linux-mint", cwd: WS, files: FILES, setup: SETUP };
  const ticket = (requestedBy, body, tools, extra = {}) => ({ requestedBy, system: "Linux Mint VM", badge: "IT engineer", tools, body, ...extra });
  const pat = (re) => ({ type: "pattern", re });
  const file = (name, re, not) => ({ type: "file", path: WS + "/" + name, re, not });
  const out = (re) => ({ type: "output", re });
  const hist = (...includes) => ({ type: "history", includes });
  const sudoNote = { kind: "info", title: "sudo here", text: "In the practice terminal <code>sudo</code> doesn't ask for a password. <code>sudo -u nobody</code> runs a command as another user, which is how you test what someone else can do." };

  LPIC.section({
    id: "section-10",
    number: 10,
    title: "Permissions, Ownership and Links",
    objectives: ["104.5", "104.6"],
    kind: "terminal",
    source: "LPIC_Section10_Lab_Workbook.docx",
    scenario: "You're an IT engineer working access tickets and audit findings. Decide who needs what access, make the smallest change that delivers it, and prove it with ls -l, stat, or a test that should fail.",
    overview: {
      paragraphs: [
        "Permissions are enforced in the practice terminal: you're <code>max</code>, a member of <code>adm</code> and <code>sudo</code>, and a missing r, w or x really does give <em>Permission denied</em>.",
        "On your VM, run <code>id -Gn</code> first to check you're in <code>adm</code>, then the workbook's Lab Setup to create <code>~/lpic1-section10</code> with its starting modes. The practice terminal already has them.",
      ],
      commands: ["ls -l", "ls -ld", "ls -li", "stat", "id", "groups", "getent group", "chown user:group", "chown :group", "chown -R", "chgrp", "chmod u+x", "chmod go=", "chmod u=rwX,go=rX", "chmod 640", "chmod -R", "chmod 4755 2775 1777", "umask", "umask -S", "find -perm -4000", "ln", "ln -s", "ln -sfn", "readlink -f", "find -samefile", "find -xtype l", "mkfifo"],
      memoryHook: "r=4, w=2, x=1, added up per level: owner, group, other. A fourth digit in front holds the special bits: 4 SUID, 2 SGID, 1 sticky. On a directory, r lists names, x lets you in, and w lets you create or delete what's inside.",
    },

    lessons: [
      /* ---------------------------------------------------------- 10.1 */
      {
        id: "10.1", title: "Read a long listing", navSubtitle: "ls -l, stat, file types (Labs 1–2)", objective: "104.5", difficulty: "Beginner",
        source: "Labs 1 and 2: Decode a long listing; identify every file type",
        summary: "Read every column of <code>ls -l</code>, see modes as numbers with <code>stat</code>, and recognise all seven file types.",
        ticket: ticket("Security auditor", "An audit says one deployment file is open to everyone. Capture the evidence, then build an inventory showing every kind of file a Linux system has.", ["ls -l", "ls -ld", "stat", "mkfifo", "ln -s", "file"]),
        workspace: base,
        tasks: [
          { id: "listing", title: "Capture the listing", short: "<code>ls -l deploy logs &gt; reports/listing.txt</code>, then <code>ls -ld deploy &gt;&gt;</code> it", detail: "<code>ls -l dir</code> shows what's inside; <code>ls -ld dir</code> shows the directory itself.", check: file("reports/listing.txt", "-rw-rw-rw- .*db\\.credentials[\\s\\S]*^d\\S+ .*deploy$") },
          { id: "stat", title: "Modes as numbers", command: "stat -c '%A %a %U %G %n' deploy/* logs/*", detail: "<code>%A</code> letters, <code>%a</code> octal, <code>%U</code> owner, <code>%G</code> group. The finding: db.credentials is 666, so anyone can read and change the database password.", check: { type: "all", checks: [pat("^stat -c"), out("-rw-rw-rw- 666 .*db\\.credentials")] } },
          { id: "types", title: "Every file type", short: "<code>mkfifo work.pipe</code>, <code>ln -s logs/health.log latest.log</code>, then <code>ls -ld</code> them with <code>/dev/null</code>, <code>/dev/sda</code> and <code>/run/snapd.socket</code>", detail: "The first character: <code>-</code> file, <code>d</code> directory, <code>l</code> link, <code>p</code> named pipe, <code>c</code> character device, <code>b</code> block device, <code>s</code> socket.", check: { type: "all", checks: [out("^p"), out("^l"), out("^[cbs]")] } },
          { id: "file", title: "Ask file", command: "file /dev/null work.pipe latest.log", detail: "<code>file</code> names special files too.", check: { type: "all", checks: [pat("^file "), out("fifo"), out("symbolic link")] } },
        ],
        quiz: [
          { id: "fields", prompt: "In <code>-rw-r----- 1 max adm 28 … health.log</code>, what is <code>adm</code>?", answer: "group", explain: "Correct. The owner comes first, then the group.",
            options: [{ value: "group", label: "The group" }, { value: "owner", label: "The owner" }, { value: "other", label: "Other users" }] },
          { id: "p", prompt: "What does a <code>p</code> at the start of a listing mean?", answer: "pipe", explain: "Correct. A named pipe (FIFO), made with mkfifo.",
            options: [{ value: "pipe", label: "A named pipe (FIFO)" }, { value: "perm", label: "Special permissions" }, { value: "proc", label: "A process file" }] },
        ],
        challenge: {
          prompt: "Show the permissions of the <code>deploy</code> directory itself, not its contents.",
          check: { accept: ["ls -ld deploy", "ls -dl deploy", "ls -l -d deploy", "stat deploy", "ls -ld deploy/"] },
          correct: "Correct.",
          incorrect: "ls needs -d to show the directory entry.",
        },
        memoryHook: "<code>- d l p c b s</code>: file, directory, link, pipe, character device, block device, socket.",
        completion: "You can read any long listing.",
      },

      /* ---------------------------------------------------------- 10.2 */
      {
        id: "10.2", title: "Identity and ownership", navSubtitle: "id, groups, chgrp, chown (Labs 3–4)", objective: "104.5", difficulty: "Beginner",
        source: "Labs 3 and 4: Confirm your identity and groups; change group and owner",
        summary: "Find out who you are and which groups you're in, then change a file's group and owner, and see what a normal user can't do.",
        ticket: ticket("Log review lead", "Log reviewers are in the adm group. Before you touch the health log, prove your identity and groups, then hand the log to the adm group and walk its owner through root and back.", ["whoami", "id", "groups", "getent", "chgrp", "chown"], { callout: sudoNote }),
        workspace: base,
        tasks: [
          { id: "id", title: "Who am I?", short: "Save <code>whoami</code>, <code>id</code>, <code>id -gn</code>, <code>id -Gn</code>, <code>groups</code> and <code>getent group adm</code> to <code>reports/identity.txt</code>", detail: "Your primary group has your own name; adm is a supplementary group.", check: file("reports/identity.txt", "^max$[\\s\\S]*uid=1000\\(max\\)[\\s\\S]*\\badm\\b[\\s\\S]*^adm:x:4:") },
          { id: "chgrp", title: "Give the log to adm", command: "chgrp adm logs/health.log", detail: "As the owner you can change the group to any group you belong to. Check with <code>ls -l logs/health.log</code>.", check: { type: "all", checks: [hist("^chgrp adm logs/health\\.log$|^chown :adm logs/health\\.log$")] } },
          { id: "root", title: "Change the owner (needs root)", short: "<code>sudo chown root logs/health.log</code>, then <code>sudo chown root:adm</code>, then back with <code>sudo chown $USER:$USER</code>", detail: "Only root can give a file to another user. <code>user:group</code> sets both.", check: hist("^sudo chown root logs/health\\.log$", "^sudo chown root:adm logs/health\\.log$", "^sudo chown (\\$USER|max):(\\$USER|max) logs/health\\.log$") },
          { id: "colon", title: "Only the group, with chown", command: "chown :adm logs/health.log", detail: "<code>chown :group</code> changes just the group. Then try <code>chown root logs/health.log</code> without sudo and read the error.", check: hist("^chown :adm logs/health\\.log$") },
        ],
        quiz: [
          { id: "who", prompt: "Who can change a file's <em>owner</em>?", answer: "root", explain: "Correct. The owner can only change the group, to one of their own groups.",
            options: [{ value: "root", label: "Only root" }, { value: "owner", label: "The file's owner" }, { value: "group", label: "Any member of the file's group" }] },
          { id: "colonq", prompt: "What does <code>chown alice: report.txt</code> do?", answer: "login", explain: "Correct. A trailing colon means alice's login group.",
            options: [{ value: "login", label: "Owner alice, group alice's login group" }, { value: "only", label: "Only changes the owner" }, { value: "err", label: "It's an error" }] },
        ],
        challenge: {
          prompt: "As root, make <code>logs/health.log</code> owned by root with group adm, in one command.",
          check: { accept: ["sudo chown root:adm logs/health.log", "sudo chown root.adm logs/health.log"] },
          correct: "Correct.",
          incorrect: "Use sudo chown with user:group.",
        },
        memoryHook: "<code>chown user:group</code>, <code>chown :group</code> (group only), <code>chown user:</code> (user plus their login group), <code>chgrp group</code>.",
        completion: "You can prove identity and change ownership.",
      },

      /* ---------------------------------------------------------- 10.3 */
      {
        id: "10.3", title: "Change modes: symbolic and octal", navSubtitle: "chmod u+x go= 640 (Labs 5–6)", objective: "104.5", difficulty: "Intermediate",
        source: "Labs 5 and 6: Lock down a credentials file; set standard modes with octal",
        summary: "Change permissions with letters (<code>u g o a</code>, <code>+ - =</code>) and with numbers, and convert between them.",
        ticket: ticket("Security analyst", "The database credentials file is world-writable. Make it owner-only, make the deploy script runnable, then set the team's standard modes on the deploy folder and the health log.", ["chmod", "stat"]),
        workspace: base,
        tasks: [
          { id: "symbolic", title: "Lock down with letters", short: "<code>chmod o-w</code>, then <code>chmod go=</code> on db.credentials; <code>chmod u+x deploy/deploy.sh</code>", detail: "Save <code>stat -c '%a %A %n'</code> after each into <code>reports/symbolic.txt</code>: 664, then 600 <code>-rw-------</code>, then 744 <code>-rwxr--r--</code>.", check: file("reports/symbolic.txt", "^664 -rw-rw-r-- deploy/db\\.credentials\\n600 -rw------- deploy/db\\.credentials\\n744 -rwxr--r-- deploy/deploy\\.sh") },
          { id: "scratch", title: "Practise on a scratch copy", short: "<code>cp deploy/deploy.sh reports/scratch.sh</code>, then <code>chmod a=x</code>, <code>chmod u=rw,go=r</code>, <code>chmod ug+w,o-r</code>", detail: "<code>ls -l</code> after each one. <code>=</code> replaces whatever was there.", check: hist("chmod a=x reports/scratch\\.sh", "chmod u=rw,go=r reports/scratch\\.sh", "chmod ug\\+w,o-r reports/scratch\\.sh") },
          { id: "octal", title: "Standard modes with numbers", short: "<code>chmod 750 deploy/deploy.sh deploy</code>, <code>chmod 640 logs/health.log</code>, <code>chmod 600 deploy/db.credentials</code>", detail: "Then <code>stat -c '%a %A %n' deploy deploy/* logs/health.log &gt; reports/octal.txt</code>.", check: file("reports/octal.txt", "^750 drwxr-x--- deploy\\n600 -rw------- deploy/db\\.credentials\\n750 -rwxr-x--- deploy/deploy\\.sh\\n640 -rw-r----- logs/health\\.log") },
        ],
        quiz: [
          { id: "640", prompt: "What does <code>640</code> mean?", answer: "rw-r-----", explain: "Correct. 6=rw owner, 4=r group, 0 other.",
            options: ["rw-r-----", "rwxr-----", "rw-rw----", "r--r-----"] },
          { id: "eq", prompt: "A file is <code>rwxrwxr-x</code>. After <code>chmod g=r</code>, the group has…", answer: "r", explain: "Correct. = replaces the group's bits.",
            options: [{ value: "r", label: "<code>r--</code>" }, { value: "rwxr", label: "<code>rwx</code> plus r" }, { value: "rw", label: "<code>rw-</code>" }] },
        ],
        challenge: {
          prompt: "Make <code>deploy/db.credentials</code> readable and writable by its owner only, using symbolic mode in one command.",
          check: { accept: ["chmod u=rw,go= deploy/db.credentials", "chmod go= deploy/db.credentials", "chmod u=rw,g=,o= deploy/db.credentials", "chmod go-rwx deploy/db.credentials", "chmod g-rwx,o-rwx deploy/db.credentials", "chmod u=rw,go-rwx deploy/db.credentials"] },
          correct: "Correct.",
          incorrect: "Remove everything from group and other with letters, not numbers.",
        },
        memoryHook: "<strong>u</strong>ser (owner), <strong>g</strong>roup, <strong>o</strong>ther, <strong>a</strong>ll. <code>o</code> is not \"owner\".",
        completion: "You can set any mode both ways.",
      },

      /* ---------------------------------------------------------- 10.4 */
      {
        id: "10.4", title: "Directories and whole trees", navSubtitle: "r w x on dirs, chmod -R, X (Labs 7–8)", objective: "104.5", difficulty: "Intermediate to Advanced",
        source: "Labs 7 and 8: Directory permissions; fix modes and ownership across a tree",
        summary: "See what r, w and x mean on a directory, then fix a whole release tree at once.",
        ticket: ticket("Help desk", "A user can see the files in a share but can't open them. Explain why with a test, then make every directory in the release tree 755 and every file 644, without making files executable.", ["chmod", "chmod -R", "find -exec", "chown -R"], { callout: sudoNote }),
        workspace: base,
        tasks: [
          { id: "rw", title: "Read without enter", short: "<code>mkdir -p shared/handoff; echo 'call db01 owner' &gt; shared/handoff/note.txt</code>, <code>chmod u=rw shared/handoff</code>, then <code>ls</code> it and <code>cat</code> the note", detail: "r lets you list names, but without x you can't reach the files.", check: { type: "all", checks: [hist("^chmod u=rw shared/handoff$"), out("Permission denied|note\\.txt")] } },
          { id: "x", title: "Enter without read", short: "<code>chmod u=x shared/handoff</code>, then <code>ls</code> it and <code>cat</code> the note", detail: "Now ls is denied but cat works, because you know the name.", check: hist("^chmod u=x shared/handoff$") },
          { id: "w", title: "No w, no new files", short: "<code>chmod u=rx shared/handoff</code>, try <code>touch shared/handoff/new.txt</code>, then <code>chmod 755 shared/handoff</code>", detail: "Creating or deleting inside a directory needs w on the directory.", check: hist("^chmod u=rx shared/handoff$", "^chmod 755 shared/handoff$") },
          { id: "tree", title: "Fix the whole tree", short: "<code>find releases -type d -exec chmod 755 {} +</code>, then the same with <code>-type f</code> and <code>644</code>", detail: "Why not <code>chmod -R u=rwX,go=rX releases</code>? Capital <code>X</code> adds execute to directories <em>and to files that already have it</em>, and app-1.0/app.conf starts at 777, so it would stay executable. Try it and look.", check: hist("^find releases -type d -exec chmod 755 ", "^find releases -type f -exec chmod 644 ") },
          { id: "chownR", title: "Prove the result", short: "<code>sudo chown -R root:adm releases</code>, <code>find releases -printf '%m %u:%g %p\\n' &gt; reports/releases-perms.txt</code>, then <code>sudo chown -R $USER: releases</code>", detail: "Every directory should say 755, every file 644, all root:adm.", check: file("reports/releases-perms.txt", "^755 root:adm releases\\n[\\s\\S]*^644 root:adm releases/app-1\\.0/app\\.conf", "^(?!755|644)\\d+ ") },
        ],
        quiz: [
          { id: "delete", prompt: "What do you need to delete a file?", answer: "dirw", explain: "Correct. Deleting changes the directory, not the file.",
            options: [{ value: "dirw", label: "w and x on the directory it's in" }, { value: "filew", label: "w on the file itself" }, { value: "own", label: "To own the file" }] },
          { id: "X", prompt: "In <code>chmod -R a+X dir</code>, what does capital X do?", answer: "dirs", explain: "Correct. So a file that's already executable stays executable.",
            options: [{ value: "dirs", label: "Adds execute to directories and files already executable by someone" }, { value: "all", label: "Adds execute to everything" }, { value: "none", label: "Removes execute" }] },
        ],
        challenge: {
          prompt: "With find, set every plain file under <code>releases</code> to 644, starting one chmod for many files at once.",
          check: { accept: ["find releases -type f -exec chmod 644 {} +", "find releases/ -type f -exec chmod 644 {} +", "find releases -type f -exec chmod 644 '{}' +"] },
          correct: "Correct. <code>+</code> passes many names to one chmod; <code>\\;</code> runs chmod once per file.",
          incorrect: "Use find with -type f and -exec chmod, ending in +.",
        },
        memoryHook: "On a directory: <strong>r</strong> = list names, <strong>x</strong> = enter and reach files, <strong>w</strong> = create, rename and delete inside (needs x too).",
        completion: "You can reason about directory access and fix whole trees.",
      },

      /* ---------------------------------------------------------- 10.5 */
      {
        id: "10.5", title: "Default permissions with umask", navSubtitle: "umask, umask -S, ( subshell ) (Lab 9)", objective: "104.5", difficulty: "Intermediate",
        source: "Lab 9: Diagnose new files that come out group-writable",
        summary: "Read the umask, predict the modes of new files and directories, and try other umasks safely in a subshell.",
        ticket: ticket("Developer", "\"Why do my new files come out rw-rw-r--? I want rw-r----- by default.\" Show how the umask decides, without changing your own setting by accident.", ["umask", "touch", "mkdir", "stat"]),
        workspace: base,
        tasks: [
          { id: "show", title: "Read the umask", short: "<code>umask</code> and <code>umask -S</code> into <code>reports/umask.txt</code>", detail: "Mint's default is <code>0002</code>: take write away from other.", check: file("reports/umask.txt", "^0002\\nu=rwx,g=rwx,o=rx") },
          { id: "default", title: "New files and directories", short: "<code>touch reports/u-default.txt; mkdir reports/u-default.dir</code>", detail: "Files start from 666 and directories from 777, then the umask is taken away: 664 and 775.", check: { type: "all", checks: [file("reports/u-default.txt", ""), { type: "dir", path: WS + "/reports/u-default.dir" }] } },
          { id: "sub", title: "Try 027 and 077 in subshells", short: "<code>(umask 027; touch reports/u027.txt; mkdir reports/u027.dir)</code>, the same with 077", detail: "Parentheses run the commands in a subshell, so your own umask doesn't change. Then <code>stat -c '%a %n' reports/u-default.* reports/u027.* reports/u077.* &gt;&gt; reports/umask.txt</code> and run <code>umask</code> again.", check: file("reports/umask.txt", "775 reports/u-default\\.dir\\n664 reports/u-default\\.txt\\n750 reports/u027\\.dir\\n640 reports/u027\\.txt\\n700 reports/u077\\.dir\\n600 reports/u077\\.txt") },
        ],
        quiz: [
          { id: "022", prompt: "With umask <code>022</code>, what mode does a new file get?", answer: "644", explain: "Correct. 666 minus write for group and other.", options: ["644", "755", "622", "664"] },
          { id: "dir022", prompt: "And a new directory with umask <code>022</code>?", answer: "755", explain: "Correct. Directories start from 777.", options: ["755", "644", "775", "777"] },
        ],
        challenge: {
          prompt: "Set the umask so new files come out <code>rw-r-----</code> (640).",
          check: { accept: ["umask 027", "umask 0027", "umask u=rwx,g=rx,o=", "umask u=rw,g=r,o="] },
          correct: "Correct. Directories would come out 750.",
          incorrect: "Take write from group and everything from other.",
        },
        memoryHook: "Files: 666 − umask. Directories: 777 − umask. The umask lists what to <em>take away</em>.",
        completion: "You can predict and set default permissions.",
      },

      /* ---------------------------------------------------------- 10.6 */
      {
        id: "10.6", title: "Special bits: SUID, SGID, sticky", navSubtitle: "4000 2000 1000, s S t T (Labs 10–12)", objective: "104.5", difficulty: "Advanced",
        source: "Labs 10–12: Audit SUID/SGID programs; team and drop folders; read special bits",
        summary: "Find programs that run as their owner, build a shared folder that keeps its group and a drop folder where people can't delete each other's files, and read capital S and T.",
        ticket: ticket("Compliance officer", "Send every program that runs as root no matter who starts it. Then set up an ops share whose files always belong to adm, and a public drop folder where users can't delete each other's files.", ["find -perm", "chmod 2775", "chmod 1777", "sudo -u"], { callout: sudoNote }),
        workspace: base,
        tasks: [
          { id: "audit", title: "Audit SUID and SGID", short: "<code>ls -l /usr/bin/passwd</code>, <code>ls -ld /tmp</code>, then <code>find /usr/bin /usr/sbin -type f -perm -4000</code> (and <code>-2000</code>)", detail: "Save all of it to <code>reports/suid-audit.txt</code>. passwd shows <code>s</code> in the owner's x place; /tmp shows <code>t</code>.", check: file("reports/suid-audit.txt", "-rwsr-xr-x .*passwd[\\s\\S]*drwxrwxrwt .*/tmp[\\s\\S]*/usr/bin/sudo") },
          { id: "sgid", title: "A team folder that keeps its group", short: "<code>mkdir shared/ops; chgrp adm shared/ops; chmod 2775 shared/ops</code>, then touch a file in it and one outside", detail: "With SGID on a directory, new files inherit the directory's group. <code>ls -l</code> both files to compare.", check: { type: "all", checks: [hist("chmod (2775|g\\+s) shared/ops"), { type: "file", path: WS + "/shared/ops/runbook.txt", re: "" }] } },
          { id: "sticky", title: "A drop folder with the sticky bit", short: "<code>mkdir /tmp/lpic1-drop; chmod 1777 /tmp/lpic1-drop; echo mine &gt; /tmp/lpic1-drop/mine.txt</code>, then <code>sudo -u nobody rm -f /tmp/lpic1-drop/mine.txt</code>", detail: "Everyone can write there, but the sticky bit stops nobody from deleting your file: <em>Operation not permitted</em>. Remove the bit with <code>chmod o-t</code> and try again: now it works. Clean up with <code>rm -r /tmp/lpic1-drop</code>.", check: { type: "all", checks: [hist("^sudo -u nobody rm", "chmod o-t /tmp/lpic1-drop")] } },
          { id: "capS", title: "Read capital S and T", short: "Make <code>reports/sp-a</code> 4644 and <code>reports/sp-dir2</code> 1770, then <code>stat -c '%a %A %n' reports/sp-*</code>", detail: "Capital <code>S</code> or <code>T</code> means the special bit is set but execute is missing at that level, so it does nothing useful.", check: { type: "all", checks: [out("4644 -rwSr--r--"), out("1770 drwxrwx--T")] } },
        ],
        quiz: [
          { id: "suid", prompt: "Why is <code>/usr/bin/passwd</code> SUID root?", answer: "shadow", explain: "Correct. Users change their own password, which lives in a file only root can write.",
            options: [{ value: "shadow", label: "It must write /etc/shadow, which only root can change" }, { value: "speed", label: "It runs faster" }, { value: "group", label: "So the shadow group can read it" }] },
          { id: "sticky", prompt: "What does the sticky bit do on a directory like /tmp?", answer: "own", explain: "Correct. Only a file's owner, the directory's owner or root can delete it.",
            options: [{ value: "own", label: "Only a file's owner (or root) can delete or rename it" }, { value: "keep", label: "Files are kept in memory" }, { value: "ro", label: "Makes the directory read-only" }] },
          { id: "6755", prompt: "What does <code>6755</code> set?", answer: "both", explain: "Correct. 4 SUID + 2 SGID, then 755.",
            options: [{ value: "both", label: "SUID and SGID, plus rwxr-xr-x" }, { value: "sticky", label: "Sticky and SUID" }, { value: "sgid", label: "SGID only" }] },
        ],
        challenge: {
          prompt: "Make <code>shared/ops</code> keep its group for new files, with rwxrwxr-x, in one octal command.",
          check: { accept: ["chmod 2775 shared/ops", "chmod 02775 shared/ops"] },
          correct: "Correct.",
          incorrect: "Put the SGID digit in front of 775.",
        },
        memoryHook: "Special digit: <strong>4</strong> SUID (runs as owner), <strong>2</strong> SGID (runs as group; on dirs, new files inherit the group), <strong>1</strong> sticky (only owners delete). Lowercase s/t = bit plus x; capital S/T = bit without x.",
        completion: "You can set and audit special permissions.",
      },

      /* ---------------------------------------------------------- 10.7 */
      {
        id: "10.7", title: "Hard and symbolic links", navSubtitle: "ln, ln -s, ln -sfn (Labs 13–14)", objective: "104.6", difficulty: "Advanced",
        source: "Labs 13 and 14: Give a log a second name; switch releases with a symbolic link",
        summary: "Give a file a second name with a hard link and a pointer with a symbolic link, see which survives deleting the original, and switch releases with one command.",
        ticket: ticket("Release manager", "Give the health log two extra names and prove which one survives a mistaken delete. Then switch the app from 1.0 to 1.1 with one command that's easy to undo.", ["ln", "ln -s", "ls -li", "stat", "find", "readlink"]),
        workspace: base,
        tasks: [
          { id: "make", title: "Make both kinds of link", short: "<code>ln logs/health.log logs/health-hard.log; ln -s health.log logs/health-soft.log</code>, then <code>ls -li logs</code>", detail: "The hard link shares the inode number, and the link count goes to 2. The soft link has its own inode and an arrow.", check: { type: "all", checks: [hist("(^|; *)ln logs/health\\.log logs/health-hard\\.log", "(^|; *)ln -s health\\.log logs/health-soft\\.log"), out("^\\d+ -\\S+ 2 ")] } },
          { id: "delete", title: "Delete the original", short: "<code>rm logs/health.log</code>, then <code>cat</code> both links", detail: "The hard link still has the data; the soft link dangles: <em>No such file or directory</em>.", check: { type: "all", checks: [hist("(^|; *)rm logs/health\\.log$"), pat("^cat .*health-(hard|soft)"), out("db01 WARN")] } },
          { id: "find", title: "Find the broken link and the twins", short: "<code>find logs -xtype l</code>; then <code>ln logs/health-hard.log logs/health.log</code> and <code>find logs -samefile logs/health.log</code>", detail: "<code>-xtype l</code> finds links whose target is gone; <code>-samefile</code> finds every hard link to the same inode.", check: hist("find logs -xtype l", "find logs -samefile") },
          { id: "switch", title: "Switch releases", short: "<code>ln -s releases/app-1.0 current</code>, then <code>ln -sfn releases/app-1.1 current</code>", detail: "<code>-f</code> replaces the link and <code>-n</code> stops ln from following the old link into its directory. Check with <code>readlink current</code> and <code>cat current/app.conf</code>.", check: { type: "all", checks: [hist("^ln -sfn releases/app-1\\.1 current$"), { type: "file", path: WS + "/current/app.conf", re: "version=1\\.1" }] } },
          { id: "limits", title: "Hit the limits", short: "<code>ln releases releases-hard</code> and <code>ln logs/health.log /dev/shm/health.log</code>", detail: "Hard links can't point to directories or cross to another filesystem (<em>Invalid cross-device link</em>). A symbolic link can do both.", check: { type: "all", checks: [hist("^ln releases ", "^ln logs/health\\.log /dev/shm")] } },
        ],
        quiz: [
          { id: "survive", prompt: "You delete the original file. Which link still shows the data?", answer: "hard", explain: "Correct. The data stays until its last hard link is removed.",
            options: [{ value: "hard", label: "The hard link" }, { value: "soft", label: "The symbolic link" }, { value: "both", label: "Both" }] },
          { id: "order", prompt: "In <code>ln -s TARGET NAME</code>, which comes first?", answer: "target", explain: "Correct. Like cp: what exists first, the new name second.",
            options: [{ value: "target", label: "What the link points to" }, { value: "name", label: "The new link's name" }] },
          { id: "dir", prompt: "Why does <code>ln releases releases-hard</code> fail?", answer: "dir", explain: "Correct. Use ln -s for directories.",
            options: [{ value: "dir", label: "Hard links to directories aren't allowed" }, { value: "perm", label: "You need root" }, { value: "exists", label: "releases-hard already exists" }] },
        ],
        challenge: {
          prompt: "Point the existing <code>current</code> link at <code>releases/app-1.0</code> again, in one command.",
          check: { accept: ["ln -sfn releases/app-1.0 current", "ln -snf releases/app-1.0 current", "ln -nsf releases/app-1.0 current", "ln -sf -n releases/app-1.0 current"] },
          correct: "Correct. Switching back is just as easy.",
          incorrect: "Use ln -s with the force and no-dereference options.",
        },
        memoryHook: "Hard link = another name for the same inode (same data, can't cross filesystems or point to dirs). Symbolic link = a small file holding a path (can dangle).",
        completion: "You can use both kinds of link safely.",
      },

      /* ---------------------------------------------------------- 10.C */
      {
        id: "10.C", navNumber: "C", title: "Challenge exam: access review", navSubtitle: "No notes", objective: "104.5", difficulty: "Hard",
        source: "Scenario-Based Challenge Exam", noHints: true, tasksHeading: "Tasks",
        summary: "The workbook's challenge tasks, checked by the files, modes and links you leave behind.",
        ticket: ticket("Security manager", "Close the audit findings and prove each fix. Make the smallest change that does the job.", ["id", "chmod", "chown", "umask", "find", "ln"], { heading: "Ticket: access review", callout: sudoNote }),
        workspace: base,
        tasks: [
          { id: "c1", title: "reports/challenge-id.txt: your user name, primary group and every group you belong to", check: file("reports/challenge-id.txt", "max[\\s\\S]*adm") },
          { id: "c2", title: "Make deploy/db.credentials owner-only (read and write) with symbolic mode, and prove it with stat", check: { type: "all", checks: [hist("^chmod [ugoa+=,rwx-]+ deploy/db\\.credentials$"), out("600|-rw-------")] } },
          { id: "c3", title: "deploy/deploy.sh 750 and logs/health.log 640, with octal modes", check: hist("^chmod 750 .*deploy/deploy\\.sh", "^chmod 640 .*logs/health\\.log") },
          { id: "c4", title: "Every directory under releases 755 and every file 644, with no file made executable", check: hist("^find releases/? -type d .*chmod (755|u=rwx,go=rx)", "^find releases/? -type f .*chmod (644|u=rw,go=r|a-x)") },
          { id: "c5", title: "shared/team with group adm so new files inside get adm automatically; prove it with a test file", check: { type: "all", checks: [hist("chmod (2\\d\\d\\d|g\\+s) shared/team"), out("^-\\S+ +\\d+ +\\S+ +adm ")] } },
          { id: "c6", title: "With a subshell, show the modes of a new file and directory under umask 077, while your umask stays 0002", check: { type: "all", checks: [hist("^\\(umask 077"), out("^0002$")] } },
          { id: "c7", title: "List every SUID program in /usr/bin", check: { type: "all", checks: [hist("find /usr/bin .*-perm (-4000|/4000|-u=s|/u=s)"), out("/usr/bin/passwd")] } },
          { id: "c8", title: "A hard and a symbolic link to logs/health.log; delete the original and show which link still works", check: hist("(^|; *)ln logs/health\\.log ", "(^|; *)ln -s ", "(^|; *)rm logs/health\\.log($|;)") },
        ],
        quiz: [],
        completion: "Access review closed.",
      },
    ],

    review: {
      traps: [
        "Reading `o` as owner. In chmod, `u` is the owning user, `g` the group, `o` other (world) and `a` all three.",
        "Forgetting that `=` replaces. `chmod g=r` removes w and x from the group even if they were set.",
        "Mixing up the octal values: r 4, w 2, x 1. 6 is rw, 5 is rx, and any odd digit includes execute.",
        "Thinking octal can change one level. `chmod 640` always sets owner, group and other together.",
        "Miscounting four-digit modes. The first digit is the special bits: 4 SUID, 2 SGID, 1 sticky. 6755 is SUID plus SGID.",
        "Treating capital S or T as active. They mean the special bit is set but execute is missing at that level.",
        "Confusing SGID on files and directories. On a program it runs with the file's group; on a directory new files inherit the directory's group.",
        "Subtracting the umask from 777 for files. Files start from 666, so umask 022 gives 644 files and 755 directories.",
        "Thinking a non-root user can chown a file to someone else. Only root can change the owner; an owner can only change the group to one of their own groups.",
        "Forgetting the colon forms: `chown alice:ops` sets both, `chown :ops` only the group, `chown alice:` uses alice's login group.",
        "Expecting `ls -l dir` to show the directory's own mode. Use `ls -ld`.",
        "Mixing up link counts. A hard link raises the count for every name; a symbolic link doesn't change it.",
        "Expecting a symbolic link to survive deleting its target. It dangles; a hard link keeps the data until the last name is removed.",
        "Hard linking a directory or across filesystems. Both fail; use `ln -s`. ln takes the target first and the new name second.",
      ],
      trapQuiz: [
        { id: "t1", prompt: "Which removes all access for group and other, leaving the owner alone?", answer: "go=", options: [{ value: "go=", label: "<code>chmod go= file</code>" }, { value: "o=", label: "<code>chmod o= file</code>" }, { value: "a-rwx", label: "<code>chmod a-rwx file</code>" }, { value: "700", label: "<code>chmod 077 file</code>" }], explain: "Correct." },
        { id: "t2", prompt: "<code>-rwxr-sr-x</code>: which special bit is set?", answer: "sgid", options: [{ value: "sgid", label: "SGID" }, { value: "suid", label: "SUID" }, { value: "sticky", label: "Sticky" }], explain: "Correct. The s is in the group's execute place." },
        { id: "t3", prompt: "umask is <code>027</code>. A new directory gets…", answer: "750", options: ["750", "640", "755", "770"], explain: "Correct. 777 minus 027." },
        { id: "t4", prompt: "Which finds every SUID file under /usr?", answer: "4000", options: [{ value: "4000", label: "<code>find /usr -perm -4000</code>" }, { value: "2000", label: "<code>find /usr -perm -2000</code>" }, { value: "1000", label: "<code>find /usr -perm -1000</code>" }], explain: "Correct." },
        { id: "t5", prompt: "<code>ls -li</code> shows two names with the same inode number. They are…", answer: "hard", options: [{ value: "hard", label: "Hard links to the same file" }, { value: "soft", label: "A file and its symbolic link" }, { value: "copies", label: "Two separate copies" }], explain: "Correct." },
      ],
      challenge: {
        intro: "On your Linux Mint VM, without notes. Rerun Step 3 of the Lab Setup first so you start from the original modes.",
        tasks: [
          "Record your user name, primary group and every group you belong to in `reports/challenge-id.txt`.",
          "Make `deploy/db.credentials` readable and writable only by its owner using symbolic mode, then prove it with stat.",
          "Set `deploy/deploy.sh` to 750 with octal mode and `logs/health.log` to 640.",
          "Fix every mode under releases so directories are 755 and files are 644, without making any file executable.",
          "Create `shared/team` with group adm so that new files inside it get group adm automatically. Prove it with a test file.",
          "Show, with a subshell, the modes a new file and a new directory get under umask 077, while your own umask stays unchanged.",
          "List every SUID program in /usr/bin and explain in one sentence why passwd is on the list.",
          "Create a hard link and a symbolic link to `logs/health.log`, delete the original, and show which link still works.",
        ],
        outro: "",
      },
      questions: [
        { q: "Security analyst request: “The database credentials file is world-writable. Make it owner-only and show me the numbers.”", a: "<code>chmod 600 deploy/db.credentials</code> (or <code>chmod go= …</code>), then <code>stat -c '%a %A %n' deploy/db.credentials</code> shows 600 -rw-------." },
        { q: "Operations request: “Log reviewers are in the adm group. Give the group read access to the health log and nobody else.”", a: "<code>chgrp adm logs/health.log; chmod 640 logs/health.log</code>. The owner keeps rw, adm gets r, others nothing." },
        { q: "Team lead request: “Everything people save in the ops share should belong to the ops group without anyone running chgrp.”", a: "<code>chgrp ops share; chmod 2775 share</code> (or <code>chmod g+s</code>). SGID on a directory makes new files inherit its group." },
        { q: "Help desk request: “Users keep deleting each other’s files in the public drop folder. Stop that without locking anyone out.”", a: "<code>chmod 1777 drop</code> (or <code>chmod +t</code>). Everyone can still write, but only a file's owner can delete it, like /tmp." },
        { q: "Compliance request: “Send me every program on this box that runs as root no matter who starts it.”", a: "<code>find / -type f -perm -4000 -user root 2&gt;/dev/null</code>: every SUID-root file." },
        { q: "Release manager request: “Switch the app from version 1.0 to 1.1 in one command, and make it easy to switch back.”", a: "<code>ln -sfn releases/app-1.1 current</code>. Switching back is the same command with 1.0." },
        { q: "Developer request: “Why do my new files come out rw-rw-r--? I want them rw-r----- by default.”", a: "Your umask is 0002 (666 − 002 = 664). Set <code>umask 027</code> (in ~/.bashrc to keep it) for 640 files and 750 directories." },
      ],
      mastery: [
        "I can read every field of `ls -l` output and name all seven file type codes.",
        "I can show my user name, UID, primary group and all my groups with whoami, id and groups.",
        "I can change a file's group with chgrp or `chown :group`, and its owner with `sudo chown user:group`.",
        "I can change modes in symbolic form with u, g, o, a, +, - and =, including several changes separated by commas.",
        "I can convert between rwx letters and octal numbers in both directions.",
        "I can explain what r, w and x mean on a directory and why deleting a file depends on the directory.",
        "I can fix a whole tree with `chmod -R` and capital X, or with find and -exec.",
        "I can read and change the umask and predict the modes of new files and directories.",
        "I can set and remove SUID, SGID and the sticky bit in symbolic and four-digit octal form.",
        "I can explain the difference between lowercase s and t and capital S and T.",
        "I can create hard and symbolic links, find them with `ls -li`, stat, `find -samefile` and `find -xtype l`, and say which survives deleting the original.",
        "I can switch a symbolic link safely with `ln -sfn` and explain why hard links can't cross filesystems or point to directories.",
      ],
    },
  });
})();
