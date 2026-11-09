import { describe, expect, it } from 'vitest'
import { OPTIONAL_PRAYERS, SCHEDULE } from '../src/data/schedule'
import { PRAYERS, RAW_FILES, getText } from '../src/data/texts'

describe('texts', () => {
  it('resolves every reading in the schedule', () => {
    for (const day of SCHEDULE)
      for (const r of day.readings) if (r.textId) expect(getText(r.textId), `${day.day} ${r.textId}`).toBeTruthy()
  })

  it('resolves every required and optional prayer', () => {
    const ids = new Set([...SCHEDULE.flatMap((d) => d.prayers), ...OPTIONAL_PRAYERS])
    for (const id of ids) {
      expect(PRAYERS[id], id).toBeTruthy()
      expect(getText(PRAYERS[id].textId), id).toBeTruthy()
    }
  })

  it('carries no OCR or tooling debris', () => {
    for (const [path, raw] of Object.entries(RAW_FILES)) {
      // The Imitação is a byte-for-byte copy of the publisher's file, double spaces included.
      const debris = ['�', '·', '{-}', '<<p', 'NOTAS', 'alexandria', ...(path.includes('/imitacao/') ? [] : ['  '])]
      for (const bad of debris) expect(raw.includes(bad), `${path} contains ${JSON.stringify(bad)}`).toBe(false)
    }
  })

  it('keeps the 1943 Magnificat, not the modern one valde.com.br swapped in', () => {
    const all = Object.values(RAW_FILES).join('\n')
    expect(all).not.toContain('A minha alma engrandece ao Senhor')
    expect(getText('magnificat')!.blocks[0].lines[0]).toBe('Minha alma engrandece ao Senhor.')
  })

  it('parses headings, verses and notes', () => {
    const t = getText('td-12-38')!
    expect(t.blocks.some((b) => b.type === 'heading' && b.lines[0] === 'CAPÍTULO I')).toBe(true)
    expect(t.notes.length).toBeGreaterThan(0)
    const g = getText('mt-5-1-19')!
    expect(g.blocks[0].type).toBe('verses')
    expect(g.blocks[0].lines[2]).toMatch(/^3 Bemaventurados os pobres de espirito/)
  })

  it('shows the "Tuus totus" renewal as the second paragraph of nº 233', () => {
    const t = getText(PRAYERS['tuus-totus'].textId)!
    expect(t.blocks).toHaveLength(1)
    expect(t.blocks[0].lines[0]).toMatch(/^Poderão até, todos os meses/)
  })
})
