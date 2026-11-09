type Child = Node | string | null | undefined | false
type Attrs = Record<string, string | boolean | ((e: Event) => void) | undefined>

// Text always goes in through text nodes, never innerHTML, so nothing in the
// transcriptions can be interpreted as markup.
export function h(tag: string, attrs: Attrs = {}, ...children: Child[]): HTMLElement {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue
    if (typeof v === 'function') el.addEventListener(k.replace(/^on/, '').toLowerCase(), v)
    else if (v === true) el.setAttribute(k, '')
    else el.setAttribute(k, v)
  }
  for (const c of children) if (c !== null && c !== undefined && c !== false) el.append(c)
  return el
}

export function check(on: boolean): HTMLElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('aria-hidden', 'true')
  svg.classList.add('check')
  if (on) svg.classList.add('on')
  svg.innerHTML = '<circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-6.5"/>'
  return svg as unknown as HTMLElement
}

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

export const monthName = (m: number) => MONTHS[m - 1]

export function longDate(d: string, withWeekday = false): string {
  const [y, m, day] = d.split('-').map(Number)
  const wd = WEEKDAYS[new Date(Date.UTC(y, m - 1, day)).getUTCDay()]
  return `${withWeekday ? wd + ', ' : ''}${day} de ${MONTHS[m - 1]}${withWeekday ? '' : ` de ${y}`}`
}
