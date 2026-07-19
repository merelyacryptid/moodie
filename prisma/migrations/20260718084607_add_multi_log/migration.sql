-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Entry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "timeOfDay" TEXT NOT NULL DEFAULT 'morning',
    "mood" INTEGER NOT NULL,
    "energy" INTEGER NOT NULL,
    "activityLevel" INTEGER NOT NULL DEFAULT 0,
    "sleepHours" REAL NOT NULL DEFAULT 0,
    "waterLevel" TEXT NOT NULL DEFAULT '',
    "stress" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "loggedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Entry" ("activityLevel", "createdAt", "date", "energy", "id", "mood", "note", "sleepHours", "stress", "updatedAt", "waterLevel") SELECT "activityLevel", "createdAt", "date", "energy", "id", "mood", "note", "sleepHours", "stress", "updatedAt", "waterLevel" FROM "Entry";
DROP TABLE "Entry";
ALTER TABLE "new_Entry" RENAME TO "Entry";
CREATE UNIQUE INDEX "Entry_date_timeOfDay_key" ON "Entry"("date", "timeOfDay");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
