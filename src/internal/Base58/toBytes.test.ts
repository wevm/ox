import { Base58 } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Base58.toBytes('2NEpo7TZRRrLZSi2U')).toMatchInlineSnapshot(`
    Uint8Array [
      72,
      101,
      108,
      108,
      111,
      32,
      87,
      111,
      114,
      108,
      100,
      33,
    ]
  `)
})
