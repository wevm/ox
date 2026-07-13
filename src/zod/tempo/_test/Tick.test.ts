import { describe, expect, test } from 'vp/test'
import * as z_Tick from '../Tick.js'
import * as z from 'zod/mini'

describe('Tick', () => {
  test('accepts integers within bounds', () => {
    expect(z.safeDecode(z_Tick.Tick, 0).success).toBe(true)
    expect(z.safeDecode(z_Tick.Tick, 2000).success).toBe(true)
    expect(z.safeDecode(z_Tick.Tick, -2000).success).toBe(true)
  })

  test('rejects out-of-bounds or non-integer ticks', () => {
    expect(z.safeDecode(z_Tick.Tick, 2001).success).toMatchInlineSnapshot(
      `false`,
    )
    expect(z.safeDecode(z_Tick.Tick, 1.5).success).toMatchInlineSnapshot(
      `false`,
    )
  })
})
