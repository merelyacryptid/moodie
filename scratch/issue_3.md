### 🎯 Problem Statement
Daily journal reflections should feel deeply personal. Fixed, hardcoded questions do not fit every user's life or daily rhythm. Users need to be able to edit existing reflection prompts, add custom prompts matching their interests, reorder them, or delete questions they don't find helpful, with the changes persisting strictly on their device for their user profile.

### 💡 Proposed Solution
1. **Dynamic Prompt Storage (`src/lib/prompts.ts`)**:
   - Store customizable prompts locally in `localStorage` under `moodie-journal-prompts` (keyed per browser/user).
   - Each prompt contains `{ id: string, text: string, category?: string }`.
   - Included in JSON backup export and restore so custom prompts persist across device transfers.
2. **Prompts Management UI**:
   - "Customize" button in the Journal tab on the Today page.
   - When active, lets users:
     - Inline edit existing prompt text.
     - Add new custom prompts with category tags (Check-in, Gratitude, Reflection, Growth, etc.).
     - Move prompts up/down to reorder them.
     - Delete prompts with one click.
     - Reset back to peaceful defaults at any time.
3. **Backwards-Compatible Answer Serialization**:
   - `getJournalAnswer` and `setJournalAnswer` preserve compatibility with both legacy array indexing and modern keyed prompt IDs, preventing answer shifts or data loss when prompts are customized.

### ✅ Acceptance Criteria
- [x] Journal prompts are fully customizable (add, edit inline, delete, reorder).
- [x] Changes persist locally for that user in browser storage.
- [x] Backwards-compatible answer extraction for historical entries.
- [x] Option to reset back to default reflection prompts.
- [x] Prompts included in JSON data backup export and restore.
