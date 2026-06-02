import { expect, test } from 'vp/test'
import * as z_Number from '../Number.js'
import * as z from 'zod/mini'

test('Number decodes and encodes hex quantities', () => {
  expect(z.decode(z_Number.Number, '0x2a')).toMatchInlineSnapshot(`42`)
  expect(z.encode(z_Number.Number, 42)).toMatchInlineSnapshot(`"0x2a"`)
  expect(
    z.safeEncode(z_Number.Number, Number.MAX_SAFE_INTEGER + 1).success,
  ).toBe(false)
})
