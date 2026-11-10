/* Section 23: Linux as a Virtualization Guest. Generated from LPIC_Section23_Lab_Workbook.docx by vm_section.py;
   paste checks, quizzes and model answers were added for the app. */
LPIC.section({
 "id": "section-23",
 "number": 23,
 "title": "Linux as a Virtualization Guest",
 "objectives": [
  "102.6"
 ],
 "kind": "vm",
 "source": "LPIC_Section23_Lab_Workbook.docx",
 "scenario": "Objective 102.6: Run Linux as a virtualization guest by proving what platform a system runs on, checking its guest drivers, preparing a cloned VM's identity, and describing containers and IaaS cloud instances.",
 "overview": {
  "paragraphs": [
   "Treat each lab like a request from a platform team. This objective is about Linux as the guest: the system inside the virtual machine or cloud instance. Your Linux Mint VM is a perfect test subject, so the first labs inspect it directly and ask it to prove what hypervisor it is running on. If you happen to run Mint on bare metal, those commands will answer none, which is still a correct and useful result.",
   "Changing the real machine ID or SSH host keys of your VM can confuse services and logins, so the cloning labs work on a practice copy of a guest's /etc called clone-root inside the lab folder. Real-system commands for the same jobs are shown as text and marked \"Don't run on your VM.\" The container lab uses unshare, which is already on Mint. Docker is not required; Lab 11 is an optional Docker lab with full install and cleanup steps."
  ],
  "setup": [
   {
    "text": "Step 1: Confirm the inspection tools are present. They ship with Mint:"
   },
   {
    "cmd": "command -v systemd-detect-virt lscpu hostnamectl dbus-uuidgen ssh-keygen unshare"
   },
   {
    "text": "Step 2: Install the two small extras the labs use if they are missing: dmidecode, which reads the firmware tables, and the Python YAML module, which checks cloud-init files:"
   },
   {
    "cmd": "command -v dmidecode || sudo apt install dmidecode"
   },
   {
    "cmd": "python3 -c 'import yaml' || sudo apt install python3-yaml"
   },
   {
    "text": "Step 3: Create the practice workspace:"
   },
   {
    "cmd": "mkdir -p ~/lpic1-section23/{reports,keys,cloud}"
   },
   {
    "cmd": "cd ~/lpic1-section23"
   },
   {
    "text": "Step 4: Build clone-root, a practice copy of the identity files from a template guest named web01. Running this step again resets it:"
   },
   {
    "cmd": "rm -rf clone-root && mkdir -p clone-root/etc/ssh clone-root/etc/netplan clone-root/var/lib/dbus"
   },
   {
    "cmd": "printf 'web01\\n' > clone-root/etc/hostname"
   },
   {
    "cmd": "printf '%s\\n' '127.0.0.1 localhost' '127.0.1.1 web01' > clone-root/etc/hosts"
   },
   {
    "cmd": "printf '0123456789abcdef0123456789abcdef\\n' > clone-root/etc/machine-id"
   },
   {
    "cmd": "ln -s ../../../etc/machine-id clone-root/var/lib/dbus/machine-id"
   },
   {
    "cmd": "printf '%s\\n' 'UUID=1b6f2c3e-0a4d-4c55-9e8f-7a1b2c3d4e5f / ext4 errors=remount-ro 0 1' '/swapfile none swap sw 0 0' > clone-root/etc/fstab"
   },
   {
    "cmd": "printf '%s\\n' 'network:' '  version: 2' '  ethernets:' '    ens33:' '      match:' '        macaddress: \"08:00:27:aa:bb:01\"' '      addresses: [10.20.0.11/24]' > clone-root/etc/netplan/01-static.yaml"
   },
   {
    "cmd": "ssh-keygen -q -A -f clone-root"
   },
   {
    "text": "Validation check: Run find clone-root | sort and cat clone-root/etc/machine-id. You should see hostname, hosts, machine-id, fstab, the netplan file, the dbus machine-id link, and a private and .pub file for each SSH host key type (ECDSA, ED25519, and RSA). Nothing under the real /etc has been touched."
   }
  ],
  "commands": [
   "systemd-detect-virt (--vm",
   "--container)",
   "lscpu",
   "hostnamectl",
   "dmidecode -s system-manufacturer",
   "dmidecode -s system-product-name",
   "dmidecode -t system",
   "/sys/class/dmi/id/",
   "/proc/cpuinfo flags (vmx",
   "svm",
   "hypervisor)",
   "lsmod",
   "modinfo",
   "/etc/machine-id",
   "/var/lib/dbus/machine-id",
   "dbus-uuidgen --ensure",
   "systemd-machine-id-setup",
   "systemd-id128 new",
   "ssh-keygen -A",
   "ssh-keygen -lf",
   "ssh-keygen -R",
   "ssh-keygen -t",
   "ssh-copy-id",
   "cloud-init with user-data and meta-data",
   "unshare",
   "the optional docker run",
   "ps -a",
   "start",
   "exec",
   "stop",
   "rm",
   "rmi"
  ],
  "memoryHook": "A VM brings its own kernel; a container borrows the host's. A type 1 hypervisor is the floor the VMs stand on, and a type 2 hypervisor is an app on someone else's floor. When you clone a guest you get an identical twin, and twins must be given their own identity before they meet the network: hostname, IP address, MAC address, machine ID, SSH host keys, and any UUIDs. In the cloud, cloud-init is the courier that hands each new instance that identity on its first boot.",
  "reference": []
 },
 "lessons": [
  {
   "id": "23.1",
   "kind": "vm",
   "title": "Answer \"is this server physical or virtual?\"",
   "navSubtitle": "systemd-detect-virt, lscpu",
   "objective": "102.6",
   "difficulty": "Beginner",
   "source": "Lab 1: Answer \"is this server physical or virtual?\"",
   "workdir": "~/lpic1-section23",
   "summary": "",
   "scenario": "Asset management lists your Mint system as a physical desktop. The licensing team needs proof either way, because virtual and physical installs are licensed differently.",
   "task": "Ask systemd, the CPU information, and hostnamectl what platform this system runs on.",
   "deliverable": "reports/virt-detect.txt.",
   "steps": [
    {
     "text": "systemd-detect-virt > reports/virt-detect.txt"
    },
    {
     "text": "systemd-detect-virt --vm >> reports/virt-detect.txt"
    },
    {
     "text": "systemd-detect-virt --container >> reports/virt-detect.txt"
    },
    {
     "text": "lscpu | grep -i -E 'hypervisor|virtualization' >> reports/virt-detect.txt"
    },
    {
     "text": "hostnamectl | grep -i -E 'virtualization|vendor|model' >> reports/virt-detect.txt"
    }
   ],
   "validation": "head -1 reports/virt-detect.txt shows a hypervisor name such as oracle (VirtualBox), vmware, microsoft (Hyper-V), or kvm, and the --container line shows none.",
   "trap": "systemd-detect-virt checks for containers first, so on a container inside a VM the plain command reports the container. Use --vm or --container to ask one specific question. The tool prints none and exits with status 1 on bare metal, which is not an error.",
   "paste": {
    "command": "cat reports/virt-detect.txt",
    "checks": [
     {
      "re": "^(oracle|vmware|microsoft|kvm|qemu|xen|parallels|bochs|amazon|google|bhyve|acrn|powervm|zvm|apple)\\s*$",
      "say": "systemd-detect-virt and --vm both name a hypervisor",
      "min": 2
     },
     {
      "re": "^none\\s*$",
      "say": "the --container line shows none"
     },
     {
      "re": "Hypervisor vendor:\\s+\\S+",
      "say": "lscpu names a hypervisor vendor"
     }
    ]
   },
   "quiz": [
    {
     "id": "bare",
     "prompt": "On bare metal, what does <code>systemd-detect-virt</code> print?",
     "answer": "none",
     "options": [
      {
       "value": "none",
       "label": "<code>none</code>, with exit status 1"
      },
      {
       "value": "err",
       "label": "An error message"
      },
      {
       "value": "phys",
       "label": "<code>physical</code>"
      }
     ],
     "explain": "Correct. Exit status 1 there isn't an error."
    },
    {
     "id": "vmflag",
     "prompt": "Which option asks only whether the system is a VM, ignoring containers?",
     "answer": "vm",
     "options": [
      {
       "value": "vm",
       "label": "<code>--vm</code>"
      },
      {
       "value": "c",
       "label": "<code>--container</code>"
      },
      {
       "value": "q",
       "label": "<code>--quiet</code>"
      }
     ],
     "explain": "Correct. The plain command reports a container first if there is one."
    }
   ],
   "completion": "Answer \"is this server physical or virtual?\": done."
  },
  {
   "id": "23.2",
   "kind": "vm",
   "title": "Read the virtual hardware's firmware identity",
   "navSubtitle": "/sys/class/dmi, dmidecode",
   "objective": "102.6",
   "difficulty": "Beginner",
   "source": "Lab 2: Read the virtual hardware's firmware identity",
   "workdir": "~/lpic1-section23",
   "summary": "",
   "scenario": "The hardware inventory tool shows the vendor of your system as \"innotek GmbH\" and the help desk thinks the asset tag is wrong. You need to show where that name comes from.",
   "task": "Read the vendor and product from the DMI/SMBIOS tables, first through /sys as a normal user and then with dmidecode.",
   "deliverable": "reports/dmi.txt.",
   "steps": [
    {
     "cmd": "cat /sys/class/dmi/id/sys_vendor /sys/class/dmi/id/product_name /sys/class/dmi/id/bios_vendor > reports/dmi.txt"
    },
    {
     "cmd": "sudo dmidecode -s system-manufacturer >> reports/dmi.txt"
    },
    {
     "cmd": "sudo dmidecode -s system-product-name >> reports/dmi.txt"
    },
    {
     "cmd": "sudo dmidecode -t system | grep -E 'Manufacturer|Product|UUID' >> reports/dmi.txt"
    },
    {
     "text": "Try cat /sys/class/dmi/id/product_uuid as yourself and it fails with Permission denied; sudo cat /sys/class/dmi/id/product_uuid works."
    }
   ],
   "validation": "cat reports/dmi.txt and confirm the /sys lines match the dmidecode lines. VirtualBox shows innotek GmbH and VirtualBox, VMware shows VMware, Inc., Hyper-V shows Microsoft Corporation and Virtual Machine, and KVM usually shows QEMU.",
   "trap": "The hypervisor writes these firmware tables, so the vendor is the hypervisor maker, not the PC maker. dmidecode needs root because it reads raw firmware memory, while most of /sys/class/dmi/id is world-readable except serial numbers and the UUID. A clone may keep the same system UUID if the hypervisor does not change it, so never use it alone as a unique ID.",
   "paste": {
    "command": "cat reports/dmi.txt",
    "checks": [
     {
      "re": "^\\s*(Manufacturer:\\s*)?(innotek GmbH|VMware, Inc\\.|VMware|Microsoft Corporation|QEMU|Xen|Red Hat|Parallels\\S*|Amazon EC2|Google)",
      "say": "the hypervisor vendor shows in /sys, dmidecode -s and dmidecode -t",
      "min": 3
     },
     {
      "re": "Product Name:\\s+\\S+",
      "say": "dmidecode -t system shows the product name"
     },
     {
      "re": "UUID:\\s+[0-9a-f]{8}-[0-9a-f]{4}-",
      "say": "dmidecode shows the system UUID"
     }
    ]
   },
   "quiz": [
    {
     "id": "innotek",
     "prompt": "Why does a VirtualBox guest report its vendor as innotek GmbH?",
     "answer": "fw",
     "options": [
      {
       "value": "fw",
       "label": "The hypervisor writes the virtual firmware tables"
      },
      {
       "value": "pc",
       "label": "It's the PC maker"
      },
      {
       "value": "bug",
       "label": "The asset tool has a bug"
      }
     ],
     "explain": "Correct. innotek wrote VirtualBox before Sun and Oracle bought it."
    },
    {
     "id": "dmiroot",
     "prompt": "Why does <code>dmidecode</code> need sudo?",
     "answer": "raw",
     "options": [
      {
       "value": "raw",
       "label": "It reads raw firmware memory"
      },
      {
       "value": "write",
       "label": "It writes to the BIOS"
      },
      {
       "value": "net",
       "label": "It contacts the hypervisor over the network"
      }
     ],
     "explain": "Correct. Most of /sys/class/dmi/id is readable without it."
    }
   ],
   "completion": "Read the virtual hardware's firmware identity: done."
  },
  {
   "id": "23.3",
   "kind": "vm",
   "title": "Check CPU virtualization flags and classify the hypervisor",
   "navSubtitle": "vmx/svm, type 1 vs 2",
   "objective": "102.6",
   "difficulty": "Beginner",
   "source": "Lab 3: Check CPU virtualization flags and classify the hypervisor",
   "workdir": "~/lpic1-section23",
   "summary": "",
   "scenario": "An architect wants to run a nested lab VM inside your Mint guest and asks two questions: does the virtual CPU expose hardware virtualization, and what type of hypervisor is the host running?",
   "task": "Count the vmx and svm flags, look for the hypervisor flag, record the guest's resources, and write a short classification.",
   "deliverable": "reports/cpu-virt.txt and reports/hypervisor-type.txt.",
   "steps": [
    {
     "cmd": "grep -c -w -E 'vmx|svm' /proc/cpuinfo > reports/cpu-virt.txt"
    },
    {
     "cmd": "grep -m1 -o -w hypervisor /proc/cpuinfo >> reports/cpu-virt.txt"
    },
    {
     "text": "nproc >> reports/cpu-virt.txt"
    },
    {
     "cmd": "free -h >> reports/cpu-virt.txt"
    },
    {
     "text": "df -h / >> reports/cpu-virt.txt"
    },
    {
     "text": "nano reports/hypervisor-type.txt and write three lines: the hypervisor from Lab 1, whether it is type 1 (runs directly on the hardware, like Xen, VMware ESXi, or Hyper-V) or type 2 (an application on a host OS, like VirtualBox or VMware Workstation), and one sentence on why."
    }
   ],
   "validation": "cat reports/cpu-virt.txt reports/hypervisor-type.txt. Expect the first number to be 0 unless nested virtualization is turned on, a hypervisor line, and a classification line that mentions type 1 or type 2.",
   "trap": "On a host, vmx means Intel VT-x and svm means AMD-V, and the feature must also be enabled in the firmware setup. Inside a guest those flags are usually hidden, while the hypervisor flag is present. KVM is built into the Linux kernel and does not fit neatly into either type; many sources call it type 1, others a hybrid.",
   "paste": {
    "command": "cat reports/cpu-virt.txt reports/hypervisor-type.txt",
    "checks": [
     {
      "re": "^\\d+\\s*$",
      "say": "the vmx/svm count and nproc are there",
      "min": 2
     },
     {
      "re": "^hypervisor\\s*$",
      "say": "the hypervisor CPU flag is present"
     },
     {
      "re": "^Mem:",
      "say": "free -h output is included"
     },
     {
      "re": "type\\s*(1|2|one|two)\\b",
      "say": "your note classifies the hypervisor as type 1 or type 2"
     }
    ]
   },
   "quiz": [
    {
     "id": "t2",
     "prompt": "Which is a type 2 hypervisor?",
     "answer": "vbox",
     "options": [
      {
       "value": "vbox",
       "label": "VirtualBox"
      },
      {
       "value": "esxi",
       "label": "VMware ESXi"
      },
      {
       "value": "xen",
       "label": "Xen"
      },
      {
       "value": "hv",
       "label": "Hyper-V"
      }
     ],
     "explain": "Correct. It runs as an application on a host OS."
    },
    {
     "id": "flaghv",
     "prompt": "Inside a guest, which <code>/proc/cpuinfo</code> flag shows you are virtualized?",
     "answer": "hypervisor",
     "options": [
      {
       "value": "hypervisor",
       "label": "<code>hypervisor</code>"
      },
      {
       "value": "vmx",
       "label": "<code>vmx</code>"
      },
      {
       "value": "svm",
       "label": "<code>svm</code>"
      }
     ],
     "explain": "Correct. vmx and svm show hardware support on a host and are usually hidden in a guest."
    }
   ],
   "completion": "Check CPU virtualization flags and classify the hypervisor: done."
  },
  {
   "id": "23.4",
   "kind": "vm",
   "title": "Audit guest drivers and tools",
   "navSubtitle": "lsmod, guest tools",
   "objective": "102.6",
   "difficulty": "Intermediate",
   "source": "Lab 4: Audit guest drivers and tools",
   "workdir": "~/lpic1-section23",
   "summary": "",
   "scenario": "Users report a slow mouse, a tiny fixed screen size, and no shared clipboard in the training VMs. The platform team suspects the guest drivers or tools are missing.",
   "task": "Find which hypervisor-specific kernel modules, packages, and services are present in your guest.",
   "deliverable": "reports/guest-drivers.txt.",
   "steps": [
    {
     "text": "lsmod | grep -E 'vbox|vmw|vmxnet|hv_|hyperv|virtio|xen' > reports/guest-drivers.txt"
    },
    {
     "cmd": "ls /sys/bus/virtio/drivers >> reports/guest-drivers.txt 2>&1"
    },
    {
     "text": "dpkg -l | grep -E 'virtualbox-guest|open-vm-tools|qemu-guest-agent|spice-vdagent' >> reports/guest-drivers.txt"
    },
    {
     "cmd": "systemctl list-units --type=service | grep -i -E 'vbox|vmtoolsd|open-vm|qemu-guest|spice|hv-' >> reports/guest-drivers.txt"
    },
    {
     "text": "Pick one module name from the first lines and run modinfo -F description followed by that name to see what it does."
    }
   ],
   "validation": "cat reports/guest-drivers.txt and confirm at least one module or package matches your hypervisor: vbox modules or virtualbox-guest packages for VirtualBox, vmw and vmxnet3 or open-vm-tools for VMware, hv_ modules for Hyper-V, virtio drivers or qemu-guest-agent for KVM.",
   "trap": "Guest additions, VMware Tools (open-vm-tools on Linux), Hyper-V integration services, and virtio paravirtualized drivers all do the same job: they let the guest talk to the hypervisor through a fast, purpose-built interface instead of pretending to drive real hardware. Without them disks and networks are slower and extras like display resizing, shared folders, clock sync, and clean shutdown from the host do not work. Some drivers are built into the kernel, so they never show in lsmod; check /sys/bus/virtio/drivers or the boot messages instead.",
   "paste": {
    "command": "cat reports/guest-drivers.txt",
    "checks": [
     {
      "re": "^(vbox|vmw|vmxnet|hv_|hyperv|virtio|xen)\\w*\\s+\\d+\\s+\\d+|^ii\\s+(virtualbox-guest|open-vm-tools|qemu-guest-agent|spice-vdagent)|^virtio_\\w+\\s*$",
      "say": "at least one guest driver module or guest-tools package is listed"
     }
    ]
   },
   "quiz": [
    {
     "id": "pv",
     "prompt": "What do paravirtualized drivers such as virtio do?",
     "answer": "fast",
     "options": [
      {
       "value": "fast",
       "label": "Talk to the hypervisor through a purpose-built interface, which is faster than emulated hardware"
      },
      {
       "value": "host",
       "label": "Let the guest control the host"
      },
      {
       "value": "sec",
       "label": "Encrypt guest disks"
      }
     ],
     "explain": "Correct. Guest tools add display resizing, clipboard and time sync too."
    },
    {
     "id": "builtin",
     "prompt": "A virtio driver is in use but not in <code>lsmod</code>. Why?",
     "answer": "builtin",
     "options": [
      {
       "value": "builtin",
       "label": "It's built into the kernel, not a module"
      },
      {
       "value": "broken",
       "label": "It failed to load"
      },
      {
       "value": "root",
       "label": "lsmod needs root to show it"
      }
     ],
     "explain": "Correct. Check /sys/bus/virtio/drivers instead."
    }
   ],
   "completion": "Audit guest drivers and tools: done."
  },
  {
   "id": "23.5",
   "kind": "vm",
   "title": "Regenerate the D-Bus machine ID on a cloned guest",
   "navSubtitle": "machine-id, dbus-uuidgen",
   "objective": "102.6",
   "difficulty": "Intermediate",
   "source": "Lab 5: Regenerate the D-Bus machine ID on a cloned guest",
   "workdir": "~/lpic1-section23",
   "summary": "",
   "scenario": "Twenty VMs were cloned from the web01 template, and the log server merges their journals because they all report the same machine ID. You are asked to show the ID on your own VM and rehearse the fix on the template copy.",
   "task": "Record your VM's machine ID safely, then replace the duplicated ID in clone-root and prove both ID paths agree.",
   "deliverable": "reports/machine-id.txt.",
   "steps": [
    {
     "cmd": "cat /etc/machine-id > reports/machine-id.txt"
    },
    {
     "cmd": "ls -l /var/lib/dbus/machine-id >> reports/machine-id.txt"
    },
    {
     "text": "hostnamectl | grep -i 'machine id' >> reports/machine-id.txt"
    },
    {
     "cmd": "cat clone-root/etc/machine-id >> reports/machine-id.txt"
    },
    {
     "cmd": "rm clone-root/etc/machine-id"
    },
    {
     "text": "dbus-uuidgen --ensure=clone-root/etc/machine-id"
    },
    {
     "cmd": "cat clone-root/etc/machine-id clone-root/var/lib/dbus/machine-id >> reports/machine-id.txt"
    },
    {
     "text": "Don't run on your VM: the real procedure on a clone is sudo rm -f /etc/machine-id /var/lib/dbus/machine-id, then sudo systemd-machine-id-setup, then sudo ln -s /etc/machine-id /var/lib/dbus/machine-id, then a reboot. Distributions differ, so check their documentation first."
    }
   ],
   "validation": "cat reports/machine-id.txt. The template ID 0123... appears once, followed by two identical new 32-character IDs. wc -c clone-root/etc/machine-id reports 33 (32 hex digits plus a newline).",
   "trap": "/etc/machine-id is used by systemd and journald, and D-Bus reads /var/lib/dbus/machine-id, which on Mint is a symlink to it. Remove both or they disagree. On a template you are about to seal, the cleaner method is to leave /etc/machine-id as an empty file (truncate -s 0) so a fresh ID is generated on first boot; deleting it entirely can stop some systems from booting cleanly. You can preview a new ID without writing anything using dbus-uuidgen or systemd-id128 new.",
   "paste": {
    "command": "cat reports/machine-id.txt",
    "checks": [
     {
      "re": "^0123456789abcdef0123456789abcdef\\s*$",
      "say": "the template ID appears only once",
      "count": 1
     },
     {
      "re": "^([0-9a-f]{32})[ \\t]*\\n\\1[ \\t]*$",
      "say": "the two new IDs at the end match each other"
     },
     {
      "re": "Machine ID:\\s*[0-9a-f]{32}",
      "say": "hostnamectl shows your VM's machine ID"
     }
    ]
   },
   "quiz": [
    {
     "id": "dbusid",
     "prompt": "On Mint, what is <code>/var/lib/dbus/machine-id</code>?",
     "answer": "link",
     "options": [
      {
       "value": "link",
       "label": "A symlink to /etc/machine-id"
      },
      {
       "value": "own",
       "label": "A separate ID that must differ"
      },
      {
       "value": "dir",
       "label": "A directory of IDs"
      }
     ],
     "explain": "Correct. Keep both paths in agreement."
    },
    {
     "id": "seal",
     "prompt": "How do you seal a template so each clone gets a new ID on first boot?",
     "answer": "empty",
     "options": [
      {
       "value": "empty",
       "label": "Leave /etc/machine-id as an empty file"
      },
      {
       "value": "same",
       "label": "Copy a fixed ID into it"
      },
      {
       "value": "chmod",
       "label": "Make it read-only"
      }
     ],
     "explain": "Correct. truncate -s 0 /etc/machine-id."
    }
   ],
   "completion": "Regenerate the D-Bus machine ID on a cloned guest: done."
  },
  {
   "id": "23.6",
   "kind": "vm",
   "title": "Replace duplicated SSH host keys",
   "navSubtitle": "ssh-keygen -A, -lf",
   "objective": "102.6",
   "difficulty": "Intermediate",
   "source": "Lab 6: Replace duplicated SSH host keys",
   "workdir": "~/lpic1-section23",
   "summary": "",
   "scenario": "After cloning, users connecting to web02 and web03 never got a new-host prompt, and the security team points out that every clone presents web01's SSH host key. Anyone holding that private key could impersonate all of them.",
   "task": "Record the template's host key fingerprints in clone-root, delete the keys, generate new ones, and prove they changed.",
   "deliverable": "reports/hostkeys-before.txt and reports/hostkeys-after.txt.",
   "steps": [
    {
     "text": "for f in clone-root/etc/ssh/ssh_host_*_key.pub; do ssh-keygen -lf \"$f\"; done > reports/hostkeys-before.txt"
    },
    {
     "cmd": "rm clone-root/etc/ssh/ssh_host_*"
    },
    {
     "text": "ssh-keygen -q -A -f clone-root"
    },
    {
     "text": "for f in clone-root/etc/ssh/ssh_host_*_key.pub; do ssh-keygen -lf \"$f\"; done > reports/hostkeys-after.txt"
    },
    {
     "text": "Run ls -l /etc/ssh/ssh_host_* > reports/vm-hostkeys.txt 2>&1 to see whether your own VM has host keys at all. Mint does not install the SSH server by default, so No such file is normal."
    },
    {
     "text": "Don't run on your VM: on a real clone the fix is sudo rm /etc/ssh/ssh_host_*, then sudo ssh-keygen -A (or sudo dpkg-reconfigure openssh-server), then sudo systemctl restart ssh."
    }
   ],
   "validation": "diff reports/hostkeys-before.txt reports/hostkeys-after.txt shows every fingerprint changed, and both files list the same key types (ECDSA, ED25519, and RSA on Mint).",
   "trap": "ssh-keygen -A only creates keys that are missing, which is why you delete the old ones first; -f gives it a prefix folder, which is handy when working on a mounted image. Clients that saw the old key will warn REMOTE HOST IDENTIFICATION HAS CHANGED; remove the stale entry with ssh-keygen -R web02 after confirming the change is expected.",
   "paste": {
    "command": "cat reports/hostkeys-before.txt reports/hostkeys-after.txt",
    "checks": [
     {
      "re": "SHA256:\\S+ .*\\(ECDSA\\)",
      "say": "ECDSA fingerprints before and after",
      "min": 2
     },
     {
      "re": "SHA256:\\S+ .*\\(ED25519\\)",
      "say": "ED25519 fingerprints before and after",
      "min": 2
     },
     {
      "re": "SHA256:\\S+ .*\\(RSA\\)",
      "say": "RSA fingerprints before and after",
      "min": 2
     },
     {
      "re": "(SHA256:[A-Za-z0-9+/]{43})[\\s\\S]*\\1",
      "say": "no fingerprint appears twice, so every key changed",
      "absent": true
     }
    ]
   },
   "quiz": [
    {
     "id": "dashA",
     "prompt": "Why delete the old host keys before <code>ssh-keygen -A</code>?",
     "answer": "missing",
     "options": [
      {
       "value": "missing",
       "label": "-A only creates key types that are missing"
      },
      {
       "value": "perm",
       "label": "-A can't overwrite root-owned files"
      },
      {
       "value": "speed",
       "label": "It runs faster"
      }
     ],
     "explain": "Correct."
    },
    {
     "id": "dashR",
     "prompt": "A client warns REMOTE HOST IDENTIFICATION HAS CHANGED after an expected rekey. What clears it?",
     "answer": "R",
     "options": [
      {
       "value": "R",
       "label": "<code>ssh-keygen -R web02</code>"
      },
      {
       "value": "A",
       "label": "<code>ssh-keygen -A</code>"
      },
      {
       "value": "copy",
       "label": "<code>ssh-copy-id web02</code>"
      }
     ],
     "explain": "Correct. It removes the stale known_hosts entry."
    }
   ],
   "completion": "Replace duplicated SSH host keys: done."
  },
  {
   "id": "23.7",
   "kind": "vm",
   "title": "Build and apply a clone identity checklist",
   "navSubtitle": "Clone identity checklist",
   "objective": "102.6",
   "difficulty": "Intermediate",
   "source": "Lab 7: Build and apply a clone identity checklist",
   "workdir": "~/lpic1-section23",
   "summary": "",
   "scenario": "web02 is being built from the web01 template. Before it joins the network, the change ticket asks for every identity setting that must differ from the template, with proof each was changed.",
   "task": "Find the template identity values in clone-root, collect your live VM's equivalents, then change hostname, IP address, and MAC address for web02.",
   "deliverable": "reports/clone-checklist.txt and an updated clone-root.",
   "steps": [
    {
     "cmd": "grep -r -n -E 'web01|UUID=|macaddress|addresses' clone-root/etc > reports/clone-checklist.txt"
    },
    {
     "text": "hostname >> reports/clone-checklist.txt"
    },
    {
     "text": "ip -br link >> reports/clone-checklist.txt"
    },
    {
     "text": "ip -br addr >> reports/clone-checklist.txt"
    },
    {
     "cmd": "findmnt -no SOURCE,UUID / >> reports/clone-checklist.txt"
    },
    {
     "text": "nmcli -f NAME,UUID,DEVICE connection show >> reports/clone-checklist.txt"
    },
    {
     "text": "sed -i 's/web01/web02/' clone-root/etc/hostname clone-root/etc/hosts"
    },
    {
     "text": "sed -i 's/08:00:27:aa:bb:01/08:00:27:aa:bb:02/; s#10.20.0.11/24#10.20.0.12/24#' clone-root/etc/netplan/01-static.yaml"
    },
    {
     "text": "Add a line to the checklist for each item, marked done or not needed: hostname, hosts entry, static IP, MAC, machine ID (Lab 5), SSH host keys (Lab 6), filesystem UUIDs."
    }
   ],
   "validation": "grep -r web01 clone-root/etc returns nothing, and grep -r -E 'web02|bb:02|10.20.0.12' clone-root/etc shows the three new values.",
   "trap": "Change a filesystem UUID in fstab only if you also changed the filesystem itself (for example tune2fs -U random on an unmounted ext4 file system). If the two disagree the clone will not mount its root file system at boot. Most hypervisors offer to generate new MAC addresses when cloning; accept it, or two guests on one network will fight over the same address.",
   "paste": {
    "command": "cat reports/clone-checklist.txt; grep -r -E 'web0|aa:bb:|10\\.20\\.0\\.' clone-root/etc",
    "checks": [
     {
      "re": "^clone-root/etc/hostname:web02\\s*$",
      "say": "clone-root's hostname is now web02"
     },
     {
      "re": "^clone-root/etc/netplan/01-static\\.yaml:\\s+macaddress:\\s*\\\"?08:00:27:aa:bb:02",
      "say": "the netplan MAC is now 08:00:27:aa:bb:02"
     },
     {
      "re": "^clone-root/etc/netplan/01-static\\.yaml:\\s+addresses:\\s*\\[10\\.20\\.0\\.12/24\\]",
      "say": "the static IP is now 10.20.0.12/24"
     },
     {
      "re": "^clone-root/etc/[^:\\s]+:(127\\.0\\.1\\.1\\s+)?web01\\s*$",
      "say": "no web01 value is left in clone-root",
      "absent": true
     }
    ]
   },
   "quiz": [
    {
     "id": "uuidfs",
     "prompt": "When should you change the filesystem UUID in a clone's fstab?",
     "answer": "both",
     "options": [
      {
       "value": "both",
       "label": "Only if you also changed the filesystem's UUID (for example tune2fs -U)"
      },
      {
       "value": "always",
       "label": "Always, on every clone"
      },
      {
       "value": "never",
       "label": "Never; it's ignored at boot"
      }
     ],
     "explain": "Correct. If they disagree, root won't mount."
    },
    {
     "id": "mac",
     "prompt": "Two clones share a MAC address on one network. What happens?",
     "answer": "fight",
     "options": [
      {
       "value": "fight",
       "label": "They fight over the address and traffic breaks"
      },
      {
       "value": "fine",
       "label": "Nothing; the switch handles it"
      },
      {
       "value": "dhcp",
       "label": "DHCP gives them each a new MAC"
      }
     ],
     "explain": "Correct. Let the hypervisor generate new MACs when cloning."
    }
   ],
   "completion": "Build and apply a clone identity checklist: done."
  },
  {
   "id": "23.8",
   "kind": "vm",
   "title": "Show what a container shares with its host",
   "navSubtitle": "unshare, namespaces",
   "objective": "102.6",
   "difficulty": "Advanced",
   "source": "Lab 8: Show what a container shares with its host",
   "workdir": "~/lpic1-section23",
   "summary": "",
   "scenario": "A developer says \"containers are just small VMs.\" Your team lead asks you to demonstrate the real difference using only tools already on the system.",
   "task": "Use Linux namespaces, the building blocks of containers, to give a process its own process list and hostname, and show that it still runs on the host's kernel.",
   "deliverable": "reports/namespace-demo.txt.",
   "steps": [
    {
     "cmd": "sudo unshare --pid --fork --mount-proc ps -ef > reports/namespace-demo.txt"
    },
    {
     "cmd": "sudo unshare --uts bash -c 'hostname ctr01; hostname; uname -r' >> reports/namespace-demo.txt"
    },
    {
     "text": "hostname >> reports/namespace-demo.txt"
    },
    {
     "text": "uname -r >> reports/namespace-demo.txt"
    },
    {
     "text": "Compare: inside the namespace ps sees only itself as PID 1 and the hostname is ctr01, but the kernel version is identical to the host's, and the host's hostname did not change."
    }
   ],
   "validation": "cat reports/namespace-demo.txt and confirm the two uname -r lines match and the last hostname line is your normal hostname, not ctr01.",
   "trap": "A container is an isolated group of processes sharing the host kernel, managed by a container engine such as Docker, Podman, or LXD; a VM runs its own kernel on virtual hardware managed by a hypervisor. That is why a container starts in a second and a VM boots. Kubernetes is an orchestration tool that schedules many containers across many hosts; it is not a container engine. Always keep --uts in the hostname command so the change stays inside the namespace.",
   "paste": {
    "command": "cat reports/namespace-demo.txt",
    "checks": [
     {
      "re": "^root\\s+1\\s+0\\s.*\\bps -ef\\s*$",
      "say": "inside the PID namespace ps is PID 1"
     },
     {
      "re": "^ctr01\\s*$",
      "say": "ctr01 appears once, inside the namespace only",
      "count": 1
     },
     {
      "re": "^(\\d+\\.\\d+\\.\\d+\\S*)[ \\t]*\\n(?:[^\\n]*\\n)?\\1[ \\t]*$",
      "say": "the two uname -r lines match"
     }
    ]
   },
   "quiz": [
    {
     "id": "kernel",
     "prompt": "What does a container share with its host that a VM doesn't?",
     "answer": "kernel",
     "options": [
      {
       "value": "kernel",
       "label": "The kernel"
      },
      {
       "value": "fw",
       "label": "The firmware"
      },
      {
       "value": "user",
       "label": "Its user space"
      }
     ],
     "explain": "Correct. A VM boots its own kernel."
    },
    {
     "id": "k8s",
     "prompt": "What is Kubernetes?",
     "answer": "orch",
     "options": [
      {
       "value": "orch",
       "label": "An orchestrator that schedules containers across hosts"
      },
      {
       "value": "engine",
       "label": "A container engine like Docker"
      },
      {
       "value": "hv",
       "label": "A type 1 hypervisor"
      }
     ],
     "explain": "Correct. Docker, Podman and LXD are engines."
    }
   ],
   "completion": "Show what a container shares with its host: done."
  },
  {
   "id": "23.9",
   "kind": "vm",
   "title": "Recommend a cloud service model",
   "navSubtitle": "IaaS, PaaS, SaaS",
   "objective": "102.6",
   "difficulty": "Advanced",
   "source": "Lab 9: Recommend a cloud service model",
   "workdir": "~/lpic1-section23",
   "summary": "",
   "scenario": "Finance wants to move three workloads to a cloud service provider (CSP): a custom inventory app that needs root access to its own Linux server, a web app the developers only want to push code to, and company email. They ask which service model fits each and what they will be billed for.",
   "task": "Write a short recommendation that uses the IaaS, PaaS, and SaaS terms correctly and explains the instance features they will see.",
   "deliverable": "reports/cloud-plan.txt.",
   "steps": [
    {
     "text": "nano reports/cloud-plan.txt"
    },
    {
     "text": "Write one line per workload: IaaS for the inventory app (the CSP runs hardware and virtualization, you run the OS and everything above), PaaS for the web app (the CSP also runs the OS and runtime), and SaaS for email (the CSP runs the whole application)."
    },
    {
     "text": "Add one line each for: instances and how they are billed (by size and running time), elasticity (adding and removing instances as load changes), load balancing (spreading traffic across instances), block storage (a virtual disk attached to one instance) versus object storage (files reached through an API or the portal), and public, private, and hybrid clouds."
    },
    {
     "text": "Add a final line naming the management console or portal as where instances are created, and cloud-init as how a Linux instance receives its settings on first boot."
    }
   ],
   "validation": "grep -c -E 'IaaS|PaaS|SaaS' reports/cloud-plan.txt returns at least 3, and grep -i -E 'elastic|block|object|hybrid' reports/cloud-plan.txt finds each term.",
   "trap": "The models differ in who manages which layer, not in whether VMs exist. LPIC-1 focuses on IaaS because that is where you get a Linux guest to administer. Elasticity and load balancing are often confused: elasticity changes how many instances exist, load balancing shares traffic among the ones that do.",
   "paste": {
    "command": "cat reports/cloud-plan.txt",
    "checks": [
     {
      "re": "\\b(IaaS|PaaS|SaaS)\\b",
      "say": "the service models are named",
      "min": 3
     },
     {
      "re": "\\belastic",
      "say": "covers elasticity"
     },
     {
      "re": "\\bblock\\b[\\s\\S]*\\bobject\\b|\\bobject\\b[\\s\\S]*\\bblock\\b",
      "say": "covers block and object storage"
     },
     {
      "re": "\\bhybrid\\b",
      "say": "covers hybrid clouds"
     }
    ]
   },
   "quiz": [
    {
     "id": "root",
     "prompt": "A team needs root on its own Linux server in the cloud. Which model?",
     "answer": "iaas",
     "options": [
      {
       "value": "iaas",
       "label": "IaaS"
      },
      {
       "value": "paas",
       "label": "PaaS"
      },
      {
       "value": "saas",
       "label": "SaaS"
      }
     ],
     "explain": "Correct. With IaaS you manage the OS and everything above it."
    },
    {
     "id": "elastic",
     "prompt": "What does elasticity change?",
     "answer": "count",
     "options": [
      {
       "value": "count",
       "label": "How many instances exist as load changes"
      },
      {
       "value": "spread",
       "label": "How traffic is shared among instances"
      },
      {
       "value": "disk",
       "label": "The size of block storage"
      }
     ],
     "explain": "Correct. Sharing traffic is load balancing."
    }
   ],
   "completion": "Recommend a cloud service model: done."
  },
  {
   "id": "23.10",
   "kind": "vm",
   "title": "Prepare cloud-init user data and an access key for an IaaS instance",
   "navSubtitle": "cloud-init, SSH keys",
   "objective": "102.6",
   "difficulty": "Advanced",
   "source": "Lab 10: Prepare cloud-init user data and an access key for an IaaS instance",
   "workdir": "~/lpic1-section23",
   "summary": "",
   "scenario": "A new IaaS instance, app02, is being launched. The cloud team wants a cloud-init file that sets the hostname, creates a deployment account that logs in with an SSH key only, and installs nginx on first boot.",
   "task": "Generate a key pair on your VM, write user-data and meta-data files that use the public key, and validate the YAML.",
   "deliverable": "cloud/user-data, cloud/meta-data, and reports/cloud-init-check.txt.",
   "steps": [
    {
     "text": "ssh-keygen -t ed25519 -N '' -C svc-deploy@admin01 -f keys/cloud-deploy"
    },
    {
     "cmd": "printf '%s\\n' '#cloud-config' 'hostname: app02' 'users:' '  - name: svc-deploy' '    groups: sudo' '    shell: /bin/bash' '    ssh_authorized_keys:' \"      - $(cat keys/cloud-deploy.pub)\" 'packages:' '  - nginx' 'runcmd:' '  - [systemctl, enable, --now, nginx]' > cloud/user-data"
    },
    {
     "cmd": "printf '%s\\n' 'instance-id: app02-0001' 'local-hostname: app02' > cloud/meta-data"
    },
    {
     "cmd": "head -1 cloud/user-data > reports/cloud-init-check.txt"
    },
    {
     "text": "python3 -c 'import sys, yaml; d = yaml.safe_load(open(sys.argv[1])); print(d[\"hostname\"], d[\"users\"][0][\"name\"], len(d[\"users\"][0][\"ssh_authorized_keys\"]))' cloud/user-data >> reports/cloud-init-check.txt"
    },
    {
     "text": "Described only, for the real instance: you would connect with ssh -i keys/cloud-deploy svc-deploy@<instance address>, check progress with cloud-init status --long, and read /var/log/cloud-init.log. For a server without cloud-init, ssh-copy-id -i keys/cloud-deploy.pub user@host copies your public key onto it."
    }
   ],
   "validation": "cat reports/cloud-init-check.txt shows #cloud-config on the first line and app02 svc-deploy 1 on the second.",
   "trap": "The private key (keys/cloud-deploy) never leaves your workstation; only the .pub file goes onto the instance. user-data must start with exactly #cloud-config or cloud-init ignores it, and YAML indentation must be spaces. cloud-init also generates fresh SSH host keys and identity for each new instance, which solves the cloning problems from Labs 5 to 7 automatically. Do not install cloud-init on your desktop VM; it is meant for cloud images and can rewrite network settings at boot.",
   "paste": {
    "command": "cat reports/cloud-init-check.txt cloud/meta-data",
    "checks": [
     {
      "re": "^#cloud-config\\s*$",
      "say": "user-data starts with #cloud-config"
     },
     {
      "re": "^app02 svc-deploy 1\\s*$",
      "say": "the YAML parsed: hostname app02, user svc-deploy, one key"
     },
     {
      "re": "^instance-id:\\s*\\S+",
      "say": "meta-data has an instance-id"
     },
     {
      "re": "PRIVATE KEY",
      "say": "no private key was pasted",
      "absent": true
     }
    ]
   },
   "quiz": [
    {
     "id": "keydir",
     "prompt": "Which key goes onto the instance?",
     "answer": "pub",
     "options": [
      {
       "value": "pub",
       "label": "The public key (.pub)"
      },
      {
       "value": "priv",
       "label": "The private key"
      },
      {
       "value": "both",
       "label": "Both"
      }
     ],
     "explain": "Correct. The private key stays on your workstation."
    },
    {
     "id": "header",
     "prompt": "What happens if user-data doesn't start with <code>#cloud-config</code>?",
     "answer": "ignored",
     "options": [
      {
       "value": "ignored",
       "label": "cloud-init doesn't treat it as cloud-config"
      },
      {
       "value": "fine",
       "label": "Nothing; the header is optional"
      },
      {
       "value": "boot",
       "label": "The instance won't boot"
      }
     ],
     "explain": "Correct."
    }
   ],
   "completion": "Prepare cloud-init user data and an access key for an IaaS instance: done."
  },
  {
   "id": "23.11",
   "kind": "vm",
   "title": "Run, restart, and remove a Docker container",
   "navSubtitle": "Docker (optional)",
   "objective": "102.6",
   "difficulty": "Advanced",
   "source": "Lab 11 (optional): Run, restart, and remove a Docker container",
   "workdir": "~/lpic1-section23",
   "summary": "",
   "scenario": "The development team is evaluating Docker and wants a short proof of the container life cycle on a Linux guest: create, exit, restart, inspect, and delete. This lab installs Docker and removes it afterwards; skip it if you prefer not to install software or have no internet access.",
   "task": "Install the Docker engine, run an Alpine Linux container, restart it, compare its kernel with the host's, remove it, and uninstall Docker.",
   "deliverable": "reports/docker-lab.txt.",
   "steps": [
    {
     "cmd": "sudo apt install docker.io"
    },
    {
     "cmd": "sudo docker ps -a > reports/docker-lab.txt"
    },
    {
     "cmd": "sudo docker run -it --name lab23 alpine:3.20 sh"
    },
    {
     "text": "Inside the container run cat /etc/os-release and uname -r, then type exit."
    },
    {
     "cmd": "sudo docker ps -a >> reports/docker-lab.txt"
    },
    {
     "cmd": "sudo docker start lab23"
    },
    {
     "cmd": "sudo docker exec lab23 uname -r >> reports/docker-lab.txt"
    },
    {
     "text": "uname -r >> reports/docker-lab.txt"
    },
    {
     "cmd": "sudo docker stop lab23"
    },
    {
     "cmd": "sudo docker rm lab23"
    },
    {
     "cmd": "sudo docker ps -a >> reports/docker-lab.txt"
    },
    {
     "text": "Cleanup: sudo docker rmi alpine:3.20"
    },
    {
     "cmd": "sudo apt purge docker.io"
    },
    {
     "cmd": "sudo apt autoremove --purge"
    },
    {
     "cmd": "sudo rm -rf /var/lib/docker /var/lib/containerd"
    },
    {
     "cmd": "sudo ip link delete docker0 2>/dev/null; getent group docker && sudo groupdel docker"
    }
   ],
   "validation": "cat reports/docker-lab.txt: the first and last docker ps -a listings show only headers, the middle one shows lab23 as Exited, and the two uname -r lines match. command -v docker returns nothing after cleanup.",
   "trap": "docker ps shows only running containers; add -a to see stopped ones. An exited container still exists until docker rm removes it, and its image stays until docker rmi. The matching kernel versions prove the Alpine container is not a VM: it uses the Mint kernel even though its user space is a different distribution.",
   "paste": {
    "command": "cat reports/docker-lab.txt",
    "checks": [
     {
      "re": "^CONTAINER ID\\s+IMAGE",
      "say": "all three docker ps -a listings are there",
      "count": 3
     },
     {
      "re": "alpine:3\\.20\\s.*Exited \\(\\d+\\).*\\blab23\\s*$",
      "say": "the middle listing shows lab23 as Exited"
     },
     {
      "re": "\\blab23\\b",
      "say": "lab23 appears only once, so it was removed",
      "count": 1
     },
     {
      "re": "^(\\d+\\.\\d+\\.\\d+\\S*)[ \\t]*\\n\\1[ \\t]*$",
      "say": "the container's and host's uname -r lines match"
     }
    ]
   },
   "quiz": [
    {
     "id": "psa",
     "prompt": "Which command lists stopped containers too?",
     "answer": "a",
     "options": [
      {
       "value": "a",
       "label": "<code>docker ps -a</code>"
      },
      {
       "value": "ps",
       "label": "<code>docker ps</code>"
      },
      {
       "value": "img",
       "label": "<code>docker images</code>"
      }
     ],
     "explain": "Correct. Plain docker ps shows only running ones."
    },
    {
     "id": "rmi",
     "prompt": "After <code>docker rm lab23</code>, what is left?",
     "answer": "image",
     "options": [
      {
       "value": "image",
       "label": "The alpine image, until docker rmi"
      },
      {
       "value": "none",
       "label": "Nothing"
      },
      {
       "value": "ctr",
       "label": "The stopped container"
      }
     ],
     "explain": "Correct."
    }
   ],
   "completion": "Run, restart, and remove a Docker container: done."
  }
 ],
 "review": {
  "traps": [
   "Mixing up hypervisor types. Type 1 runs directly on the hardware (Xen, VMware ESXi, Hyper-V); type 2 runs as an application on a host OS (VirtualBox, VMware Workstation). KVM is in the Linux kernel and is often called type 1 or a hybrid.",
   "Mixing up host and guest. The host is the physical machine and its OS; the guest is the VM and its OS. Objective 102.6 is about Linux as the guest.",
   "Thinking a container has its own kernel. Containers share the host kernel and carry only the libraries and binaries their application needs.",
   "Calling Kubernetes a container engine. Docker, Podman, and LXD are engines that run containers; Kubernetes orchestrates many containers across hosts.",
   "Looking for vmx or svm inside a guest to prove it is virtual. Those flags show hardware support on a host; the hypervisor flag in /proc/cpuinfo, systemd-detect-virt, or the DMI vendor shows that you are a guest.",
   "Forgetting what guest drivers do. Guest additions, VMware Tools, and virtio paravirtualized drivers speed up disk and network I/O and add display, clipboard, time sync, and shutdown integration.",
   "Leaving a duplicated /etc/machine-id on a clone. Remove or empty it and regenerate (systemd-machine-id-setup or dbus-uuidgen --ensure), and keep /var/lib/dbus/machine-id matching.",
   "Leaving duplicated SSH host keys on clones. Delete /etc/ssh/ssh_host_* and run ssh-keygen -A, or let cloud-init do it on first boot.",
   "Forgetting the rest of a clone's identity: hostname, static IP, MAC address, and any UUIDs in configuration files.",
   "Treating clone and template as the same thing. A clone is a bootable copy of a VM; a template is a master used to create VMs and is not booted itself. OVF is the open format for exporting a VM, and OVA packs it into a single file.",
   "Using \"image\" carelessly. It can mean a disk image, an exported VM, or a cloud machine image, so read the question's context.",
   "Mixing up IaaS, PaaS, and SaaS. IaaS gives you the OS to manage, PaaS gives you only your application and data, and SaaS gives you a finished application.",
   "Confusing elasticity with load balancing, and block storage with object storage.",
   "Getting SSH key direction backwards. You generate the key pair on your own machine and place the public key on the instance (ssh-copy-id or cloud-init); the private key stays with you."
  ],
  "trapQuiz": [
   {
    "id": "tq1",
    "prompt": "Which is a type 1 hypervisor?",
    "answer": "esxi",
    "options": [
     {
      "value": "esxi",
      "label": "VMware ESXi"
     },
     {
      "value": "vbox",
      "label": "VirtualBox"
     },
     {
      "value": "ws",
      "label": "VMware Workstation"
     }
    ],
    "explain": "Correct. It runs directly on the hardware."
   },
   {
    "id": "tq2",
    "prompt": "Objective 102.6 is about Linux as the...",
    "answer": "guest",
    "options": [
     {
      "value": "guest",
      "label": "Guest"
     },
     {
      "value": "host",
      "label": "Host"
     },
     {
      "value": "hv",
      "label": "Hypervisor"
     }
    ],
    "explain": "Correct."
   },
   {
    "id": "tq3",
    "prompt": "Does a container have its own kernel?",
    "answer": "no",
    "options": [
     {
      "value": "no",
      "label": "No, it shares the host's"
     },
     {
      "value": "yes",
      "label": "Yes, a small one"
     },
     {
      "value": "some",
      "label": "Only on Docker"
     }
    ],
    "explain": "Correct."
   },
   {
    "id": "tq4",
    "prompt": "Which proves you are inside a guest?",
    "answer": "hv",
    "options": [
     {
      "value": "hv",
      "label": "The <code>hypervisor</code> flag in /proc/cpuinfo"
     },
     {
      "value": "vmx",
      "label": "The <code>vmx</code> flag"
     },
     {
      "value": "svm",
      "label": "The <code>svm</code> flag"
     }
    ],
    "explain": "Correct. vmx and svm show host hardware support."
   },
   {
    "id": "tq5",
    "prompt": "What fixes a clone's duplicated machine ID?",
    "answer": "regen",
    "options": [
     {
      "value": "regen",
      "label": "Remove or empty /etc/machine-id and run systemd-machine-id-setup"
     },
     {
      "value": "host",
      "label": "Change the hostname"
     },
     {
      "value": "reboot",
      "label": "A reboot alone"
     }
    ],
    "explain": "Correct. Keep /var/lib/dbus/machine-id matching."
   },
   {
    "id": "tq6",
    "prompt": "What is the difference between a clone and a template?",
    "answer": "tmpl",
    "options": [
     {
      "value": "tmpl",
      "label": "A clone is a bootable copy; a template is a master that isn't booted"
     },
     {
      "value": "same",
      "label": "They're the same"
     },
     {
      "value": "ovf",
      "label": "A template is always an OVA file"
     }
    ],
    "explain": "Correct."
   },
   {
    "id": "tq7",
    "prompt": "Block storage versus object storage?",
    "answer": "block",
    "options": [
     {
      "value": "block",
      "label": "Block is a virtual disk on one instance; object is reached through an API"
     },
     {
      "value": "rev",
      "label": "Object is a virtual disk; block uses an API"
     },
     {
      "value": "same",
      "label": "Two names for the same thing"
     }
    ],
    "explain": "Correct."
   },
   {
    "id": "tq8",
    "prompt": "Where is an SSH key pair for a cloud instance generated?",
    "answer": "local",
    "options": [
     {
      "value": "local",
      "label": "On your own machine; only the public key goes to the instance"
     },
     {
      "value": "inst",
      "label": "On the instance; you copy the private key home"
     },
     {
      "value": "csp",
      "label": "In the CSP portal only"
     }
    ],
    "explain": "Correct."
   }
  ],
  "challenge": {
   "intro": "Complete these tasks without notes, using only your Linux Mint VM and ~/lpic1-section23. Rerun Step 4 of the Lab Setup first so clone-root starts as a fresh copy of the web01 template.",
   "tasks": [
    "Prove with two different commands whether your Mint system is a VM, and name the hypervisor. Save the evidence to reports/challenge-platform.txt.",
    "Show the firmware vendor and product name without using sudo, then with dmidecode.",
    "List the guest drivers or tools your VM is using and say which hypervisor they belong to.",
    "Give clone-root a new machine ID and show that both machine ID paths agree.",
    "Replace all SSH host keys in clone-root and prove every fingerprint changed.",
    "Turn clone-root into web03 at 10.20.0.13 with MAC 08:00:27:aa:bb:03, and prove no web01 value remains.",
    "Show that a namespaced process has its own hostname and process list but the host's kernel.",
    "Write and validate a cloud-init user-data file for an instance named db01 with a user called svc-backup who logs in with a new SSH key."
   ],
   "outro": "Your final handoff is the reports directory, clone-root, and the cloud folder. For each file, write one sentence explaining what it proves about running Linux as a guest."
  },
  "questions": [
   {
    "q": "Licensing request: “Is this Linux server a physical box or a VM? We need proof, not a guess.”",
    "a": "<code>systemd-detect-virt</code> (and <code>--vm</code>) names the hypervisor or prints <code>none</code>. Back it up with <code>lscpu | grep -i hypervisor</code>, <code>hostnamectl</code>, or <code>cat /sys/class/dmi/id/sys_vendor</code>."
   },
   {
    "q": "Help desk request: “The training VMs have a tiny screen and no shared clipboard. What is missing inside the guest?”",
    "a": "The guest drivers and tools: VirtualBox Guest Additions (virtualbox-guest-utils and -x11), open-vm-tools on VMware, or spice-vdagent on KVM. Check with <code>lsmod</code>, <code>dpkg -l</code> and <code>systemctl</code>, install the right package, and reboot."
   },
   {
    "q": "Logging team request: “All our cloned VMs report the same machine ID and their journals are merging. Fix the clones.”",
    "a": "On each clone: <code>sudo rm -f /etc/machine-id /var/lib/dbus/machine-id</code>, <code>sudo systemd-machine-id-setup</code>, <code>sudo ln -s /etc/machine-id /var/lib/dbus/machine-id</code>, then reboot. For future clones, leave /etc/machine-id empty on the template."
   },
   {
    "q": "Security request: “Every server cloned from the template presents the same SSH host key. What do you change on each clone?”",
    "a": "On each clone: <code>sudo rm /etc/ssh/ssh_host_*</code>, <code>sudo ssh-keygen -A</code>, <code>sudo systemctl restart ssh</code>. Clients then clear the old entry with <code>ssh-keygen -R HOST</code>."
   },
   {
    "q": "Change ticket request: “List everything that must be different on web02 before it is built from the web01 template.”",
    "a": "Hostname and /etc/hosts entry, static IP, MAC address, machine ID, SSH host keys, and any filesystem or connection UUIDs (change fstab only if the filesystem UUID changed too)."
   },
   {
    "q": "Developer request: “Aren't containers just small VMs? Show me the difference on this server.”",
    "a": "Run <code>sudo unshare --pid --fork --mount-proc ps -ef</code> (ps is PID 1) and <code>sudo unshare --uts bash -c 'hostname ctr01; uname -r'</code>. The process list and hostname are separate, but <code>uname -r</code> matches the host: a container shares the host kernel, a VM runs its own."
   },
   {
    "q": "Cloud team request: “Launch app02 so it names itself, creates our deploy account with key-only login, and installs nginx on first boot.”",
    "a": "A cloud-init user-data file starting with <code>#cloud-config</code> that sets <code>hostname: app02</code>, creates the user under <code>users:</code> with <code>ssh_authorized_keys</code> (the .pub key only), and lists nginx under <code>packages:</code>. Check it with <code>cloud-init status --long</code> after boot."
   }
  ],
  "mastery": [
   "I can explain host, guest, hypervisor, VM, and instance, and why \"image\" has several meanings.",
   "I can tell type 1 from type 2 hypervisors and give examples of each, and explain where KVM fits.",
   "I can prove a Linux system is a guest with systemd-detect-virt, lscpu, hostnamectl, and /proc/cpuinfo.",
   "I can read the virtual hardware vendor from /sys/class/dmi/id and with dmidecode.",
   "I can explain what vmx and svm mean and why they are usually missing inside a guest.",
   "I can find guest drivers and tools with lsmod, dpkg, and systemctl, and explain what paravirtualized drivers do.",
   "I can explain clones, templates, and OVF/OVA exports.",
   "I can regenerate the D-Bus machine ID and keep /etc/machine-id and /var/lib/dbus/machine-id in agreement.",
   "I can regenerate SSH host keys on a cloned guest and clear a stale known_hosts entry.",
   "I can list every identity setting that must change on a clone: hostname, IP, MAC, machine ID, host keys, and UUIDs.",
   "I can explain how containers differ from VMs, and the difference between a container engine and an orchestration tool.",
   "I can define IaaS, PaaS, SaaS, elasticity, load balancing, and block and object storage, and write a basic cloud-init user-data file."
  ]
 }
});
