/* Section 14: Hardware, Devices and Kernel Modules. Generated from LPIC_Section14_Lab_Workbook.docx by vm_section.py;
   paste checks, quizzes and model answers were added for the app. */
LPIC.section({
 "id": "section-14",
 "number": 14,
 "title": "Hardware, Devices and Kernel Modules",
 "objectives": [
  "101.1"
 ],
 "kind": "vm",
 "source": "LPIC_Section14_Lab_Workbook.docx",
 "scenario": "Objective 101.1: Determine and configure hardware settings. Inspect device files, /proc and /sys, PCI and USB devices, kernel modules, kernel messages, udev and hotplug events.",
 "overview": {
  "paragraphs": [
   "Treat each lab like a hardware ticket: a driver question, a missing device, or a vendor asking for details. Read the scenario, gather the evidence with the right tool, save it under reports/, and explain in a sentence what it shows.",
   "Kernel modules can be removed and inserted on a live system, but doing that to a module your VM is using can freeze the display, the network or the disk. In this workbook you inspect modules with lsmod and modinfo, and see what modprobe would do with its --show-depends option, which loads nothing. The commands that really load or remove modules (insmod, rmmod, modprobe and modprobe -r) are described so you can answer exam questions about them. Don't run them on your VM.",
   "Your Linux Mint VM may name its main disk sda, vda or nvme0n1. Lab Setup stores the real name in the DISK variable. Mint restricts dmesg to administrators, so the kernel message lab uses sudo."
  ],
  "setup": [
   {
    "text": "Step 1: Make sure the hardware listing tools are installed. Most Mint installs already have them, and apt will just report that they are the newest version:"
   },
   {
    "cmd": "sudo apt install pciutils usbutils bc"
   },
   {
    "text": "Step 2: Create the practice workspace:"
   },
   {
    "cmd": "mkdir -p ~/lpic1-section14/{reports,images,configs}"
   },
   {
    "cmd": "cd ~/lpic1-section14"
   },
   {
    "text": "Step 3: Record the name of your VM's main disk. Rerun this line whenever you open a new terminal:"
   },
   {
    "cmd": "DISK=$(lsblk -dno NAME,TYPE | awk '$2==\"disk\"{print $1; exit}'); echo $DISK"
   },
   {
    "text": "Step 4: Create a sample module policy file to review and a small image file to use as a hotplug device in Lab 13:"
   },
   {
    "cmd": "printf '# Requested by the desktop security team for kiosk01\\nblacklist pcspkr\\ninstall usb-storage /bin/true\\noptions loop max_loop=16\\nalias net-pf-31 off\\n' > configs/kiosk-modprobe.conf"
   },
   {
    "cmd": "truncate -s 128M images/hotplug.img"
   },
   {
    "text": "Validation check: Run ls -lR and confirm configs/kiosk-modprobe.conf and images/hotplug.img exist. Run echo $DISK and confirm it prints a name such as sda, vda or nvme0n1."
   }
  ],
  "commands": [
   "ls -l /dev",
   "block (b) and character (c) devices",
   "major and minor numbers",
   "lsblk -o NAME",
   "MAJ:MIN",
   "/proc/devices",
   "/proc/meminfo",
   "/proc/cpuinfo",
   "/proc/modules",
   "/sys/block",
   "lspci",
   "lspci -t",
   "lspci -v",
   "lspci -vv",
   "lspci -vvv",
   "lspci -k",
   "lsusb",
   "lsusb -t",
   "lsusb -v",
   "lsmod",
   "modinfo",
   "modinfo -F",
   "modprobe",
   "modprobe -r",
   "modprobe -v",
   "modprobe --show-depends",
   "insmod",
   "rmmod",
   "depmod",
   "/lib/modules/$(uname -r)",
   "modules.dep",
   "/etc/modprobe.d",
   "blacklist",
   "dmesg",
   "dmesg -T",
   "journalctl -k",
   "udevadm info",
   "udevadm monitor",
   "/etc/udev/rules.d",
   "/lib/udev/rules.d",
   "/dev/disk/by-path",
   "/dev/disk/by-id",
   "/media and D-Bus"
  ],
  "memoryHook": "Follow the chain from hardware to you. The hardware sits on a bus, which lspci and lsusb show. The kernel talks to it through a driver module, which lsmod, modinfo and modprobe manage. The kernel announces what it found in dmesg and publishes the details in /sys. udev reads those details and creates the device file in /dev, and you and your programs only ever talk to that file. When something is missing, walk the chain in that order: bus, module, kernel message, /sys, /dev.",
  "reference": []
 },
 "lessons": [
  {
   "id": "14.1",
   "kind": "vm",
   "title": "Tell block devices from character devices",
   "navSubtitle": "ls -l, b and c",
   "objective": "101.1",
   "difficulty": "Beginner",
   "source": "Lab 1: Tell block devices from character devices",
   "workdir": "~/lpic1-section14",
   "summary": "",
   "scenario": "A backup vendor's agent refuses to run against a device and logs: not a block device. The vendor asks you to confirm the device type of several files on the host.",
   "task": "Use long listings to identify block and character device files, and count each kind in /dev.",
   "deliverable": "reports/device-types.txt",
   "steps": [
    {
     "cmd": "ls -l /dev/$DISK /dev/tty2 /dev/null /dev/zero /dev/sr0 > reports/device-types.txt 2>&1"
    },
    {
     "cmd": "echo \"Block devices in /dev: $(find /dev -maxdepth 1 -type b | wc -l)\" >> reports/device-types.txt"
    },
    {
     "cmd": "echo \"Character devices in /dev: $(find /dev -maxdepth 1 -type c | wc -l)\" >> reports/device-types.txt"
    }
   ],
   "validation": "grep -c '^b' reports/device-types.txt and grep -c '^c' reports/device-types.txt both return at least 1.",
   "trap": "The first character of a long listing is the file type: b for block, c for character, d for directory and l for a symbolic link. Block devices such as disks move data in blocks and allow random access; character devices such as terminals and /dev/null handle a stream of bytes.",
   "paste": {
    "command": "cat reports/device-types.txt",
    "checks": [
     {
      "re": "^b[rwxst-]{9}",
      "say": "at least one block device (b) is listed"
     },
     {
      "re": "^c[rwxst-]{9}",
      "say": "at least one character device (c) is listed"
     },
     {
      "re": "^Block devices in /dev: \\d+",
      "say": "the block device count is there"
     },
     {
      "re": "^Character devices in /dev: \\d+",
      "say": "the character device count is there"
     }
    ]
   },
   "quiz": [
    {
     "id": "nulltype",
     "prompt": "What type of device file is <code>/dev/null</code>?",
     "answer": "c",
     "options": [
      {
       "value": "c",
       "label": "Character (c)"
      },
      {
       "value": "b",
       "label": "Block (b)"
      },
      {
       "value": "l",
       "label": "Symbolic link (l)"
      }
     ],
     "explain": "Correct. /dev/null handles a stream of bytes, so it's a character device."
    },
    {
     "id": "first",
     "prompt": "Which part of an <code>ls -l</code> line tells you the file type?",
     "answer": "firstchar",
     "options": [
      {
       "value": "firstchar",
       "label": "The first character of the permissions field"
      },
      {
       "value": "size",
       "label": "The size column"
      },
      {
       "value": "name",
       "label": "The file name's suffix"
      }
     ],
     "explain": "Correct. b, c, d and l in that spot mark block, character, directory and link."
    }
   ],
   "completion": "Tell block devices from character devices: done."
  },
  {
   "id": "14.2",
   "kind": "vm",
   "title": "Read major and minor numbers",
   "navSubtitle": "Major and minor numbers",
   "objective": "101.1",
   "difficulty": "Beginner",
   "source": "Lab 2: Read major and minor numbers",
   "workdir": "~/lpic1-section14",
   "summary": "",
   "scenario": "A storage driver's documentation refers to devices by major and minor number. Your teammate asks what those numbers are for the disk and its partitions.",
   "task": "Show the major and minor numbers in two ways and find the driver name for the major number in /proc/devices.",
   "deliverable": "reports/major-minor.txt",
   "steps": [
    {
     "cmd": "ls -l /dev/${DISK}* > reports/major-minor.txt"
    },
    {
     "cmd": "lsblk -o NAME,MAJ:MIN,TYPE >> reports/major-minor.txt"
    },
    {
     "text": "awk '/^Block devices/{b=1} b' /proc/devices >> reports/major-minor.txt"
    }
   ],
   "validation": "cat reports/major-minor.txt. The number before the comma in ls -l matches the number before the colon in lsblk, and the same number appears in the Block devices list (8 is sd, 252 or 253 is often virtblk or device-mapper, 259 is blkext for NVMe).",
   "trap": "The major number identifies the driver, or class of device. The minor number identifies one device that driver handles. In ls -l the size column is replaced by major, minor for device files.",
   "paste": {
    "command": "cat reports/major-minor.txt",
    "checks": [
     {
      "re": "^b\\S*\\s+\\d+\\s+\\S+\\s+\\S+\\s+\\d+,\\s*\\d+\\s",
      "say": "ls -l shows major, minor for the disk"
     },
     {
      "re": "NAME\\s+MAJ:MIN",
      "say": "includes lsblk's MAJ:MIN column"
     },
     {
      "re": "^Block devices:",
      "say": "includes the Block devices list from /proc/devices"
     },
     {
      "re": "^\\s*\\d+\\s+(sd|virtblk|blkext)\\s*$",
      "say": "the disk driver's name appears in /proc/devices"
     }
    ]
   },
   "quiz": [
    {
     "id": "major",
     "prompt": "What does the major number of a device file identify?",
     "answer": "driver",
     "options": [
      {
       "value": "driver",
       "label": "The driver, or class of device"
      },
      {
       "value": "one",
       "label": "One particular device"
      },
      {
       "value": "size",
       "label": "The device's size"
      }
     ],
     "explain": "Correct. The minor number picks one device that driver handles."
    },
    {
     "id": "sda1",
     "prompt": "<code>ls -l /dev/sda1</code> shows <code>8, 1</code>. Which number is the minor?",
     "answer": "1",
     "options": [
      "8",
      "1",
      "81"
     ],
     "explain": "Correct. The format is major, minor."
    }
   ],
   "completion": "Read major and minor numbers: done."
  },
  {
   "id": "14.3",
   "kind": "vm",
   "title": "Find hardware facts in /proc",
   "navSubtitle": "/proc, free, nproc",
   "objective": "101.1",
   "difficulty": "Beginner",
   "source": "Lab 3: Find hardware facts in /proc",
   "workdir": "~/lpic1-section14",
   "summary": "",
   "scenario": "A capacity planner asks for app02's memory total, CPU count and kernel version, and wants to know where tools such as free get their numbers.",
   "task": "Confirm /proc and /sys are pseudo filesystems, then pull the facts from /proc and compare them with the matching commands.",
   "deliverable": "reports/proc-facts.txt",
   "steps": [
    {
     "cmd": "findmnt -t proc,sysfs > reports/proc-facts.txt"
    },
    {
     "cmd": "grep -E 'MemTotal|MemFree|SwapTotal' /proc/meminfo >> reports/proc-facts.txt"
    },
    {
     "cmd": "free -k >> reports/proc-facts.txt"
    },
    {
     "cmd": "echo \"CPUs in cpuinfo: $(grep -c ^processor /proc/cpuinfo), nproc says: $(nproc)\" >> reports/proc-facts.txt"
    },
    {
     "cmd": "cat /proc/version >> reports/proc-facts.txt"
    }
   ],
   "validation": "grep MemTotal reports/proc-facts.txt and compare it with the total column of the Mem row from free -k. They are the same number.",
   "trap": "/proc and /sys live in memory, not on disk, and are rebuilt at every boot. Files in /proc show a size of 0 in ls -l even though cat prints content. Tools such as free, lsblk, lspci and lsmod read these files and format them for you.",
   "paste": {
    "command": "cat reports/proc-facts.txt",
    "checks": [
     {
      "re": "\\bproc\\s+proc\\b",
      "say": "findmnt shows /proc mounted as a proc filesystem"
     },
     {
      "re": "^MemTotal:\\s+(\\d+) kB[\\s\\S]*^Mem:\\s+\\1\\b",
      "say": "MemTotal is the same number as free -k's total"
     },
     {
      "re": "CPUs in cpuinfo: \\d+, nproc says: \\d+",
      "say": "the CPU counts are recorded"
     },
     {
      "re": "Linux version",
      "say": "/proc/version is included"
     }
    ]
   },
   "quiz": [
    {
     "id": "procsize",
     "prompt": "<code>ls -l /proc/meminfo</code> shows size 0, yet <code>cat</code> prints lots of text. Why?",
     "answer": "pseudo",
     "options": [
      {
       "value": "pseudo",
       "label": "/proc is a pseudo filesystem; the kernel builds the content when you read it"
      },
      {
       "value": "sparse",
       "label": "The file is sparse"
      },
      {
       "value": "perm",
       "label": "ls needs sudo to see the size"
      }
     ],
     "explain": "Correct. /proc lives in memory and has no stored file sizes."
    },
    {
     "id": "free",
     "prompt": "Where does <code>free</code> get its numbers?",
     "answer": "meminfo",
     "options": [
      {
       "value": "meminfo",
       "label": "<code>/proc/meminfo</code>"
      },
      {
       "value": "cpuinfo",
       "label": "<code>/proc/cpuinfo</code>"
      },
      {
       "value": "sys",
       "label": "<code>/sys/block</code>"
      }
     ],
     "explain": "Correct."
    }
   ],
   "completion": "Find hardware facts in /proc: done."
  },
  {
   "id": "14.4",
   "kind": "vm",
   "title": "Calculate a disk size from /sys",
   "navSubtitle": "/sys/block size",
   "objective": "101.1",
   "difficulty": "Beginner",
   "source": "Lab 4: Calculate a disk size from /sys",
   "workdir": "~/lpic1-section14",
   "summary": "",
   "scenario": "A minimal rescue image on db01 has no lsblk. A colleague needs the exact disk size in bytes, and you want to prove the /sys method gives the right answer.",
   "task": "Read the sector count and sector size from /sys, calculate the size in bytes, and check it against lsblk.",
   "deliverable": "reports/sys-size.txt",
   "steps": [
    {
     "cmd": "ls /sys/block/$DISK > reports/sys-size.txt"
    },
    {
     "cmd": "cat /sys/block/$DISK/size /sys/block/$DISK/queue/logical_block_size >> reports/sys-size.txt"
    },
    {
     "cmd": "echo \"$(cat /sys/block/$DISK/size) * 512\" | bc >> reports/sys-size.txt"
    },
    {
     "cmd": "lsblk -b -d -n -o SIZE /dev/$DISK >> reports/sys-size.txt"
    }
   ],
   "validation": "tail -2 reports/sys-size.txt prints the same number twice.",
   "trap": "The size file in /sys/block always counts 512-byte units, even on a disk with 4096-byte sectors, so always multiply by 512. Each partition has its own subdirectory, such as /sys/block/sda/sda1, with its own size file.",
   "paste": {
    "command": "cat reports/sys-size.txt",
    "checks": [
     {
      "re": "^size\\s*$",
      "say": "the /sys/block listing includes the size file"
     },
     {
      "re": "^\\s*(512|4096)\\s*$",
      "say": "the logical block size is recorded"
     },
     {
      "re": "^\\s*(\\d{7,})\\s*\\n\\s*\\1\\s*$",
      "say": "the calculated bytes match lsblk -b"
     }
    ]
   },
   "quiz": [
    {
     "id": "units512",
     "prompt": "<code>/sys/block/sda/size</code> holds 2097152. How big is the disk?",
     "answer": "1g",
     "options": [
      {
       "value": "1g",
       "label": "1 GiB (2097152 × 512 bytes)"
      },
      {
       "value": "2m",
       "label": "2 MiB"
      },
      {
       "value": "8g",
       "label": "8 GiB, if the disk has 4096-byte sectors"
      }
     ],
     "explain": "Correct. The size file always counts 512-byte units."
    }
   ],
   "completion": "Calculate a disk size from /sys: done."
  },
  {
   "id": "14.5",
   "kind": "vm",
   "title": "Inventory the PCI bus",
   "navSubtitle": "lspci -t, -v, -k",
   "objective": "101.1",
   "difficulty": "Intermediate",
   "source": "Lab 5: Inventory the PCI bus",
   "workdir": "~/lpic1-section14",
   "summary": "",
   "scenario": "The virtualization team asks which storage and network controllers your VM presents, and which kernel driver runs each one.",
   "task": "List the PCI devices at increasing levels of detail, show the bus tree, and match the storage controller to a disk's by-path name.",
   "deliverable": "reports/pci.txt and reports/pci-detail.txt",
   "steps": [
    {
     "text": "lspci > reports/pci.txt"
    },
    {
     "text": "lspci -tv >> reports/pci.txt"
    },
    {
     "text": "lspci -k | grep -A3 -i -E 'sata|ide|scsi|storage|nvme|ethernet' >> reports/pci.txt"
    },
    {
     "cmd": "sudo lspci -vvv > reports/pci-detail.txt"
    },
    {
     "cmd": "ls -l /dev/disk/by-path >> reports/pci.txt"
    }
   ],
   "validation": "wc -l reports/pci.txt reports/pci-detail.txt shows the detailed file is much longer, and grep -c 'Kernel driver in use' reports/pci.txt returns at least 1.",
   "trap": "Each extra v adds detail, up to -vvv, and some details need sudo. -t shows the tree of buses and bridges. -k shows the kernel driver and modules for each device. The slot address in front of each line, such as 00:0d.0, also appears in the /dev/disk/by-path names.",
   "paste": {
    "command": "cat reports/pci.txt; wc -l reports/pci-detail.txt",
    "checks": [
     {
      "re": "^([0-9a-f]{4}:)?[0-9a-f]{2}:[0-9a-f]{2}\\.[0-7] \\S",
      "say": "lspci lists at least three devices",
      "min": 3
     },
     {
      "re": "Kernel driver in use:",
      "say": "lspci -k shows a kernel driver in use"
     },
     {
      "re": "pci-[0-9a-f]{4}:[0-9a-f]{2}:[0-9a-f]{2}\\.[0-7]",
      "say": "a /dev/disk/by-path name carries a PCI slot address"
     },
     {
      "re": "^\\s*\\d{2,}\\s+\\S*pci-detail\\.txt",
      "say": "the lspci -vvv file is much longer than the short list"
     }
    ]
   },
   "quiz": [
    {
     "id": "tree",
     "prompt": "Which <code>lspci</code> option shows the tree of buses and bridges?",
     "answer": "t",
     "options": [
      {
       "value": "t",
       "label": "<code>-t</code>"
      },
      {
       "value": "k",
       "label": "<code>-k</code>"
      },
      {
       "value": "v",
       "label": "<code>-v</code>"
      }
     ],
     "explain": "Correct. -k shows drivers and -v adds detail."
    },
    {
     "id": "driver",
     "prompt": "Which option adds the kernel driver and modules for each device?",
     "answer": "k",
     "options": [
      {
       "value": "k",
       "label": "<code>-k</code>"
      },
      {
       "value": "vvv",
       "label": "<code>-vvv</code>"
      },
      {
       "value": "n",
       "label": "<code>-n</code>"
      }
     ],
     "explain": "Correct."
    }
   ],
   "completion": "Inventory the PCI bus: done."
  },
  {
   "id": "14.6",
   "kind": "vm",
   "title": "Inventory USB devices",
   "navSubtitle": "lsusb -t, -v",
   "objective": "101.1",
   "difficulty": "Intermediate",
   "source": "Lab 6: Inventory USB devices",
   "workdir": "~/lpic1-section14",
   "summary": "",
   "scenario": "Security asks you to confirm which USB devices are connected to kiosk01 before it goes on the floor.",
   "task": "List USB devices, show the hub tree, and pull the vendor and product details.",
   "deliverable": "reports/usb.txt",
   "steps": [
    {
     "text": "lsusb > reports/usb.txt"
    },
    {
     "text": "lsusb -t >> reports/usb.txt"
    },
    {
     "cmd": "sudo lsusb -v 2>/dev/null | grep -E '^Bus|idVendor|idProduct|iProduct' >> reports/usb.txt"
    },
    {
     "cmd": "ls -l /dev/disk/by-id | grep -i usb >> reports/usb.txt || echo 'No USB disks attached' >> reports/usb.txt"
    }
   ],
   "validation": "grep -c '^Bus' reports/usb.txt. Expect at least one root hub line. If the file is empty, the VM has no USB controller enabled; record that as your answer.",
   "trap": "lsusb lists every USB device, including the root hubs that belong to the controller. A USB flash drive shows up in lsusb and also as an sd disk in lsblk and /dev/disk/by-id. lsusb -t shows which driver, such as usb-storage, is bound to each port.",
   "paste": {
    "command": "cat reports/usb.txt",
    "checks": [
     {
      "re": "^Bus \\d{3} Device \\d{3}: ID [0-9a-f]{4}:[0-9a-f]{4}|no USB controller",
      "say": "lsusb lists at least one device (or you noted the VM has no USB controller)"
     },
     {
      "re": "Driver=|no USB controller",
      "say": "lsusb -t shows the driver on each port"
     },
     {
      "re": "idVendor\\s+0x[0-9a-f]{4}|no USB controller",
      "say": "lsusb -v vendor details are included"
     }
    ]
   },
   "quiz": [
    {
     "id": "roothub",
     "prompt": "<code>lsusb</code> on a machine with nothing plugged in still lists devices. What are they?",
     "answer": "hub",
     "options": [
      {
       "value": "hub",
       "label": "The root hubs belonging to the USB controllers"
      },
      {
       "value": "ghost",
       "label": "Devices removed earlier"
      },
      {
       "value": "pci",
       "label": "PCI cards"
      }
     ],
     "explain": "Correct. Each controller has a root hub."
    },
    {
     "id": "stick",
     "prompt": "Where do you find the device file name of a USB flash drive?",
     "answer": "lsblk",
     "options": [
      {
       "value": "lsblk",
       "label": "<code>lsblk</code> or <code>/dev/disk/by-id</code>"
      },
      {
       "value": "lsusb",
       "label": "<code>lsusb</code>"
      },
      {
       "value": "lspci",
       "label": "<code>lspci -k</code>"
      }
     ],
     "explain": "Correct. lsusb shows USB devices, not their sd names."
    }
   ],
   "completion": "Inventory USB devices: done."
  },
  {
   "id": "14.7",
   "kind": "vm",
   "title": "List the loaded kernel modules",
   "navSubtitle": "lsmod, /proc/modules",
   "objective": "101.1",
   "difficulty": "Intermediate",
   "source": "Lab 7: List the loaded kernel modules",
   "workdir": "~/lpic1-section14",
   "summary": "",
   "scenario": "After a kernel update on app02, a teammate asks which modules are loaded and which ones other modules depend on.",
   "task": "List the loaded modules, find the most depended-on ones, and compare lsmod with its source file.",
   "deliverable": "reports/modules.txt",
   "steps": [
    {
     "text": "lsmod > reports/modules.txt"
    },
    {
     "cmd": "echo \"Loaded modules: $(lsmod | tail -n +2 | wc -l)\" >> reports/modules.txt"
    },
    {
     "text": "lsmod | tail -n +2 | sort -k3 -n -r | head -5 >> reports/modules.txt"
    },
    {
     "cmd": "head -3 /proc/modules >> reports/modules.txt"
    },
    {
     "cmd": "grep -c . /lib/modules/$(uname -r)/modules.builtin >> reports/modules.txt"
    }
   ],
   "validation": "head -1 reports/modules.txt shows the header Module Size Used by, and the Loaded modules line gives a count.",
   "trap": "lsmod only formats /proc/modules. Drivers built into the kernel never appear in lsmod; they are listed in modules.builtin instead. The Used by column shows how many modules depend on this one, and a module in use cannot be removed.",
   "paste": {
    "command": "cat reports/modules.txt",
    "checks": [
     {
      "re": "^Module\\s+Size\\s+Used by",
      "say": "starts with lsmod's header"
     },
     {
      "re": "^Loaded modules: \\d+",
      "say": "the module count is there"
     },
     {
      "re": "\\sLive 0x[0-9a-f]+",
      "say": "lines from /proc/modules are included"
     }
    ]
   },
   "quiz": [
    {
     "id": "builtin",
     "prompt": "Why does a driver that clearly works never appear in <code>lsmod</code>?",
     "answer": "builtin",
     "options": [
      {
       "value": "builtin",
       "label": "It's built into the kernel (listed in modules.builtin)"
      },
      {
       "value": "unused",
       "label": "Nothing is using it"
      },
      {
       "value": "sudo",
       "label": "lsmod needs sudo"
      }
     ],
     "explain": "Correct. lsmod lists only loaded modules, from /proc/modules."
    },
    {
     "id": "usedby",
     "prompt": "What does the Used by column count?",
     "answer": "deps",
     "options": [
      {
       "value": "deps",
       "label": "How many modules or users depend on this module"
      },
      {
       "value": "procs",
       "label": "How many processes opened the device"
      },
      {
       "value": "loads",
       "label": "How many times it was loaded"
      }
     ],
     "explain": "Correct. A module in use can't be removed."
    }
   ],
   "completion": "List the loaded kernel modules: done."
  },
  {
   "id": "14.8",
   "kind": "vm",
   "title": "Describe a module with modinfo",
   "navSubtitle": "modinfo, -F",
   "objective": "101.1",
   "difficulty": "Intermediate",
   "source": "Lab 8: Describe a module with modinfo",
   "workdir": "~/lpic1-section14",
   "summary": "",
   "scenario": "A vendor asks which driver file, version, license and parameters a loaded module has on your build.",
   "task": "Pick a loaded module and report its details, then compare it with a module that is built into the kernel.",
   "deliverable": "reports/modinfo.txt",
   "steps": [
    {
     "text": "MOD=$(lsmod | awk 'NR==2{print $1}'); echo \"Module: $MOD\" > reports/modinfo.txt"
    },
    {
     "text": "modinfo $MOD >> reports/modinfo.txt"
    },
    {
     "text": "modinfo -F filename $MOD >> reports/modinfo.txt"
    },
    {
     "text": "modinfo -F depends $MOD >> reports/modinfo.txt"
    },
    {
     "text": "modinfo ext4 | head -3 >> reports/modinfo.txt"
    }
   ],
   "validation": "grep -E '^filename' reports/modinfo.txt shows a path under /lib/modules ending in .ko or .ko.zst, and the ext4 lines show either a path or (builtin).",
   "trap": "Module files end in .ko, and on newer kernels such as Mint 22 they are compressed as .ko.zst. modinfo and modprobe accept module names, not paths, and treat dashes and underscores as the same. The parm lines list the options you can set in /etc/modprobe.d.",
   "paste": {
    "command": "cat reports/modinfo.txt",
    "checks": [
     {
      "re": "^Module: \\S+",
      "say": "names the module you picked"
     },
     {
      "re": "^filename:\\s+/lib/modules/\\S+\\.ko(\\.zst|\\.xz)?\\s*$",
      "say": "the filename line points to a .ko file under /lib/modules"
     },
     {
      "re": "^license:\\s+\\S",
      "say": "the license is shown"
     },
     {
      "re": "^filename:\\s+(\\(builtin\\)|\\S*ext4\\.ko)",
      "say": "the ext4 lines show (builtin) or a path"
     }
    ]
   },
   "quiz": [
    {
     "id": "field",
     "prompt": "Which command prints only a module's dependencies?",
     "answer": "F",
     "options": [
      {
       "value": "F",
       "label": "<code>modinfo -F depends MODULE</code>"
      },
      {
       "value": "d",
       "label": "<code>modinfo -d MODULE</code>"
      },
      {
       "value": "lsmod",
       "label": "<code>lsmod MODULE</code>"
      }
     ],
     "explain": "Correct. -F prints one field."
    },
    {
     "id": "parm",
     "prompt": "Which modinfo lines list the options you can set in /etc/modprobe.d?",
     "answer": "parm",
     "options": [
      "parm",
      "depends",
      "alias",
      "vermagic"
     ],
     "explain": "Correct."
    }
   ],
   "completion": "Describe a module with modinfo: done."
  },
  {
   "id": "14.9",
   "kind": "vm",
   "title": "Preview what modprobe would load",
   "navSubtitle": "modprobe --show-depends",
   "objective": "101.1",
   "difficulty": "Intermediate",
   "source": "Lab 9: Preview what modprobe would load",
   "workdir": "~/lpic1-section14",
   "summary": "",
   "scenario": "Before a maintenance window on db01, the storage team asks what loading the dm_mirror module would pull in. You must answer without changing the running kernel.",
   "task": "Show the dependency chain for dm_mirror with modprobe --show-depends and confirm it from modules.dep.",
   "deliverable": "reports/dm-mirror-deps.txt",
   "steps": [
    {
     "text": "modprobe --show-depends dm_mirror > reports/dm-mirror-deps.txt"
    },
    {
     "cmd": "grep 'dm-mirror' /lib/modules/$(uname -r)/modules.dep >> reports/dm-mirror-deps.txt"
    },
    {
     "text": "lsmod | grep dm_mirror >> reports/dm-mirror-deps.txt || echo 'dm_mirror is not loaded' >> reports/dm-mirror-deps.txt"
    },
    {
     "text": "Described only. Don't run on your VM: sudo modprobe -v dm_mirror (loads the module and its dependencies), sudo modprobe -r dm_mirror (removes it and unused dependencies), sudo insmod /full/path/module.ko (loads one file, no dependencies), sudo rmmod module (removes one module) and sudo depmod -a (rebuilds modules.dep)."
    }
   ],
   "validation": "grep -c -E 'insmod|builtin' reports/dm-mirror-deps.txt returns at least 2, one line for each module in the chain.",
   "trap": "insmod needs the full path to the .ko file and does not load dependencies. modprobe takes the short name, reads modules.dep and loads dependencies first. The file is dm-mirror.ko but lsmod shows dm_mirror, so search lsmod with an underscore.",
   "paste": {
    "command": "cat reports/dm-mirror-deps.txt",
    "checks": [
     {
      "re": "^(insmod|builtin) \\S+",
      "say": "modprobe listed at least two modules in the chain",
      "min": 2
     },
     {
      "re": "^insmod \\S*/dm-mirror\\.ko",
      "say": "dm-mirror itself is in the chain"
     },
     {
      "re": "dm-mirror\\.ko(\\.zst|\\.xz)?:",
      "say": "the modules.dep line for dm-mirror is included"
     },
     {
      "re": "dm_mirror is not loaded|^dm_mirror\\s+\\d+",
      "say": "you checked whether dm_mirror is loaded"
     }
    ]
   },
   "quiz": [
    {
     "id": "insmod",
     "prompt": "What's wrong with <code>sudo insmod dm_mirror</code>?",
     "answer": "path",
     "options": [
      {
       "value": "path",
       "label": "insmod needs the full path to the .ko file, and loads no dependencies"
      },
      {
       "value": "dash",
       "label": "It needs a dash: dm-mirror"
      },
      {
       "value": "nothing",
       "label": "Nothing, it works"
      }
     ],
     "explain": "Correct. modprobe takes the short name and handles dependencies."
    },
    {
     "id": "depmod",
     "prompt": "Which command rebuilds modules.dep?",
     "answer": "depmod",
     "options": [
      {
       "value": "depmod",
       "label": "<code>depmod -a</code>"
      },
      {
       "value": "modprobe",
       "label": "<code>modprobe -r</code>"
      },
      {
       "value": "lsmod",
       "label": "<code>lsmod</code>"
      }
     ],
     "explain": "Correct."
    }
   ],
   "completion": "Preview what modprobe would load: done."
  },
  {
   "id": "14.10",
   "kind": "vm",
   "title": "Review a module blacklist request",
   "navSubtitle": "blacklist, install, options",
   "objective": "101.1",
   "difficulty": "Advanced",
   "source": "Lab 10: Review a module blacklist request",
   "workdir": "~/lpic1-section14",
   "summary": "",
   "scenario": "The desktop security team sent configs/kiosk-modprobe.conf for kiosk01 and wants it reviewed before it goes into /etc/modprobe.d.",
   "task": "Read the current module policy on your VM, then explain each line of the requested file. Do not copy it into /etc.",
   "deliverable": "reports/modprobe-review.txt",
   "steps": [
    {
     "cmd": "ls /etc/modprobe.d /etc/modules-load.d > reports/modprobe-review.txt"
    },
    {
     "cmd": "grep -rhE '^(blacklist|options|install|alias)' /etc/modprobe.d | head -20 >> reports/modprobe-review.txt"
    },
    {
     "cmd": "cat configs/kiosk-modprobe.conf >> reports/modprobe-review.txt"
    },
    {
     "text": "nano reports/modprobe-review.txt and add one line per directive in the request: blacklist stops automatic loading by alias, install replaces the load command (here /bin/true, so nothing loads), options sets a module parameter, and alias maps a name to a module."
    }
   ],
   "validation": "grep -c -E 'blacklist|install|options|alias' reports/modprobe-review.txt returns at least 8.",
   "trap": "blacklist only stops automatic loading. A person or script can still run modprobe for that module, which is why the install line is used to block it completely. Files in /etc/modprobe.d must end in .conf, and modules needed early in boot also need sudo update-initramfs -u after a change.",
   "paste": {
    "command": "cat reports/modprobe-review.txt",
    "checks": [
     {
      "re": "^install usb-storage /bin/true",
      "say": "the requested file is included"
     },
     {
      "re": "blacklist|install|options|alias",
      "say": "at least eight directive mentions",
      "min": 8
     },
     {
      "re": "automatic",
      "say": "your notes say blacklist stops automatic loading"
     },
     {
      "re": "parameter",
      "say": "your notes say options sets a module parameter"
     }
    ]
   },
   "quiz": [
    {
     "id": "block",
     "prompt": "Which line stops <code>usb-storage</code> loading even when someone runs modprobe?",
     "answer": "install",
     "options": [
      {
       "value": "install",
       "label": "<code>install usb-storage /bin/true</code>"
      },
      {
       "value": "blacklist",
       "label": "<code>blacklist usb-storage</code>"
      },
      {
       "value": "alias",
       "label": "<code>alias usb-storage off</code>"
      }
     ],
     "explain": "Correct. blacklist only stops automatic loading."
    },
    {
     "id": "conf",
     "prompt": "Which file name would modprobe read from /etc/modprobe.d?",
     "answer": "kiosk.conf",
     "options": [
      {
       "value": "kiosk.conf",
       "label": "<code>kiosk.conf</code>"
      },
      {
       "value": "kiosk.rules",
       "label": "<code>kiosk.rules</code>"
      },
      {
       "value": "kiosk",
       "label": "<code>kiosk</code>"
      }
     ],
     "explain": "Correct. Files there must end in .conf."
    }
   ],
   "completion": "Review a module blacklist request: done."
  },
  {
   "id": "14.11",
   "kind": "vm",
   "title": "Read the kernel's hardware messages",
   "navSubtitle": "dmesg, journalctl -k",
   "objective": "101.1",
   "difficulty": "Advanced",
   "source": "Lab 11: Read the kernel's hardware messages",
   "workdir": "~/lpic1-section14",
   "summary": "",
   "scenario": "A user reports that a disk on app02 was slow to appear at boot. You need the kernel's messages about the disk controller and the disk.",
   "task": "Capture the start of the kernel ring buffer, filter it for storage messages with readable timestamps, and compare it with the journal.",
   "deliverable": "reports/kernel-messages.txt",
   "steps": [
    {
     "cmd": "sudo dmesg | head -20 > reports/kernel-messages.txt"
    },
    {
     "cmd": "sudo dmesg -T | grep -i -E \"$DISK|ata|scsi|nvme\" | head -20 >> reports/kernel-messages.txt"
    },
    {
     "cmd": "sudo dmesg -l err,warn | tail -10 >> reports/kernel-messages.txt"
    },
    {
     "text": "journalctl -k -b --no-pager | grep -i \"$DISK\" | head -5 >> reports/kernel-messages.txt"
    }
   ],
   "validation": "grep -c -i \"$DISK\" reports/kernel-messages.txt returns at least 1.",
   "trap": "On Mint, plain dmesg fails with Operation not permitted because dmesg_restrict is on, so use sudo. The ring buffer has a fixed size and old messages roll off; journalctl -k keeps kernel messages from this boot (-b) in the journal. Never run dmesg -c on a server you are troubleshooting, because it clears the buffer.",
   "paste": {
    "command": "cat reports/kernel-messages.txt",
    "checks": [
     {
      "re": "Linux version",
      "say": "the start of the ring buffer is included"
     },
     {
      "re": "^\\[(Mon|Tue|Wed|Thu|Fri|Sat|Sun) [A-Z][a-z]{2}\\s+\\d+ \\d\\d:\\d\\d:\\d\\d \\d{4}\\]",
      "say": "dmesg -T lines have readable timestamps"
     },
     {
      "re": "\\b(sd[a-z]|vd[a-z]|nvme\\d+n\\d+)\\b",
      "say": "your disk is mentioned"
     }
    ]
   },
   "quiz": [
    {
     "id": "dmesgc",
     "prompt": "Why should you never run <code>dmesg -c</code> while troubleshooting?",
     "answer": "clear",
     "options": [
      {
       "value": "clear",
       "label": "It clears the ring buffer after printing"
      },
      {
       "value": "color",
       "label": "It turns colour off"
      },
      {
       "value": "cont",
       "label": "It follows new messages forever"
      }
     ],
     "explain": "Correct. Use dmesg, dmesg -T or journalctl -k."
    },
    {
     "id": "denied",
     "prompt": "Plain <code>dmesg</code> on Mint says <em>Operation not permitted</em>. Why?",
     "answer": "restrict",
     "options": [
      {
       "value": "restrict",
       "label": "dmesg_restrict limits it to administrators, so use sudo"
      },
      {
       "value": "empty",
       "label": "The ring buffer is empty"
      },
      {
       "value": "journal",
       "label": "Mint only uses journalctl"
      }
     ],
     "explain": "Correct."
    }
   ],
   "completion": "Read the kernel's hardware messages: done."
  },
  {
   "id": "14.12",
   "kind": "vm",
   "title": "Ask udev what it knows about a disk",
   "navSubtitle": "udevadm info, rules",
   "objective": "101.1",
   "difficulty": "Advanced",
   "source": "Lab 12: Ask udev what it knows about a disk",
   "workdir": "~/lpic1-section14",
   "summary": "",
   "scenario": "A storage script needs the disk's model, serial number and stable link names. The developer asks where those come from.",
   "task": "Query udev's database for the disk, list the rules directories, and find where the /dev/disk links come from.",
   "deliverable": "reports/udev-disk.txt",
   "steps": [
    {
     "text": "udevadm info --query=all --name=/dev/$DISK > reports/udev-disk.txt"
    },
    {
     "cmd": "grep -E 'DEVLINKS|ID_BUS|ID_MODEL|ID_SERIAL|ID_PATH' reports/udev-disk.txt"
    },
    {
     "cmd": "ls /lib/udev/rules.d | head -20 >> reports/udev-disk.txt"
    },
    {
     "cmd": "ls -l /etc/udev/rules.d >> reports/udev-disk.txt"
    },
    {
     "cmd": "grep -l 'by-id' /lib/udev/rules.d/*.rules >> reports/udev-disk.txt"
    }
   ],
   "validation": "grep -c 'by-' reports/udev-disk.txt returns at least 2, from the S: link lines and the DEVLINKS line. The last line names the rules file that creates them, usually 60-persistent-storage.rules.",
   "trap": "The kernel discovers a device and sends an event. udev reads the details from /sys, applies its rules, and creates the /dev file and links such as /dev/disk/by-id. Packaged rules live in /lib/udev/rules.d; local rules go in /etc/udev/rules.d, end in .rules, and override a packaged file with the same name.",
   "paste": {
    "command": "cat reports/udev-disk.txt",
    "checks": [
     {
      "re": "^S: disk/by-",
      "say": "udev lists stable link names (S: lines)"
     },
     {
      "re": "^E: DEVLINKS=.*by-",
      "say": "the DEVLINKS property is there"
     },
     {
      "re": "/lib/udev/rules\\.d/60-persistent-storage[\\w-]*\\.rules",
      "say": "names the rules file that makes the links"
     }
    ]
   },
   "quiz": [
    {
     "id": "local",
     "prompt": "Where do your own udev rules go?",
     "answer": "etc",
     "options": [
      {
       "value": "etc",
       "label": "<code>/etc/udev/rules.d</code>, in a file ending .rules"
      },
      {
       "value": "lib",
       "label": "<code>/lib/udev/rules.d</code>"
      },
      {
       "value": "dev",
       "label": "<code>/dev/udev</code>"
      }
     ],
     "explain": "Correct. A file there overrides a packaged file with the same name."
    },
    {
     "id": "source",
     "prompt": "Where does udev read a device's details before applying its rules?",
     "answer": "sys",
     "options": [
      {
       "value": "sys",
       "label": "<code>/sys</code>"
      },
      {
       "value": "dbus",
       "label": "D-Bus"
      },
      {
       "value": "fstab",
       "label": "<code>/etc/fstab</code>"
      }
     ],
     "explain": "Correct."
    }
   ],
   "completion": "Ask udev what it knows about a disk: done."
  },
  {
   "id": "14.13",
   "kind": "vm",
   "title": "Watch a hotplug event",
   "navSubtitle": "udevadm monitor, D-Bus",
   "objective": "101.1",
   "difficulty": "Advanced",
   "source": "Lab 13: Watch a hotplug event",
   "workdir": "~/lpic1-section14",
   "summary": "",
   "scenario": "Security wants proof that the kernel and udev announce a new storage device the moment it appears, the way they would for a USB stick plugged into kiosk01.",
   "task": "Run udevadm monitor while attaching and detaching the image file as a loop device, then record where desktop sessions auto-mount removable disks and confirm D-Bus is running.",
   "deliverable": "reports/hotplug-events.txt and reports/hotplug-notes.txt",
   "steps": [
    {
     "cmd": "sudo -v"
    },
    {
     "text": "timeout 15 udevadm monitor --kernel --udev --subsystem-match=block > reports/hotplug-events.txt &"
    },
    {
     "text": "sleep 2; HP=$(sudo losetup -f --show images/hotplug.img); sleep 2; sudo losetup -d $HP; wait"
    },
    {
     "cmd": "ls -ld /media/$USER > reports/hotplug-notes.txt 2>&1"
    },
    {
     "cmd": "systemctl is-active dbus >> reports/hotplug-notes.txt"
    }
   ],
   "validation": "grep -E '^(KERNEL|UDEV) *\\[' reports/hotplug-events.txt shows change events for the loop device from both the kernel and udev, and reports/hotplug-notes.txt ends with active. The prompt returns when the 15-second timeout ends.",
   "trap": "A coldplug device is present at boot; a hotplug device is added while the system runs. udev handles both. udev listens to kernel events, not D-Bus; after udev creates the device files, desktop services talk about the new device over D-Bus and may mount it under /media/username. Some devices must also be enabled in the BIOS or UEFI setup before the kernel can see them at all.",
   "paste": {
    "command": "cat reports/hotplug-events.txt reports/hotplug-notes.txt",
    "checks": [
     {
      "re": "^KERNEL\\s*\\[[\\d.]+\\]\\s+(add|change)\\s+\\S*/loop\\d+",
      "say": "the kernel announced the loop device"
     },
     {
      "re": "^UDEV\\s*\\[[\\d.]+\\]\\s+(add|change)\\s+\\S*/loop\\d+",
      "say": "udev announced the loop device"
     },
     {
      "re": "/media/\\S+",
      "say": "the /media path is recorded"
     },
     {
      "re": "^active\\s*$",
      "say": "D-Bus is active"
     }
    ]
   },
   "quiz": [
    {
     "id": "hot",
     "prompt": "A USB stick plugged in while the system runs is a…",
     "answer": "hot",
     "options": [
      {
       "value": "hot",
       "label": "Hotplug device"
      },
      {
       "value": "cold",
       "label": "Coldplug device"
      },
      {
       "value": "boot",
       "label": "Boot device"
      }
     ],
     "explain": "Correct. Coldplug devices are present at boot."
    },
    {
     "id": "udevdbus",
     "prompt": "What does udev listen to for new devices?",
     "answer": "kernel",
     "options": [
      {
       "value": "kernel",
       "label": "Kernel events (uevents)"
      },
      {
       "value": "dbus",
       "label": "D-Bus messages"
      },
      {
       "value": "media",
       "label": "Changes under /media"
      }
     ],
     "explain": "Correct. Desktop services use D-Bus after udev makes the device files."
    }
   ],
   "completion": "Watch a hotplug event: done."
  }
 ],
 "review": {
  "traps": [
   "Mixing up b and c in ls -l. b is a block device such as a disk; c is a character device such as a terminal or /dev/null.",
   "Swapping major and minor. The major number identifies the driver; the minor number identifies one device it handles.",
   "Thinking /proc and /sys are on disk. Both are pseudo filesystems in memory, rebuilt at every boot.",
   "Reading /sys/block/DEVICE/size as bytes or as real sectors. It always counts 512-byte units.",
   "Forgetting which lspci option shows the tree (-t) and which add detail (-v, -vv, -vvv). -k shows the kernel driver.",
   "Expecting lsusb to show a disk's device file. It shows USB devices; lsblk and /dev/disk/by-id give the sd name.",
   "Using insmod with a short module name. insmod needs the full path to the .ko file and does not load dependencies.",
   "Forgetting that modprobe resolves dependencies from modules.dep, which depmod builds, and that modprobe -r removes them too.",
   "Searching lsmod for dm-mirror. Loaded module names use underscores: dm_mirror.",
   "Expecting built-in drivers in lsmod. They are listed in /lib/modules/$(uname -r)/modules.builtin.",
   "Thinking blacklist makes a module impossible to load. It stops automatic loading only; an install line pointing to /bin/true blocks it completely.",
   "Running dmesg -c to read messages. It clears the ring buffer; use dmesg, dmesg -T or journalctl -k.",
   "Putting local udev rules in /lib/udev/rules.d. Local rules belong in /etc/udev/rules.d and must end in .rules.",
   "Saying udev talks to D-Bus. udev listens to kernel events; other services use D-Bus after udev creates the device files."
  ],
  "trapQuiz": [
   {
    "id": "tq1",
    "prompt": "In <code>ls -l</code>, which first character marks a disk?",
    "answer": "b",
    "options": [
     "b",
     "c",
     "d",
     "l"
    ],
    "explain": "Correct. b is block; c is character."
   },
   {
    "id": "tq2",
    "prompt": "Which number identifies the driver for a device file?",
    "answer": "major",
    "options": [
     {
      "value": "major",
      "label": "The major number"
     },
     {
      "value": "minor",
      "label": "The minor number"
     },
     {
      "value": "inode",
      "label": "The inode number"
     }
    ],
    "explain": "Correct."
   },
   {
    "id": "tq3",
    "prompt": "Where do /proc and /sys live?",
    "answer": "mem",
    "options": [
     {
      "value": "mem",
      "label": "In memory, rebuilt at every boot"
     },
     {
      "value": "root",
      "label": "On the root filesystem"
     },
     {
      "value": "boot",
      "label": "On /boot"
     }
    ],
    "explain": "Correct. Both are pseudo filesystems."
   },
   {
    "id": "tq4",
    "prompt": "What unit does <code>/sys/block/DEVICE/size</code> count?",
    "answer": "512",
    "options": [
     {
      "value": "512",
      "label": "512-byte units, always"
     },
     {
      "value": "bytes",
      "label": "Bytes"
     },
     {
      "value": "sector",
      "label": "The disk's real sector size"
     }
    ],
    "explain": "Correct."
   },
   {
    "id": "tq5",
    "prompt": "Which command loads a module and its dependencies by short name?",
    "answer": "modprobe",
    "options": [
     {
      "value": "insmod",
      "label": "<code>insmod</code>"
     },
     {
      "value": "modprobe",
      "label": "<code>modprobe</code>"
     },
     {
      "value": "depmod",
      "label": "<code>depmod</code>"
     }
    ],
    "explain": "Correct. insmod needs a full path and skips dependencies."
   },
   {
    "id": "tq6",
    "prompt": "How does the dm-mirror module appear in lsmod?",
    "answer": "under",
    "options": [
     {
      "value": "under",
      "label": "<code>dm_mirror</code>"
     },
     {
      "value": "dash",
      "label": "<code>dm-mirror</code>"
     },
     {
      "value": "ko",
      "label": "<code>dm-mirror.ko</code>"
     }
    ],
    "explain": "Correct. Loaded names use underscores."
   },
   {
    "id": "tq7",
    "prompt": "What does <code>blacklist pcspkr</code> do?",
    "answer": "auto",
    "options": [
     {
      "value": "auto",
      "label": "Stops automatic loading; modprobe pcspkr still works"
     },
     {
      "value": "never",
      "label": "Makes pcspkr impossible to load"
     },
     {
      "value": "remove",
      "label": "Removes pcspkr now"
     }
    ],
    "explain": "Correct."
   },
   {
    "id": "tq8",
    "prompt": "Which statement about udev is true?",
    "answer": "kernel",
    "options": [
     {
      "value": "kernel",
      "label": "It listens to kernel events and creates files in /dev"
     },
     {
      "value": "dbus",
      "label": "It listens on D-Bus for new devices"
     },
     {
      "value": "lib",
      "label": "Local rules go in /lib/udev/rules.d"
     }
    ],
    "explain": "Correct."
   }
  ],
  "challenge": {
   "intro": "Complete these tasks without notes, using only your Linux Mint VM and the files in ~/lpic1-section14. Run Step 3 of the Lab Setup first so DISK is set, and save each answer under reports/ with a name that starts with challenge-. Do not load or remove any module.",
   "tasks": [
    "Prove that your main disk is a block device and /dev/tty2 is a character device, and give the major and minor numbers of the disk.",
    "Report total memory and CPU count from /proc, and name the command that formats each one for you.",
    "Calculate the main disk's size in bytes from /sys and prove it matches lsblk.",
    "Name the PCI storage controller and the kernel driver in use for it.",
    "List every USB device and the driver bound to each port.",
    "For the first module in lsmod, give its file path, license and dependencies.",
    "Show which modules modprobe would load for dm_mirror without loading anything, and write the commands that would load and remove it.",
    "Capture the udev events produced when images/hotplug.img is attached and detached as a loop device."
   ],
   "outro": "Your final handoff is the reports directory. For each challenge file, write one sentence explaining what it proves and which link in the chain from bus to /dev it covers."
  },
  "questions": [
   {
    "q": "Vendor request: “Which network and storage controllers does this VM present, and which kernel driver is handling each one?”",
    "a": "<code>lspci -k</code> lists each device with a <em>Kernel driver in use</em> line; look at the Ethernet and SATA, SCSI or NVMe controllers. <code>lspci -tv</code> shows where they sit on the bus."
   },
   {
    "q": "Security request: “Make sure USB storage can never be loaded on kiosk01, even by someone running modprobe. What line would you add, and where?”",
    "a": "Add <code>install usb-storage /bin/true</code> to a file such as <code>/etc/modprobe.d/kiosk.conf</code> (a <code>blacklist usb-storage</code> line alone only stops automatic loading). Run <code>sudo update-initramfs -u</code> if it must apply early in boot."
   },
   {
    "q": "Storage team request: “Before tonight's change, tell me every module that loading dm_mirror will pull in. Don't load it yet.”",
    "a": "<code>modprobe --show-depends dm_mirror</code> prints the insmod line for every module in the chain without loading anything. The dm-mirror line in <code>/lib/modules/$(uname -r)/modules.dep</code> confirms it."
   },
   {
    "q": "Developer request: “Our rescue image has no lsblk. Show me how to get the exact size of a disk from /sys.”",
    "a": "<code>cat /sys/block/DEVICE/size</code> gives a count of 512-byte units; multiply by 512, for example <code>echo \"$(cat /sys/block/sda/size) * 512\" | bc</code>."
   },
   {
    "q": "Help desk request: “A user says their USB stick never shows up. Where would you look first to see whether the kernel noticed it?”",
    "a": "Run <code>sudo dmesg -T</code> (or <code>journalctl -k</code>) right after plugging it in and look for usb and sd messages, then check <code>lsusb</code> and <code>lsblk</code>. If nothing appears, check the cable, port and BIOS or UEFI settings."
   },
   {
    "q": "Backup vendor request: “Our agent says /dev/sdb is not a block device. Prove what type of device file it is.”",
    "a": "<code>ls -l /dev/sdb</code>: a leading <code>b</code> means block device, <code>c</code> character. <code>stat</code> or <code>file /dev/sdb</code> also names the type, and a missing file means the disk isn't there."
   },
   {
    "q": "Team lead request: “A driver needs a new option. Where do module options go so they survive a reboot, and how do you check which options the module accepts?”",
    "a": "In a .conf file in <code>/etc/modprobe.d</code>, as <code>options MODULE name=value</code>. <code>modinfo -F parm MODULE</code> (or the parm lines of <code>modinfo</code>) lists the options it accepts."
   }
  ],
  "mastery": [
   "I can identify block and character device files from ls -l and explain the difference.",
   "I can read major and minor numbers with ls -l, lsblk and /proc/devices.",
   "I can explain why /proc and /sys are pseudo filesystems and find memory, CPU and kernel facts in /proc.",
   "I can calculate a disk's size from /sys/block and confirm it with lsblk.",
   "I can list PCI devices with lspci, show the tree with -t, add detail with -v to -vvv, and find drivers with -k.",
   "I can list USB devices with lsusb, show the port tree with -t and get details with -v.",
   "I can list loaded modules with lsmod and explain the Used by column and modules.builtin.",
   "I can describe a module with modinfo and its -F option.",
   "I can explain the difference between insmod, rmmod, modprobe and modprobe -r, and preview dependencies with modprobe --show-depends.",
   "I can read and explain blacklist, install, options and alias lines in /etc/modprobe.d.",
   "I can read kernel messages with sudo dmesg, dmesg -T and journalctl -k.",
   "I can query udev with udevadm info, watch events with udevadm monitor, and explain coldplug, hotplug, the rules directories and D-Bus."
  ]
 }
});
