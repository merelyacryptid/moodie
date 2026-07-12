You are an expert full-stack software engineer and UI/UX designer.

Build a beautiful, minimal, local-first personal wellbeing web app called "Polaris."

This application is for personal use only. There should be NO authentication, NO accounts and NO cloud storage.

The goal is to help users gently reflect on their days and gradually discover what habits are associated with better wellbeing.

The app should feel optimistic, playful and calming.

Do NOT make it feel like a medical app, analytics dashboard or productivity tracker.

The overall feeling should be inspired by:
- Headspace
- Finch
- Apple Journal
- Spotify Wrapped

The app should be simple enough to run locally while having clean architecture and maintainable code.

----------------------------------------------------
TECH STACK
----------------------------------------------------

Use:

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- shadcn/ui
- Framer Motion (only subtle animations)

The project should run with

npm install

npx prisma migrate dev

npm run dev

----------------------------------------------------
DESIGN LANGUAGE
----------------------------------------------------

Design principles:

- bright
- warm
- playful
- minimal
- rounded
- lots of whitespace
- cute
- gentle
- soft pastel colors

Avoid:

- dark themes
- clinical UI
- dashboards
- tables
- dense graphs

Use:

- stars instead of numeric ratings
- friendly wording
- rounded cards
- subtle hover animations
- cream backgrounds
- soft yellow accents

Never use words like

Analysis
Diagnosis
Problem
Result
Risk
Prediction

Instead use

Discoveries
Patterns
Reflections
Experiments
Things that seem to help
What Actually Works
Little Wins

The app should feel like exploring yourself rather than fixing yourself.

----------------------------------------------------
DATABASE
----------------------------------------------------

Use Prisma + SQLite.

Create these models.

Entry

- id
- date
- mood
- energy
- activityLevel
- sleepHours
- waterLevel
- stress
- note
- createdAt
- updatedAt

Activity

- id
- name

EntryActivity

Many-to-many relationship between Entry and Activity.

Habit

- id
- name
- icon
- color

HabitCompletion

- id
- habitId
- date
- completed

----------------------------------------------------
NAVIGATION
----------------------------------------------------

Bottom navigation.

🏠 Today

📅 Calendar

⭐ Discoveries

🌱 Habits

----------------------------------------------------
PAGE 1
TODAY
----------------------------------------------------

The home page is today's reflection.

Show today's date.

Allow only ONE entry per day.

If today's entry already exists,
populate the form for editing.

Fields

Mood

⭐⭐⭐⭐☆

(1–5 stars)

Energy

⭐⭐⭐⭐☆

Activity Level

⭐⭐⭐⭐☆

Sleep

Number input
(hours)

Water

Dropdown

<1L

1–2L

2–3L

3L+

Stress

5-star rating

Activities

Multi-select chips

Reading

Competitive Programming

Development

Study

Exercise

Walking

Running

Gym

Yoga

Movie

TV

Gaming

Music

Drawing

Art

Cooking

Friends

Family

Nature

Cafe

Shopping

Cleaning

Travel

Coding

Tiny Note

Optional

Maximum 120 characters.

Button

Save Today's Reflection

After saving show

✨

Another star added.

See you tomorrow.

----------------------------------------------------
PAGE 2
CALENDAR
----------------------------------------------------

Display a monthly calendar.

Each day should show

the date

and above it

an emoji based on mood.

Examples

😁

😊

🙂

😐

😔

Clicking a day opens a modal.

Show

Mood

Energy

Sleep

Water

Activities

Stress

Note

Color each day softly based on mood.

High mood

light yellow

Neutral

cream

Low

light blue

Very low

lavender

----------------------------------------------------
PAGE 3
DISCOVERIES
----------------------------------------------------

This page should NOT use graphs.

Instead generate beautiful insight cards.

Examples

⭐ Average Mood

⭐ Average Sleep

⭐ Average Energy

⭐ Longest Logging Streak

⭐ Current Logging Streak

⭐ Most Common Activity

⭐ Happiest Weekday

⭐ Average Water Intake

⭐ Average Mood after 7+ hours of sleep

⭐ Average Mood under 6 hours

⭐ Activity associated with highest average mood

⭐ Number of reflections completed

If insufficient data exists

show

"Keep exploring. More reflections help reveal new patterns."

Cards should feel like discoveries instead of statistics.

Example

⭐

Reading often appears on your happiest days.

🌿

You seem to have more energy after sleeping over 7 hours.

☕

Coffee appears to boost your energy more than your mood.

Use friendly language.

Never imply causation.

Use wording like

"We've noticed..."

"It seems..."

"So far..."

----------------------------------------------------
PAGE 4
HABITS
----------------------------------------------------

Create a monthly habit tracker.

Rows

Habits

Columns

Days of the current month.

Example

Reading

CP

Development

Study

Exercise

Go Outside

Movie

Each cell is

■ completed

□ incomplete

Use rounded pastel squares.

Clicking a square toggles completion.

The habit tracker should automatically check habits that correspond to selected activities in today's reflection.

For example

If Reading is selected as an activity,

the Reading habit is automatically completed.

Users can still manually toggle any habit.

Show completion percentage beside each habit.

Example

Reading

82%

Also show

Current Streak

Longest Streak

----------------------------------------------------
COMPONENTS
----------------------------------------------------

Create reusable components.

Examples

StarRating

ActivityChip

HabitGrid

DiscoveryCard

CalendarDay

BottomNavigation

ReflectionCard

----------------------------------------------------
FOLDER STRUCTURE
----------------------------------------------------

Organize code cleanly.

app/

components/

features/

today/

calendar/

discoveries/

habits/

lib/

prisma/

hooks/

types/

----------------------------------------------------
CODE QUALITY
----------------------------------------------------

Use strict TypeScript.

Keep components small.

Comment important sections.

Use reusable hooks where appropriate.

Avoid unnecessary complexity.

This project should be beginner-friendly and easy to understand.

----------------------------------------------------
FUTURE FEATURES
----------------------------------------------------

Leave TODO comments where appropriate for future additions.

Examples

- AI summaries
- Monthly Wrapped
- Know Yourself Quiz
- Personalized recommendations
- Pattern discovery engine
- Similar day matching

Do NOT implement these yet.

Only prepare the architecture so they can be added later.

----------------------------------------------------
OVERALL GOAL
----------------------------------------------------

This is not a mood tracker.

It is a gentle reflection companion.

The app should help users collect small moments from everyday life and gradually discover what seems to help them feel their best.

The experience should feel calm, hopeful, playful and delightful.