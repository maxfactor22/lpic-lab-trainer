/* Section 18: GRUB Legacy and GRUB 2. Generated from LPIC_Section18_Lab_Workbook.docx by vm_section.py;
   paste checks, quizzes and model answers were added for the app. */
LPIC.section({
 "id": "section-18",
 "number": 18,
 "title": "GRUB Legacy and GRUB 2",
 "objectives": [
  "101.2",
  "102.2"
 ],
 "kind": "vm",
 "source": "LPIC_Section18_Lab_Workbook.docx",
 "scenario": "Objectives 101.2 and 102.2: Install and manage a boot manager. Read GRUB Legacy and GRUB2 configurations, use the boot menus and GRUB command line, and pass kernel parameters for rescue and troubleshooting.",
 "overview": {
  "paragraphs": [
   "Treat each lab like a ticket from someone who is about to touch a boot loader. Your job is to read the real configuration, work out exactly what a change would do, and hand back a report or a tested draft, so the change can be reviewed before it is made.",
   "Safety first. Every lab is inspect-and-explain. You never run grub-install, update-grub, or grub-mkconfig -o /boot/grub/grub.cfg, never copy a file into /etc/default or /etc/grub.d, and never reboot. Drafts are made on copies in ~/lpic1-section18/configs. Anything marked Don't run on your VM is exam content to read and explain only.",
   "Linux Mint uses GRUB2. GRUB Legacy (menu.lst, grub.conf, and device names such as (hd0,0)) is still on the exam, so the Beginner labs use a sample grub.conf from an old two-disk server, db01, which you read and explain. The menu keys and the GRUB command line are described, not practiced, because reaching them means rebooting.",
   "Several commands need sudo on Mint: reading /boot/grub/grub.cfg, grub-probe, grub-mkconfig, dmesg, and /var/log/boot.log."
  ],
  "setup": [
   {
    "text": "Step 1: Create the practice workspace:"
   },
   {
    "cmd": "mkdir -p ~/lpic1-section18/{configs,reports,samples}"
   },
   {
    "cmd": "cd ~/lpic1-section18"
   },
   {
    "text": "Step 2: Copy the real GRUB2 settings so you can draft changes safely. These are copies; the originals are never edited:"
   },
   {
    "cmd": "cp /etc/default/grub configs/grub.default"
   },
   {
    "cmd": "cp /etc/grub.d/40_custom configs/40_custom.copy"
   },
   {
    "text": "Step 3: Create the GRUB Legacy sample from db01 and the menu.lst link that old Red Hat systems used:"
   },
   {
    "cmd": "printf 'default=0\\ntimeout=10\\nsplashimage=(hd0,0)/grub/splash.xpm.gz\\ntitle Linux 3.10 on first disk\\n\\troot (hd0,0)\\n\\tkernel /vmlinuz-3.10.0 ro root=/dev/sda2 quiet\\n\\tinitrd /initramfs-3.10.0.img\\ntitle Linux 3.10 rescue on second disk\\n\\troot (hd1,1)\\n\\tkernel /vmlinuz-3.10.0 ro root=/dev/sdb3 single\\n\\tinitrd /initramfs-3.10.0.img\\ntitle Other OS on first disk\\n\\trootnoverify (hd0,2)\\n\\tchainloader +1\\n' > samples/grub.conf"
   },
   {
    "cmd": "ln -sf grub.conf samples/menu.lst"
   },
   {
    "text": "Validation check: Run ls -l samples configs and confirm menu.lst points to grub.conf and both copies exist, then run grep -c '^title' samples/grub.conf and confirm it prints 3."
   }
  ],
  "commands": [
   "GRUB Legacy: /boot/grub/menu.lst",
   "/boot/grub/grub.conf",
   "default",
   "timeout",
   "hiddenmenu",
   "splashimage",
   "title",
   "root (hd0",
   "0)",
   "kernel",
   "initrd",
   "rootnoverify",
   "chainloader +1",
   "password",
   "grub-install",
   "grub> setup (hd0)",
   "find",
   "displaymem",
   "the menu keys e",
   "a",
   "c",
   "b",
   "Esc. GRUB2: /boot/grub/grub.cfg",
   "/boot/grub2/grub.cfg",
   "/etc/default/grub",
   "GRUB_DEFAULT",
   "GRUB_TIMEOUT",
   "GRUB_TIMEOUT_STYLE",
   "GRUB_CMDLINE_LINUX",
   "GRUB_CMDLINE_LINUX_DEFAULT",
   "/etc/grub.d",
   "40_custom",
   "menuentry",
   "set root=(hd0",
   "msdos1)",
   "search --fs-uuid",
   "linux",
   "linux16",
   "linuxefi",
   "initrd",
   "update-grub",
   "grub-mkconfig -o",
   "grub2-mkconfig",
   "grub-script-check",
   "grub-probe",
   "grub-editenv list",
   "grub-mkpasswd-pbkdf2",
   "the menu keys e",
   "c",
   "Ctrl+X",
   "F10",
   "Ctrl+C",
   "Esc. Kernel parameters: single",
   "1",
   "S",
   "systemd.unit=rescue.target",
   "systemd.unit=emergency.target",
   "emergency",
   "init=/bin/bash",
   "ro",
   "rw",
   "root=",
   "quiet",
   "splash",
   "nomodeset. Messages: /proc/cmdline",
   "dmesg",
   "journalctl -k",
   "/var/log/boot.log"
  ],
  "memoryHook": "Legacy counts from zero and edits take effect at the next boot; GRUB2 counts partitions from one and needs a rebuild. In GRUB Legacy, title starts an entry, root (hd0,0) picks the first disk and first partition, and kernel and initrd load the files; edit menu.lst and you are done. In GRUB2, you never edit grub.cfg: you change /etc/default/grub or /etc/grub.d, then run update-grub (grub-mkconfig -o) to rebuild it. At either menu, e edits, c opens the command line, and a temporary kernel parameter such as single or systemd.unit=rescue.target lasts for one boot only.",
  "reference": []
 },
 "lessons": [
  {
   "id": "18.1",
   "kind": "vm",
   "title": "Read an old server's GRUB Legacy configuration",
   "navSubtitle": "grub.conf, default, timeout",
   "objective": "102.2",
   "difficulty": "Beginner",
   "source": "Lab 1: Read an old server's GRUB Legacy configuration",
   "workdir": "~/lpic1-section18",
   "summary": "",
   "scenario": "db01 is an old two-disk server that still runs GRUB Legacy. Before a data-center move, the facilities team asks which entry it boots by default and how long it waits at the menu.",
   "task": "Read samples/grub.conf, number its title sections from zero, and record the default entry and timeout.",
   "deliverable": "reports/legacy-settings.txt.",
   "steps": [
    {
     "cmd": "ls -l samples/menu.lst > reports/legacy-settings.txt"
    },
    {
     "cmd": "grep -E '^(default|timeout|hiddenmenu|splashimage)' samples/grub.conf >> reports/legacy-settings.txt"
    },
    {
     "cmd": "grep '^title' samples/grub.conf | awk '{print NR-1\": \"$0}' >> reports/legacy-settings.txt"
    },
    {
     "cmd": "echo 'Answer: default=0 boots entry 0, Linux 3.10 on first disk, after a 10-second visible menu' >> reports/legacy-settings.txt"
    }
   ],
   "validation": "grep -E '^[0-2]: title' reports/legacy-settings.txt shows three numbered entries starting at 0, and the Answer line names entry 0.",
   "trap": "On Red Hat systems menu.lst was often a symbolic link to grub.conf; both names are on the exam. default counts title sections from 0. There is no hiddenmenu line here, so the menu is shown for the full timeout. Changes to this file take effect at the next boot; there is no rebuild step.",
   "paste": {
    "command": "cat reports/legacy-settings.txt",
    "checks": [
     {
      "re": "menu\\.lst -> grub\\.conf",
      "say": "menu.lst is a link to grub.conf"
     },
     {
      "re": "^timeout=10",
      "say": "the timeout line is included"
     },
     {
      "re": "^[0-2]: title",
      "say": "three title sections are numbered from 0",
      "count": 3
     },
     {
      "re": "^Answer:.*\\bentry 0\\b",
      "say": "the Answer line names entry 0"
     }
    ]
   },
   "quiz": [
    {
     "id": "next",
     "prompt": "You changed <code>grub.conf</code> on a GRUB Legacy server. What else must you run?",
     "answer": "nothing",
     "options": [
      {
       "value": "nothing",
       "label": "Nothing. It is read at the next boot"
      },
      {
       "value": "upd",
       "label": "<code>update-grub</code>"
      },
      {
       "value": "inst",
       "label": "<code>grub-install</code>"
      }
     ],
     "explain": "Correct. Only GRUB2 needs its menu rebuilt."
    },
    {
     "id": "hidden",
     "prompt": "What does <code>hiddenmenu</code> do?",
     "answer": "hide",
     "options": [
      {
       "value": "hide",
       "label": "Hides the menu until a key is pressed during the timeout"
      },
      {
       "value": "skip",
       "label": "Removes the timeout"
      },
      {
       "value": "lock",
       "label": "Locks the menu with a password"
      }
     ],
     "explain": "Correct."
    }
   ],
   "completion": "Read an old server's GRUB Legacy configuration: done."
  },
  {
   "id": "18.2",
   "kind": "vm",
   "title": "Translate GRUB Legacy device names to Linux devices",
   "navSubtitle": "(hd0,0) to /dev/sda1",
   "objective": "102.2",
   "difficulty": "Beginner",
   "source": "Lab 2: Translate GRUB Legacy device names to Linux devices",
   "workdir": "~/lpic1-section18",
   "summary": "",
   "scenario": "The move plan for db01 lists disks by their Linux names. The facilities engineer needs to know which physical disk and partition each GRUB entry depends on.",
   "task": "Extract every GRUB device name from the sample, translate it, and add the GRUB2 equivalents.",
   "deliverable": "reports/legacy-devices.txt.",
   "steps": [
    {
     "cmd": "grep -oE '\\(hd[0-9]+,[0-9]+\\)' samples/grub.conf | sort -u | awk -F'[(hd,)]+' '{printf \"%s = /dev/sd%c%d\\n\", $0, 97+$2, $3+1}' > reports/legacy-devices.txt"
    },
    {
     "cmd": "echo 'GRUB2 equivalents: (hd0,msdos1), (hd0,msdos3), (hd1,msdos2); on GPT disks, (hd0,gpt1) and so on' >> reports/legacy-devices.txt"
    }
   ],
   "validation": "cat reports/legacy-devices.txt shows (hd0,0) = /dev/sda1, (hd0,2) = /dev/sda3, and (hd1,1) = /dev/sdb2.",
   "trap": "GRUB Legacy counts both disks and partitions from 0; GRUB2 counts disks from 0 but partitions from 1 and adds the table type (msdos or gpt). The root line names the partition that holds /boot, and root= on the kernel line names the Linux root filesystem. They are often different partitions, as in this sample.",
   "paste": {
    "command": "cat reports/legacy-devices.txt",
    "checks": [
     {
      "re": "\\(hd0,0\\) = /dev/sda1\\b",
      "say": "(hd0,0) is /dev/sda1"
     },
     {
      "re": "\\(hd0,2\\) = /dev/sda3\\b",
      "say": "(hd0,2) is /dev/sda3"
     },
     {
      "re": "\\(hd1,1\\) = /dev/sdb2\\b",
      "say": "(hd1,1) is /dev/sdb2"
     },
     {
      "re": "\\(hd0,msdos1\\)",
      "say": "the GRUB2 equivalents are listed"
     }
    ]
   },
   "quiz": [
    {
     "id": "g2",
     "prompt": "What is <code>/dev/sda1</code> in GRUB2 on an MBR disk?",
     "answer": "msdos1",
     "options": [
      {
       "value": "msdos1",
       "label": "<code>(hd0,msdos1)</code>"
      },
      {
       "value": "msdos0",
       "label": "<code>(hd0,msdos0)</code>"
      },
      {
       "value": "hd11",
       "label": "<code>(hd1,1)</code>"
      }
     ],
     "explain": "Correct. GRUB2 counts disks from 0 but partitions from 1."
    },
    {
     "id": "rootline",
     "prompt": "In GRUB Legacy, what does the <code>root</code> line name?",
     "answer": "boot",
     "options": [
      {
       "value": "boot",
       "label": "The partition that holds the kernel and /boot files"
      },
      {
       "value": "rootfs",
       "label": "Always the Linux root filesystem"
      },
      {
       "value": "user",
       "label": "The root user's home"
      }
     ],
     "explain": "Correct. root= on the kernel line names the Linux root filesystem."
    }
   ],
   "completion": "Translate GRUB Legacy device names to Linux devices: done."
  },
  {
   "id": "18.3",
   "kind": "vm",
   "title": "Write a runbook for the GRUB Legacy menu and command line",
   "navSubtitle": "Legacy menu keys, grub>",
   "objective": "102.2",
   "difficulty": "Beginner",
   "source": "Lab 3: Write a runbook for the GRUB Legacy menu and command line",
   "workdir": "~/lpic1-section18",
   "summary": "",
   "scenario": "db01 sometimes needs a hands-on boot during the move, and the facilities engineer has never seen a GRUB Legacy menu. They ask for a short runbook of the keys and command-line commands.",
   "task": "Write a runbook covering the menu keys, the entry editor keys, and the grub> commands, from the explanation below. Don't run on your VM: Mint has no GRUB Legacy.",
   "deliverable": "reports/legacy-keys.txt.",
   "steps": [
    {
     "text": "nano reports/legacy-keys.txt"
    },
    {
     "text": "At the menu (press Esc during the countdown if hiddenmenu is set): the arrow keys select an entry, Enter boots it, e edits it, a appends text to the kernel line, c opens the grub> command line, and p asks for the password if the menu is locked."
    },
    {
     "text": "In the entry editor: the arrow keys select a line, e edits that line, Enter accepts the line, o and O add a line below or above, d deletes a line, b boots the edited entry, and Esc goes back without saving."
    },
    {
     "text": "At grub>: help lists commands, help displaymem explains one, displaymem shows memory, find /grub/grub.conf finds which partition holds a file, root (hd0,0) sets the boot partition, kernel and initrd load files, boot starts them, and Esc returns to the menu."
    },
    {
     "text": "Save the runbook with Ctrl+O and exit with Ctrl+X."
    }
   ],
   "validation": "grep -cE 'displaymem|find|setup|Esc|append' reports/legacy-keys.txt returns at least 4.",
   "trap": "Edits made at the menu last for one boot only; to make them permanent, change grub.conf. a is the quickest way to add a kernel parameter such as single. Without a GRUB password, anyone at the console could boot into single-user mode and get a root shell.",
   "paste": {
    "command": "cat reports/legacy-keys.txt",
    "checks": [
     {
      "re": "append",
      "say": "explains a (append to the kernel line)"
     },
     {
      "re": "\\bEsc\\b",
      "say": "explains Esc"
     },
     {
      "re": "displaymem",
      "say": "includes displaymem"
     },
     {
      "re": "\\bfind\\b",
      "say": "includes find"
     }
    ]
   },
   "quiz": [
    {
     "id": "bootkey",
     "prompt": "In the GRUB Legacy entry editor, which key boots the edited entry?",
     "answer": "b",
     "options": [
      {
       "value": "b",
       "label": "<code>b</code>"
      },
      {
       "value": "ctrlx",
       "label": "<code>Ctrl+X</code>"
      },
      {
       "value": "enter",
       "label": "<code>Enter</code>"
      }
     ],
     "explain": "Correct. GRUB2 uses Ctrl+X or F10."
    },
    {
     "id": "one",
     "prompt": "You added <code>single</code> at the GRUB Legacy menu. How long does it last?",
     "answer": "once",
     "options": [
      {
       "value": "once",
       "label": "For this boot only"
      },
      {
       "value": "always",
       "label": "Until you remove it"
      },
      {
       "value": "upd",
       "label": "Until update-grub runs"
      }
     ],
     "explain": "Correct. Make it permanent in grub.conf."
    }
   ],
   "completion": "Write a runbook for the GRUB Legacy menu and command line: done."
  },
  {
   "id": "18.4",
   "kind": "vm",
   "title": "Explain how GRUB Legacy is installed and how it chain loads",
   "navSubtitle": "grub-install, chainloader +1",
   "objective": "102.2",
   "difficulty": "Beginner",
   "source": "Lab 4: Explain how GRUB Legacy is installed and how it chain loads",
   "workdir": "~/lpic1-section18",
   "summary": "",
   "scenario": "The new disk for db01 arrives blank. The project lead asks how GRUB Legacy would be put on it, and what the third menu entry in the sample does.",
   "task": "Read the chain-load entry and write notes on the install commands. Don't run on your VM: these commands overwrite boot sectors.",
   "deliverable": "reports/legacy-install.txt.",
   "steps": [
    {
     "cmd": "grep -A2 '^title Other' samples/grub.conf > reports/legacy-install.txt"
    },
    {
     "text": "nano reports/legacy-install.txt and add the install notes below the entry."
    },
    {
     "text": "Install to the MBR of the first disk: grub-install /dev/sda, or with GRUB naming, grub-install '(hd0)'."
    },
    {
     "text": "Install to the boot sector of a partition, for chain loading from another loader: grub-install /dev/sda1, or grub-install '(hd0,0)'."
    },
    {
     "text": "From the grub> prompt: root (hd0,0) to find the stage files, then setup (hd0) to write the boot loader to the MBR. All of these need root."
    }
   ],
   "validation": "grep -cE 'chainloader|grub-install|setup' reports/legacy-install.txt returns at least 3.",
   "trap": "chainloader +1 loads the first sector of the given partition and hands control to the boot loader stored there, usually for another operating system. rootnoverify sets the partition without trying to mount it. grub-install is only needed when GRUB Legacy is first installed or its boot sector is damaged, not when menu.lst changes.",
   "paste": {
    "command": "cat reports/legacy-install.txt",
    "checks": [
     {
      "re": "^\\s*chainloader \\+1",
      "say": "the chain-load entry is included"
     },
     {
      "re": "grub-install",
      "say": "notes give grub-install for both the MBR and a partition",
      "min": 2
     },
     {
      "re": "setup\\s*\\(hd0\\)",
      "say": "notes include setup (hd0) from the grub> prompt"
     }
    ]
   },
   "quiz": [
    {
     "id": "chain",
     "prompt": "What does <code>chainloader +1</code> do?",
     "answer": "first",
     "options": [
      {
       "value": "first",
       "label": "Loads the first sector of the partition and hands control to it"
      },
      {
       "value": "next",
       "label": "Boots the next menu entry"
      },
      {
       "value": "kernel",
       "label": "Loads one extra kernel module"
      }
     ],
     "explain": "Correct. It is usually used to start another operating system's loader."
    },
    {
     "id": "when",
     "prompt": "When do you need <code>grub-install</code> on a GRUB Legacy server?",
     "answer": "inst",
     "options": [
      {
       "value": "inst",
       "label": "When first installing GRUB or repairing its boot sector"
      },
      {
       "value": "edit",
       "label": "After every change to menu.lst"
      },
      {
       "value": "kernel",
       "label": "After every kernel update"
      }
     ],
     "explain": "Correct."
    }
   ],
   "completion": "Explain how GRUB Legacy is installed and how it chain loads: done."
  },
  {
   "id": "18.5",
   "kind": "vm",
   "title": "Audit the GRUB2 settings file",
   "navSubtitle": "/etc/default/grub",
   "objective": "102.2",
   "difficulty": "Intermediate",
   "source": "Lab 5: Audit the GRUB2 settings file",
   "workdir": "~/lpic1-section18",
   "summary": "",
   "scenario": "A desktop support ticket says the boot menu never appears on your build. Before anyone changes anything, the team lead wants a list of the GRUB2 keys in use and what each one does.",
   "task": "Extract the active GRUB_ keys from the copy of /etc/default/grub and any Mint override files.",
   "deliverable": "reports/grub-keys.txt.",
   "steps": [
    {
     "cmd": "grep -E '^GRUB_' configs/grub.default > reports/grub-keys.txt"
    },
    {
     "cmd": "ls /etc/default/grub.d/ >> reports/grub-keys.txt 2>&1"
    },
    {
     "cmd": "cat /etc/default/grub.d/*.cfg >> reports/grub-keys.txt 2>/dev/null"
    },
    {
     "text": "nano reports/grub-keys.txt and add one line explaining each of GRUB_DEFAULT, GRUB_TIMEOUT, GRUB_TIMEOUT_STYLE, GRUB_CMDLINE_LINUX_DEFAULT, and GRUB_CMDLINE_LINUX."
    }
   ],
   "validation": "grep -cE '^GRUB_(DEFAULT|TIMEOUT|CMDLINE)' reports/grub-keys.txt returns at least 3, and your explanation lines follow.",
   "trap": "GRUB_DEFAULT=0 is the first menu entry (or saved, for the last one chosen). GRUB_TIMEOUT_STYLE=hidden or GRUB_TIMEOUT=0 hides the menu. GRUB_CMDLINE_LINUX_DEFAULT is added only to normal entries; GRUB_CMDLINE_LINUX goes on every entry, including recovery. Files in /etc/default/grub.d are read after /etc/default/grub and can override it. Nothing in this file takes effect until grub.cfg is rebuilt.",
   "paste": {
    "command": "cat reports/grub-keys.txt",
    "checks": [
     {
      "re": "^GRUB_(DEFAULT|TIMEOUT|CMDLINE)",
      "say": "the active GRUB_ keys are listed",
      "min": 3
     },
     {
      "re": "\\.cfg\\b|No such file or directory",
      "say": "includes the /etc/default/grub.d check"
     },
     {
      "re": "GRUB_(DEFAULT|TIMEOUT_STYLE|TIMEOUT|CMDLINE_LINUX_DEFAULT|CMDLINE_LINUX)\\b",
      "say": "your explanation lines name the keys again",
      "min": 9
     }
    ]
   },
   "quiz": [
    {
     "id": "cmdline",
     "prompt": "Which key adds parameters to every entry, including recovery?",
     "answer": "linux",
     "options": [
      {
       "value": "linux",
       "label": "<code>GRUB_CMDLINE_LINUX</code>"
      },
      {
       "value": "default",
       "label": "<code>GRUB_CMDLINE_LINUX_DEFAULT</code>"
      },
      {
       "value": "gdef",
       "label": "<code>GRUB_DEFAULT</code>"
      }
     ],
     "explain": "Correct. The _DEFAULT key applies only to normal entries."
    },
    {
     "id": "hidden",
     "prompt": "Which setting hides the GRUB2 menu?",
     "answer": "style",
     "options": [
      {
       "value": "style",
       "label": "<code>GRUB_TIMEOUT_STYLE=hidden</code>"
      },
      {
       "value": "def",
       "label": "<code>GRUB_DEFAULT=saved</code>"
      },
      {
       "value": "hm",
       "label": "<code>hiddenmenu</code>"
      }
     ],
     "explain": "Correct. GRUB_TIMEOUT=0 has the same effect; hiddenmenu is GRUB Legacy."
    }
   ],
   "completion": "Audit the GRUB2 settings file: done."
  },
  {
   "id": "18.6",
   "kind": "vm",
   "title": "Show how /etc/grub.d builds grub.cfg",
   "navSubtitle": "/etc/grub.d, 40_custom",
   "objective": "102.2",
   "difficulty": "Intermediate",
   "source": "Lab 6: Show how /etc/grub.d builds grub.cfg",
   "workdir": "~/lpic1-section18",
   "summary": "",
   "scenario": "A teammate added a menu entry directly to grub.cfg, and it vanished after the next kernel update. You need to show them where the file really comes from.",
   "task": "List the scripts in /etc/grub.d in run order, show the start of 40_custom, and match each script to its section in grub.cfg.",
   "deliverable": "reports/grub-d.txt.",
   "steps": [
    {
     "cmd": "ls -l /etc/grub.d/ > reports/grub-d.txt"
    },
    {
     "cmd": "head -n 5 configs/40_custom.copy >> reports/grub-d.txt"
    },
    {
     "cmd": "sudo grep '^### BEGIN' /boot/grub/grub.cfg >> reports/grub-d.txt"
    },
    {
     "cmd": "sudo head -n 5 /boot/grub/grub.cfg >> reports/grub-d.txt"
    }
   ],
   "validation": "cat reports/grub-d.txt: the ### BEGIN lines name /etc/grub.d scripts in the same numeric order as the ls listing (00_header, 10_linux, and so on, up to 40_custom), and the top of grub.cfg says DO NOT EDIT THIS FILE.",
   "trap": "grub-mkconfig runs every executable script in /etc/grub.d in numeric order and joins their output into grub.cfg, so hand edits to grub.cfg are lost at the next rebuild. Put custom entries in 40_custom (or 41_custom), and remove the execute bit from a script to switch it off.",
   "paste": {
    "command": "cat reports/grub-d.txt",
    "checks": [
     {
      "re": "^-rwx\\S*\\s.*\\b40_custom\\s*$",
      "say": "40_custom is in the listing and executable"
     },
     {
      "re": "exec tail -n \\+3",
      "say": "the top of 40_custom is included"
     },
     {
      "re": "### BEGIN /etc/grub\\.d/00_header ###[\\s\\S]*### BEGIN /etc/grub\\.d/10_linux ###[\\s\\S]*### BEGIN /etc/grub\\.d/40_custom ###",
      "say": "grub.cfg's sections follow the scripts' numeric order"
     },
     {
      "re": "DO NOT EDIT THIS FILE",
      "say": "the top of grub.cfg says DO NOT EDIT THIS FILE"
     }
    ]
   },
   "quiz": [
    {
     "id": "lost",
     "prompt": "Why did a hand edit to <code>grub.cfg</code> disappear?",
     "answer": "regen",
     "options": [
      {
       "value": "regen",
       "label": "grub-mkconfig rebuilt the file from /etc/grub.d and /etc/default/grub"
      },
      {
       "value": "perm",
       "label": "grub.cfg is read-only"
      },
      {
       "value": "boot",
       "label": "GRUB deletes unknown entries at boot"
      }
     ],
     "explain": "Correct. Custom entries belong in 40_custom."
    },
    {
     "id": "off",
     "prompt": "How do you switch off one script in <code>/etc/grub.d</code>?",
     "answer": "chmod",
     "options": [
      {
       "value": "chmod",
       "label": "Remove its execute bit"
      },
      {
       "value": "rename",
       "label": "Rename it to .bak only"
      },
      {
       "value": "edit",
       "label": "Comment it out in grub.cfg"
      }
     ],
     "explain": "Correct. grub-mkconfig runs only executable scripts."
    }
   ],
   "completion": "Show how /etc/grub.d builds grub.cfg: done."
  },
  {
   "id": "18.7",
   "kind": "vm",
   "title": "Match GRUB2 device names to the real disk",
   "navSubtitle": "grub-probe, search --fs-uuid",
   "objective": "102.2",
   "difficulty": "Intermediate",
   "source": "Lab 7: Match GRUB2 device names to the real disk",
   "workdir": "~/lpic1-section18",
   "summary": "",
   "scenario": "The virtualization team plans to add a second disk to your build. They want to know how GRUB2 currently finds /boot, so they can tell whether the new disk could break it.",
   "task": "Ask grub-probe how it sees /boot and compare that with the search and set root lines in grub.cfg.",
   "deliverable": "reports/grub-probe.txt.",
   "steps": [
    {
     "cmd": "sudo grub-probe --target=fs /boot > reports/grub-probe.txt"
    },
    {
     "cmd": "sudo grub-probe --target=partmap /boot >> reports/grub-probe.txt"
    },
    {
     "cmd": "sudo grub-probe --target=drive /boot >> reports/grub-probe.txt"
    },
    {
     "cmd": "sudo grub-probe --target=fs_uuid /boot >> reports/grub-probe.txt"
    },
    {
     "cmd": "sudo grep -m1 'set root=' /boot/grub/grub.cfg >> reports/grub-probe.txt"
    },
    {
     "cmd": "sudo grep -m1 'search .*fs-uuid' /boot/grub/grub.cfg >> reports/grub-probe.txt"
    }
   ],
   "validation": "cat reports/grub-probe.txt: the fs_uuid line matches the UUID on the search line, and set root names a GRUB device such as 'hd0,msdos2' or 'hd0,gpt2'.",
   "trap": "GRUB2 numbers disks from 0 and partitions from 1, and includes the table type: (hd0,msdos1) is /dev/sda1 on an MBR disk. Because disk order can change, generated entries use search --fs-uuid --set=root, which finds /boot by UUID and only falls back on the set root hint.",
   "paste": {
    "command": "cat reports/grub-probe.txt",
    "checks": [
     {
      "re": "^(ext2|xfs|btrfs|fat)\\s*$",
      "say": "grub-probe names the filesystem type (ext2 covers ext4)"
     },
     {
      "re": "^(gpt|msdos)\\s*$",
      "say": "grub-probe names the partition table type"
     },
     {
      "re": "^([0-9a-f]{4,}-[0-9a-f-]+)\\s*$[\\s\\S]*search\\s.*--fs-uuid.*\\b\\1\\b",
      "say": "the fs_uuid matches the UUID on the search line"
     },
     {
      "re": "set root='hd\\d+,(msdos|gpt)\\d+'",
      "say": "set root names a GRUB device"
     }
    ]
   },
   "quiz": [
    {
     "id": "search",
     "prompt": "Why do generated GRUB2 entries use <code>search --fs-uuid</code>?",
     "answer": "order",
     "options": [
      {
       "value": "order",
       "label": "Disk order can change, but the filesystem UUID doesn't"
      },
      {
       "value": "fast",
       "label": "It boots faster"
      },
      {
       "value": "uefi",
       "label": "UEFI requires it"
      }
     ],
     "explain": "Correct. set root is only a fallback hint."
    }
   ],
   "completion": "Match GRUB2 device names to the real disk: done."
  },
  {
   "id": "18.8",
   "kind": "vm",
   "title": "Draft a custom rescue entry and check its syntax",
   "navSubtitle": "menuentry, grub-script-check",
   "objective": "102.2",
   "difficulty": "Intermediate",
   "source": "Lab 8: Draft a custom rescue entry and check its syntax",
   "workdir": "~/lpic1-section18",
   "summary": "",
   "scenario": "The team wants a permanent menu entry on app02 that boots straight into rescue mode. You are asked for a reviewed draft, not a live change.",
   "task": "Add a menuentry to a copy of 40_custom using your root filesystem's UUID, and check the draft with grub-script-check.",
   "deliverable": "configs/40_custom.test and reports/custom-entry.txt.",
   "steps": [
    {
     "text": "U=$(findmnt -no UUID /)"
    },
    {
     "cmd": "cp configs/40_custom.copy configs/40_custom.test"
    },
    {
     "cmd": "printf 'menuentry \"Rescue shell (lab draft)\" {\\n\\tsearch --no-floppy --fs-uuid --set=root %s\\n\\tlinux /boot/vmlinuz root=UUID=%s ro systemd.unit=rescue.target\\n\\tinitrd /boot/initrd.img\\n}\\n' \"$U\" \"$U\" >> configs/40_custom.test"
    },
    {
     "text": "grub-script-check configs/40_custom.test && echo 'SYNTAX OK' > reports/custom-entry.txt"
    },
    {
     "cmd": "tail -n 5 configs/40_custom.test >> reports/custom-entry.txt"
    },
    {
     "text": "Read only, Don't run on your VM: the real change would be sudo cp configs/40_custom.test /etc/grub.d/40_custom followed by sudo update-grub."
    }
   ],
   "validation": "head -n 1 reports/custom-entry.txt reads SYNTAX OK, and the entry below it shows your UUID twice. ls -l /etc/grub.d/40_custom shows the original file's date is unchanged.",
   "trap": "GRUB2 entries use menuentry instead of title, set root or search instead of root, and linux instead of kernel. Some distributions write linux16 and initrd16 (BIOS) or linuxefi and initrdefi (UEFI). Paths are relative to the partition GRUB set as root, so if /boot were its own partition the path would be /vmlinuz, not /boot/vmlinuz.",
   "paste": {
    "command": "cat reports/custom-entry.txt",
    "checks": [
     {
      "re": "^SYNTAX OK",
      "say": "grub-script-check passed"
     },
     {
      "re": "^menuentry \\\"Rescue shell",
      "say": "the draft menuentry is included"
     },
     {
      "re": "--set=root ([0-9a-f]{4,}-[0-9a-f-]+)\\s[\\s\\S]*root=UUID=\\1\\s",
      "say": "the same UUID is on the search and linux lines"
     },
     {
      "re": "systemd\\.unit=rescue\\.target",
      "say": "the entry boots the rescue target"
     }
    ]
   },
   "quiz": [
    {
     "id": "kw",
     "prompt": "Which GRUB2 keyword replaces GRUB Legacy's <code>kernel</code>?",
     "answer": "linux",
     "options": [
      {
       "value": "linux",
       "label": "<code>linux</code>"
      },
      {
       "value": "vmlinuz",
       "label": "<code>vmlinuz</code>"
      },
      {
       "value": "boot",
       "label": "<code>boot</code>"
      }
     ],
     "explain": "Correct. Some distributions write linux16 or linuxefi."
    },
    {
     "id": "where",
     "prompt": "Where should a permanent custom GRUB2 entry go?",
     "answer": "custom",
     "options": [
      {
       "value": "custom",
       "label": "<code>/etc/grub.d/40_custom</code>"
      },
      {
       "value": "cfg",
       "label": "<code>/boot/grub/grub.cfg</code>"
      },
      {
       "value": "default",
       "label": "<code>/etc/default/grub</code>"
      }
     ],
     "explain": "Correct. Then rebuild grub.cfg."
    }
   ],
   "completion": "Draft a custom rescue entry and check its syntax: done."
  },
  {
   "id": "18.9",
   "kind": "vm",
   "title": "Draft a visible menu and verbose boot on a copy",
   "navSubtitle": "Draft a diff, quiet splash",
   "objective": "102.2",
   "difficulty": "Intermediate",
   "source": "Lab 9: Draft a visible menu and verbose boot on a copy",
   "workdir": "~/lpic1-section18",
   "summary": "",
   "scenario": "The desktop ticket from Lab 5 is approved: show the menu for 10 seconds and remove quiet splash so boot messages are visible. Your task is the reviewed diff, not the live change.",
   "task": "Edit a copy of the settings file and produce a unified diff for review.",
   "deliverable": "configs/grub.verbose and reports/grub-change.diff.",
   "steps": [
    {
     "cmd": "cp configs/grub.default configs/grub.verbose"
    },
    {
     "text": "sed -i -E 's/^GRUB_TIMEOUT_STYLE=.*/GRUB_TIMEOUT_STYLE=menu/; s/^GRUB_TIMEOUT=.*/GRUB_TIMEOUT=10/; s/^GRUB_CMDLINE_LINUX_DEFAULT=.*/GRUB_CMDLINE_LINUX_DEFAULT=\"\"/' configs/grub.verbose"
    },
    {
     "cmd": "grep -q '^GRUB_TIMEOUT_STYLE=' configs/grub.verbose || echo 'GRUB_TIMEOUT_STYLE=menu' >> configs/grub.verbose"
    },
    {
     "text": "diff -u configs/grub.default configs/grub.verbose > reports/grub-change.diff"
    },
    {
     "text": "Read only, Don't run on your VM: the real change would be sudo cp configs/grub.verbose /etc/default/grub followed by sudo update-grub."
    }
   ],
   "validation": "grep -E '^\\+GRUB' reports/grub-change.diff shows GRUB_TIMEOUT=10, GRUB_TIMEOUT_STYLE=menu, and an empty GRUB_CMDLINE_LINUX_DEFAULT. diff -q /etc/default/grub configs/grub.default prints nothing, which proves the real file is unchanged.",
   "trap": "Editing /etc/default/grub does nothing by itself; the change appears only after grub.cfg is rebuilt. If a file in /etc/default/grub.d sets the same key, it wins. Removing quiet shows kernel messages; removing splash removes the graphical boot screen.",
   "paste": {
    "command": "cat reports/grub-change.diff; diff -q /etc/default/grub configs/grub.default && echo 'real file unchanged'",
    "checks": [
     {
      "re": "^\\+GRUB_TIMEOUT=10\\s*$",
      "say": "the diff sets GRUB_TIMEOUT=10"
     },
     {
      "re": "^\\+GRUB_TIMEOUT_STYLE=menu\\s*$",
      "say": "the diff sets GRUB_TIMEOUT_STYLE=menu"
     },
     {
      "re": "^\\+GRUB_CMDLINE_LINUX_DEFAULT=\\\"\\\"\\s*$",
      "say": "the diff empties GRUB_CMDLINE_LINUX_DEFAULT"
     },
     {
      "re": "^real file unchanged",
      "say": "the real /etc/default/grub matches your copy"
     }
    ]
   },
   "quiz": [
    {
     "id": "apply",
     "prompt": "You edited <code>/etc/default/grub</code>. When does the change take effect?",
     "answer": "rebuild",
     "options": [
      {
       "value": "rebuild",
       "label": "After update-grub rebuilds grub.cfg, at the next boot"
      },
      {
       "value": "now",
       "label": "Immediately"
      },
      {
       "value": "boot",
       "label": "At the next boot, with no other step"
      }
     ],
     "explain": "Correct."
    },
    {
     "id": "quiet",
     "prompt": "What does removing <code>quiet</code> do?",
     "answer": "msgs",
     "options": [
      {
       "value": "msgs",
       "label": "Shows kernel messages during boot"
      },
      {
       "value": "splash",
       "label": "Removes the graphical boot screen"
      },
      {
       "value": "menu",
       "label": "Shows the GRUB menu"
      }
     ],
     "explain": "Correct. Removing splash removes the boot screen."
    }
   ],
   "completion": "Draft a visible menu and verbose boot on a copy: done."
  },
  {
   "id": "18.10",
   "kind": "vm",
   "title": "Preview what update-grub would generate",
   "navSubtitle": "update-grub, grub-mkconfig",
   "objective": "102.2",
   "difficulty": "Intermediate",
   "source": "Lab 10: Preview what update-grub would generate",
   "workdir": "~/lpic1-section18",
   "summary": "",
   "scenario": "Change review for Lab 9 asks what update-grub actually runs and whether a rebuild with today's settings would change the boot menu at all.",
   "task": "Read the update-grub script, generate a preview of grub.cfg into your reports folder, and compare it with the live file.",
   "deliverable": "reports/update-grub.txt, reports/grub-preview.cfg, and reports/preview.diff.",
   "steps": [
    {
     "cmd": "cat \"$(command -v update-grub)\" > reports/update-grub.txt"
    },
    {
     "cmd": "sudo grub-mkconfig 2>/dev/null > reports/grub-preview.cfg"
    },
    {
     "cmd": "sudo diff /boot/grub/grub.cfg reports/grub-preview.cfg > reports/preview.diff"
    },
    {
     "cmd": "wc -l reports/preview.diff"
    }
   ],
   "validation": "grep grub-mkconfig reports/update-grub.txt shows exec grub-mkconfig -o /boot/grub/grub.cfg. reports/grub-preview.cfg starts with DO NOT EDIT THIS FILE, and reports/preview.diff is empty or only a few lines long.",
   "trap": "update-grub is a Debian and Mint wrapper for grub-mkconfig -o /boot/grub/grub.cfg. Red Hat uses grub2-mkconfig -o /boot/grub2/grub.cfg. Without -o, grub-mkconfig only prints to standard output, which is why this preview is safe. Never point -o at /boot on this VM. grub-install is only for putting GRUB2 on a disk, not for applying settings.",
   "paste": {
    "command": "grep grub-mkconfig reports/update-grub.txt; head -n 4 reports/grub-preview.cfg; wc -l reports/preview.diff",
    "checks": [
     {
      "re": "exec grub-mkconfig -o /boot/grub/grub\\.cfg",
      "say": "update-grub runs grub-mkconfig -o /boot/grub/grub.cfg"
     },
     {
      "re": "DO NOT EDIT THIS FILE",
      "say": "the preview starts like a real grub.cfg"
     },
     {
      "re": "^\\d{1,2} reports/preview\\.diff",
      "say": "the diff with the live file is empty or short"
     }
    ]
   },
   "quiz": [
    {
     "id": "rh",
     "prompt": "What rebuilds the GRUB2 menu on Red Hat?",
     "answer": "rh",
     "options": [
      {
       "value": "rh",
       "label": "<code>grub2-mkconfig -o /boot/grub2/grub.cfg</code>"
      },
      {
       "value": "upd",
       "label": "<code>update-grub</code>"
      },
      {
       "value": "inst",
       "label": "<code>grub2-install</code>"
      }
     ],
     "explain": "Correct. update-grub is the Debian and Mint wrapper."
    },
    {
     "id": "noo",
     "prompt": "What does <code>grub-mkconfig</code> do without <code>-o</code>?",
     "answer": "stdout",
     "options": [
      {
       "value": "stdout",
       "label": "Prints the new configuration to standard output"
      },
      {
       "value": "write",
       "label": "Writes /boot/grub/grub.cfg"
      },
      {
       "value": "err",
       "label": "Fails with an error"
      }
     ],
     "explain": "Correct. That's why the preview is safe."
    }
   ],
   "completion": "Preview what update-grub would generate: done."
  },
  {
   "id": "18.11",
   "kind": "vm",
   "title": "Write a runbook for the GRUB2 menu and command line",
   "navSubtitle": "GRUB2 menu keys, grub>",
   "objective": "102.2",
   "difficulty": "Advanced",
   "source": "Lab 11: Write a runbook for the GRUB2 menu and command line",
   "workdir": "~/lpic1-section18",
   "summary": "",
   "scenario": "A server will not boot after a storage change, and the on-call engineer will be at the console. They ask for a runbook for reaching the GRUB2 menu, editing an entry for one boot, and using the grub> prompt.",
   "task": "Record GRUB's saved environment, then write the runbook from the explanation below. Don't run on your VM: reaching the menu means rebooting.",
   "deliverable": "reports/grubenv.txt and reports/grub2-keys.txt.",
   "steps": [
    {
     "text": "grub-editenv list > reports/grubenv.txt"
    },
    {
     "text": "nano reports/grub2-keys.txt"
    },
    {
     "text": "Showing the menu: hold Shift while a BIOS machine starts, or press Esc once on UEFI. At the menu, the arrow keys select, Enter boots, e edits the entry, and c opens the command line."
    },
    {
     "text": "In the editor: move to the line that starts with linux, press End, add or remove parameters, then press Ctrl+X or F10 to boot. Ctrl+C or F2 opens the command line, and Esc throws the edits away and returns to the menu."
    },
    {
     "text": "At grub>: help lists commands, ls lists disks and partitions, ls (hd0,msdos1)/ lists files, set shows variables, cat prints a file, linux and initrd load files, boot starts them, and normal returns to the menu."
    },
    {
     "text": "Save the runbook with Ctrl+O and exit with Ctrl+X."
    }
   ],
   "validation": "grep -cE 'Ctrl\\+X|F10|Esc|ls \\(hd0' reports/grub2-keys.txt returns at least 3. reports/grubenv.txt exists (it may list only a few variables, or none).",
   "trap": "In the GRUB2 editor you are typing as soon as you move the cursor; there is no separate edit key for each line as in GRUB Legacy. Ctrl+X boots with the edits, but they last for one boot only. grubenv stores small values such as saved_entry; grub-editenv list only reads it.",
   "paste": {
    "command": "cat reports/grubenv.txt reports/grub2-keys.txt",
    "checks": [
     {
      "re": "Ctrl\\s*\\+\\s*X|F10",
      "say": "explains how to boot the edited entry"
     },
     {
      "re": "\\bEsc\\b",
      "say": "explains Esc"
     },
     {
      "re": "ls\\s+\\(hd0",
      "say": "includes ls (hd0,...) at the grub> prompt"
     },
     {
      "re": "\\bShift\\b",
      "say": "explains how to show the menu on BIOS"
     }
    ]
   },
   "quiz": [
    {
     "id": "boot2",
     "prompt": "In the GRUB2 editor, how do you boot with your edits?",
     "answer": "ctrlx",
     "options": [
      {
       "value": "ctrlx",
       "label": "<code>Ctrl+X</code> or <code>F10</code>"
      },
      {
       "value": "b",
       "label": "<code>b</code>"
      },
      {
       "value": "enter",
       "label": "<code>Enter</code>"
      }
     ],
     "explain": "Correct. Esc throws the edits away."
    },
    {
     "id": "show",
     "prompt": "The menu is hidden on a BIOS machine. How do you show it?",
     "answer": "shift",
     "options": [
      {
       "value": "shift",
       "label": "Hold Shift while it starts"
      },
      {
       "value": "f2",
       "label": "Press F2"
      },
      {
       "value": "c",
       "label": "Press c at the firmware screen"
      }
     ],
     "explain": "Correct. On UEFI, press Esc once."
    }
   ],
   "completion": "Write a runbook for the GRUB2 menu and command line: done."
  },
  {
   "id": "18.12",
   "kind": "vm",
   "title": "Choose the right kernel parameter for a rescue boot",
   "navSubtitle": "single, rescue, init=/bin/bash",
   "objective": "101.2",
   "difficulty": "Advanced",
   "source": "Lab 12: Choose the right kernel parameter for a rescue boot",
   "workdir": "~/lpic1-section18",
   "summary": "",
   "scenario": "The on-call runbook needs a table of kernel parameters for common emergencies: a broken service, a failed filesystem, a forgotten root password, and a display driver that will not start.",
   "task": "Collect evidence of how Mint maps the parameters to systemd targets, then write the table.",
   "deliverable": "reports/params.txt and reports/kernel-params.txt.",
   "steps": [
    {
     "cmd": "cat /proc/cmdline > reports/params.txt"
    },
    {
     "cmd": "ls -l /lib/systemd/system/runlevel1.target >> reports/params.txt"
    },
    {
     "cmd": "systemctl --no-pager cat rescue.target emergency.target | grep -E '^(Description|Requires)=' >> reports/params.txt"
    },
    {
     "cmd": "sudo grep -m2 -E '^\\s*linux.*recovery' /boot/grub/grub.cfg >> reports/params.txt"
    },
    {
     "text": "nano reports/kernel-params.txt and write one line for each of: single, 1, or S; systemd.unit=rescue.target; emergency or systemd.unit=emergency.target; init=/bin/bash; ro and rw; root=; quiet and splash; nomodeset."
    }
   ],
   "validation": "reports/params.txt shows runlevel1.target pointing to rescue.target and the recovery lines from grub.cfg, and grep -c '=' reports/kernel-params.txt returns at least 4.",
   "trap": "single, 1, and S boot the rescue target: basic system, local filesystems mounted, root password required. Emergency mounts only the root filesystem, read-only, which is safer when a filesystem is damaged. init=/bin/bash skips init entirely and gives a root shell with no password, which is how a lost root password is reset at the console. nomodeset stops the kernel from loading the video driver early.",
   "paste": {
    "command": "cat reports/params.txt reports/kernel-params.txt",
    "checks": [
     {
      "re": "runlevel1\\.target -> rescue\\.target",
      "say": "runlevel1.target points to rescue.target"
     },
     {
      "re": "^\\s*linux\\s.*\\brecovery\\b",
      "say": "includes the recovery lines from grub.cfg"
     },
     {
      "re": "init=/bin/bash",
      "say": "your table covers init=/bin/bash"
     },
     {
      "re": "systemd\\.unit=(rescue|emergency)\\.target",
      "say": "your table covers the rescue and emergency targets",
      "min": 2
     }
    ]
   },
   "quiz": [
    {
     "id": "fs",
     "prompt": "A filesystem is damaged. Which parameter gives the safest shell?",
     "answer": "emerg",
     "options": [
      {
       "value": "emerg",
       "label": "<code>systemd.unit=emergency.target</code>"
      },
      {
       "value": "single",
       "label": "<code>single</code>"
      },
      {
       "value": "rw",
       "label": "<code>rw</code>"
      }
     ],
     "explain": "Correct. Emergency mounts only root, read-only."
    },
    {
     "id": "pw",
     "prompt": "Which parameter is used to reset a lost root password at the console?",
     "answer": "bash",
     "options": [
      {
       "value": "bash",
       "label": "<code>init=/bin/bash</code>"
      },
      {
       "value": "1",
       "label": "<code>1</code>"
      },
      {
       "value": "nomodeset",
       "label": "<code>nomodeset</code>"
      }
     ],
     "explain": "Correct. It skips init and asks for no password."
    }
   ],
   "completion": "Choose the right kernel parameter for a rescue boot: done."
  },
  {
   "id": "18.13",
   "kind": "vm",
   "title": "Prove which parameters the kernel actually received",
   "navSubtitle": "/proc/cmdline, journalctl -k, dmesg",
   "objective": "101.2",
   "difficulty": "Advanced",
   "source": "Lab 13: Prove which parameters the kernel actually received",
   "workdir": "~/lpic1-section18",
   "summary": "",
   "scenario": "After a console session on web01, the on-call engineer is not sure whether their edit at the GRUB menu took effect. You want three independent sources that agree.",
   "task": "Compare the command line in /proc, the journal, and the kernel ring buffer, and save the end of the boot log.",
   "deliverable": "reports/boot-params.txt.",
   "steps": [
    {
     "cmd": "cat /proc/cmdline > reports/boot-params.txt"
    },
    {
     "text": "journalctl -b -k --no-pager | grep -m1 -i 'command line' >> reports/boot-params.txt"
    },
    {
     "cmd": "sudo dmesg | grep -m1 -i 'command line' >> reports/boot-params.txt"
    },
    {
     "cmd": "sudo tail -n 5 /var/log/boot.log >> reports/boot-params.txt 2>&1"
    }
   ],
   "validation": "The first three lines of reports/boot-params.txt show the same parameters, including quiet splash on a default Mint build. If the journalctl line is missing, rerun it with sudo.",
   "trap": "/proc/cmdline always shows the current boot, while dmesg only has it while the message is still in the ring buffer. journalctl -k shows kernel messages and keeps them across boots when the journal is persistent. A parameter added at the menu appears in all three for that boot only.",
   "paste": {
    "command": "cat reports/boot-params.txt",
    "checks": [
     {
      "re": "^BOOT_IMAGE=",
      "say": "includes /proc/cmdline"
     },
     {
      "re": "^(BOOT_IMAGE=.*\\S)\\s*$[\\s\\S]*kernel: Command line: \\1\\s*$",
      "say": "the journal shows the same command line"
     },
     {
      "re": "^(BOOT_IMAGE=.*\\S)\\s*$[\\s\\S]*^\\[\\s*\\d+\\.\\d+\\] Command line: \\1\\s*$",
      "say": "dmesg shows the same command line"
     }
    ]
   },
   "quiz": [
    {
     "id": "always",
     "prompt": "Which source always shows the current boot's parameters?",
     "answer": "proc",
     "options": [
      {
       "value": "proc",
       "label": "<code>/proc/cmdline</code>"
      },
      {
       "value": "dmesg",
       "label": "<code>dmesg</code>"
      },
      {
       "value": "boot",
       "label": "<code>/var/log/boot.log</code>"
      }
     ],
     "explain": "Correct. dmesg loses it once the ring buffer wraps."
    }
   ],
   "completion": "Prove which parameters the kernel actually received: done."
  },
  {
   "id": "18.14",
   "kind": "vm",
   "title": "Plan a password for the boot menu",
   "navSubtitle": "grub-mkpasswd-pbkdf2",
   "objective": "102.2",
   "difficulty": "Advanced",
   "source": "Lab 14: Plan a password for the boot menu",
   "workdir": "~/lpic1-section18",
   "summary": "",
   "scenario": "A security review found that anyone at the console of app02 could add init=/bin/bash at the boot menu and get a root shell. The reviewer asks for a draft that password-protects menu editing.",
   "task": "Generate a GRUB2 password hash from a throwaway phrase and draft the lines that would protect the menu.",
   "deliverable": "reports/grub-hash.txt and configs/40_custom.secure.",
   "steps": [
    {
     "text": "grub-mkpasswd-pbkdf2 | tee reports/grub-hash.txt (type a throwaway phrase such as lab-only-phrase twice; never a real password)"
    },
    {
     "cmd": "cp configs/40_custom.copy configs/40_custom.secure"
    },
    {
     "cmd": "echo 'set superusers=\"labadmin\"' >> configs/40_custom.secure"
    },
    {
     "cmd": "echo \"password_pbkdf2 labadmin $(grep -o 'grub.pbkdf2.*' reports/grub-hash.txt)\" >> configs/40_custom.secure"
    },
    {
     "text": "grub-script-check configs/40_custom.secure && echo 'SYNTAX OK' >> reports/grub-hash.txt"
    },
    {
     "text": "Read only, Don't run on your VM: the real change would copy this to /etc/grub.d/40_custom and run update-grub. Test it on a throwaway VM first, because a mistake can lock you out of the menu."
    }
   ],
   "validation": "grep -c 'grub.pbkdf2.sha512' configs/40_custom.secure returns 1, and tail -n 1 reports/grub-hash.txt reads SYNTAX OK.",
   "trap": "GRUB Legacy protected the menu with a password line in grub.conf (often an MD5 hash from grub-md5-crypt); GRUB2 uses set superusers and password_pbkdf2. A boot menu password does not stop someone from booting rescue media, so physical security and disk encryption still matter.",
   "paste": {
    "command": "cat reports/grub-hash.txt; tail -n 2 configs/40_custom.secure",
    "checks": [
     {
      "re": "^set superusers=\\\"labadmin\\\"",
      "say": "the draft sets superusers"
     },
     {
      "re": "^password_pbkdf2 labadmin grub\\.pbkdf2\\.sha512\\.\\d+\\.[0-9a-f]+\\.[0-9a-f]+",
      "say": "the draft has a password_pbkdf2 line with the hash"
     },
     {
      "re": "^SYNTAX OK",
      "say": "grub-script-check passed"
     }
    ]
   },
   "quiz": [
    {
     "id": "g2pw",
     "prompt": "Which pair of commands protects the GRUB2 menu?",
     "answer": "su",
     "options": [
      {
       "value": "su",
       "label": "<code>set superusers</code> and <code>password_pbkdf2</code>"
      },
      {
       "value": "pw",
       "label": "A <code>password</code> line in grub.conf"
      },
      {
       "value": "lock",
       "label": "<code>lock</code> in /etc/default/grub"
      }
     ],
     "explain": "Correct. The password line is the GRUB Legacy way."
    },
    {
     "id": "media",
     "prompt": "What can a boot menu password not stop?",
     "answer": "media",
     "options": [
      {
       "value": "media",
       "label": "Booting from rescue media"
      },
      {
       "value": "edit",
       "label": "Editing menu entries"
      },
      {
       "value": "cmd",
       "label": "Opening the GRUB command line"
      }
     ],
     "explain": "Correct. Physical security and disk encryption still matter."
    }
   ],
   "completion": "Plan a password for the boot menu: done."
  }
 ],
 "review": {
  "traps": [
   "Counting GRUB Legacy partitions from 1. GRUB Legacy counts disks and partitions from 0, so (hd0,0) is /dev/sda1 and (hd1,1) is /dev/sdb2.",
   "Counting GRUB2 partitions from 0. GRUB2 counts disks from 0 and partitions from 1, and adds msdos or gpt: (hd0,msdos1) is /dev/sda1.",
   "Editing grub.cfg directly. It is regenerated; edit /etc/default/grub or /etc/grub.d/40_custom, then rebuild.",
   "Forgetting to rebuild. After changing GRUB2 settings, run update-grub or grub-mkconfig -o /boot/grub/grub.cfg (grub2-mkconfig -o /boot/grub2/grub.cfg on Red Hat).",
   "Thinking GRUB Legacy needs a rebuild. Changes to menu.lst or grub.conf take effect at the next boot.",
   "Confusing grub-install with grub-mkconfig. grub-install writes the boot loader to a disk or ESP; grub-mkconfig builds the menu file.",
   "Mixing up the keywords: Legacy uses title, root, kernel, and initrd; GRUB2 uses menuentry, set root or search, linux, and initrd.",
   "Forgetting linux16, initrd16, linuxefi, and initrdefi. They are distribution variants of linux and initrd for BIOS and UEFI.",
   "Mixing up the GRUB_CMDLINE keys. GRUB_CMDLINE_LINUX applies to every entry; GRUB_CMDLINE_LINUX_DEFAULT applies only to normal entries.",
   "Mixing up the menu keys. In both versions e edits and c opens the command line; GRUB Legacy boots an edited entry with b, GRUB2 with Ctrl+X or F10.",
   "Thinking a parameter added at the menu is permanent. It lasts for one boot; make it permanent in the configuration.",
   "Confusing rescue and emergency. Rescue (single, 1, S) mounts local filesystems; emergency mounts only root, read-only. Both ask for the root password on systemd systems.",
   "Forgetting init=/bin/bash. It skips init and gives a root shell without a password, which is why the boot menu should be password-protected.",
   "Forgetting where the files live: /boot/grub/menu.lst or grub.conf (Legacy), /boot/grub/grub.cfg or /boot/grub2/grub.cfg (GRUB2), and sometimes /boot/efi/EFI/<distro>/grub.cfg on UEFI."
  ],
  "trapQuiz": [
   {
    "id": "tq1",
    "prompt": "Which GRUB Legacy name means <code>/dev/sdb2</code>?",
    "answer": "hd11",
    "options": [
     {
      "value": "hd11",
      "label": "<code>(hd1,1)</code>"
     },
     {
      "value": "hd12",
      "label": "<code>(hd1,2)</code>"
     },
     {
      "value": "hd22",
      "label": "<code>(hd2,2)</code>"
     }
    ],
    "explain": "Correct. Legacy counts disks and partitions from 0."
   },
   {
    "id": "tq2",
    "prompt": "Which GRUB2 name means <code>/dev/sda1</code> on an MBR disk?",
    "answer": "m1",
    "options": [
     {
      "value": "m1",
      "label": "<code>(hd0,msdos1)</code>"
     },
     {
      "value": "m0",
      "label": "<code>(hd0,msdos0)</code>"
     },
     {
      "value": "h00",
      "label": "<code>(hd0,0)</code>"
     }
    ],
    "explain": "Correct. GRUB2 counts partitions from 1."
   },
   {
    "id": "tq3",
    "prompt": "Where do you make a permanent GRUB2 change?",
    "answer": "src",
    "options": [
     {
      "value": "src",
      "label": "/etc/default/grub or /etc/grub.d, then update-grub"
     },
     {
      "value": "cfg",
      "label": "/boot/grub/grub.cfg"
     },
     {
      "value": "lst",
      "label": "/boot/grub/menu.lst"
     }
    ],
    "explain": "Correct. grub.cfg is regenerated."
   },
   {
    "id": "tq4",
    "prompt": "What does <code>grub-install</code> do?",
    "answer": "disk",
    "options": [
     {
      "value": "disk",
      "label": "Writes the boot loader to a disk or the ESP"
     },
     {
      "value": "menu",
      "label": "Builds the menu file"
     },
     {
      "value": "kernel",
      "label": "Installs a new kernel"
     }
    ],
    "explain": "Correct. grub-mkconfig builds the menu."
   },
   {
    "id": "tq5",
    "prompt": "Which keywords does GRUB2 use in place of Legacy's title and kernel?",
    "answer": "mk",
    "options": [
     {
      "value": "mk",
      "label": "<code>menuentry</code> and <code>linux</code>"
     },
     {
      "value": "el",
      "label": "<code>entry</code> and <code>vmlinuz</code>"
     },
     {
      "value": "tk",
      "label": "<code>title</code> and <code>kernel</code>, unchanged"
     }
    ],
    "explain": "Correct."
   },
   {
    "id": "tq6",
    "prompt": "Which key applies only to normal (non-recovery) entries?",
    "answer": "def",
    "options": [
     {
      "value": "def",
      "label": "<code>GRUB_CMDLINE_LINUX_DEFAULT</code>"
     },
     {
      "value": "lin",
      "label": "<code>GRUB_CMDLINE_LINUX</code>"
     },
     {
      "value": "gd",
      "label": "<code>GRUB_DEFAULT</code>"
     }
    ],
    "explain": "Correct."
   },
   {
    "id": "tq7",
    "prompt": "How does rescue differ from emergency?",
    "answer": "mounts",
    "options": [
     {
      "value": "mounts",
      "label": "Rescue mounts local filesystems; emergency mounts only root, read-only"
     },
     {
      "value": "pw",
      "label": "Only emergency asks for the root password"
     },
     {
      "value": "same",
      "label": "They are the same target"
     }
    ],
    "explain": "Correct. Both ask for the root password on systemd."
   },
   {
    "id": "tq8",
    "prompt": "A parameter typed at the GRUB menu lasts how long?",
    "answer": "one",
    "options": [
     {
      "value": "one",
      "label": "One boot"
     },
     {
      "value": "upd",
      "label": "Until the next update-grub"
     },
     {
      "value": "ever",
      "label": "Until removed at the menu"
     }
    ],
    "explain": "Correct. Put it in the configuration to keep it."
   }
  ],
  "challenge": {
   "intro": "Complete these tasks without notes, using only your Linux Mint VM and ~/lpic1-section18. Rerun Lab Setup Step 2 first so your copies match the live files. Do not run grub-install or update-grub, and do not change any file outside the practice folder.",
   "tasks": [
    "From samples/grub.conf, state which entry boots by default, how long the menu waits, and which Linux partition each root line names.",
    "Explain in writing the keys you would press at a GRUB Legacy menu to add single to the kernel line for one boot.",
    "List the GRUB_ keys in use on your VM and explain which one hides the menu.",
    "Show which /etc/grub.d script produced each section of your grub.cfg.",
    "Draft a copy of /etc/default/grub that shows the menu for 5 seconds and adds nomodeset to every entry, and save a unified diff.",
    "Draft a 40_custom entry that boots the emergency target, and prove its syntax with grub-script-check.",
    "Generate a preview of grub.cfg into reports and show how it differs from the live file.",
    "Prove from three sources which kernel parameters the current boot used."
   ],
   "outro": "Your final handoff is the reports and configs directories. For each file, write one sentence saying what it proves, and confirm that nothing under /etc or /boot changed."
  },
  "questions": [
   {
    "q": "Facilities request: “db01's grub.conf says root (hd1,1). Which disk do we need to keep in which bay?”",
    "a": "<code>(hd1,1)</code> counts from 0, so it is the second partition on the second disk, <code>/dev/sdb2</code>. Keep that disk in the second bay so the BIOS still sees it as the second drive."
   },
   {
    "q": "On-call request: “The old server needs to come up in single-user mode once. Which keys do I press at the GRUB Legacy menu?”",
    "a": "Press Esc to show the menu if it's hidden, select the entry, press <code>a</code>, type <code>single</code> at the end of the kernel line, and press Enter. (Or <code>e</code>, select the kernel line, <code>e</code>, add it, Enter, then <code>b</code>.) It lasts for that boot only."
   },
   {
    "q": "Desktop support request: “The boot menu never shows up. Find the setting that hides it and draft the change.”",
    "a": "<code>grep -E '^GRUB_TIMEOUT' /etc/default/grub /etc/default/grub.d/*.cfg</code> shows <code>GRUB_TIMEOUT_STYLE=hidden</code> or <code>GRUB_TIMEOUT=0</code>. On a copy, set <code>GRUB_TIMEOUT_STYLE=menu</code> and <code>GRUB_TIMEOUT=10</code> and save <code>diff -u</code>; the real change is followed by <code>sudo update-grub</code>."
   },
   {
    "q": "Teammate request: “I added an entry to grub.cfg and it disappeared after an update. Where should it go?”",
    "a": "grub.cfg is regenerated, so hand edits are lost. Put the entry in <code>/etc/grub.d/40_custom</code>, check it with <code>grub-script-check</code>, then run <code>sudo update-grub</code>."
   },
   {
    "q": "Change board request: “Before you run update-grub, show us exactly what the new grub.cfg would contain.”",
    "a": "<code>sudo grub-mkconfig &gt; preview.cfg</code> (no <code>-o</code>, so nothing is written to /boot), then <code>sudo diff /boot/grub/grub.cfg preview.cfg</code>."
   },
   {
    "q": "Incident lead request: “A filesystem is damaged and the server will not finish booting. Which kernel parameter gets us a safe shell?”",
    "a": "Add <code>systemd.unit=emergency.target</code> (or <code>emergency</code>) to the linux line at the GRUB menu. It mounts only root, read-only, so the damaged filesystem can be checked."
   },
   {
    "q": "Security reviewer request: “Anyone at the console can add init=/bin/bash. Draft a fix.”",
    "a": "Set a GRUB2 superuser: generate a hash with <code>grub-mkpasswd-pbkdf2</code>, add <code>set superusers=\"admin\"</code> and <code>password_pbkdf2 admin grub.pbkdf2.sha512…</code> to <code>/etc/grub.d/40_custom</code>, check it with <code>grub-script-check</code>, then run <code>sudo update-grub</code>."
   }
  ],
  "mastery": [
   "I can read a GRUB Legacy menu.lst or grub.conf and explain default, timeout, hiddenmenu, title, root, kernel, and initrd.",
   "I can translate GRUB Legacy and GRUB2 device names into Linux device names.",
   "I can describe the GRUB Legacy menu keys and grub> commands, including setup and find.",
   "I can explain how grub-install places a boot loader in the MBR or a partition boot sector, and what chainloader +1 does.",
   "I can explain the main keys in /etc/default/grub and the difference between GRUB_CMDLINE_LINUX and GRUB_CMDLINE_LINUX_DEFAULT.",
   "I can explain how the scripts in /etc/grub.d build grub.cfg and where custom entries belong.",
   "I can write a GRUB2 menuentry and check it with grub-script-check.",
   "I can explain update-grub, grub-mkconfig -o, and grub2-mkconfig, and where grub.cfg lives on each distribution family.",
   "I can describe how to reach and use the GRUB2 menu, editor, and command line.",
   "I can choose kernel parameters for rescue, emergency, and password-reset boots, and explain each one.",
   "I can prove which parameters the kernel received using /proc/cmdline, dmesg, and journalctl -k.",
   "I can explain how a boot menu password protects the console, and draft one with grub-mkpasswd-pbkdf2."
  ]
 }
});
