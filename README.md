# moodie 🌻

> A gentle, playful, and local-first reflection companion.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Dexie.js](https://img.shields.io/badge/Dexie.js-IndexedDB-f59e0b?style=flat)](https://dexie.org/)
[![Privacy](https://img.shields.io/badge/Privacy-100%25_Local--First-emerald?style=flat)](https://github.com)

**moodie** is a personal wellbeing web app created to help you gently reflect on your days, observe the small things and draw patterns when life gets too busy.

Inspired by the warmth and playfulness of **Finch**, **Headspace**, **Apple Journal**, and **Spotify Wrapped**, i wanted to make something that feels more like exploring yourself than fixing yourself.

No clinical dashboards. No rigid productivity scores. No logins, accounts, or cloud storage. Everything stays privately in your browser.

---

## Features

### 1. Today & Journaling
- **Gentle Daily Reflection**: Track how you're feeling with tactile 1–5 star ratings for **Mood**, **Energy**, **Activity Level**, and **Stress**.
- **Time-of-Day Slots**: Log reflections across **Morning**, **Afternoon**, and **Evening** to capture how your mood ebbs and flows throughout the day. Keeps in mind that mood is not a constant thing throughout the day (Something many apps forget)
- **Sleep & Water Tracking**: Log your sleep hours and hydration levels (`<1L`, `1–2L`, `2–3L`, `3L+`).
- **Activity Chips**: Tag from 24+ built-in activities (Reading, Exercise, Friends, Nature, Cooking, Gaming, etc.) or create and manage your own custom activities.
- **Tiny Note**: Jot down a 200-character snapshot of your moment.
- **Mindful Journaling**: Dedicated journal tab with guided prompts (*"How am I feeling right now?"*, *"Three things I'm grateful for"*, *"Something I learned today"*).
- **Date Navigation**: Easily move back and forward in time to add or review past reflections.
- **Celebration Moment**: Gentle feedback (*"✨ Another star added. See you tomorrow."*) upon saving.

### 2. Calendar View
- **Monthly Overview**: A monthly grid displaying soft pastel cards colored by overall mood (light yellow, warm cream, light sky blue, soft lavender).
- **Mood Emojis**: Visual mood cues for each day (`😁`, `😊`, `🙂`, `😐`, `😔`).
- **Reflection Inspector**: Tap any day to open a modal detailing all recorded sessions, activity tags, notes, and full journal entries.
- **Intra-Day Mood Wave**: For days with multiple sessions, view a miniature line graph illustrating how your energy and mood shifted from morning to night.
- **Preview Mode**: Includes sample data preview mode so first-time visitors can explore the UI before logging their first entry.

### ⭐ 3. Discoveries
- **Spotify Wrapped-style Insights**: Uncover gentle correlations and patterns without clinical charts or judgment.
- **Key Metrics**:
  - Overall Average Mood, Energy, and Sleep
  - Current Reflection Streak & 🏆 All-Time Best Streak
  - Happiest Weekdays
  - Sleep & Mood relationships (e.g., mood after 7+ hours of sleep vs. under 6 hours)
  - Hydration patterns
- **Dynamic Mood Wave**: A smooth, interactive SVG spline graph showing your mood trajectory across past reflections.
- **Activity & Impact Breakdown**: Visual bar charts displaying your most frequent activities and which activities provide the biggest relative mood boost.
- **Gentle Language**: Observations are framed with curiosity (*"We've noticed..."*, *"It seems..."*, *"So far..."*) rather than rigid assertions.

### 4. Habits Tracker
- **Monthly Habit Matrix**: Track daily habits (Reading, Development, Study, Exercise, Go Outside, Movie, etc.) across days of the current month.
- **Automated Sync**: Logging an activity in your daily reflection automatically completes the matching habit in your grid.
- **Manual Overrides**: Toggle any day's habit on or off with user-override support.
- **Progress Metrics**: View completion percentages, current streaks, and longest streaks for each habit.

### 5. 100% Local-First & Private
- **Zero Cloud, Zero Login**: No account creation, no trackers, and no external databases.
- **IndexedDB via Dexie.js**: All data is stored directly in your browser with persistent storage request support.
- **Backup & Restore**: Export your entire history to a JSON file or restore from a previous backup at any time.
- **SQLite / Server Migration**: Built-in automatic migration for existing Prisma/SQLite local entries.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server & Client Components) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict typing) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) with CSS variables & `@theme` tokens |
| **Local Database** | [Dexie.js](https://dexie.org/) (IndexedDB wrapper) & `dexie-react-hooks` |
| **Server ORM (Optional)** | [Prisma](https://www.prisma.io/) + SQLite (`@prisma/adapter-better-sqlite3`) |
| **Icons & UI** | [Lucide React](https://lucide.dev/), `@base-ui/react`, Radix Dialog |
| **Typography** | [Nunito](https://fonts.google.com/specimen/Nunito) & [Fredoka](https://fonts.google.com/specimen/Fredoka) |

---

## Project Structure

```text
moodie/
├── prisma/                     # Prisma schema, migrations, and seed script
│   ├── schema.prisma           # SQLite schema (Entry, Activity, Habit, HabitCompletion)
│   └── seed.ts                 # Database seeder
├── public/                     # Static assets & favicon
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # Local/fallback API endpoints (entries, habits, discoveries)
│   │   ├── calendar/           # Calendar page route
│   │   ├── discoveries/        # Discoveries page route
│   │   ├── habits/             # Habits tracker route
│   │   ├── globals.css         # Tailwind v4 theme definitions and font variables
│   │   ├── layout.tsx          # Root layout (fonts, ambient background, bottom nav)
│   │   └── page.tsx            # Home route (welcome gate & Today reflection page)
│   ├── components/             # Reusable UI components
│   │   ├── ActivityChip.tsx    # Selectable activity pill chip
│   │   ├── BottomNavigation.tsx# Floating bottom navigation bar
│   │   ├── CalendarDay.tsx     # Calendar day card with mood styling
│   │   ├── EyeBackground.tsx   # Interactive ambient cursor-tracking canvas
│   │   ├── MockDataNotice.tsx  # Sample data preview indicator
│   │   ├── StarRating.tsx      # Interactive 5-star rating component
│   │   └── ui/                 # Dialog modal & Button primitives
│   ├── features/               # Feature-specific modules
│   │   ├── today/              # Today reflection, multi-session tabs, journaling, backup
│   │   ├── calendar/           # Monthly calendar grid & day inspection modal
│   │   ├── discoveries/        # Insights calculations, MoodWave chart, activity rankings
│   │   ├── habits/             # Monthly habits matrix & streak calculations
│   │   └── welcome/            # Interactive greeting screen, name setup & daily quote
│   ├── hooks/                  # Custom React hooks (useUserName)
│   ├── lib/                    # Core utilities and business logic
│   │   ├── db.ts               # Dexie IndexedDB setup, queries, sync, backup & restore
│   │   ├── discoveries.ts      # Statistical correlations, patterns, and timeline parser
│   │   ├── mockData.ts         # Realistic sample dataset for empty states
│   │   ├── quotes.ts           # Curated daily reflection quotes
│   │   ├── user.ts             # Local user preference storage
│   │   └── utils.ts            # Formatting & class merge helpers
│   └── types/                  # TypeScript interfaces and constants
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.18+ (Node 20+ recommended)
- **npm**, **pnpm**, or **yarn**

### 1. Clone the repository

```bash
git clone https://github.com/your-username/moodie.git
cd moodie
```

### 2. Install dependencies

```bash
npm install
```

### 3. (Optional) Initialize Prisma Database

If running locally with the server SQLite backend:

```bash
npx prisma generate
```

*(Note: moodie is designed local-first with browser IndexedDB, so the app runs out of the box even without server database setup!)*

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧭 Navigation & Pages

| Tab | Route | Description |
|---|---|---|
| **Today** | `/` | Morning, afternoon, and evening reflection form + mindful journal |
| **Calendar** | `/calendar` | Monthly view colored by mood with intra-day inspection modal |
| **Discoveries** | `/discoveries` | Visual mood wave chart, activity rankings, and correlation cards |
| **Habits** | `/habits` | Monthly habit grid with auto-sync from logged activities |

---

## Data & Privacy Guarantee

- **No remote tracking**: No Google Analytics, telemetry, or remote databases.
- **Client-side storage**: Entries, habits, and preferences are saved directly to your browser's **IndexedDB** using Dexie.js.
- **Portable data**: Go to the **Today** page and tap the **Backup & Restore** button to download a complete `.json` copy of your data or transfer it to another browser.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
