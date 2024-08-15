import { expect, test } from 'vitest'
import * as exports from './Bytes.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "concat",
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
      "booleanToBytes",
      "fromBoolean",
      "hexToBytes",
      "fromHex",
      "numberToBytes",
      "fromBigInt",
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
