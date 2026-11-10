/* Section 22: Shared Libraries. Generated from LPIC_Section22_Lab_Workbook.docx by vm_section.py;
   paste checks, quizzes and model answers were added for the app. */
LPIC.section({
 "id": "section-22",
 "number": 22,
 "title": "Shared Libraries",
 "objectives": [
  "102.3"
 ],
 "kind": "vm",
 "source": "LPIC_Section22_Lab_Workbook.docx",
 "scenario": "Objective 102.3: Manage shared libraries by tracing what a program needs, reading the loader's search configuration, and fixing \"cannot open shared object file\" errors on a practice library you build yourself.",
 "overview": {
  "paragraphs": [
   "Treat each lab like a ticket. Programs on Linux rarely carry all their own code; they borrow it from shared libraries at run time. When a library is missing or the loader cannot find it, the program will not start at all. Your job in these labs is to find out what a program needs, where the loader looks, and how to point it at the right place, then prove the fix from the command line.",
   "Use a Linux Mint VM. Reading system libraries is always safe. The only lab that changes system configuration (Lab 10) adds one small file under /etc/ld.so.conf.d and then removes it, and it rebuilds the cache both times so the system ends where it started. Never delete, move, or rename anything under /lib, /usr/lib, or /lib64; a missing libc stops almost every command on the system.",
   "Several labs build a tiny practice library called libgreet so you can break and fix library loading without touching anything the system depends on. You do not need to know C. Copy the commands exactly."
  ],
  "setup": [
   {
    "text": "Step 1: Confirm the library tools are present. They come with every Mint install:"
   },
   {
    "cmd": "command -v ldd ldconfig"
   },
   {
    "cmd": "You should see two paths, such as /usr/bin/ldd and /usr/sbin/ldconfig."
   },
   {
    "text": "Step 2: Install the compiler toolchain. Mint does not install it by default, and the build labs need gcc, ar, objdump, readelf, and the static C library:"
   },
   {
    "cmd": "sudo apt install build-essential"
   },
   {
    "cmd": "gcc --version | head -1"
   },
   {
    "text": "Step 3: Create the practice workspace:"
   },
   {
    "cmd": "mkdir -p ~/lpic1-section22/{src,lib,bin,reports}"
   },
   {
    "cmd": "cd ~/lpic1-section22"
   },
   {
    "text": "Step 4: Create the sample source files for the practice library and the program that uses it:"
   },
   {
    "cmd": "printf '%s\\n' '#include <stdio.h>' 'void greet(const char *host) { printf(\"libgreet says hello to %s\\n\", host); }' > src/greet.c"
   },
   {
    "cmd": "printf '%s\\n' 'void greet(const char *host);' 'int main(void) { greet(\"web01\"); return 0; }' > src/app.c"
   },
   {
    "text": "Validation check: Run ls -R and cat src/greet.c src/app.c. You should see two short C files and empty lib, bin, and reports folders. To reset at any point, run rm -f lib/* bin/* src/*.o and then repeat Step 4."
   }
  ],
  "commands": [
   "ldd",
   "ldd on an absolute path from which",
   "ldconfig",
   "ldconfig -p",
   "ldconfig -v",
   "ldconfig -N",
   "ldconfig -X",
   "ldconfig -n",
   "/etc/ld.so.conf",
   "the include line",
   "/etc/ld.so.conf.d/*.conf",
   "/etc/ld.so.cache",
   "LD_LIBRARY_PATH",
   "export LD_LIBRARY_PATH",
   "unset",
   "/lib",
   "/lib64",
   "/usr/lib",
   "/usr/lib/x86_64-linux-gnu",
   "/lib64/ld-linux-x86-64.so.2 (the dynamic linker/loader",
   "ld.so)",
   "objdump -p",
   "readelf -d",
   "file",
   "ar",
   "gcc -shared",
   "gcc -static",
   "the name forms lib<name>.so.<version>",
   "lib<name>.so",
   "lib<name>.a"
  ],
  "memoryHook": "Think of a library as having three names and the loader as having three places to look. Names: the real name carries the full version (libz.so.1.2.13), the soname carries the major version that programs ask for (libz.so.1), and the linker name has no version (libz.so) and is only used when compiling. Places: first anything in LD_LIBRARY_PATH, then the cache in /etc/ld.so.cache, then the trusted defaults /lib and /usr/lib. ldconfig builds the cache from /etc/ld.so.conf and its include directory, ldconfig -p reads it, and ldd shows the result for one program.",
  "reference": []
 },
 "lessons": [
  {
   "id": "22.1",
   "kind": "vm",
   "title": "List the libraries a monitoring command depends on",
   "navSubtitle": "ldd, which",
   "objective": "102.3",
   "difficulty": "Beginner",
   "source": "Lab 1: List the libraries a monitoring command depends on",
   "workdir": "~/lpic1-section22",
   "summary": "",
   "scenario": "A monitoring agent on app02 shells out to ps. The vendor asks for a list of every shared library ps loads so they can check it against a known-good build.",
   "task": "Find the absolute path of ps and list its shared libraries with their resolved locations.",
   "deliverable": "reports/ps-libs.txt containing the path of ps and the ldd output.",
   "steps": [
    {
     "text": "which ps > reports/ps-libs.txt"
    },
    {
     "text": "ldd $(which ps) >> reports/ps-libs.txt"
    },
    {
     "text": "Read each line. The left side is the name the program asks for, the right side after => is the file the loader picked, and the hex number is the load address, which changes every run."
    }
   ],
   "validation": "cat reports/ps-libs.txt and confirm every line has a path after => and none says not found.",
   "trap": "ldd needs a path, not just a command name. ldd ps fails with \"not a dynamic executable\" or \"No such file\" unless ps is in the current directory. Also, linux-vdso.so.1 has no file on disk; the kernel provides it, so do not go looking for it. Never run ldd on a binary you do not trust: on some versions it can execute the program. objdump -p file | grep NEEDED is the safe way to read the list.",
   "paste": {
    "command": "cat reports/ps-libs.txt",
    "checks": [
     {
      "re": "^(/usr)?/bin/ps\\s*$",
      "say": "starts with the full path of ps"
     },
     {
      "re": "libc\\.so\\.6 => /\\S*libc\\.so\\.6",
      "say": "ldd resolved libc.so.6 to a file"
     },
     {
      "re": "=> /\\S+",
      "say": "at least three libraries resolve to a path",
      "min": 3
     },
     {
      "re": "not found",
      "say": "no library says not found",
      "absent": true
     }
    ]
   },
   "quiz": [
    {
     "id": "bare",
     "prompt": "Why does <code>ldd ps</code> fail when <code>ldd $(which ps)</code> works?",
     "answer": "path",
     "options": [
      {
       "value": "path",
       "label": "ldd needs a path to the file; it doesn't search PATH"
      },
      {
       "value": "root",
       "label": "ldd needs root for a bare name"
      },
      {
       "value": "static",
       "label": "ps is statically linked"
      }
     ],
     "explain": "Correct. which turns the command name into the path ldd needs."
    },
    {
     "id": "vdso",
     "prompt": "Where is the file for <code>linux-vdso.so.1</code>?",
     "answer": "kernel",
     "options": [
      {
       "value": "kernel",
       "label": "There isn't one; the kernel provides it"
      },
      {
       "value": "lib",
       "label": "/lib/x86_64-linux-gnu"
      },
      {
       "value": "boot",
       "label": "/boot"
      }
     ],
     "explain": "Correct. The kernel maps it into every process."
    }
   ],
   "completion": "List the libraries a monitoring command depends on: done."
  },
  {
   "id": "22.2",
   "kind": "vm",
   "title": "Decode library file names for a change review",
   "navSubtitle": "real name, soname",
   "objective": "102.3",
   "difficulty": "Beginner",
   "source": "Lab 2: Decode library file names for a change review",
   "workdir": "~/lpic1-section22",
   "summary": "",
   "scenario": "A change request says \"upgrade zlib from 1.2 to 1.3, no application changes needed.\" The reviewer wants to know why the applications will not need relinking.",
   "task": "Show the real file, the soname symlink, and the soname stored inside the library, and explain how they relate.",
   "deliverable": "reports/zlib-names.txt with the listing, the resolved file, the embedded soname, and a two-line explanation.",
   "steps": [
    {
     "cmd": "ls -l /lib/x86_64-linux-gnu/libz.so* > reports/zlib-names.txt"
    },
    {
     "text": "readlink -f /lib/x86_64-linux-gnu/libz.so.1 >> reports/zlib-names.txt"
    },
    {
     "text": "objdump -p /lib/x86_64-linux-gnu/libz.so.1 | grep SONAME >> reports/zlib-names.txt"
    },
    {
     "cmd": "ls /lib/x86_64-linux-gnu | grep -E '^lib(c|stdc\\+\\+|pcre2-8)\\.so' >> reports/zlib-names.txt"
    },
    {
     "text": "Add your explanation with nano reports/zlib-names.txt: programs record the soname libz.so.1, and the symlink of that name points at whichever real file (libz.so.1.2.x or libz.so.1.3.x) is installed. Note the naming variants in the last listing, such as libc.so.6 with no minor version and libpcre2-8 with a number inside the name."
    }
   ],
   "validation": "grep SONAME reports/zlib-names.txt and confirm it shows libz.so.1.",
   "trap": "The linker name libz.so (no version) only exists if the development package (zlib1g-dev) is installed, because only compilers use it. A running program never asks for libz.so; it asks for the soname. A major version change (libz.so.2) would break that link, which is why major versions can be installed side by side.",
   "paste": {
    "command": "cat reports/zlib-names.txt",
    "checks": [
     {
      "re": "libz\\.so\\.1 -> libz\\.so\\.1\\.\\d",
      "say": "ls shows the libz.so.1 symlink pointing at the real file"
     },
     {
      "re": "SONAME\\s+libz\\.so\\.1\\s*$",
      "say": "objdump shows the embedded soname libz.so.1"
     },
     {
      "re": "^libc\\.so\\.6\\s*$",
      "say": "the name-variant listing includes libc.so.6"
     },
     {
      "re": "\\bsoname\\b",
      "say": "your explanation mentions the soname",
      "min": 2
     }
    ]
   },
   "quiz": [
    {
     "id": "asks",
     "prompt": "Which name does a running program ask the loader for?",
     "answer": "soname",
     "options": [
      {
       "value": "soname",
       "label": "The soname, such as <code>libz.so.1</code>"
      },
      {
       "value": "real",
       "label": "The real name, such as <code>libz.so.1.3</code>"
      },
      {
       "value": "linker",
       "label": "The linker name, <code>libz.so</code>"
      }
     ],
     "explain": "Correct. The soname symlink then points at whichever real file is installed."
    },
    {
     "id": "linkername",
     "prompt": "Which package usually provides the bare <code>libz.so</code> link?",
     "answer": "dev",
     "options": [
      {
       "value": "dev",
       "label": "The development package (zlib1g-dev)"
      },
      {
       "value": "lib",
       "label": "The runtime package (zlib1g)"
      },
      {
       "value": "ldconfig",
       "label": "ldconfig creates it"
      }
     ],
     "explain": "Correct. Only the compiler uses the linker name."
    }
   ],
   "completion": "Decode library file names for a change review: done."
  },
  {
   "id": "22.3",
   "kind": "vm",
   "title": "Map every place the loader will search",
   "navSubtitle": "ld.so.conf, ld.so.conf.d",
   "objective": "102.3",
   "difficulty": "Beginner",
   "source": "Lab 3: Map every place the loader will search",
   "workdir": "~/lpic1-section22",
   "summary": "",
   "scenario": "A developer insists their library is \"installed\" because it is in /opt/vendor/lib, but their program still cannot find it. You need to show them where the loader actually looks.",
   "task": "Record the LD_LIBRARY_PATH value, the main configuration file and everything it includes, and the default library directories.",
   "deliverable": "reports/search-map.txt.",
   "steps": [
    {
     "cmd": "echo \"LD_LIBRARY_PATH=[$LD_LIBRARY_PATH]\" > reports/search-map.txt"
    },
    {
     "cmd": "cat /etc/ld.so.conf >> reports/search-map.txt"
    },
    {
     "cmd": "ls /etc/ld.so.conf.d/ >> reports/search-map.txt"
    },
    {
     "cmd": "cat /etc/ld.so.conf.d/*.conf >> reports/search-map.txt"
    },
    {
     "cmd": "ls -ld /lib /lib64 /usr/lib /usr/lib64 /usr/lib/x86_64-linux-gnu >> reports/search-map.txt 2>&1"
    },
    {
     "text": "Run ls /usr/lib/x86_64-linux-gnu | head -20 to see how libraries are grouped, including subdirectories that belong to particular applications."
    }
   ],
   "validation": "grep include reports/search-map.txt and confirm the main file includes /etc/ld.so.conf.d/*.conf. The first line should show empty brackets, which is normal.",
   "trap": "/opt/vendor/lib is not searched unless a file in /etc/ld.so.conf.d names it (and ldconfig has been run) or LD_LIBRARY_PATH contains it. On Mint, /lib is a symlink to /usr/lib (the merged /usr layout), so both paths show the same files. PATH is for finding commands, not libraries; adding a library folder to PATH does nothing for the loader. Some ls -ld lines may report a missing directory; that is fine, it just means that location is unused on your release.",
   "paste": {
    "command": "cat reports/search-map.txt",
    "checks": [
     {
      "re": "^LD_LIBRARY_PATH=\\[",
      "say": "records the LD_LIBRARY_PATH value"
     },
     {
      "re": "^include\\s+/etc/ld\\.so\\.conf\\.d/\\*\\.conf",
      "say": "ld.so.conf includes /etc/ld.so.conf.d/*.conf"
     },
     {
      "re": "^/usr/lib/x86_64-linux-gnu\\s*$",
      "say": "the multiarch .conf file lists /usr/lib/x86_64-linux-gnu"
     },
     {
      "re": "\\s/usr/lib\\s*$",
      "say": "ls -ld shows /usr/lib"
     }
    ]
   },
   "quiz": [
    {
     "id": "opt",
     "prompt": "A library sits in <code>/opt/vendor/lib</code> and nothing else was changed. Does the loader find it?",
     "answer": "no",
     "options": [
      {
       "value": "no",
       "label": "No. That folder isn't configured and isn't in LD_LIBRARY_PATH"
      },
      {
       "value": "yes",
       "label": "Yes, the loader searches all of /opt"
      },
      {
       "value": "path",
       "label": "Yes, if /opt/vendor/lib is in PATH"
      }
     ],
     "explain": "Correct. It needs a .conf file plus ldconfig, or LD_LIBRARY_PATH."
    }
   ],
   "completion": "Map every place the loader will search: done."
  },
  {
   "id": "22.4",
   "kind": "vm",
   "title": "Identify the dynamic linker/loader",
   "navSubtitle": "ld-linux, ld.so",
   "objective": "102.3",
   "difficulty": "Beginner",
   "source": "Lab 4: Identify the dynamic linker/loader",
   "workdir": "~/lpic1-section22",
   "summary": "",
   "scenario": "During an incident, a teammate says \"the loader\" is the problem but nobody can say which program that is. You are asked to find it and show that it can launch a program directly.",
   "task": "Find the loader that ps requests, confirm what kind of file it is, and use it to list and run ps.",
   "deliverable": "reports/loader.txt.",
   "steps": [
    {
     "text": "readelf -l /usr/bin/ps | grep -i interpreter > reports/loader.txt"
    },
    {
     "cmd": "ls -l /lib64/ld-linux-x86-64.so.2 >> reports/loader.txt"
    },
    {
     "cmd": "file -L /lib64/ld-linux-x86-64.so.2 >> reports/loader.txt"
    },
    {
     "text": "/lib64/ld-linux-x86-64.so.2 --list /usr/bin/ps >> reports/loader.txt"
    },
    {
     "text": "/lib64/ld-linux-x86-64.so.2 /usr/bin/ps -p $$ >> reports/loader.txt"
    },
    {
     "text": "Run file $(which ldd) >> reports/loader.txt, then man ld.so to read the search order in its own words."
    }
   ],
   "validation": "cat reports/loader.txt and confirm the interpreter line names /lib64/ld-linux-x86-64.so.2, the --list output matches Lab 1, and ps printed your shell's process.",
   "trap": "ldd is only a shell script that asks the loader to list dependencies, which is why --list gives the same output. The loader itself is named ld-linux-x86-64.so.2 on 64-bit x86 and is documented as ld.so; do not confuse it with ld, the compile-time linker from binutils.",
   "paste": {
    "command": "cat reports/loader.txt",
    "checks": [
     {
      "re": "program interpreter: /lib64/ld-linux-x86-64\\.so\\.2",
      "say": "readelf names /lib64/ld-linux-x86-64.so.2 as the interpreter"
     },
     {
      "re": "ld-linux-x86-64\\.so\\.2:.*\\bELF 64-bit",
      "say": "file shows the loader is a 64-bit ELF file"
     },
     {
      "re": "libc\\.so\\.6 => /\\S+",
      "say": "the loader's --list output resolves libc.so.6"
     },
     {
      "re": "PID\\s+TTY\\s+TIME\\s+CMD",
      "say": "ps ran through the loader and printed your shell"
     }
    ]
   },
   "quiz": [
    {
     "id": "ldvsld",
     "prompt": "What is the difference between <code>ld</code> and <code>ld.so</code>?",
     "answer": "build",
     "options": [
      {
       "value": "build",
       "label": "ld links at build time; ld.so loads libraries at run time"
      },
      {
       "value": "same",
       "label": "They are the same program"
      },
      {
       "value": "rev",
       "label": "ld runs programs; ld.so compiles them"
      }
     ],
     "explain": "Correct. On 64-bit x86, ld.so is ld-linux-x86-64.so.2."
    }
   ],
   "completion": "Identify the dynamic linker/loader: done."
  },
  {
   "id": "22.5",
   "kind": "vm",
   "title": "Query the library cache",
   "navSubtitle": "ldconfig -p, ld.so.cache",
   "objective": "102.3",
   "difficulty": "Intermediate",
   "source": "Lab 5: Query the library cache",
   "workdir": "~/lpic1-section22",
   "summary": "",
   "scenario": "A package install hook failed halfway on db01. Before you rebuild anything, the lead asks what the cache currently knows about.",
   "task": "Show the cache file, count its entries, view it verbosely without changing it, and search it for one library.",
   "deliverable": "reports/cache-check.txt.",
   "steps": [
    {
     "cmd": "ls -l /etc/ld.so.cache > reports/cache-check.txt"
    },
    {
     "cmd": "file /etc/ld.so.cache >> reports/cache-check.txt"
    },
    {
     "text": "ldconfig -p | head -1 >> reports/cache-check.txt"
    },
    {
     "text": "ldconfig -p | grep 'libz.so.1 ' >> reports/cache-check.txt"
    },
    {
     "text": "Run ldconfig -v -N -X 2>/dev/null | less to browse each directory ldconfig scans and the libraries it finds there. -N means do not rebuild the cache and -X means do not touch symlinks, so this is read-only. Press q to leave less."
    }
   ],
   "validation": "cat reports/cache-check.txt and confirm the third line reads like \"NNNN libs found in cache\" and the libz line shows a path.",
   "trap": "ldconfig -p reports the cache, not the disk. A library copied into a directory a minute ago does not appear until ldconfig runs again, and a deleted one can still be listed. The cache is binary; never edit it, rebuild it with sudo ldconfig. Package managers run ldconfig for you after installs, which is why you rarely have to.",
   "paste": {
    "command": "cat reports/cache-check.txt",
    "checks": [
     {
      "re": "^\\S+\\s+\\d+\\s+root\\s+root\\s.*/etc/ld\\.so\\.cache\\s*$",
      "say": "ls shows /etc/ld.so.cache owned by root"
     },
     {
      "re": "^\\d+ libs found in cache",
      "say": "ldconfig -p reports how many libs the cache holds"
     },
     {
      "re": "libz\\.so\\.1 \\(libc6,x86-64\\) => /\\S*libz\\.so\\.1",
      "say": "the cache has a libz.so.1 entry with a path"
     }
    ]
   },
   "quiz": [
    {
     "id": "pread",
     "prompt": "What does <code>ldconfig -p</code> read?",
     "answer": "cache",
     "options": [
      {
       "value": "cache",
       "label": "/etc/ld.so.cache"
      },
      {
       "value": "disk",
       "label": "Every library directory on disk"
      },
      {
       "value": "conf",
       "label": "/etc/ld.so.conf"
      }
     ],
     "explain": "Correct. It can be stale until ldconfig runs again."
    },
    {
     "id": "nx",
     "prompt": "What do <code>-N</code> and <code>-X</code> tell ldconfig?",
     "answer": "nox",
     "options": [
      {
       "value": "nox",
       "label": "Don't rebuild the cache, and don't update links"
      },
      {
       "value": "new",
       "label": "Build a new cache from scratch"
      },
      {
       "value": "verbose",
       "label": "Print extra detail"
      }
     ],
     "explain": "Correct. With -v that makes a read-only browse."
    }
   ],
   "completion": "Query the library cache: done."
  },
  {
   "id": "22.6",
   "kind": "vm",
   "title": "Work a \"top will not start\" ticket",
   "navSubtitle": "Triage: ldd, cache, disk",
   "objective": "102.3",
   "difficulty": "Intermediate",
   "source": "Lab 6: Work a \"top will not start\" ticket",
   "workdir": "~/lpic1-section22",
   "summary": "",
   "scenario": "A ticket from web01 says top fails to start after someone was \"cleaning up old libraries.\" Your copy of top works, so you will rehearse the triage steps on it.",
   "task": "Find top's libraries, pick its process-information library, and confirm that library is both in the cache and on disk.",
   "deliverable": "reports/top-triage.txt with the three checks.",
   "steps": [
    {
     "text": "ldd $(which top) > reports/top-triage.txt"
    },
    {
     "text": "Run ldd $(which top) | grep libproc to spot the process-information library: libprocps.so.8 on Mint 21, libproc2.so.0 on Mint 22."
    },
    {
     "text": "ldconfig -p | grep -E 'libproc(ps|2)\\.so' >> reports/top-triage.txt"
    },
    {
     "cmd": "ls -l $(ldd $(which top) | awk '/libproc/ {print $3}') >> reports/top-triage.txt"
    }
   ],
   "validation": "cat reports/top-triage.txt and confirm the library appears three times: in the ldd output, in the cache, and in the ls -l listing.",
   "trap": "Work the checks in order. ldd \"not found\" plus a cache hit means the cache is stale or the file was deleted; a cache miss plus a file on disk means the directory is not configured or ldconfig was not run. On a real system the fix for a deleted library is to reinstall its package (dpkg -S finds the owner), not to copy a .so from another machine.",
   "paste": {
    "command": "cat reports/top-triage.txt",
    "checks": [
     {
      "re": "libproc(ps|2)\\.so\\.\\d+ => /\\S+",
      "say": "ldd resolves top's process library"
     },
     {
      "re": "libproc(ps|2)\\.so\\.\\d+ \\(libc6",
      "say": "the cache lists the process library"
     },
     {
      "re": "^[l-]\\S+\\s+\\d+\\s+\\S+\\s+\\S+\\s.*libproc(ps|2)\\.so",
      "say": "ls -l shows the library file on disk"
     },
     {
      "re": "not found",
      "say": "nothing is missing",
      "absent": true
     }
    ]
   },
   "quiz": [
    {
     "id": "stale",
     "prompt": "ldd says <em>not found</em>, but <code>ldconfig -p</code> still lists the library. Most likely cause?",
     "answer": "deleted",
     "options": [
      {
       "value": "deleted",
       "label": "The file was deleted and the cache is stale"
      },
      {
       "value": "conf",
       "label": "Its directory isn't in ld.so.conf"
      },
      {
       "value": "path",
       "label": "LD_LIBRARY_PATH is empty"
      }
     ],
     "explain": "Correct. Reinstall the owning package; dpkg -S finds it."
    }
   ],
   "completion": "Work a \"top will not start\" ticket: done."
  },
  {
   "id": "22.7",
   "kind": "vm",
   "title": "Build a shared library with proper names",
   "navSubtitle": "gcc -shared, ldconfig -n",
   "objective": "102.3",
   "difficulty": "Intermediate",
   "source": "Lab 7: Build a shared library with proper names",
   "workdir": "~/lpic1-section22",
   "summary": "",
   "scenario": "The app team wants a small in-house library, libgreet, packaged the standard way so future versions can be swapped in without relinking.",
   "task": "Compile position-independent code, build libgreet.so.1.0.0 with an embedded soname of libgreet.so.1, and create the soname and linker-name symlinks.",
   "deliverable": "lib/ containing the real file and two symlinks, and reports/greet-names.txt.",
   "steps": [
    {
     "text": "gcc -fPIC -c src/greet.c -o src/greet.o"
    },
    {
     "text": "gcc -shared -Wl,-soname,libgreet.so.1 -o lib/libgreet.so.1.0.0 src/greet.o"
    },
    {
     "text": "ldconfig -n lib"
    },
    {
     "text": "That last command reads the soname inside the file and creates the symlink lib/libgreet.so.1. It needs no sudo because -n only touches the folder you name and leaves the system cache alone."
    },
    {
     "text": "ln -sf libgreet.so.1 lib/libgreet.so"
    },
    {
     "cmd": "ls -l lib > reports/greet-names.txt"
    },
    {
     "text": "objdump -p lib/libgreet.so.1.0.0 | grep SONAME >> reports/greet-names.txt"
    }
   ],
   "validation": "cat reports/greet-names.txt and confirm libgreet.so -> libgreet.so.1 -> libgreet.so.1.0.0 and SONAME libgreet.so.1.",
   "trap": "ldconfig makes soname links, never linker-name links. If you skip the ln -sf step, gcc -lgreet in the next lab fails with \"cannot find -lgreet\", which is a compile-time error, not a loader error.",
   "paste": {
    "command": "cat reports/greet-names.txt",
    "checks": [
     {
      "re": "libgreet\\.so -> libgreet\\.so\\.1\\s*$",
      "say": "the linker name libgreet.so points at libgreet.so.1"
     },
     {
      "re": "libgreet\\.so\\.1 -> libgreet\\.so\\.1\\.0\\.0",
      "say": "the soname link points at the real file"
     },
     {
      "re": "^-\\S+\\s.*\\slibgreet\\.so\\.1\\.0\\.0\\s*$",
      "say": "the real file libgreet.so.1.0.0 exists"
     },
     {
      "re": "SONAME\\s+libgreet\\.so\\.1\\s*$",
      "say": "the embedded soname is libgreet.so.1"
     }
    ]
   },
   "quiz": [
    {
     "id": "nlinks",
     "prompt": "Which link does <code>ldconfig -n lib</code> create?",
     "answer": "soname",
     "options": [
      {
       "value": "soname",
       "label": "The soname link, libgreet.so.1"
      },
      {
       "value": "linker",
       "label": "The linker-name link, libgreet.so"
      },
      {
       "value": "both",
       "label": "Both links"
      }
     ],
     "explain": "Correct. You make the linker-name link yourself with ln -s."
    }
   ],
   "completion": "Build a shared library with proper names: done."
  },
  {
   "id": "22.8",
   "kind": "vm",
   "title": "Reproduce \"cannot open shared object file\"",
   "navSubtitle": "cannot open shared object",
   "objective": "102.3",
   "difficulty": "Intermediate",
   "source": "Lab 8: Reproduce \"cannot open shared object file\"",
   "workdir": "~/lpic1-section22",
   "summary": "",
   "scenario": "app02 reports: error while loading shared libraries: libgreet.so.1: cannot open shared object file: No such file or directory. You need to reproduce it in the lab before you fix it.",
   "task": "Link the program against libgreet, run it, and capture the failure and the ldd evidence.",
   "deliverable": "reports/greet-failure.txt.",
   "steps": [
    {
     "text": "gcc src/app.c -Llib -lgreet -o bin/greetapp"
    },
    {
     "text": "./bin/greetapp 2> reports/greet-failure.txt"
    },
    {
     "text": "ldd bin/greetapp >> reports/greet-failure.txt"
    },
    {
     "text": "objdump -p bin/greetapp | grep NEEDED >> reports/greet-failure.txt"
    }
   ],
   "validation": "grep -c 'not found' reports/greet-failure.txt returns 1, and the NEEDED lines include libgreet.so.1.",
   "trap": "-L only tells the compile-time linker where to look. It is not saved in the program, so the loader has no idea lib/ exists. The program asks for libgreet.so.1 (the soname), not libgreet.so or the full real name.",
   "paste": {
    "command": "cat reports/greet-failure.txt",
    "checks": [
     {
      "re": "libgreet\\.so\\.1: cannot open shared object file",
      "say": "the program failed to load libgreet.so.1"
     },
     {
      "re": "not found",
      "say": "ldd shows exactly one not found line",
      "count": 1
     },
     {
      "re": "NEEDED\\s+libgreet\\.so\\.1\\s*$",
      "say": "NEEDED lists libgreet.so.1"
     }
    ]
   },
   "quiz": [
    {
     "id": "dashL",
     "prompt": "Why doesn't <code>-Llib</code> at build time help the program at run time?",
     "answer": "build",
     "options": [
      {
       "value": "build",
       "label": "-L only guides the build-time linker and isn't stored in the program"
      },
      {
       "value": "rel",
       "label": "Relative paths are ignored at run time"
      },
      {
       "value": "root",
       "label": "Only root's programs keep -L"
      }
     ],
     "explain": "Correct. The loader never learns about lib/."
    }
   ],
   "completion": "Reproduce \"cannot open shared object file\": done."
  },
  {
   "id": "22.9",
   "kind": "vm",
   "title": "Fix it for one session with LD_LIBRARY_PATH",
   "navSubtitle": "LD_LIBRARY_PATH",
   "objective": "102.3",
   "difficulty": "Advanced",
   "source": "Lab 9: Fix it for one session with LD_LIBRARY_PATH",
   "workdir": "~/lpic1-section22",
   "summary": "",
   "scenario": "The developer needs greetapp running right now for a demo, without changing any system files.",
   "task": "Run the program once with LD_LIBRARY_PATH set for that command only, then export it for the session while keeping any existing value, then remove it.",
   "deliverable": "reports/ldpath-fix.txt.",
   "steps": [
    {
     "text": "LD_LIBRARY_PATH=$PWD/lib ./bin/greetapp > reports/ldpath-fix.txt"
    },
    {
     "text": "export LD_LIBRARY_PATH=$PWD/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
    },
    {
     "cmd": "echo \"$LD_LIBRARY_PATH\" >> reports/ldpath-fix.txt"
    },
    {
     "text": "ldd bin/greetapp | grep greet >> reports/ldpath-fix.txt"
    },
    {
     "text": "unset LD_LIBRARY_PATH"
    },
    {
     "text": "./bin/greetapp 2>> reports/ldpath-fix.txt"
    },
    {
     "text": "The last run fails again, which proves the fix only lasted while the variable was set."
    }
   ],
   "validation": "cat reports/ldpath-fix.txt and confirm the hello line, a libgreet line with a path into your lib folder, and a final error line.",
   "trap": "Writing export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/dir when the variable is empty leaves a leading colon, and an empty entry means the current directory, which is a security risk. The ${VAR:+:$VAR} form only adds the colon when there is something to add. Use LD_LIBRARY_PATH for testing and development, not as a permanent fix; put that in a script if you need it often.",
   "paste": {
    "command": "cat reports/ldpath-fix.txt",
    "checks": [
     {
      "re": "^libgreet says hello to web01",
      "say": "the program ran with LD_LIBRARY_PATH set"
     },
     {
      "re": "^/\\S+/lib(:\\S+)?\\s*$",
      "say": "the exported value starts with your lib folder, with no leading colon"
     },
     {
      "re": "libgreet\\.so\\.1 => /\\S+/lib/libgreet\\.so\\.1",
      "say": "ldd found libgreet in your lib folder"
     },
     {
      "re": "cannot open shared object file",
      "say": "the run after unset failed again"
     }
    ]
   },
   "quiz": [
    {
     "id": "colon",
     "prompt": "Why is <code>LD_LIBRARY_PATH=:/opt/lib</code> risky?",
     "answer": "cwd",
     "options": [
      {
       "value": "cwd",
       "label": "The empty entry means the current directory is searched"
      },
      {
       "value": "ign",
       "label": "The loader ignores the whole value"
      },
      {
       "value": "root",
       "label": "It only works for root"
      }
     ],
     "explain": "Correct. Use ${VAR:+:$VAR} to add the colon only when needed."
    },
    {
     "id": "life",
     "prompt": "How long does an exported LD_LIBRARY_PATH last?",
     "answer": "shell",
     "options": [
      {
       "value": "shell",
       "label": "For that shell and its children"
      },
      {
       "value": "boot",
       "label": "Until reboot"
      },
      {
       "value": "ever",
       "label": "Permanently"
      }
     ],
     "explain": "Correct. A new login doesn't see it."
    }
   ],
   "completion": "Fix it for one session with LD_LIBRARY_PATH: done."
  },
  {
   "id": "22.10",
   "kind": "vm",
   "title": "Fix it permanently with ld.so.conf.d and ldconfig",
   "navSubtitle": "ld.so.conf.d, ldconfig",
   "objective": "102.3",
   "difficulty": "Advanced",
   "source": "Lab 10: Fix it permanently with ld.so.conf.d and ldconfig",
   "workdir": "~/lpic1-section22",
   "summary": "",
   "scenario": "The demo went well. The team wants greetapp to work for every user and every shell on the test box, the way vendor libraries are normally registered.",
   "task": "Add a configuration file for the lib folder, rebuild the cache, prove the program runs, then remove the file and rebuild again so your VM is back to normal.",
   "deliverable": "reports/ldconf-fix.txt.",
   "steps": [
    {
     "cmd": "echo \"$HOME/lpic1-section22/lib\" | sudo tee /etc/ld.so.conf.d/lpic1-greet.conf"
    },
    {
     "cmd": "sudo ldconfig"
    },
    {
     "text": "ldconfig -p | grep libgreet > reports/ldconf-fix.txt"
    },
    {
     "text": "./bin/greetapp >> reports/ldconf-fix.txt"
    },
    {
     "text": "Cleanup: sudo rm /etc/ld.so.conf.d/lpic1-greet.conf"
    },
    {
     "cmd": "sudo ldconfig"
    },
    {
     "text": "ldconfig -p | grep -c libgreet >> reports/ldconf-fix.txt"
    }
   ],
   "validation": "cat reports/ldconf-fix.txt and confirm a cache line for libgreet.so.1, the hello line, and a final count of 0. ls /etc/ld.so.conf.d should no longer list lpic1-greet.conf.",
   "trap": "Adding the .conf file does nothing by itself; the change only takes effect when sudo ldconfig rebuilds /etc/ld.so.cache. Running plain ldconfig without sudo fails because the cache file belongs to root. You could also add the path directly to /etc/ld.so.conf, but a separate file in ld.so.conf.d is cleaner and easy to remove.",
   "paste": {
    "command": "cat reports/ldconf-fix.txt",
    "checks": [
     {
      "re": "libgreet\\.so\\.1 \\(libc6,x86-64\\) => /\\S+/libgreet\\.so\\.1",
      "say": "the cache has a libgreet.so.1 entry"
     },
     {
      "re": "^libgreet says hello to web01",
      "say": "the program ran with no LD_LIBRARY_PATH"
     },
     {
      "re": "^0\\s*$",
      "say": "the final count is 0, so the cleanup worked"
     }
    ]
   },
   "quiz": [
    {
     "id": "noeffect",
     "prompt": "You added <code>/etc/ld.so.conf.d/vendor.conf</code>. What else must happen?",
     "answer": "ldconfig",
     "options": [
      {
       "value": "ldconfig",
       "label": "Run <code>sudo ldconfig</code> to rebuild the cache"
      },
      {
       "value": "reboot",
       "label": "Reboot"
      },
      {
       "value": "nothing",
       "label": "Nothing; the loader reads the file directly"
      }
     ],
     "explain": "Correct. The loader reads the cache, not the .conf files."
    }
   ],
   "completion": "Fix it permanently with ld.so.conf.d and ldconfig: done."
  },
  {
   "id": "22.11",
   "kind": "vm",
   "title": "Compare static and dynamic linking",
   "navSubtitle": "Static vs dynamic, ar",
   "objective": "102.3",
   "difficulty": "Advanced",
   "source": "Lab 11: Compare static and dynamic linking",
   "workdir": "~/lpic1-section22",
   "summary": "",
   "scenario": "A field engineer needs a copy of greetapp that runs on a rescue system where the library will not be installed. You are asked to compare the options.",
   "task": "Build a fully static copy, a copy linked against a static libgreet.a, and compare them with the dynamic build.",
   "deliverable": "reports/static-vs-dynamic.txt.",
   "steps": [
    {
     "text": "ar rcs lib/libgreet.a src/greet.o"
    },
    {
     "text": "gcc src/app.c lib/libgreet.a -o bin/greetapp-archive"
    },
    {
     "text": "gcc -static src/app.c src/greet.c -o bin/greetapp-static"
    },
    {
     "cmd": "ls -l bin/ > reports/static-vs-dynamic.txt"
    },
    {
     "cmd": "file bin/* >> reports/static-vs-dynamic.txt"
    },
    {
     "text": "ldd bin/greetapp-archive >> reports/static-vs-dynamic.txt"
    },
    {
     "text": "ldd bin/greetapp-static >> reports/static-vs-dynamic.txt 2>&1"
    },
    {
     "text": "Run ./bin/greetapp-archive and ./bin/greetapp-static; both should run with no LD_LIBRARY_PATH set."
    }
   ],
   "validation": "grep -E 'statically linked|not a dynamic executable' reports/static-vs-dynamic.txt and compare the file sizes: the static build is hundreds of times larger.",
   "trap": "Static programs carry a frozen copy of every library, so a security fix to libc does not reach them until they are rebuilt; dynamic programs pick up the fix the next time they start. Static libraries end in .a (an ar archive) and shared ones in .so. When both exist in the same folder, gcc -lgreet picks the .so.",
   "paste": {
    "command": "cat reports/static-vs-dynamic.txt",
    "checks": [
     {
      "re": "greetapp-static:.*statically linked",
      "say": "file shows the static build is statically linked"
     },
     {
      "re": "greetapp-archive:.*dynamically linked",
      "say": "the archive build is still dynamic (it needs libc)"
     },
     {
      "re": "not a dynamic executable",
      "say": "ldd says the static build is not a dynamic executable"
     },
     {
      "re": "libgreet\\.so",
      "say": "neither build needs libgreet.so",
      "absent": true
     }
    ]
   },
   "quiz": [
    {
     "id": "lsize",
     "prompt": "A libc security fix is installed. Which programs get it without a rebuild?",
     "answer": "dyn",
     "options": [
      {
       "value": "dyn",
       "label": "Dynamically linked ones, after they restart"
      },
      {
       "value": "static",
       "label": "Statically linked ones"
      },
      {
       "value": "both",
       "label": "Both kinds"
      }
     ],
     "explain": "Correct. Static programs carry their own frozen copy."
    },
    {
     "id": "dota",
     "prompt": "Which file is a static library?",
     "answer": "a",
     "options": [
      {
       "value": "a",
       "label": "<code>libgreet.a</code>"
      },
      {
       "value": "so",
       "label": "<code>libgreet.so</code>"
      },
      {
       "value": "so1",
       "label": "<code>libgreet.so.1</code>"
      }
     ],
     "explain": "Correct. .a is an ar archive; .so is shared."
    }
   ],
   "completion": "Compare static and dynamic linking: done."
  },
  {
   "id": "22.12",
   "kind": "vm",
   "title": "Audit direct and indirect dependencies of a running program",
   "navSubtitle": "NEEDED, /proc/PID/maps",
   "objective": "102.3",
   "difficulty": "Advanced",
   "source": "Lab 12: Audit direct and indirect dependencies of a running program",
   "workdir": "~/lpic1-section22",
   "summary": "",
   "scenario": "Security asks whether your current shell has the patched libc loaded, and whether ssh depends on OpenSSL directly or only through another library.",
   "task": "Compare the direct NEEDED list for ssh with ldd's full tree, and show which libc file your running shell has mapped.",
   "deliverable": "reports/dep-audit.txt.",
   "steps": [
    {
     "text": "objdump -p /usr/bin/ssh | grep NEEDED > reports/dep-audit.txt"
    },
    {
     "text": "ldd /usr/bin/ssh | wc -l >> reports/dep-audit.txt"
    },
    {
     "cmd": "grep -m1 'libc.so' /proc/$$/maps >> reports/dep-audit.txt"
    },
    {
     "text": "Compare: NEEDED lists only what ssh asks for itself; ldd follows the chain, so it lists libraries that the first libraries need too."
    }
   ],
   "validation": "cat reports/dep-audit.txt and confirm there are fewer NEEDED lines than ldd lines, and that the maps line shows a path ending in libc.so.6.",
   "trap": "A library update on disk does not change programs that are already running; they keep the old copy mapped until restarted. After a libc update, services need a restart (or the system a reboot), and /proc/PID/maps shows (deleted) next to libraries that were replaced underneath a running process.",
   "paste": {
    "command": "cat reports/dep-audit.txt",
    "checks": [
     {
      "re": "NEEDED\\s+\\S+\\.so",
      "say": "objdump lists ssh's direct NEEDED libraries",
      "min": 2
     },
     {
      "re": "NEEDED\\s+libc\\.so\\.6",
      "say": "libc.so.6 is a direct dependency"
     },
     {
      "re": "^\\s*\\d+\\s*$",
      "say": "the ldd line count is there"
     },
     {
      "re": "^[0-9a-f]+-[0-9a-f]+\\s+\\S+\\s.*/libc\\.so\\.6(\\s+\\(deleted\\))?\\s*$",
      "say": "the maps line shows the libc.so.6 your shell has mapped"
     }
    ]
   },
   "quiz": [
    {
     "id": "running",
     "prompt": "libc was just updated on disk. What about processes already running?",
     "answer": "old",
     "options": [
      {
       "value": "old",
       "label": "They keep the old copy until restarted"
      },
      {
       "value": "new",
       "label": "They switch to the new copy at once"
      },
      {
       "value": "crash",
       "label": "They crash"
      }
     ],
     "explain": "Correct. /proc/PID/maps marks the replaced file (deleted)."
    }
   ],
   "completion": "Audit direct and indirect dependencies of a running program: done."
  }
 ],
 "review": {
  "traps": [
   "Running ldd with a bare command name. ldd needs a path; use ldd $(which ps).",
   "Thinking ldconfig -p reads the disk. It prints the contents of /etc/ld.so.cache, which can be out of date until ldconfig runs again.",
   "Forgetting that adding a file to /etc/ld.so.conf.d changes nothing until you run ldconfig as root.",
   "Mixing up the files. /etc/ld.so.conf is text you edit, it includes /etc/ld.so.conf.d/*.conf, and /etc/ld.so.cache is the binary result you never edit.",
   "Believing PATH helps find libraries. PATH finds commands; the loader uses LD_LIBRARY_PATH, the cache, and the default directories.",
   "Getting the search order wrong. LD_LIBRARY_PATH comes before the cache, and the trusted directories /lib and /usr/lib (lib64 on some systems) come last. A path embedded at build time (RPATH or RUNPATH) can also be involved.",
   "Expecting LD_LIBRARY_PATH to survive a new login. It lasts for the shell where it was exported, and only children of that shell see it.",
   "Leaving a leading or trailing colon in LD_LIBRARY_PATH, which adds the current directory to the search.",
   "Confusing the three names: real name libz.so.1.2.13, soname libz.so.1 (what programs request), linker name libz.so (what gcc -lz uses).",
   "Confusing ld and ld.so. ld is the build-time linker; ld.so (ld-linux-x86-64.so.2 on 64-bit x86) is the run-time dynamic linker/loader.",
   "Mixing up ldconfig options: -p prints the cache, -v is verbose, -N skips rebuilding the cache, -X skips links, -n processes only the directories named on the command line.",
   "Thinking a static program needs its libraries at run time. It contains them, so ldd reports \"not a dynamic executable\".",
   "Fixing a missing library by copying a .so from another server. Reinstall the owning package instead.",
   "Forgetting that ldd on an untrusted binary can be unsafe. objdump -p or readelf -d shows the NEEDED entries without running anything."
  ],
  "trapQuiz": [
   {
    "id": "tq1",
    "prompt": "Which file does <code>ldconfig -p</code> print?",
    "answer": "cache",
    "options": [
     {
      "value": "cache",
      "label": "/etc/ld.so.cache"
     },
     {
      "value": "conf",
      "label": "/etc/ld.so.conf"
     },
     {
      "value": "dir",
      "label": "/etc/ld.so.conf.d"
     }
    ],
    "explain": "Correct."
   },
   {
    "id": "tq2",
    "prompt": "Which file must you never edit by hand?",
    "answer": "cache",
    "options": [
     {
      "value": "cache",
      "label": "/etc/ld.so.cache"
     },
     {
      "value": "conf",
      "label": "/etc/ld.so.conf"
     },
     {
      "value": "d",
      "label": "A file in /etc/ld.so.conf.d"
     }
    ],
    "explain": "Correct. It's binary; rebuild it with ldconfig."
   },
   {
    "id": "tq3",
    "prompt": "What is the loader's search order?",
    "answer": "order",
    "options": [
     {
      "value": "order",
      "label": "LD_LIBRARY_PATH, then the cache, then /lib and /usr/lib"
     },
     {
      "value": "o2",
      "label": "The cache, then LD_LIBRARY_PATH, then /lib"
     },
     {
      "value": "o3",
      "label": "PATH, then the cache"
     }
    ],
    "explain": "Correct. RPATH/RUNPATH in the binary can also play a part."
   },
   {
    "id": "tq4",
    "prompt": "Which variable helps the loader find libraries?",
    "answer": "ldlp",
    "options": [
     {
      "value": "path",
      "label": "<code>PATH</code>"
     },
     {
      "value": "ldlp",
      "label": "<code>LD_LIBRARY_PATH</code>"
     },
     {
      "value": "libpath",
      "label": "<code>LIBPATH</code>"
     }
    ],
    "explain": "Correct. PATH is only for commands."
   },
   {
    "id": "tq5",
    "prompt": "In <code>libz.so.1.3</code>, <code>libz.so.1</code> and <code>libz.so</code>, which is the soname?",
    "answer": "so1",
    "options": [
     {
      "value": "real",
      "label": "<code>libz.so.1.3</code>"
     },
     {
      "value": "so1",
      "label": "<code>libz.so.1</code>"
     },
     {
      "value": "so",
      "label": "<code>libz.so</code>"
     }
    ],
    "explain": "Correct."
   },
   {
    "id": "tq6",
    "prompt": "Which ldconfig option processes only the directories named on the command line?",
    "answer": "n",
    "options": [
     {
      "value": "p",
      "label": "<code>-p</code>"
     },
     {
      "value": "v",
      "label": "<code>-v</code>"
     },
     {
      "value": "nocache",
      "label": "<code>-N</code>"
     },
     {
      "value": "n",
      "label": "<code>-n</code>"
     }
    ],
    "explain": "Correct. -N skips rebuilding the cache, which is different."
   },
   {
    "id": "tq7",
    "prompt": "What does ldd print for a statically linked program?",
    "answer": "notdyn",
    "options": [
     {
      "value": "notdyn",
      "label": "not a dynamic executable"
     },
     {
      "value": "nf",
      "label": "A list of not found lines"
     },
     {
      "value": "libc",
      "label": "Only libc.so.6"
     }
    ],
    "explain": "Correct."
   },
   {
    "id": "tq8",
    "prompt": "What is the safe way to list an untrusted binary's libraries?",
    "answer": "objdump",
    "options": [
     {
      "value": "objdump",
      "label": "<code>objdump -p FILE | grep NEEDED</code>"
     },
     {
      "value": "ldd",
      "label": "<code>ldd FILE</code>"
     },
     {
      "value": "run",
      "label": "Run it under strace"
     }
    ],
    "explain": "Correct. It reads the file without running it."
   }
  ],
  "challenge": {
   "intro": "Complete these tasks without notes, using only your Linux Mint VM and ~/lpic1-section22. Start by resetting the workspace: rm -f lib/* bin/* src/*.o, then rerun Step 4 of the Lab Setup.",
   "tasks": [
    "Save the full list of shared libraries used by the ls command to reports/challenge-ls.txt, with resolved paths.",
    "Show which file the soname libc.so.6 resolves to and save the answer to reports/challenge-libc.txt.",
    "Prove from the configuration files, not from memory, which directories the cache is built from.",
    "Rebuild libgreet as a properly named shared library with the soname libgreet.so.1 and all symlinks.",
    "Build greetapp and capture the loader error it gives before any fix.",
    "Make greetapp run in your shell only, without touching /etc, then undo it.",
    "Register the library for the whole system, prove it is in the cache, run the program, and then remove the registration and prove it is gone.",
    "Build a copy of greetapp that runs with no external libgreet at all, and prove it with ldd."
   ],
   "outro": "Your final handoff is the reports directory. For each file, write one sentence that says which part of the loader's search order it proves."
  },
  "questions": [
   {
    "q": "Vendor request: “Send me every shared library our monitoring agent loads, with the path each one comes from.”",
    "a": "<code>ldd $(which agent)</code> (ldd needs the full path). Each line shows the requested name, then <code>=&gt;</code> and the file the loader chose. For an untrusted binary use <code>objdump -p FILE | grep NEEDED</code> instead."
   },
   {
    "q": "Developer request: “My library is in /opt/vendor/lib but the program still says it cannot open it. Make it work for everyone on this server.”",
    "a": "<code>echo /opt/vendor/lib | sudo tee /etc/ld.so.conf.d/vendor.conf</code>, then <code>sudo ldconfig</code>. Confirm with <code>ldconfig -p | grep LIBNAME</code> and <code>ldd PROGRAM</code>."
   },
   {
    "q": "Incident bridge request: “We need the app up in the next five minutes. Get it to find its library without changing anything under /etc.”",
    "a": "<code>LD_LIBRARY_PATH=/path/to/lib ./app</code> for one run, or <code>export LD_LIBRARY_PATH=/path/to/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}</code> for that shell. Nothing under /etc changes, and it ends with the shell."
   },
   {
    "q": "Change reviewer request: “Explain why upgrading zlib from 1.2 to 1.3 will not require relinking our applications.”",
    "a": "Programs record the soname <code>libz.so.1</code>, not the real file name. The <code>libz.so.1</code> symlink moves to the new real file (libz.so.1.3.x), so programs keep working. Only a major version change (libz.so.2) would need relinking."
   },
   {
    "q": "Help desk request: “top stopped working after someone cleaned up libraries. Is the library missing, or does the system just not know where it is?”",
    "a": "<code>ldd $(which top)</code> shows which library is <em>not found</em>. Then check the cache (<code>ldconfig -p | grep libproc</code>) and the disk (<code>ls -l</code> the file). Missing on disk: reinstall the package (<code>dpkg -S</code> finds it). On disk but not cached: <code>sudo ldconfig</code>."
   },
   {
    "q": "Field engineer request: “I need a build of this tool that runs on a rescue disk with nothing else installed.”",
    "a": "Link it statically, for example <code>gcc -static app.c greet.c -o app-static</code>. <code>file</code> shows <em>statically linked</em> and <code>ldd</code> says <em>not a dynamic executable</em>."
   },
   {
    "q": "Security request: “We just patched libc. Which running processes are still using the old copy, and why?”",
    "a": "Search the maps for the replaced file, for example <code>sudo grep -l 'libc.so.6 (deleted)' /proc/[0-9]*/maps</code>. Running processes keep the old copy mapped until they restart, so restart those services or reboot."
   }
  ],
  "mastery": [
   "I can explain what a shared library is and why many programs share one copy.",
   "I can read a library file name and point out its real name, soname, and linker name.",
   "I can list a program's libraries with ldd and an absolute path, and read the => and not found lines.",
   "I can name the dynamic linker/loader and use it to list or run a program.",
   "I can show the contents of /etc/ld.so.conf and the files it includes from /etc/ld.so.conf.d.",
   "I can explain what /etc/ld.so.cache is and why it must be rebuilt with ldconfig.",
   "I can search the cache with ldconfig -p | grep and browse it with ldconfig -v.",
   "I can state the order the loader searches: LD_LIBRARY_PATH, the cache, then the default directories.",
   "I can set LD_LIBRARY_PATH for one command or export it for a session without breaking an existing value.",
   "I can register a new library directory for the whole system and remove it cleanly.",
   "I can explain static versus dynamic linking and recognize .a and .so files.",
   "I can troubleshoot a \"cannot open shared object file\" error step by step."
  ]
 }
});
