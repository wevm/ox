import { expect, test } from 'vitest'
import * as exports from './Hex.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "isHex",
      "isEqual",
      "padLeft",
      "padRight",
      "slice",
      "size",
      "trimLeft",
      "trimRight",
      "fromHex",
      "to",
      "hexToBigInt",
      "toBigInt",
      "HexToBoolean",
      "toBoolean",
      "hexToNumber",
      "toNumber",
      "hexToString",
      "toString",
      "hexToBytes",
      "toBytes",
      "boolToHex",
      "fromBool",
      "bytesToHex",
      "fromBytes",
      "numberToHex",
      "fromNumber",
      "stringToHex",
      "fromString",
      "toHex",
      "from",
    ]
  `)
})
