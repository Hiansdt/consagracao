import type { LocalDate } from './calendar'

export const KEY = 'consagracao.v1'
const SCHEMA = 1

export interface State {
  schema: 1
  feastId: string
  feastDate: LocalDate
  // day number → keys of the items marked done ("r:<textId>", "p:<prayerId>", "c:<step>")
  done: Record<number, string[]>
  lastBackup?: string
}

export type LoadResult = { ok: true; state: State | null } | { ok: false; reason: string }

export const newState = (feastId: string, feastDate: LocalDate): State => ({ schema: SCHEMA, feastId, feastDate, done: {} })

function isState(v: unknown): v is State {
  const s = v as State
  return (
    !!s &&
    s.schema === SCHEMA &&
    typeof s.feastId === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(s.feastDate) &&
    typeof s.done === 'object' &&
    Object.values(s.done).every((a) => Array.isArray(a))
  )
}

// A failed read must never lead to a write: the caller shows the import
// screen and the stored bytes stay as they were.
export function load(): LoadResult {
  let raw: string | null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    return { ok: false, reason: 'O navegador bloqueou o acesso ao armazenamento.' }
  }
  if (raw === null) return { ok: true, state: null }
  try {
    const v = JSON.parse(raw)
    return isState(v) ? { ok: true, state: v } : { ok: false, reason: 'Os dados salvos estão num formato desconhecido.' }
  } catch {
    return { ok: false, reason: 'Os dados salvos estão corrompidos.' }
  }
}

export function save(s: State): void {
  localStorage.setItem(KEY, JSON.stringify(s))
}

export function toggle(s: State, day: number, key: string): State {
  const items = s.done[day] ?? []
  const next = items.includes(key) ? items.filter((k) => k !== key) : [...items, key]
  const done = { ...s.done }
  if (next.length) done[day] = next
  else delete done[day]
  return { ...s, done }
}

export const exportBackup = (s: State): Blob =>
  new Blob([JSON.stringify({ app: 'consagracao-total', ...s }, null, 2)], { type: 'application/json' })

export function importBackup(json: string): State {
  let v: Record<string, unknown>
  try {
    v = JSON.parse(json)
  } catch {
    throw new Error('Este arquivo não é um backup válido.')
  }
  const { app, ...rest } = v
  if (app !== 'consagracao-total' || !isState(rest)) throw new Error('Este arquivo não é um backup deste app.')
  return rest
}

export async function requestPersist(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false
  } catch {
    return false
  }
}
