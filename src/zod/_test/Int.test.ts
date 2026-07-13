import { describe, expect, test } from 'vp/test'
import * as z_Int from '../Int.js'
import * as z from 'zod/mini'

const smallIntegerSizes = [8, 16, 24, 32, 40, 48] as const

const largeIntegerSizes = [
  56, 64, 72, 80, 88, 96, 104, 112, 120, 128, 136, 144, 152, 160, 168, 176, 184,
  192, 200, 208, 216, 224, 232, 240, 248, 256,
] as const

describe('Int', () => {
  test('decodes and encodes signed integers', () => {
    expect(z.decode(z_Int.Int, '0x2a')).toMatchInlineSnapshot(`42n`)
    expect(z.encode(z_Int.Int, 42n)).toMatchInlineSnapshot(`"0x2a"`)

    for (const bits of smallIntegerSizes) {
      const int = z_Int[`Int${bits}` as keyof typeof z_Int] as typeof z_Int.Int8
      const negativeOne = `0x${'ff'.repeat(bits / 8)}` as `0x${string}`

      expect(z.decode(int, negativeOne)).toBe(-1)
      expect(z.encode(int, -1)).toBe(negativeOne)
    }

    for (const bits of largeIntegerSizes) {
      const int = z_Int[
        `Int${bits}` as keyof typeof z_Int
      ] as typeof z_Int.Int56
      const negativeOne = `0x${'ff'.repeat(bits / 8)}` as `0x${string}`

      expect(z.decode(int, negativeOne)).toBe(-1n)
      expect(z.encode(int, -1n)).toBe(negativeOne)
    }
  })

  test('rejects invalid signed integer outputs', () => {
    expect(z.safeEncode(z_Int.Int8, 2 ** 7).success).toBe(false)
    expect(z.safeEncode(z_Int.Int32, 2 ** 31).success).toBe(false)
    expect(z.safeEncode(z_Int.Int48, 2 ** 47).success).toBe(false)
    expect(z.safeEncode(z_Int.Int56, 1n << 55n).success).toBe(false)
    expect(z.safeEncode(z_Int.Int64, 1n << 63n).success).toBe(false)
  })
})
