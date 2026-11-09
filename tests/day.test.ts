import { describe, expect, it } from 'vitest'
import { completedDays, itemsFor, pendingDays, statusOf } from '../src/logic/day'
import { newState, toggle } from '../src/logic/progress'

describe('day items', () => {
  it('lists the reading before the prayers on Day 1', () => {
    expect(itemsFor(1).map((i) => i.key)).toEqual(['r:mt-5-1-19', 'p:veni-creator', 'p:ave-maris-stella'])
  })

  it('keeps Day 21 readable as a reference with no text', () => {
    const r = itemsFor(21)[0]
    expect(r.textId).toBeNull()
    expect(r.sub).toBe('Segredo de Maria, nº 23-24')
  })

  it('asks for confession, communion, formula, signature and tribute on the feast', () => {
    expect(itemsFor(34).map((i) => i.key)).toEqual([
      'c:confissao',
      'c:comunhao',
      'p:consagracao',
      'c:assinar',
      'c:tributo',
      'r:td-231-233',
    ])
  })
})

describe('day status', () => {
  const s0 = newState('guadalupe', '2026-12-12')
  const all = (d: number) => itemsFor(d).reduce((s, i) => toggle(s, d, i.key), s0)

  it('is partial until every item of the day is done', () => {
    expect(statusOf(toggle(s0, 1, 'p:veni-creator'), 1)).toBe('partial')
    expect(statusOf(all(1), 1)).toBe('done')
  })

  it('lists past incomplete days as pending, never today or the future', () => {
    expect(pendingDays(all(1), 4)).toEqual([2, 3])
    expect(pendingDays(s0, 1)).toEqual([])
  })

  it('counts only fully completed preparation days', () => {
    expect(completedDays(all(1))).toBe(1)
  })
})
