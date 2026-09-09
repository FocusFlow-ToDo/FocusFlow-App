/** 
 * Utility to match a KeyboardEvent against a shortcut string like "Control+Shift+K"
 */
export function matchShortcut(e: KeyboardEvent | React.KeyboardEvent, shortcut: string): boolean {
  if (!shortcut) return false

  const parts = shortcut.toLowerCase().split("+")
  const key = e.key.toLowerCase()

  const hasCtrl = parts.includes("control") || parts.includes("ctrl")
  const hasMeta = parts.includes("meta") || parts.includes("command") || parts.includes("cmd")
  const hasShift = parts.includes("shift")
  const hasAlt = parts.includes("alt")

  // The final part of the shortcut is typically the physical key
  const finalKey = parts[parts.length - 1]

  const ctrlMatched = hasCtrl === (e.ctrlKey)
  const metaMatched = hasMeta === (e.metaKey)
  const shiftMatched = hasShift === (e.shiftKey)
  const altMatched = hasAlt === (e.altKey)
  
  // Special case for matching key
  const keyMatched = key === finalKey || e.code.toLowerCase() === finalKey.toLowerCase()

  return ctrlMatched && metaMatched && shiftMatched && altMatched && keyMatched
}

/**
 * Returns a human-friendly string for a KeyboardEvent (e.g. "Control+Shift+K")
 */
export function getEventShortcutString(e: KeyboardEvent | React.KeyboardEvent): string {
  const parts: string[] = []
  
  if (e.ctrlKey) parts.push("Ctrl")
  if (e.metaKey) parts.push("Cmd")
  if (e.altKey) parts.push("Alt")
  if (e.shiftKey) parts.push("Shift")
  
  // Only add the key if it's not a standalone modifier
  const key = e.key
  if (!["Control", "Meta", "Alt", "Shift", "OS"].includes(key)) {
    // If it's a character or alphanumeric, use it directly
    if (key === " " || key === "Spacebar") {
      parts.push("Space")
    } else if (key.length === 1) {
      parts.push(key.toLowerCase())
    } else {
      parts.push(key)
    }
  }
  
  return parts.join("+")
}
