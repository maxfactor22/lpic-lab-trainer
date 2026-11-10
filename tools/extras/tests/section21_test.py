# Checks the Section 21 paste checks against realistic Linux Mint output.
# For each lab: the good sample must pass every check, the broken one must fail at least one.
# Run from the app folder: python tools/extras/tests/section21_test.py
import os, re, sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import section21 as S

GOOD, BAD = {}, {}

GOOD[1] = """rpm: /usr/bin/rpm
rpm2cpio: /usr/bin/rpm2cpio
cpio: /usr/bin/cpio
yum: missing
dnf: missing
zypper: missing
yumdownloader: missing
RPM version 4.18.2
rpm packages installed: 0
dpkg packages installed: 2187
"""
BAD[1] = GOOD[1].replace("rpm packages installed: 0", "rpm packages installed: 2")

GOOD[2] = """tree-1.6.0-10.el7.src.rpm
tree-1.6.0-10.el7.x86_64.rpm
words-3.0-22.el7.noarch.rpm
tree | 1.6.0 | 10.el7 | x86_64
tree | 1.6.0 | 10.el7 | x86_64
words | 3.0 | 22.el7 | noarch
"""
BAD[2] = """tree-1.6.0-10.el7.x86_64.rpm
words-3.0-22.el7.noarch.rpm
"""

GOOD[3] = """Name        : tree
Version     : 1.6.0
Release     : 10.el7
Architecture: x86_64
Install Date: (not installed)
Group       : Applications/File
Size        : 89505
License     : GPLv2+
Signature   : RSA/SHA256, Fri 04 Jul 2014 01:36:46 AM UTC, Key ID 24c6a8a7f4a80eb5
Source RPM  : tree-1.6.0-10.el7.src.rpm
Build Date  : Mon 09 Jun 2014 07:28:53 PM UTC
Build Host  : worker1.bsys.centos.org
Packager    : CentOS BuildSystem <http://bugs.centos.org>
Vendor      : CentOS
URL         : http://mama.indstate.edu/users/ice/tree/
Summary     : File system tree viewer
Description :
The tree utility recursively displays the contents of directories in a
tree-like format.  Tree is basically a UNIX port of the DOS tree
utility.
/usr/bin/tree
/usr/share/doc/tree-1.6.0
/usr/share/doc/tree-1.6.0/LICENSE
/usr/share/doc/tree-1.6.0/README
/usr/share/man/man1/tree.1.gz
libc.so.6()(64bit)
libc.so.6(GLIBC_2.14)(64bit)
libc.so.6(GLIBC_2.2.5)(64bit)
libc.so.6(GLIBC_2.3)(64bit)
libc.so.6(GLIBC_2.3.4)(64bit)
libc.so.6(GLIBC_2.4)(64bit)
rpmlib(CompressedFileNames) <= 3.0.4-1
rpmlib(FileDigests) <= 4.6.0-1
rpmlib(PayloadFilesHavePrefix) <= 4.0-1
rtld(GNU_HASH)
rpmlib(PayloadIsXz) <= 5.2-1
tree = 1.6.0-10.el7
tree(x86-64) = 1.6.0-10.el7
scripts: 0
"""
BAD[3] = GOOD[3].split("libc.so.6()")[0] + "scripts: 0\n"

GOOD[4] = """rpms/tree-1.6.0-10.el7.src.rpm: digests SIGNATURES NOT OK
rpms/tree-1.6.0-10.el7.x86_64.rpm: digests SIGNATURES NOT OK
rpms/words-3.0-22.el7.noarch.rpm: digests SIGNATURES NOT OK
rpms/tree-1.6.0-10.el7.x86_64.rpm:
    Header V3 RSA/SHA256 Signature, key ID f4a80eb5: NOKEY
    Header SHA1 digest: OK
    V3 RSA/SHA256 Signature, key ID f4a80eb5: NOKEY
    MD5 digest: OK
Note: the digests passed, so the files are not corrupted. The signatures show NOKEY because the
CentOS 7 key was never imported here. On a Red Hat system: sudo rpm --import /etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-7
"""
BAD[4] = GOOD[4].split("Note:")[0]

GOOD[5] = """./usr/bin/tree
./usr/share/doc/tree-1.6.0
./usr/share/doc/tree-1.6.0/LICENSE
./usr/share/doc/tree-1.6.0/README
./usr/share/man/man1/tree.1.gz
extract/usr/bin/tree
extract/usr/share/doc/tree-1.6.0/LICENSE
extract/usr/share/doc/tree-1.6.0/README
extract/usr/share/man/man1/tree.1.gz
extract/usr/share/dict/linux.words
extract
└── usr
    ├── bin
    └── share

3 directories, 0 files
"""
BAD[5] = GOOD[5].replace("extract/usr/share/dict/linux.words\n", "")

GOOD[6] = """warning: rpms/tree-1.6.0-10.el7.x86_64.rpm: Header V3 RSA/SHA256 Signature, key ID f4a80eb5: NOKEY
error: Failed dependencies:
\tlibc.so.6()(64bit) is needed by tree-1.6.0-10.el7.x86_64
\tlibc.so.6(GLIBC_2.14)(64bit) is needed by tree-1.6.0-10.el7.x86_64
\tlibc.so.6(GLIBC_2.2.5)(64bit) is needed by tree-1.6.0-10.el7.x86_64
\tlibc.so.6(GLIBC_2.3)(64bit) is needed by tree-1.6.0-10.el7.x86_64
\tlibc.so.6(GLIBC_2.3.4)(64bit) is needed by tree-1.6.0-10.el7.x86_64
\tlibc.so.6(GLIBC_2.4)(64bit) is needed by tree-1.6.0-10.el7.x86_64
\trtld(GNU_HASH) is needed by tree-1.6.0-10.el7.x86_64
packages in private db: 0
"""
BAD[6] = """warning: rpms/tree-1.6.0-10.el7.x86_64.rpm: Header V3 RSA/SHA256 Signature, key ID f4a80eb5: NOKEY
Verifying...                          ################################# [100%]
Preparing...                          ################################# [100%]
tree-1.6.0-10.el7.x86_64
packages in private db: 1
"""

GOOD[7] = """Verifying...                          ################################# [100%]
Preparing...                          ################################# [100%]
Updating / installing...
   1:words-3.0-22.el7                 ################################# [ 50%]
   2:tree-1.6.0-10.el7                ################################# [100%]
words-3.0-22.el7.noarch
tree-1.6.0-10.el7.x86_64
tree
"""
BAD[7] = """Verifying...                          ################################# [100%]
Preparing...                          ################################# [100%]
"""

GOOD[8] = """tree-1.6.0-10.el7.x86_64
words-3.0-22.el7.noarch
Name        : tree
Version     : 1.6.0
Release     : 10.el7
Architecture: x86_64
Install Date: Mon 09 Nov 2026 10:41:12 AM MST
Group       : Applications/File
Size        : 89505
License     : GPLv2+
Summary     : File system tree viewer
tree-1.6.0-10.el7.x86_64
/usr/share/doc/tree-1.6.0/LICENSE
/usr/share/doc/tree-1.6.0/README
/usr/share/man/man1/tree.1.gz
words-3.0-22.el7.noarch
package sl is not installed
"""
BAD[8] = """package tree is not installed
package words is not installed
error: file /usr/bin/tree: No such file or directory
package sl is not installed
"""

GOOD[9] = """first verify exit 0
S.5....T.    /usr/share/dict/linux.words
second verify exit 1
"""
BAD[9] = """first verify exit 0
second verify exit 0
"""

GOOD[10] = """package words is not installed
package words is not installed
Verifying...                          ################################# [100%]
Preparing...                          ################################# [100%]
Updating / installing...
   1:words-3.0-22.el7                 ################################# [100%]
words-3.0-22.el7.noarch
\tpackage words-3.0-22.el7.noarch is already installed
"""
BAD[10] = """package words is not installed
Verifying...                          ################################# [100%]
Preparing...                          ################################# [100%]
Updating / installing...
   1:words-3.0-22.el7                 ################################# [100%]
words-3.0-22.el7.noarch
words-3.0-22.el7.noarch
\tpackage words-3.0-22.el7.noarch is already installed
"""

GOOD[11] = """tree-1.6.0.tgz
tree-no-strip.patch
tree-preserve-timestamps.patch
tree.spec
Name:\t\ttree
Version:\t1.6.0
Release:\t10%{?dist}
Source:\t\thttp://mama.indstate.edu/users/ice/tree/src/tree-%{version}.tgz
"""
BAD[11] = GOOD[11].split("Name:")[0]

GOOD[12] = """cachedir=/var/cache/yum/$basearch/$releasever
keepcache=0
gpgcheck=1
installonly_limit=3
# assumeyes=1
[internal-base]
baseurl=http://mirror.example.com/el9/BaseOS/$basearch/
enabled=1
gpgcheck=1
[internal-testing]
baseurl=http://mirror.example.com/el9/testing/$basearch/
enabled=0
gpgcheck=0
gpgcheck=1
clean_requirements_on_remove=True
internal-base is the only enabled repository.
internal-testing is the risky one because gpgcheck=0 turns off signature checks, so enabling it would install unsigned packages.
yum still asks before installing because assumeyes=1 is commented out, so you need -y to skip the question.
"""
BAD[12] = GOOD[12].split("internal-base is the only")[0]

GOOD[13] = """Refresh repo data:   yum makecache | dnf makecache | zypper refresh
Install iotop:       yum install iotop | dnf install iotop | zypper install iotop
Update one package:  yum update iotop | dnf upgrade iotop | zypper update iotop
Update everything:   yum update | dnf upgrade | zypper update
Remove a package:    yum remove iotop | dnf remove iotop | zypper remove iotop
Is it installed:     yum list installed iotop | dnf list installed iotop | zypper search -i iotop
Package details:     yum info iotop | dnf info iotop | zypper info iotop
Who provides top:    yum provides /usr/bin/top | dnf provides /usr/bin/top | zypper what-provides /usr/bin/top
List dependencies:   yum deplist iotop | dnf repoquery --requires iotop | zypper info --requires iotop
Search keyword:      yum search iotop | dnf search iotop | zypper search iotop
List updates:        yum check-update | dnf check-update | zypper list-updates
Clear the cache:     yum clean all | dnf clean all | zypper clean
Download only:       yumdownloader iotop | dnf download iotop | zypper install --download-only iotop
List repositories:   yum repolist | dnf repolist | zypper repos
[repo-oss]
name=Main Repository
enabled=1
autorefresh=1
baseurl=http://download.example.org/distribution/leap/15.6/repo/oss/
type=rpm-md
keeppackages=0
"""
BAD[13] = "\n".join(l for l in GOOD[13].splitlines() if "Download only" not in l) + "\n"


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
        assert qq["explain"].startswith("Correct."), qq["id"]
    print("ALL OK" if bad == 0 else f"{bad} lab(s) need work")
    return bad


if __name__ == "__main__":
    sys.exit(main())
