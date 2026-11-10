/* Section 17: Boot Process and Boot Logs. Generated from LPIC_Section17_Lab_Workbook.docx by vm_section.py;
   paste checks, quizzes and model answers were added for the app. */
LPIC.section({
 "id": "section-17",
 "number": 17,
 "title": "Boot Process and Boot Logs",
 "objectives": [
  "101.2"
 ],
 "kind": "vm",
 "source": "LPIC_Section17_Lab_Workbook.docx",
 "scenario": "Objective 101.2: Boot the system. Trace the boot from BIOS or UEFI firmware through the boot loader, kernel, and initramfs to init, and read boot events with dmesg and journalctl.",
 "overview": {
  "paragraphs": [
   "Treat each lab like a boot-support ticket, not a reading exercise. Read the scenario, find the evidence on your own system, and save a short report that answers the question in the ticket. The goal is to be able to explain every stage of the boot from what you can see on a running machine.",
   "Safety first. Every lab in this section is inspect-and-explain. You read files, firmware information, and logs; you never reinstall the boot loader, regenerate the GRUB configuration, rebuild the initramfs, change the default target, or reboot. Anything marked Don't run on your VM is exam content to read and explain only.",
   "Linux Mint uses GRUB2 and systemd. GRUB Legacy (menu.lst) and SysVinit (/etc/inittab) are still on the exam, so this workbook gives you sample files from an old server in the samples folder to read and explain. Section 18 goes deeper into GRUB Legacy, the GRUB menus, kernel parameters, and the GRUB2 configuration files.",
   "Several commands need sudo on Mint: reading the disk, /boot/vmlinuz, /boot/grub/grub.cfg, /boot/efi, /var/log/boot.log, and dmesg (Mint restricts the kernel log to administrators)."
  ],
  "setup": [
   {
    "text": "Step 1: Create the practice workspace:"
   },
   {
    "cmd": "mkdir -p ~/lpic1-section17/{reports,samples}"
   },
   {
    "cmd": "cd ~/lpic1-section17"
   },
   {
    "text": "Step 2: Find the name of your boot disk (sda, vda, or nvme0n1 on most VMs) and keep it in a variable. Rerun this step in any new terminal:"
   },
   {
    "cmd": "export DISK=/dev/$(lsblk -dno NAME,TYPE | awk '$2==\"disk\"{print $1; exit}')"
   },
   {
    "cmd": "echo $DISK"
   },
   {
    "text": "Step 3: Create the sample files from an old server, web01, that still runs GRUB Legacy and SysVinit:"
   },
   {
    "cmd": "printf 'default=1\\ntimeout=5\\nhiddenmenu\\ntitle OldLinux (2.6.32-754)\\n\\troot (hd0,0)\\n\\tkernel /vmlinuz-2.6.32-754 ro root=/dev/sda2 quiet\\n\\tinitrd /initramfs-2.6.32-754.img\\ntitle OldLinux (2.6.32-696)\\n\\troot (hd0,0)\\n\\tkernel /vmlinuz-2.6.32-696 ro root=/dev/sda2\\n\\tinitrd /initramfs-2.6.32-696.img\\n' > samples/menu.lst"
   },
   {
    "cmd": "printf 'id:3:initdefault:\\nsi::sysinit:/etc/rc.d/rc.sysinit\\nl0:0:wait:/etc/rc.d/rc 0\\nl1:1:wait:/etc/rc.d/rc 1\\nl3:3:wait:/etc/rc.d/rc 3\\nl5:5:wait:/etc/rc.d/rc 5\\nl6:6:wait:/etc/rc.d/rc 6\\n1:2345:respawn:/sbin/mingetty tty1\\n' > samples/inittab"
   },
   {
    "cmd": "printf '[    0.000000] Linux version 2.6.32-754 (builder@buildhost)\\n[    1.204331] ahci 0000:00:1f.2: AHCI 0001.0300 32 slots 6 ports\\n[    3.410972] EXT4-fs (sda2): mounted filesystem with ordered data mode\\n[    5.118204] e1000e 0000:00:19.0: firmware: failed to load e1000e/nic-fw.bin (-2)\\n[    5.118230] e1000e: probe of 0000:00:19.0 failed with error -2\\n[    7.002114] init: Entering runlevel: 3\\n' > samples/boot-incident.log"
   },
   {
    "text": "Validation check: Run ls samples and confirm menu.lst, inittab, and boot-incident.log exist, then run grep -c '^title' samples/menu.lst and confirm it prints 2. echo $DISK must print a device such as /dev/sda; if it prints only /dev/, run lsblk -d and set DISK by hand."
   }
  ],
  "commands": [
   "/sys/firmware/efi",
   "efibootmgr",
   "fdisk -l",
   "lsblk",
   "findmnt /boot/efi",
   "/boot/efi/EFI",
   "uname -r",
   "ls /boot",
   "vmlinuz",
   "initrd.img",
   "file",
   "lsinitramfs",
   "update-initramfs",
   "dracut",
   "mkinitrd",
   "/boot/grub/grub.cfg",
   "/boot/grub2/grub.cfg",
   "menu.lst",
   "grub.conf",
   "grub-install",
   "/proc/cmdline",
   "ps -p 1",
   "/sbin/init",
   "systemctl get-default",
   "runlevel",
   "who -r",
   "init",
   "telinit",
   "/etc/inittab",
   "initctl",
   "dmesg",
   "dmesg -T",
   "dmesg --level",
   "journalctl -b",
   "journalctl -b -1",
   "journalctl --list-boots",
   "journalctl -k",
   "journalctl -p err",
   "/var/log/boot.log",
   "/var/log/kern.log",
   "systemd-analyze",
   "systemd-analyze blame",
   "systemd-analyze critical-chain"
  ],
  "memoryHook": "Firmware, loader, kernel, init: Fix Lunch, Kids Inside. The firmware (BIOS reading the MBR, or UEFI reading the EFI system partition) runs the power-on self-test and finds the boot loader. The boot loader (GRUB2 today, GRUB Legacy or LILO in the past) loads the kernel and the initramfs and hands the kernel its command line. The kernel uses the initramfs drivers to find the real root filesystem, then starts init as PID 1. Init (systemd today, SysVinit or Upstart in the past) starts the services and gives you a login. dmesg reads the kernel's part of the story; journalctl -b reads all of it.",
  "reference": []
 },
 "lessons": [
  {
   "id": "17.1",
   "kind": "vm",
   "title": "Find out whether the VM boots with BIOS or UEFI",
   "navSubtitle": "/sys/firmware/efi, efibootmgr",
   "objective": "101.2",
   "difficulty": "Beginner",
   "source": "Lab 1: Find out whether the VM boots with BIOS or UEFI",
   "workdir": "~/lpic1-section17",
   "summary": "",
   "scenario": "A hypervisor migration ticket asks for the firmware type of every Linux guest, because UEFI guests need their EFI disk moved with them.",
   "task": "Check for the UEFI interface in /sys and record the firmware boot entries if there are any.",
   "deliverable": "reports/firmware.txt.",
   "steps": [
    {
     "text": "if [ -d /sys/firmware/efi ]; then echo 'Firmware: UEFI'; else echo 'Firmware: BIOS (legacy)'; fi > reports/firmware.txt"
    },
    {
     "cmd": "ls /sys/firmware/efi >> reports/firmware.txt 2>&1"
    },
    {
     "cmd": "sudo efibootmgr >> reports/firmware.txt 2>&1"
    }
   ],
   "validation": "head -n 1 reports/firmware.txt names the firmware type. On UEFI, efibootmgr lists BootOrder and an entry such as ubuntu; on BIOS, the ls line shows No such file or directory and efibootmgr reports that EFI variables are not supported (or is not installed).",
   "trap": "The /sys/firmware/efi directory exists only when the running system was started by UEFI. Many VMs still default to BIOS. efibootmgr only reads entries here; with -c, -b, or -o it changes firmware settings, so never use those options on this VM.",
   "paste": {
    "command": "cat reports/firmware.txt",
    "checks": [
     {
      "re": "^Firmware: (UEFI|BIOS)",
      "say": "the first line names the firmware type"
     },
     {
      "re": "^efivars\\s*$|/sys/firmware/efi.*No such file or directory",
      "say": "includes the ls of /sys/firmware/efi"
     },
     {
      "re": "^BootOrder:|EFI variables are not supported|efibootmgr: (command )?not found",
      "say": "includes what efibootmgr reported"
     }
    ]
   },
   "quiz": [
    {
     "id": "efidir",
     "prompt": "Which check proves a running system was started by UEFI?",
     "answer": "sys",
     "options": [
      {
       "value": "sys",
       "label": "<code>/sys/firmware/efi</code> exists"
      },
      {
       "value": "boot",
       "label": "<code>/boot/grub</code> exists"
      },
      {
       "value": "gpt",
       "label": "The disk has a GPT label"
      }
     ],
     "explain": "Correct. The kernel creates that directory only on a UEFI boot."
    },
    {
     "id": "efibm",
     "prompt": "Which <code>efibootmgr</code> use is safe on this VM?",
     "answer": "read",
     "options": [
      {
       "value": "read",
       "label": "Running it with no options"
      },
      {
       "value": "o",
       "label": "<code>efibootmgr -o</code> to fix the order"
      },
      {
       "value": "c",
       "label": "<code>efibootmgr -c</code> to add an entry"
      }
     ],
     "explain": "Correct. With no options it only reads the firmware entries."
    }
   ],
   "completion": "Find out whether the VM boots with BIOS or UEFI: done."
  },
  {
   "id": "17.2",
   "kind": "vm",
   "title": "Map the partition table and the EFI system partition",
   "navSubtitle": "fdisk -l, ESP",
   "objective": "101.2",
   "difficulty": "Beginner",
   "source": "Lab 2: Map the partition table and the EFI system partition",
   "workdir": "~/lpic1-section17",
   "summary": "",
   "scenario": "A colleague is rebuilding app02 and asks what partition table your build uses and where the boot loader files live, so the new disk can be laid out the same way.",
   "task": "Record the disk label type, the partitions and their types, and the EFI system partition if there is one.",
   "deliverable": "reports/disk-layout.txt.",
   "steps": [
    {
     "cmd": "sudo fdisk -l \"$DISK\" > reports/disk-layout.txt"
    },
    {
     "cmd": "lsblk -o NAME,SIZE,FSTYPE,PARTTYPENAME,MOUNTPOINT \"$DISK\" >> reports/disk-layout.txt"
    },
    {
     "cmd": "findmnt /boot/efi >> reports/disk-layout.txt"
    },
    {
     "cmd": "sudo sh -c 'ls /boot/efi/EFI/*/' >> reports/disk-layout.txt 2>&1"
    }
   ],
   "validation": "grep -i 'disklabel type' reports/disk-layout.txt shows dos (MBR) or gpt. On UEFI, the file also shows a vfat filesystem mounted on /boot/efi and the files shimx64.efi and grubx64.efi.",
   "trap": "BIOS with an MBR disk keeps the first stage of the boot loader in the first 446 bytes of the disk. UEFI ignores that code and loads a .efi program from the EFI system partition (ESP), a small FAT filesystem mounted on /boot/efi. fdisk -l only reads. The ESP is readable only by root on Mint, which is why the ls runs inside sudo sh -c (otherwise your own shell would try to expand the * and fail). Never type commands into fdisk's interactive prompt on this disk.",
   "paste": {
    "command": "cat reports/disk-layout.txt",
    "checks": [
     {
      "re": "Disklabel type: (dos|gpt)",
      "say": "fdisk shows the disk label type"
     },
     {
      "re": "^Device\\s+(Boot\\s+)?Start\\s+End\\s+Sectors",
      "say": "fdisk lists the partitions"
     },
     {
      "re": "NAME\\s+SIZE\\s+FSTYPE\\s+PARTTYPENAME",
      "say": "includes the lsblk output"
     },
     {
      "re": "grubx64\\.efi|cannot access",
      "say": "shows the boot loader files in the ESP, or that there is none (BIOS)"
     }
    ]
   },
   "quiz": [
    {
     "id": "esp",
     "prompt": "Where does UEFI find its boot loader?",
     "answer": "esp",
     "options": [
      {
       "value": "esp",
       "label": "A .efi file on the EFI system partition"
      },
      {
       "value": "mbr",
       "label": "The boot code in the MBR"
      },
      {
       "value": "boot",
       "label": "/boot/grub on the root filesystem"
      }
     ],
     "explain": "Correct. The ESP is a small FAT filesystem, mounted on /boot/efi on Mint."
    }
   ],
   "completion": "Map the partition table and the EFI system partition: done."
  },
  {
   "id": "17.3",
   "kind": "vm",
   "title": "Read the first sector of the disk without changing it",
   "navSubtitle": "MBR, 55 aa",
   "objective": "101.2",
   "difficulty": "Beginner",
   "source": "Lab 3: Read the first sector of the disk without changing it",
   "workdir": "~/lpic1-section17",
   "summary": "",
   "scenario": "A training request asks you to show a junior engineer what the master boot record is, using real evidence instead of a diagram.",
   "task": "Copy the first 512 bytes of the disk into a file, identify it, and show the boot signature.",
   "deliverable": "reports/sector0.bin and reports/sector0.txt.",
   "steps": [
    {
     "cmd": "sudo head -c 512 \"$DISK\" > reports/sector0.bin"
    },
    {
     "cmd": "file reports/sector0.bin > reports/sector0.txt"
    },
    {
     "text": "od -An -tx1 -j510 -N2 reports/sector0.bin >> reports/sector0.txt"
    }
   ],
   "validation": "cat reports/sector0.txt shows a DOS/MBR boot sector (often naming GRUB), and the last line reads 55 aa.",
   "trap": "The 512-byte MBR holds 446 bytes of boot code, a 64-byte partition table (four primary entries), and the 2-byte signature 55 aa. Because the boot code is so small, it only loads the next stage, a technique called chain loading. A GPT disk keeps a protective MBR in the same place. Reading the disk is safe; writing to it with dd is how boot sectors get destroyed.",
   "paste": {
    "command": "cat reports/sector0.txt",
    "checks": [
     {
      "re": "DOS/MBR boot sector",
      "say": "file identifies a DOS/MBR boot sector"
     },
     {
      "re": "^\\s*55 aa\\s*$",
      "say": "the last two bytes are the 55 aa signature"
     }
    ]
   },
   "quiz": [
    {
     "id": "layout",
     "prompt": "How is the 512-byte MBR divided?",
     "answer": "446",
     "options": [
      {
       "value": "446",
       "label": "446 bytes boot code, 64 bytes partition table, 2 bytes signature"
      },
      {
       "value": "256",
       "label": "256 bytes boot code, 254 bytes table, 2 bytes signature"
      },
      {
       "value": "510",
       "label": "510 bytes boot code, 2 bytes signature"
      }
     ],
     "explain": "Correct. The table has room for four 16-byte entries."
    },
    {
     "id": "chain",
     "prompt": "Why does the MBR boot code only load the next stage?",
     "answer": "small",
     "options": [
      {
       "value": "small",
       "label": "446 bytes is too small for a full boot loader"
      },
      {
       "value": "uefi",
       "label": "UEFI requires it"
      },
      {
       "value": "safe",
       "label": "So the disk can't be overwritten"
      }
     ],
     "explain": "Correct. Handing off to a bigger loader is called chain loading."
    }
   ],
   "completion": "Read the first sector of the disk without changing it: done."
  },
  {
   "id": "17.4",
   "kind": "vm",
   "title": "Inventory the kernels in /boot",
   "navSubtitle": "uname -r, /boot, vmlinuz",
   "objective": "101.2",
   "difficulty": "Intermediate",
   "source": "Lab 4: Inventory the kernels in /boot",
   "workdir": "~/lpic1-section17",
   "summary": "",
   "scenario": "Before a patch window on web01, the change owner wants to know which kernel is running and which older kernels are still available as a fallback.",
   "task": "Record the running kernel, list /boot, and identify the kernel file type.",
   "deliverable": "reports/kernel.txt.",
   "steps": [
    {
     "text": "uname -r > reports/kernel.txt"
    },
    {
     "cmd": "ls -l /boot >> reports/kernel.txt"
    },
    {
     "cmd": "sudo file -L /boot/vmlinuz >> reports/kernel.txt"
    }
   ],
   "validation": "grep -c \"$(uname -r)\" reports/kernel.txt returns at least 4 (the uname line plus the vmlinuz, initrd.img, config, and System.map files for that version), and the last line says Linux kernel x86 boot executable bzImage.",
   "trap": "The z in vmlinuz means the kernel is compressed. On Mint, /boot/vmlinuz and /boot/vmlinuz.old are symbolic links to the newest and previous kernels. Red Hat systems also keep a rescue kernel in /boot. The kernel files are readable only by root on Mint, so file needs sudo.",
   "paste": {
    "command": "cat reports/kernel.txt",
    "checks": [
     {
      "re": "^\\d+\\.\\d+\\.\\d+\\S*\\s*$",
      "say": "the first line is the running kernel from uname -r"
     },
     {
      "re": "(vmlinuz|initrd\\.img|config|System\\.map)-\\d+\\.\\d+",
      "say": "/boot lists the kernel, initrd, config and System.map files",
      "min": 4
     },
     {
      "re": "Linux kernel x86 boot executable,? bzImage",
      "say": "file identifies the kernel as a bzImage"
     }
    ]
   },
   "quiz": [
    {
     "id": "z",
     "prompt": "What does the z in <code>vmlinuz</code> mean?",
     "answer": "comp",
     "options": [
      {
       "value": "comp",
       "label": "The kernel is compressed"
      },
      {
       "value": "zfs",
       "label": "It supports ZFS"
      },
      {
       "value": "zero",
       "label": "It is the first kernel"
      }
     ],
     "explain": "Correct. It is a compressed kernel image."
    }
   ],
   "completion": "Inventory the kernels in /boot: done."
  },
  {
   "id": "17.5",
   "kind": "vm",
   "title": "Explain what is inside the initramfs",
   "navSubtitle": "lsinitramfs, initrd",
   "objective": "101.2",
   "difficulty": "Intermediate",
   "source": "Lab 5: Explain what is inside the initramfs",
   "workdir": "~/lpic1-section17",
   "summary": "",
   "scenario": "A storage vendor asks whether the driver for your disk controller loads before the root filesystem is mounted. The answer is in the initial RAM filesystem.",
   "task": "Measure the initramfs, count its files, and look for the filesystem and disk drivers it carries.",
   "deliverable": "reports/initramfs.txt.",
   "steps": [
    {
     "cmd": "ls -lh /boot/initrd.img-$(uname -r) > reports/initramfs.txt"
    },
    {
     "text": "lsinitramfs /boot/initrd.img-$(uname -r) | wc -l >> reports/initramfs.txt"
    },
    {
     "text": "lsinitramfs /boot/initrd.img-$(uname -r) | grep -E 'kernel/fs/ext4|ahci|virtio|nvme' | head -n 10 >> reports/initramfs.txt"
    },
    {
     "text": "Read only, Don't run on your VM: sudo update-initramfs -u rebuilds the initramfs on Mint; Red Hat uses dracut, and older systems used mkinitrd."
    }
   ],
   "validation": "cat reports/initramfs.txt shows a size of tens of megabytes, a file count in the thousands, and module paths such as kernel/fs/ext4 or virtio (drivers built into the kernel will not appear).",
   "trap": "The kernel cannot read the root filesystem until it has the right storage and filesystem drivers, so the boot loader loads a small root filesystem into RAM first. The old version was a disk image called an initrd; modern systems use a cpio archive called an initramfs, but the GRUB keyword and Mint's file name still say initrd.",
   "paste": {
    "command": "cat reports/initramfs.txt",
    "checks": [
     {
      "re": "\\s\\d+(\\.\\d+)?M\\s.*initrd\\.img-",
      "say": "ls -lh shows the initramfs size in megabytes"
     },
     {
      "re": "^\\s*\\d{4,6}\\s*$",
      "say": "the file count is in the thousands"
     },
     {
      "re": "kernel/\\S*(ext4|ahci|virtio|nvme)",
      "say": "lists at least one disk or filesystem driver module"
     }
    ]
   },
   "quiz": [
    {
     "id": "why",
     "prompt": "Why does the kernel need an initramfs?",
     "answer": "drivers",
     "options": [
      {
       "value": "drivers",
       "label": "It carries the drivers needed to mount the real root filesystem"
      },
      {
       "value": "menu",
       "label": "It holds the boot menu"
      },
      {
       "value": "swap",
       "label": "It is the first swap area"
      }
     ],
     "explain": "Correct. Once root is mounted, init takes over."
    },
    {
     "id": "rebuild",
     "prompt": "Which command rebuilds the initramfs on Red Hat?",
     "answer": "dracut",
     "options": [
      {
       "value": "dracut",
       "label": "<code>dracut</code>"
      },
      {
       "value": "upd",
       "label": "<code>update-initramfs -u</code>"
      },
      {
       "value": "lsi",
       "label": "<code>lsinitramfs</code>"
      }
     ],
     "explain": "Correct. Mint and Debian use update-initramfs; older systems used mkinitrd."
    }
   ],
   "completion": "Explain what is inside the initramfs: done."
  },
  {
   "id": "17.6",
   "kind": "vm",
   "title": "Trace the default GRUB2 menu entry to its files",
   "navSubtitle": "grub.cfg menuentry",
   "objective": "101.2",
   "difficulty": "Intermediate",
   "source": "Lab 6: Trace the default GRUB2 menu entry to its files",
   "workdir": "~/lpic1-section17",
   "summary": "",
   "scenario": "After a failed patch on db01, the incident lead asks which kernel and initramfs the default boot menu entry actually loads.",
   "task": "Pull the first menu entry and its linux and initrd lines out of grub.cfg and compare them with the running kernel.",
   "deliverable": "reports/grub-trace.txt.",
   "steps": [
    {
     "cmd": "sudo grep -E '^\\s*(menuentry|linux|initrd)\\s' /boot/grub/grub.cfg | head -n 3 > reports/grub-trace.txt"
    },
    {
     "text": "uname -r >> reports/grub-trace.txt"
    },
    {
     "cmd": "sudo sh -c 'cat /boot/efi/EFI/*/grub.cfg' >> reports/grub-trace.txt 2>&1"
    }
   ],
   "validation": "grep -c \"$(uname -r)\" reports/grub-trace.txt returns at least 3: the linux line, the initrd line, and the uname line. On UEFI, the last lines show a short grub.cfg in the ESP that points to the real one under /boot/grub.",
   "trap": "grub.cfg is generated; never edit it by hand. Mint and Debian keep it in /boot/grub/grub.cfg; Red Hat uses /boot/grub2/grub.cfg, and some UEFI systems keep it in /boot/efi/EFI/<distro>/. GRUB Legacy used menu.lst or grub.conf instead. Section 18 covers how the file is built.",
   "paste": {
    "command": "cat reports/grub-trace.txt",
    "checks": [
     {
      "re": "^\\s*linux\\s+\\S*vmlinuz-\\S+",
      "say": "the linux line names a vmlinuz file"
     },
     {
      "re": "^\\s*initrd\\s+\\S*initrd\\.img-\\S+",
      "say": "the initrd line names an initrd.img file"
     },
     {
      "re": "vmlinuz-(\\d\\S*)\\s[\\s\\S]*^\\1\\s*$",
      "say": "the default entry's kernel matches uname -r"
     },
     {
      "re": "configfile|No such file or directory",
      "say": "shows the short grub.cfg in the ESP, or that there is none (BIOS)"
     }
    ]
   },
   "quiz": [
    {
     "id": "cfg",
     "prompt": "Where is the GRUB2 configuration on Mint?",
     "answer": "mint",
     "options": [
      {
       "value": "mint",
       "label": "<code>/boot/grub/grub.cfg</code>"
      },
      {
       "value": "rh",
       "label": "<code>/boot/grub2/grub.cfg</code>"
      },
      {
       "value": "lst",
       "label": "<code>/boot/grub/menu.lst</code>"
      }
     ],
     "explain": "Correct. Red Hat uses /boot/grub2/grub.cfg; menu.lst is GRUB Legacy."
    }
   ],
   "completion": "Trace the default GRUB2 menu entry to its files: done."
  },
  {
   "id": "17.7",
   "kind": "vm",
   "title": "Read the kernel command line in use",
   "navSubtitle": "/proc/cmdline, root=",
   "objective": "101.2",
   "difficulty": "Intermediate",
   "source": "Lab 7: Read the kernel command line in use",
   "workdir": "~/lpic1-section17",
   "summary": "",
   "scenario": "A performance ticket asks whether the boot parameters on your build were changed from the defaults, and which root filesystem the kernel was told to mount.",
   "task": "Record the running kernel's command line and match its root= value to the real root filesystem.",
   "deliverable": "reports/cmdline.txt.",
   "steps": [
    {
     "cmd": "cat /proc/cmdline > reports/cmdline.txt"
    },
    {
     "cmd": "findmnt -no SOURCE,UUID / >> reports/cmdline.txt"
    }
   ],
   "validation": "cat reports/cmdline.txt: the UUID in root=UUID=... on the first line matches the UUID on the second line, and the line includes ro and quiet splash.",
   "trap": "/proc/cmdline shows what the boot loader passed this boot, including temporary edits made at the GRUB menu. ro means the root filesystem is mounted read-only first so it can be checked, then remounted read-write during startup. BOOT_IMAGE is added by GRUB.",
   "paste": {
    "command": "cat reports/cmdline.txt",
    "checks": [
     {
      "re": "^BOOT_IMAGE=",
      "say": "includes /proc/cmdline"
     },
     {
      "re": "root=UUID=([0-9a-f-]+)[\\s\\S]*^\\S+\\s+\\1\\s*$|root=(/dev/\\S+)[\\s\\S]*^\\2\\s",
      "say": "the root= value matches the filesystem mounted on /"
     },
     {
      "re": "\\sro(\\s|$)",
      "say": "the root filesystem starts read-only (ro)"
     },
     {
      "re": "quiet\\s+splash",
      "say": "the default quiet splash parameters are there"
     }
    ]
   },
   "quiz": [
    {
     "id": "ro",
     "prompt": "Why does the command line say <code>ro</code>?",
     "answer": "check",
     "options": [
      {
       "value": "check",
       "label": "Root mounts read-only first so it can be checked, then is remounted read-write"
      },
      {
       "value": "always",
       "label": "Root stays read-only until reboot"
      },
      {
       "value": "rescue",
       "label": "It boots into rescue mode"
      }
     ],
     "explain": "Correct."
    },
    {
     "id": "temp",
     "prompt": "You added a parameter at the GRUB menu for this boot. Where does it show?",
     "answer": "proc",
     "options": [
      {
       "value": "proc",
       "label": "<code>/proc/cmdline</code>"
      },
      {
       "value": "default",
       "label": "<code>/etc/default/grub</code>"
      },
      {
       "value": "cfg",
       "label": "<code>/boot/grub/grub.cfg</code>"
      }
     ],
     "explain": "Correct. /proc/cmdline shows what this boot actually received."
    }
   ],
   "completion": "Read the kernel command line in use: done."
  },
  {
   "id": "17.8",
   "kind": "vm",
   "title": "Explain a GRUB Legacy menu from an old server",
   "navSubtitle": "menu.lst, (hd0,0)",
   "objective": "101.2",
   "difficulty": "Intermediate",
   "source": "Lab 8: Explain a GRUB Legacy menu from an old server",
   "workdir": "~/lpic1-section17",
   "summary": "",
   "scenario": "An old server, web01, still runs GRUB Legacy. The on-call engineer asks which kernel it boots by default and how long the menu waits.",
   "task": "Read samples/menu.lst, number the title sections from zero, and write down which entry boots.",
   "deliverable": "reports/legacy-menu.txt.",
   "steps": [
    {
     "cmd": "grep -E '^(default|timeout|hiddenmenu)' samples/menu.lst > reports/legacy-menu.txt"
    },
    {
     "cmd": "grep '^title' samples/menu.lst | awk '{print NR-1\": \"$0}' >> reports/legacy-menu.txt"
    },
    {
     "cmd": "grep -E 'root|kernel|initrd' samples/menu.lst | head -n 3 >> reports/legacy-menu.txt"
    },
    {
     "cmd": "echo 'Answer: default=1 boots entry 1, the 2.6.32-696 kernel, from (hd0,0) = first disk, first partition = /dev/sda1, after a 5-second hidden menu' >> reports/legacy-menu.txt"
    },
    {
     "text": "Read only, Don't run on your VM: on a GRUB Legacy server, grub-install /dev/sda writes the boot loader to the MBR; edits to menu.lst take effect at the next boot with no extra command."
    }
   ],
   "validation": "grep -c '^[01]: title' reports/legacy-menu.txt returns 2, and the Answer line names the 2.6.32-696 kernel.",
   "trap": "GRUB Legacy counts both disks and partitions from 0, so (hd0,0) is the first partition on the first disk. default counts title sections from 0, so default=1 is the second entry. hiddenmenu hides the menu until a key is pressed. root sets the disk with the kernel; the kernel line holds the path and kernel parameters. Older still, LILO only worked with BIOS; systemd-boot only works with UEFI.",
   "paste": {
    "command": "cat reports/legacy-menu.txt",
    "checks": [
     {
      "re": "^default=1",
      "say": "the default line is included"
     },
     {
      "re": "^[01]: title",
      "say": "both title sections are numbered from 0",
      "count": 2
     },
     {
      "re": "^Answer:.*2\\.6\\.32-696",
      "say": "the Answer line names the 2.6.32-696 kernel"
     }
    ]
   },
   "quiz": [
    {
     "id": "hd00",
     "prompt": "In GRUB Legacy, what is <code>(hd0,0)</code>?",
     "answer": "sda1",
     "options": [
      {
       "value": "sda1",
       "label": "<code>/dev/sda1</code>"
      },
      {
       "value": "sda",
       "label": "<code>/dev/sda</code>, the whole disk"
      },
      {
       "value": "sda0",
       "label": "A partition before sda1"
      }
     ],
     "explain": "Correct. GRUB Legacy counts disks and partitions from 0."
    },
    {
     "id": "default2",
     "prompt": "<code>default=2</code> in menu.lst boots which entry?",
     "answer": "third",
     "options": [
      {
       "value": "second",
       "label": "The second title"
      },
      {
       "value": "third",
       "label": "The third title"
      },
      {
       "value": "last",
       "label": "The last title"
      }
     ],
     "explain": "Correct. default counts titles from 0."
    }
   ],
   "completion": "Explain a GRUB Legacy menu from an old server: done."
  },
  {
   "id": "17.9",
   "kind": "vm",
   "title": "Identify the init system and the default boot target",
   "navSubtitle": "PID 1, runlevel, inittab",
   "objective": "101.2",
   "difficulty": "Advanced",
   "source": "Lab 9: Identify the init system and the default boot target",
   "workdir": "~/lpic1-section17",
   "summary": "",
   "scenario": "A compliance questionnaire asks which init system each server uses and what state it boots into. You also have an old SysVinit server to describe.",
   "task": "Identify PID 1, the default target, and the current runlevel, then read the default runlevel from the sample inittab.",
   "deliverable": "reports/init.txt.",
   "steps": [
    {
     "text": "ps -p 1 -o pid,comm > reports/init.txt"
    },
    {
     "text": "readlink -f /sbin/init >> reports/init.txt"
    },
    {
     "cmd": "systemctl get-default >> reports/init.txt"
    },
    {
     "text": "runlevel >> reports/init.txt"
    },
    {
     "text": "who -r >> reports/init.txt"
    },
    {
     "cmd": "ls /etc/inittab >> reports/init.txt 2>&1"
    },
    {
     "cmd": "grep initdefault samples/inittab >> reports/init.txt"
    }
   ],
   "validation": "cat reports/init.txt shows systemd as PID 1, graphical.target, N 5 from runlevel, No such file or directory for /etc/inittab, and id:3:initdefault: from the sample.",
   "trap": "SysVinit read its default runlevel from /etc/inittab and started services one after another; systemd starts them in parallel and uses targets. Upstart, used by older Ubuntu releases, was managed with initctl. Runlevels are 0 halt, 1 single user, 2 to 5 multi-user (3 text, 5 graphical on Red Hat), and 6 reboot. Changing runlevels used init or telinit; never run init 0 or init 6 on this VM.",
   "paste": {
    "command": "cat reports/init.txt",
    "checks": [
     {
      "re": "^\\s*1\\s+systemd\\s*$",
      "say": "PID 1 is systemd"
     },
     {
      "re": "^graphical\\.target\\s*$",
      "say": "the default target is graphical.target"
     },
     {
      "re": "^N 5\\s*$|run-level 5",
      "say": "the current runlevel equivalent is 5"
     },
     {
      "re": "^id:3:initdefault:",
      "say": "the sample inittab's default runlevel is included"
     }
    ]
   },
   "quiz": [
    {
     "id": "inittab",
     "prompt": "Where did SysVinit read its default runlevel?",
     "answer": "inittab",
     "options": [
      {
       "value": "inittab",
       "label": "The initdefault line in <code>/etc/inittab</code>"
      },
      {
       "value": "default",
       "label": "<code>/etc/default/grub</code>"
      },
      {
       "value": "rc",
       "label": "<code>/etc/rc.local</code>"
      }
     ],
     "explain": "Correct."
    },
    {
     "id": "upstart",
     "prompt": "Which init system was managed with <code>initctl</code>?",
     "answer": "Upstart",
     "options": [
      "SysVinit",
      "Upstart",
      "systemd"
     ],
     "explain": "Correct. Upstart was used by older Ubuntu releases."
    }
   ],
   "completion": "Identify the init system and the default boot target: done."
  },
  {
   "id": "17.10",
   "kind": "vm",
   "title": "Map old runlevels to systemd targets",
   "navSubtitle": "runlevelN.target",
   "objective": "101.2",
   "difficulty": "Advanced",
   "source": "Lab 10: Map old runlevels to systemd targets",
   "workdir": "~/lpic1-section17",
   "summary": "",
   "scenario": "A runbook written for SysVinit servers says to switch to runlevel 3 for maintenance. The team wants the systemd equivalent documented before anyone follows it.",
   "task": "List the runlevel compatibility targets and the targets that are active now.",
   "deliverable": "reports/runlevel-map.txt.",
   "steps": [
    {
     "cmd": "ls -l /lib/systemd/system/runlevel?.target > reports/runlevel-map.txt"
    },
    {
     "cmd": "systemctl list-units --type=target --state=active --no-pager >> reports/runlevel-map.txt"
    }
   ],
   "validation": "grep -E 'runlevel(1|3|5).target' reports/runlevel-map.txt shows runlevel1 linked to rescue.target, runlevel3 to multi-user.target, and runlevel5 to graphical.target.",
   "trap": "These links let old commands keep working. multi-user.target is the text-mode, networked state; graphical.target adds the desktop. Switching targets on a live system (systemctl isolate) and changing the default (systemctl set-default) are later topics; do not run them here.",
   "paste": {
    "command": "cat reports/runlevel-map.txt",
    "checks": [
     {
      "re": "runlevel1\\.target -> rescue\\.target",
      "say": "runlevel1 points to rescue.target"
     },
     {
      "re": "runlevel3\\.target -> multi-user\\.target",
      "say": "runlevel3 points to multi-user.target"
     },
     {
      "re": "runlevel5\\.target -> graphical\\.target",
      "say": "runlevel5 points to graphical.target"
     },
     {
      "re": "^\\s*\\S*\\s*multi-user\\.target\\s+loaded\\s+active",
      "say": "the active targets are listed"
     }
    ]
   },
   "quiz": [
    {
     "id": "rl3",
     "prompt": "Which systemd target matches the old text-mode runlevel 3?",
     "answer": "multi",
     "options": [
      {
       "value": "multi",
       "label": "<code>multi-user.target</code>"
      },
      {
       "value": "graph",
       "label": "<code>graphical.target</code>"
      },
      {
       "value": "rescue",
       "label": "<code>rescue.target</code>"
      }
     ],
     "explain": "Correct. graphical.target adds the desktop, like runlevel 5."
    }
   ],
   "completion": "Map old runlevels to systemd targets: done."
  },
  {
   "id": "17.11",
   "kind": "vm",
   "title": "Find a hardware failure in the kernel ring buffer",
   "navSubtitle": "dmesg -T, --level",
   "objective": "101.2",
   "difficulty": "Advanced",
   "source": "Lab 11: Find a hardware failure in the kernel ring buffer",
   "workdir": "~/lpic1-section17",
   "summary": "",
   "scenario": "After a NIC replacement on web01, the network card does not appear. The hardware team sent you the boot messages, and you also want the same evidence format from your own VM.",
   "task": "Find the failure in the sample log, then read your own kernel ring buffer with readable timestamps and only warnings and errors.",
   "deliverable": "reports/web01-findings.txt and reports/dmesg.txt.",
   "steps": [
    {
     "cmd": "grep -iE 'fail|error' samples/boot-incident.log > reports/web01-findings.txt"
    },
    {
     "cmd": "sudo dmesg -T | head -n 3 > reports/dmesg.txt"
    },
    {
     "cmd": "sudo dmesg --level=err,warn >> reports/dmesg.txt"
    },
    {
     "cmd": "sudo dmesg | grep -i 'command line' >> reports/dmesg.txt"
    }
   ],
   "validation": "grep -c . reports/web01-findings.txt returns 2 (the missing firmware file and the failed probe). reports/dmesg.txt starts with the Linux version line and contains the Kernel command line.",
   "trap": "The kernel ring buffer is a fixed-size area in RAM. New messages push out the oldest, so read boot messages soon after boot or from the journal. Timestamps are seconds since boot unless you add -T. dmesg -c clears the buffer after reading it; do not use it. Mint requires sudo for dmesg.",
   "paste": {
    "command": "cat reports/web01-findings.txt reports/dmesg.txt",
    "checks": [
     {
      "re": "failed to load e1000e/nic-fw\\.bin",
      "say": "web01's missing firmware file is found"
     },
     {
      "re": "probe of \\S+ failed with error -2",
      "say": "web01's failed probe is found"
     },
     {
      "re": "^\\[[a-z]{3} [a-z]{3}\\s+\\d+ \\d\\d:\\d\\d:\\d\\d \\d{4}\\] Linux version",
      "say": "dmesg -T starts with the Linux version line and real timestamps"
     },
     {
      "re": "Kernel command line:",
      "say": "the kernel command line message is included"
     }
    ]
   },
   "quiz": [
    {
     "id": "ring",
     "prompt": "Why might dmesg no longer show the first boot messages?",
     "answer": "ring",
     "options": [
      {
       "value": "ring",
       "label": "The ring buffer is fixed in size, so new messages push old ones out"
      },
      {
       "value": "reboot",
       "label": "dmesg is cleared every hour"
      },
      {
       "value": "root",
       "label": "Only root can see them"
      }
     ],
     "explain": "Correct. journalctl -k keeps them in the journal."
    },
    {
     "id": "c",
     "prompt": "Which dmesg option should you avoid on a shared server?",
     "answer": "c",
     "options": [
      {
       "value": "c",
       "label": "<code>-c</code>"
      },
      {
       "value": "T",
       "label": "<code>-T</code>"
      },
      {
       "value": "level",
       "label": "<code>--level</code>"
      }
     ],
     "explain": "Correct. -c clears the buffer after reading it."
    }
   ],
   "completion": "Find a hardware failure in the kernel ring buffer: done."
  },
  {
   "id": "17.12",
   "kind": "vm",
   "title": "Compare this boot with the previous boot in the journal",
   "navSubtitle": "journalctl -b, -k, --list-boots",
   "objective": "101.2",
   "difficulty": "Advanced",
   "source": "Lab 12: Compare this boot with the previous boot in the journal",
   "workdir": "~/lpic1-section17",
   "summary": "",
   "scenario": "A user reports that app02 rebooted overnight. You need the boot list, the kernel messages for this boot, and any errors from this boot and the last one.",
   "task": "List recorded boots, then pull kernel messages and errors for the current and previous boot, and check the boot log files.",
   "deliverable": "reports/journal.txt.",
   "steps": [
    {
     "text": "journalctl --list-boots --no-pager | tail -n 3 > reports/journal.txt"
    },
    {
     "text": "journalctl -b -k --no-pager | head -n 3 >> reports/journal.txt"
    },
    {
     "text": "journalctl -b -p err --no-pager >> reports/journal.txt"
    },
    {
     "text": "journalctl -b -1 -k --no-pager | tail -n 3 >> reports/journal.txt 2>&1"
    },
    {
     "cmd": "sudo ls -l /var/log/boot.log /var/log/kern.log >> reports/journal.txt 2>&1"
    }
   ],
   "validation": "cat reports/journal.txt shows at least one boot in the list (0 is the current boot), the first kernel lines of this boot, and either messages from boot -1 or a note that no previous boot is recorded. If the output is empty, rerun the journalctl commands with sudo.",
   "trap": "journalctl -b is this boot, -b -1 the previous one, -k (or --dmesg) only kernel messages, and -p err errors and worse. Older boots are only available when the journal is persistent (/var/log/journal); a volatile journal in /run/log/journal is lost at shutdown. /var/log/boot.log holds the startup messages on many distributions.",
   "paste": {
    "command": "cat reports/journal.txt",
    "checks": [
     {
      "re": "^\\s*0\\s+[0-9a-f]{32}\\s",
      "say": "the boot list shows the current boot (0)"
     },
     {
      "re": "kernel: Linux version",
      "say": "the first kernel lines of this boot are there"
     },
     {
      "re": "^\\s*-1\\s+[0-9a-f]{32}\\s|No such boot|not available|no persistent journal",
      "say": "shows the previous boot, or a note that none is recorded"
     },
     {
      "re": "/var/log/(boot|kern)\\.log",
      "say": "includes the check of the boot log files"
     }
    ]
   },
   "quiz": [
    {
     "id": "prev",
     "prompt": "Which command shows kernel messages from the previous boot?",
     "answer": "b1k",
     "options": [
      {
       "value": "b1k",
       "label": "<code>journalctl -b -1 -k</code>"
      },
      {
       "value": "b1",
       "label": "<code>journalctl -1</code>"
      },
      {
       "value": "dmesg",
       "label": "<code>dmesg -b -1</code>"
      }
     ],
     "explain": "Correct. It needs a persistent journal in /var/log/journal."
    },
    {
     "id": "err",
     "prompt": "Which option limits journalctl to errors and worse?",
     "answer": "perr",
     "options": [
      {
       "value": "perr",
       "label": "<code>-p err</code>"
      },
      {
       "value": "k",
       "label": "<code>-k</code>"
      },
      {
       "value": "e",
       "label": "<code>-e</code>"
      }
     ],
     "explain": "Correct."
    }
   ],
   "completion": "Compare this boot with the previous boot in the journal: done."
  },
  {
   "id": "17.13",
   "kind": "vm",
   "title": "Measure each boot stage",
   "navSubtitle": "systemd-analyze",
   "objective": "101.2",
   "difficulty": "Advanced",
   "source": "Lab 13: Measure each boot stage",
   "workdir": "~/lpic1-section17",
   "summary": "",
   "scenario": "Developers complain that app02 takes too long to come back after patching. The manager asks how long each stage of the boot takes and which services are slowest.",
   "task": "Record total boot time by stage, the slowest units, and the critical chain.",
   "deliverable": "reports/boot-time.txt.",
   "steps": [
    {
     "text": "systemd-analyze > reports/boot-time.txt"
    },
    {
     "text": "systemd-analyze blame --no-pager | head -n 5 >> reports/boot-time.txt"
    },
    {
     "text": "systemd-analyze critical-chain --no-pager >> reports/boot-time.txt"
    }
   ],
   "validation": "head -n 1 reports/boot-time.txt shows Startup finished in, with separate kernel and userspace times (UEFI systems also show firmware and loader).",
   "trap": "The stages in systemd-analyze match the boot sequence: firmware, loader, kernel (including the initramfs), and userspace (systemd and services). blame lists units by start time, but parallel starts mean the slowest unit is not always the one delaying the boot; critical-chain shows the chain that did.",
   "paste": {
    "command": "cat reports/boot-time.txt",
    "checks": [
     {
      "re": "^Startup finished in .*\\(kernel\\).*\\(userspace\\)",
      "say": "the first line shows kernel and userspace times"
     },
     {
      "re": "^\\s*(\\d+min\\s+)?\\d+(\\.\\d+)?m?s\\s+\\S+\\.(service|mount|device|socket|target|swap)\\s*$",
      "say": "the slowest units from blame are listed",
      "min": 3
     },
     {
      "re": "\\.target @\\d+(\\.\\d+)?m?s",
      "say": "the critical chain is included"
     }
    ]
   },
   "quiz": [
    {
     "id": "chain",
     "prompt": "Which command shows the units that actually delayed the boot?",
     "answer": "cc",
     "options": [
      {
       "value": "cc",
       "label": "<code>systemd-analyze critical-chain</code>"
      },
      {
       "value": "blame",
       "label": "<code>systemd-analyze blame</code>"
      },
      {
       "value": "plain",
       "label": "<code>systemd-analyze</code>"
      }
     ],
     "explain": "Correct. blame ignores that units start in parallel."
    }
   ],
   "completion": "Measure each boot stage: done."
  }
 ],
 "review": {
  "traps": [
   "Mixing up the boot order. It is firmware (POST), boot loader, kernel with initramfs, then init and services.",
   "Thinking UEFI reads the MBR. BIOS runs the boot code in the MBR; UEFI loads a .efi file from the EFI system partition, mounted on /boot/efi.",
   "Forgetting how to tell them apart. /sys/firmware/efi exists only on a system booted with UEFI.",
   "Forgetting the MBR layout: 446 bytes of boot code, a 64-byte partition table, and the 55 aa signature, 512 bytes in total.",
   "Thinking chain loading is a modern feature. It means a small first-stage loader passes control to a larger one, as the MBR does.",
   "Confusing initrd and initramfs. The old initrd was a disk image; the modern initramfs is a cpio archive. The GRUB keyword is still initrd.",
   "Forgetting why the initramfs exists: to give the kernel the drivers it needs to mount the real root filesystem.",
   "Mixing up kernel file names. vmlinuz is the compressed kernel; initrd.img or initramfs is the RAM filesystem; both live in /boot.",
   "Counting GRUB Legacy partitions from 1. GRUB Legacy counts disks and partitions from 0: (hd0,0) is /dev/sda1. GRUB2 counts partitions from 1.",
   "Mixing up boot loaders. LILO is BIOS-only and obsolete, GRUB Legacy uses menu.lst or grub.conf, GRUB2 uses grub.cfg, and systemd-boot works only with UEFI.",
   "Forgetting that systemd is PID 1 on modern systems, that its name is written in lowercase, and that Upstart used initctl.",
   "Thinking SysVinit's default runlevel lives anywhere but /etc/inittab (the initdefault line).",
   "Expecting dmesg to hold every boot message forever. The ring buffer is fixed in size; use journalctl -k, journalctl -b, or /var/log/boot.log.",
   "Expecting journalctl -b -1 to work everywhere. Previous boots need a persistent journal in /var/log/journal."
  ],
  "trapQuiz": [
   {
    "id": "tq1",
    "prompt": "What is the order of the boot?",
    "answer": "order",
    "options": [
     {
      "value": "order",
      "label": "Firmware, boot loader, kernel with initramfs, init"
     },
     {
      "value": "o2",
      "label": "Boot loader, firmware, init, kernel"
     },
     {
      "value": "o3",
      "label": "Firmware, kernel, boot loader, init"
     }
    ],
    "explain": "Correct."
   },
   {
    "id": "tq2",
    "prompt": "Where does UEFI load its boot loader from?",
    "answer": "esp",
    "options": [
     {
      "value": "esp",
      "label": "A .efi file on the EFI system partition"
     },
     {
      "value": "mbr",
      "label": "The first 446 bytes of the disk"
     },
     {
      "value": "boot",
      "label": "/boot/vmlinuz"
     }
    ],
    "explain": "Correct. BIOS is the one that runs MBR code."
   },
   {
    "id": "tq3",
    "prompt": "How big is the MBR boot code area?",
    "answer": "446",
    "options": [
     "64",
     "446",
     "510",
     "512"
    ],
    "explain": "Correct. Then 64 bytes of partition table and the 55 aa signature."
   },
   {
    "id": "tq4",
    "prompt": "How does the modern initramfs differ from the old initrd?",
    "answer": "cpio",
    "options": [
     {
      "value": "cpio",
      "label": "initramfs is a cpio archive; initrd was a disk image"
     },
     {
      "value": "same",
      "label": "They are the same file format"
     },
     {
      "value": "kernel",
      "label": "initramfs is part of the kernel image"
     }
    ],
    "explain": "Correct. The GRUB keyword is still initrd."
   },
   {
    "id": "tq5",
    "prompt": "Which GRUB Legacy name means <code>/dev/sdb2</code>?",
    "answer": "hd11",
    "options": [
     {
      "value": "hd11",
      "label": "<code>(hd1,1)</code>"
     },
     {
      "value": "hd12",
      "label": "<code>(hd1,2)</code>"
     },
     {
      "value": "hd22",
      "label": "<code>(hd2,2)</code>"
     }
    ],
    "explain": "Correct. Legacy counts disks and partitions from 0."
   },
   {
    "id": "tq6",
    "prompt": "Which boot loader works only with UEFI?",
    "answer": "sdboot",
    "options": [
     {
      "value": "lilo",
      "label": "LILO"
     },
     {
      "value": "sdboot",
      "label": "systemd-boot"
     },
     {
      "value": "grub2",
      "label": "GRUB2"
     }
    ],
    "explain": "Correct. LILO is BIOS-only; GRUB2 handles both."
   },
   {
    "id": "tq7",
    "prompt": "What is PID 1 on Linux Mint?",
    "answer": "systemd",
    "options": [
     "init.d",
     "systemd",
     "upstart",
     "kthreadd"
    ],
    "explain": "Correct. It is written in lowercase."
   },
   {
    "id": "tq8",
    "prompt": "<code>journalctl -b -1</code> says the boot isn't available. Why?",
    "answer": "volatile",
    "options": [
     {
      "value": "volatile",
      "label": "The journal isn't persistent, so earlier boots weren't kept"
     },
     {
      "value": "root",
      "label": "-b -1 only works for root"
     },
     {
      "value": "syntax",
      "label": "The option should be -b 1"
     }
    ],
    "explain": "Correct. Persistent logs live in /var/log/journal."
   }
  ],
  "challenge": {
   "intro": "Complete these tasks without notes, using only your Linux Mint VM and ~/lpic1-section17. Every task is read-only: do not reboot, reinstall the boot loader, or change any boot setting.",
   "tasks": [
    "Prove whether your VM booted with BIOS or UEFI and save the evidence to reports/challenge-firmware.txt.",
    "Show the partition table type of your boot disk and, if there is one, where the EFI system partition is mounted.",
    "Show the boot signature at the end of the first sector of the disk without writing to the disk.",
    "Name the running kernel and the initramfs file that goes with it, and prove the initramfs contains the ext4 driver or explain why it might not.",
    "Show the kernel and initramfs paths that the default GRUB2 entry loads and the kernel command line in use.",
    "Explain which entry the sample GRUB Legacy menu.lst boots and which Linux device (hd0,0) refers to.",
    "Identify PID 1, the default target, and the runlevel equivalent, and name the file a SysVinit system would use instead.",
    "List the errors logged during the current boot and the total time each boot stage took."
   ],
   "outro": "Your final handoff is the reports directory. For each file, write one sentence naming the boot stage it gives evidence for."
  },
  "questions": [
   {
    "q": "Hypervisor team request: “We are moving guests to new hosts. Tell us which ones booted with UEFI.”",
    "a": "Check each guest for <code>/sys/firmware/efi</code>: it exists only on a UEFI boot. <code>sudo efibootmgr</code> lists the firmware boot entries on UEFI, and <code>findmnt /boot/efi</code> shows the EFI system partition."
   },
   {
    "q": "Incident lead request: “After last night's patch, which kernel and initramfs does the default boot entry load?”",
    "a": "Read the default <code>menuentry</code> and its <code>linux</code> and <code>initrd</code> lines in <code>/boot/grub/grub.cfg</code> (with sudo), and compare the version with <code>uname -r</code>. <code>cat /proc/cmdline</code> shows the kernel actually booted."
   },
   {
    "q": "Storage vendor request: “Does your initramfs carry the driver for the disk controller, or is it built into the kernel?”",
    "a": "List it with <code>lsinitramfs /boot/initrd.img-$(uname -r) | grep -E 'ahci|nvme|virtio'</code>. If the module isn't there, check whether it's built in with <code>grep -E 'AHCI|NVME' /boot/config-$(uname -r)</code> (=y means built in)."
   },
   {
    "q": "On-call request: “The old web01 server uses menu.lst with default=1. Which kernel will it boot, and from which partition?”",
    "a": "default counts titles from 0, so <code>default=1</code> boots the second title. Its <code>root (hd0,0)</code> line means the first partition of the first disk, <code>/dev/sda1</code>."
   },
   {
    "q": "Compliance request: “Which init system does this server use, and what state does it boot into by default?”",
    "a": "<code>ps -p 1 -o comm</code> shows <code>systemd</code>, and <code>systemctl get-default</code> shows the default target, usually <code>graphical.target</code> (<code>runlevel</code> prints N 5). A SysVinit system would use the initdefault line in /etc/inittab."
   },
   {
    "q": "Hardware team request: “The new network card did not come up. Find the kernel messages from boot that explain why.”",
    "a": "<code>sudo dmesg -T --level=err,warn</code>, or <code>journalctl -b -k -p warning</code>, and grep for the driver name. A line such as <em>failed to load … firmware</em> or <em>probe … failed</em> explains it."
   },
   {
    "q": "Manager request: “The server took ages to come back after patching. Show me which part of the boot was slow.”",
    "a": "<code>systemd-analyze</code> shows the time spent in firmware, loader, kernel and userspace. <code>systemd-analyze blame</code> lists the slowest units, and <code>systemd-analyze critical-chain</code> shows the chain that delayed the boot."
   }
  ],
  "mastery": [
   "I can describe the boot sequence from power-on through firmware, boot loader, kernel, initramfs, and init to the login prompt.",
   "I can tell whether a system booted with BIOS or UEFI and explain where each one finds its boot loader.",
   "I can explain the MBR layout, its 446-byte boot code area, and chain loading.",
   "I can find the EFI system partition and the boot loader files in /boot/efi/EFI.",
   "I can identify the running kernel and its files in /boot, and explain what the z in vmlinuz means.",
   "I can explain why the initramfs exists and list its contents with lsinitramfs.",
   "I can find the kernel and initramfs a GRUB2 entry loads, and read the active command line in /proc/cmdline.",
   "I can read a GRUB Legacy menu.lst and translate (hd0,0) into a Linux device name.",
   "I can name the boot loaders LILO, GRUB Legacy, GRUB2, and systemd-boot and say where each is used.",
   "I can identify the init system and default target, and map SysVinit runlevels to systemd targets.",
   "I can read boot messages with dmesg, journalctl -b, journalctl -k, and /var/log/boot.log.",
   "I can measure boot stages with systemd-analyze and find the slowest units."
  ]
 }
});
