# MultiCV Manager

[简体中文](README.zh-CN.md) | English

MultiCV Manager is a local-first resume content and version management tool. It keeps reusable experience content separate from individual resume configurations, so the same experience can be maintained in multiple role-specific versions and assembled quickly for different applications.

## Highlights

- Local-first workspace persisted in the browser
- Profile, education, skills, and experience library
- Multiple writing versions for the same experience
- Bullet and full-paragraph editing modes
- Tags, search, drag-and-drop ordering, undo, and redo
- Resume section composition and saved resume configurations
- Live A4 preview and browser PDF export
- PDF, DOCX, Markdown, and text import
- Versioned Workspace JSON import and export
- Cynthia Wang demo workspace with two resume configurations
- Two printable resume templates

This OSS edition contains no AI service, API key handling, account system, analytics, or cloud storage. Resume data stays in the current browser unless you explicitly export a Workspace file.

## Quick Start

Requirements: Node.js 20+ and pnpm.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Choose the Cynthia demo to explore the complete workflow, or create a blank workspace.

## Core Workflow

1. Build a reusable library of education, skills, and experiences.
2. Maintain different versions of each experience for different job directions.
3. Assemble selected versions into resume sections.
4. Save the selection as a reusable resume configuration.
5. Preview and export the result as PDF.

## Workspace Data

Use the **Workspace** menu to export or import a `.multicv.json` file. Workspace files include profile information, content versions, resume configurations, templates, and formatting settings.

Personal Workspace files are ignored by Git by default. Keep them outside the repository when possible.

## Scripts

```bash
pnpm dev
pnpm lint
pnpm build
```

## Technology

- Next.js 16 and React 19
- TypeScript
- Zustand
- dnd-kit
- PDF.js, Mammoth, and Tesseract.js

## Privacy

MultiCV Manager runs locally and does not include a backend database. Imported documents are parsed in the browser. Browser storage can be cleared by the browser or operating system, so export Workspace backups regularly.

## License

[MIT](LICENSE)
