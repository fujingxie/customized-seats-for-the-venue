const KEY = '__trial_start__'
const DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export function getTrialInfo(): { expired: boolean; daysLeft: number; secondsLeft: number; expireDate: Date } {
  let start = localStorage.getItem(KEY)
  if (!start) {
    start = String(Date.now())
    localStorage.setItem(KEY, start)
  }

  const startMs = parseInt(start, 10)
  const expireMs = startMs + DURATION_MS
  const now = Date.now()
  const msLeft = Math.max(0, expireMs - now)
  const secondsLeft = Math.ceil(msLeft / 1000)
  const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000))

  return {
    expired: now > expireMs,
    daysLeft,
    secondsLeft,
    expireDate: new Date(expireMs),
  }
}
