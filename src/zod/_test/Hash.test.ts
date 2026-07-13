import { expect, test } from 'vp/test'
import * as z_Hash from '../Hash.js'
import * as z from 'zod/mini'

test('Hash validates 32-byte hex strings', () => {
  expect(z.decode(z_Hash.Hash, `0x${'aa'.repeat(32)}`)).toMatchInlineSnapshot(
    `"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"`,
  )

  expect(z.safeDecode(z_Hash.Hash, `0x${'aa'.repeat(31)}`).success).toBe(false)
})
