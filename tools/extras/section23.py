# App-only additions for Section 23: paste checks, one or two quiz questions per lab,
# a trap quiz, and model answers for the practical questions.
NUMBER = 23
TITLE = "Linux as a Virtualization Guest"
OBJECTIVES = ["102.6"]
SOURCE = "LPIC_Section23_Lab_Workbook.docx"
WORKDIR = "~/lpic1-section23"

def chk(re, say, **kw):
    return {"re": re, "say": say, **kw}

def q(id, prompt, answer, options, explain):
    return {"id": id, "prompt": prompt, "answer": answer, "options": options, "explain": explain}

HV = r"(oracle|vmware|microsoft|kvm|qemu|xen|parallels|bochs|amazon|google|bhyve|acrn|powervm|zvm|apple)"
VENDOR = r"(innotek GmbH|VMware, Inc\.|VMware|Microsoft Corporation|QEMU|Xen|Red Hat|Parallels\S*|Amazon EC2|Google)"
UNAME_PAIR = r"^(\d+\.\d+\.\d+\S*)[ \t]*\n(?:[^\n]*\n)?\1[ \t]*$"

LABS = {
    1: dict(level="Beginner", nav="systemd-detect-virt, lscpu",
        paste={"command": "cat reports/virt-detect.txt", "checks": [
            chk(r"^" + HV + r"\s*$", "systemd-detect-virt and --vm both name a hypervisor", min=2),
            chk(r"^none\s*$", "the --container line shows none"),
            chk(r"Hypervisor vendor:\s+\S+", "lscpu names a hypervisor vendor")]},
        quiz=[q("bare", "On bare metal, what does <code>systemd-detect-virt</code> print?", "none",
                [{"value": "none", "label": "<code>none</code>, with exit status 1"}, {"value": "err", "label": "An error message"}, {"value": "phys", "label": "<code>physical</code>"}],
                "Correct. Exit status 1 there isn't an error."),
              q("vmflag", "Which option asks only whether the system is a VM, ignoring containers?", "vm",
                [{"value": "vm", "label": "<code>--vm</code>"}, {"value": "c", "label": "<code>--container</code>"}, {"value": "q", "label": "<code>--quiet</code>"}],
                "Correct. The plain command reports a container first if there is one.")]),
    2: dict(level="Beginner", nav="/sys/class/dmi, dmidecode",
        paste={"command": "cat reports/dmi.txt", "checks": [
            chk(r"^\s*(Manufacturer:\s*)?" + VENDOR, "the hypervisor vendor shows in /sys, dmidecode -s and dmidecode -t", min=3),
            chk(r"Product Name:\s+\S+", "dmidecode -t system shows the product name"),
            chk(r"UUID:\s+[0-9a-f]{8}-[0-9a-f]{4}-", "dmidecode shows the system UUID")]},
        quiz=[q("innotek", "Why does a VirtualBox guest report its vendor as innotek GmbH?", "fw",
                [{"value": "fw", "label": "The hypervisor writes the virtual firmware tables"}, {"value": "pc", "label": "It's the PC maker"}, {"value": "bug", "label": "The asset tool has a bug"}],
                "Correct. innotek wrote VirtualBox before Sun and Oracle bought it."),
              q("dmiroot", "Why does <code>dmidecode</code> need sudo?", "raw",
                [{"value": "raw", "label": "It reads raw firmware memory"}, {"value": "write", "label": "It writes to the BIOS"}, {"value": "net", "label": "It contacts the hypervisor over the network"}],
                "Correct. Most of /sys/class/dmi/id is readable without it.")]),
    3: dict(level="Beginner", nav="vmx/svm, type 1 vs 2",
        paste={"command": "cat reports/cpu-virt.txt reports/hypervisor-type.txt", "checks": [
            chk(r"^\d+\s*$", "the vmx/svm count and nproc are there", min=2),
            chk(r"^hypervisor\s*$", "the hypervisor CPU flag is present"),
            chk(r"^Mem:", "free -h output is included"),
            chk(r"type\s*(1|2|one|two)\b", "your note classifies the hypervisor as type 1 or type 2")]},
        quiz=[q("t2", "Which is a type 2 hypervisor?", "vbox",
                [{"value": "vbox", "label": "VirtualBox"}, {"value": "esxi", "label": "VMware ESXi"}, {"value": "xen", "label": "Xen"}, {"value": "hv", "label": "Hyper-V"}],
                "Correct. It runs as an application on a host OS."),
              q("flaghv", "Inside a guest, which <code>/proc/cpuinfo</code> flag shows you are virtualized?", "hypervisor",
                [{"value": "hypervisor", "label": "<code>hypervisor</code>"}, {"value": "vmx", "label": "<code>vmx</code>"}, {"value": "svm", "label": "<code>svm</code>"}],
                "Correct. vmx and svm show hardware support on a host and are usually hidden in a guest.")]),
    4: dict(level="Intermediate", nav="lsmod, guest tools",
        paste={"command": "cat reports/guest-drivers.txt", "checks": [
            chk(r"^(vbox|vmw|vmxnet|hv_|hyperv|virtio|xen)\w*\s+\d+\s+\d+|^ii\s+(virtualbox-guest|open-vm-tools|qemu-guest-agent|spice-vdagent)|^virtio_\w+\s*$",
                "at least one guest driver module or guest-tools package is listed")]},
        quiz=[q("pv", "What do paravirtualized drivers such as virtio do?", "fast",
                [{"value": "fast", "label": "Talk to the hypervisor through a purpose-built interface, which is faster than emulated hardware"}, {"value": "host", "label": "Let the guest control the host"}, {"value": "sec", "label": "Encrypt guest disks"}],
                "Correct. Guest tools add display resizing, clipboard and time sync too."),
              q("builtin", "A virtio driver is in use but not in <code>lsmod</code>. Why?", "builtin",
                [{"value": "builtin", "label": "It's built into the kernel, not a module"}, {"value": "broken", "label": "It failed to load"}, {"value": "root", "label": "lsmod needs root to show it"}],
                "Correct. Check /sys/bus/virtio/drivers instead.")]),
    5: dict(level="Intermediate", nav="machine-id, dbus-uuidgen",
        paste={"command": "cat reports/machine-id.txt", "checks": [
            chk(r"^0123456789abcdef0123456789abcdef\s*$", "the template ID appears only once", count=1),
            chk(r"^([0-9a-f]{32})[ \t]*\n\1[ \t]*$", "the two new IDs at the end match each other"),
            chk(r"Machine ID:\s*[0-9a-f]{32}", "hostnamectl shows your VM's machine ID")]},
        quiz=[q("dbusid", "On Mint, what is <code>/var/lib/dbus/machine-id</code>?", "link",
                [{"value": "link", "label": "A symlink to /etc/machine-id"}, {"value": "own", "label": "A separate ID that must differ"}, {"value": "dir", "label": "A directory of IDs"}],
                "Correct. Keep both paths in agreement."),
              q("seal", "How do you seal a template so each clone gets a new ID on first boot?", "empty",
                [{"value": "empty", "label": "Leave /etc/machine-id as an empty file"}, {"value": "same", "label": "Copy a fixed ID into it"}, {"value": "chmod", "label": "Make it read-only"}],
                "Correct. truncate -s 0 /etc/machine-id.")]),
    6: dict(level="Intermediate", nav="ssh-keygen -A, -lf",
        paste={"command": "cat reports/hostkeys-before.txt reports/hostkeys-after.txt", "checks": [
            chk(r"SHA256:\S+ .*\(ECDSA\)", "ECDSA fingerprints before and after", min=2),
            chk(r"SHA256:\S+ .*\(ED25519\)", "ED25519 fingerprints before and after", min=2),
            chk(r"SHA256:\S+ .*\(RSA\)", "RSA fingerprints before and after", min=2),
            chk(r"(SHA256:[A-Za-z0-9+/]{43})[\s\S]*\1", "no fingerprint appears twice, so every key changed", absent=True)]},
        quiz=[q("dashA", "Why delete the old host keys before <code>ssh-keygen -A</code>?", "missing",
                [{"value": "missing", "label": "-A only creates key types that are missing"}, {"value": "perm", "label": "-A can't overwrite root-owned files"}, {"value": "speed", "label": "It runs faster"}],
                "Correct."),
              q("dashR", "A client warns REMOTE HOST IDENTIFICATION HAS CHANGED after an expected rekey. What clears it?", "R",
                [{"value": "R", "label": "<code>ssh-keygen -R web02</code>"}, {"value": "A", "label": "<code>ssh-keygen -A</code>"}, {"value": "copy", "label": "<code>ssh-copy-id web02</code>"}],
                "Correct. It removes the stale known_hosts entry.")]),
    7: dict(level="Intermediate", nav="Clone identity checklist",
        paste={"command": "cat reports/clone-checklist.txt; grep -r -E 'web0|aa:bb:|10\\.20\\.0\\.' clone-root/etc", "checks": [
            chk(r"^clone-root/etc/hostname:web02\s*$", "clone-root's hostname is now web02"),
            chk(r"^clone-root/etc/netplan/01-static\.yaml:\s+macaddress:\s*\"?08:00:27:aa:bb:02", "the netplan MAC is now 08:00:27:aa:bb:02"),
            chk(r"^clone-root/etc/netplan/01-static\.yaml:\s+addresses:\s*\[10\.20\.0\.12/24\]", "the static IP is now 10.20.0.12/24"),
            chk(r"^clone-root/etc/[^:\s]+:(127\.0\.1\.1\s+)?web01\s*$", "no web01 value is left in clone-root", absent=True)]},
        quiz=[q("uuidfs", "When should you change the filesystem UUID in a clone's fstab?", "both",
                [{"value": "both", "label": "Only if you also changed the filesystem's UUID (for example tune2fs -U)"}, {"value": "always", "label": "Always, on every clone"}, {"value": "never", "label": "Never; it's ignored at boot"}],
                "Correct. If they disagree, root won't mount."),
              q("mac", "Two clones share a MAC address on one network. What happens?", "fight",
                [{"value": "fight", "label": "They fight over the address and traffic breaks"}, {"value": "fine", "label": "Nothing; the switch handles it"}, {"value": "dhcp", "label": "DHCP gives them each a new MAC"}],
                "Correct. Let the hypervisor generate new MACs when cloning.")]),
    8: dict(level="Advanced", nav="unshare, namespaces",
        paste={"command": "cat reports/namespace-demo.txt", "checks": [
            chk(r"^root\s+1\s+0\s.*\bps -ef\s*$", "inside the PID namespace ps is PID 1"),
            chk(r"^ctr01\s*$", "ctr01 appears once, inside the namespace only", count=1),
            chk(UNAME_PAIR, "the two uname -r lines match")]},
        quiz=[q("kernel", "What does a container share with its host that a VM doesn't?", "kernel",
                [{"value": "kernel", "label": "The kernel"}, {"value": "fw", "label": "The firmware"}, {"value": "user", "label": "Its user space"}],
                "Correct. A VM boots its own kernel."),
              q("k8s", "What is Kubernetes?", "orch",
                [{"value": "orch", "label": "An orchestrator that schedules containers across hosts"}, {"value": "engine", "label": "A container engine like Docker"}, {"value": "hv", "label": "A type 1 hypervisor"}],
                "Correct. Docker, Podman and LXD are engines.")]),
    9: dict(level="Advanced", nav="IaaS, PaaS, SaaS",
        paste={"command": "cat reports/cloud-plan.txt", "checks": [
            chk(r"\b(IaaS|PaaS|SaaS)\b", "the service models are named", min=3),
            chk(r"\belastic", "covers elasticity"),
            chk(r"\bblock\b[\s\S]*\bobject\b|\bobject\b[\s\S]*\bblock\b", "covers block and object storage"),
            chk(r"\bhybrid\b", "covers hybrid clouds")]},
        quiz=[q("root", "A team needs root on its own Linux server in the cloud. Which model?", "iaas",
                [{"value": "iaas", "label": "IaaS"}, {"value": "paas", "label": "PaaS"}, {"value": "saas", "label": "SaaS"}],
                "Correct. With IaaS you manage the OS and everything above it."),
              q("elastic", "What does elasticity change?", "count",
                [{"value": "count", "label": "How many instances exist as load changes"}, {"value": "spread", "label": "How traffic is shared among instances"}, {"value": "disk", "label": "The size of block storage"}],
                "Correct. Sharing traffic is load balancing.")]),
    10: dict(level="Advanced", nav="cloud-init, SSH keys",
        paste={"command": "cat reports/cloud-init-check.txt cloud/meta-data", "checks": [
            chk(r"^#cloud-config\s*$", "user-data starts with #cloud-config"),
            chk(r"^app02 svc-deploy 1\s*$", "the YAML parsed: hostname app02, user svc-deploy, one key"),
            chk(r"^instance-id:\s*\S+", "meta-data has an instance-id"),
            chk(r"PRIVATE KEY", "no private key was pasted", absent=True)]},
        quiz=[q("keydir", "Which key goes onto the instance?", "pub",
                [{"value": "pub", "label": "The public key (.pub)"}, {"value": "priv", "label": "The private key"}, {"value": "both", "label": "Both"}],
                "Correct. The private key stays on your workstation."),
              q("header", "What happens if user-data doesn't start with <code>#cloud-config</code>?", "ignored",
                [{"value": "ignored", "label": "cloud-init doesn't treat it as cloud-config"}, {"value": "fine", "label": "Nothing; the header is optional"}, {"value": "boot", "label": "The instance won't boot"}],
                "Correct.")]),
    11: dict(level="Advanced", nav="Docker (optional)",
        paste={"command": "cat reports/docker-lab.txt", "checks": [
            chk(r"^CONTAINER ID\s+IMAGE", "all three docker ps -a listings are there", count=3),
            chk(r"alpine:3\.20\s.*Exited \(\d+\).*\blab23\s*$", "the middle listing shows lab23 as Exited"),
            chk(r"\blab23\b", "lab23 appears only once, so it was removed", count=1),
            chk(r"^(\d+\.\d+\.\d+\S*)[ \t]*\n\1[ \t]*$", "the container's and host's uname -r lines match")]},
        quiz=[q("psa", "Which command lists stopped containers too?", "a",
                [{"value": "a", "label": "<code>docker ps -a</code>"}, {"value": "ps", "label": "<code>docker ps</code>"}, {"value": "img", "label": "<code>docker images</code>"}],
                "Correct. Plain docker ps shows only running ones."),
              q("rmi", "After <code>docker rm lab23</code>, what is left?", "image",
                [{"value": "image", "label": "The alpine image, until docker rmi"}, {"value": "none", "label": "Nothing"}, {"value": "ctr", "label": "The stopped container"}],
                "Correct.")]),
}

TRAP_QUIZ = [
    q("tq1", "Which is a type 1 hypervisor?", "esxi",
      [{"value": "esxi", "label": "VMware ESXi"}, {"value": "vbox", "label": "VirtualBox"}, {"value": "ws", "label": "VMware Workstation"}], "Correct. It runs directly on the hardware."),
    q("tq2", "Objective 102.6 is about Linux as the...", "guest",
      [{"value": "guest", "label": "Guest"}, {"value": "host", "label": "Host"}, {"value": "hv", "label": "Hypervisor"}], "Correct."),
    q("tq3", "Does a container have its own kernel?", "no",
      [{"value": "no", "label": "No, it shares the host's"}, {"value": "yes", "label": "Yes, a small one"}, {"value": "some", "label": "Only on Docker"}], "Correct."),
    q("tq4", "Which proves you are inside a guest?", "hv",
      [{"value": "hv", "label": "The <code>hypervisor</code> flag in /proc/cpuinfo"}, {"value": "vmx", "label": "The <code>vmx</code> flag"}, {"value": "svm", "label": "The <code>svm</code> flag"}], "Correct. vmx and svm show host hardware support."),
    q("tq5", "What fixes a clone's duplicated machine ID?", "regen",
      [{"value": "regen", "label": "Remove or empty /etc/machine-id and run systemd-machine-id-setup"}, {"value": "host", "label": "Change the hostname"}, {"value": "reboot", "label": "A reboot alone"}], "Correct. Keep /var/lib/dbus/machine-id matching."),
    q("tq6", "What is the difference between a clone and a template?", "tmpl",
      [{"value": "tmpl", "label": "A clone is a bootable copy; a template is a master that isn't booted"}, {"value": "same", "label": "They're the same"}, {"value": "ovf", "label": "A template is always an OVA file"}], "Correct."),
    q("tq7", "Block storage versus object storage?", "block",
      [{"value": "block", "label": "Block is a virtual disk on one instance; object is reached through an API"}, {"value": "rev", "label": "Object is a virtual disk; block uses an API"}, {"value": "same", "label": "Two names for the same thing"}], "Correct."),
    q("tq8", "Where is an SSH key pair for a cloud instance generated?", "local",
      [{"value": "local", "label": "On your own machine; only the public key goes to the instance"}, {"value": "inst", "label": "On the instance; you copy the private key home"}, {"value": "csp", "label": "In the CSP portal only"}], "Correct."),
]

ANSWERS = [
    "<code>systemd-detect-virt</code> (and <code>--vm</code>) names the hypervisor or prints <code>none</code>. Back it up with <code>lscpu | grep -i hypervisor</code>, <code>hostnamectl</code>, or <code>cat /sys/class/dmi/id/sys_vendor</code>.",
    "The guest drivers and tools: VirtualBox Guest Additions (virtualbox-guest-utils and -x11), open-vm-tools on VMware, or spice-vdagent on KVM. Check with <code>lsmod</code>, <code>dpkg -l</code> and <code>systemctl</code>, install the right package, and reboot.",
    "On each clone: <code>sudo rm -f /etc/machine-id /var/lib/dbus/machine-id</code>, <code>sudo systemd-machine-id-setup</code>, <code>sudo ln -s /etc/machine-id /var/lib/dbus/machine-id</code>, then reboot. For future clones, leave /etc/machine-id empty on the template.",
    "On each clone: <code>sudo rm /etc/ssh/ssh_host_*</code>, <code>sudo ssh-keygen -A</code>, <code>sudo systemctl restart ssh</code>. Clients then clear the old entry with <code>ssh-keygen -R HOST</code>.",
    "Hostname and /etc/hosts entry, static IP, MAC address, machine ID, SSH host keys, and any filesystem or connection UUIDs (change fstab only if the filesystem UUID changed too).",
    "Run <code>sudo unshare --pid --fork --mount-proc ps -ef</code> (ps is PID 1) and <code>sudo unshare --uts bash -c 'hostname ctr01; uname -r'</code>. The process list and hostname are separate, but <code>uname -r</code> matches the host: a container shares the host kernel, a VM runs its own.",
    "A cloud-init user-data file starting with <code>#cloud-config</code> that sets <code>hostname: app02</code>, creates the user under <code>users:</code> with <code>ssh_authorized_keys</code> (the .pub key only), and lists nginx under <code>packages:</code>. Check it with <code>cloud-init status --long</code> after boot.",
]
