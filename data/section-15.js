/* Section 15: Partitions, Filesystems and Swap. Generated from LPIC_Section15_Lab_Workbook.docx by vm_section.py;
   paste checks, quizzes and model answers were added for the app. */
LPIC.section({
 "id": "section-15",
 "number": 15,
 "title": "Partitions, Filesystems and Swap",
 "objectives": [
  "104.1",
  "104.3"
 ],
 "kind": "vm",
 "source": "LPIC_Section15_Lab_Workbook.docx",
 "scenario": "Objectives 104.1 and 104.3: Create MBR and GPT partitions with fdisk, gdisk and parted, make filesystems and swap, and mount them by device, UUID and label, using disk images attached as loop devices.",
 "overview": {
  "paragraphs": [
   "Treat each lab like a storage request from a team: a new data disk for web01, a database volume for db01, a boot partition for a UEFI build. Read the scenario, make exactly the partitions, filesystems or mounts it asks for, and prove the result from the command line.",
   "Partitioning and formatting erase data, so nothing in this workbook touches your VM's real disk. Lab Setup creates three image files and attaches them as loop devices, and every lab works on those. The loop devices behave like real disks: fdisk, gdisk, parted, mkfs, mkswap, mount and blkid all work on them. Lab 14 detaches them again. If you are ever unsure which device a command will touch, run echo $MBR $GPT $PRT and lsblk first.",
   "You will also look at /etc/fstab, but you will never edit it. Lab 13 works on a copy and tests it with findmnt --verify and mount --fake, which change nothing."
  ],
  "setup": [
   {
    "text": "Step 1: Install the partitioning and filesystem tools. Most are already on Mint; apt will just report those as the newest version:"
   },
   {
    "cmd": "sudo apt install fdisk gdisk parted xfsprogs dosfstools exfatprogs"
   },
   {
    "text": "Step 2: Create the practice workspace and the mount points:"
   },
   {
    "cmd": "mkdir -p ~/lpic1-section15/{reports,images,configs,mnt/web,mnt/db}"
   },
   {
    "cmd": "cd ~/lpic1-section15"
   },
   {
    "text": "Step 3: Create three blank disk images. They are sparse, so they use almost no real space until you write to them:"
   },
   {
    "cmd": "rm -f images/*.img; truncate -s 1G images/mbr.img; truncate -s 1G images/gpt.img; truncate -s 512M images/parted.img"
   },
   {
    "text": "Step 4: Create a sample fstab to read in Lab 13:"
   },
   {
    "cmd": "printf '# <file system>                           <mount point>  <type>   <options>              <dump> <pass>\\nUUID=3f1c2a7e-0d5b-4c11-9a51-2b7f1e9c0a11  /              ext4     errors=remount-ro      0      1\\nUUID=8C21-4F0A                             /boot/efi      vfat     umask=0077             0      1\\nLABEL=dbdata                               /srv/db        xfs      defaults,noatime       0      2\\n/dev/sdb1                                  /srv/web       ext4     defaults               0      2\\n/swapfile                                  none           swap     sw                     0      0\\n/dev/sr0                                   /media/cdrom   iso9660  ro,user,noauto         0      0\\n' > configs/fstab.sample"
   },
   {
    "text": "Step 5: Record your VM's main disk name, then attach the three images as loop devices with partition scanning turned on (-P). Each variable holds the loop device for one image:"
   },
   {
    "cmd": "DISK=$(lsblk -dno NAME,TYPE | awk '$2==\"disk\"{print $1; exit}'); echo $DISK"
   },
   {
    "cmd": "sudo -v; MBR=$(sudo losetup -fP --show images/mbr.img); GPT=$(sudo losetup -fP --show images/gpt.img); PRT=$(sudo losetup -fP --show images/parted.img); echo $MBR $GPT $PRT | tee reports/loop-devices.txt"
   },
   {
    "text": "Step 6: If you open a new terminal, cd ~/lpic1-section15 and reload the variables instead of attaching the images again:"
   },
   {
    "cmd": "DISK=$(lsblk -dno NAME,TYPE | awk '$2==\"disk\"{print $1; exit}'); MBR=$(losetup -j images/mbr.img | cut -d: -f1); GPT=$(losetup -j images/gpt.img | cut -d: -f1); PRT=$(losetup -j images/parted.img | cut -d: -f1); echo $MBR $GPT $PRT"
   },
   {
    "text": "Validation check: Run losetup -l | grep lpic1-section15 and confirm three loop devices point at your three images. Run lsblk $MBR $GPT $PRT and confirm three loop disks of 1G, 1G and 512M with no partitions. To start over at any point, run Lab 14, then Steps 3 and 5 again."
   }
  ],
  "commands": [
   "cat /proc/partitions",
   "lsblk",
   "lsblk -f",
   "fdisk",
   "fdisk -l",
   "fdisk keys m n p e t l w q",
   "gdisk",
   "gdisk -l",
   "gdisk keys ? n p i L w q",
   "parted",
   "parted -l",
   "parted print",
   "mklabel msdos",
   "mklabel gpt",
   "mkpart",
   "set N esp on",
   "unit MiB",
   "partprobe",
   "mkfs -t ext4",
   "mkfs.ext4",
   "mkfs.xfs",
   "mkfs.vfat",
   "mkfs.exfat",
   "mkfs -L",
   "mkswap",
   "swapon",
   "swapon --show",
   "swapoff",
   "free -h",
   "/proc/filesystems",
   "blkid",
   "e2label",
   "/dev/disk/by-uuid",
   "/dev/disk/by-label",
   "mount",
   "mount -t",
   "mount -o ro",
   "mount -o remount",
   "rw",
   "mount UUID=",
   "mount LABEL=",
   "umount",
   "findmnt",
   "/etc/fstab",
   "defaults",
   "auto",
   "noauto",
   "user",
   "nouser",
   "rw",
   "ro",
   "mount -a",
   "findmnt --verify",
   "losetup -fP --show and losetup -d"
  ],
  "memoryHook": "Remember the order with T-P-F-M: Table, Partition, Filesystem, Mount. First the disk gets a partition table (MBR or GPT). Then you cut partitions with fdisk, gdisk or parted. Then mkfs or mkswap puts a filesystem or swap signature in a partition. Finally mount, swapon or /etc/fstab makes it usable. Every request in this section is one or more of those four steps, and lsblk -f shows you which step a device has reached.",
  "reference": []
 },
 "lessons": [
  {
   "id": "15.1",
   "kind": "vm",
   "title": "Take a storage inventory before any change",
   "navSubtitle": "/proc/partitions, lsblk",
   "objective": "104.1",
   "difficulty": "Beginner",
   "source": "Lab 1: Take a storage inventory before any change",
   "workdir": "~/lpic1-section15",
   "summary": "",
   "scenario": "Change STOR-2041 adds three new disks to app02. The change process requires a record of the partitions the kernel knows about before you touch anything.",
   "task": "Save the kernel's partition list and the lsblk tree, and confirm the three new disks have no partitions.",
   "deliverable": "reports/partitions-before.txt",
   "steps": [
    {
     "cmd": "cat /proc/partitions > reports/partitions-before.txt"
    },
    {
     "cmd": "lsblk >> reports/partitions-before.txt"
    },
    {
     "cmd": "lsblk $MBR $GPT $PRT >> reports/partitions-before.txt"
    }
   ],
   "validation": "grep -c loop reports/partitions-before.txt returns at least 3, and the last lsblk shows each loop disk with no child partitions.",
   "trap": "/proc/partitions shows what the kernel currently has in memory, in 1 KiB blocks. A partition written to disk by a tool the kernel was not told about will not appear here until the table is reread.",
   "paste": {
    "command": "cat reports/partitions-before.txt",
    "checks": [
     {
      "re": "major\\s+minor\\s+#blocks\\s+name",
      "say": "includes the kernel's list from /proc/partitions"
     },
     {
      "re": "NAME\\s+MAJ:MIN",
      "say": "includes lsblk output"
     },
     {
      "re": "\\bloop\\d+\\b",
      "say": "lists at least three loop devices",
      "min": 3
     },
     {
      "re": "\\bloop\\d+p\\d",
      "say": "no partitions on the loop disks yet",
      "absent": true
     }
    ]
   },
   "quiz": [
    {
     "id": "units",
     "prompt": "In what units does <code>/proc/partitions</code> show sizes?",
     "answer": "kib",
     "options": [
      {
       "value": "kib",
       "label": "1 KiB blocks"
      },
      {
       "value": "sec",
       "label": "512-byte sectors"
      },
      {
       "value": "mb",
       "label": "Megabytes"
      }
     ],
     "explain": "Correct. The #blocks column counts 1 KiB blocks."
    }
   ],
   "completion": "Take a storage inventory before any change: done."
  },
  {
   "id": "15.2",
   "kind": "vm",
   "title": "Choose MBR or GPT for each request",
   "navSubtitle": "MBR or GPT",
   "objective": "104.1",
   "difficulty": "Beginner",
   "source": "Lab 2: Choose MBR or GPT for each request",
   "workdir": "~/lpic1-section15",
   "summary": "",
   "scenario": "Three requests arrive at once: a 4 TB data disk for db01, a small disk that must boot on an old BIOS-only server and needs six partitions, and a disk for a new UEFI build. You must pick a partition table for each and check what your own VM uses.",
   "task": "Check the partition table on the VM's disk and on the blank images, then write your decision for each request.",
   "deliverable": "reports/table-choice.txt",
   "steps": [
    {
     "cmd": "sudo parted -l 2>&1 | grep -E '^(Model|Disk /dev|Partition Table|Error)' > reports/table-choice.txt"
    },
    {
     "cmd": "sudo fdisk -l /dev/$DISK | grep -i 'disklabel type' >> reports/table-choice.txt"
    },
    {
     "text": "nano reports/table-choice.txt and add one line per request with your choice and reason. Hint: MBR tops out near 2 TB (2 TiB) and four primary partitions, so six partitions need an extended partition with logical partitions inside it. GPT has no partition types, allows 128 partitions by default, keeps a backup copy of its table at the end of the disk, and is required for UEFI boot."
    }
   ],
   "validation": "grep -c 'Partition Table' reports/table-choice.txt returns at least 1, and the blank images show unrecognised disk label or Partition Table: unknown.",
   "trap": "fdisk calls an MBR table dos. On GPT disks, sector 0 holds a protective MBR so older tools do not treat the disk as empty. Saying GPT partition table is redundant because the T already stands for table.",
   "paste": {
    "command": "cat reports/table-choice.txt",
    "checks": [
     {
      "re": "Partition Table:",
      "say": "shows at least one Partition Table line from parted"
     },
     {
      "re": "Partition Table: unknown|unrecognised disk label|unrecognized disk label",
      "say": "shows the blank images have no table yet"
     },
     {
      "re": "Disklabel type: (gpt|dos)",
      "say": "shows your VM disk's label type from fdisk"
     }
    ]
   },
   "quiz": [
    {
     "id": "4tb",
     "prompt": "db01's new disk is 4 TB. Which partition table does it need?",
     "answer": "gpt",
     "options": [
      {
       "value": "mbr",
       "label": "MBR"
      },
      {
       "value": "gpt",
       "label": "GPT"
      },
      {
       "value": "either",
       "label": "Either works"
      }
     ],
     "explain": "Correct. MBR tops out at about 2 TiB, so a 4 TB disk needs GPT."
    },
    {
     "id": "six",
     "prompt": "A BIOS-only server needs six partitions on an MBR disk. How?",
     "answer": "ext",
     "options": [
      {
       "value": "ext",
       "label": "Three primaries plus an extended partition holding logical ones"
      },
      {
       "value": "six",
       "label": "Six primary partitions"
      },
      {
       "value": "cant",
       "label": "It can't be done"
      }
     ],
     "explain": "Correct. MBR allows four primaries, so one becomes an extended container for logical partitions."
    }
   ],
   "completion": "Choose MBR or GPT for each request: done."
  },
  {
   "id": "15.3",
   "kind": "vm",
   "title": "Build an MBR layout with fdisk",
   "navSubtitle": "fdisk, primary/extended/logical",
   "objective": "104.1",
   "difficulty": "Intermediate",
   "source": "Lab 3: Build an MBR layout with fdisk",
   "workdir": "~/lpic1-section15",
   "summary": "",
   "scenario": "The old BIOS server's disk needs six partitions: data, swap, a spare, and three more for logs and transfers. You are using the MBR image to build and check the layout.",
   "task": "Create three primary partitions, an extended partition with the rest of the disk, and two logical partitions inside it. Set partition 2 to the Linux swap type.",
   "deliverable": "reports/mbr-layout.txt",
   "steps": [
    {
     "cmd": "sudo fdisk $MBR"
    },
    {
     "text": "Press m to read the help. Type n, Enter (primary), Enter (number 1), Enter (first sector), +300M. Type n, Enter, Enter, Enter, +100M. Type t, 2, then 82 to set partition 2 to Linux swap. Type n, Enter, Enter, Enter, +100M."
    },
    {
     "text": "Type n, then e for extended (fdisk picks number 4 itself), and press Enter twice to give it the rest of the disk. Type n, Enter, +250M for logical partition 5, then n, Enter, Enter for logical partition 6. Type p to review and w to write."
    },
    {
     "cmd": "sudo fdisk -l $MBR > reports/mbr-layout.txt"
    }
   ],
   "validation": "grep -c \"^${MBR}p\" reports/mbr-layout.txt returns 6, and the list shows Extended for partition 4 and Linux swap / Solaris for partition 2.",
   "trap": "Primary partitions use numbers 1 to 4; logical partitions always start at 5, even if only one primary exists. The extended partition is only a container for logical partitions and is never formatted. Nothing is saved until you press w; q quits without writing.",
   "paste": {
    "command": "cat reports/mbr-layout.txt",
    "checks": [
     {
      "re": "Disklabel type: dos",
      "say": "the disk has an MBR (dos) label"
     },
     {
      "re": "^/dev/loop\\d+p[1-6]\\s",
      "say": "six partitions are listed",
      "count": 6
     },
     {
      "re": "^/dev/loop\\d+p4\\s.*Extended",
      "say": "partition 4 is the extended partition"
     },
     {
      "re": "^/dev/loop\\d+p2\\s.*Linux swap",
      "say": "partition 2 has the Linux swap type"
     }
    ]
   },
   "quiz": [
    {
     "id": "logical",
     "prompt": "On an MBR disk, what number does the first logical partition get?",
     "answer": "5",
     "options": [
      "1",
      "4",
      "5",
      "Whatever is free"
     ],
     "explain": "Correct. Logical partitions always start at 5."
    },
    {
     "id": "save",
     "prompt": "You made changes in fdisk and pressed <code>q</code>. What was saved?",
     "answer": "nothing",
     "options": [
      {
       "value": "nothing",
       "label": "Nothing. Only w writes the table"
      },
      {
       "value": "all",
       "label": "Everything"
      },
      {
       "value": "last",
       "label": "The last change"
      }
     ],
     "explain": "Correct. q quits without writing."
    }
   ],
   "completion": "Build an MBR layout with fdisk: done."
  },
  {
   "id": "15.4",
   "kind": "vm",
   "title": "Build a GPT layout with gdisk",
   "navSubtitle": "gdisk, type codes",
   "objective": "104.1",
   "difficulty": "Intermediate",
   "source": "Lab 4: Build a GPT layout with gdisk",
   "workdir": "~/lpic1-section15",
   "summary": "",
   "scenario": "db01's new data disk needs a GPT table with a database partition, a log partition and a swap partition.",
   "task": "Create three GPT partitions with gdisk, set the swap type code, inspect one partition, and write the table.",
   "deliverable": "reports/gpt-layout.txt",
   "steps": [
    {
     "cmd": "sudo gdisk $GPT"
    },
    {
     "text": "Type ? to read the help. Type n, Enter (number 1), Enter (first sector), +400M, Enter (type 8300 Linux filesystem). Type n, Enter, Enter, +200M, Enter. Type n, Enter, Enter, +128M, then 8200 for Linux swap. Type L and look up a few type codes."
    },
    {
     "text": "Type p to print the table, i then 1 to show partition 1's GUIDs, then w and Y to write."
    },
    {
     "cmd": "sudo gdisk -l $GPT > reports/gpt-layout.txt"
    }
   ],
   "validation": "grep -E '8300|8200' reports/gpt-layout.txt shows two 8300 lines and one 8200 line, and the file reports GPT: present.",
   "trap": "gdisk uses ? for help where fdisk uses m. GPT has no primary, extended or logical partitions. Type codes such as 8300 and 8200 are labels only; they do not create a filesystem or swap.",
   "paste": {
    "command": "cat reports/gpt-layout.txt",
    "checks": [
     {
      "re": "GPT: present",
      "say": "gdisk reports a GPT table"
     },
     {
      "re": "\\s8300\\s",
      "say": "two Linux filesystem (8300) partitions",
      "count": 2
     },
     {
      "re": "\\s8200\\s",
      "say": "one Linux swap (8200) partition",
      "count": 1
     }
    ]
   },
   "quiz": [
    {
     "id": "gdhelp",
     "prompt": "Which key shows the command list in <code>gdisk</code>?",
     "answer": "?",
     "options": [
      {
       "value": "m",
       "label": "<code>m</code>"
      },
      {
       "value": "?",
       "label": "<code>?</code>"
      },
      {
       "value": "h",
       "label": "<code>help</code>"
      }
     ],
     "explain": "Correct. gdisk uses ?, fdisk uses m, and parted needs the word help."
    }
   ],
   "completion": "Build a GPT layout with gdisk: done."
  },
  {
   "id": "15.5",
   "kind": "vm",
   "title": "Build a UEFI boot layout with parted",
   "navSubtitle": "parted, ESP",
   "objective": "104.1",
   "difficulty": "Intermediate",
   "source": "Lab 5: Build a UEFI boot layout with parted",
   "workdir": "~/lpic1-section15",
   "summary": "",
   "scenario": "A new UEFI build needs a disk with an EFI system partition (ESP) and a data partition. The build team uses parted.",
   "task": "Create a GPT label, a 256 MiB ESP with the esp flag, and a data partition using the rest of the disk.",
   "deliverable": "reports/parted-layout.txt",
   "steps": [
    {
     "cmd": "sudo parted $PRT"
    },
    {
     "text": "Type help, then print (it reports an unrecognised disk label). Type mklabel gpt, then unit MiB. Type mkpart ESP fat32 1 257, then set 1 esp on, then mkpart data ext4 257 100%. Type print to review and quit to leave."
    },
    {
     "cmd": "sudo parted $PRT unit MiB print > reports/parted-layout.txt"
    }
   ],
   "validation": "grep -E 'esp|boot' reports/parted-layout.txt shows the flag on partition 1, and the table lists two partitions.",
   "trap": "parted writes each change as soon as you press Enter; there is no w step and no undo. On a GPT label the first word after mkpart is a partition name; on an msdos label it is the type: primary, extended or logical. Help needs the full word help.",
   "paste": {
    "command": "cat reports/parted-layout.txt",
    "checks": [
     {
      "re": "Partition Table: gpt",
      "say": "the disk has a GPT label"
     },
     {
      "re": "\\besp\\b",
      "say": "partition 1 has the esp flag"
     },
     {
      "re": "^\\s*2\\s+\\d",
      "say": "a second partition exists"
     }
    ]
   },
   "quiz": [
    {
     "id": "partedw",
     "prompt": "When does <code>parted</code> write a change to disk?",
     "answer": "now",
     "options": [
      {
       "value": "now",
       "label": "As soon as you press Enter on the command"
      },
      {
       "value": "w",
       "label": "When you type w"
      },
      {
       "value": "quit",
       "label": "When you quit"
      }
     ],
     "explain": "Correct. parted has no w step and no undo."
    }
   ],
   "completion": "Build a UEFI boot layout with parted: done."
  },
  {
   "id": "15.6",
   "kind": "vm",
   "title": "Confirm the kernel sees the new partitions",
   "navSubtitle": "partprobe",
   "objective": "104.1",
   "difficulty": "Intermediate",
   "source": "Lab 6: Confirm the kernel sees the new partitions",
   "workdir": "~/lpic1-section15",
   "summary": "",
   "scenario": "Before formatting, the change checklist asks you to prove the kernel has picked up every new partition.",
   "task": "Compare the kernel's partition list with lsblk and, if anything is missing, ask the kernel to reread a table.",
   "deliverable": "reports/partitions-after.txt",
   "steps": [
    {
     "cmd": "grep loop /proc/partitions > reports/partitions-after.txt"
    },
    {
     "cmd": "lsblk $MBR $GPT $PRT >> reports/partitions-after.txt"
    },
    {
     "text": "If a partition is missing, run sudo partprobe $MBR (or the device that is missing one) and repeat the two commands."
    },
    {
     "cmd": "sudo gdisk -l $MBR | head -8 >> reports/partitions-after.txt"
    }
   ],
   "validation": "grep -c -E 'loop[0-9]+p[0-9]' reports/partitions-after.txt returns at least 11 (6 MBR, 3 GPT and 2 parted partitions), and the gdisk lines report MBR: MBR only.",
   "trap": "fdisk, gdisk and parted normally tell the kernel about a new table themselves. If the disk is in use, the kernel may keep the old table until partprobe runs or the system reboots. gdisk -l on an MBR disk only reads; gdisk offers to convert the disk to GPT only in interactive mode when you write.",
   "paste": {
    "command": "cat reports/partitions-after.txt",
    "checks": [
     {
      "re": "\\bloop\\d+p\\d+",
      "say": "at least 11 loop partitions are listed",
      "min": 11
     },
     {
      "re": "MBR: MBR only",
      "say": "gdisk reads the MBR disk without converting it"
     }
    ]
   },
   "quiz": [
    {
     "id": "partprobe",
     "prompt": "What does <code>partprobe</code> do?",
     "answer": "reread",
     "options": [
      {
       "value": "reread",
       "label": "Asks the kernel to reread a disk's partition table"
      },
      {
       "value": "make",
       "label": "Creates partitions"
      },
      {
       "value": "check",
       "label": "Checks filesystems for errors"
      }
     ],
     "explain": "Correct. Use it when a new partition doesn't show in /proc/partitions."
    }
   ],
   "completion": "Confirm the kernel sees the new partitions: done."
  },
  {
   "id": "15.7",
   "kind": "vm",
   "title": "Make ext4 and XFS filesystems",
   "navSubtitle": "mkfs ext4, XFS",
   "objective": "104.1",
   "difficulty": "Intermediate",
   "source": "Lab 7: Make ext4 and XFS filesystems",
   "workdir": "~/lpic1-section15",
   "summary": "",
   "scenario": "web01 needs its 300 MB data partition formatted as ext4 with the label webdata. db01 needs its database partition as XFS with the label dbdata, and its log partition as ext4.",
   "task": "Check kernel support, find the available mkfs programs, and format the three partitions using both mkfs forms.",
   "deliverable": "reports/mkfs.txt",
   "steps": [
    {
     "cmd": "grep -E 'ext4|xfs' /proc/filesystems > reports/mkfs.txt; ls /sbin/mkfs.* >> reports/mkfs.txt"
    },
    {
     "cmd": "sudo mkfs -t ext4 -L webdata ${MBR}p1"
    },
    {
     "cmd": "sudo mkfs.xfs -L dbdata ${GPT}p1"
    },
    {
     "cmd": "sudo mkfs.ext4 -L applogs ${GPT}p2"
    },
    {
     "cmd": "lsblk -f $MBR $GPT >> reports/mkfs.txt"
    }
   ],
   "validation": "grep -E 'webdata|dbdata|applogs' reports/mkfs.txt shows each label with its filesystem type and a UUID.",
   "trap": "mkfs -t ext4 and mkfs.ext4 do the same thing; mkfs is a front end that runs mkfs.TYPE. Formatting erases what was there. xfs may be missing from /proc/filesystems until its module loads, which happens automatically on first mount. XFS needs a partition of at least 300 MB.",
   "paste": {
    "command": "cat reports/mkfs.txt",
    "checks": [
     {
      "re": "\\bext4\\b.*\\bwebdata\\b|\\bwebdata\\b.*\\bext4\\b",
      "say": "webdata is ext4"
     },
     {
      "re": "\\bxfs\\b.*\\bdbdata\\b|\\bdbdata\\b.*\\bxfs\\b",
      "say": "dbdata is XFS"
     },
     {
      "re": "\\bapplogs\\b",
      "say": "applogs exists"
     },
     {
      "re": "mkfs\\.ext4",
      "say": "the list of mkfs programs is included"
     }
    ]
   },
   "quiz": [
    {
     "id": "mkfsform",
     "prompt": "How do <code>mkfs -t ext4</code> and <code>mkfs.ext4</code> differ?",
     "answer": "same",
     "options": [
      {
       "value": "same",
       "label": "They do the same thing; mkfs runs mkfs.TYPE"
      },
      {
       "value": "label",
       "label": "Only mkfs.ext4 can set a label"
      },
      {
       "value": "old",
       "label": "mkfs -t makes ext2"
      }
     ],
     "explain": "Correct. mkfs is a front end."
    }
   ],
   "completion": "Make ext4 and XFS filesystems: done."
  },
  {
   "id": "15.8",
   "kind": "vm",
   "title": "Make FAT and exFAT filesystems",
   "navSubtitle": "FAT32, exFAT",
   "objective": "104.1",
   "difficulty": "Intermediate",
   "source": "Lab 8: Make FAT and exFAT filesystems",
   "workdir": "~/lpic1-section15",
   "summary": "",
   "scenario": "The UEFI build's ESP must be FAT32, and the transfer partition on the MBR disk must be exFAT so Windows and macOS laptops can read it.",
   "task": "Format the ESP as FAT32 and logical partition 5 as exFAT, then list the filesystem modules that ship with your kernel.",
   "deliverable": "reports/mkfs-other.txt",
   "steps": [
    {
     "cmd": "sudo mkfs.vfat -F 32 -n ESP ${PRT}p1"
    },
    {
     "cmd": "sudo mkfs.exfat -L transfer ${MBR}p5"
    },
    {
     "cmd": "lsblk -f ${PRT}p1 ${MBR}p5 > reports/mkfs-other.txt"
    },
    {
     "cmd": "ls /lib/modules/$(uname -r)/kernel/fs >> reports/mkfs-other.txt"
    }
   ],
   "validation": "grep -E 'vfat|exfat' reports/mkfs-other.txt shows both partitions with their labels.",
   "trap": "FAT labels are stored in upper case and limited to 11 characters, and FAT UUIDs are short (XXXX-XXXX). An ESP must be FAT. A filesystem whose module exists under /lib/modules but is not in /proc/filesystems can still be used, because the kernel loads it when needed.",
   "paste": {
    "command": "cat reports/mkfs-other.txt",
    "checks": [
     {
      "re": "\\bvfat\\b.*\\bESP\\b|\\bESP\\b.*\\bvfat\\b",
      "say": "the ESP is FAT (vfat) with the label ESP"
     },
     {
      "re": "\\bexfat\\b.*\\btransfer\\b|\\btransfer\\b.*\\bexfat\\b",
      "say": "partition 5 is exFAT with the label transfer"
     }
    ]
   },
   "quiz": [
    {
     "id": "esp",
     "prompt": "Which filesystem must an EFI system partition use?",
     "answer": "fat",
     "options": [
      "ext4",
      "XFS",
      {
       "value": "fat",
       "label": "FAT (usually FAT32)"
      },
      "exFAT"
     ],
     "explain": "Correct. UEFI firmware reads FAT."
    }
   ],
   "completion": "Make FAT and exFAT filesystems: done."
  },
  {
   "id": "15.9",
   "kind": "vm",
   "title": "Create and enable swap",
   "navSubtitle": "mkswap, swapon",
   "objective": "104.1",
   "difficulty": "Intermediate",
   "source": "Lab 9: Create and enable swap",
   "workdir": "~/lpic1-section15",
   "summary": "",
   "scenario": "db01 is running short of memory during nightly reports. You are asked to add the 128 MB swap partition, prove it is active, then remove it again until the change is approved.",
   "task": "Write a swap signature, enable it, prove it is in use, and disable it.",
   "deliverable": "reports/swap.txt",
   "steps": [
    {
     "cmd": "lsblk -f ${MBR}p2 > reports/swap.txt"
    },
    {
     "cmd": "sudo mkswap -L labswap ${GPT}p3"
    },
    {
     "cmd": "sudo swapon ${GPT}p3; swapon --show >> reports/swap.txt; free -h >> reports/swap.txt"
    },
    {
     "cmd": "sudo swapoff ${GPT}p3; swapon --show >> reports/swap.txt"
    }
   ],
   "validation": "grep -c \"${GPT}p3\" reports/swap.txt returns 1: the partition appears while enabled and is gone after swapoff. The first lsblk line shows MBR partition 2 has no FSTYPE yet.",
   "trap": "Setting a partition type to 82 or 8200 does not make swap; mkswap writes the swap signature. swapon -a enables every swap entry in /etc/fstab. swapon -s is the older form of swapon --show.",
   "paste": {
    "command": "cat reports/swap.txt",
    "checks": [
     {
      "re": "^/dev/loop\\d+p3\\s+partition",
      "say": "swapon --show listed the swap partition while it was on"
     },
     {
      "re": "^Swap:",
      "say": "free -h output is included"
     },
     {
      "re": "^/dev/loop\\d+p3\\s",
      "say": "the partition is listed only once, so swapoff worked",
      "count": 1
     }
    ]
   },
   "quiz": [
    {
     "id": "sig",
     "prompt": "Partition 2 has type 82 (Linux swap). Is it swap space yet?",
     "answer": "no",
     "options": [
      {
       "value": "no",
       "label": "No. mkswap must write the swap signature"
      },
      {
       "value": "yes",
       "label": "Yes, the type code is enough"
      },
      {
       "value": "boot",
       "label": "Yes, after a reboot"
      }
     ],
     "explain": "Correct. Type codes are only labels."
    }
   ],
   "completion": "Create and enable swap: done."
  },
  {
   "id": "15.10",
   "kind": "vm",
   "title": "Record UUIDs and labels",
   "navSubtitle": "blkid, UUIDs, labels",
   "objective": "104.1",
   "difficulty": "Advanced",
   "source": "Lab 10: Record UUIDs and labels",
   "workdir": "~/lpic1-section15",
   "summary": "",
   "scenario": "The monitoring team wants each new filesystem identified by UUID and label, because device names such as sdb1 can change between boots.",
   "task": "List UUIDs and labels with blkid and lsblk, check the by-label links, and read a label with e2label.",
   "deliverable": "reports/ids.txt",
   "steps": [
    {
     "cmd": "sudo blkid ${MBR}p1 ${MBR}p5 ${GPT}p1 ${GPT}p2 ${GPT}p3 ${PRT}p1 > reports/ids.txt"
    },
    {
     "cmd": "lsblk -o NAME,FSTYPE,LABEL,UUID $MBR $GPT $PRT >> reports/ids.txt"
    },
    {
     "cmd": "ls -l /dev/disk/by-label >> reports/ids.txt"
    },
    {
     "cmd": "sudo e2label ${MBR}p1 >> reports/ids.txt; sudo blkid -s UUID -o value ${GPT}p1 >> reports/ids.txt"
    }
   ],
   "validation": "grep -c 'UUID=' reports/ids.txt returns at least 6, and the by-label listing shows webdata, dbdata and ESP pointing at loop partitions.",
   "trap": "The UUID belongs to the filesystem and changes when you run mkfs again. PARTUUID belongs to the GPT partition entry and does not. blkid usually needs sudo to probe a new device; without it you may see cached or no results.",
   "paste": {
    "command": "cat reports/ids.txt",
    "checks": [
     {
      "re": "UUID=\"",
      "say": "blkid printed at least six UUIDs",
      "min": 6
     },
     {
      "re": "\\bwebdata\\b",
      "say": "the webdata label is there"
     },
     {
      "re": "\\bdbdata\\b",
      "say": "the dbdata label is there"
     },
     {
      "re": "\\bESP\\b",
      "say": "the ESP label is there"
     }
    ]
   },
   "quiz": [
    {
     "id": "uuid",
     "prompt": "What changes a filesystem's UUID?",
     "answer": "mkfs",
     "options": [
      {
       "value": "mkfs",
       "label": "Running mkfs on the partition again"
      },
      {
       "value": "reboot",
       "label": "A reboot"
      },
      {
       "value": "move",
       "label": "Moving the disk to another port"
      }
     ],
     "explain": "Correct. The UUID belongs to the filesystem, so a new mkfs gives a new one."
    }
   ],
   "completion": "Record UUIDs and labels: done."
  },
  {
   "id": "15.11",
   "kind": "vm",
   "title": "Mount and unmount a filesystem",
   "navSubtitle": "mount, umount",
   "objective": "104.1",
   "difficulty": "Advanced",
   "source": "Lab 11: Mount and unmount a filesystem",
   "workdir": "~/lpic1-section15",
   "summary": "",
   "scenario": "web01's application team needs the new data filesystem mounted so they can check it, then unmounted again before the release.",
   "task": "Mount the ext4 partition by device, check it, unmount it by mount point, then mount by label and unmount by device.",
   "deliverable": "reports/mounts.txt",
   "steps": [
    {
     "cmd": "sudo mount -t ext4 ${MBR}p1 mnt/web; ls mnt/web > reports/mounts.txt"
    },
    {
     "cmd": "mount | grep lpic1-section15 >> reports/mounts.txt; findmnt $PWD/mnt/web >> reports/mounts.txt"
    },
    {
     "cmd": "sudo umount mnt/web"
    },
    {
     "cmd": "sudo mount LABEL=webdata mnt/web; findmnt $PWD/mnt/web >> reports/mounts.txt; sudo umount ${MBR}p1"
    },
    {
     "cmd": "findmnt $PWD/mnt/web >> reports/mounts.txt || echo 'mnt/web is not mounted' >> reports/mounts.txt"
    },
    {
     "cmd": "systemctl list-units --type=mount --no-pager | head -8 >> reports/mounts.txt"
    }
   ],
   "validation": "grep -E 'lost\\+found|not mounted' reports/mounts.txt shows lost+found from the first mount and the not mounted line at the end.",
   "trap": "The command is umount, with no n. You can unmount by mount point or by device. umount fails with target is busy if any shell or program is using the mount point, including a shell whose current directory is inside it. systemd turns each mounted filesystem into a .mount unit, which is why mounts appear in systemctl list-units.",
   "paste": {
    "command": "cat reports/mounts.txt",
    "checks": [
     {
      "re": "lost\\+found",
      "say": "the first mount showed lost+found"
     },
     {
      "re": "not mounted",
      "say": "the last check shows mnt/web is not mounted"
     }
    ]
   },
   "quiz": [
    {
     "id": "umount",
     "prompt": "Which command detaches a mounted filesystem?",
     "answer": "umount",
     "options": [
      {
       "value": "unmount",
       "label": "<code>unmount</code>"
      },
      {
       "value": "umount",
       "label": "<code>umount</code>"
      },
      {
       "value": "dismount",
       "label": "<code>dismount</code>"
      }
     ],
     "explain": "Correct. There's no n in umount."
    },
    {
     "id": "busy",
     "prompt": "<code>umount</code> says <em>target is busy</em>. A likely cause?",
     "answer": "cwd",
     "options": [
      {
       "value": "cwd",
       "label": "A shell's current directory is inside the mount point"
      },
      {
       "value": "ro",
       "label": "It's mounted read-only"
      },
      {
       "value": "label",
       "label": "It was mounted by label"
      }
     ],
     "explain": "Correct. cd out of it, then try again."
    }
   ],
   "completion": "Mount and unmount a filesystem: done."
  },
  {
   "id": "15.12",
   "kind": "vm",
   "title": "Mount read-only for an evidence review",
   "navSubtitle": "ro, remount",
   "objective": "104.1",
   "difficulty": "Advanced",
   "source": "Lab 12: Mount read-only for an evidence review",
   "workdir": "~/lpic1-section15",
   "summary": "",
   "scenario": "Security wants to look at db01's database filesystem without any risk of changing it, and later the DBA needs write access back.",
   "task": "Mount the XFS filesystem read-only by UUID, prove writes fail, remount it read-write, prove writes work, and unmount.",
   "deliverable": "reports/ro-test.txt",
   "steps": [
    {
     "cmd": "sudo mount -o ro UUID=$(sudo blkid -s UUID -o value ${GPT}p1) mnt/db"
    },
    {
     "cmd": "sudo touch mnt/db/evidence-check 2> reports/ro-test.txt; findmnt -o TARGET,SOURCE,FSTYPE,OPTIONS $PWD/mnt/db >> reports/ro-test.txt"
    },
    {
     "cmd": "sudo mount -o remount,rw mnt/db; sudo touch mnt/db/evidence-check && echo 'write ok after remount' >> reports/ro-test.txt"
    },
    {
     "cmd": "sudo umount mnt/db"
    }
   ],
   "validation": "cat reports/ro-test.txt shows Read-only file system, an OPTIONS column starting with ro, and the line write ok after remount.",
   "trap": "mount -U uuid and mount UUID=uuid are equivalent, as are -L label and LABEL=label. remount changes options without unmounting. Even read-only, mounting some filesystems can replay a journal, so for real forensic work use the device's own read-only setting as well.",
   "paste": {
    "command": "cat reports/ro-test.txt",
    "checks": [
     {
      "re": "Read-only file system",
      "say": "the write failed while read-only"
     },
     {
      "re": "\\sro[,\\s]",
      "say": "findmnt shows the ro option"
     },
     {
      "re": "write ok after remount",
      "say": "the write worked after remount,rw"
     }
    ]
   },
   "quiz": [
    {
     "id": "remount",
     "prompt": "Which option switches a mounted filesystem to read-write without unmounting?",
     "answer": "remount",
     "options": [
      {
       "value": "remount",
       "label": "<code>-o remount,rw</code>"
      },
      {
       "value": "rw",
       "label": "<code>-o rw</code> on a second mount"
      },
      {
       "value": "w",
       "label": "<code>-w</code> with umount"
      }
     ],
     "explain": "Correct."
    }
   ],
   "completion": "Mount read-only for an evidence review: done."
  },
  {
   "id": "15.13",
   "kind": "vm",
   "title": "Draft and test fstab entries on a copy",
   "navSubtitle": "fstab, test a copy",
   "objective": "104.1",
   "difficulty": "Advanced",
   "source": "Lab 13: Draft and test fstab entries on a copy",
   "workdir": "~/lpic1-section15",
   "summary": "",
   "scenario": "The change for app02 will add the new filesystems to /etc/fstab. Policy says any fstab change must be drafted and tested before it reaches the real file.",
   "task": "Read the sample fstab, draft entries in a copy of /etc/fstab, and test the copy without mounting anything.",
   "deliverable": "configs/fstab.test and reports/fstab-verify.txt",
   "steps": [
    {
     "cmd": "grep -v '^#' configs/fstab.sample | column -t"
    },
    {
     "cmd": "cp /etc/fstab configs/fstab.test"
    },
    {
     "cmd": "echo \"LABEL=webdata  $HOME/lpic1-section15/mnt/web  ext4  defaults,noauto,user  0  2\" >> configs/fstab.test"
    },
    {
     "cmd": "echo \"UUID=$(sudo blkid -s UUID -o value ${GPT}p1)  $HOME/lpic1-section15/mnt/db  xfs  defaults  0  2\" >> configs/fstab.test"
    },
    {
     "cmd": "echo \"LABEL=labswap  none  swap  sw  0  0\" >> configs/fstab.test"
    },
    {
     "cmd": "sudo findmnt --verify --verbose --tab-file configs/fstab.test > reports/fstab-verify.txt 2>&1"
    },
    {
     "cmd": "sudo mount -a --fake --verbose -T configs/fstab.test >> reports/fstab-verify.txt 2>&1"
    },
    {
     "text": "nano reports/fstab-verify.txt and explain the six fields of your new lines: what to mount, where, type, options, dump and fsck pass."
    }
   ],
   "validation": "tail -5 configs/fstab.test shows your three lines, grep -E 'errors|Success' reports/fstab-verify.txt reports 0 errors, and findmnt $PWD/mnt/db prints nothing because --fake mounted nothing.",
   "trap": "defaults means rw, suid, dev, exec, auto, nouser and async. noauto keeps mount -a from mounting the entry at boot, and user lets an ordinary user mount it. The pass field is 1 for the root filesystem, 2 for other filesystems and 0 to skip the check; dump 0 means the old dump backup tool ignores it. A broken /etc/fstab can stop a system from booting, which is why you test a copy.",
   "paste": {
    "command": "tail -3 configs/fstab.test; cat reports/fstab-verify.txt",
    "checks": [
     {
      "re": "^LABEL=webdata\\s",
      "say": "the webdata line is in the copy"
     },
     {
      "re": "^UUID=\\S+\\s+\\S+/mnt/db\\s+xfs",
      "say": "the dbdata line uses a UUID and xfs"
     },
     {
      "re": "^LABEL=labswap\\s+none\\s+swap",
      "say": "the swap line is in the copy"
     },
     {
      "re": "Success|0 errors|no errors",
      "say": "findmnt --verify found no errors"
     }
    ]
   },
   "quiz": [
    {
     "id": "pass",
     "prompt": "In <code>/etc/fstab</code>, what should the last field (pass) be for the root filesystem?",
     "answer": "1",
     "options": [
      "0",
      "1",
      "2"
     ],
     "explain": "Correct. 1 for root, 2 for others, 0 to skip the check."
    },
    {
     "id": "noauto",
     "prompt": "What does <code>noauto</code> do in an fstab entry?",
     "answer": "skip",
     "options": [
      {
       "value": "skip",
       "label": "mount -a and boot skip it; mount it by hand"
      },
      {
       "value": "user",
       "label": "Lets ordinary users mount it"
      },
      {
       "value": "ro",
       "label": "Mounts it read-only"
      }
     ],
     "explain": "Correct."
    }
   ],
   "completion": "Draft and test fstab entries on a copy: done."
  },
  {
   "id": "15.14",
   "kind": "vm",
   "title": "Decommission the lab disks",
   "navSubtitle": "Cleanup",
   "objective": "104.1",
   "difficulty": "Advanced",
   "source": "Lab 14: Decommission the lab disks",
   "workdir": "~/lpic1-section15",
   "summary": "",
   "scenario": "Change STOR-2041 is complete, and the temporary disks must be released cleanly so nothing is left mounted or attached.",
   "task": "Unmount everything, disable any swap, detach the loop devices and prove nothing is left.",
   "deliverable": "reports/cleanup.txt",
   "steps": [
    {
     "cmd": "sudo umount mnt/web mnt/db 2>/dev/null; sudo swapoff ${GPT}p3 2>/dev/null"
    },
    {
     "cmd": "sudo losetup -d $MBR $GPT $PRT"
    },
    {
     "cmd": "losetup -l | grep lpic1-section15 > reports/cleanup.txt || echo 'No lab loop devices attached' > reports/cleanup.txt"
    },
    {
     "cmd": "findmnt | grep lpic1-section15 >> reports/cleanup.txt || echo 'No lab mounts' >> reports/cleanup.txt"
    }
   ],
   "validation": "cat reports/cleanup.txt shows No lab loop devices attached and No lab mounts.",
   "trap": "Unmount before you detach. The images keep their partitions and filesystems after detaching, so rerun Step 5 to attach them again, or Steps 3 and 5 to start fresh. On a real disk, sudo wipefs -a removes filesystem and partition table signatures, so check the device name twice before using it.",
   "paste": {
    "command": "cat reports/cleanup.txt",
    "checks": [
     {
      "re": "No lab loop devices attached",
      "say": "no lab loop devices are left"
     },
     {
      "re": "No lab mounts",
      "say": "nothing from the lab is still mounted"
     }
    ]
   },
   "quiz": [
    {
     "id": "order",
     "prompt": "What comes first when retiring a disk?",
     "answer": "umount",
     "options": [
      {
       "value": "umount",
       "label": "Unmount it (and swapoff)"
      },
      {
       "value": "detach",
       "label": "Detach it with losetup -d"
      },
      {
       "value": "wipe",
       "label": "wipefs -a"
      }
     ],
     "explain": "Correct. Unmount before you detach."
    }
   ],
   "completion": "Decommission the lab disks: done."
  }
 ],
 "review": {
  "traps": [
   "Forgetting MBR limits: disks and partitions up to about 2 TB, four primary partitions, and logical partitions numbered from 5 inside one extended partition.",
   "Thinking GPT has primary and logical partitions. It has none of those types and allows 128 partitions by default.",
   "Mixing up help keys: m in fdisk, ? in gdisk, and the full word help in parted.",
   "Expecting parted to wait for a w command. parted writes each change immediately.",
   "Quitting fdisk or gdisk with q and expecting changes to be saved. Only w writes the table.",
   "Formatting the extended partition. It is only a container for logical partitions.",
   "Thinking a partition type code (82, 8200, 8300) creates a filesystem or swap. mkfs and mkswap do that.",
   "Treating mkfs -t ext4 and mkfs.ext4 as different. They do the same thing.",
   "Forgetting that mkfs gives the filesystem a new UUID, so fstab entries that use the old UUID stop working.",
   "Spelling umount as unmount, or expecting umount to work while a shell is inside the mount point.",
   "Swapping fstab fields. The order is device, mount point, type, options, dump, pass.",
   "Using pass 1 for every filesystem. Only the root filesystem should be 1; others use 2, and 0 skips the check.",
   "Forgetting what noauto and user do. noauto is skipped by mount -a; user lets ordinary users mount the filesystem.",
   "Editing /etc/fstab without testing. Check a copy with findmnt --verify or mount -a --fake before it reaches the real file."
  ],
  "trapQuiz": [
   {
    "id": "tq1",
    "prompt": "How many primary partitions can an MBR disk hold?",
    "answer": "4",
    "options": [
     "2",
     "4",
     "16",
     "128"
    ],
    "explain": "Correct. Four primaries, or three plus one extended."
   },
   {
    "id": "tq2",
    "prompt": "How many partitions does GPT allow by default?",
    "answer": "128",
    "options": [
     "4",
     "15",
     "64",
     "128"
    ],
    "explain": "Correct."
   },
   {
    "id": "tq3",
    "prompt": "Which tool writes changes immediately, with no w step?",
    "answer": "parted",
    "options": [
     "fdisk",
     "gdisk",
     "parted"
    ],
    "explain": "Correct."
   },
   {
    "id": "tq4",
    "prompt": "Which partition do you never format?",
    "answer": "ext",
    "options": [
     {
      "value": "ext",
      "label": "The extended partition"
     },
     {
      "value": "esp",
      "label": "The ESP"
     },
     {
      "value": "log",
      "label": "A logical partition"
     }
    ],
    "explain": "Correct. It's only a container."
   },
   {
    "id": "tq5",
    "prompt": "What's the field order in <code>/etc/fstab</code>?",
    "answer": "order",
    "options": [
     {
      "value": "order",
      "label": "device, mount point, type, options, dump, pass"
     },
     {
      "value": "o2",
      "label": "mount point, device, type, options, pass, dump"
     },
     {
      "value": "o3",
      "label": "device, type, mount point, options, dump, pass"
     }
    ],
    "explain": "Correct."
   },
   {
    "id": "tq6",
    "prompt": "Which fstab option lets an ordinary user mount the filesystem?",
    "answer": "user",
    "options": [
     "defaults",
     "noauto",
     "user",
     "rw"
    ],
    "explain": "Correct."
   },
   {
    "id": "tq7",
    "prompt": "You reformatted a partition with mkfs. What breaks?",
    "answer": "uuid",
    "options": [
     {
      "value": "uuid",
      "label": "fstab entries that use its old UUID"
     },
     {
      "value": "label",
      "label": "Nothing"
     },
     {
      "value": "table",
      "label": "The partition table"
     }
    ],
    "explain": "Correct. mkfs creates a new UUID."
   },
   {
    "id": "tq8",
    "prompt": "How do you test an fstab change safely?",
    "answer": "verify",
    "options": [
     {
      "value": "verify",
      "label": "findmnt --verify, or mount -a --fake, on a copy"
     },
     {
      "value": "reboot",
      "label": "Edit /etc/fstab and reboot"
     },
     {
      "value": "mount",
      "label": "mount -a on the real file"
     }
    ],
    "explain": "Correct."
   }
  ],
  "challenge": {
   "intro": "Complete these tasks without notes, using only your Linux Mint VM and the files in ~/lpic1-section15. Run Lab 14 first, then Steps 3 and 5 of the Lab Setup so you start with three blank images, and save each answer under reports/ with a name that starts with challenge-.",
   "tasks": [
    "On the MBR image, create two primary partitions, an extended partition and two logical partitions, and prove the numbering.",
    "On the GPT image, create a 400 MB Linux partition and a 128 MB swap partition with gdisk.",
    "On the parted image, create a GPT label and a FAT32 EFI system partition with the esp flag set.",
    "Format the first MBR partition as ext4 with the label webdata, and the first GPT partition as XFS with the label dbdata.",
    "Enable the swap partition, prove it is active with two different commands, then disable it.",
    "Mount dbdata by UUID read-only, prove that writes fail, and unmount it by device name.",
    "Draft fstab entries for webdata (by label, not mounted at boot) and dbdata (by UUID) in a copy of /etc/fstab, and prove the copy has no errors.",
    "Unmount everything and detach all three loop devices."
   ],
   "outro": "Your final handoff is the reports directory and configs/fstab.test. For each file, write one sentence explaining what it proves, as if you were closing change STOR-2041."
  },
  "questions": [
   {
    "q": "Storage team request: “db01's new disk is 4 TB. Which partition table should it get, and which tool would you use to create it?”",
    "a": "GPT, because MBR stops at about 2 TiB. Create it with <code>gdisk</code> or <code>parted</code> (<code>mklabel gpt</code>)."
   },
   {
    "q": "Project lead request: “The legacy server needs six partitions on an MBR disk. Explain how the partitions will be numbered.”",
    "a": "Partitions 1 to 3 are primary, partition 4 is the extended container, and the logical partitions inside it are numbered from 5 (5, 6, and so on). The extended partition itself is never formatted."
   },
   {
    "q": "Build team request: “The new UEFI image needs an EFI system partition. Create it and show me the flag is set.”",
    "a": "In <code>parted</code>: <code>mklabel gpt</code>, <code>mkpart ESP fat32 1MiB 257MiB</code>, <code>set 1 esp on</code>, then <code>mkfs.vfat -F 32</code> on it. <code>parted DEVICE print</code> shows the esp flag."
   },
   {
    "q": "DBA request: “Format the database partition as XFS with the label dbdata and tell me its UUID.”",
    "a": "<code>sudo mkfs.xfs -L dbdata DEVICE</code>, then <code>sudo blkid DEVICE</code> or <code>lsblk -f</code> for the UUID."
   },
   {
    "q": "Operations request: “db01 is short on memory. Turn on the spare swap partition now and show me it is in use.”",
    "a": "<code>sudo mkswap DEVICE</code> if it has no swap signature yet, then <code>sudo swapon DEVICE</code>, and prove it with <code>swapon --show</code> and <code>free -h</code>."
   },
   {
    "q": "Security request: “Mount the database filesystem so nothing can write to it, and prove it.”",
    "a": "<code>sudo mount -o ro UUID=… /mount/point</code>. Prove it with a write that fails (<em>Read-only file system</em>) and <code>findmnt</code> showing <code>ro</code>."
   },
   {
    "q": "Change manager request: “Add the new data filesystem to fstab by UUID, but prove the file is valid before anyone reboots.”",
    "a": "Add <code>UUID=… /mount/point ext4 defaults 0 2</code> to a copy first, then check the copy with <code>findmnt --verify --tab-file COPY</code> or <code>mount -a --fake -T COPY</code> before it goes into /etc/fstab."
   }
  ],
  "mastery": [
   "I can explain the differences between MBR and GPT, including size limits, partition counts and partition types.",
   "I can attach a disk image with losetup -fP --show and detach it with losetup -d.",
   "I can create primary, extended and logical partitions with fdisk and set a partition type with t.",
   "I can create GPT partitions with gdisk, set type codes such as 8300 and 8200, and write the table with w.",
   "I can create a partition table and partitions with parted, set the esp flag, and explain that parted writes immediately.",
   "I can confirm new partitions in /proc/partitions and lsblk and use partprobe when the kernel has not seen them.",
   "I can make ext4, XFS, FAT32 and exFAT filesystems with mkfs -t and mkfs.TYPE and give them labels.",
   "I can check kernel filesystem support in /proc/filesystems and /lib/modules.",
   "I can create, enable, check and disable swap with mkswap, swapon, swapon --show, free and swapoff.",
   "I can find UUIDs and labels with blkid, lsblk -f and /dev/disk/by-label.",
   "I can mount by device, UUID and label, mount read-only, remount read-write and unmount by device or mount point.",
   "I can explain every field and the common options of /etc/fstab, and test a draft with findmnt --verify and mount -a --fake."
  ]
 }
});
