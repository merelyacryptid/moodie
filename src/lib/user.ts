// Local-first user preference utilities

const USER_NAME_KEY = "moodie_user_name"

export function getUserName(): string {
  if (typeof window === "undefined") return ""
  try {
    return localStorage.getItem(USER_NAME_KEY) || ""
  } catch {
    return ""
  }
}

export function setUserName(name: string): void {
  if (typeof window === "undefined") return
  try {
    const trimmed = name.trim()
    if (trimmed) {
      localStorage.setItem(USER_NAME_KEY, trimmed)
    } else {
      localStorage.removeItem(USER_NAME_KEY)
    }
    // Broadcast local event so all mounted components update reactively
    window.dispatchEvent(new Event("moodie_user_name_changed"))
  } catch {}
}
