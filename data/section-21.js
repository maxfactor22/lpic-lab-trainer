/* Section 21: RPM and YUM Package Management. Generated from LPIC_Section21_Lab_Workbook.docx by vm_section.py;
   paste checks, quizzes and model answers were added for the app. */
LPIC.section({
 "id": "section-21",
 "number": 21,
 "title": "RPM and YUM Package Management",
 "objectives": [
  "102.5"
 ],
 "kind": "vm",
 "source": "LPIC_Section21_Lab_Workbook.docx",
 "scenario": "Objective 102.5: Use RPM and YUM package management by inspecting, extracting, sandbox-installing, and verifying real .rpm files, and by translating requests into yum, dnf, and zypper commands.",
 "overview": {
  "paragraphs": [
   "Treat each lab like an IT engineer task, not a command drill. Read the request, gather evidence about the package, save it under reports/, and prove it with the validation command.",
   "Linux Mint is a Debian-family system. It has no RPM database of its own and no yum, dnf, or zypper, and dpkg owns every installed file. Never install an .rpm into the real system. In these labs you install the rpm tools from the Mint repositories, download three real CentOS 7 package files, and work with them in three safe ways: querying the files directly (rpm -qp), extracting them (rpm2cpio and cpio), and installing them into a private sandbox folder with rpm --root. yum, dnf, zypper, and yumdownloader cannot run on Mint, so they are read-and-explain content: you study sample config files, write runbooks, and learn the commands from the comparison section, the traps, and the questions."
  ],
  "setup": [
   {
    "text": "Step 1: Install the RPM tools from the Mint repositories:"
   },
   {
    "cmd": "sudo apt install rpm rpm2cpio cpio wget"
   },
   {
    "text": "Step 2: Create the practice workspace:"
   },
   {
    "cmd": "mkdir -p ~/lpic1-section21/{reports,rpms,extract,samples,fakeroot,rpmdb}"
   },
   {
    "cmd": "cd ~/lpic1-section21"
   },
   {
    "text": "Step 3: Download three package files from the CentOS 7 archive (a binary package, a noarch package, and a source package):"
   },
   {
    "cmd": "wget -P rpms https://vault.centos.org/7.9.2009/os/x86_64/Packages/tree-1.6.0-10.el7.x86_64.rpm https://vault.centos.org/7.9.2009/os/x86_64/Packages/words-3.0-22.el7.noarch.rpm https://vault.centos.org/7.9.2009/os/Source/SPackages/tree-1.6.0-10.el7.src.rpm"
   },
   {
    "text": "Step 4: Create sample yum, dnf, and zypper configuration files:"
   },
   {
    "cmd": "printf '[main]\\ncachedir=/var/cache/yum/$basearch/$releasever\\nkeepcache=0\\ndebuglevel=2\\nlogfile=/var/log/yum.log\\nexactarch=1\\nobsoletes=1\\ngpgcheck=1\\nplugins=1\\ninstallonly_limit=3\\n# assumeyes=1\\n# Repository definitions belong in /etc/yum.repos.d\\n' > samples/yum.conf"
   },
   {
    "cmd": "printf '[internal-base]\\nname=Internal base mirror for db01 builds\\nbaseurl=http://mirror.example.com/el9/BaseOS/$basearch/\\nenabled=1\\ngpgcheck=1\\ngpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-example\\n\\n[internal-testing]\\nname=Internal testing packages\\nbaseurl=http://mirror.example.com/el9/testing/$basearch/\\nenabled=0\\ngpgcheck=0\\n' > samples/internal.repo"
   },
   {
    "cmd": "printf '[main]\\ngpgcheck=1\\ninstallonly_limit=3\\nclean_requirements_on_remove=True\\nbest=True\\nskip_if_unavailable=False\\n' > samples/dnf.conf"
   },
   {
    "cmd": "printf '[repo-oss]\\nname=Main Repository\\nenabled=1\\nautorefresh=1\\nbaseurl=http://download.example.org/distribution/leap/15.6/repo/oss/\\ntype=rpm-md\\nkeeppackages=0\\n' > samples/zypp-oss.repo"
   },
   {
    "text": "Validation check: Run ls rpms samples and confirm the three .rpm files and four sample files exist. Run rpm --version and rpm2cpio --help to confirm the tools installed. If a lab goes wrong, rerun Step 4, and to reset the sandbox run sudo rm -rf ~/lpic1-section21/fakeroot ~/lpic1-section21/rpmdb and then Step 2."
   }
  ],
  "commands": [
   "rpm -i",
   "-ivh",
   "-U",
   "-Uvh",
   "-F",
   "-e",
   "-V",
   "-K (--checksig)",
   "--import",
   "--test",
   "--nodeps",
   "--root",
   "--dbpath",
   "--initdb",
   "-q",
   "-qa",
   "-qi",
   "-ql",
   "-qc",
   "-qd",
   "-qf",
   "-qR",
   "-qp",
   "--provides",
   "--whatprovides",
   "--scripts",
   "--qf",
   "rpm2cpio",
   "cpio -idmv",
   "cpio -t",
   "yum install",
   "update",
   "remove",
   "erase",
   "list",
   "list installed",
   "info",
   "search",
   "provides",
   "deplist",
   "clean all",
   "check-update",
   "repolist",
   "-y",
   "yumdownloader",
   "dnf",
   "zypper refresh",
   "install",
   "update",
   "remove",
   "search -i",
   "info",
   "what-provides",
   "list-updates",
   "verify",
   "repos",
   "/etc/yum.conf",
   "/etc/yum.repos.d",
   "/etc/dnf/dnf.conf",
   "/etc/zypp/zypp.conf",
   "/etc/zypp/repos.d"
  ],
  "memoryHook": "rpm verbs are single letters: i installs, U upgrades or installs, F upgrades only what is already there, e erases, V verifies, and q asks questions. Add p to ask the package file instead of the database, and add f to ask which package owns a file. yum, dnf, and zypper are the shoppers that fetch from repositories and solve dependencies; rpm is the installer that only does what it is told.",
  "reference": [
   {
    "title": "Command Comparison: yum, dnf, and zypper (read and explain)",
    "paragraphs": [
     "Refresh repository data: yum makecache and dnf makecache build the metadata cache, though both also refresh it automatically when it expires. zypper refresh (zypper ref) is the SUSE step, and you usually run it before installing.",
     "Install and remove: yum install NAME, dnf install NAME, and zypper install NAME (zypper in). Add -y to yum and dnf to skip the question; zypper uses zypper -n install for non-interactive use. yum remove, dnf remove, and zypper remove (zypper rm) uninstall a package; yum erase is the older spelling of yum remove.",
     "Update: yum update NAME, dnf upgrade NAME (dnf update also works), and zypper update NAME (zypper up). Leave out the name to update everything. yum check-update, dnf check-update, and zypper list-updates (zypper lu) only list what is pending.",
     "Find information: yum list NAME and dnf list NAME show whether a package is installed or available, and yum list installed lists everything installed. zypper search -i NAME (zypper se -i) shows installed matches, marked i or i+. yum info, dnf info, and zypper info show details. yum search, dnf search, and zypper search take a keyword or pattern, so a short word returns a long list.",
     "Files and dependencies: yum provides /usr/bin/top, dnf provides /usr/bin/top, and zypper what-provides top (newer zypper prefers zypper search --provides) name the package that supplies a file. yum deplist NAME and dnf repoquery --requires NAME list dependencies. zypper verify checks that the dependencies of all installed packages are satisfied.",
     "Cache, downloads, and repositories: yum clean all and dnf clean all empty the cache, and zypper clean does the same. yumdownloader NAME (from yum-utils) and dnf download NAME save the .rpm to the current folder without installing it. yum repolist, dnf repolist, and zypper repos (zypper lr) list repositories. Configuration lives in /etc/yum.conf and /etc/yum.repos.d for yum, /etc/dnf/dnf.conf and /etc/yum.repos.d for dnf, and /etc/zypp/zypp.conf and /etc/zypp/repos.d for zypper."
    ],
    "bullets": []
   }
  ]
 },
 "lessons": [
  {
   "id": "21.1",
   "kind": "vm",
   "title": "Confirm what RPM tooling this host has",
   "navSubtitle": "rpm --version, rpm -qa",
   "objective": "102.5",
   "difficulty": "Beginner",
   "source": "Lab 1: Confirm what RPM tooling this host has",
   "workdir": "~/lpic1-section21",
   "summary": "",
   "scenario": "A vendor sent install steps written for Red Hat. Before replying, you check which RPM tools exist on your Mint workstation and whether it has an RPM database.",
   "task": "Check each RPM-family tool, record the rpm version, and count installed RPM packages.",
   "deliverable": "reports/rpm-tools.txt.",
   "steps": [
    {
     "text": "for t in rpm rpm2cpio cpio yum dnf zypper yumdownloader; do printf '%s: ' $t; command -v $t || echo missing; done > reports/rpm-tools.txt"
    },
    {
     "text": "rpm --version >> reports/rpm-tools.txt"
    },
    {
     "cmd": "echo \"rpm packages installed: $(rpm -qa 2>/dev/null | wc -l)\" >> reports/rpm-tools.txt"
    },
    {
     "cmd": "echo \"dpkg packages installed: $(dpkg -l | grep -c '^ii')\" >> reports/rpm-tools.txt"
    }
   ],
   "validation": "cat reports/rpm-tools.txt shows yum, dnf, zypper, and yumdownloader missing, an RPM version line, 0 rpm packages, and over a thousand dpkg packages.",
   "trap": "Installing the rpm package on Mint does not turn Mint into a Red Hat system. dpkg still owns every file, so installing an .rpm into / would put files on disk that dpkg knows nothing about.",
   "paste": {
    "command": "cat reports/rpm-tools.txt",
    "checks": [
     {
      "re": "^(yum|dnf|zypper|yumdownloader):\\s*missing",
      "say": "yum, dnf, zypper and yumdownloader are reported missing",
      "min": 4
     },
     {
      "re": "^RPM version \\d",
      "say": "rpm --version printed its version"
     },
     {
      "re": "^rpm packages installed: 0\\s*$",
      "say": "the RPM database holds 0 packages"
     },
     {
      "re": "^dpkg packages installed: \\d{4,}\\s*$",
      "say": "dpkg counts over a thousand packages"
     }
    ]
   },
   "quiz": [
    {
     "id": "owner",
     "prompt": "On Mint with the rpm package installed, which tool still owns the system's installed files?",
     "answer": "dpkg",
     "options": [
      {
       "value": "dpkg",
       "label": "dpkg"
      },
      {
       "value": "rpm",
       "label": "rpm"
      },
      {
       "value": "both",
       "label": "Both share them"
      }
     ],
     "explain": "Correct. rpm on Mint only gives you a tool to read and sandbox .rpm files."
    }
   ],
   "completion": "Confirm what RPM tooling this host has: done."
  },
  {
   "id": "21.2",
   "kind": "vm",
   "title": "Decode RPM file names",
   "navSubtitle": "RPM file names, --qf",
   "objective": "102.5",
   "difficulty": "Beginner",
   "source": "Lab 2: Decode RPM file names",
   "workdir": "~/lpic1-section21",
   "summary": "",
   "scenario": "The release team asks which of three downloaded files is a binary package, which runs on any CPU, and which is source code.",
   "task": "Read the file names, then pull the same fields out of the packages themselves.",
   "deliverable": "reports/rpm-names.txt.",
   "steps": [
    {
     "cmd": "ls rpms > reports/rpm-names.txt"
    },
    {
     "text": "rpm -qp --qf '%{NAME} | %{VERSION} | %{RELEASE} | %{ARCH}\\n' rpms/*.rpm >> reports/rpm-names.txt 2>/dev/null"
    }
   ],
   "validation": "cat reports/rpm-names.txt shows tree 1.6.0 release 10.el7 for x86_64, words 3.0 release 22.el7 for noarch, and a file ending in .src.rpm.",
   "trap": "The pattern is name-version-release.architecture.rpm. el7 in the release is a distribution tag meaning Red Hat Enterprise Linux 7. noarch runs on any CPU, and .src.rpm holds the source code and build instructions, not a program you can run.",
   "paste": {
    "command": "cat reports/rpm-names.txt",
    "checks": [
     {
      "re": "^tree \\| 1\\.6\\.0 \\| 10\\.el7 \\| x86_64\\s*$",
      "say": "tree is 1.6.0, release 10.el7, for x86_64"
     },
     {
      "re": "^words \\| 3\\.0 \\| 22\\.el7 \\| noarch\\s*$",
      "say": "words is 3.0, release 22.el7, noarch"
     },
     {
      "re": "\\.src\\.rpm\\s*$",
      "say": "the source package file is listed"
     }
    ]
   },
   "quiz": [
    {
     "id": "parts",
     "prompt": "In <code>tree-1.6.0-10.el7.x86_64.rpm</code>, what is <code>10.el7</code>?",
     "answer": "rel",
     "options": [
      {
       "value": "rel",
       "label": "The release, with a RHEL 7 distribution tag"
      },
      {
       "value": "ver",
       "label": "The upstream version"
      },
      {
       "value": "arch",
       "label": "The architecture"
      }
     ],
     "explain": "Correct. The pattern is name-version-release.arch.rpm."
    },
    {
     "id": "noarch",
     "prompt": "What does <code>noarch</code> mean in an RPM file name?",
     "answer": "any",
     "options": [
      {
       "value": "any",
       "label": "It runs on any CPU"
      },
      {
       "value": "src",
       "label": "It is source code"
      },
      {
       "value": "none",
       "label": "It has no files"
      }
     ],
     "explain": "Correct. Debian uses all for the same idea."
    }
   ],
   "completion": "Decode RPM file names: done."
  },
  {
   "id": "21.3",
   "kind": "vm",
   "title": "Review package metadata before approval",
   "navSubtitle": "rpm -qpi, -qpl, -qpR",
   "objective": "102.5",
   "difficulty": "Beginner",
   "source": "Lab 3: Review package metadata before approval",
   "workdir": "~/lpic1-section21",
   "summary": "",
   "scenario": "Change control asks for the description, size, dependencies, file list, and any install scripts of the tree package before anyone approves it for db01.",
   "task": "Query the package file directly without installing it.",
   "deliverable": "reports/tree-review.txt.",
   "steps": [
    {
     "text": "rpm -qpi rpms/tree-1.6.0-10.el7.x86_64.rpm > reports/tree-review.txt 2>/dev/null"
    },
    {
     "text": "rpm -qpl rpms/tree-1.6.0-10.el7.x86_64.rpm >> reports/tree-review.txt 2>/dev/null"
    },
    {
     "text": "rpm -qpR rpms/tree-1.6.0-10.el7.x86_64.rpm >> reports/tree-review.txt 2>/dev/null"
    },
    {
     "text": "rpm -qp --provides rpms/tree-1.6.0-10.el7.x86_64.rpm >> reports/tree-review.txt 2>/dev/null"
    },
    {
     "cmd": "echo \"scripts: $(rpm -qp --scripts rpms/tree-1.6.0-10.el7.x86_64.rpm 2>/dev/null | wc -l)\" >> reports/tree-review.txt"
    }
   ],
   "validation": "grep -E '^(Name|Version|Size)|/usr/bin/tree|libc.so.6|scripts:' reports/tree-review.txt shows the header fields, the program path, the libc dependency, and scripts: 0.",
   "trap": "Without p, rpm -qi, -ql, and -qR ask the installed database and fail for a file that is not installed. -qi does not show dependencies; use -qR. --scripts shows any pre-install and post-install scripts, which run as root during a real install.",
   "paste": {
    "command": "cat reports/tree-review.txt",
    "checks": [
     {
      "re": "^Name\\s*:\\s*tree\\s*$",
      "say": "rpm -qpi shows the header fields"
     },
     {
      "re": "^/usr/bin/tree\\s*$",
      "say": "rpm -qpl lists /usr/bin/tree"
     },
     {
      "re": "^libc\\.so\\.6",
      "say": "rpm -qpR lists the libc.so.6 dependency"
     },
     {
      "re": "^scripts: 0\\s*$",
      "say": "the package has no install scripts"
     }
    ]
   },
   "quiz": [
    {
     "id": "deps",
     "prompt": "Which command lists the dependencies of a package file?",
     "answer": "qpR",
     "options": [
      {
       "value": "qpR",
       "label": "<code>rpm -qpR file.rpm</code>"
      },
      {
       "value": "qpi",
       "label": "<code>rpm -qpi file.rpm</code>"
      },
      {
       "value": "qR",
       "label": "<code>rpm -qR file.rpm</code>"
      }
     ],
     "explain": "Correct. Without p, rpm asks the installed database instead of the file."
    },
    {
     "id": "scripts",
     "prompt": "Why check <code>--scripts</code> before approving a package?",
     "answer": "root",
     "options": [
      {
       "value": "root",
       "label": "Install scripts run as root during a real install"
      },
      {
       "value": "deps",
       "label": "It lists the dependencies"
      },
      {
       "value": "sig",
       "label": "It checks the signature"
      }
     ],
     "explain": "Correct. They can change anything on the system."
    }
   ],
   "completion": "Review package metadata before approval: done."
  },
  {
   "id": "21.4",
   "kind": "vm",
   "title": "Check package signatures and digests",
   "navSubtitle": "rpm -K, --import",
   "objective": "102.5",
   "difficulty": "Beginner",
   "source": "Lab 4: Check package signatures and digests",
   "workdir": "~/lpic1-section21",
   "summary": "",
   "scenario": "Security policy says no package is approved until its integrity is checked. You check all three downloads.",
   "task": "Check the digests and signatures, then explain the result.",
   "deliverable": "reports/signatures.txt.",
   "steps": [
    {
     "text": "rpm -K rpms/*.rpm > reports/signatures.txt 2>&1"
    },
    {
     "text": "rpm --checksig -v rpms/tree-1.6.0-10.el7.x86_64.rpm >> reports/signatures.txt 2>&1"
    },
    {
     "text": "Add a note with nano: the digests passed, and the signature shows NOKEY or NOT OK because the CentOS 7 signing key was never imported here. On a Red Hat system you would run sudo rpm --import /etc/pki/rpm-gpg/RPM-GPG-KEY-NAME first."
    }
   ],
   "validation": "grep -ci digest reports/signatures.txt is at least 1, and the note names rpm --import.",
   "trap": "A digest proves the file was not corrupted. A signature proves who built it, and needs the vendor's public key. yum and dnf check signatures automatically when gpgcheck=1.",
   "paste": {
    "command": "cat reports/signatures.txt",
    "checks": [
     {
      "re": "digest",
      "say": "rpm checked the digests"
     },
     {
      "re": "NOKEY|NOT OK",
      "say": "the signature check reports the missing key"
     },
     {
      "re": "rpm --import",
      "say": "your note names rpm --import"
     }
    ]
   },
   "quiz": [
    {
     "id": "dig",
     "prompt": "What does a passing digest prove, compared with a signature?",
     "answer": "dig",
     "options": [
      {
       "value": "dig",
       "label": "The file isn't corrupted; the signature proves who built it"
      },
      {
       "value": "same",
       "label": "Both prove the same thing"
      },
      {
       "value": "who",
       "label": "The digest proves who built it"
      }
     ],
     "explain": "Correct. Checking the signature needs the vendor's public key."
    },
    {
     "id": "imp",
     "prompt": "Which command adds a vendor's signing key to the RPM database?",
     "answer": "import",
     "options": [
      {
       "value": "import",
       "label": "<code>rpm --import KEYFILE</code>"
      },
      {
       "value": "K",
       "label": "<code>rpm -K KEYFILE</code>"
      },
      {
       "value": "i",
       "label": "<code>rpm -i KEYFILE</code>"
      }
     ],
     "explain": "Correct. yum and dnf use the key when gpgcheck=1."
    }
   ],
   "completion": "Check package signatures and digests: done."
  },
  {
   "id": "21.5",
   "kind": "vm",
   "title": "Pull files out of a package without installing it",
   "navSubtitle": "rpm2cpio, cpio -idmv",
   "objective": "102.5",
   "difficulty": "Intermediate",
   "source": "Lab 5: Pull files out of a package without installing it",
   "workdir": "~/lpic1-section21",
   "summary": "",
   "scenario": "A developer needs the word list from the words package and the tree program to test on a lab box, but nothing may be installed.",
   "task": "List the payload, extract all of tree and only the word list from words.",
   "deliverable": "Files under extract/ and reports/extract.txt.",
   "steps": [
    {
     "text": "rpm2cpio rpms/tree-1.6.0-10.el7.x86_64.rpm | cpio -t > reports/extract.txt"
    },
    {
     "cmd": "cd extract && rpm2cpio ../rpms/tree-1.6.0-10.el7.x86_64.rpm | cpio -idmv && cd .."
    },
    {
     "cmd": "cd extract && rpm2cpio ../rpms/words-3.0-22.el7.noarch.rpm | cpio -idmv './usr/share/dict/linux.words' && cd .."
    },
    {
     "text": "find extract -type f >> reports/extract.txt; extract/usr/bin/tree -L 2 extract >> reports/extract.txt"
    }
   ],
   "validation": "grep -E 'usr/bin/tree|linux.words' reports/extract.txt shows both files, and the tree output lists the usr folder inside extract.",
   "trap": "rpm2cpio writes a cpio archive to standard output, so it must be piped into cpio. -i extracts, -d creates directories, -m keeps file times, and -v lists names. Always cd into an empty folder first, or the files land relative to wherever you are.",
   "paste": {
    "command": "cat reports/extract.txt",
    "checks": [
     {
      "re": "^\\./usr/bin/tree\\s*$",
      "say": "cpio -t listed the payload"
     },
     {
      "re": "^extract/usr/bin/tree\\s*$",
      "say": "the tree program was extracted"
     },
     {
      "re": "^extract/usr/share/dict/linux\\.words\\s*$",
      "say": "the word list was extracted"
     },
     {
      "re": "^\\S+ usr\\s*$",
      "say": "the extracted tree program listed the usr folder"
     }
    ]
   },
   "quiz": [
    {
     "id": "pipe",
     "prompt": "How do you extract the files from an .rpm without installing it?",
     "answer": "pipe",
     "options": [
      {
       "value": "pipe",
       "label": "<code>rpm2cpio file.rpm | cpio -idmv</code>"
      },
      {
       "value": "x",
       "label": "<code>rpm -x file.rpm</code>"
      },
      {
       "value": "tar",
       "label": "<code>tar xf file.rpm</code>"
      }
     ],
     "explain": "Correct. rpm2cpio writes a cpio archive to standard output."
    },
    {
     "id": "d",
     "prompt": "In <code>cpio -idmv</code>, what does <code>d</code> do?",
     "answer": "dirs",
     "options": [
      {
       "value": "dirs",
       "label": "Creates directories as needed"
      },
      {
       "value": "del",
       "label": "Deletes the archive afterwards"
      },
      {
       "value": "dry",
       "label": "Does a dry run"
      }
     ],
     "explain": "Correct. i extracts, m keeps times, v lists names."
    }
   ],
   "completion": "Pull files out of a package without installing it: done."
  },
  {
   "id": "21.6",
   "kind": "vm",
   "title": "Test an install against an empty database",
   "navSubtitle": "--initdb, --test",
   "objective": "102.5",
   "difficulty": "Intermediate",
   "source": "Lab 6: Test an install against an empty database",
   "workdir": "~/lpic1-section21",
   "summary": "",
   "scenario": "A junior admin asks why rpm refuses a package that yum would install without complaint. You demonstrate with a test install that changes nothing.",
   "task": "Create a private RPM database and run a test install of tree against it.",
   "deliverable": "reports/dependency-test.txt.",
   "steps": [
    {
     "text": "rpm --dbpath ~/lpic1-section21/rpmdb --initdb"
    },
    {
     "text": "rpm --dbpath ~/lpic1-section21/rpmdb -ivh --test rpms/tree-1.6.0-10.el7.x86_64.rpm > reports/dependency-test.txt 2>&1"
    },
    {
     "text": "rpm --dbpath ~/lpic1-section21/rpmdb -qa >> reports/dependency-test.txt 2>&1; echo \"packages in private db: $(rpm --dbpath ~/lpic1-section21/rpmdb -qa | wc -l)\" >> reports/dependency-test.txt"
    }
   ],
   "validation": "grep -i 'Failed dependencies' reports/dependency-test.txt matches, and the last line reads packages in private db: 0.",
   "trap": "rpm checks dependencies but never fetches them, so an empty database means libc.so.6 is missing. yum and dnf would download the dependencies. --test only checks; it installs nothing.",
   "paste": {
    "command": "cat reports/dependency-test.txt",
    "checks": [
     {
      "re": "Failed dependencies",
      "say": "rpm reported Failed dependencies"
     },
     {
      "re": "libc\\.so\\.6\\S* is needed by tree-1\\.6\\.0-10\\.el7\\.x86_64",
      "say": "libc.so.6 is named as missing"
     },
     {
      "re": "^packages in private db: 0\\s*$",
      "say": "nothing was installed in the private database"
     }
    ]
   },
   "quiz": [
    {
     "id": "fetch",
     "prompt": "Why does yum install tree when rpm refuses it?",
     "answer": "fetch",
     "options": [
      {
       "value": "fetch",
       "label": "yum downloads and installs the missing dependencies; rpm only reports them"
      },
      {
       "value": "nodeps",
       "label": "yum ignores dependencies"
      },
      {
       "value": "root",
       "label": "yum runs as root and rpm does not"
      }
     ],
     "explain": "Correct. dnf and zypper do the same."
    },
    {
     "id": "test",
     "prompt": "What does <code>rpm -ivh --test</code> do?",
     "answer": "check",
     "options": [
      {
       "value": "check",
       "label": "Checks whether the install would work, without installing"
      },
      {
       "value": "verify",
       "label": "Verifies the installed files"
      },
      {
       "value": "sig",
       "label": "Tests the signature only"
      }
     ],
     "explain": "Correct. Nothing is written to the database."
    }
   ],
   "completion": "Test an install against an empty database: done."
  },
  {
   "id": "21.7",
   "kind": "vm",
   "title": "Install packages into a sandbox root",
   "navSubtitle": "rpm -ivh --root, --nodeps",
   "objective": "102.5",
   "difficulty": "Intermediate",
   "source": "Lab 7: Install packages into a sandbox root",
   "workdir": "~/lpic1-section21",
   "summary": "",
   "scenario": "You need real installed packages to practice queries on, without touching the Mint system. You install into a sandbox folder that rpm treats as its root directory.",
   "task": "Confirm the sandbox path, then install tree and words into it, skipping the dependency check.",
   "deliverable": "reports/sandbox-install.txt.",
   "steps": [
    {
     "text": "test -d ~/lpic1-section21/fakeroot && echo 'sandbox ready' || echo 'STOP: rerun Lab Setup Step 2'"
    },
    {
     "cmd": "sudo rpm -ivh --nodeps --root ~/lpic1-section21/fakeroot rpms/tree-1.6.0-10.el7.x86_64.rpm rpms/words-3.0-22.el7.noarch.rpm | tee reports/sandbox-install.txt"
    },
    {
     "cmd": "sudo rpm --root ~/lpic1-section21/fakeroot -qa >> reports/sandbox-install.txt"
    },
    {
     "cmd": "ls ~/lpic1-section21/fakeroot/usr/bin >> reports/sandbox-install.txt"
    }
   ],
   "validation": "grep -E '^(tree|words)-' reports/sandbox-install.txt shows both packages, and the ls line lists tree. which tree on the real system is unaffected.",
   "trap": "Always type the full --root path. Without it rpm installs into the real / and dpkg loses track of those files. --nodeps is needed here only because the sandbox has no libc package; on a real system it can leave software that will not run.",
   "paste": {
    "command": "cat reports/sandbox-install.txt",
    "checks": [
     {
      "re": "^\\s*\\d+:(tree|words)-",
      "say": "rpm -ivh installed both packages",
      "min": 2
     },
     {
      "re": "^tree-1\\.6\\.0-10\\.el7\\.x86_64\\s*$",
      "say": "rpm -qa in the sandbox lists tree"
     },
     {
      "re": "^words-3\\.0-22\\.el7\\.noarch\\s*$",
      "say": "rpm -qa in the sandbox lists words"
     },
     {
      "re": "^tree\\s*$",
      "say": "the sandbox's usr/bin holds tree"
     }
    ]
   },
   "quiz": [
    {
     "id": "root",
     "prompt": "What does <code>--root DIR</code> tell rpm?",
     "answer": "root",
     "options": [
      {
       "value": "root",
       "label": "Treat DIR as / for both the files and the database"
      },
      {
       "value": "user",
       "label": "Run as the root user"
      },
      {
       "value": "db",
       "label": "Only store the database in DIR"
      }
     ],
     "explain": "Correct. --dbpath moves only the database."
    },
    {
     "id": "nodeps",
     "prompt": "What is the risk of <code>--nodeps</code> on a real system?",
     "answer": "broken",
     "options": [
      {
       "value": "broken",
       "label": "Software installed without what it needs may not run"
      },
      {
       "value": "sig",
       "label": "It skips the signature check"
      },
      {
       "value": "none",
       "label": "There is none"
      }
     ],
     "explain": "Correct. Use it only when you know why the dependency check fails."
    }
   ],
   "completion": "Install packages into a sandbox root: done."
  },
  {
   "id": "21.8",
   "kind": "vm",
   "title": "Answer questions about installed packages",
   "navSubtitle": "rpm -q, -qi, -qf, -qd, -qc",
   "objective": "102.5",
   "difficulty": "Intermediate",
   "source": "Lab 8: Answer questions about installed packages",
   "workdir": "~/lpic1-section21",
   "summary": "",
   "scenario": "An auditor asks which package owns /usr/bin/tree, where its documentation is, whether it has config files, and what it needs to run.",
   "task": "Query the sandbox database the same way you would on a Red Hat server.",
   "deliverable": "reports/sandbox-queries.txt.",
   "steps": [
    {
     "cmd": "sudo rpm --root ~/lpic1-section21/fakeroot -q tree words > reports/sandbox-queries.txt"
    },
    {
     "cmd": "sudo rpm --root ~/lpic1-section21/fakeroot -qi tree >> reports/sandbox-queries.txt"
    },
    {
     "cmd": "sudo rpm --root ~/lpic1-section21/fakeroot -qf /usr/bin/tree >> reports/sandbox-queries.txt"
    },
    {
     "cmd": "sudo rpm --root ~/lpic1-section21/fakeroot -qd tree >> reports/sandbox-queries.txt; sudo rpm --root ~/lpic1-section21/fakeroot -qc tree >> reports/sandbox-queries.txt"
    },
    {
     "cmd": "sudo rpm --root ~/lpic1-section21/fakeroot -q --whatprovides /usr/share/dict/words >> reports/sandbox-queries.txt 2>&1; sudo rpm --root ~/lpic1-section21/fakeroot -q sl >> reports/sandbox-queries.txt 2>&1"
    }
   ],
   "validation": "cat reports/sandbox-queries.txt shows tree-1.6.0-10.el7.x86_64 as the owner of /usr/bin/tree, the doc file paths, words as the provider of the dictionary, and package sl is not installed.",
   "trap": "rpm -q answers with the full name-version-release.arch when a package is installed, and package NAME is not installed when it is not. -qf takes a file path; -ql takes a package name. -qc returns nothing for a package with no config files.",
   "paste": {
    "command": "cat reports/sandbox-queries.txt",
    "checks": [
     {
      "re": "^tree-1\\.6\\.0-10\\.el7\\.x86_64\\s*$",
      "say": "tree is installed and owns /usr/bin/tree",
      "min": 2
     },
     {
      "re": "^/usr/share/(doc|man)/\\S+",
      "say": "rpm -qd lists the documentation"
     },
     {
      "re": "^words-3\\.0-22\\.el7\\.noarch\\s*$",
      "say": "words is installed and provides the dictionary",
      "min": 2
     },
     {
      "re": "package sl is not installed",
      "say": "rpm -q sl says it is not installed"
     }
    ]
   },
   "quiz": [
    {
     "id": "qf",
     "prompt": "Which command names the package that owns <code>/usr/bin/tree</code>?",
     "answer": "qf",
     "options": [
      {
       "value": "qf",
       "label": "<code>rpm -qf /usr/bin/tree</code>"
      },
      {
       "value": "ql",
       "label": "<code>rpm -ql /usr/bin/tree</code>"
      },
      {
       "value": "qi",
       "label": "<code>rpm -qi /usr/bin/tree</code>"
      }
     ],
     "explain": "Correct. -ql goes the other way and takes a package name."
    },
    {
     "id": "qc",
     "prompt": "Which option lists only a package's configuration files?",
     "answer": "qc",
     "options": [
      {
       "value": "qc",
       "label": "<code>-qc</code>"
      },
      {
       "value": "qd",
       "label": "<code>-qd</code>"
      },
      {
       "value": "qa",
       "label": "<code>-qa</code>"
      }
     ],
     "explain": "Correct. -qd lists the documentation files."
    }
   ],
   "completion": "Answer questions about installed packages: done."
  },
  {
   "id": "21.9",
   "kind": "vm",
   "title": "Detect a changed file with rpm -V",
   "navSubtitle": "rpm -V",
   "objective": "102.5",
   "difficulty": "Intermediate",
   "source": "Lab 9: Detect a changed file with rpm -V",
   "workdir": "~/lpic1-section21",
   "summary": "",
   "scenario": "Someone appended an entry to the shared word list on a build server. You show how rpm proves the file no longer matches the package.",
   "task": "Verify the words package, change the file, and verify again.",
   "deliverable": "reports/verify.txt.",
   "steps": [
    {
     "cmd": "sudo rpm --root ~/lpic1-section21/fakeroot -V words > reports/verify.txt; echo \"first verify exit $?\" >> reports/verify.txt"
    },
    {
     "cmd": "echo 'web01' | sudo tee -a ~/lpic1-section21/fakeroot/usr/share/dict/linux.words"
    },
    {
     "cmd": "sudo rpm --root ~/lpic1-section21/fakeroot -V words >> reports/verify.txt; echo \"second verify exit $?\" >> reports/verify.txt"
    }
   ],
   "validation": "cat reports/verify.txt shows exit 0 for the first check, then a line like S.5....T. /usr/share/dict/linux.words and a non-zero exit.",
   "trap": "Each dot is a test that passed. S is size, 5 is the checksum, T is the modification time, M is mode, U and G are owner and group, and a c before the path marks a config file. No output means nothing changed.",
   "paste": {
    "command": "cat reports/verify.txt",
    "checks": [
     {
      "re": "^first verify exit 0\\s*$",
      "say": "the first verify found nothing"
     },
     {
      "re": "^S\\.5\\S*\\s+/usr/share/dict/linux\\.words\\s*$",
      "say": "rpm -V shows size and checksum changes on linux.words"
     },
     {
      "re": "^second verify exit [1-9]",
      "say": "the second verify returned non-zero"
     }
    ]
   },
   "quiz": [
    {
     "id": "S5T",
     "prompt": "What does <code>S.5....T.</code> in front of a file mean?",
     "answer": "s5t",
     "options": [
      {
       "value": "s5t",
       "label": "Its size, checksum and modification time changed"
      },
      {
       "value": "sym",
       "label": "A symlink changed"
      },
      {
       "value": "ok",
       "label": "The file passed every test"
      }
     ],
     "explain": "Correct. Each dot is a test that passed."
    },
    {
     "id": "none",
     "prompt": "<code>rpm -V words</code> prints nothing. What does that mean?",
     "answer": "ok",
     "options": [
      {
       "value": "ok",
       "label": "Every file matches the database"
      },
      {
       "value": "missing",
       "label": "words is not installed"
      },
      {
       "value": "err",
       "label": "The database is damaged"
      }
     ],
     "explain": "Correct. A missing package prints package words is not installed."
    }
   ],
   "completion": "Detect a changed file with rpm -V: done."
  },
  {
   "id": "21.10",
   "kind": "vm",
   "title": "Erase, freshen, and upgrade",
   "navSubtitle": "rpm -e, -F, -U",
   "objective": "102.5",
   "difficulty": "Advanced",
   "source": "Lab 10: Erase, freshen, and upgrade",
   "workdir": "~/lpic1-section21",
   "summary": "",
   "scenario": "A runbook says to use rpm -F for patching so new packages never sneak onto servers. You prove the difference between -F and -U.",
   "task": "Erase words, try to freshen it, then upgrade it.",
   "deliverable": "reports/upgrade-modes.txt.",
   "steps": [
    {
     "cmd": "sudo rpm --root ~/lpic1-section21/fakeroot -e words; sudo rpm --root ~/lpic1-section21/fakeroot -q words > reports/upgrade-modes.txt 2>&1"
    },
    {
     "cmd": "sudo rpm --root ~/lpic1-section21/fakeroot -Fvh --nodeps rpms/words-3.0-22.el7.noarch.rpm >> reports/upgrade-modes.txt 2>&1; sudo rpm --root ~/lpic1-section21/fakeroot -q words >> reports/upgrade-modes.txt 2>&1"
    },
    {
     "cmd": "sudo rpm --root ~/lpic1-section21/fakeroot -Uvh --nodeps rpms/words-3.0-22.el7.noarch.rpm >> reports/upgrade-modes.txt 2>&1; sudo rpm --root ~/lpic1-section21/fakeroot -q words >> reports/upgrade-modes.txt 2>&1"
    },
    {
     "cmd": "sudo rpm --root ~/lpic1-section21/fakeroot -Uvh --nodeps rpms/words-3.0-22.el7.noarch.rpm >> reports/upgrade-modes.txt 2>&1"
    }
   ],
   "validation": "cat reports/upgrade-modes.txt shows not installed twice (after the erase and after the freshen), then words-3.0-22.el7.noarch, then a message that the package is already installed.",
   "trap": "-U installs the package if it is missing and upgrades it if it is older. -F only upgrades packages that are already installed. -i refuses to replace an installed package. -e takes the package name, not the file name.",
   "paste": {
    "command": "cat reports/upgrade-modes.txt",
    "checks": [
     {
      "re": "package words is not installed",
      "say": "words is not installed after the erase and after the freshen",
      "count": 2
     },
     {
      "re": "^words-3\\.0-22\\.el7\\.noarch\\s*$",
      "say": "-U installed words"
     },
     {
      "re": "is already installed",
      "say": "the second -U reports it is already installed"
     }
    ]
   },
   "quiz": [
    {
     "id": "F",
     "prompt": "Which option upgrades only packages that are already installed?",
     "answer": "F",
     "options": [
      {
       "value": "F",
       "label": "<code>-F</code>"
      },
      {
       "value": "U",
       "label": "<code>-U</code>"
      },
      {
       "value": "i",
       "label": "<code>-i</code>"
      }
     ],
     "explain": "Correct. -U also installs packages that are missing."
    },
    {
     "id": "e",
     "prompt": "Which command erases the words package?",
     "answer": "name",
     "options": [
      {
       "value": "name",
       "label": "<code>rpm -e words</code>"
      },
      {
       "value": "file",
       "label": "<code>rpm -e words-3.0-22.el7.noarch.rpm</code>"
      },
      {
       "value": "r",
       "label": "<code>rpm -r words</code>"
      }
     ],
     "explain": "Correct. Erase takes the package name, not the file name."
    }
   ],
   "completion": "Erase, freshen, and upgrade: done."
  },
  {
   "id": "21.11",
   "kind": "vm",
   "title": "Look inside a source package",
   "navSubtitle": "Source RPMs, .spec",
   "objective": "102.5",
   "difficulty": "Advanced",
   "source": "Lab 11: Look inside a source package",
   "workdir": "~/lpic1-section21",
   "summary": "",
   "scenario": "A developer wants to rebuild tree with a patch and asks what the source package contains and which version it builds.",
   "task": "List the source package and extract its spec file.",
   "deliverable": "reports/srpm.txt.",
   "steps": [
    {
     "text": "rpm -qpl rpms/tree-1.6.0-10.el7.src.rpm > reports/srpm.txt 2>/dev/null"
    },
    {
     "cmd": "mkdir -p extract/src && cd extract/src && rpm2cpio ../../rpms/tree-1.6.0-10.el7.src.rpm | cpio -idmv && cd ../.."
    },
    {
     "cmd": "grep -E '^(Name|Version|Release|Source)' extract/src/tree.spec >> reports/srpm.txt"
    }
   ],
   "validation": "cat reports/srpm.txt lists a .tgz source archive and tree.spec, followed by the Name, Version, and Release lines from the spec.",
   "trap": "A source RPM holds the original source archive, any patches, and the spec file of build instructions. Building it needs rpmbuild and the build dependencies, which belongs on a build server, not your VM.",
   "paste": {
    "command": "cat reports/srpm.txt",
    "checks": [
     {
      "re": "^\\S+\\.tgz\\s*$",
      "say": "the source package holds a .tgz archive"
     },
     {
      "re": "^tree\\.spec\\s*$",
      "say": "the source package holds tree.spec"
     },
     {
      "re": "^Name:\\s*tree\\s*$",
      "say": "the spec's Name line is included"
     },
     {
      "re": "^Version:\\s*1\\.6\\.0\\s*$",
      "say": "the spec's Version line is included"
     }
    ]
   },
   "quiz": [
    {
     "id": "srpm",
     "prompt": "What does a .src.rpm contain?",
     "answer": "src",
     "options": [
      {
       "value": "src",
       "label": "The source archive, patches and a spec file"
      },
      {
       "value": "bin",
       "label": "A compiled program for any CPU"
      },
      {
       "value": "debug",
       "label": "Debug symbols"
      }
     ],
     "explain": "Correct. rpmbuild turns it into binary packages."
    }
   ],
   "completion": "Look inside a source package: done."
  },
  {
   "id": "21.12",
   "kind": "vm",
   "title": "Review yum and dnf repository settings",
   "navSubtitle": "yum.conf, .repo files",
   "objective": "102.5",
   "difficulty": "Advanced",
   "source": "Lab 12: Review yum and dnf repository settings",
   "workdir": "~/lpic1-section21",
   "summary": "",
   "scenario": "A new RHEL server, db01, is pulling packages from an unexpected repository. You review its configuration files before the call with the vendor.",
   "task": "Find which repositories are enabled, which check signatures, and whether yum will ask before installing.",
   "deliverable": "reports/repo-review.txt.",
   "steps": [
    {
     "cmd": "grep -E '^(gpgcheck|keepcache|cachedir|installonly_limit)|assumeyes' samples/yum.conf > reports/repo-review.txt"
    },
    {
     "cmd": "grep -E '^\\[|^(enabled|gpgcheck|baseurl)' samples/internal.repo >> reports/repo-review.txt"
    },
    {
     "cmd": "grep -E '^(gpgcheck|clean_requirements_on_remove)' samples/dnf.conf >> reports/repo-review.txt"
    },
    {
     "text": "Add three sentences with nano: which repository is active, which one is risky and why, and why yum will still prompt before installing."
    }
   ],
   "validation": "grep -c enabled reports/repo-review.txt is 2, and the file shows internal-testing with enabled=0 and gpgcheck=0.",
   "trap": "Main settings live in /etc/yum.conf (or /etc/dnf/dnf.conf); repositories live in .repo files in /etc/yum.repos.d. assumeyes=1 is commented out, so yum asks unless you add -y. A repo section can override the main gpgcheck setting.",
   "paste": {
    "command": "cat reports/repo-review.txt",
    "checks": [
     {
      "re": "^enabled=[01]\\s*$",
      "say": "both enabled lines are listed",
      "count": 2
     },
     {
      "re": "^enabled=0\\s*$",
      "say": "internal-testing has enabled=0"
     },
     {
      "re": "^gpgcheck=0\\s*$",
      "say": "internal-testing has gpgcheck=0"
     },
     {
      "re": "risk",
      "say": "your sentences name the risky repository"
     }
    ]
   },
   "quiz": [
    {
     "id": "repos",
     "prompt": "Where do yum repository definitions go?",
     "answer": "reposd",
     "options": [
      {
       "value": "reposd",
       "label": "<code>.repo</code> files in <code>/etc/yum.repos.d</code>"
      },
      {
       "value": "conf",
       "label": "Only <code>/etc/yum.conf</code>"
      },
      {
       "value": "sources",
       "label": "<code>/etc/yum/sources.list</code>"
      }
     ],
     "explain": "Correct. /etc/yum.conf holds the main settings."
    },
    {
     "id": "gpg",
     "prompt": "Main <code>gpgcheck=1</code>, but a repo section says <code>gpgcheck=0</code>. What applies to that repo?",
     "answer": "zero",
     "options": [
      {
       "value": "zero",
       "label": "gpgcheck=0: the repo setting overrides the main one"
      },
      {
       "value": "one",
       "label": "gpgcheck=1: the main setting always wins"
      },
      {
       "value": "err",
       "label": "yum refuses to start"
      }
     ],
     "explain": "Correct. That is why the testing repo is risky."
    }
   ],
   "completion": "Review yum and dnf repository settings: done."
  },
  {
   "id": "21.13",
   "kind": "vm",
   "title": "Write a yum, dnf, and zypper runbook",
   "navSubtitle": "yum, dnf, zypper runbook",
   "objective": "102.5",
   "difficulty": "Advanced",
   "source": "Lab 13: Write a yum, dnf, and zypper runbook",
   "workdir": "~/lpic1-section21",
   "summary": "",
   "scenario": "Your team supports Red Hat, Fedora, and SUSE servers. The on-call lead wants a one-page runbook that turns common requests into the right commands for each tool.",
   "task": "Write the runbook from the Command Comparison section, then clean up the sandbox.",
   "deliverable": "reports/rpm-family-runbook.txt.",
   "steps": [
    {
     "text": "nano reports/rpm-family-runbook.txt"
    },
    {
     "text": "Write one line per request, giving the yum, dnf, and zypper commands: refresh the repository data, install iotop, update one package, update everything, remove a package, check whether a package is installed, show package details, find the package that provides /usr/bin/top, list dependencies, search by keyword, list available updates, clear the cache, download a package file without installing it, and list repositories. Read only, Don't run on your VM."
    },
    {
     "cmd": "grep -v '^#' samples/zypp-oss.repo >> reports/rpm-family-runbook.txt"
    },
    {
     "text": "When finished with the section: sudo rm -rf ~/lpic1-section21/fakeroot ~/lpic1-section21/rpmdb"
    }
   ],
   "validation": "grep -c yum reports/rpm-family-runbook.txt, grep -c dnf, and grep -c zypper are each at least 10, and grep yumdownloader reports/rpm-family-runbook.txt matches.",
   "trap": "zypper calls a repository update a refresh. yum and dnf refresh their metadata automatically when it expires. yumdownloader comes from the yum-utils package; with dnf the same job is dnf download.",
   "paste": {
    "command": "cat reports/rpm-family-runbook.txt",
    "checks": [
     {
      "re": "yum",
      "say": "yum appears at least 10 times",
      "min": 10
     },
     {
      "re": "dnf",
      "say": "dnf appears at least 10 times",
      "min": 10
     },
     {
      "re": "zypper",
      "say": "zypper appears at least 10 times",
      "min": 10
     },
     {
      "re": "yumdownloader",
      "say": "the download line names yumdownloader"
     }
    ]
   },
   "quiz": [
    {
     "id": "ref",
     "prompt": "Which command refreshes the repository data on SUSE?",
     "answer": "ref",
     "options": [
      {
       "value": "ref",
       "label": "<code>zypper refresh</code>"
      },
      {
       "value": "up",
       "label": "<code>zypper update</code>"
      },
      {
       "value": "mk",
       "label": "<code>zypper makecache</code>"
      }
     ],
     "explain": "Correct. zypper update installs newer packages."
    },
    {
     "id": "dl",
     "prompt": "Which dnf command saves a package file without installing it?",
     "answer": "dl",
     "options": [
      {
       "value": "dl",
       "label": "<code>dnf download NAME</code>"
      },
      {
       "value": "get",
       "label": "<code>dnf get NAME</code>"
      },
      {
       "value": "fetch",
       "label": "<code>dnf fetch NAME</code>"
      }
     ],
     "explain": "Correct. With yum the tool is yumdownloader, from yum-utils."
    }
   ],
   "completion": "Write a yum, dnf, and zypper runbook: done."
  }
 ],
 "review": {
  "traps": [
   "Forgetting p when querying a package file. rpm -qpi file.rpm reads the file; rpm -qi name reads the installed database.",
   "Expecting rpm -qi to show dependencies. Use rpm -qR (or rpm -qpR for a file).",
   "Mixing up -i, -U, and -F. -U installs or upgrades, -F only upgrades what is installed, and -i refuses to replace an installed package.",
   "Using a file name with rpm -e. Erase takes the package name.",
   "Confusing -qf with -ql. -qf finds the package that owns a file; -ql lists a package's files.",
   "Expecting rpm to fetch dependencies. rpm only reports Failed dependencies; yum, dnf, and zypper download them.",
   "Misreading rpm -V output. No output means everything matches; S, 5, and T mean size, checksum, and time changed, and c marks a config file.",
   "Forgetting that rpm2cpio needs a pipe to cpio -idmv to extract files.",
   "Misreading RPM file names. name-version-release.arch.rpm, where el7 is a distribution tag, noarch runs on any CPU, and src.rpm is source.",
   "Assuming yum needs a manual update step before installing. yum and dnf refresh metadata automatically; zypper refresh is the explicit SUSE step.",
   "Forgetting yum's file locations. Main settings are in /etc/yum.conf and repositories are in /etc/yum.repos.d/*.repo.",
   "Mixing up yum provides and yum deplist. provides finds which package owns a file; deplist lists a package's dependencies.",
   "Forgetting where yumdownloader comes from. It is in yum-utils, and dnf download does the same job.",
   "Thinking zypper is only for .deb files. SUSE uses RPM packages; zypper is its high-level tool, like yum."
  ],
  "trapQuiz": [
   {
    "id": "tq1",
    "prompt": "Which command shows the details of a package file that is not installed?",
    "answer": "qpi",
    "options": [
     {
      "value": "qpi",
      "label": "<code>rpm -qpi file.rpm</code>"
     },
     {
      "value": "qi",
      "label": "<code>rpm -qi file.rpm</code>"
     },
     {
      "value": "qf",
      "label": "<code>rpm -qf file.rpm</code>"
     }
    ],
    "explain": "Correct. The p makes rpm read the file."
   },
   {
    "id": "tq2",
    "prompt": "words is installed. Which command replaces it with a newer package file?",
    "answer": "U",
    "options": [
     {
      "value": "U",
      "label": "<code>rpm -Uvh</code>"
     },
     {
      "value": "i",
      "label": "<code>rpm -ivh</code>"
     },
     {
      "value": "e",
      "label": "<code>rpm -e</code>"
     }
    ],
    "explain": "Correct. -i refuses to replace an installed package."
   },
   {
    "id": "tq3",
    "prompt": "Which command finds the package that owns <code>/etc/yum.conf</code>?",
    "answer": "qf",
    "options": [
     {
      "value": "qf",
      "label": "<code>rpm -qf /etc/yum.conf</code>"
     },
     {
      "value": "ql",
      "label": "<code>rpm -ql /etc/yum.conf</code>"
     },
     {
      "value": "qc",
      "label": "<code>rpm -qc /etc/yum.conf</code>"
     }
    ],
    "explain": "Correct. -ql and -qc take a package name."
   },
   {
    "id": "tq4",
    "prompt": "rpm reports <em>Failed dependencies</em>. What does rpm do next?",
    "answer": "stop",
    "options": [
     {
      "value": "stop",
      "label": "Nothing; it stops and installs nothing"
     },
     {
      "value": "fetch",
      "label": "Downloads the dependencies"
     },
     {
      "value": "partial",
      "label": "Installs the package without them"
     }
    ],
    "explain": "Correct. yum, dnf and zypper fetch dependencies."
   },
   {
    "id": "tq5",
    "prompt": "Which yum command names the package that provides <code>/usr/bin/top</code>?",
    "answer": "prov",
    "options": [
     {
      "value": "prov",
      "label": "<code>yum provides /usr/bin/top</code>"
     },
     {
      "value": "dep",
      "label": "<code>yum deplist /usr/bin/top</code>"
     },
     {
      "value": "search",
      "label": "<code>yum info /usr/bin/top</code>"
     }
    ],
    "explain": "Correct. deplist lists a package's dependencies."
   },
   {
    "id": "tq6",
    "prompt": "Which command is the SUSE step to refresh repository data before installing?",
    "answer": "zref",
    "options": [
     {
      "value": "zref",
      "label": "<code>zypper refresh</code>"
     },
     {
      "value": "yupd",
      "label": "<code>yum update</code>"
     },
     {
      "value": "zup",
      "label": "<code>zypper update</code>"
     }
    ],
    "explain": "Correct. yum and dnf refresh expired metadata on their own."
   },
   {
    "id": "tq7",
    "prompt": "Which package provides <code>yumdownloader</code>?",
    "answer": "utils",
    "options": [
     {
      "value": "utils",
      "label": "yum-utils"
     },
     {
      "value": "yum",
      "label": "yum itself"
     },
     {
      "value": "rpm",
      "label": "rpm-build"
     }
    ],
    "explain": "Correct. With dnf, use dnf download."
   },
   {
    "id": "tq8",
    "prompt": "What package format does zypper install on SUSE?",
    "answer": "rpm",
    "options": [
     {
      "value": "rpm",
      "label": ".rpm"
     },
     {
      "value": "deb",
      "label": ".deb"
     },
     {
      "value": "both",
      "label": "Either"
     }
    ],
    "explain": "Correct. zypper is SUSE's high-level RPM tool, like yum."
   }
  ],
  "challenge": {
   "intro": "Complete these tasks without notes. Use only your Linux Mint VM and the files in ~/lpic1-section21. Reset the sandbox first with sudo rm -rf ~/lpic1-section21/fakeroot ~/lpic1-section21/rpmdb, then rerun Step 2 of the Lab Setup.",
   "tasks": [
    "Report the name, version, release, and architecture of each downloaded .rpm file, and say which one is source code.",
    "List the dependencies and the files of the tree package file without installing it.",
    "Check the integrity of all three package files and explain any signature warning.",
    "Extract only /usr/bin/tree from its package into an empty folder and run it.",
    "Show that rpm refuses to install tree into an empty database, and explain why yum would not.",
    "Install tree and words into the sandbox root and prove which package owns /usr/share/dict/linux.words.",
    "Change a file from the words package in the sandbox and prove the change with rpm -V.",
    "Write the yum, dnf, and zypper commands to install iotop, find what provides /usr/bin/top, and clean the cache."
   ],
   "outro": "Your final handoff is the reports directory. For each file, write a short sentence explaining what it proves, then delete the sandbox and confirm rpm -qa still shows no packages on the real system."
  },
  "questions": [
   {
    "q": "Change control request: “Before we approve this .rpm for db01, list every file it installs and every dependency it needs.”",
    "a": "<code>rpm -qpl FILE.rpm</code> lists every file and <code>rpm -qpR FILE.rpm</code> lists every dependency. Both read the file, so nothing is installed."
   },
   {
    "q": "Developer request: “I need one file out of this RPM, but nothing may be installed. How do you get it?”",
    "a": "Extract it in an empty folder: <code>mkdir out; cd out</code>, then <code>rpm2cpio ../FILE.rpm | cpio -idmv './path/to/file'</code>. Nothing touches the RPM database."
   },
   {
    "q": "Security request: “Someone may have changed files from the words package. Prove which files no longer match.”",
    "a": "<code>rpm -V words</code>. Only changed files are listed, with codes such as <code>S.5....T.</code> (size, checksum, time); no output means every file matches."
   },
   {
    "q": "Auditor request: “Which package installed /usr/bin/tree on this RHEL host?”",
    "a": "<code>rpm -qf /usr/bin/tree</code>. It prints the full name, for example <code>tree-1.6.0-10.el7.x86_64</code>."
   },
   {
    "q": "Patching request: “Update only the packages already on the server from this folder of RPMs. Do not add anything new.”",
    "a": "<code>sudo rpm -Fvh *.rpm</code> in that folder. -F (freshen) upgrades only packages already installed and skips the rest; -U would also install the new ones."
   },
   {
    "q": "On-call request: “Download the iotop package file to this RHEL 7 server without installing it, so we can copy it to an offline host.”",
    "a": "<code>yumdownloader iotop</code> (from yum-utils) saves the .rpm in the current folder. <code>yum install --downloadonly --downloaddir=. iotop</code> also works."
   },
   {
    "q": "SUSE team request: “Refresh the repositories, install iotop, and show me that it is installed, using zypper.”",
    "a": "<code>sudo zypper refresh</code>, <code>sudo zypper install iotop</code>, then <code>zypper search -i iotop</code> (shows it marked <code>i</code>) or <code>rpm -q iotop</code>."
   }
  ],
  "mastery": [
   "I can decode an RPM file name, including the release, distribution tag, architecture, noarch, and src.rpm.",
   "I can query a package file with rpm -qpi, -qpl, -qpR, --provides, and --scripts.",
   "I can check digests and signatures with rpm -K and explain rpm --import.",
   "I can extract a package with rpm2cpio and cpio -idmv without installing it.",
   "I can explain why rpm reports Failed dependencies and what --nodeps and --test do.",
   "I can install, upgrade, freshen, and erase with rpm -ivh, -Uvh, -Fvh, and -e, and explain the difference.",
   "I can query installed packages with rpm -q, -qa, -qi, -ql, -qc, -qd, -qf, and --whatprovides.",
   "I can verify installed files with rpm -V and read its output codes.",
   "I can explain /etc/yum.conf, /etc/yum.repos.d, gpgcheck, enabled, and assumeyes.",
   "I can give the yum and dnf commands to install, update, remove, list, search, show info, find providers, list dependencies, and clean the cache.",
   "I can download a package without installing it with yumdownloader or dnf download.",
   "I can give the zypper commands to refresh, install, search installed packages, show info, find providers, list updates, verify, and remove."
  ]
 }
});
