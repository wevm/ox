import { describe, expect, test } from 'vp/test'
import * as z_Uint from '../Uint.js'
import * as z from 'zod/mini'

const smallIntegerSizes = [8, 16, 24, 32, 40, 48] as const

const largeIntegerSizes = [
  56, 64, 72, 80, 88, 96, 104, 112, 120, 128, 136, 144, 152, 160, 168, 176, 184,
  192, 200, 208, 216, 224, 232, 240, 248, 256,
] as const

describe('Uint', () => {
  test('decodes and encodes unsigned integers', () => {
    expect(z.decode(z_Uint.Uint, '0x2a')).toMatchInlineSnapshot(`42n`)
    expect(z.encode(z_Uint.Uint, 42n)).toMatchInlineSnapshot(`"0x2a"`)

    for (const bits of smallIntegerSizes) {
      const uint = z_Uint[
        `Uint${bits}` as keyof typeof z_Uint
      ] as typeof z_Uint.Uint8

      expect(z.decode(uint, '0x2a')).toBe(42)
      expect(z.encode(uint, 42)).toBe('0x2a')
    }

    for (const bits of largeIntegerSizes) {
      const uint = z_Uint[
        `Uint${bits}` as keyof typeof z_Uint
      ] as typeof z_Uint.Uint56

      expect(z.decode(uint, '0x2a')).toBe(42n)
      expect(z.encode(uint, 42n)).toBe('0x2a')
    }
  })

  test('rejects invalid unsigned integer inputs and outputs', () => {
    expect(z.safeDecode(z_Uint.Uint8, '0x0100').success).toBe(false)
    expect(z.safeEncode(z_Uint.Uint, -1n).success).toBe(false)
    expect(z.safeEncode(z_Uint.Uint8, -1).success).toBe(false)
    expect(z.safeEncode(z_Uint.Uint32, 2 ** 32).success).toBe(false)
    expect(z.safeEncode(z_Uint.Uint48, 2 ** 48).success).toBe(false)
    expect(z.safeEncode(z_Uint.Uint56, 1n << 56n).success).toBe(false)
    expect(z.safeEncode(z_Uint.Uint64, 1n << 64n).success).toBe(false)
  })
})

describe('UintToRpc', () => {
  test('accepts numberish encode inputs', () => {
    expect(z.encode(z_Uint.UintToRpc, 42n)).toBe('0x2a')
    expect(z.encode(z_Uint.UintToRpc, 42)).toBe('0x2a')
    expect(z.encode(z_Uint.UintToRpc, '0x2a')).toBe('0x2a')
  })
})

describe('Uint8ToRpc', () => {
  test('accepts numberish encode inputs', () => {
    expect(z.encode(z_Uint.Uint8ToRpc, 42)).toBe('0x2a')
    expect(z.encode(z_Uint.Uint8ToRpc, '0x2a')).toBe('0x2a')
  })
})
