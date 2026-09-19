import Dexie, { type EntityTable } from "dexie";
import type { Entry, Habit, HabitCompletion } from "@/types";

const db = new Dexie("moodie") as Dexie & {
  entries: EntityTable<Entry, "id">;
  habits: EntityTable<Habit, "id">;
  completions: EntityTable<HabitCompletion>;
};

db.version(1).stores({
  entries: "id, &[date+timeOfDay], date, *activities",
  habits: "id, name",
  completions: "[habitId+date], habitId, date",
});

// Runs once, the first time the database is created
db.on("populate", () => {
  db.habits.bulkAdd([
    { id: "Reading", name: "Reading", icon: "📖", color: "#fde68a" },
      { id: "CP", name: "CP", icon: "💻", color: "#bbf7d0" },
      { id: "Development", name: "Development", icon: "⚡", color: "#bfdbfe" },
      { id: "Study", name: "Study", icon: "📚", color: "#c7d2fe" },
      { id: "Exercise", name: "Exercise", icon: "🏃", color: "#fed7aa" },
      { id: "Go Outside", name: "Go Outside", icon: "🌿", color: "#d9f99d" },
      { id: "Movie", name: "Movie", icon: "🎬", color: "#fecaca" },
  ]);
});

export { db };