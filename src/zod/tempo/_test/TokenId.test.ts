import { describe, expect, test } from 'vp/test'
import * as z_TokenId from '../TokenId.js'
import * as z from 'zod/mini'

describe('TokenId', () => {
  test('accepts non-negative bigints', () => {
    expect(z.safeDecode(z_TokenId.TokenId, 1n).success).toBe(true)
    expect(z.safeDecode(z_TokenId.TokenId, -1n).success).toMatchInlineSnapshot(
      `false`,
    )
  })

  test('decodes and encodes token addresses', () => {
    expect(
      z.decode(z_TokenId.address, '0x20c0000000000000000000000000000000000001'),
    ).toMatchInlineSnapshot(`1n`)
    expect(z.encode(z_TokenId.address, 1n)).toMatchInlineSnapshot(
      `"0x20c0000000000000000000000000000000000001"`,
    )
  })
})
