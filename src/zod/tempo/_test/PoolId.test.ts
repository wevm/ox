import { describe, expect, test } from 'vp/test'
import * as z_PoolId from '../PoolId.js'
import * as z from 'zod/mini'

describe('PoolId', () => {
  test('accepts 32-byte hex', () => {
    const id = `0x${'11'.repeat(32)}` as const
    expect(z.safeDecode(z_PoolId.PoolId, id).success).toBe(true)
  })

  test('rejects wrong-size hex', () => {
    expect(
      z.safeDecode(z_PoolId.PoolId, `0x${'11'.repeat(20)}`).success,
    ).toMatchInlineSnapshot(`false`)
  })
})
