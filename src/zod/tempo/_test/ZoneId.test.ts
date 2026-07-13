import { describe, expect, test } from 'vp/test'
import * as z_ZoneId from '../ZoneId.js'
import * as z from 'zod/mini'

describe('ZoneId', () => {
  test('accepts non-negative integers', () => {
    expect(z.safeDecode(z_ZoneId.ZoneId, 6).success).toBe(true)
    expect(z.safeDecode(z_ZoneId.ZoneId, -1).success).toMatchInlineSnapshot(
      `false`,
    )
  })

  test('decodes and encodes chain ids', () => {
    expect(z.decode(z_ZoneId.chainId, 4_217_000_006)).toMatchInlineSnapshot(`6`)
    expect(z.encode(z_ZoneId.chainId, 6)).toMatchInlineSnapshot(`4217000006`)
  })
})
