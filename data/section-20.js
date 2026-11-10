/* Section 20: Debian Package Management. Generated from LPIC_Section20_Lab_Workbook.docx by vm_section.py;
   paste checks, quizzes and model answers were added for the app. */
LPIC.section({
 "id": "section-20",
 "number": 20,
 "title": "Debian Package Management",
 "objectives": [
  "102.4",
  "102.5"
 ],
 "kind": "vm",
 "source": "LPIC_Section20_Lab_Workbook.docx",
 "scenario": "Objectives 102.4 and 102.5 (overview): Understand Linux packages and manage Debian packages with dpkg, dpkg-reconfigure, apt-get, apt-cache, apt, and /etc/apt/sources.list through realistic software requests.",
 "overview": {
  "paragraphs": [
   "Treat each lab like an IT engineer task, not a command drill. Read the request, check the package before you change anything, make only the change the request asks for, and prove the result with dpkg or apt.",
   "Linux Mint is a Debian-family system, so everything in this section runs for real on your VM. The labs only install and remove small harmless packages (sl, cowsay, tree) and a practice package, lab-notice, that you build yourself. Red Hat packaging (rpm and yum) is covered in Section 21. Package commands that change the system need sudo; commands that only read information do not."
  ],
  "setup": [
   {
    "text": "Step 1: Refresh the package lists, then install apt-file, which Mint does not include by default:"
   },
   {
    "cmd": "sudo apt update"
   },
   {
    "cmd": "sudo apt install apt-file && sudo apt-file update"
   },
   {
    "text": "Step 2: Create the practice workspace:"
   },
   {
    "cmd": "mkdir -p ~/lpic1-section20/{reports,debs,samples/lab-notice/DEBIAN,samples/lab-notice/etc,samples/lab-notice/usr/bin}"
   },
   {
    "cmd": "cd ~/lpic1-section20"
   },
   {
    "text": "Step 3: Create a practice repository list and a software request:"
   },
   {
    "cmd": "printf '# Practice copy of the repository list for app02\\ndeb http://archive.ubuntu.com/ubuntu noble main restricted universe multiverse\\ndeb http://archive.ubuntu.com/ubuntu noble-updates main restricted universe multiverse\\ndeb http://security.ubuntu.com/ubuntu noble-security main restricted universe multiverse\\n# deb-src http://archive.ubuntu.com/ubuntu noble main restricted\\ndeb [arch=amd64 signed-by=/usr/share/keyrings/example-archive-keyring.gpg] https://packages.example.com/apt stable main\\n' > samples/sources.list"
   },
   {
    "cmd": "printf 'tree\\ncowsay\\n' > samples/requested-packages.txt"
   },
   {
    "text": "Step 4: Create the files for the practice package lab-notice, which you build in Lab 7:"
   },
   {
    "cmd": "printf 'Package: lab-notice\\nVersion: 1.0-1\\nArchitecture: all\\nMaintainer: Lab Admin <admin@example.com>\\nDepends: cowsay\\nDescription: Practice package that prints a maintenance notice\\n This package exists only for LPIC-1 practice.\\n' > samples/lab-notice/DEBIAN/control"
   },
   {
    "cmd": "printf '/etc/lab-notice.conf\\n' > samples/lab-notice/DEBIAN/conffiles"
   },
   {
    "cmd": "printf 'MESSAGE=\"Maintenance on web01 tonight at 22:00\"\\n' > samples/lab-notice/etc/lab-notice.conf"
   },
   {
    "cmd": "printf '#!/bin/sh\\n. /etc/lab-notice.conf\\n/usr/games/cowsay \"$MESSAGE\"\\n' > samples/lab-notice/usr/bin/lab-notice"
   },
   {
    "cmd": "chmod 755 samples/lab-notice/DEBIAN samples/lab-notice/usr/bin/lab-notice"
   },
   {
    "text": "Validation check: Run find samples -type f and confirm sources.list, requested-packages.txt, control, conffiles, lab-notice.conf, and lab-notice exist. Run apt-file --help to confirm apt-file installed. If a lab goes wrong, rerun Steps 3 and 4 to reset the sample files."
   }
  ],
  "commands": [
   "dpkg -i",
   "-r",
   "-P",
   "-l",
   "-L",
   "-s",
   "-S",
   "-c",
   "-I",
   "-V",
   "-C (--audit)",
   "--get-selections",
   "dpkg-deb -I",
   "-c",
   "-f",
   "-x",
   "--build",
   "dpkg-reconfigure",
   "debconf-show",
   "apt-get update",
   "upgrade",
   "dist-upgrade",
   "install",
   "install -f",
   "install --reinstall",
   "install -s",
   "remove",
   "purge",
   "autoremove",
   "download",
   "clean",
   "autoclean",
   "check",
   "apt-cache search",
   "show",
   "showpkg",
   "depends",
   "rdepends",
   "policy",
   "apt install",
   "remove",
   "purge",
   "search",
   "show",
   "list --installed",
   "list --upgradable",
   "full-upgrade",
   "apt-file update",
   "apt-file search",
   "apt-file list",
   "/etc/apt/sources.list",
   "/etc/apt/sources.list.d",
   "/var/cache/apt/archives",
   "/var/lib/dpkg"
  ],
  "memoryHook": "dpkg works on one package file at a time and never fetches anything: think of it as the installer. apt-get and apt fetch from repositories and solve dependencies: think of them as the shopper. apt-cache and apt-file only read: think of them as the catalog. Remove keeps the config and purge deletes it. Update refreshes the catalog; upgrade replaces the software.",
  "reference": []
 },
 "lessons": [
  {
   "id": "20.1",
   "kind": "vm",
   "title": "Inventory the package tools on a new build",
   "navSubtitle": "command -v, type -a",
   "objective": "102.4",
   "difficulty": "Beginner",
   "source": "Lab 1: Inventory the package tools on a new build",
   "workdir": "~/lpic1-section20",
   "summary": "",
   "scenario": "A ticket asks which package managers are present on a new Mint workstation so the build notes can say which install instructions apply.",
   "task": "Check each common Debian and Red Hat package tool and record where it is or that it is missing.",
   "deliverable": "reports/package-tools.txt.",
   "steps": [
    {
     "text": "for t in dpkg dpkg-reconfigure apt apt-get apt-cache apt-file rpm yum dnf zypper; do printf '%s: ' $t; command -v $t || echo missing; done > reports/package-tools.txt"
    },
    {
     "text": "type -a apt >> reports/package-tools.txt"
    },
    {
     "text": "Add two notes with nano: the difference between a binary package and a source package, and the difference between a low-level tool (dpkg, rpm) and a high-level tool (apt-get, yum, zypper)."
    }
   ],
   "validation": "grep missing reports/package-tools.txt lists rpm, yum, dnf, and zypper, and grep -c dpkg reports/package-tools.txt is at least 2.",
   "trap": "Debian packages end in .deb and are handled by dpkg and apt; Red Hat packages end in .rpm and are handled by rpm, yum, dnf, and zypper. On Mint, type -a apt may show a Mint wrapper in /usr/local/bin ahead of the real /usr/bin/apt.",
   "paste": {
    "command": "cat reports/package-tools.txt",
    "checks": [
     {
      "re": "^(rpm|yum|dnf|zypper):\\s*missing",
      "say": "rpm, yum, dnf and zypper are reported missing",
      "min": 4
     },
     {
      "re": "^dpkg:\\s*/\\S*dpkg\\s*$",
      "say": "dpkg was found with its path"
     },
     {
      "re": "\\bsource\\b",
      "say": "your note covers binary and source packages"
     },
     {
      "re": "low.level|high.level",
      "say": "your note covers low-level and high-level tools"
     }
    ]
   },
   "quiz": [
    {
     "id": "level",
     "prompt": "Which pair is a low-level tool and the high-level tool built on it?",
     "answer": "dpkg",
     "options": [
      {
       "value": "dpkg",
       "label": "<code>dpkg</code> and <code>apt-get</code>"
      },
      {
       "value": "rpm",
       "label": "<code>rpm</code> and <code>dpkg</code>"
      },
      {
       "value": "apt",
       "label": "<code>apt-cache</code> and <code>apt-file</code>"
      }
     ],
     "explain": "Correct. dpkg installs single files; apt-get fetches from repositories and solves dependencies."
    },
    {
     "id": "src",
     "prompt": "What does a source package contain?",
     "answer": "src",
     "options": [
      {
       "value": "src",
       "label": "The original code and the instructions to build it"
      },
      {
       "value": "bin",
       "label": "Compiled programs ready to install"
      },
      {
       "value": "cfg",
       "label": "Only configuration files"
      }
     ],
     "explain": "Correct. A binary package holds the compiled result."
    }
   ],
   "completion": "Inventory the package tools on a new build: done."
  },
  {
   "id": "20.2",
   "kind": "vm",
   "title": "Download a .deb and decode its file name",
   "navSubtitle": "apt download, .deb names",
   "objective": "102.4",
   "difficulty": "Beginner",
   "source": "Lab 2: Download a .deb and decode its file name",
   "workdir": "~/lpic1-section20",
   "summary": "",
   "scenario": "A server team wants a copy of the sl package file for an offline host, and asks you to confirm its version and architecture before they copy it.",
   "task": "Download the package without installing it and break the file name into its parts.",
   "deliverable": "reports/deb-name.txt.",
   "steps": [
    {
     "cmd": "cd debs && apt download sl && cd .."
    },
    {
     "cmd": "ls debs > reports/deb-name.txt"
    },
    {
     "text": "dpkg-deb -f debs/sl_*.deb Package Version Architecture >> reports/deb-name.txt"
    }
   ],
   "validation": "cat reports/deb-name.txt. The file name follows name_version-revision_architecture.deb, such as sl_5.02-1_amd64.deb, and the fields below match it.",
   "trap": "Debian uses underscores between the name, version, and architecture, and the word all for packages that run on any CPU. Red Hat uses dashes and dots and the word noarch. Run apt download as your normal user: with sudo it warns that the _apt user cannot write to your folder.",
   "paste": {
    "command": "cat reports/deb-name.txt",
    "checks": [
     {
      "re": "^sl_[^_\\s]+_(amd64|arm64|i386|all)\\.deb\\s*$",
      "say": "the file name has the name_version_arch.deb form"
     },
     {
      "re": "^Package:\\s*sl\\s*$",
      "say": "dpkg-deb read the Package field"
     },
     {
      "re": "^Version:\\s*\\S+",
      "say": "dpkg-deb read the Version field"
     },
     {
      "re": "^Architecture:\\s*(amd64|arm64|i386|all)\\s*$",
      "say": "dpkg-deb read the Architecture field"
     }
    ]
   },
   "quiz": [
    {
     "id": "all",
     "prompt": "In a .deb file name, which word marks a package that runs on any CPU?",
     "answer": "all",
     "options": [
      {
       "value": "all",
       "label": "<code>all</code>"
      },
      {
       "value": "noarch",
       "label": "<code>noarch</code>"
      },
      {
       "value": "any",
       "label": "<code>any</code>"
      }
     ],
     "explain": "Correct. noarch is the Red Hat word for the same thing."
    }
   ],
   "completion": "Download a .deb and decode its file name: done."
  },
  {
   "id": "20.3",
   "kind": "vm",
   "title": "Review a package before approving it",
   "navSubtitle": "dpkg -I, -c, -s, -l",
   "objective": "102.4",
   "difficulty": "Beginner",
   "source": "Lab 3: Review a package before approving it",
   "workdir": "~/lpic1-section20",
   "summary": "",
   "scenario": "Change control requires you to list a package's dependencies and the files it will place on disk before it is installed.",
   "task": "Show the package's control information and contents, then confirm it is not installed yet.",
   "deliverable": "reports/sl-review.txt.",
   "steps": [
    {
     "text": "dpkg -I debs/sl_*.deb > reports/sl-review.txt"
    },
    {
     "text": "dpkg -c debs/sl_*.deb >> reports/sl-review.txt"
    },
    {
     "text": "dpkg -s sl >> reports/sl-review.txt 2>&1; echo \"exit code $?\" >> reports/sl-review.txt"
    },
    {
     "text": "dpkg -l 'sl*' >> reports/sl-review.txt 2>&1"
    }
   ],
   "validation": "grep -E 'Depends|usr/games/sl|not installed|exit code' reports/sl-review.txt shows the dependencies, the program path, and a non-zero exit code from dpkg -s.",
   "trap": "-I (--info) and -c (--contents) read a package file and need the file name. -s (--status), -L, and -l read the installed database and need the package name. In dpkg -l output, ii means installed, rc means removed with config files left, and un means not installed.",
   "paste": {
    "command": "cat reports/sl-review.txt",
    "checks": [
     {
      "re": "^\\s*Depends:\\s*\\S",
      "say": "dpkg -I shows the dependencies"
     },
     {
      "re": "\\./usr/games/sl\\s*$",
      "say": "dpkg -c lists ./usr/games/sl"
     },
     {
      "re": "is not installed",
      "say": "dpkg -s says sl is not installed"
     },
     {
      "re": "^exit code [1-9]",
      "say": "dpkg -s returned a non-zero exit code"
     }
    ]
   },
   "quiz": [
    {
     "id": "fileorname",
     "prompt": "Which dpkg option needs the .deb file rather than the package name?",
     "answer": "c",
     "options": [
      {
       "value": "c",
       "label": "<code>-c</code>"
      },
      {
       "value": "s",
       "label": "<code>-s</code>"
      },
      {
       "value": "L",
       "label": "<code>-L</code>"
      }
     ],
     "explain": "Correct. -c and -I read a package file; -s and -L read the installed database."
    },
    {
     "id": "rc",
     "prompt": "In <code>dpkg -l</code> output, what does <code>rc</code> mean?",
     "answer": "rc",
     "options": [
      {
       "value": "rc",
       "label": "Removed, but its config files are still there"
      },
      {
       "value": "ok",
       "label": "Installed and configured"
      },
      {
       "value": "half",
       "label": "Unpacked but not configured"
      }
     ],
     "explain": "Correct. Purging it clears the rc entry."
    }
   ],
   "completion": "Review a package before approving it: done."
  },
  {
   "id": "20.4",
   "kind": "vm",
   "title": "Install a local .deb and list its files",
   "navSubtitle": "dpkg -i, -L",
   "objective": "102.4",
   "difficulty": "Beginner",
   "source": "Lab 4: Install a local .deb and list its files",
   "workdir": "~/lpic1-section20",
   "summary": "",
   "scenario": "The offline host has no repository access, so the approved sl package must be installed from the file.",
   "task": "Install the package file with dpkg, confirm the status, and list the files it installed.",
   "deliverable": "reports/sl-installed.txt.",
   "steps": [
    {
     "cmd": "sudo dpkg -i debs/sl_*.deb"
    },
    {
     "text": "dpkg -s sl | grep -E '^(Status|Version)' > reports/sl-installed.txt"
    },
    {
     "text": "dpkg -L sl >> reports/sl-installed.txt"
    },
    {
     "text": "Optional: run /usr/games/sl to see the steam locomotive, then press Ctrl+C if you want to stop it."
    }
   ],
   "validation": "grep 'install ok installed' reports/sl-installed.txt and grep /usr/games/sl reports/sl-installed.txt both match.",
   "trap": "dpkg -i does not download missing dependencies. If they are missing, the package is left unconfigured until you run sudo apt-get install -f. sudo apt install ./file.deb installs a local file and resolves dependencies in one step.",
   "paste": {
    "command": "cat reports/sl-installed.txt",
    "checks": [
     {
      "re": "^Status:\\s*install ok installed",
      "say": "dpkg -s shows install ok installed"
     },
     {
      "re": "^Version:\\s*\\S+",
      "say": "the installed version is recorded"
     },
     {
      "re": "^/usr/games/sl\\s*$",
      "say": "dpkg -L lists /usr/games/sl"
     }
    ]
   },
   "quiz": [
    {
     "id": "deps",
     "prompt": "<code>dpkg -i</code> stops because a dependency is missing. What fixes it?",
     "answer": "f",
     "options": [
      {
       "value": "f",
       "label": "<code>sudo apt-get install -f</code>"
      },
      {
       "value": "again",
       "label": "Run <code>dpkg -i</code> again with sudo"
      },
      {
       "value": "upd",
       "label": "<code>sudo apt-get update</code>"
      }
     ],
     "explain": "Correct. It fetches the missing packages and finishes the configuration."
    }
   ],
   "completion": "Install a local .deb and list its files: done."
  },
  {
   "id": "20.5",
   "kind": "vm",
   "title": "Find which package owns a file",
   "navSubtitle": "dpkg -S, apt-file",
   "objective": "102.4",
   "difficulty": "Intermediate",
   "source": "Lab 5: Find which package owns a file",
   "workdir": "~/lpic1-section20",
   "summary": "",
   "scenario": "An auditor found three files and wants to know which package each one belongs to, including one program that is not installed.",
   "task": "Use dpkg -S for installed files and apt-file for a file in a package you do not have.",
   "deliverable": "reports/file-owners.txt.",
   "steps": [
    {
     "text": "dpkg -S /usr/games/sl > reports/file-owners.txt"
    },
    {
     "text": "dpkg -S /usr/bin/apt >> reports/file-owners.txt"
    },
    {
     "text": "dpkg -S /etc/crontab >> reports/file-owners.txt 2>&1"
    },
    {
     "text": "apt-file search /usr/games/cowsay >> reports/file-owners.txt"
    },
    {
     "text": "apt-file list tree | head -5 >> reports/file-owners.txt"
    }
   ],
   "validation": "cat reports/file-owners.txt shows sl, apt, and cron as owners, and cowsay as the package that would provide /usr/games/cowsay.",
   "trap": "dpkg -S only searches installed packages; apt-file searches the whole repository after apt-file update. On merged-/usr systems some files are registered under /bin, so dpkg -S /usr/bin/NAME can fail while dpkg -S bin/NAME finds it.",
   "paste": {
    "command": "cat reports/file-owners.txt",
    "checks": [
     {
      "re": "^sl:\\s*/usr/games/sl\\s*$",
      "say": "sl owns /usr/games/sl"
     },
     {
      "re": "^apt:\\s*/usr/bin/apt\\s*$",
      "say": "apt owns /usr/bin/apt"
     },
     {
      "re": "^cron\\S*:\\s*/etc/crontab\\s*$",
      "say": "cron owns /etc/crontab"
     },
     {
      "re": "^cowsay:\\s*/usr/games/cowsay\\s*$",
      "say": "apt-file names cowsay for /usr/games/cowsay"
     }
    ]
   },
   "quiz": [
    {
     "id": "notinst",
     "prompt": "Which command finds the package for a file that is not installed on this system?",
     "answer": "aptfile",
     "options": [
      {
       "value": "aptfile",
       "label": "<code>apt-file search</code>"
      },
      {
       "value": "S",
       "label": "<code>dpkg -S</code>"
      },
      {
       "value": "L",
       "label": "<code>dpkg -L</code>"
      }
     ],
     "explain": "Correct. dpkg -S only knows installed packages."
    },
    {
     "id": "SL",
     "prompt": "What does <code>dpkg -L sl</code> do?",
     "answer": "list",
     "options": [
      {
       "value": "list",
       "label": "Lists the files the sl package installed"
      },
      {
       "value": "owner",
       "label": "Finds the package that owns a file called sl"
      },
      {
       "value": "lock",
       "label": "Locks sl at its current version"
      }
     ],
     "explain": "Correct. -S goes the other way, from a file to its package."
    }
   ],
   "completion": "Find which package owns a file: done."
  },
  {
   "id": "20.6",
   "kind": "vm",
   "title": "Verify installed files and audit the package database",
   "navSubtitle": "dpkg -V, dpkg -C",
   "objective": "102.4",
   "difficulty": "Intermediate",
   "source": "Lab 6: Verify installed files and audit the package database",
   "workdir": "~/lpic1-section20",
   "summary": "",
   "scenario": "After a disk scare, the security team asks you to prove that installed package files still match the package database and that no package is half-installed.",
   "task": "Verify one package, verify all packages, and run an audit.",
   "deliverable": "reports/verify.txt.",
   "steps": [
    {
     "cmd": "sudo dpkg -V sl > reports/verify.txt 2>&1; echo \"sl verify exit $?\" >> reports/verify.txt"
    },
    {
     "cmd": "sudo dpkg -V >> reports/verify.txt 2>&1"
    },
    {
     "cmd": "sudo dpkg -C >> reports/verify.txt 2>&1; echo \"audit exit $?\" >> reports/verify.txt"
    },
    {
     "text": "apt-get check >> reports/verify.txt 2>&1"
    }
   ],
   "validation": "grep -E 'exit' reports/verify.txt shows exit 0 for both. Any lines like ??5?????? c /etc/... are config files an admin changed, which is normal.",
   "trap": "No output from dpkg -V or dpkg -C means all is well. In dpkg -V output, 5 means the checksum changed and c marks a config file. dpkg -C is the same as dpkg --audit.",
   "paste": {
    "command": "cat reports/verify.txt",
    "checks": [
     {
      "re": "^sl verify exit 0\\s*$",
      "say": "dpkg -V sl found nothing wrong"
     },
     {
      "re": "^audit exit 0\\s*$",
      "say": "dpkg -C found no half-installed packages"
     },
     {
      "re": "Reading package lists",
      "say": "apt-get check ran"
     }
    ]
   },
   "quiz": [
    {
     "id": "vout",
     "prompt": "<code>sudo dpkg -V sl</code> prints nothing. What does that mean?",
     "answer": "ok",
     "options": [
      {
       "value": "ok",
       "label": "Every file matches the package database"
      },
      {
       "value": "none",
       "label": "sl is not installed"
      },
      {
       "value": "fail",
       "label": "The check could not run"
      }
     ],
     "explain": "Correct. dpkg -V and dpkg -C only print problems."
    },
    {
     "id": "five",
     "prompt": "In a <code>dpkg -V</code> line, what does the <code>5</code> mean?",
     "answer": "md5",
     "options": [
      {
       "value": "md5",
       "label": "The file's checksum no longer matches"
      },
      {
       "value": "mode",
       "label": "The permissions changed"
      },
      {
       "value": "size",
       "label": "The file is 5 bytes larger"
      }
     ],
     "explain": "Correct. A c before the path marks a config file."
    }
   ],
   "completion": "Verify installed files and audit the package database: done."
  },
  {
   "id": "20.7",
   "kind": "vm",
   "title": "Build and inspect your own package",
   "navSubtitle": "dpkg-deb --build, -x",
   "objective": "102.4",
   "difficulty": "Intermediate",
   "source": "Lab 7: Build and inspect your own package",
   "workdir": "~/lpic1-section20",
   "summary": "",
   "scenario": "The team wants to ship a small notice script to every desktop as a proper package so it can be tracked and removed cleanly.",
   "task": "Build lab-notice from the files in samples/lab-notice and inspect the result.",
   "deliverable": "debs/lab-notice_1.0-1_all.deb and reports/lab-notice-info.txt.",
   "steps": [
    {
     "text": "dpkg-deb --root-owner-group --build samples/lab-notice debs/lab-notice_1.0-1_all.deb"
    },
    {
     "text": "dpkg-deb -I debs/lab-notice_1.0-1_all.deb > reports/lab-notice-info.txt"
    },
    {
     "text": "dpkg-deb -c debs/lab-notice_1.0-1_all.deb >> reports/lab-notice-info.txt"
    },
    {
     "cmd": "mkdir -p reports/extracted && dpkg-deb -x debs/lab-notice_1.0-1_all.deb reports/extracted && find reports/extracted -type f >> reports/lab-notice-info.txt"
    }
   ],
   "validation": "grep -E 'Depends: cowsay|conffiles|lab-notice.conf' reports/lab-notice-info.txt shows the dependency, the conffiles entry, and the config file.",
   "trap": "dpkg-deb -x extracts the files without installing them or touching the database. The DEBIAN/conffiles list is what makes dpkg keep /etc/lab-notice.conf on remove and ask before overwriting local changes on upgrade.",
   "paste": {
    "command": "cat reports/lab-notice-info.txt",
    "checks": [
     {
      "re": "^\\s*Depends:\\s*cowsay",
      "say": "the control data depends on cowsay"
     },
     {
      "re": "bytes,\\s+\\d+\\s+lines?\\s+conffiles",
      "say": "the control archive holds a conffiles list"
     },
     {
      "re": "\\./etc/lab-notice\\.conf\\s*$",
      "say": "dpkg-deb -c lists the config file"
     },
     {
      "re": "^reports/extracted/usr/bin/lab-notice\\s*$",
      "say": "dpkg-deb -x extracted the script"
     }
    ]
   },
   "quiz": [
    {
     "id": "x",
     "prompt": "What does <code>dpkg-deb -x</code> do?",
     "answer": "extract",
     "options": [
      {
       "value": "extract",
       "label": "Unpacks the files into a folder without installing anything"
      },
      {
       "value": "install",
       "label": "Installs the package without its dependencies"
      },
      {
       "value": "build",
       "label": "Builds a .deb from a folder"
      }
     ],
     "explain": "Correct. The package database is not touched."
    },
    {
     "id": "conff",
     "prompt": "Why list <code>/etc/lab-notice.conf</code> in DEBIAN/conffiles?",
     "answer": "keep",
     "options": [
      {
       "value": "keep",
       "label": "So dpkg keeps local edits on remove and asks before replacing them on upgrade"
      },
      {
       "value": "run",
       "label": "So the file runs after install"
      },
      {
       "value": "perm",
       "label": "So the file is made read-only"
      }
     ],
     "explain": "Correct. Only purge deletes conffiles."
    }
   ],
   "completion": "Build and inspect your own package: done."
  },
  {
   "id": "20.8",
   "kind": "vm",
   "title": "Recover from a failed dependency",
   "navSubtitle": "Broken deps, apt-get -f",
   "objective": "102.4",
   "difficulty": "Intermediate",
   "source": "Lab 8: Recover from a failed dependency",
   "workdir": "~/lpic1-section20",
   "summary": "",
   "scenario": "A colleague installed lab-notice with dpkg on a desktop that did not have cowsay, and now apt complains about broken packages.",
   "task": "Reproduce the failure, see the half-configured state, and fix it with apt-get.",
   "deliverable": "reports/dependency-fix.txt.",
   "steps": [
    {
     "text": "dpkg -s cowsay > /dev/null 2>&1 && echo 'cowsay already installed: run sudo apt-get remove cowsay first' || echo 'cowsay not installed, continue'"
    },
    {
     "cmd": "sudo dpkg -i debs/lab-notice_1.0-1_all.deb 2>&1 | tee reports/dependency-fix.txt"
    },
    {
     "text": "dpkg -l lab-notice | tail -1 >> reports/dependency-fix.txt"
    },
    {
     "cmd": "sudo apt-get install -f"
    },
    {
     "text": "dpkg -l lab-notice cowsay | tail -2 >> reports/dependency-fix.txt; lab-notice"
    }
   ],
   "validation": "cat reports/dependency-fix.txt shows dependency problems, then iU (unpacked, not configured), then ii for both lab-notice and cowsay. lab-notice prints the cow with the maintenance message.",
   "trap": "apt-get install -f (fix broken) installs the missing dependencies and finishes configuring the package. Without it, apt refuses most other installs until the problem is fixed.",
   "paste": {
    "command": "cat reports/dependency-fix.txt",
    "checks": [
     {
      "re": "dependency problems",
      "say": "dpkg reported dependency problems"
     },
     {
      "re": "^iU\\s+lab-notice\\s",
      "say": "lab-notice was left unpacked, not configured (iU)"
     },
     {
      "re": "^ii\\s+lab-notice\\s",
      "say": "lab-notice ends up installed (ii)"
     },
     {
      "re": "^ii\\s+cowsay\\s",
      "say": "cowsay ends up installed (ii)"
     }
    ]
   },
   "quiz": [
    {
     "id": "iU",
     "prompt": "What does <code>iU</code> mean in <code>dpkg -l</code>?",
     "answer": "iu",
     "options": [
      {
       "value": "iu",
       "label": "Marked for install, but only unpacked, not configured"
      },
      {
       "value": "ok",
       "label": "Installed and up to date"
      },
      {
       "value": "upg",
       "label": "An upgrade is available"
      }
     ],
     "explain": "Correct. apt-get install -f finishes it once the dependencies are there."
    }
   ],
   "completion": "Recover from a failed dependency: done."
  },
  {
   "id": "20.9",
   "kind": "vm",
   "title": "Remove compared with purge",
   "navSubtitle": "dpkg -r compared with -P",
   "objective": "102.4",
   "difficulty": "Intermediate",
   "source": "Lab 9: Remove compared with purge",
   "workdir": "~/lpic1-section20",
   "summary": "",
   "scenario": "lab-notice is being retired. First you remove it but keep the local config in case it comes back, then the owner asks for a complete cleanup.",
   "task": "Change the config, remove the package, show the leftover config, then purge it.",
   "deliverable": "reports/remove-vs-purge.txt.",
   "steps": [
    {
     "cmd": "sudo sed -i 's/22:00/23:00/' /etc/lab-notice.conf"
    },
    {
     "cmd": "sudo dpkg -r lab-notice; dpkg -l lab-notice | tail -1 > reports/remove-vs-purge.txt; ls -l /etc/lab-notice.conf >> reports/remove-vs-purge.txt"
    },
    {
     "cmd": "sudo dpkg -P lab-notice; dpkg -l lab-notice >> reports/remove-vs-purge.txt 2>&1; ls -l /etc/lab-notice.conf >> reports/remove-vs-purge.txt 2>&1"
    }
   ],
   "validation": "cat reports/remove-vs-purge.txt shows rc and the config file still present after -r, then no installed package and No such file or directory after -P.",
   "trap": "dpkg -r (--remove) keeps config files and dpkg -P (--purge) deletes them. apt-get remove and apt-get purge do the same. Neither dpkg -r nor dpkg -P removes dependencies such as cowsay.",
   "paste": {
    "command": "cat reports/remove-vs-purge.txt",
    "checks": [
     {
      "re": "^rc\\s+lab-notice\\s",
      "say": "after -r, dpkg -l shows rc"
     },
     {
      "re": "^-\\S+\\s+\\d+\\s+root\\s+root\\s.*/etc/lab-notice\\.conf\\s*$",
      "say": "after -r, the config file is still there"
     },
     {
      "re": "No such file or directory",
      "say": "after -P, the config file is gone"
     },
     {
      "re": "^ii\\s+lab-notice\\s",
      "say": "lab-notice is no longer installed",
      "absent": true
     }
    ]
   },
   "quiz": [
    {
     "id": "purge",
     "prompt": "Which command removes a package and its config files?",
     "answer": "P",
     "options": [
      {
       "value": "P",
       "label": "<code>dpkg -P</code>"
      },
      {
       "value": "r",
       "label": "<code>dpkg -r</code>"
      },
      {
       "value": "auto",
       "label": "<code>apt-get autoremove</code>"
      }
     ],
     "explain": "Correct. apt-get purge does the same."
    },
    {
     "id": "deps",
     "prompt": "After <code>dpkg -P lab-notice</code>, what happens to cowsay?",
     "answer": "stays",
     "options": [
      {
       "value": "stays",
       "label": "It stays installed"
      },
      {
       "value": "gone",
       "label": "It is purged too"
      },
      {
       "value": "rc",
       "label": "It moves to rc"
      }
     ],
     "explain": "Correct. dpkg never removes dependencies; apt-get autoremove can."
    }
   ],
   "completion": "Remove compared with purge: done."
  },
  {
   "id": "20.10",
   "kind": "vm",
   "title": "Rerun a package's setup questions with dpkg-reconfigure",
   "navSubtitle": "dpkg-reconfigure, debconf-show",
   "objective": "102.4",
   "difficulty": "Intermediate",
   "source": "Lab 10: Rerun a package's setup questions with dpkg-reconfigure",
   "workdir": "~/lpic1-section20",
   "summary": "",
   "scenario": "A user says the time zone was set wrong during install. Before you change anything, you show how the package's setup questions can be asked again without reinstalling.",
   "task": "Record the current answers, rerun the tzdata questions choosing your current zone, and prove nothing changed.",
   "deliverable": "reports/reconfigure.txt.",
   "steps": [
    {
     "text": "timedatectl show -p Timezone > reports/reconfigure.txt; sudo debconf-show tzdata >> reports/reconfigure.txt"
    },
    {
     "cmd": "sudo dpkg-reconfigure tzdata, then choose the same area and city you already use."
    },
    {
     "text": "timedatectl show -p Timezone >> reports/reconfigure.txt"
    }
   ],
   "validation": "grep Timezone reports/reconfigure.txt shows the same value before and after.",
   "trap": "dpkg-reconfigure reruns the debconf questions of an installed package, so you do not need to purge and reinstall. Other common examples are locales, keyboard-configuration, and console-setup.",
   "paste": {
    "command": "cat reports/reconfigure.txt",
    "checks": [
     {
      "re": "^Timezone=\\S+",
      "say": "the time zone was recorded before and after",
      "min": 2
     },
     {
      "re": "tzdata/Areas:",
      "say": "debconf-show listed the tzdata answers"
     },
     {
      "re": "^Timezone=(\\S+)\\s*$[\\s\\S]*^Timezone=\\1\\s*$",
      "say": "the time zone is the same after reconfiguring"
     }
    ]
   },
   "quiz": [
    {
     "id": "reconf",
     "prompt": "How do you ask an installed package's setup questions again?",
     "answer": "reconf",
     "options": [
      {
       "value": "reconf",
       "label": "<code>sudo dpkg-reconfigure PACKAGE</code>"
      },
      {
       "value": "purge",
       "label": "Purge it and install it again"
      },
      {
       "value": "show",
       "label": "<code>sudo debconf-show PACKAGE</code>"
      }
     ],
     "explain": "Correct. debconf-show only displays the saved answers."
    }
   ],
   "completion": "Rerun a package's setup questions with dpkg-reconfigure: done."
  },
  {
   "id": "20.11",
   "kind": "vm",
   "title": "Document the repositories this system uses",
   "navSubtitle": "sources.list, apt-get update",
   "objective": "102.4",
   "difficulty": "Advanced",
   "source": "Lab 11: Document the repositories this system uses",
   "workdir": "~/lpic1-section20",
   "summary": "",
   "scenario": "A firewall change is planned, and the network team needs every repository address this desktop downloads packages from.",
   "task": "Read the repository files, refresh the package lists, and decode the practice sources.list.",
   "deliverable": "reports/repositories.txt.",
   "steps": [
    {
     "cmd": "cat /etc/apt/sources.list > reports/repositories.txt; ls /etc/apt/sources.list.d >> reports/repositories.txt"
    },
    {
     "cmd": "grep -rhE '^(deb|URIs|Suites|Components)' /etc/apt/sources.list /etc/apt/sources.list.d/ >> reports/repositories.txt"
    },
    {
     "cmd": "sudo apt-get update 2>&1 | grep -E '^(Hit|Get)' >> reports/repositories.txt"
    },
    {
     "text": "sed 's/\\[[^]]*\\] //' samples/sources.list | awk '/^deb/ {c=\"\"; for (i=4; i<=NF; i++) c=c\" \"$i; print \"type=\"$1, \"uri=\"$2, \"suite=\"$3, \"components:\"c}' >> reports/repositories.txt"
    }
   ],
   "validation": "grep -c http reports/repositories.txt is greater than 5, and the file names the Mint and Ubuntu repositories.",
   "trap": "Each line is: deb or deb-src, optional [options], the URI, the suite (release), then one or more components. On Mint, /etc/apt/sources.list is usually empty and the real list is /etc/apt/sources.list.d/official-package-repositories.list. Newer files may use the multi-line .sources format.",
   "paste": {
    "command": "cat reports/repositories.txt",
    "checks": [
     {
      "re": "https?://",
      "say": "at least six repository addresses are listed",
      "min": 6
     },
     {
      "re": "linuxmint",
      "say": "the Mint repository is named"
     },
     {
      "re": "^(Hit|Get):\\d+\\s",
      "say": "apt-get update output is included"
     },
     {
      "re": "^type=deb uri=\\S+ suite=\\S+ components: \\S",
      "say": "the practice lines are decoded into their fields",
      "min": 4
     }
    ]
   },
   "quiz": [
    {
     "id": "order",
     "prompt": "Put the fields of a sources.list line in order.",
     "answer": "order",
     "options": [
      {
       "value": "order",
       "label": "type, [options], URI, suite, components"
      },
      {
       "value": "o2",
       "label": "type, suite, URI, components"
      },
      {
       "value": "o3",
       "label": "URI, type, components, suite"
      }
     ],
     "explain": "Correct. For example: deb http://archive.ubuntu.com/ubuntu noble main universe."
    },
    {
     "id": "debsrc",
     "prompt": "What is a <code>deb-src</code> line for?",
     "answer": "src",
     "options": [
      {
       "value": "src",
       "label": "Fetching source packages"
      },
      {
       "value": "sec",
       "label": "Security updates"
      },
      {
       "value": "local",
       "label": "Local .deb files"
      }
     ],
     "explain": "Correct. deb lines give binary packages."
    }
   ],
   "completion": "Document the repositories this system uses: done."
  },
  {
   "id": "20.12",
   "kind": "vm",
   "title": "Research a package before a request is approved",
   "navSubtitle": "apt-cache show, policy, depends",
   "objective": "102.4",
   "difficulty": "Advanced",
   "source": "Lab 12: Research a package before a request is approved",
   "workdir": "~/lpic1-section20",
   "summary": "",
   "scenario": "A user requests tree. The approver wants its description, version, source repository, dependencies, and what depends on it.",
   "task": "Gather the information with apt-cache and compare with apt.",
   "deliverable": "reports/tree-research.txt.",
   "steps": [
    {
     "text": "apt-cache search --names-only '^tree$' > reports/tree-research.txt"
    },
    {
     "text": "apt-cache show tree | grep -E '^(Package|Version|Depends|Description)' >> reports/tree-research.txt"
    },
    {
     "text": "apt-cache policy tree >> reports/tree-research.txt"
    },
    {
     "text": "apt-cache depends tree >> reports/tree-research.txt; apt-cache rdepends tree | head -10 >> reports/tree-research.txt"
    },
    {
     "text": "apt show tree 2>/dev/null | head -5 >> reports/tree-research.txt"
    }
   ],
   "validation": "grep -E 'Candidate|Depends: libc6' reports/tree-research.txt shows the candidate version and the libc6 dependency.",
   "trap": "apt-cache only reads the local package lists, so it needs no sudo but is only as current as your last apt-get update. apt-cache showpkg gives reverse dependencies and versions in a rawer format. apt prints a warning that its output is not stable for scripts.",
   "paste": {
    "command": "cat reports/tree-research.txt",
    "checks": [
     {
      "re": "^tree - ",
      "say": "apt-cache search found tree"
     },
     {
      "re": "^Depends:\\s*libc6",
      "say": "apt-cache show lists the libc6 dependency"
     },
     {
      "re": "^\\s*Candidate:\\s*\\S+",
      "say": "apt-cache policy shows the candidate version"
     },
     {
      "re": "Reverse Depends:",
      "say": "apt-cache rdepends ran"
     }
    ]
   },
   "quiz": [
    {
     "id": "sudo",
     "prompt": "Does <code>apt-cache policy tree</code> need sudo?",
     "answer": "no",
     "options": [
      {
       "value": "no",
       "label": "No. apt-cache only reads the local package lists"
      },
      {
       "value": "yes",
       "label": "Yes, it contacts the repositories"
      },
      {
       "value": "inst",
       "label": "Only if tree is installed"
      }
     ],
     "explain": "Correct. It is only as current as the last apt-get update."
    },
    {
     "id": "rdep",
     "prompt": "Which command lists the packages that depend on tree?",
     "answer": "rdep",
     "options": [
      {
       "value": "rdep",
       "label": "<code>apt-cache rdepends tree</code>"
      },
      {
       "value": "dep",
       "label": "<code>apt-cache depends tree</code>"
      },
      {
       "value": "pol",
       "label": "<code>apt-cache policy tree</code>"
      }
     ],
     "explain": "Correct. showpkg gives the same in a rawer form."
    }
   ],
   "completion": "Research a package before a request is approved: done."
  },
  {
   "id": "20.13",
   "kind": "vm",
   "title": "Fulfill, then roll back a software request",
   "navSubtitle": "install -s, purge, autoremove, clean",
   "objective": "102.4",
   "difficulty": "Advanced",
   "source": "Lab 13: Fulfill, then roll back a software request",
   "workdir": "~/lpic1-section20",
   "summary": "",
   "scenario": "A ticket asks for tree and cowsay on this desktop for a training day. After the training they must be removed, along with anything installed only for them.",
   "task": "Simulate the install, install the packages, then remove and purge them and clean up.",
   "deliverable": "reports/request-rollback.txt.",
   "steps": [
    {
     "text": "apt-get install -s $(cat samples/requested-packages.txt) > reports/request-rollback.txt"
    },
    {
     "cmd": "sudo apt-get install -y $(cat samples/requested-packages.txt); apt list --installed tree cowsay sl >> reports/request-rollback.txt 2>/dev/null"
    },
    {
     "cmd": "sudo apt-get remove -y tree; sudo apt-get purge -y cowsay sl; sudo apt-get autoremove -y"
    },
    {
     "cmd": "ls /var/cache/apt/archives/*.deb 2>/dev/null | wc -l >> reports/request-rollback.txt; sudo apt-get clean; ls /var/cache/apt/archives/*.deb 2>/dev/null | wc -l >> reports/request-rollback.txt"
    },
    {
     "text": "dpkg -l tree cowsay sl >> reports/request-rollback.txt 2>&1"
    }
   ],
   "validation": "grep -c '^Inst' reports/request-rollback.txt is at least 1 (cowsay may already be installed from Lab 8), and the final dpkg -l lines show rc or un for tree and un or no entry for cowsay and sl.",
   "trap": "-s (simulate) shows what would happen without changing anything. autoremove removes dependencies that were installed automatically and are no longer needed. clean empties the downloaded package cache in /var/cache/apt/archives; autoclean only removes files that can no longer be downloaded.",
   "paste": {
    "command": "cat reports/request-rollback.txt",
    "checks": [
     {
      "re": "^Inst\\s",
      "say": "the simulation shows at least one Inst line"
     },
     {
      "re": "^tree/\\S+\\s.*\\[installed",
      "say": "apt list showed tree installed"
     },
     {
      "re": "^(rc|un)\\s+tree\\s|no packages found matching tree",
      "say": "tree ends removed (rc or un)"
     },
     {
      "re": "^ii\\s+(tree|cowsay|sl)\\s",
      "say": "none of the three is still installed",
      "absent": true
     }
    ]
   },
   "quiz": [
    {
     "id": "auto",
     "prompt": "What does <code>apt-get autoremove</code> remove?",
     "answer": "auto",
     "options": [
      {
       "value": "auto",
       "label": "Packages installed only as dependencies that nothing needs now"
      },
      {
       "value": "old",
       "label": "Old .deb files in the cache"
      },
      {
       "value": "cfg",
       "label": "Leftover config files"
      }
     ],
     "explain": "Correct. apt-get clean empties the cache instead."
    },
    {
     "id": "sim",
     "prompt": "Which option shows what apt-get would do without changing anything?",
     "answer": "s",
     "options": [
      {
       "value": "s",
       "label": "<code>-s</code>"
      },
      {
       "value": "y",
       "label": "<code>-y</code>"
      },
      {
       "value": "f",
       "label": "<code>-f</code>"
      }
     ],
     "explain": "Correct. The Inst and Conf lines are the plan."
    }
   ],
   "completion": "Fulfill, then roll back a software request: done."
  },
  {
   "id": "20.14",
   "kind": "vm",
   "title": "Plan a patch window",
   "navSubtitle": "upgrade compared with dist-upgrade",
   "objective": "102.4",
   "difficulty": "Advanced",
   "source": "Lab 14: Plan a patch window",
   "workdir": "~/lpic1-section20",
   "summary": "",
   "scenario": "Your manager asks how many packages would be updated tonight, and whether a plain upgrade would hold any back.",
   "task": "List pending updates and compare what upgrade and dist-upgrade would do, without installing anything.",
   "deliverable": "reports/patch-plan.txt.",
   "steps": [
    {
     "cmd": "sudo apt-get update"
    },
    {
     "text": "apt list --upgradable 2>/dev/null > reports/patch-plan.txt"
    },
    {
     "cmd": "echo \"upgrade: $(apt-get -s upgrade | grep -c '^Inst')\" >> reports/patch-plan.txt"
    },
    {
     "cmd": "echo \"dist-upgrade: $(apt-get -s dist-upgrade | grep -c '^Inst')\" >> reports/patch-plan.txt"
    },
    {
     "text": "apt-get -s upgrade | grep -A3 'kept back' >> reports/patch-plan.txt"
    }
   ],
   "validation": "grep -E '^(upgrade|dist-upgrade):' reports/patch-plan.txt shows two counts. dist-upgrade is equal to or larger than upgrade.",
   "trap": "update refreshes the package lists and installs nothing. upgrade never installs new packages or removes old ones, so it holds back updates that need them; dist-upgrade (apt full-upgrade) can do both. Applying the updates for real is optional on your VM.",
   "paste": {
    "command": "cat reports/patch-plan.txt",
    "checks": [
     {
      "re": "^Listing",
      "say": "apt list --upgradable ran"
     },
     {
      "re": "^upgrade:\\s*\\d+\\s*$",
      "say": "the upgrade count is recorded"
     },
     {
      "re": "^dist-upgrade:\\s*\\d+\\s*$",
      "say": "the dist-upgrade count is recorded"
     }
    ]
   },
   "quiz": [
    {
     "id": "kept",
     "prompt": "Why might <code>apt-get upgrade</code> hold a package back?",
     "answer": "new",
     "options": [
      {
       "value": "new",
       "label": "Its update needs a new package installed or an old one removed"
      },
      {
       "value": "sig",
       "label": "Its signature failed"
      },
      {
       "value": "upd",
       "label": "apt-get update was not run"
      }
     ],
     "explain": "Correct. dist-upgrade (apt full-upgrade) can do that."
    },
    {
     "id": "update",
     "prompt": "What does <code>apt-get update</code> change?",
     "answer": "lists",
     "options": [
      {
       "value": "lists",
       "label": "Only the package lists"
      },
      {
       "value": "pkgs",
       "label": "The installed packages"
      },
      {
       "value": "both",
       "label": "Both"
      }
     ],
     "explain": "Correct. upgrade is the step that installs newer versions."
    }
   ],
   "completion": "Plan a patch window: done."
  }
 ],
 "review": {
  "traps": [
   "Confusing update with upgrade. apt-get update refreshes package lists; apt-get upgrade installs newer versions.",
   "Expecting dpkg to download or resolve dependencies. Only apt-get and apt do that; fix a failed dpkg -i with apt-get install -f.",
   "Mixing up remove and purge. dpkg -r and apt-get remove keep config files; dpkg -P and apt-get purge delete them.",
   "Giving dpkg the wrong argument. -i, -c, and -I take a .deb file; -r, -P, -s, -L, and -V take a package name.",
   "Mixing up -L and -S. dpkg -L lists the files in a package; dpkg -S finds the package that owns a file.",
   "Expecting dpkg -S to find files in packages you have not installed. Use apt-file search after apt-file update.",
   "Forgetting dpkg -l status letters. ii is installed, rc is removed with config left, and iU is unpacked but not configured.",
   "Confusing upgrade with dist-upgrade. Only dist-upgrade (or apt full-upgrade) may add or remove packages to complete an update.",
   "Reinstalling to redo setup questions. dpkg-reconfigure reruns them on an installed package.",
   "Mixing up the sources.list fields. The order is type, options, URI, suite, then components; deb-src lines are for source packages.",
   "Forgetting where downloaded packages are cached. /var/cache/apt/archives; apt-get clean empties it.",
   "Using sudo for apt-cache. apt-cache only reads data and needs no root; install, remove, purge, update, and upgrade do.",
   "Confusing Debian and Red Hat file names. name_version-revision_arch.deb with all, against name-version-release.arch.rpm with noarch.",
   "Forgetting that dpkg -V and dpkg -C print nothing when all is well."
  ],
  "trapQuiz": [
   {
    "id": "tq1",
    "prompt": "Which command installs newer versions of the installed packages?",
    "answer": "upgrade",
    "options": [
     {
      "value": "update",
      "label": "<code>apt-get update</code>"
     },
     {
      "value": "upgrade",
      "label": "<code>apt-get upgrade</code>"
     },
     {
      "value": "check",
      "label": "<code>apt-get check</code>"
     }
    ],
    "explain": "Correct. update only refreshes the package lists."
   },
   {
    "id": "tq2",
    "prompt": "<code>dpkg -i</code> reports missing dependencies. What does dpkg do about them?",
    "answer": "nothing",
    "options": [
     {
      "value": "nothing",
      "label": "Nothing; it leaves the package unconfigured"
     },
     {
      "value": "fetch",
      "label": "Downloads them"
     },
     {
      "value": "skip",
      "label": "Removes the package again"
     }
    ],
    "explain": "Correct. Run sudo apt-get install -f."
   },
   {
    "id": "tq3",
    "prompt": "Which commands keep a package's config files?",
    "answer": "remove",
    "options": [
     {
      "value": "remove",
      "label": "<code>dpkg -r</code> and <code>apt-get remove</code>"
     },
     {
      "value": "purge",
      "label": "<code>dpkg -P</code> and <code>apt-get purge</code>"
     },
     {
      "value": "all",
      "label": "All four"
     }
    ],
    "explain": "Correct. Purge deletes them."
   },
   {
    "id": "tq4",
    "prompt": "Which command finds the installed package that owns <code>/usr/bin/apt</code>?",
    "answer": "S",
    "options": [
     {
      "value": "S",
      "label": "<code>dpkg -S /usr/bin/apt</code>"
     },
     {
      "value": "L",
      "label": "<code>dpkg -L /usr/bin/apt</code>"
     },
     {
      "value": "s",
      "label": "<code>dpkg -s /usr/bin/apt</code>"
     }
    ],
    "explain": "Correct. -L lists a package's files instead."
   },
   {
    "id": "tq5",
    "prompt": "Which upgrade may install new packages or remove old ones?",
    "answer": "dist",
    "options": [
     {
      "value": "dist",
      "label": "<code>apt-get dist-upgrade</code>"
     },
     {
      "value": "up",
      "label": "<code>apt-get upgrade</code>"
     },
     {
      "value": "upd",
      "label": "<code>apt-get update</code>"
     }
    ],
    "explain": "Correct. apt full-upgrade is the same."
   },
   {
    "id": "tq6",
    "prompt": "Where does apt keep the .deb files it downloaded?",
    "answer": "cache",
    "options": [
     {
      "value": "cache",
      "label": "<code>/var/cache/apt/archives</code>"
     },
     {
      "value": "lib",
      "label": "<code>/var/lib/dpkg</code>"
     },
     {
      "value": "etc",
      "label": "<code>/etc/apt/sources.list.d</code>"
     }
    ],
    "explain": "Correct. apt-get clean empties it."
   },
   {
    "id": "tq7",
    "prompt": "Which command does <em>not</em> need sudo?",
    "answer": "cache",
    "options": [
     {
      "value": "cache",
      "label": "<code>apt-cache show tree</code>"
     },
     {
      "value": "upd",
      "label": "<code>apt-get update</code>"
     },
     {
      "value": "rm",
      "label": "<code>apt-get remove tree</code>"
     }
    ],
    "explain": "Correct. apt-cache only reads."
   },
   {
    "id": "tq8",
    "prompt": "Which file name is a Debian package?",
    "answer": "deb",
    "options": [
     {
      "value": "deb",
      "label": "<code>tree_2.1.1-2_amd64.deb</code>"
     },
     {
      "value": "rpm",
      "label": "<code>tree-1.6.0-10.el7.x86_64.rpm</code>"
     },
     {
      "value": "mix",
      "label": "<code>tree-2.1.1-2.amd64.deb</code>"
     }
    ],
    "explain": "Correct. Debian uses underscores: name_version-revision_arch.deb."
   }
  ],
  "challenge": {
   "intro": "Complete these tasks without notes. Use only your Linux Mint VM and the files in ~/lpic1-section20. Rerun Steps 3 and 4 of the Lab Setup first so you start from fresh sample files, and remove sl, tree, cowsay, and lab-notice if they are still installed.",
   "tasks": [
    "Download the sl package file without installing it, and record its version and architecture from the file name and from the package itself.",
    "List the dependencies and the files of the sl package file before installing it.",
    "Install sl from the file with dpkg and prove it is installed.",
    "Name the package that owns /usr/bin/apt and the package that would provide /usr/games/cowsay.",
    "Build lab-notice, install it with dpkg on a system without cowsay, and repair the broken state with apt-get.",
    "Remove lab-notice so that its config file stays, prove it, then purge it and prove the config file is gone.",
    "List every repository line this system uses and explain each field of one line.",
    "Report how many packages upgrade and dist-upgrade would each install, without changing anything."
   ],
   "outro": "Your final handoff is the reports directory. For each file, write a short sentence explaining what it proves, and finish by purging the packages you installed."
  },
  "questions": [
   {
    "q": "Help desk request: “A user says the tree command is missing. Install it from the repositories and prove it worked.”",
    "a": "<code>sudo apt-get update</code>, then <code>sudo apt-get install tree</code>. Prove it with <code>dpkg -s tree</code> (<em>install ok installed</em>), <code>dpkg -l tree</code> showing <code>ii</code>, or <code>command -v tree</code>."
   },
   {
    "q": "Auditor request: “Which package put /etc/crontab on this machine?”",
    "a": "<code>dpkg -S /etc/crontab</code>. It answers <code>cron: /etc/crontab</code>."
   },
   {
    "q": "Server team request: “We have a .deb on a USB stick for a host with no internet. Install it, and tell us how you would handle missing dependencies.”",
    "a": "<code>sudo dpkg -i FILE.deb</code>. If dependencies are missing, the package stays unconfigured: download the dependency .debs on a connected host (<code>apt download NAME</code>) and install them with it, or run <code>sudo apt-get install -f</code> once a repository is reachable. <code>sudo apt install ./FILE.deb</code> does the install and the dependencies in one step when a repository is available."
   },
   {
    "q": "Security request: “Remove the cowsay package and make sure none of its config files are left behind.”",
    "a": "<code>sudo apt-get purge cowsay</code> (or <code>sudo dpkg -P cowsay</code>), then <code>dpkg -l cowsay</code> shows no <code>ii</code> or <code>rc</code> entry. <code>sudo apt-get autoremove --purge</code> also clears dependencies installed only for it."
   },
   {
    "q": "Network team request: “List every repository address this system downloads packages from.”",
    "a": "Read <code>/etc/apt/sources.list</code> and every file in <code>/etc/apt/sources.list.d/</code>, for example <code>grep -rhE '^(deb|URIs)' /etc/apt/sources.list /etc/apt/sources.list.d/</code>. <code>sudo apt-get update</code> and <code>apt-cache policy</code> also show each address in use."
   },
   {
    "q": "Manager request: “Before tonight's patching, tell me what will be upgraded and whether anything will be held back. Don't change anything yet.”",
    "a": "<code>sudo apt-get update</code> (refreshes lists only), then <code>apt list --upgradable</code>, <code>apt-get -s upgrade</code> and <code>apt-get -s dist-upgrade</code>. Packages under <em>kept back</em> need dist-upgrade, because they add or remove packages."
   },
   {
    "q": "User request: “The setup questions for a package were answered wrong during install. Can you redo them without reinstalling?”",
    "a": "Yes: <code>sudo dpkg-reconfigure PACKAGE</code> asks the debconf questions again. <code>sudo debconf-show PACKAGE</code> shows the current answers first."
   }
  ],
  "mastery": [
   "I can explain binary and source packages, dependencies, repositories, and low-level and high-level package tools.",
   "I can decode a .deb file name and compare it with an .rpm file name.",
   "I can inspect a package file with dpkg -I and dpkg -c, and extract it with dpkg-deb -x.",
   "I can install a local package with dpkg -i and repair missing dependencies with apt-get install -f.",
   "I can check a package with dpkg -s, list packages with dpkg -l, and read the status letters.",
   "I can list a package's files with dpkg -L and find a file's owner with dpkg -S and apt-file search.",
   "I can verify installed files with dpkg -V and audit the database with dpkg -C.",
   "I can explain and demonstrate the difference between remove and purge.",
   "I can rerun a package's setup questions with dpkg-reconfigure.",
   "I can read /etc/apt/sources.list and the files in /etc/apt/sources.list.d, and explain each field.",
   "I can use apt-cache search, show, depends, rdepends, and policy, and the apt equivalents.",
   "I can use apt-get update, upgrade, dist-upgrade, install, remove, purge, autoremove, and clean, and simulate any of them with -s."
  ]
 }
});
