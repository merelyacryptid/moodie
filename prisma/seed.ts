import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

const adapter = new PrismaBetterSqlite3({
  url: "file:./dev.db",
})

const prisma = new PrismaClient({ adapter })

const ACTIVITIES = [
  "Reading",
  "Competitive Programming",
  "Development",
  "Study",
  "Exercise",
  "Walking",
  "Running",
  "Gym",
  "Yoga",
  "Movie",
  "TV",
  "Gaming",
  "Music",
  "Drawing",
  "Art",
  "Cooking",
  "Friends",
  "Family",
  "Nature",
  "Cafe",
  "Shopping",
  "Cleaning",
  "Travel",
  "Coding",
]

const HABITS = [
  { name: "Reading", icon: "📖", color: "#fde68a" },
  { name: "CP", icon: "💻", color: "#bbf7d0" },
  { name: "Development", icon: "⚡", color: "#bfdbfe" },
  { name: "Study", icon: "📚", color: "#c7d2fe" },
  { name: "Exercise", icon: "🏃", color: "#fed7aa" },
  { name: "Go Outside", icon: "🌿", color: "#d9f99d" },
  { name: "Movie", icon: "🎬", color: "#fecaca" },
]

async function main() {
  for (const name of ACTIVITIES) {
    await prisma.activity.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }

  for (const habit of HABITS) {
    await prisma.habit.upsert({
      where: { name: habit.name },
      update: {},
      create: habit,
    })
  }

  console.log("Seeded activities and habits")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
