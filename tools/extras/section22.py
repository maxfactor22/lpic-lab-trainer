# App-only additions for Section 22: paste checks, one or two quiz questions per lab,
# a trap quiz, and model answers for the practical questions.
NUMBER = 22
TITLE = "Shared Libraries"
OBJECTIVES = ["102.3"]
SOURCE = "LPIC_Section22_Lab_Workbook.docx"
WORKDIR = "~/lpic1-section22"

def chk(re, say, **kw):
    return {"re": re, "say": say, **kw}

def q(id, prompt, answer, options, explain):
    return {"id": id, "prompt": prompt, "answer": answer, "options": options, "explain": explain}

LABS = {
    1: dict(level="Beginner", nav="ldd, which",
        paste={"command": "cat reports/ps-libs.txt", "checks": [
            chk(r"^(/usr)?/bin/ps\s*$", "starts with the full path of ps"),
            chk(r"libc\.so\.6 => /\S*libc\.so\.6", "ldd resolved libc.so.6 to a file"),
            chk(r"=> /\S+", "at least three libraries resolve to a path", min=3),
            chk(r"not found", "no library says not found", absent=True)]},
        quiz=[q("bare", "Why does <code>ldd ps</code> fail when <code>ldd $(which ps)</code> works?", "path",
                [{"value": "path", "label": "ldd needs a path to the file; it doesn't search PATH"}, {"value": "root", "label": "ldd needs root for a bare name"}, {"value": "static", "label": "ps is statically linked"}],
                "Correct. which turns the command name into the path ldd needs."),
              q("vdso", "Where is the file for <code>linux-vdso.so.1</code>?", "kernel",
                [{"value": "kernel", "label": "There isn't one; the kernel provides it"}, {"value": "lib", "label": "/lib/x86_64-linux-gnu"}, {"value": "boot", "label": "/boot"}],
                "Correct. The kernel maps it into every process.")]),
    2: dict(level="Beginner", nav="real name, soname",
        paste={"command": "cat reports/zlib-names.txt", "checks": [
            chk(r"libz\.so\.1 -> libz\.so\.1\.\d", "ls shows the libz.so.1 symlink pointing at the real file"),
            chk(r"SONAME\s+libz\.so\.1\s*$", "objdump shows the embedded soname libz.so.1"),
            chk(r"^libc\.so\.6\s*$", "the name-variant listing includes libc.so.6"),
            chk(r"\bsoname\b", "your explanation mentions the soname", min=2)]},
        quiz=[q("asks", "Which name does a running program ask the loader for?", "soname",
                [{"value": "soname", "label": "The soname, such as <code>libz.so.1</code>"}, {"value": "real", "label": "The real name, such as <code>libz.so.1.3</code>"}, {"value": "linker", "label": "The linker name, <code>libz.so</code>"}],
                "Correct. The soname symlink then points at whichever real file is installed."),
              q("linkername", "Which package usually provides the bare <code>libz.so</code> link?", "dev",
                [{"value": "dev", "label": "The development package (zlib1g-dev)"}, {"value": "lib", "label": "The runtime package (zlib1g)"}, {"value": "ldconfig", "label": "ldconfig creates it"}],
                "Correct. Only the compiler uses the linker name.")]),
    3: dict(level="Beginner", nav="ld.so.conf, ld.so.conf.d",
        paste={"command": "cat reports/search-map.txt", "checks": [
            chk(r"^LD_LIBRARY_PATH=\[", "records the LD_LIBRARY_PATH value"),
            chk(r"^include\s+/etc/ld\.so\.conf\.d/\*\.conf", "ld.so.conf includes /etc/ld.so.conf.d/*.conf"),
            chk(r"^/usr/lib/x86_64-linux-gnu\s*$", "the multiarch .conf file lists /usr/lib/x86_64-linux-gnu"),
            chk(r"\s/usr/lib\s*$", "ls -ld shows /usr/lib")]},
        quiz=[q("opt", "A library sits in <code>/opt/vendor/lib</code> and nothing else was changed. Does the loader find it?", "no",
                [{"value": "no", "label": "No. That folder isn't configured and isn't in LD_LIBRARY_PATH"}, {"value": "yes", "label": "Yes, the loader searches all of /opt"}, {"value": "path", "label": "Yes, if /opt/vendor/lib is in PATH"}],
                "Correct. It needs a .conf file plus ldconfig, or LD_LIBRARY_PATH.")]),
    4: dict(level="Beginner", nav="ld-linux, ld.so",
        paste={"command": "cat reports/loader.txt", "checks": [
            chk(r"program interpreter: /lib64/ld-linux-x86-64\.so\.2", "readelf names /lib64/ld-linux-x86-64.so.2 as the interpreter"),
            chk(r"ld-linux-x86-64\.so\.2:.*\bELF 64-bit", "file shows the loader is a 64-bit ELF file"),
            chk(r"libc\.so\.6 => /\S+", "the loader's --list output resolves libc.so.6"),
            chk(r"PID\s+TTY\s+TIME\s+CMD", "ps ran through the loader and printed your shell")]},
        quiz=[q("ldvsld", "What is the difference between <code>ld</code> and <code>ld.so</code>?", "build",
                [{"value": "build", "label": "ld links at build time; ld.so loads libraries at run time"}, {"value": "same", "label": "They are the same program"}, {"value": "rev", "label": "ld runs programs; ld.so compiles them"}],
                "Correct. On 64-bit x86, ld.so is ld-linux-x86-64.so.2.")]),
    5: dict(level="Intermediate", nav="ldconfig -p, ld.so.cache",
        paste={"command": "cat reports/cache-check.txt", "checks": [
            chk(r"^\S+\s+\d+\s+root\s+root\s.*/etc/ld\.so\.cache\s*$", "ls shows /etc/ld.so.cache owned by root"),
            chk(r"^\d+ libs found in cache", "ldconfig -p reports how many libs the cache holds"),
            chk(r"libz\.so\.1 \(libc6,x86-64\) => /\S*libz\.so\.1", "the cache has a libz.so.1 entry with a path")]},
        quiz=[q("pread", "What does <code>ldconfig -p</code> read?", "cache",
                [{"value": "cache", "label": "/etc/ld.so.cache"}, {"value": "disk", "label": "Every library directory on disk"}, {"value": "conf", "label": "/etc/ld.so.conf"}],
                "Correct. It can be stale until ldconfig runs again."),
              q("nx", "What do <code>-N</code> and <code>-X</code> tell ldconfig?", "nox",
                [{"value": "nox", "label": "Don't rebuild the cache, and don't update links"}, {"value": "new", "label": "Build a new cache from scratch"}, {"value": "verbose", "label": "Print extra detail"}],
                "Correct. With -v that makes a read-only browse.")]),
    6: dict(level="Intermediate", nav="Triage: ldd, cache, disk",
        paste={"command": "cat reports/top-triage.txt", "checks": [
            chk(r"libproc(ps|2)\.so\.\d+ => /\S+", "ldd resolves top's process library"),
            chk(r"libproc(ps|2)\.so\.\d+ \(libc6", "the cache lists the process library"),
            chk(r"^[l-]\S+\s+\d+\s+\S+\s+\S+\s.*libproc(ps|2)\.so", "ls -l shows the library file on disk"),
            chk(r"not found", "nothing is missing", absent=True)]},
        quiz=[q("stale", "ldd says <em>not found</em>, but <code>ldconfig -p</code> still lists the library. Most likely cause?", "deleted",
                [{"value": "deleted", "label": "The file was deleted and the cache is stale"}, {"value": "conf", "label": "Its directory isn't in ld.so.conf"}, {"value": "path", "label": "LD_LIBRARY_PATH is empty"}],
                "Correct. Reinstall the owning package; dpkg -S finds it.")]),
    7: dict(level="Intermediate", nav="gcc -shared, ldconfig -n",
        paste={"command": "cat reports/greet-names.txt", "checks": [
            chk(r"libgreet\.so -> libgreet\.so\.1\s*$", "the linker name libgreet.so points at libgreet.so.1"),
            chk(r"libgreet\.so\.1 -> libgreet\.so\.1\.0\.0", "the soname link points at the real file"),
            chk(r"^-\S+\s.*\slibgreet\.so\.1\.0\.0\s*$", "the real file libgreet.so.1.0.0 exists"),
            chk(r"SONAME\s+libgreet\.so\.1\s*$", "the embedded soname is libgreet.so.1")]},
        quiz=[q("nlinks", "Which link does <code>ldconfig -n lib</code> create?", "soname",
                [{"value": "soname", "label": "The soname link, libgreet.so.1"}, {"value": "linker", "label": "The linker-name link, libgreet.so"}, {"value": "both", "label": "Both links"}],
                "Correct. You make the linker-name link yourself with ln -s.")]),
    8: dict(level="Intermediate", nav="cannot open shared object",
        paste={"command": "cat reports/greet-failure.txt", "checks": [
            chk(r"libgreet\.so\.1: cannot open shared object file", "the program failed to load libgreet.so.1"),
            chk(r"not found", "ldd shows exactly one not found line", count=1),
            chk(r"NEEDED\s+libgreet\.so\.1\s*$", "NEEDED lists libgreet.so.1")]},
        quiz=[q("dashL", "Why doesn't <code>-Llib</code> at build time help the program at run time?", "build",
                [{"value": "build", "label": "-L only guides the build-time linker and isn't stored in the program"}, {"value": "rel", "label": "Relative paths are ignored at run time"}, {"value": "root", "label": "Only root's programs keep -L"}],
                "Correct. The loader never learns about lib/.")]),
    9: dict(level="Advanced", nav="LD_LIBRARY_PATH",
        paste={"command": "cat reports/ldpath-fix.txt", "checks": [
            chk(r"^libgreet says hello to web01", "the program ran with LD_LIBRARY_PATH set"),
            chk(r"^/\S+/lib(:\S+)?\s*$", "the exported value starts with your lib folder, with no leading colon"),
            chk(r"libgreet\.so\.1 => /\S+/lib/libgreet\.so\.1", "ldd found libgreet in your lib folder"),
            chk(r"cannot open shared object file", "the run after unset failed again")]},
        quiz=[q("colon", "Why is <code>LD_LIBRARY_PATH=:/opt/lib</code> risky?", "cwd",
                [{"value": "cwd", "label": "The empty entry means the current directory is searched"}, {"value": "ign", "label": "The loader ignores the whole value"}, {"value": "root", "label": "It only works for root"}],
                "Correct. Use ${VAR:+:$VAR} to add the colon only when needed."),
              q("life", "How long does an exported LD_LIBRARY_PATH last?", "shell",
                [{"value": "shell", "label": "For that shell and its children"}, {"value": "boot", "label": "Until reboot"}, {"value": "ever", "label": "Permanently"}],
                "Correct. A new login doesn't see it.")]),
    10: dict(level="Advanced", nav="ld.so.conf.d, ldconfig",
        paste={"command": "cat reports/ldconf-fix.txt", "checks": [
            chk(r"libgreet\.so\.1 \(libc6,x86-64\) => /\S+/libgreet\.so\.1", "the cache has a libgreet.so.1 entry"),
            chk(r"^libgreet says hello to web01", "the program ran with no LD_LIBRARY_PATH"),
            chk(r"^0\s*$", "the final count is 0, so the cleanup worked")]},
        quiz=[q("noeffect", "You added <code>/etc/ld.so.conf.d/vendor.conf</code>. What else must happen?", "ldconfig",
                [{"value": "ldconfig", "label": "Run <code>sudo ldconfig</code> to rebuild the cache"}, {"value": "reboot", "label": "Reboot"}, {"value": "nothing", "label": "Nothing; the loader reads the file directly"}],
                "Correct. The loader reads the cache, not the .conf files.")]),
    11: dict(level="Advanced", nav="Static vs dynamic, ar",
        paste={"command": "cat reports/static-vs-dynamic.txt", "checks": [
            chk(r"greetapp-static:.*statically linked", "file shows the static build is statically linked"),
            chk(r"greetapp-archive:.*dynamically linked", "the archive build is still dynamic (it needs libc)"),
            chk(r"not a dynamic executable", "ldd says the static build is not a dynamic executable"),
            chk(r"libgreet\.so", "neither build needs libgreet.so", absent=True)]},
        quiz=[q("lsize", "A libc security fix is installed. Which programs get it without a rebuild?", "dyn",
                [{"value": "dyn", "label": "Dynamically linked ones, after they restart"}, {"value": "static", "label": "Statically linked ones"}, {"value": "both", "label": "Both kinds"}],
                "Correct. Static programs carry their own frozen copy."),
              q("dota", "Which file is a static library?", "a",
                [{"value": "a", "label": "<code>libgreet.a</code>"}, {"value": "so", "label": "<code>libgreet.so</code>"}, {"value": "so1", "label": "<code>libgreet.so.1</code>"}],
                "Correct. .a is an ar archive; .so is shared.")]),
    12: dict(level="Advanced", nav="NEEDED, /proc/PID/maps",
        paste={"command": "cat reports/dep-audit.txt", "checks": [
            chk(r"NEEDED\s+\S+\.so", "objdump lists ssh's direct NEEDED libraries", min=2),
            chk(r"NEEDED\s+libc\.so\.6", "libc.so.6 is a direct dependency"),
            chk(r"^\s*\d+\s*$", "the ldd line count is there"),
            chk(r"^[0-9a-f]+-[0-9a-f]+\s+\S+\s.*/libc\.so\.6(\s+\(deleted\))?\s*$", "the maps line shows the libc.so.6 your shell has mapped")]},
        quiz=[q("running", "libc was just updated on disk. What about processes already running?", "old",
                [{"value": "old", "label": "They keep the old copy until restarted"}, {"value": "new", "label": "They switch to the new copy at once"}, {"value": "crash", "label": "They crash"}],
                "Correct. /proc/PID/maps marks the replaced file (deleted).")]),
}

TRAP_QUIZ = [
    q("tq1", "Which file does <code>ldconfig -p</code> print?", "cache",
      [{"value": "cache", "label": "/etc/ld.so.cache"}, {"value": "conf", "label": "/etc/ld.so.conf"}, {"value": "dir", "label": "/etc/ld.so.conf.d"}], "Correct."),
    q("tq2", "Which file must you never edit by hand?", "cache",
      [{"value": "cache", "label": "/etc/ld.so.cache"}, {"value": "conf", "label": "/etc/ld.so.conf"}, {"value": "d", "label": "A file in /etc/ld.so.conf.d"}], "Correct. It's binary; rebuild it with ldconfig."),
    q("tq3", "What is the loader's search order?", "order",
      [{"value": "order", "label": "LD_LIBRARY_PATH, then the cache, then /lib and /usr/lib"}, {"value": "o2", "label": "The cache, then LD_LIBRARY_PATH, then /lib"}, {"value": "o3", "label": "PATH, then the cache"}], "Correct. RPATH/RUNPATH in the binary can also play a part."),
    q("tq4", "Which variable helps the loader find libraries?", "ldlp",
      [{"value": "path", "label": "<code>PATH</code>"}, {"value": "ldlp", "label": "<code>LD_LIBRARY_PATH</code>"}, {"value": "libpath", "label": "<code>LIBPATH</code>"}], "Correct. PATH is only for commands."),
    q("tq5", "In <code>libz.so.1.3</code>, <code>libz.so.1</code> and <code>libz.so</code>, which is the soname?", "so1",
      [{"value": "real", "label": "<code>libz.so.1.3</code>"}, {"value": "so1", "label": "<code>libz.so.1</code>"}, {"value": "so", "label": "<code>libz.so</code>"}], "Correct."),
    q("tq6", "Which ldconfig option processes only the directories named on the command line?", "n",
      [{"value": "p", "label": "<code>-p</code>"}, {"value": "v", "label": "<code>-v</code>"}, {"value": "nocache", "label": "<code>-N</code>"}, {"value": "n", "label": "<code>-n</code>"}], "Correct. -N skips rebuilding the cache, which is different."),
    q("tq7", "What does ldd print for a statically linked program?", "notdyn",
      [{"value": "notdyn", "label": "not a dynamic executable"}, {"value": "nf", "label": "A list of not found lines"}, {"value": "libc", "label": "Only libc.so.6"}], "Correct."),
    q("tq8", "What is the safe way to list an untrusted binary's libraries?", "objdump",
      [{"value": "objdump", "label": "<code>objdump -p FILE | grep NEEDED</code>"}, {"value": "ldd", "label": "<code>ldd FILE</code>"}, {"value": "run", "label": "Run it under strace"}], "Correct. It reads the file without running it."),
]

ANSWERS = [
    "<code>ldd $(which agent)</code> (ldd needs the full path). Each line shows the requested name, then <code>=&gt;</code> and the file the loader chose. For an untrusted binary use <code>objdump -p FILE | grep NEEDED</code> instead.",
    "<code>echo /opt/vendor/lib | sudo tee /etc/ld.so.conf.d/vendor.conf</code>, then <code>sudo ldconfig</code>. Confirm with <code>ldconfig -p | grep LIBNAME</code> and <code>ldd PROGRAM</code>.",
    "<code>LD_LIBRARY_PATH=/path/to/lib ./app</code> for one run, or <code>export LD_LIBRARY_PATH=/path/to/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}</code> for that shell. Nothing under /etc changes, and it ends with the shell.",
    "Programs record the soname <code>libz.so.1</code>, not the real file name. The <code>libz.so.1</code> symlink moves to the new real file (libz.so.1.3.x), so programs keep working. Only a major version change (libz.so.2) would need relinking.",
    "<code>ldd $(which top)</code> shows which library is <em>not found</em>. Then check the cache (<code>ldconfig -p | grep libproc</code>) and the disk (<code>ls -l</code> the file). Missing on disk: reinstall the package (<code>dpkg -S</code> finds it). On disk but not cached: <code>sudo ldconfig</code>.",
    "Link it statically, for example <code>gcc -static app.c greet.c -o app-static</code>. <code>file</code> shows <em>statically linked</em> and <code>ldd</code> says <em>not a dynamic executable</em>.",
    "Search the maps for the replaced file, for example <code>sudo grep -l 'libc.so.6 (deleted)' /proc/[0-9]*/maps</code>. Running processes keep the old copy mapped until they restart, so restart those services or reboot.",
]
