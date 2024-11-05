import { RpcSchema } from 'ox'
import { expect, test } from 'vitest'

test('exports', () => {
  expect(Object.keys(RpcSchema)).toMatchInlineSnapshot(`
    [
      "from",
    ]
  `)
})
