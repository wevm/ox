import { expect, test } from 'vp/test'
import * as z_BigInt from '../BigInt.js'
import * as z from 'zod/mini'

test('BigInt decodes and encodes hex quantities', () => {
  expect(z.decode(z_BigInt.BigInt, '0x2a')).toMatchInlineSnapshot(`42n`)
  expect(z.encode(z_BigInt.BigInt, 42n)).toMatchInlineSnapshot(`"0x2a"`)
  expect(z.safeDecode(z_BigInt.BigInt, '0x').success).toBe(false)
})
