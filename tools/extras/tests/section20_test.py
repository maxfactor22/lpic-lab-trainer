# Checks the Section 20 paste checks against realistic Linux Mint output.
# For each lab: the good sample must pass every check, the broken one must fail at least one.
# Run from the app folder: python tools/extras/tests/section20_test.py
import os, re, sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import section20 as S

GOOD, BAD = {}, {}

GOOD[1] = """dpkg: /usr/bin/dpkg
dpkg-reconfigure: /usr/sbin/dpkg-reconfigure
apt: /usr/local/bin/apt
apt-get: /usr/bin/apt-get
apt-cache: /usr/bin/apt-cache
apt-file: /usr/bin/apt-file
rpm: missing
yum: missing
dnf: missing
zypper: missing
apt is /usr/local/bin/apt
apt is /usr/bin/apt
apt is /bin/apt
Binary package: compiled program ready to install. Source package: the original code plus build instructions.
Low-level tools (dpkg, rpm) install one package file and don't fetch dependencies; high-level tools (apt-get, yum, zypper) download from repositories and solve dependencies.
"""
BAD[1] = GOOD[1].replace("rpm: missing", "rpm: /usr/bin/rpm").split("Binary package")[0]

GOOD[2] = """sl_5.02-1build1_amd64.deb
Package: sl
Version: 5.02-1build1
Architecture: amd64
"""
BAD[2] = "sl_5.02-1build1_amd64.deb\n"

GOOD[3] = """ new Debian package, version 2.0.
 size 13254 bytes: control archive=884 bytes.
     680 bytes,    16 lines      control
     349 bytes,     5 lines      md5sums
 Package: sl
 Version: 5.02-1build1
 Architecture: amd64
 Maintainer: Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>
 Installed-Size: 67
 Depends: libc6 (>= 2.34), libncurses6 (>= 6), libtinfo6 (>= 6)
 Section: games
 Priority: optional
 Homepage: https://github.com/mtoyoda/sl
 Description: Correct you if you type `sl' by mistake
  Sl is a program that can display animations aimed to correct you
  if you type 'sl' by mistake.
  SL stands for Steam Locomotive.
drwxr-xr-x root/root         0 2024-03-31 08:31 ./
drwxr-xr-x root/root         0 2024-03-31 08:31 ./usr/
drwxr-xr-x root/root         0 2024-03-31 08:31 ./usr/games/
-rwxr-xr-x root/root     22576 2024-03-31 08:31 ./usr/games/sl
drwxr-xr-x root/root         0 2024-03-31 08:31 ./usr/share/
drwxr-xr-x root/root         0 2024-03-31 08:31 ./usr/share/doc/
drwxr-xr-x root/root         0 2024-03-31 08:31 ./usr/share/doc/sl/
-rw-r--r-- root/root      1213 2014-05-26 03:48 ./usr/share/doc/sl/README.gz
drwxr-xr-x root/root         0 2024-03-31 08:31 ./usr/share/man/
drwxr-xr-x root/root         0 2024-03-31 08:31 ./usr/share/man/man6/
-rw-r--r-- root/root       591 2024-03-31 08:31 ./usr/share/man/man6/sl.6.gz
dpkg-query: package 'sl' is not installed and no information is available
Use dpkg --info (= dpkg-deb --info) to examine archive files.
exit code 1
dpkg-query: no packages found matching sl*
"""
BAD[3] = GOOD[3].replace("dpkg-query: package 'sl' is not installed and no information is available\nUse dpkg --info (= dpkg-deb --info) to examine archive files.\nexit code 1\n",
                         "Package: sl\nStatus: install ok installed\nexit code 0\n")

GOOD[4] = """Status: install ok installed
Version: 5.02-1build1
/.
/usr
/usr/games
/usr/games/sl
/usr/share
/usr/share/doc
/usr/share/doc/sl
/usr/share/doc/sl/README.gz
/usr/share/doc/sl/changelog.Debian.gz
/usr/share/doc/sl/copyright
/usr/share/man
/usr/share/man/man6
/usr/share/man/man6/sl.6.gz
"""
BAD[4] = """Status: install ok unpacked
Version: 5.02-1build1
"""

GOOD[5] = """sl: /usr/games/sl
apt: /usr/bin/apt
cron: /etc/crontab
cowsay: /usr/games/cowsay
tree: /usr/bin/tree
tree: /usr/share/doc/tree/README.gz
tree: /usr/share/doc/tree/TODO
tree: /usr/share/doc/tree/changelog.Debian.gz
tree: /usr/share/doc/tree/copyright
"""
BAD[5] = GOOD[5].replace("cowsay: /usr/games/cowsay\n", "")

GOOD[6] = """sl verify exit 0
??5??????   /etc/apparmor.d/usr.sbin.cups-browsed
??5?????? c /etc/xdg/autostart/mintupdate.desktop
audit exit 0
Reading package lists...
Building dependency tree...
Reading state information...
"""
BAD[6] = GOOD[6].replace("audit exit 0", """The following packages are only half configured, probably due to problems
configuring them the first time.  The configuration should be retried using
dpkg --configure <package> or the configure menu option in dselect:
 lab-notice           Practice package that prints a maintenance notice

audit exit 1""")

GOOD[7] = """ new Debian package, version 2.0.
 size 1052 bytes: control archive=436 bytes.
      21 bytes,     1 lines      conffiles
     215 bytes,     7 lines      control
 Package: lab-notice
 Version: 1.0-1
 Architecture: all
 Maintainer: Lab Admin <admin@example.com>
 Depends: cowsay
 Description: Practice package that prints a maintenance notice
  This package exists only for LPIC-1 practice.
drwxr-xr-x root/root         0 2026-11-09 10:02 ./
drwxr-xr-x root/root         0 2026-11-09 10:02 ./etc/
-rw-r--r-- root/root        48 2026-11-09 10:02 ./etc/lab-notice.conf
drwxr-xr-x root/root         0 2026-11-09 10:02 ./usr/
drwxr-xr-x root/root         0 2026-11-09 10:02 ./usr/bin/
-rwxr-xr-x root/root        65 2026-11-09 10:02 ./usr/bin/lab-notice
reports/extracted/etc/lab-notice.conf
reports/extracted/usr/bin/lab-notice
"""
BAD[7] = GOOD[7].replace("      21 bytes,     1 lines      conffiles\n", "")

GOOD[8] = """Selecting previously unselected package lab-notice.
(Reading database ... 518422 files and directories currently installed.)
Preparing to unpack .../lab-notice_1.0-1_all.deb ...
Unpacking lab-notice (1.0-1) ...
dpkg: dependency problems prevent configuration of lab-notice:
 lab-notice depends on cowsay; however:
  Package cowsay is not installed.

dpkg: error processing package lab-notice (--install):
 dependency problems - leaving unconfigured
Errors were encountered while processing:
 lab-notice
iU  lab-notice     1.0-1        all          Practice package that prints a maintenance notice
ii  cowsay         3.03+dfsg2-8 all          configurable talking cow
ii  lab-notice     1.0-1        all          Practice package that prints a maintenance notice
"""
BAD[8] = GOOD[8].split("ii  cowsay")[0]

GOOD[9] = """rc  lab-notice     1.0-1        all          Practice package that prints a maintenance notice
-rw-r--r-- 1 root root 48 Nov  9 10:20 /etc/lab-notice.conf
dpkg-query: no packages found matching lab-notice
ls: cannot access '/etc/lab-notice.conf': No such file or directory
"""
BAD[9] = """rc  lab-notice     1.0-1        all          Practice package that prints a maintenance notice
-rw-r--r-- 1 root root 48 Nov  9 10:20 /etc/lab-notice.conf
rc  lab-notice     1.0-1        all          Practice package that prints a maintenance notice
-rw-r--r-- 1 root root 48 Nov  9 10:20 /etc/lab-notice.conf
"""

GOOD[10] = """Timezone=America/Denver
* tzdata/Areas: America
* tzdata/Zones/America: Denver
  tzdata/Zones/Africa:
  tzdata/Zones/Etc: UTC
  tzdata/Zones/Europe:
Timezone=America/Denver
"""
BAD[10] = GOOD[10].rsplit("Timezone=America/Denver", 1)[0] + "Timezone=Europe/London\n"

GOOD[11] = """official-package-repositories.list
deb http://packages.linuxmint.com wilma main upstream import backport
deb http://archive.ubuntu.com/ubuntu noble main restricted universe multiverse
deb http://archive.ubuntu.com/ubuntu noble-updates main restricted universe multiverse
deb http://archive.ubuntu.com/ubuntu noble-backports main restricted universe multiverse
deb http://security.ubuntu.com/ubuntu/ noble-security main restricted universe multiverse
Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease
Hit:2 http://security.ubuntu.com/ubuntu noble-security InRelease
Ign:3 http://packages.linuxmint.com wilma InRelease
Get:4 http://archive.ubuntu.com/ubuntu noble-updates InRelease [126 kB]
Hit:5 http://packages.linuxmint.com wilma Release
Hit:7 http://archive.ubuntu.com/ubuntu noble-backports InRelease
type=deb uri=http://archive.ubuntu.com/ubuntu suite=noble components: main restricted universe multiverse
type=deb uri=http://archive.ubuntu.com/ubuntu suite=noble-updates components: main restricted universe multiverse
type=deb uri=http://security.ubuntu.com/ubuntu suite=noble-security components: main restricted universe multiverse
type=deb uri=https://packages.example.com/apt suite=stable components: main
"""
BAD[11] = GOOD[11].split("type=deb")[0]

GOOD[12] = """tree - displays an indented directory tree, in color
Package: tree
Version: 2.1.1-2ubuntu3
Depends: libc6 (>= 2.38)
Description-en: displays an indented directory tree, in color
Description-md5: 06d4f2ac6b8bc8b3a1e8c9b1f1d0e0a1
tree:
  Installed: (none)
  Candidate: 2.1.1-2ubuntu3
  Version table:
     2.1.1-2ubuntu3 500
        500 http://archive.ubuntu.com/ubuntu noble/universe amd64 Packages
tree
  Depends: libc6
tree
Reverse Depends:
  supertree
  ranger
  mc
Package: tree
Version: 2.1.1-2ubuntu3
Priority: optional
Section: universe/utils
Origin: Ubuntu
"""
BAD[12] = GOOD[12].replace("  Candidate: 2.1.1-2ubuntu3\n", "").replace("Depends: libc6 (>= 2.38)\n", "")

GOOD[13] = """NOTE: This is only a simulation!
      apt-get needs root privileges for real execution.
      Keep also in mind that locking is deactivated,
      so don't depend on the relevance to the real current situation!
Reading package lists...
Building dependency tree...
Reading state information...
cowsay is already the newest version (3.03+dfsg2-8).
The following NEW packages will be installed:
  tree
0 upgraded, 1 newly installed, 0 to remove and 14 not upgraded.
Inst tree (2.1.1-2ubuntu3 Ubuntu:24.04/noble [amd64])
Conf tree (2.1.1-2ubuntu3 Ubuntu:24.04/noble [amd64])
Listing...
cowsay/noble,now 3.03+dfsg2-8 all [installed]
sl/noble,now 5.02-1build1 amd64 [installed]
tree/noble,now 2.1.1-2ubuntu3 amd64 [installed]
3
0
Desired=Unknown/Install/Remove/Purge/Hold
| Status=Not/Inst/Conf-files/Unpacked/halF-conf/Half-inst/trig-aWait/Trig-pend
|/ Err?=(none)/Reinst-required (Status,Err: uppercase=bad)
||/ Name           Version      Architecture Description
+++-==============-============-============-=================================
un  cowsay         <none>       <none>       (no description available)
un  sl             <none>       <none>       (no description available)
un  tree           <none>       <none>       (no description available)
"""
BAD[13] = GOOD[13].replace("un  tree           <none>       <none>       (no description available)",
                           "ii  tree           2.1.1-2ubuntu3 amd64      displays an indented directory tree, in color")

GOOD[14] = """Listing...
firefox/wilma 132.0+linuxmint1+wilma amd64 [upgradable from: 131.0.3+linuxmint1+wilma]
libssl3t64/noble-updates,noble-security 3.0.13-0ubuntu3.4 amd64 [upgradable from: 3.0.13-0ubuntu3.1]
linux-generic/noble-updates,noble-security 6.8.0-48.48 amd64 [upgradable from: 6.8.0-45.45]
upgrade: 2
dist-upgrade: 5
The following packages have been kept back:
  linux-generic linux-headers-generic linux-image-generic
2 upgraded, 0 newly installed, 0 to remove and 3 not upgraded.
"""
BAD[14] = GOOD[14].replace("dist-upgrade: 5\n", "")


def results(checks, text):
    out = []
    for c in checks:
        n = len(re.findall(c["re"], text, re.I | re.M))
        ok = n >= c["min"] if "min" in c else n == c["count"] if "count" in c else n == 0 if c.get("absent") else n > 0
        out.append((ok, n, c["say"]))
    return out


def main():
    bad = 0
    for num, lab in S.LABS.items():
        if not lab.get("paste"):
            print(f"Lab {num}: paste=None, skipped")
            continue
        checks = lab["paste"]["checks"]
        good = results(checks, GOOD[num])
        broken = results(checks, BAD[num])
        g_ok = all(ok for ok, _, _ in good)
        b_fails = any(not ok for ok, _, _ in broken)
        print(f"Lab {num}: good {'PASS' if g_ok else 'FAIL'}, broken {'caught' if b_fails else 'NOT CAUGHT'}")
        for ok, n, say in good:
            if not ok:
                print(f"    good sample failed: {say} (matches={n})")
        if not (g_ok and b_fails):
            bad += 1
    n_q = len(S.ANSWERS)
    print(f"{n_q} model answers, {len(S.TRAP_QUIZ)} trap questions")
    assert n_q == 7
    assert [t["id"] for t in S.TRAP_QUIZ] == [f"tq{i}" for i in range(1, 9)]
    for num, lab in S.LABS.items():
        for qq in lab.get("quiz", []):
            vals = [o if isinstance(o, str) else o["value"] for o in qq["options"]]
            assert qq["answer"] in vals, (num, qq["id"])
            assert qq["explain"].startswith("Correct."), (num, qq["id"])
    for qq in S.TRAP_QUIZ:
        vals = [o if isinstance(o, str) else o["value"] for o in qq["options"]]
        assert qq["answer"] in vals, qq["id"]
        assert qq["explain"].startswith("Correct."), qq["id"]
    print("ALL OK" if bad == 0 else f"{bad} lab(s) need work")
    return bad


if __name__ == "__main__":
    sys.exit(main())
