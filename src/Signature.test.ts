import { expect, test } from 'vitest'
import * as exports from './Signature.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "InvalidRError",
      "InvalidSError",
      "InvalidSerializedSizeError",
      "InvalidVError",
      "InvalidYParityError",
      "MissingPropertiesError",
      "assert",
      "deserialize",
      "extract",
      "fromRpc",
      "fromTuple",
      "serialize",
      "from",
      "toRpc",
      "toTuple",
    ]
  `)
})
