import { expect, test } from 'vitest'
import * as exports from './RpcTransport.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "HttpError",
      "MalformedResponseError",
      "fromHttp",
    ]
  `)
})
