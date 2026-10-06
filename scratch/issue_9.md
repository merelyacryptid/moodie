### 🎯 Problem Statement
Running the linter on the current codebase highlights several React 19 / ESLint 9 warnings and errors:
1. **Cascading Renders**:
   - `TodayPage.tsx` and `useUserName.ts` call `setState` synchronously inside `useEffect` bodies (`setCustomActivities(loadList(...))`, `setLoading(true)`, `setName(getUserName())`), which causes double rendering and potential hydration mismatch.
   - Missing `date` dependency in `TodayPage.tsx` effect.
2. **Strict Typing**:
   - Loose `any` types in `TodayPage.tsx`, `db.ts`, `discoveries.ts`, and `prisma.ts`.
3. **JSX Escapes**:
   - Unescaped entity `'` in `TodayPage.tsx` line 665.

### 💡 Proposed Solution
1. **Initialize State Directly**:
   - Replace synchronous `useEffect` calls with state initializer functions:
     ```typescript
     const [customActivities, setCustomActivities] = useState<string[]>(() => loadList(CUSTOM_KEY))
     ```
2. **Eliminate Loose `any` Types**:
   - Provide explicit TypeScript interfaces or Dexie types for database entries and API responses.
3. **Fix Unescaped Entities & Unused Variables**:
   - Use `&apos;` in JSX strings.
   - Remove or use the unused `streak` variable in `HabitsPage.tsx`.

### ✅ Acceptance Criteria
- [ ] `npm run lint` passes with 0 errors and 0 warnings.
- [ ] No synchronous `setState` calls inside top-level effects.
- [ ] Strict type safety without unnecessary `any` casts.
