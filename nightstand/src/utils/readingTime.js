// Convert page counts to estimated reading time and back, using the user's
// configured reading speed. Used by the Matcher ("I have N hours") and Insights.

export function pagesToMinutes(pages, settings) {
  if (!pages) return null
  const { wordsPerMinute, wordsPerPage } = settings
  return Math.round((pages * wordsPerPage) / wordsPerMinute)
}

export function pagesToHours(pages, settings) {
  const mins = pagesToMinutes(pages, settings)
  return mins == null ? null : mins / 60
}

export function hoursToPages(hours, settings) {
  const { wordsPerMinute, wordsPerPage } = settings
  return Math.round((hours * 60 * wordsPerMinute) / wordsPerPage)
}

export function formatDuration(minutes) {
  if (minutes == null) return '—'
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}
