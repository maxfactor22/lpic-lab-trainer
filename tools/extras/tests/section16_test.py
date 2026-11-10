# Checks the Section 16 paste checks against realistic Linux Mint output.
# For each lab: the good sample must pass every check, the broken one must fail at least one.
# Run from the app folder: python tools/extras/tests/section16_test.py
import os, re, sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import section16 as S

H = "/home/max/lpic1-section16"

GOOD, BAD = {}, {}

GOOD[1] = """NAME   FSTYPE FSVER LABEL UUID                                 FSAVAIL FSUSE% MOUNTPOINTS
loop0  ext4   1.0   DATA01 6f1c2a8e-1d55-4b0e-9a8a-3c1f7d2e4b10
sda
├─sda1 vfat   FAT32       4A1B-2C3D                             505.8M     1% /boot/efi
└─sda2 ext4   1.0         0b6c7f54-91a2-4e7d-8c33-5a1d2e3f4b5c   18.2G    35% /
TARGET     SOURCE    FSTYPE OPTIONS
/          /dev/sda2 ext4   rw,relatime,errors=remount-ro
└─/boot/efi /dev/sda1 vfat  rw,relatime,fmask=0077,dmask=0077,codepage=437
UUID=0b6c7f54-91a2-4e7d-8c33-5a1d2e3f4b5c /               ext4    errors=remount-ro 0       1
UUID=4A1B-2C3D  /boot/efi       vfat    umask=0077      0       1
/swapfile                                 none            swap    sw              0       0
NAME      TYPE SIZE USED PRIO
/swapfile file   2G   0B   -2
Recommendation for app02: separate /boot, /home, /var, and /tmp; keep /etc, /bin, /sbin, /lib, and /dev on the root filesystem
"""
BAD[1] = GOOD[1].split("NAME      TYPE")[0]

GOOD[2] = """  UNIT                          LOAD   ACTIVE SUB     DESCRIPTION
  -.mount                       loaded active mounted Root Mount
  boot-efi.mount                loaded active mounted /boot/efi
  dev-hugepages.mount           loaded active mounted Huge Pages File System
  run-user-1000.mount           loaded active mounted /run/user/1000

LOAD   = Reflects whether the unit definition was properly loaded.
ACTIVE = The high-level unit activation state, i.e. generalization of SUB.
SUB    = The low-level unit activation state, values depend on unit type.
4 loaded units listed. Pass --all to see loaded but inactive units, too.
/run/systemd/generator/-.mount
/run/systemd/generator/boot-efi.mount
ls: cannot access '/etc/systemd/system/*.mount': No such file or directory
srv-backup-data.mount
"""
BAD[2] = GOOD[2].replace("srv-backup-data.mount", "srv/backup/data.mount")

GOOD[3] = f"""TARGET                              SOURCE     FSTYPE OPTIONS
{H}/mnt/data /dev/loop0 ext4   rw,relatime
touch: cannot touch 'mnt/data/should-fail.txt': Read-only file system
"""
BAD[3] = GOOD[3].splitlines()[0] + "\n" + GOOD[3].splitlines()[1] + "\n"

GOOD[4] = f"""/dev/loop0: LABEL="DATA01" UUID="6f1c2a8e-1d55-4b0e-9a8a-3c1f7d2e4b10" BLOCK_SIZE="1024" TYPE="ext4"
/dev/loop1: LABEL="ARCHIVE" UUID="9d3e1b2a-7c4f-4a6b-8e2d-1f0a3b5c7d9e" BLOCK_SIZE="512" TYPE="xfs"
NAME  FSTYPE LABEL   UUID
loop0 ext4   DATA01  6f1c2a8e-1d55-4b0e-9a8a-3c1f7d2e4b10
loop1 xfs    ARCHIVE 9d3e1b2a-7c4f-4a6b-8e2d-1f0a3b5c7d9e
total 0
lrwxrwxrwx 1 root root 11 Nov  9 10:12 ARCHIVE -> ../../loop1
lrwxrwxrwx 1 root root 11 Nov  9 10:12 DATA01 -> ../../loop0
/dev/loop0 {H}/mnt/data
lost+found
report.txt
"""
BAD[4] = GOOD[4].replace("report.txt\n", "")

GOOD[5] = f"""UUID=6f1c2a8e-1d55-4b0e-9a8a-3c1f7d2e4b10 {H}/mnt/data ext4 defaults,noatime 0 2
LABEL=ARCHIVE {H}/mnt/archive xfs defaults,noauto 0 0
Success, no errors or warnings detected
/                        : ignored
/boot/efi                : already mounted
none                     : ignored
{H}/mnt/data : successfully mounted
rw,noatime
"""
BAD[5] = GOOD[5].replace(f"{H}/mnt/data ext4", "~/lpic1-section16/mnt/data ext4").replace("rw,noatime\n", "rw,relatime\n")

GOOD[6] = f"""Filesystem      Size  Used Avail Use% Mounted on
/dev/loop0      231M  151M   63M  71% {H}/mnt/data
Filesystem     Type  Size  Used Avail Use% Mounted on
/dev/loop0     ext4  231M  151M   63M  71% {H}/mnt/data
Filesystem     Type  Size  Used Avail Use% Mounted on
/dev/loop0     ext4  231M  151M   63M  71% {H}/mnt/data
Filesystem      Size  Used Avail Use% Mounted on
tmpfs           392M  1.7M  390M   1% /run
/dev/sda2        25G  8.4G   15G  36% /
tmpfs           2.0G     0  2.0G   0% /dev/shm
/dev/sda1       512M  6.1M  506M   2% /boot/efi
/dev/loop0      231M  151M   63M  71% {H}/mnt/data
"""
BAD[6] = GOOD[6].replace("151M   63M  71%", "1.1M  213M   1%")

GOOD[7] = """1.0K	mnt/data/report.txt
1.0K	mnt/data/tmp
5.1M	mnt/data/logs
12K	mnt/data/lost+found
21M	mnt/data/exports
151M	mnt/data/backup.bin
181312	mnt/data
18	mnt/data
48M	/var/log
112M	/var/cache
590M	/var/lib
755M	/var
"""
BAD[7] = GOOD[7].split("48M")[0]

GOOD[8] = f"""Filesystem      Size  Used Avail Use% Mounted on
/dev/loop2       55M   14K   51M   1% {H}/mnt/spool
Filesystem     Inodes IUsed IFree IUse% Mounted on
/dev/loop2        512   512     0  100% {H}/mnt/spool
Inode count:              512
Free inodes:              0
touch: cannot touch 'mnt/spool/msg502': No space left on device
touch: cannot touch 'mnt/spool/msg503': No space left on device
touch: cannot touch 'mnt/spool/msg504': No space left on device
"""
BAD[8] = f"""Filesystem      Size  Used Avail Use% Mounted on
/dev/loop2       55M   14K   51M   1% {H}/mnt/spool
Filesystem     Inodes IUsed IFree IUse% Mounted on
/dev/loop2      16384   1011 15373    7% {H}/mnt/spool
Inode count:              16384
Free inodes:              15373
"""

GOOD[9] = f"""umount: {H}/mnt/data: target is busy.
                     USER        PID ACCESS COMMAND
{H}/mnt/data:
                     root     kernel mount {H}/mnt/data
                     max        4321 ..c.. bash
unmounted cleanly
"""
BAD[9] = GOOD[9].replace("unmounted cleanly\n", "")

GOOD[10] = """Filesystem volume name:   DATA01
Filesystem UUID:          6f1c2a8e-1d55-4b0e-9a8a-3c1f7d2e4b10
Filesystem state:         clean
Mount count:              4
Maximum mount count:      -1
Check interval:           0 (<none>)
Reserved block count:     13107
Free inodes:              65516
DATA-WEB01
Maximum mount count:      20
Check interval:           2592000 (1 month)
Reserved block count:     2621
  Primary superblock at 1, Group descriptors at 2-3
  Backup superblock at 8193, Group descriptors at 8194-8195
  Backup superblock at 24577, Group descriptors at 24578-24579
  Backup superblock at 40961, Group descriptors at 40962-40963
"""
BAD[10] = GOOD[10].replace("Maximum mount count:      20", "Maximum mount count:      -1")

GOOD[11] = """DATA is not mounted, safe to check
fsck from util-linux 2.39.3
[/usr/sbin/fsck.ext4 (1) -- /dev/loop0] fsck.ext4 /dev/loop0
e2fsck 1.47.0 (5-Feb-2023)
Pass 1: Checking inodes, blocks, and sizes
Pass 2: Checking directory structure
Pass 3: Checking directory connectivity
Pass 4: Checking reference counts
Pass 5: Checking group summary information
DATA-WEB01: 19/65536 files (5.3% non-contiguous), 192841/262144 blocks
read-only check exit=0
DATA-WEB01 has been mounted 25 times without being checked, check forced.
DATA-WEB01: 19/65536 files (5.3% non-contiguous), 192841/262144 blocks
preen exit=0
1311066 -rwxr-xr-x 4 root root 347216 Feb 20  2024 /sbin/e2fsck
1311066 -rwxr-xr-x 4 root root 347216 Feb 20  2024 /sbin/fsck.ext2
1311066 -rwxr-xr-x 4 root root 347216 Feb 20  2024 /sbin/fsck.ext3
1311066 -rwxr-xr-x 4 root root 347216 Feb 20  2024 /sbin/fsck.ext4
"""
BAD[11] = GOOD[11].replace("DATA-WEB01 has been mounted 25 times without being checked, check forced.\nDATA-WEB01: 19/65536 files (5.3% non-contiguous), 192841/262144 blocks\npreen exit=0",
                           "DATA-WEB01: clean, 19/65536 files, 192841/262144 blocks\npreen exit=0")

GOOD[12] = f"""mount: {H}/mnt/data: wrong fs type, bad option, bad superblock on /dev/loop0, missing codepage or helper program, or other error.
       dmesg(1) may have more information after failed mount system call.
e2fsck 1.47.0 (5-Feb-2023)
Superblock needs_recovery flag is clear, but journal has data.
Recovery flag not set in backup superblock, so running journal anyway.
Pass 1: Checking inodes, blocks, and sizes
Pass 2: Checking directory structure
Pass 3: Checking directory connectivity
Pass 4: Checking reference counts
Pass 5: Checking group summary information

DATA-WEB01: ***** FILE SYSTEM WAS MODIFIED *****
DATA-WEB01: 19/65536 files (5.3% non-contiguous), 192841/262144 blocks
repair exit=1
backup.bin
exports
logs
lost+found
report.txt
tmp
"""
BAD[12] = GOOD[12].replace("repair exit=1", "repair exit=8").split("backup.bin")[0]

GOOD[13] = """label = "ARCHIVE"
UUID = 9d3e1b2a-7c4f-4a6b-8e2d-1f0a3b5c7d9e
Phase 1 - find and verify superblock...
Phase 2 - using internal log
        - zero log...
        - scan filesystem freespace and inode maps...
        - found root inode chunk
Phase 3 - for each AG...
        - scan (but don't clear) agi unlinked lists...
Phase 4 - check for duplicate blocks...
Phase 5 - skipped
Phase 6 - check inode connectivity...
Phase 7 - verify link counts...
No modify flag set, skipping filesystem flush and exiting.
xfs_repair exit=0
agcount = 4
writing all SBs
new label = "ARCH-DB01"
meta-data=/dev/loop1             isize=512    agcount=4, agsize=32768 blks
         =                       sectsz=512   attr=2, projid32bit=1
data     =                       bsize=4096   blocks=131072, imaxpct=25
naming   =version 2              bsize=4096   ascii-ci=0, ftype=1
log      =internal log           bsize=4096   blocks=16384, version=2
realtime =none                   extsz=4096   blocks=0, rtextents=0
/dev/loop1 start inode=0
xfs_repair: /dev/loop1 contains a mounted filesystem
xfs_repair: /dev/loop1 contains a mounted and writable filesystem

fatal error -- couldn't initialize XFS library
"""
BAD[13] = GOOD[13].split("xfs_repair: /dev/loop1 contains")[0]

GOOD[14] = "lab lines: 0\n"
BAD[14] = f"/dev/loop0: []: (/home/max/lpic1-section16/images/data.img)\nlab lines: 1\n"


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
    assert [t["id"] for t in S.TRAP_QUIZ] == [f"tq{i}" for i in range(1, 9)]
    for num, lab in S.LABS.items():
        for qq in lab.get("quiz", []):
            vals = [o if isinstance(o, str) else o["value"] for o in qq["options"]]
            assert qq["answer"] in vals, (num, qq["id"])
            assert qq["explain"].startswith("Correct."), (num, qq["id"])
    for qq in S.TRAP_QUIZ:
        vals = [o if isinstance(o, str) else o["value"] for o in qq["options"]]
        assert qq["answer"] in vals, qq["id"]
    print("ALL OK" if bad == 0 else f"{bad} lab(s) need work")
    return bad


if __name__ == "__main__":
    sys.exit(main())
