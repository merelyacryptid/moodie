# moodie

> A gentle, playful, and local-first reflection companion.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Dexie.js](https://img.shields.io/badge/Dexie.js-IndexedDB-f59e0b?style=flat)](https://dexie.org/)
[![Privacy](https://img.shields.io/badge/Privacy-100%25_Local--First-emerald?style=flat)](https://github.com)

I built moodie because most mood trackers feel like clinical dashboards or rigid productivity tools. Inspired by things like Finch, Apple Journal, and Spotify Wrapped, I wanted something that feels more like exploring yourself than trying to fix yourself.

No clinical scores. No accounts or cloud storage. Everything stays privately in your browser.

---

## What's Inside

- **Today & Journaling**: Log reflections across Morning, Afternoon, and Evening slots—because mood shifts throughout the day (something many apps forget). Includes 1-5 star ratings for mood, energy, and stress, plus sleep and water tracking, custom activity chips, and guided prompts.
- **Calendar**: A monthly view colored softly by mood, with an intra-day wave to see how your energy moved from morning to night.
- **Discoveries**: Spotify Wrapped-style observations rather than cold charts. Gentle correlations between sleep, habits, and mood that stay curious without claiming causation ("We've noticed...", "It seems...").
- **Habits**: A monthly tracker that automatically marks off habits when you log matching activities in your reflection, with manual overrides and streak tracking.
- **Local-First & Private**: Stored directly in IndexedDB via Dexie.js. No tracking, no external servers, and full JSON backup/restore anytime.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router) & React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Dexie.js (IndexedDB) with optional Prisma/SQLite fallback
- **Icons & UI**: Lucide React, Base UI, Radix primitives

---

## Getting Started

### Prerequisites

Node.js 18.18+ (Node 20+ recommended)

### Run Locally

```bash
git clone https://github.com/merelyacryptid/moodie.git
cd moodie
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start reflecting.

---

## Roadmap

- [x] Multi-session daily reflections (Morning, Afternoon, Evening)
- [x] Tactile keyboard shortcuts (1-5 for stars, quick saving)
- [x] Local backup and restore (JSON export/import)
- [x] Deleting and editing individual time slots
- [ ] Progressive Web App (PWA) and offline mobile install
- [ ] Obsidian & Markdown daily notes export
- [ ] Zero-knowledge cross-device sync (E2EE device pairing)

---

## License

MIT
