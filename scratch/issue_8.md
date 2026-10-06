### 🎯 Problem Statement
Desktop users who reflect daily often prefer navigating via keyboard rather than having to click every star, chip, and dropdown with a mouse. Fast keyboard shortcuts make daily reflection effortless and tactile.

### 💡 Proposed Solution
1. **Star Ratings**:
   - Number keys `1`–`5` set the active rating field (Mood, Energy, Activity, Stress).
   - `Tab` and `Shift+Tab` smoothly transition between rating categories.
2. **Time Slots**:
   - `[`, `]` or `Alt+1`, `Alt+2`, `Alt+3` toggle between Morning, Afternoon, and Evening reflection slots.
3. **Date Navigation**:
   - `Alt+LeftArrow` / `Alt+RightArrow` move between yesterday, today, and tomorrow.
4. **Quick Save**:
   - `Cmd+Enter` (macOS) / `Ctrl+Enter` (Windows/Linux) or `Cmd+S` / `Ctrl+S` immediately saves the reflection and triggers the celebration animation.
5. **Shortcuts Modal / Tooltip**:
   - Pressing `?` brings up a friendly keyboard shortcuts cheat sheet.

### ✅ Acceptance Criteria
- [ ] Number keys `1`–`5` map to star ratings on focused rating groups.
- [ ] `Cmd/Ctrl + Enter` saves the reflection.
- [ ] Accessible focus rings and ARIA attributes for all interactive chips and rating buttons.
- [ ] Keyboard shortcuts help modal accessible via `?` key.
