"""Check Section 13's paste regexes against sample Mint output: each good sample must pass
every check, and each broken sample must fail at least one.  usage: python section13_test.py"""
import os, re, runpy

X = runpy.run_path(os.path.join(os.path.dirname(__file__), "..", "section13.py"))

def passes(c, text):
    n = len(re.findall(c["re"], text, re.I | re.M))
    if c.get("absent"): return n == 0
    if "count" in c: return n == c["count"]
    return n >= c.get("min", 1)

GOOD, BAD = {}, {}

GOOD[1] = """NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
loop0    7:0    0    4K  1 loop /snap/bare/5
loop1    7:1    0 74.3M  1 loop /snap/core22/1564
sda      8:0    0   25G  0 disk
├─sda1   8:1    0    1M  0 part
├─sda2   8:2    0  513M  0 part /boot/efi
└─sda3   8:3    0 24.5G  0 part /
sr0     11:0    1 1024M  0 rom
brw-rw---- 1 root disk 8, 0 Nov  9 10:02 /dev/sda
brw-rw---- 1 root disk 8, 1 Nov  9 10:02 /dev/sda1
brw-rw---- 1 root disk 8, 2 Nov  9 10:02 /dev/sda2
brw-rw---- 1 root disk 8, 3 Nov  9 10:02 /dev/sda3
Answer: 1 disk(s) and 3 partition(s)
"""
BAD[1] = GOOD[1].replace("Answer: 1 disk(s) and 3 partition(s)\n", "")

GOOD[2] = """brw-rw---- 1 root disk 8, 0 Nov  9 10:02 /dev/sda
ls: cannot access '/dev/vd?': No such file or directory
ls: cannot access '/dev/nvme?n?': No such file or directory
ls: cannot access '/dev/hd?': No such file or directory
ls: cannot access '/dev/fd?': No such file or directory
brw-rw----+ 1 root cdrom 11, 0 Nov  9 10:02 /dev/sr0
sd (SATA, SCSI, USB disks): found sda
vd (virtio disks): none
nvme (NVMe): none
hd (old PATA): none, modern kernels name PATA disks sd
sr (optical): found sr0
fd (floppy): none
"""
BAD[2] = """brw-rw---- 1 root disk 8, 0 Nov  9 10:02 /dev/sda
ls: cannot access '/dev/vd?': No such file or directory
ls: cannot access '/dev/hd?': No such file or directory
"""

GOOD[3] = """major minor  #blocks  name

   7        0          4 loop0
   7        1      76096 loop1
   8        0   26214400 sda
   8        1       1024 sda1
   8        2     525312 sda2
   8        3   25686016 sda3
  11        0    1048575 sr0
NAME   MAJ:MIN  SIZE TYPE
loop0    7:0      4K loop
loop1    7:1   74.3M loop
sda      8:0     25G disk
├─sda1   8:1      1M part
├─sda2   8:2    513M part
└─sda3   8:3   24.5G part
sr0     11:0   1024M rom
sda is 25.0 GiB
"""
BAD[3] = GOOD[3].replace("sda is 25.0 GiB\n", "")

FS_SUPPORTED = """nodev\tsysfs
nodev\ttmpfs
nodev\tbdev
nodev\tproc
nodev\tcgroup
nodev\tcgroup2
nodev\tcpuset
nodev\tdevtmpfs
nodev\tdebugfs
nodev\tsecurityfs
nodev\tsockfs
nodev\tpipefs
nodev\tramfs
nodev\thugetlbfs
nodev\tdevpts
\text3
\text2
\text4
\tsquashfs
\tvfat
nodev\tecryptfs
\tfuseblk
nodev\tfuse
nodev\tfusectl
nodev\tmqueue
nodev\tbinfmt_misc
"""
FS_ON_DEVICES = """\text3
\text2
\text4
\tsquashfs
\tvfat
\tfuseblk
9p
adfs
affs
autofs
btrfs
ceph
cifs
efs
exfat
fat
hfs
hfsplus
isofs
jfs
nfs
nls
ntfs3
overlayfs
smbfs
squashfs
udf
ufs
xfs
"""
FS_IN_USE = """NAME   FSTYPE   FSVER LABEL UUID                                 FSAVAIL FSUSE% MOUNTPOINTS
loop0  squashfs 4.0                                                    0   100% /snap/bare/5
loop1  squashfs 4.0                                                    0   100% /snap/core22/1564
sda
├─sda1
├─sda2 vfat     FAT32       6A1B-2C3D                             505.9M     1% /boot/efi
└─sda3 ext4     1.0         0f3c9a1e-5b7d-4c2a-9e8f-1a2b3c4d5e6f   15.1G    32% /
sr0
"""
GOOD[4] = FS_SUPPORTED + FS_ON_DEVICES + FS_IN_USE
BAD[4] = FS_SUPPORTED + FS_ON_DEVICES  # lsblk -f was never saved

GOOD[5] = """               total        used        free      shared  buff/cache   available
Mem:           3.8Gi       1.2Gi       1.1Gi        45Mi       1.5Gi       2.4Gi
Swap:          2.0Gi          0B       2.0Gi
NAME      TYPE SIZE USED PRIO
/swapfile file   2G   0B   -2
Filename\t\t\t\tType\t\tSize\t\tUsed\t\tPriority
/swapfile                               file\t\t2097148\t\t0\t\t-2
NAME     SIZE TYPE FSTYPE   MOUNTPOINT
loop0      4K loop squashfs /snap/bare/5
sda       25G disk
├─sda1     1M part
├─sda2   513M part vfat     /boot/efi
└─sda3  24.5G part ext4     /
sr0     1024M rom
Answer: 2 GiB of swap. swapon --show says TYPE file, so it is a swap file, not a partition.
"""
BAD[5] = "\n".join(l for l in GOOD[5].splitlines() if not l.startswith(("NAME      TYPE", "/swapfile file")))

GOOD[6] = """NAME     SIZE TYPE FSTYPE   MOUNTPOINT
loop0      4K loop squashfs /snap/bare/5
sda       25G disk
├─sda1     1M part
├─sda2   513M part vfat     /boot/efi
└─sda3  24.5G part ext4     /
sr0     1024M rom
NAME          MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
/dev/loop0      7:0    0    4K  1 loop /snap/bare/5
/dev/sda        8:0    0   25G  0 disk
├─/dev/sda1     8:1    0    1M  0 part
├─/dev/sda2     8:2    0  513M  0 part /boot/efi
└─/dev/sda3     8:3    0 24.5G  0 part /
/dev/sr0       11:0    1 1024M  0 rom
NAME  MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
loop0   7:0    0    4K  1 loop /snap/bare/5
sda     8:0    0   25G  0 disk
sr0    11:0    1 1024M  0 rom
NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
loop0    7:0    0    4K  1 loop /snap/bare/5
sda1     8:1    0    1M  0 part
└─sda    8:0    0   25G  0 disk
sda2     8:2    0  513M  0 part /boot/efi
└─sda    8:0    0   25G  0 disk
sda3     8:3    0 24.5G  0 part /
└─sda    8:0    0   25G  0 disk
sr0     11:0    1 1024M  0 rom
Available output columns:
         ALIGNMENT  alignment offset
          ID-LINK  the shortest udev /dev/disk/by-id link name
               ID  udev ID (based on ID-LINK)
        DISC-ALN  discard alignment offset
"""
BAD[6] = GOOD[6].split("NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS\nloop0    7:0")[0]  # -s view and help missing

GOOD[7] = """/dev/disk/by-id:
total 0
lrwxrwxrwx 1 root root  9 Nov  9 10:02 ata-VBOX_CD-ROM_VB2-01700376 -> ../../sr0
lrwxrwxrwx 1 root root  9 Nov  9 10:02 ata-VBOX_HARDDISK_VB4f2a9c1e-7d3b5a60 -> ../../sda
lrwxrwxrwx 1 root root 10 Nov  9 10:02 ata-VBOX_HARDDISK_VB4f2a9c1e-7d3b5a60-part1 -> ../../sda1
lrwxrwxrwx 1 root root 10 Nov  9 10:02 ata-VBOX_HARDDISK_VB4f2a9c1e-7d3b5a60-part2 -> ../../sda2
lrwxrwxrwx 1 root root 10 Nov  9 10:02 ata-VBOX_HARDDISK_VB4f2a9c1e-7d3b5a60-part3 -> ../../sda3

/dev/disk/by-path:
total 0
lrwxrwxrwx 1 root root  9 Nov  9 10:02 pci-0000:00:0d.0-ata-1 -> ../../sda
lrwxrwxrwx 1 root root 10 Nov  9 10:02 pci-0000:00:0d.0-ata-1-part1 -> ../../sda1

/dev/disk/by-uuid:
total 0
lrwxrwxrwx 1 root root 10 Nov  9 10:02 0f3c9a1e-5b7d-4c2a-9e8f-1a2b3c4d5e6f -> ../../sda3
lrwxrwxrwx 1 root root 10 Nov  9 10:02 6A1B-2C3D -> ../../sda2
ls: cannot access '/dev/disk/by-label': No such file or directory
/dev/disk/by-uuid/0f3c9a1e-5b7d-4c2a-9e8f-1a2b3c4d5e6f -> /dev/sda3
/dev/disk/by-uuid/6A1B-2C3D -> /dev/sda2
"""
BAD[7] = GOOD[7].split("ls: cannot access '/dev/disk/by-label'")[0]

LVM_OUT = """total 0
crw------- 1 root root 10, 236 Nov  9 10:02 control
No LVM volumes on this host
ls: cannot access '/dev/dm-*': No such file or directory
/dev/mapper/control -> /dev/mapper/control
"""
GOOD[8] = LVM_OUT + """Physical volume: a partition marked for LVM with pvcreate.
Volume group: a pool of one or more physical volumes, made with vgcreate.
Logical volume: space carved from the group with lvcreate, then formatted and mounted like a partition.
pvs, vgs and lvs report the physical volumes, the groups and the logical volumes.
"""
BAD[8] = LVM_OUT

BTRFS_OUT = """\tbtrfs
/lib/modules/6.8.0-45-generic/kernel/fs/btrfs
/usr/bin/mkfs.btrfs
"""
GOOD[9] = BTRFS_OUT + """Btrfs stores data in B-trees and uses copy-on-write, so changed blocks go to new places.
It has built-in RAID 0, 1 and 10 across several devices.
Subvolumes act like separate filesystems and can be mounted with -o subvol=name.
Snapshots are cheap copies of a subvolume.
Compression is transparent and can use zlib, lzo or zstd.
"""
BAD[9] = BTRFS_OUT

INTERRUPTS = """           CPU0       CPU1
  0:         22          0   IO-APIC   2-edge      timer
  1:          0       1543   IO-APIC   1-edge      i8042
  8:          0          0   IO-APIC   8-edge      rtc0
  9:          0          0   IO-APIC   9-fasteoi   acpi
 12:          0       2611   IO-APIC  12-edge      i8042
 14:          0          0   IO-APIC  14-edge      ata_piix
 15:          0       4219   IO-APIC  15-edge      ata_piix
NMI:          0          0   Non-maskable interrupts
LOC:      51234      49876   Local timer interrupts
"""
def ioports(real):
    lines = [("0000", "0cf7", "PCI Bus 0000:00"), ("0000", "001f", "dma1"), ("0020", "0021", "pic1"),
             ("0040", "0043", "timer0"), ("0050", "0053", "timer1"), ("0060", "0060", "keyboard"),
             ("0070", "0071", "rtc_cmos"), ("00c0", "00df", "dma2")]
    return "".join(f"  {a if real else '0000'}-{b if real else '0000'} : {n}\n" for a, b, n in lines)
DMA = " 4: cascade\n"
GOOD[10] = INTERRUPTS + ioports(True) + DMA
BAD[10] = INTERRUPTS + ioports(False) + DMA

NEWDISK = """/dev/loop12
NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
loop12   7:12   0  256M  0 loop
   7       12     262144 loop12
NAME   FSTYPE FSVER LABEL UUID FSAVAIL FSUSE% MOUNTPOINTS
"""
GOOD[11] = NEWDISK + "loop12                                               \n"
BAD[11] = NEWDISK + "loop12 ext4   1.0         3b2f0c1a-8e4d-4f6b-a1c2-9d8e7f6a5b4c                \n"

LAYOUT = """UEFI
TARGET    SOURCE    FSTYPE OPTIONS
/         /dev/sda3 ext4   rw,relatime,errors=remount-ro
└─/boot/efi
          /dev/sda2 vfat   rw,relatime,fmask=0077,dmask=0077,codepage=437,iocharset=iso8859-1,shortname=mixed,errors=remount-ro
TARGET    SOURCE    FSTYPE OPTIONS
/boot/efi /dev/sda2 vfat   rw,relatime,fmask=0077,dmask=0077,codepage=437,iocharset=iso8859-1,shortname=mixed,errors=remount-ro
NAME     SIZE FSTYPE   MOUNTPOINT
sda       25G
├─sda1     1M
├─sda2   513M vfat     /boot/efi
└─sda3  24.5G ext4     /
"""
GOOD[12] = LAYOUT + """Recommendation for a database server: give /var and /home their own partitions or logical volumes
so logs or user files can't fill root. Put swap on its own partition or LV, or keep a swap file.
/boot/efi must be FAT (vfat) because UEFI firmware can only read FAT.
"""
BAD[12] = LAYOUT

failures = 0
for n, lab in sorted(X["LABS"].items()):
    p = lab.get("paste")
    if not p: continue
    good_fail = [c["say"] for c in p["checks"] if not passes(c, GOOD[n])]
    bad_fail = [c["say"] for c in p["checks"] if not passes(c, BAD[n])]
    ok = not good_fail and bad_fail
    failures += not ok
    print(f"Lab {n:2}: {'ok ' if ok else 'BAD'} good fails={good_fail} broken fails={bad_fail}")

assert len(X["TRAP_QUIZ"]) == 8
for i, t in enumerate(X["TRAP_QUIZ"], 1): assert t["id"] == f"tq{i}"
for lab in X["LABS"].values():
    for qq in lab["quiz"]:
        vals = [o["value"] if isinstance(o, dict) else o for o in qq["options"]]
        assert qq["answer"] in vals, qq["id"]
for t in X["TRAP_QUIZ"]:
    assert t["answer"] in [o["value"] if isinstance(o, dict) else o for o in t["options"]], t["id"]
print("all labs ok" if not failures else f"{failures} lab(s) failed")
raise SystemExit(1 if failures else 0)
