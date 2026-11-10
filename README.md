# LPIC-1 Lab Trainer

A static, interactive training app for LPIC-1 exam 101-500, built from scenario-based lab
workbooks. No framework, no build step, no external libraries. It runs from GitHub Pages, from
a local web server, or straight from the folder.

## What's in it

- **Sections 2–12** run in a simulated terminal: text tools, redirects, find/grep, file
  management, archives, a vi/nano simulator, permissions, processes and jobs (with tmux/screen),
  and shell variables. Each lesson has tasks, a quiz and a no-hint challenge.
- **Sections 13–23** are lessons you run on a Linux Mint VM (hardware, disks, boot, systemd,
  packages, libraries, virtualization). Each has steps with Copy buttons, an output-paste check
  and a quiz.
- **A section review** for each section: a trap quiz, a challenge exam checklist, practical
  questions with model answers, and a mastery checklist.
- **Section 24, review and practice exam** (`#/prep`): a 60-question, 90-minute practice exam
  weighted by the 101-500 objectives, with a score by objective and a review of every answer;
  a weak-areas table built from every answer you give; and 10-question drills by topic,
  objective, weakest objectives or missed questions. Questions come from the lesson quizzes,
  trap quizzes and command challenges (as fill-in-the-blank), so nothing is written twice.
- **Progress** is saved in the browser (`localStorage` key `lpic-lab-trainer.v2`), with
  Export/Import on the home page. Progress from the original Lesson 1 moves over automatically.

## Run locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Project structure

```text
index.html            one page; the hash route picks the view (#/section/2, #/lesson/2.1, #/review/15)
styles.css            design system
js/core.js            data registration, saved progress, helpers
js/shell.js           simulated Bash shell and virtual filesystem
js/engine.js          renders home, sections, lessons, reviews; grades tasks
js/review.js          Section 24: practice exam, weak areas and drills (#/prep, #/exam, #/drill)
js/commands-*.js      practice-terminal commands, grouped by section
js/editor.js          vi and nano simulator
data/course.js        section list and objective weights
data/docs.js          short man, info and help pages for the practice terminal
data/section-NN.js    one file per section
tools/wbgen.py        builds a workbook .docx from a spec in tools/specs
tools/vm_section.py   builds data/section-NN.js for a VM section from a spec plus tools/extras
```

To add a VM section:

```bash
python tools/vm_section.py tools/specs/s16.json tools/extras/section16.py data/section-16.js
```

Then add `"section-16"` to `data/course.js` and a `<script>` tag to `index.html`.

## Releasing an update

Every `<script>` and stylesheet link in `index.html` ends in `?v=N`. Raise N with each release so
phones and browsers fetch the new files rather than mixing old cached ones with new ones.

## Publish with GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` publishes the site on every push to `main`.
In the repository's **Settings > Pages**, set **Source** to **GitHub Actions**.

## Content source

Lessons are adapted from Max's LPIC-1 lab workbooks. Terminal output is simulated and may
differ from a real Linux Mint VM.
