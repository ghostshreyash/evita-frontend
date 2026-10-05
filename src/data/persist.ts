/**
 * Keeps the field-side changes (tasks started, readings recorded, work
 * submitted) across a page refresh on the tablet.
 *
 * Stands in for the offline outbox until the API and IndexedDB sync exist. The
 * mock books are generated relative to today, so a snapshot from another day
 * would point at the wrong rows; anything not saved today is ignored.
 *
 * Captured photos are object URLs that die with the page, so they are dropped
 * here and their evidence entries come back as placeholder tiles.
 */
const today = () => new Date().toDateString()

export function loadSnapshot<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`evita.${key}`)
    if (!raw) return null
    const saved = JSON.parse(raw) as { day: string; data: T }
    return saved.day === today() ? saved.data : null
  } catch {
    return null
  }
}

export function saveSnapshot(key: string, data: unknown) {
  try {
    const json = JSON.stringify({ day: today(), data }, (k, v) => (k === "src" && typeof v === "string" && v.startsWith("blob:") ? undefined : v))
    localStorage.setItem(`evita.${key}`, json)
  } catch {
    // Storage full or blocked: the change still holds for this session
  }
}

/** `dd-MM-yyyy HH:mm` for right now — the stamp every field record carries */
export function stampNow() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}
