/* Section 16: Mounting, fstab and Filesystem Checks. Generated from LPIC_Section16_Lab_Workbook.docx by vm_section.py;
   paste checks, quizzes and model answers were added for the app. */
LPIC.section({
 "id": "section-16",
 "number": 16,
 "title": "Mounting, fstab and Filesystem Checks",
 "objectives": [
  "102.1",
  "104.2",
  "104.3"
 ],
 "kind": "vm",
 "source": "LPIC_Section16_Lab_Workbook.docx",
 "scenario": "Objectives 102.1, 104.2 and 104.3: Plan mount points, mount and unmount filesystems, write /etc/fstab entries, monitor space and inodes, and check, tune, and repair ext4 and XFS filesystems.",
 "overview": {
  "paragraphs": [
   "Treat each lab like a storage ticket, not a command drill. Read the scenario, decide which filesystem or directory the request is really about, make only the change the ticket asks for, and save proof in the reports folder that someone else could review.",
   "Safety first. Every mount, fsck, tune2fs, and xfs_repair command in this workbook runs against disk-image files in ~/lpic1-section16/images, attached as loop devices with losetup. Never point these commands at /dev/sda, /dev/vda, or /dev/nvme0n1. Section 15 covers creating partitions, mkfs, and swap; here the Lab Setup builds the images quickly so you can focus on using them.",
   "You never edit the real /etc/fstab. Every fstab lab works on a copy in configs/ and is tested with findmnt --verify and mount --fake. A typo in the real file can stop the VM from booting.",
   "The loop device names are kept in three shell variables: DATA, ARCH, and SPOOL. If you open a new terminal, run Step 6 of the Lab Setup to reload them. Loop devices do not survive a reboot; after a reboot, rerun Step 4 only."
  ],
  "setup": [
   {
    "text": "Step 1: Install the XFS tools. Linux Mint does not include them by default:"
   },
   {
    "cmd": "sudo apt install xfsprogs"
   },
   {
    "text": "Step 2: Create the practice workspace:"
   },
   {
    "cmd": "mkdir -p ~/lpic1-section16/{images,configs,reports,mnt/data,mnt/archive,mnt/spool}"
   },
   {
    "cmd": "cd ~/lpic1-section16"
   },
   {
    "text": "Step 3: Create three sparse image files. They use almost no real disk space until data is written to them:"
   },
   {
    "cmd": "truncate -s 256M images/data.img"
   },
   {
    "cmd": "truncate -s 512M images/archive.img"
   },
   {
    "cmd": "truncate -s 64M images/spool.img"
   },
   {
    "text": "Step 4: Attach the images as loop devices and keep their names in variables. Run sudo -v first so the password prompt does not get mixed into the output:"
   },
   {
    "cmd": "sudo -v"
   },
   {
    "cmd": "export DATA=$(sudo losetup -fP --show images/data.img)"
   },
   {
    "cmd": "export ARCH=$(sudo losetup -fP --show images/archive.img)"
   },
   {
    "cmd": "export SPOOL=$(sudo losetup -fP --show images/spool.img)"
   },
   {
    "cmd": "echo \"DATA=$DATA ARCH=$ARCH SPOOL=$SPOOL\""
   },
   {
    "text": "Step 5: Put a filesystem on the first two loop devices. The spool device stays blank until Lab 8. Run this step only once, because it erases whatever is on the images:"
   },
   {
    "cmd": "sudo mkfs.ext4 -q -L DATA01 \"$DATA\""
   },
   {
    "cmd": "sudo mkfs.xfs -q -L ARCHIVE \"$ARCH\""
   },
   {
    "text": "Step 6: Only if you open a new terminal: reload the variables from the devices that are already attached:"
   },
   {
    "cmd": "cd ~/lpic1-section16"
   },
   {
    "cmd": "export DATA=$(losetup -j \"$PWD/images/data.img\" | cut -d: -f1)"
   },
   {
    "cmd": "export ARCH=$(losetup -j \"$PWD/images/archive.img\" | cut -d: -f1)"
   },
   {
    "cmd": "export SPOOL=$(losetup -j \"$PWD/images/spool.img\" | cut -d: -f1)"
   },
   {
    "text": "Validation check: Run losetup -a and confirm all three images are listed, then run lsblk -f \"$DATA\" \"$ARCH\" \"$SPOOL\" and confirm DATA shows ext4 with the label DATA01, ARCH shows xfs with the label ARCHIVE, and SPOOL shows no filesystem yet. If the echo in Step 4 printed an empty name, rerun Step 4."
   }
  ],
  "commands": [
   "lsblk -f",
   "blkid",
   "findmnt",
   "mount",
   "mount -t",
   "mount -o ro",
   "mount -o remount",
   "rw",
   "mount LABEL= and UUID=",
   "mount -a",
   "mount --fake",
   "mount -T",
   "umount",
   "fuser -vm",
   "losetup -fP --show",
   "losetup -j",
   "losetup -d",
   "/etc/fstab and its six fields",
   "findmnt --verify --tab-file",
   "systemctl list-units -t mount",
   "systemd-escape",
   "/etc/systemd/system",
   "/mnt",
   "/media",
   "df -h",
   "df -T",
   "df -i",
   "du -sh",
   "du -h --max-depth=1",
   "du --inodes",
   "mke2fs -N",
   "tune2fs -l",
   "tune2fs -L",
   "-c",
   "-C",
   "-i",
   "-m",
   "e2label",
   "dumpe2fs",
   "fsck -N",
   "fsck -A",
   "e2fsck -f",
   "-n",
   "-y",
   "-p",
   "-b",
   "fsck.ext4",
   "xfs_repair -n",
   "xfs_db -r",
   "xfs_admin -l",
   "-u",
   "-L",
   "xfs_info",
   "xfs_fsr",
   "the awareness names btrfs check",
   "btrfstune",
   "btrfs balance"
  ],
  "memoryHook": "Identify, attach, remember, measure, repair. lsblk and blkid identify a filesystem by device, label, and UUID. mount attaches it to a directory and umount detaches it. /etc/fstab remembers the mount for the next boot, and systemd turns each line into a .mount unit. df measures whole filesystems, du measures directories, and df -i counts inodes. fsck and xfs_repair only repair what is not mounted. For the six fstab fields, remember Don't Make The Old Dog Panic: Device, Mount point, Type, Options, Dump, Pass."
 },
 "lessons": [
  {
   "id": "16.1",
   "kind": "vm",
   "title": "Document the storage layout before a capacity review",
   "navSubtitle": "lsblk, findmnt, fstab",
   "objective": "102.1",
   "difficulty": "Beginner",
   "source": "Lab 1: Document the storage layout before a capacity review",
   "workdir": "~/lpic1-section16",
   "summary": "",
   "scenario": "A capacity review ticket asks for the current filesystem layout of your build, plus a recommendation on which directories should get their own filesystems on the next server, app02.",
   "task": "Record the block devices, what is mounted now, what mounts at boot, and the swap, then add a one-line recommendation.",
   "deliverable": "reports/layout.txt.",
   "steps": [
    {
     "cmd": "lsblk -f > reports/layout.txt"
    },
    {
     "cmd": "findmnt -t ext4,xfs,btrfs,vfat >> reports/layout.txt"
    },
    {
     "cmd": "grep -v '^#' /etc/fstab >> reports/layout.txt"
    },
    {
     "cmd": "swapon --show >> reports/layout.txt"
    },
    {
     "cmd": "echo 'Recommendation for app02: separate /boot, /home, /var, and /tmp; keep /etc, /bin, /sbin, /lib, and /dev on the root filesystem' >> reports/layout.txt"
    }
   ],
   "validation": "cat reports/layout.txt and confirm you can name the device mounted on /, whether /boot/efi is a separate vfat filesystem (UEFI installs only), and whether swap is a partition or a /swapfile.",
   "trap": "lsblk shows devices, findmnt shows what is mounted right now, and /etc/fstab shows what mounts at boot. They can disagree. The directories that must stay on the root filesystem are the ones needed to boot and repair the system: /etc, /bin, /sbin, /lib, and /dev. A default Mint install is the minimum layout: one ext4 root, an EFI system partition on UEFI, and a swap file.",
   "paste": {
    "command": "cat reports/layout.txt",
    "checks": [
     {
      "re": "NAME\\s+FSTYPE",
      "say": "includes lsblk -f output"
     },
     {
      "re": "^/\\s+/dev/\\S+\\s+(ext4|xfs|btrfs)\\s",
      "say": "findmnt shows the device mounted on /"
     },
     {
      "re": "^\\S+\\s+(file|partition)\\s+\\S+\\s+\\S+\\s+-?\\d+\\s*$",
      "say": "swapon --show lists the swap file or partition"
     },
     {
      "re": "Recommendation.*app02",
      "say": "ends with your recommendation for app02"
     }
    ]
   },
   "quiz": [
    {
     "id": "stay",
     "prompt": "Which directory must stay on the root filesystem?",
     "answer": "etc",
     "options": [
      {
       "value": "home",
       "label": "<code>/home</code>"
      },
      {
       "value": "etc",
       "label": "<code>/etc</code>"
      },
      {
       "value": "var",
       "label": "<code>/var</code>"
      },
      {
       "value": "tmp",
       "label": "<code>/tmp</code>"
      }
     ],
     "explain": "Correct. /etc holds the configuration needed to boot, so it can't be on a separate filesystem."
    },
    {
     "id": "now",
     "prompt": "Which command shows what is mounted right now, rather than what mounts at boot?",
     "answer": "findmnt",
     "options": [
      {
       "value": "findmnt",
       "label": "<code>findmnt</code>"
      },
      {
       "value": "fstab",
       "label": "<code>cat /etc/fstab</code>"
      },
      {
       "value": "lsblk",
       "label": "<code>lsblk -d</code>"
      }
     ],
     "explain": "Correct. /etc/fstab only says what should mount at boot."
    }
   ],
   "completion": "Document the storage layout before a capacity review: done."
  },
  {
   "id": "16.2",
   "kind": "vm",
   "title": "Show a teammate who really mounts the filesystems at boot",
   "navSubtitle": "systemd .mount units",
   "objective": "104.3",
   "difficulty": "Beginner",
   "source": "Lab 2: Show a teammate who really mounts the filesystems at boot",
   "workdir": "~/lpic1-section16",
   "summary": "",
   "scenario": "A junior engineer asks whether systemd or /etc/fstab is in charge of mounting, and where custom mount units would live.",
   "task": "List the active mount units, show that they were generated from /etc/fstab, check for hand-written units, and show how a path becomes a unit name.",
   "deliverable": "reports/mount-units.txt.",
   "steps": [
    {
     "cmd": "systemctl list-units -t mount --no-pager > reports/mount-units.txt"
    },
    {
     "cmd": "grep -l 'SourcePath=/etc/fstab' /run/systemd/generator/*.mount >> reports/mount-units.txt"
    },
    {
     "cmd": "ls /etc/systemd/system/*.mount >> reports/mount-units.txt 2>&1"
    },
    {
     "text": "systemd-escape -p --suffix=mount /srv/backup/data >> reports/mount-units.txt"
    }
   ],
   "validation": "grep -c '\\.mount' reports/mount-units.txt returns more than 0, and the last line reads srv-backup-data.mount.",
   "trap": "systemd-fstab-generator reads /etc/fstab at boot and writes .mount units into /run/systemd/generator, so you normally just edit fstab. Hand-written units go in /etc/systemd/system, and the file name must match the mount point (/srv/backup/data becomes srv-backup-data.mount). -.mount is the root filesystem.",
   "paste": {
    "command": "cat reports/mount-units.txt",
    "checks": [
     {
      "re": "\\.mount\\s+loaded\\s+active\\s+mounted",
      "say": "systemctl lists active mount units"
     },
     {
      "re": "/run/systemd/generator/\\S+\\.mount",
      "say": "lists the units generated from /etc/fstab"
     },
     {
      "re": "^srv-backup-data\\.mount\\s*$",
      "say": "systemd-escape turned /srv/backup/data into srv-backup-data.mount"
     }
    ]
   },
   "quiz": [
    {
     "id": "unitname",
     "prompt": "What must a hand-written unit for <code>/srv/data</code> be called?",
     "answer": "srv",
     "options": [
      {
       "value": "srv",
       "label": "<code>srv-data.mount</code>"
      },
      {
       "value": "slash",
       "label": "<code>/srv/data.mount</code>"
      },
      {
       "value": "any",
       "label": "Any name ending in .mount"
      }
     ],
     "explain": "Correct. The file name must match the mount point path."
    },
    {
     "id": "where",
     "prompt": "Where do hand-written mount units go?",
     "answer": "etc",
     "options": [
      {
       "value": "etc",
       "label": "<code>/etc/systemd/system</code>"
      },
      {
       "value": "run",
       "label": "<code>/run/systemd/generator</code>"
      },
      {
       "value": "fstab",
       "label": "<code>/etc/fstab.d</code>"
      }
     ],
     "explain": "Correct. /run/systemd/generator holds the units built from fstab at each boot."
    }
   ],
   "completion": "Show a teammate who really mounts the filesystems at boot: done."
  },
  {
   "id": "16.3",
   "kind": "vm",
   "title": "Mount a new volume and prove read-only protects it",
   "navSubtitle": "mount, remount,ro, umount",
   "objective": "104.3",
   "difficulty": "Beginner",
   "source": "Lab 3: Mount a new volume and prove read-only protects it",
   "workdir": "~/lpic1-section16",
   "summary": "",
   "scenario": "The storage team handed over a new volume for a reporting job on web01. Before the job goes live, the change owner wants proof that the volume mounts and that a read-only mount blocks writes.",
   "task": "Mount the DATA volume, write a test file, remount it read-only, prove a write fails, then remount read-write and unmount.",
   "deliverable": "reports/mount-test.txt.",
   "steps": [
    {
     "cmd": "sudo mount -t ext4 \"$DATA\" mnt/data"
    },
    {
     "cmd": "sudo chown \"$USER\": mnt/data"
    },
    {
     "cmd": "echo 'quarterly report v1' > mnt/data/report.txt"
    },
    {
     "cmd": "findmnt \"$PWD/mnt/data\" > reports/mount-test.txt"
    },
    {
     "cmd": "sudo mount -o remount,ro mnt/data"
    },
    {
     "text": "touch mnt/data/should-fail.txt 2>> reports/mount-test.txt"
    },
    {
     "cmd": "sudo mount -o remount,rw mnt/data"
    },
    {
     "cmd": "sudo umount mnt/data"
    }
   ],
   "validation": "cat reports/mount-test.txt shows the loop device mounted with ext4 and rw, followed by a Read-only file system error. findmnt \"$PWD/mnt/data\" now prints nothing.",
   "trap": "The command is umount, with no n after the u. mount with no arguments lists everything that is mounted. -t is optional because mount can detect the type. /mnt is the traditional place for temporary manual mounts, and /media (on Mint, /media/$USER) is where desktop removable media appears.",
   "paste": {
    "command": "cat reports/mount-test.txt",
    "checks": [
     {
      "re": "mnt/data\\s+/dev/loop\\d+\\s+ext4\\s+rw",
      "say": "findmnt shows the loop device mounted as ext4, rw"
     },
     {
      "re": "Read-only file system",
      "say": "the write failed after the read-only remount"
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
       "value": "eject",
       "label": "<code>mount -d</code>"
      }
     ],
     "explain": "Correct. There's no n after the u."
    },
    {
     "id": "mediadir",
     "prompt": "Where does Mint show removable media that the desktop mounts for you?",
     "answer": "media",
     "options": [
      {
       "value": "media",
       "label": "<code>/media/$USER</code>"
      },
      {
       "value": "mnt",
       "label": "<code>/mnt</code>"
      },
      {
       "value": "srv",
       "label": "<code>/srv</code>"
      }
     ],
     "explain": "Correct. /mnt is for temporary manual mounts."
    }
   ],
   "completion": "Mount a new volume and prove read-only protects it: done."
  },
  {
   "id": "16.4",
   "kind": "vm",
   "title": "Mount by label and UUID instead of device name",
   "navSubtitle": "blkid, LABEL=, UUID=",
   "objective": "104.3",
   "difficulty": "Beginner",
   "source": "Lab 4: Mount by label and UUID instead of device name",
   "workdir": "~/lpic1-section16",
   "summary": "",
   "scenario": "After a hardware change on db01, /dev/sdb and /dev/sdc swapped names and the wrong volume was mounted. The fix ticket says mounts must use stable identifiers.",
   "task": "Read the label and UUID of each volume, mount DATA by label, then mount it again by UUID.",
   "deliverable": "reports/ids.txt.",
   "steps": [
    {
     "cmd": "sudo blkid \"$DATA\" \"$ARCH\" > reports/ids.txt"
    },
    {
     "cmd": "lsblk -o NAME,FSTYPE,LABEL,UUID \"$DATA\" \"$ARCH\" >> reports/ids.txt"
    },
    {
     "cmd": "ls -l /dev/disk/by-label/ >> reports/ids.txt"
    },
    {
     "cmd": "sudo mount LABEL=DATA01 mnt/data"
    },
    {
     "cmd": "findmnt -no SOURCE,TARGET \"$PWD/mnt/data\" >> reports/ids.txt"
    },
    {
     "cmd": "sudo umount mnt/data"
    },
    {
     "cmd": "sudo mount UUID=$(sudo blkid -s UUID -o value \"$DATA\") mnt/data"
    },
    {
     "cmd": "ls mnt/data >> reports/ids.txt"
    },
    {
     "cmd": "sudo umount mnt/data"
    }
   ],
   "validation": "grep -c 'UUID' reports/ids.txt returns at least 2, and the file shows the loop device mounted on mnt/data followed by report.txt.",
   "trap": "Device names are assigned in detection order and can change between boots; labels and UUIDs travel with the filesystem. blkid run without sudo can show cached or missing values. Labels are easy to read but can be duplicated; UUIDs are unique.",
   "paste": {
    "command": "cat reports/ids.txt",
    "checks": [
     {
      "re": "UUID=\"[0-9a-f-]+\"",
      "say": "blkid shows a UUID for both volumes",
      "min": 2
     },
     {
      "re": "LABEL=\"DATA01\"",
      "say": "the DATA01 label is there"
     },
     {
      "re": "^/dev/loop\\d+\\s+\\S*/mnt/data\\s*$",
      "say": "the label mount shows the loop device on mnt/data"
     },
     {
      "re": "^report\\.txt\\s*$",
      "say": "report.txt is listed after the UUID mount"
     }
    ]
   },
   "quiz": [
    {
     "id": "stable",
     "prompt": "Why mount by UUID instead of <code>/dev/sdb1</code>?",
     "answer": "stable",
     "options": [
      {
       "value": "stable",
       "label": "Device names follow detection order and can change; the UUID stays with the filesystem"
      },
      {
       "value": "fast",
       "label": "UUID mounts are faster"
      },
      {
       "value": "ro",
       "label": "UUID mounts are read-only"
      }
     ],
     "explain": "Correct."
    }
   ],
   "completion": "Mount by label and UUID instead of device name: done."
  },
  {
   "id": "16.5",
   "kind": "vm",
   "title": "Add an fstab entry and test it on a copy",
   "navSubtitle": "fstab on a copy",
   "objective": "104.3",
   "difficulty": "Intermediate",
   "source": "Lab 5: Add an fstab entry and test it on a copy",
   "workdir": "~/lpic1-section16",
   "summary": "",
   "scenario": "A change request asks for the DATA volume to mount at boot with noatime, and for the ARCHIVE volume to be listed but mounted only on demand. Peer review requires a dry run before anyone touches the real /etc/fstab.",
   "task": "Copy /etc/fstab, add both entries to the copy, verify the syntax, do a fake mount of everything, then mount DATA using the copy.",
   "deliverable": "configs/fstab.test and reports/fstab-verify.txt.",
   "steps": [
    {
     "cmd": "cp /etc/fstab configs/fstab.test"
    },
    {
     "cmd": "echo \"UUID=$(sudo blkid -s UUID -o value \"$DATA\") $HOME/lpic1-section16/mnt/data ext4 defaults,noatime 0 2\" >> configs/fstab.test"
    },
    {
     "cmd": "echo \"LABEL=ARCHIVE $HOME/lpic1-section16/mnt/archive xfs defaults,noauto 0 0\" >> configs/fstab.test"
    },
    {
     "cmd": "sudo findmnt --verify --tab-file configs/fstab.test > reports/fstab-verify.txt 2>&1"
    },
    {
     "cmd": "sudo mount -a --fake --verbose -T configs/fstab.test >> reports/fstab-verify.txt 2>&1"
    },
    {
     "cmd": "sudo mount -T configs/fstab.test mnt/data"
    },
    {
     "cmd": "findmnt -no OPTIONS \"$PWD/mnt/data\" >> reports/fstab-verify.txt"
    }
   ],
   "validation": "tail -n 2 configs/fstab.test shows the two new lines with full paths, and tail -n 1 reports/fstab-verify.txt includes noatime. diff /etc/fstab configs/fstab.test shows only the two added lines, and grep -c lpic1 /etc/fstab returns 0, which proves the real file was not changed.",
   "trap": "The six fields are device, mount point, type, options, dump, and pass. Pass 1 is for the root filesystem, 2 for everything else that fsck should check, and 0 skips the check. fstab does not expand ~ or $HOME; the shell expanded them here because of echo. A bad line in the real file can drop the system into emergency mode at boot; nofail prevents that for non-critical disks.",
   "paste": {
    "command": "tail -n 2 configs/fstab.test; cat reports/fstab-verify.txt",
    "checks": [
     {
      "re": "^UUID=\\S+\\s+/\\S+/mnt/data\\s+ext4\\s+\\S*noatime\\S*\\s+0\\s+2\\s*$",
      "say": "the DATA line uses a UUID, a full path, noatime and pass 2"
     },
     {
      "re": "^LABEL=ARCHIVE\\s+/\\S+/mnt/archive\\s+xfs\\s+\\S*noauto",
      "say": "the ARCHIVE line uses its label and noauto"
     },
     {
      "re": "Success|0 errors",
      "say": "findmnt --verify found no errors"
     },
     {
      "re": "^rw,noatime",
      "say": "DATA mounted from the copy with noatime"
     }
    ]
   },
   "quiz": [
    {
     "id": "fields",
     "prompt": "What are the fifth and sixth fields of an fstab line?",
     "answer": "dp",
     "options": [
      {
       "value": "dp",
       "label": "dump, then fsck pass"
      },
      {
       "value": "pd",
       "label": "fsck pass, then dump"
      },
      {
       "value": "ou",
       "label": "options, then user"
      }
     ],
     "explain": "Correct. Don't Make The Old Dog Panic."
    },
    {
     "id": "nofail",
     "prompt": "Which option stops a missing non-critical disk from dropping the boot into emergency mode?",
     "answer": "nofail",
     "options": [
      "noauto",
      "nofail",
      "noatime",
      "defaults"
     ],
     "explain": "Correct. noauto skips it entirely; nofail tries it but doesn't stop the boot."
    }
   ],
   "completion": "Add an fstab entry and test it on a copy: done."
  },
  {
   "id": "16.6",
   "kind": "vm",
   "title": "Answer a disk-space alert with df",
   "navSubtitle": "df -h, -T",
   "objective": "104.2",
   "difficulty": "Intermediate",
   "source": "Lab 6: Answer a disk-space alert with df",
   "workdir": "~/lpic1-section16",
   "summary": "",
   "scenario": "Monitoring fired a warning for the reporting volume on web01. The on-call lead wants the size, used space, free space, and filesystem type in one report.",
   "task": "Write a large file to the DATA volume, then report its usage several ways.",
   "deliverable": "reports/df.txt.",
   "steps": [
    {
     "text": "dd if=/dev/zero of=mnt/data/backup.bin bs=1M count=150 status=none"
    },
    {
     "text": "df -h mnt/data > reports/df.txt"
    },
    {
     "text": "df -hT mnt/data >> reports/df.txt"
    },
    {
     "text": "df -h --output=source,fstype,size,used,avail,pcent,target mnt/data >> reports/df.txt"
    },
    {
     "text": "df -h >> reports/df.txt"
    }
   ],
   "validation": "cat reports/df.txt shows the loop device with Use% around 60 to 70 percent, and the -T output shows ext4.",
   "trap": "Size minus Used is larger than Avail on ext4 because 5 percent of blocks are reserved for root by default. df reports whole filesystems; give it a path and it reports the filesystem that holds that path. Without -h the numbers are in 1K blocks.",
   "paste": {
    "command": "cat reports/df.txt",
    "checks": [
     {
      "re": "Filesystem\\s+Size\\s+Used\\s+Avail\\s+Use%\\s+Mounted on",
      "say": "includes df -h output"
     },
     {
      "re": "^/dev/loop\\d+\\s+ext4\\s+\\S+\\s+\\S+\\s+\\S+\\s+\\d+%",
      "say": "df -T shows the type ext4"
     },
     {
      "re": "^/dev/loop\\d+\\s+(ext4\\s+)?\\S+\\s+\\S+\\s+\\S+\\s+([4-9]\\d|100)%\\s+\\S*/mnt/data",
      "say": "the volume is well filled after the 150 MB file"
     }
    ]
   },
   "quiz": [
    {
     "id": "reserved",
     "prompt": "On ext4, why is Size minus Used bigger than Avail?",
     "answer": "res",
     "options": [
      {
       "value": "res",
       "label": "About 5 percent of blocks are reserved for root"
      },
      {
       "value": "round",
       "label": "Rounding in -h"
      },
      {
       "value": "journal",
       "label": "Deleted files still count"
      }
     ],
     "explain": "Correct. tune2fs -m changes the reserve."
    }
   ],
   "completion": "Answer a disk-space alert with df: done."
  },
  {
   "id": "16.7",
   "kind": "vm",
   "title": "Find what is using the space with du",
   "navSubtitle": "du -sh, --max-depth",
   "objective": "104.2",
   "difficulty": "Intermediate",
   "source": "Lab 7: Find what is using the space with du",
   "workdir": "~/lpic1-section16",
   "summary": "",
   "scenario": "The space alert is real. The application owner asks which directories on the volume, and which directories under /var on the VM, are the largest.",
   "task": "Build a small directory tree, rank it with du, and then audit /var with sudo.",
   "deliverable": "reports/du.txt.",
   "steps": [
    {
     "cmd": "mkdir -p mnt/data/{logs,exports,tmp}"
    },
    {
     "text": "dd if=/dev/zero of=mnt/data/exports/q3.csv bs=1M count=20 status=none"
    },
    {
     "text": "dd if=/dev/zero of=mnt/data/logs/app.log bs=1M count=5 status=none"
    },
    {
     "text": "du -sh mnt/data/* | sort -h > reports/du.txt"
    },
    {
     "text": "du -s mnt/data >> reports/du.txt"
    },
    {
     "text": "du -s --inodes mnt/data >> reports/du.txt"
    },
    {
     "cmd": "sudo du -h --max-depth=1 /var 2>/dev/null | sort -h | tail -n 5 >> reports/du.txt"
    }
   ],
   "validation": "cat reports/du.txt: the sorted volume list ends with mnt/data/backup.bin as the largest entry, and the /var section ends with the /var total. A Permission denied message for lost+found on screen is expected, because that directory belongs to root.",
   "trap": "du -s gives one summary line per argument; without it du prints every subdirectory. Running du on system directories without sudo produces Permission denied errors and undercounts. If df shows a full disk but du cannot find the files, a process may still hold a deleted file open; sudo lsof +L1 lists them.",
   "paste": {
    "command": "cat reports/du.txt",
    "checks": [
     {
      "re": "mnt/data/exports\\s*$",
      "say": "the directory tree is in the list"
     },
     {
      "re": "mnt/data/backup\\.bin\\s*\\n\\s*\\d+\\s+mnt/data\\s*$",
      "say": "backup.bin is the last, largest entry in the sorted list"
     },
     {
      "re": "^\\d+\\s+mnt/data\\s*$",
      "say": "includes the du -s and du --inodes totals",
      "min": 2
     },
     {
      "re": "^[\\d.,]+[KMG]?\\s+/var\\s*$",
      "say": "the /var section ends with the /var total"
     }
    ]
   },
   "quiz": [
    {
     "id": "dfdu",
     "prompt": "What does <code>du</code> measure that <code>df</code> doesn't?",
     "answer": "dir",
     "options": [
      {
       "value": "dir",
       "label": "The space used by the files under a directory"
      },
      {
       "value": "fs",
       "label": "Free space on the whole filesystem"
      },
      {
       "value": "ino",
       "label": "Free inodes"
      }
     ],
     "explain": "Correct. df reports whole filesystems."
    },
    {
     "id": "lsof",
     "prompt": "df says the disk is full but du can't find the files. What should you check?",
     "answer": "lsof",
     "options": [
      {
       "value": "lsof",
       "label": "<code>sudo lsof +L1</code> for deleted files still held open"
      },
      {
       "value": "fsck",
       "label": "Run fsck on the mounted volume"
      },
      {
       "value": "tune",
       "label": "<code>tune2fs -m 0</code>"
      }
     ],
     "explain": "Correct. The space comes back when the process closes the file."
    }
   ],
   "completion": "Find what is using the space with du: done."
  },
  {
   "id": "16.8",
   "kind": "vm",
   "title": "Diagnose No space left on device when df says there is space",
   "navSubtitle": "df -i, inodes",
   "objective": "104.2",
   "difficulty": "Intermediate",
   "source": "Lab 8: Diagnose No space left on device when df says there is space",
   "workdir": "~/lpic1-section16",
   "summary": "",
   "scenario": "A queue application on app02 writes thousands of tiny message files. It now fails with No space left on device, but df -h shows the volume is almost empty.",
   "task": "Create a spool filesystem with very few inodes, fill its inodes, and prove the cause with df -i and tune2fs.",
   "deliverable": "reports/spool.txt and reports/spool-error.txt.",
   "steps": [
    {
     "cmd": "sudo mke2fs -t ext4 -q -N 512 -L SPOOL \"$SPOOL\""
    },
    {
     "cmd": "sudo mount \"$SPOOL\" mnt/spool"
    },
    {
     "cmd": "sudo chown \"$USER\": mnt/spool"
    },
    {
     "text": "touch mnt/spool/msg{1..1000} 2> reports/spool-error.txt"
    },
    {
     "text": "df -h mnt/spool > reports/spool.txt"
    },
    {
     "text": "df -i mnt/spool >> reports/spool.txt"
    },
    {
     "cmd": "sudo tune2fs -l \"$SPOOL\" | grep -E 'Inode count|Free inodes' >> reports/spool.txt"
    }
   ],
   "validation": "cat reports/spool.txt shows Use% of a few percent in the df -h line but IUse% of 100% in the df -i line, and head -n 1 reports/spool-error.txt shows No space left on device.",
   "trap": "Every file needs an inode, and on ext4 the inode count is fixed when the filesystem is made (mke2fs -N or -i). tune2fs cannot add inodes later; you must back up and recreate. XFS allocates inodes dynamically. Plan the inode count before formatting a volume for many small files.",
   "paste": {
    "command": "cat reports/spool.txt; head -n 3 reports/spool-error.txt",
    "checks": [
     {
      "re": "^/dev/loop\\d+\\s+\\S+\\s+\\S+\\s+\\S+\\s+\\d%\\s",
      "say": "df -h shows only a few percent of space used"
     },
     {
      "re": "^/dev/loop\\d+\\s+\\d+\\s+\\d+\\s+0\\s+100%",
      "say": "df -i shows IUse% at 100%"
     },
     {
      "re": "Free inodes:\\s+0\\s*$",
      "say": "tune2fs shows no free inodes"
     },
     {
      "re": "No space left on device",
      "say": "touch failed with No space left on device"
     }
    ]
   },
   "quiz": [
    {
     "id": "addino",
     "prompt": "An ext4 volume ran out of inodes. How do you get more?",
     "answer": "remake",
     "options": [
      {
       "value": "remake",
       "label": "Back up, then recreate it with mke2fs -N or -i"
      },
      {
       "value": "tune",
       "label": "<code>tune2fs -N</code>"
      },
      {
       "value": "fsck",
       "label": "<code>e2fsck -f</code>"
      }
     ],
     "explain": "Correct. ext4 fixes the inode count at mkfs time."
    }
   ],
   "completion": "Diagnose No space left on device when df says there is space: done."
  },
  {
   "id": "16.9",
   "kind": "vm",
   "title": "Unmount a volume that reports target is busy",
   "navSubtitle": "target is busy, fuser",
   "objective": "104.3",
   "difficulty": "Intermediate",
   "source": "Lab 9: Unmount a volume that reports target is busy",
   "workdir": "~/lpic1-section16",
   "summary": "",
   "scenario": "A maintenance window on db01 needs the DATA volume unmounted, but umount refuses. You must find out who is using it without killing anything.",
   "task": "Open a second terminal inside the mount point, try to unmount, identify the process, then release it and unmount cleanly.",
   "deliverable": "reports/busy.txt.",
   "steps": [
    {
     "text": "In a second terminal: cd ~/lpic1-section16/mnt/data"
    },
    {
     "text": "Back in the first terminal: sudo umount mnt/data 2> reports/busy.txt"
    },
    {
     "cmd": "sudo fuser -vm mnt/data >> reports/busy.txt 2>&1"
    },
    {
     "text": "In the second terminal: cd ~"
    },
    {
     "text": "In the first terminal: sudo umount mnt/data && echo 'unmounted cleanly' >> reports/busy.txt"
    }
   ],
   "validation": "cat reports/busy.txt shows target is busy, a bash process in the fuser list, and unmounted cleanly on the last line. findmnt \"$PWD/mnt/data\" prints nothing.",
   "trap": "A shell whose current directory is inside the mount point counts as using it. fuser -k kills the processes it finds, so never add -k on a production server without approval. umount -l (lazy) hides the problem by detaching now and cleaning up later.",
   "paste": {
    "command": "cat reports/busy.txt",
    "checks": [
     {
      "re": "target is busy",
      "say": "umount refused with target is busy"
     },
     {
      "re": "\\d+\\s+\\S*c\\S*\\s+bash\\s*$",
      "say": "fuser lists the bash shell sitting in the mount point"
     },
     {
      "re": "^unmounted cleanly\\s*$",
      "say": "the last unmount worked"
     }
    ]
   },
   "quiz": [
    {
     "id": "fuserk",
     "prompt": "What does <code>fuser -k</code> add?",
     "answer": "kill",
     "options": [
      {
       "value": "kill",
       "label": "It kills the processes it finds"
      },
      {
       "value": "keep",
       "label": "It keeps the mount busy"
      },
      {
       "value": "verbose",
       "label": "It shows more detail"
      }
     ],
     "explain": "Correct. Never use it on a production server without approval."
    },
    {
     "id": "cflag",
     "prompt": "In <code>fuser -v</code> output, what does the <code>c</code> access flag mean?",
     "answer": "cwd",
     "options": [
      {
       "value": "cwd",
       "label": "The process's current directory is there"
      },
      {
       "value": "child",
       "label": "It's a child process"
      },
      {
       "value": "closed",
       "label": "The file is closed"
      }
     ],
     "explain": "Correct."
    }
   ],
   "completion": "Unmount a volume that reports target is busy: done."
  },
  {
   "id": "16.10",
   "kind": "vm",
   "title": "Audit and tune ext4 parameters to the naming standard",
   "navSubtitle": "tune2fs, dumpe2fs",
   "objective": "104.2",
   "difficulty": "Advanced",
   "source": "Lab 10: Audit and tune ext4 parameters to the naming standard",
   "workdir": "~/lpic1-section16",
   "summary": "",
   "scenario": "An audit of web01 asks for each data volume's health parameters, and the naming standard says the label must include the host name. The team also wants a forced check every 20 mounts or every month, and only 1 percent of blocks reserved.",
   "task": "Record the current parameters and backup superblock locations, then change the label, check schedule, and reserved blocks.",
   "deliverable": "reports/tune2fs.txt and reports/superblocks.txt.",
   "steps": [
    {
     "cmd": "sudo tune2fs -l \"$DATA\" | grep -E 'volume name|UUID|state|Mount count|Maximum mount count|Check interval|Reserved block count|Free inodes' > reports/tune2fs.txt"
    },
    {
     "cmd": "sudo dumpe2fs \"$DATA\" 2>/dev/null | grep -i 'superblock at' > reports/superblocks.txt"
    },
    {
     "cmd": "sudo tune2fs -L DATA-WEB01 \"$DATA\""
    },
    {
     "cmd": "sudo tune2fs -c 20 -i 1m \"$DATA\""
    },
    {
     "cmd": "sudo tune2fs -m 1 \"$DATA\""
    },
    {
     "cmd": "sudo e2label \"$DATA\" >> reports/tune2fs.txt"
    },
    {
     "cmd": "sudo tune2fs -l \"$DATA\" | grep -E 'Maximum mount count|Check interval|Reserved block count' >> reports/tune2fs.txt"
    }
   ],
   "validation": "grep -E 'DATA-WEB01|Maximum mount count' reports/tune2fs.txt shows the new label and a maximum mount count of 20. reports/superblocks.txt lists the primary superblock and at least one backup.",
   "trap": "mke2fs creates a filesystem and erases what was there; tune2fs changes an existing one. Set the right values at mkfs time when you can. tune2fs -C sets the current mount count, -c the maximum, and -i the time interval. Changing the UUID with -U should be done on an unmounted, freshly checked filesystem.",
   "paste": {
    "command": "cat reports/tune2fs.txt reports/superblocks.txt",
    "checks": [
     {
      "re": "DATA-WEB01",
      "say": "the new label DATA-WEB01 is there"
     },
     {
      "re": "Maximum mount count:\\s+20\\s*$",
      "say": "the maximum mount count is now 20"
     },
     {
      "re": "Primary superblock at \\d+",
      "say": "superblocks.txt shows the primary superblock"
     },
     {
      "re": "Backup superblock at \\d+",
      "say": "superblocks.txt shows at least one backup"
     }
    ]
   },
   "quiz": [
    {
     "id": "cflags",
     "prompt": "Which <code>tune2fs</code> option sets the maximum mount count?",
     "answer": "c",
     "options": [
      {
       "value": "c",
       "label": "<code>-c</code>"
      },
      {
       "value": "C",
       "label": "<code>-C</code>"
      },
      {
       "value": "i",
       "label": "<code>-i</code>"
      },
      {
       "value": "m",
       "label": "<code>-m</code>"
      }
     ],
     "explain": "Correct. -C sets the current count, -i the time interval, -m the reserved percent."
    },
    {
     "id": "mke2fs",
     "prompt": "What's the difference between mke2fs and tune2fs?",
     "answer": "make",
     "options": [
      {
       "value": "make",
       "label": "mke2fs creates (and erases); tune2fs changes an existing filesystem"
      },
      {
       "value": "same",
       "label": "They're the same program"
      },
      {
       "value": "xfs",
       "label": "tune2fs is for XFS"
      }
     ],
     "explain": "Correct."
    }
   ],
   "completion": "Audit and tune ext4 parameters to the naming standard: done."
  },
  {
   "id": "16.11",
   "kind": "vm",
   "title": "Check a filesystem after an unclean shutdown",
   "navSubtitle": "fsck -N, e2fsck, exit codes",
   "objective": "104.2",
   "difficulty": "Advanced",
   "source": "Lab 11: Check a filesystem after an unclean shutdown",
   "workdir": "~/lpic1-section16",
   "summary": "",
   "scenario": "web01 lost power during a write. Before the reporting volume goes back into service, the incident ticket requires a full filesystem check with the result code recorded.",
   "task": "Confirm the volume is unmounted, preview what fsck would run, do a read-only check, force a check by mount count, and record the exit codes.",
   "deliverable": "reports/fsck.txt.",
   "steps": [
    {
     "cmd": "findmnt \"$PWD/mnt/data\" || echo 'DATA is not mounted, safe to check' > reports/fsck.txt"
    },
    {
     "cmd": "sudo fsck -N \"$DATA\" >> reports/fsck.txt"
    },
    {
     "cmd": "sudo e2fsck -f -n \"$DATA\" >> reports/fsck.txt 2>&1; echo \"read-only check exit=$?\" >> reports/fsck.txt"
    },
    {
     "cmd": "sudo tune2fs -C 25 \"$DATA\""
    },
    {
     "cmd": "sudo e2fsck -p \"$DATA\" >> reports/fsck.txt 2>&1; echo \"preen exit=$?\" >> reports/fsck.txt"
    },
    {
     "cmd": "ls -li /sbin/e2fsck /sbin/fsck.ext* >> reports/fsck.txt"
    }
   ],
   "validation": "grep exit= reports/fsck.txt shows exit=0 for both checks, and the preen output says the filesystem has been mounted 25 times without being checked, so the check was forced. The ls output shows fsck.ext2, fsck.ext3, and fsck.ext4 share e2fsck's inode number (hard links) or point to it.",
   "trap": "Never run fsck on a mounted filesystem. fsck is a front end that runs fsck.TYPE; -N shows what it would run. e2fsck -n answers no to everything, -y answers yes, -p fixes safe problems automatically, and -f checks even a clean filesystem. Exit code 0 means no errors, 1 means errors were corrected, and 4 means errors were left uncorrected. fsck -A checks everything in fstab in pass order.",
   "paste": {
    "command": "cat reports/fsck.txt",
    "checks": [
     {
      "re": "^(read-only check|preen) exit=0\\s*$",
      "say": "both checks ended with exit=0",
      "count": 2
     },
     {
      "re": "mounted 25 times without being checked",
      "say": "the mount count forced the preen check"
     },
     {
      "re": "^\\s*\\d+\\s+[-l]r\\S*\\s+\\d+\\s+root\\s+root\\s.*fsck\\.ext4",
      "say": "ls -li shows fsck.ext4"
     }
    ]
   },
   "quiz": [
    {
     "id": "exit1",
     "prompt": "What does exit code 1 from e2fsck mean?",
     "answer": "fixed",
     "options": [
      {
       "value": "fixed",
       "label": "Errors were found and corrected"
      },
      {
       "value": "none",
       "label": "No errors"
      },
      {
       "value": "left",
       "label": "Errors were left uncorrected"
      }
     ],
     "explain": "Correct. 0 is clean and 4 means errors were left."
    },
    {
     "id": "nflag",
     "prompt": "Which e2fsck option checks without changing anything?",
     "answer": "n",
     "options": [
      {
       "value": "n",
       "label": "<code>-n</code>"
      },
      {
       "value": "p",
       "label": "<code>-p</code>"
      },
      {
       "value": "y",
       "label": "<code>-y</code>"
      },
      {
       "value": "f",
       "label": "<code>-f</code>"
      }
     ],
     "explain": "Correct. It answers no to every question."
    }
   ],
   "completion": "Check a filesystem after an unclean shutdown: done."
  },
  {
   "id": "16.12",
   "kind": "vm",
   "title": "Recover a volume with a damaged superblock",
   "navSubtitle": "e2fsck -b",
   "objective": "104.2",
   "difficulty": "Advanced",
   "source": "Lab 12: Recover a volume with a damaged superblock",
   "workdir": "~/lpic1-section16",
   "summary": "",
   "scenario": "After a bad firmware update on a storage shelf, the reporting volume refuses to mount with a bad superblock error. You recorded the backup superblock locations during the audit in Lab 10.",
   "task": "Detach the image, damage its primary superblock in the image file, reattach it, confirm the mount fails, and repair it from a backup superblock.",
   "deliverable": "reports/superblock-recovery.txt.",
   "steps": [
    {
     "cmd": "sudo losetup -d \"$DATA\""
    },
    {
     "text": "dd if=/dev/zero of=images/data.img bs=1024 seek=1 count=1 conv=notrunc status=none"
    },
    {
     "text": "export DATA=$(sudo losetup -fP --show images/data.img)"
    },
    {
     "cmd": "sudo mount \"$DATA\" mnt/data 2> reports/superblock-recovery.txt"
    },
    {
     "cmd": "cat reports/superblocks.txt and note the first Backup superblock number."
    },
    {
     "cmd": "sudo e2fsck -f -y -b NUMBER \"$DATA\" >> reports/superblock-recovery.txt 2>&1; echo \"repair exit=$?\" >> reports/superblock-recovery.txt (replace NUMBER with the backup number)"
    },
    {
     "cmd": "sudo mount \"$DATA\" mnt/data && ls mnt/data >> reports/superblock-recovery.txt"
    }
   ],
   "validation": "cat reports/superblock-recovery.txt shows the bad superblock mount error, a repair exit code of 1 (errors corrected), and the listing of report.txt, backup.bin, and the other files from earlier labs.",
   "trap": "The dd command writes only to the image file in your practice folder, after the loop device is detached. Never aim dd at a real disk. The primary ext4 superblock starts 1024 bytes into the filesystem; backups sit at the start of later block groups. e2fsck often finds a backup on its own, but -b lets you choose one. Note the backup locations with dumpe2fs before you need them.",
   "paste": {
    "command": "cat reports/superblock-recovery.txt",
    "checks": [
     {
      "re": "bad superblock",
      "say": "the mount failed with a bad superblock error"
     },
     {
      "re": "repair exit=[01]\\s*$",
      "say": "e2fsck finished without serious errors (exit 0 or 1)"
     },
     {
      "re": "^report\\.txt\\s*$",
      "say": "report.txt survived"
     },
     {
      "re": "^backup\\.bin\\s*$",
      "say": "backup.bin survived"
     }
    ]
   },
   "quiz": [
    {
     "id": "backup",
     "prompt": "Which e2fsck option repairs from a backup superblock you choose?",
     "answer": "b",
     "options": [
      {
       "value": "b",
       "label": "<code>-b</code>"
      },
      {
       "value": "s",
       "label": "<code>-s</code>"
      },
      {
       "value": "f",
       "label": "<code>-f</code>"
      }
     ],
     "explain": "Correct. dumpe2fs lists the backup locations."
    }
   ],
   "completion": "Recover a volume with a damaged superblock: done."
  },
  {
   "id": "16.13",
   "kind": "vm",
   "title": "Check, relabel, and defragment an XFS archive volume",
   "navSubtitle": "xfs_repair, xfs_db, xfs_admin",
   "objective": "104.2",
   "difficulty": "Advanced",
   "source": "Lab 13: Check, relabel, and defragment an XFS archive volume",
   "workdir": "~/lpic1-section16",
   "summary": "",
   "scenario": "The archive server db01 uses XFS. A ticket asks for a non-destructive health check, a label that matches the naming standard, and a defragmentation pass.",
   "task": "Read the XFS label and UUID, run a no-modify check, read the superblock with xfs_db, relabel the volume, mount it, and run xfs_fsr.",
   "deliverable": "reports/xfs.txt.",
   "steps": [
    {
     "cmd": "sudo xfs_admin -l -u \"$ARCH\" > reports/xfs.txt"
    },
    {
     "cmd": "sudo xfs_repair -n \"$ARCH\" >> reports/xfs.txt 2>&1; echo \"xfs_repair exit=$?\" >> reports/xfs.txt"
    },
    {
     "cmd": "sudo xfs_db -r -c 'sb 0' -c 'p agcount' \"$ARCH\" >> reports/xfs.txt"
    },
    {
     "cmd": "sudo xfs_admin -L ARCH-DB01 \"$ARCH\" >> reports/xfs.txt"
    },
    {
     "cmd": "sudo mount \"$ARCH\" mnt/archive"
    },
    {
     "cmd": "sudo xfs_info mnt/archive >> reports/xfs.txt"
    },
    {
     "cmd": "sudo xfs_fsr -v mnt/archive >> reports/xfs.txt 2>&1"
    },
    {
     "cmd": "sudo xfs_repair -n \"$ARCH\" >> reports/xfs.txt 2>&1"
    }
   ],
   "validation": "grep -E 'exit=0|ARCH-DB01|agcount' reports/xfs.txt shows a clean check, the new label, and the allocation group count. The last lines show xfs_repair refusing to run because the filesystem is mounted.",
   "trap": "XFS has its own tools: xfs_repair (repair, -n for no-modify), xfs_db (debug, -r for read-only), xfs_admin (label and UUID, unmounted), xfs_info (geometry), and xfs_fsr (defragment, mounted). fsck.xfs does nothing on purpose. xfs_repair -L zeroes the log and can lose recent changes; use it only as a last resort.",
   "paste": {
    "command": "cat reports/xfs.txt",
    "checks": [
     {
      "re": "xfs_repair exit=0",
      "say": "the no-modify check was clean"
     },
     {
      "re": "ARCH-DB01",
      "say": "the new label ARCH-DB01 is there"
     },
     {
      "re": "agcount\\s*=\\s*\\d+",
      "say": "the allocation group count is shown"
     },
     {
      "re": "contains a mounted",
      "say": "xfs_repair refused to run on the mounted filesystem"
     }
    ]
   },
   "quiz": [
    {
     "id": "fsckxfs",
     "prompt": "What does <code>fsck.xfs</code> do?",
     "answer": "nothing",
     "options": [
      {
       "value": "nothing",
       "label": "Nothing; it's a placeholder. Use xfs_repair"
      },
      {
       "value": "repair",
       "label": "Repairs XFS"
      },
      {
       "value": "check",
       "label": "A read-only check"
      }
     ],
     "explain": "Correct."
    },
    {
     "id": "defrag",
     "prompt": "Which XFS tool defragments a mounted filesystem?",
     "answer": "fsr",
     "options": [
      {
       "value": "fsr",
       "label": "<code>xfs_fsr</code>"
      },
      {
       "value": "admin",
       "label": "<code>xfs_admin</code>"
      },
      {
       "value": "db",
       "label": "<code>xfs_db</code>"
      }
     ],
     "explain": "Correct."
    }
   ],
   "completion": "Check, relabel, and defragment an XFS archive volume: done."
  },
  {
   "id": "16.14",
   "kind": "vm",
   "title": "Decommission the test volumes",
   "navSubtitle": "umount, losetup -d",
   "objective": "104.3",
   "difficulty": "Advanced",
   "source": "Lab 14: Decommission the test volumes",
   "workdir": "~/lpic1-section16",
   "summary": "",
   "scenario": "The storage test is finished. The change record says to unmount every test volume, detach the loop devices, and prove nothing is left behind.",
   "task": "Unmount all three volumes, detach the loop devices, and record proof.",
   "deliverable": "reports/cleanup.txt.",
   "steps": [
    {
     "cmd": "sudo umount mnt/data mnt/archive mnt/spool"
    },
    {
     "cmd": "sudo losetup -d \"$DATA\" \"$ARCH\" \"$SPOOL\""
    },
    {
     "cmd": "losetup -a > reports/cleanup.txt"
    },
    {
     "cmd": "findmnt | grep lpic1-section16 >> reports/cleanup.txt"
    },
    {
     "text": "To free the space, you can later run rm images/*.img. To practice again, rerun Lab Setup Steps 3 to 5."
    }
   ],
   "validation": "grep -c lpic1-section16 reports/cleanup.txt returns 0.",
   "trap": "losetup -d fails with a busy error if the loop device is still mounted, so unmount first. umount accepts either the mount point or the device. A loop attachment disappears at reboot, but a loop entry in /etc/fstab (with the loop option) would bring it back.",
   "paste": {
    "command": "cat reports/cleanup.txt; echo \"lab lines: $(grep -c lpic1-section16 reports/cleanup.txt)\"",
    "checks": [
     {
      "re": "lpic1-section16/(images|mnt)",
      "say": "no lab image or mount is left",
      "absent": true
     },
     {
      "re": "^lab lines: 0\\s*$",
      "say": "grep -c counted 0 lab lines"
     }
    ]
   },
   "quiz": [
    {
     "id": "order",
     "prompt": "<code>losetup -d</code> says the device is busy. Why?",
     "answer": "mounted",
     "options": [
      {
       "value": "mounted",
       "label": "It's still mounted; unmount first"
      },
      {
       "value": "sudo",
       "label": "It needs -f"
      },
      {
       "value": "fstab",
       "label": "It's listed in fstab"
      }
     ],
     "explain": "Correct."
    }
   ],
   "completion": "Decommission the test volumes: done."
  }
 ],
 "review": {
  "traps": [
   "Spelling umount as unmount. There is no n after the u.",
   "Running fsck, e2fsck, or xfs_repair on a mounted filesystem. Unmount first, or check the root filesystem at boot or from rescue media.",
   "Mixing up the last two fstab fields. The fifth is dump (0 or 1), the sixth is the fsck pass: 1 for /, 2 for other filesystems, 0 to skip.",
   "Thinking tune2fs can add inodes. The ext4 inode count is fixed by mke2fs -N or -i; only XFS and Btrfs allocate inodes dynamically.",
   "Confusing df and du. df reports whole filesystems from their metadata; du adds up the files under a directory. df -i reports inodes.",
   "Forgetting that df and du can disagree when a deleted file is still held open by a process. lsof +L1 finds it.",
   "Mixing up mke2fs and tune2fs. mke2fs creates and erases; tune2fs changes an existing filesystem. mkfs.ext4 is the same program as mke2fs -t ext4.",
   "Forgetting the e2fsck answers: -n answers no and changes nothing, -y answers yes, -p preens automatically, -f forces a check of a clean filesystem, and -b uses a backup superblock.",
   "Expecting fsck.xfs to repair XFS. It is a placeholder; use xfs_repair, and -n for a read-only check. xfs_check is obsolete.",
   "Mixing up the XFS tools: xfs_admin changes label and UUID, xfs_info shows geometry, xfs_db inspects, and xfs_fsr defragments a mounted filesystem.",
   "Knowing Btrfs only by name. btrfs check (or the older btrfsck) checks it, btrfstune changes parameters, and btrfs balance rebalances data across devices.",
   "Using device names in fstab on systems with several disks. UUID= and LABEL= survive device renaming; blkid and lsblk -f show them.",
   "Forgetting that systemd generates .mount units from /etc/fstab, and that a hand-written unit's file name must match its path (/srv/data is srv-data.mount).",
   "Mixing up /mnt and /media. /mnt is for temporary manual mounts; /media (and /run/media on some distributions) is for removable media mounted automatically."
  ],
  "trapQuiz": [
   {
    "id": "tq1",
    "prompt": "When is it safe to run <code>e2fsck</code> on a filesystem?",
    "answer": "unmounted",
    "options": [
     {
      "value": "unmounted",
      "label": "When it's unmounted"
     },
     {
      "value": "ro",
      "label": "Any time, with -y"
     },
     {
      "value": "busy",
      "label": "When nobody is logged in"
     }
    ],
    "explain": "Correct. Root is checked at boot or from rescue media."
   },
   {
    "id": "tq2",
    "prompt": "What is the sixth field in an fstab line?",
    "answer": "pass",
    "options": [
     {
      "value": "pass",
      "label": "The fsck pass: 1 for /, 2 for others, 0 to skip"
     },
     {
      "value": "dump",
      "label": "The dump flag"
     },
     {
      "value": "opts",
      "label": "The mount options"
     }
    ],
    "explain": "Correct."
   },
   {
    "id": "tq3",
    "prompt": "Can <code>tune2fs</code> add inodes to an ext4 filesystem?",
    "answer": "no",
    "options": [
     {
      "value": "no",
      "label": "No. Set them with mke2fs -N or -i"
     },
     {
      "value": "yes",
      "label": "Yes, with -N"
     },
     {
      "value": "online",
      "label": "Only while mounted"
     }
    ],
    "explain": "Correct. XFS and Btrfs allocate inodes as needed."
   },
   {
    "id": "tq4",
    "prompt": "Which command shows inode use per filesystem?",
    "answer": "dfi",
    "options": [
     {
      "value": "dfi",
      "label": "<code>df -i</code>"
     },
     {
      "value": "dui",
      "label": "<code>du -i</code>"
     },
     {
      "value": "lsi",
      "label": "<code>ls -i</code>"
     }
    ],
    "explain": "Correct."
   },
   {
    "id": "tq5",
    "prompt": "Which e2fsck option forces a check of a filesystem marked clean?",
    "answer": "-f",
    "options": [
     "-f",
     "-n",
     "-p",
     "-y"
    ],
    "explain": "Correct."
   },
   {
    "id": "tq6",
    "prompt": "What should you use to check an XFS filesystem without changing it?",
    "answer": "repairn",
    "options": [
     {
      "value": "repairn",
      "label": "<code>xfs_repair -n</code>"
     },
     {
      "value": "fsck",
      "label": "<code>fsck.xfs</code>"
     },
     {
      "value": "check",
      "label": "<code>xfs_check</code>"
     }
    ],
    "explain": "Correct. fsck.xfs is a placeholder and xfs_check is obsolete."
   },
   {
    "id": "tq7",
    "prompt": "Which XFS tool changes the label?",
    "answer": "admin",
    "options": [
     {
      "value": "admin",
      "label": "<code>xfs_admin</code>"
     },
     {
      "value": "info",
      "label": "<code>xfs_info</code>"
     },
     {
      "value": "fsr",
      "label": "<code>xfs_fsr</code>"
     }
    ],
    "explain": "Correct. Run it on the unmounted filesystem."
   },
   {
    "id": "tq8",
    "prompt": "What is <code>/mnt</code> for?",
    "answer": "temp",
    "options": [
     {
      "value": "temp",
      "label": "Temporary manual mounts"
     },
     {
      "value": "removable",
      "label": "Removable media mounted automatically"
     },
     {
      "value": "boot",
      "label": "Filesystems needed at boot"
     }
    ],
    "explain": "Correct. Removable media goes under /media."
   }
  ],
  "challenge": {
   "intro": "Complete these tasks without notes, using only your Linux Mint VM and ~/lpic1-section16. Rerun Lab Setup Steps 3 to 5 first so you start from fresh, empty volumes, and never point a command at the VM's real disk.",
   "tasks": [
    "Prove which filesystem types the DATA and ARCH volumes use and record their UUIDs in reports/challenge-ids.txt.",
    "Mount DATA by its label, write a file to it, remount it read-only, and prove a second write fails.",
    "Add a UUID-based entry for DATA with the noatime and nofail options to a copy of /etc/fstab, and verify the copy with findmnt --verify.",
    "Fill DATA with a 100 MB file and report its usage in human-readable form with the filesystem type shown.",
    "Make a spool filesystem with 256 inodes, fill its inodes, and save the df -i output that explains the failure.",
    "Unmount DATA while a shell is sitting inside it, identifying the blocking process first.",
    "Set DATA's label to DATA-APP02 and a maximum mount count of 30, then run a forced read-only check and record the exit code.",
    "Run a no-modify check on ARCH, mount it, defragment it, and then detach every loop device."
   ],
   "outro": "Your final handoff is the reports directory and the fstab copy. For each file, write one sentence saying what it proves, and confirm that /etc/fstab is unchanged."
  },
  "questions": [
   {
    "q": "Change manager request: “Add the new data volume to fstab so it survives a reboot, but prove the entry works before you touch the real file.”",
    "a": "<code>cp /etc/fstab configs/fstab.test</code>, add <code>UUID=… /mount/point ext4 defaults,nofail 0 2</code> to the copy, then test it with <code>sudo findmnt --verify --tab-file configs/fstab.test</code> and <code>sudo mount -a --fake --verbose -T configs/fstab.test</code>. Only then add the same line to /etc/fstab."
   },
   {
    "q": "Storage team request: “Device names moved after the last hardware change. Mount the reporting volume by something that will not change.”",
    "a": "Read the label and UUID with <code>sudo blkid</code> or <code>lsblk -f</code>, then <code>sudo mount UUID=… /mount/point</code> (or <code>LABEL=…</code>), and use the same <code>UUID=</code> form in fstab."
   },
   {
    "q": "On-call request: “The queue server says the disk is full, but df -h says it is nearly empty. Find out why.”",
    "a": "The inodes are used up. <code>df -i</code> shows IUse% at 100%, and <code>tune2fs -l</code> shows Free inodes: 0. ext4 can't add inodes, so back up the data and recreate it with more inodes (<code>mke2fs -N</code> or a smaller <code>-i</code>), or use XFS."
   },
   {
    "q": "Application owner request: “Tell me which directories on the volume are using the most space.”",
    "a": "<code>du -sh /mount/point/* | sort -h</code> ranks the top-level entries, and <code>sudo du -h --max-depth=1 /mount/point | sort -h</code> gives one total per directory. Use sudo so nothing is skipped with Permission denied."
   },
   {
    "q": "Incident bridge request: “The volume lost power mid-write. Check it before we put it back into service, and give me the exit code.”",
    "a": "Unmount it first, then run <code>sudo e2fsck -f DEVICE</code> (or <code>fsck</code>) and <code>echo $?</code>. 0 means no errors, 1 means errors were corrected, and 4 means errors were left uncorrected."
   },
   {
    "q": "Maintenance window request: “umount says target is busy. Find out who is holding it, but do not kill anything.”",
    "a": "<code>sudo fuser -vm /mount/point</code> (or <code>sudo lsof /mount/point</code>) lists the processes and users. Ask the owner to close the program or <code>cd</code> out, then unmount. Don't use <code>fuser -k</code> or <code>umount -l</code>."
   },
   {
    "q": "Archive team request: “Run a health check on the XFS archive volume without changing anything on it.”",
    "a": "With the volume unmounted, <code>sudo xfs_repair -n DEVICE</code>. Exit 0 means clean and 1 means it found corruption. <code>sudo xfs_db -r</code> can read the superblock without changing anything."
   }
  ],
  "mastery": [
   "I can explain which directories are good candidates for separate filesystems and which must stay on the root filesystem.",
   "I can attach a disk image with losetup and detach it again.",
   "I can mount a filesystem by device, label, and UUID, remount it read-only or read-write, and unmount it.",
   "I can find the label and UUID of a filesystem with blkid and lsblk -f.",
   "I can name the six /etc/fstab fields and explain the dump and pass values.",
   "I can test an fstab entry on a copy with findmnt --verify and mount --fake.",
   "I can explain how systemd turns /etc/fstab entries into .mount units and where custom units live.",
   "I can report filesystem space and inode use with df -h, df -T, and df -i, and directory use with du -sh.",
   "I can diagnose inode exhaustion and set the inode count with mke2fs -N.",
   "I can find the process blocking an unmount with fuser.",
   "I can view and change ext4 parameters with tune2fs, e2label, and dumpe2fs.",
   "I can check and repair unmounted ext4 and XFS filesystems with fsck, e2fsck, xfs_repair, and xfs_db, and explain the exit codes."
  ]
 }
});
