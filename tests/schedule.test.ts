import { describe, expect, it } from 'vitest'
import { SCHEDULE } from '../src/data/schedule'

const prayersOf = (day: number) => SCHEDULE[day - 1].prayers

describe('SCHEDULE', () => {
  it('has 34 numbered days, each with at least one reading', () => {
    expect(SCHEDULE).toHaveLength(34)
    SCHEDULE.forEach((d, i) => {
      expect(d.day).toBe(i + 1)
      expect(d.readings.length).toBeGreaterThan(0)
    })
  })

  it('prays what Tratado nº 227-231 prescribes in each phase', () => {
    for (let d = 1; d <= 12; d++) expect(prayersOf(d)).toEqual(['veni-creator', 'ave-maris-stella'])
    for (let d = 13; d <= 19; d++) expect(prayersOf(d)).toEqual(['ladainha-es', 'ave-maris-stella', 'ladainha-ns'])
    for (let d = 20; d <= 26; d++) expect(prayersOf(d)).toEqual(['ladainha-es', 'ave-maris-stella', 'terco'])
    for (let d = 27; d <= 33; d++)
      expect(prayersOf(d)).toEqual(['ladainha-es', 'ave-maris-stella', 'oracao-sto-agostinho', 'ladainha-nome-jesus'])
    expect(prayersOf(34)).toEqual(['consagracao'])
  })

  it('leaves only the Segredo de Maria without text', () => {
    const missing = SCHEDULE.flatMap((d) => d.readings.filter((r) => r.textId === null).map((r) => d.day))
    expect(missing).toEqual([21])
  })

  it('reads Tratado nº 231-233 on the feast day', () => {
    expect(SCHEDULE[33].readings.map((r) => r.textId)).toEqual(['td-231-233'])
  })
})
