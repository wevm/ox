import { Authorization } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const tuple = [
    '0x1',
    '0x0000000000000000000000000000000000000000',
    '0x3',
  ] as const satisfies Authorization.Tuple
  const authorization = Authorization.fromTuple(tuple)
  expect(authorization).toMatchInlineSnapshot(`
    {
      "address": "0x0000000000000000000000000000000000000000",
      "chainId": 1,
      "nonce": 3n,
    }
  `)
})

test('behavior: signature', () => {
  const tuple = [
    '0x1',
    '0x0000000000000000000000000000000000000000',
    '0x3',
    '0x',
    '0x01',
    '0x02',
  ] as const satisfies Authorization.Tuple
  const authorization = Authorization.fromTuple(tuple)
  expect(authorization).toMatchInlineSnapshot(`
    {
      "address": "0x0000000000000000000000000000000000000000",
      "chainId": 1,
      "nonce": 3n,
      "r": 1n,
      "s": 2n,
      "yParity": 0,
    }
  `)
})
