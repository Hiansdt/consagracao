import { beforeEach, describe, expect, it } from 'vitest'
import { KEY, exportBackup, importBackup, load, newState, save, toggle } from '../src/logic/progress'

beforeEach(() => localStorage.clear())

describe('progress', () => {
  it('starts empty when nothing is stored', () => {
    expect(load()).toEqual({ ok: true, state: null })
  })

  it('round-trips through localStorage', () => {
    const s = toggle(newState('guadalupe', '2026-12-12'), 1, 'p:veni-creator')
    save(s)
    expect(load()).toEqual({ ok: true, state: s })
  })

  it('reports corrupt storage without touching it', () => {
    localStorage.setItem(KEY, '{not json')
    const r = load()
    expect(r.ok).toBe(false)
    expect(localStorage.getItem(KEY)).toBe('{not json')
  })

  it('toggles an item on and off for one day only', () => {
    let s = newState('guadalupe', '2026-12-12')
    s = toggle(s, 3, 'r:mt-7-1-14')
    expect(s.done).toEqual({ 3: ['r:mt-7-1-14'] })
    s = toggle(s, 3, 'r:mt-7-1-14')
    expect(s.done).toEqual({})
  })

  it('exports a backup that imports back to the same state', async () => {
    const s = toggle(newState('assuncao', '2027-08-15'), 5, 'p:ave-maris-stella')
    const json = await exportBackup(s).text()
    expect(importBackup(json)).toEqual(s)
  })

  it('rejects a backup from another app or schema with a readable message', () => {
    expect(() => importBackup('{"foo":1}')).toThrow(/backup/i)
    expect(() => importBackup('nope')).toThrow(/backup/i)
  })
})
