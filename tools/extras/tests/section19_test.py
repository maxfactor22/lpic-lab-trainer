# Checks the Section 19 paste checks against realistic Linux Mint output.
# For each lab: the good sample must pass every check, the broken one must fail at least one.
# Labs 1 and 3 use the practice inittab and rc.d tree from the Lab Setup, so their output is exact.
# Run from the app folder: python tools/extras/tests/section19_test.py
import os, re, sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import section19 as S

H = "/home/max/lpic1-section19"

GOOD, BAD = {}, {}

GOOD[1] = """id:3:initdefault:
3
"""
BAD[1] = "id:3:initdefault:\n"

GOOD[2] = """N 5
         run-level 5  2026-11-09 08:12
graphical.target
"""
BAD[2] = "N 5\ngraphical.target\n"

GOOD[3] = f"""total 0
lrwxrwxrwx 1 max max 15 Nov  9 10:02 K15httpd -> ../init.d/httpd
lrwxrwxrwx 1 max max 17 Nov  9 10:02 S10network -> ../init.d/network
lrwxrwxrwx 1 max max 14 Nov  9 10:02 S55sshd -> ../init.d/sshd
lrwxrwxrwx 1 max max 15 Nov  9 10:02 S90crond -> ../init.d/crond
samples/rc.d/rc3.d/K15httpd -> {H}/samples/rc.d/init.d/httpd
samples/rc.d/rc3.d/S10network -> {H}/samples/rc.d/init.d/network
samples/rc.d/rc3.d/S55sshd -> {H}/samples/rc.d/init.d/sshd
samples/rc.d/rc3.d/S90crond -> {H}/samples/rc.d/init.d/crond
1d0
< K15httpd
3a3
> S85httpd
"""
BAD[3] = GOOD[3].split("1d0")[0]

GOOD[4] = """acpid
alsa-utils
anacron
apparmor
avahi-daemon
bluetooth
cron
cups
dbus
kmod
networking
procps
rsyslog
udev
ufw
total 0
lrwxrwxrwx 1 root root 15 Aug  2  2024 S01acpid -> ../init.d/acpid
lrwxrwxrwx 1 root root 17 Aug  2  2024 S01anacron -> ../init.d/anacron
lrwxrwxrwx 1 root root 14 Aug  2  2024 S01cron -> ../init.d/cron
lrwxrwxrwx 1 root root 14 Aug  2  2024 S01cups -> ../init.d/cups
lrwxrwxrwx 1 root root 17 Aug  2  2024 S01rsyslog -> ../init.d/rsyslog
ls: cannot access '/etc/rc.d': No such file or directory
● cron.service - Regular background program processing daemon
     Loaded: loaded (/usr/lib/systemd/system/cron.service; enabled; preset: enabled)
     Active: active (running) since Mon 2026-11-09 08:12:31 EST; 2h 3min ago
       Docs: man:cron(8)
   Main PID: 812 (cron)
      Tasks: 1 (limit: 4558)
     Memory: 412.0K (peak: 1.3M)
        CPU: 41ms
     CGroup: /system.slice/cron.service
             └─812 /usr/sbin/cron -f -P
● cron.service - Regular background program processing daemon
     Loaded: loaded (/usr/lib/systemd/system/cron.service; enabled; preset: enabled)
     Active: active (running) since Mon 2026-11-09 08:12:31 EST; 2h 3min ago
       Docs: man:cron(8)
   Main PID: 812 (cron)
      Tasks: 1 (limit: 4558)
     Memory: 412.0K (peak: 1.3M)
        CPU: 41ms
     CGroup: /system.slice/cron.service
             └─812 /usr/sbin/cron -f -P
"""
BAD[4] = GOOD[4].replace("active (running)", "inactive (dead)")

GOOD[5] = """lrwxrwxrwx 1 root root 15 Jul  9  2024 /usr/lib/systemd/system/runlevel0.target -> poweroff.target
lrwxrwxrwx 1 root root 13 Jul  9  2024 /usr/lib/systemd/system/runlevel1.target -> rescue.target
lrwxrwxrwx 1 root root 17 Jul  9  2024 /usr/lib/systemd/system/runlevel2.target -> multi-user.target
lrwxrwxrwx 1 root root 17 Jul  9  2024 /usr/lib/systemd/system/runlevel3.target -> multi-user.target
lrwxrwxrwx 1 root root 17 Jul  9  2024 /usr/lib/systemd/system/runlevel4.target -> multi-user.target
lrwxrwxrwx 1 root root 16 Jul  9  2024 /usr/lib/systemd/system/runlevel5.target -> graphical.target
lrwxrwxrwx 1 root root 13 Jul  9  2024 /usr/lib/systemd/system/runlevel6.target -> reboot.target
graphical.target
/usr/lib/systemd/system/graphical.target
"""
BAD[5] = """ls: cannot access '/usr/lib/systemd/system/runlevel*.target': No such file or directory
graphical.target
/usr/lib/systemd/system/graphical.target
"""

GOOD[6] = """UNIT FILE                                  STATE           PRESET
accounts-daemon.service                    enabled         enabled
acpid.service                              disabled        enabled
alsa-restore.service                       static          -
anacron.service                            enabled         enabled
autovt@.service                            alias           -
cron.service                               enabled         enabled
cups.service                               enabled         enabled
dbus.service                               static          -
getty@.service                             enabled         enabled
rsync.service                              disabled        enabled
ssh.service                                disabled        enabled

11 unit files listed.
enabled: 5
disabled: 3
static: 2
  UNIT                   LOAD   ACTIVE SUB    DESCRIPTION
  basic.target           loaded active active Basic System
  cryptsetup.target      loaded active active Local Encrypted Volumes
  getty.target           loaded active active Login Prompts
  graphical.target       loaded active active Graphical Interface
  local-fs-pre.target    loaded active active Preparation for Local File Systems
  local-fs.target        loaded active active Local File Systems
  multi-user.target      loaded active active Multi-User System
  network.target         loaded active active Network
  sysinit.target         loaded active active System Initialization

Legend: LOAD   → Reflects whether the unit definition was properly loaded.
        ACTIVE → The high-level unit activation state, i.e. generalization of SUB.
        SUB    → The low-level unit activation state, values depend on unit type.

9 loaded units listed. Pass --all to see loaded but inactive units, too.
To show all installed unit files use 'systemctl list-unit-files'.
"""
BAD[6] = GOOD[6].replace("enabled: 5\ndisabled: 3\nstatic: 2\n", "")

GOOD[7] = """# /usr/lib/systemd/system/cron.service
[Unit]
Description=Regular background program processing daemon
Documentation=man:cron(8)
After=remote-fs.target nss-user-lookup.target

[Service]
EnvironmentFile=-/etc/default/cron
ExecStart=/usr/sbin/cron -f -P $EXTRA_OPTS
IgnoreSIGPIPE=false
KillMode=process
Restart=on-failure
SyslogFacility=cron

[Install]
WantedBy=multi-user.target
FragmentPath=/usr/lib/systemd/system/cron.service
dbus-org.freedesktop.ModemManager1.service
dbus-org.freedesktop.timesync1.service
display-manager.service
getty.target.wants
graphical.target.wants
multi-user.target.wants
network-online.target.wants
sockets.target.wants
sysinit.target.wants
timers.target.wants
accounts-daemon.service
acpid.path
acpid.service
acpid.socket
alsa-restore.service
alsa-state.service
alsa-utils.service
anacron.service
anacron.timer
apparmor.service
journald.conf
logind.conf
network/
system/
system.conf
user/
user.conf
"""
BAD[7] = "No files found for cron.service.\nFragmentPath=\n" + GOOD[7].split("FragmentPath=/usr/lib/systemd/system/cron.service\n")[1]

GOOD[8] = f"""● lab-heartbeat.service - Lab heartbeat practice service
     Loaded: loaded (/etc/systemd/system/lab-heartbeat.service; disabled; preset: enabled)
     Active: active (running) since Mon 2026-11-09 10:20:11 EST; 8ms ago
   Main PID: 4321 (sleep)
      Tasks: 1 (limit: 4558)
     Memory: 220.0K (peak: 220.0K)
        CPU: 2ms
     CGroup: /system.slice/lab-heartbeat.service
             └─4321 /usr/bin/sleep infinity

Nov 09 10:20:11 mint systemd[1]: Started lab-heartbeat.service - Lab heartbeat practice service.
lrwxrwxrwx 1 root root 41 Nov  9 10:20 /etc/systemd/system/multi-user.target.wants/lab-heartbeat.service -> /etc/systemd/system/lab-heartbeat.service
active
enabled
"""
BAD[8] = GOOD[8].split("lrwxrwxrwx")[0] + "ls: cannot access '/etc/systemd/system/multi-user.target.wants/lab-heartbeat.service': No such file or directory\nactive\ndisabled\n"

GOOD[9] = """● lab-heartbeat.service - Lab heartbeat practice service
     Loaded: loaded (/etc/systemd/system/lab-heartbeat.service; enabled; preset: enabled)
     Active: active (running) since Mon 2026-11-09 10:20:11 EST; 6min ago
   Main PID: 4321 (sleep)
      Tasks: 1 (limit: 4558)
     Memory: 220.0K (peak: 220.0K)
        CPU: 2ms
     CGroup: /system.slice/lab-heartbeat.service
             └─4321 /usr/bin/sleep infinity
Unit lab-heartbeat.service could not be found.
"""
BAD[9] = GOOD[9].replace("Unit lab-heartbeat.service could not be found.\n", """○ lab-heartbeat.service - Lab heartbeat practice service
     Loaded: loaded (/etc/systemd/system/lab-heartbeat.service; disabled; preset: enabled)
     Active: inactive (dead)
""")

GOOD[10] = """running
  UNIT LOAD ACTIVE SUB DESCRIPTION

0 loaded units listed.
graphical.target
● ├─accounts-daemon.service
● ├─lightdm.service
● ├─udisks2.service
● └─multi-user.target
●   ├─anacron.service
●   ├─cron.service
●   ├─cups.service
●   ├─NetworkManager.service
●   ├─rsyslog.service
●   ├─basic.target
●   │ ├─-.mount
●   │ ├─paths.target
●   │ ├─slices.target
●   │ ├─sockets.target
●   │ ├─sysinit.target
●   │ └─timers.target
●   ├─getty.target
●   └─remote-fs.target
Rescue plan for web01: sudo systemctl isolate rescue.target (same as init 1 / telinit 1),
or add systemd.unit=rescue.target (or 1, or single) to the kernel line at boot.
emergency.target is the more minimal option.
"""
BAD[10] = GOOD[10].split("Rescue plan")[0]

GOOD[11] = """is y
is n
is y
"""
BAD[11] = "is y\nis y\nis y\n"

GOOD[12] = """USEC=1762745400000000
WARN_WALL=1
MODE=poweroff
UID=0
WALL_MESSAGE=Practice notice: db01 reboot drill, no action needed
running
"""
BAD[12] = GOOD[12].replace("running\n", "scheduled\nrunning\n")

GOOD[13] = """lrwxrwxrwx 1 root root 14 Jul  9  2024 /usr/sbin/shutdown -> ../bin/systemctl
lrwxrwxrwx 1 root root 14 Jul  9  2024 /usr/sbin/halt -> ../bin/systemctl
lrwxrwxrwx 1 root root 14 Jul  9  2024 /usr/sbin/poweroff -> ../bin/systemctl
lrwxrwxrwx 1 root root 14 Jul  9  2024 /usr/sbin/reboot -> ../bin/systemctl
lrwxrwxrwx 1 root root 14 Jul  9  2024 /usr/sbin/telinit -> ../bin/systemctl
lrwxrwxrwx 1 root root 22 Jul  9  2024 /usr/sbin/init -> ../lib/systemd/systemd
acpid.path                                   enabled         enabled
acpid.service                                disabled        enabled
acpid.socket                                 enabled         enabled
shutdown -h now: halt or power off now
shutdown -H: halt only
shutdown -P: power off
shutdown -r 22:30: reboot at 22:30
shutdown +10 'msg': shut down in 10 minutes with a message
shutdown -c: cancel a pending shutdown
halt -p: power off, same as poweroff
systemctl poweroff: power off
systemctl reboot: reboot
systemctl halt: halt
systemctl isolate poweroff.target: switch to the poweroff target
"""
BAD[13] = GOOD[13].split("shutdown -h now")[0]

# Mint 21 (systemd 249) spellings of the same results.
MINT21 = {
    7: GOOD[7].replace("/usr/lib/systemd/system/cron.service", "/lib/systemd/system/cron.service"),
    13: GOOD[13].replace("../bin/systemctl", "/bin/systemctl").replace("../lib/systemd/systemd", "/lib/systemd/systemd"),
}


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
        if num in MINT21:
            m_ok = all(ok for ok, _, _ in results(checks, MINT21[num]))
            print(f"    Mint 21 sample {'PASS' if m_ok else 'FAIL'}")
            g_ok = g_ok and m_ok
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
