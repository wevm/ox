import { describe, expect, test } from 'vitest'
import * as Period from './Period.js'

describe('seconds', () => {
  test('default', () => {
    expect(Period.seconds(30)).toBe(30)
  })
})

describe('minutes', () => {
  test('default', () => {
    expect(Period.minutes(5)).toBe(300)
  })
})

describe('hours', () => {
  test('default', () => {
    expect(Period.hours(2)).toBe(7200)
  })
})

describe('days', () => {
  test('default', () => {
    expect(Period.days(1)).toBe(86400)
  })
})

describe('weeks', () => {
  test('default', () => {
    expect(Period.weeks(1)).toBe(604800)
  })
})

describe('months', () => {
  test('default', () => {
    expect(Period.months(1)).toBe(2592000)
  })
})

describe('years', () => {
  test('default', () => {
    expect(Period.years(1)).toBe(31536000)
  })
})
