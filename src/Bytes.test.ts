import { expect, test } from 'vitest'
import * as exports from './Bytes.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "isBytes",
      "isEqual",
      "padLeft",
      "padRight",
      "slice",
      "size",
      "trimLeft",
      "trimRight",
      "randomBytes",
      "random",
      "fromBytes",
      "to",
      "bytesToBigInt",
      "toBigInt",
      "bytesToBoolean",
      "toBoolean",
      "bytesToNumber",
      "toNumber",
      "bytesToString",
      "toString",
      "boolToBytes",
      "fromBool",
      "hexToBytes",
      "fromHex",
      "numberToBytes",
      "fromNumber",
      "stringToBytes",
      "fromString",
      "toBytes",
      "from",
      "bytesToHex",
      "toHex",
    ]
  `)
})
