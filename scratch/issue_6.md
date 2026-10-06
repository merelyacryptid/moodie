### 🎯 Problem Statement
Currently, users can create custom *activities* on the Today page, but the Habits page only tracks the hardcoded 7 default habits (`Reading`, `CP`, `Development`, `Study`, `Exercise`, `Go Outside`, `Movie`). There is no interface to add new habits to the monthly matrix, map custom activities to them, or customize their pastel colors and icons.

### 💡 Proposed Solution
1. **"Add Habit" Flow on Habits Page**:
   - Add a "+" button at the bottom of the habits list or in a management modal.
   - User provides:
     - Habit Name (e.g. "Meditation", "Journaling", "Drawing")
     - Emoji Icon (picker or input)
     - Pastel Color Palette selection (curated warm pastel tones)
     - Linked Activities: choose which activity tags trigger automatic completion of this habit.
2. **Habit Management / Editing**:
   - Option to edit habit names, update colors/icons, or archive/delete habits.
   - Ensure habits stored in `db.habits` can be deleted safely without breaking historical data or foreign keys.

### ✅ Acceptance Criteria
- [ ] Users can add custom habits to the monthly habit matrix.
- [ ] Users can pick custom icons and pastel background colors.
- [ ] Auto-sync works seamlessly between custom activity tags and newly created habits.
- [ ] Habits can be archived or deleted with confirmation.
- [ ] Custom habits are persisted in IndexedDB and included in JSON backup export/import.
