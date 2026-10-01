"use client"

import { CalendarPage } from "@/features/calendar/CalendarPage"
import { useUserName } from "@/hooks/useUserName"

export default function Calendar() {
  const { name } = useUserName()
  return <CalendarPage userName={name} name={name} />
}
