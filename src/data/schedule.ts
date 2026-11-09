// Readings follow the traditional 33-day schedule (TAN / Montfort Publications
// edition, as reproduced by St. Timothy's, Toronto). Prayers follow the
// Tratado itself, nº 227-231, and the appendix of the 1943 Vozes edition.

export type ReadingKind = 'evangelho' | 'imitacao' | 'tratado' | 'segredo'

export interface ReadingRef {
  kind: ReadingKind
  ref: string
  // null when no public-domain Portuguese text exists (Segredo de Maria).
  textId: string | null
}

export type PrayerId =
  | 'veni-creator'
  | 'ave-maris-stella'
  | 'ladainha-es'
  | 'ladainha-ns'
  | 'terco'
  | 'oracao-sto-agostinho'
  | 'ladainha-nome-jesus'
  | 'consagracao'

export interface DayPlan {
  day: number
  readings: ReadingRef[]
  prayers: PrayerId[]
}

const ev = (ref: string, textId: string): ReadingRef => ({ kind: 'evangelho', ref, textId })
const im = (book: 'I' | 'II' | 'III' | 'IV', ch: number): ReadingRef => ({
  kind: 'imitacao',
  ref: `Imitação de Cristo, livro ${book}, cap. ${ch}`,
  textId: `imit-${{ I: 1, II: 2, III: 3, IV: 4 }[book]}-${ch}`,
})
const td = (nums: string, textId: string): ReadingRef => ({ kind: 'tratado', ref: `Tratado, nº ${nums}`, textId })

const PRAYERS: Record<'preliminar' | 'semana1' | 'semana2' | 'semana3', PrayerId[]> = {
  preliminar: ['veni-creator', 'ave-maris-stella'],
  semana1: ['ladainha-es', 'ave-maris-stella', 'ladainha-ns'],
  semana2: ['ladainha-es', 'ave-maris-stella', 'terco'],
  semana3: ['ladainha-es', 'ave-maris-stella', 'oracao-sto-agostinho', 'ladainha-nome-jesus'],
}

const READINGS: ReadingRef[][] = [
  /* 1 */ [ev('São Mateus 5, 1-19', 'mt-5-1-19')],
  /* 2 */ [ev('São Mateus 5, 48; 6, 1-15', 'mt-5-48-6-15')],
  /* 3 */ [ev('São Mateus 7, 1-14', 'mt-7-1-14')],
  /* 4 */ [im('III', 7), im('III', 40)],
  /* 5 */ [im('III', 40)],
  /* 6 */ [im('I', 18)],
  /* 7 */ [im('I', 18)],
  /* 8 */ [im('I', 13)],
  /* 9 */ [im('I', 13)],
  /* 10 */ [im('III', 10)],
  /* 11 */ [im('I', 25)],
  /* 12 */ [im('I', 25)],
  /* 13 */ [ev('São Lucas 11, 1-11', 'lc-11-1-11')],
  /* 14 */ [im('III', 13)],
  /* 15 */ [ev('São Lucas 13, 1-5', 'lc-13-1-5'), td('81-82', 'td-81-82')],
  /* 16 */ [td('228', 'td-228'), im('II', 5)],
  /* 17 */ [im('I', 24), ev('São Lucas 16, 1-8', 'lc-16-1-8')],
  /* 18 */ [ev('São Lucas 17, 1-10', 'lc-17-1-10'), im('III', 47)],
  /* 19 */ [ev('São Lucas 18, 15-30', 'lc-18-15-30')],
  /* 20 */ [ev('São Lucas 2, 16-21. 42-52', 'lc-2-16-21-42-52')],
  /* 21 */ [{ kind: 'segredo', ref: 'Segredo de Maria, nº 23-24', textId: null }],
  /* 22 */ [td('105-110', 'td-105-110')],
  /* 23 */ [td('120-121', 'td-120-121')],
  /* 24 */ [td('152-164', 'td-152-164')],
  /* 25 */ [td('213-225', 'td-213-225')],
  /* 26 */ [td('12-38', 'td-12-38')],
  /* 27 */ [td('61-62', 'td-61-62')],
  /* 28 */ [ev('São Mateus 26, 1. 26-29. 36-46', 'mt-26-1-26-29-36-46')],
  /* 29 */ [im('I', 1)],
  /* 30 */ [ev('São Mateus 27, 36-44', 'mt-27-36-44'), im('II', 12)],
  /* 31 */ [im('IV', 2), td('243-254', 'td-243-254')],
  /* 32 */ [im('II', 7), td('257-260', 'td-257-260')],
  /* 33 */ [im('IV', 11), td('261-265', 'td-261-265')],
  /* 34 */ [td('231-233', 'td-231-233')],
]

const phaseKey = (day: number) =>
  day <= 12 ? 'preliminar' : day <= 19 ? 'semana1' : day <= 26 ? 'semana2' : 'semana3'

export const SCHEDULE: DayPlan[] = READINGS.map((readings, i) => {
  const day = i + 1
  return { day, readings, prayers: day === 34 ? ['consagracao'] : PRAYERS[phaseKey(day)] }
})

export const OPTIONAL_PRAYERS = [
  'magnificat',
  'o-jesus-vivendo-em-maria',
  'oracao-a-jesus',
  'oracao-a-maria',
  'pequena-coroa',
  'sub-tuum',
  'ladainha-sagrado-coracao',
  'tuus-totus',
] as const
