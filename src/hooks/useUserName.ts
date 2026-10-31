"use client"

import { useState, useEffect, useCallback } from "react"
import { getUserName, setUserName } from "@/lib/user"

export function useUserName() {
  const [name, setName] = useState<string>(()=>getUserName())
  const [mounted] = useState(false)

  useEffect(() => {
    const handleUpdate = () => {
      setName(getUserName())
    }
    window.addEventListener("moodie_user_name_changed", handleUpdate)
    window.addEventListener("storage", handleUpdate)

    return () => {
      window.removeEventListener("moodie_user_name_changed", handleUpdate)
      window.removeEventListener("storage", handleUpdate)
    }
  }, [mounted])

  const updateName = useCallback((newName: string) => {
    setUserName(newName)
    setName(newName.trim())
  }, [])

  return { name, updateName, mounted }
}
