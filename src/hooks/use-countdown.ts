import { useEffect, useState } from "react"

const msUntil = (target: number | null | undefined) => (target ? Math.max(target - Date.now(), 0) : 0)

/**
 * Milliseconds remaining until `target` (epoch ms), ticking once a second and
 * stopping at zero. Used for OTP expiry and the resend cooldown.
 */
export function useCountdown(target: number | null | undefined) {
  const [remaining, setRemaining] = useState(() => msUntil(target))
  const [tracked, setTracked] = useState(target)

  // A new deadline resets the clock during render, so the first paint is correct.
  if (tracked !== target) {
    setTracked(target)
    setRemaining(msUntil(target))
  }

  useEffect(() => {
    if (!target) return
    const id = setInterval(() => {
      const left = msUntil(target)
      setRemaining(left)
      if (left === 0) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [target])

  return { remaining, expired: remaining === 0, seconds: Math.ceil(remaining / 1000) }
}

/** 95_000 → "1:35" */
export function formatDuration(ms: number) {
  const total = Math.ceil(ms / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}
