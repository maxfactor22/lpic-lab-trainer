# App-only additions for Section 15: paste checks, one or two quiz questions per lab,
# a trap quiz, and model answers for the practical questions.
NUMBER = 15
TITLE = "Partitions, Filesystems and Swap"
OBJECTIVES = ["104.1", "104.3"]
SOURCE = "LPIC_Section15_Lab_Workbook.docx"
WORKDIR = "~/lpic1-section15"

def chk(re, say, **kw):
    return {"re": re, "say": say, **kw}

def q(id, prompt, answer, options, explain):
    return {"id": id, "prompt": prompt, "answer": answer, "options": options, "explain": explain}

LABS = {
    1: dict(level="Beginner", nav="/proc/partitions, lsblk",
        paste={"command": "cat reports/partitions-before.txt", "checks": [
            chk(r"major\s+minor\s+#blocks\s+name", "includes the kernel's list from /proc/partitions"),
            chk(r"NAME\s+MAJ:MIN", "includes lsblk output"),
            chk(r"\bloop\d+\b", "lists at least three loop devices", min=3),
            chk(r"\bloop\d+p\d", "no partitions on the loop disks yet", absent=True)]},
        quiz=[q("units", "In what units does <code>/proc/partitions</code> show sizes?", "kib",
                [{"value": "kib", "label": "1 KiB blocks"}, {"value": "sec", "label": "512-byte sectors"}, {"value": "mb", "label": "Megabytes"}],
                "Correct. The #blocks column counts 1 KiB blocks.")]),
    2: dict(level="Beginner", nav="MBR or GPT",
        paste={"command": "cat reports/table-choice.txt", "checks": [
            chk(r"Partition Table:", "shows at least one Partition Table line from parted"),
            chk(r"Partition Table: unknown|unrecognised disk label|unrecognized disk label", "shows the blank images have no table yet"),
            chk(r"Disklabel type: (gpt|dos)", "shows your VM disk's label type from fdisk")]},
        quiz=[q("4tb", "db01's new disk is 4 TB. Which partition table does it need?", "gpt",
                [{"value": "mbr", "label": "MBR"}, {"value": "gpt", "label": "GPT"}, {"value": "either", "label": "Either works"}],
                "Correct. MBR tops out at about 2 TiB, so a 4 TB disk needs GPT."),
              q("six", "A BIOS-only server needs six partitions on an MBR disk. How?", "ext",
                [{"value": "ext", "label": "Three primaries plus an extended partition holding logical ones"}, {"value": "six", "label": "Six primary partitions"}, {"value": "cant", "label": "It can't be done"}],
                "Correct. MBR allows four primaries, so one becomes an extended container for logical partitions.")]),
    3: dict(level="Intermediate", nav="fdisk, primary/extended/logical",
        paste={"command": "cat reports/mbr-layout.txt", "checks": [
            chk(r"Disklabel type: dos", "the disk has an MBR (dos) label"),
            chk(r"^/dev/loop\d+p[1-6]\s", "six partitions are listed", count=6),
            chk(r"^/dev/loop\d+p4\s.*Extended", "partition 4 is the extended partition"),
            chk(r"^/dev/loop\d+p2\s.*Linux swap", "partition 2 has the Linux swap type")]},
        quiz=[q("logical", "On an MBR disk, what number does the first logical partition get?", "5",
                ["1", "4", "5", "Whatever is free"], "Correct. Logical partitions always start at 5."),
              q("save", "You made changes in fdisk and pressed <code>q</code>. What was saved?", "nothing",
                [{"value": "nothing", "label": "Nothing. Only w writes the table"}, {"value": "all", "label": "Everything"}, {"value": "last", "label": "The last change"}],
                "Correct. q quits without writing.")]),
    4: dict(level="Intermediate", nav="gdisk, type codes",
        paste={"command": "cat reports/gpt-layout.txt", "checks": [
            chk(r"GPT: present", "gdisk reports a GPT table"),
            chk(r"\s8300\s", "two Linux filesystem (8300) partitions", count=2),
            chk(r"\s8200\s", "one Linux swap (8200) partition", count=1)]},
        quiz=[q("gdhelp", "Which key shows the command list in <code>gdisk</code>?", "?",
                [{"value": "m", "label": "<code>m</code>"}, {"value": "?", "label": "<code>?</code>"}, {"value": "h", "label": "<code>help</code>"}],
                "Correct. gdisk uses ?, fdisk uses m, and parted needs the word help.")]),
    5: dict(level="Intermediate", nav="parted, ESP",
        paste={"command": "cat reports/parted-layout.txt", "checks": [
            chk(r"Partition Table: gpt", "the disk has a GPT label"),
            chk(r"\besp\b", "partition 1 has the esp flag"),
            chk(r"^\s*2\s+\d", "a second partition exists")]},
        quiz=[q("partedw", "When does <code>parted</code> write a change to disk?", "now",
                [{"value": "now", "label": "As soon as you press Enter on the command"}, {"value": "w", "label": "When you type w"}, {"value": "quit", "label": "When you quit"}],
                "Correct. parted has no w step and no undo.")]),
    6: dict(level="Intermediate", nav="partprobe",
        paste={"command": "cat reports/partitions-after.txt", "checks": [
            chk(r"\bloop\d+p\d+", "at least 11 loop partitions are listed", min=11),
            chk(r"MBR: MBR only", "gdisk reads the MBR disk without converting it")]},
        quiz=[q("partprobe", "What does <code>partprobe</code> do?", "reread",
                [{"value": "reread", "label": "Asks the kernel to reread a disk's partition table"}, {"value": "make", "label": "Creates partitions"}, {"value": "check", "label": "Checks filesystems for errors"}],
                "Correct. Use it when a new partition doesn't show in /proc/partitions.")]),
    7: dict(level="Intermediate", nav="mkfs ext4, XFS",
        paste={"command": "cat reports/mkfs.txt", "checks": [
            chk(r"\bext4\b.*\bwebdata\b|\bwebdata\b.*\bext4\b", "webdata is ext4"),
            chk(r"\bxfs\b.*\bdbdata\b|\bdbdata\b.*\bxfs\b", "dbdata is XFS"),
            chk(r"\bapplogs\b", "applogs exists"),
            chk(r"mkfs\.ext4", "the list of mkfs programs is included")]},
        quiz=[q("mkfsform", "How do <code>mkfs -t ext4</code> and <code>mkfs.ext4</code> differ?", "same",
                [{"value": "same", "label": "They do the same thing; mkfs runs mkfs.TYPE"}, {"value": "label", "label": "Only mkfs.ext4 can set a label"}, {"value": "old", "label": "mkfs -t makes ext2"}],
                "Correct. mkfs is a front end.")]),
    8: dict(level="Intermediate", nav="FAT32, exFAT",
        paste={"command": "cat reports/mkfs-other.txt", "checks": [
            chk(r"\bvfat\b.*\bESP\b|\bESP\b.*\bvfat\b", "the ESP is FAT (vfat) with the label ESP"),
            chk(r"\bexfat\b.*\btransfer\b|\btransfer\b.*\bexfat\b", "partition 5 is exFAT with the label transfer")]},
        quiz=[q("esp", "Which filesystem must an EFI system partition use?", "fat",
                ["ext4", "XFS", {"value": "fat", "label": "FAT (usually FAT32)"}, "exFAT"], "Correct. UEFI firmware reads FAT.")]),
    9: dict(level="Intermediate", nav="mkswap, swapon",
        paste={"command": "cat reports/swap.txt", "checks": [
            chk(r"^/dev/loop\d+p3\s+partition", "swapon --show listed the swap partition while it was on"),
            chk(r"^Swap:", "free -h output is included"),
            chk(r"^/dev/loop\d+p3\s", "the partition is listed only once, so swapoff worked", count=1)]},
        quiz=[q("sig", "Partition 2 has type 82 (Linux swap). Is it swap space yet?", "no",
                [{"value": "no", "label": "No. mkswap must write the swap signature"}, {"value": "yes", "label": "Yes, the type code is enough"}, {"value": "boot", "label": "Yes, after a reboot"}],
                "Correct. Type codes are only labels.")]),
    10: dict(level="Advanced", nav="blkid, UUIDs, labels",
        paste={"command": "cat reports/ids.txt", "checks": [
            chk(r'UUID="', "blkid printed at least six UUIDs", min=6),
            chk(r"\bwebdata\b", "the webdata label is there"),
            chk(r"\bdbdata\b", "the dbdata label is there"),
            chk(r"\bESP\b", "the ESP label is there")]},
        quiz=[q("uuid", "What changes a filesystem's UUID?", "mkfs",
                [{"value": "mkfs", "label": "Running mkfs on the partition again"}, {"value": "reboot", "label": "A reboot"}, {"value": "move", "label": "Moving the disk to another port"}],
                "Correct. The UUID belongs to the filesystem, so a new mkfs gives a new one.")]),
    11: dict(level="Advanced", nav="mount, umount",
        paste={"command": "cat reports/mounts.txt", "checks": [
            chk(r"lost\+found", "the first mount showed lost+found"),
            chk(r"not mounted", "the last check shows mnt/web is not mounted")]},
        quiz=[q("umount", "Which command detaches a mounted filesystem?", "umount",
                [{"value": "unmount", "label": "<code>unmount</code>"}, {"value": "umount", "label": "<code>umount</code>"}, {"value": "dismount", "label": "<code>dismount</code>"}],
                "Correct. There's no n in umount."),
              q("busy", "<code>umount</code> says <em>target is busy</em>. A likely cause?", "cwd",
                [{"value": "cwd", "label": "A shell's current directory is inside the mount point"}, {"value": "ro", "label": "It's mounted read-only"}, {"value": "label", "label": "It was mounted by label"}],
                "Correct. cd out of it, then try again.")]),
    12: dict(level="Advanced", nav="ro, remount",
        paste={"command": "cat reports/ro-test.txt", "checks": [
            chk(r"Read-only file system", "the write failed while read-only"),
            chk(r"\sro[,\s]", "findmnt shows the ro option"),
            chk(r"write ok after remount", "the write worked after remount,rw")]},
        quiz=[q("remount", "Which option switches a mounted filesystem to read-write without unmounting?", "remount",
                [{"value": "remount", "label": "<code>-o remount,rw</code>"}, {"value": "rw", "label": "<code>-o rw</code> on a second mount"}, {"value": "w", "label": "<code>-w</code> with umount"}],
                "Correct.")]),
    13: dict(level="Advanced", nav="fstab, test a copy",
        paste={"command": "tail -3 configs/fstab.test; cat reports/fstab-verify.txt", "checks": [
            chk(r"^LABEL=webdata\s", "the webdata line is in the copy"),
            chk(r"^UUID=\S+\s+\S+/mnt/db\s+xfs", "the dbdata line uses a UUID and xfs"),
            chk(r"^LABEL=labswap\s+none\s+swap", "the swap line is in the copy"),
            chk(r"Success|0 errors|no errors", "findmnt --verify found no errors")]},
        quiz=[q("pass", "In <code>/etc/fstab</code>, what should the last field (pass) be for the root filesystem?", "1",
                ["0", "1", "2"], "Correct. 1 for root, 2 for others, 0 to skip the check."),
              q("noauto", "What does <code>noauto</code> do in an fstab entry?", "skip",
                [{"value": "skip", "label": "mount -a and boot skip it; mount it by hand"}, {"value": "user", "label": "Lets ordinary users mount it"}, {"value": "ro", "label": "Mounts it read-only"}],
                "Correct.")]),
    14: dict(level="Advanced", nav="Cleanup",
        paste={"command": "cat reports/cleanup.txt", "checks": [
            chk(r"No lab loop devices attached", "no lab loop devices are left"),
            chk(r"No lab mounts", "nothing from the lab is still mounted")]},
        quiz=[q("order", "What comes first when retiring a disk?", "umount",
                [{"value": "umount", "label": "Unmount it (and swapoff)"}, {"value": "detach", "label": "Detach it with losetup -d"}, {"value": "wipe", "label": "wipefs -a"}],
                "Correct. Unmount before you detach.")]),
}

TRAP_QUIZ = [
    q("tq1", "How many primary partitions can an MBR disk hold?", "4", ["2", "4", "16", "128"], "Correct. Four primaries, or three plus one extended."),
    q("tq2", "How many partitions does GPT allow by default?", "128", ["4", "15", "64", "128"], "Correct."),
    q("tq3", "Which tool writes changes immediately, with no w step?", "parted", ["fdisk", "gdisk", "parted"], "Correct."),
    q("tq4", "Which partition do you never format?", "ext",
      [{"value": "ext", "label": "The extended partition"}, {"value": "esp", "label": "The ESP"}, {"value": "log", "label": "A logical partition"}], "Correct. It's only a container."),
    q("tq5", "What's the field order in <code>/etc/fstab</code>?", "order",
      [{"value": "order", "label": "device, mount point, type, options, dump, pass"}, {"value": "o2", "label": "mount point, device, type, options, pass, dump"}, {"value": "o3", "label": "device, type, mount point, options, dump, pass"}], "Correct."),
    q("tq6", "Which fstab option lets an ordinary user mount the filesystem?", "user", ["defaults", "noauto", "user", "rw"], "Correct."),
    q("tq7", "You reformatted a partition with mkfs. What breaks?", "uuid",
      [{"value": "uuid", "label": "fstab entries that use its old UUID"}, {"value": "label", "label": "Nothing"}, {"value": "table", "label": "The partition table"}], "Correct. mkfs creates a new UUID."),
    q("tq8", "How do you test an fstab change safely?", "verify",
      [{"value": "verify", "label": "findmnt --verify, or mount -a --fake, on a copy"}, {"value": "reboot", "label": "Edit /etc/fstab and reboot"}, {"value": "mount", "label": "mount -a on the real file"}], "Correct."),
]

ANSWERS = [
    "GPT, because MBR stops at about 2 TiB. Create it with <code>gdisk</code> or <code>parted</code> (<code>mklabel gpt</code>).",
    "Partitions 1 to 3 are primary, partition 4 is the extended container, and the logical partitions inside it are numbered from 5 (5, 6, and so on). The extended partition itself is never formatted.",
    "In <code>parted</code>: <code>mklabel gpt</code>, <code>mkpart ESP fat32 1MiB 257MiB</code>, <code>set 1 esp on</code>, then <code>mkfs.vfat -F 32</code> on it. <code>parted DEVICE print</code> shows the esp flag.",
    "<code>sudo mkfs.xfs -L dbdata DEVICE</code>, then <code>sudo blkid DEVICE</code> or <code>lsblk -f</code> for the UUID.",
    "<code>sudo mkswap DEVICE</code> if it has no swap signature yet, then <code>sudo swapon DEVICE</code>, and prove it with <code>swapon --show</code> and <code>free -h</code>.",
    "<code>sudo mount -o ro UUID=… /mount/point</code>. Prove it with a write that fails (<em>Read-only file system</em>) and <code>findmnt</code> showing <code>ro</code>.",
    "Add <code>UUID=… /mount/point ext4 defaults 0 2</code> to a copy first, then check the copy with <code>findmnt --verify --tab-file COPY</code> or <code>mount -a --fake -T COPY</code> before it goes into /etc/fstab.",
]
