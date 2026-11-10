/* Section 19: Runlevels, systemd Targets and Shutdown. Generated from LPIC_Section19_Lab_Workbook.docx by vm_section.py;
   paste checks, quizzes and model answers were added for the app. */
LPIC.section({
 "id": "section-19",
 "number": 19,
 "title": "Runlevels, systemd Targets and Shutdown",
 "objectives": [
  "101.3"
 ],
 "kind": "vm",
 "source": "LPIC_Section19_Lab_Workbook.docx",
 "scenario": "Objective 101.3: Change runlevels and boot targets, and shut down or reboot the system, using SysV init records, systemd targets, service checks, and user notifications.",
 "overview": {
  "paragraphs": [
   "Treat each lab like an IT engineer task, not a command drill. Read the ticket, collect the evidence the request asks for, save it under reports/, and prove it with the validation command.",
   "Linux Mint uses systemd, not SysV init. The SysV labs use a practice copy of a legacy inittab and a practice rc.d tree that you build in the Lab Setup, plus the compatibility links Mint still keeps. The runlevel, target, and shutdown labs are inspect-and-explain: you read settings and rehearse with safe options. You will never run systemctl isolate, init, telinit, or a real shutdown on your VM. Any command marked Don't run on your VM is there so you can recognize it on the exam.",
   "The only change these labs make to the system is a small practice service, lab-heartbeat, that runs sleep. Lab 9 removes it."
  ],
  "setup": [
   {
    "text": "Step 1: Create the practice workspace:"
   },
   {
    "cmd": "mkdir -p ~/lpic1-section19/{reports,samples/rc.d/init.d,samples/rc.d/rc3.d,samples/rc.d/rc5.d}"
   },
   {
    "cmd": "cd ~/lpic1-section19"
   },
   {
    "text": "Step 2: Create a practice copy of a legacy server's /etc/inittab:"
   },
   {
    "cmd": "printf '# Practice copy of the inittab from legacy server db01\\nid:3:initdefault:\\nsi::sysinit:/etc/rc.d/rc.sysinit\\nl0:0:wait:/etc/rc.d/rc 0\\nl1:1:wait:/etc/rc.d/rc 1\\nl3:3:wait:/etc/rc.d/rc 3\\nl5:5:wait:/etc/rc.d/rc 5\\nl6:6:wait:/etc/rc.d/rc 6\\nca::ctrlaltdel:/sbin/shutdown -t3 -r now\\n1:2345:respawn:/sbin/mingetty tty1\\n2:2345:respawn:/sbin/mingetty tty2\\nx:5:respawn:/etc/X11/prefdm -nodaemon\\n' > samples/inittab"
   },
   {
    "text": "Step 3: Create practice init scripts and the runlevel links that point to them:"
   },
   {
    "cmd": "for s in network sshd httpd crond; do printf '#!/bin/sh\\necho \"%s $1\"\\n' $s > samples/rc.d/init.d/$s; chmod 755 samples/rc.d/init.d/$s; done"
   },
   {
    "cmd": "cd samples/rc.d/rc3.d && ln -s ../init.d/network S10network && ln -s ../init.d/sshd S55sshd && ln -s ../init.d/crond S90crond && ln -s ../init.d/httpd K15httpd && cd ~/lpic1-section19"
   },
   {
    "cmd": "cd samples/rc.d/rc5.d && ln -s ../init.d/network S10network && ln -s ../init.d/sshd S55sshd && ln -s ../init.d/httpd S85httpd && ln -s ../init.d/crond S90crond && cd ~/lpic1-section19"
   },
   {
    "text": "Step 4: Create the unit file for the practice service used in Labs 8 and 9:"
   },
   {
    "cmd": "printf '[Unit]\\nDescription=Lab heartbeat practice service\\n\\n[Service]\\nExecStart=/usr/bin/sleep infinity\\n\\n[Install]\\nWantedBy=multi-user.target\\n' > samples/lab-heartbeat.service"
   },
   {
    "text": "Validation check: Run ls -lR samples and confirm rc3.d and rc5.d contain links shown with -> ../init.d/..., and that samples/inittab and samples/lab-heartbeat.service exist. If a lab goes wrong, delete the samples folder and rerun Steps 2 to 4."
   }
  ],
  "commands": [
   "runlevel",
   "who -r",
   "init",
   "telinit",
   "telinit q",
   "/etc/inittab (id:N:initdefault:)",
   "/etc/init.d",
   "/etc/rc.d/init.d",
   "/etc/rcN.d",
   "S and K links",
   "service NAME status",
   "systemctl get-default",
   "systemctl set-default",
   "systemctl isolate",
   "systemctl start",
   "stop",
   "restart",
   "reload",
   "status",
   "enable",
   "disable",
   "is-active",
   "is-enabled",
   "mask",
   "cat",
   "daemon-reload",
   "list-units",
   "list-unit-files",
   "list-dependencies",
   "is-system-running",
   "--failed",
   "--no-pager",
   "rescue.target",
   "emergency.target",
   "multi-user.target",
   "graphical.target",
   "runlevelN.target",
   "/etc/systemd/system",
   "/run/systemd/system",
   "/usr/lib/systemd/system",
   "shutdown -h",
   "-H",
   "-P",
   "-r",
   "-k",
   "-c",
   "now",
   "+m",
   "hh:mm",
   "halt",
   "poweroff",
   "reboot",
   "wall",
   "mesg",
   "acpid"
  ],
  "memoryHook": "Think 0 off, 1 alone, 3 network, 5 desktop, 6 restart. SysV reads its default from /etc/inittab and runs the K links and then the S links for that runlevel. systemd reads default.target and starts the target's units in parallel. To switch: init or telinit for SysV, systemctl isolate for systemd. To stop the box: shutdown with a time and a message, and -c to call it off.",
  "reference": []
 },
 "lessons": [
  {
   "id": "19.1",
   "kind": "vm",
   "title": "Read the default runlevel from a legacy inittab",
   "navSubtitle": "inittab, initdefault",
   "objective": "101.3",
   "difficulty": "Beginner",
   "source": "Lab 1: Read the default runlevel from a legacy inittab",
   "workdir": "~/lpic1-section19",
   "summary": "",
   "scenario": "A ticket says legacy server db01 boots to a text console and the vendor asks which runlevel it starts in. You have a copy of its /etc/inittab.",
   "task": "Find the initdefault record and pull out the runlevel number.",
   "deliverable": "reports/db01-default-runlevel.txt with the record and the number.",
   "steps": [
    {
     "cmd": "grep initdefault samples/inittab > reports/db01-default-runlevel.txt"
    },
    {
     "cmd": "grep initdefault samples/inittab | cut -d: -f2 >> reports/db01-default-runlevel.txt"
    },
    {
     "text": "Read the other records too. The format is id:runlevels:action:process. Note which line runs the rc script for runlevel 3 and which line handles Ctrl+Alt+Del."
    }
   ],
   "validation": "cat reports/db01-default-runlevel.txt and confirm it shows id:3:initdefault: followed by 3.",
   "trap": "The default runlevel is the second field, and initdefault has no process field. Never set the default to 0 or 6: the server would halt or reboot as soon as it finished booting.",
   "paste": {
    "command": "cat reports/db01-default-runlevel.txt",
    "checks": [
     {
      "re": "^id:3:initdefault:\\s*$",
      "say": "includes the initdefault record from the inittab copy"
     },
     {
      "re": "^3\\s*$",
      "say": "cut pulled out the runlevel number on its own line"
     }
    ]
   },
   "quiz": [
    {
     "id": "field",
     "prompt": "In <code>id:3:initdefault:</code>, which field holds the default runlevel?",
     "answer": "2",
     "options": [
      {
       "value": "1",
       "label": "The first (id)"
      },
      {
       "value": "2",
       "label": "The second"
      },
      {
       "value": "3",
       "label": "The third (action)"
      },
      {
       "value": "4",
       "label": "The fourth (process)"
      }
     ],
     "explain": "Correct. The format is id:runlevels:action:process, and initdefault leaves the process field empty."
    },
    {
     "id": "six",
     "prompt": "What happens if the initdefault runlevel is set to 6?",
     "answer": "loop",
     "options": [
      {
       "value": "loop",
       "label": "The server reboots every time it finishes booting"
      },
      {
       "value": "gui",
       "label": "It boots to a desktop"
      },
      {
       "value": "single",
       "label": "It boots to single-user mode"
      }
     ],
     "explain": "Correct. Runlevel 6 is reboot, so 0 and 6 never belong in initdefault."
    }
   ],
   "completion": "Read the default runlevel from a legacy inittab: done."
  },
  {
   "id": "19.2",
   "kind": "vm",
   "title": "Report the current and previous runlevel",
   "navSubtitle": "runlevel, who -r",
   "objective": "101.3",
   "difficulty": "Beginner",
   "source": "Lab 2: Report the current and previous runlevel",
   "workdir": "~/lpic1-section19",
   "summary": "",
   "scenario": "The monitoring team asks what runlevel your Mint workstation is in, and whether it changed since boot.",
   "task": "Collect the runlevel with three different commands.",
   "deliverable": "reports/runlevel-now.txt.",
   "steps": [
    {
     "text": "runlevel > reports/runlevel-now.txt"
    },
    {
     "text": "who -r >> reports/runlevel-now.txt"
    },
    {
     "cmd": "systemctl get-default >> reports/runlevel-now.txt"
    }
   ],
   "validation": "cat reports/runlevel-now.txt. The first line reads N 5 on a desktop, who -r shows run-level 5, and the default is graphical.target.",
   "trap": "runlevel prints previous then current. N means there was no previous runlevel since boot. On systemd, runlevel and who -r are compatibility views that translate the active target into a number.",
   "paste": {
    "command": "cat reports/runlevel-now.txt",
    "checks": [
     {
      "re": "^[N0-6S] [0-6S]\\s*$",
      "say": "runlevel printed the previous and current runlevel"
     },
     {
      "re": "run-level [0-6S]\\b",
      "say": "who -r shows the current run-level"
     },
     {
      "re": "^graphical\\.target\\s*$",
      "say": "the default target is graphical.target"
     }
    ]
   },
   "quiz": [
    {
     "id": "n5",
     "prompt": "<code>runlevel</code> prints <code>N 5</code>. What does that mean?",
     "answer": "n5",
     "options": [
      {
       "value": "n5",
       "label": "No previous runlevel since boot; now in runlevel 5"
      },
      {
       "value": "5n",
       "label": "Runlevel 5 before, now none"
      },
      {
       "value": "net",
       "label": "Networking off in runlevel 5"
      }
     ],
     "explain": "Correct. The first value is the previous runlevel and N means there wasn't one."
    }
   ],
   "completion": "Report the current and previous runlevel: done."
  },
  {
   "id": "19.3",
   "kind": "vm",
   "title": "Map the start and kill links for runlevel 3",
   "navSubtitle": "rc3.d, S and K links",
   "objective": "101.3",
   "difficulty": "Beginner",
   "source": "Lab 3: Map the start and kill links for runlevel 3",
   "workdir": "~/lpic1-section19",
   "summary": "",
   "scenario": "Before db01 is retired, the change board wants a list of the services it starts and stops in runlevel 3, in order.",
   "task": "List the links in the practice rc3.d directory, follow them to the real scripts, and explain the order.",
   "deliverable": "reports/rc3-map.txt.",
   "steps": [
    {
     "cmd": "ls -l samples/rc.d/rc3.d > reports/rc3-map.txt"
    },
    {
     "text": "for f in samples/rc.d/rc3.d/*; do echo \"$f -> $(readlink -f $f)\"; done >> reports/rc3-map.txt"
    },
    {
     "text": "diff <(ls samples/rc.d/rc3.d) <(ls samples/rc.d/rc5.d) >> reports/rc3-map.txt"
    }
   ],
   "validation": "cat reports/rc3-map.txt and confirm every link resolves to a script in samples/rc.d/init.d, and that the diff shows httpd is killed in runlevel 3 but started in runlevel 5.",
   "trap": "K links run first, then S links, each in number order. The links all point to one script in init.d, so you fix a script once there, not in every rcN.d directory.",
   "paste": {
    "command": "cat reports/rc3-map.txt",
    "checks": [
     {
      "re": "^l\\S+\\s.*\\b[KS]\\d\\d\\w+ -> \\.\\./init\\.d/\\w+",
      "say": "ls -l shows four links into ../init.d",
      "count": 4
     },
     {
      "re": "rc3\\.d/[KS]\\d\\d\\w+ -> \\S*/rc\\.d/init\\.d/\\w+\\s*$",
      "say": "every link resolves to a script in init.d",
      "count": 4
     },
     {
      "re": "^<\\s*K15httpd",
      "say": "the diff shows httpd is killed in runlevel 3"
     },
     {
      "re": "^>\\s*S85httpd",
      "say": "the diff shows httpd is started in runlevel 5"
     }
    ]
   },
   "quiz": [
    {
     "id": "order",
     "prompt": "In what order does SysV init run the links for a runlevel?",
     "answer": "kfirst",
     "options": [
      {
       "value": "kfirst",
       "label": "All K links, then all S links, each in number order"
      },
      {
       "value": "sfirst",
       "label": "S links first, then K links"
      },
      {
       "value": "alpha",
       "label": "By service name"
      }
     ],
     "explain": "Correct. Stop what shouldn't run, then start what should."
    },
    {
     "id": "fix",
     "prompt": "The httpd script has a bug. Where do you fix it?",
     "answer": "initd",
     "options": [
      {
       "value": "initd",
       "label": "Once, in the init.d script the links point to"
      },
      {
       "value": "each",
       "label": "In every rcN.d directory"
      },
      {
       "value": "inittab",
       "label": "In /etc/inittab"
      }
     ],
     "explain": "Correct. The rcN.d entries are only links."
    }
   ],
   "completion": "Map the start and kill links for runlevel 3: done."
  },
  {
   "id": "19.4",
   "kind": "vm",
   "title": "Inspect Mint's SysV compatibility layer",
   "navSubtitle": "/etc/init.d, service",
   "objective": "101.3",
   "difficulty": "Beginner",
   "source": "Lab 4: Inspect Mint's SysV compatibility layer",
   "workdir": "~/lpic1-section19",
   "summary": "",
   "scenario": "A colleague coming from an old Red Hat shop asks where the init scripts live on Mint and whether the service command still works.",
   "task": "Show where Debian-family systems keep init scripts and runlevel links, and check a service the old way.",
   "deliverable": "reports/sysv-on-mint.txt.",
   "steps": [
    {
     "cmd": "ls /etc/init.d > reports/sysv-on-mint.txt"
    },
    {
     "cmd": "ls -l /etc/rc2.d >> reports/sysv-on-mint.txt 2>&1"
    },
    {
     "cmd": "ls -ld /etc/rc.d >> reports/sysv-on-mint.txt 2>&1"
    },
    {
     "text": "service cron status >> reports/sysv-on-mint.txt 2>&1"
    },
    {
     "text": "/etc/init.d/cron status >> reports/sysv-on-mint.txt 2>&1"
    }
   ],
   "validation": "cat reports/sysv-on-mint.txt. It lists the scripts in /etc/init.d, shows that /etc/rc.d does not exist, and both status checks report cron as active (running).",
   "trap": "Red Hat style systems keep scripts in /etc/rc.d/init.d and links in /etc/rc.d/rcN.d. Debian style systems use /etc/init.d and /etc/rcN.d directly. On systemd systems, service and the init.d scripts pass the request on to systemctl.",
   "paste": {
    "command": "cat reports/sysv-on-mint.txt",
    "checks": [
     {
      "re": "^cron\\s*$",
      "say": "/etc/init.d lists the cron script"
     },
     {
      "re": "[SK]\\d\\d[\\w.-]+ -> \\.\\./init\\.d/",
      "say": "/etc/rc2.d holds links into ../init.d"
     },
     {
      "re": "cannot access '/etc/rc\\.d'|/etc/rc\\.d.*No such file",
      "say": "/etc/rc.d does not exist on Mint"
     },
     {
      "re": "active \\(running\\)|\\bis running",
      "say": "both status checks report cron running",
      "min": 2
     }
    ]
   },
   "quiz": [
    {
     "id": "debian",
     "prompt": "Where does a Debian-family system keep its init scripts?",
     "answer": "etcinit",
     "options": [
      {
       "value": "etcinit",
       "label": "<code>/etc/init.d</code>"
      },
      {
       "value": "rcd",
       "label": "<code>/etc/rc.d/init.d</code>"
      },
      {
       "value": "usr",
       "label": "<code>/usr/lib/init</code>"
      }
     ],
     "explain": "Correct. Red Hat style systems use /etc/rc.d/init.d."
    },
    {
     "id": "svc",
     "prompt": "On a systemd system, what does <code>service cron status</code> actually do?",
     "answer": "pass",
     "options": [
      {
       "value": "pass",
       "label": "Passes the request on to systemctl"
      },
      {
       "value": "sysv",
       "label": "Runs SysV init in parallel"
      },
      {
       "value": "fail",
       "label": "Fails, because service only works on SysV"
      }
     ],
     "explain": "Correct. service is kept for compatibility."
    }
   ],
   "completion": "Inspect Mint's SysV compatibility layer: done."
  },
  {
   "id": "19.5",
   "kind": "vm",
   "title": "Translate runlevels into systemd targets",
   "navSubtitle": "runlevelN.target",
   "objective": "101.3",
   "difficulty": "Intermediate",
   "source": "Lab 5: Translate runlevels into systemd targets",
   "workdir": "~/lpic1-section19",
   "summary": "",
   "scenario": "A runbook written for SysV says \"switch app02 to runlevel 3 before patching\". You need the systemd equivalent before the runbook is updated.",
   "task": "Show how the runlevelN targets map to real targets, and record the default target.",
   "deliverable": "reports/runlevel-targets.txt.",
   "steps": [
    {
     "cmd": "ls -l /usr/lib/systemd/system/runlevel*.target > reports/runlevel-targets.txt"
    },
    {
     "cmd": "systemctl get-default >> reports/runlevel-targets.txt"
    },
    {
     "text": "readlink -f /usr/lib/systemd/system/default.target >> reports/runlevel-targets.txt"
    },
    {
     "text": "Read only, Don't run on your VM: the runbook step becomes sudo systemctl isolate multi-user.target. The SysV forms are sudo init 3 or sudo telinit 3, and a permanent change is sudo systemctl set-default multi-user.target."
    }
   ],
   "validation": "cat reports/runlevel-targets.txt and confirm runlevel3.target points to multi-user.target, runlevel5.target to graphical.target, runlevel1.target to rescue.target, and runlevel0 and runlevel6 to poweroff and reboot.",
   "trap": "systemctl isolate stops every unit not needed by the new target, which is why it ends a desktop session. set-default only changes the next boot. systemd has no runlevel 2 or 4 of its own; those links also point to multi-user.target.",
   "paste": {
    "command": "cat reports/runlevel-targets.txt",
    "checks": [
     {
      "re": "runlevel3\\.target -> multi-user\\.target",
      "say": "runlevel3.target points to multi-user.target"
     },
     {
      "re": "runlevel5\\.target -> graphical\\.target",
      "say": "runlevel5.target points to graphical.target"
     },
     {
      "re": "runlevel1\\.target -> rescue\\.target",
      "say": "runlevel1.target points to rescue.target"
     },
     {
      "re": "runlevel0\\.target -> poweroff\\.target[\\s\\S]*runlevel6\\.target -> reboot\\.target",
      "say": "runlevel0 and runlevel6 point to poweroff and reboot"
     }
    ]
   },
   "quiz": [
    {
     "id": "telinit3",
     "prompt": "Which systemd command does what <code>telinit 3</code> does?",
     "answer": "isolate",
     "options": [
      {
       "value": "isolate",
       "label": "<code>systemctl isolate multi-user.target</code>"
      },
      {
       "value": "setdef",
       "label": "<code>systemctl set-default multi-user.target</code>"
      },
      {
       "value": "start",
       "label": "<code>systemctl start multi-user.target</code>"
      }
     ],
     "explain": "Correct. isolate changes the running state; set-default only changes the next boot."
    },
    {
     "id": "rl2",
     "prompt": "What does <code>runlevel2.target</code> point to on systemd?",
     "answer": "multi",
     "options": [
      "rescue.target",
      {
       "value": "multi",
       "label": "multi-user.target"
      },
      "graphical.target",
      "Nothing; it doesn't exist"
     ],
     "explain": "Correct. Runlevels 2, 3 and 4 all map to multi-user.target."
    }
   ],
   "completion": "Translate runlevels into systemd targets: done."
  },
  {
   "id": "19.6",
   "kind": "vm",
   "title": "Inventory services and their boot states",
   "navSubtitle": "list-unit-files, list-units",
   "objective": "101.3",
   "difficulty": "Intermediate",
   "source": "Lab 6: Inventory services and their boot states",
   "workdir": "~/lpic1-section19",
   "summary": "",
   "scenario": "Security wants a list of services set to start at boot on a new Mint build, plus a count of each boot state.",
   "task": "List the service unit files with their states and count enabled, disabled, and static units. List the active targets.",
   "deliverable": "reports/unit-inventory.txt.",
   "steps": [
    {
     "cmd": "systemctl list-unit-files --type=service --no-pager > reports/unit-inventory.txt"
    },
    {
     "text": "for s in enabled disabled static; do echo \"$s: $(systemctl list-unit-files --type=service --no-pager | awk -v s=$s '$2==s' | wc -l)\"; done >> reports/unit-inventory.txt"
    },
    {
     "cmd": "systemctl list-units --type=target --no-pager >> reports/unit-inventory.txt"
    }
   ],
   "validation": "grep -E '^(enabled|disabled|static):' reports/unit-inventory.txt shows three counts, and grep graphical.target reports/unit-inventory.txt shows it is active.",
   "trap": "list-unit-files shows what is set to start at boot. list-units shows what is loaded in memory right now. static units cannot be enabled because they have no [Install] section; another unit pulls them in.",
   "paste": {
    "command": "cat reports/unit-inventory.txt",
    "checks": [
     {
      "re": "^UNIT FILE\\s+STATE",
      "say": "includes the list-unit-files table"
     },
     {
      "re": "^(enabled|disabled|static): \\d+\\s*$",
      "say": "has the enabled, disabled and static counts",
      "count": 3
     },
     {
      "re": "graphical\\.target\\s+loaded\\s+active\\s+active",
      "say": "list-units shows graphical.target active"
     }
    ]
   },
   "quiz": [
    {
     "id": "static",
     "prompt": "Why can't you enable a <em>static</em> unit?",
     "answer": "noinstall",
     "options": [
      {
       "value": "noinstall",
       "label": "It has no [Install] section; another unit pulls it in"
      },
      {
       "value": "masked",
       "label": "It's masked"
      },
      {
       "value": "root",
       "label": "Only root can enable it"
      }
     ],
     "explain": "Correct. enable uses the [Install] section to know where to link the unit."
    },
    {
     "id": "files",
     "prompt": "Which command shows what is set to start at boot, rather than what is loaded now?",
     "answer": "files",
     "options": [
      {
       "value": "files",
       "label": "<code>systemctl list-unit-files</code>"
      },
      {
       "value": "units",
       "label": "<code>systemctl list-units</code>"
      },
      {
       "value": "deps",
       "label": "<code>systemctl list-dependencies</code>"
      }
     ],
     "explain": "Correct. list-units shows what is in memory right now."
    }
   ],
   "completion": "Inventory services and their boot states: done."
  },
  {
   "id": "19.7",
   "kind": "vm",
   "title": "Find where a unit file lives and which copy wins",
   "navSubtitle": "systemctl cat, unit paths",
   "objective": "101.3",
   "difficulty": "Intermediate",
   "source": "Lab 7: Find where a unit file lives and which copy wins",
   "workdir": "~/lpic1-section19",
   "summary": "",
   "scenario": "Someone edited a cron unit file under /usr/lib and the change was lost after an update. You need to explain where local changes belong.",
   "task": "Show the cron unit file, where it was loaded from, and what is in each unit directory.",
   "deliverable": "reports/unit-paths.txt.",
   "steps": [
    {
     "cmd": "systemctl cat cron --no-pager > reports/unit-paths.txt"
    },
    {
     "cmd": "systemctl show -p FragmentPath cron >> reports/unit-paths.txt"
    },
    {
     "cmd": "ls /etc/systemd/system >> reports/unit-paths.txt"
    },
    {
     "cmd": "ls /usr/lib/systemd/system | head -20 >> reports/unit-paths.txt"
    },
    {
     "cmd": "ls -F /etc/systemd >> reports/unit-paths.txt"
    }
   ],
   "validation": "grep FragmentPath reports/unit-paths.txt shows cron.service under /usr/lib/systemd/system (or /lib/systemd/system on Mint 21), and the file shows the [Unit], [Service], and [Install] sections.",
   "trap": "Precedence is /etc/systemd/system first, then /run/systemd/system, then /usr/lib/systemd/system. Package files in /usr/lib are replaced on updates; your changes go in /etc. Some course handouts get this backwards.",
   "paste": {
    "command": "cat reports/unit-paths.txt",
    "checks": [
     {
      "re": "^FragmentPath=(/usr)?/lib/systemd/system/cron\\.service\\s*$",
      "say": "cron.service is loaded from the package directory"
     },
     {
      "re": "^\\[Unit\\]",
      "say": "the unit file shows the [Unit] section"
     },
     {
      "re": "^\\[Service\\]",
      "say": "the unit file shows the [Service] section"
     },
     {
      "re": "^\\[Install\\]",
      "say": "the unit file shows the [Install] section"
     }
    ]
   },
   "quiz": [
    {
     "id": "prec",
     "prompt": "Which unit directory wins when the same unit exists in all three?",
     "answer": "etc",
     "options": [
      {
       "value": "etc",
       "label": "<code>/etc/systemd/system</code>"
      },
      {
       "value": "run",
       "label": "<code>/run/systemd/system</code>"
      },
      {
       "value": "usr",
       "label": "<code>/usr/lib/systemd/system</code>"
      }
     ],
     "explain": "Correct. /etc beats /run, which beats /usr/lib."
    }
   ],
   "completion": "Find where a unit file lives and which copy wins: done."
  },
  {
   "id": "19.8",
   "kind": "vm",
   "title": "Deploy, start, and enable a practice service",
   "navSubtitle": "daemon-reload, start, enable",
   "objective": "101.3",
   "difficulty": "Intermediate",
   "source": "Lab 8: Deploy, start, and enable a practice service",
   "workdir": "~/lpic1-section19",
   "summary": "",
   "scenario": "The app team hands you a unit file for a small heartbeat service and asks you to run it now and at every boot.",
   "task": "Install the unit file, make systemd read it, start it, and enable it.",
   "deliverable": "reports/heartbeat.txt showing it active and enabled.",
   "steps": [
    {
     "cmd": "sudo cp samples/lab-heartbeat.service /etc/systemd/system/"
    },
    {
     "cmd": "sudo systemctl daemon-reload"
    },
    {
     "cmd": "sudo systemctl start lab-heartbeat"
    },
    {
     "cmd": "systemctl status lab-heartbeat --no-pager > reports/heartbeat.txt"
    },
    {
     "cmd": "sudo systemctl enable lab-heartbeat"
    },
    {
     "cmd": "ls -l /etc/systemd/system/multi-user.target.wants/lab-heartbeat.service >> reports/heartbeat.txt"
    },
    {
     "cmd": "systemctl is-active lab-heartbeat >> reports/heartbeat.txt; systemctl is-enabled lab-heartbeat >> reports/heartbeat.txt"
    }
   ],
   "validation": "tail -2 reports/heartbeat.txt shows active and enabled, and the ls line shows a link into the multi-user.target.wants directory.",
   "trap": "start runs it now; enable only creates the link that starts it at boot. You need both, or enable --now. Without daemon-reload after adding or editing a unit file, systemd keeps using the old version.",
   "paste": {
    "command": "cat reports/heartbeat.txt",
    "checks": [
     {
      "re": "Active: active \\(running\\)",
      "say": "systemctl status shows the service running"
     },
     {
      "re": "multi-user\\.target\\.wants/lab-heartbeat\\.service -> \\S*lab-heartbeat\\.service",
      "say": "enable created the link in multi-user.target.wants"
     },
     {
      "re": "^active\\s*$",
      "say": "is-active reports active"
     },
     {
      "re": "^enabled\\s*$",
      "say": "is-enabled reports enabled"
     }
    ]
   },
   "quiz": [
    {
     "id": "both",
     "prompt": "You ran <code>systemctl enable</code> on a new service. Is it running?",
     "answer": "no",
     "options": [
      {
       "value": "no",
       "label": "No. enable only sets it to start at boot; use start or enable --now"
      },
      {
       "value": "yes",
       "label": "Yes, enable also starts it"
      },
      {
       "value": "reboot",
       "label": "Only after daemon-reload"
      }
     ],
     "explain": "Correct. Boot-time state and current state are separate."
    },
    {
     "id": "reload",
     "prompt": "You edited a unit file in /etc/systemd/system. What must you run before systemd sees the change?",
     "answer": "dr",
     "options": [
      {
       "value": "dr",
       "label": "<code>systemctl daemon-reload</code>"
      },
      {
       "value": "tq",
       "label": "<code>telinit q</code>"
      },
      {
       "value": "reen",
       "label": "<code>systemctl reenable</code>"
      }
     ],
     "explain": "Correct. Without it systemd keeps the old version."
    }
   ],
   "completion": "Deploy, start, and enable a practice service: done."
  },
  {
   "id": "19.9",
   "kind": "vm",
   "title": "Stop, disable, and remove the practice service",
   "navSubtitle": "stop, disable, remove",
   "objective": "101.3",
   "difficulty": "Intermediate",
   "source": "Lab 9: Stop, disable, and remove the practice service",
   "workdir": "~/lpic1-section19",
   "summary": "",
   "scenario": "The heartbeat trial is over. Leave the build exactly as it was.",
   "task": "Check the service the SysV way, then stop it, disable it, and remove its unit file.",
   "deliverable": "reports/heartbeat-removed.txt.",
   "steps": [
    {
     "text": "service lab-heartbeat status > reports/heartbeat-removed.txt 2>&1"
    },
    {
     "cmd": "sudo systemctl stop lab-heartbeat"
    },
    {
     "cmd": "sudo systemctl disable lab-heartbeat"
    },
    {
     "cmd": "sudo rm /etc/systemd/system/lab-heartbeat.service"
    },
    {
     "cmd": "sudo systemctl daemon-reload"
    },
    {
     "cmd": "systemctl status lab-heartbeat --no-pager >> reports/heartbeat-removed.txt 2>&1"
    }
   ],
   "validation": "tail -3 reports/heartbeat-removed.txt reports that Unit lab-heartbeat.service could not be found.",
   "trap": "disable does not stop a running service, and stop does not prevent it starting at the next boot. mask is stronger than disable: it links the unit to /dev/null so nothing can start it, even by hand, until you unmask it.",
   "paste": {
    "command": "cat reports/heartbeat-removed.txt",
    "checks": [
     {
      "re": "lab-heartbeat\\.service - Lab heartbeat practice service",
      "say": "service status showed the heartbeat unit first"
     },
     {
      "re": "Unit lab-heartbeat\\.service could not be found",
      "say": "after removal systemd no longer finds the unit"
     }
    ]
   },
   "quiz": [
    {
     "id": "mask",
     "prompt": "What does <code>systemctl mask</code> do that <code>disable</code> doesn't?",
     "answer": "null",
     "options": [
      {
       "value": "null",
       "label": "Links the unit to /dev/null so nothing can start it, even by hand"
      },
      {
       "value": "stop",
       "label": "Stops it right away"
      },
      {
       "value": "delete",
       "label": "Deletes the unit file"
      }
     ],
     "explain": "Correct. unmask undoes it."
    },
    {
     "id": "disable",
     "prompt": "You disable a running service. What is its state now?",
     "answer": "running",
     "options": [
      {
       "value": "running",
       "label": "Still running; it just won't start at the next boot"
      },
      {
       "value": "stopped",
       "label": "Stopped"
      },
      {
       "value": "masked",
       "label": "Masked"
      }
     ],
     "explain": "Correct. disable does not stop a running service."
    }
   ],
   "completion": "Stop, disable, and remove the practice service: done."
  },
  {
   "id": "19.10",
   "kind": "vm",
   "title": "Check system health and plan a rescue",
   "navSubtitle": "is-system-running, rescue",
   "objective": "101.3",
   "difficulty": "Advanced",
   "source": "Lab 10: Check system health and plan a rescue",
   "workdir": "~/lpic1-section19",
   "summary": "",
   "scenario": "A user reports that web01 \"booted but something is off\". You practice the triage on your VM and write down how you would reach single-user mode if needed.",
   "task": "Check the overall state, list failed units, and show what the graphical target pulls in.",
   "deliverable": "reports/health.txt with a rescue plan at the end.",
   "steps": [
    {
     "cmd": "systemctl is-system-running > reports/health.txt"
    },
    {
     "cmd": "systemctl --failed --no-pager >> reports/health.txt"
    },
    {
     "cmd": "systemctl list-dependencies graphical.target --no-pager | head -25 >> reports/health.txt"
    },
    {
     "text": "Add the plan with nano reports/health.txt. Read only, Don't run on your VM: sudo systemctl isolate rescue.target (same as init 1 or telinit 1), or at boot add systemd.unit=rescue.target, or 1, or single to the kernel line. emergency.target is the more minimal one."
    }
   ],
   "validation": "head -1 reports/health.txt shows running or degraded, and grep -c rescue reports/health.txt is at least 1.",
   "trap": "degraded means the target is reached but at least one unit failed; it does not mean the system is down. list-dependencies shows that graphical.target includes multi-user.target, so a desktop also runs every server service.",
   "paste": {
    "command": "cat reports/health.txt",
    "checks": [
     {
      "re": "^(running|degraded)\\s*$",
      "say": "is-system-running reports running or degraded"
     },
     {
      "re": "loaded units? listed",
      "say": "systemctl --failed output is included"
     },
     {
      "re": "^graphical\\.target\\s*$",
      "say": "list-dependencies for graphical.target is included"
     },
     {
      "re": "rescue",
      "say": "the plan mentions rescue"
     }
    ]
   },
   "quiz": [
    {
     "id": "degraded",
     "prompt": "<code>is-system-running</code> prints <code>degraded</code>. What does that mean?",
     "answer": "onefail",
     "options": [
      {
       "value": "onefail",
       "label": "Booted, but at least one unit failed"
      },
      {
       "value": "down",
       "label": "The system is going down"
      },
      {
       "value": "rescue",
       "label": "It's in rescue mode"
      }
     ],
     "explain": "Correct. Check which unit with systemctl --failed."
    },
    {
     "id": "single",
     "prompt": "Which kernel parameter boots into single-user (rescue) mode?",
     "answer": "unit",
     "options": [
      {
       "value": "unit",
       "label": "<code>systemd.unit=rescue.target</code>"
      },
      {
       "value": "init",
       "label": "<code>init=rescue</code>"
      },
      {
       "value": "rl",
       "label": "<code>runlevel=rescue</code>"
      }
     ],
     "explain": "Correct. 1 or single on the kernel line also works."
    }
   ],
   "completion": "Check system health and plan a rescue: done."
  },
  {
   "id": "19.11",
   "kind": "vm",
   "title": "Broadcast a notice with wall and control mesg",
   "navSubtitle": "wall, mesg",
   "objective": "101.3",
   "difficulty": "Advanced",
   "source": "Lab 11: Broadcast a notice with wall and control mesg",
   "workdir": "~/lpic1-section19",
   "summary": "",
   "scenario": "Before a maintenance window you must warn everyone logged in to app02. You test the broadcast on your own sessions first.",
   "task": "Check that your terminal accepts messages, send a wall message two ways, then turn messages off and back on.",
   "deliverable": "reports/wall-test.txt.",
   "steps": [
    {
     "text": "mesg > reports/wall-test.txt"
    },
    {
     "text": "mesg y; wall 'Practice notice: app02 maintenance drill at 22:00, no action needed'"
    },
    {
     "cmd": "echo 'Second notice: drill complete' | wall"
    },
    {
     "text": "mesg n; mesg >> reports/wall-test.txt; mesg y; mesg >> reports/wall-test.txt"
    }
   ],
   "validation": "cat reports/wall-test.txt shows is y, is n, is y, and both broadcasts appeared in your terminal with a Broadcast message from banner.",
   "trap": "wall reads the message from its arguments, a file, or standard input; with no message it waits for text until Ctrl+D. Users with mesg n do not see broadcasts from ordinary users, but root's messages still get through.",
   "paste": {
    "command": "cat reports/wall-test.txt",
    "checks": [
     {
      "re": "^is y\\s*$",
      "say": "mesg reported is y before and after",
      "count": 2
     },
     {
      "re": "^is n\\s*$",
      "say": "mesg n turned messages off",
      "count": 1
     }
    ]
   },
   "quiz": [
    {
     "id": "wallin",
     "prompt": "Run with no message, what does <code>wall</code> do?",
     "answer": "stdin",
     "options": [
      {
       "value": "stdin",
       "label": "Reads the message from standard input until Ctrl+D"
      },
      {
       "value": "err",
       "label": "Prints an error"
      },
      {
       "value": "blank",
       "label": "Sends a blank broadcast"
      }
     ],
     "explain": "Correct. It also takes a message as arguments or a file."
    },
    {
     "id": "root",
     "prompt": "A user has <code>mesg n</code>. Whose wall messages still reach them?",
     "answer": "root",
     "options": [
      {
       "value": "root",
       "label": "root's"
      },
      {
       "value": "none",
       "label": "Nobody's"
      },
      {
       "value": "group",
       "label": "Users in the same group"
      }
     ],
     "explain": "Correct. mesg n only blocks ordinary users."
    }
   ],
   "completion": "Broadcast a notice with wall and control mesg: done."
  },
  {
   "id": "19.12",
   "kind": "vm",
   "title": "Rehearse a scheduled reboot without rebooting",
   "navSubtitle": "shutdown -k, -c",
   "objective": "101.3",
   "difficulty": "Advanced",
   "source": "Lab 12: Rehearse a scheduled reboot without rebooting",
   "workdir": "~/lpic1-section19",
   "summary": "",
   "scenario": "Tonight's change needs a 15-minute warning before db01 reboots. You rehearse the announcement on your VM and must not take it down.",
   "task": "Send the warning with shutdown -k, confirm the schedule, then cancel it.",
   "deliverable": "reports/shutdown-drill.txt.",
   "steps": [
    {
     "cmd": "sudo shutdown -k +15 'Practice notice: db01 reboot drill, no action needed'"
    },
    {
     "cmd": "cat /run/systemd/shutdown/scheduled > reports/shutdown-drill.txt 2>&1"
    },
    {
     "cmd": "sudo shutdown -c"
    },
    {
     "cmd": "ls /run/systemd/shutdown/ >> reports/shutdown-drill.txt 2>&1; systemctl is-system-running >> reports/shutdown-drill.txt"
    },
    {
     "text": "Read only, Don't run on your VM: the real change would be sudo shutdown -r +15 'db01 rebooting for patching, save your work'."
    }
   ],
   "validation": "cat reports/shutdown-drill.txt. While the drill was scheduled the file named a dry mode (or shutdown -k reported the warning was sent), after the cancel the scheduled file is gone, and the last line still shows running or degraded.",
   "trap": "-k only sends the warning and never stops the system. Always pair a practice shutdown with -c. Without a time, systemd's shutdown waits one minute; now means immediately. Five minutes before the time, logins by ordinary users are blocked with /run/nologin.",
   "paste": {
    "command": "cat reports/shutdown-drill.txt",
    "checks": [
     {
      "re": "^USEC=\\d+",
      "say": "the schedule file existed while the drill was pending"
     },
     {
      "re": "^scheduled\\s*$",
      "say": "after shutdown -c the scheduled file is gone",
      "absent": true
     },
     {
      "re": "^(running|degraded)\\s*$",
      "say": "the system is still running"
     }
    ]
   },
   "quiz": [
    {
     "id": "k",
     "prompt": "What does <code>shutdown -k +15</code> do?",
     "answer": "warn",
     "options": [
      {
       "value": "warn",
       "label": "Sends the warning only; nothing shuts down"
      },
      {
       "value": "kill",
       "label": "Kills all user processes in 15 minutes"
      },
      {
       "value": "kexec",
       "label": "Reboots with kexec in 15 minutes"
      }
     ],
     "explain": "Correct. Pair a drill with shutdown -c."
    },
    {
     "id": "notime",
     "prompt": "What does <code>shutdown</code> do with no time given on systemd?",
     "answer": "one",
     "options": [
      {
       "value": "one",
       "label": "Waits one minute"
      },
      {
       "value": "now",
       "label": "Shuts down immediately"
      },
      {
       "value": "ask",
       "label": "Asks for a time"
      }
     ],
     "explain": "Correct. Use now for immediately."
    }
   ],
   "completion": "Rehearse a scheduled reboot without rebooting: done."
  },
  {
   "id": "19.13",
   "kind": "vm",
   "title": "Write a shutdown command reference",
   "navSubtitle": "halt, poweroff, reboot, acpid",
   "objective": "101.3",
   "difficulty": "Advanced",
   "source": "Lab 13: Write a shutdown command reference",
   "workdir": "~/lpic1-section19",
   "summary": "",
   "scenario": "A new on-call engineer asks how halt, poweroff, reboot, and shutdown relate, and why acpid comes up on the exam.",
   "task": "Show where each command really points, check for acpid, and write a short reference.",
   "deliverable": "reports/shutdown-reference.txt.",
   "steps": [
    {
     "text": "for c in shutdown halt poweroff reboot telinit init; do ls -l $(command -v $c); done > reports/shutdown-reference.txt"
    },
    {
     "cmd": "systemctl list-unit-files --no-pager | grep -i acpid >> reports/shutdown-reference.txt || echo 'acpid not installed on this build' >> reports/shutdown-reference.txt"
    },
    {
     "text": "nano reports/shutdown-reference.txt and add one line each, read only, Don't run on your VM: shutdown -h now (halt or power off), shutdown -H (halt only), shutdown -P (power off), shutdown -r 22:30 (reboot at a 24-hour clock time), shutdown +10 'msg', shutdown -c, halt -p, systemctl poweroff, systemctl reboot, systemctl halt, and systemctl isolate poweroff.target."
    }
   ],
   "validation": "grep -c systemctl reports/shutdown-reference.txt is at least 4, and the ls lines show shutdown, halt, poweroff, and reboot linking to systemctl.",
   "trap": "On systemd systems these are all links to systemctl, so halt -p behaves like poweroff and reboot is the same as shutdown -r now. shutdown first sends SIGTERM so processes can exit cleanly, then SIGKILL to anything left. acpid handles ACPI events such as a power button press, and is often absent on VMs.",
   "paste": {
    "command": "cat reports/shutdown-reference.txt",
    "checks": [
     {
      "re": "/(shutdown|halt|poweroff|reboot) -> \\S*systemctl\\s*$",
      "say": "shutdown, halt, poweroff and reboot link to systemctl",
      "count": 4
     },
     {
      "re": "acpid",
      "say": "the acpid check is included"
     },
     {
      "re": "systemctl\\s+(poweroff|reboot|halt)\\b",
      "say": "your reference lists the systemctl forms",
      "min": 3
     },
     {
      "re": "shutdown\\s+-c\\b",
      "say": "your reference covers shutdown -c"
     }
    ]
   },
   "quiz": [
    {
     "id": "acpid",
     "prompt": "Which daemon reacts to a power button press?",
     "answer": "acpid",
     "options": [
      "udevd",
      "acpid",
      "logind-power",
      "powerd"
     ],
     "explain": "Correct. It handles ACPI events and is often missing on VMs."
    },
    {
     "id": "h",
     "prompt": "Which <code>shutdown</code> option halts without powering off?",
     "answer": "H",
     "options": [
      {
       "value": "H",
       "label": "<code>-H</code>"
      },
      {
       "value": "P",
       "label": "<code>-P</code>"
      },
      {
       "value": "k",
       "label": "<code>-k</code>"
      },
      {
       "value": "r",
       "label": "<code>-r</code>"
      }
     ],
     "explain": "Correct. -P powers off, -h does either, and -r reboots."
    }
   ],
   "completion": "Write a shutdown command reference: done."
  }
 ],
 "review": {
  "traps": [
   "Reading the runlevel output backwards. The first value is the previous runlevel (N if none) and the second is the current one.",
   "Forgetting the inittab record format. The default is id:3:initdefault:, with the runlevel in the second field.",
   "Mixing up runlevel numbers. 0 halt, 1 single user, 2 multi-user without networking on Red Hat style systems, 3 multi-user text with networking, 5 graphical, 6 reboot. Debian historically used 2 for full multi-user.",
   "Confusing K and S links. K stops, S starts, the number sets the order, and the links point to scripts in init.d.",
   "Mixing up script locations. Red Hat uses /etc/rc.d/init.d and /etc/rc.d/rcN.d; Debian uses /etc/init.d and /etc/rcN.d.",
   "Forgetting telinit q. It tells SysV init to reread /etc/inittab without changing runlevel.",
   "Thinking systemctl set-default changes the running state. It changes the next boot only; isolate changes the running state.",
   "Using start instead of isolate to switch targets. start adds units but stops nothing.",
   "Confusing enable with start, and disable with stop. Boot-time behavior and current state are separate.",
   "Getting unit file precedence backwards. /etc/systemd/system beats /run/systemd/system, which beats /usr/lib/systemd/system.",
   "Forgetting systemctl daemon-reload after adding or editing a unit file.",
   "Treating shutdown -k as a real shutdown. It only sends the warning; shutdown -c cancels a pending shutdown.",
   "Using 12-hour times. shutdown takes now, +minutes, or hh:mm in 24-hour time, and with no time systemd waits one minute.",
   "Forgetting that wall only reaches terminals with mesg y, and that halt, poweroff, and reboot are links to systemctl on systemd systems."
  ],
  "trapQuiz": [
   {
    "id": "tq1",
    "prompt": "<code>runlevel</code> prints <code>3 5</code>. What is the current runlevel?",
    "answer": "5",
    "options": [
     "3",
     "5",
     {
      "value": "n",
      "label": "Can't tell without N"
     }
    ],
    "explain": "Correct. Previous first, current second."
   },
   {
    "id": "tq2",
    "prompt": "Which runlevel is single-user mode?",
    "answer": "1",
    "options": [
     "0",
     "1",
     "2",
     "6"
    ],
    "explain": "Correct. 0 halts and 6 reboots."
   },
   {
    "id": "tq3",
    "prompt": "What does <code>telinit q</code> do?",
    "answer": "reread",
    "options": [
     {
      "value": "reread",
      "label": "Makes init reread /etc/inittab without changing runlevel"
     },
     {
      "value": "quit",
      "label": "Shuts the system down"
     },
     {
      "value": "query",
      "label": "Prints the current runlevel"
     }
    ],
    "explain": "Correct."
   },
   {
    "id": "tq4",
    "prompt": "In <code>/etc/rc3.d</code>, what does a link named <code>K15httpd</code> do?",
    "answer": "stop",
    "options": [
     {
      "value": "stop",
      "label": "Stops httpd when entering runlevel 3, in position 15"
     },
     {
      "value": "start",
      "label": "Starts httpd 15 seconds after boot"
     },
     {
      "value": "kill",
      "label": "Kills httpd with signal 15 at shutdown only"
     }
    ],
    "explain": "Correct. K stops, S starts, and the number sets the order."
   },
   {
    "id": "tq5",
    "prompt": "Which command changes the target the system boots into next time?",
    "answer": "setdef",
    "options": [
     {
      "value": "setdef",
      "label": "<code>systemctl set-default</code>"
     },
     {
      "value": "isolate",
      "label": "<code>systemctl isolate</code>"
     },
     {
      "value": "start",
      "label": "<code>systemctl start</code>"
     }
    ],
    "explain": "Correct. It doesn't change the running state."
   },
   {
    "id": "tq6",
    "prompt": "Why is <code>systemctl start multi-user.target</code> wrong for leaving the desktop?",
    "answer": "adds",
    "options": [
     {
      "value": "adds",
      "label": "start only adds units and stops nothing; isolate is needed"
     },
     {
      "value": "notarget",
      "label": "Targets can't be started"
     },
     {
      "value": "root",
      "label": "It needs telinit first"
     }
    ],
    "explain": "Correct."
   },
   {
    "id": "tq7",
    "prompt": "Which unit file directory has the lowest precedence?",
    "answer": "usr",
    "options": [
     {
      "value": "etc",
      "label": "<code>/etc/systemd/system</code>"
     },
     {
      "value": "run",
      "label": "<code>/run/systemd/system</code>"
     },
     {
      "value": "usr",
      "label": "<code>/usr/lib/systemd/system</code>"
     }
    ],
    "explain": "Correct. Package files lose to /run and /etc."
   },
   {
    "id": "tq8",
    "prompt": "Which command reboots at half past ten tonight?",
    "answer": "2230",
    "options": [
     {
      "value": "2230",
      "label": "<code>shutdown -r 22:30</code>"
     },
     {
      "value": "1030",
      "label": "<code>shutdown -r 10:30pm</code>"
     },
     {
      "value": "k",
      "label": "<code>shutdown -k 22:30</code>"
     }
    ],
    "explain": "Correct. shutdown takes 24-hour hh:mm, and -k never reboots."
   }
  ],
  "challenge": {
   "intro": "Complete these tasks without notes. Use only your Linux Mint VM and the files in ~/lpic1-section19. Rerun Steps 2 to 4 of the Lab Setup first if you changed the samples. Never run isolate, init, telinit, or a shutdown without -k.",
   "tasks": [
    "Save the default runlevel from samples/inittab, and only the number, to reports/challenge-default.txt.",
    "Save the current runlevel, the previous runlevel, and the default systemd target of your VM to reports/challenge-state.txt.",
    "List which services runlevel 3 on the legacy server stops, and which script each one points to.",
    "Prove which target runlevel5.target really is.",
    "Show where the cron unit file is loaded from and explain where a local override would go.",
    "Install the practice heartbeat service, start it, enable it, prove both states, then remove it completely.",
    "Send a wall message to your own sessions and prove that mesg n blocks messages from ordinary users.",
    "Schedule a 20-minute reboot warning with shutdown -k, prove it was scheduled, and cancel it."
   ],
   "outro": "Your final handoff is the reports directory. For each file, write a short sentence explaining what it proves and confirm that your VM never left graphical.target."
  },
  "questions": [
   {
    "q": "Legacy support request: “db01 still uses SysV init. Which runlevel does it boot into, and which file sets it?”",
    "a": "Runlevel 3, from the <code>id:3:initdefault:</code> record in <code>/etc/inittab</code>. The second field is the runlevel; <code>grep initdefault /etc/inittab</code> finds it."
   },
   {
    "q": "Change board request: “Our runbook says telinit 3. What is the systemd command that does the same thing, and what will it stop?”",
    "a": "<code>sudo systemctl isolate multi-user.target</code>. It stops every unit the new target doesn't need, including the graphical session and display manager."
   },
   {
    "q": "Security request: “Give me a list of every service set to start at boot on this build.”",
    "a": "<code>systemctl list-unit-files --type=service --state=enabled --no-pager</code>. Units marked static start only when another unit pulls them in."
   },
   {
    "q": "App team request: “We dropped a new unit file into /etc/systemd/system but systemctl still shows the old settings. Why?”",
    "a": "systemd still has the old copy in memory. Run <code>sudo systemctl daemon-reload</code>, then restart the service, and check it with <code>systemctl cat NAME</code>."
   },
   {
    "q": "Help desk request: “Warn everyone on app02 that it reboots in 15 minutes, and tell me how you would cancel it.”",
    "a": "<code>sudo shutdown -r +15 'app02 reboots in 15 minutes, save your work'</code> warns logged-in users and schedules it. <code>sudo shutdown -c</code> cancels it."
   },
   {
    "q": "Teammate request: “I edited a file under /usr/lib/systemd/system and my change disappeared after patching. Where should it go?”",
    "a": "Package files under <code>/usr/lib/systemd/system</code> are replaced on updates. Put changes in <code>/etc/systemd/system</code>, ideally as a drop-in made with <code>sudo systemctl edit NAME</code>, then <code>daemon-reload</code>."
   },
   {
    "q": "On-call request: “The power button on web01 does nothing. Which daemon handles that, and how do I check whether it is installed?”",
    "a": "acpid handles ACPI events such as the power button. Check it with <code>systemctl list-unit-files | grep acpid</code> or <code>systemctl status acpid</code>, and install it with <code>sudo apt install acpid</code> if missing."
   }
  ],
  "mastery": [
   "I can name SysV runlevels 0 to 6 and what each one does.",
   "I can find the default runlevel in /etc/inittab and explain the id:N:initdefault: record.",
   "I can read the output of runlevel and who -r.",
   "I can explain K and S links in /etc/rcN.d and where the real scripts live on Red Hat and Debian systems.",
   "I can describe init N, telinit N, and telinit q without running them on a production system.",
   "I can map runlevels to systemd targets and show the default with systemctl get-default.",
   "I can explain the difference between set-default and isolate, and between start and isolate.",
   "I can start, stop, restart, enable, disable, and mask a service, and check it with is-active and is-enabled.",
   "I can find a unit file with systemctl cat and explain the /etc, /run, and /usr/lib precedence.",
   "I can check system health with is-system-running and --failed, and name rescue.target and emergency.target.",
   "I can send wall messages and control them with mesg.",
   "I can schedule, warn about, and cancel a shutdown with shutdown, and explain halt, poweroff, reboot, and acpid."
  ]
 }
});
