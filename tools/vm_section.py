"""Convert a workbook spec (wb/sNN.json) plus hand-written extras into data/section-NN.js
for the trainer's VM lessons.  usage: python vm_section.py spec.json extras.py out.js"""
import json, re, sys, runpy

spec_path, extras_path, out_path = sys.argv[1:4]
B = json.load(open(spec_path, encoding="utf-8"))
X = runpy.run_path(extras_path)

CMD_START = re.compile(r"^(sudo|cat|lsblk|grep|ls|losetup|findmnt|echo|cp|systemctl|DISK=|mkdir|cd|rm|printf|tail|column|truncate|mkfs|mkswap|swapon|swapoff|blkid|mount|umount|free|head|wc|file|e2label|partprobe|parted|fdisk|gdisk)\b")
def step(s):
    if CMD_START.match(s) and not re.search(r"\b(and add|and explain|if |then press)\b", s, re.I):
        return {"cmd": s}
    return {"text": s}

def sections(blocks):
    """Group blocks by h2."""
    out, cur = {}, None
    for b in blocks:
        if b[0] == "h2": cur = b[1]; out[cur] = []
        elif cur: out[cur].append(b)
    return out

S = sections(B)
title_sub = [b[1] for b in B if b[0] == "sub"][0]
how = [b[1] for b in S["How to use this workbook"] if b[0] == "p"]
setup = []
for b in S["Lab Setup"]:
    t = b[1]
    if re.match(r"^(Step \d+:|Validation check:)", t): setup.append({"text": t})
    else: setup.append({"cmd": t})
commands = [c.strip() for c in re.split(r",\s*(?:and\s+)?", S["Commands to Memorize"][0][1].rstrip(".")) if c.strip()]
hook = S["Memory hook"][0][1]

labs = [b[1] for b in B if b[0] == "lab"]
lessons = []
for i, L in enumerate(labs, 1):
    m = re.match(r"Lab (\d+)(?: \(optional\))?: (.*)", L["title"])
    n, title = int(m.group(1)), m.group(2)
    ex = X["LABS"][n]
    lessons.append({
        "id": f"{X['NUMBER']}.{n}", "kind": "vm", "title": title, "navSubtitle": ex.get("nav", ""),
        "objective": ex.get("objective", X["OBJECTIVES"][0]), "difficulty": ex["level"],
        "source": L["title"], "workdir": X["WORKDIR"],
        "summary": ex.get("summary", ""),
        "scenario": L["scenario"], "task": L["task"], "deliverable": L["deliverable"],
        "steps": [step(s) for s in L["steps"]],
        "validation": L["validation"], "trap": L["trap"],
        "paste": ex.get("paste"), "quiz": ex.get("quiz", []),
        "completion": ex.get("completion", title + ": done."),
    })

ch = S["Scenario-Based Challenge Exam"]
review = {
    "traps": next(b[1] for b in S["Common Exam Traps"] if b[0] == "bullets"),
    "trapQuiz": X["TRAP_QUIZ"],
    "challenge": {"intro": ch[0][1], "tasks": next(b[1] for b in ch if b[0] == "numbered"),
                  "outro": ch[-1][1] if ch[-1][0] == "p" and len(ch) > 2 else ""},
    "questions": [{"q": q, "a": X["ANSWERS"][k]} for k, q in enumerate(next(b[1] for b in S["LPIC-Style Practical Questions"] if b[0] == "bullets"))],
    "mastery": next(b[1] for b in S["Mastery Checklist"] if b[0] == "bullets"),
}
# Any other h2 part of the workbook (for example a read-and-explain comparison) becomes a
# reference card on the section page, so no workbook content is dropped.
KNOWN = {"How to use this workbook", "Lab Setup", "Commands to Memorize", "Memory hook", "Common Exam Traps",
         "Scenario-Based Challenge Exam", "LPIC-Style Practical Questions", "Mastery Checklist"}
reference = []
for name, blocks in S.items():
    if name in KNOWN or any(b[0] == "lab" for b in blocks):
        continue
    reference.append({"title": name, "paragraphs": [b[1] for b in blocks if b[0] == "p"],
                      "bullets": [i for b in blocks if b[0] in ("bullets", "numbered") for i in b[1]]})

section = {
    "id": f"section-{X['NUMBER']:02d}", "number": X["NUMBER"], "title": X["TITLE"], "objectives": X["OBJECTIVES"],
    "kind": "vm", "source": X["SOURCE"], "scenario": title_sub,
    "overview": {"paragraphs": how, "setup": setup, "commands": commands, "memoryHook": hook, "reference": reference},
    "lessons": lessons, "review": review,
}
js = (f"/* Section {X['NUMBER']}: {X['TITLE']}. Generated from {X['SOURCE']} by vm_section.py;\n"
      "   paste checks, quizzes and model answers were added for the app. */\n"
      "LPIC.section(" + json.dumps(section, ensure_ascii=False, indent=1) + ");\n")
open(out_path, "w", encoding="utf-8", newline="\n").write(js)
print("wrote", out_path, len(lessons), "lessons")
