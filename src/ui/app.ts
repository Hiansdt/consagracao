import { ART, PHASE_NAMES, PHASE_SHORT } from '../data/art'
import { OPTIONAL_PRAYERS, SCHEDULE } from '../data/schedule'
import { PRAYERS, SOURCES, getText, type Text } from '../data/texts'
import {
  PREP_DAYS,
  addDays,
  dayIndex,
  diffDays,
  feastsFor,
  phaseOf,
  startDate,
  todayLocal,
  upcomingFeasts,
  weekday,
  type Phase,
} from '../logic/calendar'
import { completedDays, itemsFor, pendingDays, statusOf, type DayItem } from '../logic/day'
import { exportBackup, importBackup, load, newState, requestPersist, save, toggle, type State } from '../logic/progress'
import { check, h, longDate, monthName } from './dom'

let state: State | null = null
let loadError: string | null = null
const root = () => document.getElementById('app')!

export function start() {
  const r = load()
  if (r.ok) state = r.state
  else loadError = r.reason
  window.addEventListener('hashchange', render)
  render()
}

function commit(next: State) {
  state = next
  save(next)
  render()
}

const go = (hash: string) => {
  if (location.hash === hash) render()
  else location.hash = hash
}

function render() {
  const app = root()
  const [, route = '', a, b] = location.hash.split('/')
  let view: HTMLElement
  if (loadError) view = recoverView(loadError)
  else if (!state || route === 'festa') view = setupView()
  else if (route === 'ler' && a) view = readerView(decodeURIComponent(a), b ? Number(b) : null)
  else if (route === 'dia' && a) view = dayView(state, Number(a))
  else if (route === 'calendario') view = calendarView(state)
  else if (route === 'oracoes') view = prayersView()
  else if (route === 'ajustes') view = settingsView(state)
  else view = todayView(state)
  const showTabs = state && !loadError && route !== 'festa' && route !== 'ler'
  app.replaceChildren(view, showTabs ? tabs(route) : '')
  if (route !== 'ler') window.scrollTo(0, 0)
}

function tabs(route: string) {
  const tab = (hash: string, label: string, active: boolean) =>
    h('a', { href: hash, class: active ? 'tab active' : 'tab', 'aria-current': active ? 'page' : undefined }, label)
  return h(
    'nav',
    { class: 'tabs', 'aria-label': 'Seções' },
    tab('#/', 'Hoje', route === '' || route === 'dia'),
    tab('#/calendario', 'Calendário', route === 'calendario' || route === 'ajustes'),
    tab('#/oracoes', 'Orações', route === 'oracoes'),
  )
}

// ——— Setup ———

function setupView() {
  const today = todayLocal()
  const options = upcomingFeasts(today, 16)
  const list = h(
    'ul',
    { class: 'feasts' },
    ...options.map((f) =>
      h(
        'li',
        {},
        h(
          'button',
          {
            class: 'feast',
            disabled: !f.available,
            onclick: () => {
              if (state && !confirm('Trocar a festa recomeça a preparação do zero. Continuar?')) return
              void requestPersist()
              commit(newState(f.id, f.date))
              go('#/')
            },
          },
          h('span', { class: 'feast-name' }, f.name),
          h(
            'span',
            { class: 'feast-meta' },
            `${longDate(f.date, true)}${f.movedFrom ? ' (transferida)' : ''} · `,
            f.available
              ? f.start === today
                ? 'começa hoje'
                : `começa ${longDate(f.start, true)}`
              : 'a preparação já teria começado',
          ),
        ),
      ),
    ),
  )
  return h(
    'main',
    { class: 'page setup' },
    h('h1', {}, 'Escolha a festa da consagração'),
    h(
      'p',
      { class: 'lead' },
      'A preparação dura 33 dias e termina na festa mariana que você escolher. No dia da festa você faz a consagração.',
    ),
    list,
    state ? h('a', { class: 'link', href: '#/' }, 'Voltar sem trocar') : '',
  )
}

// ——— Today / a day ———

function hero(phase: Phase, title: string, subtitle: string) {
  const art = ART[phase]
  return h(
    'header',
    { class: 'hero' },
    h('img', { src: art.src, alt: '', style: `object-position:${art.position}` }),
    h('div', { class: 'hero-text' }, h('h1', {}, title), h('p', {}, subtitle)),
  )
}

function progressBar(s: State, current: number) {
  return h(
    'div',
    { class: 'bar', role: 'img', 'aria-label': `${completedDays(s)} de 33 dias concluídos` },
    ...Array.from({ length: PREP_DAYS }, (_, i) => {
      const d = i + 1
      const st = statusOf(s, d)
      return h('i', { class: `seg ${st}${d === current ? ' now' : ''}` })
    }),
  )
}

function itemRow(s: State, day: number, it: DayItem) {
  const done = (s.done[day] ?? []).includes(it.key)
  const toggleBtn = h(
    'button',
    {
      class: 'tick',
      'aria-pressed': done ? 'true' : 'false',
      'aria-label': `${done ? 'Desmarcar' : 'Marcar'} ${it.label}`,
      onclick: () => commit(toggle(s, day, it.key)),
    },
    check(done),
  )
  const body = h('span', { class: 'item-body' }, h('span', { class: 'item-label' }, it.label), h('span', { class: 'item-sub' }, it.sub))
  const main = it.textId
    ? h('a', { class: 'item-open', href: `#/ler/${encodeURIComponent(it.textId)}/${day}` }, body)
    : it.kind === 'reading'
      ? h('a', { class: 'item-open', href: `#/ler/${encodeURIComponent('segredo')}/${day}` }, body)
      : h('div', { class: 'item-open static' }, body)
  return h('li', { class: done ? 'item done' : 'item' }, toggleBtn, main)
}

function dayContent(s: State, day: number, title: string) {
  const phase = phaseOf(day)
  const date = addDays(startDate(s.feastDate), day - 1)
  const feast = feastsFor(Number(s.feastDate.slice(0, 4))).find((f) => f.id === s.feastId)
  return [
    hero(phase, title, `${longDate(date, true)} · ${PHASE_NAMES[phase]}`),
    h(
      'section',
      { class: 'sheet' },
      progressBar(s, day),
      day === 34 && feast ? h('p', { class: 'note' }, `Festa: ${feast.name}. O que fazer neste dia está no Tratado, nº 231–232.`) : '',
      h('ul', { class: 'items' }, ...itemsFor(day).map((it) => itemRow(s, day, it))),
      h('p', { class: 'credit' }, ART[phase].credit),
    ),
  ]
}

function todayView(s: State) {
  const today = todayLocal()
  const start = startDate(s.feastDate)
  const idx = dayIndex(start, today)
  const feast = feastsFor(Number(s.feastDate.slice(0, 4))).find((f) => f.id === s.feastId)!

  if (idx < 1) {
    const n = diffDays(today, start)
    return h(
      'main',
      { class: 'page' },
      hero('preliminar', n === 1 ? 'Começa amanhã' : `Começa em ${n} dias`, `Dia 1: ${longDate(start, true)}`),
      h(
        'section',
        { class: 'sheet' },
        h('p', { class: 'lead' }, `Consagração em ${longDate(s.feastDate)} (${feast.name}).`),
        h('a', { class: 'link', href: '#/dia/1' }, 'Ver o Dia 1'),
      ),
    )
  }

  if (idx > 34) return afterView(s, feast.name)

  const pending = pendingDays(s, idx)
  const reminder = [12, 19, 26, 33, 34].includes(idx) && s.lastBackup !== today
  return h(
    'main',
    { class: 'page' },
    ...dayContent(s, idx, idx === 34 ? 'Dia da consagração' : `Dia ${idx} de 33`),
    pending.length
      ? h(
          'section',
          { class: 'pending' },
          h('h2', {}, pending.length === 1 ? '1 dia pendente' : `${pending.length} dias pendentes`),
          h('div', { class: 'chips' }, ...pending.map((d) => h('a', { class: 'chip', href: `#/dia/${d}` }, `Dia ${d}`))),
        )
      : '',
    reminder
      ? h(
          'section',
          { class: 'pending' },
          h('h2', {}, 'Fim de uma etapa'),
          h('p', {}, 'Bom momento para guardar um backup do seu progresso.'),
          h('a', { class: 'link', href: '#/ajustes' }, 'Fazer backup'),
        )
      : '',
  )
}

function dayView(s: State, day: number) {
  if (!(day >= 1 && day <= 34)) return todayView(s)
  return h('main', { class: 'page' }, ...dayContent(s, day, day === 34 ? 'Dia da consagração' : `Dia ${day} de 33`))
}

function afterView(s: State, feastName: string) {
  const year = Number(s.feastDate.slice(0, 4))
  const next = feastsFor(year + 1).find((f) => f.id === s.feastId)!
  const renewal = getText(PRAYERS['tuus-totus'].textId)!
  return h(
    'main',
    { class: 'page' },
    hero('festa', 'Consagração feita', `${feastName}, ${longDate(s.feastDate)}`),
    h(
      'section',
      { class: 'sheet' },
      h('h2', {}, 'Renovação diária'),
      ...renderBlocks(renewal),
      h('p', { class: 'source' }, 'Tratado nº 233.'),
      h('h2', {}, 'Renovação anual'),
      h('p', {}, `Nº 233 pede renovar a consagração todos os anos, com as mesmas três semanas. A próxima festa é ${longDate(next.date)}.`),
      h(
        'button',
        {
          class: 'primary',
          onclick: () => {
            if (confirm(`Começar a preparação para ${longDate(next.date)}? O progresso atual será substituído.`))
              commit(newState(next.id, next.date))
          },
        },
        'Preparar a renovação',
      ),
      h('p', { class: 'credit' }, ART.festa.credit),
    ),
  )
}

// ——— Calendar ———

function calendarView(s: State) {
  const start = startDate(s.feastDate)
  const today = todayLocal()
  const idxToday = dayIndex(start, today)
  const months: HTMLElement[] = []
  let cursor = start.slice(0, 8) + '01'
  while (cursor <= s.feastDate) {
    const [y, m] = cursor.split('-').map(Number)
    const lead = weekday(cursor)
    const cells: HTMLElement[] = Array.from({ length: lead }, () => h('span', { class: 'cell blank' }))
    let d = cursor
    while (Number(d.slice(5, 7)) === m) {
      const n = dayIndex(start, d)
      const label = String(Number(d.slice(8)))
      if (n < 1 || n > 34) cells.push(h('span', { class: 'cell out' }, label))
      else {
        const st = statusOf(s, n)
        const cls = [`cell`, `ph-${phaseOf(n)}`, st, n === idxToday ? 'today' : '', n < idxToday && st !== 'done' ? 'late' : '']
        cells.push(
          h('a', { class: cls.join(' '), href: `#/dia/${n}`, 'aria-label': `Dia ${n}, ${longDate(d)}, ${st === 'done' ? 'concluído' : st === 'partial' ? 'em andamento' : 'não feito'}` }, label),
        )
      }
      d = addDays(d, 1)
    }
    months.push(
      h(
        'section',
        { class: 'month' },
        h('h2', {}, `${monthName(m)} de ${y}`),
        h('div', { class: 'grid' }, ...['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((w) => h('span', { class: 'wd' }, w)), ...cells),
      ),
    )
    cursor = d
  }
  const legend = h(
    'ul',
    { class: 'legend' },
    ...(['preliminar', 'semana1', 'semana2', 'semana3', 'festa'] as Phase[]).map((p) => h('li', {}, h('i', { class: `sw ph-${p}` }), PHASE_SHORT[p])),
  )
  const feast = feastsFor(Number(s.feastDate.slice(0, 4))).find((f) => f.id === s.feastId)!
  return h(
    'main',
    { class: 'page plain' },
    h('h1', {}, 'Calendário'),
    h('p', { class: 'lead' }, `${completedDays(s)} de 33 dias concluídos. Consagração: ${feast.name}, ${longDate(s.feastDate)}.`),
    legend,
    ...months,
    h('p', { class: 'hint' }, 'Dias com fundo cheio estão concluídos; os com contorno vermelho ficaram pendentes.'),
    h('a', { class: 'link', href: '#/ajustes' }, 'Backup e troca de festa'),
  )
}

// ——— Prayers ———

function prayersView() {
  const groups: [string, string[]][] = [
    [PHASE_NAMES.preliminar, SCHEDULE[0].prayers],
    [PHASE_NAMES.semana1, SCHEDULE[12].prayers],
    [PHASE_NAMES.semana2, SCHEDULE[19].prayers],
    [PHASE_NAMES.semana3, SCHEDULE[26].prayers],
    [PHASE_NAMES.festa, SCHEDULE[33].prayers],
    ['Outras orações do apêndice', [...OPTIONAL_PRAYERS]],
  ]
  return h(
    'main',
    { class: 'page plain' },
    h('h1', {}, 'Orações'),
    h('p', { class: 'lead' }, 'As orações de cada fase são as que o Tratado pede (nº 227–231). As demais estão no apêndice da edição de 1943.'),
    ...groups.map(([title, ids]) =>
      h(
        'section',
        { class: 'group' },
        h('h2', {}, title),
        h('ul', { class: 'plain-list' }, ...ids.map((id) => h('li', {}, h('a', { href: `#/ler/${encodeURIComponent(PRAYERS[id].textId)}` }, PRAYERS[id].title)))),
      ),
    ),
  )
}

// ——— Reader ———

function renderBlocks(t: Text): HTMLElement[] {
  return t.blocks.map((b) => {
    switch (b.type) {
      case 'heading':
        return h('h2', { class: 'r-heading' }, b.lines[0])
      case 'subheading':
        return h('h3', { class: 'r-sub' }, b.lines[0])
      case 'separator':
        return h('p', { class: 'r-sep', 'aria-hidden': 'true' }, '* * *')
      case 'verses':
        return h(
          'div',
          { class: 'r-verses' },
          ...b.lines.map((l) => {
            const m = l.match(/^(\d+(?:, \d+)?) (.*)$/)!
            return h('p', {}, h('sup', {}, m[1]), ' ', m[2])
          }),
        )
      default: {
        if (b.lines.length === 1) return h('p', {}, b.lines[0])
        // Verse and litany lines: hanging indent so a wrapped line reads as one invocation.
        return h('p', { class: 'r-lines' }, ...b.lines.map((l) => h('span', {}, l)))
      }
    }
  })
}

function readerView(textId: string, day: number | null) {
  const back = h('a', { class: 'back', href: day ? `#/dia/${day}` : '#/oracoes' }, '← Voltar')
  if (textId === 'segredo') {
    return h(
      'main',
      { class: 'page reader' },
      back,
      h('h1', {}, 'Segredo de Maria, nº 23-24'),
      h(
        'p',
        {},
        'Não há tradução portuguesa do Segredo de Maria em domínio público, então o texto não está no app. Leia os números 23 e 24 em uma edição impressa (por exemplo, Vozes ou Paulus) e marque como feito na tela do dia.',
      ),
    )
  }
  const t = getText(textId)
  if (!t) return h('main', { class: 'page reader' }, back, h('p', {}, 'Texto não encontrado.'))
  const s = state
  const item = day && s ? itemsFor(day).find((i) => i.textId === textId) : undefined
  const done = !!(item && s && (s.done[day!] ?? []).includes(item.key))
  return h(
    'main',
    { class: 'page reader' },
    back,
    h('h1', {}, t.title),
    h('article', { class: 'text' }, ...renderBlocks(t)),
    t.notes.length ? h('section', { class: 'notes' }, h('h2', {}, 'Notas da edição'), ...t.notes.map((n) => h('p', {}, n))) : '',
    h('p', { class: 'source' }, `Fonte: ${t.source}`),
    item && s
      ? h(
          'button',
          {
            class: done ? 'primary done' : 'primary',
            onclick: () => {
              commit(toggle(s, day!, item.key))
              if (!done) go(`#/dia/${day}`)
            },
          },
          done ? 'Feito ✓ (desmarcar)' : 'Marcar como feito',
        )
      : '',
  )
}

// ——— Settings / backup ———

async function download(s: State) {
  const blob = exportBackup(s)
  const name = `consagracao-backup-${todayLocal()}.json`
  const file = new File([blob], name, { type: 'application/json' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Backup da Consagração' })
      commit({ ...s, lastBackup: todayLocal() })
      return
    } catch (e) {
      // The user closed the share sheet: no backup was made, so none is recorded.
      if ((e as DOMException).name === 'AbortError') return
      /* other failures fall back to a download link */
    }
  }
  const url = URL.createObjectURL(blob)
  h('a', { href: url, download: name }).click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  commit({ ...s, lastBackup: todayLocal() })
}

function importPicker(onDone: () => void) {
  const input = h('input', { type: 'file', accept: 'application/json,.json', class: 'visually-hidden' }) as HTMLInputElement
  input.addEventListener('change', async () => {
    const f = input.files?.[0]
    if (!f) return
    try {
      const next = importBackup(await f.text())
      if (!confirm('Importar este backup substitui o progresso atual. Continuar?')) return
      loadError = null
      commit(next)
      onDone()
    } catch (e) {
      alert((e as Error).message)
    }
  })
  return input
}

function settingsView(s: State) {
  const picker = importPicker(() => go('#/'))
  return h(
    'main',
    { class: 'page plain' },
    h('h1', {}, 'Backup e festa'),
    h(
      'p',
      { class: 'lead' },
      'Seu progresso fica salvo só neste aparelho. Guarde um backup de vez em quando; ele também serve para passar o progresso para outro celular.',
    ),
    h('p', { class: 'hint' }, s.lastBackup ? `Último backup: ${longDate(s.lastBackup)}.` : 'Nenhum backup feito ainda.'),
    h('button', { class: 'primary', onclick: () => void download(s) }, 'Exportar backup'),
    h('button', { class: 'secondary', onclick: () => picker.click() }, 'Importar backup'),
    picker,
    h('h2', {}, 'Festa da consagração'),
    h('p', {}, 'Trocar a festa recomeça a preparação do zero.'),
    h('a', { class: 'secondary', href: '#/festa' }, 'Escolher outra festa'),
    h('h2', {}, 'Fontes dos textos'),
    ...Object.values(SOURCES).map((src) => h('p', { class: 'source' }, src)),
  )
}

function recoverView(reason: string) {
  const picker = importPicker(() => go('#/'))
  return h(
    'main',
    { class: 'page plain' },
    h('h1', {}, 'Não foi possível ler seu progresso'),
    h('p', { class: 'lead' }, `${reason} Nada foi apagado. Importe um backup para continuar.`),
    h('button', { class: 'primary', onclick: () => picker.click() }, 'Importar backup'),
    picker,
    h(
      'button',
      {
        class: 'secondary',
        onclick: () => {
          if (!confirm('Começar do zero descarta os dados ilegíveis deste aparelho. Continuar?')) return
          loadError = null
          state = null
          render()
        },
      },
      'Começar do zero',
    ),
  )
}
