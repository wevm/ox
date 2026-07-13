import { RpcSchema } from 'ox'
import { expect, test } from 'vp/test'

test('exports', () => {
  expect(Object.keys(RpcSchema)).toMatchInlineSnapshot(`
    [
      "from",
    ]
  `)
})
