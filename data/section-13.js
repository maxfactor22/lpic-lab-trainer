/* Section 13: Storage Concepts and Device Names. Generated from LPIC_Section13_Lab_Workbook.docx by vm_section.py;
   paste checks, quizzes and model answers were added for the app. */
LPIC.section({
 "id": "section-13",
 "number": 13,
 "title": "Storage Concepts and Device Names",
 "objectives": [
  "101.1",
  "102.1",
  "104.1"
 ],
 "kind": "vm",
 "source": "LPIC_Section13_Lab_Workbook.docx",
 "scenario": "Objectives 101.1, 102.1 and 104.1: Understand mass storage terms (disks, partitions, filesystems, swap, logical volumes and Btrfs) and inspect them with lsblk, /proc, /dev and free.",
 "overview": {
  "paragraphs": [
   "Treat each lab like a ticket from a teammate who needs a clear answer about storage. Read the scenario, run the inspection commands, save the evidence under reports/, and add a sentence or two in your own words that explains what the output means.",
   "This section is about reading and explaining storage, not changing it. Nothing here partitions, formats or mounts anything. The one lab that adds a disk attaches a blank image file as a loop device and detaches it again. Creating partitions, filesystems and swap comes in Section 15, also on image files.",
   "Your Linux Mint VM may name its main disk sda (VirtualBox, VMware), vda (KVM) or nvme0n1 (NVMe). Lab Setup stores the real name in the DISK variable so the commands work on any of them. Mint also normally uses a swap file instead of a swap partition and usually has no LVM, so several labs ask you to explain what you would see on a server that does."
  ],
  "setup": [
   {
    "text": "Step 1: Create the practice workspace:"
   },
   {
    "cmd": "mkdir -p ~/lpic1-section13/{reports,images,notes}"
   },
   {
    "cmd": "cd ~/lpic1-section13"
   },
   {
    "text": "Step 2: Record the name of your VM's main disk. Rerun this line whenever you open a new terminal:"
   },
   {
    "cmd": "DISK=$(lsblk -dno NAME,TYPE | awk '$2==\"disk\"{print $1; exit}'); echo $DISK"
   },
   {
    "text": "Step 3: Create the sample ticket and a blank 256 MB disk image. The image is sparse, so it uses almost no real space:"
   },
   {
    "cmd": "printf 'Ticket: STOR-1013\\nRequester: bob (app team)\\nHost: app02\\nQuestion 1: How many disks and partitions does this host have?\\nQuestion 2: Which filesystem types are in use?\\nQuestion 3: How much swap is there, and is it a partition or a file?\\nQuestion 4: Is LVM in use?\\n' > notes/ticket-stor-1013.txt"
   },
   {
    "cmd": "truncate -s 256M images/newdisk.img"
   },
   {
    "text": "Step 4: Install the lsdev tool for Lab 10. It is part of the procinfo package. If lsdev is still missing afterwards, Lab 10 works from the /proc files alone:"
   },
   {
    "cmd": "sudo apt install procinfo"
   },
   {
    "text": "Validation check: Run ls -lsR and confirm notes/ticket-stor-1013.txt exists and images/newdisk.img shows a size of 268435456 bytes with 0 blocks used. Run echo $DISK and confirm it prints a name such as sda, vda or nvme0n1."
   }
  ],
  "commands": [
   "lsblk",
   "lsblk -f",
   "lsblk -p",
   "lsblk -s",
   "lsblk -d",
   "lsblk -o NAME",
   "SIZE",
   "TYPE",
   "FSTYPE",
   "MOUNTPOINT",
   "MAJ:MIN",
   "cat /proc/partitions",
   "cat /proc/filesystems",
   "cat /proc/swaps",
   "free -h",
   "swapon --show",
   "/dev/sda",
   "/dev/sda1",
   "/dev/sdb",
   "/dev/hda",
   "/dev/sr0",
   "/dev/fd0",
   "/dev/vda",
   "/dev/nvme0n1p1",
   "/dev/disk/by-id",
   "/dev/disk/by-uuid",
   "/dev/disk/by-path",
   "/dev/disk/by-label",
   "readlink -f",
   "/dev/mapper",
   "/dev/dm-0",
   "pvcreate",
   "vgcreate",
   "lvcreate",
   "pvs",
   "vgs",
   "lvs",
   "lsdev",
   "/proc/interrupts",
   "/proc/ioports",
   "/proc/dma",
   "losetup -f --show",
   "losetup -d",
   "findmnt and /sys/firmware/efi"
  ],
  "memoryHook": "Think of storage as building a town. The disk is the raw land. Partitions are the lots marked out on it. A filesystem is the building plan that lets you store and find things on a lot. The mount point is the street address where people reach the building. LVM is a land agency that pools several lots into one big flexible lot, and swap is an overflow car park for RAM. Each layer has its own command: lsblk shows land and lots, lsblk -f shows building plans, and findmnt shows addresses.",
  "reference": []
 },
 "lessons": [
  {
   "id": "13.1",
   "kind": "vm",
   "title": "Count the disks and partitions on a host",
   "navSubtitle": "lsblk, disks vs partitions",
   "objective": "101.1",
   "difficulty": "Beginner",
   "source": "Lab 1: Count the disks and partitions on a host",
   "workdir": "~/lpic1-section13",
   "summary": "",
   "scenario": "Ticket STOR-1013 from bob asks how many disks and partitions app02 has. Your VM stands in for app02.",
   "task": "List the block devices, tell whole disks apart from partitions, and show the device files for the main disk.",
   "deliverable": "reports/storage-overview.txt with the lsblk output, the device files, and a one-line answer.",
   "steps": [
    {
     "cmd": "lsblk > reports/storage-overview.txt"
    },
    {
     "cmd": "ls -l /dev/${DISK}* >> reports/storage-overview.txt"
    },
    {
     "cmd": "echo \"Answer: $(lsblk -dno TYPE | grep -c disk) disk(s) and $(lsblk -no TYPE | grep -c part) partition(s)\" >> reports/storage-overview.txt"
    }
   ],
   "validation": "cat reports/storage-overview.txt. The TYPE column shows disk for the whole disk and part for each partition, and the last line gives both counts.",
   "trap": "A file such as /dev/sda is the whole disk and /dev/sda1 is its first partition. A partition can take up the entire disk, so one partition does not mean the disk is small. The loop and rom rows in lsblk are not hard disks.",
   "paste": {
    "command": "cat reports/storage-overview.txt",
    "checks": [
     {
      "re": "NAME\\s+MAJ:MIN",
      "say": "includes the lsblk output"
     },
     {
      "re": "\\sdisk[ \\t]*$",
      "say": "lsblk shows at least one row of TYPE disk"
     },
     {
      "re": "^b\\S+\\s+\\d+\\s+\\S+\\s+disk\\s+\\d+,\\s*\\d+\\s.*/dev/",
      "say": "the device files for the main disk are listed"
     },
     {
      "re": "^Answer: \\d+ disk\\(s\\) and \\d+ partition\\(s\\)",
      "say": "the answer line gives both counts"
     }
    ]
   },
   "quiz": [
    {
     "id": "sdb",
     "prompt": "What is <code>/dev/sdb</code>?",
     "answer": "disk2",
     "options": [
      {
       "value": "disk2",
       "label": "The second whole disk"
      },
      {
       "value": "part2",
       "label": "The second partition on the first disk"
      },
      {
       "value": "cd",
       "label": "An optical drive"
      }
     ],
     "explain": "Correct. Partitions add a number, such as sdb1."
    },
    {
     "id": "rom",
     "prompt": "In lsblk, which TYPE values are not hard disks?",
     "answer": "both",
     "options": [
      {
       "value": "both",
       "label": "<code>loop</code> and <code>rom</code>"
      },
      {
       "value": "part",
       "label": "<code>part</code>"
      },
      {
       "value": "disk",
       "label": "<code>disk</code>"
      }
     ],
     "explain": "Correct. loop rows are image files and rom is an optical drive."
    }
   ],
   "completion": "Count the disks and partitions on a host: done."
  },
  {
   "id": "13.2",
   "kind": "vm",
   "title": "Identify devices by their names",
   "navSubtitle": "sd, vd, nvme, hd, sr, fd",
   "objective": "101.1",
   "difficulty": "Beginner",
   "source": "Lab 2: Identify devices by their names",
   "workdir": "~/lpic1-section13",
   "summary": "",
   "scenario": "A field engineer asks whether app02 has an optical drive, any old IDE (PATA) disks, or a floppy drive before shipping it to a branch office.",
   "task": "Check for each family of storage device file and record which ones exist.",
   "deliverable": "reports/device-names.txt listing what was found and what was not.",
   "steps": [
    {
     "cmd": "ls -l /dev/sd? /dev/vd? /dev/nvme?n? > reports/device-names.txt 2>&1"
    },
    {
     "cmd": "ls -l /dev/hd? /dev/sr? /dev/fd? >> reports/device-names.txt 2>&1"
    },
    {
     "text": "nano reports/device-names.txt and add one line under the output for each family: SATA, SCSI and USB disks (sd), virtio disks (vd), NVMe (nvme), old PATA (hd), optical (sr) and floppy (fd)."
    }
   ],
   "validation": "cat reports/device-names.txt. Expect your main disk to be listed and No such file or directory messages for the families your VM does not have.",
   "trap": "sdb means the second disk, not a partition. Partitions add a number: sdb1. NVMe adds a p before the partition number: nvme0n1p1. hda names are from old PATA systems; modern kernels name PATA disks sd as well.",
   "paste": {
    "command": "cat reports/device-names.txt",
    "checks": [
     {
      "re": "^b\\S+\\s.*/dev/(sd[a-z]|vd[a-z]|nvme\\d+n\\d+)[ \\t]*$",
      "say": "your main disk's device file is listed"
     },
     {
      "re": "No such file or directory",
      "say": "the families your VM lacks are reported as missing"
     },
     {
      "re": "\\boptical\\b",
      "say": "your notes cover optical drives (sr)"
     },
     {
      "re": "\\bfloppy\\b",
      "say": "your notes cover floppy drives (fd)"
     }
    ]
   },
   "quiz": [
    {
     "id": "nvmep",
     "prompt": "What is the first partition on <code>/dev/nvme0n1</code> called?",
     "answer": "p1",
     "options": [
      {
       "value": "p1",
       "label": "<code>/dev/nvme0n1p1</code>"
      },
      {
       "value": "n1",
       "label": "<code>/dev/nvme0n11</code>"
      },
      {
       "value": "n2",
       "label": "<code>/dev/nvme0n2</code>"
      }
     ],
     "explain": "Correct. NVMe puts a p before the partition number."
    },
    {
     "id": "sr0",
     "prompt": "Which device file is the first optical drive?",
     "answer": "sr0",
     "options": [
      {
       "value": "sr0",
       "label": "<code>/dev/sr0</code>"
      },
      {
       "value": "fd0",
       "label": "<code>/dev/fd0</code>"
      },
      {
       "value": "hdc",
       "label": "<code>/dev/hdc</code> on a modern kernel"
      }
     ],
     "explain": "Correct. fd0 is a floppy, and modern kernels no longer use hd names."
    }
   ],
   "completion": "Identify devices by their names: done."
  },
  {
   "id": "13.3",
   "kind": "vm",
   "title": "Compare the kernel's partition list with lsblk",
   "navSubtitle": "/proc/partitions",
   "objective": "101.1",
   "difficulty": "Beginner",
   "source": "Lab 3: Compare the kernel's partition list with lsblk",
   "workdir": "~/lpic1-section13",
   "summary": "",
   "scenario": "A monitoring script reads /proc/partitions instead of running lsblk. The developer wants to know whether the two agree and what the numbers mean.",
   "task": "Save both views side by side and convert the main disk's block count to GiB.",
   "deliverable": "reports/proc-partitions.txt",
   "steps": [
    {
     "cmd": "cat /proc/partitions > reports/proc-partitions.txt"
    },
    {
     "cmd": "lsblk -o NAME,MAJ:MIN,SIZE,TYPE >> reports/proc-partitions.txt"
    },
    {
     "text": "awk -v d=$DISK '$4==d {printf \"%s is %.1f GiB\\n\", $4, $3/1024/1024}' /proc/partitions >> reports/proc-partitions.txt"
    }
   ],
   "validation": "tail -1 reports/proc-partitions.txt and confirm the size is close to what lsblk shows for the disk.",
   "trap": "The #blocks column in /proc/partitions counts 1 KiB blocks, not sectors and not bytes. The file shows what the kernel currently knows, which is why newly created partitions sometimes do not appear until the kernel rereads the table.",
   "paste": {
    "command": "cat reports/proc-partitions.txt",
    "checks": [
     {
      "re": "major\\s+minor\\s+#blocks\\s+name",
      "say": "includes the kernel's list from /proc/partitions"
     },
     {
      "re": "NAME\\s+MAJ:MIN\\s+SIZE\\s+TYPE",
      "say": "includes the lsblk view"
     },
     {
      "re": "^\\S+ is \\d+([.,]\\d+)? GiB",
      "say": "the last line converts the disk size to GiB"
     }
    ]
   },
   "quiz": [
    {
     "id": "blocks",
     "prompt": "<code>/proc/partitions</code> shows 26214400 blocks for sda. How big is it?",
     "answer": "25g",
     "options": [
      {
       "value": "25g",
       "label": "25 GiB"
      },
      {
       "value": "12g",
       "label": "12.5 GiB"
      },
      {
       "value": "26m",
       "label": "26 MB"
      }
     ],
     "explain": "Correct. The blocks are 1 KiB, so divide by 1024 twice."
    }
   ],
   "completion": "Compare the kernel's partition list with lsblk: done."
  },
  {
   "id": "13.4",
   "kind": "vm",
   "title": "Check which filesystems the kernel supports",
   "navSubtitle": "/proc/filesystems, lsblk -f",
   "objective": "104.1",
   "difficulty": "Beginner",
   "source": "Lab 4: Check which filesystems the kernel supports",
   "workdir": "~/lpic1-section13",
   "summary": "",
   "scenario": "The database team plans to bring a disk formatted with XFS from another server. They ask whether this host can read it and which filesystems are already in use.",
   "task": "List the filesystems the running kernel supports, separate real on-disk ones from virtual ones, and show what each partition is formatted with.",
   "deliverable": "reports/fs-supported.txt, reports/fs-on-devices.txt and reports/fs-in-use.txt.",
   "steps": [
    {
     "cmd": "cat /proc/filesystems > reports/fs-supported.txt"
    },
    {
     "cmd": "grep -v nodev /proc/filesystems > reports/fs-on-devices.txt"
    },
    {
     "cmd": "lsblk -f > reports/fs-in-use.txt"
    },
    {
     "cmd": "ls /lib/modules/$(uname -r)/kernel/fs >> reports/fs-on-devices.txt"
    }
   ],
   "validation": "grep -w ext4 reports/fs-on-devices.txt and grep -c ext4 reports/fs-in-use.txt. Then check whether xfs appears in the module directory list at the end of fs-on-devices.txt.",
   "trap": "nodev in the first column means the filesystem is virtual and has no block device behind it, such as proc, sysfs and tmpfs. /proc/filesystems only lists filesystems that are built in or already loaded; a filesystem whose module is not loaded yet, such as xfs, may be missing from the list even though the kernel can load it.",
   "paste": {
    "command": "cat reports/fs-supported.txt; cat reports/fs-on-devices.txt; cat reports/fs-in-use.txt",
    "checks": [
     {
      "re": "^nodev\\s+(proc|sysfs|tmpfs)\\b",
      "say": "the full list with nodev entries is included"
     },
     {
      "re": "^[ \\t]+ext4[ \\t]*$",
      "say": "ext4 is listed as a filesystem that needs a device"
     },
     {
      "re": "^(btrfs|xfs|fat|nls|isofs|udf)[ \\t]*$",
      "say": "the kernel module directory listing is included"
     },
     {
      "re": "NAME\\s+FSTYPE",
      "say": "lsblk -f output is included"
     }
    ]
   },
   "quiz": [
    {
     "id": "nodev",
     "prompt": "What does <code>nodev</code> mean in <code>/proc/filesystems</code>?",
     "answer": "virtual",
     "options": [
      {
       "value": "virtual",
       "label": "The filesystem is virtual and needs no block device"
      },
      {
       "value": "off",
       "label": "The filesystem is disabled"
      },
      {
       "value": "nomod",
       "label": "Its module is not installed"
      }
     ],
     "explain": "Correct. proc, sysfs and tmpfs are examples."
    },
    {
     "id": "xfsmissing",
     "prompt": "xfs is not in <code>/proc/filesystems</code>. What does that tell you?",
     "answer": "notloaded",
     "options": [
      {
       "value": "notloaded",
       "label": "Its module isn't loaded yet; the kernel may still support it"
      },
      {
       "value": "never",
       "label": "This kernel can never read XFS"
      },
      {
       "value": "broken",
       "label": "The XFS disk is damaged"
      }
     ],
     "explain": "Correct. The list shows only built-in and loaded filesystems."
    }
   ],
   "completion": "Check which filesystems the kernel supports: done."
  },
  {
   "id": "13.5",
   "kind": "vm",
   "title": "Report the swap space",
   "navSubtitle": "free, swapon, /proc/swaps",
   "objective": "102.1",
   "difficulty": "Intermediate",
   "source": "Lab 5: Report the swap space",
   "workdir": "~/lpic1-section13",
   "summary": "",
   "scenario": "Question 3 of STOR-1013 asks how much swap app02 has and whether it is a partition or a file.",
   "task": "Show the swap total, list each swap area, and check whether lsblk shows a swap partition.",
   "deliverable": "reports/swap.txt with the evidence and a one-line answer.",
   "steps": [
    {
     "cmd": "free -h > reports/swap.txt"
    },
    {
     "cmd": "swapon --show >> reports/swap.txt"
    },
    {
     "cmd": "cat /proc/swaps >> reports/swap.txt"
    },
    {
     "cmd": "lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT >> reports/swap.txt"
    },
    {
     "text": "Add your answer at the end with nano: the size, and whether the TYPE column in swapon --show says file or partition."
    }
   ],
   "validation": "grep -i swap reports/swap.txt. On a default Mint install, swapon --show lists /swapfile with TYPE file and lsblk shows no partition with FSTYPE swap.",
   "trap": "Swap can be a partition, a logical volume or a file. It extends RAM by moving memory pages of idle processes to disk, so it is much slower than RAM. In lsblk -f a swap partition shows FSTYPE swap and the mount point [SWAP]; a swap file never shows in lsblk.",
   "paste": {
    "command": "cat reports/swap.txt",
    "checks": [
     {
      "re": "^Swap:\\s+\\S+",
      "say": "free -h output is included"
     },
     {
      "re": "^NAME\\s+TYPE\\s+SIZE\\s+USED\\s+PRIO",
      "say": "swapon --show output is included"
     },
     {
      "re": "^Filename\\s+Type\\s+Size\\s+Used\\s+Priority",
      "say": "/proc/swaps is included"
     },
     {
      "re": "NAME\\s+SIZE\\s+TYPE\\s+FSTYPE\\s+MOUNTPOINT",
      "say": "the lsblk view is included"
     }
    ]
   },
   "quiz": [
    {
     "id": "swapfile",
     "prompt": "Why doesn't a swap file show up in <code>lsblk</code>?",
     "answer": "file",
     "options": [
      {
       "value": "file",
       "label": "It is a file inside a filesystem, not a block device"
      },
      {
       "value": "off",
       "label": "Swap is always hidden"
      },
      {
       "value": "root",
       "label": "lsblk needs sudo to show swap"
      }
     ],
     "explain": "Correct. swapon --show or /proc/swaps lists it with TYPE file."
    }
   ],
   "completion": "Report the swap space: done."
  },
  {
   "id": "13.6",
   "kind": "vm",
   "title": "Shape lsblk output for a report",
   "navSubtitle": "lsblk -o, -p, -d, -s",
   "objective": "101.1",
   "difficulty": "Intermediate",
   "source": "Lab 6: Shape lsblk output for a report",
   "workdir": "~/lpic1-section13",
   "summary": "",
   "scenario": "Your team lead wants a compact storage table for the change record, with full device paths and the dependency chain from each filesystem down to its disk.",
   "task": "Produce four lsblk views: chosen columns, full paths, disks only, and the inverse (bottom-up) tree.",
   "deliverable": "reports/lsblk-views.txt",
   "steps": [
    {
     "cmd": "lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT > reports/lsblk-views.txt"
    },
    {
     "cmd": "lsblk -p >> reports/lsblk-views.txt"
    },
    {
     "cmd": "lsblk -d >> reports/lsblk-views.txt"
    },
    {
     "cmd": "lsblk -s >> reports/lsblk-views.txt"
    },
    {
     "cmd": "lsblk --help | grep -A60 'Available output columns' | head -25 >> reports/lsblk-views.txt"
    }
   ],
   "validation": "grep -c '/dev/' reports/lsblk-views.txt returns a number greater than 0, which proves the -p view is included.",
   "trap": "The -o list is comma separated with no spaces. lsblk -o NAME, SIZE fails because SIZE becomes a separate argument that lsblk treats as a device name. -s turns the tree upside down, so a filesystem is listed first with its disk underneath.",
   "paste": {
    "command": "cat reports/lsblk-views.txt",
    "checks": [
     {
      "re": "NAME\\s+SIZE\\s+TYPE\\s+FSTYPE\\s+MOUNTPOINT",
      "say": "the -o view with chosen columns is included"
     },
     {
      "re": "^\\S*/dev/\\w+\\s+\\d+:\\d+",
      "say": "the -p view shows full device paths"
     },
     {
      "re": "(└─|`-)(sd[a-z]|vd[a-z]|nvme\\d+n\\d+|loop\\d+)\\s+\\d+:\\d+",
      "say": "the -s view lists a disk under its partition"
     },
     {
      "re": "Available output columns",
      "say": "the column list from lsblk --help is included"
     }
    ]
   },
   "quiz": [
    {
     "id": "lsblks",
     "prompt": "Which lsblk option shows the tree upside down, with each disk under its partitions?",
     "answer": "-s",
     "options": [
      "-d",
      "-f",
      "-p",
      "-s"
     ],
     "explain": "Correct. -s shows inverse dependencies."
    },
    {
     "id": "ospace",
     "prompt": "Why does <code>lsblk -o NAME, SIZE</code> fail?",
     "answer": "space",
     "options": [
      {
       "value": "space",
       "label": "SIZE becomes a separate argument, read as a device name"
      },
      {
       "value": "case",
       "label": "Column names must be lowercase"
      },
      {
       "value": "sudo",
       "label": "It needs sudo"
      }
     ],
     "explain": "Correct. Use commas with no spaces."
    }
   ],
   "completion": "Shape lsblk output for a report: done."
  },
  {
   "id": "13.7",
   "kind": "vm",
   "title": "Find the persistent names of a disk",
   "navSubtitle": "/dev/disk/by-*, readlink",
   "objective": "101.1",
   "difficulty": "Intermediate",
   "source": "Lab 7: Find the persistent names of a disk",
   "workdir": "~/lpic1-section13",
   "summary": "",
   "scenario": "A server's disks swapped names after a controller was added: sdb became sdc. The team wants to know which names stay stable.",
   "task": "List the persistent name directories under /dev/disk and resolve each link to the real device file.",
   "deliverable": "reports/persistent-names.txt",
   "steps": [
    {
     "cmd": "ls -l /dev/disk/by-id /dev/disk/by-uuid /dev/disk/by-path > reports/persistent-names.txt 2>&1"
    },
    {
     "cmd": "ls -l /dev/disk/by-label >> reports/persistent-names.txt 2>&1"
    },
    {
     "text": "for l in /dev/disk/by-uuid/*; do echo \"$l -> $(readlink -f $l)\"; done >> reports/persistent-names.txt"
    }
   ],
   "validation": "grep -c -- '->' reports/persistent-names.txt returns several matches, and the last lines show each UUID resolving to a /dev/ name.",
   "trap": "by-id uses the model and serial number, by-path uses the bus position, by-uuid uses the filesystem's UUID, and by-label exists only if a filesystem has a label. A UUID belongs to the filesystem, so it changes when the partition is reformatted. It is fine for by-label to be missing.",
   "paste": {
    "command": "cat reports/persistent-names.txt",
    "checks": [
     {
      "re": "^/dev/disk/by-uuid:",
      "say": "the by-uuid directory was listed"
     },
     {
      "re": "-> \\.\\./\\.\\./\\w+",
      "say": "the symbolic links point to device files",
      "min": 2
     },
     {
      "re": "^/dev/disk/by-uuid/\\S+ -> /dev/\\w+",
      "say": "each UUID is resolved to a /dev name"
     }
    ]
   },
   "quiz": [
    {
     "id": "byid",
     "prompt": "Which /dev/disk directory names a disk by its model and serial number?",
     "answer": "by-id",
     "options": [
      "by-id",
      "by-uuid",
      "by-path",
      "by-label"
     ],
     "explain": "Correct. by-path uses the bus position instead."
    },
    {
     "id": "uuidmkfs",
     "prompt": "Which action gives a partition a new UUID?",
     "answer": "mkfs",
     "options": [
      {
       "value": "mkfs",
       "label": "Reformatting it with mkfs"
      },
      {
       "value": "move",
       "label": "Moving the disk to another controller"
      },
      {
       "value": "reboot",
       "label": "A reboot"
      }
     ],
     "explain": "Correct. The UUID belongs to the filesystem."
    }
   ],
   "completion": "Find the persistent names of a disk: done."
  },
  {
   "id": "13.8",
   "kind": "vm",
   "title": "Check for LVM and the device mapper",
   "navSubtitle": "LVM, /dev/mapper",
   "objective": "102.1",
   "difficulty": "Intermediate",
   "source": "Lab 8: Check for LVM and the device mapper",
   "workdir": "~/lpic1-section13",
   "summary": "",
   "scenario": "Question 4 of STOR-1013 asks whether app02 uses LVM. On a server that does, the answer explains why growing a volume needs no downtime.",
   "task": "Look for device mapper devices, resolve them, and write a short explanation of the LVM layers.",
   "deliverable": "reports/lvm-check.txt",
   "steps": [
    {
     "cmd": "ls -l /dev/mapper > reports/lvm-check.txt"
    },
    {
     "cmd": "lsblk -p | grep -E 'mapper|lvm' >> reports/lvm-check.txt || echo 'No LVM volumes on this host' >> reports/lvm-check.txt"
    },
    {
     "cmd": "ls -l /dev/dm-* >> reports/lvm-check.txt 2>&1"
    },
    {
     "text": "for l in /dev/mapper/*; do echo \"$l -> $(readlink -f $l)\"; done >> reports/lvm-check.txt"
    },
    {
     "text": "Use nano to add four lines: physical volume (a partition marked for LVM with pvcreate), volume group (a pool of physical volumes made with vgcreate), logical volume (space carved from the group with lvcreate, then formatted and mounted like a partition), and how pvs, vgs and lvs report each layer."
    }
   ],
   "validation": "grep control reports/lvm-check.txt. /dev/mapper/control always exists. If your VM uses LVM, you also see names such as vgname-root that resolve to /dev/dm-0.",
   "trap": "A partition cannot join a volume group until pvcreate makes it a physical volume. The device mapper names /dev/mapper/vgname-lvname are symbolic links to /dev/dm-N, and the same volume is also reachable as /dev/vgname/lvname. In lsblk the TYPE column shows lvm for a logical volume.",
   "paste": {
    "command": "cat reports/lvm-check.txt",
    "checks": [
     {
      "re": "\\bcontrol\\b",
      "say": "/dev/mapper/control is listed"
     },
     {
      "re": "physical volume|pvcreate",
      "say": "your notes explain physical volumes"
     },
     {
      "re": "volume group|vgcreate",
      "say": "your notes explain volume groups"
     },
     {
      "re": "logical volume|lvcreate",
      "say": "your notes explain logical volumes"
     }
    ]
   },
   "quiz": [
    {
     "id": "lvmorder",
     "prompt": "What is the right order to build LVM storage?",
     "answer": "order",
     "options": [
      {
       "value": "order",
       "label": "<code>pvcreate</code>, <code>vgcreate</code>, <code>lvcreate</code>"
      },
      {
       "value": "o2",
       "label": "<code>vgcreate</code>, <code>pvcreate</code>, <code>lvcreate</code>"
      },
      {
       "value": "o3",
       "label": "<code>lvcreate</code>, <code>vgcreate</code>, <code>pvcreate</code>"
      }
     ],
     "explain": "Correct. Physical volumes join a group, then logical volumes are carved from it."
    },
    {
     "id": "dm",
     "prompt": "What is <code>/dev/mapper/vg01-data</code>?",
     "answer": "link",
     "options": [
      {
       "value": "link",
       "label": "A link to a /dev/dm-N device for a logical volume"
      },
      {
       "value": "part",
       "label": "A partition on vg01"
      },
      {
       "value": "file",
       "label": "A config file for LVM"
      }
     ],
     "explain": "Correct. lsblk shows it with TYPE lvm."
    }
   ],
   "completion": "Check for LVM and the device mapper: done."
  },
  {
   "id": "13.9",
   "kind": "vm",
   "title": "Brief the database team on Btrfs",
   "navSubtitle": "Btrfs features",
   "objective": "104.1",
   "difficulty": "Intermediate",
   "source": "Lab 9: Brief the database team on Btrfs",
   "workdir": "~/lpic1-section13",
   "summary": "",
   "scenario": "The database team has heard that Btrfs handles large files, snapshots and compression, and asks whether this host could use it.",
   "task": "Check the kernel's Btrfs support and write a short briefing note in your own words.",
   "deliverable": "reports/btrfs-note.txt",
   "steps": [
    {
     "cmd": "grep -w btrfs /proc/filesystems > reports/btrfs-note.txt || echo 'btrfs module not loaded yet' > reports/btrfs-note.txt"
    },
    {
     "cmd": "ls -d /lib/modules/$(uname -r)/kernel/fs/btrfs >> reports/btrfs-note.txt"
    },
    {
     "text": "which mkfs.btrfs >> reports/btrfs-note.txt || echo 'btrfs-progs not installed' >> reports/btrfs-note.txt"
    },
    {
     "text": "nano reports/btrfs-note.txt and add lines on: its B-tree and copy-on-write design, built-in RAID 0, 1 and 10 across several devices, subvolumes and snapshots (mounted with -o subvol=name), and transparent per-file compression with zlib, lzo or zstd."
    }
   ],
   "validation": "grep -c -i -E 'raid|subvol|compress|snapshot' reports/btrfs-note.txt returns at least 4.",
   "trap": "Btrfs is a filesystem, not a volume manager, even though it can span several devices and has subvolumes. Compression is transparent: applications read and write normal data. The LPIC objective also lists ReiserFS as an older journaling filesystem to know by name; it has been removed from recent kernels.",
   "paste": {
    "command": "cat reports/btrfs-note.txt",
    "checks": [
     {
      "re": "kernel/fs/btrfs",
      "say": "the kernel's btrfs module directory is shown"
     },
     {
      "re": "mkfs\\.btrfs|btrfs-progs not installed",
      "say": "you checked for mkfs.btrfs"
     },
     {
      "re": "raid|subvol|compress|snapshot",
      "say": "your notes cover RAID, subvolumes, snapshots and compression",
      "min": 4
     },
     {
      "re": "copy-on-write|\\bCoW\\b",
      "say": "your notes mention copy-on-write"
     }
    ]
   },
   "quiz": [
    {
     "id": "btrfsis",
     "prompt": "Which statement about Btrfs is true?",
     "answer": "fs",
     "options": [
      {
       "value": "fs",
       "label": "It is a copy-on-write filesystem with subvolumes and snapshots"
      },
      {
       "value": "vm",
       "label": "It is a volume manager like LVM"
      },
      {
       "value": "ro",
       "label": "It can only be mounted read-only"
      }
     ],
     "explain": "Correct. It spans devices but is still a filesystem."
    },
    {
     "id": "subvol",
     "prompt": "How do you mount a Btrfs subvolume named data?",
     "answer": "subvol",
     "options": [
      {
       "value": "subvol",
       "label": "<code>mount -o subvol=data</code>"
      },
      {
       "value": "t",
       "label": "<code>mount -t data</code>"
      },
      {
       "value": "L",
       "label": "<code>mount -L data</code>"
      }
     ],
     "explain": "Correct."
    }
   ],
   "completion": "Brief the database team on Btrfs: done."
  },
  {
   "id": "13.10",
   "kind": "vm",
   "title": "List interrupts, I/O ports and DMA channels",
   "navSubtitle": "lsdev, IRQs, I/O ports",
   "objective": "101.1",
   "difficulty": "Advanced",
   "source": "Lab 10: List interrupts, I/O ports and DMA channels",
   "workdir": "~/lpic1-section13",
   "summary": "",
   "scenario": "A vendor's support engineer asks for the IRQ and I/O port assignments on app02 while troubleshooting an old add-in card.",
   "task": "Run lsdev if available, and capture the three /proc files it reads from.",
   "deliverable": "reports/resources.txt",
   "steps": [
    {
     "text": "which lsdev && lsdev > reports/resources.txt"
    },
    {
     "cmd": "cat /proc/interrupts >> reports/resources.txt"
    },
    {
     "cmd": "sudo cat /proc/ioports >> reports/resources.txt"
    },
    {
     "cmd": "cat /proc/dma >> reports/resources.txt"
    }
   ],
   "validation": "grep -i timer reports/resources.txt returns at least one line (the timer appears in both the interrupt and the I/O port lists).",
   "trap": "Without sudo, /proc/ioports shows every address as 0000-0000. /proc/dma is often nearly empty on modern hardware because few devices use ISA DMA channels. lsdev is not installed by default.",
   "paste": {
    "command": "cat reports/resources.txt",
    "checks": [
     {
      "re": "^\\s*CPU0\\b",
      "say": "/proc/interrupts is included"
     },
     {
      "re": "timer",
      "say": "the timer appears in more than one list",
      "min": 2
     },
     {
      "re": "^\\s*[0-9a-f]{4}-(?!0000)[0-9a-f]{4} : ",
      "say": "/proc/ioports shows real addresses, so sudo was used",
      "min": 3
     }
    ]
   },
   "quiz": [
    {
     "id": "ioports",
     "prompt": "<code>/proc/ioports</code> shows every range as 0000-0000. Why?",
     "answer": "sudo",
     "options": [
      {
       "value": "sudo",
       "label": "It was read without root"
      },
      {
       "value": "none",
       "label": "The machine has no I/O ports"
      },
      {
       "value": "vm",
       "label": "VMs hide I/O ports"
      }
     ],
     "explain": "Correct. Read it with sudo."
    },
    {
     "id": "lsdevsrc",
     "prompt": "Where does <code>lsdev</code> get its information?",
     "answer": "proc",
     "options": [
      {
       "value": "proc",
       "label": "<code>/proc/interrupts</code>, <code>/proc/ioports</code> and <code>/proc/dma</code>"
      },
      {
       "value": "sys",
       "label": "<code>/sys/firmware/efi</code>"
      },
      {
       "value": "dev",
       "label": "<code>/dev/disk/by-id</code>"
      }
     ],
     "explain": "Correct."
    }
   ],
   "completion": "List interrupts, I/O ports and DMA channels: done."
  },
  {
   "id": "13.11",
   "kind": "vm",
   "title": "Watch a new blank disk appear",
   "navSubtitle": "losetup, blank disk",
   "objective": "101.1",
   "difficulty": "Advanced",
   "source": "Lab 11: Watch a new blank disk appear",
   "workdir": "~/lpic1-section13",
   "summary": "",
   "scenario": "Before Section 15's partitioning work, a junior engineer wants to see what a brand-new, unpartitioned disk looks like to Linux.",
   "task": "Attach the blank image as a loop device, inspect it with lsblk and /proc/partitions, then detach it.",
   "deliverable": "reports/new-disk.txt",
   "steps": [
    {
     "text": "NEW=$(sudo losetup -f --show images/newdisk.img); echo $NEW > reports/new-disk.txt"
    },
    {
     "cmd": "lsblk $NEW >> reports/new-disk.txt"
    },
    {
     "cmd": "grep -w $(basename $NEW) /proc/partitions >> reports/new-disk.txt"
    },
    {
     "cmd": "lsblk -f $NEW >> reports/new-disk.txt"
    },
    {
     "cmd": "sudo losetup -d $NEW"
    },
    {
     "cmd": "losetup -j images/newdisk.img"
    }
   ],
   "validation": "cat reports/new-disk.txt shows a loop device of 256M with no partitions and an empty FSTYPE column. The final losetup -j command prints nothing, which proves the image is detached.",
   "trap": "A new disk has no partition table and no filesystem, so it cannot hold files yet. The loop device behaves like a disk, but always detach it with losetup -d when you finish so it does not stay attached.",
   "paste": {
    "command": "cat reports/new-disk.txt",
    "checks": [
     {
      "re": "^loop\\d+\\s+\\d+:\\d+\\s+\\d+\\s+256M\\s+\\d+\\s+loop",
      "say": "lsblk shows a 256M loop device"
     },
     {
      "re": "\\s262144\\s+loop\\d+",
      "say": "/proc/partitions shows 262144 blocks"
     },
     {
      "re": "NAME\\s+FSTYPE",
      "say": "lsblk -f output is included"
     },
     {
      "re": "^loop\\d+[ \\t]*$",
      "say": "the FSTYPE column is empty, so there is no filesystem"
     }
    ]
   },
   "quiz": [
    {
     "id": "blank",
     "prompt": "What does a brand-new blank disk need before it can hold files?",
     "answer": "both",
     "options": [
      {
       "value": "both",
       "label": "A partition table or partition, then a filesystem"
      },
      {
       "value": "mount",
       "label": "Just a mount point"
      },
      {
       "value": "nothing",
       "label": "Nothing; you can copy files to it now"
      }
     ],
     "explain": "Correct. Raw space can't hold files until mkfs creates a filesystem."
    },
    {
     "id": "detach",
     "prompt": "Which command detaches a loop device?",
     "answer": "d",
     "options": [
      {
       "value": "d",
       "label": "<code>losetup -d /dev/loopN</code>"
      },
      {
       "value": "f",
       "label": "<code>losetup -f</code>"
      },
      {
       "value": "u",
       "label": "<code>umount /dev/loopN</code>"
      }
     ],
     "explain": "Correct. -f finds the next free loop device."
    }
   ],
   "completion": "Watch a new blank disk appear: done."
  },
  {
   "id": "13.12",
   "kind": "vm",
   "title": "Map the disk layout to the directory tree",
   "navSubtitle": "BIOS/UEFI, layout",
   "objective": "102.1",
   "difficulty": "Advanced",
   "source": "Lab 12: Map the disk layout to the directory tree",
   "workdir": "~/lpic1-section13",
   "summary": "",
   "scenario": "For a design review, the architect asks how app02's disk is laid out: BIOS or UEFI boot, which partitions are mounted where, and what you would change for a database server.",
   "task": "Record the boot firmware, the mounted filesystems and the layout, then write a short recommendation.",
   "deliverable": "reports/layout.txt",
   "steps": [
    {
     "text": "[ -d /sys/firmware/efi ] && echo UEFI > reports/layout.txt || echo BIOS > reports/layout.txt"
    },
    {
     "cmd": "findmnt -t ext4,vfat,xfs,btrfs >> reports/layout.txt"
    },
    {
     "cmd": "findmnt /boot/efi >> reports/layout.txt || echo 'No EFI system partition mounted' >> reports/layout.txt"
    },
    {
     "cmd": "lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINT >> reports/layout.txt"
    },
    {
     "text": "nano reports/layout.txt and add a recommendation: separate partitions or volumes for /var and /home, where swap should go, and why /boot/efi must be a FAT (vfat) partition on UEFI systems."
    }
   ],
   "validation": "head -1 reports/layout.txt prints UEFI or BIOS, and grep -c ext4 reports/layout.txt returns at least 1.",
   "trap": "A UEFI system needs an EFI system partition (ESP) formatted as FAT and usually mounted at /boot/efi. A BIOS system booting from a GPT disk needs a small BIOS boot partition instead. Putting /var on its own partition stops runaway logs from filling the root filesystem.",
   "paste": {
    "command": "cat reports/layout.txt",
    "checks": [
     {
      "re": "^(UEFI|BIOS)[ \\t]*$",
      "say": "the boot firmware is recorded"
     },
     {
      "re": "^TARGET\\s+SOURCE\\s+FSTYPE\\s+OPTIONS",
      "say": "findmnt output is included"
     },
     {
      "re": "\\sext4\\s",
      "say": "an ext4 filesystem is listed"
     },
     {
      "re": "/var\\b",
      "say": "your recommendation covers /var"
     }
    ]
   },
   "quiz": [
    {
     "id": "espfs",
     "prompt": "On a UEFI system, how must /boot/efi be formatted?",
     "answer": "fat",
     "options": [
      "ext4",
      {
       "value": "fat",
       "label": "FAT (vfat)"
      },
      "XFS",
      "swap"
     ],
     "explain": "Correct. UEFI firmware reads FAT."
    },
    {
     "id": "var",
     "prompt": "Why put /var on its own partition?",
     "answer": "logs",
     "options": [
      {
       "value": "logs",
       "label": "Runaway logs can't fill the root filesystem"
      },
      {
       "value": "fast",
       "label": "It makes booting faster"
      },
      {
       "value": "uefi",
       "label": "UEFI requires it"
      }
     ],
     "explain": "Correct."
    }
   ],
   "completion": "Map the disk layout to the directory tree: done."
  }
 ],
 "review": {
  "traps": [
   "Mixing up disks and partitions. /dev/sdb is the second whole disk; /dev/sda2 is the second partition on the first disk.",
   "Forgetting the p in NVMe partition names. The first partition on nvme0n1 is nvme0n1p1.",
   "Assuming hd names are current. /dev/hda belongs to old PATA systems; /dev/sr0 is an optical drive and /dev/fd0 a floppy.",
   "Calling a partition a filesystem before it is formatted. A partition is just space until mkfs puts a filesystem on it.",
   "Reading /proc/partitions sizes as bytes or sectors. The #blocks column is in 1 KiB blocks.",
   "Thinking nodev filesystems live on a disk. nodev entries in /proc/filesystems, such as proc, sysfs and tmpfs, have no block device.",
   "Expecting /proc/filesystems to list every filesystem the kernel could use. Modules that are not loaded yet are missing.",
   "Putting spaces in an lsblk -o column list. Use commas only: lsblk -o NAME,SIZE,FSTYPE.",
   "Forgetting which lsblk option does what: -f filesystems, -p full paths, -s inverse dependencies, -d disks only.",
   "Treating swap as extra RAM. It is disk space that holds pages from idle processes, and it can be a partition, a logical volume or a file.",
   "Getting the LVM order wrong. Partitions become physical volumes, physical volumes join a volume group, and logical volumes are carved from the group.",
   "Not recognizing device mapper names. /dev/mapper/vg-lv is a link to /dev/dm-N, and lsblk shows the type as lvm.",
   "Assuming a UUID survives a reformat. The UUID belongs to the filesystem, so mkfs creates a new one.",
   "Calling Btrfs a volume manager. It is a copy-on-write filesystem with its own RAID, subvolumes, snapshots and transparent compression."
  ],
  "trapQuiz": [
   {
    "id": "tq1",
    "prompt": "Which name is the second partition on the first SATA disk?",
    "answer": "sda2",
    "options": [
     {
      "value": "sda2",
      "label": "<code>/dev/sda2</code>"
     },
     {
      "value": "sdb",
      "label": "<code>/dev/sdb</code>"
     },
     {
      "value": "sdb1",
      "label": "<code>/dev/sdb1</code>"
     }
    ],
    "explain": "Correct. sdb is the second whole disk."
   },
   {
    "id": "tq2",
    "prompt": "A partition was just created. Can it hold files yet?",
    "answer": "no",
    "options": [
     {
      "value": "no",
      "label": "No. It needs a filesystem from mkfs first"
     },
     {
      "value": "yes",
      "label": "Yes, partitions store files directly"
     },
     {
      "value": "reboot",
      "label": "Yes, after a reboot"
     }
    ],
    "explain": "Correct. A partition is only space."
   },
   {
    "id": "tq3",
    "prompt": "In what units is the #blocks column of <code>/proc/partitions</code>?",
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
      "value": "b",
      "label": "Bytes"
     }
    ],
    "explain": "Correct."
   },
   {
    "id": "tq4",
    "prompt": "Which of these is a <code>nodev</code> filesystem?",
    "answer": "tmpfs",
    "options": [
     "ext4",
     "vfat",
     "tmpfs",
     "xfs"
    ],
    "explain": "Correct. tmpfs lives in memory."
   },
   {
    "id": "tq5",
    "prompt": "Which lsblk option adds the filesystem type, label and UUID?",
    "answer": "-f",
    "options": [
     "-d",
     "-f",
     "-p",
     "-s"
    ],
    "explain": "Correct."
   },
   {
    "id": "tq6",
    "prompt": "Which is true about swap?",
    "answer": "disk",
    "options": [
     {
      "value": "disk",
      "label": "It is disk space for idle pages, and can be a partition, LV or file"
     },
     {
      "value": "ram",
      "label": "It adds real RAM"
     },
     {
      "value": "part",
      "label": "It must be a partition"
     }
    ],
    "explain": "Correct. It is much slower than RAM."
   },
   {
    "id": "tq7",
    "prompt": "What shows up as TYPE <code>lvm</code> in lsblk?",
    "answer": "lv",
    "options": [
     {
      "value": "lv",
      "label": "A logical volume"
     },
     {
      "value": "pv",
      "label": "A physical volume"
     },
     {
      "value": "vg",
      "label": "A volume group"
     }
    ],
    "explain": "Correct. It is reached through /dev/mapper and /dev/dm-N."
   },
   {
    "id": "tq8",
    "prompt": "What is Btrfs?",
    "answer": "fs",
    "options": [
     {
      "value": "fs",
      "label": "A copy-on-write filesystem"
     },
     {
      "value": "vm",
      "label": "A volume manager"
     },
     {
      "value": "raid",
      "label": "A hardware RAID driver"
     }
    ],
    "explain": "Correct. It has its own RAID, subvolumes and compression."
   }
  ],
  "challenge": {
   "intro": "Complete these tasks without notes, using only your Linux Mint VM and the files in ~/lpic1-section13. Run Step 2 of the Lab Setup first so DISK is set, and save each answer under reports/ with a name that starts with challenge-.",
   "tasks": [
    "Answer all four questions in notes/ticket-stor-1013.txt in one file, with the command output that proves each answer.",
    "Show the size of your main disk using /proc/partitions only, converted to GiB.",
    "List the filesystems your kernel supports that need a block device.",
    "Show every block device with its full path, its filesystem type and its mount point in one lsblk command.",
    "Prove whether your swap is a file or a partition, and give its size.",
    "Resolve every link in /dev/disk/by-id to its real device file.",
    "Attach images/newdisk.img as a loop device, show that it has no filesystem, and detach it.",
    "State whether your VM boots with BIOS or UEFI, and name the partition that holds the EFI files if there is one."
   ],
   "outro": "Your final handoff is the reports directory. For each challenge file, write one sentence explaining what it proves, as if you were closing the ticket for bob."
  },
  "questions": [
   {
    "q": "App team request: “How many disks and partitions does app02 have, and which one holds the root filesystem?”",
    "a": "Run <code>lsblk</code>: rows with TYPE <code>disk</code> are disks and rows with TYPE <code>part</code> are partitions. The partition whose MOUNTPOINT is <code>/</code> holds root; <code>findmnt /</code> confirms it."
   },
   {
    "q": "Database team request: “Can this kernel read XFS today, or does it need a module loaded first?”",
    "a": "<code>grep -w xfs /proc/filesystems</code>. If it is missing, the module may just not be loaded: check <code>ls /lib/modules/$(uname -r)/kernel/fs/xfs</code> or <code>modinfo xfs</code>. It loads on mount, or with <code>sudo modprobe xfs</code>."
   },
   {
    "q": "Capacity planner request: “How much swap does web01 have, and is it a file or a partition?”",
    "a": "<code>free -h</code> gives the total, and <code>swapon --show</code> (or <code>cat /proc/swaps</code>) lists each area with TYPE <code>file</code> or <code>partition</code>."
   },
   {
    "q": "Field engineer request: “Is there an optical drive in db01? Give me the device file name.”",
    "a": "<code>ls -l /dev/sr*</code> or <code>lsblk</code> and look for TYPE <code>rom</code>. The first optical drive is <code>/dev/sr0</code>."
   },
   {
    "q": "Storage team request: “The disk names changed after a reboot. Show me a name for this disk that will not change.”",
    "a": "<code>ls -l /dev/disk/by-id</code> (model and serial) or <code>/dev/disk/by-uuid</code> (the filesystem), and <code>readlink -f</code> on the link to see which /dev name it points to now."
   },
   {
    "q": "Architect request: “Is this server using LVM? If it is, show me which logical volumes sit on which partitions.”",
    "a": "<code>lsblk</code> shows TYPE <code>lvm</code> rows under the partitions they use, and <code>/dev/mapper</code> has their links. <code>sudo pvs</code> shows which partitions belong to which group, and <code>sudo lvs -o +devices</code> shows which ones each logical volume sits on."
   },
   {
    "q": "Vendor support request: “Send me the interrupt and I/O port list from this machine.”",
    "a": "<code>cat /proc/interrupts</code> and <code>sudo cat /proc/ioports</code> (sudo, or every address shows 0000-0000), or <code>lsdev</code> from the procinfo package."
   }
  ],
  "mastery": [
   "I can explain the difference between a disk, a partition, a filesystem and a mount point.",
   "I can name disks and partitions for SATA, SCSI and USB (sd), virtio (vd), NVMe, PATA (hd), optical (sr) and floppy (fd) devices.",
   "I can list block devices with lsblk and read its NAME, SIZE, TYPE and MOUNTPOINT columns.",
   "I can use lsblk -f, -p, -s, -d and -o to show the view a request needs.",
   "I can read /proc/partitions and convert its block counts to GiB.",
   "I can read /proc/filesystems and explain what nodev means.",
   "I can report swap with free -h, swapon --show and /proc/swaps, and tell a swap file from a swap partition.",
   "I can find persistent disk names in /dev/disk/by-id, by-uuid, by-path and by-label and resolve them with readlink -f.",
   "I can explain physical volumes, volume groups and logical volumes, and recognize /dev/mapper and /dev/dm-N names.",
   "I can describe the main features of Btrfs: copy-on-write, built-in RAID, subvolumes, snapshots and compression.",
   "I can show interrupts, I/O ports and DMA channels with lsdev or the /proc files.",
   "I can tell whether a system boots with BIOS or UEFI and explain where the EFI system partition fits in the layout."
  ]
 }
});
