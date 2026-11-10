# Checks the Section 22 paste checks against realistic Linux Mint output.
# For each lab: the good sample must pass every check, the broken one must fail at least one.
# Run from the app folder: python tools/extras/tests/section22_test.py
import os, re, sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import section22 as S

H = "/home/max/lpic1-section22"
ML = "/lib/x86_64-linux-gnu"

GOOD, BAD = {}, {}

GOOD[1] = f"""/usr/bin/ps
	linux-vdso.so.1 (0x00007ffd5a3f2000)
	libproc2.so.0 => {ML}/libproc2.so.0 (0x00007f1c2a8e1000)
	libc.so.6 => {ML}/libc.so.6 (0x00007f1c2a600000)
	libsystemd.so.0 => {ML}/libsystemd.so.0 (0x00007f1c2a51d000)
	libcap.so.2 => {ML}/libcap.so.2 (0x00007f1c2a511000)
	/lib64/ld-linux-x86-64.so.2 (0x00007f1c2a93a000)
"""
BAD[1] = GOOD[1].replace(f"libproc2.so.0 => {ML}/libproc2.so.0 (0x00007f1c2a8e1000)", "libproc2.so.0 => not found")

GOOD[2] = f"""lrwxrwxrwx 1 root root     14 Jan 31  2024 {ML}/libz.so.1 -> libz.so.1.3
-rw-r--r-- 1 root root 108936 Jan 31  2024 {ML}/libz.so.1.3
/usr/lib/x86_64-linux-gnu/libz.so.1.3
  SONAME               libz.so.1
libc.so.6
libpcre2-8.so.0
libpcre2-8.so.0.11.2
libstdc++.so.6
libstdc++.so.6.0.33
Programs record the soname libz.so.1, not the real file name.
The libz.so.1 symlink points at whichever real file is installed, so 1.2 -> 1.3 needs no relinking.
"""
BAD[2] = GOOD[2].split("Programs record")[0]

GOOD[3] = """LD_LIBRARY_PATH=[]
include /etc/ld.so.conf.d/*.conf

fakeroot-x86_64-linux-gnu.conf
libc.conf
x86_64-linux-gnu.conf
/usr/lib/x86_64-linux-gnu/libfakeroot
# libc default configuration
/usr/local/lib
# Multiarch support
/usr/local/lib/x86_64-linux-gnu
/lib/x86_64-linux-gnu
/usr/lib/x86_64-linux-gnu
lrwxrwxrwx   1 root root     7 Apr 22  2024 /lib -> usr/lib
lrwxrwxrwx   1 root root     9 Apr 22  2024 /lib64 -> usr/lib64
drwxr-xr-x 106 root root  4096 Oct  2 09:14 /usr/lib
drwxr-xr-x   2 root root  4096 Oct  2 09:13 /usr/lib64
drwxr-xr-x  88 root root 69632 Oct  2 09:14 /usr/lib/x86_64-linux-gnu
"""
BAD[3] = GOOD[3].replace("include /etc/ld.so.conf.d/*.conf\n", "")

GOOD[4] = f"""      [Requesting program interpreter: /lib64/ld-linux-x86-64.so.2]
lrwxrwxrwx 1 root root 44 Jan 13  2025 /lib64/ld-linux-x86-64.so.2 -> ../lib/x86_64-linux-gnu/ld-linux-x86-64.so.2
/lib64/ld-linux-x86-64.so.2: ELF 64-bit LSB shared object, x86-64, version 1 (GNU/Linux), static-pie linked, BuildID[sha1]=1c8db5f83bba514f8fd5f1fb6d7be975be1bb855, stripped
	linux-vdso.so.1 (0x00007ffcb7bd5000)
	libproc2.so.0 => {ML}/libproc2.so.0 (0x00007f6d0e2f0000)
	libc.so.6 => {ML}/libc.so.6 (0x00007f6d0e000000)
	/lib64/ld-linux-x86-64.so.2 (0x00007f6d0e349000)
    PID TTY          TIME CMD
   2345 pts/0    00:00:00 bash
/usr/bin/ldd: Bourne-Again shell script, ASCII text executable
"""
BAD[4] = GOOD[4].replace("      [Requesting program interpreter: /lib64/ld-linux-x86-64.so.2]\n", "").replace("    PID TTY          TIME CMD\n   2345 pts/0    00:00:00 bash\n", "")

GOOD[5] = f"""-rw-r--r-- 1 root root 104370 Nov  9 09:12 /etc/ld.so.cache
/etc/ld.so.cache: data
1432 libs found in cache `/etc/ld.so.cache'
	libz.so.1 (libc6,x86-64) => {ML}/libz.so.1
"""
BAD[5] = GOOD[5].replace(f"	libz.so.1 (libc6,x86-64) => {ML}/libz.so.1\n", "")

GOOD[6] = f"""	linux-vdso.so.1 (0x00007ffe3c9d4000)
	libproc2.so.0 => {ML}/libproc2.so.0 (0x00007f8a1b2c0000)
	libncursesw.so.6 => {ML}/libncursesw.so.6 (0x00007f8a1b280000)
	libtinfo.so.6 => {ML}/libtinfo.so.6 (0x00007f8a1b24c000)
	libc.so.6 => {ML}/libc.so.6 (0x00007f8a1b000000)
	libsystemd.so.0 => {ML}/libsystemd.so.0 (0x00007f8a1af1d000)
	/lib64/ld-linux-x86-64.so.2 (0x00007f8a1b31a000)
	libproc2.so.0 (libc6,x86-64) => {ML}/libproc2.so.0
lrwxrwxrwx 1 root root 17 Apr  8  2024 {ML}/libproc2.so.0 -> libproc2.so.0.0.2
"""
BAD[6] = GOOD[6].replace(f"libproc2.so.0 => {ML}/libproc2.so.0 (0x00007f8a1b2c0000)", "libproc2.so.0 => not found").split("lrwxrwxrwx")[0]

GOOD[7] = """total 16
lrwxrwxrwx 1 max max    13 Nov  9 10:02 libgreet.so -> libgreet.so.1
lrwxrwxrwx 1 max max    17 Nov  9 10:02 libgreet.so.1 -> libgreet.so.1.0.0
-rwxrwxr-x 1 max max 15560 Nov  9 10:01 libgreet.so.1.0.0
  SONAME               libgreet.so.1
"""
BAD[7] = GOOD[7].replace("lrwxrwxrwx 1 max max    13 Nov  9 10:02 libgreet.so -> libgreet.so.1\n", "")

GOOD[8] = f"""./bin/greetapp: error while loading shared libraries: libgreet.so.1: cannot open shared object file: No such file or directory
	linux-vdso.so.1 (0x00007ffd2b7e8000)
	libgreet.so.1 => not found
	libc.so.6 => {ML}/libc.so.6 (0x00007f2b6a400000)
	/lib64/ld-linux-x86-64.so.2 (0x00007f2b6a6a1000)
  NEEDED               libgreet.so.1
  NEEDED               libc.so.6
"""
BAD[8] = """libgreet says hello to web01
	linux-vdso.so.1 (0x00007ffd2b7e8000)
	libgreet.so.1 => /home/max/lpic1-section22/lib/libgreet.so.1 (0x00007f2b6a6e0000)
	libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f2b6a400000)
  NEEDED               libgreet.so.1
"""

GOOD[9] = f"""libgreet says hello to web01
{H}/lib
	libgreet.so.1 => {H}/lib/libgreet.so.1 (0x00007f0e5c4b6000)
./bin/greetapp: error while loading shared libraries: libgreet.so.1: cannot open shared object file: No such file or directory
"""
BAD[9] = GOOD[9].split("./bin/greetapp")[0]

GOOD[10] = f"""	libgreet.so.1 (libc6,x86-64) => {H}/lib/libgreet.so.1
	libgreet.so (libc6,x86-64) => {H}/lib/libgreet.so
libgreet says hello to web01
0
"""
BAD[10] = GOOD[10].replace("\n0\n", "\n2\n")

GOOD[11] = f"""total 1784
-rwxrwxr-x 1 max max  15960 Nov  9 10:20 greetapp
-rwxrwxr-x 1 max max  16000 Nov  9 10:31 greetapp-archive
-rwxrwxr-x 1 max max 900248 Nov  9 10:31 greetapp-static
bin/greetapp:         ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=3f6e, for GNU/Linux 3.2.0, not stripped
bin/greetapp-archive: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=8a1c, for GNU/Linux 3.2.0, not stripped
bin/greetapp-static:  ELF 64-bit LSB executable, x86-64, version 1 (GNU/Linux), statically linked, BuildID[sha1]=c2d9, for GNU/Linux 3.2.0, not stripped
	linux-vdso.so.1 (0x00007ffc3d1e7000)
	libc.so.6 => {ML}/libc.so.6 (0x00007f9c1e800000)
	/lib64/ld-linux-x86-64.so.2 (0x00007f9c1ea9e000)
	not a dynamic executable
"""
BAD[11] = GOOD[11].replace("version 1 (GNU/Linux), statically linked", "version 1 (SYSV), dynamically linked").replace("	not a dynamic executable\n", f"	libgreet.so.1 => {H}/lib/libgreet.so.1 (0x00007f9c1eaa0000)\n")

GOOD[12] = f"""  NEEDED               libselinux.so.1
  NEEDED               libgssapi_krb5.so.2
  NEEDED               libcrypto.so.3
  NEEDED               libz.so.1
  NEEDED               libc.so.6
21
7f3a1c600000-7f3a1c628000 r--p 00000000 08:02 1311090                    /usr/lib/x86_64-linux-gnu/libc.so.6
"""
BAD[12] = GOOD[12].split("7f3a1c600000")[0]


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
