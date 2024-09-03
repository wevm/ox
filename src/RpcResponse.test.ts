import { expect, test } from 'vitest'
import * as exports from './RpcResponse.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "parse",
      "Error",
      "InternalError",
      "InvalidInputError",
      "InvalidParamsError",
      "InvalidRequestError",
      "LimitExceededError",
      "MethodNotFoundError",
      "MethodNotSupportedError",
      "ParseError",
      "ResourceNotFoundError",
      "ResourceUnavailableError",
      "TransactionRejectedError",
      "VersionNotSupportedError",
    ]
  `)
})
