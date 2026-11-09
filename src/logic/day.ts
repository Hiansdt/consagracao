import { SCHEDULE } from '../data/schedule'
import { PRAYERS } from '../data/texts'
import type { State } from './progress'

export interface DayItem {
  key: string
  kind: 'reading' | 'prayer' | 'step'
  label: string
  sub: string
  textId: string | null
}

const KIND_LABEL = { evangelho: 'Evangelho', imitacao: 'Imitação de Cristo', tratado: 'Tratado', segredo: 'Segredo de Maria' }

// Tratado nº 231-232: what the consecration day asks besides the formula.
const FEAST_STEPS: DayItem[] = [
  { key: 'c:confissao', kind: 'step', label: 'Confissão', sub: 'nº 231', textId: null },
  { key: 'c:comunhao', kind: 'step', label: 'Comunhão', sub: 'na intenção de se dar a Jesus Cristo pelas mãos de Maria', textId: null },
  { key: 'c:assinar', kind: 'step', label: 'Escrever e assinar a fórmula', sub: 'nº 231', textId: null },
  { key: 'c:tributo', kind: 'step', label: 'Tributo', sub: 'um jejum, uma mortificação, uma esmola, um círio (nº 232)', textId: null },
]

export function itemsFor(day: number): DayItem[] {
  const plan = SCHEDULE[day - 1]
  if (!plan) return []
  const readings: DayItem[] = plan.readings.map((r) => ({
    key: `r:${r.textId ?? r.ref}`,
    kind: 'reading',
    label: KIND_LABEL[r.kind],
    sub: r.ref,
    textId: r.textId,
  }))
  const prayers: DayItem[] = plan.prayers.map((p) => ({
    key: `p:${p}`,
    kind: 'prayer',
    label: PRAYERS[p].title,
    sub: 'oração',
    textId: PRAYERS[p].textId,
  }))
  return day === 34 ? [...FEAST_STEPS.slice(0, 2), ...prayers, ...FEAST_STEPS.slice(2), ...readings] : [...readings, ...prayers]
}

export type DayStatus = 'done' | 'partial' | 'empty'

export function statusOf(state: State, day: number): DayStatus {
  const keys = itemsFor(day).map((i) => i.key)
  const done = (state.done[day] ?? []).filter((k) => keys.includes(k)).length
  return done === 0 ? 'empty' : done === keys.length ? 'done' : 'partial'
}

// Past days not fully completed, so the user can catch up without the dates moving.
export function pendingDays(state: State, today: number): number[] {
  const last = Math.min(today - 1, 34)
  const out: number[] = []
  for (let d = 1; d <= last; d++) if (statusOf(state, d) !== 'done') out.push(d)
  return out
}

export const completedDays = (state: State): number =>
  SCHEDULE.filter((p) => p.day <= 33 && statusOf(state, p.day) === 'done').length
