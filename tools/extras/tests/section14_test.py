"""Sample outputs for Section 14's paste checks. Every good sample must pass every check,
and every broken sample must fail at least one.  usage: python section14_test.py"""
import os, re, runpy, sys

HERE = os.path.dirname(os.path.abspath(__file__))
X = runpy.run_path(os.path.join(HERE, "..", "section14.py"))

def passes(c, text):
    n = len(re.findall(c["re"], text, re.I | re.M))
    if c.get("absent"): return n == 0
    if "count" in c: return n == c["count"]
    return n >= c.get("min", 1)

GOOD, BROKEN = {}, {}

GOOD[1] = """brw-rw---- 1 root disk  8, 0 Nov  9 08:12 /dev/sda
brw-rw----+ 1 root cdrom 11, 0 Nov  9 08:12 /dev/sr0
crw--w---- 1 root tty   4, 2 Nov  9 08:12 /dev/tty2
crw-rw-rw- 1 root root  1, 3 Nov  9 08:12 /dev/null
crw-rw-rw- 1 root root  1, 5 Nov  9 08:12 /dev/zero
Block devices in /dev: 14
Character devices in /dev: 131
"""
BROKEN[1] = """ls: cannot access '/dev/sr0': No such file or directory
crw--w---- 1 root tty   4, 2 Nov  9 08:12 /dev/tty2
crw-rw-rw- 1 root root  1, 3 Nov  9 08:12 /dev/null
crw-rw-rw- 1 root root  1, 5 Nov  9 08:12 /dev/zero
"""

GOOD[2] = """brw-rw---- 1 root disk 8, 0 Nov  9 08:12 /dev/sda
brw-rw---- 1 root disk 8, 1 Nov  9 08:12 /dev/sda1
brw-rw---- 1 root disk 8, 2 Nov  9 08:12 /dev/sda2
NAME   MAJ:MIN TYPE
loop0    7:0   loop
sda      8:0   disk
├─sda1   8:1   part
└─sda2   8:2   part
sr0     11:0   rom
Block devices:
  7 loop
  8 sd
  9 md
 11 sr
 65 sd
128 sd
253 device-mapper
254 mdp
259 blkext
"""
BROKEN[2] = """NAME   MAJ:MIN TYPE
sda      8:0   disk
├─sda1   8:1   part
"""

GOOD[3] = """TARGET SOURCE FSTYPE OPTIONS
/sys   sysfs  sysfs  rw,nosuid,nodev,noexec,relatime
/proc  proc   proc   rw,nosuid,nodev,noexec,relatime
MemTotal:        4014560 kB
MemFree:         1203344 kB
SwapTotal:       2097148 kB
               total        used        free      shared  buff/cache   available
Mem:         4014560     1290012     1203344       45236     1521204     2448876
Swap:        2097148           0     2097148
CPUs in cpuinfo: 2, nproc says: 2
Linux version 5.15.0-91-generic (buildd@lcy02-amd64-045) (gcc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0, GNU ld (GNU Binutils for Ubuntu) 2.38) #101-Ubuntu SMP Tue Nov 14 13:30:08 UTC 2023
"""
# free -m instead of -k: totals no longer match.
BROKEN[3] = GOOD[3].replace("Mem:         4014560", "Mem:            3920")

GOOD[4] = """alignment_offset
bdi
capability
dev
device
queue
removable
ro
sda1
sda2
size
stat
uevent
52428800
512
26843545600
26843545600
"""
BROKEN[4] = GOOD[4].replace("26843545600\n26843545600", "52428800\n26843545600")

GOOD[5] = """00:00.0 Host bridge: Intel Corporation 440FX - 82441FX PMC [Natoma] (rev 02)
00:01.0 ISA bridge: Intel Corporation 82371SB PIIX3 ISA [Natoma/Triton II]
00:01.1 IDE interface: Intel Corporation 82371AB/EB/MB PIIX4 IDE (rev 01)
00:02.0 VGA compatible controller: VMware SVGA II Adapter
00:03.0 Ethernet controller: Intel Corporation 82540EM Gigabit Ethernet Controller (rev 02)
00:0d.0 SATA controller: Intel Corporation 82801HM/HEM (ICH8M/ICH8M-E) SATA Controller [AHCI mode] (rev 02)
-[0000:00]-+-00.0  Intel Corporation 440FX - 82441FX PMC [Natoma]
           +-01.0  Intel Corporation 82371SB PIIX3 ISA [Natoma/Triton II]
           +-03.0  Intel Corporation 82540EM Gigabit Ethernet Controller
           \\-0d.0  Intel Corporation 82801HM/HEM (ICH8M/ICH8M-E) SATA Controller [AHCI mode]
00:01.1 IDE interface: Intel Corporation 82371AB/EB/MB PIIX4 IDE (rev 01)
	Subsystem: Intel Corporation 82371AB/EB/MB PIIX4 IDE
	Kernel driver in use: ata_piix
	Kernel modules: pata_acpi
00:03.0 Ethernet controller: Intel Corporation 82540EM Gigabit Ethernet Controller (rev 02)
	Subsystem: Intel Corporation PRO/1000 MT Desktop Adapter
	Kernel driver in use: e1000
	Kernel modules: e1000
00:0d.0 SATA controller: Intel Corporation 82801HM/HEM (ICH8M/ICH8M-E) SATA Controller [AHCI mode] (rev 02)
	Kernel driver in use: ahci
	Kernel modules: ahci
total 0
lrwxrwxrwx 1 root root  9 Nov  9 08:12 pci-0000:00:01.1-ata-2 -> ../../sr0
lrwxrwxrwx 1 root root  9 Nov  9 08:12 pci-0000:00:0d.0-ata-1 -> ../../sda
lrwxrwxrwx 1 root root 10 Nov  9 08:12 pci-0000:00:0d.0-ata-1-part1 -> ../../sda1
  214 reports/pci-detail.txt
"""
# lspci -vvv ran without output (wrong redirect), and no -k lines.
BROKEN[5] = "\n".join(l for l in GOOD[5].splitlines() if "Kernel" not in l).replace("  214 reports", "0 reports")

GOOD[6] = """Bus 001 Device 001: ID 1d6b:0001 Linux Foundation 1.1 root hub
Bus 001 Device 002: ID 80ee:0021 VirtualBox USB Tablet
/:  Bus 01.Port 1: Dev 1, Class=root_hub, Driver=ohci-pci/12p, 12M
    |__ Port 1: Dev 2, If 0, Class=Human Interface Device, Driver=usbhid, 12M
Bus 001 Device 002: ID 80ee:0021 VirtualBox USB Tablet
  idVendor           0x80ee VirtualBox
  idProduct          0x0021 USB Tablet
  iProduct                3 USB Tablet
Bus 001 Device 001: ID 1d6b:0001 Linux Foundation 1.1 root hub
  idVendor           0x1d6b Linux Foundation
  idProduct          0x0001 1.1 root hub
  iProduct                2 OHCI PCI host controller
No USB disks attached
"""
BROKEN[6] = "No USB disks attached\n"

GOOD[7] = """Module                  Size  Used by
tls                   114688  0
snd_intel8x0           49152  2
snd_ac97_codec        180224  1 snd_intel8x0
vboxguest             425984  5
e1000                 159744  0
Loaded modules: 68
snd                   114688  10 snd_seq,snd_seq_device,snd_timer,snd_ac97_codec,snd_pcm,snd_rawmidi,snd_intel8x0
soundcore              16384  1 snd
tls 114688 0 - Live 0x0000000000000000
snd_intel8x0 49152 2 - Live 0x0000000000000000
snd_ac97_codec 180224 1 snd_intel8x0, Live 0x0000000000000000
1043
"""
BROKEN[7] = """tls                   114688  0
snd_intel8x0           49152  2
"""

GOOD[8] = """Module: tls
filename:       /lib/modules/6.8.0-45-generic/kernel/net/tls/tls.ko.zst
alias:          tcp-ulp-tls
license:        Dual BSD/GPL
description:    Transport Layer Security Support
author:         Mellanox Technologies
srcversion:     4C1F2BB9B7C2E1D7E0B2A61
depends:
retpoline:      Y
intree:         Y
name:           tls
vermagic:       6.8.0-45-generic SMP preempt mod_unload modversions
/lib/modules/6.8.0-45-generic/kernel/net/tls/tls.ko.zst

name:           ext4
filename:       (builtin)
softdep:        pre: crc32c
"""
BROKEN[8] = """Module:
modinfo: ERROR: Module alias  not found.
name:           ext4
filename:       (builtin)
"""

GOOD[9] = """insmod /lib/modules/5.15.0-91-generic/kernel/drivers/md/dm-region-hash.ko
insmod /lib/modules/5.15.0-91-generic/kernel/drivers/md/dm-log.ko
insmod /lib/modules/5.15.0-91-generic/kernel/drivers/md/dm-mirror.ko
kernel/drivers/md/dm-mirror.ko: kernel/drivers/md/dm-region-hash.ko kernel/drivers/md/dm-log.ko
dm_mirror is not loaded
"""
# Searched with the wrong name, so modprobe and grep found nothing.
BROKEN[9] = """modprobe: FATAL: Module dm-mirro not found in directory /lib/modules/5.15.0-91-generic
dm_mirror is not loaded
"""

GOOD[10] = """/etc/modprobe.d:
alsa-base.conf
blacklist-ath_pci.conf
blacklist.conf
blacklist-firewire.conf
iwlwifi.conf

/etc/modules-load.d:
cups-filters.conf
modules.conf
blacklist evbug
blacklist usbmouse
options snd-pcsp index=-2
alias snd-card-0 snd-intel8x0
# Requested by the desktop security team for kiosk01
blacklist pcspkr
install usb-storage /bin/true
options loop max_loop=16
alias net-pf-31 off

Review:
blacklist pcspkr - stops automatic loading of pcspkr by alias; modprobe pcspkr would still work.
install usb-storage /bin/true - replaces the load command, so nothing loads, even by hand.
options loop max_loop=16 - sets the max_loop parameter for the loop module.
alias net-pf-31 off - maps the name net-pf-31 (Bluetooth) to a module that doesn't exist, so it never loads.
"""
# Only the request file, no notes.
BROKEN[10] = """# Requested by the desktop security team for kiosk01
blacklist pcspkr
install usb-storage /bin/true
options loop max_loop=16
alias net-pf-31 off
"""

GOOD[11] = """[    0.000000] Linux version 6.8.0-45-generic (buildd@lcy02-amd64-075) (x86_64-linux-gnu-gcc-13 (Ubuntu 13.2.0-23ubuntu4) 13.2.0) #45-Ubuntu SMP PREEMPT_DYNAMIC Fri Aug 30 12:02:04 UTC 2024 (Ubuntu 6.8.0-45.45-generic 6.8.12)
[    0.000000] Command line: BOOT_IMAGE=/boot/vmlinuz-6.8.0-45-generic root=UUID=1b2c... ro quiet splash
[    0.000000] KERNEL supported cpus:
[Sun Nov  9 08:12:03 2026] ata3: SATA max UDMA/133 abar m8192@0xf0806000 port 0xf0806100 irq 21
[Sun Nov  9 08:12:03 2026] ata3.00: ATA-6: VBOX HARDDISK, 1.0, max UDMA/133
[Sun Nov  9 08:12:03 2026] sd 2:0:0:0: [sda] 52428800 512-byte logical blocks: (26.8 GB/25.0 GiB)
[Sun Nov  9 08:12:03 2026] sd 2:0:0:0: [sda] Attached SCSI disk
[    1.204512] vmwgfx 0000:00:02.0: [drm] *ERROR* vmwgfx seems to be running on an unsupported hypervisor.
Nov 09 08:12:03 mint kernel: sd 2:0:0:0: [sda] 52428800 512-byte logical blocks: (26.8 GB/25.0 GiB)
"""
# Plain dmesg without sudo: the file holds nothing.
BROKEN[11] = ""

GOOD[12] = """P: /devices/pci0000:00/0000:00:0d.0/ata3/host2/target2:0:0/2:0:0:0/block/sda
M: sda
U: block
T: disk
D: b 8:0
N: sda
L: 0
S: disk/by-id/ata-VBOX_HARDDISK_VB5d1f2c3a-7e8b9a01
S: disk/by-path/pci-0000:00:0d.0-ata-1
Q: 9
E: DEVPATH=/devices/pci0000:00/0000:00:0d.0/ata3/host2/target2:0:0/2:0:0:0/block/sda
E: DEVNAME=/dev/sda
E: DEVTYPE=disk
E: ID_BUS=ata
E: ID_MODEL=VBOX_HARDDISK
E: ID_SERIAL=VBOX_HARDDISK_VB5d1f2c3a-7e8b9a01
E: ID_PATH=pci-0000:00:0d.0-ata-1
E: DEVLINKS=/dev/disk/by-id/ata-VBOX_HARDDISK_VB5d1f2c3a-7e8b9a01 /dev/disk/by-path/pci-0000:00:0d.0-ata-1
01-md-raid-creating.rules
50-firmware.rules
50-udev-default.rules
60-block.rules
60-persistent-storage.rules
total 0
/lib/udev/rules.d/60-persistent-storage.rules
"""
BROKEN[12] = """Unknown device "/dev/": No such device
01-md-raid-creating.rules
50-udev-default.rules
total 0
"""

GOOD[13] = """monitor will print the received events for:
UDEV - the event which udev sends out after rule processing
KERNEL - the kernel uevent

KERNEL[2214.402117] change   /devices/virtual/block/loop3 (block)
UDEV  [2214.418309] change   /devices/virtual/block/loop3 (block)
KERNEL[2216.430561] change   /devices/virtual/block/loop3 (block)
UDEV  [2216.441870] change   /devices/virtual/block/loop3 (block)
drwxr-x---+ 2 root root 4096 Oct 20 19:44 /media/alice
active
"""
# Monitor started after losetup ran: only the header was captured.
BROKEN[13] = """monitor will print the received events for:
UDEV - the event which udev sends out after rule processing
KERNEL - the kernel uevent

drwxr-x---+ 2 root root 4096 Oct 20 19:44 /media/alice
active
"""

def main():
    bad = 0
    for n, lab in sorted(X["LABS"].items()):
        p = lab.get("paste")
        if not p: print(f"lab {n}: no paste check"); continue
        for c in p["checks"]:
            if not passes(c, GOOD[n]):
                bad += 1; print(f"lab {n} GOOD fails: {c['say']}")
        failed = [c["say"] for c in p["checks"] if not passes(c, BROKEN[n])]
        if not failed:
            bad += 1; print(f"lab {n} BROKEN passes every check")
        else:
            print(f"lab {n}: ok ({len(p['checks'])} checks; broken fails {len(failed)})")
    assert len(X["TRAP_QUIZ"]) == 8
    print("FAILURES:", bad)
    return bad

if __name__ == "__main__":
    sys.exit(1 if main() else 0)
