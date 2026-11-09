// Dates are 'YYYY-MM-DD' strings. Arithmetic runs on UTC midnights so DST
// never shifts a calendar day.
export type LocalDate = string

export type Phase = 'preliminar' | 'semana1' | 'semana2' | 'semana3' | 'festa'

export interface Feast {
  id: string
  name: string
  date: LocalDate
  // The fixed date, when the Brazilian calendar moved the celebration.
  movedFrom?: LocalDate
}

export interface FeastOption extends Feast {
  start: LocalDate
  available: boolean
}

export const PREP_DAYS = 33

const pad = (n: number) => String(n).padStart(2, '0')

const toUTC = (d: LocalDate) => {
  const [y, m, day] = d.split('-').map(Number)
  return Date.UTC(y, m - 1, day)
}

const fromUTC = (ms: number): LocalDate => {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export const ymd = (y: number, m: number, d: number): LocalDate => `${y}-${pad(m)}-${pad(d)}`

export const addDays = (d: LocalDate, n: number): LocalDate => fromUTC(toUTC(d) + n * 86400000)

export const diffDays = (from: LocalDate, to: LocalDate) => Math.round((toUTC(to) - toUTC(from)) / 86400000)

// 0 = Sunday
export const weekday = (d: LocalDate) => new Date(toUTC(d)).getUTCDay()

// Read from the device clock's local parts: toISOString() would roll over to
// tomorrow after 21h in Brasília.
export const todayLocal = (now: Date = new Date()): LocalDate =>
  ymd(now.getFullYear(), now.getMonth() + 1, now.getDate())

// Anonymous Gregorian algorithm (Meeus/Jones/Butcher).
export function easter(year: number): LocalDate {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return ymd(year, month, day)
}

function annunciation(year: number): LocalDate {
  const fixed = ymd(year, 3, 25)
  const e = easter(year)
  const palmSunday = addDays(e, -7)
  const divineMercy = addDays(e, 7)
  // Holy Week and the Easter octave displace it to the Monday after the octave.
  if (fixed >= palmSunday && fixed <= divineMercy) return addDays(divineMercy, 1)
  if (weekday(fixed) === 0) return addDays(fixed, 1)
  return fixed
}

function assumptionBrazil(year: number): LocalDate {
  const fixed = ymd(year, 8, 15)
  const wd = weekday(fixed)
  return wd === 0 ? fixed : addDays(fixed, 7 - wd)
}

function immaculateConception(year: number): LocalDate {
  const fixed = ymd(year, 12, 8)
  return weekday(fixed) === 0 ? addDays(fixed, 1) : fixed
}

export function feastsFor(year: number): Feast[] {
  const e = easter(year)
  const fixed = (id: string, name: string, m: number, d: number): Feast => ({ id, name, date: ymd(year, m, d) })
  const moved = (id: string, name: string, m: number, d: number, date: LocalDate): Feast => {
    const f = ymd(year, m, d)
    return f === date ? { id, name, date } : { id, name, date, movedFrom: f }
  }
  return [
    fixed('mae-de-deus', 'Santa Maria, Mãe de Deus', 1, 1),
    fixed('apresentacao-senhor', 'Apresentação do Senhor', 2, 2),
    fixed('lourdes', 'Nossa Senhora de Lourdes', 2, 11),
    moved('anunciacao', 'Anunciação do Senhor', 3, 25, annunciation(year)),
    fixed('fatima', 'Nossa Senhora de Fátima', 5, 13),
    fixed('visitacao', 'Visitação de Nossa Senhora', 5, 31),
    { id: 'imaculado-coracao', name: 'Imaculado Coração de Maria', date: addDays(e, 69) },
    fixed('carmo', 'Nossa Senhora do Carmo', 7, 16),
    moved('assuncao', 'Assunção de Nossa Senhora', 8, 15, assumptionBrazil(year)),
    fixed('natividade', 'Natividade de Nossa Senhora', 9, 8),
    fixed('dores', 'Nossa Senhora das Dores', 9, 15),
    fixed('rosario', 'Nossa Senhora do Rosário', 10, 7),
    fixed('aparecida', 'Nossa Senhora Aparecida', 10, 12),
    fixed('apresentacao-nossa-senhora', 'Apresentação de Nossa Senhora', 11, 21),
    moved('imaculada', 'Imaculada Conceição', 12, 8, immaculateConception(year)),
    fixed('guadalupe', 'Nossa Senhora de Guadalupe', 12, 12),
  ].sort((a, b) => a.date.localeCompare(b.date))
}

export const startDate = (feastDate: LocalDate): LocalDate => addDays(feastDate, -PREP_DAYS)

// Feasts from today on; those whose preparation should already have started
// stay listed but unavailable, so the user sees why they cannot pick them.
export function upcomingFeasts(today: LocalDate, count: number): FeastOption[] {
  const year = Number(today.slice(0, 4))
  return [...feastsFor(year), ...feastsFor(year + 1), ...feastsFor(year + 2)]
    .filter((f) => f.date >= today)
    .slice(0, count)
    .map((f) => {
      const start = startDate(f.date)
      return { ...f, start, available: start >= today }
    })
}

export const dayIndex = (start: LocalDate, today: LocalDate) => diffDays(start, today) + 1

export function phaseOf(day: number): Phase {
  if (day <= 12) return 'preliminar'
  if (day <= 19) return 'semana1'
  if (day <= 26) return 'semana2'
  if (day <= 33) return 'semana3'
  return 'festa'
}
