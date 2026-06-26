/**
 * Per-Droplet notes — a feature the official console lacks.
 *
 * DigitalOcean has no API field for arbitrary Droplet notes, so we keep them client-side,
 * keyed by `${teamId}:${dropletId}` (scoped per team so notes never bleed across accounts),
 * persisted to localStorage.
 */
export const useDropletNotesStore = defineStore('droplet-notes', () => {
  const auth = useDoAuthStore()
  const notes = ref<Record<string, string>>({})

  const keyFor = (dropletId: number) => `${auth.activeId ?? 'none'}:${dropletId}`

  const getNote = (dropletId: number) => notes.value[keyFor(dropletId)] ?? ''
  const hasNote = (dropletId: number) => Boolean(notes.value[keyFor(dropletId)])

  function setNote(dropletId: number, text: string) {
    const key = keyFor(dropletId)
    const trimmed = text.trim()
    if (trimmed) {
      notes.value = { ...notes.value, [key]: trimmed }
    } else {
      notes.value = Object.fromEntries(Object.entries(notes.value).filter(([k]) => k !== key))
    }
  }

  return { notes, getNote, hasNote, setNote }
}, {
  persist: { pick: ['notes'] }
})
