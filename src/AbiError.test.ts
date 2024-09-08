import { expect, test } from 'vitest'
import * as exports from './AbiError.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "panicReasons",
      "solidityError",
      "solidityErrorSelector",
      "solidityPanic",
      "solidityPanicSelector",
      "decode",
      "encode",
      "format",
      "from",
      "fromAbi",
      "getSelector",
    ]
  `)
})
