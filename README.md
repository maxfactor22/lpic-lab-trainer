# LPIC-1 Lab Trainer

A static, interactive Linux training app adapted from **LPIC - Section 2**, starting with Lab 1: Identify Basic System Information.

## Version 1 includes

- A junior engineer support-ticket scenario
- A simulated Linux terminal for `uname` practice
- Five guided command tasks
- Two knowledge-check questions
- A no-hint final challenge
- Progress saved in the browser with `localStorage`
- Responsive and keyboard-friendly design
- A GitHub Pages deployment workflow

The simulated output is representative. Output on a real Linux Mint virtual machine will vary.

## Run locally

No package installation or build step is required.

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Publish with GitHub Pages

1. Create an empty GitHub repository, such as `lpic-lab-trainer`.
2. Copy these files into the repository.
3. Commit and push to the `main` branch:

```bash
git init
git add .
git commit -m "Build interactive LPIC system information lesson"
git branch -M main
git remote add origin https://github.com/YOUR-USER/lpic-lab-trainer.git
git push -u origin main
```

4. In the GitHub repository, open **Settings > Pages**.
5. Under **Build and deployment**, set **Source** to **GitHub Actions**.
6. The included workflow publishes the site after each push to `main`.

## Project structure

```text
.
├── .github/workflows/deploy-pages.yml
├── .nojekyll
├── app.js
├── index.html
├── styles.css
└── README.md
```

## Suggested next iteration

Add Lesson 2: Check the Bash Shell Version. Reuse the lesson shell, then add:

- `bash --version` terminal output
- A short explanation of long options with two dashes
- A guided observation prompt
- A recall challenge without command hints

## Content source

Adapted from the user's Word document **LPIC - Section 2.docx**, Lab 1: Identify Basic System Information.
