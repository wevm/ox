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
      "fromCompact",
      "fromRpc",
      "fromTuple",
      "serialize",
      "toCompact",
      "from",
      "toRpc",
      "toTuple",
    ]
  `)
})
