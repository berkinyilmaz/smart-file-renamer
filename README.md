# Smart File Renamer
Batch-rename any set of files with custom patterns — preview every change before you download.

---

## Live Demo
_Coming soon_

---

## Features
- **Custom pattern engine** — build names with `{name}`, `{n}` and `{date}` tokens
- **Find & Replace** — plain text or full regular expressions
- **Case transforms** — lowercase, UPPERCASE, Title Case, kebab-case, snake_case
- **Sequential numbering** — configurable start value and zero-padding
- **Extension control** — keep, lowercase, replace, or strip extensions
- **Live preview** — see old → new for every file as you type
- **Conflict detection** — duplicate or empty names are flagged before you export
- **One-click download** — every file saved under its new name
- **Drag & drop** — drop files straight onto the page

---

## Tech Stack
- React 19 (Vite)
- CSS custom properties (Apple-inspired dark UI, no framework)
- Zero dependencies beyond React — pure browser APIs

---

## How It Works
1. Drop your files in (or click to browse)
2. Define a naming pattern and tweak case, numbering, and extension rules
3. Preview the before → after list and resolve any conflicts
4. Hit **Download renamed** and every file is saved with its new name

> Everything runs entirely in your browser. No file ever leaves your machine.

---

## Installation
```bash
git clone https://github.com/berkinyilmaz/smart-file-renamer.git
cd smart-file-renamer
npm install
npm run dev
```

---

## Privacy
Everything runs **locally in your browser**. Files are read, renamed, and downloaded on your device — nothing is uploaded.
# smart-file-renamer
