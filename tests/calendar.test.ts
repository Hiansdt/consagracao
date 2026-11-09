import { describe, expect, it } from 'vitest'
import {
  addDays,
  dayIndex,
  easter,
  feastsFor,
  phaseOf,
  startDate,
  todayLocal,
  upcomingFeasts,
} from '../src/logic/calendar'

const feast = (year: number, id: string) => feastsFor(year).find((f) => f.id === id)!

describe('easter', () => {
  it('computes Gregorian Easter', () => {
    expect(easter(2026)).toBe('2026-04-05')
    expect(easter(2027)).toBe('2027-03-28')
    expect(easter(2024)).toBe('2024-03-31')
  })
})

describe('feastsFor', () => {
  it('moves the Annunciation out of Holy Week to the Monday after Divine Mercy Sunday', () => {
    // 2027-03-25 is Holy Thursday
    expect(feast(2027, 'anunciacao').date).toBe('2027-04-05')
  })

  it('moves the Annunciation off a Lenten Sunday to Monday', () => {
    // 2001-03-25 is the 4th Sunday of Lent (Easter 2001-04-15)
    expect(feast(2001, 'anunciacao').date).toBe('2001-03-26')
  })

  it('moves the Annunciation from Palm Sunday past the Easter octave', () => {
    // Easter 2029-04-01, so 03-25 is Palm Sunday
    expect(feast(2029, 'anunciacao').date).toBe('2029-04-09')
  })

  it('keeps the Annunciation on 25 March in an ordinary Lent weekday', () => {
    expect(feast(2026, 'anunciacao').date).toBe('2026-03-25')
  })

  it('celebrates the Assumption in Brazil on the Sunday after 15 August (arq. Goiânia 2023, dioc. Itabira 2024, EM 2026)', () => {
    expect(feast(2023, 'assuncao').date).toBe('2023-08-20')
    expect(feast(2024, 'assuncao').date).toBe('2024-08-18')
    expect(feast(2026, 'assuncao').date).toBe('2026-08-16')
  })

  it('keeps the Assumption on 15 August when it is a Sunday', () => {
    expect(feast(2027, 'assuncao').date).toBe('2027-08-15')
  })

  it('moves the Immaculate Conception from an Advent Sunday to Monday', () => {
    expect(feast(2024, 'imaculada').date).toBe('2024-12-09')
    expect(feast(2026, 'imaculada').date).toBe('2026-12-08')
  })

  it('puts the Immaculate Heart on the Saturday after the Sacred Heart', () => {
    // Easter 2027-03-28 → Sacred Heart 2027-06-04 (Fri) → Immaculate Heart 06-05
    expect(feast(2027, 'imaculado-coracao').date).toBe('2027-06-05')
  })

  it('includes Aparecida and Guadalupe', () => {
    expect(feast(2026, 'aparecida').date).toBe('2026-10-12')
    expect(feast(2026, 'guadalupe').date).toBe('2026-12-12')
  })
})

describe('startDate', () => {
  it('starts 33 days before the feast', () => {
    expect(startDate('2026-12-12')).toBe('2026-11-09')
    expect(startDate('2026-12-08')).toBe('2026-11-05')
  })
})

describe('upcomingFeasts', () => {
  it('marks a feast whose Day 1 is today as available and an already-started one as not', () => {
    const list = upcomingFeasts('2026-11-09', 20)
    expect(list.find((f) => f.id === 'guadalupe')!.available).toBe(true)
    expect(list.find((f) => f.id === 'imaculada')!.available).toBe(false)
  })

  it('lists feasts in date order across the year boundary', () => {
    const list = upcomingFeasts('2026-11-09', 6)
    const dates = list.map((f) => f.date)
    expect([...dates].sort()).toEqual(dates)
    expect(list.some((f) => f.date.startsWith('2027-'))).toBe(true)
  })
})

describe('dayIndex', () => {
  it('is 1 on the start date and 34 on the feast', () => {
    expect(dayIndex('2026-11-09', '2026-11-09')).toBe(1)
    expect(dayIndex('2026-11-09', '2026-12-12')).toBe(34)
  })

  it('is below 1 before the start and above 34 after the feast', () => {
    expect(dayIndex('2026-11-09', '2026-11-08')).toBe(0)
    expect(dayIndex('2026-11-09', '2026-12-13')).toBe(35)
  })
})

describe('todayLocal', () => {
  it('uses local date parts, so 23:30 local is still the same day', () => {
    const lateNight = new Date(2026, 10, 9, 23, 30)
    expect(todayLocal(lateNight)).toBe('2026-11-09')
  })
})

describe('addDays', () => {
  it('crosses month and DST boundaries by calendar days', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2027-01-01', -33)).toBe('2026-11-29')
  })
})

describe('phaseOf', () => {
  it('splits the 34 days into the method phases', () => {
    expect(phaseOf(12)).toBe('preliminar')
    expect(phaseOf(13)).toBe('semana1')
    expect(phaseOf(19)).toBe('semana1')
    expect(phaseOf(20)).toBe('semana2')
    expect(phaseOf(26)).toBe('semana2')
    expect(phaseOf(27)).toBe('semana3')
    expect(phaseOf(33)).toBe('semana3')
    expect(phaseOf(34)).toBe('festa')
  })
})
