# Checks the Section 17 paste checks against realistic Linux Mint output.
# For each lab: the good sample must pass every check, the broken one must fail at least one.
# Run from the app folder: python tools/extras/tests/section17_test.py
import os, re, sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import section17 as S

K = "6.8.0-45-generic"
U = "0b6c7f54-91a2-4e7d-8c33-5a1d2e3f4b5c"
CMD = f"BOOT_IMAGE=/boot/vmlinuz-{K} root=UUID={U} ro quiet splash"

GOOD, BAD, ALT = {}, {}, {}

GOOD[1] = """Firmware: UEFI
config_table
efivars
fw_platform_size
fw_vendor
runtime
runtime-map
systab
BootCurrent: 0004
Timeout: 0 seconds
BootOrder: 0004,0000,0001,0002
Boot0000* UiApp	FvVol(7cb8bdc9-f8eb-4f34-aaea-3ee4af6516a1)/FvFile(462caa21-7614-4503-836e-8ab6f4662331)
Boot0001* UEFI QEMU DVD-ROM QM00003 	PciRoot(0x0)/Pci(0x1,0x1)/Ata(Secondary,Master,0x0){auto_created_boot_option}
Boot0004* ubuntu	HD(1,GPT,3c1e9a2b-5d4f-4e6a-9b8c-7d2e1f0a3b4c,0x800,0x100000)/File(\\EFI\\ubuntu\\shimx64.efi)
"""
# BIOS VM: also valid
ALT[1] = """Firmware: BIOS (legacy)
ls: cannot access '/sys/firmware/efi': No such file or directory
EFI variables are not supported on this system.
"""
BAD[1] = "Firmware: UEFI\n"

GOOD[2] = f"""Disk /dev/sda: 25 GiB, 26843545600 bytes, 52428800 sectors
Disk model: QEMU HARDDISK
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: gpt
Disk identifier: 7A1C2B3D-4E5F-4A6B-8C7D-9E0F1A2B3C4D

Device       Start      End  Sectors  Size Type
/dev/sda1     2048  1050623  1048576  512M EFI System
/dev/sda2  1050624 52426751 51376128 24.5G Linux filesystem
NAME     SIZE FSTYPE PARTTYPENAME     MOUNTPOINT
sda       25G
├─sda1   512M vfat   EFI System       /boot/efi
└─sda2  24.5G ext4   Linux filesystem /
TARGET    SOURCE    FSTYPE OPTIONS
/boot/efi /dev/sda1 vfat   rw,relatime,fmask=0077,dmask=0077,codepage=437,iocharset=iso8859-1,shortname=mixed,errors=remount-ro
BOOTX64.CSV
grub.cfg
grubx64.efi
mmx64.efi
shimx64.efi
"""
ALT[2] = """Disk /dev/sda: 25 GiB, 26843545600 bytes, 52428800 sectors
Disk model: VBOX HARDDISK
Units: sectors of 1 * 512 = 512 bytes
Disklabel type: dos
Disk identifier: 0x3a1b2c4d

Device     Boot Start      End  Sectors Size Id Type
/dev/sda1  *     2048 52426751 52424704  25G 83 Linux
NAME   SIZE FSTYPE PARTTYPENAME MOUNTPOINT
sda     25G
└─sda1  25G ext4   Linux        /
ls: cannot access '/boot/efi/EFI/*/': No such file or directory
"""
BAD[2] = GOOD[2].split("TARGET")[0]

GOOD[3] = """reports/sector0.bin: DOS/MBR boot sector; partition 1 : ID=0xee, start-CHS (0x0,0,2), end-CHS (0x3ff,255,63), startsector 1, 52428799 sectors, extended partition table (last)
 55 aa
"""
ALT[3] = """reports/sector0.bin: DOS/MBR boot sector; GRand Unified Bootloader, stage1 version 0x3, boot drive 0x80, 1st sector stage2 0x800, code offset 0x63, extended partition table (last)
 55 aa
"""
BAD[3] = """reports/sector0.bin: data
 00 00
"""

GOOD[4] = f"""{K}
total 148812
-rw-r--r-- 1 root root   287064 Sep 20 13:51 config-6.8.0-40-generic
-rw-r--r-- 1 root root   287064 Oct  4 10:12 config-{K}
drwx------ 3 root root     4096 Jan  1  1970 efi
drwxr-xr-x 5 root root     4096 Oct 30 09:12 grub
lrwxrwxrwx 1 root root       27 Oct 30 09:11 initrd.img -> initrd.img-{K}
-rw-r--r-- 1 root root 69384211 Oct 30 09:12 initrd.img-6.8.0-40-generic
-rw-r--r-- 1 root root 69417332 Oct 30 09:12 initrd.img-{K}
lrwxrwxrwx 1 root root       27 Oct 30 09:11 initrd.img.old -> initrd.img-6.8.0-40-generic
-rw-r--r-- 1 root root   182800 Feb  6  2022 memtest86+.bin
-rw------- 1 root root  8613962 Sep 20 13:51 System.map-6.8.0-40-generic
-rw------- 1 root root  8616347 Oct  4 10:12 System.map-{K}
lrwxrwxrwx 1 root root       24 Oct 30 09:11 vmlinuz -> vmlinuz-{K}
-rw------- 1 root root 14928264 Sep 20 14:20 vmlinuz-6.8.0-40-generic
-rw------- 1 root root 14936456 Oct  4 10:40 vmlinuz-{K}
lrwxrwxrwx 1 root root       24 Oct 30 09:11 vmlinuz.old -> vmlinuz-6.8.0-40-generic
/boot/vmlinuz: Linux kernel x86 boot executable bzImage, version {K} (buildd@lcy02-amd64-075) #45-Ubuntu SMP PREEMPT_DYNAMIC Fri Aug 30 12:02:04 UTC 2024, RO-rootFS, swap_dev 0XE, Normal VGA
"""
BAD[4] = "\n".join(GOOD[4].splitlines()[:-1]) + "\n/boot/vmlinuz: regular file, no read permission\n"

GOOD[5] = f"""-rw-r--r-- 1 root root 67M Oct 30 09:12 /boot/initrd.img-{K}
2618
usr/lib/modules/{K}/kernel/drivers/ata/ahci.ko.zst
usr/lib/modules/{K}/kernel/drivers/ata/libahci.ko.zst
usr/lib/modules/{K}/kernel/drivers/net/virtio_net.ko.zst
usr/lib/modules/{K}/kernel/drivers/nvme
usr/lib/modules/{K}/kernel/drivers/nvme/host/nvme.ko.zst
"""
BAD[5] = GOOD[5].splitlines()[0] + "\nlsinitramfs: command not found\n"

GOOD[6] = f"""menuentry 'Linux Mint 22 Cinnamon' --class linuxmint --class gnu-linux --class gnu --class os $menuentry_id_option 'gnulinux-simple-{U}' {{
	linux	/boot/vmlinuz-{K} root=UUID={U} ro  quiet splash
	initrd	/boot/initrd.img-{K}
{K}
search.fs_uuid {U} root hd0,gpt2
set prefix=($root)'/boot/grub'
configfile $prefix/grub.cfg
"""
BAD[6] = GOOD[6].replace(f"\n{K}\n", "\n6.8.0-40-generic\n")

GOOD[7] = f"""{CMD}
/dev/sda2 {U}
"""
ALT[7] = """BOOT_IMAGE=/vmlinuz-6.8.0-45-generic root=/dev/mapper/vgmint-root ro quiet splash
/dev/mapper/vgmint-root 9a8b7c6d-1111-2222-3333-444455556666
"""
BAD[7] = f"""{CMD}
/dev/sda3 1f2e3d4c-aaaa-bbbb-cccc-ddddeeeeffff
"""

GOOD[8] = """default=1
timeout=5
hiddenmenu
0: title OldLinux (2.6.32-754)
1: title OldLinux (2.6.32-696)
	root (hd0,0)
	kernel /vmlinuz-2.6.32-754 ro root=/dev/sda2 quiet
	initrd /initramfs-2.6.32-754.img
Answer: default=1 boots entry 1, the 2.6.32-696 kernel, from (hd0,0) = first disk, first partition = /dev/sda1, after a 5-second hidden menu
"""
BAD[8] = GOOD[8].replace("0: title", "1: title", 1).replace("1: title OldLinux (2.6.32-696)", "2: title OldLinux (2.6.32-696)").replace("the 2.6.32-696 kernel", "the 2.6.32-754 kernel")

GOOD[9] = """    PID COMMAND
      1 systemd
/usr/lib/systemd/systemd
graphical.target
N 5
         run-level 5  2026-11-09 08:12
ls: cannot access '/etc/inittab': No such file or directory
id:3:initdefault:
"""
BAD[9] = GOOD[9].replace("id:3:initdefault:\n", "")

GOOD[10] = """lrwxrwxrwx 1 root root 15 Apr  2  2024 /lib/systemd/system/runlevel0.target -> poweroff.target
lrwxrwxrwx 1 root root 13 Apr  2  2024 /lib/systemd/system/runlevel1.target -> rescue.target
lrwxrwxrwx 1 root root 17 Apr  2  2024 /lib/systemd/system/runlevel2.target -> multi-user.target
lrwxrwxrwx 1 root root 17 Apr  2  2024 /lib/systemd/system/runlevel3.target -> multi-user.target
lrwxrwxrwx 1 root root 17 Apr  2  2024 /lib/systemd/system/runlevel4.target -> multi-user.target
lrwxrwxrwx 1 root root 16 Apr  2  2024 /lib/systemd/system/runlevel5.target -> graphical.target
lrwxrwxrwx 1 root root 13 Apr  2  2024 /lib/systemd/system/runlevel6.target -> reboot.target
  UNIT                  LOAD   ACTIVE SUB    DESCRIPTION
  basic.target          loaded active active Basic System
  cryptsetup.target     loaded active active Local Encrypted Volumes
  getty.target          loaded active active Login Prompts
  graphical.target      loaded active active Graphical Interface
  local-fs-pre.target   loaded active active Preparation for Local File Systems
  local-fs.target       loaded active active Local File Systems
  multi-user.target     loaded active active Multi-User System
  network.target        loaded active active Network

LOAD   = Reflects whether the unit definition was properly loaded.
ACTIVE = The high-level unit activation state, i.e. generalization of SUB.
SUB    = The low-level unit activation state, values depend on unit type.
8 loaded units listed.
"""
BAD[10] = GOOD[10].split("  UNIT")[0]

GOOD[11] = """[    5.118204] e1000e 0000:00:19.0: firmware: failed to load e1000e/nic-fw.bin (-2)
[    5.118230] e1000e: probe of 0000:00:19.0 failed with error -2
[Mon Nov  9 08:11:52 2026] Linux version 6.8.0-45-generic (buildd@lcy02-amd64-075) (x86_64-linux-gnu-gcc-13 (Ubuntu 13.2.0-23ubuntu4) 13.2.0, GNU ld (GNU Binutils for Ubuntu) 2.42) #45-Ubuntu SMP PREEMPT_DYNAMIC Fri Aug 30 12:02:04 UTC 2024 (Ubuntu 6.8.0-45.45-generic 6.8.12)
[Mon Nov  9 08:11:52 2026] Command line: BOOT_IMAGE=/boot/vmlinuz-6.8.0-45-generic root=UUID=0b6c7f54-91a2-4e7d-8c33-5a1d2e3f4b5c ro quiet splash
[Mon Nov  9 08:11:52 2026] KERNEL supported cpus:
[    0.141522] RETBleed: WARNING: Spectre v2 mitigation leaves CPU vulnerable to RETBleed attacks, data leaks possible!
[    2.913477] vmwgfx 0000:00:02.0: [drm] *ERROR* vmwgfx seems to be running on an unsupported hypervisor.
[    0.031866] Kernel command line: BOOT_IMAGE=/boot/vmlinuz-6.8.0-45-generic root=UUID=0b6c7f54-91a2-4e7d-8c33-5a1d2e3f4b5c ro quiet splash
"""
BAD[11] = GOOD[11].replace("[Mon Nov  9 08:11:52 2026] Linux version", "[    0.000000] Linux version")

GOOD[12] = f"""IDX BOOT ID                          FIRST ENTRY                 LAST ENTRY
 -1 4f1c2a8e1d554b0e9a8a3c1f7d2e4b10 Sun 2026-11-08 08:01:12 EST Sun 2026-11-08 22:14:03 EST
  0 9a2b3c4d5e6f40718293a4b5c6d7e8f9 Mon 2026-11-09 08:11:52 EST Mon 2026-11-09 10:30:01 EST
Nov 09 08:11:52 mint kernel: Linux version {K} (buildd@lcy02-amd64-075) #45-Ubuntu SMP PREEMPT_DYNAMIC
Nov 09 08:11:52 mint kernel: Command line: {CMD}
Nov 09 08:11:52 mint kernel: KERNEL supported cpus:
Nov 09 08:11:55 mint kernel: vmwgfx 0000:00:02.0: [drm] *ERROR* vmwgfx seems to be running on an unsupported hypervisor.
Nov 08 22:14:02 mint kernel: audit: type=1305 audit(1762657442.512:212): op=set audit_pid=0 old=812 auid=4294967295 ses=4294967295 res=1
Nov 08 22:14:03 mint kernel: watchdog: watchdog0: watchdog did not stop!
Nov 08 22:14:03 mint systemd-shutdown[1]: Syncing filesystems and block devices.
-rw------- 1 root root  15302 Nov  9 08:12 /var/log/boot.log
-rw-r----- 1 syslog adm 812114 Nov  9 10:29 /var/log/kern.log
"""
ALT[12] = f"""  0 9a2b3c4d5e6f40718293a4b5c6d7e8f9 Mon 2026-11-09 08:11:52 EST—Mon 2026-11-09 10:30:01 EST
Nov 09 08:11:52 mint kernel: Linux version {K} (buildd@lcy02-amd64-075) #45-Ubuntu SMP PREEMPT_DYNAMIC
Nov 09 08:11:52 mint kernel: Command line: {CMD}
Nov 09 08:11:52 mint kernel: KERNEL supported cpus:
-- No entries --
Data from the specified boot (-1) is not available: No such boot ID in journal
-rw------- 1 root root  15302 Nov  9 08:12 /var/log/boot.log
-rw-r----- 1 syslog adm 812114 Nov  9 10:29 /var/log/kern.log
"""
BAD[12] = """No journal files were found.
No journal files were found.
-- No entries --
No journal files were found.
-- No entries --
No journal files were found.
-- No entries --
"""

GOOD[13] = """Startup finished in 4.512s (firmware) + 2.101s (loader) + 3.209s (kernel) + 12.884s (userspace) = 22.707s
graphical.target reached after 12.850s in userspace.
5.112s NetworkManager-wait-online.service
2.341s plymouth-quit-wait.service
1.204s snapd.seeded.service
 912ms dev-sda2.device
 701ms systemd-journal-flush.service
The time when unit became active or started is printed after the "@" character.
The time the unit took to start is printed after the "+" character.

graphical.target @12.850s
└─multi-user.target @12.849s
  └─plymouth-quit-wait.service @10.502s +2.341s
    └─systemd-user-sessions.service @10.470s +25ms
      └─network.target @10.461s
"""
ALT[13] = """Startup finished in 1.920s (kernel) + 9.311s (userspace) = 11.231s
graphical.target reached after 9.280s in userspace
  3.402s NetworkManager-wait-online.service
  1min 2.110s apt-daily.service
   812ms dev-sda1.device
   604ms udisks2.service
   498ms accounts-daemon.service
graphical.target @9.280s
└─multi-user.target @9.279s
"""
BAD[13] = "Bootup is not yet finished (org.freedesktop.systemd1.Manager.FinishTimestampMonotonic=0).\nPlease try again later.\n"


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
        line = f"Lab {num}: good {'PASS' if g_ok else 'FAIL'}, broken {'caught' if b_fails else 'NOT CAUGHT'}"
        a_ok = True
        if num in ALT:
            alt = results(checks, ALT[num])
            a_ok = all(ok for ok, _, _ in alt)
            line += f", alternate {'PASS' if a_ok else 'FAIL'}"
            for ok, n, say in alt:
                if not ok:
                    print(f"    alternate sample failed: {say} (matches={n})")
        print(line)
        for ok, n, say in good:
            if not ok:
                print(f"    good sample failed: {say} (matches={n})")
        if not (g_ok and b_fails and a_ok):
            bad += 1
    n_q = len(S.ANSWERS)
    print(f"{n_q} model answers, {len(S.TRAP_QUIZ)} trap questions")
    assert n_q == 7
    assert [t["id"] for t in S.TRAP_QUIZ] == [f"tq{i}" for i in range(1, 9)]
    for num, lab in S.LABS.items():
        assert 1 <= len(lab.get("quiz", [])) <= 2, num
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
