### 🎯 Problem Statement
Users need the ability to cleanly delete individual time slot reflections (Morning, Afternoon, Evening) as well as wipe an entire day's entry when they want to start fresh or remove inaccurate logs. Furthermore, habit checkmarks auto-synced from those reflections must gracefully recompute rather than leaving orphaned habit completions.

### 💡 Proposed Solution
1. **Time Slot Reflection Deletion**:
   - Provide a confirmation-guarded "Delete this reflection" button on the Today page when an entry exists for that time slot.
   - On the Calendar day modal, provide a "Delete" button alongside "Edit" on each recorded reflection card.
   - Calling `deleteEntry(id)` deletes the entry from IndexedDB and automatically recomputes remaining activities for that date, clearing habit checkmarks that no longer have supporting activities.
2. **Entire Day Deletion**:
   - Provide a "Delete entire day" button on both the Today page and Calendar modal.
   - Confirmation dialog clearly explains that all reflections and habit checkmarks for this date will be cleared.
   - Calling `deleteDayEntries(date)` cleanly purges all reflections and habit completions for that date from IndexedDB.
3. **Calendar to Today Reflection Editing**:
   - Each reflection card in the Calendar day modal has an "Edit" button that navigates directly to `/?date=YYYY-MM-DD&timeOfDay=...`, prefilling the exact reflection for editing.

### ✅ Acceptance Criteria
- [x] Users can delete an individual time slot reflection (Morning, Afternoon, Evening) with confirmation.
- [x] Users can delete an entire day's entries with confirmation.
- [x] Habit completions and streaks automatically recompute upon reflection deletion.
- [x] Calendar modal displays "Edit" and "Delete" buttons for each reflection card.
- [x] 100% local-first IndexedDB operations with zero data leakage.
