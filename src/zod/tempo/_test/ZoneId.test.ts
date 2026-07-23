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
    expect(z.decode(z_ZoneId.chainId, 421_700_001)).toMatchInlineSnapshot(`1`)
    expect(z.encode(z_ZoneId.chainId, 1)).toMatchInlineSnapshot(`421700001`)
  })
})
