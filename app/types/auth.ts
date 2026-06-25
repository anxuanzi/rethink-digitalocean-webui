/**
 * A DigitalOcean Personal Access Token the user has connected, plus the team/account it
 * belongs to (captured once, at add-time, from GET /v2/account). A DO PAT is scoped to a
 * single team, so each saved token represents one team the user can switch into.
 */
export interface SavedToken {
  /** Local id (not from DigitalOcean) — identifies the entry in our list. */
  id: string
  /** Display name; defaults to the team name, user-renameable. */
  label: string
  /** The raw DO Personal Access Token. Lives only in this browser. */
  token: string
  /** Account email for this token (shown as a secondary identifier). */
  accountEmail: string
  /** Team UUID, used to dedupe; may be null if the token has no team context. */
  teamUuid: string | null
  /** Team name as returned by the account endpoint. */
  teamName: string | null
  /** When this token was added, ISO-8601. */
  addedAt: string
}
