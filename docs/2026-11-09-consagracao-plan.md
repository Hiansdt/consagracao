ROUTE: inline
size:     ~20 files, 3 layers (texts, logic, UI), 1 repo
frozen:   yes — design approved 2026-11-09; Day 21 text knowingly absent
streams:  none — every slice reads the shared day/text ids in src/data

# Consagração Total PWA — Implementation Plan

**Goal:** PWA guiding the 33-day Montfort preparation to a chosen Marian feast, with verbatim texts and local progress + backup.
**Architecture:** static Vite app, no framework. `src/data` holds texts and the schedule as typed modules; `src/logic` holds pure date/progress functions (tested); `src/ui` renders three tabs from them.
**Tech Stack:** Vite, TypeScript, Vitest, vite-plugin-pwa. Fonts and paintings bundled.
**Spec:** `docs/2026-11-09-consagracao-design.md` (same folder as this plan).

## Global Constraints

- Texts verbatim from the scans: 1943 Vozes (Tratado + appendix), Figueiredo 1828 (Gospel), Souza Campos 2023 `.txt` (Imitação). Keep period spelling ("Jesús", "satanaz"). Portuguese column only.
- UI strings pt-BR, sentence case. Imitação credit shown wherever its text appears.
- Dates from local date parts, never `toISOString()`.
- Never write progress after a failed or corrupt load.
- Repo: `~/projects/consagracao`, branch `main` is fine (new personal repo, not Vita). No Co-Authored-By line (user rule).

## Review Focus

1. Opening the app after 21h (UTC already next day): must still show today's local day. Test: `dayIndex` with a Date at 23:30 local.
2. Feast chosen whose Day 1 is today (Guadalupe on 2026-11-09): Day 1, not "not started". Test in Task 2.
3. Corrupt `localStorage` JSON: app shows the import prompt and does not overwrite. Test in Task 5.
4. Importing a backup from an older schema or a different feast: replaces state after confirm, keeps feast from the backup. Test in Task 5.
5. Opening before Day 1 or after Day 34: shows countdown or the post-consecration view, never an out-of-range day. Test in Task 2.

---

### Task 1: Scaffold

**Files:** create `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.ts`, `.gitignore`.
- [ ] `npm create vite@latest` (vanilla-ts) into `~/projects/consagracao`; add `vitest`, `vite-plugin-pwa`; `git init`.
- [ ] Verify: `npx vitest run` exits 0 with no tests; `npm run build` passes. Commit `CHORE: scaffold`.

### Task 2: Calendar and feasts — `src/logic/calendar.ts`

**Produces:** `easter(year): LocalDate`; `feastsFor(year): Feast[]` (`{id, name, date}`); `upcomingFeasts(today, count): FeastOption[]` (`available: boolean` = Day 1 ≥ today); `startDate(feast) = feast − 33 days`; `dayIndex(startDate, today): number` (1..34, <1 before, >34 after); `phaseOf(day): 'preliminar'|'semana1'|'semana2'|'semana3'|'festa'` (1–12, 13–19, 20–26, 27–33, 34).
- [ ] Failing tests `tests/calendar.test.ts`: easter(2027)=03-28; Anunciação 2027 → 04-05; Guadalupe 2026 start = 2026-11-09; Imaculada 2026 start 11-05 unavailable on 11-09; Imaculado Coração 2027 = Sat after Sacred Heart; dayIndex at 23:30 local; phase boundaries 12/13, 19/20, 26/27, 33/34.
- [ ] Look up the Brazilian transfer rules (Assunção, Imaculada on Sunday, Anunciação in Holy Week/Easter octave) in a CNBB source; add one test per rule citing the source in the test name.
- [ ] Implement; tests pass; commit `FEAT: feast calendar`.

### Task 3: Schedule — `src/data/schedule.ts`

**Produces:** `SCHEDULE: DayPlan[34]`, `DayPlan = {day, readings: ReadingRef[], prayers: PrayerId[]}`; `ReadingRef = {kind:'evangelho'|'imitacao'|'tratado'|'segredo', ref: string, textId: string|null}`.
- [ ] Failing tests: 34 entries; days 1–12 prayers = [veni-creator, ave-maris-stella]; 13–19 = [ladainha-es, ave-maris-stella, ladainha-ns]; 20–26 = [ladainha-es, ave-maris-stella, terco]; 27–33 = [ladainha-es, ave-maris-stella, oracao-sto-agostinho, ladainha-nome-jesus]; day 34 = [consagracao]; day 21 reading textId null; every non-null textId resolves in `TEXTS` (Task 4).
- [ ] Fill readings from the Toronto/TAN schedule (scratchpad `src/sched/t2.txt`) for all 33 days; day 34 = Tratado 231–233.
- [ ] Commit `FEAT: 33-day schedule`.

### Task 4: Verbatim texts — `src/data/texts/{oracoes,tratado,evangelho,imitacao}.ts`

**Produces:** `TEXTS: Record<string, {title, source, blocks: Block[]}>`, `Block = {type:'p'|'verse'|'response'|'heading', text}`.
Method for every 1943/1828 block: `pdftotext -f N -l N` (crop to PT column with `-x/-y/-W/-H` on bilingual pages) → read the page at `pdftoppm -r 150` with Read → fix only OCR errors so the text matches the image character for character.
- [ ] 4a appendix prayers (1943 pp. ~256–299): Veni Creator, Ave Maris Stella, ladainhas ES/NS/Nome de Jesus/S. Coração, consagração, rosário (método), pequena coroa, Sub tuum, Ó Jesus vivendo em Maria, oração a Jesus, oração a Maria, Magnificat (1943 PT column); Oração de Sto. Agostinho from nº 67; jaculatória nº 233.
- [ ] 4b Tratado paragraphs used by the schedule (nº 12–38, 61–62, 81–82, 105–110, 120–121, 152–164, 213–225, 228, 231–233, 243–254, 257–260, 261–265, as the schedule finalises).
- [ ] 4c Gospel passages from Figueiredo 1828 (11 passages), verse numbers kept.
- [ ] 4d Imitação chapters from the 2023 `.txt` (exact copy, footnote markers kept), credit string constant.
- [ ] Test `tests/texts.test.ts`: every schedule textId exists; no block contains "A minha alma engrandece ao Senhor" (valde's swapped Magnificat); no empty block. Commit per sub-step `FEAT: texts <part>`.

### Task 5: Progress store — `src/logic/progress.ts`

**Produces:** `State = {schema:1, feastId, feastDate, done: Record<day, PrayerId|ReadingKey[]>, consecratedAt?: string}`; `load(): {ok:true, state}|{ok:false, reason}`; `save(state)`; `exportBackup(state): Blob`; `importBackup(json): State` (throws on invalid); `requestPersist(): Promise<boolean>`.
- [ ] Failing tests (jsdom localStorage): corrupt JSON → `ok:false` and storage untouched; round-trip export→import; import of wrong schema throws with a pt-BR message; toggling an item writes only that day.
- [ ] Implement; commit `FEAT: local progress and backup`.

### Task 6: UI — `src/ui/{today,calendar,prayers,setup,reader,theme}.ts`, `src/styles.css`, `public/art/*.jpg`

- [ ] Download the 5 paintings from Wikimedia Commons (1200px) into `public/art/`, record title/author/collection in `src/data/art.ts`.
- [ ] Setup: feast list from `upcomingFeasts`, unavailable greyed; confirm resets progress.
- [ ] Hoje: painting header with "Dia N de 33" + phase, 33-segment bar, items with circular check, tap → reader. Before Day 1: countdown. Day 34: consecration checklist (confissão, comunhão, fórmula, tributo). After: jaculatória + next renewal date.
- [ ] Calendário: month grid, phase colours, done/pending/today/feast states; tap a day opens it.
- [ ] Orações: all prayers, required ones grouped by phase, optional ones below.
- [ ] Reader: readable column (≤ 70ch), source line, Imitação credit.
- [ ] Theme: CSS tokens, `prefers-color-scheme` dark = graphite-blue `#171a24`, painting fades into background; Hanken Grotesk bundled.
- [ ] Backup row in Calendário: export/import; reminder at days 12, 19, 26, 33.
- [ ] Commit `FEAT: app screens`.

### Task 7: PWA

- [ ] `vite-plugin-pwa` manifest (name "Consagração Total", pt-BR, standalone, theme colours), icons 192/512/maskable, precache all assets.
- [ ] Verify: `npm run build && npx vite preview`; Lighthouse-style check in browser pane: manifest valid, SW active, reload offline works. Commit `FEAT: installable PWA`.

### Task 8: Verification

- [ ] Browser pane at 375×812, light and dark: setup → pick Guadalupe → Day 1 shows; toggle items; reload keeps state; export/import.
- [ ] Spot-check 10 random text blocks against page images once more.
- [ ] `npx vitest run`, `npm run build` green. Hand over with Vercel steps (user publishes).
