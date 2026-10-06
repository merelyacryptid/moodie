### 🎯 Problem Statement
Many reflective users maintain a second brain or personal journal in tools like **Obsidian**, **Logseq**, or plain Markdown folders. While moodie offers a raw JSON backup, users cannot easily export their reflections as human-readable Markdown notes organized by date.

### 💡 Proposed Solution
1. **Markdown Export Options**:
   - Provide an "Export to Markdown / Obsidian" button in the Backup & Data modal.
   - Generates a `.zip` archive containing daily notes formatted as:
     `YYYY-MM-DD.md`
2. **Template Format**:
   ```markdown
   ---
   date: 2026-10-07
   mood: 4
   energy: 4
   sleep_hours: 7.5
   water: 2–3L
   stress: 2
   tags:
     - reflection
     - reading
     - development
   ---

   # Daily Reflection - 2026-10-07

   ### 🌅 Morning
   - **Mood**: ⭐⭐⭐⭐☆
   - **Energy**: ⭐⭐⭐⭐☆
   - **Activities**: Reading, Coding
   - **Note**: Had a productive morning working on the app.

   ### 📖 Journal
   > *Three things I'm grateful for*
   Quiet mornings, good coffee, and productive focus.
   ```
3. **Single-File or Zip Archive**:
   - Option to download all historical notes as a single combined Markdown file or a zipped folder of daily notes.

### ✅ Acceptance Criteria
- [ ] Export as Obsidian-compatible Markdown `.zip` available in Data / Backup modal.
- [ ] Includes valid YAML frontmatter with tags and metadata for search and dataview queries.
- [ ] Incorporates multi-session entries (Morning, Afternoon, Evening) and full journal answers.
- [ ] Client-side generation with zero server processing (using `JSZip` or native streams).
