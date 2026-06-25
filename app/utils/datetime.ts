import { parseISO, format, formatDistanceToNow, isValid } from 'date-fns'

/**
 * DigitalOcean returns ISO-8601 timestamp strings (e.g. "2020-07-21T18:37:44Z"),
 * NOT unix milliseconds. Format everything through these helpers for consistency.
 */

/** "Jul 21, 2020" */
export function shortDate(iso?: string | null): string {
  if (!iso) return '—'
  const date = parseISO(iso)
  return isValid(date) ? format(date, 'MMM d, yyyy') : '—'
}

/** "5 years ago" */
export function relativeTime(iso?: string | null): string {
  if (!iso) return '—'
  const date = parseISO(iso)
  return isValid(date) ? `${formatDistanceToNow(date)} ago` : '—'
}
