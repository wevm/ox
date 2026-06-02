import { describe, expect, test } from 'vp/test'
import * as z_TokenRole from '../TokenRole.js'
import * as z from 'zod/mini'

describe('TokenRole', () => {
  test('accepts known roles', () => {
    expect(z.safeDecode(z_TokenRole.TokenRole, 'issuer').success).toBe(true)
    expect(z.safeDecode(z_TokenRole.TokenRole, 'defaultAdmin').success).toBe(
      true,
    )
  })

  test('rejects unknown roles', () => {
    expect(
      z.safeDecode(z_TokenRole.TokenRole, 'unknown' as never).success,
    ).toMatchInlineSnapshot(`false`)
  })
})
