import { describe, expect, test } from 'vp/test'
import * as z_Hex from '../Hex.js'
import * as z from 'zod/mini'

const hexSizes = [
  4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120, 128,
  136, 144, 152, 160, 168, 176, 184, 192, 200, 208, 216, 224, 232, 240, 248,
  256,
] as const

describe('Hex', () => {
  test('decodes hex scalars', () => {
    expect(z.decode(z_Hex.Hex, '0xdeadbeef')).toMatchInlineSnapshot(
      `"0xdeadbeef"`,
    )
  })

  test('validates sized hex schemas', () => {
    for (const size of hexSizes) {
      const schema = z_Hex[
        `Hex${size}` as keyof typeof z_Hex
      ] as typeof z_Hex.Hex
      const value = `0x${'aa'.repeat(size)}` as `0x${string}`

      expect(z.decode(schema, value)).toBe(value)
    }

    const result = z.safeDecode(z_Hex.Hex8, `0x${'aa'.repeat(32)}`)
    if (result.success) throw new Error('expected decode to fail')
    expect(result.error.issues).toMatchInlineSnapshot(`
      [
        {
          "code": "custom",
          "message": "expected 8 bytes",
          "path": [],
        },
      ]
    `)

    expect(z.safeDecode(z_Hex.Hex, '0xz').success).toBe(false)
  })
})
