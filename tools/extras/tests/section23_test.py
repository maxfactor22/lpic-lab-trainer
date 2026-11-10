# Checks the Section 23 paste checks against realistic Linux Mint output (a VirtualBox guest).
# For each lab: the good sample must pass every check, the broken one must fail at least one.
# Run from the app folder: python tools/extras/tests/section23_test.py
import os, re, sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import section23 as S

GOOD, BAD = {}, {}

GOOD[1] = """oracle
oracle
none
Hypervisor vendor:                    KVM
Virtualization type:                  full
  Virtualization: oracle
 Hardware Vendor: innotek GmbH
  Hardware Model: VirtualBox
"""
# Bare metal: no hypervisor anywhere.
BAD[1] = """none
none
none
Virtualization:                       VT-x
"""

GOOD[2] = """innotek GmbH
VirtualBox
innotek GmbH
innotek GmbH
VirtualBox
	Manufacturer: innotek GmbH
	Product Name: VirtualBox
	UUID: 3b1c8e2a-5d4f-4a6b-9c8d-7e6f5a4b3c2d
"""
BAD[2] = """innotek GmbH
VirtualBox
innotek GmbH
"""

GOOD[3] = """0
hypervisor
4
               total        used        free      shared  buff/cache   available
Mem:           3.8Gi       1.2Gi       1.4Gi        45Mi       1.4Gi       2.6Gi
Swap:          2.0Gi          0B       2.0Gi
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda2        25G  8.4G   15G  36% /
Hypervisor: oracle (VirtualBox)
Classification: type 2
Why: VirtualBox runs as an application on the host's own operating system.
"""
BAD[3] = GOOD[3].split("Hypervisor: oracle")[0]

GOOD[4] = """vboxguest             516096  6 vboxsf
vboxsf                 45056  1
vmwgfx                425984  2
ls: cannot access '/sys/bus/virtio/drivers': No such file or directory
ii  virtualbox-guest-utils                     7.0.16-dfsg-2ubuntu1.1               amd64        x86 virtualization solution - non-X11 guest utilities
ii  virtualbox-guest-x11                       7.0.16-dfsg-2ubuntu1.1               amd64        x86 virtualization solution - X11 guest utilities
  virtualbox-guest-utils.service                 loaded active running Virtualbox guest utils
"""
BAD[4] = """ls: cannot access '/sys/bus/virtio/drivers': No such file or directory
"""

GOOD[5] = """4f2c0d8a9b1e4c7d8e2f3a4b5c6d7e8f
lrwxrwxrwx 1 root root 15 Apr 22  2024 /var/lib/dbus/machine-id -> /etc/machine-id
  Machine ID: 4f2c0d8a9b1e4c7d8e2f3a4b5c6d7e8f
0123456789abcdef0123456789abcdef
9a8b7c6d5e4f30211203f4e5d6c7b8a9
9a8b7c6d5e4f30211203f4e5d6c7b8a9
"""
# Skipped the rm, so --ensure kept the template ID.
BAD[5] = GOOD[5].replace("9a8b7c6d5e4f30211203f4e5d6c7b8a9", "0123456789abcdef0123456789abcdef")

GOOD[6] = """256 SHA256:Xq3lP0m8Yk2sV7dR1nT4uB6wE9zA5cH0jL2fG8kM3pQ max@mint (ECDSA)
256 SHA256:b7Rk2Lm9Pq4Tz1Vx6Nc3Wd8Ys5Ja0Hf7Gu2Ei4Ko9Bn max@mint (ED25519)
3072 SHA256:Zt5Wq8Ne2Rb6Ym1Kp4Lc9Vx3Hd7Sg0Jf5Ua2Ti8Oz6Me max@mint (RSA)
256 SHA256:Fa1Gb2Hc3Id4Je5Kf6Lg7Mh8Ni9Oj0Pk1Ql2Rm3Sn4To max@mint (ECDSA)
256 SHA256:Up5Vq6Wr7Xs8Yt9Zu0Av1Bw2Cx3Dy4Ez5Fa6Gb7Hc8Id max@mint (ED25519)
3072 SHA256:Je9Kf0Lg1Mh2Ni3Oj4Pk5Ql6Rm7Sn8To9Up0Vq1Wr2Xs max@mint (RSA)
"""
# Forgot to delete the old keys, so -A changed nothing.
_before = GOOD[6].split("\n")[:3]
BAD[6] = "\n".join(_before + _before) + "\n"

GOOD[7] = """clone-root/etc/hostname:1:web01
clone-root/etc/hosts:2:127.0.1.1 web01
clone-root/etc/fstab:1:UUID=1b6f2c3e-0a4d-4c55-9e8f-7a1b2c3d4e5f / ext4 errors=remount-ro 0 1
clone-root/etc/netplan/01-static.yaml:6:        macaddress: "08:00:27:aa:bb:01"
clone-root/etc/netplan/01-static.yaml:7:      addresses: [10.20.0.11/24]
mint-vm
lo               UNKNOWN        00:00:00:00:00:00 <LOOPBACK,UP,LOWER_UP>
enp0s3           UP             08:00:27:4e:1a:9c <BROADCAST,MULTICAST,UP,LOWER_UP>
lo               UNKNOWN        127.0.0.1/8 ::1/128
enp0s3           UP             10.0.2.15/24 fe80::a00:27ff:fe4e:1a9c/64
/dev/sda2 0b6c7f54-91a2-4e7d-8c33-5a1d2e3f4b5c
NAME                UUID                                  DEVICE
Wired connection 1  6d1e2f3a-4b5c-4d6e-8f70-81a2b3c4d5e6  enp0s3
hostname: done
hosts entry: done
static IP: done
MAC: done
machine ID: done (Lab 5)
SSH host keys: done (Lab 6)
filesystem UUIDs: not needed
clone-root/etc/hostname:web02
clone-root/etc/hosts:127.0.1.1 web02
clone-root/etc/netplan/01-static.yaml:        macaddress: "08:00:27:aa:bb:02"
clone-root/etc/netplan/01-static.yaml:      addresses: [10.20.0.12/24]
"""
# Only the hostname file was edited.
BAD[7] = GOOD[7].replace("clone-root/etc/hosts:127.0.1.1 web02", "clone-root/etc/hosts:127.0.1.1 web01") \
    .replace("aa:bb:02", "aa:bb:01").replace("[10.20.0.12/24]", "[10.20.0.11/24]")

GOOD[8] = """UID          PID    PPID  C STIME TTY          TIME CMD
root           1       0  0 10:41 pts/0    00:00:00 ps -ef
ctr01
6.8.0-45-generic
mint-vm
6.8.0-45-generic
"""
# Left out --uts: the host's hostname changed too.
BAD[8] = GOOD[8].replace("mint-vm", "ctr01")

GOOD[9] = """Inventory app: IaaS. The CSP runs the hardware and virtualization; we run the OS and everything above it.
Web app: PaaS. The CSP also runs the OS and the runtime; developers push code.
Email: SaaS. The CSP runs the whole application.
Instances: billed by size and running time.
Elasticity: add and remove instances as load changes.
Load balancing: spread traffic across the running instances.
Block storage is a virtual disk attached to one instance; object storage holds files reached through an API or the portal.
Clouds can be public, private, or hybrid (a mix of both).
Instances are created in the management console or portal, and cloud-init gives a Linux instance its settings on first boot.
"""
BAD[9] = GOOD[9].replace("Elasticity: add and remove instances as load changes.\n", "")

GOOD[10] = """#cloud-config
app02 svc-deploy 1
instance-id: app02-0001
local-hostname: app02
"""
# Indentation broken: the key list didn't parse and the script printed a traceback.
BAD[10] = """#cloud-config
Traceback (most recent call last):
yaml.scanner.ScannerError: mapping values are not allowed here
instance-id: app02-0001
local-hostname: app02
"""

GOOD[11] = """CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
CONTAINER ID   IMAGE         COMMAND   CREATED          STATUS                     PORTS     NAMES
3f2a1b4c5d6e   alpine:3.20   "sh"      48 seconds ago   Exited (0) 6 seconds ago             lab23
6.8.0-45-generic
6.8.0-45-generic
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
"""
# Skipped docker rm, so lab23 is still listed at the end.
BAD[11] = GOOD[11] + '3f2a1b4c5d6e   alpine:3.20   "sh"      2 minutes ago    Exited (137) 5 seconds ago           lab23\n'


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
        print(f"Lab {num}: good {'PASS' if g_ok else 'FAIL'}, broken {'caught' if b_fails else 'NOT CAUGHT'}")
        for ok, n, say in good:
            if not ok:
                print(f"    good sample failed: {say} (matches={n})")
        if not (g_ok and b_fails):
            bad += 1
    n_q = len(S.ANSWERS)
    print(f"{n_q} model answers, {len(S.TRAP_QUIZ)} trap questions")
    assert n_q == 7
    assert [t["id"] for t in S.TRAP_QUIZ] == [f"tq{i}" for i in range(1, 9)]
    for num, lab in S.LABS.items():
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
