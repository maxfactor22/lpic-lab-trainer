/* Short manual, info and help pages for the practice terminal.
   They are written for this trainer and follow the real layout (NAME, SYNOPSIS,
   DESCRIPTION...). The wording is not copied from the real pages, and the real
   pages on your VM are longer. */
(function () {
  "use strict";
  const man = (section, summary, text) => ({ section, summary, text });

  window.LPIC.docs = {
    man: {
      uname: man(1, "print system information", `UNAME(1)                      User Commands                      UNAME(1)

NAME
       uname - print system information

SYNOPSIS
       uname [OPTION]...

DESCRIPTION
       Print facts about the running kernel and machine. With no OPTION,
       uname behaves as if -s was given.

       -a, --all
              print every field below, in this order, leaving out -p
              and -i when they are unknown

       -s, --kernel-name
              print the kernel name

       -n, --nodename
              print the network node hostname

       -r, --kernel-release
              print the kernel release

       -v, --kernel-version
              print the kernel version (build information)

       -m, --machine
              print the machine hardware name

       -p, --processor
              print the processor type (often "unknown")

       -i, --hardware-platform
              print the hardware platform (often "unknown")

       -o, --operating-system
              print the operating system

       --help display this help and exit

       --version
              output version information and exit

EXAMPLES
       uname -r
              Show only the kernel release, for example when checking
              which kernel a driver was built for.

SEE ALSO
       arch(1), uname(2)

       Full documentation is available locally with: info '(coreutils) uname invocation'

GNU coreutils 9.4                 April 2024                       UNAME(1)`),

      man: man(1, "an interface to the system reference manuals", `MAN(1)                     Manual pager utils                     MAN(1)

NAME
       man - an interface to the system reference manuals

SYNOPSIS
       man [man options] [[section] page ...] ...
       man -k [apropos options] regexp ...
       man -f [whatis options] page ...

DESCRIPTION
       man finds and displays a manual page. Give it a page name, usually
       the name of a command, and optionally a section number.

       The manual is split into numbered sections:

       1   Executable programs or shell commands
       2   System calls (functions provided by the kernel)
       3   Library calls (functions within program libraries)
       4   Special files (usually found in /dev)
       5   File formats and conventions, e.g. /etc/passwd
       6   Games
       7   Miscellaneous, e.g. man(7), groff(7)
       8   System administration commands (usually only for root)
       9   Kernel routines [non-standard]

       A page is divided into sections with conventional headings:
       NAME, SYNOPSIS, DESCRIPTION, OPTIONS, EXIT STATUS, FILES,
       EXAMPLES, SEE ALSO and others.

   Reading conventions in SYNOPSIS
       bold text      type exactly as shown
       italic text    replace with a suitable argument
       [-abc]         any or all of the arguments in brackets are optional
       -a|-b          the options separated by | can't be used together
       argument ...   the argument can be repeated

KEYS WHILE READING
       Space, f, PageDown     forward one screen
       b, PageUp              back one screen
       Down arrow, j, Enter   forward one line
       Up arrow, k            back one line
       /pattern               search forward for pattern
       ?pattern               search backward for pattern
       n                      repeat the last search
       g / G                  go to the first / last line
       h                      show the pager's help
       q                      quit

OPTIONS
       -k, --apropos
              search the short descriptions for a keyword (same as
              apropos)

       -f, --whatis
              show the one-line description of a page (same as whatis)

       -a, --all
              show every matching page in turn, not just the first

EXAMPLES
       man ls
              Show the manual page for ls.

       man 5 passwd
              Show the file-format page for /etc/passwd rather than the
              passwd command in section 1.

       man -k partition
              List pages whose description mentions "partition".

SEE ALSO
       apropos(1), whatis(1), less(1), info(1), mandb(8)

2.12.0                             2024-04-07                         MAN(1)`),

      ls: man(1, "list directory contents", `LS(1)                         User Commands                         LS(1)

NAME
       ls - list directory contents

SYNOPSIS
       ls [OPTION]... [FILE]...

DESCRIPTION
       List information about each FILE (the current directory by
       default). Entries are sorted alphabetically.

       -a, --all
              include entries whose names start with .

       -A, --almost-all
              like -a, but leave out . and ..

       -d, --directory
              list directories themselves, not their contents

       -F, --classify
              append an indicator such as / to directory names

       -l     use a long listing format

       -R, --recursive
              list subdirectories recursively

       -1     list one file per line

SEE ALSO
       dir(1), stat(1)

GNU coreutils 9.4                 April 2024                          LS(1)`),

      pwd: man(1, "print name of current/working directory", `PWD(1)                        User Commands                        PWD(1)

NAME
       pwd - print name of current/working directory

SYNOPSIS
       pwd [OPTION]...

DESCRIPTION
       Print the full path of the current working directory.

       -L, --logical
              use PWD from the environment, even if it contains symlinks

       -P, --physical
              resolve all symlinks

       Your shell may have its own version of pwd, which usually takes
       priority over the program described here. Run type pwd to see
       which one you get, and help pwd to read about the shell's version.

GNU coreutils 9.4                 April 2024                         PWD(1)`),

      which: man(1, "locate a command", `WHICH(1)                General Commands Manual               WHICH(1)

NAME
       which - locate a command

SYNOPSIS
       which [-a] filename ...

DESCRIPTION
       which prints the full path of the program that would run for each
       name, by searching the directories in PATH. It does not know about
       shell builtins, aliases or functions.

OPTIONS
       -a     print every match in PATH, not just the first

EXIT STATUS
       0      all names were found
       1      one or more names were not found

                                 29 Jun 2016                         WHICH(1)`),

      info: man(1, "read Info documents", `INFO(1)                       User Commands                       INFO(1)

NAME
       info - read Info documents

SYNOPSIS
       info [OPTION]... [MENU-ITEM...]

DESCRIPTION
       Read documentation in Info format. Info documents are split into
       nodes joined by links and menus, a bit like web pages. If there is
       no Info document for a topic, info shows the man page instead.

KEYS
       Space / Backspace   scroll forward / back
       n / p               next / previous node
       u                   up one level
       Enter               follow the link under the cursor
       q                   quit

SEE ALSO
       man(1)

GNU texinfo 7.1                    April 2024                         INFO(1)`),

      cat: man(1, "concatenate files and print on the standard output", `CAT(1)                        User Commands                        CAT(1)

NAME
       cat - concatenate files and print on the standard output

SYNOPSIS
       cat [OPTION]... [FILE]...

DESCRIPTION
       Join FILEs together and print them on standard output. With no
       FILE, or when FILE is -, read standard input.

       -n, --number
              number all output lines

GNU coreutils 9.4                 April 2024                         CAT(1)`),

      date: man(1, "print or set the system date and time", `DATE(1)                       User Commands                       DATE(1)

NAME
       date - print or set the system date and time

SYNOPSIS
       date [OPTION]... [+FORMAT]

DESCRIPTION
       Show the current time in the given FORMAT, or set the system date
       (which needs root).

GNU coreutils 9.4                 April 2024                        DATE(1)`),

      bash: man(1, "GNU Bourne-Again SHell", `BASH(1)                   General Commands Manual                  BASH(1)

NAME
       bash - GNU Bourne-Again SHell

SYNOPSIS
       bash [options] [command_string | file]

DESCRIPTION
       Bash is the command language interpreter that reads your commands
       at the prompt. This practice copy only covers what the lessons use.

       --version
              print the version and exit

SHELL BUILTIN COMMANDS
       Builtins such as cd, pwd, history, type and help run inside the
       shell itself. Read about any of them with help NAME.

GNU Bash 5.2                      2022 September 19                    BASH(1)`),
    },

    info: {
      uname: { text: `File: coreutils.info,  Node: uname invocation,  Next: hostname invocation,  Up: System context

21.4 'uname': Print system information
======================================

'uname' prints facts about the machine and the operating system it is
running.  When it is given several options, it prints the fields in a
fixed order, separated by spaces:

     uname [OPTION]...

   With no options, 'uname' acts like 'uname -s'.

   The program accepts the following options.

'-a'
'--all'
     Print every field.  Unknown processor and platform fields are left
     out.

'-i'
'--hardware-platform'
     Print the hardware platform name, often "unknown".

'-m'
'--machine'
     Print the machine (hardware) type, such as 'x86_64'.

'-n'
'--nodename'
     Print the network node name, which is usually the host name.

'-p'
'--processor'
     Print the processor type, often "unknown".

'-o'
'--operating-system'
     Print the name of the operating system.

'-r'
'--kernel-release'
     Print the kernel release.

'-s'
'--kernel-name'
     Print the kernel name.

'-v'
'--kernel-version'
     Print the kernel version.  On Linux this is build information,
     such as when and how the kernel was compiled.

   An exit status of zero indicates success.

* Menu:

* hostname invocation::  Print or set the system name.
* hostid invocation::    Print the numeric host identifier.

-----Info: (coreutils)uname invocation, 48 lines --Top-------------------` },
    },

    help: {
      "": `GNU bash, version 5.2.21(1)-release (x86_64-pc-linux-gnu)
These shell commands are defined internally.  Type \`help' to see this list.
Type \`help name' to find out more about the function \`name'.
Use \`info bash' to find out more about the shell in general.
Use \`man -k' or \`info' to find out more about commands not in this list.

 alias [-p] [name[=value] ... ]        history [-c] [-d offset] [n] or hist>
 cd [-L|[-P [-e]] [-@]] [dir]          pwd [-LP]
 echo [-neE] [arg ...]                 type [-afptP] name [name ...]
 exit [n]                              unset [-f] [-v] [-n] [name ...]
 export [-fn] [name[=value] ...]       help [-dms] [pattern ...]
`,
      pwd: `pwd: pwd [-LP]
    Print the name of the current working directory.

    Options:
      -L        print the value of $PWD if it names the current
                working directory
      -P        print the physical directory, without any symbolic links

    By default, \`pwd' behaves as if \`-L' were specified.

    Exit Status:
    Returns 0 unless an invalid option is given or the current directory
    cannot be read.
`,
      cd: `cd: cd [-L|[-P [-e]] [-@]] [dir]
    Change the shell working directory.

    Change the current directory to DIR.  With no DIR, go to the value of
    the HOME shell variable.  \`cd -' returns to the previous directory.

    Options:
      -L        follow symbolic links (the default)
      -P        use the physical directory structure

    cd has to be a builtin: a separate program could only change its own
    directory, not your shell's.

    Exit Status:
    Returns 0 if the directory is changed, non-zero otherwise.
`,
      help: `help: help [-dms] [pattern ...]
    Display information about builtin commands.

    Shows short summaries of builtin commands.  If PATTERN is given, gives
    detailed help on every command matching PATTERN, otherwise lists the
    builtins.

    Options:
      -d        output a short description for each topic
      -m        display usage in pseudo-manpage format
      -s        output only a short usage synopsis for each topic

    Exit Status:
    Returns success unless PATTERN is not found or an invalid option is given.
`,
      history: `history: history [-c] [-d offset] [n] or history -anrw [filename] or history -ps arg [arg...]
    Display or manipulate the history list.

    Show the history list with line numbers.  An argument of N lists only
    the last N entries.

    Options:
      -c        clear the history list by deleting all of the entries
      -d offset delete the history entry at position OFFSET
      -a        append this session's new lines to the history file
      -n        read lines not already read from the history file
      -r        read the history file and append it to the history list
      -w        write the current history to the history file

    The history file is $HISTFILE, normally ~/.bash_history.

    Exit Status:
    Returns success unless an invalid option is given or an error occurs.
`,
      type: `type: type [-afptP] name [name ...]
    Display information about command type.

    For each NAME, show how it would be interpreted if used as a
    command name: alias, keyword, function, builtin or file.

    Options:
      -a        show every place NAME is found, not just the first
      -t        print a single word: alias, keyword, function, builtin,
                file, or nothing if NAME is not found
      -p        print the path of the file that would run

    Exit Status:
    Returns success if all of the NAMEs are found; fails if any are not.
`,
      echo: `echo: echo [-neE] [arg ...]
    Write arguments to the standard output, separated by spaces and
    followed by a newline.

    Options:
      -n        do not add the trailing newline
      -e        interpret backslash escapes such as \\n and \\t
      -E        do not interpret backslash escapes (the default)
`,
      exit: `exit: exit [n]
    Exit the shell with a status of N.  If N is omitted, the exit status
    is that of the last command executed.
`,
      export: `export: export [-fn] [name[=value] ...] or export -p
    Mark each NAME for automatic export to the environment of
    subsequently executed commands.
`,
      alias: `alias: alias [-p] [name[=value] ... ]
    Define or display aliases.  With no arguments, print the list of
    aliases in the form alias NAME=VALUE.
`,
    },
  };
})();
