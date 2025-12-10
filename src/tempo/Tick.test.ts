import { Tick } from 'ox/tempo'
import { describe, expect, test } from 'vitest'

describe('toPrice', () => {
  test('converts tick 0 to price 1', () => {
    expect(Tick.toPrice(0)).toBe('1')
  })

  test('converts positive ticks correctly', () => {
    expect(Tick.toPrice(100)).toBe('1.001')
    expect(Tick.toPrice(1000)).toBe('1.01')
    expect(Tick.toPrice(2000)).toBe('1.02')
  })

  test('converts negative ticks correctly', () => {
    expect(Tick.toPrice(-100)).toBe('0.999')
    expect(Tick.toPrice(-1000)).toBe('0.99')
    expect(Tick.toPrice(-2000)).toBe('0.98')
  })

  test('handles boundary values', () => {
    expect(Tick.toPrice(Tick.minTick)).toBe('0.98')
    expect(Tick.toPrice(Tick.maxTick)).toBe('1.02')
  })

  test('preserves exact 5 decimal precision', () => {
    expect(Tick.toPrice(1)).toBe('1.00001')
    expect(Tick.toPrice(-1)).toBe('0.99999')
    expect(Tick.toPrice(1234)).toBe('1.01234')
  })

  test('throws error when tick is below minimum', () => {
    expect(() => Tick.toPrice(-2001)).toThrow(Tick.TickOutOfBoundsError)
    expect(() => Tick.toPrice(-2001)).toThrow('Tick -2001 is out of bounds.')
    expect(() => Tick.toPrice(-3000)).toThrow(Tick.TickOutOfBoundsError)
  })

  test('throws error when tick is above maximum', () => {
    expect(() => Tick.toPrice(2001)).toThrow(Tick.TickOutOfBoundsError)
    expect(() => Tick.toPrice(2001)).toThrow('Tick 2001 is out of bounds.')
    expect(() => Tick.toPrice(3000)).toThrow(Tick.TickOutOfBoundsError)
  })

  test('handles edge cases near bounds', () => {
    expect(() => Tick.toPrice(-2000)).not.toThrow()
    expect(() => Tick.toPrice(2000)).not.toThrow()
  })
})

describe('fromPrice', () => {
  test('converts price 1.0 to tick 0', () => {
    expect(Tick.fromPrice('1.0')).toBe(0)
    expect(Tick.fromPrice('1.00000')).toBe(0)
  })

  test('converts prices above 1.0 correctly', () => {
    expect(Tick.fromPrice('1.001')).toBe(100)
    expect(Tick.fromPrice('1.01')).toBe(1000)
    expect(Tick.fromPrice('1.02')).toBe(2000)
  })

  test('converts prices below 1.0 correctly', () => {
    expect(Tick.fromPrice('0.999')).toBe(-100)
    expect(Tick.fromPrice('0.99')).toBe(-1000)
    expect(Tick.fromPrice('0.98')).toBe(-2000)
  })

  test('handles boundary values', () => {
    expect(Tick.fromPrice('0.98')).toBe(Tick.minTick)
    expect(Tick.fromPrice('1.02')).toBe(Tick.maxTick)
  })

  test('handles different decimal precisions', () => {
    expect(Tick.fromPrice('1.00001')).toBe(1)
    expect(Tick.fromPrice('1.0001')).toBe(10)
    expect(Tick.fromPrice('1.001')).toBe(100)
    expect(Tick.fromPrice('0.99999')).toBe(-1)
  })

  test('truncates beyond 5 decimal places', () => {
    // Should truncate, not round, extra decimals
    expect(Tick.fromPrice('1.000019')).toBe(1) // Takes first 5: 1.00001
    expect(Tick.fromPrice('1.000015')).toBe(1) // Takes first 5: 1.00001
  })

  test('validates string format', () => {
    expect(() => Tick.fromPrice('abc')).toThrow(Tick.InvalidPriceFormatError)
    expect(() => Tick.fromPrice('abc')).toThrow('Invalid price format')
    expect(() => Tick.fromPrice('1.2.3')).toThrow(Tick.InvalidPriceFormatError)
    expect(() => Tick.fromPrice('')).toThrow(Tick.InvalidPriceFormatError)
  })

  test('throws error when price results in tick below minimum', () => {
    expect(() => Tick.fromPrice('0.979')).toThrow(Tick.PriceOutOfBoundsError)
    expect(() => Tick.fromPrice('0.979')).toThrow(
      'Price "0.979" results in tick -2100 which is out of bounds.',
    )
    expect(() => Tick.fromPrice('0.5')).toThrow(Tick.PriceOutOfBoundsError)
  })

  test('throws error when price results in tick above maximum', () => {
    expect(() => Tick.fromPrice('1.021')).toThrow(Tick.PriceOutOfBoundsError)
    expect(() => Tick.fromPrice('1.021')).toThrow(
      'Price "1.021" results in tick 2100 which is out of bounds.',
    )
    expect(() => Tick.fromPrice('1.5')).toThrow(Tick.PriceOutOfBoundsError)
  })

  test('handles edge cases near bounds', () => {
    expect(() => Tick.fromPrice('0.98')).not.toThrow()
    expect(() => Tick.fromPrice('1.02')).not.toThrow()
  })

  test('handles whitespace', () => {
    expect(Tick.fromPrice('  1.0  ')).toBe(0)
    expect(Tick.fromPrice(' 1.001 ')).toBe(100)
  })
})

describe('round-trip conversions', () => {
  test('tick -> price -> tick preserves tick values exactly', () => {
    const ticks = [-2000, -1000, -100, -1, 0, 1, 100, 1000, 2000]
    for (const tick of ticks) {
      const price = Tick.toPrice(tick)
      const roundTripTick = Tick.fromPrice(price)
      expect(roundTripTick).toBe(tick)
    }
  })

  test('price -> tick -> price preserves price strings exactly', () => {
    const prices = ['0.98', '0.99', '1', '1.01', '1.02']
    for (const price of prices) {
      const tick = Tick.fromPrice(price)
      const roundTripPrice = Tick.toPrice(tick)
      expect(roundTripPrice).toBe(price)
    }
  })

  test('handles arbitrary precision in input strings', () => {
    // Shorter decimal strings should round-trip correctly
    expect(Tick.toPrice(Tick.fromPrice('1.0'))).toBe('1')
    expect(Tick.toPrice(Tick.fromPrice('0.999'))).toBe('0.999')

    // Longer decimal strings get truncated to 5 decimals
    expect(Tick.toPrice(Tick.fromPrice('1.000019999'))).toBe('1.00001')
  })
})

describe('error handling', () => {
  test('InvalidPriceFormatError is catchable and has correct properties', () => {
    try {
      Tick.fromPrice('invalid')
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(Tick.InvalidPriceFormatError)
      expect(error).toHaveProperty('name', 'Tick.InvalidPriceFormatError')
      expect((error as Error).message).toContain('Invalid price format')
      expect((error as Error).message).toContain('invalid')
      expect((error as Error).message).toContain(
        'Price must be a decimal number string',
      )
    }
  })

  test('TickOutOfBoundsError is catchable and has correct properties', () => {
    try {
      Tick.toPrice(-2001)
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(Tick.TickOutOfBoundsError)
      expect(error).toHaveProperty('name', 'Tick.TickOutOfBoundsError')
      // BaseError appends metaMessages to the message
      expect((error as Error).message).toContain('Tick -2001 is out of bounds.')
      expect((error as Error).message).toContain(
        'Tick must be between -2000 and 2000.',
      )
    }
  })

  test('PriceOutOfBoundsError is catchable and has correct properties', () => {
    try {
      Tick.fromPrice('0.979')
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(Tick.PriceOutOfBoundsError)
      expect(error).toHaveProperty('name', 'Tick.PriceOutOfBoundsError')
      expect((error as Error).message).toContain(
        'Price "0.979" results in tick -2100 which is out of bounds.',
      )
      expect((error as Error).message).toContain(
        'Tick must be between -2000 and 2000.',
      )
    }
  })

  test('can distinguish between error types', () => {
    try {
      Tick.fromPrice('invalid')
    } catch (error) {
      if (error instanceof Tick.InvalidPriceFormatError) {
        expect(true).toBe(true) // Successfully caught as InvalidPriceFormatError
      } else {
        expect.fail('Should be InvalidPriceFormatError')
      }
    }

    try {
      Tick.toPrice(-2001)
    } catch (error) {
      if (error instanceof Tick.TickOutOfBoundsError) {
        expect(true).toBe(true) // Successfully caught as TickOutOfBoundsError
      } else {
        expect.fail('Should be TickOutOfBoundsError')
      }
    }

    try {
      Tick.fromPrice('0.979')
    } catch (error) {
      if (error instanceof Tick.PriceOutOfBoundsError) {
        expect(true).toBe(true) // Successfully caught as PriceOutOfBoundsError
      } else {
        expect.fail('Should be PriceOutOfBoundsError')
      }
    }
  })
})

describe('precision and edge cases', () => {
  test('handles very small price increments', () => {
    // 0.1 bps = 0.001% = 0.00001 in decimal
    expect(Tick.fromPrice('1.00001')).toBe(1)
    expect(Tick.fromPrice('1.00002')).toBe(2)
  })

  test('price scale maintains exact 5 decimal precision', () => {
    // The price scale is 100,000 which gives us exactly 5 decimal places
    const price0 = Tick.toPrice(0)
    const price1 = Tick.toPrice(1)
    expect(price0).toBe('1')
    expect(price1).toBe('1.00001')

    // Verify exact difference
    const diff = Number(price1) - Number(price0)
    expect(diff).toBeCloseTo(0.00001, 10)
  })

  test('symmetric around 1.0', () => {
    // +100 ticks should have same magnitude as -100 ticks from 1.0
    const priceUp = Tick.toPrice(100)
    const priceDown = Tick.toPrice(-100)
    expect(priceUp).toBe('1.001')
    expect(priceDown).toBe('0.999')

    const upDiff = Number(priceUp) - 1.0
    const downDiff = 1.0 - Number(priceDown)
    expect(upDiff).toBeCloseTo(downDiff, 10)
  })

  test('validates 2% range', () => {
    // At minimum tick, price should be exactly 2% below 1.0
    const minPrice = Tick.toPrice(Tick.minTick)
    expect(minPrice).toBe('0.98')
    expect((1.0 - Number(minPrice)) / 1.0).toBeCloseTo(0.02, 10)

    // At maximum tick, price should be exactly 2% above 1.0
    const maxPrice = Tick.toPrice(Tick.maxTick)
    expect(maxPrice).toBe('1.02')
    expect((Number(maxPrice) - 1.0) / 1.0).toBeCloseTo(0.02, 10)
  })

  test('no floating point precision errors', () => {
    // String-based parsing should eliminate float precision issues
    expect(Tick.fromPrice('0.99999')).toBe(-1)
    expect(Tick.fromPrice('1.00001')).toBe(1)

    // These would potentially fail with float arithmetic
    expect(Tick.fromPrice('0.98001')).toBe(-1999)
    expect(Tick.fromPrice('1.01999')).toBe(1999)
  })
})
