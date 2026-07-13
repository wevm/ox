import { expect, test } from 'vp/test'
import * as z_Address from '../Address.js'
import * as z from 'zod/mini'

test('Address validates address strings', () => {
  expect(
    z.decode(z_Address.Address, '0x0000000000000000000000000000000000000000'),
  ).toMatchInlineSnapshot(`"0x0000000000000000000000000000000000000000"`)

  expect(z.safeDecode(z_Address.Address, '0xdeadbeef').success).toBe(false)
  expect(
    z.safeDecode(
      z_Address.Address,
      '0xzzzz000000000000000000000000000000000000',
    ).success,
  ).toBe(false)
})
