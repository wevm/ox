import { Signature } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(
    Signature.toRpc({
      r: 1n,
      s: 2n,
      yParity: 0,
    }),
  ).toMatchInlineSnapshot(`
    {
      "r": "0x0000000000000000000000000000000000000000000000000000000000000001",
      "s": "0x0000000000000000000000000000000000000000000000000000000000000002",
      "yParity": "0x0",
    }
  `)
})
