import { Bytes } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(Bytes.fromArray([])).toMatchInlineSnapshot('Uint8Array []')
  expect(Bytes.fromArray([1, 2, 3, 4])).toMatchInlineSnapshot(`
      Uint8Array [
        1,
        2,
        3,
        4,
      ]
    `)
})
