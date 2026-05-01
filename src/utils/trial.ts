const KEY = '__trial_start__'
const DAYS = 7

export function getTrialInfo(): { expired: boolean; daysLeft: number; expireDate: Date } {
  let start = localStorage.getItem(KEY)
  if (!start) {
    start = String(Date.now())
    localStorage.setItem(KEY, start)
  }

  const startMs = parseInt(start, 10)
  const expireMs = startMs + DAYS * 24 * 60 * 60 * 1000
  const now = Date.now()
  const daysLeft = Math.max(0, Math.ceil((expireMs - now) / (24 * 60 * 60 * 1000)))

  return {
    expired: now > expireMs,
    daysLeft,
    expireDate: new Date(expireMs),
  }
}
