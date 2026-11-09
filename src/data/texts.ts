// Text files are verbatim transcriptions; this module only splits them into
// blocks for rendering and never rewrites a character.
//
// File format: blocks separated by a blank line; "# " heading, "## " subheading,
// "* * *" separator; everything else is a paragraph whose lines are kept.
// An optional "\n---\n" separates the edition's footnotes.

import type { PrayerId } from './schedule'

export type BlockType = 'heading' | 'subheading' | 'separator' | 'paragraph' | 'verses'

export interface Block {
  type: BlockType
  lines: string[]
}

export interface Text {
  id: string
  title: string
  source: string
  blocks: Block[]
  notes: string[]
}

export const RAW_FILES = import.meta.glob('./texts/**/*.txt', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>

export const SOURCES = {
  tratado:
    'Tratado da Verdadeira Devoção à Santíssima Virgem, 2ª edição, Editora Vozes, Petrópolis, 1943 (tradução sem nome do tradutor; domínio público).',
  apendice:
    'Apêndice "Exercícios espirituais preparatórios à consagração solene", Tratado da Verdadeira Devoção, 2ª edição, Editora Vozes, 1943.',
  evangelho:
    'Santa Biblia, traduzida em portuguez segundo a Vulgata pelo Padre Antonio Pereira de Figueiredo, Londres, Bagster e Thoms, 1828 (domínio público).',
  imitacao:
    'Tomás de Kempis, A Imitação de Cristo. Tradução de E. L. de Souza Campos, Valdemar Teodoro Editor, Niterói, 2023. "Toda cópia e divulgação são permitidas, desde que citada a fonte."',
} as const

const META: Record<string, { title: string; source: keyof typeof SOURCES }> = {
  'veni-creator': { title: 'Veni, Creator Spiritus', source: 'apendice' },
  'ave-maris-stella': { title: 'Ave, Maris Stella', source: 'apendice' },
  'ladainha-es': { title: 'Ladainha do Espírito Santo', source: 'apendice' },
  'ladainha-ns': { title: 'Ladainha de Nossa Senhora', source: 'apendice' },
  'ladainha-nome-jesus': { title: 'Ladainha do SS. Nome de Jesús', source: 'apendice' },
  'ladainha-sagrado-coracao': { title: 'Ladainha do S. Coração de Jesús', source: 'apendice' },
  terco: { title: 'O santo Rosário', source: 'apendice' },
  consagracao: { title: 'Consagração de si mesmo a Jesús Cristo, a Sabedoria incarnada, pelas mãos de Maria', source: 'apendice' },
  'pequena-coroa': { title: 'Pequena coroa da SS. Virgem', source: 'apendice' },
  'sub-tuum': { title: 'Sub tuum', source: 'apendice' },
  'o-jesus-vivendo-em-maria': { title: 'Oração a Jesús vivendo em Maria', source: 'apendice' },
  'oracao-a-jesus': { title: 'Oração a Jesús', source: 'apendice' },
  'oracao-a-maria': { title: 'Oração a Maria, para seus fiéis escravos', source: 'apendice' },
  magnificat: { title: 'Magnificat', source: 'apendice' },
}

export interface PrayerDef {
  title: string
  textId: string
}

export const PRAYERS: Record<PrayerId | string, PrayerDef> = {
  'veni-creator': { title: 'Veni Creator', textId: 'veni-creator' },
  'ave-maris-stella': { title: 'Ave Maris Stella', textId: 'ave-maris-stella' },
  'ladainha-es': { title: 'Ladainha do Espírito Santo', textId: 'ladainha-es' },
  'ladainha-ns': { title: 'Ladainha de Nossa Senhora', textId: 'ladainha-ns' },
  terco: { title: 'Terço (método de São Luís)', textId: 'terco' },
  'oracao-sto-agostinho': { title: 'Oração de Santo Agostinho', textId: 'td-67' },
  'ladainha-nome-jesus': { title: 'Ladainha do SS. Nome de Jesús', textId: 'ladainha-nome-jesus' },
  consagracao: { title: 'Fórmula de consagração', textId: 'consagracao' },
  magnificat: { title: 'Magnificat', textId: 'magnificat' },
  'o-jesus-vivendo-em-maria': { title: 'Ó Jesús vivendo em Maria', textId: 'o-jesus-vivendo-em-maria' },
  'oracao-a-jesus': { title: 'Oração a Jesús', textId: 'oracao-a-jesus' },
  'oracao-a-maria': { title: 'Oração a Maria', textId: 'oracao-a-maria' },
  'pequena-coroa': { title: 'Pequena coroa da SS. Virgem', textId: 'pequena-coroa' },
  'sub-tuum': { title: 'Sub tuum', textId: 'sub-tuum' },
  'ladainha-sagrado-coracao': { title: 'Ladainha do S. Coração de Jesús', textId: 'ladainha-sagrado-coracao' },
  'tuus-totus': { title: 'Tuus totus', textId: 'tuus-totus' },
}

// "Tuus totus" is the renewal the Tratado gives in nº 233; its quotation marks
// open and close in different sentences, so the whole paragraph is shown.
const EXCERPTS: Record<string, { from: string; title: string; block: number }> = {
  'tuus-totus': { from: 'td-231-233', title: 'Renovação: "Tuus totus ego sum"', block: 3 },
}

const VERSE = /^\d+(, \d+)? /

function parse(raw: string): { blocks: Block[]; notes: string[] } {
  const [body, notesPart] = raw.replace(/\n+$/, '').split('\n---\n')
  const blocks = body.split(/\n{2,}/).map((chunk): Block => {
    const lines = chunk.split('\n')
    if (lines[0].startsWith('## ')) return { type: 'subheading', lines: [lines[0].slice(3)] }
    if (lines[0].startsWith('# ')) return { type: 'heading', lines: [lines[0].slice(2)] }
    if (chunk.trim() === '* * *') return { type: 'separator', lines: [] }
    if (lines.every((l) => VERSE.test(l))) return { type: 'verses', lines }
    return { type: 'paragraph', lines }
  })
  return { blocks, notes: notesPart ? notesPart.split('\n') : [] }
}

function titleFor(id: string, folder: string): { title: string; source: keyof typeof SOURCES } {
  if (META[id]) return META[id]
  if (folder === 'tratado') {
    const nums = id.replace('td-', '').replace('-', '-')
    return { title: `Tratado da Verdadeira Devoção, nº ${nums}`, source: 'tratado' }
  }
  if (folder === 'imitacao') {
    const [, b, c] = id.split('-')
    return { title: `Imitação de Cristo, livro ${['I', 'II', 'III', 'IV'][+b - 1]}, capítulo ${c}`, source: 'imitacao' }
  }
  return { title: id, source: 'evangelho' }
}

const REGISTRY: Record<string, Text> = {}
for (const [path, raw] of Object.entries(RAW_FILES)) {
  const [, folder, file] = path.match(/texts\/([^/]+)\/(.+)\.txt$/)!
  const { title, source } = titleFor(file, folder)
  REGISTRY[file] = { id: file, title, source: SOURCES[source], ...parse(raw) }
}
for (const [id, ex] of Object.entries(EXCERPTS)) {
  const base = REGISTRY[ex.from]
  REGISTRY[id] = { id, title: ex.title, source: base.source, blocks: [base.blocks[ex.block]], notes: [] }
}

export const getText = (id: string): Text | undefined => REGISTRY[id]
