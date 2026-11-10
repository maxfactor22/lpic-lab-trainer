# Writing a VM section's extras file

`tools/vm_section.py` turns a workbook spec (`tools/specs/sNN.json`) into `data/section-NN.js`.
The spec supplies the labs, steps, traps, challenge, practical questions and checklist. The
extras file `tools/extras/sectionNN.py` adds what the app needs on top. Use
`tools/extras/section15.py` as the model, and match its style and depth.

## What the extras file defines
- `NUMBER`, `TITLE` (short, for example "Mounting, fstab and Filesystem Checks"), `OBJECTIVES`
  (list), `SOURCE` (for example "LPIC_Section16_Lab_Workbook.docx"), and `WORKDIR` (the workbook's
  practice folder, for example "~/lpic1-section16").
- `LABS`: one entry per lab number. Each entry holds:
  - `level`: Beginner, Intermediate or Advanced, matching the h2 group the lab sits under.
  - `nav`: 2–4 words of commands or topic.
  - `objective` (optional): set it if the lab belongs to a different objective than the section's first.
  - `paste`: `{"command": ..., "checks": [...]}`
    - `command` is what Max runs on the VM to show the deliverable, usually
      `cat reports/<file>`. Combine files with `;` if the deliverable is several files.
    - Each check is `chk(regex, say, min=N | count=N | absent=True)`. The check passes when the
      regex matches at least once (default), at least N times (`min`), exactly N times
      (`count`), or never (`absent`).
    - The engine runs each regex in JavaScript with flags `gim`. Use only syntax that means the
      same in Python and JS: no named groups, no `\A` or `\Z`, no possessive or atomic
      groups, no inline flags.
    - Checks must prove what the lab's **Validation** text says, in 2–4 checks. Base them on the
      exact output format of the real Linux tools on Linux Mint 21/22 (lsblk, findmnt, df,
      tune2fs, dmesg, lsmod and so on). Don't be so strict that harmless differences fail, such
      as column spacing, device numbers (loop0 vs loop3), kernel versions or sizes. Prefer
      anchoring on stable words and labels.
    - Many deliverables are notes Max writes himself in nano. Check only for things the lab told
      him to include, such as key words or a file name, never exact sentences.
    - Some labs are inspect-only, or their output varies too much by machine to check. For those,
      set `paste=None`, and the page shows only "I checked it on my VM". Use that sparingly.
  - `quiz`: 1–2 multiple-choice questions on what the lab teaches, written with `q(...)` as in
    section15.py. Options are plain strings, or `{"value", "label"}` when the label has HTML.
    `<code>` is fine in labels and prompts. Keep each `explain` to one short sentence starting with
    "Correct."
- `TRAP_QUIZ`: 8 questions drawn from the workbook's Common Exam Traps, ids `tq1`–`tq8`.
- `ANSWERS`: one short model answer (HTML allowed, `<code>` for commands) for **each**
  LPIC-Style Practical Question, in the same order. The count must match exactly.

## Rules
- Write everything in your own words. The workbooks are Max's; everything stays original.
- Commands in answers must be correct on Linux Mint.
- Sample names stay generic (web01, db01, alice). No real people or employers.
- **Test before you finish.** For every lab with a paste check:
  - Write a realistic sample of the real output (what `cat reports/...` would show on Mint after
    doing the lab correctly). Confirm every check passes.
  - Make one broken variant that leaves out the key result. Confirm at least one check fails.
  - Do this in a small Python script with `re.findall(pattern, text, re.I | re.M)`, and keep
    the script and samples in `tools/extras/tests/sectionNN_test.py`.
- Then run `python tools/vm_section.py tools/specs/sNN.json tools/extras/sectionNN.py data/section-NN.js`
  from the app folder, and confirm it reports the right number of lessons.
- Only create or edit `tools/extras/sectionNN.py`, `tools/extras/tests/sectionNN_test.py` and
  `data/section-NN.js` for your section. Touch nothing else. Don't commit.

## Report back
Report:
- the lesson count
- any lab you set to `paste=None`, and why
- anything you were unsure about in the real tool output formats
